import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND_TITLE_ART, DM_ART, MENU_BACKDROP_ART } from '../data/storyArt'
import { VoiceToggle } from '../components/VoiceToggle'
import { Typewriter } from '../components/ui'
import { canContinue, useGameStore } from '../store/useGameStore'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="whitespace-nowrap font-mono text-[9px] tracking-[0.14em] text-ink/55">
      {now.getFullYear()}.{pad(now.getMonth() + 1)}.{pad(now.getDate())} / {pad(now.getHours())}:{pad(now.getMinutes())}
    </span>
  )
}

type Ripple = { id: number; x: number; y: number }

export function Home() {
  const navigate = useNavigate()
  const state = useGameStore()
  const continueAvailable = canContinue(state) && state.mode === 'classroom'
  const [stage, setStage] = useState<'splash' | 'menu'>('splash')
  const [speech, setSpeech] = useState<'idle' | 'typing' | 'holding' | 'fading' | 'done'>('idle')
  const [leaving, setLeaving] = useState(false)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number; size: number } | null>(null)
  const lastSpawnAt = useRef(0)
  const lastSpawnPos = useRef({ x: 0, y: 0 })
  const nextId = useRef(0)
  const enterTimer = useRef<number | null>(null)

  const continueTo = state.phase === 'ending' ? '/ending' : '/classroom'

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    return () => {
      if (enterTimer.current) window.clearTimeout(enterTimer.current)
    }
  }, [])

  useEffect(() => {
    if (stage !== 'menu') return
    const timer = window.setTimeout(() => setSpeech('typing'), 1200)
    return () => window.clearTimeout(timer)
  }, [stage])

  useEffect(() => {
    if (speech === 'holding') {
      const timer = window.setTimeout(() => setSpeech('fading'), 1600)
      return () => window.clearTimeout(timer)
    }
    if (speech === 'fading') {
      const timer = window.setTimeout(() => setSpeech('done'), 650)
      return () => window.clearTimeout(timer)
    }
  }, [speech])

  useEffect(() => {
    if (stage !== 'splash') return

    const spawn = (x: number, y: number) => {
      const id = nextId.current++
      setRipples((prev) => [...prev.slice(-16), { id, x, y }])
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
      }, 2800)
    }

    const onMove = (event: PointerEvent) => {
      const { clientX: x, clientY: y } = event
      setPointer({ x, y })
      const now = performance.now()
      const moved = Math.hypot(x - lastSpawnPos.current.x, y - lastSpawnPos.current.y)
      if (now - lastSpawnAt.current < 140 || moved < 28) return
      lastSpawnAt.current = now
      lastSpawnPos.current = { x, y }
      spawn(x, y)
    }

    const onLeave = () => setPointer(null)

    const intro = window.setTimeout(
      () => spawn(window.innerWidth / 2, window.innerHeight * 0.43),
      420,
    )

    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.clearTimeout(intro)
    }
  }, [stage])

  const enterMenu = (x?: number, y?: number) => {
    if (stage !== 'splash' || leaving) return
    const cx = x ?? pointer?.x ?? window.innerWidth / 2
    const cy = y ?? pointer?.y ?? window.innerHeight / 2
    const w = window.innerWidth
    const h = window.innerHeight
    const far = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(w - cx, cy),
      Math.hypot(cx, h - cy),
      Math.hypot(w - cx, h - cy),
    )
    setBurst({ x: cx, y: cy, size: far * 2 + 80 })
    setLeaving(true)
    enterTimer.current = window.setTimeout(() => setStage('menu'), 1100)
  }

  const splashView = (
      <div
        className="main-menu main-menu-splash"
        role="button"
        tabIndex={0}
        aria-label="点击进入主菜单"
        onClick={(event) => enterMenu(event.clientX, event.clientY)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            enterMenu()
          }
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {ripples.map((ripple) => (
            <span key={ripple.id} className="absolute" style={{ left: ripple.x, top: ripple.y }}>
              {[0, 1, 2].map((ring) => (
                <span
                  key={ring}
                  className="echo-ripple"
                  style={{
                    width: 110 + ring * 76,
                    height: 110 + ring * 76,
                    animationDelay: `${ring * 110}ms`,
                  }}
                />
              ))}
            </span>
          ))}

          {pointer && (
            <span className="absolute" style={{ left: pointer.x, top: pointer.y }}>
              <span className="echo-cursor-dot" />
              {[0, 1].map((ring) => (
                <span
                  key={ring}
                  className="echo-cursor-ring"
                  style={{
                    width: 54 + ring * 48,
                    height: 54 + ring * 48,
                    animationDelay: `${ring * 1300}ms`,
                  }}
                />
              ))}
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="flex items-center gap-3 font-mono text-[8px] tracking-[0.4em] text-ink/45">
            <span className="h-px w-7 bg-ink/30" />
            <span>ECHO OF A THOUGHT</span>
            <span className="h-px w-7 bg-ink/30" />
          </div>

          <h1 className="mt-4">
            <img
              src={BRAND_TITLE_ART}
              alt="一念回响"
              className="echo-char w-[min(84vw,820px)] select-none"
              style={{ animationDelay: '240ms' }}
              draggable={false}
            />
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px w-9 bg-ink/35" />
            <p className="font-mono text-[8.5px] tracking-[0.3em] text-ink/45">
              EVERY CHOICE LEAVES A TRACE
            </p>
            <span className="h-px w-9 bg-ink/35" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <span className="animate-pulse font-mono text-[8px] tracking-[0.3em] text-ink/40">
            点击任意处进入 / CLICK ANYWHERE
          </span>
        </div>

      </div>
  )

  const bottomItems = [
    { label: '故事档案', en: 'ARCHIVES', action: () => navigate('/stories') },
    {
      label: '继续课堂',
      en: 'RESUME CLASS',
      action: continueAvailable ? () => navigate(continueTo) : undefined,
    },
    { label: '课堂模式', en: 'CLASSROOM', action: () => navigate('/seats') },
    { label: '剧本工坊', en: 'STUDIO', action: () => navigate('/studio') },
    { label: '使用说明', en: 'MANUAL', action: () => navigate('/help') },
    { label: '教师端', en: 'TEACHER', action: () => navigate('/teacher') },
  ]

  const menuView = (
    <div className="main-menu flex flex-col">
      <header className="menu-enter relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-ink/25 px-4 sm:h-14 sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="title-serif flex size-7 items-center justify-center bg-ink text-[14px] leading-none text-sheet">
            念
          </span>
          <div className="leading-none">
            <span className="title-serif block text-[14px] tracking-[0.1em]">一念回响</span>
            <span className="mt-0.5 block font-mono text-[6.5px] tracking-[0.2em] text-ink/45">
              ECHO OF A THOUGHT
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-[7.5px] tracking-[0.12em] text-ink/45 sm:flex">
            <span className="size-1.5 bg-[#76854f]" />
            LOCAL ENGINE
          </span>
          <VoiceToggle />
          <Clock />
        </div>
      </header>

      <div className="menu-enter relative flex min-h-0 flex-1 items-end justify-center overflow-hidden">
        <img
          src={MENU_BACKDROP_ART}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[center_56%] opacity-80 mix-blend-multiply"
          draggable={false}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-[#ece7db] to-transparent"
        />
        <div
          className={`pointer-events-none absolute inset-0 flex items-start justify-center${speech === 'idle' ? '' : ' dm-step-in'}`}
        >
          <img
            src={speech === 'idle' ? DM_ART.menuIntro : DM_ART.menuHero}
            alt="AI DM 档案管理员形象"
            className="dm-hero dm-float relative -mt-1 h-[150%] shrink-0 select-none object-contain object-top drop-shadow-[0_18px_30px_rgba(25,26,28,0.2)]"
            draggable={false}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(to_top,#ece7db_0%,rgba(236,231,219,0.98)_60%,rgba(236,231,219,0)_100%)]" />

        {(speech === 'typing' || speech === 'holding' || speech === 'fading') && (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-[92px] z-10 flex justify-center px-6 transition-opacity duration-[600ms] ease-out sm:bottom-[100px] ${speech === 'fading' ? 'opacity-0' : 'opacity-100'}`}
          >
            <Typewriter
              lines={['欢迎来到《一念回响》，我是今天的主持人。让我们一起创造今天的故事吧。']}
              voice
              onDone={() => setSpeech((s) => (s === 'typing' ? 'holding' : s))}
              className="max-w-[660px] text-center text-[12.5px] leading-[1.8] text-ink/80 sm:text-[13.5px]"
              mutedClassName="text-ink/80"
            />
          </div>
        )}

        {speech === 'done' && (
          <div className="menu-start-in absolute inset-x-0 bottom-[92px] z-10 flex justify-center sm:bottom-[100px]">
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="flex h-14 min-w-[230px] flex-col items-center justify-center gap-0.5 border-[1.5px] border-sheet/35 bg-ink/75 px-10 text-sheet backdrop-blur-[2px] transition-colors hover:border-red hover:bg-red sm:min-w-[270px]"
            >
              <span className="flex items-center gap-2.5 text-[14px] tracking-[0.12em] sm:text-[15px]">
                开始新故事
                <span aria-hidden>→</span>
              </span>
              <span className="font-mono text-[6.5px] tracking-[0.28em] opacity-60">START NEW STORY</span>
            </button>
          </div>
        )}
      </div>

      <nav
        className="menu-enter relative z-10 grid shrink-0 grid-cols-6 border-t border-ink/25"
        aria-label="主菜单功能"
      >
        {bottomItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            disabled={!item.action}
            className="flex h-[62px] min-w-0 flex-col items-center justify-center gap-1 border-l border-ink/15 transition-colors first:border-l-0 hover:bg-ink hover:text-sheet disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            <span className="whitespace-nowrap text-[10.5px] tracking-[0.06em] sm:text-[12px]">
              {item.label}
            </span>
            <span className="hidden font-mono text-[6.5px] tracking-[0.16em] opacity-50 sm:block">
              {item.en}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="menu-reveal-shell">
      {stage === 'splash' && splashView}
      {leaving && burst && (
        <div
          className={`menu-reveal-layer${stage === 'menu' ? ' is-ready' : ''}`}
          style={
            {
              '--rx': `${burst.x}px`,
              '--ry': `${burst.y}px`,
              '--far': `${burst.size / 2}px`,
            } as CSSProperties
          }
        >
          {menuView}
        </div>
      )}
      {leaving && burst && (
        <span aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          <span
            className="splash-burst-ring"
            style={{ left: burst.x, top: burst.y, width: burst.size, height: burst.size }}
          />
        </span>
      )}
    </div>
  )
}
