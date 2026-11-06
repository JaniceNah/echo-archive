import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { MaterialSheet, RedactedThermalFeed } from '../components/PrintOverlay'
import { Chip, FileTag, SectionHead, Segmented, Stamp, Thumb } from '../components/ui'
import { allStories, getStory } from '../data/stories'
import { customStatus } from '../logic/customStories'
import { preloadNeuralVoice } from '../logic/dmVoice'
import { availableCharacters, buildProfile } from '../logic/engine'
import { useDmVoice } from '../hooks/useDmVoice'
import { useGameStore } from '../store/useGameStore'

const STEPS = [
  {
    index: '01',
    title: '排座与领档',
    en: 'SEAT SETUP',
    note: '每个座位对应一个角色。私人档案只在课堂里逐人打印，大屏只显示公开信息。',
  },
  {
    index: '02',
    title: '轮流开麦',
    en: 'ONE MIC AT A TIME',
    note: '同一时间只有一支话筒打开。识别到的行动先显示在大屏上，确认后才推进剧情。',
  },
  {
    index: '03',
    title: '改本与复盘',
    en: 'STUDIO & DEBRIEF',
    note: '剧本工坊可编辑与本地生成新幕；转写记录留在本机，供课后复盘。',
  },
]

export function Seats() {
  const navigate = useNavigate()
  const { storyId } = useParams()

  if (!storyId) return <SeatLobby onPick={(id) => navigate(`/seats/${id}`)} onStudio={() => navigate('/studio')} />
  const story = getStory(storyId)
  if (!story) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <h1 className="title-serif text-[26px]">未找到这份档案</h1>
          <p className="mt-2 text-[11.5px] text-ink/55">档案编号无效，可能已被移出索引。</p>
          <button type="button" className="ink-btn mt-4" onClick={() => navigate('/seats')}>
            返回课堂模式
          </button>
        </div>
      </PageShell>
    )
  }
  return <SeatSetup storyId={story.id} />
}

function SeatLobby({ onPick, onStudio }: { onPick: (id: string) => void; onStudio: () => void }) {
  const navigate = useNavigate()
  const stories = allStories()
  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/menu')} className="hover:text-ink">
            ← 主菜单
          </button>
          <span>/</span>
          <span>CLASSROOM MODE / 课堂模式</span>
          <span className="ml-auto border border-ink/40 px-1.5 py-0.5">ONE DEVICE · SHARED SCREEN</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-5 border-b-[1.5px] border-ink pb-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="label-mono text-red">SPEAK · CONFIRM · ADVANCE</div>
            <h1 className="title-serif mt-1.5 text-[40px] leading-[1.02] sm:text-[54px]">
              一台大屏，
              <br />
              全班一起进入档案。
            </h1>
            <p className="mt-3 max-w-[620px] text-[12px] leading-relaxed text-ink/60">
              老师操作一台教室设备推进剧情。学生按座位轮流打开话筒发言，系统识别可能的行动，
              先在大屏上显示候选，确认后才推进。私人档案打印时会显示热敏纸模拟，私人文字以遮挡条呈现。
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Chip tone="ink">4–6 个座位</Chip>
              <Chip>轮流开麦</Chip>
              <Chip>屏幕确认后推进</Chip>
              <Chip>私人档案遮蔽打印</Chip>
              <Chip>转写只存本机</Chip>
            </div>
          </div>
          <div className="border-[1.5px] border-ink bg-sheet/80 p-4">
            <div className="flex items-center justify-between border-b border-ink/40 pb-2">
              <span className="font-mono text-[8px] tracking-[0.16em] text-ink/45">CLASSROOM CHECKLIST</span>
              <Stamp>课堂模式</Stamp>
            </div>
            <ul className="mt-2 space-y-2">
              {[
                ['大屏', '一台教室设备，横屏投影'],
                ['话筒', '按座位轮流打开，一次一支'],
                ['打印机', '热敏纸模拟照常显示，私人文字遮蔽'],
                ['剧本', '可在剧本工坊编辑或本地生成'],
              ].map(([label, note]) => (
                <li key={label} className="flex items-start gap-2 border-b border-dotted border-ink/20 pb-1.5 last:border-0">
                  <span className="mt-1.5 size-1.5 shrink-0 bg-red" />
                  <div>
                    <div className="text-[11px]">{label}</div>
                    <div className="text-[9px] text-ink/45">{note}</div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={onStudio} className="ink-btn mt-3 w-full text-[11px]">
              先打开剧本工坊 →
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.index} className="border border-ink/25 bg-sheet/55 p-3">
              <div className="flex items-center justify-between font-mono text-[8px] tracking-[0.12em] text-ink/40">
                <span>{step.index}</span>
                <span>{step.en}</span>
              </div>
              <div className="mt-1.5 text-[13px]">{step.title}</div>
              <p className="mt-1 text-[9.5px] leading-relaxed text-ink/45">{step.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-3 border-b border-ink/40 pb-1.5">
          <div className="flex items-end gap-2">
            <span className="flex size-5 items-center justify-center border border-ink bg-ink font-mono text-[8px] text-sheet">
              A
            </span>
            <span className="text-[14px]">选择要进入的档案</span>
            <span className="font-mono text-[7.5px] tracking-[0.12em] text-ink/35">SELECT A FILE</span>
          </div>
          <span className="font-mono text-[8px] text-ink/35">{stories.length} RECORDS</span>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stories.map((story) => {
            const status = customStatus(story.id)
            return (
              <article key={story.id} className="group flex flex-col border-[1.5px] border-ink bg-sheet/70">
                <div className="flex items-center justify-between border-b border-ink/35 bg-paper-2/40 px-3 py-1.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] text-ink/55">{story.slot}</span>
                  <span className={`font-mono text-[8px] ${story.playable || status.active ? 'text-ink/55' : 'text-red'}`}>
                    {story.generated ? 'GENERATED' : status.active ? 'CUSTOM' : story.playable ? 'FULL' : 'DEMO'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h2 className="title-serif text-[22px] leading-tight">{story.title}</h2>
                  <div className="mt-1 font-mono text-[7.5px] tracking-[0.14em] text-ink/35">{story.en}</div>
                  <p className="mt-2 flex-1 text-[10.5px] leading-relaxed text-ink/55">{story.logline}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {story.characters.slice(0, 4).map((c) => (
                        <div key={c.id} className="size-8 overflow-hidden border border-ink/40 bg-paper-2">
                          <Thumb src={c.portrait} alt={c.name} className="h-full w-full" fit="cover" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] text-ink/40">{story.characters.length} 个角色</span>
                    {status.pending && (
                      <span className="ml-auto border border-brass/60 px-1 font-mono text-[7px] text-brass">
                        有新剧本待生效
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onPick(story.id)}
                    className={`ink-btn mt-3 w-full ${story.playable || status.active ? 'ink-btn-solid' : ''}`}
                  >
                    编排座位并进入 →
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2 border border-ink/25 bg-paper-2/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9.5px] leading-relaxed text-ink/50">
            本机的课堂进度、剧本和语音转写都保存在浏览器里，不会上传。换设备演示时可用剧本工坊导出 JSON。
          </p>
          <button type="button" onClick={() => navigate('/teacher')} className="self-start text-[10px] underline underline-offset-2 sm:self-auto">
            打开教师控制台
          </button>
        </div>
      </div>
    </PageShell>
  )
}

function SeatSetup({ storyId }: { storyId: string }) {
  const navigate = useNavigate()
  const state = useGameStore()
  const setTeacher = useGameStore((s) => s.setTeacher)
  const startClassroom = useGameStore((s) => s.startClassroom)
  const savePrint = useGameStore((s) => s.savePrint)
  const story = getStory(storyId)!
  const status = customStatus(story.id)
  const dmVoice = useDmVoice()
  useEffect(() => {
    if (dmVoice.enabled) preloadNeuralVoice()
  }, [dmVoice.enabled])

  const minPlayers = Number.parseInt(story.playerRange, 10) || 4
  const maxPlayers = Math.min(6, story.characters.length)
  const defaultPlayers = Math.min(maxPlayers, Math.max(minPlayers, state.teacher.players || 5))
  const [players, setPlayers] = useState(defaultPlayers)
  const durationPresets = story.generated
    ? story.acts.length >= 4
      ? [
          { value: 35, label: '35 分钟', sub: '紧凑' },
          { value: 45, label: '45 分钟', sub: '含复盘' },
        ]
      : [
          { value: 25, label: '25 分钟', sub: '紧凑' },
          { value: 35, label: '35 分钟', sub: '含复盘' },
        ]
    : story.id === 'raise-hand'
      ? [
          { value: 90, label: '90 分钟', sub: '紧凑' },
          { value: 120, label: '120 分钟', sub: '完整' },
        ]
      : [
          { value: 35, label: '35 分钟', sub: '紧凑' },
          { value: 45, label: '45 分钟', sub: '标准' },
        ]
  const preferredDuration = durationPresets.some((o) => o.value === state.teacher.duration)
    ? state.teacher.duration
    : durationPresets[0].value
  const [duration, setDuration] = useState(story.playable || status.active ? preferredDuration : 40)
  const roster = useMemo(() => availableCharacters(story, players), [story, players])
  const [roles, setRoles] = useState<string[]>(() =>
    availableCharacters(story, defaultPlayers).map((c) => c.id),
  )
  const [started, setStarted] = useState(false)
  const [printStage, setPrintStage] = useState<'idle' | 'confirm' | 'printing' | 'done'>('idle')
  const [printProgress, setPrintProgress] = useState(0)
  const [printedCount, setPrintedCount] = useState(0)

  const printProfiles = useMemo(
    () =>
      roles.slice(0, players).flatMap((roleId, seatIndex) => {
        const character = story.characters.find((c) => c.id === roleId)
        return character ? [{ seatIndex, character, material: buildProfile(character, story) }] : []
      }),
    [players, roles, story],
  )

  useEffect(() => {
    if (printStage !== 'printing') return
    setPrintProgress(0)
    const duration = Math.max(1800, printProfiles.length * 900)
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const progress = Math.min(100, Math.round(((Date.now() - startedAt) / duration) * 100))
      setPrintProgress(progress)
      if (progress >= 100) {
        window.clearInterval(timer)
        printProfiles.forEach(({ seatIndex, material }) =>
          savePrint(material, `课前档案 · P${seatIndex + 1}`),
        )
        setPrintedCount(printProfiles.length)
        setPrintStage('done')
      }
    }, 60)
    return () => window.clearInterval(timer)
  }, [printStage, printProfiles, savePrint])

  const existing = Boolean(state.storyId && (state.roleId || state.seats.length))

  const changePlayers = (next: number) => {
    setPlayers(next)
    setRoles(availableCharacters(story, next).map((c) => c.id))
    setPrintedCount(0)
  }

  const assignRole = (seatIndex: number, roleId: string) => {
    setRoles((previous) => {
      const next = [...previous]
      const holder = next.indexOf(roleId)
      if (holder >= 0) next[holder] = next[seatIndex]
      next[seatIndex] = roleId
      return next
    })
    setPrintedCount(0)
  }

  const openPrintFlow = () => {
    setPrintProgress(0)
    setPrintStage('confirm')
  }

  const closePrintFlow = () => {
    setPrintStage('idle')
    setPrintProgress(0)
  }

  const printingSheetIndex = Math.min(
    Math.max(0, printProfiles.length - 1),
    Math.floor((printProgress / 100) * printProfiles.length),
  )
  const printingSheet = printProfiles[printingSheetIndex]

  const start = () => {
    setStarted(true)
    setTeacher({ theme: story.themes[0], players, duration })
    startClassroom(story.id, players, duration, roles)
    navigate('/classroom')
  }

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/seats')} className="hover:text-ink">
            ← 课堂模式
          </button>
          <span>/</span>
          <span>{story.slot} / SEAT SETUP</span>
          <span className="ml-auto flex items-center gap-2">
            {status.active && <span className="border border-ink/45 px-1.5 py-0.5 text-ink/55">CUSTOM SCRIPT ACTIVE</span>}
            <span className="border border-red px-1.5 py-0.5 text-red">PUBLIC INFO ONLY</span>
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-b-[1.5px] border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label-mono text-red">SEATS & PRIVATE FILES</div>
            <h1 className="title-serif mt-1.5 text-[32px] leading-tight sm:text-[38px]">{story.title}</h1>
            <p className="mt-1.5 max-w-[680px] text-[11.5px] leading-relaxed text-ink/55">
              给每个座位指定一个角色。这里只显示公开档案信息；私人背景、隐藏信息与已知线索只出现在
              纸质档案上，打印时屏幕只显示热敏纸模拟与遮挡条。
            </p>
          </div>
          <Stamp tone="ink">SET THE TABLE</Stamp>
        </div>

        {!story.playable && !status.active && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border border-red bg-red/[0.05] px-3 py-2">
            <span className="size-1.5 shrink-0 bg-red" />
            <p className="min-w-0 flex-1 text-[10px] leading-relaxed text-ink/65">
              这是一份演示档案，目前只有第一幕。走完演示后会自动结束；可以先在剧本工坊补全，或在课堂里只做片段演练。
            </p>
            <button type="button" onClick={() => navigate('/studio')} className="ink-btn">
              去剧本工坊
            </button>
          </div>
        )}

        {existing && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border border-brass/60 bg-brass/[0.06] px-3 py-2">
            <span className="size-1.5 shrink-0 bg-brass" />
            <p className="min-w-0 flex-1 text-[10px] leading-relaxed text-ink/60">
              本机已有一局记录。开始课堂模式会覆盖当前进度、打印记录和语音转写；已保存的剧本不会丢失。
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="frame-double bg-sheet/70 p-3 sm:p-4">
            <SectionHead
              index="I"
              title="座位与角色"
              en="SEAT ASSIGNMENT"
              right={<FileTag>{roster.length} 个座位</FileTag>}
            />
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {roster.map((character, index) => {
                const roleId = roles[index] ?? character.id
                const current = story.characters.find((c) => c.id === roleId) ?? character
                return (
                  <article key={`seat-${index}`} className="border border-ink/40 bg-paper/60">
                    <div className="flex items-center justify-between border-b border-ink/25 bg-paper-2/50 px-2 py-1">
                      <span className="font-mono text-[9px] tracking-[0.12em] text-ink/60">P{index + 1}</span>
                      <span className="font-mono text-[7px] tracking-[0.1em] text-ink/35">SEAT {String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="flex gap-2 p-2">
                      <div className="w-[40%] shrink-0 self-end">
                        <Thumb
                          src={current.portrait}
                          alt={current.name}
                          className="h-[118px] w-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] leading-tight">{current.name}</div>
                        <div className="mt-0.5 font-mono text-[7px] tracking-[0.08em] text-ink/40">{current.en}</div>
                        <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-ink/50">{current.identity}</p>
                        <label className="mt-2 block">
                          <span className="font-mono text-[7px] tracking-[0.1em] text-ink/35">角色 ROLE</span>
                          <select
                            value={roleId}
                            onChange={(e) => assignRole(index, e.target.value)}
                            aria-label={`P${index + 1} 的角色`}
                            className="mt-0.5 w-full border border-ink/35 bg-sheet px-1.5 py-1 text-[10px] outline-none focus:border-ink"
                          >
                            {roster.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name} · {option.identity}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-dotted border-ink/25 px-2 py-1">
                      <span className="font-mono text-[7px] tracking-[0.08em] text-ink/35">MIC READY</span>
                      <span className="flex items-center gap-1 font-mono text-[7px] text-ink/45">
                        <span className="size-1.5 bg-[#76854f]" /> 未占用
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dotted border-ink/25 pt-2">
              <span className="font-mono text-[7.5px] tracking-[0.08em] text-ink/35">
                选择已被占用的角色会与对应座位互换，不会出现重复角色。
              </span>
              <span className="ml-auto flex items-center gap-1 font-mono text-[7.5px] text-ink/35">
                PRIVATE FIELDS HIDDEN <span className="border border-red px-1 text-red">OFF-SCREEN</span>
              </span>
            </div>
          </section>

          <aside className="space-y-3">
            <section className="frame-double border-[1.5px] border-ink bg-sheet p-3">
              <div className="flex items-center justify-between">
                <div className="label-mono text-red">PRE-CLASS / 课前档案</div>
                <span className="font-mono text-[7.5px] text-ink/35">
                  {printedCount}/{printProfiles.length} PRINTED
                </span>
              </div>
              <p className="mt-1.5 text-[9.5px] leading-relaxed text-ink/55">
                开始课堂大屏前，为每个座位打印一份可折叠角色档案，按座位号分发。
              </p>
              <ul className="mt-2 space-y-1">
                {printProfiles.map(({ seatIndex, character }) => (
                  <li
                    key={`print-${seatIndex}-${character.id}`}
                    className="flex items-center gap-1.5 border border-ink/15 bg-paper/40 px-1.5 py-1 text-[9px]"
                  >
                    <span className="font-mono text-[7px] text-ink/40">P{seatIndex + 1}</span>
                    <span>{character.name}</span>
                    <span className="ml-auto truncate font-mono text-[7px] text-ink/35">
                      {character.identity}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={openPrintFlow}
                className="ink-btn ink-btn-solid mt-2.5 w-full text-[10.5px]"
              >
                打印全部 {printProfiles.length} 份角色档案 →
              </button>
              <p className="mt-1 text-[8px] leading-relaxed text-ink/40">
                打印时大屏会播放热敏纸模拟，私人文字全部以遮挡条呈现。
              </p>
            </section>

            <section className="frame-double bg-sheet p-3">
              <div className="label-mono text-ink/45">SESSION / 本局参数</div>
              <div className="mt-2 space-y-3">
                <Segmented
                  label="座位数 / SEATS"
                  value={players}
                  onChange={changePlayers}
                  options={[
                    { value: 4, label: '4 人', sub: '4 SEATS' },
                    { value: 5, label: '5 人', sub: '5 SEATS' },
                    { value: 6, label: '6 人', sub: '6 SEATS' },
                  ].filter((option) => option.value >= minPlayers && option.value <= maxPlayers)}
                />
                <Segmented
                  label="时长 / DURATION"
                  value={duration}
                  onChange={setDuration}
                  options={
                    story.playable || status.active
                      ? durationPresets
                      : [{ value: 40, label: '片段', sub: '约 8–10 分钟' }]
                  }
                />
                <p className="text-[8.5px] leading-relaxed text-ink/40">
                  实际座位数取本档案可用的角色数。角色不足时不会复制角色，而是减少座位。
                </p>
              </div>
            </section>

            <section className="border border-ink/30 bg-paper-2/35 p-3">
              <div className="label-mono text-ink/45">HOW THE MIC WORKS</div>
              <ol className="mt-2 space-y-1.5">
                {[
                  '同一时间只有一支话筒打开。老师点击座位就能换麦。',
                  '识别结果先显示为候选行动，确认后才写入剧情。',
                  '浏览器不支持或麦克风被拒绝时，可一键使用模拟发言。',
                  '转写只保存文字，不保存音频，存在本机浏览器里。',
                ].map((line, i) => (
                  <li key={line} className="flex gap-2 text-[9.5px] leading-relaxed text-ink/55">
                    <span className="font-mono text-[7.5px] text-red">0{i + 1}</span>
                    {line}
                  </li>
                ))}
              </ol>
            </section>

            <section className="frame-double bg-sheet p-3">
              <div className="label-mono text-ink/45">NEXT / 下一步</div>
              {status.pending && (
                <p className="mt-1.5 border border-brass/50 bg-brass/[0.06] px-2 py-1.5 text-[9px] leading-relaxed text-ink/60">
                  剧本工坊有未生效的修改。开始本局时会自动应用新版本。
                </p>
              )}
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink/60">
                进入课堂大屏后，先确认座位与话筒，再由老师控制叙述、讨论与下一幕。
              </p>
              {printProfiles.length > 0 && printedCount < printProfiles.length && (
                <p className="mt-1.5 border border-red/40 bg-red/[0.04] px-2 py-1.5 text-[8.5px] leading-relaxed text-ink/55">
                  还有 {printProfiles.length - printedCount} 份档案未打印。可以先打印再开始，课堂内也能按座位补打。
                </p>
              )}
              <button
                type="button"
                onClick={start}
                disabled={started}
                className="ink-btn ink-btn-solid mt-3 w-full"
              >
                {started ? '正在进入…' : '开始课堂大屏 →'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/studio')}
                className="ink-btn mt-2 w-full text-[10.5px]"
              >
                剧本工坊
              </button>
            </section>

            <div className="border border-ink/20 bg-paper-2/35 p-2.5">
              <p className="text-[9px] leading-relaxed text-ink/45">
                隐私说明：此页与大屏只显示角色公开身份、性格与目标。私人背景、隐藏信息与已知线索只出现在
                纸质档案上；打印时屏幕只显示热敏纸模拟，私人文字以遮挡条呈现。
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip>一台设备</Chip>
          <Chip>轮流开麦</Chip>
          <Chip>屏幕确认</Chip>
          <Chip>私人档案遮蔽打印</Chip>
          <span className="ml-auto font-mono text-[7.5px] tracking-[0.1em] text-ink/30">
            ECHO OF A THOUGHT / CLASSROOM PROTOCOL
          </span>
        </div>
      </div>

      {printStage !== 'idle' && (
        <>
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink/92" />

            {printStage === 'confirm' && (
              <div className="frame-double relative z-10 w-full max-w-[600px] bg-sheet p-5 shadow-hard sm:p-7">
                <div className="flex items-start justify-between gap-3 border-b border-ink pb-3">
                  <div>
                    <div className="label-mono text-red">PRE-CLASS PRINT / 课前档案打印</div>
                    <h2 className="title-serif mt-1 text-[28px] leading-tight">
                      打印全部 {printProfiles.length} 份角色档案
                    </h2>
                    <p className="mt-1 text-[10px] text-ink/50">
                      {story.slot} · {story.title}
                    </p>
                  </div>
                  <Stamp>仅限线下分发</Stamp>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {printProfiles.map(({ seatIndex, character }) => (
                    <span
                      key={`confirm-${seatIndex}-${character.id}`}
                      className="border border-ink/30 bg-paper px-1.5 py-0.5 font-mono text-[8px] text-ink/60"
                    >
                      P{seatIndex + 1} {character.name}
                    </span>
                  ))}
                </div>

                <div className="mt-3 space-y-1.5">
                  {[
                    '一次生成全部座位档案，每份都包含公开与私人两部分。',
                    '模拟打印结束后，用「浏览器打印」一次输出全部档案，每份单独一页。',
                    '请按座位号分发，沿虚线折叠；私人部分不要在大屏前展开。',
                  ].map((line, i) => (
                    <p key={line} className="flex gap-2 text-[10.5px] leading-relaxed text-ink/65">
                      <span className="font-mono text-[8px] text-red">0{i + 1}</span>
                      {line}
                    </p>
                  ))}
                </div>

                <p className="mt-3 border border-ink/25 bg-paper-2/40 px-2.5 py-2 text-[9px] leading-relaxed text-ink/45">
                  打印过程会显示热敏纸模拟：纸张与打印状态照常出现，但所有私人文字都以遮挡条替代，不会渲染到屏幕上。
                </p>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button type="button" className="ink-btn" onClick={closePrintFlow}>
                    取消
                  </button>
                  <button
                    type="button"
                    className="ink-btn ink-btn-red"
                    onClick={() => setPrintStage('printing')}
                  >
                    遮蔽文字并打印 →
                  </button>
                </div>
              </div>
            )}

            {printStage === 'printing' && (
              <div className="relative z-10 w-full max-w-[820px]">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
                  <div className="w-full max-w-[380px] shrink-0">
                    <RedactedThermalFeed
                      name={printingSheet?.character.name}
                      identity={printingSheet?.character.identity}
                      seatLabel={`P${(printingSheet?.seatIndex ?? 0) + 1}`}
                      progress={printProgress}
                      sheetKey={printingSheetIndex}
                    />
                    <p className="mt-2 text-center font-mono text-[7px] tracking-[0.14em] text-sheet/35">
                      THERMAL PREVIEW · TEXT REDACTED
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-mono text-[9px] tracking-[0.24em] text-sheet/45">
                      PRE-CLASS PRINT QUEUE
                    </div>
                    <h2 className="title-serif mt-1 text-[30px] leading-tight text-sheet sm:text-[36px]">
                      正在输出角色档案
                    </h2>
                    <p className="mt-2 text-[11px] leading-relaxed text-sheet/55">
                      热敏纸模拟照常运行，但所有私人文字都以遮挡条代替；屏幕不会渲染任何私人内容。
                    </p>
                    <div className="mt-4 space-y-1">
                      {printProfiles.map(({ seatIndex, character }, i) => (
                        <div
                          key={`queue-${seatIndex}-${character.id}`}
                          className={`flex items-center gap-2 border px-2 py-1 font-mono text-[8.5px] ${
                            i === printingSheetIndex
                              ? 'border-sheet/60 bg-sheet/10 text-sheet'
                              : i < printingSheetIndex
                                ? 'border-sheet/20 text-sheet/40'
                                : 'border-sheet/10 text-sheet/25'
                          }`}
                        >
                          <span className="w-5">P{seatIndex + 1}</span>
                          <span className="min-w-0 flex-1 truncate">{character.name}</span>
                          <span>
                            {i < printingSheetIndex ? '已输出' : i === printingSheetIndex ? '输出中' : '排队'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 h-1.5 w-full border border-sheet/30">
                      <div
                        className="h-full bg-red-soft transition-[width] duration-100"
                        style={{ width: `${printProgress}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[8px] text-sheet/40">
                      <span>
                        {String(printProgress).padStart(3, '0')}% / {printingSheetIndex + 1} OF{' '}
                        {printProfiles.length}
                      </span>
                      <span>PRIVATE TEXT SHIELDED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {printStage === 'done' && (
              <div className="frame-double relative z-10 w-full max-w-[600px] bg-sheet p-5 shadow-hard sm:p-7">
                <div className="flex items-start justify-between gap-3 border-b border-ink pb-3">
                  <div>
                    <div className="label-mono text-[#76854f]">PRINT READY / 打印完成</div>
                    <h2 className="title-serif mt-1 text-[30px] leading-tight">角色档案已就绪</h2>
                  </div>
                  <Stamp tone="ink">已记录</Stamp>
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink/65">
                  {printedCount} 份档案已按座位顺序排好。点击「浏览器打印全部档案」，在系统打印对话框中
                  一次输出；每份档案单独一页，上半公开、下半私人。
                </p>
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {printProfiles.map(({ seatIndex, character }) => (
                    <div
                      key={`ready-${seatIndex}-${character.id}`}
                      className="receipt-out border border-ink/25 bg-[#f7f4ec] p-1.5"
                    >
                      <div className="font-mono text-[6px] text-red">P{seatIndex + 1}</div>
                      <div className="mt-0.5 truncate text-[8.5px]">{character.name}</div>
                      <div className="mt-1 space-y-0.5">
                        <div className="h-[2px] w-full bg-ink/20" />
                        <div className="h-[2px] w-4/5 bg-ink/20" />
                        <div className="redaction-bar mt-1 h-[3px] w-full" />
                        <div className="redaction-bar h-[3px] w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border border-ink/25 bg-paper-2/40 px-2.5 py-2">
                  <div className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">DISTRIBUTION / 分发</div>
                  <p className="mt-1 text-[9.5px] leading-relaxed text-ink/50">
                    按 P1–P{printedCount} 的座位号分发，沿虚线折叠后再交给本人。本次打印已写入本机打印记录。
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" className="ink-btn" onClick={() => setPrintStage('printing')}>
                    重新准备
                  </button>
                  <button type="button" className="ink-btn ink-btn-solid" onClick={() => window.print()}>
                    浏览器打印全部档案
                  </button>
                  <button type="button" className="ink-btn ml-auto" onClick={closePrintFlow}>
                    返回编排 →
                  </button>
                </div>
              </div>
            )}
          </div>

          {printStage === 'done' &&
            createPortal(
              <div>
                {printProfiles.map(({ material }) => (
                  <div key={material.id} className="print-sheet">
                    <MaterialSheet material={material} />
                  </div>
                ))}
              </div>,
              document.getElementById('print-portal') ?? document.body,
            )}
        </>
      )}
    </PageShell>
  )
}
