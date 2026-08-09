// ===========================================================================
// Commit-msg validator contract — grammar per
// .agents/plans/commit-message-rule.md §4 (v3.2).
//   Unit: validateMessage() over every fixture file (full matrix).
//   CLI:  spawn scripts/commit-msg-check.mjs on every fixture (exit codes).
// ===========================================================================

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateMessage } from '../../scripts/commit-msg-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures');
const SCRIPT = path.join(HERE, '..', '..', 'scripts', 'commit-msg-check.mjs');

const read = (kind: string, file: string) =>
  fs.readFileSync(path.join(FIXTURES, kind, file), 'utf8');

const VALID = [
  'feat-basic.txt',
  'feat-task-ref.txt',
  'fix-multi-ref.txt',
  'feat-breaking.txt',
  'feat-issue-ref.txt',
  'feat-pr-ref.txt',
  'feat-acronym-tls.txt',
  'feat-acronym-tts.txt',
  'release-canonical.txt',
  'release-minimal.txt',
  'release-history-cap.txt',
  'release-history-lower.txt',
  'release-history-prerelease.txt',
  'merge.txt',
  'fixup.txt',
  'squash.txt',
  'revert.txt',
  'body-blank-line.txt',
];

const INVALID = [
  'missing-desc.txt',
  'scope-retired.txt',
  'old-task-prefix.txt',
  'uppercase-type.txt',
  'type-space.txt',
  'dropped-type.txt',
  'release-no-parens.txt',
  'ref-not-at-end.txt',
  'ref-space-after-hash.txt',
  'ref-space-after-t.txt',
  'trailing-period.txt',
  'trailing-period-after-ref.txt',
  'leading-space.txt',
  'trailing-space.txt',
  'empty.txt',
];

const ADVISORY = [
  'long-subject.txt',
  'body-no-blank.txt',
  'body-note-lines.txt',
  'comment-lines.txt',
];

// Key rejection reasons must stay specific (teaching UX + compliance report).
const EXPECTED_REASON: Record<string, string> = {
  'missing-desc.txt': 'missing description',
  'scope-retired.txt': 'retired',
  'old-task-prefix.txt': 'lowercase',
  'uppercase-type.txt': 'lowercase',
  'dropped-type.txt': "unknown type 'merge'",
  'release-no-parens.txt': 'release requires (vX.Y.Z)',
  'ref-not-at-end.txt': 'at the very end',
  'ref-space-after-hash.txt': 'malformed ref group',
  'ref-space-after-t.txt': 'malformed ref group',
  'trailing-period.txt': "must not end with '.'",
  'trailing-period-after-ref.txt': "must not end with '.'",
  'leading-space.txt': 'whitespace',
  'trailing-space.txt': 'whitespace',
  'empty.txt': 'empty',
};

describe('validateMessage — valid fixtures pass silently', () => {
  for (const file of VALID) {
    it(`accepts ${file}`, () => {
      const result = validateMessage(read('valid', file));
      expect(result).toEqual({ ok: true, errors: [], warnings: [] });
    });
  }
});

describe('validateMessage — invalid fixtures fail with one reason', () => {
  for (const file of INVALID) {
    it(`rejects ${file}`, () => {
      const result = validateMessage(read('invalid', file));
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBe(1);
      if (EXPECTED_REASON[file]) {
        expect(result.errors[0]).toContain(EXPECTED_REASON[file]);
      }
    });
  }
});

describe('validateMessage — advisory fixtures warn but pass', () => {
  it('warns (>72 chars) with subject-length code', () => {
    const result = validateMessage(read('advisory', 'long-subject.txt'));
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.code === 'subject-length')).toBe(true);
  });

  it('warns (body without blank line) with body-blank code', () => {
    const result = validateMessage(read('advisory', 'body-no-blank.txt'));
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.code === 'body-blank')).toBe(true);
  });

  it('does not warn on body with Note:/30 min lines (no footer validation)', () => {
    const result = validateMessage(read('advisory', 'body-note-lines.txt'));
    expect(result).toEqual({ ok: true, errors: [], warnings: [] });
  });

  it('ignores # comment lines', () => {
    const result = validateMessage(read('advisory', 'comment-lines.txt'));
    expect(result).toEqual({ ok: true, errors: [], warnings: [] });
  });
});

function runCli(file: string, extra: string[] = []): { status: number; stderr: string } {
  const result = spawnSync(process.execPath, [SCRIPT, file, ...extra], { encoding: 'utf8' });
  return { status: result.status ?? 1, stderr: result.stderr ?? '' };
}

describe('CLI (spawn) — exit codes', () => {
  it('exits 0 for every valid fixture', () => {
    for (const file of VALID) {
      const { status } = runCli(path.join(FIXTURES, 'valid', file));
      expect(status, file).toBe(0);
    }
  });

  it('exits 1 for every invalid fixture and prints teaching diagnostics', () => {
    for (const file of INVALID) {
      const { status, stderr } = runCli(path.join(FIXTURES, 'invalid', file));
      expect(status, file).toBe(1);
      expect(stderr, file).toContain('Commit message rejected');
      expect(stderr, file).toContain('Reason:');
    }
  });

  it('exits 0 silently for advisory fixtures (piped stdout is not a TTY)', () => {
    for (const file of ADVISORY) {
      const { status, stderr } = runCli(path.join(FIXTURES, 'advisory', file));
      expect(status, file).toBe(0);
      expect(stderr, file).toBe('');
    }
  });

  it('prints advisory warnings when --advisories forces them', () => {
    const { status, stderr } = runCli(path.join(FIXTURES, 'advisory', 'long-subject.txt'), [
      '--advisories',
    ]);
    expect(status).toBe(0);
    expect(stderr).toContain('>72 advisory limit');
  });
});
