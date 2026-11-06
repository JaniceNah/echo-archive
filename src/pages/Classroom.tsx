import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CurtainGate, type CurtainPhase } from '../components/CurtainGate'
import { MaterialSheet, RedactedThermalFeed } from '../components/PrintOverlay'
import { SceneStage } from '../components/game/SceneStage'
import { DM_ART } from '../data/storyArt'
import { VoiceToggle } from '../components/VoiceToggle'
import { Dialog, Stamp, Typewriter } from '../components/ui'
import { useDmVoice, useDmVoiceLine, useDmVoiceMicGate } from '../hooks/useDmVoice'
import { cancelDmSpeech, preloadNeuralVoice } from '../logic/dmVoice'
import { getStory } from '../data/stories'
import { useSpeech } from '../hooks/useSpeech'
import { buildProfile } from '../logic/engine'
import {
  CATEGORY_META,
  classifyUtterance,
  matchUtterance,
  scoreLabel,
  simulateUtterance,
  summarizeRound,
} from '../logic/voice'
import { useGameStore } from '../store/useGameStore'
import { EFFECT_META, type EffectKey, type VoiceAction, type VoiceCandidate } from '../types'

interface VoiceTurn {
  text: string
  seat: number
  source: 'live' | 'local' | 'simulated'
}

function speechErrorText(error: string | null): string | null {
  if (!error) return null
  if (error === 'unsupported') return '这个浏览器不支持实时语音识别。可以用「模拟发言」走完整个确认流程。'
  if (error === 'insecure') return '本地识别需要 https 或 localhost。请换用 https 地址打开，或改用「模拟发言」。'
  if (error === 'denied') return '麦克风权限被拒绝。请在浏览器地址栏重新允许，或改用「模拟发言」。'
  if (error === 'no-speech') return '没有听到清晰的语音。可以再说一次，或改用「模拟发言」。'
  if (error === 'network') return '浏览器识别服务暂时不可用，可以切换到「本地识别」。'
  if (error === 'local-failed') return '本地识别失败，可以重试或切换到「浏览器识别」。'
  if (error === 'switched-local') return '浏览器识别不可用，已自动切换到本地识别，请再点一次「开始发言」。'
  if (error === 'switched-browser') return '本地识别失败，已切换到浏览器识别，请再点一次「开始发言」。'
  return '语音识别中断了。可以用「模拟发言」继续。'
}

export function Classroom() {
  const navigate = useNavigate()
  const state = useGameStore()
  const beginDiscussion = useGameStore((s) => s.beginDiscussion)
  const makeChoice = useGameStore((s) => s.makeChoice)
  const finishFeedback = useGameStore((s) => s.finishFeedback)
  const advanceAct = useGameStore((s) => s.advanceAct)
  const setPaused = useGameStore((s) => s.setPaused)
  const setSeatMic = useGameStore((s) => s.setSeatMic)
  const setSeatMuted = useGameStore((s) => s.setSeatMuted)
  const setAllMuted = useGameStore((s) => s.setAllMuted)
  const setActiveSeat = useGameStore((s) => s.setActiveSeat)
  const addTranscript = useGameStore((s) => s.addTranscript)
  const clearTranscripts = useGameStore((s) => s.clearTranscripts)
  const savePrint = useGameStore((s) => s.savePrint)
  const closeChoiceRound = useGameStore((s) => s.closeChoiceRound)

  const story = getStory(state.storyId)
  const ending = story?.endings.find((e) => e.id === state.endingId)
  const act = state.phase === 'ending' ? undefined : story?.acts[state.actIndex]
  const seats = state.seats
  const activeIndex = seats.length ? Math.min(Math.max(state.activeSeat, 0), seats.length - 1) : 0
  const activeSeat = seats[activeIndex]
  const activeCharacter = story?.characters.find((c) => c.id === activeSeat?.roleId)
  const classroom = state.mode === 'classroom' && seats.length > 0
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
  const allSeatsActed = classroom && actedSeats.size >= seats.length

  const speech = useSpeech()
  const dmVoice = useDmVoice()
  useEffect(() => {
    if (dmVoice.enabled) preloadNeuralVoice()
  }, [dmVoice.enabled])
  useDmVoiceMicGate('classroom-mic', speech.listening || speech.processing)
  useEffect(() => {
    if (state.paused) cancelDmSpeech()
  }, [state.paused])
  const [micSeat, setMicSeat] = useState<number | null>(null)
  const [voiceTurn, setVoiceTurn] = useState<VoiceTurn | null>(null)
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null)
  const [skipText, setSkipText] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [clearArmed, setClearArmed] = useState(false)
  const [printSeat, setPrintSeat] = useState<number | null>(null)
  const [printStage, setPrintStage] = useState<'confirm' | 'printing' | 'done'>('confirm')
  const [printProgress, setPrintProgress] = useState(0)
  const curtainKey = `echo-archive-curtain-${state.storyId ?? 'none'}-${state.startedAt ?? 'draft'}`
  const [curtain, setCurtain] = useState<CurtainPhase>(() => {
    if (state.phase === 'ending') return 'clear'
    try {
      return sessionStorage.getItem(curtainKey) === '1' ? 'clear' : 'closed'
    } catch {
      return 'closed'
    }
  })
  const stageRevealed = curtain === 'open' || curtain === 'clear'
  const wasListeningRef = useRef(false)
  const lastFinalRef = useRef('')
  const lastIndexRef = useRef(activeIndex)

  const lastEntry = state.history[state.history.length - 1]
  const feedbackEntries = useMemo(() => {
    if (classroom) return roundEntries
    return lastEntry ? [lastEntry] : []
  }, [classroom, roundEntries, lastEntry])
  useDmVoiceLine(
    state.phase === 'choice' && act ? `${act.question}\n任务：${act.task}` : null,
    { owner: 'classroom-choice' },
  )
  useDmVoiceLine(
    state.phase === 'feedback' && feedbackEntries.length
      ? feedbackEntries.map((entry) => entry.feedback).join('\n\n')
      : null,
    { owner: 'classroom-feedback' },
  )
  const effectRows = useMemo(() => {
    const totals = new Map<EffectKey, number>()
    for (const entry of feedbackEntries) {
      for (const key of Object.keys(EFFECT_META) as EffectKey[]) {
        const delta = entry.effects[key] ?? 0
        if (delta !== 0) totals.set(key, (totals.get(key) ?? 0) + delta)
      }
    }
    return Array.from(totals.entries())
  }, [feedbackEntries])

  const voiceMatches = useMemo(() => {
    if (!voiceTurn || voiceTurn.seat !== activeIndex) return []
    return matchUtterance(voiceTurn.text, state.phase, act)
  }, [voiceTurn, activeIndex, state.phase, act])

  const digest = useMemo(
    () =>
      summarizeRound(
        state.transcripts
          .filter((line) => line.actIndex === state.actIndex)
          .map((line) => ({ seat: line.seat, roleName: line.roleName, text: line.text })),
      ),
    [state.transcripts, state.actIndex],
  )

  const printCharacter =
    printSeat !== null ? story?.characters.find((c) => c.id === seats[printSeat]?.roleId) : undefined
  const printMaterial = useMemo(
    () => (printCharacter && story ? buildProfile(printCharacter, story) : null),
    [printCharacter, story],
  )

  useEffect(() => {
    setSkipText(false)
    setPendingChoiceId(null)
    setVoiceTurn(null)
  }, [state.actIndex, state.phase])

  // Release the previous seat's recognition before the next player speaks.
  // Without this, a late `onend` from seat 1 can leave seat 2's mic stuck.
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
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (curtain === 'closed' || curtain === 'clear') return
    const next: CurtainPhase = curtain === 'opening' ? 'open' : 'clear'
    const timer = window.setTimeout(() => setCurtain(next), curtain === 'opening' ? 1500 : 900)
    return () => window.clearTimeout(timer)
  }, [curtain])

  useEffect(() => {
    if (curtain === 'closed') return
    try {
      sessionStorage.setItem(curtainKey, '1')
    } catch {
      // storage can be blocked; the curtain simply replays next time
    }
  }, [curtain, curtainKey])

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
      setNotice(speechErrorText(speech.error))
    }
    setSeatMic(micSeat, false)
    setMicSeat(null)
    wasListeningRef.current = false
    lastFinalRef.current = ''
    speech.reset()
  }, [
    speech.listening,
    speech.processing,
    speech.error,
    speech.finalText,
    micSeat,
    story,
    state.seats,
    state.actIndex,
    addTranscript,
    setSeatMic,
    speech,
  ])

  useEffect(() => {
    if (printStage !== 'printing') return
    setPrintProgress(0)
    const started = Date.now()
    const timer = window.setInterval(() => {
      const progress = Math.min(100, Math.round(((Date.now() - started) / 3200) * 100))
      setPrintProgress(progress)
      if (progress >= 100) {
        window.clearInterval(timer)
        setPrintStage('done')
        if (printMaterial) savePrint(printMaterial, `课堂领取 · P${(printSeat ?? 0) + 1}`)
      }
    }, 60)
    return () => window.clearInterval(timer)
  }, [printStage, printMaterial, printSeat, savePrint])

  const executeChoice = (choiceId: string) => {
    if (state.phase !== 'choice') return
    if (classroom && activeRoundEntry) {
      setPendingChoiceId(null)
      setNotice(`P${activeIndex + 1} 本轮已经行动过，请切换到还没行动的座位。`)
      return
    }
    const choice = act?.choices.find((item) => item.id === choiceId)
    if (!choice) return
    if (speech.listening) speech.stop()
    if (micSeat !== null) setSeatMic(micSeat, false)
    setMicSeat(null)
    setVoiceTurn(null)
    setPendingChoiceId(null)
    makeChoice(choiceId)
    if (!classroom) return

    const nextActed = new Set(actedSeats)
    nextActed.add(activeIndex)
    const name = activeCharacter?.name ?? `P${activeIndex + 1}`
    if (nextActed.size >= seats.length) {
      setNotice(`已记录 P${activeIndex + 1} ${name} 的行动「${choice.title}」。所有座位都已行动，进入本轮反馈。`)
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
    const nextRoleId = seats[nextSeat]?.roleId
    const nextName = story?.characters.find((item) => item.id === nextRoleId)?.name ?? `P${nextSeat + 1}`
    setNotice(
      `已记录 P${activeIndex + 1} ${name} 的行动「${choice.title}」。接下来轮到 P${nextSeat + 1} ${nextName}。`,
    )
  }

  const jumpToNextWaiting = () => {
    if (!classroom) return
    for (let step = 1; step <= seats.length; step += 1) {
      const candidate = (activeIndex + step) % seats.length
      if (!actedSeats.has(candidate)) {
        selectSeat(candidate)
        return
      }
    }
  }

  const executeStage = (action: VoiceAction) => {
    setVoiceTurn(null)
    setPendingChoiceId(null)
    if (action === 'beginDiscussion') beginDiscussion()
    else if (action === 'finishFeedback') finishFeedback()
    else advanceAct()
  }

  const handleMic = () => {
    if (!activeSeat) return
    if (activeSeat.muted) {
      setNotice('这个座位已被老师静音，请先解除静音。')
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
      setNotice(speechErrorText(speech.error ?? 'error'))
    }
  }

  const simulateTurn = () => {
    if (!activeSeat) return
    if (activeSeat.muted) {
      setNotice('这个座位已被老师静音，请先解除静音。')
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
    setNotice('已生成模拟发言，并保存到本机转写。')
  }

  const selectSeat = (index: number) => {
    if (index === activeIndex) return
    if (speech.listening) speech.stop()
    setVoiceTurn(null)
    setPendingChoiceId(null)
    setActiveSeat(index)
  }

  const toggleSeatMute = (index: number) => {
    const seat = seats[index]
    if (!seat) return
    if (speech.listening && micSeat === index) speech.stop()
    setSeatMuted(index, !seat.muted)
  }

  const openPrintFlow = (index: number) => {
    if (speech.listening) speech.stop()
    setPrintSeat(index)
    setPrintStage('confirm')
    setPrintProgress(0)
  }

  const closePrintFlow = () => {
    setPrintSeat(null)
    setPrintStage('confirm')
    setPrintProgress(0)
  }

  const confirmCandidate = (candidate: VoiceCandidate) => {
    if (candidate.kind === 'choice' && candidate.choiceId) executeChoice(candidate.choiceId)
    else if (candidate.action) executeStage(candidate.action)
  }

  const exportTranscripts = () => {
    const payload = {
      kind: 'echo-archive-transcript',
      version: 1,
      exportedAt: new Date().toISOString(),
      story: story ? `${story.slot} ${story.title}` : null,
      lines: state.transcripts,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `echo-transcript-${story?.slot ?? 'session'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!story || !state.storyId) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="frame-double bg-sheet p-6">
          <div className="label-mono text-red">NO CLASSROOM SESSION</div>
          <h1 className="title-serif mt-2 text-[28px]">还没有开始课堂模式</h1>
          <p className="mt-2 text-[11.5px] text-ink/55">先在课堂模式里编排座位，再把大屏交给全班。</p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/seats')}>
              编排座位
            </button>
            <button type="button" className="ink-btn" onClick={() => navigate('/menu')}>
              主菜单
            </button>
          </div>
        </div>
      </div>
    )
  }

  const allMuted = seats.length > 0 && seats.every((seat) => seat.muted)
  const micLive = speech.listening
  const micHint = speechErrorText(speech.error)

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink">
      <span aria-hidden className="pointer-events-none fixed inset-0 z-0 scanlines opacity-40" />

      {curtain !== 'clear' && (
        <CurtainGate
          story={story}
          seatCount={seats.length}
          phase={curtain}
          onOpen={() => setCurtain('opening')}
          onBack={() => navigate('/seats')}
          onSkip={() => setCurtain('clear')}
        />
      )}

      {curtain !== 'closed' && (
      <header className="absolute inset-x-0 top-0 z-40 shrink-0 border-b border-ink/20 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-5">
          <button type="button" onClick={() => navigate('/menu')} className="flex items-center gap-2" aria-label="回到主菜单">
            <span className="flex size-7 items-center justify-center border border-ink bg-ink text-sheet">
              <span className="title-serif text-[13px]">档</span>
            </span>
            <span className="hidden leading-none sm:block">
              <span className="title-serif block text-[13px] tracking-[0.08em]">一念回响</span>
              <span className="font-mono text-[6.5px] tracking-[0.16em] text-ink/45">CLASSROOM / SHARED SCREEN</span>
            </span>
          </button>

          <div className="hidden h-7 w-px bg-ink/25 sm:block" />

          <div className="min-w-0">
            <div className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">
              {story.slot} / {act ? `ACT ${String(act.no).padStart(2, '0')}` : 'ENDING'} / CLASSROOM
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
                </div>
              )
            })}
            <span className="ml-auto flex items-center gap-1 font-mono text-[7.5px] tracking-[0.1em] text-red sm:ml-3">
              <span className={`size-1.5 ${micLive ? 'animate-pulse bg-red' : 'bg-ink/25'}`} />
              {micLive ? 'MIC LIVE' : 'MIC STANDBY'}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <VoiceToggle />
            <button type="button" onClick={() => setTranscriptOpen(true)} className="ink-btn h-8 px-2 text-[10px]">
              转写 ({state.transcripts.length})
            </button>
            <button type="button" onClick={() => navigate('/studio')} className="ink-btn h-8 px-2 text-[10px]">
              剧本工坊
            </button>
            <button type="button" onClick={() => navigate('/teacher')} className="ink-btn h-8 px-2 text-[10px]">
              教师端
            </button>
            <button type="button" onClick={() => setPaused(true, 'teacher')} className="ink-btn ink-btn-red h-8 px-2 text-[10px]">
              暂停
            </button>
          </div>
        </div>
      </header>
      )}

      {curtain !== 'closed' && (
      <main className="relative z-10 flex w-full flex-1 min-h-0 flex-col">
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {act ? (
            <SceneStage
              story={story}
              actNo={act.no}
              actId={act.id}
              scene={act.scene}
              time={act.time}
              characters={story.characters}
              variant="full"
              mode={state.phase === 'brief' ? 'brief' : 'discussion'}
              speakingId={state.phase === 'choice' ? activeCharacter?.id : undefined}
              sidePanel={state.phase !== 'brief'}
              panelWidth={320}
              castScale={1.2}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-paper p-6">
              <div className="relative w-full max-w-[900px] overflow-hidden border-[1.5px] border-ink bg-sheet p-5">
                <div className="absolute inset-0 halftone-soft opacity-20" />
                <div className="relative flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="label-mono text-red">SESSION COMPLETE / 本局结束</div>
                    <h1 className="title-serif mt-1.5 text-[34px] leading-none sm:text-[44px]">
                      {ending ? ending.title : '这一局已经结束'}
                    </h1>
                    <p className="mt-2 max-w-[720px] text-[12px] leading-relaxed text-ink/60">
                      {ending?.summary ?? '本剧本没有更多幕。可以进入结局报告、学习总结，或回到剧本工坊继续补全。'}
                    </p>
                  </div>
                  <Stamp tone="ink">{ending?.code ?? 'END'}</Stamp>
                </div>
                <div className="relative mt-4 flex flex-wrap gap-2">
                  <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/ending')}>
                    查看结局报告 →
                  </button>
                  <button type="button" className="ink-btn" onClick={() => navigate('/summary')}>
                    学习总结
                  </button>
                  <button type="button" className="ink-btn" onClick={() => navigate('/studio')}>
                    剧本工坊
                  </button>
                  <button type="button" className="ink-btn" onClick={() => navigate('/seats')}>
                    开新一局
                  </button>
                </div>
              </div>
            </div>
          )}

          {act && state.phase === 'brief' && stageRevealed && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end px-5 pb-[3vh] sm:pr-[4%] sm:pb-[4.5vh] xl:pr-[7%]">
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[48vh] bg-[linear-gradient(180deg,rgba(6,7,9,0)_0%,rgba(6,7,9,0.42)_42%,rgba(6,7,9,0.88)_100%)]"
              />
              <div className="relative w-full max-w-[min(860px,52vw)] text-center xl:max-w-[min(860px,56vw)]">
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
                    voice={dmVoice.enabled}
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
                    onClick={() => executeStage('beginDiscussion')}
                    className="border border-sheet/35 bg-sheet/[0.08] px-4 py-1.5 text-[11px] tracking-[0.1em] text-sheet backdrop-blur-sm transition-colors hover:border-sheet hover:bg-sheet hover:text-ink"
                  >
                    进入小组讨论 →
                  </button>
                </div>
              </div>
            </div>
          )}

          {act && state.phase !== 'brief' && (
            <div className="absolute top-[74px] right-3 bottom-3 z-20 flex w-fit min-w-[min(88vw,260px)] max-w-[min(92vw,320px)] flex-col gap-2 sm:top-[58px] sm:right-5">
              <div
                className={`paper-frame sheet-up relative z-10 w-full ${
                  state.phase === 'choice' ? 'shrink-0' : 'min-h-0 flex-1'
                }`}
              >
                <div
                  className={`paper-sheet paper-deckle paper-object w-full ${
                    state.phase === 'choice' ? '' : 'h-full overflow-y-auto'
                  }`}
                >
                <div className="flex flex-wrap items-center gap-2 border-b border-ink/35 px-3 py-1.5">
                  <div className="relative size-8 shrink-0 overflow-hidden border border-ink/30 bg-paper-2/40">
                    <img src={DM_ART.avatar} alt="AI DM" className="h-full w-full object-contain object-bottom" />
                  </div>
                  <div className="leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">AI DM · 管理员 零</span>
                      <span className="border border-red px-1 font-mono text-[6.5px] text-red">AI</span>
                    </div>
                    <div className="font-mono text-[7px] tracking-[0.1em] text-ink/40">
                      LOCAL RULE ENGINE / 大屏叙述
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 font-mono text-[7.5px] tracking-[0.08em] text-ink/40">
                    <span>{state.phase === 'choice' ? 'LISTEN' : state.phase === 'feedback' ? 'RESPOND' : 'DEBRIEF'}</span>
                    <span className="border border-ink/25 px-1 py-0.5">ONE DEVICE / ALL PLAYERS</span>
                  </div>
                </div>

                <div className="px-3 py-3">
                  {state.phase === 'choice' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 border border-ink/40 px-1 font-mono text-[7.5px] text-ink/50">L02</span>
                        <div>
                          <p className="text-[14px] leading-relaxed">{act.question}</p>
                          <p className="mt-1 text-[10px] leading-relaxed text-ink/45">
                            每位座位各行动一次：开麦识别或屏幕点选后先进入候选栏，确认后记为本座行动，并自动轮到下一位。
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-dotted border-ink/25 pt-2">
                        <span className="font-mono text-[8px] tracking-[0.1em] text-ink/40">TASK / {act.task}</span>
                        <span className="ml-auto font-mono text-[8px] text-ink/30">SCREEN CONFIRM REQUIRED</span>
                      </div>
                    </>
                  )}

                  {state.phase === 'feedback' && feedbackEntries.length > 0 && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-red px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.1em] text-red">
                          COLLECTIVE RESPONSE / 本轮共同回应
                        </span>
                        <span className="font-mono text-[8px] text-ink/35">
                          {feedbackEntries.length} 个行动共同改变了接下来的局面
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        {feedbackEntries.map((entry) => {
                          const categories = Array.from(
                            new Set(
                              digest.lines
                                .filter((line) => line.seat === entry.seat)
                                .flatMap((line) => line.categories),
                            ),
                          )
                          return (
                            <div key={`${entry.seat}-${entry.at}`} className="feed-in border-l-2 border-ink/35 pl-2.5">
                              <div className="flex flex-wrap items-baseline gap-1.5">
                                <span className="border border-ink/30 px-1 font-mono text-[7.5px] text-ink/45">
                                  P{(entry.seat ?? 0) + 1}
                                </span>
                                <span className="text-[11.5px]">{entry.actor}</span>
                                <span className="text-[10px] text-red/80">{entry.choiceTitle}</span>
                                <span className="ml-auto flex flex-wrap gap-1">
                                  {categories.length === 0 ? (
                                    <span className="font-mono text-[7px] text-ink/30">屏幕点选</span>
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
                              </div>
                              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/70">{entry.feedback}</p>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-2 border border-ink/30 bg-paper-2/40 px-2.5 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">
                            ROUND DIGEST / 本轮发言归类
                          </span>
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

                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-dotted border-ink/25 pt-2">
                        <span className="font-mono text-[7.5px] tracking-[0.1em] text-ink/40">本轮合计</span>
                        {effectRows.length === 0 && <span className="text-[10px] text-ink/45">虚构状态未发生明显变化。</span>}
                        {effectRows.map(([key, delta]) => (
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
                        ))}
                        <span className="ml-auto font-mono text-[7px] text-ink/30">NOT A DIAGNOSIS</span>
                      </div>
                      <p className="mt-1.5 text-[9px] leading-relaxed text-ink/45">
                        这些行动已写入本局状态、线索与行动记录，会参与后续幕和最终结局的生成。
                      </p>
                    </>
                  )}

                  {state.phase === 'actend' && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="border border-ink bg-ink px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.1em] text-sheet">
                          DEBRIEF / 本幕复盘
                        </span>
                        <span className="font-mono text-[8px] text-ink/35">ACT {String(act.no).padStart(2, '0')} COMPLETE</span>
                      </div>
                      <Typewriter
                        lines={[act.closing]}
                        skip={skipText}
                        voice={dmVoice.enabled}
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
              </div>

              {state.phase === 'choice' && (
                <div className="paper-frame sheet-up flex min-h-0 w-full flex-1">
                  <div className="paper-sheet paper-deckle paper-object flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-3">
                  <div className="flex flex-wrap items-end justify-between gap-2 border-b border-ink/40 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex size-5 items-center justify-center border border-ink bg-ink font-mono text-[8px] text-sheet">?</span>
                      <span className="text-[13px]">行动选择</span>
                      <span className="border border-ink/40 bg-paper-2/50 px-1.5 py-0.5 text-[9.5px]">
                        轮到 P{activeIndex + 1} {activeCharacter?.name ?? ''}
                      </span>
                      <span className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">
                        ONE ACTION PER SEAT · {actedSeats.size}/{seats.length}
                      </span>
                    </div>
                    <span className="text-[9px] text-ink/40">每个座位各行动一次 · 全部行动后汇总反馈</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {seats.map((seat, index) => {
                      const character = story.characters.find((c) => c.id === seat.roleId)
                      const entry = roundEntries.find((item) => item.seat === index)
                      const current = index === activeIndex
                      return (
                        <button
                          key={`round-${index}`}
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
                    {actedSeats.size > 0 && !allSeatsActed && (
                      <button
                        type="button"
                        onClick={() => {
                          if (speech.listening) speech.stop()
                          setVoiceTurn(null)
                          setPendingChoiceId(null)
                          closeChoiceRound()
                        }}
                        className="ml-auto border border-ink/40 bg-sheet px-2 py-1 text-[9px] hover:bg-ink hover:text-sheet"
                      >
                        老师结束本轮讨论 →
                      </button>
                    )}
                  </div>

                  {activeRoundEntry && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border border-ink/35 bg-paper-2/55 px-3 py-2">
                      <span className="font-mono text-[8px] tracking-[0.1em] text-ink/40">ALREADY ACTED / 本座已行动</span>
                      <span className="text-[11px]">{activeRoundEntry.choiceTitle}</span>
                      {!allSeatsActed && (
                        <button
                          type="button"
                          onClick={jumpToNextWaiting}
                          className="ml-auto border border-ink/40 bg-sheet px-2 py-1 text-[9px] hover:bg-ink hover:text-sheet"
                        >
                          切换到下一位 →
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-2 border border-ink/35 bg-paper-2/45 px-2.5 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[7.5px] tracking-[0.1em] text-ink/40">P{activeIndex + 1} / 发言席</span>
                      <span className="text-[12px]">{activeCharacter?.name ?? '未分配角色'}</span>
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

                    {micHint && !speech.listening && (
                      <p className="mt-1.5 border-l-2 border-red/60 bg-red/[0.04] px-2 py-1 text-[9px] leading-relaxed text-ink/55">
                        {micHint}
                      </p>
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
                            </span>
                          ))}
                        </div>
                        {voiceMatches.length > 0 ? (
                          <div className="mt-1.5 space-y-1">
                            <div className="font-mono text-[7px] tracking-[0.1em] text-ink/40">
                              RECOGNIZED INTENT / 识别到 {voiceMatches.length} 个可能行动
                            </div>
                            {voiceMatches.map((candidate) => (
                              <div key={candidate.id} className="border border-ink/30 bg-sheet/80 px-2 py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="min-w-0 flex-1 truncate text-[11px]">{candidate.label}</span>
                                  <span className="font-mono text-[7px] text-ink/40">{scoreLabel(candidate.score)}</span>
                                  <span className="font-mono text-[8px] tabular-nums text-red">
                                    {Math.round(candidate.score * 100)}%
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="min-w-0 flex-1 truncate text-[8.5px] text-ink/40">{candidate.hint}</span>
                                  <button
                                    type="button"
                                    onClick={() => confirmCandidate(candidate)}
                                    className="shrink-0 border border-ink bg-ink px-2 py-0.5 text-[9px] text-sheet hover:bg-red"
                                  >
                                    确认执行
                                  </button>
                                </div>
                              </div>
                            ))}
                            <p className="font-mono text-[7px] leading-relaxed text-ink/30">
                              NOT AUTO-ADVANCED / 需要老师或主持人确认
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1.5 border-t border-dotted border-ink/25 pt-1 text-[9px] leading-relaxed text-ink/45">
                            没有识别到明确的行动。可以在右侧直接点选，或请学生再说一遍关键词。
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleSeatMute(activeIndex)}
                        className="border border-ink/35 bg-paper px-1.5 py-0.5 font-mono text-[8px] text-ink/55 hover:bg-ink hover:text-sheet"
                      >
                        {activeSeat?.muted ? '解除本座静音' : '静音本座'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openPrintFlow(activeIndex)}
                        className="border border-ink/35 bg-paper px-1.5 py-0.5 font-mono text-[8px] text-ink/55 hover:bg-ink hover:text-sheet"
                      >
                        打印私档
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (speech.listening) speech.stop()
                          setAllMuted(!allMuted)
                        }}
                        className="border border-ink/35 bg-paper px-1.5 py-0.5 font-mono text-[8px] text-ink/55 hover:bg-ink hover:text-sheet"
                      >
                        {allMuted ? '解除全部静音' : '全部静音'}
                      </button>
                      <span className="ml-auto font-mono text-[7px] text-ink/30">ONE MIC AT A TIME</span>
                    </div>
                  </div>

                  {pendingChoiceId && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-[1.5px] border-ink bg-ink px-3 py-2 text-sheet">
                      <span className="font-mono text-[8px] tracking-[0.12em] text-sheet/55">CONFIRM / 待确认</span>
                      <span className="text-[12.5px]">
                        {act.choices.find((c) => c.id === pendingChoiceId)?.title}
                      </span>
                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingChoiceId(null)}
                          className="border border-sheet/50 px-2 py-1 text-[10px] hover:bg-sheet hover:text-ink"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => executeChoice(pendingChoiceId)}
                          className="border border-sheet bg-sheet px-2 py-1 text-[10px] text-ink hover:bg-red-soft"
                        >
                          确认执行 →
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-1 gap-1.5">
                    {act.choices.map((choice, i) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => setPendingChoiceId(choice.id)}
                        disabled={Boolean(activeRoundEntry)}
                        className={`group flex flex-col border px-2.5 py-2 text-left transition-all hover:border-ink hover:bg-sheet hover:shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-ink/35 disabled:hover:bg-sheet/60 ${
                          pendingChoiceId === choice.id ? 'border-ink bg-sheet shadow-hard-sm' : 'border-ink/35 bg-sheet/60'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center border border-ink/50 font-mono text-[9px] text-ink/60 group-hover:border-ink group-hover:bg-ink group-hover:text-sheet">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] leading-snug">{choice.title}</div>
                            <p className="mt-0.5 text-[9px] leading-snug text-red/80">{choice.intent}</p>
                            <p className="mt-0.5 text-[9px] leading-relaxed text-ink/45">{choice.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 font-mono text-[8px] tracking-[0.08em] text-ink/30">
                    NO MORAL SCORE / 不进行「好行为 +1」式评分
                  </p>
                  </div>
                </div>
              )}

              {(state.phase === 'feedback' || state.phase === 'actend') && (
                <div className="paper-frame sheet-up flex shrink-0">
                  <div className="paper-sheet paper-deckle paper-object flex w-full flex-wrap items-center gap-2 px-3 py-2">
                  {state.phase === 'feedback' && (
                    <button type="button" onClick={() => executeStage('finishFeedback')} className="ink-btn ink-btn-solid">
                      结束本幕 →
                    </button>
                  )}
                  {state.phase === 'actend' && (
                    <button type="button" onClick={() => executeStage('advanceAct')} className="ink-btn ink-btn-solid ml-auto">
                      {!story.playable
                        ? '结束演示片段 →'
                        : state.actIndex >= story.acts.length - 1
                          ? '查看共同结局 →'
                          : `进入第 ${act.no + 1} 幕 →`}
                    </button>
                  )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      )}

      {state.paused && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/65 backdrop-blur-[2px]" />
          <div className="frame-double relative z-10 w-full max-w-[560px] bg-sheet p-5 shadow-hard sm:p-7">
            <div className="flex items-center justify-between border-b border-ink pb-3">
              <div>
                <div className="font-mono text-[8px] tracking-[0.2em] text-red">CLASSROOM PAUSED</div>
                <h2 className="title-serif mt-1 text-[34px] leading-none">大屏已暂停</h2>
              </div>
              <Stamp tone="ink">PAUSE</Stamp>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink/60">
              进度、座位与转写都已保存。学生可以离开角色、暂停讨论，不需要解释。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setPaused(false)} className="ink-btn ink-btn-solid">
                继续课堂 →
              </button>
              <button type="button" onClick={() => navigate('/teacher')} className="ink-btn">
                教师端
              </button>
              <button type="button" onClick={() => navigate('/menu')} className="ink-btn">
                回主菜单（保留进度）
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={transcriptOpen}
        onClose={() => {
          setTranscriptOpen(false)
          setClearArmed(false)
        }}
        code={`TRANSCRIPT / ${story.slot}`}
        title={`语音转写 · ${state.transcripts.length} 条`}
        wide
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] text-ink/40">只保存文字，不保存音频；数据留在本机。</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" onClick={exportTranscripts} className="ink-btn text-[10px]">
                导出 JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!clearArmed) {
                    setClearArmed(true)
                    return
                  }
                  clearTranscripts()
                  setClearArmed(false)
                  setNotice('本局转写已清空。')
                }}
                className={`ink-btn text-[10px] ${clearArmed ? 'ink-btn-red' : ''}`}
              >
                {clearArmed ? '确认清空全部' : '清空转写'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTranscriptOpen(false)
                  setClearArmed(false)
                }}
                className="ink-btn ink-btn-solid text-[10px]"
              >
                关闭
              </button>
            </div>
          </div>
        }
      >
        {state.transcripts.length === 0 ? (
          <div className="border border-dashed border-ink/35 px-3 py-6 text-center">
            <p className="text-[11.5px]">还没有转写记录。</p>
            <p className="mt-1 text-[9.5px] text-ink/45">
              打开某个座位的话筒，或使用「模拟发言」，文字会在这里按时间顺序归档。
            </p>
          </div>
        ) : (
          <ol className="max-h-[56vh] space-y-1.5 overflow-y-auto">
            {state.transcripts.map((line) => (
              <li key={line.id} className="border border-ink/25 bg-paper/60 px-2.5 py-2">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[7.5px] text-ink/40">
                  <span className="text-red">P{line.seat + 1}</span>
                  <span className="text-ink/60">{line.roleName}</span>
                  <span>ACT {line.actIndex + 1}</span>
                  <span className={line.source === 'simulated' ? 'text-brass' : 'text-ink/45'}>
                    {line.source === 'simulated'
                      ? 'SIMULATED'
                      : line.source === 'local'
                        ? 'LOCAL ASR'
                        : 'LIVE'}
                  </span>
                  <span className="ml-auto">
                    {new Date(line.at).toLocaleTimeString('zh-CN', { hour12: false })}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink/70">{line.text}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {classifyUtterance(line.text).map((category) => (
                    <span
                      key={category}
                      className={`border px-1 py-0.5 font-mono text-[7px] ${CATEGORY_META[category].chip}`}
                    >
                      {CATEGORY_META[category].label}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Dialog>

      {printMaterial && printSeat !== null && (
        <>
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink/92" />
            {printStage === 'confirm' && (
              <div className="frame-double relative z-10 w-full max-w-[560px] bg-sheet p-5 shadow-hard sm:p-7">
                <div className="flex items-start justify-between gap-3 border-b border-ink pb-3">
                  <div>
                    <div className="label-mono text-red">PRIVATE FILE / 私人档案打印</div>
                    <h2 className="title-serif mt-1 text-[28px] leading-tight">
                      P{printSeat + 1} · {printCharacter?.name}
                    </h2>
                    <p className="mt-1 text-[10px] text-ink/50">{printCharacter?.identity}</p>
                  </div>
                  <Stamp>仅限本人</Stamp>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[
                    '点击后大屏会显示热敏纸模拟；私人文字全部以遮挡条呈现。',
                    '只打印这个座位对应的私人档案；公开部分可以折叠后给同伴看。',
                    '打印完成后请本人取走，不要在大屏前展开下半部分。',
                  ].map((line, i) => (
                    <p key={line} className="flex gap-2 text-[10.5px] leading-relaxed text-ink/65">
                      <span className="font-mono text-[8px] text-red">0{i + 1}</span>
                      {line}
                    </p>
                  ))}
                </div>
                <p className="mt-3 border border-ink/25 bg-paper-2/40 px-2.5 py-2 text-[9px] leading-relaxed text-ink/45">
                  本原型使用浏览器打印预览模拟热敏打印机；不会连接真实设备，也不会上传档案内容。
                </p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button type="button" className="ink-btn" onClick={closePrintFlow}>
                    取消
                  </button>
                  <button type="button" className="ink-btn ink-btn-red" onClick={() => setPrintStage('printing')}>
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
                      name={printCharacter?.name}
                      identity={printCharacter?.identity}
                      seatLabel={`P${printSeat + 1}`}
                      progress={printProgress}
                    />
                    <p className="mt-2 text-center font-mono text-[7px] tracking-[0.14em] text-sheet/35">
                      THERMAL PREVIEW · TEXT REDACTED
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-mono text-[9px] tracking-[0.24em] text-sheet/45">
                      PRIVATE FILE / PRINT QUEUE
                    </div>
                    <h2 className="title-serif mt-1 text-[30px] leading-tight text-sheet sm:text-[36px]">
                      正在打印私人档案
                    </h2>
                    <p className="mt-2 text-[11px] leading-relaxed text-sheet/55">
                      热敏纸模拟照常运行，但所有私人文字都以遮挡条代替；大屏不会渲染任何私人内容。
                      请保持屏幕朝向不变。
                    </p>
                    <div className="mt-4 h-1.5 w-full border border-sheet/30">
                      <div
                        className="h-full bg-red-soft transition-[width] duration-100"
                        style={{ width: `${printProgress}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[8px] text-sheet/40">
                      <span>
                        {String(printProgress).padStart(3, '0')}% / P{printSeat + 1}
                      </span>
                      <span>PRIVATE TEXT SHIELDED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {printStage === 'done' && (
              <div className="frame-double relative z-10 w-full max-w-[560px] bg-sheet p-5 shadow-hard sm:p-7">
                <div className="flex items-start justify-between gap-3 border-b border-ink pb-3">
                  <div>
                    <div className="label-mono text-[#76854f]">PRINT READY / 打印完成</div>
                    <h2 className="title-serif mt-1 text-[30px] leading-tight">请取走纸质档案</h2>
                  </div>
                  <Stamp tone="ink">已记录</Stamp>
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink/65">
                  P{printSeat + 1} 的私人档案已发送到打印机。请本人取走，沿虚线折叠，
                  <strong>不要在大屏前展开下半部分</strong>。公开部分可以给同伴看。
                </p>
                <div className="mt-3 border border-ink/25 bg-paper-2/40 px-2.5 py-2">
                  <div className="font-mono text-[7.5px] tracking-[0.12em] text-ink/40">PRIVACY / 隐私</div>
                  <p className="mt-1 text-[9.5px] leading-relaxed text-ink/50">
                    本次打印已写入本机打印记录。大屏在打印过程中只显示热敏纸模拟，私人文字以遮挡条呈现。
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" className="ink-btn" onClick={() => window.print()}>
                    浏览器打印
                  </button>
                  <button type="button" className="ink-btn ink-btn-solid ml-auto" onClick={closePrintFlow}>
                    已取走，恢复大屏 →
                  </button>
                </div>
              </div>
            )}
          </div>
          {printStage === 'done' &&
            createPortal(
              <div className="print-sheet">
                <MaterialSheet material={printMaterial} />
              </div>,
              document.getElementById('print-portal') ?? document.body,
            )}
        </>
      )}

      {notice && (
        <div className="fixed bottom-[132px] left-1/2 z-[130] w-[min(92vw,560px)] -translate-x-1/2 border border-ink bg-sheet px-3 py-2 shadow-hard-sm">
          <p className="text-[10.5px] leading-relaxed text-ink/70">{notice}</p>
        </div>
      )}

    </div>
  )
}
