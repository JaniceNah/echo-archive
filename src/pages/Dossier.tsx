import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, Dialog, FileTag, Meter, SectionHead, Stamp, Thumb } from '../components/ui'
import { getStory } from '../data/stories'
import { buildProfile } from '../logic/engine'
import { useGameStore } from '../store/useGameStore'

export function Dossier() {
  const { storyId, charId } = useParams()
  const story = getStory(storyId)
  const character = story?.characters.find((c) => c.id === charId)
  const navigate = useNavigate()
  const state = useGameStore()
  const claimRole = useGameStore((s) => s.claimRole)
  const openPrint = useGameStore((s) => s.openPrint)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!story || !character) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <h1 className="title-serif text-[26px]">角色档案不存在</h1>
          <button type="button" className="ink-btn mt-4" onClick={() => navigate('/stories')}>
            返回故事档案
          </button>
        </div>
      </PageShell>
    )
  }

  const claimed = state.storyId === story.id && state.roleId === character.id
  const otherRole =
    state.storyId === story.id && state.roleId && state.roleId !== character.id
      ? story.characters.find((c) => c.id === state.roleId)
      : undefined
  const storyReady = state.storyId === story.id

  const doClaim = () => {
    setConfirmOpen(false)
    claimRole(character.id)
    openPrint(buildProfile(character, story))
    navigate('/game')
  }

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/stories')} className="hover:text-ink">
            故事档案
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate(`/roles/${story.id}`)} className="hover:text-ink">
            {story.slot} 角色档案墙
          </button>
          <span>/</span>
          <span className="text-ink/70">{character.name}</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="border border-red px-1.5 py-0.5 text-red">CONFIDENTIAL / 私人档案</span>
          </span>
        </div>

        {!storyReady && (
          <div className="mt-3 flex items-center justify-between gap-2 border border-red bg-red/[0.05] px-3 py-2">
            <p className="text-[10px] text-ink/60">本局设置尚未生效，领取角色会按默认 5 人开局。</p>
            <button type="button" className="ink-btn" onClick={() => navigate(`/setup/${story.id}`)}>
              去设置
            </button>
          </div>
        )}

        <div className="relative mt-3">
          <div className="absolute -top-2 left-10 z-10 h-4 w-16 rotate-[-2deg] bg-paper-3/70" aria-hidden />
          <div className="absolute -top-2 right-16 z-10 h-4 w-10 rotate-[3deg] bg-paper-3/60" aria-hidden />

          <article className="frame-double relative grid grid-cols-1 gap-0 bg-sheet shadow-hard lg:grid-cols-[300px_1fr]">
            <aside className="relative border-b border-ink/40 p-3 sm:p-4 lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between border-b border-ink pb-2">
                <div>
                  <div className="label-mono text-ink/40">PERSONNEL FILE</div>
                  <div className="font-mono text-[8px] text-ink/55">
                    FILE {story.slot}-{character.id.toUpperCase()}
                  </div>
                </div>
                <span className="stamp-square size-8 text-[18px]">{character.seal}</span>
              </div>

              <div className="relative mt-3 overflow-hidden">
                <Thumb
                  src={character.portrait}
                  alt={`${character.name}的角色形象`}
                  className="h-[300px] w-full sm:h-[360px] lg:h-[380px]"
                />
                <span className="absolute top-2 left-2 border border-ink/40 bg-sheet/80 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.1em]">
                  {claimed ? 'ACCESS GRANTED' : 'SEALED'}
                </span>
                <span className="absolute right-2 bottom-2 border border-ink/30 bg-sheet/80 px-1.5 py-0.5 font-mono text-[7px] text-ink/55">
                  ♟ {character.en}
                </span>
              </div>

              <div className="mt-3">
                <h1 className="title-serif text-[32px] leading-none">{character.name}</h1>
                <p className="mt-1 font-mono text-[8.5px] tracking-[0.14em] text-ink/40">{character.en}</p>
                <p className="mt-1.5 text-[11px] text-ink/65">{character.identity}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {character.traits.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>

              <div className="mt-3 border-t border-dotted border-ink/25 pt-2">
                <div className="flex justify-between font-mono text-[7.5px] tracking-[0.1em] text-ink/40">
                  <span>{character.seatNote}</span>
                  <span>{story.slot}</span>
                </div>
                <div className="mt-1.5 flex h-7 items-end gap-[2px]" aria-hidden>
                  {[1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 2, 1, 3, 1, 1, 2, 1].map((w, i) => (
                    <span
                      key={i}
                      className="block h-full bg-ink/70"
                      style={{ width: w * 1.6, opacity: i % 5 === 0 ? 0.45 : 0.8 }}
                    />
                  ))}
                </div>
              </div>

              {claimed && (
                <div className="stamp-in mt-3 border border-ink bg-ink px-2 py-1.5 text-center font-mono text-[9px] tracking-[0.12em] text-sheet">
                  已由你领取 / CLAIMED BY P{state.playerCount}
                </div>
              )}
            </aside>

            <div className="min-w-0 p-4 sm:p-5">
              <SectionHead
                index="I"
                title="公开档案"
                en="PUBLIC DOSSIER"
                right={<FileTag>可向同伴展示</FileTag>}
              />

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="font-mono text-[8px] tracking-[0.12em] text-ink/40">性格与行为</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink/70">{character.personality}</p>
                </div>
                <div>
                  <div className="font-mono text-[8px] tracking-[0.12em] text-ink/40">个人目标</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink/70">{character.goal}</p>
                  <div className="mt-3">
                    <Meter
                      label={`当前情绪：${character.emotion}`}
                      en="EMOTION"
                      value={character.emotionLabel}
                      tone="red"
                      hint="这是虚构角色在故事中的状态，不是对真实玩家的情绪测评。"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-y border-dashed border-ink/40 py-2">
                <span className="font-mono text-[8px] tracking-[0.14em] text-red">✂ 折叠线 / FOLD</span>
                <span className="h-px flex-1 bg-ink/15" />
                <span className="font-mono text-[7.5px] text-ink/35">以下为私人信息</span>
              </div>

              <div className="relative mt-3">
                <SectionHead
                  index="II"
                  title="私人档案"
                  en="PRIVATE DOSSIER"
                  right={
                    <span className="flex items-center gap-1 font-mono text-[8px] text-ink/45">
                      <span className={`size-1.5 ${claimed ? 'bg-[#76854f]' : 'bg-red'}`} />
                      {claimed ? '已解锁 · 仅本人阅读' : '未领取 · 已封存'}
                    </span>
                  }
                />

                <div className={`relative mt-3 ${claimed ? '' : 'select-none'}`}>
                  {!claimed && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper-2/60 backdrop-blur-[2px]">
                      <div className="border border-ink/50 bg-sheet/95 px-4 py-3 text-center shadow-hard-sm">
                        <div className="font-mono text-[8px] tracking-[0.18em] text-red">SEALED</div>
                        <p className="mt-1 text-[12px]">领取此角色后解锁私人档案</p>
                        <p className="mt-1 text-[9.5px] text-ink/45">公开信息可以分享，私人信息只属于领取者。</p>
                      </div>
                    </div>
                  )}
                  <div className={claimed ? '' : 'pointer-events-none blur-[3px]'}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <div className="font-mono text-[8px] tracking-[0.12em] text-ink/40">私人背景</div>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-ink/70">{character.background}</p>
                      </div>
                      <div>
                        <div className="font-mono text-[8px] tracking-[0.12em] text-ink/40">尚未揭示的信息</div>
                        <ul className="mt-1 space-y-1">
                          {character.hidden.map((h) => (
                            <li key={h} className="flex gap-1.5 text-[11px] leading-relaxed text-ink/65">
                              <span className="mt-1.5 size-1 shrink-0 bg-red" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="font-mono text-[8px] tracking-[0.12em] text-ink/40">你知道的线索</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {character.knownClues.map((c) => (
                          <span
                            key={c}
                            className="border border-ink/30 bg-paper/70 px-2 py-1 text-[10px] text-ink/65"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 border border-ink/25 bg-paper-2/40 px-2.5 py-2">
                <span className="mt-0.5 shrink-0 border border-ink/40 px-1 font-mono text-[7px]">NOTE</span>
                <p className="text-[9.5px] leading-relaxed text-ink/50">
                  这不是一张「人物卡牌」。你的角色会犹豫、会做错、也可能伤害别人。
                  游戏不评价你本人，只记录虚构角色在故事中的选择。
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t-[1.5px] border-ink pt-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-1.5">
                  <Stamp tone={claimed ? 'ink' : 'red'}>{claimed ? '已领取' : '待领取'}</Stamp>
                  {otherRole && (
                    <span className="text-[9px] leading-tight text-ink/45">
                      你当前是「{otherRole.name}」<br />领取会重置本局进度
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <button
                    type="button"
                    onClick={() => navigate(`/roles/${story.id}`)}
                    className="ink-btn"
                  >
                    ← 返回档案墙
                  </button>
                  {claimed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openPrint(buildProfile(character, story))}
                        className="ink-btn"
                      >
                        重新打印档案
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/game')}
                        className="ink-btn ink-btn-solid"
                      >
                        进入故事 →
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      className="ink-btn ink-btn-solid"
                    >
                      领取此角色 →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>

        <p className="mt-3 text-[9px] leading-relaxed text-ink/40">
          角色与故事均为虚构。若你在阅读过程中感到不适，可以随时暂停，或选择另一个角色。
        </p>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        code={`CLAIM PREVIEW / ${story.slot}`}
        title={`领取「${character.name}」`}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="ink-btn" onClick={() => setConfirmOpen(false)}>
              再看看
            </button>
            <button type="button" className="ink-btn ink-btn-red" onClick={doClaim}>
              确认领取并打印档案
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-[11.5px] leading-relaxed text-ink/70">
          <p>
            你将领取 <strong>{character.name}</strong>，并获得一张可折叠的私人档案纸。
            公开部分可以给同伴看，私人部分只属于你。
          </p>
          <ul className="space-y-1.5 border-y border-dashed border-ink/25 py-2.5">
            <li className="flex gap-2"><span className="font-mono text-[8px] text-red">01</span>打印材料会与这份角色档案对应。</li>
            <li className="flex gap-2"><span className="font-mono text-[8px] text-red">02</span>每名玩家只领取一个角色，本局中不能随意更换。</li>
            <li className="flex gap-2"><span className="font-mono text-[8px] text-red">03</span>领取后，你会从第一幕开始进入故事。</li>
            <li className="flex gap-2"><span className="font-mono text-[8px] text-red">04</span>其余 {Math.max(0, state.playerCount - 1)} 个座位会按本局人数自动分配角色；进入剧情后，每位参与者轮流发言与行动。</li>
          </ul>
          {otherRole && (
            <p className="border-l-2 border-red bg-red/[0.05] px-2.5 py-2 text-[10.5px] text-ink/65">
              你当前已领取「{otherRole.name}」。确认领取会<strong>覆盖当前进度</strong>、已获得线索与打印记录。
            </p>
          )}
          <p className="text-[9.5px] text-ink/45">
            本原型不保存真实身份信息。角色档案只存在于本机浏览器。
          </p>
        </div>
      </Dialog>
    </PageShell>
  )
}
