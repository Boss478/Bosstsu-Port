// scripts/commit-msg-check.mjs — zero-dependency commit message validator
// (grammar per .agents/plans/commit-message-rule.md §4 v3.2). Exports
// validateMessage(text) for tests; CLI when executed directly:
//   node scripts/commit-msg-check.mjs <message-file> [--advisories]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test',
  'build', 'ci', 'chore', 'revert', 'infra', 'release',
];
const TYPES_LIST = TYPES.join(' ');

const EXEMPT_PREFIXES = ['Merge ', 'fixup!', 'squash!', 'Revert "'];
const REL1 = /^release: \(v\d+\.\d+\.\d+[a-zA-Z0-9.-]*\)(?: .+)?$/;
const REL2 = /^(Release )?v\d+\.\d+\.\d+[a-zA-Z0-9.-]*:/;
const CC = /^(?<type>[a-z]+)(?<bang>!)?: (?<desc>.+?)(?: \((?<refs>[A-Za-z0-9#_+./-]+(?:\s*;\s*[A-Za-z0-9#_+./-]+)*)\))?$/;
// Ref-intent opener: '(#', '(T' or '(PR-' followed by whitespace = malformed
// ref attempt (e.g. '(# 123)', '(T 23)'). Digit-anchored refs are handled by
// the scan below; acronyms like '(TLS)'/'feat: x(T23)' stay free text.
const REF_OPENER = /\([#T]\s|\(PR-\s/;

export function validateMessage(text) {
  const warnings = [];
  // '#' comment lines (git template trailers) are ignored when scanning.
  const content = String(text).split(/\r?\n/).filter((line) => !line.trimStart().startsWith('#'));
  const subjectIndex = content.findIndex((line) => line.trim().length > 0);
  if (subjectIndex === -1) {
    return { ok: false, errors: ['subject is empty — first line must be <type>: <description>'], warnings };
  }
  const subject = content[subjectIndex];

  // Auto-generated messages pass silently (no advisories).
  if (EXEMPT_PREFIXES.some((prefix) => subject.startsWith(prefix))) {
    return { ok: true, errors: [], warnings };
  }
  // Release forms: REL1 canonical, REL2 history-compat — both pass as-is.
  if (REL1.test(subject) || REL2.test(subject)) {
    return { ok: true, errors: [], warnings };
  }

  const match = CC.exec(subject);
  if (!match) {
    return { ok: false, errors: [diagnose(subject)], warnings };
  }
  const { type } = match.groups;
  if (!TYPES.includes(type)) {
    return { ok: false, errors: [`unknown type '${type}' — allowed: ${TYPES_LIST}`], warnings };
  }
  if (type === 'release' && !REL1.test(subject)) {
    return {
      ok: false,
      errors: ["release requires (vX.Y.Z) right after 'release: ' — e.g. release: (v1.13.0) notes"],
      warnings,
    };
  }

  // Post-checks. Order matters for diagnostics: the trailing-period micro-rule
  // runs first so 'feat: x (T23).' reports "must not end with '.'" instead of
  // the ref-at-end scan firing on the period after the group.
  if (subject.endsWith('.')) {
    return { ok: false, errors: ["subject must not end with '.' — e.g. 'feat: x' not 'feat: x.'"], warnings };
  }
  // A ref group must sit at the very end of the subject.
  const refShaped = /\([#T]\d[^\s)]*\)|\(PR-\d[^\s)]*\)/g;
  for (const found of subject.matchAll(refShaped)) {
    if (found.index + found[0].length !== subject.length) {
      return { ok: false, errors: [`ref group '${found[0]}' must be at the very end — e.g. 'feat: x (T23)'`], warnings };
    }
  }
  if (!match.groups.refs && REF_OPENER.test(subject)) {
    return {
      ok: false,
      errors: ["malformed ref group — expected '(T23)' / '(#42)' / '(PR-7)' at the very end"],
      warnings,
    };
  }
  if (subject !== subject.trim()) {
    return { ok: false, errors: ['no leading/trailing whitespace allowed on the subject line'], warnings };
  }

  // Advisories — never fail the commit.
  if (subject.length > 72) {
    warnings.push({ code: 'subject-length', message: `subject is ${subject.length} chars (>72 advisory limit)` });
  }
  const rest = content.slice(subjectIndex + 1);
  if (rest.length >= 2 && rest[0].trim() !== '') {
    warnings.push({ code: 'body-blank', message: 'blank line required before body (line 2 starts the body)' });
  }
  return { ok: true, errors: [], warnings };
}

function diagnose(subject) {
  if (subject !== subject.trim()) {
    return 'no leading/trailing whitespace allowed on the subject line';
  }
  const colon = subject.indexOf(':');
  if (colon === -1) {
    return "missing ': ' separator — expected '<type>: <description>' (e.g. 'feat: digest pairing (T25; lawlib)')";
  }
  const rawPrefix = subject.slice(0, colon);
  const prefix = rawPrefix.endsWith('!') ? rawPrefix.slice(0, -1) : rawPrefix;
  if (prefix.includes('(')) {
    return `scope syntax '${rawPrefix}:' is retired — put module/task refs at the end: 'feat: x (krulaw)'`;
  }
  if (!/^[a-z]+$/.test(prefix)) {
    return `type '${rawPrefix}' must be lowercase letters only (allowed: ${TYPES_LIST})`;
  }
  if (!TYPES.includes(prefix)) {
    return `unknown type '${prefix}' — allowed: ${TYPES_LIST}`;
  }
  if (prefix === 'release') {
    return "release requires (vX.Y.Z) right after 'release: ' — e.g. release: (v1.13.0) notes";
  }
  if (subject.slice(colon + 1).trim() === '') {
    return `missing description after '${rawPrefix}:' — e.g. '${rawPrefix}: <description>'`;
  }
  return "malformed subject — expected '<type>: <description>' with optional ref group at the end";
}

const UX = [
  '✖ Commit message rejected — subject must be:',
  '  <type>: <description> (<ref1>; <ref2>; …)    e.g. feat: digest pairing (T25; lawlib)',
  `  types: ${TYPES_LIST}`,
  '  release: (vX.Y.Z) <details>                  e.g. release: (v1.13.0) content-surface glass',
  '  or Release vX.Y.Z: <description>',
  "  no trailing '.', no leading/trailing spaces",
];

function main() {
  const args = process.argv.slice(2);
  const forceAdvisories = args.includes('--advisories');
  const file = args.find((arg) => arg !== '--advisories');
  if (!file) {
    console.error('usage: node scripts/commit-msg-check.mjs <message-file> [--advisories]');
    process.exit(2);
  }
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`✖ cannot read commit message file '${file}': ${error.message}`);
    process.exit(2);
  }
  const { ok, errors, warnings } = validateMessage(text);
  // Advisories are TTY-only unless forced (--advisories) — keeps CI/agents quiet.
  if (process.stdout.isTTY || forceAdvisories) {
    for (const warning of warnings) console.warn(`⚠ ${warning.message}`);
  }
  if (!ok) {
    for (const line of UX) console.error(line);
    console.error(`  Reason: ${errors[0]}`);
    process.exit(1);
  }
  process.exit(0);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
