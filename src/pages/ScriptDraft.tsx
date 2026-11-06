import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getGeneratedStory } from '../logic/generatedStories'
import type { Story } from '../types'

type Phase = 'closed' | 'measuring' | 'moving' | 'settled' | 'closing'

export function ScriptDraft() {
  const { storyId } = useParams()
  const navigate = useNavigate()
  const story = getGeneratedStory(storyId)
  const [phase, setPhase] = useState<Phase>('closed')
  const [transform, setTransform] = useState<string | undefined>()
  const [settling, setSettling] = useState(false)
  const paperRef = useRef<HTMLDivElement | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const fromRect = useRef<DOMRect | null>(null)

  const openSheet = () => {
    const el = paperRef.current
    if (!el) return
    fromRect.current = el.getBoundingClientRect()
    setSettling(false)
    setPhase('measuring')
  }

  const closeSheet = () => {
    setPhase((prev) => (prev === 'closed' || prev === 'closing' ? prev : 'closing'))
  }

  useLayoutEffect(() => {
    if (phase !== 'measuring') return
    const sheet = sheetRef.current
    const from = fromRect.current
    if (!sheet || !from) {
      setPhase('settled')
      return
    }
    const to = sheet.getBoundingClientRect()
    if (to.width < 1 || to.height < 1) {
      setPhase('settled')
      return
    }
    setTransform(
      `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
    )
    setPhase('moving')
  }, [phase])

  useEffect(() => {
    if (phase !== 'moving') return
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        setSettling(true)
        setTransform('none')
        window.setTimeout(() => setPhase((prev) => (prev === 'moving' ? 'settled' : prev)), 720)
      })
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'closing') return
    const timer = window.setTimeout(() => setPhase('closed'), 280)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'closed') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'closed') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSheet()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  if (!story) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <div className="label-mono text-red">NO DRAFT FOUND</div>
        <h1 className="title-serif text-[28px]">这份草稿已经不在档案夹里</h1>
        <p className="max-w-[420px] text-[12px] leading-relaxed text-ink/55">
          它可能保存在另一个浏览器里，或者已经被删除。回到剧本室重新拟一份吧。
        </p>
        <button type="button" onClick={() => navigate('/create')} className="ink-btn ink-btn-solid">
          ← 回到剧本室
        </button>
      </div>
    )
  }

  const sheetOpen = phase !== 'closed'

  return (
    <div className="relative min-h-dvh overflow-hidden bg-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0 halftone opacity-[0.05]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,243,237,0.75),rgba(234,232,226,0)_64%)]"
      />

      <button
        type="button"
        onClick={() => navigate('/create')}
        className="fixed top-4 left-4 z-20 font-mono text-[9px] tracking-[0.12em] text-ink/40 hover:text-ink"
      >
        ← 剧本室
      </button>

      <div className="relative flex min-h-dvh items-center justify-center px-4 py-16">
        <div className="script-folder-in relative w-[min(92vw,600px)] pb-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{ filter: 'drop-shadow(0 26px 38px rgba(25,26,28,0.16))' }}
          >
            <div
              className="absolute inset-x-0 top-[60px] bottom-0 bg-[#e7c88a]"
              style={{
                backgroundImage: "url('/assets/yinian/paper/folder-body-tile.webp')",
                backgroundSize: '100% auto',
                backgroundRepeat: 'repeat-y',
              }}
            />
            <img
              src="/assets/yinian/paper/folder-bottom.webp"
              alt=""
              aria-hidden
              draggable={false}
              className="absolute top-0 left-0 w-full select-none [-webkit-mask-image:linear-gradient(to_bottom,#000_85%,transparent_100%)] [mask-image:linear-gradient(to_bottom,#000_85%,transparent_100%)]"
            />
          </div>
          <div className="pointer-events-none absolute top-[22px] left-[5%] z-[5] w-[30%]">
            <span className="block font-mono text-[6px] tracking-[0.14em] text-ink/55 sm:text-[7px]">
              CASE FOLDER / 新剧本
            </span>
          </div>

          <div
            ref={paperRef}
            role="button"
            tabIndex={0}
            aria-label="展开剧本全册"
            onClick={openSheet}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openSheet()
              }
            }}
            className="script-paper relative z-10 mx-auto mt-[51px] block w-[87%] cursor-zoom-in border border-ink/45 bg-sheet p-4 pb-[165px] text-left shadow-[0_18px_40px_rgba(25,26,28,0.22)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-red/60 sm:p-6 sm:pb-[215px]"
          >
            <div className="flex items-center justify-between font-mono text-[7.5px] tracking-[0.16em] text-ink/45">
              <span>{story.slot} / SCRIPT</span>
              <span className="text-red">{story.acts.length} ACTS</span>
            </div>

            <h1 className="title-serif mt-2 text-[30px] leading-[1.12] sm:text-[38px]">{story.title}</h1>
            <p className="mt-1.5 font-mono text-[8px] tracking-[0.18em] text-ink/40">{story.en}</p>
            <p className="mt-3 text-[12px] leading-[1.8] text-ink/70">{story.logline}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {story.themes.map((theme) => (
                <span key={theme} className="border border-ink/30 px-1.5 py-0.5 text-[9px] text-ink/60">
                  {theme}
                </span>
              ))}
            </div>

            <div className="mt-4 border-t border-ink/30 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="label-mono text-ink/45">剧情 / STORY</span>
                <span className="font-mono text-[7px] tracking-[0.1em] text-ink/35">点击展开全册</span>
              </div>
              <ol className="mt-2 space-y-2.5">
                {story.acts.map((act) => (
                  <li key={act.id} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 font-mono text-[8px] text-red">{act.code}</span>
                    <div className="min-w-0">
                      <div className="text-[11.5px] leading-snug">{act.title}</div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-ink/55">
                        {act.event ?? act.question}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink/25 pt-2 font-mono text-[7.5px] tracking-[0.14em] text-ink/45">
              <span>展开阅读全册 / CLICK TO OPEN</span>
              <span aria-hidden className="text-[11px] leading-none">⤢</span>
            </div>
          </div>

          <img
            src="/assets/yinian/paper/folder-top.webp"
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[145px] w-full select-none object-fill drop-shadow-[0_-10px_18px_rgba(25,26,28,0.18)] sm:h-[225px]"
          />

          <div className="absolute inset-x-0 bottom-0 z-30 flex h-[72px] items-end justify-between px-5 pb-4 sm:px-6 sm:pb-5">
            <span className="font-mono text-[7px] tracking-[0.16em] text-ink/60">ECHO ARCHIVE / 档案袋</span>
            <span className="font-mono text-[7px] tracking-[0.16em] text-ink/60">{story.slot}</span>
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div
          className={`fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-paper/90 backdrop-blur-[3px] transition-opacity duration-300 ${
            phase === 'closing' ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeSheet()
          }}
        >
          <div className="flex min-h-full justify-center p-3 sm:p-7">
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${story.title} 剧本全册`}
              style={
                {
                  transform: transform ?? 'none',
                  transformOrigin: 'top left',
                  transition:
                    settling || phase === 'settled' ? 'transform 680ms cubic-bezier(0.2,0.8,0.2,1)' : 'none',
                  visibility: phase === 'measuring' ? 'hidden' : 'visible',
                  willChange: 'transform',
                } as CSSProperties
              }
              className="relative w-full max-w-[940px] border border-ink/45 bg-sheet px-4 py-5 shadow-[0_40px_90px_rgba(25,26,28,0.3)] sm:px-9 sm:py-9"
            >
              <div className={phase === 'settled' ? 'opacity-100 transition-opacity delay-100 duration-300' : 'opacity-0'}>
                <FullScript story={story} onStart={() => navigate(`/seats/${story.id}`)} onClose={closeSheet} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSheet}
            className="fixed top-3 right-3 z-50 border border-ink/40 bg-sheet/90 px-2.5 py-1.5 font-mono text-[8px] tracking-[0.16em] text-ink/60 backdrop-blur-sm transition-colors hover:border-ink hover:text-ink sm:top-5 sm:right-5"
          >
            ✕ 收起
          </button>
        </div>
      )}
    </div>
  )
}

function FullScript({ story, onStart, onClose }: { story: Story; onStart: () => void; onClose: () => void }) {
  return (
    <article>
      <div className="flex flex-wrap items-center gap-2 font-mono text-[8px] tracking-[0.14em] text-ink/45">
        <span>{story.slot} / GENERATED SCRIPT</span>
        <span className="border border-red px-1.5 py-0.5 text-red">DRAFT</span>
      </div>

      <h1 className="title-serif mt-3 text-[32px] leading-[1.08] sm:text-[46px]">{story.title}</h1>
      <p className="mt-1.5 font-mono text-[9px] tracking-[0.2em] text-ink/40">{story.en}</p>
      <p className="mt-3 max-w-[680px] text-[12.5px] leading-[1.85] text-ink/70">{story.logline}</p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {story.themes.map((theme) => (
          <span key={theme} className="border border-ink/30 px-1.5 py-0.5 text-[9px] text-ink/60">
            {theme}
          </span>
        ))}
        <span className="ml-1 font-mono text-[8px] tracking-[0.1em] text-ink/40">
          {story.playerRange} · {story.duration} · {story.acts.length} 幕
        </span>
      </div>

      <section className="mt-6 border-t-2 border-ink pt-3">
        <div className="flex items-baseline justify-between">
          <h2 className="title-serif text-[18px]">人物 / CAST</h2>
          <span className="font-mono text-[7.5px] tracking-[0.14em] text-ink/40">{story.characters.length} ROLES</span>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {story.characters.map((character) => (
            <div key={character.id} className="flex gap-2 border border-ink/25 bg-paper/45 px-2 py-1.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center border border-ink/40 font-mono text-[7px] text-ink/60">
                {character.seal}
              </span>
              <div className="min-w-0">
                <div className="text-[11px]">
                  {character.name}
                  <span className="ml-1.5 font-mono text-[7px] text-ink/35">{character.identity}</span>
                </div>
                <p className="mt-0.5 text-[9px] leading-snug text-ink/50">{character.seatNote}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 border-t-2 border-ink pt-3">
        <div className="flex items-baseline justify-between">
          <h2 className="title-serif text-[18px]">剧情 / ACTS</h2>
          <span className="font-mono text-[7.5px] tracking-[0.14em] text-ink/40">FULL SCRIPT</span>
        </div>

        <div className="mt-3 space-y-5">
          {story.acts.map((act) => (
            <article key={act.id} className="border-l border-ink/25 pl-3 sm:pl-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[8px] tracking-[0.12em] text-ink/45">
                <span className="text-red">{act.code}</span>
                <span>第 {act.no} 幕</span>
                <span aria-hidden>·</span>
                <span>{act.time}</span>
              </div>
              <h3 className="title-serif mt-1 text-[19px] leading-tight">
                {act.title}
                <span className="ml-2 font-mono text-[8px] tracking-[0.14em] text-ink/35">{act.en}</span>
              </h3>
              <p className="mt-1 font-mono text-[8px] tracking-[0.08em] text-ink/40">{act.setting}</p>
              {act.event && (
                <p className="mt-2 text-[11.5px] leading-[1.85] text-ink/70">
                  <span className="mr-1.5 font-mono text-[8px] text-ink/35">EVENT</span>
                  {act.event}
                </p>
              )}
              <p className="mt-1.5 text-[11px] leading-[1.85] text-ink/60">
                <span className="mr-1.5 font-mono text-[8px] text-ink/35">TASK</span>
                {act.task}
              </p>

              <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {act.choices.map((choice) => (
                  <div key={choice.id} className="border border-ink/25 bg-paper/40 px-2 py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10.5px] leading-snug">{choice.title}</span>
                      <span className="shrink-0 font-mono text-[6.5px] text-ink/30">{choice.id.toUpperCase()}</span>
                    </div>
                    <p className="mt-0.5 text-[8.5px] leading-snug text-ink/50">{choice.intent}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 border-t-2 border-ink pt-3">
        <div className="flex items-baseline justify-between">
          <h2 className="title-serif text-[18px]">走向 / ENDINGS</h2>
          <span className="font-mono text-[7.5px] tracking-[0.14em] text-ink/40">{story.endings.length} ROUTES</span>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {story.endings.map((ending) => (
            <div key={ending.id} className="border border-ink/30 bg-paper/50 px-2.5 py-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px]">{ending.title}</span>
                <span className="font-mono text-[7px] text-ink/35">{ending.code}</span>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-ink/50">{ending.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-5 border-l-2 border-ink/50 bg-paper/45 px-2.5 py-2 text-[8.5px] leading-relaxed text-ink/50">
        本档案由本地模板组合而成，未调用真实大模型。所有人物与事件均为虚构，人物形象暂用现有底片。
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/25 pt-4">
        <button type="button" onClick={onStart} className="ink-btn ink-btn-solid">
          编排课堂座位 →
        </button>
        <button type="button" onClick={onClose} className="ink-btn">
          收起剧本
        </button>
        <span className="ml-auto font-mono text-[7.5px] tracking-[0.12em] text-ink/35">{story.slot} / DRAFT ONLY</span>
      </div>
    </article>
  )
}
