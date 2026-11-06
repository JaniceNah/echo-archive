import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, Meter, SectionHead, Stamp } from '../components/ui'
import { getStory } from '../data/stories'
import { endingBackdropFor } from '../data/storyArt'
import { useGameStore } from '../store/useGameStore'
import { EFFECT_META, type EffectKey } from '../types'

export function Ending() {
  const navigate = useNavigate()
  const state = useGameStore()
  const story = getStory(state.storyId)
  const role = story?.characters.find((c) => c.id === state.roleId)
  const ending = story?.endings.find((e) => e.id === state.endingId)

  if (!story || !role || !ending) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <div className="label-mono text-red">NO CLOSED FILE</div>
          <h1 className="title-serif mt-2 text-[26px]">本局还没有生成结局</h1>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink/60">
            结局会在最后一幕的行动结束后生成。如果本局中途退出，可以直接回到剧情继续。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/classroom')}>
              回到课堂
            </button>
            <button type="button" className="ink-btn" onClick={() => navigate('/stories')}>
              故事档案
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  const effective = ending
  const finalStats = state.stats
  const lastEntry = state.history[state.history.length - 1]

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/classroom')} className="hover:text-ink">
            ← 课堂剧情
          </button>
          <span>/</span>
          <span>{story.slot} / INCIDENT REPORT</span>
          <span className="ml-auto border border-red px-1.5 py-0.5 text-red">CONFIDENTIAL / 虚构事件</span>
        </div>

        <article className="frame-double relative mt-4 overflow-hidden bg-sheet shadow-hard">
          <div className="pointer-events-none absolute inset-0 halftone opacity-[0.04]" />

          {endingBackdropFor(story) && (
            <div className="relative h-[130px] overflow-hidden border-b border-ink/40 sm:h-[168px]">
              <img
                src={endingBackdropFor(story) ?? undefined}
                alt={`${story.title} 结案场景`}
                className="h-full w-full object-cover object-[center_42%]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,26,28,0.02)_0%,rgba(245,243,237,0.86)_92%)]" />
              <span className="absolute right-2 bottom-2 border border-ink/35 bg-sheet/85 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.14em] text-ink/55">
                {story.slot} / CASE SCENE
              </span>
            </div>
          )}

          <header className="relative border-b-2 border-ink p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="label-mono text-red">CASE FILE / 事件报告 · {effective.code}</div>
                <h1 className="title-serif mt-2 text-[36px] leading-none sm:text-[52px]">{effective.title}</h1>
                <p className="mt-2 font-mono text-[9px] tracking-[0.18em] text-ink/40">{effective.en}</p>
                <p className="mt-3 max-w-[760px] text-[12.5px] leading-relaxed text-ink/65">{effective.summary}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Stamp tone={effective.demo ? 'brass' : 'red'} rotate={false} className="px-3 py-2 text-[13px]">
                  {effective.stamp}
                </Stamp>
                <span className="font-mono text-[8px] tracking-[0.14em] text-ink/35">
                  {story.slot} / {ending.id.toUpperCase()}
                </span>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-dashed border-ink/30 pt-3 sm:grid-cols-4">
              {[
                ['角色', role.name],
                ['本局时长', `${state.duration} 分钟设定`],
                ['决策数', `${state.history.length} 次`],
                ['打印记录', `${state.prints.length} 份`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-mono text-[8px] tracking-[0.1em] text-ink/35">{label}</dt>
                  <dd className="mt-0.5 text-[11px] text-ink/70">{value}</dd>
                </div>
              ))}
            </dl>
          </header>

          <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 p-4 sm:p-6">
              <SectionHead index="I" title="事件经过" en="WHAT HAPPENED" right={<FileTag>{story.slot}</FileTag>} />
              <div className="mt-4 space-y-3 text-[12.5px] leading-[1.85] text-ink/75">
                {effective.paragraphs.map((p, i) => (
                  <p key={i} className={i === 0 ? '' : ''}>
                    <span className="mr-2 font-mono text-[8px] text-ink/30">{String(i + 1).padStart(2, '0')}</span>
                    {p}
                  </p>
                ))}
              </div>

              <div className="mt-6">
                <SectionHead index="II" title="已知后果" en="CONSEQUENCES" />
                <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {effective.consequences.map((c) => (
                    <li key={c} className="flex gap-2 border border-ink/20 bg-paper-2/40 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink/65">
                      <span className="mt-1.5 size-1 shrink-0 bg-red" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <SectionHead index="III" title="复盘问题" en="REFLECTION" right={<FileTag>没有标准答案</FileTag>} />
                <ol className="mt-3 space-y-2">
                  {effective.reflection.map((q, i) => (
                    <li key={q} className="flex gap-3 border-b border-dotted border-ink/20 pb-2 text-[11.5px] leading-relaxed text-ink/70">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center border border-ink/40 font-mono text-[8px]">
                        {i + 1}
                      </span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t-[1.5px] border-ink pt-3">
                <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/summary')}>
                  学习总结
                </button>
                <button type="button" className="ink-btn ml-auto" onClick={() => navigate('/teacher')}>
                  教师复盘 ↗
                </button>
              </div>
            </div>

            <aside className="border-t border-ink/30 p-4 sm:p-5 lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between">
                <span className="label-mono text-ink/45">FICTIONAL STATE / 角色状态</span>
                <Chip tone="line">本局终值</Chip>
              </div>
              <div className="mt-3 space-y-3">
                {(Object.keys(EFFECT_META) as EffectKey[]).map((key) => (
                  <Meter
                    key={key}
                    label={EFFECT_META[key].label}
                    en={EFFECT_META[key].en}
                    value={finalStats[key]}
                    tone={key === 'tension' ? 'red' : 'ink'}
                  />
                ))}
              </div>
              <p className="mt-2 border border-ink/20 bg-paper-2/50 px-2 py-1.5 text-[8.5px] leading-relaxed text-ink/45">
                这些数值只描述虚构班级在故事中的气氛，不是对任何真实玩家的心理测评或人格评分。
              </p>

              <div className="mt-5 border-t border-ink/25 pt-3">
                <div className="label-mono text-ink/45">DECISION LOG / 决策记录</div>
                <ol className="mt-2 space-y-2">
                  {state.history.map((h, i) => (
                    <li key={`${i}-${h.actIndex}-${h.choiceId}-${h.seat ?? 'solo'}`} className="border-l border-ink/25 pl-2.5">
                      <div className="flex items-center gap-1.5 font-mono text-[7.5px] tracking-[0.08em] text-ink/40">
                        <span className="text-red">ACT {String(h.actNo).padStart(2, '0')}</span>
                        <span>·</span>
                        <span>{h.actor}</span>
                      </div>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-ink/70">{h.choiceTitle}</p>
                      <p className="mt-0.5 text-[8.5px] text-ink/40">{h.intent}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {lastEntry && (
                <div className="mt-4 border-t border-dotted border-ink/25 pt-2">
                  <div className="label-mono text-ink/40">最后一句</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/55">「{lastEntry.feedback}」</p>
                </div>
              )}
            </aside>
          </div>
        </article>

        <p className="mt-3 text-[9px] leading-relaxed text-ink/40">
          所有角色、事件与机构均为虚构。这个结局由全班的选择与状态共同生成，不存在「正确路线」；
          它记录的是这一次课堂共同走过的路径。
        </p>
      </div>
    </PageShell>
  )
}
