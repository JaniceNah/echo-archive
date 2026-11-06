import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { PageShell } from '../components/PageShell'
import {
  NEURAL_VOICE_OPTIONS,
  getNeuralSnapshot,
  preloadNeuralVoice,
  setNeuralVoice,
  speakNeuralWithVoice,
  subscribeNeural,
} from '../logic/neuralVoice'
import type { DmSpeechHandle } from '../logic/ttsTypes'

const SAMPLE =
  '灯芯爆了一下。你抬起头，看见档案室的门缝里透进一线冷白的光。有人在等你。'

const STATUS: Record<string, string> = {
  idle: '尚未加载',
  loading: '模型加载中',
  ready: '模型就绪 · WebGPU',
  failed: '模型加载失败',
  unsupported: '此浏览器不支持 WebGPU',
}

export function VoiceLab() {
  const neural = useSyncExternalStore(subscribeNeural, getNeuralSnapshot, getNeuralSnapshot)
  const [playing, setPlaying] = useState<string | null>(null)
  const handleRef = useRef<DmSpeechHandle | null>(null)

  useEffect(() => {
    preloadNeuralVoice()
    return () => {
      handleRef.current?.cancel()
      handleRef.current = null
    }
  }, [])

  const play = (voice: string) => {
    handleRef.current?.cancel()
    handleRef.current = null
    const handle = speakNeuralWithVoice(SAMPLE, voice, {
      onEnd: () => {
        setPlaying(null)
        handleRef.current = null
      },
    })
    if (!handle) return
    handleRef.current = handle
    setPlaying(voice)
  }

  const stop = () => {
    handleRef.current?.cancel()
    handleRef.current = null
    setPlaying(null)
  }

  const ready = neural.state === 'ready'

  return (
    <PageShell narrow>
      <p className="font-mono text-[9px] tracking-[0.18em] text-ink/45">VOICE LAB / DEV ONLY</p>
      <h1 className="title-serif mt-2 text-[26px] tracking-[0.08em]">少年音试听</h1>
      <p className="mt-2 text-[12px] leading-relaxed text-ink/60">
        逐个试听中文 Kokoro 男声，选定后点「设为 DM 音色」。选择保存在本机，课堂与单人剧情会立即使用。
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-ink/20 py-3 font-mono text-[9px] tracking-[0.1em] text-ink/55">
        <span>{STATUS[neural.state]}</span>
        {neural.state === 'loading' ? (
          <span>{neural.progress === null ? '…' : `${neural.progress}%`}</span>
        ) : null}
        <span className="text-ink/35">当前 DM 音色 · {neural.voice}</span>
        {playing ? (
          <button type="button" onClick={stop} className="ml-auto border border-ink/40 px-2 py-0.5 hover:border-ink">
            停止
          </button>
        ) : null}
      </div>

      <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
        {NEURAL_VOICE_OPTIONS.map((voice, index) => {
          const selected = neural.voice === voice
          return (
            <li key={voice} className="flex flex-wrap items-center gap-3 py-3">
              <span className="w-9 font-mono text-[10px] text-ink/40">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-[11px] tracking-[0.06em]">{voice}</span>
              {selected ? (
                <span className="border border-ink/50 px-1 py-0.5 font-mono text-[8px] text-ink/60">
                  DM
                </span>
              ) : null}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => play(voice)}
                  className="border border-ink/40 px-2.5 py-1 text-[11px] hover:border-ink disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {playing === voice ? '重播' : '试听'}
                </button>
                <button
                  type="button"
                  onClick={() => setNeuralVoice(voice)}
                  className="border border-ink/20 px-2.5 py-1 text-[11px] text-ink/55 hover:border-ink hover:text-ink"
                >
                  设为 DM 音色
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-[10.5px] leading-relaxed text-ink/45">
        样音：{SAMPLE}
      </p>
    </PageShell>
  )
}
