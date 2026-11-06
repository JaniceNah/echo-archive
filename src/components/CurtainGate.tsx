import { CURTAIN_ART } from '../data/storyArt'
import type { Story } from '../types'
import { Stamp } from './ui'

export type CurtainPhase = 'closed' | 'opening' | 'open' | 'clear'

interface CurtainGateProps {
  story: Story
  seatCount: number
  phase: CurtainPhase
  onOpen: () => void
  onBack: () => void
  onSkip: () => void
}

export function CurtainGate({ story, seatCount, phase, onOpen, onBack, onSkip }: CurtainGateProps) {
  const opening = phase !== 'closed'

  return (
    <div className={`curtain-gate${opening ? ' is-opening' : ''}`}>
      <div aria-hidden className="curtain-gate-backdrop" />

      <div aria-hidden className={`curtain-panel curtain-panel-left${opening ? ' is-open' : ''}`}>
        <img src={CURTAIN_ART.closed} alt="" draggable={false} />
      </div>
      <div aria-hidden className={`curtain-panel curtain-panel-right${opening ? ' is-open' : ''}`}>
        <img src={CURTAIN_ART.closed} alt="" draggable={false} />
      </div>

      <div
        className="curtain-gate-card"
        aria-hidden={opening || undefined}
        inert={opening || undefined}
      >
        <div className="slide-up relative w-[min(92vw,528px)] border-[1.5px] border-ink/70 bg-sheet/95 px-5 py-6 shadow-[0_44px_110px_rgba(0,0,0,0.55)] backdrop-blur-[2px] sm:px-8 sm:py-8">
          <div className="absolute inset-0 halftone-soft opacity-15" aria-hidden />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[8px] tracking-[0.22em] text-ink/45">
                {story.slot} / CLASSROOM
              </div>
              <div className="mt-1 font-mono text-[8px] tracking-[0.22em] text-red">
                CURTAIN CALL / 开演前
              </div>
            </div>
            <Stamp tone="red">就座</Stamp>
          </div>

          <h1 className="title-serif relative mt-4 text-[32px] leading-[1.08] sm:text-[38px]">
            {story.title}
          </h1>
          <p className="relative mt-1.5 font-mono text-[8px] tracking-[0.2em] text-ink/40">{story.en}</p>

          <p className="relative mt-3 text-[12px] leading-[1.85] text-ink/65">
            请全班就座。拉开幕布之后，每一幕都会投射在这块大屏上，所有座位一起观看、一起行动。
          </p>

          <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-ink/25 py-2 font-mono text-[8px] tracking-[0.1em] text-ink/45">
            <span>{story.acts.length} 幕</span>
            <span>{seatCount} 个座位</span>
            <span>{story.duration}</span>
            <span className="ml-auto text-red">ONE DEVICE / ALL PLAYERS</span>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpen}
              autoFocus
              className="ink-btn ink-btn-solid h-10 px-5 text-[12px]"
            >
              拉开帷幕 →
            </button>
            <button type="button" onClick={onBack} className="ink-btn h-10 px-4 text-[11px]">
              返回座位编排
            </button>
          </div>

          <p className="relative mt-3 font-mono text-[7px] leading-relaxed tracking-[0.12em] text-ink/35">
            LOCAL SESSION / 数据留在本机 · 大屏不显示任何私人档案
          </p>
        </div>
      </div>

      {opening && phase !== 'clear' && (
        <button
          type="button"
          onClick={onSkip}
          className="curtain-skip font-mono text-[8px] tracking-[0.18em]"
        >
          跳过开场 →
        </button>
      )}
    </div>
  )
}
