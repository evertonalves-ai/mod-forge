#!/usr/bin/env node
// check-mod.mjs — run every static check a Claude Code mod can get without a session.
//
//   node check-mod.mjs <mod-dir> [--types <claude-code.d.ts | types folder>] [--skip-tsc] [--skip-test] [--json]
//
// 1. claude plugin validate   (manifest, hooks module scan, state contract)
// 2. tsc                      (strict type-check against this build's declarations; TypeScript 5.9.3)
// 3. claude plugin test       (the mod's *.test.ts / *.test.tsx files)
//
// The mod is copied to a temp folder first, so nothing is written into it. A folder named
// `_claude-plugin` (how the forge stores examples) is renamed to `.claude-plugin` in the copy.
// The tsconfig lives outside the mod, so the check never leaves files behind; the temp folder is
// removed even when a step throws.
//
// Types are looked up in this order: --types, the whole <mod>/.claude-plugin/types/ folder (laid out
// by Claude Code once the mod has loaded: claude-code/, claude-code-tools/, claude-code-mcp/ and
// dependency contracts), then the newest plugin-authoring skill copy under the system temp folder.
// Without types the tsc step is reported as skipped, never as passed. TypeScript 5.6-5.8 report a
// false TS2589 ("excessively deep") on the laid-out folder; 5.9.3 does not.

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
  console.error('usage: node check-mod.mjs <mod-dir> [--types <claude-code.d.ts | types folder>] [--skip-tsc] [--skip-test] [--json]')
  process.exit(2)
}

const modDir = resolve(modArg)
if (!existsSync(modDir)) {
  console.error(`not found: ${modDir}`)
  process.exit(2)
}

// On Windows `claude` and `npx` are often .cmd shims, which need a shell; the shell joins the
// arguments with spaces and does not quote them, so a path with a space (C:\Users\Joao Silva\...)
// would be split. Quote every argument that needs it. Paths cannot contain `"` on Windows.
const isWindows = process.platform === 'win32'
const quote = a => (/[\s"&|<>^()%!,;=]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)
const run = (cmd, cmdArgs, cwd) => {
  const r = spawnSync(cmd, isWindows ? cmdArgs.map(quote) : cmdArgs, { cwd, encoding: 'utf8', shell: isWindows, timeout: 300_000 })
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim()
  // r.error: the command could not start (ENOENT: not on PATH) or timed out; say so instead of nothing.
  if (r.error) return { code: 1, out: `${cmd} could not run: ${r.error.code ?? r.error.message}${out ? `\n${out}` : ''}` }
  return { code: r.status ?? 1, out }
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

// A failed step whose filtered output is empty shows the raw output instead, so "not on PATH" or a
// crash is never reported as a bare failure.
const detailOf = (out, keep) => {
  const kept = out.split('\n').filter(keep).join('\n')
  return kept === '' ? out : kept
}

function checkAll(work, copy) {
  const results = []

  // ── copy to the scratch folder ───────────────────────────────────────────
  cpSync(modDir, copy, {
    recursive: true,
    filter: src => !/[\\/](node_modules|\.git)([\\/]|$)/.test(src),
  })
  if (existsSync(join(copy, '_claude-plugin')) && !existsSync(join(copy, '.claude-plugin'))) {
    renameSync(join(copy, '_claude-plugin'), join(copy, '.claude-plugin'))
  }

  // Once the mod has loaded, Claude Code lays the types out as a folder: claude-code/ (the API),
  // claude-code-tools/ (built-in tool inputs, which narrow e.file_path, e.command, ...), claude-code-mcp/
  // and the contracts of dependencies. Use the whole folder: one file alone gives false tsc errors.
  const laidOut = join(copy, '.claude-plugin', 'types')
  const types =
    option('--types') ??
    (existsSync(join(laidOut, 'claude-code', 'index.d.ts')) ? laidOut : undefined) ??
    newestBundledTypes()
  const typesLabel = types === laidOut ? '<mod>/.claude-plugin/types/ (whole folder)' : types

  // ── 1. validate ──────────────────────────────────────────────────────────
  const v = run('claude', ['plugin', 'validate', copy], work)
  const validatePassed = v.code === 0 && /Validation passed/.test(v.out)
  results.push({
    step: 'validate',
    status: validatePassed ? 'pass' : 'fail',
    detail: detailOf(v.out, l => /❯|✘|✔|error|warning/i.test(l)).split(copy).join('<mod>'),
  })

  // ── 2. tsc ───────────────────────────────────────────────────────────────
  if (flag('--skip-tsc')) {
    results.push({ step: 'tsc', status: 'skipped', detail: '--skip-tsc' })
  } else if (!types) {
    results.push({ step: 'tsc', status: 'skipped', detail: 'no claude-code.d.ts found; load plugin-authoring or pass --types' })
  } else {
    // --types may be one .d.ts or a laid-out folder; a folder is included whole (every .d.ts in it).
    const typesInclude = resolve(types).replace(/\\/g, '/')
    const include = [typesInclude, 'hooks', 'types', 'tests', 'lib', 'src']
      .filter(p => p === typesInclude || existsSync(join(copy, p)))
      .map(p => (p === typesInclude ? p : `${copy.replace(/\\/g, '/')}/${p}`))
    const tsconfig = {
      compilerOptions: {
        target: 'es2023', lib: ['es2023'], types: [], module: 'esnext', moduleResolution: 'bundler',
        strict: true, noUncheckedIndexedAccess: true, noEmit: true, skipLibCheck: true, allowJs: true, checkJs: false,
        jsx: 'react', jsxFactory: 'h', jsxFragmentFactory: 'Fragment',
      },
      include,
    }
    writeFileSync(join(work, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))
    const t = run('npx', ['-y', '-p', 'typescript@5.9.3', 'tsc', '-p', work], work)
    results.push({
      step: 'tsc',
      status: t.code === 0 ? 'pass' : 'fail',
      detail: t.code === 0 ? `0 errors (types: ${typesLabel})` : t.out.split(copy).join('<mod>'),
    })
  }

  // ── 3. plugin test ───────────────────────────────────────────────────────
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
  return results
}

// The temp folder goes away even when a step throws (a copy error, a full disk).
const work = mkdtempSync(join(tmpdir(), 'mod-check-'))
let results
try {
  results = checkAll(work, join(work, 'mod'))
} catch (error) {
  results = [{ step: 'checker', status: 'fail', detail: error instanceof Error ? error.message : String(error) }]
} finally {
  rmSync(work, { recursive: true, force: true })
}

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
