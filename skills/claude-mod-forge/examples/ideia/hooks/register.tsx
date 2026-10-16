import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Busy, IdeiaEvent, Language, Pair, Suggestion, View, Who } from '../types'
import { buildDoc, previewOf } from './doc'
import { clampRounds, currentRound, fold, isoDate, nextAction, pairFor, parseEvents, parseModFit, parseStatus, slug, toJsonl } from './flow'
import { compact, language, strings } from './i18n'
import type { Strings } from './i18n'
import { fallbackSuggestion, pairsFor, parseCustomPair, parseSuggestion } from './pairs'
import {
  CHECKER_SYSTEM, WRITER_SYSTEM, checkerPrompt, messagePrompt, revisePrompt, sideOf, sideSystem, suggestPrompt, summaryPrompt, writerPrompt,
} from './prompts'

// Two thinkers refine an idea by dialogue. Each message is one $.model.complete call: no tools,
// so the thinkers can read and change nothing. The mod alone writes, and only dialogue.jsonl and
// ideia.md inside <folder>/<date-slug>/. The flow's decisions live in flow.ts (pure).
const PANE = 'ideia'
const LAST = 'ideia:last'
const MSG_TOKENS = 700
const SMALL_TOKENS = 300
const DOC_TOKENS = 3000
const TIMEOUT_MS = 120_000
const SMALL_MODEL = 'haiku'

const view = atom({ plugin: 'ideia', key: 'view' } as const, 'idle')
const events = atom({ plugin: 'ideia', key: 'events' } as const, [])
const dir = atom({ plugin: 'ideia', key: 'dir' } as const, '')
const suggestion = atom({ plugin: 'ideia', key: 'suggestion' } as const, null)
const menu = atom({ plugin: 'ideia', key: 'menu' } as const, '')
const busy = atom({ plugin: 'ideia', key: 'busy' } as const, '')
const error = atom({ plugin: 'ideia', key: 'error' } as const, '')
const tokens = atom({ plugin: 'ideia', key: 'tokens' } as const, 0)
const resumeDir = atom({ plugin: 'ideia', key: 'resumeDir' } as const, '')
const resumeEvents = atom({ plugin: 'ideia', key: 'resumeEvents' } as const, [])
const isPausing = atom({ plugin: 'ideia', key: 'isPausing' } as const, false)
const preview = atom({ plugin: 'ideia', key: 'preview' } as const, '')

// The runner's controls. Module state: one runner per session.
let isRunning = false
let advance = false
let wantsPause = false
let wantsFinish = false
let stop: AbortController | null = null

class Failure extends Error {}

type Ctx = { t: Strings; lang: Language; folder: string; maxRounds: number; pauses: boolean; model: string; obsidian: boolean }

const join = (a: string, b: string) => `${a.replace(/[\\/]+$/, '')}/${b}`
const setView = ($: EngineInterface, v: View) => update($, view, () => v)

async function ts($: EngineInterface): Promise<string> {
  return new Date(await $.clock.now()).toISOString()
}

async function save($: EngineInterface, ctx: Ctx) {
  const folder = await read($, dir)
  try {
    await $.fs.write(join(folder, 'dialogue.jsonl'), toJsonl(await read($, events)))
  } catch {
    throw new Failure(ctx.t.writeFailed)
  }
}

async function append($: EngineInterface, ctx: Ctx, event: IdeiaEvent) {
  await update($, events, list => [...list, event])
  await save($, ctx)
}

// One completion. Resolves the text, or null when the user cut it with "finish now".
async function complete($: EngineInterface, ctx: Ctx, req: { system: string; prompt: string; model: string; maxTokens: number }): Promise<string | null> {
  stop = new AbortController()
  const r = await $.model.complete({ ...req, timeoutMs: TIMEOUT_MS }, { signal: stop.signal })
  stop = null
  await update($, tokens, n => n + r.usage.input_tokens + r.usage.output_tokens)
  if (r.isAnswered) return r.text
  if (r.reason === 'aborted' && wantsFinish) return null
  if (r.reason === 'api-error') throw new Failure(ctx.t.apiError(String(r.error)))
  if (r.reason === 'empty-reply') throw new Failure(ctx.t.emptyReply)
  throw new Failure(ctx.t.aborted)
}

async function setBusy($: EngineInterface, b: Busy) {
  await update($, busy, () => b)
}

async function writeDoc($: EngineInterface, ctx: Ctx) {
  await setView($, 'finishing')
  const convo = fold(await read($, events))
  await setBusy($, 'writer')
  let doc = (await complete($, ctx, { system: WRITER_SYSTEM, prompt: writerPrompt(convo, ctx.lang), model: ctx.model, maxTokens: DOC_TOKENS })) ?? ''
  await setBusy($, 'checker')
  const check = parseModFit((await complete($, ctx, { system: CHECKER_SYSTEM, prompt: checkerPrompt(convo, doc, ctx.lang), model: ctx.model, maxTokens: SMALL_TOKENS * 2 })) ?? 'OK')
  if (!/^ok\.?$/i.test(check.text)) {
    await setBusy($, 'writer')
    doc = (await complete($, ctx, { system: WRITER_SYSTEM, prompt: revisePrompt(convo, doc, check.text, ctx.lang), model: ctx.model, maxTokens: DOC_TOKENS })) ?? doc
  }
  const folder = await read($, dir)
  const path = join(folder, 'ideia.md')
  try {
    await $.fs.write(path, buildDoc(doc, convo, ctx.lang, { obsidian: ctx.obsidian, date: isoDate(await $.clock.now()) }))
  } catch {
    throw new Failure(ctx.t.writeFailed)
  }
  await update($, preview, () => previewOf(doc, ctx.lang))
  await append($, ctx, { type: 'doc', path, isModFit: check.isModFit, ts: await ts($) })
  await setView($, 'done')
}

// Drives the dialogue until it needs the user (round end, pause, done) or fails.
async function run($: EngineInterface, ctx: Ctx) {
  if (isRunning) return
  isRunning = true
  try {
    await setView($, 'running')
    for (;;) {
      const convo = fold(await read($, events))
      if (wantsFinish) {
        if (!convo.doc) await writeDoc($, ctx)
        wantsFinish = false
        return
      }
      const action = nextAction(convo, { maxRounds: ctx.maxRounds, advance: advance || !ctx.pauses })
      if (action.kind === 'choose') return void (await setView($, 'choosing'))
      if (action.kind === 'done') return void (await setView($, 'done'))
      if (action.kind === 'roundEnd') return void (await setView($, 'roundEnd'))
      if (action.kind === 'write') {
        await writeDoc($, ctx)
        return
      }
      if (wantsPause) {
        wantsPause = false
        await update($, isPausing, () => false)
        return void (await setView($, 'paused'))
      }
      if (action.kind === 'summarize') {
        await setBusy($, 'summary')
        const text = await complete($, ctx, { system: '', prompt: summaryPrompt(convo, action.round, ctx.lang), model: SMALL_MODEL, maxTokens: SMALL_TOKENS })
        if (text !== null) await append($, ctx, { type: 'summary', round: action.round, text: text.trim(), ts: await ts($) })
        continue
      }
      // speak
      if (action.position === 'open') advance = false
      const pair = pairFor(convo, action.round)?.pair
      if (!pair) return void (await setView($, 'choosing'))
      await setBusy($, action.side)
      const reply = await complete($, ctx, {
        system: sideSystem(pair, action.side, ctx.lang),
        prompt: messagePrompt(convo, action.side, action.round, action.position, ctx.maxRounds),
        model: ctx.model,
        maxTokens: MSG_TOKENS,
      })
      if (reply === null) continue
      const { text, isReady } = parseStatus(reply)
      const other: Who = action.side === 'A' ? 'B' : 'A'
      await append($, ctx, {
        type: 'msg', side: action.side, round: action.round, position: action.position, text, isReady,
        from: `${action.side} · ${sideOf(pair, action.side).lens}`, to: `${other} · ${sideOf(pair, other).lens}`, kind: 'note', ts: await ts($),
      })
    }
  } catch (cause) {
    await update($, error, () => (cause instanceof Failure ? cause.message : ctx.t.aborted))
    await setView($, 'error')
  } finally {
    isRunning = false
    stop = null
    await setBusy($, '')
  }
}

async function suggest($: EngineInterface, ctx: Ctx, idea: string) {
  await update($, suggestion, () => null)
  await setBusy($, 'suggest')
  let picked: Suggestion
  try {
    const r = await $.model.complete({ model: SMALL_MODEL, prompt: suggestPrompt(idea, ctx.lang), maxTokens: SMALL_TOKENS, timeoutMs: TIMEOUT_MS })
    await update($, tokens, n => n + r.usage.input_tokens + r.usage.output_tokens)
    picked = r.isAnswered ? parseSuggestion(r.text, ctx.lang) : fallbackSuggestion(ctx.lang)
  } catch {
    picked = fallbackSuggestion(ctx.lang)
  }
  await update($, suggestion, () => picked)
  await setBusy($, '')
}

function reset() {
  advance = false
  wantsPause = false
  wantsFinish = false
}

async function startIdea($: EngineInterface, ctx: Ctx, raw: string) {
  const idea = raw.replace(/\s+/g, ' ').trim().slice(0, 2000)
  if (idea === '') return
  reset()
  const base = slug(idea, isoDate(await $.clock.now()))
  let name = base
  for (let i = 2; await $.fs.exists(join(join(ctx.folder, name), 'dialogue.jsonl')); i += 1) name = `${base}-${i}`
  const folder = join(ctx.folder, name)
  await update($, dir, () => folder)
  await update($, events, () => [])
  await update($, tokens, () => 0)
  await update($, error, () => '')
  await update($, menu, () => '')
  await setView($, 'choosing')
  try {
    await append($, ctx, { type: 'start', idea, ts: await ts($) })
    await $.store.set(LAST, folder)
  } catch (cause) {
    await update($, error, () => (cause instanceof Failure ? cause.message : ctx.t.writeFailed))
    return void (await setView($, 'error'))
  }
  await suggest($, ctx, idea)
}

// Choosing a pair: for round 1 it starts the dialogue; later, it takes effect at the next round.
async function choosePair($: EngineInterface, ctx: Ctx, pair: Pair, why: string) {
  const convo = fold(await read($, events))
  const round = convo.pairs.length === 0 ? 1 : currentRound(convo) + 1
  await update($, menu, () => '')
  const at = await ts($)
  if (!(await guarded($, ctx, () => append($, ctx, { type: 'pair', round, pair, why, ts: at })))) return
  if (round === 1) void run($, ctx)
}

// A write that fails outside the runner shows the error state instead of a silent rejection.
async function guarded($: EngineInterface, ctx: Ctx, work: () => Promise<void>): Promise<boolean> {
  try {
    await work()
    return true
  } catch (cause) {
    await update($, error, () => (cause instanceof Failure ? cause.message : ctx.t.writeFailed))
    await setView($, 'error')
    return false
  }
}

async function comment($: EngineInterface, ctx: Ctx, raw: string) {
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, 1000)
  if (text === '') return
  const convo = fold(await read($, events))
  const at = await ts($)
  await guarded($, ctx, () => append($, ctx, { type: 'comment', round: currentRound(convo), text, from: 'you', to: 'A, B', kind: 'note', ts: at }))
}

// Last conversation without a document, for the resume offer.
const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()

async function findUnfinished($: EngineInterface, ctx: Ctx): Promise<{ folder: string; list: IdeiaEvent[] } | undefined> {
  try {
    const folder = await $.store.get(LAST)
    if (typeof folder !== 'string' || folder === '') return undefined
    // Only a subfolder of the configured folder, so a changed setting never writes elsewhere.
    const rest = norm(folder).slice(norm(ctx.folder).length)
    if (!norm(folder).startsWith(`${norm(ctx.folder)}/`) || !/^\/[a-z0-9-]+$/.test(rest)) return undefined
    const file = join(folder, 'dialogue.jsonl')
    if (!(await $.fs.exists(file))) return undefined
    const list = parseEvents(await $.fs.read(file))
    const convo = fold(list)
    return convo.idea !== '' && !convo.doc ? { folder, list } : undefined
  } catch {
    return undefined
  }
}

export const register: Register = (on, options) => {
  const t = strings(options.language)
  const ctx: Ctx = {
    t,
    lang: language(options.language),
    folder: String(options.folder ?? '').trim(),
    maxRounds: clampRounds(options.rounds ?? 4),
    pauses: options.pause !== false,
    model: ['sonnet', 'opus', 'haiku'].includes(String(options.model)) ? String(options.model) : 'sonnet',
    obsidian: options.obsidian === true,
  }

  on('session.start', async ($, e, next) => {
    // A reload ends the runner; a conversation that was mid-flight waits for "resume".
    const v = await read($, view)
    if (v === 'running' || v === 'finishing') await setView($, 'paused')
    await setBusy($, '')
    // A suggestion cut by the reload is asked again, so the choice never waits forever.
    const idea = fold(await read($, events)).idea
    if (v === 'choosing' && idea !== '' && (await read($, suggestion)) === null) void suggest($, ctx, idea)
    try {
      await $.command.register({ name: 'ideia', description: t.commandDescription, argumentHint: '[idea]', immediate: true })
    } catch {
      // name taken
    }
    return next(e)
  })

  on('command.run', { command: 'ideia' }, async ($, e) => {
    const idea = e.args.trim()
    const v = await read($, view)
    const isActive = (await read($, events)).length > 0 && v !== 'done' && v !== 'idle'
    if (ctx.folder === '') await setView($, 'setup')
    else if (isActive) {
      // one conversation per session: show it
    } else if (idea !== '') {
      void startIdea($, ctx, idea)
    } else {
      const found = await findUnfinished($, ctx)
      if (found) {
        await update($, resumeDir, () => found.folder)
        await update($, resumeEvents, () => found.list)
        await setView($, 'resume')
      } else await setView($, 'ask')
    }
    const opened = await $.ui.open({ id: PANE, title: t.paneTitle, focus: true })
    if (!opened.isPlaced) return { text: ctx.folder === '' ? t.noFolder : t.noSurface }
    return isActive && idea !== '' ? { text: t.running } : {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const canType = e.surface !== 'mobile' && 'Input' in ui
    const canPick = e.surface !== 'mobile' && 'Select' in ui
    const v = ctx.folder === '' ? 'setup' : await read($, view)
    const list = await read($, events)
    const convo = fold(list)
    const round = currentRound(convo)
    const pair = pairFor(convo, round)?.pair
    const upcoming = convo.pairs.find(p => p.round > round)
    const b = await read($, busy)
    const used = await read($, tokens)
    const m = await read($, menu)

    const button = (key: string, label: string, hotkey: string, onPress: () => unknown) => (
      <Button key={key} label={label} hotkey={hotkey} plain onPress={onPress} />
    )
    const pairMenu = () => (
      <Box flexDirection="column">
        {m === 'pick' && canPick && (
          <ui.Select
            key="pair"
            label={t.pairLabel}
            value=""
            options={pairsFor(ctx.lang).map(p => ({ value: p.id, label: `${p.a.lens} × ${p.b.lens} · ${p.bestFor}` }))}
            onSelect={id => {
              const chosen = pairsFor(ctx.lang).find(p => p.id === id)
              if (chosen) void choosePair($, ctx, chosen, '')
            }}
          />
        )}
        {m === 'custom' && canType && (
          <ui.Input
            key="custom-pair"
            label={t.customLabel}
            placeholder={t.customPlaceholder}
            value=""
            submitLabel={t.customSubmit}
            onSubmit={async text => {
              const parsed = parseCustomPair(text, ctx.lang)
              if ('error' in parsed) return void (await update($, error, () => parsed.error))
              await update($, error, () => '')
              await choosePair($, ctx, parsed, '')
            }}
          />
        )}
      </Box>
    )
    const commentBox = canType && (
      <ui.Input
        key="comment"
        label={t.commentLabel}
        placeholder={t.commentPlaceholder}
        value=""
        submitLabel={t.commentSubmit}
        onSubmit={text => comment($, ctx, text)}
      />
    )
    const status =
      b === 'suggest' ? t.suggesting
      : b === 'A' || b === 'B' ? t.thinking(pair ? `${b} · ${sideOf(pair, b).lens}` : b)
      : b === 'summary' ? t.summarizing
      : b === 'writer' ? t.writing
      : b === 'checker' ? t.checking
      : v === 'paused' ? t.paused
      : ''
    const rows = Math.max(4, Math.floor((e.props.scroll.bodyRows - 10) / 3))
    const shown = convo.entries.slice(-rows)
    const problem = await read($, error)

    return (
      <Box flexDirection="column" paddingX={1} gap={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">
            {[t.heading, convo.pairs.length > 0 ? t.round(round, ctx.maxRounds) : '', pair ? `${pair.a.lens} × ${pair.b.lens}` : '']
              .filter(s => s !== '')
              .join(' · ')}
          </Text>
          <Text dimColor>{[status, used > 0 ? t.tokens(compact(used)) : ''].filter(s => s !== '').join(' · ')}</Text>
        </Box>

        {v === 'setup' && <Text color="warning">{t.noFolder}</Text>}

        {(v === 'ask' || v === 'idle') &&
          (canType ? (
            <ui.Input key="idea" label={t.ideaLabel} placeholder={t.ideaPlaceholder} value="" submitLabel={t.ideaSubmit} onSubmit={text => startIdea($, ctx, text)} />
          ) : (
            <Text dimColor>{t.ideaPlaceholder}</Text>
          ))}

        {v === 'resume' && (
          <Box flexDirection="column" gap={1}>
            <Text>{await (async () => {
              const old = fold(await read($, resumeEvents))
              return t.resumeText(currentRound(old), old.idea)
            })()}</Text>
            <Box gap={2}>
              {button('resume', t.resume, 'r', async () => {
                reset()
                const folder = await read($, resumeDir)
                await update($, dir, () => folder)
                const saved = await read($, resumeEvents)
                await update($, events, () => saved)
                if (fold(saved).pairs.length === 0) {
                  await setView($, 'choosing')
                  await suggest($, ctx, fold(saved).idea)
                } else void run($, ctx)
              })}
              {button('fresh', t.fresh, 'n', () => setView($, 'ask'))}
            </Box>
          </Box>
        )}

        {v === 'choosing' && (
          <Box flexDirection="column" gap={1}>
            <Text dimColor>{`“${convo.idea}”`}</Text>
            {await (async () => {
              const s = await read($, suggestion)
              const others = [
                button('pick', t.pick, 'p', () => update($, menu, x => (x === 'pick' ? '' : 'pick'))),
                button('custom', t.custom, 'e', () => update($, menu, x => (x === 'custom' ? '' : 'custom'))),
              ]
              // While the suggestion loads, the menu and a custom pair are already usable.
              if (!s) return (
                <Box flexDirection="column">
                  <Text dimColor>{t.suggesting}</Text>
                  <Box gap={2}>{others}</Box>
                </Box>
              )
              return (
                <Box flexDirection="column">
                  <Text bold>{`${t.suggested}: ${s.pair.a.lens} × ${s.pair.b.lens}`}</Text>
                  <Text wrap="wrap" dimColor>{s.why}</Text>
                  <Box gap={2}>
                    {button('accept', t.accept, 'a', () => choosePair($, ctx, s.pair, s.why))}
                    {others}
                  </Box>
                </Box>
              )
            })()}
            {pairMenu()}
          </Box>
        )}

        {(v === 'running' || v === 'paused' || v === 'roundEnd' || v === 'finishing' || v === 'done' || v === 'error') && (
          <Box flexDirection="column" gap={1}>
            {shown.length === 0 && <Text dimColor>{t.empty}</Text>}
            {shown.map((entry, i) => {
              const isYou = entry.type === 'comment'
              const p = isYou ? undefined : pairFor(convo, entry.round)?.pair
              const who = isYou ? t.you : p ? `${entry.side} · ${sideOf(p, entry.side).lens}` : entry.side
              return (
                <Box key={`entry-${i}-${entry.ts}`} flexDirection="column">
                  <Text bold color={isYou ? 'warning' : entry.side === 'A' ? 'claude' : 'suggestion'}>{who}</Text>
                  <Text wrap="wrap">{entry.text}</Text>
                </Box>
              )
            })}
          </Box>
        )}

        {v === 'roundEnd' && (
          <Box flexDirection="column">
            <Text bold>{t.roundEnd(round)}</Text>
            <Text wrap="wrap">{convo.summaries[round] ?? ''}</Text>
          </Box>
        )}

        {upcoming && v !== 'done' && <Text dimColor>{t.nextPair(upcoming.pair.a.lens, upcoming.pair.b.lens)}</Text>}

        {v === 'error' && <Text color="error">{`${t.failed}: ${problem}`}</Text>}
        {v !== 'error' && v !== 'choosing' && problem !== '' && <Text color="error">{problem}</Text>}

        {(v === 'running' || v === 'paused' || v === 'roundEnd' || v === 'error') && (
          <Box flexDirection="column" gap={1}>
            <Box gap={2}>
              {v === 'running' && button('pause', (await read($, isPausing)) ? t.pausing : t.pause, 's', async () => {
                wantsPause = true
                await update($, isPausing, () => true)
              })}
              {v === 'paused' && button('unpause', t.unpause, 's', () => run($, ctx))}
              {v === 'roundEnd' && button('next', t.next, 'n', () => {
                advance = true
                return run($, ctx)
              })}
              {v === 'error' && button('retry', t.retry, 't', async () => {
                await update($, error, () => '')
                return run($, ctx)
              })}
              {v !== 'error' && button('change', t.changePair, 'p', () => update($, menu, x => (x === 'pick' ? '' : 'pick')))}
              {button('finish', v === 'error' ? t.finishAnyway : t.finish, 'f', () => {
                wantsFinish = true
                if (stop) stop.abort()
                if (!isRunning) void run($, ctx)
              })}
            </Box>
            {v !== 'error' && pairMenu()}
            {v !== 'error' && commentBox}
          </Box>
        )}

        {v === 'done' && (
          <Box flexDirection="column" gap={1}>
            {await (async () => {
              const text = await read($, preview)
              return text === '' ? null : <Text wrap="wrap">{text}</Text>
            })()}
            <Text color="success">{t.saved(convo.doc?.path ?? '')}</Text>
            <Box gap={2}>
              {convo.doc?.isModFit === true &&
                button('mod', t.modOffer, 'm', () => {
                  const path = convo.doc?.path ?? ''
                  // Outside the press handler, as prompt-buttons does; Claude reads it as sent by this mod.
                  $.clock.after(0, () =>
                    $.prompt
                      .submit({ text: `Use the claude-mod-forge skill in create mode to build a Claude Code mod from the idea document at ${path}. Read the document first.` })
                      .catch(() => $.ui.toast(t.modFailed)),
                  )
                  $.ui.toast(t.modSent)
                })}
              {button('new', t.newIdea, 'n', async () => {
                await update($, events, () => [])
                await update($, dir, () => '')
                await update($, tokens, () => 0)
                await setView($, 'ask')
              })}
            </Box>
          </Box>
        )}

        <Text dimColor>{t.footer}</Text>
      </Box>
    )
  })
}
