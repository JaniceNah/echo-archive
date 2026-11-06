import { buildSpeechPlan, chunkSpeech, type SpeechChunk } from './speechPlan'
import type {
  DmSpeechHandle,
  DmVoiceEndReason,
  NeuralSnapshot,
  NeuralState,
  SpeakDmOptions,
  TtsResponse,
} from './ttsTypes'

export const DM_NEURAL_VOICE = 'zm_091'
export const NEURAL_VOICE_OPTIONS = [
  'zm_009',
  'zm_020',
  'zm_030',
  'zm_045',
  'zm_062',
  'zm_080',
  'zm_091',
  'zm_100',
] as const
const VOICE_STORAGE_KEY = 'echo-archive-neural-voice-v1'
const NEURAL_SPEED = 1.02
const PREFETCH = 2

function readVoice() {
  try {
    const stored = window.localStorage.getItem(VOICE_STORAGE_KEY)
    if (stored && (NEURAL_VOICE_OPTIONS as readonly string[]).includes(stored)) return stored
  } catch {
    // storage may be blocked; fall through to the default
  }
  return DM_NEURAL_VOICE
}

let dmVoice = typeof window === 'undefined' ? DM_NEURAL_VOICE : readVoice()

interface AudioChunk {
  samples: Float32Array
  sampleRate: number
}

interface PlaybackSession {
  id: number
  options: SpeakDmOptions
  plan: { speech: string; toOriginal: number[] }
  chunks: SpeechChunk[]
  voice: string
  ctx: AudioContext
  received: Map<number, AudioChunk>
  requested: number
  nextPlay: number
  started: boolean
  closed: boolean
  source: AudioBufferSourceNode | null
  current: AudioChunk | null
  raf: number
  playStart: number
  playIndex: number
  lastChar: number
}

let worker: Worker | null = null
let state: NeuralState = 'idle'
let progress: number | null = null
let snapshot: NeuralSnapshot = { state, progress, voice: dmVoice }
const listeners = new Set<() => void>()

let sequence = 0
let active: PlaybackSession | null = null
let audioCtx: AudioContext | null = null

function emit() {
  snapshot = { state, progress, voice: dmVoice }
  for (const listener of listeners) listener()
}

export function setNeuralVoice(voice: string) {
  if (!(NEURAL_VOICE_OPTIONS as readonly string[]).includes(voice)) return
  dmVoice = voice
  try {
    window.localStorage.setItem(VOICE_STORAGE_KEY, voice)
  } catch {
    // private mode
  }
  emit()
}

export function getNeuralSnapshot(): NeuralSnapshot {
  return snapshot
}

export function subscribeNeural(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isNeuralReady() {
  return state === 'ready'
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

// Safari refuses to resume a suspended context unless it happens inside a
// user gesture, so every click/keypress doubles as an unlock.
function unlockNeuralAudio() {
  const ctx = getAudioContext()
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {})
}

if (typeof window !== 'undefined') {
  // Create it up front so the very first click can unlock it, even when the
  // model is still loading and the first line starts from a timer.
  getAudioContext()
  for (const type of ['pointerdown', 'touchstart', 'keydown'] as const) {
    window.addEventListener(type, unlockNeuralAudio, { capture: true, passive: true })
  }
}

function handleMessage(message: TtsResponse) {
  if (message.type === 'progress') {
    progress = message.progress
    if (state === 'loading') emit()
    return
  }
  if (message.type === 'ready') {
    state = 'ready'
    progress = null
    emit()
    return
  }
  if (message.type === 'unsupported') {
    state = 'unsupported'
    progress = null
    emit()
    return
  }
  if (message.type === 'error') {
    if (message.id === undefined) {
      console.error('[tts]', message.message)
      if (state !== 'unsupported') {
        state = 'failed'
        progress = null
        emit()
      }
      const session = active
      if (session && !session.started) finish(session, 'error')
      return
    }
    const session = active
    if (session && session.id === message.id) finish(session, 'error')
    return
  }

  const session = active
  if (!session || session.closed || message.id !== session.id) return
  session.received.set(message.chunkIndex, {
    samples: message.samples,
    sampleRate: message.sampleRate,
  })
  request(session)
  if (!session.source) playNext(session)
}

function ensureWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null
  if (!worker) {
    worker = new Worker(new URL('../workers/tts.worker.ts', import.meta.url), { type: 'module' })
    worker.addEventListener('message', (event: MessageEvent<TtsResponse>) => handleMessage(event.data))
    worker.addEventListener('error', () => {
      // Drop the broken worker so the next preload starts a fresh one.
      worker = null
      if (state === 'loading') {
        state = 'failed'
        progress = null
        emit()
      }
    })
  }
  return worker
}

export function preloadNeuralVoice() {
  if (state === 'loading' || state === 'ready' || state === 'unsupported') return
  const instance = ensureWorker()
  if (!instance) {
    state = 'unsupported'
    emit()
    return
  }
  state = 'loading'
  progress = 0
  emit()
  const base = new URL(import.meta.env.BASE_URL, window.location.href).href
  instance.postMessage({ type: 'load', base })
}

function request(session: PlaybackSession) {
  if (!worker || session.closed) return
  let highest = -1
  for (const index of session.received.keys()) highest = Math.max(highest, index)
  const limit = Math.min(session.chunks.length - 1, highest + PREFETCH)
  while (session.requested <= limit) {
    const chunk = session.chunks[session.requested]
    worker.postMessage({
      type: 'synth',
      id: session.id,
      chunkIndex: session.requested,
      text: chunk.text,
      voice: session.voice,
      speed: NEURAL_SPEED,
    })
    session.requested += 1
  }
}

function tick(session: PlaybackSession) {
  if (session.closed) return
  const chunk = session.chunks[session.playIndex]
  const audio = session.current
  if (!chunk) return
  const duration = audio ? audio.samples.length / audio.sampleRate : 0
  const elapsed = session.ctx.currentTime - session.playStart
  if (duration > 0 && elapsed >= 0) {
    const fraction = Math.min(1, elapsed / duration)
    const char = Math.min(chunk.text.length - 1, Math.floor(fraction * chunk.text.length))
    if (char > session.lastChar) {
      session.lastChar = char
      const original = session.plan.toOriginal[chunk.offset + char]
      if (typeof original === 'number') session.options.onBoundary?.(original)
    }
  }
  session.raf = requestAnimationFrame(() => tick(session))
}

function playNext(session: PlaybackSession) {
  if (session.closed) return
  const chunk = session.chunks[session.nextPlay]
  if (!chunk) {
    finish(session, 'complete')
    return
  }
  const audio = session.received.get(session.nextPlay)
  if (!audio) {
    request(session)
    return
  }

  const index = session.nextPlay
  session.received.delete(index)
  session.nextPlay = index + 1

  const buffer = session.ctx.createBuffer(1, audio.samples.length, audio.sampleRate)
  buffer.copyToChannel(audio.samples as Float32Array<ArrayBuffer>, 0)
  const source = session.ctx.createBufferSource()
  source.buffer = buffer
  source.connect(session.ctx.destination)

  session.source = source
  session.current = audio
  session.playIndex = index
  session.lastChar = -1

  source.onended = () => {
    if (session.closed || session.source !== source) return
    session.source = null
    session.current = null
    if (session.nextPlay >= session.chunks.length) finish(session, 'complete')
    else playNext(session)
  }

  const commit = () => {
    if (session.closed || session.source !== source) return
    session.playStart = session.ctx.currentTime + 0.03
    source.start(session.playStart)
    cancelAnimationFrame(session.raf)
    session.raf = requestAnimationFrame(() => tick(session))
    if (!session.started) {
      session.started = true
      session.options.onStart?.()
    }
  }

  if (session.ctx.state === 'running') commit()
  else session.ctx.resume().then(commit, commit)
  request(session)
}

function finish(session: PlaybackSession, reason: DmVoiceEndReason) {
  if (session.closed) return
  session.closed = true
  if (active === session) active = null
  cancelAnimationFrame(session.raf)
  if (session.source) {
    session.source.onended = null
    try {
      session.source.stop()
    } catch {
      // already stopped
    }
    session.source = null
  }
  if (reason !== 'complete') worker?.postMessage({ type: 'cancel', id: session.id })
  session.options.onEnd?.(reason)
}

export function cancelNeuralSpeech() {
  if (active) finish(active, 'cancelled')
}

/**
 * Starts a neural DM line. Returns null unless the model is loaded, so callers
 * can fall back to the system voice without any visible delay.
 */
export function speakNeural(text: string, options: SpeakDmOptions = {}): DmSpeechHandle | null {
  return speakNeuralWithVoice(text, dmVoice, options)
}

export function speakNeuralWithVoice(
  text: string,
  voice: string,
  options: SpeakDmOptions = {},
): DmSpeechHandle | null {
  if (state !== 'ready') return null
  const ctx = getAudioContext()
  if (!ctx) return null
  // Called synchronously from a click/narration start so browsers unlock audio
  // without waiting for the first synthesized chunk.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const plan = buildSpeechPlan(text)
  if (!plan.speech.trim()) return null

  cancelNeuralSpeech()

  const session: PlaybackSession = {
    id: ++sequence,
    options,
    plan,
    chunks: chunkSpeech(plan.speech),
    voice,
    ctx,
    received: new Map(),
    requested: 0,
    nextPlay: 0,
    started: false,
    closed: false,
    source: null,
    current: null,
    raf: 0,
    playStart: 0,
    playIndex: 0,
    lastChar: -1,
  }
  active = session
  request(session)
  return { cancel: () => finish(session, 'cancelled') }
}
