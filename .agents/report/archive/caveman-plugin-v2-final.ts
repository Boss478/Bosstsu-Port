/**
 * caveman — terse caveman-style replies for opencode v2 (default-on at `lite`, prompt-off).
 *
 * Port of JuliusBrussee/caveman (MIT) to the opencode v2 plugin API.
 * Original: https://github.com/juliusBrussee/caveman — MIT License, attribution preserved.
 *
 * v2 adaptations (empirically verified on opencode2 next-17403, 2026-08-13):
 * - session.hook("context") replaces experimental.chat.system.transform (system is
 *   Array<SystemPart>; push { type: "text", text } parts).
 * - ctx.event.subscribe() returns an AsyncIterable (the callback form never fires).
 * - session.created is not emitted for run --standalone sessions — the flag is
 *   asserted at plugin setup; daemon/serve sessions assert via the session.created
 *   event (repo-aware via the event's info.directory) — AC 1.
 * - Toggle parsing reads the last user message from the context hook's `messages`
 *   array (the event bus carries no user-text events).
 *
 * The flag (~/.config/opencode/.caveman-active) is GLOBAL and shared by all open
 * sessions — a toggle in one session affects all sessions (upstream-compatible).
 *
 * Mode resolution: CAVEMAN_DEFAULT_MODE env → repo .caveman/config.json /
 * .caveman.json → ~/.config/caveman/config.json defaultMode → "lite".
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Plugin } from '@opencode-ai/plugin';

/** Levels accepted by the parser (wenyan-* intentionally excluded — plan Appendix C). */
const VALID_LEVELS = new Set(['lite', 'full', 'ultra', 'off', 'default']);
/** Modes that may appear in the flag file / config. */
const VALID_MODES = new Set(['lite', 'full', 'ultra', 'off']);

const FLAG_PATH = path.join(os.homedir(), '.config', 'opencode', '.caveman-active');
const USER_CONFIG_PATH = path.join(os.homedir(), '.config', 'caveman', 'config.json');
const FLAG_SIZE_CAP = 64;

/** Read a JSON config file; returns null on any error. */
function readJson(file: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Read a repo-level caveman config (`.caveman/config.json` or `.caveman.json`). */
function repoModeFor(dir: string | null | undefined): string | null {
  if (!dir) return null;
  for (const file of [path.join(dir, '.caveman', 'config.json'), path.join(dir, '.caveman.json')]) {
    const config = readJson(file);
    const mode = config?.defaultMode;
    if (typeof mode === 'string' && VALID_MODES.has(mode)) return mode;
  }
  return null;
}

/** Resolve the default mode: env → repo → user config → "lite". */
function resolveBaseMode(dir?: string | null): string {
  const env = process.env.CAVEMAN_DEFAULT_MODE;
  if (env && VALID_MODES.has(env)) return env;
  const repo = repoModeFor(dir);
  if (repo) return repo;
  const userConfig = readJson(USER_CONFIG_PATH);
  const fromConfig = userConfig?.defaultMode;
  if (typeof fromConfig === 'string' && VALID_MODES.has(fromConfig)) return fromConfig;
  return 'lite';
}

/** Read the flag; refuses symlinks and non-whitelisted content. Returns null when absent/invalid. */
function readFlag(): string | null {
  try {
    const fd = fs.openSync(FLAG_PATH, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const buf = Buffer.alloc(FLAG_SIZE_CAP);
    const bytes = fs.readSync(fd, buf, 0, FLAG_SIZE_CAP, 0);
    fs.closeSync(fd);
    const mode = buf.toString('utf8', 0, bytes).trim();
    return VALID_MODES.has(mode) ? mode : null;
  } catch {
    return null;
  }
}

/**
 * Write the flag atomically (temp + rename). Only whitelisted modes are accepted.
 * Rename replaces the directory entry itself, so a symlink at the target is replaced,
 * never followed (a race cannot redirect the write elsewhere).
 */
function writeFlag(mode: string): boolean {
  if (!VALID_MODES.has(mode)) return false;
  try {
    const dir = path.dirname(FLAG_PATH);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(
      dir,
      `.caveman-active.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`,
    );
    const fd = fs.openSync(tmp, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL);
    fs.writeSync(fd, mode, 0, 'utf8');
    fs.closeSync(fd);
    try {
      fs.renameSync(tmp, FLAG_PATH);
      return true;
    } catch (err) {
      fs.unlinkSync(tmp); /* best-effort cleanup */
      throw err;
    }
  } catch {
    return false;
  }
}

/** Remove the flag file (unlink never follows symlinks — safe). */
function removeFlag(): void {
  try {
    fs.unlinkSync(FLAG_PATH);
  } catch {
    /* absent is fine */
  }
}

/** Parse a user text for a toggle directive. Returns the level or null. */
function parseToggle(text: string): string | null {
  if (typeof text !== 'string') return null;
  // Deterministic transport: the TUI expands /caveman into the command file's marker
  // line. Valid level → apply it; bare/unknown marker → default (plan Appendix B).
  const marker = /CAVEMAN COMMAND:\s*([a-z-]*)/i.exec(text);
  if (marker) {
    const level = marker[1].toLowerCase();
    // wenyan-* is not a real level — reject as a clean no-op (plan Appendix C),
    // never map it to "default" (that would silently re-enable caveman).
    if (level.startsWith('wenyan-')) return null;
    return VALID_LEVELS.has(level) ? level : 'default';
  }
  const lower = text.toLowerCase();
  // Negation guard: "don't stop caveman" must not trigger the "off" branch.
  if (/don'?t stop caveman|do not stop caveman/i.test(lower)) return null;
  if (lower.includes('normal mode') || lower.includes('stop caveman')) return 'off';
  if (lower.includes('talk like caveman')) return 'default';
  return null;
}

/** Extract the text of the most recent user message (backward scan). */
function lastUserText(messages: unknown[] | null | undefined): string {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as { role?: string; content?: unknown } | null;
    if (!msg || msg.role !== 'user' || !Array.isArray(msg.content)) continue;
    const text = (msg.content as Array<{ type?: string; text?: unknown }>)
      .filter((part) => part?.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text as string)
      .join(' ');
    if (text.trim()) return text;
  }
  return '';
}

export default Plugin.define({
  id: 'local.caveman',
  setup: async (ctx) => {
    // Default-on: assert the flag at plugin load (covers run --standalone sessions,
    // which don't emit session.created).
    writeFlag(resolveBaseMode());

    // Event subscription (AsyncIterable form — callback form never fires in next-17403).
    // session.created → assert the resolved default mode (upstream semantics, AC 1).
    try {
      const stream = ctx.event.subscribe() as unknown;
      if (
        stream &&
        typeof (stream as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function'
      ) {
        void (async () => {
          try {
            for await (const event of stream as AsyncIterable<{ type?: string; data?: unknown }>) {
              if ((event as { type?: string }).type === 'session.created') {
                const data = (event as { data?: { info?: { directory?: string } } }).data;
                writeFlag(resolveBaseMode(data?.info?.directory ?? null));
              }
            }
          } catch {
            /* the loop must never take the daemon down */
          }
        })();
      }
    } catch {
      /* flag was already asserted at setup */
    }

    // Per-turn reinforcement + prompt-off parsing (context hook — verified dispatching
    // in next-17403; `system` is a mutable Array<SystemPart>).
    const sessionDirs = new Map<string, string | null>();
    const sessionToggle = new Map<string, string | null>();
    try {
      await ctx.session.hook('context', (event) => {
        const e = event as {
          sessionID?: string;
          system?: Array<{ type: string; text?: string }>;
          messages?: unknown[];
        };

        // 0) Toggle parsing from the latest user message (synchronous, deterministic).
        //    Runs before anything else so a toggle always wins this turn.
        const toggle = parseToggle(lastUserText(e.messages));
        if (e.sessionID) sessionToggle.set(e.sessionID, toggle);

        // 1) Cache the session directory once (async) — used to resolve the repo-level
        //    default for "default" toggles. No flag writes here: new-session default-on
        //    is handled by setup + the session.created event (no race, AC 1).
        if (e.sessionID && !sessionDirs.has(e.sessionID)) {
          sessionDirs.set(e.sessionID, null);
          void (async () => {
            try {
              const session = (await ctx.session.get({ sessionID: e.sessionID as string })) as {
                location?: { directory?: string };
              } | null;
              const dir = session?.location?.directory ?? null;
              sessionDirs.set(e.sessionID as string, dir);
              // Race guard: a "default" toggle on the first turn is applied against
              // the global default while the dir cache is still pending. If the flag
              // still equals that global default (no later toggle moved it), re-apply
              // the repo-level default now that the directory is known.
              if (
                sessionToggle.get(e.sessionID as string) === 'default' &&
                readFlag() === resolveBaseMode(null)
              ) {
                writeFlag(resolveBaseMode(dir));
              }
            } catch {
              /* keep cached null */
            }
          })();
        }

        // 2) Apply the toggle (off → remove flag; level → write; default → resolved default).
        if (toggle === 'off') {
          if (readFlag() !== null) removeFlag();
        } else if (toggle) {
          const next =
            toggle === 'default'
              ? resolveBaseMode(sessionDirs.get(e.sessionID ?? '') ?? null)
              : toggle;
          if (readFlag() !== next) writeFlag(next);
        }

        // 3) Reinforcement: push only when a whitelisted mode is active. Never for off.
        const mode = readFlag();
        if (mode && mode !== 'off' && Array.isArray(e.system)) {
          try {
            e.system.push({
              type: 'text',
              text: `CAVEMAN MODE ACTIVE (${mode}) — session ruleset applies.`,
            });
          } catch {
            /* the hook must never throw */
          }
        }
      });
    } catch {
      /* a broken hook must not break session context */
    }
  },
});
