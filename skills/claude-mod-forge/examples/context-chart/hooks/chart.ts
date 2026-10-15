// Pure drawing helpers: one data layer, two renderings. No $ here.
import type { Point } from '../types'

export const HISTORY = 40

// A self-contained SVG line chart (desktop). Colours use currentColor so it follows the theme.
export function svgChart(points: readonly Point[], width: number, height: number): string {
  const pad = 6
  const w = Math.max(60, width)
  const h = Math.max(40, height)
  const x = (i: number) => pad + (points.length <= 1 ? 0 : (i * (w - 2 * pad)) / (points.length - 1))
  const y = (p: number) => Number((h - pad - (Math.max(0, Math.min(100, p)) / 100) * (h - 2 * pad)).toFixed(1))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.percent).toFixed(1)}`).join(' ')
  const guide = (p: number) => `<line x1="${pad}" x2="${w - pad}" y1="${y(p)}" y2="${y(p)}" stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="3 3"/>`
  const last = points[points.length - 1]
  const dot = last === undefined ? '' : `<circle cx="${x(points.length - 1)}" cy="${y(last.percent)}" r="3" fill="currentColor"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${guide(50)}${guide(90)}<path d="${line}" fill="none" stroke="currentColor" stroke-width="2"/>${dot}</svg>`
}

// The same data as text bars (terminal and anywhere Svg is missing).
export function textBars(points: readonly Point[], columns: number): string[] {
  const width = Math.max(8, columns - 12)
  return points.slice(-12).map((p, i, all) => {
    const filled = Math.round((Math.max(0, Math.min(100, p.percent)) / 100) * width)
    const n = points.length - all.length + i + 1
    return `${String(n).padStart(3)} ${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${String(p.percent).padStart(3)}%`
  })
}

export function short(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
