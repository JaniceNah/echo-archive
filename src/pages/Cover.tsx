import { useNavigate } from 'react-router-dom'
import { getStory, STORIES } from '../data/stories'
import { DM_ART } from '../data/storyArt'
import { canContinue, useGameStore } from '../store/useGameStore'

export function Cover() {
  const navigate = useNavigate()
  const state = useGameStore()
  const resumable = canContinue(state) && state.mode === 'classroom'
  const story = getStory(state.storyId)
  const resumeTo = state.phase === 'ending' ? '/ending' : '/classroom'

  return (
    <div className="desk">
      <div className="page-frame">
        <div className="paper-sheet paper-sheet-page paper-deckle page-sheet relative flex flex-col overflow-hidden">
      <span aria-hidden className="pointer-events-none fixed inset-0 z-0 scanlines opacity-50" />
      <span aria-hidden className="pointer-events-none fixed inset-0 z-0 halftone opacity-[0.04]" />

      <header className="relative z-10 flex items-center justify-between border-b border-ink/60 px-4 py-2.5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="title-serif flex size-6 items-center justify-center border border-ink bg-ink text-[12px] leading-none text-sheet">
            念
          </span>
          <span className="font-mono text-[9px] tracking-[0.18em] text-ink/65">
            一念回响 / ECHO OF A THOUGHT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-[8.5px] tracking-[0.1em] text-ink/50 sm:flex">
            <span className="size-1.5 bg-red" />
            CASE FILE SEALED
          </span>
          <span className="border border-ink/35 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.12em] text-ink/45">
            课程原型 / V1.0
          </span>
        </div>
      </header>

      <main className="page-in relative z-10 mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 items-center gap-8 px-4 py-8 sm:px-7 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14 lg:py-10">
        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[8.5px] tracking-[0.22em] text-ink/45">FILE NO. YN-2026-0001</span>
            <span className="h-px w-6 bg-ink/30" />
            <span className="text-[9.5px] tracking-[0.12em] text-ink/55">互动叙事 · 情绪教育</span>
            <span className="ml-auto border border-red px-1.5 py-0.5 font-mono text-[8px] tracking-[0.12em] text-red">
              虚构故事
            </span>
          </div>

          <p className="mt-7 font-mono text-[9px] tracking-[0.34em] text-ink/45">ECHO OF A THOUGHT</p>
          <h1 className="title-serif mt-1 text-[clamp(62px,10vw,128px)] leading-[0.9] tracking-[0.03em]">
            一念
            <br />
            回响
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px w-12 bg-ink" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-ink/60">EVERY CHOICE LEAVES A TRACE</p>
          </div>

          <p className="mt-5 max-w-[520px] text-[20px] leading-relaxed text-ink/80 sm:text-[24px]">
            每个选择，都会留下痕迹。
          </p>
          <p className="mt-2 max-w-[560px] text-[12.5px] leading-relaxed text-ink/55">
            一间教室，几份不完整的档案，一个没有人愿意承认的瞬间。
            你们不需要找出「坏人」，只需要决定：在这个处境里，下一步怎么做。
          </p>

          <div className="mt-6 grid max-w-[560px] grid-cols-2 gap-px border border-ink/25 bg-ink/20 sm:grid-cols-4">
            {[
              ['ARCHIVES', `${STORIES.length} 份档案`],
              ['PLAYERS', '4–6 人'],
              ['RUNTIME', '8–120 分钟'],
              ['DEVICE', '一台设备'],
            ].map(([en, zh]) => (
              <div key={en} className="bg-[#f7f0df]/80 px-2.5 py-2">
                <div className="font-mono text-[7px] tracking-[0.14em] text-ink/40">{en}</div>
                <div className="mt-0.5 text-[11px]">{zh}</div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="ink-btn ink-btn-solid h-11 min-w-[220px] justify-center text-[13px]"
            >
              进入档案系统 →
            </button>
            <button
              type="button"
              onClick={() => navigate('/seats')}
              className="ink-btn h-11 justify-center text-[12px]"
            >
              课堂大屏模式
            </button>
            {resumable && (
              <button
                type="button"
                onClick={() => navigate(resumeTo)}
                className="ink-btn h-11 justify-center text-[12px]"
              >
                继续上次：{story?.title ?? '未命名档案'}
              </button>
            )}
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-ink/40">
            <span className="mt-1 size-1.5 shrink-0 bg-red" />
            进入后先选择档案与参与方式，不会自动开始剧情。所有剧情与角色均为虚构，数据只保存在本机。
          </p>
        </section>

        <aside className="relative min-w-0">
          <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-0 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/20" />
          <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-0 aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full halftone opacity-[0.14]" />

          <div className="relative border-[1.5px] border-ink bg-[#fbf6e9] shadow-hard">
            <div className="flex items-center justify-between border-b border-ink/40 bg-[#efe4cf]/70 px-3 py-2">
              <span className="font-mono text-[8px] tracking-[0.18em] text-ink/55">ARCHIVE COVER / 档案封面</span>
              <span className="flex items-center gap-1 font-mono text-[7.5px] text-red">
                <span className="size-1.5 bg-red" /> SEALED
              </span>
            </div>

            <div className="relative px-3 pt-3 sm:px-4">
              <div className="relative flex items-end gap-3">
                <div className="w-[42%] shrink-0 self-end">
                  <div className="relative h-[190px] w-full overflow-hidden border border-ink/50 bg-[#efe4cf]/70 sm:h-[230px]">
                    <img
                      src={DM_ART.hero}
                      alt="AI DM 档案管理员形象"
                      className="h-full w-full object-contain object-bottom"
                      draggable={false}
                    />
                  </div>
                  <span className="absolute bottom-0 left-2 border border-ink/50 bg-[#f7f0dd]/90 px-1 py-0.5 font-mono text-[7px] tracking-[0.1em]">
                    DM-00
                  </span>
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="font-mono text-[7px] tracking-[0.16em] text-ink/40">ARCHIVIST / 档案管理员</div>
                  <h2 className="title-serif mt-1 text-[26px] leading-none">管理员 · 零</h2>
                  <p className="mt-1.5 text-[9px] leading-snug text-ink/50">
                    虚构的档案管理员与调查向导。界面明确标识其 AI 身份。
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['叙述', '倾听', '回应', '复盘'].map((item) => (
                      <span key={item} className="border border-ink/25 px-1 py-0.5 font-mono text-[7.5px] text-ink/50">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-ink/30 pt-2">
                <div className="flex items-center justify-between font-mono text-[7.5px] tracking-[0.14em] text-ink/40">
                  <span>CATALOG / 档案目录</span>
                  <span>{STORIES.length} FILES</span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {STORIES.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 border border-ink/20 bg-[#efe5d1]/60 px-2 py-1.5">
                      <span className="font-mono text-[7.5px] text-red">{item.slot}</span>
                      <span className="min-w-0 flex-1 truncate text-[10.5px]">{item.title}</span>
                      <span className={`font-mono text-[7px] ${item.playable ? 'text-ink/45' : 'text-red/70'}`}>
                        {item.playable ? 'FULL' : 'DEMO'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-ink/30 px-3 py-2">
              <span className="font-mono text-[7px] tracking-[0.1em] text-ink/40">NOT A REAL PERSON · 不进行心理诊断</span>
              <span className="stamp text-[8px]">模拟运行</span>
            </div>
          </div>

          <div className="relative mt-3 border border-ink/25 bg-[#f6eeda]/80 px-3 py-2">
            <p className="text-[9px] leading-relaxed text-ink/50">
              本原型用于课程展示：AI DM 由本地规则引擎模拟，未连接大模型；不采集真实学生身份、聊天记录或心理数据。
            </p>
          </div>
        </aside>
      </main>

      <footer className="relative z-10 flex flex-col gap-1.5 border-t border-ink/40 px-4 py-3 text-[9px] text-ink/45 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <span>《一念回响》ECHO OF A THOUGHT · 多人互动情绪教育叙事</span>
        <span className="font-mono tracking-[0.14em]">HCI &amp; UX DESIGN / 2026 / V1.0</span>
      </footer>
        </div>
      </div>
    </div>
  )
}
