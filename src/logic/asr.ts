import { env, pipeline } from '@huggingface/transformers'
import { Converter } from 'opencc-js/t2cn'

/**
 * Local, offline speech recognition. Whisper runs entirely in the browser via
 * WebAssembly, so the classroom does not depend on a cloud speech service
 * (Google's Web Speech endpoint is unreachable from many school networks).
 * The model and runtime are served from /public, so no API key is involved.
 */

const BASE = import.meta.env.BASE_URL
env.allowLocalModels = true
env.allowRemoteModels = false
env.localModelPath = `${BASE}models/`
env.useBrowserCache = true
env.backends.onnx.wasm!.numThreads = 1
// ORT loads its runtime with a dynamic import(). A root-relative path is
// rewritten by Vite's dev server into a module request, which 500s for files
// in /public; an absolute URL is fetched as-is.
const ORT_BASE =
  typeof window === 'undefined'
    ? `${BASE}ort/`
    : new URL(`${BASE}ort/`, window.location.href).href
env.backends.onnx.wasm!.wasmPaths = ORT_BASE

const MODEL_ID = 'onnx-community/whisper-base'
const SAMPLE_RATE = 16000

type AsrOutput = { text?: string } | Array<{ text?: string }>
type AsrFn = (audio: Float32Array, options: Record<string, unknown>) => Promise<AsrOutput>
type Progress = (percent: number | null) => void

let asrPromise: Promise<AsrFn> | null = null
let ready = false
let simplify: ((text: string) => string) | null = null

function toSimplified(text: string): string {
  if (!simplify) simplify = Converter({ from: 'tw', to: 'cn' })
  return simplify(text)
}

export function localAsrSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (!window.isSecureContext) return false
  if (!navigator.mediaDevices?.getUserMedia) return false
  return typeof MediaRecorder !== 'undefined'
}

export function localAsrReady(): boolean {
  return ready
}

export async function loadLocalAsr(onProgress?: Progress): Promise<AsrFn> {
  if (!asrPromise) {
    asrPromise = (async () => {
      const instance = await pipeline('automatic-speech-recognition', MODEL_ID, {
        dtype: 'q8',
        progress_callback: (info: { status?: string; progress?: number }) => {
          if (info.status === 'progress' && typeof info.progress === 'number') {
            onProgress?.(Math.max(0, Math.min(100, Math.round(info.progress))))
          }
        },
      })
      ready = true
      onProgress?.(null)
      return instance as unknown as AsrFn
    })().catch((error) => {
      asrPromise = null
      ready = false
      throw error
    })
  }
  return asrPromise
}

async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const data = await blob.arrayBuffer()
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) throw new Error('audio-context-unavailable')
  const ctx = new Ctor()
  try {
    const buffer = await ctx.decodeAudioData(data.slice(0))
    const channels = buffer.numberOfChannels
    const source = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c))
    const srcRate = buffer.sampleRate
    const length = Math.max(1, Math.round(buffer.duration * SAMPLE_RATE))
    const out = new Float32Array(length)
    const step = srcRate / SAMPLE_RATE
    for (let i = 0; i < length; i += 1) {
      const at = i * step
      const i0 = Math.floor(at)
      const i1 = Math.min(buffer.length - 1, i0 + 1)
      const frac = at - i0
      let value = 0
      for (let c = 0; c < channels; c += 1) {
        const channel = source[c]
        value += channel[i0] * (1 - frac) + channel[i1] * frac
      }
      out[i] = value / channels
    }
    return out
  } finally {
    void ctx.close()
  }
}

function rms(audio: Float32Array): number {
  let sum = 0
  const stride = Math.max(1, Math.floor(audio.length / 12000))
  let count = 0
  for (let i = 0; i < audio.length; i += stride) {
    sum += audio[i] * audio[i]
    count += 1
  }
  return count ? Math.sqrt(sum / count) : 0
}

export async function transcribeLocal(blob: Blob, onProgress?: Progress): Promise<string> {
  if (blob.size < 1200) throw new Error('no-speech')
  const audio = await decodeToMono16k(blob)
  if (audio.length / SAMPLE_RATE < 0.35 || rms(audio) < 0.004) throw new Error('no-speech')
  onProgress?.(0)
  const asr = await loadLocalAsr(onProgress)
  const output = await asr(audio, { language: 'zh', task: 'transcribe' })
  const text = Array.isArray(output) ? (output[0]?.text ?? '') : (output.text ?? '')
  return toSimplified(text.trim())
}
