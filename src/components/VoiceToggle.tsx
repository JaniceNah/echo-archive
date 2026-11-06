import { useDmVoice } from '../hooks/useDmVoice'

export function VoiceToggle({ className = '' }: { className?: string }) {
  const { enabled, unavailable, toggle, engine, neuralState } = useDmVoice()
  const on = enabled && !unavailable
  const status = engine === 'neural' ? '少年音' : engine === 'loading' ? '加载中' : '系统音'
  const fallback =
    neuralState === 'loading'
      ? '少年音加载中，暂时使用系统中文语音'
      : neuralState === 'failed'
        ? '少年音加载失败，已改用系统中文语音'
        : neuralState === 'unsupported'
          ? '此设备不支持 WebGPU，已改用系统中文语音'
          : '使用系统中文语音'
  const title = unavailable
    ? '当前设备没有可用的中文语音'
    : on
      ? `关闭 DM 语音朗读（当前：${engine === 'neural' ? '少年音' : fallback}）`
      : '开启 DM 语音朗读'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={unavailable}
      aria-pressed={on}
      aria-label={title}
      title={title}
      className={`inline-flex h-5 shrink-0 items-center gap-1 border px-1.5 font-mono text-[7px] tracking-[0.08em] transition-colors ${
        on
          ? 'border-ink/40 bg-ink/[0.04] text-ink/70 hover:border-ink hover:text-ink'
          : 'border-ink/20 text-ink/35 hover:border-ink/50 hover:text-ink/60'
      } ${unavailable ? 'cursor-not-allowed opacity-45' : ''} ${className}`}
    >
      <span aria-hidden className="text-[8px] leading-none">
        {on ? '◉' : '○'}
      </span>
      语音
      <span>{on ? 'ON' : 'OFF'}</span>
      {on ? <span className="text-ink/40">· {status}</span> : null}
    </button>
  )
}
