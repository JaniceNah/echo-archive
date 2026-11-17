import { open, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.1-zh-ONNX'
const MAX_PART = 80 * 1024 * 1024
const distRoot = process.argv[2] ?? new URL('../dist', import.meta.url).pathname

const dir = join(distRoot, 'models', MODEL_ID, 'onnx')
const source = join(dir, 'model.onnx')

const { size } = await stat(source)
const handle = await open(source, 'r')
const parts = []
let offset = 0

try {
  while (offset < size) {
    const length = Math.min(MAX_PART, size - offset)
    const buffer = Buffer.alloc(length)
    await handle.read(buffer, 0, length, offset)
    const name = `part${parts.length}`
    await writeFile(join(dir, `model.onnx.${name}`), buffer)
    parts.push(name)
    console.log(`part  model.onnx.${name} (${(length / 1048576).toFixed(1)} MB)`)
    offset += length
  }
} finally {
  await handle.close()
}

await rm(source)
await writeFile(join(dir, 'model.onnx.parts.json'), JSON.stringify({ total: size, parts }))
console.log(`packed  ${parts.length} parts, ${(size / 1048576).toFixed(1)} MB total -> ${dir}`)
