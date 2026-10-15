#!/usr/bin/env node
// check-mod.mjs — run every static check a Claude Code mod can get without a session.
//
//   node check-mod.mjs <mod-dir> [--types <claude-code.d.ts>] [--skip-tsc] [--skip-test] [--json]
//
// 1. claude plugin validate   (manifest, hooks module scan, state contract)
// 2. tsc                      (strict type-check against this build's declarations)
// 3. claude plugin test       (the mod's *.test.ts / *.test.tsx files)
//
// The mod is copied to a temp folder first, so nothing is written into it. A folder named
// `_claude-plugin` (how the forge stores examples) is renamed to `.claude-plugin` in the copy.
// The tsconfig lives outside the mod, so the check never leaves files behind.
//
// Types are looked up in this order: --types, <mod>/.claude-plugin/types/claude-code/index.d.ts
// (written by Claude Code once the mod has loaded), then the newest plugin-authoring skill copy
// under the system temp folder. Without types the tsc step is reported as skipped, never as passed.

import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const option = name => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const modArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--types')
if (!modArg) {
  console.error('usage: node check-mod.mjs <mod-dir> [--types <claude-code.d.ts>] [--skip-tsc] [--skip-test] [--json]')
  process.exit(2)
}

const modDir = resolve(modArg)
if (!existsSync(modDir)) {
  console.error(`not found: ${modDir}`)
  process.exit(2)
}

const isWindows = process.platform === 'win32'
const run = (cmd, cmdArgs, cwd) => {
  const r = spawnSync(cmd, cmdArgs, { cwd, encoding: 'utf8', shell: isWindows, timeout: 300_000 })
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() }
}

// ── copy to a scratch folder ────────────────────────────────────────────────
const work = mkdtempSync(join(tmpdir(), 'mod-check-'))
const copy = join(work, 'mod')
cpSync(modDir, copy, {
  recursive: true,
  filter: src => !/[\\/](node_modules|\.git)([\\/]|$)/.test(src),
})
if (existsSync(join(copy, '_claude-plugin')) && !existsSync(join(copy, '.claude-plugin'))) {
  renameSync(join(copy, '_claude-plugin'), join(copy, '.claude-plugin'))
}

// ── find the declarations ──────────────────────────────────────────────────
function newestBundledTypes() {
  const roots = [join(tmpdir(), 'claude', 'bundled-skills')]
  let best
  for (const root of roots) {
    if (!existsSync(root)) continue
    for (const version of readdirSync(root)) {
      const vdir = join(root, version)
      if (!statSync(vdir).isDirectory()) continue
      for (const hash of readdirSync(vdir)) {
        const file = join(vdir, hash, 'plugin-authoring', 'types', 'claude-code.d.ts')
        if (existsSync(file)) {
          const t = statSync(file).mtimeMs
          if (!best || t > best.t) best = { file, t }
        }
      }
    }
  }
  return best?.file
}
const types =
  option('--types') ??
  [join(modDir, '.claude-plugin', 'types', 'claude-code', 'index.d.ts')].find(existsSync) ??
  newestBundledTypes()

const results = []

// ── 1. validate ────────────────────────────────────────────────────────────
const v = run('claude', ['plugin', 'validate', copy], work)
const validatePassed = v.code === 0 && /Validation passed/.test(v.out)
results.push({
  step: 'validate',
  status: validatePassed ? 'pass' : 'fail',
  detail: v.out
    .split('\n')
    .filter(l => /❯|✘|✔|error|warning/i.test(l))
    .map(l => l.replace(copy, '<mod>'))
    .join('\n'),
})

// ── 2. tsc ─────────────────────────────────────────────────────────────────
if (flag('--skip-tsc')) {
  results.push({ step: 'tsc', status: 'skipped', detail: '--skip-tsc' })
} else if (!types) {
  results.push({ step: 'tsc', status: 'skipped', detail: 'no claude-code.d.ts found; load plugin-authoring or pass --types' })
} else {
  const include = [types, 'hooks', 'types', 'tests', 'lib', 'src']
    .filter(p => p === types || existsSync(join(copy, p)))
    .map(p => (p === types ? p.replace(/\\/g, '/') : `${copy.replace(/\\/g, '/')}/${p}`))
  const tsconfig = {
    compilerOptions: {
      target: 'es2023', lib: ['es2023'], types: [], module: 'esnext', moduleResolution: 'bundler',
      strict: true, noUncheckedIndexedAccess: true, noEmit: true, skipLibCheck: true, allowJs: true, checkJs: false,
      jsx: 'react', jsxFactory: 'h', jsxFragmentFactory: 'Fragment',
    },
    include,
  }
  writeFileSync(join(work, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))
  const t = run('npx', ['-y', '-p', 'typescript@5.6.3', 'tsc', '-p', work], work)
  results.push({
    step: 'tsc',
    status: t.code === 0 ? 'pass' : 'fail',
    detail: t.code === 0 ? `0 errors (types: ${types})` : t.out.split(copy).join('<mod>'),
  })
}

// ── 3. plugin test ─────────────────────────────────────────────────────────
const hasTests = (() => {
  const walk = d =>
    readdirSync(d, { withFileTypes: true }).some(e =>
      e.isDirectory() ? !['node_modules', '.git', '.claude-plugin'].includes(e.name) && walk(join(d, e.name)) : /\.test\.tsx?$/.test(e.name),
    )
  return walk(copy)
})()
if (flag('--skip-test')) {
  results.push({ step: 'test', status: 'skipped', detail: '--skip-test' })
} else if (!hasTests) {
  results.push({ step: 'test', status: 'skipped', detail: 'no *.test.ts files in the mod' })
} else {
  const p = run('claude', ['plugin', 'test', copy], work)
  const summary = p.out.split('\n').filter(l => /^\((pass|fail)\)|^\s*\d+ (pass|fail)|Ran \d+ test/.test(l.trim())).join('\n')
  results.push({ step: 'test', status: p.code === 0 ? 'pass' : 'fail', detail: p.code === 0 ? summary : p.out.split(copy).join('<mod>') })
}

rmSync(work, { recursive: true, force: true })

// ── report ─────────────────────────────────────────────────────────────────
const failed = results.some(r => r.status === 'fail')
if (flag('--json')) {
  console.log(JSON.stringify({ mod: modDir, ok: !failed, results }, null, 2))
} else {
  console.log(`mod: ${modDir}`)
  for (const r of results) {
    const mark = r.status === 'pass' ? '✔' : r.status === 'fail' ? '✘' : '–'
    console.log(`\n${mark} ${r.step}: ${r.status}`)
    if (r.detail) console.log(r.detail.replace(/^/gm, '    '))
  }
  console.log(`\n${failed ? '✘ checks failed' : '✔ all checks that ran passed'}`)
}
process.exit(failed ? 1 : 0)
