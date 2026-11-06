import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { useTypewriterSpeech } from '../hooks/useDmVoice'

/* ---------------- texture / decoration ---------------- */

export function Noise({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`pointer-events-none absolute inset-0 halftone opacity-[0.06] ${className}`} />
}

export function Stamp({
  children,
  tone = 'red',
  rotate = true,
  className = '',
}: {
  children: ReactNode
  tone?: 'red' | 'ink' | 'brass'
  rotate?: boolean
  className?: string
}) {
  const tones = {
    red: 'text-red border-red',
    ink: 'text-ink border-ink',
    brass: 'text-brass border-brass',
  }
  return (
    <span
      className={`inline-flex items-center justify-center border-[1.6px] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] uppercase ${tones[tone]} ${
        rotate ? 'rotate-[-4deg]' : ''
      } ${className}`}
    >
      {children}
    </span>
  )
}

export function Rule({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="h-px flex-1 bg-ink/70" />
      {label && <span className="label-mono text-ink/60">{label}</span>}
      <span className="h-px flex-1 bg-ink/70" />
    </div>
  )
}

/* ---------------- typography ---------------- */

export function SectionHead({
  index,
  title,
  en,
  right,
}: {
  index: string
  title: string
  en?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-ink pb-1.5">
      <div className="flex items-end gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center border border-ink bg-ink font-mono text-[10px] text-sheet">
          {index}
        </span>
        <div>
          <h2 className="title-serif text-[19px] leading-none">{title}</h2>
          {en && <div className="label-mono mt-1 text-ink/45">{en}</div>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function Typewriter({
  lines,
  speed = 18,
  skip = false,
  voice = false,
  className = '',
  mutedClassName = 'text-ink/80',
  onDone,
}: {
  lines: string[]
  speed?: number
  skip?: boolean
  voice?: boolean
  className?: string
  mutedClassName?: string
  onDone?: () => void
}) {
  const full = useMemo(() => lines.join('\n\n'), [lines])
  const speech = useTypewriterSpeech(full, { skip, enabled: voice })
  const [count, setCount] = useState(skip ? full.length : 0)

  useEffect(() => {
    setCount(skip ? full.length : 0)
  }, [full, skip])

  useEffect(() => {
    const reveal = speech.reveal
    if (!reveal || reveal.text !== full) return
    setCount((previous) => Math.max(previous, reveal.count))
  }, [speech.reveal, full])

  useEffect(() => {
    if (count >= full.length) return
    if (speech.mode === 'speech' || speech.waiting) return
    const timer = window.setTimeout(() => setCount((c) => Math.min(full.length, c + 1)), speed)
    return () => window.clearTimeout(timer)
  }, [count, full, speed, speech.mode, speech.waiting])

  const visible = full.slice(0, count)
  const paragraphs = visible.split('\n\n')
  const done = count >= full.length

  useEffect(() => {
    if (done) onDone?.()
  }, [done, onDone])

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={`${i}-${p.length}`} className={i === 0 ? '' : mutedClassName}>
          {p}
          {!done && i === paragraphs.length - 1 && <span className="caret" />}
        </p>
      ))}
    </div>
  )
}

/* ---------------- meters ---------------- */

export function Meter({
  label,
  en,
  value,
  tone = 'ink',
  hint,
}: {
  label: string
  en?: string
  value: number
  tone?: 'ink' | 'red' | 'brass'
  hint?: string
}) {
  const fills = { ink: 'bg-ink', red: 'bg-red', brass: 'bg-brass' }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium">{label}</span>
          {en && <span className="font-mono text-[8px] text-ink/40">{en}</span>}
        </div>
        <span className="font-mono text-[11px] tabular-nums">{value}</span>
      </div>
      <div className="mt-1 flex h-[7px] border border-ink/50 bg-paper-2">
        <div className={`${fills[tone]} transition-[width] duration-500`} style={{ width: `${value}%` }} />
      </div>
      {hint && <p className="mt-1 text-[9.5px] leading-snug text-ink/45">{hint}</p>}
    </div>
  )
}

/* ---------------- badges ---------------- */

export function Chip({
  children,
  tone = 'line',
}: {
  children: ReactNode
  tone?: 'line' | 'ink' | 'red' | 'brass'
}) {
  const tones = {
    line: 'border-line-soft text-ink/65',
    ink: 'border-ink bg-ink text-sheet',
    red: 'border-red/60 text-red',
    brass: 'border-brass/60 text-brass',
  }
  return (
    <span className={`inline-flex items-center border px-1.5 py-0.5 text-[10px] leading-tight ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function PlayBadge({ playable }: { playable: boolean }) {
  return playable ? (
    <span className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2 py-0.5 font-mono text-[8.5px] tracking-[0.12em] text-sheet">
      <span className="size-1.5 bg-[#c8d5a5]" />
      FULL PLAYABLE
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 border border-red px-2 py-0.5 font-mono text-[8.5px] tracking-[0.12em] text-red">
      <span className="size-1.5 bg-red" />
      DEMO ONLY
    </span>
  )
}

/* ---------------- form controls ---------------- */

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; sub?: string }>
  value: T
  onChange: (value: T) => void
  label?: string
}) {
  return (
    <div>
      {label && <div className="label-mono mb-1.5 text-ink/50">{label}</div>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              className={`min-w-[64px] border px-3 py-1.5 text-left transition-colors ${
                active
                  ? 'border-ink bg-ink text-sheet'
                  : 'border-line-soft bg-sheet hover:border-ink'
              }`}
            >
              <span className="block text-[12px] leading-tight">{o.label}</span>
              {o.sub && (
                <span className={`mt-0.5 block font-mono text-[8px] ${active ? 'text-sheet/50' : 'text-ink/40'}`}>
                  {o.sub}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative flex h-6 w-11 shrink-0 items-center border transition-colors ${
        checked ? 'border-ink bg-ink' : 'border-ink/35 bg-paper-2'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <span
        className={`absolute top-[3px] size-[16px] transition-all ${
          checked ? 'left-[23px] bg-sheet' : 'left-[3px] bg-ink/40'
        }`}
      />
    </button>
  )
}

/* ---------------- dialog ---------------- */

export function Dialog({
  open,
  onClose,
  title,
  code,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  code?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭对话框"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={`paper-frame relative z-10 w-full ${wide ? 'max-w-[760px]' : 'max-w-[520px]'}`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={id}
          className="paper-sheet paper-deckle paper-object max-h-[88vh] w-full overflow-y-auto p-5"
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink pb-2.5">
            <div>
              {code && <div className="label-mono text-red">{code}</div>}
              <h2 id={id} className="title-serif mt-1 text-[24px] leading-tight">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center border border-ink text-[12px] hover:bg-ink hover:text-sheet"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          <div className="pt-4">{children}</div>
          {footer && <div className="mt-5 border-t border-ink/30 pt-3">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

/* ---------------- layout pieces ---------------- */

export function FileTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-ink/50 bg-paper px-1.5 py-[2px] font-mono text-[8.5px] tracking-[0.1em] text-ink/60">
      {children}
    </span>
  )
}

export function Thumb({
  src,
  alt,
  className = '',
  fit = 'contain',
}: {
  src: string | null
  alt: string
  className?: string
  fit?: 'contain' | 'cover'
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full ${
            fit === 'cover'
              ? 'object-cover object-top'
              : 'object-contain object-bottom'
          }`}
          draggable={false}
        />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center bg-paper-2">
          <div className="halftone h-full w-full opacity-30" />
          <span className="absolute title-serif text-[28px] text-ink/30">众</span>
        </div>
      )}
    </div>
  )
}
