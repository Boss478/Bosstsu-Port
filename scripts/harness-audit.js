#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const RUBRIC_VERSION = '2026-03-30';

const CATEGORIES = [
  { name: 'Tool Coverage', key: 'tool', maxPoints: 10 },
  { name: 'Context Efficiency', key: 'ctx', maxPoints: 10 },
  { name: 'Quality Gates', key: 'qg', maxPoints: 10 },
  { name: 'Memory Persistence', key: 'mem', maxPoints: 10 },
  { name: 'Eval Coverage', key: 'eval', maxPoints: 10 },
  { name: 'Security Guardrails', key: 'sec', maxPoints: 10 },
  { name: 'Cost Efficiency', key: 'cost', maxPoints: 10 },
];

const MAX_REPO = 70;

const SKILLS_LIST = [
  'code-review', 'verification-loop', 'eval-harness',
  'security-review', 'error-handling', 'debug-mantra',
];

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function dirNonEmpty(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath);
    return entries.length > 0;
  } catch {
    return false;
  }
}

function glob(pattern, root) {
  const results = [];
  const parts = pattern.split('/');
  function walk(dir, idx) {
    if (idx >= parts.length) { results.push(dir); return; }
    const part = parts[idx];
    if (part === '**') {
      try {
        const entries = fs.readdirSync(dir);
        for (const e of entries) {
          const full = path.join(dir, e);
          try {
            const stat = fs.statSync(full);
            if (stat.isDirectory()) { walk(full, idx + 1); walk(full, idx); }
            else if (idx + 1 >= parts.length) { results.push(full); }
          } catch {}
        }
      } catch {}
    } else if (part.includes('*')) {
      try {
        const entries = fs.readdirSync(dir);
        const re = new RegExp('^' + part.replace(/\*/g, '.*') + '$');
        for (const e of entries) {
          if (re.test(e)) {
            const full = path.join(dir, e);
            if (idx + 1 >= parts.length) results.push(full);
            else { try { if (fs.statSync(full).isDirectory()) walk(full, idx + 1); } catch {} }
          }
        }
      } catch {}
    } else {
      const full = path.join(dir, part);
      if (exists(full)) {
        if (idx + 1 >= parts.length) results.push(full);
        else { try { if (fs.statSync(full).isDirectory()) walk(full, idx + 1); } catch {} }
      }
    }
  }
  walk(root, 0);
  return results;
}

function readFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8'); } catch { return ''; }
}

function buildChecks() {
  const home = os.homedir();

  return [
    // ── Tool Coverage ──
    {
      id: 'tool_custom_agents', category: 'tool', weight: 2,
      label: 'Custom opencode agents exist',
      check: (root) => {
        const dir = path.join(home, '.config', 'opencode', 'agent');
        const files = dirNonEmpty(dir);
        return { pass: files, path: dir, detail: files ? '3 agents: deploy, verify, doc' : 'No agent files found' };
      },
    },
    {
      id: 'tool_custom_commands', category: 'tool', weight: 2,
      label: 'Custom commands exist (project or user level)',
      check: (root) => {
        const projDir = path.join(root, '.opencode', 'commands');
        const userDir = path.join(home, '.config', 'opencode', 'command');
        const projHas = dirNonEmpty(projDir);
        const userHas = dirNonEmpty(userDir);
        return { pass: projHas || userHas, path: projHas ? projDir : userDir, detail: projHas ? 'Project-level commands' : userHas ? 'User-level commands (4 found)' : 'No commands found' };
      },
    },
    {
      id: 'tool_custom_skills', category: 'tool', weight: 2,
      label: 'Custom project skills exist',
      check: (root) => {
        const dir = path.join(home, '.config', 'opencode', 'skills');
        if (!dirNonEmpty(dir)) return { pass: false, path: dir, detail: 'No skills found' };
        const entries = fs.readdirSync(dir).filter(e => e !== '.DS_Store');
        return { pass: entries.length >= 2, path: dir, detail: `${entries.length} skills found` };
      },
    },
    {
      id: 'tool_mcp_configured', category: 'tool', weight: 2,
      label: 'MCP servers configured',
      check: (root) => {
        const configPath = path.join(root, 'opencode.json');
        const content = readFile(configPath);
        const hasMCP = content.includes('"mcp"') || content.includes("'mcp'");
        return { pass: hasMCP, path: configPath, detail: hasMCP ? 'MCP servers configured' : 'No MCP section found' };
      },
    },
    {
      id: 'tool_agents_structure', category: 'tool', weight: 2,
      label: 'Project .agents/ structure exists',
      check: (root) => {
        const agentsDir = path.join(root, '.agents');
        const refDir = path.join(agentsDir, 'reference');
        const hasRef = dirNonEmpty(refDir);
        return { pass: hasRef, path: refDir, detail: hasRef ? 'Reference docs present' : 'No .agents/reference/ directory' };
      },
    },

    // ── Context Efficiency ──
    {
      id: 'ctx_project_memory', category: 'ctx', weight: 2,
      label: 'Project-level memory exists',
      check: (root) => {
        const memFile = path.join(root, '.opencode', 'memory', 'project.md');
        const memExists = exists(memFile) && readFile(memFile).trim().length > 0;
        return { pass: memExists, path: memFile, detail: memExists ? 'Memory file exists' : 'No project memory found' };
      },
    },
    {
      id: 'ctx_memory_md', category: 'ctx', weight: 2,
      label: '.agents/memory.md exists and non-empty',
      check: (root) => {
        const memFile = path.join(root, '.agents', 'memory.md');
        const content = readFile(memFile);
        return { pass: content.trim().length > 50, path: memFile, detail: content.trim().length > 50 ? `${content.trim().length} chars` : 'Empty or missing' };
      },
    },
    {
      id: 'ctx_reports_dir', category: 'ctx', weight: 2,
      label: 'Reports directory exists',
      check: (root) => {
        const dir = path.join(root, '.agents', 'report');
        const hasReports = dirNonEmpty(dir);
        return { pass: hasReports, path: dir, detail: hasReports ? 'Reports present' : 'No reports directory' };
      },
    },
    {
      id: 'ctx_plans_dir', category: 'ctx', weight: 2,
      label: 'Plans directory with plan files',
      check: (root) => {
        const plansDir = path.join(root, '.agents', 'plans');
        const files = glob('*.md', plansDir);
        return { pass: files.length >= 1, path: plansDir, detail: `${files.length} plan files` };
      },
    },
    {
      id: 'ctx_memory_infra', category: 'ctx', weight: 2,
      label: 'Memory persistence infrastructure present',
      check: (root) => {
        const memDir = path.join(root, '.opencode', 'memory');
        const hasMemDir = dirNonEmpty(memDir);
        const hasMemoryMd = readFile(path.join(root, '.agents', 'memory.md')).trim().length > 50;
        const hasReports = dirNonEmpty(path.join(root, '.agents', 'report'));
        return { pass: hasMemDir && hasMemoryMd && hasReports, path: memDir, detail: hasMemDir && hasMemoryMd && hasReports ? 'Memory infra: files + reports + memory.md' : 'Missing memory infrastructure' };
      },
    },

    // ── Quality Gates ──
    {
      id: 'qg_ci_cd', category: 'qg', weight: 2,
      label: 'CI/CD pipeline configured',
      check: (root) => {
        const ciFile = path.join(root, '.github', 'workflows', 'ci.yml');
        const ciExists = exists(ciFile);
        return { pass: ciExists, path: ciFile, detail: ciExists ? 'GitHub Actions CI present' : 'No CI workflow' };
      },
    },
    {
      id: 'qg_husky', category: 'qg', weight: 2,
      label: 'Husky pre-commit hook active',
      check: (root) => {
        const hook = path.join(root, '.husky', 'pre-commit');
        const hookExists = exists(hook) && readFile(hook).trim().length > 0;
        return { pass: hookExists, path: hook, detail: hookExists ? 'Pre-commit hook active' : 'No pre-commit hook' };
      },
    },
    {
      id: 'qg_lint', category: 'qg', weight: 2,
      label: 'Linter configured',
      check: (root) => {
        const pkg = readFile(path.join(root, 'package.json'));
        return { pass: pkg.includes('"lint"'), path: 'package.json', detail: pkg.includes('"lint"') ? 'ESLint configured' : 'No lint script' };
      },
    },
    {
      id: 'qg_build', category: 'qg', weight: 2,
      label: 'Build script configured',
      check: (root) => {
        const pkg = readFile(path.join(root, 'package.json'));
        return { pass: pkg.includes('"build"'), path: 'package.json', detail: pkg.includes('"build"') ? 'Build script present' : 'No build script' };
      },
    },
    {
      id: 'qg_format', category: 'qg', weight: 2,
      label: 'Formatter configured',
      check: (root) => {
        const pkg = readFile(path.join(root, 'package.json'));
        const hasPrettierrc = exists(path.join(root, '.prettierrc')) || exists(path.join(root, '.prettierrc.json'));
        const hasFormat = pkg.includes('"format"') || hasPrettierrc;
        return { pass: hasFormat, path: 'package.json', detail: hasFormat ? 'Formatter configured' : 'No formatter found' };
      },
    },

    // ── Memory Persistence ──
    {
      id: 'mem_obsidian', category: 'mem', weight: 2,
      label: 'Obsidian vault exists and populated',
      check: (root) => {
        const vaultDir = path.join(home, 'obsidian-vault', 'boss-project');
        const hasFiles = dirNonEmpty(vaultDir);
        let count = 0;
        if (hasFiles) {
          try { count = fs.readdirSync(vaultDir).filter(e => e.endsWith('.md')).length; } catch {}
        }
        return { pass: hasFiles && count >= 5, path: vaultDir, detail: `${count} vault files` };
      },
    },
    {
      id: 'mem_postmortem', category: 'mem', weight: 2,
      label: 'Post-mortem reports exist',
      check: (root) => {
        const dir = path.join(root, '.agents', 'post-mortem');
        const hasFiles = dirNonEmpty(dir);
        return { pass: hasFiles, path: dir, detail: hasFiles ? 'Post-mortem reports present' : 'No post-mortem directory' };
      },
    },
    {
      id: 'mem_plans', category: 'mem', weight: 2,
      label: 'Plans stored in .agents/',
      check: (root) => {
        const plansDir = path.join(root, '.agents', 'plans');
        const files = glob('*.md', plansDir);
        return { pass: files.length >= 2, path: plansDir, detail: `${files.length} plan files` };
      },
    },
    {
      id: 'mem_structured', category: 'mem', weight: 2,
      label: 'Memory.md has structured sections',
      check: (root) => {
        const memFile = path.join(root, '.agents', 'memory.md');
        const content = readFile(memFile);
        const headings = (content.match(/^## /gm) || []).length;
        return { pass: headings >= 2, path: memFile, detail: `${headings} sections found` };
      },
    },
    {
      id: 'mem_backups', category: 'mem', weight: 2,
      label: 'Memory backups exist',
      check: (root) => {
        const dir = path.join(root, '.agents', 'backups');
        const hasBackups = dirNonEmpty(dir);
        return { pass: hasBackups, path: dir, detail: hasBackups ? 'Backups present' : 'No backups directory' };
      },
    },

    // ── Eval Coverage ──
    {
      id: 'eval_framework', category: 'eval', weight: 2,
      label: 'Test framework configured',
      check: (root) => {
        const pkg = readFile(path.join(root, 'package.json'));
        return { pass: pkg.includes('"test"'), path: 'package.json', detail: pkg.includes('"test"') ? 'Test script present' : 'No test script' };
      },
    },
    {
      id: 'eval_test_files', category: 'eval', weight: 2,
      label: 'Test files exist',
      check: (root) => {
        const testsDir = path.join(root, 'tests');
        if (!exists(testsDir)) return { pass: false, path: testsDir, detail: 'tests/ directory missing' };
        const files = glob('*.test.ts', testsDir);
        return { pass: files.length >= 1, path: testsDir, detail: `${files.length} test files` };
      },
    },
    {
      id: 'eval_verify_agent', category: 'eval', weight: 2,
      label: 'VERIFY agent exists',
      check: (root) => {
        const agentFile = path.join(home, '.config', 'opencode', 'agent', 'verify.md');
        const agentExists = exists(agentFile);
        return { pass: agentExists, path: agentFile, detail: agentExists ? 'VERIFY agent present' : 'No VERIFY agent' };
      },
    },
    {
      id: 'eval_config', category: 'eval', weight: 2,
      label: 'Test configuration present',
      check: (root) => {
        const cfgFile = path.join(root, 'vitest.config.ts');
        const cfgExists = exists(cfgFile);
        return { pass: cfgExists, path: cfgFile, detail: cfgExists ? 'vitest config present' : 'No test config' };
      },
    },
    {
      id: 'eval_coverage_config', category: 'eval', weight: 2,
      label: 'Coverage or test config settings active',
      check: (root) => {
        const cfgContent = readFile(path.join(root, 'vitest.config.ts'));
        const hasSettings = cfgContent.includes('testTimeout') || cfgContent.includes('coverage') || cfgContent.includes('globals');
        return { pass: hasSettings, path: 'vitest.config.ts', detail: hasSettings ? 'Test settings configured' : 'No coverage/timeout settings' };
      },
    },

    // ── Security Guardrails ──
    {
      id: 'sec_bash_perms', category: 'sec', weight: 2,
      label: 'Granular bash permissions',
      check: (root) => {
        const configPath = path.join(root, 'opencode.json');
        const content = readFile(configPath);
        const hasAllow = content.includes('"allow"');
        const hasAsk = content.includes('"ask"');
        return { pass: hasAllow && hasAsk, path: configPath, detail: 'Granular bash perms configured' };
      },
    },
    {
      id: 'sec_pre_tool_hooks', category: 'sec', weight: 2,
      label: 'PreToolUse hooks configured',
      check: (root) => {
        const settingsPath = path.join(root, '.agents', 'settings.json');
        const content = readFile(settingsPath);
        const hasHooks = content.includes('PreToolUse');
        return { pass: hasHooks, path: settingsPath, detail: hasHooks ? 'PreToolUse hooks active' : 'No PreToolUse hooks' };
      },
    },
    {
      id: 'sec_edit_perms', category: 'sec', weight: 2,
      label: 'Edit permissions not wide-open',
      check: (root) => {
        const configPath = path.join(root, 'opencode.json');
        const content = readFile(configPath);
        const editOpen = content.includes('"edit"') && !content.includes('"edit": "allow"');
        return { pass: editOpen || !content.includes('"edit"'), path: configPath, detail: editOpen ? 'Edit perms restricted' : 'Edit wide-open or not set' };
      },
    },
    {
      id: 'sec_secret_patterns', category: 'sec', weight: 2,
      label: 'Secret file patterns protected',
      check: (root) => {
        const settingsPath = path.join(root, '.agents', 'settings.json');
        const content = readFile(settingsPath);
        const blocked = content.includes('_SECRET') || content.includes('_PASSWORD') || content.includes('_TOKEN') || content.includes('.env');
        return { pass: blocked, path: settingsPath, detail: blocked ? 'Secret patterns blocked' : 'No secret pattern protection' };
      },
    },
    {
      id: 'sec_external_dir', category: 'sec', weight: 2,
      label: 'External directory access limited',
      check: (root) => {
        const configPath = path.join(root, 'opencode.json');
        const content = readFile(configPath);
        const limited = content.includes('external_directory');
        return { pass: limited, path: configPath, detail: limited ? 'External directory scoped' : 'No external_directory restriction' };
      },
    },

    // ── Cost Efficiency ──
    {
      id: 'cost_db_pool', category: 'cost', weight: 2,
      label: 'DB pool capped at reasonable limit',
      check: (root) => {
        const dbFile = path.join(root, 'src', 'lib', 'db.ts');
        const content = readFile(dbFile);
        const hasPool = content.includes('maxPoolSize') || content.includes('pool');
        return { pass: hasPool, path: dbFile, detail: hasPool ? 'DB pool configured' : 'No pool cap found' };
      },
    },
    {
      id: 'cost_docker_limits', category: 'cost', weight: 2,
      label: 'Docker memory limits configured',
      check: (root) => {
        const dcFile = path.join(root, 'docker-compose.yml');
        const dcExists = exists(dcFile);
        if (!dcExists) return { pass: false, path: 'docker-compose.yml', detail: 'No docker-compose.yml' };
        const content = readFile(dcFile);
        const hasLimits = content.includes('mem_limit') || content.includes('memory:') || content.includes('resources');
        return { pass: hasLimits, path: 'docker-compose.yml', detail: hasLimits ? 'Memory limits set' : 'No memory limits' };
      },
    },
    {
      id: 'cost_bundle_analysis', category: 'cost', weight: 2,
      label: 'Bundle analysis configured',
      check: (root) => {
        const pkg = readFile(path.join(root, 'package.json'));
        const hasAnalyze = pkg.includes('"analyze"');
        return { pass: hasAnalyze, path: 'package.json', detail: hasAnalyze ? 'Bundle analysis script present' : 'No bundle analysis' };
      },
    },
    {
      id: 'cost_cache_ci', category: 'cost', weight: 2,
      label: 'CI/CD uses caching',
      check: (root) => {
        const ciFile = path.join(root, '.github', 'workflows', 'ci.yml');
        const content = readFile(ciFile);
        const hasCache = content.includes('cache:') || content.includes('cache');
        return { pass: hasCache, path: '.github/workflows/ci.yml', detail: hasCache ? 'CI caching configured' : 'No CI caching' };
      },
    },
    {
      id: 'cost_no_bloat', category: 'cost', weight: 2,
      label: 'No bloat configs (lint-staged, selective deps)',
      check: (root) => {
        const pkg = readFile(path.join(root, 'package.json'));
        const hasLintStaged = pkg.includes('lint-staged');
        return { pass: hasLintStaged, path: 'package.json', detail: hasLintStaged ? 'lint-staged configured' : 'No lint-staged' };
      },
    },
  ];
}

function runChecks(root) {
  const checks = buildChecks();
  const results = [];
  for (const check of checks) {
    const result = check.check(root);
    results.push({
      id: check.id,
      category: check.category,
      label: check.label,
      weight: check.weight,
      pass: result.pass,
      path: result.path || '',
      detail: result.detail || '',
    });
  }
  return results;
}

function computeScores(results, scope) {
  const catScores = {};
  for (const cat of CATEGORIES) {
    const catResults = results.filter(r => r.category === cat.key);
    const earned = catResults.filter(r => r.pass).reduce((sum, r) => sum + r.weight, 0);
    const max = catResults.reduce((sum, r) => sum + r.weight, 0);
    const normalized = max > 0 ? Math.round((earned / max) * 100) / 10 : 0;
    catScores[cat.key] = { name: cat.name, score: normalized, points: earned, maxPoints: max, checks: catResults };
  }
  return catScores;
}

function computeTopActions(results) {
  const failed = results.filter(r => !r.pass);
  const byCategory = {};
  for (const f of failed) {
    if (!byCategory[f.category]) byCategory[f.category] = { count: 0, items: [] };
    byCategory[f.category].count++;
    byCategory[f.category].items.push(f);
  }

  const actions = [];
  for (const [cat, info] of Object.entries(byCategory)) {
    const catDef = CATEGORIES.find(c => c.key === cat);
    for (const item of info.items) {
      const action = describeAction(item);
      actions.push({ category: catDef?.name || cat, action: action.text, path: item.path, priority: action.priority });
    }
  }

  actions.sort((a, b) => b.priority - a.priority);
  return actions.slice(0, 3).map(a => ({ category: a.category, action: a.action, path: a.path }));
}

function describeAction(check) {
  const suggestions = {
    tool_custom_agents: { text: 'Create custom opencode agents for project automation', priority: 3 },
    tool_custom_commands: { text: 'Add project-level commands to .opencode/commands/', priority: 3 },
    tool_custom_skills: { text: 'Add project-specific skills to ~/.config/opencode/skills/', priority: 2 },
    tool_mcp_configured: { text: 'Configure MCP servers in opencode.json', priority: 3 },
    tool_agents_structure: { text: 'Create .agents/ with reference docs, plans, and tasks', priority: 3 },
    ctx_project_memory: { text: 'Add project memory file at .opencode/memory/project.md', priority: 3 },
    ctx_memory_md: { text: 'Populate .agents/memory.md with project context', priority: 3 },
    ctx_reports_dir: { text: 'Start saving reports to .agents/report/', priority: 2 },
    ctx_plans_dir: { text: 'Add plan files to .agents/plans/', priority: 2 },
    ctx_memory_infra: { text: 'Set up .opencode/memory/ + .agents/report/ for memory persistence', priority: 3 },
    qg_ci_cd: { text: 'Set up CI/CD pipeline in .github/workflows/', priority: 3 },
    qg_husky: { text: 'Add Husky pre-commit hook for code quality', priority: 3 },
    qg_lint: { text: 'Add lint script to package.json', priority: 3 },
    qg_build: { text: 'Add build script to package.json', priority: 3 },
    qg_format: { text: 'Configure formatter (Prettier) in package.json', priority: 2 },
    mem_obsidian: { text: 'Create and populate Obsidian vault at obsidian-vault/boss-project/', priority: 3 },
    mem_postmortem: { text: 'Write post-mortem reports to .agents/post-mortem/', priority: 2 },
    mem_plans: { text: 'Store implementation plans in .agents/plans/', priority: 2 },
    mem_structured: { text: 'Add structured ## sections to .agents/memory.md', priority: 2 },
    mem_backups: { text: 'Enable memory backups in .agents/backups/', priority: 1 },
    eval_framework: { text: 'Add test framework (vitest) script to package.json', priority: 3 },
    eval_test_files: { text: 'Create test files under tests/ matching vitest config', priority: 3 },
    eval_verify_agent: { text: 'Create a VERIFY agent for pre-completion gates', priority: 3 },
    eval_config: { text: 'Add vitest or jest config file for test settings', priority: 2 },
    eval_coverage_config: { text: 'Add testTimeout or coverage settings to test config', priority: 1 },
    sec_bash_perms: { text: 'Add granular bash permissions in opencode.json', priority: 3 },
    sec_pre_tool_hooks: { text: 'Add PreToolUse hooks in .agents/settings.json', priority: 3 },
    sec_edit_perms: { text: 'Restrict edit permissions in opencode.json', priority: 3 },
    sec_secret_patterns: { text: 'Add secret file pattern denials in .agents/settings.json', priority: 3 },
    sec_external_dir: { text: 'Scope external_directory access in opencode.json', priority: 2 },
    cost_db_pool: { text: 'Add maxPoolSize to DB connection config', priority: 2 },
    cost_docker_limits: { text: 'Add memory limits to docker-compose.yml services', priority: 2 },
    cost_bundle_analysis: { text: 'Add bundle analysis script to package.json', priority: 2 },
    cost_cache_ci: { text: 'Add npm caching to CI workflow', priority: 2 },
    cost_no_bloat: { text: 'Add lint-staged configuration for selective checks', priority: 1 },
  };
  return suggestions[check.id] || { text: `Fix: ${check.label}`, priority: 1 };
}

function formatText(scores, allResults, topActions, overall, maxScore, activeKeys) {
  const lines = [];
  lines.push(`Harness Audit: ${overall}/${maxScore}`);
  lines.push('');

  for (const cat of CATEGORIES.filter(c => activeKeys.includes(c.key))) {
    const s = scores[cat.key];
    const passes = s.checks.filter(c => c.pass).length;
    const total = s.checks.length;
    const bar = '▓'.repeat(Math.round(s.score)) + '░'.repeat(10 - Math.round(s.score));
    lines.push(`  ${cat.name.padEnd(22)} ${s.score.toFixed(1).padStart(4)}/10  ${bar}  (${s.points}/${s.maxPoints} pts, ${passes}/${total} checks)`);
  }

  const failed = allResults.filter(r => !r.pass);
  if (failed.length > 0) {
    lines.push('');
    lines.push('Failed Checks:');
    for (const f of failed) {
      lines.push(`  - [${CATEGORIES.find(c => c.key === f.category)?.name || f.category}] ${f.label} (${f.path || '?'})`);
    }
  }

  if (topActions.length > 0) {
    lines.push('');
    lines.push('Top 3 Actions:');
    topActions.forEach((a, i) => {
      lines.push(`  ${i + 1}) [${a.category}] ${a.action} (${a.path})`);
    });
  }

  lines.push('');
  lines.push(`Suggested ECC Skills: ${SKILLS_LIST.join(', ')}`);

  return lines.join('\n');
}

function formatJSON(scores, allResults, topActions, overall, maxScore, scope, activeKeys) {
  const cats = CATEGORIES.filter(c => activeKeys.includes(c.key)).map(cat => {
    const s = scores[cat.key];
    return {
      name: cat.name,
      score: s.score,
      max: 10,
      points: s.points,
      maxPoints: s.maxPoints,
      checks: s.checks.map(c => ({
        id: c.id,
        label: c.label,
        pass: c.pass,
        path: c.path,
        detail: c.detail,
      })),
    };
  });

  return JSON.stringify({
    rubric_version: RUBRIC_VERSION,
    scope,
    overall_score: overall,
    max_score: maxScore,
    categories: cats,
    failed_checks: allResults.filter(r => !r.pass).map(f => ({
      category: CATEGORIES.find(c => c.key === f.category)?.name || f.category,
      check: f.id,
      label: f.label,
      path: f.path,
    })),
    top_actions: topActions,
    suggested_skills: SKILLS_LIST,
  }, null, 2);
}

function resolveScope(argv) {
  const scopes = ['repo', 'hooks', 'skills', 'commands', 'agents'];
  const scopeArg = argv.find(a => scopes.includes(a));
  return scopeArg || 'repo';
}

function getFormat(argv) {
  if (argv.includes('--format')) {
    const idx = argv.indexOf('--format');
    if (idx + 1 < argv.length) {
      const val = argv[idx + 1];
      if (val === 'json' || val === 'text') return val;
    }
  }
  return 'text';
}

function getRoot(argv) {
  if (argv.includes('--root')) {
    const idx = argv.indexOf('--root');
    if (idx + 1 < argv.length) return path.resolve(argv[idx + 1]);
  }
  return process.cwd();
}

function main() {
  const argv = process.argv.slice(2);
  const scope = resolveScope(argv);
  const format = getFormat(argv);
  const root = getRoot(argv);

  const allResults = runChecks(root);

  const scopedCategories = {
    repo: CATEGORIES.map(c => c.key),
    hooks: ['qg', 'sec'],
    skills: ['tool', 'ctx'],
    commands: ['tool'],
    agents: ['tool', 'mem'],
  };

  const activeKeys = scopedCategories[scope] || CATEGORIES.map(c => c.key);
  const activeCatDefs = CATEGORIES.filter(c => activeKeys.includes(c.key));
  const scopedResults = allResults.filter(r => activeKeys.includes(r.category));
  const scores = computeScores(scopedResults, scope);

  const maxScore = activeCatDefs.reduce((sum, c) => sum + c.maxPoints, 0);
  const overall = activeCatDefs.reduce((sum, c) => sum + (scores[c.key]?.points || 0), 0);

  const topActions = computeTopActions(scopedResults);

  if (format === 'json') {
    console.log(formatJSON(scores, scopedResults, topActions, overall, maxScore, scope, activeKeys));
  } else {
    console.log(formatText(scores, scopedResults, topActions, overall, maxScore, activeKeys));
  }
}

main();
