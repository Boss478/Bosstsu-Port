// @vitest-environment jsdom
/**
 * T10b — quick-jump (ADR-019 D7: พิมพ์เลขมาตรา → ข้ามไป) contract tests.
 *
 * SearchPanel is exercised directly (leaf component, controlled props):
 * - "32" (or "มาตรา 32", incl. Thai digits) → a prominent jump button
 * - Enter in the input jumps immediately (no debounce dependency)
 * - an unknown number → a helpful error, not a dead search
 * - mixed text queries behave exactly as before (no jump row)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchPanel } from '@/components/SearchPanel';
import { flattenArticles } from '@/lib/lawlib-reader';
import sampleLawRaw from '@/data/lawlib/laws/sample.json';
import type { LawDoc } from '@/types/lawlib';

const sampleLaw = sampleLawRaw as unknown as LawDoc;

function renderPanel(onJump = vi.fn()) {
  const articles = flattenArticles(sampleLaw).map((f) => f.article);
  const utils = render(<SearchPanel articles={articles} onJump={onJump} />);
  return { articles, onJump, ...utils };
}

const input = () => screen.getByRole('searchbox') as HTMLInputElement;

describe('T10b quick-jump — พิมพ์เลขมาตรา → ข้ามไป', () => {
  it('"12" shows the jump button and jumps on click', () => {
    const { onJump } = renderPanel();
    fireEvent.change(input(), { target: { value: '12' } });
    const jump = screen.getByRole('button', { name: /ข้ามไป มาตรา 12/ });
    expect(jump).toBeTruthy();
    fireEvent.click(jump);
    expect(onJump).toHaveBeenCalledWith('12');
  });

  it('"มาตรา 12" (with the prefix) jumps too', () => {
    const { onJump } = renderPanel();
    fireEvent.change(input(), { target: { value: 'มาตรา 12' } });
    fireEvent.click(screen.getByRole('button', { name: /ข้ามไป มาตรา 12/ }));
    expect(onJump).toHaveBeenCalledWith('12');
  });

  it('Thai digits normalize: "๑๐" → มาตรา 10', () => {
    const { onJump } = renderPanel();
    fireEvent.change(input(), { target: { value: '๑๐' } });
    fireEvent.click(screen.getByRole('button', { name: /ข้ามไป มาตรา 10/ }));
    expect(onJump).toHaveBeenCalledWith('10');
  });

  it('Enter in the input jumps immediately (before the debounce)', () => {
    const { onJump } = renderPanel();
    fireEvent.change(input(), { target: { value: '12' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onJump).toHaveBeenCalledWith('12');
  });

  it('an unknown number shows a helpful error instead of a dead search', () => {
    renderPanel();
    fireEvent.change(input(), { target: { value: '999' } });
    expect(screen.getByText(/ไม่พบมาตรา 999 ในกฎหมายฉบับนี้/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /ข้ามไป มาตรา 999/ })).toBeNull();
  });

  it('a jump query still lists the matching articles below (coexistence)', async () => {
    renderPanel();
    fireEvent.change(input(), { target: { value: 'มาตรา 12' } });
    expect(screen.getByRole('button', { name: /ข้ามไป มาตรา 12/ })).toBeTruthy();
    // The debounced text search still runs underneath (status element —
    // the sample law has no article whose TEXT contains the literal
    // "มาตรา 12", so the count line reads "ไม่พบผลการค้นหา").
    expect(await screen.findByRole('status')).toBeTruthy();
  });

  it('mixed-text queries keep the plain search behavior (no jump row)', async () => {
    renderPanel();
    fireEvent.change(input(), { target: { value: 'เงินกู้ 32' } });
    expect(screen.queryByRole('button', { name: /ข้ามไป/ })).toBeNull();
    // The plain-search pipeline still ran (the debounced status element
    // reports 0 hits for this query).
    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('ไม่พบผลการค้นหา');
  });
});
