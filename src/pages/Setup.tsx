import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { PlayBadge, SectionHead, Segmented, Stamp } from '../components/ui'
import { getStory } from '../data/stories'
import { coverArtFor } from '../data/storyArt'
import type { Story } from '../types'
import { useGameStore } from '../store/useGameStore'

const RULES = [
  {
    q: '这不是一场「找出坏人」的游戏',
    a: '角色没有被分成好人和坏人。每个人都有自己的理解、顾虑和做错的地方。你们的任务不是投票选出罪魁祸首，而是理解一个处境是怎么形成的。',
  },
  {
    q: '角色档案分公开与私人两部分',
    a: '领取角色后，你会得到一张可折叠的档案纸。上半部分可以给同伴看，下半部分只能自己看。不要替别人念出他的私人信息。',
  },
  {
    q: '每个关键事件有 3–5 个行动选项',
    a: '不同选择会改变剧情、线索、角色之间的关系与后续事件。系统记录的是虚构角色的状态，不是对真实玩家的评分。',
  },
  {
    q: '可以随时暂停、跳过或找老师',
    a: '任何一幕都可以暂停。如果某个情节让你不舒服，可以跳过，也可以请老师接管 AI DM。离开角色不需要解释。',
  },
  {
    q: '打印材料与你们的选择一一对应',
    a: '每次打印都会生成与当下选择对应的纸质材料。已经打印的事实不会被 AI 改写；新证据只能补充，不能覆盖。',
  },
  {
    q: '按档案幕数推进，通常为 3–5 幕',
    a: '三幕档案为「发现异常 → 行动与变化 → 共同应对」；五幕档案则每一幕由一名当事人与四名旁观者共同完成。每幕都包含场景、线索、讨论、行动、反馈与打印。',
  },
]

function durationOptionsFor(story: Story) {
  if (story.generated) {
    return story.acts.length >= 4
      ? [
          { value: 35, label: '35 分钟', sub: '紧凑版' },
          { value: 45, label: '45 分钟', sub: '含复盘' },
        ]
      : [
          { value: 25, label: '25 分钟', sub: '紧凑版' },
          { value: 35, label: '35 分钟', sub: '含复盘' },
        ]
  }
  const storyId = story.id
  if (storyId === 'raise-hand') {
    return [
      { value: 90, label: '90 分钟', sub: '紧凑版' },
      { value: 120, label: '120 分钟', sub: '完整版' },
    ]
  }
  return [
    { value: 35, label: '35 分钟', sub: '紧凑版' },
    { value: 45, label: '45 分钟', sub: '完整版' },
  ]
}

export function Setup() {
  const { storyId } = useParams()
  const story = getStory(storyId)
  const navigate = useNavigate()
  const state = useGameStore()
  const beginStory = useGameStore((s) => s.beginStory)
  const setTeacher = useGameStore((s) => s.setTeacher)

  const existing = state.storyId === storyId && Boolean(state.roleId)
  const durationOptions = story ? durationOptionsFor(story) : [ { value: 45, label: '45 分钟', sub: '完整版' } ]
  const preferredDuration = durationOptions.some((o) => o.value === state.teacher.duration)
    ? state.teacher.duration
    : durationOptions[0].value
  const minPlayers = (story && Number.parseInt(story.playerRange, 10)) || 4
  const maxPlayers = story ? Math.min(6, story.characters.length) : 6
  const [players, setPlayers] = useState(
    Math.min(maxPlayers, Math.max(minPlayers, state.teacher.players || 5)),
  )
  const [duration, setDuration] = useState(story?.playable ? preferredDuration : 40)
  const [theme, setTheme] = useState(story?.themes[0] ?? '')
  const [openRule, setOpenRule] = useState<number | null>(0)

  if (!story) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <h1 className="title-serif text-[28px]">未找到这份档案</h1>
          <p className="mt-2 text-[12px] text-ink/60">档案编号无效，可能已被移出索引。</p>
          <button type="button" className="ink-btn mt-4" onClick={() => navigate('/stories')}>
            返回故事档案
          </button>
        </div>
      </PageShell>
    )
  }

  const roles = story ? Math.min(story.characters.length, players) : players
  const demo = !story.playable

  return (
    <PageShell narrow>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/stories')}
            className="font-mono text-[9px] tracking-[0.1em] text-ink/45 hover:text-ink"
          >
            ← 故事档案
          </button>
          <span className="h-px w-5 bg-ink/25" />
          <span className="font-mono text-[9px] tracking-[0.12em] text-ink/50">{story.slot} / SETUP</span>
          <PlayBadge playable={story.playable} />
          {story.generated && (
            <span className="inline-flex items-center border border-red px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-red">
              AI GENERATED / 本地生成
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-3 border-b-[1.5px] border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label-mono text-red">GAME SETUP / 游戏设置</div>
            <h1 className="title-serif mt-1.5 text-[32px] leading-tight sm:text-[38px]">
              {story.title}
            </h1>
            <p className="mt-1.5 text-[11.5px] text-ink/55">{story.logline}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Stamp tone="ink">BEFORE YOU BEGIN</Stamp>
          </div>
        </div>

        {coverArtFor(story) && (
          <div className="relative mt-3 h-[140px] overflow-hidden border border-ink/35 sm:h-[180px]">
            <img
              src={coverArtFor(story) ?? undefined}
              alt={`${story.title} 场景`}
              className="h-full w-full object-cover object-[center_42%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(241,240,233,0.7)_0%,rgba(241,240,233,0.06)_45%,rgba(25,26,28,0.12)_100%)]" />
            <span className="absolute right-2 bottom-2 border border-ink/35 bg-sheet/85 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.14em] text-ink/55">
              {story.slot} / SCENE PLATE
            </span>
          </div>
        )}

        {demo && (
          <div className="mt-4 flex items-start gap-2 border border-red px-3 py-2">
            <span className="mt-1 size-1.5 shrink-0 bg-red" />
            <p className="text-[10.5px] leading-relaxed text-ink/65">
              {story.demoLabel}。你仍可以完成角色领取、序章选择、打印与反馈，但不会有完整多幕与重演对照。
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_270px]">
          <div className="space-y-5">
            <section className="frame-double bg-sheet/70 p-4">
              <SectionHead index="A" title="本局参数" en="SESSION PARAMETERS" />
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Segmented
                  label="参与人数 / PLAYERS"
                  value={players}
                  onChange={setPlayers}
                  options={[
                    { value: 4, label: '4 人', sub: '4 个角色' },
                    { value: 5, label: '5 人', sub: '5 个角色' },
                    { value: 6, label: '6 人', sub: '+ 集体角色' },
                  ].filter((option) => option.value >= minPlayers && option.value <= maxPlayers)}
                />
                <Segmented
                  label="预计时长 / DURATION"
                  value={duration}
                  onChange={setDuration}
                  options={demo ? [{ value: 40, label: '演示片段', sub: '约 8–10 分钟' }] : durationOptions}
                />
              </div>

              <div className="mt-4">
                <div className="label-mono mb-1.5 text-ink/50">本次讨论重点 / FOCUS</div>
                <div className="flex flex-wrap gap-1.5">
                  {story.themes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`border px-2 py-1 text-[10.5px] transition-colors ${
                        theme === t ? 'border-ink bg-ink text-sheet' : 'border-line-soft bg-sheet hover:border-ink'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[9px] text-ink/40">
                  教师端可以修改讨论重点。这里的选择只影响复盘提示，不改变剧情分支。
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-dotted border-ink/25 pt-3 sm:grid-cols-4">
                <div>
                  <div className="font-mono text-[8px] text-ink/40">ROLES</div>
                  <p className="text-[11px]">{roles} 名可领取</p>
                </div>
                <div>
                  <div className="font-mono text-[8px] text-ink/40">ACTS</div>
                  <p className="text-[11px]">{story.playable ? `${story.acts.length} 幕` : '1 段演示'}</p>
                </div>
                <div>
                  <div className="font-mono text-[8px] text-ink/40">PRINT</div>
                  <p className="text-[11px]">4 类材料</p>
                </div>
                <div>
                  <div className="font-mono text-[8px] text-ink/40">REPLAY</div>
                  <p className="text-[11px]">{story.playable ? '可用' : '演示不可用'}</p>
                </div>
              </div>
            </section>

            <section className="frame-double bg-sheet/70 p-4">
              <SectionHead index="B" title="规则说明" en="RULES OF PLAY" right={<span className="text-[9px] text-ink/40">点击展开</span>} />
              <div className="mt-3 border-t border-ink/20">
                {RULES.map((rule, i) => {
                  const open = openRule === i
                  return (
                    <div key={rule.q} className="border-b border-ink/15 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setOpenRule(open ? null : i)}
                        className="flex w-full items-center gap-2.5 py-2.5 text-left"
                        aria-expanded={open}
                      >
                        <span className={`font-mono text-[8.5px] ${open ? 'text-red' : 'text-ink/35'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1 text-[12px]">{rule.q}</span>
                        <span className="font-mono text-[11px] text-ink/40">{open ? '−' : '+'}</span>
                      </button>
                      {open && (
                        <p className="feed-in pb-3 pl-7 text-[10.5px] leading-relaxed text-ink/60">{rule.a}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="border border-ink/25 bg-paper-2/40 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="mt-1 shrink-0 border border-red px-1 font-mono text-[7px] text-red">SAFE</span>
                <p className="text-[10px] leading-relaxed text-ink/55">
                  如果你们正在经历类似的事情，可以随时暂停。故事里的角色是虚构的，但你们的感受不是。
                  需要帮助时，请点击游戏界面右上角的「找老师」，或直接告诉身边的成年人。
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
            <div className="frame-double bg-sheet p-3">
              <div className="label-mono text-ink/45">READINESS / 准备检查</div>
              <ul className="mt-2 space-y-2">
                {[
                  { label: '横屏平板', value: '浏览器已就绪', ok: true },
                  { label: '即时打印机', value: '使用模拟预览', ok: true },
                  { label: 'AI DM', value: '本地规则引擎', ok: true },
                  { label: '网络', value: '不需要联网', ok: true },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-2 border-b border-dotted border-ink/20 pb-1.5 last:border-b-0 last:pb-0">
                    <span className={`size-1.5 shrink-0 ${item.ok ? 'bg-[#76854f]' : 'bg-red'}`} />
                    <span className="text-[10.5px]">{item.label}</span>
                    <span className="ml-auto text-right text-[9px] text-ink/45">{item.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-dotted border-ink/20 pt-2 text-[9px] leading-relaxed text-ink/40">
                真实打印机接入后会替换「模拟预览」。当前不会连接任何物理设备。
              </p>
            </div>

            {existing && (
              <div className="border border-red bg-red/[0.05] p-3">
                <div className="font-mono text-[8px] tracking-[0.12em] text-red">EXISTING SESSION</div>
                <p className="mt-1 text-[10px] leading-relaxed text-ink/65">
                  这份档案已经有一局未完成的记录。开始新局会覆盖当前进度、线索与打印记录。
                </p>
              </div>
            )}

            <div className="frame-double bg-sheet p-3">
              <div className="label-mono text-ink/45">NEXT STEP / 下一步</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink/60">
                设置完成后，系统会按人数开放角色档案。每人领取一个角色，并打印一张可折叠的私人档案。
              </p>
              <button
                type="button"
                onClick={() => {
                  beginStory(story.id, players, duration)
                  setTeacher({ theme, players, duration })
                  navigate(`/roles/${story.id}`)
                }}
                className="ink-btn ink-btn-solid mt-3 w-full"
              >
                {existing ? '覆盖并开始 →' : '进入角色分配 →'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/seats/${story.id}`)}
                className="ink-btn mt-2 w-full text-[10.5px]"
              >
                改用课堂大屏模式 →
              </button>
              <p className="mt-1 text-[8.5px] leading-relaxed text-ink/40">
                课堂模式会把同一台设备交给老师操作，学生按座位轮流开麦；私人档案逐人遮蔽打印。
              </p>
              <button
                type="button"
                onClick={() => navigate('/stories')}
                className="ink-btn mt-2 w-full text-[10.5px]"
              >
                返回
              </button>
            </div>

            <div className="border border-ink/20 bg-paper-2/35 p-2.5">
              <p className="text-[9px] leading-relaxed text-ink/45">
                技术说明：本原型以本地剧情数据与规则引擎模拟 AI DM。未接入真实大模型，也不会向前端写入任何 API 密钥。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
