import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, PlayBadge, Thumb } from '../components/ui'
import { allStories } from '../data/stories'
import { coverArtFor } from '../data/storyArt'
import { customStatus } from '../logic/customStories'
import { useGameStore } from '../store/useGameStore'

const ACCENT_TEXT = {
  red: 'text-red',
  brass: 'text-brass',
  ink: 'text-ink',
}

export function Stories() {
  const navigate = useNavigate()
  const state = useGameStore()
  const sessionStory = state.storyId
  const stories = allStories()

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-col gap-4 border-b-[1.5px] border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="label-mono text-red">ARCHIVE INDEX / 档案索引</span>
              <span className="h-px w-10 bg-ink/30" />
              <span className="font-mono text-[8.5px] text-ink/40">{stories.length} RECORDS</span>
            </div>
            <h1 className="title-serif mt-2 text-[34px] leading-none sm:text-[42px]">故事档案</h1>
            <p className="mt-2 max-w-[620px] text-[12px] leading-relaxed text-ink/60">
              共享同一教育框架的故事档案，包含内置档案与教师在「新剧本室」按设定生成的本地档案。
              它们不提供「标准答案」，只提供可以反复进入、反复比较的情境。带{' '}
              <span className="text-red">DEMO</span> 标记的档案只开放演示片段。
            </p>
          </div>
          <div className="vertical-text hidden h-[86px] shrink-0 border-l border-ink/25 pl-3 font-mono text-[8px] text-ink/40 sm:block">
            SELECT A FILE / 选择一份档案
          </div>
        </div>

        <div className="mt-5 border-[1.5px] border-ink bg-sheet/55">
          <div className="flex items-center justify-between border-b border-ink/40 bg-paper-2/50 px-3 py-1.5">
            <span className="font-mono text-[8px] tracking-[0.16em] text-ink/50">
              LEDGER / 故事档案登记簿
            </span>
            <span className="font-mono text-[8px] text-ink/35">SORT: DEFAULT / A → E</span>
          </div>

          {stories.map((story, i) => {
            const status = customStatus(story.id)
            const isCurrent = sessionStory === story.id && Boolean(state.roleId)
            const currentRole = story.characters.find((c) => c.id === state.roleId)
            const available = story.playable || status.active || status.pending === 'update'
            return (
              <article
                key={story.id}
                className={`group relative grid grid-cols-1 gap-4 border-b border-ink/30 px-3 py-5 last:border-b-0 sm:grid-cols-[74px_1fr_170px] sm:gap-5 sm:px-4 ${
                  i % 2 === 1 ? 'bg-paper-2/25' : ''
                }`}
              >
                <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2">
                  <span className="font-mono text-[20px] tracking-[0.06em] text-ink/75">{story.slot}</span>
                  <span className={`h-px w-8 bg-ink/30 sm:h-8 sm:w-px`} />
                  <span className="font-mono text-[8px] tracking-[0.1em] text-ink/35">SLOT {i + 1}/{stories.length}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono text-[8.5px] tracking-[0.16em] ${ACCENT_TEXT[story.accent]}`}>
                      {story.type}
                    </span>
                    <span className="h-px w-6 bg-ink/25" />
                    <PlayBadge playable={available} />
                    {story.generated && (
                      <span className="inline-flex items-center gap-1 border border-red px-1.5 py-0.5 font-mono text-[8px] text-red">
                        AI GENERATED / 本地生成
                      </span>
                    )}
                    {status.active && (
                      <span className="inline-flex items-center gap-1 border border-brass/60 px-1.5 py-0.5 font-mono text-[8px] text-brass">
                        CUSTOM SCRIPT
                      </span>
                    )}
                    {status.pending && (
                      <span className="inline-flex items-center gap-1 border border-brass/50 px-1.5 py-0.5 font-mono text-[8px] text-ink/50">
                        {status.pending === 'update' ? '新剧本待生效' : '待恢复内置'}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 border border-ink/50 bg-paper px-1.5 py-0.5 font-mono text-[8px] text-ink/60">
                        <span className="size-1.5 bg-[#76854f]" />
                        进行中 · 第 {state.actIndex + 1} 幕
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="title-serif text-[26px] leading-tight sm:text-[30px]">{story.title}</h2>
                    <span className="font-mono text-[8px] tracking-[0.14em] text-ink/35">{story.en}</span>
                  </div>

                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/70">{story.logline}</p>
                  <p className="mt-1 max-w-[640px] text-[10.5px] leading-relaxed text-ink/45">
                    {story.description}
                  </p>

                  {coverArtFor(story) && (
                    <div className="group/scene relative mt-2.5 h-[96px] overflow-hidden border border-ink/30 sm:h-[118px]">
                      <img
                        src={coverArtFor(story) ?? undefined}
                        alt={`${story.title} 场景`}
                        className="h-full w-full object-cover object-[center_42%] transition-transform duration-700 group-hover/scene:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(241,240,233,0.82)_0%,rgba(241,240,233,0.18)_38%,rgba(25,26,28,0.08)_100%)]" />
                      <span className="absolute bottom-1.5 left-2 border border-ink/35 bg-sheet/85 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.14em] text-ink/60">
                        SCENE PLATE / 场景底片
                      </span>
                    </div>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {story.themes.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                    <span className="ml-1 flex items-center gap-1">
                      <Chip tone="line">{story.duration}</Chip>
                      <Chip tone="line">{story.playerRange}</Chip>
                    </span>
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <div className="flex -space-x-2">
                      {story.characters.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          className="size-9 overflow-hidden border border-ink/50 bg-paper-2"
                          title={`${c.name} · ${c.identity}`}
                        >
                          <Thumb src={c.portrait} alt={c.name} className="h-full w-full" fit="cover" />
                        </div>
                      ))}
                      {story.characters.length > 5 && (
                        <div className="flex size-9 items-center justify-center border border-ink/40 bg-paper font-mono text-[9px] text-ink/45">
                          +{story.characters.length - 5}
                        </div>
                      )}
                    </div>
                    <span className="pb-0.5 text-[9px] text-ink/40">
                      {story.characters.length} 名角色 · 每名角色都有私人档案
                    </span>
                  </div>

                  {isCurrent && currentRole && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-l-2 border-ink/60 bg-paper/70 px-2.5 py-1.5">
                      <FileTag>SAVED</FileTag>
                      <span className="text-[10px] text-ink/60">
                        当前课堂角色：{currentRole.name} · {currentRole.identity}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-dotted border-ink/25 pt-3 sm:border-t-0 sm:border-l sm:border-dotted sm:pt-0 sm:pl-4">
                  <div>
                    <div className="font-mono text-[8px] tracking-[0.14em] text-ink/35">ACCESS</div>
                    <p className="mt-1 text-[10px] leading-snug text-ink/50">
                      {status.active
                        ? '自定义剧本生效 · 可用于课堂大屏'
                        : available
                          ? `完整 ${story.acts.length} 幕 · 可选择、课前打印、课堂推进`
                          : (story.demoLabel ?? '演示片段')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {isCurrent ? (
                      <button
                        type="button"
                        onClick={() => navigate(state.phase === 'ending' ? '/ending' : '/classroom')}
                        className="ink-btn ink-btn-solid w-full"
                      >
                        {state.phase === 'ending' ? '查看结局 →' : '继续课堂 →'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/seats/${story.id}`)}
                        className={`ink-btn w-full ${available ? 'ink-btn-solid' : ''}`}
                      >
                        {available ? '编排座位并进入课堂 →' : '用演示片段进入课堂 →'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(story.generated ? '/create' : '/studio')}
                      className="ink-btn w-full text-[9.5px]"
                    >
                      {story.generated ? '再生成' : '剧本工坊'}
                    </button>
                    {isCurrent && (
                      <button
                        type="button"
                        onClick={() => navigate(`/seats/${story.id}`)}
                        className="ink-btn w-full text-[10.5px]"
                      >
                        重新编排座位
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-[7.5px] leading-relaxed tracking-[0.08em] text-ink/30">
                    {story.generated
                      ? 'DATA: GENERATED / LOCAL TEMPLATE'
                      : status.active
                        ? 'DATA: CUSTOM / LOCAL'
                        : story.playable
                          ? 'DATA: BRANCHING / LOCAL'
                          : 'DATA: DEMO / INCOMPLETE'}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2 border border-ink/25 bg-paper-2/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9.5px] leading-relaxed text-ink/50">
            提示：演示档案只包含第一幕片段。我们不会把未完成的内容伪装成完整剧情。
          </p>
          <button type="button" onClick={() => navigate('/help')} className="self-start text-[10px] underline underline-offset-2 sm:self-auto">
            查看使用说明
          </button>
        </div>
      </div>
    </PageShell>
  )
}
