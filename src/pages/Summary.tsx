import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, Dialog, FileTag, Meter, SectionHead, Stamp } from '../components/ui'
import { getStory } from '../data/stories'
import { useGameStore } from '../store/useGameStore'
import { EFFECT_META, type EffectKey } from '../types'

const PROMPTS = [
  '我在这个角色身上，看见了哪一种我熟悉或陌生的处境？',
  '哪一个选择让我最犹豫？犹豫的原因是什么？',
  '如果只带走一句话，我想带走哪一句？',
]

export function Summary() {
  const navigate = useNavigate()
  const state = useGameStore()
  const openPrint = useGameStore((s) => s.openPrint)
  const resetRun = useGameStore((s) => s.resetRun)
  const story = getStory(state.storyId)
  const role = story?.characters.find((c) => c.id === state.roleId)
  const ending = story?.endings.find((e) => e.id === state.endingId)
  const [notes, setNotes] = useState<string[]>(['', '', ''])
  const [exitOpen, setExitOpen] = useState(false)

  const summaryLines = useMemo(() => {
    if (!story || !role) return []
    const effectTotals: Record<EffectKey, number> = { tension: 0, trust: 0, openness: 0, safety: 0 }
    for (const h of state.history) {
      for (const key of Object.keys(EFFECT_META) as EffectKey[]) {
        effectTotals[key] += h.effects[key] ?? 0
      }
    }
    const biggest = (Object.keys(effectTotals) as EffectKey[]).sort(
      (a, b) => Math.abs(effectTotals[b]) - Math.abs(effectTotals[a]),
    )[0]
    return [
      `你以「${role.name}」的身份，完成了 ${state.history.length} 次行动选择，归档了 ${state.clues.length} 条线索。`,
      ending
        ? `本局抵达结局「${ending.title}」。${ending.summary}`
        : '本局尚未抵达结局。你仍然可以回到剧情继续，或在这里先看一眼已经发生的部分。',
      `这一局里变化最明显的维度是「${EFFECT_META[biggest].label}」（累计 ${effectTotals[biggest] > 0 ? '+' : ''}${effectTotals[biggest]}）。它不是玩家的分数，只是虚构班级的气氛记录。`,
      state.prints.length
        ? `你们打印并保存了 ${state.prints.length} 份材料：${state.prints.map((p) => p.material.title).join('、')}。`
        : '本局还没有保存打印记录。打印材料对应具体选择，一经打印便不会再被改写。',
    ]
  }, [story, role, ending, state.history, state.clues.length, state.prints])

  if (!story || !role) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <div className="label-mono text-red">NOTHING TO CLOSE</div>
          <h1 className="title-serif mt-2 text-[26px]">本机没有进行中的角色</h1>
          <p className="mt-2 text-[11.5px] text-ink/60">领取一个角色并完成故事后，才能生成本局学习总结。</p>
          <button type="button" className="ink-btn ink-btn-solid mt-4" onClick={() => navigate('/stories')}>
            选择故事 →
          </button>
        </div>
      </PageShell>
    )
  }

  const doExit = () => {
    setExitOpen(false)
    resetRun()
    navigate('/menu')
  }

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate(ending ? '/ending' : '/classroom')} className="hover:text-ink">
            ← {ending ? '结局报告' : '返回课堂'}
          </button>
          <span>/</span>
          <span>{story.slot} / SESSION SUMMARY</span>
          <span className="ml-auto border border-ink/40 px-1.5 py-0.5">PRIVATE / 仅本机</span>
        </div>

        <div className="mt-3 border-b-[1.5px] border-ink pb-3">
          <div className="label-mono text-red">CLOSING FILE / {role.en}</div>
          <h1 className="title-serif mt-1 text-[34px] leading-none sm:text-[44px]">退出角色与学习总结</h1>
          <p className="mt-2 max-w-[740px] text-[11.5px] leading-relaxed text-ink/55">
            这里不是成绩单。它只把你们在故事里做过的事重新排一遍，留一点空间给「我刚才为什么会那样想」。
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="I" title="本局摘要" en="WHAT REMAINS ON FILE" right={<FileTag>{story.slot}</FileTag>} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip tone="ink">{role.name}</Chip>
                <Chip tone="line">{state.history.length} 次选择</Chip>
                <Chip tone="line">{state.clues.length} 条线索</Chip>
                <Chip tone="line">{state.prints.length} 份打印</Chip>
                {ending && <Chip tone="red">结局 · {ending.title}</Chip>}
              </div>
              <ul className="mt-3 space-y-2">
                {summaryLines.map((line, i) => (
                  <li key={i} className="flex gap-2 border-b border-dotted border-ink/20 pb-2 text-[11.5px] leading-relaxed text-ink/70">
                    <span className="mt-0.5 font-mono text-[8px] text-red">{String(i + 1).padStart(2, '0')}</span>
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <div className="label-mono text-ink/45">DECISION TRACE / 选择轨迹</div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {state.history.map((h, i) => (
                    <span key={`${i}-${h.actIndex}-${h.choiceId}-${h.seat ?? 'solo'}`} className="flex items-center gap-1.5">
                      <span className="border border-ink/30 bg-paper px-2 py-1 text-[9.5px] text-ink/60">
                        <span className="mr-1 font-mono text-[7px] text-red">A{h.actNo}</span>
                        {h.choiceTitle}
                      </span>
                      {i < state.history.length - 1 && <span className="text-[9px] text-ink/25">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead
                index="II"
                title="留给自己的三句话"
                en="PRIVATE REFLECTION"
                right={<FileTag>不会上传</FileTag>}
              />
              <p className="mt-2 text-[9.5px] leading-relaxed text-ink/45">
                这是可选的。内容只停留在当前页面，不会写入本机存档，也不会发送给 AI 或教师端。
              </p>
              <div className="mt-3 space-y-3">
                {PROMPTS.map((p, i) => (
                  <label key={p} className="block">
                    <span className="flex gap-2 text-[10.5px] leading-relaxed text-ink/60">
                      <span className="font-mono text-[8px] text-red">0{i + 1}</span>
                      {p}
                    </span>
                    <textarea
                      value={notes[i]}
                      onChange={(e) =>
                        setNotes((prev) => prev.map((n, index) => (index === i ? e.target.value : n)))
                      }
                      rows={2}
                      placeholder="写给自己，不写也没关系。"
                      className="mt-1.5 w-full resize-none border border-ink/30 bg-paper/70 px-2.5 py-2 text-[11px] leading-relaxed outline-none placeholder:text-ink/25 focus:border-ink"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="border border-ink/30 bg-paper-2/35 p-4">
              <div className="flex items-center justify-between">
                <div className="label-mono text-ink/45">PRINT ARCHIVE / 本局打印记录</div>
                <span className="font-mono text-[8px] text-ink/35">{state.prints.length} FILES</span>
              </div>
              {state.prints.length ? (
                <ul className="mt-2 divide-y divide-ink/15">
                  {state.prints.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 py-1.5">
                      <span className="font-mono text-[7.5px] tracking-[0.1em] text-red">{p.material.code}</span>
                      <span className="text-[10.5px]">{p.material.title}</span>
                      <span className="font-mono text-[8px] text-ink/35">{p.scope}</span>
                      <button
                        type="button"
                        onClick={() => openPrint(p.material)}
                        className="ml-auto font-mono text-[9px] text-ink/55 underline underline-offset-2 hover:text-ink"
                      >
                        再次查看
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[10px] text-ink/45">本局没有保存打印记录。课堂中生成的新证据或行动回执会出现在这里。</p>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="frame-double bg-sheet p-4">
              <div className="flex items-center justify-between">
                <span className="label-mono text-ink/45">FINAL STATE / 虚构终值</span>
                <Stamp tone={ending ? 'ink' : 'brass'}>{ending ? '已结案' : '进行中'}</Stamp>
              </div>
              <div className="mt-3 space-y-2.5">
                {(Object.keys(EFFECT_META) as EffectKey[]).map((key) => (
                  <Meter
                    key={key}
                    label={EFFECT_META[key].label}
                    en={EFFECT_META[key].en}
                    value={state.stats[key]}
                    tone={key === 'tension' ? 'red' : 'ink'}
                  />
                ))}
              </div>
              <p className="mt-2 text-[8.5px] leading-relaxed text-ink/40">
                仅表示虚构班级的叙事状态，不是任何真实学生的心理测评。
              </p>
            </section>

            <section className="border-[1.5px] border-ink bg-ink p-4 text-sheet">
              <div className="font-mono text-[8px] tracking-[0.16em] text-sheet/45">EXIT ROLE / 退出角色</div>
              <p className="mt-2 text-[11px] leading-relaxed text-sheet/70">
                退出后，这台设备上的本局线索与打印记录都会被清除。已经打印到纸上的内容不受影响。
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/menu')}
                  className="ink-btn justify-center border-sheet/50 bg-transparent text-sheet hover:bg-sheet hover:text-ink"
                >
                  保留本局记录，返回首页
                </button>
                <button
                  type="button"
                  onClick={() => setExitOpen(true)}
                  className="ink-btn ink-btn-red justify-center"
                >
                  退出角色并清除本机记录
                </button>
              </div>
              <p className="mt-2 font-mono text-[7.5px] leading-relaxed text-sheet/35">
                LOCAL STORAGE ONLY / NO ACCOUNT / NO CLOUD
              </p>
            </section>

            <section className="border border-ink/30 bg-paper-2/35 p-4">
              <div className="label-mono text-ink/45">AFTER THE STORY / 之后</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {ending && (
                  <button type="button" className="ink-btn justify-center" onClick={() => navigate('/ending')}>
                    回看结局报告
                  </button>
                )}
                <button type="button" className="ink-btn justify-center" onClick={() => navigate('/teacher')}>
                  教师复盘引导 ↗
                </button>
                <button type="button" className="ink-btn justify-center" onClick={() => navigate('/help')}>
                  使用说明
                </button>
              </div>
            </section>
          </aside>
        </div>

        <p className="mt-3 text-[9px] leading-relaxed text-ink/40">
          本总结只适用于虚构故事中的角色。课堂讨论时，请不要把故事里的状态对应到真实同学身上，
          也不要用它判断谁「更善良」或「更有问题」。
        </p>
      </div>

      <Dialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        code="DESTRUCTIVE ACTION / 本机存档"
        title="确认退出并清除本局？"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="ink-btn" onClick={() => setExitOpen(false)}>
              先不退出
            </button>
            <button type="button" className="ink-btn ink-btn-red" onClick={doExit}>
              确认清除并退出
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-[11.5px] leading-relaxed text-ink/70">
          <p>
            这会清除本机的本局存档：角色、{state.history.length} 次选择、{state.clues.length} 条线索、
            {state.prints.length} 份打印记录。动作不可撤销。
          </p>
          <p className="border-l-2 border-red bg-red/[0.05] px-2.5 py-2 text-[10.5px] text-ink/60">
            已经通过浏览器打印到纸上的材料不会被收回；但它们仍然只是虚构故事材料，请不要当作真实档案使用。
          </p>
          <p className="text-[9.5px] text-ink/45">如果只是想离开当前页面，选择「先不退出」，本局会自动保留。</p>
        </div>
      </Dialog>
    </PageShell>
  )
}
