// @vitest-environment jsdom
/**
 * T40 (ADR-025 S2) — font size preset chips: 8/12/16/24/32.
 *
 * Pins the rendered chip set (aria-labels `ขนาดตัวอักษร Npx`) + the
 * active-chip aria-pressed state, so a future preset resize is deliberate.
 * The slider range (8–32) and legacy stored values (14/18, in-range) are
 * covered by reader-settings.test.ts (validation contract) — not duplicated.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FontSizePickerContent, FONT_SIZE_PRESETS } from '@/components/LawlibPickers';

const chipLabel = (preset: number) => `ขนาดตัวอักษร ${preset}px`;

describe('FontSizePickerContent — preset chips (T40, ADR-025 S2)', () => {
  it('exposes the five presets 8/12/16/24/32', () => {
    expect(FONT_SIZE_PRESETS).toEqual([8, 12, 16, 24, 32]);
  });

  it('renders every preset as a labelled chip', () => {
    render(<FontSizePickerContent value={16} onChange={() => {}} />);
    for (const preset of FONT_SIZE_PRESETS) {
      expect(screen.getByRole('button', { name: chipLabel(preset) })).toBeTruthy();
    }
  });

  it('renders no legacy preset chips (14/18 retired)', () => {
    render(<FontSizePickerContent value={16} onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: chipLabel(14) })).toBeNull();
    expect(screen.queryByRole('button', { name: chipLabel(18) })).toBeNull();
  });

  it('marks the current value chip as pressed', () => {
    render(<FontSizePickerContent value={24} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: chipLabel(24) }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: chipLabel(16) }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
});
