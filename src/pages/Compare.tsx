import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, Meter, SectionHead, Stamp } from '../components/ui'
import { getStory } from '../data/stories'
import { statDiff } from '../logic/engine'
import { useGameStore } from '../store/useGameStore'
import { EFFECT_META, type EffectKey } from '../types'

export function Compare() {
  const navigate = useNavigate()
  const state = useGameStore()
  const openPrint = useGameStore((s) => s.openPrint)
  const story = getStory(state.storyId)
  const replay = state.replay
  const role = story?.characters.find((c) => c.id === state.roleId)

  if (!story || !role || !replay) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <div className="label-mono text-red">NO COMPARISON</div>
          <h1 className="title-serif mt-2 text-[26px]">还没有可对照的重演记录</h1>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink/60">
            先在重演页选择一个关键节点和一个不同的行动，系统会保留第一次路径，并生成第二版结果。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/replay')}>
              去重演 →
            </button>
            <button type="button" className="ink-btn" onClick={() => navigate('/ending')}>
              返回结局
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  const act = story.acts[replay.actIndex]
  const nodeEntry = state.history.find((h) => h.actIndex === replay.actIndex)
  const diffs = statDiff(replay.originalStats, replay.altStats)
  const changed = diffs.filter((d) => d.delta !== 0)

  const altPath = state.history.map((h) =>
    h.actIndex === replay.actIndex
      ? {
          actNo: h.actNo,
          title: replay.altChoiceTitle,
          actor: h.actor,
          changed: true,
        }
      : { actNo: h.actNo, title: h.choiceTitle, actor: h.actor, changed: false },
  )

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/replay')} className="hover:text-ink">
            ← 重演时间线
          </button>
          <span>/</span>
          <span>{story.slot} / PATH COMPARISON</span>
          <span className="ml-auto border border-red px-1.5 py-0.5 text-red">TWO VERSIONS / 同为虚构</span>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-b-[1.5px] border-ink pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label-mono text-red">REPLAY RESULT / {replay.material.code}</div>
            <h1 className="title-serif mt-1 text-[34px] leading-none sm:text-[42px]">不同路径对照</h1>
            <p className="mt-2 max-w-[740px] text-[11.5px] leading-relaxed text-ink/55">
              同一个节点，两种处理方式。先看发生了什么变化，再回到「当时为什么那样选」。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="line">节点 · 第 {act?.no ?? replay.actIndex + 1} 幕</Chip>
            <Chip tone={replay.altEnding.id === replay.originalEnding.id ? 'brass' : 'red'}>
              结局{replay.altEnding.id === replay.originalEnding.id ? '未改变' : '已改变'}
            </Chip>
            <button
              type="button"
              className="ink-btn ink-btn-red"
              onClick={() => openPrint(replay.material)}
            >
              ✂ 打印重演对照
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <section className="frame-double bg-sheet/80 p-4">
            <div className="flex items-center justify-between border-b border-ink pb-2">
              <div>
                <div className="label-mono text-ink/45">VERSION 01 / 第一次路径</div>
                <h2 className="title-serif mt-1 text-[22px] leading-tight">已经发生的那一版</h2>
              </div>
              <span className="border border-ink/50 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-ink/55">
                ORIGINAL
              </span>
            </div>

            <div className="mt-3 border border-ink/25 bg-paper-2/50 p-3">
              <div className="font-mono text-[8px] tracking-[0.1em] text-ink/40">关键节点 · 第 {act?.no} 幕</div>
              <p className="mt-1 text-[13px] font-medium">{replay.originalChoiceTitle}</p>
              {nodeEntry && <p className="mt-1 text-[10px] leading-relaxed text-ink/50">{nodeEntry.intent}</p>}
            </div>

            <div className="mt-4 flex items-start gap-3">
              <Stamp tone="ink">{replay.originalEnding.stamp}</Stamp>
              <div>
                <div className="font-mono text-[8px] tracking-[0.12em] text-ink/40">{replay.originalEnding.code}</div>
                <h3 className="title-serif text-[24px] leading-tight">{replay.originalEnding.title}</h3>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/60">{replay.originalEnding.summary}</p>

            <ol className="mt-4 space-y-1.5">
              {state.history.map((h, i) => (
                <li key={`o-${i}-${h.actIndex}`} className="flex gap-2 text-[9.5px] leading-snug text-ink/55">
                  <span className="font-mono text-[7.5px] text-ink/35">A{h.actNo}</span>
                  {typeof h.seat === 'number' && (
                    <span className="font-mono text-[7.5px] text-ink/30">P{h.seat + 1}</span>
                  )}
                  <span className="min-w-0 flex-1">{h.choiceTitle}</span>
                  <span className="shrink-0 font-mono text-[7.5px] text-ink/30">{h.actor}</span>
                </li>
              ))}
            </ol>

            <div className="mt-4 space-y-2 border-t border-dotted border-ink/25 pt-3">
              {(Object.keys(EFFECT_META) as EffectKey[]).map((key) => (
                <Meter
                  key={key}
                  label={EFFECT_META[key].label}
                  value={replay.originalStats[key]}
                  tone={key === 'tension' ? 'red' : 'ink'}
                />
              ))}
            </div>
          </section>

          <section className="frame-double relative bg-sheet p-4 shadow-hard">
            <div className="absolute -top-2 right-6 h-4 w-16 rotate-[2deg] bg-paper-3/70" aria-hidden />
            <div className="flex items-center justify-between border-b border-ink pb-2">
              <div>
                <div className="label-mono text-red">VERSION 02 / 重演路径</div>
                <h2 className="title-serif mt-1 text-[22px] leading-tight">换一种做法之后</h2>
              </div>
              <span className="border border-red px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-red">
                REPLAY
              </span>
            </div>

            <div className="mt-3 border border-red/50 bg-red/[0.05] p-3">
              <div className="font-mono text-[8px] tracking-[0.1em] text-red/70">重演节点 · 第 {act?.no} 幕</div>
              <p className="mt-1 text-[13px] font-medium">{replay.altChoiceTitle}</p>
              <p className="mt-1 text-[9.5px] leading-relaxed text-ink/45">其余选择保持不变，只替换这一个节点。</p>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <Stamp tone={replay.altEnding.id === replay.originalEnding.id ? 'brass' : 'red'}>
                {replay.altEnding.stamp}
              </Stamp>
              <div>
                <div className="font-mono text-[8px] tracking-[0.12em] text-ink/40">{replay.altEnding.code}</div>
                <h3 className="title-serif text-[24px] leading-tight">{replay.altEnding.title}</h3>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/60">{replay.altEnding.summary}</p>

            <ol className="mt-4 space-y-1.5">
              {altPath.map((h, i) => (
                <li
                  key={`a-${i}-${h.actNo}`}
                  className={`flex gap-2 text-[9.5px] leading-snug ${h.changed ? 'font-medium text-red' : 'text-ink/55'}`}
                >
                  <span className="font-mono text-[7.5px] opacity-60">A{h.actNo}</span>
                  <span className="min-w-0 flex-1">{h.title}</span>
                  <span className="shrink-0 font-mono text-[7.5px] opacity-50">{h.actor}</span>
                  {h.changed && <span className="shrink-0 font-mono text-[7px]">← 改动</span>}
                </li>
              ))}
            </ol>

            <div className="mt-4 space-y-2 border-t border-dotted border-ink/25 pt-3">
              {(Object.keys(EFFECT_META) as EffectKey[]).map((key) => (
                <Meter
                  key={key}
                  label={EFFECT_META[key].label}
                  value={replay.altStats[key]}
                  tone={key === 'tension' ? 'red' : 'ink'}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="frame-double bg-sheet p-4 sm:p-5">
            <SectionHead index="Δ" title="状态差异" en="STATE DELTA" right={<FileTag>重演 − 第一次</FileTag>} />
            {changed.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {changed.map((d) => (
                  <div key={d.key} className="border border-ink/25 p-2.5">
                    <div className="font-mono text-[8px] tracking-[0.1em] text-ink/40">{EFFECT_META[d.key].en}</div>
                    <div className="mt-1 text-[11px] text-ink/60">{EFFECT_META[d.key].label}</div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-mono text-[13px] tabular-nums">{d.from}</span>
                      <span className="text-[9px] text-ink/30">→</span>
                      <span className="font-mono text-[13px] tabular-nums">{d.to}</span>
                    </div>
                    <div className={`mt-1 font-mono text-[9px] ${d.delta > 0 ? 'text-red' : 'text-[#5f6f3f]'}`}>
                      {d.delta > 0 ? '+' : ''}{d.delta}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-ink/50">两版终值完全相同。改变的是过程与叙事，不是数值。</p>
            )}

            <div className="mt-4">
              <div className="label-mono text-ink/45">DIFF NOTES / 变化说明</div>
              <ul className="mt-1.5 space-y-1">
                {replay.diffNotes.length ? (
                  replay.diffNotes.map((n) => (
                    <li key={n} className="flex gap-2 border-b border-dotted border-ink/20 pb-1 text-[10.5px] leading-relaxed text-ink/60">
                      <span className="mt-1.5 size-1 shrink-0 bg-ink/50" />
                      {n}
                    </li>
                  ))
                ) : (
                  <li className="text-[10.5px] text-ink/45">终值没有差异，但选择改变了事件被讲述的方式。</li>
                )}
              </ul>
            </div>

            {replay.altEnding.id !== replay.originalEnding.id && (
              <div className="mt-4 border-l-2 border-red/60 bg-red/[0.04] px-3 py-2">
                <div className="label-mono text-red/80">结局改变点</div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink/65">
                  「{replay.originalEnding.title}」→「{replay.altEnding.title}」。
                  注意：结局标题改变不等于「更正确」，只代表故事走向了另一组后果。
                </p>
              </div>
            )}
          </section>

          <aside className="border-[1.5px] border-ink bg-paper-2/35 p-4">
            <div className="label-mono text-ink/45">DISCUSSION / 复盘问题</div>
            <ol className="mt-2 space-y-2.5">
              {replay.reflection.map((q, i) => (
                <li key={q} className="flex gap-2 text-[10.5px] leading-relaxed text-ink/65">
                  <span className="font-mono text-[8px] text-red">0{i + 1}</span>
                  {q}
                </li>
              ))}
            </ol>

            <div className="mt-4 border-t border-ink/25 pt-3">
              <div className="label-mono text-ink/45">归档操作</div>
              <div className="mt-2 flex flex-col gap-1.5">
                <button type="button" className="ink-btn justify-center" onClick={() => openPrint(replay.material)}>
                  打印重演对照
                </button>
                <button type="button" className="ink-btn justify-center" onClick={() => navigate('/replay')}>
                  换一个节点再试
                </button>
                <button type="button" className="ink-btn justify-center" onClick={() => navigate('/ending')}>
                  回到结局报告
                </button>
                <button type="button" className="ink-btn ink-btn-solid justify-center" onClick={() => navigate('/summary')}>
                  结束本局并总结 →
                </button>
              </div>
            </div>

            <p className="mt-3 text-[8.5px] leading-relaxed text-ink/40">
              两次路径都保留记录。重演不会覆盖第一次的选择，也不会改变已经打印过的纸张。
            </p>
          </aside>
        </div>

        <p className="mt-3 text-[9px] leading-relaxed text-ink/40">
          对照的目标是理解影响的传导，而不是选出「更好」的玩家。讨论时可以用「如果当时……」开头，而不是「你本应该……」
        </p>
      </div>
    </PageShell>
  )
}
