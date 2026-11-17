import { env } from '@huggingface/transformers'
import { KokoroTTS } from '@uzen/kokoro-js'
import type { TtsRequest, TtsResponse } from '../logic/ttsTypes'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.1-zh-ONNX'

const ctx = self as unknown as {
  postMessage: (message: TtsResponse, transfer?: Transferable[]) => void
  addEventListener: (type: 'message', listener: (event: MessageEvent<TtsRequest>) => void) => void
  navigator: Navigator
}

const post = (message: TtsResponse, transfer?: Transferable[]) => {
  ctx.postMessage(message, transfer)
}

let base = '/'
let tts: KokoroTTS | null = null
let loading: Promise<KokoroTTS> | null = null
const cancelled = new Set<number>()
let lastProgress = -1
let queue: Promise<unknown> = Promise.resolve()

const WEIGHTS_PATH = `models/${MODEL_ID}/onnx/model.onnx`
const MANIFEST_PATH = `${WEIGHTS_PATH}.parts.json`

let shimInstalled = false
let packedWeights: Promise<Blob> | null = null

// Deployed builds cannot ship a 324MB file (static hosts cap uploads at 100MB),
// so scripts/pack-model.mjs splits the weights into parts. Serve them to
// transformers.js as if they were the original file; local dev builds still
// have the real model.onnx and pass through untouched.
function installWeightsShim() {
  if (shimInstalled) return
  shimInstalled = true
  const originalFetch = env.fetch.bind(env)
  env.fetch = async (input, init) => {
    // transformers.js only ever passes URL strings into env.fetch.
    const raw = typeof input === 'string' ? input : (input as URL).href
    if (!new URL(raw, base).pathname.endsWith(`/${WEIGHTS_PATH}`)) return originalFetch(input, init)

    const direct = await originalFetch(input, init)
    // A missing file shows up either as a 404 or (with SPA fallbacks) as 200 text/html.
    if (direct.ok && !(direct.headers.get('content-type') ?? '').includes('text/html')) return direct

    const manifest = await originalFetch(`${base}${MANIFEST_PATH}`).then((response) => {
      if (!response.ok) throw new Error('模型权重既不在本地，也没有分片包')
      return response.json() as Promise<{ total: number; parts: string[] }>
    })

    const range = new Headers(init?.headers).get('range')
    if (range) {
      // transformers.js probes the file size with a one-byte range request.
      return new Response(new Uint8Array(1), {
        status: 206,
        headers: {
          'content-range': `bytes 0-0/${manifest.total}`,
          'content-length': '1',
        },
      })
    }

    if (!packedWeights) {
      packedWeights = Promise.all(
        manifest.parts.map((name) =>
          originalFetch(`${base}${WEIGHTS_PATH}.${name}`).then((response) => {
            if (!response.ok) throw new Error(`模型分片 ${name} 加载失败 (${response.status})`)
            return response.arrayBuffer()
          }),
        ),
      )
        .then((buffers) => new Blob(buffers))
        .catch((error: unknown) => {
          packedWeights = null
          throw error
        })
    }
    const blob = await packedWeights
    return new Response(blob, {
      headers: {
        'content-length': String(blob.size),
        'content-type': 'application/octet-stream',
      },
    })
  }
}

async function hasWebGpu() {
  const gpu = (ctx.navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
  if (!gpu) return false
  try {
    return Boolean(await gpu.requestAdapter())
  } catch {
    return false
  }
}

async function load(): Promise<KokoroTTS> {
  if (!(await hasWebGpu())) {
    post({ type: 'unsupported', reason: 'WebGPU 不可用' })
    throw new Error('webgpu-unavailable')
  }
  // transformers.js only probes local files when the path is not an absolute
  // URL; a root-relative path still resolves correctly from inside the worker.
  env.allowLocalModels = true
  env.allowRemoteModels = false
  env.localModelPath = `${new URL(base).pathname}models/`
  env.useBrowserCache = true
  env.backends.onnx.wasm!.numThreads = 1
  env.backends.onnx.wasm!.wasmPaths = `${base}ort/`
  installWeightsShim()

  const instance = await KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: 'fp32',
    device: 'webgpu',
    voicePath: `${base}kokoro/voices`,
    progress_callback: (info) => {
      if (info.status === 'progress_total') {
        const value = Math.max(0, Math.min(100, Math.round(info.progress)))
        if (value !== lastProgress) {
          lastProgress = value
          post({ type: 'progress', progress: value })
        }
      }
    },
  })
  post({ type: 'ready' })
  return instance
}

ctx.addEventListener('message', (event) => {
  const message = event.data

  if (message.type === 'load') {
    if (loading) return
    base = message.base.endsWith('/') ? message.base : `${message.base}/`
    loading = load()
      .then((instance) => {
        tts = instance
        return instance
      })
      .catch((error: unknown) => {
        loading = null
        console.error('[tts] load failed', error)
        post({ type: 'error', message: error instanceof Error ? error.message : String(error) })
        throw error
      })
    // The rejection is reported above; keep the worker alive for a retry.
    loading.catch(() => {})
    return
  }

  if (message.type === 'cancel') {
    cancelled.add(message.id)
    return
  }

  if (message.type === 'synth') {
    const { id, chunkIndex, text, voice, speed } = message
    if (cancelled.has(id)) return
    const instance = tts
    if (!instance) {
      post({ type: 'error', message: '模型尚未就绪', id })
      return
    }
    queue = queue.then(async () => {
      if (cancelled.has(id) || !tts) return
      try {
        const result = await tts.generate(text, {
          voice: voice as keyof KokoroTTS['voices'],
          speed,
        })
        if (cancelled.has(id)) return
        const samples = result.data
        // Some GPU/dtype combinations fail numerically and return NaN or an
        // all-zero buffer; surface that as an error so the caller falls back
        // to the system voice instead of playing silence.
        let peak = 0
        for (let i = 0; i < samples.length; i += 1) {
          const value = samples[i]
          if (Number.isFinite(value)) {
            const magnitude = Math.abs(value)
            if (magnitude > peak) peak = magnitude
          }
        }
        if (!(peak > 1e-3)) throw new Error('模型输出为空音频')
        post(
          {
            type: 'audio',
            id,
            chunkIndex,
            samples,
            sampleRate: result.sampling_rate,
          },
          [samples.buffer as ArrayBuffer],
        )
      } catch (error) {
        if (cancelled.has(id)) return
        post({
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
          id,
        })
      }
    })
    return
  }
})
