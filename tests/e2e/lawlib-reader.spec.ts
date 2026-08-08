import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * LawLib reader — e2e coverage for the COMPACT digest view of
 * /lawlib/national-education-act-2542 (digest exists → COMPACT is the default
 * view). Covers the senior NIT gap: the 375px bottom-sheet flows (dock +
 * tooltip), digest-ref tooltips (hover / keyboard / focus), the ถูกยกเลิก
 * repealed badge, prose range splitting, the cross-law range guard, and the
 * dock's direction-aware expansion. jsdom cannot matchMedia — these need a
 * real browser, hence Playwright.
 *
 * Data anchors (verified against content/lawlib/digests/national-education-act-2542.md
 * and src/data/lawlib/laws/national-education-act-2542.json):
 *  - "มาตรา 75 - มาตรา 78" merged card (group บทเฉพาะกาล — COLLAPSED by default)
 *  - "มาตรา 34 - มาตรา 35" merged card (group หมวดที่ 5 — collapsed; มาตรา 34
 *    has 1 repealedParagraphs → badge in the tooltip)
 *  - prose "ตามมาตรา 75–76" inside the 75-78 card → 2 separate range triggers
 *  - "พ.ร.บ.โรงเรียนเอกชน 2550 มาตรา 30–31" inside the มาตรา 44 card → the
 *    cross-law guard keeps it plain text
 *  - "[[มาตรา 18]]" same-law ref inside the มาตรา 44 card → T11 digest-snippet
 *    tooltip (DigestRefBody with ดูฉบับเต็ม)
 *
 * Flakiness guards (found in the first runs):
 *  - The cookie banner (fixed bottom, z-40) intercepts clicks at 375px — the
 *    consent is pre-set so the banner never mounts.
 *  - The tooltip closes on `scrollend`; `html { scroll-behavior: smooth }`
 *    makes scrolls settle asynchronously — scrollTo() waits the scroll out
 *    BEFORE any hover/tap that opens a tooltip.
 *  - A stationary mouse + a scroll passing content under it re-anchors the
 *    tooltip to whichever trigger crosses the cursor (pointerenter) and then
 *    grace-closes it — the keyboard test parks the mouse off-content first.
 */

const LAW_URL = '/lawlib/national-education-act-2542';
const CONTENT = '#lawlib-reader-content';
const DOCK_PANEL = '#lawlib-dock-panel';

/** Tooltip triggers inside a card that are neither merged-card member buttons
 *  nor glossary terms — i.e. prose-range spans and same-law digest refs. */
const bodyTriggers = (cardKey: string) =>
  `[data-lawlib-card="${cardKey}"] [data-lawlib-trigger]:not([data-lawlib-member]):not([data-lawlib-term])`;

async function openReader(
  page: Page,
  viewport: { width: number; height: number } = { width: 1280, height: 800 },
) {
  // The cookie consent banner is a fixed bottom bar that would cover the dock
  // icon / intercept taps — pre-consent so it never mounts.
  await page.addInitScript(() => {
    localStorage.setItem('boss478-analytics-consent', 'accepted');
  });
  await page.setViewportSize(viewport);
  await page.goto(LAW_URL);
  // The reader mounts client-side (ssr:false shell) — the dock panel opening
  // by default is the mount-complete signal.
  await expect(page.locator(DOCK_PANEL)).toBeVisible();
  await page.waitForLoadState('networkidle');
}

/** Scroll a target into view and wait out any scroll it triggers — an open
 *  tooltip dies on `scrollend`, so the scroll must settle BEFORE any hover/
 *  tap that would open one. No-op when the element is already in view. */
async function scrollTo(page: Page, loc: Locator) {
  const before = await page.evaluate(() => window.scrollY);
  await loc.scrollIntoViewIfNeeded();
  const after = await page.evaluate(() => window.scrollY);
  if (before !== after) await waitForScrollSettle(page);
}

/** Resolve on the next scrollend, or after 800ms when nothing is pending
 *  (longer than a smooth scroll; instant scrolls end within a frame). */
async function waitForScrollSettle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.removeEventListener('scrollend', finish);
          resolve();
        };
        window.addEventListener('scrollend', finish);
        window.setTimeout(finish, 800);
      }),
  );
}

/** Wait out CSS entry animations (the tooltip/dock panels animate in over
 *  150ms — geometry assertions must not measure mid-animation). */
async function waitForAnimationsSettled(loc: Locator) {
  await expect(loc).toBeVisible();
  await loc.evaluate((el) =>
    Promise.all(el.getAnimations().map((a) => a.finished)).then(() => undefined),
  );
}

/**
 * Expand a collapsed chapter group via its BODY header. The digest TOC lists
 * the same group labels, so the header is pinned by its "(N มาตรา)" count
 * suffix (the TOC entries never carry one).
 */
async function expandGroup(page: Page, label: string) {
  const header = page
    .locator(CONTENT)
    .getByRole('button', { name: new RegExp(`${label}\\s*\\(\\d+\\s*มาตรา\\)`) });
  await expect(header).toHaveCount(1);
  await header.click();
  await expect(header).toHaveAttribute('aria-expanded', 'true');
}

test.describe('LawLib Reader — national-education-act-2542', () => {
  test('reader defaults to COMPACT view when a digest exists', async ({ page }) => {
    await openReader(page);

    await expect(page.locator('h2', { hasText: 'ฉบับย่อ' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^เวอร์ชันย่อ$/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('radio', { name: /^ฉบับเต็ม$/ })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  // hasTouch enables real tap() (the touch open path is part of this flow).
  test.describe('mobile 375px', () => {
    test.use({ hasTouch: true });

    test('dock bottom sheet opens on load, closes via Esc/X; tooltip opens as a bottom sheet', async ({
      page,
    }) => {
      await openReader(page, { width: 375, height: 667 });

      // L1 open by default as a full-width bottom sheet.
      const dock = page.locator(DOCK_PANEL);
      await waitForAnimationsSettled(dock);
      await expect(dock).toHaveClass(/rounded-t-2xl/);
      let box = (await dock.boundingBox())!;
      expect(box.x).toBeCloseTo(0, 0);
      expect(box.width).toBeCloseTo(375, 0);
      expect(box.y + box.height).toBeCloseTo(667, 0);

      // Esc collapses the dock sheet.
      await page.keyboard.press('Escape');
      await expect(dock).toBeHidden();

      // The collapsed icon re-opens it…
      await page.getByRole('button', { name: /^เครื่องมืออ่าน$/ }).click();
      await expect(dock).toBeVisible();

      // …and the X button closes it again (kept collapsed so the tap below
      // lands on the trigger, not on the sheet).
      await page.getByRole('button', { name: /^ปิดแถบเครื่องมือ$/ }).click();
      await expect(dock).toBeHidden();

      // Tooltip trigger tap → bottom-sheet variant (matchMedia <640px).
      await expandGroup(page, 'บทเฉพาะกาล');
      const trigger = page.locator(bodyTriggers('75')).first();
      await scrollTo(page, trigger);
      await trigger.tap();

      const tooltip = page.locator('.lawlib-tooltip');
      await waitForAnimationsSettled(tooltip);
      await expect(tooltip).toHaveClass(/rounded-t-2xl/);
      box = (await tooltip.boundingBox())!;
      expect(box.x).toBeCloseTo(0, 0);
      expect(box.width).toBeCloseTo(375, 0);
      expect(box.y + box.height).toBeCloseTo(667, 0);
      await expect(page.getByRole('dialog', { name: /^มาตรา 75$/ })).toBeVisible();
      await expect(tooltip).toContainText('ซึ่งเป็นองค์การมหาชนเฉพาะกิจที่จัดตั้งขึ้น');

      // Esc closes the tooltip sheet.
      await page.keyboard.press('Escape');
      await expect(tooltip).toBeHidden();

      // Re-open via tap, close via the sheet's X button.
      await trigger.tap();
      await expect(tooltip).toBeVisible();
      await tooltip.getByRole('button', { name: /^ปิด$/ }).click();
      await expect(tooltip).toBeHidden();
    });
  });

  test('digest-ref hover: merged-card member (มาตรา 75) shows the full article text', async ({
    page,
  }) => {
    await openReader(page);
    await expandGroup(page, 'บทเฉพาะกาล');

    const member75 = page.locator('[data-lawlib-card="75"] [data-lawlib-member="75"]');
    await scrollTo(page, member75);
    await member75.hover({ force: true });

    // Member path renders the FULL article (ArticleBody), not the digest
    // snippet — "ซึ่งเป็นองค์การมหาชนเฉพาะกิจที่จัดตั้งขึ้น" exists only in the
    // full text, not in the card summary.
    const tooltip = page.getByRole('dialog', { name: /^มาตรา 75$/ });
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('ซึ่งเป็นองค์การมหาชนเฉพาะกิจที่จัดตั้งขึ้น');
  });

  test('digest-ref keyboard: Tab to trigger, Enter opens with focus inside, Esc closes + restores', async ({
    page,
  }) => {
    await openReader(page);
    await expandGroup(page, 'บทเฉพาะกาล');

    // Park the mouse OFF the content: the Tab walk scrolls the page, and a
    // stationary mouse would otherwise cross member buttons — each crossing
    // re-anchors the tooltip (pointerenter) and grace-closes it (pointerleave).
    await page.mouse.move(10, 10);

    // The group-header click left focus on the header; Tab-walk forward to
    // the member-75 button (cards มาตรา 70–74 with their member buttons and
    // glossary triggers sit between them — bounded walk, stop on arrival).
    const member75 = page.locator('[data-lawlib-card="75"] [data-lawlib-member="75"]');
    const header = page
      .locator(CONTENT)
      .getByRole('button', { name: /บทเฉพาะกาล\s*\(\d+\s*มาตรา\)/ });
    await expect(header).toBeFocused();

    let reached = false;
    for (let i = 0; i < 80 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(
        () => document.activeElement?.getAttribute('data-lawlib-member') === '75',
      );
    }
    expect(reached, 'Tab traversal reached the member-75 trigger').toBe(true);
    await expect(member75).toBeFocused();

    // Enter opens the tooltip in keyboard mode — focus moves INSIDE it.
    await page.keyboard.press('Enter');
    const tooltip = page.locator('.lawlib-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toBeFocused();
    await expect(page.getByRole('dialog', { name: /^มาตรา 75$/ })).toBeVisible();

    // Tab cycles the tooltip's actions (first stop: the copy button).
    await page.keyboard.press('Tab');
    await expect(tooltip.getByRole('button', { name: /^คัดลอก$/ })).toBeFocused();

    // Esc closes the tooltip and restores focus to the trigger.
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await expect(member75).toBeFocused();
  });

  test('repealed article member (มาตรา 34) shows the ถูกยกเลิก badge', async ({ page }) => {
    await openReader(page);
    await expandGroup(page, 'หมวดที่ 5 การบริหารและการจัดการศึกษา');

    // Scroll BOTH members into view first — the scroll between the two hovers
    // must not fire a scrollend while the first tooltip is open.
    const member34 = page.locator('[data-lawlib-card="34"] [data-lawlib-member="34"]');
    const member35 = page.locator('[data-lawlib-card="34"] [data-lawlib-member="35"]');
    await scrollTo(page, member34);
    await scrollTo(page, member35);

    await member34.hover({ force: true });
    const tooltip34 = page.getByRole('dialog', { name: /^มาตรา 34$/ });
    await expect(tooltip34).toBeVisible();
    await expect(tooltip34.getByText('ถูกยกเลิก')).toBeVisible();

    // The tall tooltip cannot fit beside the trigger, so its position clamp
    // pushes it OVER the header row — the pointer ends up under the tooltip.
    // Esc would close it, but the browser then re-fires pointerenter on the
    // trigger underneath and the tooltip reopens. Move the mouse OFF the
    // content instead and let the 150ms grace close finish the job.
    await page.mouse.move(10, 10);
    await expect(tooltip34).toBeHidden();

    // Negative control: the merged partner มาตรา 35 is NOT repealed.
    await member35.hover({ force: true });
    const tooltip35 = page.getByRole('dialog', { name: /^มาตรา 35$/ });
    await expect(tooltip35).toBeVisible();
    await expect(tooltip35.getByText('ถูกยกเลิก')).toHaveCount(0);
  });

  test('prose range "ตามมาตรา 75–76" splits into two separate triggers', async ({ page }) => {
    await openReader(page);
    await expandGroup(page, 'บทเฉพาะกาล');

    // Only the 2 prose-range spans remain once member buttons and glossary
    // terms are excluded — the single "ตามมาตรา 77" (no dash) never triggers.
    const triggers = page.locator(bodyTriggers('75'));
    await expect(triggers).toHaveCount(2);
    await expect(triggers).toHaveText(['มาตรา 75', 'มาตรา 76']);
    for (const t of await triggers.all()) {
      await expect(t).toHaveAttribute('role', 'button');
      await expect(t).toHaveAttribute('tabindex', '0');
    }
  });

  test('cross-law range "พ.ร.บ.โรงเรียนเอกชน 2550 มาตรา 30–31" stays plain text', async ({
    page,
  }) => {
    await openReader(page);
    await expandGroup(page, 'หมวดที่ 5 การบริหารและการจัดการศึกษา');

    // The bold phrase renders as ONE plain span — the cross-law guard
    // (clause contains พ.ร.บ.) must keep it trigger-free.
    const phrase = page.locator('strong', { hasText: 'พ.ร.บ.โรงเรียนเอกชน 2550 มาตรา 30–31' });
    await expect(phrase).toHaveCount(1);
    await expect(phrase).toHaveText('พ.ร.บ.โรงเรียนเอกชน 2550 มาตรา 30–31');
    await expect(phrase.locator('[data-lawlib-trigger]')).toHaveCount(0);
  });

  test('digest-ref snippet: inline same-law ref shows the ฉบับย่อ snippet + ดูฉบับเต็ม', async ({
    page,
  }) => {
    await openReader(page);
    await expandGroup(page, 'หมวดที่ 5 การบริหารและการจัดการศึกษา');

    // "[[มาตรา 18]]" inside the มาตรา 44 card → T11 digest-ref tooltip.
    const ref = page.locator('[data-lawlib-card="44"] [data-lawlib-trigger]', {
      hasText: 'มาตรา 18',
    });
    await scrollTo(page, ref);
    await ref.hover({ force: true });

    const tooltip = page.getByRole('dialog', { name: /^มาตรา 18$/ });
    await expect(tooltip).toBeVisible();
    // DigestRefBody: ฉบับย่อ snippet + ดูฉบับเต็ม button (the full-article
    // ArticleBody branch would render a เปิดมาตรานี้ link instead).
    await expect(tooltip).toContainText('สถานพัฒนาเด็กปฐมวัย');
    await expect(tooltip.getByRole('button', { name: /^ดูฉบับเต็ม$/ })).toBeVisible();
  });

  test('dock is direction-aware: side position expands vertically, top-center horizontally', async ({
    page,
  }) => {
    await openReader(page); // 1280×800, default position = bottom-right (side)

    const dock = page.locator(DOCK_PANEL);
    await expect(dock).toBeVisible();

    // Side position → vertical Level-1 column (T15 v2.3: the ⋯/× control
    // pair sits in its own row at the column's end, so the flex-direction
    // assertions target the marked L1 container — not the เพิ่มเติม parent).
    const level1 = page.locator('[data-lawlib-l1]');
    await expect(level1).toHaveCSS('flex-direction', 'column');
    let box = (await dock.boundingBox())!;
    // Bottom-anchored (expands UP from the bottom-right icon).
    expect(box.y + box.height).toBeGreaterThan(600);
    expect(box.x).toBeGreaterThan(700);

    // Switch the dock position to top-center (the settings picker persists
    // the same `lawlib:dockPosition` key) → horizontal Level-1 row.
    await page.addInitScript(() => {
      localStorage.setItem('lawlib:dockPosition', 'top-center');
    });
    await page.reload();
    await expect(dock).toBeVisible();
    await expect(level1).toHaveCSS('flex-direction', 'row');
    await expect(level1).toHaveCSS('flex-wrap', 'wrap');
    box = (await dock.boundingBox())!;
    // Top-anchored, horizontally centered.
    expect(box.y).toBeLessThan(250);
    expect(box.x + box.width / 2).toBeGreaterThan(600);
    expect(box.x + box.width / 2).toBeLessThan(680);
  });
});
