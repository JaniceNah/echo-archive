const SPEAKER_LABEL = /^\s*(?:AI\s*DM|DM|管理员\s*零|主持人|旁白)\s*[：:]\s*/i
// Chrome drops utterances longer than ~15s; ~70 Chinese chars stay well below.
const CHUNK_LIMIT = 70

export interface SpeechChunk {
  text: string
  offset: number
}

/**
 * Removes narration labels such as `AI DM：` and keeps a map from the spoken
 * string back to the original characters so the typewriter can follow voice.
 */
export function buildSpeechPlan(text: string): { speech: string; toOriginal: number[] } {
  let speech = ''
  const toOriginal: number[] = []
  let originalOffset = 0

  text.split('\n').forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      speech += '\n'
      toOriginal.push(originalOffset)
    }
    const match = line.match(SPEAKER_LABEL)
    const start = match ? match[0].length : 0
    for (let index = start; index < line.length; index += 1) {
      speech += line[index]
      toOriginal.push(originalOffset + index)
    }
    originalOffset += line.length + 1
  })

  return { speech, toOriginal }
}

export function chunkSpeech(speech: string): SpeechChunk[] {
  const chunks: SpeechChunk[] = []
  let start = 0

  while (start < speech.length) {
    if (speech.length - start <= CHUNK_LIMIT) {
      chunks.push({ text: speech.slice(start), offset: start })
      break
    }
    let cut = -1
    for (let index = Math.min(speech.length, start + CHUNK_LIMIT); index > start + 20; index -= 1) {
      if (/[。！？!?；;\n]/.test(speech[index])) {
        cut = index + 1
        break
      }
    }
    if (cut < 0) cut = start + CHUNK_LIMIT
    chunks.push({ text: speech.slice(start, cut), offset: start })
    start = cut
  }

  return chunks
}
