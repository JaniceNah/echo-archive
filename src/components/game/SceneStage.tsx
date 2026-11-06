import type { Character, Story } from '../../types'
import { ACT_CAMEOS, DM_ART, sceneArtFor } from '../../data/storyArt'

const PORTRAITS: Record<string, Record<number, string[]>> = {
  class: {
    1: ['lin', 'zhou', 'chen'],
    2: ['chen', 'shen', 'xu'],
    3: ['lin', 'zhou', 'chen', 'shen'],
  },
  scapegoat: {
    1: ['alo', 'mira', 'sera'],
  },
  'echo-trial': {
    1: ['jiang', 'linwei', 'zhouyu'],
  },
  'raise-hand': {
    1: ['su', 'jiang', 'shen', 'zhou', 'xuzao'],
    2: ['jiang', 'su', 'shen', 'zhou', 'xuzao'],
    3: ['shen', 'su', 'jiang', 'zhou', 'xuzao'],
    4: ['zhou', 'su', 'jiang', 'shen', 'xuzao'],
    5: ['xuzao', 'su', 'jiang', 'shen', 'zhou'],
  },
}

function ClassroomScene({ act }: { act: number }) {
  return (
    <svg viewBox="0 0 900 400" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <g stroke="#191a1c" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="318" x2="900" y2="318" strokeWidth="2.4" />
        <line x1="0" y1="322" x2="900" y2="322" strokeWidth="0.8" opacity="0.4" />

        <rect x="52" y="48" width="244" height="196" strokeWidth="2.4" />
        <rect x="66" y="62" width="216" height="168" strokeWidth="1.2" />
        <line x1="174" y1="62" x2="174" y2="230" strokeWidth="2" />
        <line x1="66" y1="146" x2="282" y2="146" strokeWidth="2" />
        <rect x="66" y="62" width="216" height="168" fill="#8a3a31" opacity="0.05" />
        <g strokeWidth="0.7" opacity="0.35">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={70 + i * 18} y1="62" x2={70 + i * 18} y2="112" />
          ))}
        </g>
        <line x1="40" y1="244" x2="300" y2="244" strokeWidth="3" />

        {act !== 2 && (
          <>
            <rect x="360" y="42" width="318" height="70" fill="#8a3a31" fillOpacity="0.08" strokeWidth="2" />
            <text
              x="519"
              y="86"
              textAnchor="middle"
              fontSize="27"
              fill="#8a3a31"
              stroke="none"
              fontFamily="'Songti SC', serif"
              letterSpacing="4"
            >
              零霸凌示范班级
            </text>
            <rect x="652" y="132" width="146" height="152" fill="#f3f0e8" strokeWidth="2" />
            <text x="725" y="152" textAnchor="middle" fontSize="10" fill="#191a1c" stroke="none" fontFamily="monospace" letterSpacing="2">
              ACTIVITY LIST
            </text>
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1="666" y1={176 + i * 19} x2="784" y2={176 + i * 19} strokeWidth="0.9" opacity="0.55" />
            ))}
            {[1, 2, 3].map((i) => (
              <rect key={i} x="690" y={166 + i * 19} width="58" height="10" fill="#eae8e2" stroke="none" />
            ))}
          </>
        )}

        {act === 2 && (
          <>
            <rect x="356" y="40" width="330" height="296" fill="#f3f0e8" fillOpacity="0.35" strokeWidth="2.2" />
            <text x="521" y="78" textAnchor="middle" fontSize="16" fill="#191a1c" stroke="none" fontFamily="'Songti SC', serif" letterSpacing="6">
              本周班级投票
            </text>
            <text x="521" y="118" textAnchor="middle" fontSize="13" fill="#8a3a31" stroke="none" fontFamily="'Songti SC', serif">
              是否暂停「零霸凌」评选
            </text>
            <rect x="410" y="146" width="100" height="44" strokeWidth="1.6" />
            <rect x="534" y="146" width="100" height="44" strokeWidth="1.6" />
            <text x="460" y="174" textAnchor="middle" fontSize="13" fill="#191a1c" stroke="none">继续</text>
            <text x="584" y="174" textAnchor="middle" fontSize="13" fill="#191a1c" stroke="none">放弃</text>
            <g strokeWidth="0.8" opacity="0.5">
              <line x1="380" y1="216" x2="662" y2="216" />
              <line x1="380" y1="236" x2="620" y2="236" />
              <line x1="380" y1="256" x2="645" y2="256" />
            </g>
            <polygon points="300,400 604,40 640,40 372,400" fill="#191a1c" opacity="0.045" stroke="none" />
          </>
        )}

        {[0, 1, 2].map((row) => (
          <g key={row} transform={`translate(${26 + row * 18} ${300 + row * 27})`}>
            <path d={`M ${40 + row * 34} 0 L ${300 + row * 26} 0 L ${314 + row * 26} 18 L ${54 + row * 34} 18 Z`} fill="#191a1c" fillOpacity="0.06" strokeWidth="1.8" />
            <line x1={66 + row * 34} y1="18" x2={66 + row * 34} y2="38" strokeWidth="1.6" />
            <line x1={286 + row * 26} y1="18" x2={286 + row * 26} y2="38" strokeWidth="1.6" />
          </g>
        ))}

        <g transform="translate(742 300)" opacity="0.5">
          <rect x="0" y="0" width="52" height="42" strokeWidth="1.4" />
          <line x1="0" y1="24" x2="52" y2="24" strokeWidth="0.8" />
        </g>
      </g>
      <text x="852" y="82" textAnchor="end" fontSize="74" fill="#191a1c" opacity="0.07" fontFamily="'Songti SC', serif" fontWeight="700">
        0{act}
      </text>
    </svg>
  )
}

function ClockScene() {
  return (
    <svg viewBox="0 0 900 400" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <g stroke="#191a1c" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="340" x2="900" y2="340" strokeWidth="2.2" />
        <g transform="translate(300 140)">
          <rect x="-96" y="-96" width="192" height="192" fill="#f3f0e8" strokeWidth="2.4" />
          <circle cx="0" cy="0" r="74" strokeWidth="2.4" />
          <circle cx="0" cy="0" r="64" strokeWidth="0.9" opacity="0.5" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <line
                key={i}
                x1={Math.sin(a) * 60}
                y1={-Math.cos(a) * 60}
                x2={Math.sin(a) * 68}
                y2={-Math.cos(a) * 68}
                strokeWidth={i % 3 === 0 ? 2 : 1}
              />
            )
          })}
          <line x1="0" y1="0" x2="8" y2="-46" strokeWidth="3" />
          <line x1="0" y1="0" x2="-32" y2="22" strokeWidth="2" />
          <circle cx="0" cy="0" r="4" fill="#8a3a31" stroke="none" />
          <text x="0" y="-108" textAnchor="middle" fontSize="10" fill="#191a1c" stroke="none" fontFamily="monospace" letterSpacing="3">
            GRAY HARBOR / 05:47
          </text>
        </g>

        <g transform="translate(492 178)" strokeWidth="1.8">
          <circle cx="0" cy="0" r="38" />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="-5" y="-49" width="10" height="14" transform={`rotate(${i * 45})`} fill="#191a1c" fillOpacity="0.12" />
          ))}
          <circle cx="0" cy="0" r="12" />
          <text x="0" y="76" textAnchor="middle" fontSize="8" fill="#191a1c" stroke="none" fontFamily="monospace">
            GEAR-07 / MISMATCH
          </text>
        </g>

        <g transform="translate(560 250)" strokeWidth="2">
          <path d="M0 0 L210 0 L230 90 L-20 90 Z" fill="#191a1c" fillOpacity="0.05" />
          <line x1="20" y1="0" x2="34" y2="-62" strokeWidth="1.4" />
          <line x1="186" y1="0" x2="172" y2="-62" strokeWidth="1.4" />
          <line x1="34" y1="-62" x2="172" y2="-62" strokeWidth="1.4" />
          <text x="105" y="42" textAnchor="middle" fontSize="11" fill="#8a3a31" stroke="none" fontFamily="'Songti SC', serif" letterSpacing="3">
            第十七份责任书
          </text>
          <line x1="40" y1="62" x2="170" y2="62" strokeWidth="0.8" opacity="0.5" />
        </g>

        <g fill="#191a1c" stroke="none" opacity="0.55">
          {[80, 118, 152, 190, 660, 700, 742, 786, 822].map((x, i) => (
            <g key={x} transform={`translate(${x} ${330 - (i % 3) * 4})`}>
              <circle cx="0" cy="-28" r="7" />
              <path d="M-9 -20 Q0 -26 9 -20 L12 6 L-12 6 Z" opacity="0.8" />
            </g>
          ))}
        </g>
      </g>
      <text x="852" y="82" textAnchor="end" fontSize="74" fill="#191a1c" opacity="0.07" fontFamily="'Songti SC', serif" fontWeight="700">
        DEMO
      </text>
    </svg>
  )
}

function EchoScene() {
  return (
    <svg viewBox="0 0 900 400" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <g stroke="#191a1c" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="340" x2="900" y2="340" strokeWidth="2.2" />
        <rect x="60" y="70" width="150" height="270" fill="#191a1c" fillOpacity="0.05" strokeWidth="2" />
        <rect x="690" y="70" width="150" height="270" fill="#191a1c" fillOpacity="0.05" strokeWidth="2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={i}>
            <rect x={74} y={86 + i * 40} width="122" height="22" strokeWidth="1" />
            <circle cx={86} cy={97 + i * 40} r="2" fill="#8a3a31" stroke="none" />
            <line x1={96} y1={97 + i * 40} x2={182} y2={97 + i * 40} strokeWidth="0.7" opacity="0.5" />
            <rect x={704} y={86 + i * 40} width="122" height="22" strokeWidth="1" />
            <line x1={716} y1={97 + i * 40} x2={812} y2={97 + i * 40} strokeWidth="0.7" opacity="0.5" />
          </g>
        ))}
        <path d="M110 340 Q110 300 170 300 L730 300 Q790 300 790 340" strokeWidth="0.8" opacity="0.4" />

        <rect x="288" y="58" width="324" height="238" fill="#f3f0e8" strokeWidth="2.4" />
        <rect x="300" y="70" width="300" height="214" fill="#191a1c" fillOpacity="0.03" strokeWidth="0.8" />
        <text x="450" y="102" textAnchor="middle" fontSize="11" fill="#191a1c" stroke="none" fontFamily="monospace" letterSpacing="3">
          ECHO WALL / TRENDING
        </text>
        <text x="450" y="144" textAnchor="middle" fontSize="22" fill="#8a3a31" stroke="none" fontFamily="'Songti SC', serif" letterSpacing="2">
          #回声审判 NO.7
        </text>
        <g strokeWidth="1.4">
          {Array.from({ length: 34 }).map((_, i) => {
            const h = 10 + Math.abs(Math.sin(i * 0.7)) * 54
            return <line key={i} x1={318 + i * 8} y1={236} x2={318 + i * 8} y2={236 - h} />
          })}
        </g>
        <line x1="318" y1="236" x2="570" y2="236" strokeWidth="1" opacity="0.6" />
        <text x="450" y="262" textAnchor="middle" fontSize="9" fill="#191a1c" stroke="none" fontFamily="monospace">
          19 SEC / EDITED / 63 SHARES
        </text>

        <g transform="translate(646 250)" strokeWidth="1.8">
          <rect x="0" y="0" width="60" height="96" rx="8" fill="#f3f0e8" />
          <rect x="8" y="12" width="44" height="62" fill="#191a1c" fillOpacity="0.08" strokeWidth="0.8" />
          <line x1="18" y1="42" x2="42" y2="42" strokeWidth="2" />
          <line x1="22" y1="52" x2="38" y2="52" strokeWidth="0.8" opacity="0.5" />
          <circle cx="30" cy="84" r="4" strokeWidth="1" />
        </g>

        <g opacity="0.55" strokeWidth="1">
          <path d="M204 140 Q230 160 204 180" />
          <path d="M216 128 Q254 160 216 192" />
          <path d="M696 140 Q670 160 696 180" />
          <path d="M684 128 Q646 160 684 192" />
        </g>
      </g>
      <text x="852" y="82" textAnchor="end" fontSize="74" fill="#191a1c" opacity="0.07" fontFamily="'Songti SC', serif" fontWeight="700">
        DEMO
      </text>
    </svg>
  )
}

export function SceneStage({
  story,
  actNo,
  actId,
  scene,
  time,
  characters,
  variant = 'card',
  mode = 'discussion',
  speakingId,
  sidePanel = false,
  panelWidth = 500,
  castScale = 1,
}: {
  story: Story
  actNo: number
  actId?: string
  scene: string
  time: string
  characters: Character[]
  variant?: 'card' | 'full'
  mode?: 'brief' | 'discussion'
  speakingId?: string
  sidePanel?: boolean
  panelWidth?: number
  castScale?: number
}) {
  const byId = new Map(characters.map((c) => [c.id, c]))
  const focused = (PORTRAITS[story.id]?.[actNo] ?? [])
    .map((id) => byId.get(id))
    .filter((c): c is Character => Boolean(c?.portrait))
  const rest = characters.filter((c) => c.portrait && !focused.some((f) => f.id === c.id))
  const cast = [...focused, ...rest].slice(0, 5)
  const art = sceneArtFor(story.id, actId)
  const cameos = actId ? (ACT_CAMEOS[story.id]?.[actId] ?? []) : []
  const full = variant === 'full'
  const brief = full && mode === 'brief'
  const discussion = full && mode === 'discussion'

  return (
    <div
      className={
        full
          ? 'absolute inset-0 overflow-hidden'
          : 'relative h-full min-h-[250px] overflow-hidden border-[1.5px] border-ink bg-paper-2 sm:min-h-[300px] lg:min-h-[340px]'
      }
    >
      {/* In discussion the stage is pushed to the left: the artwork fades into
          the dark before the action panel starts. */}
      <div
        className="absolute inset-0"
        style={
          discussion
            ? {
                maskImage: 'linear-gradient(to right, #000 0%, #000 62%, rgba(0,0,0,0) 94%)',
                WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 62%, rgba(0,0,0,0) 94%)',
              }
            : undefined
        }
      >
        {art ? (
          <div key={actId ?? actNo} className="absolute inset-0 scene-in">
            <img
              src={art}
              alt={scene}
              className={`h-full w-full object-cover ${full ? 'scene-drift' : ''}`}
              draggable={false}
            />
          </div>
        ) : (
          <div className="absolute inset-0 halftone-soft opacity-30" />
        )}
        {!art && story.id === 'class' && <ClassroomScene act={actNo} />}
        {!art && story.id === 'scapegoat' && <ClockScene />}
        {!art && story.id === 'echo-trial' && <EchoScene />}

        {art && (
          <>
            <div
              className={`absolute inset-0 ${
                full
                  ? 'bg-[linear-gradient(180deg,rgba(9,10,12,0.28)_0%,rgba(9,10,12,0.02)_34%,rgba(9,10,12,0.1)_58%,rgba(9,10,12,0.78)_100%)]'
                  : 'bg-[linear-gradient(180deg,rgba(241,240,233,0.03)_38%,rgba(25,26,28,0.12)_100%)]'
              }`}
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-20" />
          </>
        )}
      </div>

      <div
        className={`absolute z-10 ${
          full
            ? 'top-16 left-3 border border-sheet/25 bg-ink/70 px-2.5 py-1.5 text-sheet backdrop-blur-sm sm:left-5'
            : 'top-2.5 left-2.5 border border-ink/60 bg-sheet/90 px-2 py-1'
        }`}
      >
        <div className={`font-mono text-[7.5px] tracking-[0.16em] ${full ? 'text-red-soft' : 'text-red'}`}>
          {story.slot} / ACT {String(actNo).padStart(2, '0')}
        </div>
        <div className={`mt-0.5 text-[11px] ${full ? 'text-sheet/90' : ''}`}>{scene}</div>
        <div className={`font-mono text-[7.5px] ${full ? 'text-sheet/45' : 'text-ink/45'}`}>{time}</div>
      </div>

      <div
        className={`absolute top-2.5 right-2.5 z-10 hidden px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.12em] sm:block ${
          full
            ? 'top-16 right-5 border border-sheet/20 bg-ink/55 text-sheet/55 backdrop-blur-sm'
            : 'border border-ink/40 bg-sheet/80 text-ink/50'
        }`}
      >
        {art ? 'ILLUSTRATED SCENE / 虚构场景' : 'SIMULATED SCENE'}
      </div>

      {cameos.length > 0 && !full && (
        <div className="pointer-events-none absolute inset-x-0 z-[5] bottom-[6%]">
          <div className="flex items-end justify-between px-3 sm:px-8">
            {cameos.map((c) => (
              <figure key={c.src} className="relative w-[16%] max-w-[160px] sm:w-[13%]">
                <img
                  src={c.src}
                  alt={c.label}
                  className="h-[110px] w-full object-contain object-bottom"
                  draggable={false}
                />
                <figcaption className="mt-0.5 text-center font-mono text-[6.5px] tracking-[0.08em] text-ink/60 sm:text-[7px]">
                  {c.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Brief: the DM narrates from the middle of the room, the class sits
          in two wings around the stage. */}
      {brief && (
        <div className="pointer-events-none absolute inset-0 z-[8]">
          <div className="absolute left-[-1%] bottom-[-8%]">
            <span
              aria-hidden
              className="absolute inset-x-[-42%] inset-y-[-4%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_50%,rgba(241,240,233,0.2),rgba(241,240,233,0.05)_58%,transparent_76%)]"
            />
            <span
              aria-hidden
              className="absolute inset-x-[-26%] inset-y-[6%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_48%,rgba(255,226,150,0.3),transparent_72%)] speak-halo"
            />
            <img
              src={DM_ART.menuHero}
              alt="AI DM · 管理员 零"
              className="relative h-[clamp(500px,88vh,1100px)] w-auto object-contain"
              style={{ filter: 'grayscale(0.2) sepia(0.45) brightness(0.86) contrast(0.98)' }}
              draggable={false}
            />
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={full && sidePanel && !brief ? { right: `calc(min(92vw, ${panelWidth}px) + 40px)` } : undefined}
      >
        {!brief && cast.map((c, i) => {
          const n = cast.length
          const speaking = speakingId === c.id
          const standing = discussion && speaking
          const inShadow = discussion && Boolean(speakingId) && !speaking

          const wingX = n <= 1 ? 70 : 37 + (i * 44) / (n - 1)
          const seatX = n <= 1 ? 50 : 9 + (i * 78) / (n - 1)

          const leftCss = !full
            ? `${n <= 1 ? 50 : 8 + (i * 84) / (n - 1)}%`
            : brief
              ? `${wingX}%`
              : n <= 1
                ? '50%'
                : `clamp(200px, ${seatX}%, calc(100% - 200px))`
          const seatedFallback = full && discussion && !standing && !c.seated && Boolean(c.portrait)
          const bottom = !full
            ? `${[0, 8, 2, 10, 4][i % 5]}px`
            : brief
              ? `${[25, 29, 27, 23, 28][i % 5]}%`
              : standing
                ? '6%'
                : `${17 + [0, 4, 2, 6, 3][i % 5]}%`
          const scale = !full
            ? 1
            : brief
              ? i % 2 === 0
                ? 0.98
                : 0.88
              : (standing ? 1 : 0.96) * castScale

          const sizeClass = !full
            ? 'h-[clamp(150px,72%,360px)]'
            : brief
              ? 'h-[clamp(170px,34vh,400px)]'
              : standing
                ? 'h-[clamp(300px,62vh,740px)]'
                : 'h-[clamp(170px,34vh,420px)]'

          const src = !full || brief || standing ? c.portrait : (c.seated ?? c.portrait)

          return (
            <div
              key={c.id}
              className="absolute"
              style={{
                left: leftCss,
                bottom,
                zIndex: speaking ? 30 : 10 + (full ? 5 - i : i),
                transform: `translateX(-50%) scale(${scale})`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className={`relative aspect-[78/128] transition-[opacity,filter] duration-500 ${sizeClass}`}
                style={{
                  opacity: inShadow ? 0.52 : 1,
                  filter: inShadow ? 'brightness(0.62)' : undefined,
                }}
              >
                {speaking && (
                  <>
                    <span
                      aria-hidden
                      className="absolute left-1/2 -top-[60%] h-[185%] w-[260%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,214,120,0)_0%,rgba(255,214,120,0.14)_48%,rgba(255,226,150,0.26)_100%)] blur-[2px] [clip-path:polygon(46%_0,54%_0,100%_100%,0_100%)]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-x-[-64%] top-[-8%] bottom-[-12%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_46%,rgba(255,226,150,0.62),rgba(255,214,120,0.22)_50%,transparent_74%)] speak-halo"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-x-[-2%] -bottom-1 h-5 rounded-[50%] border border-amber-200/60 bg-amber-200/20 blur-[1px]"
                    />
                  </>
                )}
                <span
                  aria-hidden
                  className={`absolute inset-x-[16%] bottom-0 h-3 rounded-[50%] blur-md ${
                    speaking ? 'bg-amber-200/40' : 'bg-black/25'
                  }`}
                />
                {src ? (
                  seatedFallback ? (
                    <div className="absolute inset-0">
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-[30%] h-[26%] w-[58%] -translate-x-1/2 rounded-t-[8px] border-x border-t border-ink/25 bg-[#cfc7b3]/30"
                      />
                      <div className="absolute inset-x-0 top-0 h-[53%] overflow-hidden">
                        <img
                          src={src}
                          alt={c.name}
                          className="absolute inset-x-0 top-[8.5%] w-full object-contain"
                          draggable={false}
                        />
                      </div>
                      <div
                        aria-hidden
                        className="absolute top-[48%] left-1/2 h-[8%] w-[152%] -translate-x-1/2 border-t-2 border-ink/55 bg-[#eee8da]"
                        style={{ clipPath: 'polygon(3% 0, 97% 0, 100% 100%, 0 100%)' }}
                      >
                        <span className="absolute inset-0 halftone-soft opacity-30" />
                        <span className="absolute top-[18%] left-[10%] h-[26%] w-[18%] rotate-[-4deg] border border-ink/30 bg-sheet/85" />
                        <span className="absolute top-[30%] left-[11.5%] h-[2px] w-[13%] bg-ink/20" />
                        <span className="absolute top-[45%] left-[11.5%] h-[2px] w-[10%] bg-ink/15" />
                      </div>
                      <div
                        aria-hidden
                        className="absolute top-[55%] left-1/2 h-[22%] w-[148%] -translate-x-1/2 border-x border-ink/25 bg-[linear-gradient(180deg,#e2dac7_0%,rgba(226,218,199,0.55)_45%,rgba(226,218,199,0)_100%)]"
                      >
                        <span className="absolute inset-0 halftone-soft opacity-35" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={src}
                      alt={c.name}
                      className="relative z-10 h-full w-full object-contain object-bottom"
                      draggable={false}
                    />
                  )
                ) : (
                  <div className="halftone relative z-10 h-full w-full opacity-30" />
                )}
              </div>
              {!brief && (
                <span
                  className={`stage-nameplate absolute bottom-[-5px] left-1/2 z-20 flex min-w-[74px] max-w-[92%] -translate-x-1/2 items-center justify-center gap-1 whitespace-nowrap px-3 py-[4px] text-center font-mono text-[7.5px] tracking-[0.08em] sm:text-[8px] ${
                    speaking
                      ? 'text-ink drop-shadow-[0_0_9px_rgba(255,214,120,0.9)]'
                      : 'text-ink/85 opacity-90'
                  }`}
                >
                  {speaking && <span className="size-1 animate-pulse bg-red" />}
                  {c.name}
                  {speaking && <span className="text-red">发言中</span>}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
