import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Segmented, Stamp } from '../components/ui'
import { DM_ART } from '../data/storyArt'
import { saveGeneratedStory } from '../logic/generatedStories'
import { SCENE_BASES, composeSceneCard, resolveSceneText } from '../logic/sceneComposer'
import {
  DEFAULT_CAST_NAMES,
  INCIDENT_PRESETS,
  PLACES,
  THEMES,
  TONES,
  generateStory,
  type PlaceId,
  type ThemeId,
  type ToneId,
} from '../logic/storyGenerator'
import type { Story } from '../types'

type Speaker = 'dm' | 'teacher' | 'system'

interface Message {
  id: number
  from: Speaker
  text: string
}

const STEPS = [
  { key: 'place', index: '01', label: '场景', en: 'PLACE', question: '这次的故事发生在哪里？' },
  { key: 'theme', index: '02', label: '议题', en: 'THEME', question: '你最想让学生讨论哪一种处境？' },
  { key: 'incident', index: '03', label: '事件', en: 'INCIDENT', question: '是什么事情，让这一天和别的日子不一样？' },
  { key: 'cast', index: '04', label: '人物', en: 'CAST', question: '谁会出现在这个故事里？' },
  { key: 'tone', index: '05', label: '基调', en: 'TONE', question: '你希望教室里的气氛更接近哪一种？' },
] as const

type StepKey = (typeof STEPS)[number]['key']

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    from: 'system',
    text: 'LOCAL TEMPLATE ENGINE / 本地模板编剧 · 未连接真实大模型',
  },
  {
    id: 2,
    from: 'dm',
    text: '我是管理员零。告诉我你想要的剧本——场景、人物、你们想讨论的处境——我会把它整理成一份可以开演的新档案。每一幕都会写清楚谁在什么时候做了什么、留下了什么痕迹；不会用「气氛变紧张了」代替发生了什么。先问第一个问题：这次的故事发生在哪里？',
  },
]

export function Create() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [placeId, setPlaceId] = useState<PlaceId | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [customScene, setCustomScene] = useState('')
  const [customBaseId, setCustomBaseId] = useState<string | null>(null)
  const [themeId, setThemeId] = useState<ThemeId | null>(null)
  const [incident, setIncident] = useState('')
  const [playerCount, setPlayerCount] = useState(5)
  const [toneId, setToneId] = useState<ToneId>('gentle')
  const [actCount, setActCount] = useState<3 | 4>(3)
  const [title, setTitle] = useState('')
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [story, setStory] = useState<Story | null>(null)
  const [generating, setGenerating] = useState(false)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const messageId = useRef(INITIAL_MESSAGES.length)
  const openTimer = useRef<number | null>(null)

  const place = useMemo(() => PLACES.find((p) => p.id === placeId) ?? null, [placeId])
  const sceneMatch = useMemo(() => resolveSceneText(customScene), [customScene])
  const customBase = useMemo(
    () => (customBaseId ? SCENE_BASES.find((b) => b.id === customBaseId) : undefined) ?? sceneMatch.base,
    [customBaseId, sceneMatch],
  )
  const customName = customScene.trim()
  const customReady = customMode && customName.length >= 2
  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) ?? null, [themeId])
  const tone = useMemo(() => TONES.find((t) => t.id === toneId) ?? TONES[0], [toneId])
  const done = stepIndex >= STEPS.length
  const currentStep: StepKey | null = done ? null : STEPS[stepIndex].key

  const push = (from: Speaker, text: string) => {
    messageId.current += 1
    const next: Message = { id: messageId.current, from, text }
    setMessages((prev) => [...prev, next])
  }

  useEffect(() => {
    const el = chatRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, stepIndex])

  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current)
    }
  }, [])

  const setPlace = (id: PlaceId) => {
    setCustomMode(false)
    setPlaceId(id)
  }

  const activateCustom = () => {
    setCustomMode(true)
    setPlaceId(null)
    setCustomBaseId(null)
  }

  const commitStep = () => {
    if (currentStep === 'place' && customReady) {
      push('teacher', `场景（自定）：${customName}`)
      push(
        'dm',
        `好，故事从你写的「${customName}」开始。我在本地素材库里找到最接近的一张底图（${customBase.label}），会在浏览器里把它和标题合成为一张场景卡。接着想——这次要讨论哪一种处境？`,
      )
      setStepIndex(1)
    } else if (currentStep === 'place' && place) {
      push('teacher', `地点：${place.label} · ${place.name}`)
      push('dm', `好，故事从${place.name}开始。${place.blurb} 接着想——这次要讨论哪一种处境？`)
      setStepIndex(1)
    } else if (currentStep === 'theme' && theme) {
      push('teacher', `议题：${theme.label}`)
      push('dm', `记下了：${theme.label}。${theme.blurb} 那么，是什么事情让这一天变得不一样？`)
      setStepIndex(2)
    } else if (currentStep === 'incident' && incident.trim()) {
      push('teacher', `触发事件：${incident.trim()}`)
      push(
        'dm',
        '记下了。我会把这句话展开成第一幕里一件具体的事：谁在场、谁做了什么、留下了什么可以核对的痕迹。接下来，谁会出现在这个故事里？',
      )
      setStepIndex(3)
    } else if (currentStep === 'cast') {
      push('teacher', `${playerCount} 位角色`)
      push(
        'dm',
        '角色姓名与人设会在剧本生成时一并写好。接下来定基调：你希望这个故事离学生更近，还是更留一点呼吸的空间？',
      )
      setStepIndex(4)
    }
  }

  const goBack = () => {
    if (stepIndex <= 0) return
    setStepIndex(stepIndex - 1)
  }

  const generateNow = () => {
    const custom = customReady ? { name: customName, base: customBase } : null
    const basePlaceId = custom ? custom.base.basePlaceId : place?.id
    if (!basePlaceId || !theme || generating) return
    setGenerating(true)
    push(
      'system',
      custom ? 'DRAFTING / 正在匹配场景底图并合成场景卡…' : 'DRAFTING / 正在组合场景、人物与分支…',
    )
    const existing = story
    window.setTimeout(async () => {
      const backdrop = custom ? await composeSceneCard(custom.name, custom.base) : undefined
      const built = generateStory(
        {
          placeId: basePlaceId,
          themeId: theme.id,
          incident,
          playerCount,
          castNames: DEFAULT_CAST_NAMES.slice(0, playerCount),
          toneId: tone.id,
          actCount,
          title,
          customScene: custom ? { name: custom.name, art: custom.base.art, backdrop } : undefined,
        },
        existing ? { id: existing.id, slot: existing.slot } : {},
      )
      saveGeneratedStory(built)
      setStory(built)
      setStepIndex(STEPS.length)
      setGenerating(false)
      push(
        'dm',
        `档案已经拟好：《${built.title}》。${built.acts.length} 幕、${built.characters.length} 个角色。第一幕发生的是：${built.acts[0]?.event ?? built.logline} 可以直接开始排练，也可以修改设定再拟一版。`,
      )
      if (openTimer.current) window.clearTimeout(openTimer.current)
      openTimer.current = window.setTimeout(() => navigate(`/draft/${built.id}`), 2200)
    }, existing ? 700 : 1100)
  }

  const canNext =
    (currentStep === 'place' && (customReady || Boolean(place))) ||
    (currentStep === 'theme' && Boolean(theme)) ||
    (currentStep === 'incident' && incident.trim().length > 0) ||
    (currentStep === 'cast') ||
    (currentStep === 'tone')

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/menu')} className="hover:text-ink">
            ← 主菜单
          </button>
          <span>/</span>
          <span>STORY COMPOSER / 新剧本室</span>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <span className="border border-red px-1.5 py-0.5 text-red">LOCAL TEMPLATE ENGINE</span>
            <span className="border border-ink/35 px-1.5 py-0.5">NO LIVE API</span>
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-b-[1.5px] border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label-mono text-red">GUIDED CONVERSATION / 引导式对话</div>
            <h1 className="title-serif mt-1.5 text-[34px] leading-tight sm:text-[44px]">
              告诉零，你想演什么。
            </h1>
            <p className="mt-2 max-w-[680px] text-[12px] leading-relaxed text-ink/60">
              用几个问题确定场景、议题、触发事件与人物。管理员零会把它们组合成一份全新的三幕或四幕档案，
              包含对应角色、分支、线索与两种结局，可直接进入排练。
            </p>
          </div>
          <Stamp tone="ink">COMPOSE A CASE</Stamp>
        </div>

        <div className="mt-3 border border-red/50 bg-red/[0.04] px-3 py-2">
          <p className="text-[10px] leading-relaxed text-ink/60">
            <span className="mr-1.5 inline-block size-1.5 bg-red align-middle" />
            AI DM 的「生成」由本地模板与规则引擎完成：它会按你的选择组合文本，但不会访问网络，也不会假装理解你没有输入的内容。
            生成结果是虚构档案，可随时修改或重拟。
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="frame-double flex min-h-[520px] flex-col bg-sheet/70">
            <div className="flex items-center justify-between border-b border-ink/30 bg-paper-2/45 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center border border-ink bg-ink font-mono text-[9px] text-sheet">
                  零
                </span>
                <div className="leading-tight">
                  <div className="text-[11.5px]">管理员 · 零</div>
                  <div className="font-mono text-[7px] tracking-[0.14em] text-ink/40">AI DM / COMPOSER</div>
                </div>
              </div>
              <span className="font-mono text-[8px] tracking-[0.12em] text-ink/40">
                {done ? 'DRAFT READY' : `STEP ${stepIndex + 1} / ${STEPS.length}`}
              </span>
            </div>

            <div ref={chatRef} className="max-h-[42vh] min-h-[180px] space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
              {messages.map((message) => {
                if (message.from === 'system') {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <span className="border border-ink/25 bg-paper/70 px-2 py-0.5 font-mono text-[7.5px] tracking-[0.12em] text-ink/45">
                        {message.text}
                      </span>
                    </div>
                  )
                }
                if (message.from === 'teacher') {
                  return (
                    <div key={message.id} className="feed-in flex justify-end">
                      <div className="max-w-[82%] border border-ink bg-ink px-3 py-2 text-[11.5px] leading-relaxed text-sheet">
                        {message.text}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={message.id} className="feed-in flex items-start gap-2">
                    <div className="mt-0.5 size-7 shrink-0 overflow-hidden border border-ink/40 bg-paper-2">
                      <img src={DM_ART.avatar} alt="AI DM 管理员零" className="h-full w-full object-cover object-top" />
                    </div>
                    <div className="max-w-[85%] border border-ink/25 bg-paper/75 px-3 py-2 text-[11.5px] leading-relaxed text-ink/75">
                      {message.text}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-ink/35 bg-sheet/60 p-3 sm:p-4">
              {done && story ? (
                <div className="feed-in">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stamp tone="ink" rotate={false}>
                      DRAFT READY
                    </Stamp>
                    <span className="font-mono text-[8px] tracking-[0.14em] text-ink/45">{story.slot} / GENERATED</span>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink/65">
                    档案已经拟好：《{story.title}》。正在把剧本从档案袋里取出…
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/draft/${story.id}`)}
                      className="ink-btn ink-btn-solid"
                    >
                      打开剧本 →
                    </button>
                    <button type="button" onClick={generateNow} disabled={generating} className="ink-btn">
                      {generating ? '正在重拟…' : '换一版（保留设定）'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/menu')}
                      className="ml-auto font-mono text-[9px] tracking-[0.1em] text-ink/40 hover:text-ink"
                    >
                      ← 主菜单
                    </button>
                  </div>
                </div>
              ) : (
                <div className="feed-in">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] tracking-[0.16em] text-red">
                      {currentStep ? STEPS[stepIndex].index : '00'} / {currentStep ? STEPS[stepIndex].en : ''}
                    </span>
                    <span className="h-px flex-1 bg-ink/20" />
                    {stepIndex > 0 && (
                      <button type="button" onClick={goBack} className="font-mono text-[8px] text-ink/40 hover:text-ink">
                        ← 上一步
                      </button>
                    )}
                  </div>
                  <h2 className="title-serif mt-1.5 text-[22px] leading-tight sm:text-[26px]">
                    {currentStep ? STEPS[stepIndex].question : ''}
                  </h2>

                  {currentStep === 'place' && (
                    <>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PLACES.map((p) => {
                        const active = placeId === p.id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPlace(p.id)}
                            className={`group overflow-hidden border text-left transition-colors ${
                              active ? 'border-ink bg-ink text-sheet' : 'border-ink/30 bg-sheet hover:border-ink'
                            }`}
                          >
                            <div className="relative h-[62px] overflow-hidden border-b border-ink/20">
                              <img
                                src={p.scene}
                                alt={p.name}
                                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
                                  active ? 'opacity-80' : ''
                                }`}
                                loading="lazy"
                              />
                              <span className="absolute top-1 left-1 bg-sheet/85 px-1 font-mono text-[7px] text-ink/55">
                                {p.en}
                              </span>
                            </div>
                            <div className="px-2 py-1.5">
                              <div className="text-[12px]">{p.label}</div>
                              <div className={`mt-0.5 text-[8.5px] leading-snug ${active ? 'text-sheet/55' : 'text-ink/45'}`}>
                                {p.blurb}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div
                      className={`mt-2 border p-2.5 transition-colors ${
                        customMode ? 'border-ink bg-paper/60' : 'border-dashed border-ink/35 bg-paper/30'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="label-mono text-ink/50">自定义场景 / CUSTOM SCENE</div>
                          <p className="mt-0.5 text-[8.5px] leading-relaxed text-ink/40">
                            不在列表里？写一个地点，零会用本地素材合成一张场景卡。
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => (customMode ? setCustomMode(false) : activateCustom())}
                          className={`border px-2 py-1 font-mono text-[8px] tracking-[0.1em] transition-colors ${
                            customMode
                              ? 'border-ink bg-ink text-sheet'
                              : 'border-ink/40 text-ink/60 hover:border-ink hover:text-ink'
                          }`}
                        >
                          {customMode ? '正在输入 / ON' : '自己写一个场景 →'}
                        </button>
                      </div>

                      {customMode && (
                        <div className="feed-in mt-2.5">
                          <label className="block">
                            <span className="label-mono text-ink/50">地点描述 / TYPE A PLACE</span>
                            <input
                              value={customScene}
                              onChange={(e) => {
                                setCustomScene(e.target.value.slice(0, 18))
                                setCustomBaseId(null)
                              }}
                              maxLength={18}
                              placeholder="例如：海边废弃的灯塔、端午节的古镇河岸"
                              className="mt-1 w-full border border-ink/35 bg-sheet px-2.5 py-1.5 text-[12px] outline-none focus:border-ink"
                              autoFocus
                            />
                          </label>

                          <div className="mt-2 flex gap-2">
                            <div className="relative h-[64px] w-[104px] shrink-0 overflow-hidden border border-ink/30 bg-paper-2">
                              <img
                                src={customBase.art}
                                alt={customBase.label}
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute right-0 bottom-0 left-0 bg-ink/70 px-1 py-0.5 font-mono text-[6.5px] tracking-[0.08em] text-sheet/75">
                                {customBase.en}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] leading-snug">
                                {customName.length === 0 ? (
                                  <span className="text-ink/45">输入场景后，这里会显示本地匹配到的底图。</span>
                                ) : customBaseId ? (
                                  <span>
                                    匹配底图：<b>{customBase.label}</b>{' '}
                                    <span className="font-mono text-[8px] text-ink/40">/ 手动指定</span>
                                  </span>
                                ) : sceneMatch.matched ? (
                                  <span>
                                    匹配底图：<b>{customBase.label}</b>{' '}
                                    <span className="font-mono text-[8px] text-red">
                                      / 命中「{sceneMatch.hits.join('、')}」
                                    </span>
                                  </span>
                                ) : (
                                  <span>
                                    匹配底图：<b>{customBase.label}</b>{' '}
                                    <span className="font-mono text-[8px] text-ink/40">/ 通用底图</span>
                                  </span>
                                )}
                              </p>
                              <p className="mt-1 text-[8.5px] leading-relaxed text-ink/45">
                                本地关键词匹配 → 选一张最接近的素材 → 浏览器内合成场景卡（标题、纹理、暗角）。
                                不联网、不上传。
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {SCENE_BASES.map((b) => {
                                  const activeBase = (customBaseId ?? sceneMatch.base.id) === b.id
                                  return (
                                    <button
                                      key={b.id}
                                      type="button"
                                      onClick={() => setCustomBaseId(b.id)}
                                      className={`border px-1.5 py-0.5 font-mono text-[7px] tracking-[0.06em] transition-colors ${
                                        activeBase
                                          ? 'border-ink bg-ink text-sheet'
                                          : 'border-ink/25 text-ink/45 hover:border-ink hover:text-ink'
                                      }`}
                                    >
                                      {b.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                          {customName.length > 0 && customName.length < 2 && (
                            <p className="mt-1.5 text-[8.5px] text-red">至少输入 2 个字，才能生成场景卡。</p>
                          )}
                        </div>
                      )}
                    </div>
                    </>
                  )}

                  {currentStep === 'theme' && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {THEMES.map((t) => {
                        const active = themeId === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setThemeId(t.id)}
                            className={`border px-2.5 py-2 text-left transition-colors ${
                              active ? 'border-ink bg-ink text-sheet' : 'border-ink/30 bg-sheet hover:border-ink'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px]">{t.label}</span>
                              <span className={`font-mono text-[7px] tracking-[0.1em] ${active ? 'text-sheet/45' : 'text-ink/35'}`}>
                                {t.en}
                              </span>
                            </div>
                            <p className={`mt-0.5 text-[9px] leading-snug ${active ? 'text-sheet/60' : 'text-ink/45'}`}>
                              {t.blurb}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {currentStep === 'incident' && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {INCIDENT_PRESETS.map((item) => {
                          const active = incident === item.label
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setIncident(item.label)}
                              className={`border px-2 py-1 text-[10.5px] transition-colors ${
                                active ? 'border-ink bg-ink text-sheet' : 'border-line-soft bg-sheet hover:border-ink'
                              }`}
                            >
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                      <label className="mt-3 block">
                        <span className="label-mono text-ink/50">或者自己写一句 / TYPE YOUR OWN</span>
                        <textarea
                          value={incident}
                          onChange={(e) => setIncident(e.target.value.slice(0, 60))}
                          rows={2}
                          maxLength={60}
                          placeholder="例如：一次没有人承认的恶作剧，让整组人的作品被退回。"
                          className="mt-1 w-full resize-none border border-ink/35 bg-sheet px-2.5 py-2 text-[11.5px] leading-relaxed outline-none focus:border-ink"
                        />
                      </label>
                      <p className="mt-1 text-[8.5px] leading-relaxed text-ink/40">
                        {incident.trim().length === 0
                          ? '还需要一句触发事件，才能继续。'
                          : `${incident.trim().length}/60 字 · 会写成第一幕里一件具体发生的事，并逐幕推进，不会只写成「气氛变紧张」。`}
                      </p>
                      <p className="mt-1 text-[8.5px] leading-relaxed text-ink/35">
                        提示：提到名单、录音、弄坏的东西、撤回的消息或请假缺席时，系统会生成对应的具体现场与痕迹。
                      </p>
                    </div>
                  )}

                  {currentStep === 'cast' && (
                    <div className="mt-3">
                      <Segmented
                        label="角色数量 / CAST SIZE"
                        value={playerCount}
                        onChange={setPlayerCount}
                        options={[4, 5, 6].map((n) => ({
                          value: n,
                          label: `${n} 位`,
                          sub: n === 6 ? '含集体角色' : `${n} 个视角`,
                        }))}
                      />
                      <p className="mt-2 text-[8.5px] leading-relaxed text-ink/40">
                        这里只确定人数。角色姓名、身份与固定人设会在剧本生成后一并给出，并贯穿全剧。
                      </p>
                    </div>
                  )}

                  {currentStep === 'tone' && (
                    <div className="mt-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {TONES.map((t) => {
                          const active = toneId === t.id
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setToneId(t.id)}
                              className={`border px-2 py-2 text-left transition-colors ${
                                active ? 'border-ink bg-ink text-sheet' : 'border-ink/30 bg-sheet hover:border-ink'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11.5px]">{t.label}</span>
                                <span className={`font-mono text-[7px] ${active ? 'text-sheet/45' : 'text-ink/35'}`}>{t.en}</span>
                              </div>
                              <p className={`mt-1 text-[8.5px] leading-snug ${active ? 'text-sheet/60' : 'text-ink/45'}`}>
                                {t.blurb}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Segmented
                          label="幕数 / ACTS"
                          value={actCount}
                          onChange={(n) => setActCount(n === 4 ? 4 : 3)}
                          options={[
                            { value: 3, label: '三幕', sub: '发现 → 扩散 → 决定' },
                            { value: 4, label: '四幕', sub: '+ 一周后复查' },
                          ]}
                        />
                        <label className="block">
                          <span className="label-mono text-ink/50">标题（可选） / TITLE</span>
                          <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value.slice(0, 18))}
                            maxLength={18}
                            placeholder={`留空则自动拟为「${
                              customMode ? customName : place ? place.cue : ''
                            }·${theme ? theme.title : ''}」`}
                            className="mt-1.5 w-full border border-ink/35 bg-sheet px-2 py-1.5 text-[11.5px] outline-none focus:border-ink"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dotted border-ink/25 pt-3">
                    {currentStep === 'tone' ? (
                      <>
                        <button
                          type="button"
                          onClick={generateNow}
                          disabled={generating}
                          className="ink-btn ink-btn-solid"
                        >
                          {generating ? '正在拟稿…' : story ? '重新拟稿 · 覆盖当前草稿' : '生成档案草稿 →'}
                        </button>
                        <span className="text-[9px] text-ink/45">
                          {story ? '会用当前设定覆盖这份草稿，档案编号保持不变。' : '生成后可先看结构，再决定是否开始排练。'}
                        </span>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={commitStep}
                          disabled={!canNext}
                          className="ink-btn ink-btn-solid"
                        >
                          确认并继续 →
                        </button>
                        {!canNext && (
                          <span className="text-[9px] text-ink/45">
                            还差：
                            {currentStep === 'place' && '选择一个场景，或自定场景至少 2 个字'}
                            {currentStep === 'theme' && '选择一个议题'}
                            {currentStep === 'incident' && '一句触发事件'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-3">
            <section className="frame-double bg-sheet p-3">
              <div className="flex items-center justify-between border-b border-ink/30 pb-1.5">
                <span className="label-mono text-ink/45">LIVE DRAFT / 实时草稿</span>
                <span className="font-mono text-[7.5px] text-ink/35">{story ? story.slot : 'UNFILED'}</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {STEPS.map((step, i) => {
                  const value =
                    step.key === 'place'
                      ? customMode
                        ? customName
                          ? `自定 · ${customName}`
                          : '自定场景 · 待输入'
                        : place?.label
                      : step.key === 'theme'
                        ? theme?.label
                        : step.key === 'incident'
                          ? incident.trim() || null
                          : step.key === 'cast'
                            ? `${playerCount} 位角色 · 生成后命名`
                            : `${tone.label} · ${actCount} 幕`
                  const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'pending'
                  return (
                    <div
                      key={step.key}
                      className={`flex items-start gap-2 border px-2 py-1.5 ${
                        state === 'current'
                          ? 'border-ink bg-paper/70'
                          : state === 'done'
                            ? 'border-ink/25 bg-paper/40'
                            : 'border-dotted border-ink/20'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center border font-mono text-[7px] ${
                          state === 'done'
                            ? 'border-ink bg-ink text-sheet'
                            : state === 'current'
                              ? 'border-red text-red'
                              : 'border-ink/30 text-ink/35'
                        }`}
                      >
                        {state === 'done' ? '✓' : step.index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px]">{step.label}</span>
                          <span className="font-mono text-[7px] tracking-[0.1em] text-ink/30">{step.en}</span>
                        </div>
                        <p className={`mt-0.5 truncate text-[9px] ${value ? 'text-ink/60' : 'text-ink/30'}`}>
                          {value || '待输入'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2.5 h-1 border border-ink/25 bg-paper-2">
                <span
                  className="block h-full bg-ink transition-[width] duration-500"
                  style={{ width: `${done ? 100 : (stepIndex / STEPS.length) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 font-mono text-[7px] tracking-[0.1em] text-ink/35">
                DRAFT NOT PLAYED YET · 未开演
              </p>
            </section>

            <section className="border border-ink/25 bg-paper-2/45 p-3">
              <div className="label-mono text-ink/45">WHAT GETS GENERATED</div>
              <ul className="mt-2 space-y-1.5">
                {[
                  ['骨架', '看见伤害 → 群体影响 → 支持与责任 → 改变规则'],
                  ['事件', '每幕一件具体的事：谁、何时、何地、做了什么、留下什么痕迹'],
                  ['角色', '姓名 + 身份 + 固定人设 + 与人设一致的行为与隐藏信息'],
                  ['材料', '每幕 2 条线索，可选择打印'],
                  ['结局', '两种走向，按选择留下的标记结算'],
                ].map(([label, note]) => (
                  <li key={label} className="flex gap-2 border-b border-dotted border-ink/20 pb-1.5 last:border-0 last:pb-0">
                    <span className="w-8 shrink-0 text-[9px] text-ink/45">{label}</span>
                    <span className="text-[9.5px] leading-snug text-ink/60">{note}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border border-ink/20 bg-paper-2/35 p-2.5">
              <p className="text-[9px] leading-relaxed text-ink/45">
                教育骨架固定，具体事件、人物行为与线索按本次设定生成；角色形象与场景底图来自本地档案库，
                自定场景卡在浏览器内合成。生成结果保存在本机浏览器，不会上传。
              </p>
            </section>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
