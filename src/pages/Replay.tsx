import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, SectionHead, Stamp } from '../components/ui'
import { getStory } from '../data/stories'
import { describeEffects } from '../logic/engine'
import { useGameStore } from '../store/useGameStore'

export function Replay() {
  const navigate = useNavigate()
  const state = useGameStore()
  const startReplay = useGameStore((s) => s.startReplay)
  const story = getStory(state.storyId)
  const role = story?.characters.find((c) => c.id === state.roleId)
  const ending = story?.endings.find((e) => e.id === state.endingId)

  const [actIndex, setActIndex] = useState<number>(state.history[0]?.actIndex ?? 0)
  const [altChoiceId, setAltChoiceId] = useState<string | null>(null)

  const act = story?.acts[actIndex]
  const entry = state.history.find((h) => h.actIndex === actIndex)
  const snapshot = state.snapshots.find((s) => s.actIndex === actIndex)
  const alternatives = useMemo(
    () => (act && entry ? act.choices.filter((c) => c.id !== entry.choiceId) : []),
    [act, entry],
  )
  const snapshotClues = useMemo(() => {
    if (!story || !snapshot) return []
    return snapshot.clueIds
      .map((id) => story.clueBank.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
  }, [story, snapshot])

  if (!story || !role || !ending || state.history.length === 0) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <div className="label-mono text-red">NO TIMELINE</div>
          <h1 className="title-serif mt-2 text-[26px]">还没有可以重演的选择</h1>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink/60">
            完成一局故事后，这里会按幕次列出你们做过的选择、当时掌握的信息，以及没有被选中的其他可能。
          </p>
          <button type="button" className="ink-btn ink-btn-solid mt-4" onClick={() => navigate('/game')}>
            回到剧情
          </button>
        </div>
      </PageShell>
    )
  }

  const selectedAlt = alternatives.find((c) => c.id === altChoiceId) ?? null
  const replayReady = Boolean(state.replay)

  const run = () => {
    if (!selectedAlt) return
    const result = startReplay(actIndex, selectedAlt.id)
    if (result) navigate('/compare')
  }

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/ending')} className="hover:text-ink">
            ← 结局报告
          </button>
          <span>/</span>
          <span>{story.slot} / REPLAY TIMELINE</span>
          <span className="ml-auto border border-ink/40 px-1.5 py-0.5">RETROSPECTIVE MODE</span>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-b-[1.5px] border-ink pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label-mono text-red">ACTIVE CASE / {ending.code}</div>
            <h1 className="title-serif mt-1 text-[34px] leading-none sm:text-[42px]">重演关键选择</h1>
            <p className="mt-2 max-w-[720px] text-[11.5px] leading-relaxed text-ink/55">
              重演不是回到过去改写事实，而是把某一个节点换一种处理方式，看看后面会怎样变化。
              第一次的记录会保留下来，两版可以并排比较。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="line">{state.history.length} 个节点</Chip>
            <Chip tone="red">当前结局 · {ending.title}</Chip>
            {replayReady && (
              <button
                type="button"
                className="ink-btn"
                onClick={() => navigate('/compare')}
              >
                查看上次重演 →
              </button>
            )}
          </div>
        </div>

        {replayReady && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border border-red bg-red/[0.05] px-3 py-2 text-[10px] text-ink/60">
            <span className="font-mono text-[8px] tracking-[0.12em] text-red">已有重演记录</span>
            <span>
              {state.replay?.originalChoiceTitle} → {state.replay?.altChoiceTitle}，结局变为「{state.replay?.altEnding.title}」。
            </span>
            <button type="button" className="ml-auto font-mono text-[9px] underline underline-offset-2" onClick={() => navigate('/compare')}>
              打开对照页
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-[1.5px] border-ink bg-sheet/70">
            <div className="flex items-center justify-between border-b border-ink bg-paper-2/70 px-3 py-2">
              <span className="label-mono text-ink/55">TIMELINE / 本局时间线</span>
              <FileTag>{story.slot}</FileTag>
            </div>
            <ol className="relative p-3">
              <span className="absolute top-5 bottom-5 left-[26px] w-px bg-ink/25" aria-hidden />
              {state.history.map((h, i) => {
                const active = h.actIndex === actIndex
                const isLast = i === state.history.length - 1
                return (
                  <li key={`${i}-${h.actIndex}-${h.choiceId}-${h.seat ?? 'solo'}`} className="relative mb-2 last:mb-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActIndex(h.actIndex)
                        setAltChoiceId(null)
                      }}
                      className={`relative flex w-full items-start gap-2.5 border px-2 py-2 text-left transition-colors ${
                        active ? 'border-ink bg-ink text-sheet' : 'border-ink/15 bg-sheet hover:border-ink/50'
                      }`}
                    >
                      <span
                        className={`relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center border font-mono text-[8px] ${
                          active ? 'border-sheet/60 bg-sheet text-ink' : 'border-ink/40 bg-paper'
                        }`}
                      >
                        {String(h.actNo).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block font-mono text-[7.5px] tracking-[0.08em] ${active ? 'text-sheet/45' : 'text-ink/35'}`}>
                          {h.actTitle} · {h.actor}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] leading-snug">{h.choiceTitle}</span>
                        {isLast && (
                          <span className={`mt-1 inline-block border px-1 font-mono text-[6.5px] ${active ? 'border-sheet/40 text-sheet/60' : 'border-red/50 text-red'}`}>
                            当前结局节点
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="border-t border-ink/25 p-3">
              <p className="text-[8.5px] leading-relaxed text-ink/40">
                选择任意一幕查看当时的信息环境。越早的节点，能改变的内容越多，但不确定性也越大。
              </p>
            </div>
          </aside>

          <section className="min-w-0">
            {act && entry && snapshot ? (
              <>
                <div className="frame-double bg-sheet p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="label-mono text-red">NODE {String(act.no).padStart(2, '0')} / {act.code}</div>
                      <h2 className="title-serif mt-1.5 text-[28px] leading-tight">第 {act.no} 幕「{act.title}」</h2>
                      <p className="mt-1 text-[10.5px] text-ink/50">{act.scene} · {act.time}</p>
                    </div>
                    <Stamp tone="brass" rotate={false}>已发生</Stamp>
                  </div>

                  <div className="mt-4 border border-ink/30 bg-paper-2/40 p-3">
                    <div className="label-mono text-ink/45">你当时的选择</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-[13px] font-medium">{entry.choiceTitle}</span>
                      <span className="font-mono text-[8px] text-ink/40">{entry.intent}</span>
                    </div>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink/55">{entry.feedback}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {describeEffects(entry.effects).split(' / ').map((t) => (
                        <span key={t} className="border border-ink/25 bg-sheet px-1.5 py-0.5 font-mono text-[8px] text-ink/55">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="border border-ink/20 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="label-mono text-ink/45">当时掌握的信息</span>
                        <span className="font-mono text-[8px] text-ink/35">{snapshotClues.length} 条</span>
                      </div>
                      {snapshotClues.length ? (
                        <ul className="mt-1.5 space-y-1">
                          {snapshotClues.map((c) => (
                            <li key={c.id} className="flex gap-1.5 text-[9.5px] leading-snug text-ink/60">
                              <span className="font-mono text-[7px] text-red">{c.code}</span>
                              {c.title}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[9.5px] text-ink/40">这一幕开始时还没有归档线索。</p>
                      )}
                    </div>
                    <div className="border border-ink/20 p-2.5">
                      <div className="label-mono text-ink/45">当时的状态</div>
                      <dl className="mt-1.5 grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                        {[
                          ['紧绷', snapshot.stats.tension],
                          ['信任', snapshot.stats.trust],
                          ['公开', snapshot.stats.openness],
                          ['安全', snapshot.stats.safety],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-baseline justify-between border-b border-dotted border-ink/20 pb-0.5">
                            <dt className="text-ink/40">{label}</dt>
                            <dd className="tabular-nums">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-1.5 text-[8px] leading-relaxed text-ink/35">
                        这些状态包含此前的全部选择，不只属于这一幕。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <SectionHead
                    index="II"
                    title="如果换一种做法"
                    en="ALTERNATIVE ACTIONS"
                    right={<FileTag>{alternatives.length} 个未选选项</FileTag>}
                  />
                  <div className="mt-3 space-y-2">
                    {alternatives.map((alt) => {
                      const active = alt.id === altChoiceId
                      return (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => setAltChoiceId(alt.id)}
                          className={`block w-full border p-3 text-left transition-colors ${
                            active ? 'border-ink bg-ink text-sheet shadow-hard-sm' : 'border-ink/25 bg-sheet/70 hover:border-ink/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className={`font-mono text-[7.5px] tracking-[0.1em] ${active ? 'text-sheet/45' : 'text-red'}`}>
                                {alt.intent}
                              </span>
                              <span className="mt-0.5 block text-[12px] font-medium">{alt.title}</span>
                              <span className={`mt-1 block text-[10px] leading-relaxed ${active ? 'text-sheet/60' : 'text-ink/50'}`}>
                                {alt.description}
                              </span>
                            </div>
                            <span className={`flex size-4 shrink-0 items-center justify-center border text-[8px] ${active ? 'border-sheet bg-sheet text-ink' : 'border-ink/40'}`}>
                              {active ? '✓' : ''}
                            </span>
                          </div>
                          <div className={`mt-1.5 font-mono text-[8px] ${active ? 'text-sheet/45' : 'text-ink/40'}`}>
                            预计影响 · {describeEffects(alt.effects)}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t-[1.5px] border-ink pt-3 sm:flex-row sm:items-center">
                    <p className="text-[9px] leading-relaxed text-ink/45">
                      重演会沿用这一幕之后的原有选择，只替换当前节点。结果属于虚构演绎，不构成对任何真实玩家的评价。
                    </p>
                    <button
                      type="button"
                      disabled={!selectedAlt}
                      onClick={run}
                      className={`ink-btn sm:ml-auto ${selectedAlt ? 'ink-btn-red' : ''}`}
                    >
                      {selectedAlt ? `重演「${selectedAlt.title}」→` : '先选择一个替代行动'}
                    </button>
                  </div>
                  {!selectedAlt && (
                    <p className="mt-1.5 text-right font-mono text-[8px] text-ink/35">SELECT ONE ALTERNATIVE ACTION</p>
                  )}
                </div>
              </>
            ) : (
              <div className="frame-double flex min-h-[360px] flex-col items-center justify-center bg-sheet p-6 text-center">
                <span className="stamp-square size-10 text-[20px] text-ink/30">?</span>
                <p className="mt-3 text-[11px] text-ink/50">这一幕没有可重演的记录。</p>
              </div>
            )}
          </section>
        </div>

        <p className="mt-3 text-[9px] leading-relaxed text-ink/40">
          重演的伦理边界：可以试探不同的处理方式，但不把任何一条路径包装成「正确解法」。
          课堂上请优先讨论「谁因此被保护 / 谁因此被忽略」，而不是比较谁选的选项更好。
        </p>
      </div>
    </PageShell>
  )
}
