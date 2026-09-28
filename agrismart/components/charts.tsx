'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/*
 * Hand-rolled SVG charts. A chart library would add ~200 KB gzipped for
 * features this app never uses; these are a few KB each and animate on scroll.
 */

function useOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return { ref, inView }
}

/* ------------------------------------------------------------------- line */

function buildPath(points: Array<[number, number]>, smooth = true): string {
  if (points.length < 2) return ''
  if (!smooth) return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  // Catmull-Rom → cubic bezier for a natural, non-overshooting curve
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
}

export type Series = { name: string; color: string; data: number[] }

export function LineChart({
  series, labels, height = 240, area = true, formatValue = (v: number) => `₹${v.toLocaleString('en-IN')}`,
  className, yTicks = 4,
}: {
  series: Series[]; labels: string[]; height?: number; area?: boolean
  formatValue?: (v: number) => string; className?: string; yTicks?: number
}) {
  const { ref, inView } = useOnce<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = height, padL = 56, padR = 14, padT = 16, padB = 30

  const all = series.flatMap((s) => s.data)
  const max = Math.max(...all), min = Math.min(...all)
  const span = max - min || 1
  const lo = min - span * 0.12, hi = max + span * 0.12
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, labels.length - 1)
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB)

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => lo + ((hi - lo) * i) / yTicks)

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img"
          aria-label={`Line chart of ${series.map((s) => s.name).join(', ')}`}>
          <defs>
            {series.map((s, si) => (
              <linearGradient key={s.name} id={`lg-${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)}
                className="stroke-line" strokeWidth={1} strokeDasharray="3 5" />
              <text x={padL - 10} y={y(t) + 4} textAnchor="end"
                className="fill-current text-faint" style={{ fontSize: 11 }}>
                {formatValue(t).replace(/\.00$/, '')}
              </text>
            </g>
          ))}

          {labels.map((l, i) => (
            (i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1) && (
              <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle"
                className="fill-current text-faint" style={{ fontSize: 11 }}>{l}</text>
            )
          ))}

          {series.map((s, si) => {
            const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number])
            const d = buildPath(pts)
            return (
              <g key={s.name}>
                {area && (
                  <motion.path
                    d={`${d} L${x(s.data.length - 1)},${H - padB} L${padL},${H - padB} Z`}
                    fill={`url(#lg-${si})`}
                    initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.9, delay: 0.35 }}
                  />
                )}
                <motion.path
                  d={d} fill="none" stroke={s.color} strokeWidth={2.6}
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                />
                {inView && pts.map(([px, py], i) => (
                  <motion.circle key={i} cx={px} cy={py} r={hover === i ? 5.5 : 3}
                    fill={s.color} stroke="hsl(var(--surface))" strokeWidth={2}
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + i * 0.03 }}
                  />
                ))}
              </g>
            )
          })}

          {labels.map((_, i) => (
            <rect key={i} x={x(i) - 14} y={padT} width={28} height={H - padT - padB}
              fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          ))}

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB}
              className="stroke-line" strokeWidth={1.5} />
          )}
        </svg>

        {hover !== null && (
          <div
            className="glass-strong pointer-events-none absolute z-10 min-w-[132px] rounded-2xl p-2.5 text-xs"
            style={{
              left: `${Math.min(78, Math.max(2, (x(hover) / W) * 100))}%`,
              top: 8, transform: 'translateX(-50%)',
            }}
          >
            <div className="mb-1 font-bold text-ink">{labels[hover]}</div>
            {series.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3 py-0.5">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-bold tabular-nums text-ink">{formatValue(s.data[hover]!)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- bar */

export function BarChart({
  labels, values, height = 220, color = '#354A29', formatValue = (v: number) => `₹${v.toLocaleString('en-IN')}`,
  stacked, className,
}: {
  labels: string[]; values?: number[]; height?: number; color?: string
  formatValue?: (v: number) => string; stacked?: Series[]; className?: string
}) {
  const { ref, inView } = useOnce<HTMLDivElement>()
  const W = 720, H = height, padL = 56, padR = 14, padT = 16, padB = 30
  const series = stacked ?? [{ name: 'Value', color, data: values ?? [] }]
  const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.data[i] ?? 0), 0))
  const max = Math.max(...totals, 1)
  const bw = (W - padL - padR) / labels.length

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Bar chart">
        {Array.from({ length: 5 }, (_, i) => {
          const v = (max * i) / 4
          const yy = padT + (1 - i / 4) * (H - padT - padB)
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={yy} y2={yy} className="stroke-line" strokeWidth={1} strokeDasharray="3 5" />
              <text x={padL - 10} y={yy + 4} textAnchor="end" className="fill-current text-faint" style={{ fontSize: 11 }}>
                {formatValue(v)}
              </text>
            </g>
          )
        })}
        {labels.map((l, i) => {
          let acc = 0
          return (
            <g key={l + i}>
              {series.map((s) => {
                const v = s.data[i] ?? 0
                const h = (v / max) * (H - padT - padB)
                const yTop = padT + (1 - (acc + v) / max) * (H - padT - padB)
                acc += v
                return (
                  <motion.rect
                    key={s.name} x={padL + i * bw + bw * 0.2} width={bw * 0.6}
                    y={yTop} rx={5} fill={s.color}
                    initial={{ height: 0, y: H - padB }}
                    animate={inView ? { height: h, y: yTop } : {}}
                    transition={{ duration: 0.85, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                )
              })}
              <text x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle"
                className="fill-current text-faint" style={{ fontSize: 11 }}>{l}</text>
            </g>
          )
        })}
      </svg>
      {stacked && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {stacked.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />{s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ donut */

export function Donut({
  data, size = 190, thickness = 22, centerLabel, centerValue, className,
}: {
  data: Array<{ label: string; value: number; color: string }>
  size?: number; thickness?: number; centerLabel?: string; centerValue?: string; className?: string
}) {
  const { ref, inView } = useOnce<HTMLDivElement>()
  const total = data.reduce((a, d) => a + d.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div ref={ref} className={cn('flex flex-col items-center gap-5 sm:flex-row sm:items-center', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            className="stroke-line" strokeWidth={thickness} opacity={0.35} />
          {data.map((d) => {
            const frac = d.value / total
            const dash = frac * c
            const el = (
              <motion.circle
                key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color} strokeWidth={thickness} strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                initial={{ opacity: 0, strokeDasharray: `0 ${c}` }}
                animate={inView ? { opacity: 1, strokeDasharray: `${dash} ${c - dash}` } : {}}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            )
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-display text-xl font-bold leading-none sm:text-2xl">{centerValue}</div>
            {centerLabel && <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted">{centerLabel}</div>}
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d, i) => (
          <motion.li key={d.label} className="flex items-center justify-between gap-3 text-sm"
            initial={{ opacity: 0, x: 10 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.25 + i * 0.07 }}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
              <span className="truncate text-muted">{d.label}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums">
              {Math.round((d.value / total) * 100)}%
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

/* --------------------------------------------------------------- sparkline */

export function Sparkline({
  data, color = '#354A29', width = 96, height = 30, className,
}: { data: number[]; color?: string; width?: number; height?: number; className?: string }) {
  const max = Math.max(...data), min = Math.min(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [
    (i * width) / (data.length - 1),
    height - ((v - min) / span) * (height - 4) - 2,
  ] as [number, number])
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={buildPath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------- gauge */

export function Gauge({
  value, size = 132, label, tone = '#354A29', className,
}: { value: number; size?: number; label?: string; tone?: string; className?: string }) {
  const { ref, inView } = useOnce<HTMLDivElement>()
  const r = size / 2 - 12
  const circ = Math.PI * r // half circle
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div ref={ref} className={cn('flex flex-col items-center', className)}>
      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`} aria-hidden>
        <path d={`M12,${size / 2} A${r},${r} 0 0 1 ${size - 12},${size / 2}`} fill="none"
          className="stroke-line" strokeWidth={11} strokeLinecap="round" opacity={0.4} />
        <motion.path
          d={`M12,${size / 2} A${r},${r} 0 0 1 ${size - 12},${size / 2}`} fill="none"
          stroke={tone} strokeWidth={11} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: circ - (clamped / 100) * circ } : {}}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="-mt-3 text-center">
        <div className="font-display text-2xl font-bold tabular-nums">{Math.round(clamped)}%</div>
        {label && <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</div>}
      </div>
    </div>
  )
}
