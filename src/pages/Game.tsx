import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { VoiceToggle } from '../components/VoiceToggle'
import { SceneStage } from '../components/game/SceneStage'
import { Dialog, Meter, Typewriter } from '../components/ui'
import { getStory } from '../data/stories'
import { DM_ART, sceneArtFor } from '../data/storyArt'
import { useDmVoice, useDmVoiceLine, useDmVoiceMicGate } from '../hooks/useDmVoice'
import { useSpeech } from '../hooks/useSpeech'
import { cancelDmSpeech, preloadNeuralVoice } from '../logic/dmVoice'
import { buildAssignment, buildEvidence, buildReceipt } from '../logic/engine'
import {
  CATEGORY_META,
  classifyUtterance,
  matchUtterance,
  scoreLabel,
  simulateUtterance,
  summarizeRound,
} from '../logic/voice'
import { useGameStore } from '../store/useGameStore'
import { EFFECT_META, type EffectKey, type VoiceCandidate } from '../types'

const DM_STATES = [
  { key: 'brief', label: '叙述', en: 'NARRATE' },
  { key: 'choice', label: '倾听', en: 'LISTEN' },
  { key: 'feedback', label: '回应', en: 'RESPOND' },
  { key: 'actend', label: '复盘', en: 'DEBRIEF' },
] as const

export function Game() {
  const navigate = useNavigate()
  const state = useGameStore()
  const beginDiscussion = useGameStore((s) => s.beginDiscussion)
  const makeChoice = useGameStore((s) => s.makeChoice)
  const finishFeedback = useGameStore((s) => s.finishFeedback)
  const advanceAct = useGameStore((s) => s.advanceAct)
  const setPaused = useGameStore((s) => s.setPaused)
  const setTakeoverNote = useGameStore((s) => s.setTakeoverNote)
  const setSkipSensitive = useGameStore((s) => s.setSkipSensitive)
  const cycleActor = useGameStore((s) => s.cycleActor)
  const openPrint = useGameStore((s) => s.openPrint)
  const ensureSeats = useGameStore((s) => s.ensureSeats)
  const setSeatMic = useGameStore((s) => s.setSeatMic)
  const setActiveSeat = useGameStore((s) => s.setActiveSeat)
  const addTranscript = useGameStore((s) => s.addTranscript)

  const story = getStory(state.storyId)
  const role = story?.characters.find((c) => c.id === state.roleId)
  const act = story?.acts[state.actIndex]
  const [skipText, setSkipText] = useState(false)
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [recordsOpen, setRecordsOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const seats = state.seats
  const multi = seats.length > 0
  const activeIndex = seats.length ? Math.min(Math.max(state.activeSeat, 0), seats.length - 1) : 0
  const activeSeat = seats[activeIndex]
  const activeCharacter = story?.characters.find((c) => c.id === activeSeat?.roleId)
  const roundEntries = useMemo(
    () =>
      state.history.filter(
        (entry) => entry.actIndex === state.actIndex && typeof entry.seat === 'number',
      ),
    [state.history, state.actIndex],
  )
  const actedSeats = useMemo(
    () => new Set(roundEntries.map((entry) => entry.seat as number)),
    [roundEntries],
  )
  const activeRoundEntry = roundEntries.find((entry) => entry.seat === activeIndex)
  const allSeatsActed = multi && actedSeats.size >= seats.length

  const speech = useSpeech()
  const dmVoice = useDmVoice()
  useEffect(() => {
    if (dmVoice.enabled) preloadNeuralVoice()
  }, [dmVoice.enabled])
  useDmVoiceMicGate('game-mic', speech.listening || speech.processing)
  useDmVoiceLine(
    state.phase === 'choice' && act ? `${act.question}\n任务：${act.task}` : null,
    { owner: 'game-choice' },
  )
  useEffect(() => {
    if (state.paused) cancelDmSpeech()
  }, [state.paused])
  const [micSeat, setMicSeat] = useState<number | null>(null)
  const [voiceTurn, setVoiceTurn] = useState<{
    text: string
    seat: number
    source: 'live' | 'local' | 'simulated'
  } | null>(null)
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const wasListeningRef = useRef(false)
  const lastFinalRef = useRef('')
  const lastIndexRef = useRef(activeIndex)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSkipText(false)
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [state.actIndex, state.phase])

  useEffect(() => {
    if (state.storyId && state.roleId) ensureSeats()
  }, [state.storyId, state.roleId, ensureSeats])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3800)
    return () => window.clearTimeout(timer)
  }, [notice])

  // Moving to another seat must release the previous recognition session,
  // otherwise the Web Speech API keeps the old mic bound and the next player
  // cannot start speaking.
  useEffect(() => {
    if (lastIndexRef.current === activeIndex) return
    lastIndexRef.current = activeIndex
    speech.stop()
    if (micSeat !== null) setSeatMic(micSeat, false)
    setMicSeat(null)
    setVoiceTurn(null)
    setPendingChoiceId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  useEffect(() => {
    if (speech.listening) {
      wasListeningRef.current = true
      return
    }
    // Local ASR keeps recording ended but still transcribing; wait for it.
    if (speech.processing) return
    if (micSeat === null) return
    if (!wasListeningRef.current && !speech.error) return
    const text = speech.finalText.trim()
    const source = speech.usedEngine === 'local' ? 'local' : 'live'
    if (text && lastFinalRef.current !== text && story) {
      lastFinalRef.current = text
      const seat = state.seats[micSeat]
      const character = story.characters.find((c) => c.id === seat?.roleId)
      addTranscript({
        seat: micSeat,
        roleId: character?.id ?? null,
        roleName: character?.name ?? `P${micSeat + 1}`,
        text,
        source,
        actIndex: state.actIndex,
      })
      setVoiceTurn({ text, seat: micSeat, source })
    } else if (!text && speech.error) {
      setNotice(
        speech.error === 'no-speech'
          ? '没有听到清晰的语音。可以再说一次，或改用「模拟发言」。'
          : speech.error === 'denied'
            ? '麦克风权限被拒绝。请在浏览器地址栏重新允许。'
            : speech.error === 'local-failed'
              ? '本地识别失败，可以重试或切换到「浏览器识别」。'
              : '语音识别中断了。可以用「模拟发言」继续。',
      )
    }
    setSeatMic(micSeat, false)
    setMicSeat(null)
    wasListeningRef.current = false
    lastFinalRef.current = ''
    speech.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.listening, speech.processing, speech.error, speech.finalText, micSeat])

  const voiceMatches = useMemo(() => {
    if (!voiceTurn || (multi && voiceTurn.seat !== activeIndex)) return []
    return matchUtterance(voiceTurn.text, state.phase, act)
  }, [voiceTurn, multi, activeIndex, state.phase, act])

  const digest = useMemo(
    () =>
      summarizeRound(
        state.transcripts
          .filter((line) => line.actIndex === state.actIndex)
          .map((line) => ({ seat: line.seat, roleName: line.roleName, text: line.text })),
      ),
    [state.transcripts, state.actIndex],
  )

  const executeChoice = (choiceId: string) => {
    if (state.phase !== 'choice') return
    if (multi && activeRoundEntry) {
      setPendingChoiceId(null)
      setNotice(`P${activeIndex + 1} 本轮已经行动过，请切换到还没行动的座位。`)
      return
    }
    const choice = act?.choices.find((item) => item.id === choiceId)
    if (!choice) return
    if (speech.listening) speech.stop()
    if (activeSeat) setSeatMic(activeIndex, false)
    setMicSeat(null)
    setVoiceTurn(null)
    setPendingChoiceId(null)
    makeChoice(choiceId)
    if (!multi) return
    const nextActed = new Set(actedSeats)
    nextActed.add(activeIndex)
    const name = activeCharacter?.name ?? `P${activeIndex + 1}`
    if (nextActed.size >= seats.length) {
      setNotice(`已记录 P${activeIndex + 1} ${name} 的行动「${choice.title}」。所有座位都已行动，正在汇总本轮发言。`)
      return
    }
    let nextSeat = activeIndex
    for (let step = 1; step <= seats.length; step += 1) {
      const candidate = (activeIndex + step) % seats.length
      if (!nextActed.has(candidate)) {
        nextSeat = candidate
        break
      }
    }
    const nextName =
      story?.characters.find((c) => c.id === seats[nextSeat]?.roleId)?.name ?? `P${nextSeat + 1}`
    setNotice(
      `已记录 P${activeIndex + 1} ${name} 的行动「${choice.title}」。接下来轮到 P${nextSeat + 1} ${nextName}。`,
    )
  }

  const executeStage = (action: VoiceCandidate['action']) => {
    setVoiceTurn(null)
    setPendingChoiceId(null)
    if (action === 'beginDiscussion') beginDiscussion()
    else if (action === 'finishFeedback') finishFeedback()
    else if (action === 'advanceAct') advanceAct()
  }

  const selectSeat = (index: number) => {
    if (index === activeIndex) return
    speech.stop()
    if (micSeat !== null) setSeatMic(micSeat, false)
    setMicSeat(null)
    setVoiceTurn(null)
    setPendingChoiceId(null)
    setActiveSeat(index)
  }

  const handleMic = () => {
    if (!activeSeat) return
    if (activeSeat.muted) {
      setNotice('这个座位已被静音，请先解除静音。')
      return
    }
    if (speech.listening) {
      speech.stop()
      return
    }
    if (speech.processing) {
      setNotice('上一段语音还在识别，请稍候。')
      return
    }
    lastFinalRef.current = ''
    wasListeningRef.current = false
    setSeatMic(activeIndex, true)
    const ok = speech.start()
    if (ok) {
      setMicSeat(activeIndex)
    } else {
      setSeatMic(activeIndex, false)
      setNotice(
        speech.error === 'insecure'
          ? '本地识别需要 https 或 localhost。请换用 https 地址打开。'
          : speech.error === 'denied'
            ? '麦克风权限被拒绝。请在浏览器地址栏重新允许。'
            : '这个浏览器不支持实时语音识别。可以用「模拟发言」走完整个确认流程。',
      )
    }
  }

  const simulateTurn = () => {
    if (!activeSeat) return
    if (activeSeat.muted) {
      setNotice('这个座位已被静音，请先解除静音。')
      return
    }
    if (speech.listening || speech.processing) speech.cancel()
    const text = simulateUtterance(act, state.phase)
    addTranscript({
      seat: activeIndex,
      roleId: activeCharacter?.id ?? null,
      roleName: activeCharacter?.name ?? `P${activeIndex + 1}`,
      text,
      source: 'simulated',
      actIndex: state.actIndex,
    })
    setVoiceTurn({ text, seat: activeIndex, source: 'simulated' })
    setNotice('已生成模拟发言并写入本机转写；确认候选行动后才会推进剧情。')
  }

  const confirmCandidate = (candidate: VoiceCandidate) => {
    if (candidate.kind === 'choice' && candidate.choiceId) executeChoice(candidate.choiceId)
    else if (candidate.action) executeStage(candidate.action)
  }

  useEffect(() => {
    if (state.phase === 'feedback' || state.phase === 'actend') {
      const el = document.getElementById('dialogue-box')
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'ending') navigate('/ending', { replace: true })
  }, [state.phase, navigate])

  const assignment = useMemo(
    () => (story ? buildAssignment(story, state.playerCount, state.roleId) : []),
    [story, state.playerCount, state.roleId],
  )
  const actorSeat = assignment.length ? assignment[state.actorSeat % assignment.length] : undefined
  const actor = story?.characters.find((c) => c.id === actorSeat?.roleId) ?? role

  const lastEntry = state.history[state.history.length - 1]
  const feedbackEntry = useMemo(() => {
    if (!multi) return lastEntry
    return (
      roundEntries.find((entry) => entry.choiceId === state.currentChoiceId) ??
      roundEntries[roundEntries.length - 1] ??
      lastEntry
    )
  }, [multi, roundEntries, state.currentChoiceId, lastEntry])
  const currentChoice = act?.choices.find((c) => c.id === state.currentChoiceId)
  const currentClue = state.clues.find((c) => c.id === feedbackEntry?.clueId)
  const statsBefore = state.snapshots.find((s) => s.actIndex === state.actIndex)?.stats ?? state.stats

  const materials = useMemo(() => {
    if (!story || !act || !currentChoice || !feedbackEntry || !actor) {
      return { receipt: null, evidence: null }
    }
    return {
      receipt: buildReceipt({
        story,
        act,
        choice: currentChoice,
        actor: feedbackEntry.actor || actor.name,
        statsBefore,
        statsAfter: state.stats,
      }),
      evidence: currentClue ? buildEvidence(currentClue) : null,
    }
  }, [story, act, currentChoice, feedbackEntry, actor, statsBefore, state.stats, currentClue])

  const aiState =
    state.phase === 'brief'
      ? 0
      : state.phase === 'choice'
        ? 1
        : state.phase === 'feedback'
          ? 2
          : 3

  if (!story) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <h1 className="title-serif text-[28px]">尚未打开任何档案</h1>
          <p className="mt-2 text-[11.5px] text-ink/55">请先从故事档案中选择一个故事，并完成角色领取。</p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/stories')}>
              打开故事档案
            </button>
            <button type="button" className="ink-btn" onClick={() => navigate('/menu')}>
              返回首页
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  if (!role) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6">
          <div className="label-mono text-red">NO ROLE CLAIMED</div>
          <h1 className="title-serif mt-2 text-[28px]">你还没有领取角色</h1>
          <p className="mt-2 max-w-[480px] text-[11.5px] leading-relaxed text-ink/60">
            每一名玩家都需要一份角色档案。领取后，系统会打印一张可折叠的私人档案，并从第一幕开始。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="ink-btn ink-btn-solid"
              onClick={() => navigate(`/roles/${story.id}`)}
            >
              前往角色档案墙
            </button>
            <button type="button" className="ink-btn" onClick={() => navigate('/stories')}>
              返回故事档案
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  if (!act) {
    return (
      <PageShell narrow>
        <div className="frame-double bg-sheet p-6 text-center">
          <div className="label-mono text-red">SESSION COMPLETE</div>
          <h1 className="title-serif mt-2 text-[30px]">这一局已经结束</h1>
          <p className="mt-2 text-[11.5px] text-ink/55">你可以查看结局、重演关键选择，或进入学习总结。</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/ending')}>
              查看结局
            </button>
            <button type="button" className="ink-btn" onClick={() => navigate('/replay')}>
              关键节点重演
            </button>
            <button type="button" className="ink-btn" onClick={() => navigate('/summary')}>
              学习总结
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  const sceneArt = sceneArtFor(story.id, act.id)
  const cinematic = Boolean(sceneArt)
  const briefMode = cinematic && state.phase === 'brief'
  const sidePanel = cinematic && state.phase !== 'brief'
  const stageSpeakerId =
    state.phase === 'choice' ? (multi ? activeCharacter?.id : (actor?.id ?? role.id)) : undefined

  const printCount = state.prints.length
  const savedReceipt = materials.receipt
    ? state.prints.some((p) => p.material.id === materials.receipt?.id)
    : false
  const effectRows = feedbackEntry
    ? (Object.keys(EFFECT_META) as EffectKey[]).filter((k) => (feedbackEntry.effects[k] ?? 0) !== 0)
    : []

  return (
    <div
      className={
        cinematic
          ? 'relative flex h-dvh flex-col overflow-hidden bg-ink'
          : 'relative flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden'
      }
    >
      <span aria-hidden className="pointer-events-none fixed inset-0 z-0 scanlines opacity-40" />

      <header
        className={
          cinematic
            ? 'absolute inset-x-0 top-0 z-40 shrink-0 border-b border-ink/20 bg-paper/85 backdrop-blur-md'
            : 'sticky top-0 z-40 shrink-0 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur-sm lg:relative'
        }
      >
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2"
            aria-label="回到主菜单"
          >
            <span className="flex size-7 items-center justify-center border border-ink bg-ink text-sheet">
              <span className="title-serif text-[13px]">档</span>
            </span>
            <span className="hidden leading-none sm:block">
              <span className="title-serif block text-[13px] tracking-[0.08em]">一念回响</span>
              <span className="font-mono text-[6.5px] tracking-[0.16em] text-ink/45">ECHO OF A THOUGHT</span>
            </span>
          </button>

          <div className="hidden h-7 w-px bg-ink/25 sm:block" />

          <div className="min-w-0">
            <div className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">
              {story.slot} / {story.playable ? 'FULL RUN' : 'DEMO RUN'}
            </div>
            <div className="truncate text-[12px]">{story.title}</div>
          </div>

          <div className="order-last flex w-full items-center gap-1 sm:order-none sm:ml-2 sm:w-auto">
            {story.acts.map((a, i) => {
              const current = i === state.actIndex
              const done = i < state.actIndex
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-1.5 border px-2 py-1 ${
                    current
                      ? 'border-ink bg-ink text-sheet'
                      : done
                        ? 'border-ink/40 bg-paper-2 text-ink/55'
                        : 'border-ink/20 text-ink/35'
                  }`}
                >
                  <span className="font-mono text-[8px]">{String(a.no).padStart(2, '0')}</span>
                  <span className="text-[9.5px]">{a.title}</span>
                  {done && <span className="font-mono text-[7px] text-ink/40">✓</span>}
                </div>
              )
            })}
            <span className="ml-auto font-mono text-[7.5px] tracking-[0.1em] text-ink/35 sm:ml-3">
              {state.paused ? 'PAUSED' : 'AUTO-SAVED'}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(`/roles/${story.id}/${role.id}`)}
              className="ink-btn h-8 px-2 text-[10px]"
            >
              我的档案
            </button>
            <button
              type="button"
              onClick={() => setPaused(true, 'student')}
              className="ink-btn h-8 px-2 text-[10px]"
            >
              ⏸ 暂停
            </button>
            <button
              type="button"
              onClick={() => setSkipText(true)}
              className="ink-btn h-8 px-2 text-[10px]"
              title="跳过打字机动画"
            >
              ⏭ 跳过
            </button>
            <button
              type="button"
              onClick={() => setTeacherOpen(true)}
              className="ink-btn ink-btn-red h-8 px-2 text-[10px]"
            >
              找老师
            </button>
          </div>
        </div>

        {(state.takeoverNote || state.skipSensitive) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-red/40 bg-red/[0.06] px-3 py-1.5 sm:px-4">
            {state.takeoverNote && (
              <>
                <span className="flex items-center gap-1 font-mono text-[8px] tracking-[0.14em] text-red">
                  <span className="size-1.5 animate-pulse bg-red" />
                  TEACHER TAKEOVER
                </span>
                <p className="text-[10px] text-ink/65">教师接管 AI DM：{state.takeoverNote}</p>
                <button
                  type="button"
                  onClick={() => setTakeoverNote(null)}
                  className="ml-auto font-mono text-[8px] text-ink/45 underline underline-offset-2 hover:text-ink"
                >
                  交还 AI（演示）
                </button>
              </>
            )}
            {state.skipSensitive && (
              <span className="border border-ink/30 bg-paper px-1.5 py-0.5 text-[9px] text-ink/55">
                教师已开启「跳过敏感细节」
              </span>
            )}
          </div>
        )}
      </header>

      <main
        className={
          cinematic
            ? `relative flex w-full flex-1 min-h-0 flex-col ${infoOpen ? 'z-50' : 'z-10'}`
            : 'relative z-10 mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 px-3 py-4 sm:px-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_310px] lg:overflow-y-auto'
        }
      >
        <section className={cinematic ? 'relative flex min-h-0 min-w-0 flex-1 flex-col' : 'flex min-h-0 min-w-0 flex-col'}>
          {cinematic ? (
            <SceneStage
              story={story}
              actNo={act.no}
              actId={act.id}
              scene={act.scene}
              time={act.time}
              characters={story.characters}
              variant="full"
              mode={briefMode ? 'brief' : 'discussion'}
              speakingId={stageSpeakerId}
              sidePanel={sidePanel}
            />
          ) : (
            <div className="min-h-[250px] flex-1 sm:min-h-[300px]">
              <SceneStage
                story={story}
                actNo={act.no}
                actId={act.id}
                scene={act.scene}
                time={act.time}
                characters={story.characters}
                speakingId={stageSpeakerId}
              />
            </div>
          )}

          {briefMode ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-[3vh] sm:pb-[4.5vh]">
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[48vh] bg-[linear-gradient(180deg,rgba(6,7,9,0)_0%,rgba(6,7,9,0.42)_42%,rgba(6,7,9,0.88)_100%)]"
              />
              <div className="relative w-full max-w-[1020px] text-center">
                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-mono text-[8px] tracking-[0.16em] text-sheet/45">
                  <span className="text-red-soft">{act.code}</span>
                  <span>第 {act.no} 幕</span>
                  <span aria-hidden className="h-2 w-px bg-sheet/25" />
                  <span className="title-serif text-[11px] tracking-[0.18em] text-sheet/70">{act.title}</span>
                  <span aria-hidden className="h-2 w-px bg-sheet/25" />
                  <span>{act.time}</span>
                </div>
                {state.skipSensitive ? (
                  <p className="mx-auto mt-2.5 max-w-[820px] text-[13px] leading-[1.9] text-sheet/85 [text-shadow:0_2px_18px_rgba(0,0,0,0.9)] sm:text-[14.5px]">
                    教师已选择跳过本幕的敏感细节。你们仍然需要完成这一件事：{act.task}
                  </p>
                ) : (
                  <Typewriter
                    lines={act.narration}
                    skip={skipText}
                    voice
                    className="mx-auto mt-2.5 max-w-[860px] text-balance text-[13px] leading-[1.9] text-sheet/95 [text-shadow:0_2px_20px_rgba(0,0,0,0.92)] sm:text-[14.5px]"
                    mutedClassName="text-sheet/80"
                  />
                )}
                <div className="pointer-events-auto mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {!skipText && (
                    <button
                      type="button"
                      onClick={() => setSkipText(true)}
                      className="font-mono text-[8px] tracking-[0.14em] text-sheet/40 underline underline-offset-4 transition-colors hover:text-sheet/85"
                    >
                      跳过打字
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={beginDiscussion}
                    className="border border-sheet/35 bg-sheet/[0.08] px-4 py-1.5 text-[11px] tracking-[0.1em] text-sheet backdrop-blur-sm transition-colors hover:border-sheet hover:bg-sheet hover:text-ink"
                  >
                    进入讨论 →
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <div
            ref={panelRef}
            className={
              cinematic
                ? 'absolute top-[82px] right-8 bottom-2 z-20 flex w-[min(92vw,500px)] flex-col gap-2 overflow-y-auto overscroll-contain pr-1 sm:top-[56px]'
                : 'contents'
            }
          >
          <div
            id="dialogue-box"
            key={state.actIndex}
            className={
              cinematic
                ? 'sheet-up relative z-10 w-full shrink-0 border-[1.5px] border-ink/50 bg-sheet/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md'
                : 'sheet-up relative z-10 mx-1 -mt-7 shrink-0 border-[1.5px] border-ink bg-sheet/95 shadow-hard-sm sm:mx-3'
            }
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-ink/35 bg-paper-2/60 px-3 py-1.5">
              <div className="relative size-8 shrink-0 overflow-hidden border border-ink/30 bg-paper-2/40">
                <img
                  src={DM_ART.avatar}
                  alt="AI DM"
                  className="h-full w-full object-contain object-bottom"
                />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">
                    {state.takeoverNote ? '教师 · 人工接管' : 'AI DM · 管理员 零'}
                  </span>
                  {!state.takeoverNote && (
                    <span className="border border-red px-1 font-mono text-[6.5px] text-red">AI</span>
                  )}
                </div>
                <div className="font-mono text-[7px] tracking-[0.1em] text-ink/40">
                  {state.takeoverNote ? 'HUMAN OVERRIDE' : 'LOCAL RULE ENGINE / 无真实 API'}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-1">
                <VoiceToggle className="mr-1" />
                {DM_STATES.map((s, i) => (
                  <span
                    key={s.key}
                    className={`flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[7px] tracking-[0.06em] ${
                      i === aiState
                        ? 'border-ink bg-ink text-sheet'
                        : 'border-ink/20 text-ink/35'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="hidden sm:inline">{s.en}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="px-3 py-3 sm:px-4 sm:py-4">
              {state.phase === 'brief' && (
                <>
                  <div className="mb-2.5 flex flex-wrap items-center gap-2 border-b border-dotted border-ink/25 pb-2">
                    <span className="border border-ink bg-ink px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.1em] text-sheet">
                      {act.code} / 第 {act.no} 幕
                    </span>
                    <span className="title-serif text-[13px] tracking-[0.06em]">{act.title}</span>
                    <span className="font-mono text-[7.5px] text-ink/35">{act.scene}</span>
                    <span className="ml-auto font-mono text-[7.5px] tracking-[0.08em] text-ink/35">
                      {act.time}
                    </span>
                  </div>
                  {state.skipSensitive ? (
                    <div className="border-l-2 border-red/60 bg-red/[0.04] px-3 py-2">
                      <div className="font-mono text-[8px] tracking-[0.12em] text-red">SENSITIVE CONTENT SKIPPED</div>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-ink/65">
                        教师已选择跳过本幕的敏感细节。你们仍然需要完成这一件事：{act.task}
                      </p>
                    </div>
                  ) : (
                    <Typewriter
                      lines={act.narration}
                      skip={skipText}
                      voice
                      className="text-[12.5px] leading-relaxed text-ink/80"
                    />
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dotted border-ink/25 pt-2.5">
                    <span className="text-[9px] text-ink/40">
                      场景：{act.setting}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {!skipText && (
                        <button
                          type="button"
                          onClick={() => setSkipText(true)}
                          className="font-mono text-[8px] text-ink/40 underline underline-offset-2 hover:text-ink"
                        >
                          跳过打字
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={beginDiscussion}
                        className="ink-btn ink-btn-solid"
                      >
                        进入讨论 →
                      </button>
                    </div>
                  </div>
                </>
              )}

              {state.phase === 'choice' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 border border-ink/40 px-1 font-mono text-[7.5px] text-ink/50">
                      L{String(aiState + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-[13px] leading-relaxed">{act.question}</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-ink/45">
                        先把你们知道的和猜测的分开说。主持人确认小组讨论后，再点击一个行动。当前选择会改变后续剧情与可打印的材料。
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-dotted border-ink/25 pt-2">
                    <span className="font-mono text-[8px] tracking-[0.1em] text-ink/40">
                      TASK / {act.task}
                    </span>
                    <span className="ml-auto font-mono text-[8px] text-ink/30">3–5 OPTIONS · NO SCORE</span>
                  </div>
                </>
              )}

              {state.phase === 'feedback' && feedbackEntry && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-red px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.1em] text-red">
                      {multi ? 'COLLECTIVE RESPONSE / 本轮共同回应' : 'RESPONSE / AI 回应'}
                    </span>
                    <span className="font-mono text-[8px] text-ink/35">
                      {multi
                        ? `${roundEntries.length} 位参与者的行动已汇总 · 共同行动：${feedbackEntry.choiceTitle}`
                        : `行动：${feedbackEntry.choiceTitle}`}
                    </span>
                  </div>
                  <Typewriter
                    lines={[feedbackEntry.feedback]}
                    skip={skipText}
                    voice
                    className="mt-2 text-[12.5px] leading-relaxed text-ink/80"
                  />

                  {multi && (
                    <div className="mt-2.5 border border-ink/30 bg-paper-2/40 px-2.5 py-2">
                      <div className="flex items-center justify-between font-mono text-[7.5px] tracking-[0.12em] text-ink/40">
                        <span>SEAT ACTIONS / 各座位行动</span>
                        <span>{roundEntries.length}/{seats.length}</span>
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {roundEntries.map((entry) => {
                          const categories = Array.from(
                            new Set(
                              digest.lines
                                .filter((line) => line.seat === entry.seat)
                                .flatMap((line) => line.categories),
                            ),
                          )
                          const isConsensus = entry.choiceId === state.currentChoiceId
                          return (
                            <li key={`${entry.seat}-${entry.at}`} className="flex flex-wrap items-center gap-1.5 border-b border-dotted border-ink/20 pb-1 last:border-0 last:pb-0">
                              <span className={`border px-1 py-0.5 font-mono text-[7px] ${isConsensus ? 'border-ink bg-ink text-sheet' : 'border-ink/30 text-ink/45'}`}>
                                P{(entry.seat ?? 0) + 1}
                              </span>
                              <span className="text-[10px]">{entry.actor}</span>
                              <span className="text-[9.5px] text-ink/55">{entry.choiceTitle}</span>
                              {isConsensus && (
                                <span className="font-mono text-[7px] text-red">共同行动</span>
                              )}
                              <span className="ml-auto flex flex-wrap gap-1">
                                {categories.length === 0 ? (
                                  <span className="font-mono text-[7px] text-ink/30">无语音 · 屏幕点选</span>
                                ) : (
                                  categories.map((category) => (
                                    <span
                                      key={category}
                                      className={`border px-1 py-0.5 font-mono text-[7px] ${CATEGORY_META[category].chip}`}
                                    >
                                      {CATEGORY_META[category].label}
                                    </span>
                                  ))
                                )}
                              </span>
                            </li>
                          )
                        })}
                      </ul>

                      <div className="mt-2 border-t border-dotted border-ink/25 pt-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">ROUND DIGEST / 本轮发言归类</span>
                          {Object.entries(digest.counts).map(([category, count]) => {
                            const meta = CATEGORY_META[category as keyof typeof CATEGORY_META]
                            return (
                              <span key={category} className={`border px-1 py-0.5 font-mono text-[7px] ${meta.chip}`}>
                                {meta.label} ×{count}
                              </span>
                            )
                          })}
                        </div>
                        <p className="mt-1 text-[9.5px] leading-relaxed text-ink/50">{digest.note}</p>
                      </div>
                    </div>
                  )}

                  {currentChoice && (
                    <div className="mt-2.5 border-l-2 border-ink/40 bg-paper-2/40 px-2.5 py-2">
                      <div className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">OBSERVED / 现场观察</div>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink/60">{currentChoice.observerLine}</p>
                    </div>
                  )}
                </>
              )}

              {state.phase === 'actend' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="border border-ink bg-ink px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.1em] text-sheet">
                      DEBRIEF / 本幕复盘
                    </span>
                    <span className="font-mono text-[8px] text-ink/35">
                      ACT {String(act.no).padStart(2, '0')} COMPLETE
                    </span>
                  </div>
                  <Typewriter
                    lines={[act.closing]}
                    skip={skipText}
                    voice
                    className="mt-2 text-[12.5px] leading-relaxed text-ink/80"
                  />
                  <div className="mt-2.5 border border-ink/25 bg-paper-2/35 px-2.5 py-2">
                    <div className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">REFLECT / 在继续之前</div>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink/60">
                      刚刚这个选择，最先影响到的是谁？你们还有哪一件事没有说出口？
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {state.phase === 'choice' && (
            <div
              className={
                cinematic
                  ? 'sheet-up shrink-0 border-[1.5px] border-ink/50 bg-sheet/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md'
                  : 'mt-3 shrink-0'
              }
            >
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-ink/40 pb-1">
                <div className="flex flex-wrap items-end gap-2">
                  <span className="flex size-5 items-center justify-center border border-ink bg-ink font-mono text-[8px] text-sheet">
                    ?
                  </span>
                  <span className="text-[13px]">行动选择</span>
                  {multi && (
                    <span className="border border-ink/40 bg-paper-2/50 px-1.5 py-0.5 text-[9.5px]">
                      轮到 P{activeIndex + 1} {activeCharacter?.name ?? ''}
                    </span>
                  )}
                  <span className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">
                    {multi ? `ONE ACTION PER SEAT · ${actedSeats.size}/${seats.length}` : 'CHOOSE ONE'}
                  </span>
                </div>
                <span className="text-[9px] text-ink/40">
                  {multi ? '每位参与者各行动一次 · 全部行动后才汇总推进' : '没有标准答案 · 每个选择都会进入不同反馈'}
                </span>
              </div>

              {multi && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {seats.map((seat, index) => {
                      const character = story.characters.find((c) => c.id === seat.roleId)
                      const entry = roundEntries.find((item) => item.seat === index)
                      const current = index === activeIndex
                      return (
                        <button
                          key={`seat-${index}`}
                          type="button"
                          onClick={() => selectSeat(index)}
                          aria-pressed={current}
                          className={`flex items-center gap-1 border px-1.5 py-1 text-[9px] transition-colors ${
                            current
                              ? 'border-ink bg-ink text-sheet'
                              : entry
                                ? 'border-[#76854f]/50 bg-[#76854f]/10 text-ink/60 hover:border-ink/50'
                                : 'border-ink/30 bg-sheet/60 text-ink/55 hover:border-ink'
                          }`}
                        >
                          <span className={`font-mono text-[7.5px] ${current ? 'text-sheet/55' : 'text-ink/35'}`}>
                            P{index + 1}
                          </span>
                          <span className="max-w-[76px] truncate">{character?.name ?? seat.roleId}</span>
                          <span className={`font-mono text-[7px] ${current ? 'text-sheet/60' : entry ? 'text-[#5f6b3f]' : 'text-ink/30'}`}>
                            {entry ? '已行动' : current ? '当前' : '等待'}
                          </span>
                        </button>
                      )
                    })}
                    <span className="ml-auto font-mono text-[8px] tracking-[0.08em] text-ink/35">
                      {actedSeats.size}/{seats.length} ACTED
                    </span>
                  </div>

                  <div className="border border-ink/35 bg-paper-2/45 px-2.5 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[7.5px] tracking-[0.1em] text-ink/40">
                        P{activeIndex + 1} / 发言席
                      </span>
                      <span className="text-[11px]">{activeCharacter?.name ?? '未分配角色'}</span>
                      <span className="border border-ink/30 px-1 py-0.5 font-mono text-[7px] text-ink/40">
                        {activeSeat?.muted
                          ? 'MUTED'
                          : speech.listening
                            ? 'ON AIR'
                            : speech.processing
                              ? 'TRANSCRIBING'
                              : 'READY'}
                      </span>
                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleMic}
                          disabled={activeSeat?.muted || speech.processing}
                          className={`border px-2 py-1 text-[9.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            speech.listening
                              ? 'border-red bg-red text-white hover:bg-ink'
                              : 'border-ink bg-ink text-sheet hover:bg-red'
                          }`}
                        >
                          {speech.listening
                            ? '■ 结束并识别'
                            : speech.processing
                              ? `${speech.progress === null ? '识别中' : `识别中 ${speech.progress}%`}…`
                              : '● 开始发言'}
                        </button>
                        <button
                          type="button"
                          onClick={simulateTurn}
                          disabled={activeSeat?.muted}
                          className="border border-ink/40 bg-sheet px-2 py-1 text-[9.5px] hover:bg-ink hover:text-sheet disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          模拟发言
                        </button>
                      </div>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[7px] tracking-[0.1em] text-ink/35">ENGINE</span>
                      {(
                        [
                          ['local', '本地识别'],
                          ['browser', '浏览器识别'],
                        ] as const
                      ).map(([value, label]) => {
                        const active = speech.engine === value
                        const disabled = value === 'local' ? !speech.localSupported : !speech.supported
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => speech.setEngine(value)}
                            disabled={disabled || speech.listening || speech.processing}
                            className={`border px-1.5 py-0.5 text-[8.5px] disabled:cursor-not-allowed disabled:opacity-40 ${
                              active
                                ? 'border-ink bg-ink text-sheet'
                                : 'border-ink/30 bg-sheet text-ink/55 hover:bg-ink/10'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                      <span className="ml-auto font-mono text-[7px] text-ink/35">
                        {speech.engine === 'local'
                          ? speech.modelReady
                            ? 'MODEL READY'
                            : '首次识别需加载模型'
                          : '依赖浏览器服务'}
                      </span>
                    </div>

                    {(speech.listening || speech.interim || speech.processing) && (
                      <div className="mt-1.5 border border-ink/30 bg-paper/80 px-2 py-1.5">
                        <div className="flex items-center gap-1.5 font-mono text-[7px] tracking-[0.12em] text-red">
                          <span className="size-1.5 animate-pulse bg-red" />
                          {speech.processing
                            ? `TRANSCRIBING · ${speech.usedEngine === 'local' ? 'LOCAL' : 'BROWSER'}${
                                speech.progress === null ? '' : ` ${speech.progress}%`
                              }`
                            : `LIVE TRANSCRIPT · ${speech.engine === 'local' ? 'LOCAL' : 'BROWSER'}`}
                        </div>
                        <p className="mt-0.5 min-h-[1.6em] text-[11px] leading-relaxed text-ink/75">
                          {speech.finalText}
                          {speech.interim && <span className="text-ink/40">{speech.interim}…</span>}
                          {speech.listening && speech.engine === 'local' && !speech.finalText && (
                            <span className="text-ink/40">正在录音…说完点「结束并识别」。</span>
                          )}
                          {speech.processing && !speech.finalText && (
                            <span className="text-ink/40">正在把录音转成文字…</span>
                          )}
                        </p>
                      </div>
                    )}

                    {voiceTurn && (
                      <div className="mt-1.5 border border-ink/30 bg-sheet/80 px-2 py-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[7px] tracking-[0.1em] text-ink/40">
                          <span>LAST UTTERANCE / P{voiceTurn.seat + 1}</span>
                          <span className={voiceTurn.source === 'simulated' ? 'text-brass' : 'text-red'}>
                            {voiceTurn.source === 'simulated'
                              ? 'SIMULATED'
                              : voiceTurn.source === 'local'
                                ? 'LOCAL ASR'
                                : 'LIVE'}
                          </span>
                          <span className="ml-auto">CLASSIFIED</span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink/70">「{voiceTurn.text}」</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {classifyUtterance(voiceTurn.text).map((category) => (
                            <span
                              key={category}
                              className={`inline-flex items-center gap-1 border px-1 py-0.5 font-mono text-[7px] ${CATEGORY_META[category].chip}`}
                            >
                              <span className={`size-1 ${CATEGORY_META[category].dot}`} />
                              {CATEGORY_META[category].label}
                              <span className="opacity-60">{CATEGORY_META[category].en}</span>
                            </span>
                          ))}
                        </div>
                        {voiceMatches.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {voiceMatches.map((candidate) => (
                              <div key={candidate.id} className="flex items-center gap-2 border border-ink/25 bg-paper/70 px-1.5 py-1">
                                <span className="min-w-0 flex-1 truncate text-[10px]">{candidate.label}</span>
                                <span className="font-mono text-[7px] text-ink/40">{scoreLabel(candidate.score)}</span>
                                <button
                                  type="button"
                                  onClick={() => confirmCandidate(candidate)}
                                  className="shrink-0 border border-ink bg-ink px-1.5 py-0.5 text-[8.5px] text-sheet hover:bg-red"
                                >
                                  确认
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {voiceMatches.length === 0 && state.phase === 'choice' && (
                          <p className="mt-1 text-[8.5px] leading-relaxed text-ink/40">
                            没有识别到明确行动。可以直接点选左下方选项，或请该玩家再说一次关键词。
                          </p>
                        )}
                      </div>
                    )}

                    {activeRoundEntry && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 border border-ink/30 bg-sheet/70 px-2 py-1.5">
                        <span className="font-mono text-[7.5px] text-ink/40">本座已行动</span>
                        <span className="text-[10px]">{activeRoundEntry.choiceTitle}</span>
                        {!allSeatsActed && (
                          <button
                            type="button"
                            onClick={() => {
                              for (let step = 1; step <= seats.length; step += 1) {
                                const candidate = (activeIndex + step) % seats.length
                                if (!actedSeats.has(candidate)) {
                                  selectSeat(candidate)
                                  break
                                }
                              }
                            }}
                            className="ml-auto border border-ink/40 bg-sheet px-1.5 py-0.5 text-[9px] hover:bg-ink hover:text-sheet"
                          >
                            切换到下一位 →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pendingChoiceId && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-[1.5px] border-ink bg-ink px-2.5 py-1.5 text-sheet">
                  <span className="font-mono text-[7.5px] tracking-[0.12em] text-sheet/55">CONFIRM / 待确认</span>
                  <span className="text-[11.5px]">
                    P{activeIndex + 1} · {act.choices.find((c) => c.id === pendingChoiceId)?.title}
                  </span>
                  <div className="ml-auto flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPendingChoiceId(null)}
                      className="border border-sheet/50 px-1.5 py-0.5 text-[9.5px] hover:bg-sheet hover:text-ink"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => executeChoice(pendingChoiceId)}
                      className="border border-sheet bg-sheet px-1.5 py-0.5 text-[9.5px] text-ink hover:border-red hover:bg-red hover:text-sheet"
                    >
                      确认执行 →
                    </button>
                  </div>
                </div>
              )}

              <div className={`mt-2 grid grid-cols-1 gap-2 ${cinematic ? '' : 'sm:grid-cols-2'}`}>
                {act.choices.map((choice, i) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setPendingChoiceId(choice.id)}
                    disabled={Boolean(activeRoundEntry)}
                    className={`group flex flex-col border px-3 py-2.5 text-left transition-all hover:border-ink hover:bg-sheet hover:shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-45 ${
                      pendingChoiceId === choice.id ? 'border-ink bg-sheet shadow-hard-sm' : 'border-ink/35 bg-sheet/50'
                    } ${
                      !cinematic && i === act.choices.length - 1 && act.choices.length % 2 === 1
                        ? 'sm:col-span-2'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center border border-ink/50 font-mono text-[8.5px] text-ink/60 group-hover:border-ink group-hover:bg-ink group-hover:text-sheet">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[12.5px]">{choice.title}</span>
                          <span className="hidden font-mono text-[7px] text-ink/30 group-hover:inline">{choice.id.toUpperCase()}</span>
                        </div>
                        <p className="mt-0.5 text-[9.5px] leading-snug text-red/80">{choice.intent}</p>
                        <p className="mt-1 text-[9.5px] leading-relaxed text-ink/45">{choice.description}</p>
                      </div>
                      <span className="mt-1 shrink-0 font-mono text-[11px] text-ink/25 group-hover:text-ink">→</span>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-1.5 font-mono text-[8px] tracking-[0.08em] text-ink/30">
                NO MORAL SCORE / 不进行「好行为 +1」式评分
              </p>
            </div>
          )}

          {state.phase === 'feedback' && feedbackEntry && (
            <div className={`sheet-up mt-3 grid shrink-0 grid-cols-1 gap-2 ${cinematic ? '' : 'sm:grid-cols-2'}`}>
              <div className="border-[1.5px] border-ink bg-sheet/70 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] tracking-[0.12em] text-ink/40">STATE SHIFT / 虚构角色状态</span>
                  <span className="font-mono text-[7px] text-ink/30">NOT A DIAGNOSIS</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {effectRows.length === 0 && (
                    <span className="text-[10px] text-ink/45">状态未发生明显变化。</span>
                  )}
                  {effectRows.map((key) => {
                    const delta = feedbackEntry.effects[key] ?? 0
                    return (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] ${
                          key === 'tension' && delta > 0
                            ? 'border-red/60 bg-red/[0.05] text-red'
                            : 'border-ink/35 bg-paper text-ink/70'
                        }`}
                      >
                        {EFFECT_META[key].label}
                        <span>{delta > 0 ? '+' : ''}{delta}</span>
                      </span>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-[8.5px] leading-relaxed text-ink/35">
                  系统只记录虚构故事中的情绪、信任、信息与安全状态，不评价真实玩家。
                </p>
              </div>

              <div className="border-[1.5px] border-ink bg-sheet/70 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] tracking-[0.12em] text-ink/40">PRINT / 本次可打印</span>
                  <span className="font-mono text-[7px] text-ink/30">已保存 {printCount} 份</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={!materials.receipt}
                    onClick={() => materials.receipt && openPrint(materials.receipt)}
                    className="ink-btn"
                  >
                    行动回执{savedReceipt ? ' · 已保存' : ''}
                  </button>
                  <button
                    type="button"
                    disabled={!materials.evidence}
                    onClick={() => materials.evidence && openPrint(materials.evidence)}
                    className="ink-btn"
                  >
                    {materials.evidence ? `证据 ${materials.evidence.code}` : '本幕无新证据'}
                  </button>
                </div>
                <p className="mt-1.5 text-[8.5px] leading-relaxed text-ink/35">
                  打印内容与刚才的选择对应。已打印的事实不会被改写。
                </p>
              </div>
            </div>
          )}

          {(state.phase === 'feedback' || state.phase === 'actend') && (
            <div
              className={
                cinematic
                  ? 'flex shrink-0 flex-wrap items-center gap-2 border-[1.5px] border-ink/50 bg-sheet/95 px-3 py-2 backdrop-blur-md'
                  : 'mt-3 flex shrink-0 flex-wrap items-center gap-2 border-t border-ink/30 pt-3'
              }
            >
              {state.phase === 'feedback' && (
                <button type="button" onClick={finishFeedback} className="ink-btn ink-btn-solid">
                  结束本幕 →
                </button>
              )}
              {state.phase === 'actend' && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/game/clues')}
                    className="ink-btn"
                  >
                    打开线索档案 ({state.clues.length})
                  </button>
                  <button
                    type="button"
                    onClick={advanceAct}
                    className="ink-btn ink-btn-solid ml-auto"
                  >
                    {!story.playable
                      ? '结束演示片段 →'
                      : state.actIndex >= story.acts.length - 1
                        ? '查看共同结局 →'
                        : `进入第 ${act.no + 1} 幕 →`}
                  </button>
                </>
              )}
            </div>
          )}
          </div>
          )}
        </section>

        {cinematic && infoOpen && (
          <button
            type="button"
            aria-label="关闭信息面板"
            onClick={() => setInfoOpen(false)}
            className="fixed inset-0 z-[55] bg-ink/45 backdrop-blur-[1px]"
          />
        )}

        {cinematic && (
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="fixed top-1/2 right-0 z-30 -translate-y-1/2 border border-sheet/25 border-r-0 bg-ink/75 px-1.5 py-3 font-mono text-[8px] tracking-[0.18em] text-sheet/75 backdrop-blur-sm transition-colors hover:bg-ink [writing-mode:vertical-rl]"
          >
            信息 / INFO
          </button>
        )}

        <aside
          className={
            cinematic
              ? `fixed top-0 right-0 z-[60] h-dvh w-[350px] max-w-[88vw] overflow-y-auto bg-paper/95 p-3 shadow-[-24px_0_70px_rgba(0,0,0,0.45)] transition-transform duration-300 ${
                  infoOpen ? 'translate-x-0' : 'translate-x-full'
                }`
              : 'space-y-3 lg:self-start'
          }
        >
          {cinematic && (
            <div className="mb-2 flex items-center justify-between border-b border-ink/25 pb-2">
              <span className="font-mono text-[8px] tracking-[0.16em] text-ink/45">SESSION PANEL / 本局信息</span>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="border border-ink/35 bg-paper px-2 py-0.5 text-[10px] hover:bg-ink hover:text-sheet"
              >
                关闭 ×
              </button>
            </div>
          )}
          <section className="border-[1.5px] border-ink bg-sheet/75">
            <div className="flex items-center justify-between border-b border-ink/35 bg-paper-2/60 px-2.5 py-1.5">
              <span className="font-mono text-[8px] tracking-[0.14em] text-ink/45">CURRENT TASK</span>
              <span className="flex items-center gap-1 font-mono text-[7.5px] text-ink/35">
                <span className="size-1.5 bg-red" /> 待完成
              </span>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[11.5px] leading-relaxed">{act.task}</p>
              <p className="mt-1.5 border-t border-dotted border-ink/20 pt-1.5 text-[9px] leading-relaxed text-ink/40">
                {act.question}
              </p>
            </div>
          </section>

          <section className="border-[1.5px] border-ink bg-sheet/75">
            <div className="flex items-center justify-between border-b border-ink/35 bg-paper-2/60 px-2.5 py-1.5">
              <span className="font-mono text-[8px] tracking-[0.14em] text-ink/45">
                {multi ? 'PARTICIPANTS / 本轮座位' : 'CURRENT ACTOR / 当前行动玩家'}
              </span>
              {multi ? (
                <span className="font-mono text-[7.5px] text-ink/40">{actedSeats.size}/{seats.length} ACTED</span>
              ) : (
                <button
                  type="button"
                  onClick={cycleActor}
                  className="font-mono text-[7.5px] text-ink/45 underline underline-offset-2 hover:text-ink"
                >
                  更换
                </button>
              )}
            </div>
            {multi ? (
              <>
                <ul className="divide-y divide-dotted divide-ink/20 px-2.5 py-1.5">
                  {seats.map((seat, index) => {
                    const character = story.characters.find((c) => c.id === seat.roleId)
                    const entry = roundEntries.find((item) => item.seat === index)
                    const current = index === activeIndex
                    return (
                      <li key={`drawer-seat-${index}`}>
                        <button
                          type="button"
                          onClick={() => selectSeat(index)}
                          className={`flex w-full items-center gap-2 py-1.5 text-left ${
                            current ? 'text-ink' : 'text-ink/60 hover:text-ink'
                          }`}
                        >
                          <span className={`flex size-6 shrink-0 items-center justify-center border font-mono text-[8px] ${
                            current ? 'border-ink bg-ink text-sheet' : 'border-ink/30'
                          }`}>
                            P{index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px]">{character?.name ?? seat.roleId}</span>
                            <span className="block truncate text-[8.5px] text-ink/40">{character?.identity}</span>
                          </span>
                          <span className={`shrink-0 font-mono text-[7px] ${
                            entry ? 'text-[#5f6b3f]' : current ? 'text-red' : 'text-ink/30'
                          }`}>
                            {entry ? '✓ 已行动' : current ? '当前' : '等待'}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <p className="border-t border-dotted border-ink/20 px-2.5 py-1.5 text-[8.5px] leading-relaxed text-ink/40">
                  每位参与者轮流开麦或点选。全部座位行动后，系统把发言归类、汇总为一次共同行动，再推进剧情。
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center border border-ink font-mono text-[10px]">
                    P{actorSeat?.playerIndex ?? 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px]">{actor?.name ?? role.name}</div>
                    <div className="truncate text-[9px] text-ink/45">{actor?.identity ?? role.identity}</div>
                  </div>
                  {actorSeat?.isYou && <span className="font-mono text-[7px] text-red">YOU</span>}
                </div>
                <p className="border-t border-dotted border-ink/20 px-3 py-1.5 text-[8.5px] leading-relaxed text-ink/40">
                  行动由小组讨论后共同作出，主持玩家负责替小组确认。可以把平板交给下一位玩家。
                </p>
              </>
            )}
          </section>

          <section className="border-[1.5px] border-ink bg-sheet/75">
            <div className="flex items-center justify-between border-b border-ink/35 bg-paper-2/60 px-2.5 py-1.5">
              <span className="font-mono text-[8px] tracking-[0.14em] text-ink/45">CLUES / 已获线索</span>
              <span className="font-mono text-[8px] text-ink/45">{String(state.clues.length).padStart(2, '0')}</span>
            </div>
            <div className="px-2.5 py-2">
              {state.clues.length === 0 && (
                <p className="text-[9.5px] text-ink/40">还没有归档线索。读完场景后进入讨论。</p>
              )}
              <ul className="space-y-1">
                {[...state.clues].reverse().slice(0, 5).map((clue) => (
                  <li key={clue.id}>
                    <button
                      type="button"
                      onClick={() => navigate('/game/clues')}
                      className="flex w-full items-center gap-1.5 border-b border-dotted border-ink/20 py-1 text-left hover:bg-paper-2/40"
                    >
                      <span className="font-mono text-[7.5px] text-red">{clue.code}</span>
                      <span className="min-w-0 flex-1 truncate text-[9.5px]">{clue.title}</span>
                      <span className="font-mono text-[7px] text-ink/30">›</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => navigate('/game/clues')}
                className="mt-2 w-full border border-ink/35 bg-paper px-2 py-1 text-[9.5px] hover:bg-ink hover:text-sheet"
              >
                打开线索档案 →
              </button>
            </div>
          </section>

          <section className="border-[1.5px] border-ink bg-sheet/75">
            <div className="flex items-center justify-between border-b border-ink/35 bg-paper-2/60 px-2.5 py-1.5">
              <span className="font-mono text-[8px] tracking-[0.14em] text-ink/45">FICTIONAL STATE</span>
              <span className="font-mono text-[7px] text-ink/30">0–100</span>
            </div>
            <div className="space-y-2 px-3 py-2.5">
              <Meter label="紧绷" en="TENSION" value={state.stats.tension} tone="red" />
              <Meter label="信任" en="TRUST" value={state.stats.trust} />
              <Meter label="公开" en="OPENNESS" value={state.stats.openness} />
              <Meter label="安全" en="SAFETY" value={state.stats.safety} />
              <p className="text-[8px] leading-relaxed text-ink/35">
                仅表示虚构角色在故事中的处境，不是对真实玩家的心理诊断，也不生成霸凌风险评分。
              </p>
            </div>
          </section>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRecordsOpen(true)}
              className="ink-btn flex-1 text-[10px]"
            >
              打印记录 ({printCount})
            </button>
            <button
              type="button"
              onClick={() => navigate(`/roles/${story.id}/${role.id}`)}
              className="ink-btn flex-1 text-[10px]"
            >
              我的角色
            </button>
          </div>

          <div className="border border-ink/20 bg-paper-2/35 px-2.5 py-2">
            <div className="flex items-center justify-between font-mono text-[7px] tracking-[0.1em] text-ink/35">
              <span>{story.slot} / SESSION</span>
              <span>LOCAL</span>
            </div>
            <p className="mt-1 text-[8.5px] leading-relaxed text-ink/40">
              AI DM 为本地规则引擎。故事为虚构演绎；可随时暂停、跳过或找老师。
            </p>
          </div>
        </aside>
      </main>

      {notice && (
        <div className="fixed bottom-6 left-1/2 z-[130] w-[min(92vw,560px)] -translate-x-1/2 border border-ink bg-sheet px-3 py-2 shadow-hard-sm">
          <p className="text-[10.5px] leading-relaxed text-ink/70">{notice}</p>
        </div>
      )}

      {state.paused && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" />
          <div className="frame-double relative z-10 w-full max-w-[520px] bg-sheet p-5 shadow-hard sm:p-7">
            <div className="flex items-center justify-between border-b border-ink pb-3">
              <div>
                <div className="font-mono text-[8px] tracking-[0.2em] text-red">SESSION PAUSED</div>
                <h2 className="title-serif mt-1 text-[34px] leading-none">游戏已暂停</h2>
              </div>
              <span className="stamp text-[9px]">PAUSE</span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/60">
              {state.pausedBy === 'teacher'
                ? '老师从教师端暂停了本局。请等待老师恢复，或前往教师端查看当前进度。'
                : `当前进度：第 ${act.no} 幕「${act.title}」。进度已自动保存，可以随时回来。`}
            </p>
            <div className="mt-3 border border-ink/25 bg-paper-2/40 px-2.5 py-2">
              <div className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">SAFETY / 安全提示</div>
              <p className="mt-1 text-[9.5px] leading-relaxed text-ink/50">
                如果你需要离开角色或停止讨论，不需要解释。可以请老师接管 AI DM，或直接结束本局。
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {state.pausedBy === 'teacher' ? (
                <button
                  type="button"
                  onClick={() => navigate('/teacher')}
                  className="ink-btn ink-btn-solid"
                >
                  前往教师端
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPaused(false)}
                  className="ink-btn ink-btn-solid"
                >
                  继续本局 →
                </button>
              )}
              <button type="button" onClick={() => navigate('/menu')} className="ink-btn">
                回主菜单（保留进度）
              </button>
              <button type="button" onClick={() => navigate('/help')} className="ink-btn">
                使用说明
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={teacherOpen}
        onClose={() => setTeacherOpen(false)}
        code="HELP / 找老师"
        title="需要暂停或帮助？"
        footer={
          <div className="flex justify-end">
            <button type="button" className="ink-btn" onClick={() => setTeacherOpen(false)}>
              关闭
            </button>
          </div>
        }
      >
        <p className="text-[11.5px] leading-relaxed text-ink/65">
          你可以随时停下来。老师可以从教师端查看进度、暂停活动，或接管 AI DM。
        </p>
        <div className="mt-3 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setPaused(true, 'student')
              setTeacherOpen(false)
            }}
            className="flex w-full items-center justify-between border border-ink/35 bg-paper px-3 py-2 text-left hover:bg-ink hover:text-sheet"
          >
            <span className="text-[11px]">暂停本局，等老师过来</span>
            <span className="font-mono text-[9px]">01</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSkipSensitive(true)
              setTeacherOpen(false)
            }}
            className="flex w-full items-center justify-between border border-ink/35 bg-paper px-3 py-2 text-left hover:bg-ink hover:text-sheet"
          >
            <span className="text-[11px]">跳过本幕的敏感细节</span>
            <span className="font-mono text-[9px]">02</span>
          </button>
          {state.skipSensitive && (
            <button
              type="button"
              onClick={() => {
                setSkipSensitive(false)
                setTeacherOpen(false)
              }}
              className="flex w-full items-center justify-between border border-ink/35 bg-paper px-3 py-2 text-left hover:bg-ink hover:text-sheet"
            >
              <span className="text-[11px]">恢复完整叙述</span>
              <span className="font-mono text-[9px]">03</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/help')}
            className="flex w-full items-center justify-between border border-ink/35 bg-paper px-3 py-2 text-left hover:bg-ink hover:text-sheet"
          >
            <span className="text-[11px]">先看看游戏规则与安全说明</span>
            <span className="font-mono text-[9px]">04</span>
          </button>
        </div>
        <p className="mt-3 text-[9px] leading-relaxed text-ink/40">
          本原型不会联系真实老师，也不会记录真实学生身份。请在实际课堂中举手示意。
        </p>
      </Dialog>

      <Dialog
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        code={`PRINT LOG / ${story.slot}`}
        title={`打印记录 · ${printCount} 份`}
        wide
        footer={
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] text-ink/40">记录保存在本机浏览器，可重复查看。</span>
            <button type="button" className="ink-btn" onClick={() => setRecordsOpen(false)}>
              关闭
            </button>
          </div>
        }
      >
        {printCount === 0 ? (
          <div className="border border-dashed border-ink/35 px-3 py-5 text-center">
            <p className="text-[11.5px]">本局还没有保存的打印材料。</p>
            <p className="mt-1 text-[9.5px] text-ink/45">
              作出行动后，可打印「行动回执」与「事件证据」。打印完成后选择「保存打印记录」。
            </p>
          </div>
        ) : (
          <ul className="max-h-[52vh] space-y-1.5 overflow-y-auto">
            {[...state.prints].reverse().map((record) => (
              <li key={record.id} className="flex flex-wrap items-center gap-2 border border-ink/25 bg-paper/60 px-2.5 py-2">
                <span className="font-mono text-[8px] text-red">{record.material.code}</span>
                <span className="min-w-0 flex-1 truncate text-[11px]">{record.material.title}</span>
                <span className="text-[8.5px] text-ink/40">{record.scope}</span>
                <span className="font-mono text-[8px] text-ink/35">
                  {new Date(record.printedAt).toLocaleString('zh-CN', { hour12: false })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRecordsOpen(false)
                    openPrint(record.material)
                  }}
                  className="ink-btn h-7 px-2 text-[9.5px]"
                >
                  查看
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </div>
  )
}
