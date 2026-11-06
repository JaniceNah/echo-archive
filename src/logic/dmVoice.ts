import {
  cancelNeuralSpeech,
  getNeuralSnapshot,
  isNeuralReady,
  preloadNeuralVoice,
  speakNeural,
  subscribeNeural,
} from './neuralVoice'
import { buildSpeechPlan, chunkSpeech } from './speechPlan'
import type {
  DmSpeechHandle,
  DmVoiceEndReason,
  NeuralState,
  SpeakDmOptions,
} from './ttsTypes'

export type { DmSpeechHandle, DmVoiceEndReason, SpeakDmOptions }
export { buildSpeechPlan, preloadNeuralVoice }

export type DmVoiceEngine = 'neural' | 'loading' | 'system'

export interface DmVoiceSnapshot {
  supported: boolean
  voicesReady: boolean
  hasChineseVoice: boolean
  enabled: boolean
  blocked: boolean
  engine: DmVoiceEngine
  neuralState: NeuralState
}

interface Session {
  owner?: string
  abort: (reason: DmVoiceEndReason) => void
}

const browserSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function'

// Voice starts on for every fresh page load; turning it off only affects the
// current session.
let enabled = true
let voicesReady = false
let chineseVoices: SpeechSynthesisVoice[] = []
let selectedVoice: SpeechSynthesisVoice | null = null
const blockedOwners = new Set<string>()
const listeners = new Set<() => void>()
let activeSession: Session | null = null
let pendingNeuralWait: (() => void) | null = null

// Give a loading model a moment to finish before the first line, so the class
// does not hear the system voice for the opening narration.
const NEURAL_WAIT_MS = 2500

function neuralEngine(): DmVoiceEngine {
  const neural = getNeuralSnapshot().state
  if (neural === 'ready') return 'neural'
  if (neural === 'loading') return 'loading'
  return 'system'
}

function buildSnapshot(): DmVoiceSnapshot {
  const neural = getNeuralSnapshot()
  return {
    supported: browserSupported || neural.state === 'ready' || neural.state === 'loading',
    voicesReady,
    hasChineseVoice: chineseVoices.length > 0,
    enabled,
    blocked: blockedOwners.size > 0,
    engine: neuralEngine(),
    neuralState: neural.state,
  }
}

let snapshot: DmVoiceSnapshot = buildSnapshot()

function emit() {
  snapshot = buildSnapshot()
  for (const listener of listeners) listener()
}

subscribeNeural(emit)

export function getDmVoiceSnapshot(): DmVoiceSnapshot {
  return snapshot
}

export function subscribeDmVoice(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// macOS novelty voices report a single boundary event for the whole line,
// which would freeze the typewriter on the first character.
const NOVELTY_VOICE =
  /eddy|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|grandma|grandpa|jester|organ|superstar|trinoids|whisper|wobble|zarvox|flo|reed|rocko|shelley|sandy|ralph|kathy|fred|junior/i

function noveltyVoice(voice: SpeechSynthesisVoice | null) {
  return voice ? NOVELTY_VOICE.test(voice.name) : false
}

function scoreVoice(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.replace('_', '-').toLowerCase()
  const name = voice.name.toLowerCase()
  let score = 0
  if (lang === 'zh-cn' || lang === 'zh-hans-cn') score += 8
  else if (lang.startsWith('zh')) score += 4
  else return -1
  if (voice.localService) score += 3
  // macOS "Eddy" and Windows "Kangkang" are the closest built-in youth timbres.
  if (/eddy|kangkang|junior/.test(name)) score += 6
  if (/xiaoxiao|xiaoyi|tingting|meijia|mei-jia|yushu|yu-shu|sinji|hanhan|kangkang/.test(name)) score += 5
  if (/chinese|mandarin/.test(name)) score += 2
  return score
}

function loadVoices() {
  if (!browserSupported) return
  let voices: SpeechSynthesisVoice[] = []
  try {
    voices = window.speechSynthesis.getVoices()
  } catch {
    voices = []
  }
  if (voices.length === 0) {
    if (voicesReady) {
      voicesReady = false
      chineseVoices = []
      selectedVoice = null
      emit()
    }
    return
  }

  const ranked = voices
    .map((voice) => ({ voice, score: scoreVoice(voice) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)

  const hadChinese = chineseVoices.length > 0
  chineseVoices = ranked.map((entry) => entry.voice)
  selectedVoice = ranked[0]?.voice ?? null
  const changed = !voicesReady || hadChinese !== (chineseVoices.length > 0)
  voicesReady = true
  if (changed) emit()
}

if (browserSupported) {
  loadVoices()
  try {
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
  } catch {
    // Older Safari exposes only the onvoiceschanged property.
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
  // Chrome populates the list asynchronously; one retry covers slow starts.
  window.setTimeout(loadVoices, 1000)
}

function canPlay() {
  return enabled && blockedOwners.size === 0
}

function finishSession(session: Session, reason: DmVoiceEndReason, options: SpeakDmOptions) {
  if (activeSession === session) activeSession = null
  options.onEnd?.(reason)
}

function cancelActive(reason: DmVoiceEndReason) {
  const session = activeSession
  if (!session) return
  activeSession = null
  session.abort(reason)
}

export function cancelDmSpeech() {
  pendingNeuralWait?.()
  pendingNeuralWait = null
  cancelActive('cancelled')
  cancelNeuralSpeech()
}

export function setDmVoiceEnabled(on: boolean) {
  if (enabled === on) return
  enabled = on
  if (!on) cancelDmSpeech()
  emit()
}

export function setDmVoiceBlocked(owner: string, blocked: boolean) {
  const had = blockedOwners.size > 0
  if (blocked) blockedOwners.add(owner)
  else blockedOwners.delete(owner)
  const has = blockedOwners.size > 0
  if (has) cancelDmSpeech()
  if (had !== has) emit()
}

function speakSystem(
  plan: { speech: string; toOriginal: number[] },
  options: SpeakDmOptions,
): DmSpeechHandle {
  cancelActive('superseded')

  const chunks = chunkSpeech(plan.speech)
  const novelty = noveltyVoice(selectedVoice)
  let closed = false
  let chunkIndex = 0
  let startTimer = 0
  let voicePoll = 0
  let waitedForVoices = 0
  let utterance: SpeechSynthesisUtterance | null = null
  let pacer = 0

  const stopPacer = () => {
    if (pacer) window.clearInterval(pacer)
    pacer = 0
  }

  const session: Session = {
    owner: options.owner,
    abort: (reason) => {
      if (closed) return
      closed = true
      window.clearTimeout(startTimer)
      window.clearTimeout(voicePoll)
      stopPacer()
      if (utterance) {
        utterance.onstart = null
        utterance.onboundary = null
        utterance.onend = null
        utterance.onerror = null
      }
      try {
        window.speechSynthesis.cancel()
      } catch {
        // ignore
      }
      finishSession(session, reason, options)
    },
  }
  activeSession = session

  const fail = () => {
    if (closed) return
    closed = true
    window.clearTimeout(startTimer)
    window.clearTimeout(voicePoll)
    if (activeSession === session) activeSession = null
    options.onEnd?.('error')
  }

  const speakNext = () => {
    if (closed) return
    if (chunkIndex >= chunks.length) {
      closed = true
      if (activeSession === session) activeSession = null
      options.onEnd?.('complete')
      return
    }

    const chunk = chunks[chunkIndex]
    const next = new window.SpeechSynthesisUtterance(chunk.text)
    next.lang = 'zh-CN'
    next.rate = options.rate ?? 1.12
    next.pitch = 0.92
    next.volume = 1
    if (selectedVoice) next.voice = selectedVoice

    next.onstart = () => {
      if (closed) return
      options.onStart?.()
      if (!novelty) return
      // Novelty voices only fire one boundary event, so pace the reveal here.
      let cursor = 0
      const emit = (index: number) => {
        const original = plan.toOriginal[chunk.offset + index]
        if (typeof original === 'number') options.onBoundary?.(original)
      }
      emit(0)
      stopPacer()
      pacer = window.setInterval(() => {
        if (closed) return stopPacer()
        cursor += 1
        if (cursor >= chunk.text.length) {
          emit(chunk.text.length - 1)
          stopPacer()
          return
        }
        emit(cursor)
      }, 190)
    }
    next.onboundary = (event: SpeechSynthesisEvent) => {
      if (closed || novelty) return
      if (typeof event.charIndex !== 'number' || event.charIndex < 0) return
      const original = plan.toOriginal[chunk.offset + event.charIndex]
      if (typeof original === 'number') options.onBoundary?.(original)
    }
    next.onend = () => {
      if (closed) return
      stopPacer()
      chunkIndex += 1
      speakNext()
    }
    next.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (closed) return
      const reason = event.error === 'interrupted' || event.error === 'canceled' ? 'cancelled' : 'error'
      closed = true
      if (activeSession === session) activeSession = null
      options.onEnd?.(reason)
    }

    utterance = next
    try {
      window.speechSynthesis.speak(next)
    } catch {
      fail()
    }
  }

  const begin = () => {
    if (closed) return
    if (!browserSupported) return fail()
    if (!canPlay()) return fail()
    if (voicesReady && chineseVoices.length === 0) return fail()
    if (voicesReady) return speakNext()

    // Chrome often reports an empty voice list on the first tick.
    const waitForVoices = () => {
      if (closed) return
      loadVoices()
      if (voicesReady) {
        if (chineseVoices.length === 0) return fail()
        return speakNext()
      }
      waitedForVoices += 100
      if (waitedForVoices >= 800) return fail()
      voicePoll = window.setTimeout(waitForVoices, 100)
    }
    waitForVoices()
  }

  startTimer = window.setTimeout(begin, 100)

  return {
    cancel: () => {
      if (closed) return
      closed = true
      window.clearTimeout(startTimer)
      window.clearTimeout(voicePoll)
      stopPacer()
      if (utterance) {
        utterance.onstart = null
        utterance.onboundary = null
        utterance.onend = null
        utterance.onerror = null
      }
      if (activeSession === session) {
        activeSession = null
        try {
          window.speechSynthesis.cancel()
        } catch {
          // ignore
        }
        options.onEnd?.('cancelled')
      }
    },
  }
}

/**
 * Speaks a DM line. The neural（Kokoro）voice is preferred once loaded; while it
 * loads, fails, or is unavailable, the system Chinese voice takes over. Only
 * one line plays at a time: a new call supersedes the previous one.
 */
export function speakDm(text: string, options: SpeakDmOptions = {}): DmSpeechHandle {
  const plan = buildSpeechPlan(text)
  if (!plan.speech.trim()) return { cancel: () => {} }

  if (pendingNeuralWait) {
    pendingNeuralWait()
    pendingNeuralWait = null
  }
  cancelActive('superseded')
  cancelNeuralSpeech()

  const startNeural = (): DmSpeechHandle | null => {
    let started = false
    let fellBack = false
    return speakNeural(text, {
      owner: options.owner,
      rate: options.rate,
      onStart: () => {
        started = true
        options.onStart?.()
      },
      onBoundary: options.onBoundary,
      onEnd: (reason) => {
        if (reason === 'error' && !started && !fellBack) {
          fellBack = true
          speakSystem(plan, options)
          return
        }
        options.onEnd?.(reason)
      },
    })
  }

  if (canPlay() && isNeuralReady()) {
    const handle = startNeural()
    if (handle) return handle
  }

  const neuralState = getNeuralSnapshot().state
  if (canPlay() && (neuralState === 'loading' || neuralState === 'idle')) {
    if (neuralState === 'idle') preloadNeuralVoice()

    let cancelled = false
    let waited = 0
    let timer = 0
    let handle: DmSpeechHandle | null = null

    const attempt = () => {
      if (cancelled) return
      const current = getNeuralSnapshot().state
      if (current === 'ready') {
        handle = startNeural()
        if (handle) {
          pendingNeuralWait = null
          return
        }
      }
      if (current === 'failed' || current === 'unsupported' || waited >= NEURAL_WAIT_MS) {
        pendingNeuralWait = null
        handle = speakSystem(plan, options)
        return
      }
      waited += 100
      timer = window.setTimeout(attempt, 100)
    }

    const cancelWait = () => {
      cancelled = true
      window.clearTimeout(timer)
      handle?.cancel()
    }

    pendingNeuralWait = cancelWait
    timer = window.setTimeout(attempt, 100)
    return { cancel: cancelWait }
  }

  return speakSystem(plan, options)
}
