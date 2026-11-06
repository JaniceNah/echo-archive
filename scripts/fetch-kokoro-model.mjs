import { createWriteStream } from 'node:fs'
import { copyFile, mkdir, rename, stat, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.1-zh-ONNX'
const MIRROR = process.env.HF_ENDPOINT ?? 'https://hf-mirror.com'
const ROOT = new URL('..', import.meta.url).pathname
const MODEL_DIR = join(ROOT, 'public/models', MODEL_ID)
const VOICE_DIR = join(ROOT, 'public/kokoro/voices')

// fp16 produces NaN/silence on Apple Metal WebGPU, so ship the fp32 weights.
const FILES = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model.onnx']
const VOICES = ['zm_009', 'zm_020', 'zm_030', 'zm_045', 'zm_062', 'zm_080', 'zm_091', 'zm_100']

async function remoteSize(url) {
  const res = await fetch(url, { method: 'HEAD' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return Number(res.headers.get('content-length') ?? 0)
}

async function localSize(path) {
  try {
    return (await stat(path)).size
  } catch {
    return -1
  }
}

async function download(relative, dest) {
  const url = `${MIRROR}/${MODEL_ID}/resolve/main/${relative}`
  const expected = await remoteSize(url)
  const existing = await localSize(dest)
  if (existing === expected) {
    console.log(`skip  ${relative} (${(expected / 1048576).toFixed(1)} MB)`)
    return
  }

  await mkdir(dirname(dest), { recursive: true })
  const temp = `${dest}.part`
  console.log(`fetch ${relative} (${(expected / 1048576).toFixed(1)} MB)`)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText} for ${url}`)

  let received = 0
  let lastPrint = 0
  const body = Readable.fromWeb(res.body)
  body.on('data', (chunk) => {
    received += chunk.length
    const now = Date.now()
    if (now - lastPrint > 500) {
      lastPrint = now
      const pct = expected ? Math.round((received / expected) * 100) : 0
      process.stdout.write(`\r      ${pct}% ${(received / 1048576).toFixed(1)} MB`)
    }
  })
  await pipeline(body, createWriteStream(temp))
  await rename(temp, dest)
  const actual = await localSize(dest)
  if (expected && actual !== expected) {
    await unlink(dest)
    throw new Error(`size mismatch for ${relative}: ${actual} != ${expected}`)
  }
  process.stdout.write('\r      done\n')
}

for (const file of FILES) {
  await download(file, join(MODEL_DIR, file))
}

for (const voice of VOICES) {
  await download(`voices/${voice}.bin`, join(VOICE_DIR, `${voice}.bin`))
}

// WebGPU needs the jsep runtime; the ASR path only vendored the asyncify one.
const ORT_SRC = join(ROOT, 'node_modules/onnxruntime-web/dist')
const ORT_DEST = join(ROOT, 'public/ort')
await mkdir(ORT_DEST, { recursive: true })
for (const file of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) {
  await copyFile(join(ORT_SRC, file), join(ORT_DEST, file))
  console.log(`copy  ${file}`)
}

console.log(`\nKokoro model ready at ${MODEL_DIR}`)
console.log(`Voices ready at ${VOICE_DIR}`)
