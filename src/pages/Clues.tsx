import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, SectionHead, Stamp, Typewriter } from '../components/ui'
import { getStory } from '../data/stories'
import { buildEvidence } from '../logic/engine'
import { cluePropArt } from '../data/storyArt'
import { useGameStore } from '../store/useGameStore'
import type { Clue } from '../types'

const RELIABILITY_TONE: Record<Clue['reliability'], 'red' | 'brass' | 'ink'> = {
  已核实: 'ink',
  待核实: 'red',
  单一来源: 'brass',
}

export function Clues() {
  const navigate = useNavigate()
  const state = useGameStore()
  const openPrint = useGameStore((s) => s.openPrint)
  const story = getStory(state.storyId)
  const role = story?.characters.find((c) => c.id === state.roleId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    if (!story) return []
    const acts = new Set<number>([...story.acts.map((a) => a.no), ...state.clues.map((c) => c.act)])
    return [...acts]
      .sort((a, b) => a - b)
      .map((act) => {
        const owned = state.clues.filter((c) => c.act === act)
        const unknown = story.clueBank.filter((c) => c.act === act && !state.clues.some((o) => o.id === c.id))
        return { act, owned, unknown }
      })
  }, [story, state.clues])

  if (!story || !role) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <div className="label-mono text-red">ACCESS DENIED</div>
          <h1 className="title-serif mt-2 text-[26px]">尚未领取角色</h1>
          <p className="mt-2 text-[11.5px] text-ink/60">线索档案只对本局领取角色的玩家开放。</p>
          <button type="button" className="ink-btn ink-btn-solid mt-4" onClick={() => navigate('/stories')}>
            前往故事档案
          </button>
        </div>
      </PageShell>
    )
  }

  const selected = state.clues.find((c) => c.id === selectedId) ?? state.clues[0]
  const knownFromRole = role.knownClues

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-col gap-3 border-b-[1.5px] border-ink pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
              <button type="button" onClick={() => navigate('/game')} className="hover:text-ink">
                ← 返回剧情
              </button>
              <span className="h-px w-5 bg-ink/25" />
              <span>{story.slot} / CLUE ARCHIVE</span>
            </div>
            <h1 className="title-serif mt-2 text-[34px] leading-none sm:text-[42px]">线索档案</h1>
            <p className="mt-2 max-w-[680px] text-[11.5px] leading-relaxed text-ink/55">
              已归档的线索不会因为后续剧情被改写。空白记录表示尚未获取，不代表「不存在」。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="ink">{state.clues.length} 已获取</Chip>
            <Chip tone="line">第 {state.actIndex + 1} 幕</Chip>
            <FileTag>{role.name} / 私人档案</FileTag>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-[1.5px] border-ink bg-sheet/70">
            <div className="flex items-center justify-between border-b border-ink bg-paper-2/70 px-3 py-2">
              <span className="label-mono text-ink/55">ARCHIVE INDEX / 档案索引</span>
              <span className="font-mono text-[8px] text-ink/40">{story.slot}</span>
            </div>
            <div className="max-h-[560px] overflow-y-auto p-2">
              {grouped.map((group) => (
                <div key={group.act} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 px-1 py-1">
                    <span className="font-mono text-[8px] tracking-[0.12em] text-ink/45">
                      ACT {String(group.act).padStart(2, '0')}
                    </span>
                    <span className="h-px flex-1 bg-ink/15" />
                    <span className="font-mono text-[7.5px] text-ink/35">
                      {group.owned.length}/{group.owned.length + group.unknown.length}
                    </span>
                  </div>
                  {group.owned.map((clue) => {
                    const active = selected?.id === clue.id
                    return (
                      <button
                        key={clue.id}
                        type="button"
                        onClick={() => setSelectedId(clue.id)}
                        className={`mb-1 flex w-full items-start gap-2 border px-2 py-1.5 text-left transition-colors ${
                          active
                            ? 'border-ink bg-ink text-sheet'
                            : 'border-ink/20 bg-sheet hover:border-ink/60'
                        }`}
                      >
                        <span className={`mt-0.5 font-mono text-[7.5px] ${active ? 'text-sheet/55' : 'text-red'}`}>
                          {clue.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] leading-snug">{clue.title}</span>
                          <span className={`mt-0.5 block text-[9px] ${active ? 'text-sheet/45' : 'text-ink/40'}`}>
                            {clue.time} · {clue.reliability}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                  {group.unknown.map((clue, i) => (
                    <div
                      key={clue.id}
                      className="mb-1 flex items-center gap-2 border border-dashed border-ink/20 px-2 py-1.5 text-ink/30"
                      aria-label="尚未获取的线索"
                    >
                      <span className="font-mono text-[7.5px]">EV-??</span>
                      <span className="flex-1 text-[10px]">
                        未获取记录 {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-[7px] tracking-[0.1em]">SEALED</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-ink/25 p-3">
              <div className="label-mono text-ink/45">角色已知 / FROM DOSSIER</div>
              <ul className="mt-1.5 space-y-1">
                {knownFromRole.map((k) => (
                  <li key={k} className="flex gap-1.5 text-[9.5px] leading-relaxed text-ink/55">
                    <span className="mt-1.5 size-1 shrink-0 bg-brass" />
                    {k}
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-dotted border-ink/25 pt-1.5 text-[8.5px] leading-relaxed text-ink/40">
                角色自带的信息不等同于已核实的证据，它只是这个角色愿意相信或知道的版本。
              </p>
            </div>
          </aside>

          <section className="frame-double min-h-[520px] bg-sheet p-4 sm:p-5">
            {selected ? (
              <>
                <div className="flex flex-col gap-3 border-b border-ink pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[8.5px] tracking-[0.12em] text-ink/45">
                      <span className="border border-ink/40 px-1 py-0.5 text-red">{selected.code}</span>
                      <span>ACT {String(selected.act).padStart(2, '0')}</span>
                      <span>{selected.time}</span>
                    </div>
                    <h2 className="title-serif mt-2 text-[26px] leading-tight">{selected.title}</h2>
                    <p className="mt-1 text-[11px] text-ink/50">来源：{selected.source}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden h-[118px] w-[104px] overflow-hidden border border-ink/40 bg-ink sm:block">
                      <img
                        src={cluePropArt(selected.title)}
                        alt=""
                        className="h-full w-full object-contain p-1.5"
                        aria-hidden
                      />
                    </div>
                    <Stamp tone={RELIABILITY_TONE[selected.reliability]}>{selected.reliability}</Stamp>
                  </div>
                </div>

                <div className="mt-4 border-l-2 border-red/60 bg-red/[0.04] px-3 py-2">
                  <div className="label-mono text-red/80">摘要 / SUMMARY</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink/75">{selected.summary}</p>
                </div>

                <div className="mt-4">
                  <SectionHead index="I" title="记录正文" en="ARCHIVED RECORD" />
                  <div className="mt-3 text-[12px] leading-relaxed text-ink/75">
                    <Typewriter lines={[selected.detail]} speed={9} />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-y border-dashed border-ink/25 py-2 font-mono text-[9px] sm:grid-cols-4">
                  {[
                    ['归档编号', selected.code],
                    ['来源', selected.source],
                    ['记录时间', selected.time],
                    ['可信度', selected.reliability],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-ink/35">{label}</dt>
                      <dd className="mt-0.5 text-[10px] text-ink/70">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="ink-btn ink-btn-red"
                    onClick={() => openPrint(buildEvidence(selected))}
                  >
                    ✂ 打印这条证据
                  </button>
                  <button type="button" className="ink-btn" onClick={() => navigate('/game')}>
                    ← 返回剧情
                  </button>
                  <span className="ml-auto font-mono text-[8px] tracking-[0.1em] text-ink/35">
                    FACTS ARE IMMUTABLE / 已归档事实不可改写
                  </span>
                </div>

                <p className="mt-3 border border-ink/20 bg-paper-2/40 px-2.5 py-2 text-[9.5px] leading-relaxed text-ink/45">
                  这条线索来自你们在第 {selected.act} 幕的具体选择。打印出的证据纸与档案中的编号一一对应；
                  后续剧情可以补充新线索，但不能覆盖这张纸上的事实。
                </p>
              </>
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <span className="stamp-square size-10 text-[20px] text-ink/30">?</span>
                <h2 className="title-serif mt-3 text-[22px] text-ink/60">线索库还是空的</h2>
                <p className="mt-1 max-w-[320px] text-[10.5px] leading-relaxed text-ink/45">
                  回到剧情，完成第一幕的讨论与选择。基础线索会随幕次自动归档，选择也会带来新的证据。
                </p>
                <button type="button" className="ink-btn mt-4" onClick={() => navigate('/game')}>
                  返回剧情 →
                </button>
              </div>
            )}
          </section>
        </div>

        <p className="mt-3 text-[9px] leading-relaxed text-ink/40">
          线索档案只存在本机浏览器。它记录虚构故事中的证据，不包含任何真实学生的身份、聊天记录或行为评分。
        </p>
      </div>
    </PageShell>
  )
}
