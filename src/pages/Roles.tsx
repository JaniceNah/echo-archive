import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, SectionHead, Thumb } from '../components/ui'
import { getStory } from '../data/stories'
import { availableCharacters, buildAssignment } from '../logic/engine'
import { useGameStore } from '../store/useGameStore'

export function Roles() {
  const { storyId } = useParams()
  const story = getStory(storyId)
  const navigate = useNavigate()
  const state = useGameStore()

  if (!story) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <h1 className="title-serif text-[26px]">档案不存在</h1>
          <button type="button" className="ink-btn mt-4" onClick={() => navigate('/stories')}>
            返回故事档案
          </button>
        </div>
      </PageShell>
    )
  }

  const configured = state.storyId === story.id
  const characters = availableCharacters(story, configured ? state.playerCount : 5)
  const claimed = configured ? story.characters.find((c) => c.id === state.roleId) : undefined
  const assignment = configured && state.roleId ? buildAssignment(story, state.playerCount, state.roleId) : []

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-col gap-3 border-b-[1.5px] border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
              <button type="button" onClick={() => navigate(`/setup/${story.id}`)} className="hover:text-ink">
                ← 游戏设置
              </button>
              <span className="h-px w-5 bg-ink/25" />
              <span>{story.slot} / DOSSIER WALL</span>
            </div>
            <h1 className="title-serif mt-2 text-[34px] leading-none sm:text-[42px]">角色档案墙</h1>
            <p className="mt-2 max-w-[640px] text-[11.5px] leading-relaxed text-ink/55">
              每份档案只属于一名玩家。公开信息可以分享，私人信息只在本人的档案纸内侧。
              这里没有「好人」和「坏人」，只有不同的处境与选择。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="line">{story.playerRange}</Chip>
            <Chip tone="line">{characters.length} 份角色档案</Chip>
            <button
              type="button"
              onClick={() => {
                const pick = characters[Math.floor(Math.random() * characters.length)]
                navigate(`/roles/${story.id}/${pick.id}`)
              }}
              className="ink-btn"
            >
              随机翻一份
            </button>
          </div>
        </div>

        {!configured && (
          <div className="mt-4 flex flex-col gap-2 border border-red bg-red/[0.05] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10.5px] text-ink/65">
              尚未完成本局设置。角色数量会按参与人数开放，请先回到设置页确认。
            </p>
            <button type="button" className="ink-btn self-start" onClick={() => navigate(`/setup/${story.id}`)}>
              去设置 →
            </button>
          </div>
        )}

        {claimed && (
          <div className="mt-4 flex flex-col gap-2 border-[1.5px] border-ink bg-ink px-3 py-2.5 text-sheet sm:flex-row sm:items-center">
            <span className="font-mono text-[8.5px] tracking-[0.14em] text-sheet/50">CURRENT ROLE</span>
            <span className="text-[12px]">
              你已领取 <strong className="font-semibold">{claimed.name}</strong> · {claimed.identity}
            </span>
            <span className="font-mono text-[9px] text-sheet/40">第 {state.actIndex + 1} 幕 · {state.clues.length} 条线索</span>
            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={() => navigate(`/roles/${story.id}/${claimed.id}`)}
                className="ink-btn border-sheet/50 bg-transparent text-sheet hover:bg-sheet hover:text-ink"
              >
                查看档案
              </button>
              <button
                type="button"
                onClick={() => navigate(state.phase === 'ending' ? '/ending' : '/game')}
                className="ink-btn border-sheet bg-sheet text-ink hover:bg-red hover:border-red hover:text-sheet"
              >
                继续本局 →
              </button>
            </div>
          </div>
        )}

        <div className="relative mt-5">
          <div className="pointer-events-none absolute inset-0 grid-paper opacity-50" />
          <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c, i) => {
              const isYou = claimed?.id === c.id
              const tilt = i % 3 === 0 ? '-rotate-[0.7deg]' : i % 3 === 1 ? 'rotate-[0.5deg]' : '-rotate-[0.2deg]'
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/roles/${story.id}/${c.id}`)}
                  className={`group relative block w-full border-[1.5px] border-ink bg-sheet p-2.5 text-left shadow-hard-sm transition-transform duration-200 hover:z-10 hover:-translate-y-1 hover:rotate-0 hover:shadow-hard ${tilt}`}
                >
                  <span className="absolute -top-2 left-6 z-10 h-4 w-14 rotate-[-3deg] bg-paper-3/80 shadow-sm" aria-hidden />
                  <span className="absolute -top-1.5 right-8 z-10 h-4 w-10 rotate-[2deg] bg-paper-3/60" aria-hidden />

                  <div className="flex items-start justify-between border-b border-ink/30 pb-1.5">
                    <span className="font-mono text-[8px] tracking-[0.14em] text-ink/45">
                      FILE {String(i + 1).padStart(2, '0')} / {story.slot}
                    </span>
                    <span className={`stamp-square size-6 text-[12px] ${isYou ? 'text-ink' : ''}`}>{c.seal}</span>
                  </div>

                  <div className="mt-2 flex gap-2.5">
                    <div className="relative w-[42%] shrink-0 overflow-hidden">
                      <Thumb src={c.portrait} alt={`${c.name}的角色形象`} className="h-[150px] w-full" />
                      <span className="absolute inset-x-0 bottom-0 border-t border-ink/30 bg-sheet/85 px-1 py-0.5 text-center font-mono text-[7px] tracking-[0.1em] text-ink/55">
                        {c.en}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="title-serif text-[24px] leading-none">{c.name}</h2>
                      <p className="mt-1 text-[10px] leading-snug text-ink/60">{c.identity}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.traits.slice(0, 2).map((t) => (
                          <span key={t} className="border border-ink/25 px-1 py-0.5 text-[8.5px] text-ink/55">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between font-mono text-[7.5px] text-ink/40">
                          <span>EMOTION / {c.emotion}</span>
                          <span>{c.emotionLabel}</span>
                        </div>
                        <div className="mt-0.5 flex h-[5px] border border-ink/30">
                          <span className="bg-red/70" style={{ width: `${c.emotionLabel}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 border-t border-dotted border-ink/25 pt-1.5 text-[9.5px] leading-relaxed text-ink/45">
                    {c.personality}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono text-[7.5px] tracking-[0.08em] text-ink/35">
                      <span className="border border-ink/30 px-1 py-0.5">私人档案</span>
                      {isYou ? '已领取' : '未开启'}
                    </span>
                    <span className="font-mono text-[9px] text-ink/50 group-hover:text-ink">
                      查看档案 {isYou ? '· 你' : '→'}
                    </span>
                  </div>

                  {isYou && (
                    <span className="stamp absolute -right-1 bottom-10 bg-sheet/90 px-2 py-1 text-[9px]">
                      你已领取
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <section className="frame-double bg-sheet/65 p-4">
            <SectionHead index="P" title="本局座位" en="PLAYER SEATS" right={<FileTag>{state.playerCount || 5} PLAYERS</FileTag>} />
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(assignment.length
                ? assignment
                : Array.from({ length: configured ? state.playerCount : 5 }).map((_, i) => ({
                    playerIndex: i + 1,
                    roleId: '',
                    isYou: false,
                  }))
              ).map((seat) => {
                const role = story.characters.find((c) => c.id === seat.roleId)
                return (
                  <div
                    key={seat.playerIndex}
                    className={`flex items-center gap-2 border px-2 py-1.5 ${
                      seat.isYou ? 'border-ink bg-paper' : 'border-ink/20'
                    }`}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center border border-ink/40 font-mono text-[8px]">
                      P{seat.playerIndex}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10.5px]">
                      {role ? `${role.name} · ${role.identity}` : '待领取'}
                    </span>
                    {seat.isYou && <span className="font-mono text-[7.5px] text-red">YOU</span>}
                  </div>
                )
              })}
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-ink/40">
              每位玩家只阅读自己的私人档案。其他玩家的角色信息由他们在游戏中自愿分享。
            </p>
          </section>

          <section className="border border-ink/30 bg-paper-2/35 p-4">
            <div className="label-mono text-ink/45">HOW TO CLAIM / 领取方式</div>
            <ol className="mt-2 space-y-2">
              {[
                '点击任意一张角色档案，阅读公开信息。',
                '确认后点击「领取此角色」，系统会打印一张可折叠的档案纸。',
                '沿虚线折叠，上半部分可以展示，下半部分只给自己看。',
                '把平板交给下一位玩家，重复以上步骤。',
              ].map((t, i) => (
                <li key={t} className="flex gap-2 text-[10px] leading-relaxed text-ink/60">
                  <span className="font-mono text-[8px] text-red">0{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 border-t border-dotted border-ink/25 pt-2">
              <p className="text-[9px] leading-relaxed text-ink/40">
                本原型支持一台设备上的 4–6 名参与者。领取其中一位角色后，其余座位会按本局人数自动分配；
                进入剧情后每位参与者轮流发言，全部行动后才推进下一幕。
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  )
}
