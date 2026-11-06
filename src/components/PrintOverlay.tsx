import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { cluePropArt } from '../data/storyArt'
import { useGameStore } from '../store/useGameStore'
import type { PrintMaterial } from '../types'

const KIND_META: Record<
  PrintMaterial['kind'],
  { label: string; en: string; code: string; tone: string }
> = {
  profile: { label: '角色档案', en: 'CHARACTER FILE', code: 'PRT/01', tone: 'text-ink' },
  evidence: { label: '事件证据', en: 'EVIDENCE', code: 'PRT/02', tone: 'text-red' },
  receipt: { label: '行动回执', en: 'ACTION RECEIPT', code: 'PRT/03', tone: 'text-ink' },
  replay: { label: '重演对照', en: 'REPLAY COMPARISON', code: 'PRT/04', tone: 'text-red' },
}

export function MaterialSheet({ material }: { material: PrintMaterial }) {
  const meta = KIND_META[material.kind]
  const isProfile = material.kind === 'profile'
  const publicBody = isProfile ? material.body.slice(0, 1) : material.body
  const privateBody = isProfile ? material.body.slice(1) : []
  const propArt = material.kind === 'evidence' ? cluePropArt(material.title) : null

  return (
    <article className="print-sheet relative bg-[#f7f4ec] px-5 py-5 text-ink sm:px-7">
      <div className="pointer-events-none absolute inset-0 halftone opacity-[0.05]" />
      <header className="relative border-b-2 border-ink pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`font-mono text-[8.5px] tracking-[0.2em] ${meta.tone}`}>
              {meta.code} / {meta.en}
            </div>
            <h2 className="title-serif mt-1.5 text-[26px] leading-tight">{material.title}</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/60">{material.subtitle}</p>
          </div>
          <span className="stamp mt-1 shrink-0">{material.stamp}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-ink/30 pt-2 font-mono text-[8px] tracking-[0.08em] text-ink/45">
          <span>{material.code}</span>
          <span>ECHO OF A THOUGHT · THERMAL PREVIEW</span>
        </div>
      </header>

      {propArt && (
        <div className="relative mt-3 flex items-center gap-3 border border-ink/30 bg-paper/70 px-3 py-2">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-ink/40 bg-ink">
            <img src={propArt} alt="" className="h-full w-full object-contain p-1" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[8px] tracking-[0.14em] text-ink/45">EXHIBIT / 物证图版</div>
            <p className="mt-0.5 text-[10px] leading-snug text-ink/60">
              与「{material.title}」对应的虚构物证，仅用于故事呈现。
            </p>
          </div>
          <span className="shrink-0 font-mono text-[7.5px] tracking-[0.1em] text-ink/30">{material.code}</span>
        </div>
      )}

      <dl className="relative mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {material.lines.map((line) => (
          <div key={line.label} className="flex gap-2 border-b border-dotted border-ink/20 pb-1">
            <dt className="w-16 shrink-0 font-mono text-[8.5px] tracking-[0.06em] text-ink/45">
              {line.label}
            </dt>
            <dd className="min-w-0 flex-1 text-[11px] leading-snug">{line.value}</dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-4 space-y-2.5 text-[11.5px] leading-relaxed">
        {publicBody.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {isProfile && privateBody.length > 0 && (
        <>
          <div className="relative my-4 flex items-center gap-2 border-t border-dashed border-ink/50 pt-2">
            <span className="font-mono text-[8px] tracking-[0.16em] text-red">
              ✂ 沿此虚线折叠 · 下方为私人信息
            </span>
            <span className="h-px flex-1 bg-ink/20" />
          </div>
          <div className="relative space-y-2.5 text-[11.5px] leading-relaxed">
            {privateBody.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="border-l-2 border-red/60 pl-2 text-[10px] leading-relaxed text-ink/55">
              私人信息仅供本人阅读。不要替别人念出他的档案，也不要在未经同意时展示这一部分。
            </p>
          </div>
        </>
      )}

      <footer className="relative mt-5 border-t border-ink/30 pt-2.5">
        <p className="text-[9px] leading-relaxed text-ink/55">{material.note}</p>
        <div className="mt-2 flex items-end justify-between">
          <span className="font-mono text-[8px] tracking-[0.14em] text-ink/40">
            PRINTED BY ECHO OF A THOUGHT / NOT A REAL DEVICE
          </span>
          <div className="text-right">
            <div className="mb-1 h-7 w-24 border-b border-ink/40" />
            <span className="font-mono text-[7.5px] text-ink/40">档案管理员签章</span>
          </div>
        </div>
      </footer>
    </article>
  )
}

export function RedactedThermalFeed({
  name,
  identity,
  seatLabel,
  progress,
  sheetKey,
}: {
  name?: string
  identity?: string
  seatLabel: string
  progress: number
  sheetKey?: string | number
}) {
  return (
    <div className="relative h-[330px] overflow-hidden border border-sheet/30 bg-ink shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-x-0 top-0 z-10 flex h-6 items-center justify-between bg-ink px-3">
        <span className="font-mono text-[6.5px] tracking-[0.18em] text-sheet/55">ECHO / THERMAL 58mm</span>
        <span className="size-1.5 animate-pulse bg-red-soft" />
      </div>
      <div className="absolute inset-x-4 top-6 bottom-4 overflow-hidden bg-paper-3/30">
        <div
          className="printing-feed h-full origin-top bg-[#f7f4ec] px-4 py-3 text-ink"
          style={{ animationDuration: '650ms' }}
        >
          <div key={sheetKey ?? 'single'} className="receipt-out" style={{ animationDuration: '260ms' }}>
            <div className="flex items-center justify-between font-mono text-[7px] tracking-[0.14em] text-ink/40">
              <span>PRT/01 / CHARACTER FILE</span>
              <span>{seatLabel}</span>
            </div>
            <div className="title-serif mt-1.5 text-[19px] leading-tight">{name}</div>
            <p className="mt-0.5 text-[8px] text-ink/45">{identity}</p>
            <div className="mt-2 font-mono text-[6px] tracking-[0.12em] text-ink/30">PUBLIC / 公开信息</div>
            <div className="mt-1 space-y-1">
              {[86, 72, 91, 64, 80, 88, 70].map((width, i) => (
                <div key={i} className="h-[3px] bg-ink/20" style={{ width: `${width}%` }} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 border-t border-dashed border-ink/40 pt-1.5">
              <span className="font-mono text-[6.5px] tracking-[0.12em] text-red">✂ PRIVATE / 已遮蔽</span>
              <span className="h-px flex-1 bg-ink/15" />
            </div>
            <div className="mt-1.5 space-y-1">
              {[92, 78, 85, 60, 88, 74, 82].map((width, i) => (
                <div key={i} className="redaction-bar h-[6px]" style={{ width: `${width}%` }} />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[6px] tracking-[0.1em] text-ink/30">
              <span>PRIVATE TEXT WITHHELD</span>
              <span>NO SCREEN RENDER</span>
            </div>
          </div>
        </div>
        <div className="print-scan" aria-hidden />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 h-5 bg-ink">
        <div
          className="h-1 bg-red-soft transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function PrintOverlay() {
  const material = useGameStore((s) => s.activePrint)
  const closePrint = useGameStore((s) => s.closePrint)
  const savePrint = useGameStore((s) => s.savePrint)
  const prints = useGameStore((s) => s.prints)
  const actIndex = useGameStore((s) => s.actIndex)
  const [stage, setStage] = useState<'prompt' | 'printing' | 'ready'>('prompt')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!material) return
    setStage('prompt')
    setProgress(0)
  }, [material])

  useEffect(() => {
    if (stage !== 'printing') return
    setProgress(0)
    const started = Date.now()
    const timer = window.setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - started) / 1500) * 100))
      setProgress(p)
      if (p >= 100) {
        window.clearInterval(timer)
        setStage('ready')
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [stage])

  const saved = useMemo(
    () => (material ? prints.some((p) => p.material.id === material.id) : false),
    [prints, material],
  )

  useEffect(() => {
    if (!material) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePrint()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [material, closePrint])

  if (!material) return null

  const meta = KIND_META[material.kind]
  const scope =
    material.kind === 'profile'
      ? '角色领取'
      : material.kind === 'replay'
        ? '重演对照'
        : material.kind === 'evidence'
          ? `第 ${actIndex + 1} 幕 · 证据归档`
          : `第 ${actIndex + 1} 幕 · 行动回执`

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
        <div className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
        <div className="frame-double relative z-10 flex max-h-[94vh] w-full max-w-[620px] flex-col bg-paper shadow-hard">
          <div className="flex h-11 shrink-0 items-center justify-between border-b-[1.5px] border-ink bg-ink px-4 text-sheet">
            <div className="flex items-center gap-2">
              <span className="size-2 bg-red-soft" />
              <span className="font-mono text-[9px] tracking-[0.16em]">
                INSTANT PRINTER / 即时打印模拟
              </span>
            </div>
            <button
              type="button"
              onClick={closePrint}
              className="flex h-7 items-center border border-sheet/50 px-2 text-[10px] hover:bg-sheet hover:text-ink"
            >
              关闭
            </button>
          </div>

          {stage === 'prompt' && (
            <div className="overflow-y-auto p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3 border-b border-ink pb-3">
                <div>
                  <div className="label-mono text-red">PRINT REQUEST / 打印请求</div>
                  <h2 className="title-serif mt-1.5 text-[26px] leading-tight">{meta.label}</h2>
                  <p className="mt-1 text-[11px] text-ink/55">{meta.en} · {material.code}</p>
                </div>
                <span className="stamp mt-1">待打印</span>
              </div>

              <div className="mt-4 border border-ink/30 bg-sheet/70">
                <div className="flex justify-between border-b border-dashed border-ink/25 px-3 py-2 font-mono text-[9px] text-ink/50">
                  <span>ECHO / PRT</span>
                  <span>PREVIEW</span>
                </div>
                <div className="px-3 py-3">
                  <p className="text-[13px] font-medium">{material.title}</p>
                  <p className="mt-0.5 text-[10.5px] text-ink/55">{material.subtitle}</p>
                  <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-ink/45">
                    {material.body[0]}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 border-l-2 border-red/60 bg-red/[0.04] px-3 py-2">
                <span className="mt-0.5 size-1.5 shrink-0 bg-red" />
                <p className="text-[10px] leading-relaxed text-ink/65">
                  材料将与你们刚才的具体选择对应。打印后，已归档的事实不会被 AI 随意改写；后续新证据只能补充，不能覆盖。
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={closePrint} className="ink-btn">
                  暂不打印
                </button>
                <button
                  type="button"
                  onClick={() => setStage('printing')}
                  className="ink-btn ink-btn-red"
                >
                  ● 确认打印
                </button>
              </div>
            </div>
          )}

          {stage === 'printing' && (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div className="relative h-[300px] w-full max-w-[420px] overflow-hidden border border-ink/40 bg-ink/90">
                <div className="absolute inset-x-0 top-0 z-10 h-4 bg-ink">
                  <div className="mx-auto mt-1.5 h-1 w-2/3 bg-red-soft/60" />
                </div>
                <div className="absolute inset-x-5 top-4 bottom-4 overflow-hidden bg-paper-3/40">
                  <div
                    className="printing-feed origin-top bg-[#f7f4ec] px-4 py-3"
                    style={{ height: '100%' }}
                  >
                    <div className="font-mono text-[8px] tracking-[0.14em] text-ink/40">
                      ECHO OF A THOUGHT / {meta.en}
                    </div>
                    <div className="title-serif mt-2 text-[18px]">{material.title}</div>
                    <div className="mt-2 space-y-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[3px] bg-ink/20"
                          style={{ width: `${88 - ((i * 13) % 32)}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 border-t border-dashed border-ink/30 pt-2 font-mono text-[7px] text-ink/35">
                      PRINTING / 58mm / SIMULATED
                    </div>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 z-10 h-5 bg-ink">
                  <div
                    className="h-1 bg-red-soft transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 flex w-full max-w-[420px] items-center justify-between font-mono text-[9px] text-ink/60">
                <span className="flex items-center gap-2">
                  <span className="size-2 animate-pulse bg-red" />
                  正在打印…
                </span>
                <span>{progress.toString().padStart(3, '0')}%</span>
              </div>
              <p className="mt-3 font-mono text-[8px] tracking-[0.16em] text-ink/35">
                热敏纸预热 · 无需真实设备
              </p>
            </div>
          )}

          {stage === 'ready' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-ink/30 bg-paper-2/60 px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.14em] text-ink/60">
                    <span className="size-1.5 bg-[#76854f]" /> 打印完成 · 可展开查看
                  </span>
                  <span className="font-mono text-[8px] text-ink/40">{material.code}</span>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
                <div className="receipt-out mx-auto max-w-[520px] shadow-hard-sm">
                  <MaterialSheet material={material} />
                </div>
              </div>
              <div className="shrink-0 border-t-[1.5px] border-ink bg-paper px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStage('printing')}
                    className="ink-btn"
                  >
                    再次打印
                  </button>
                  <button
                    type="button"
                    disabled={saved}
                    onClick={() => savePrint(material, scope)}
                    className="ink-btn"
                  >
                    {saved ? '已保存到本局记录' : '保存打印记录'}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="ink-btn"
                  >
                    浏览器打印
                  </button>
                  <button
                    type="button"
                    onClick={closePrint}
                    className="ink-btn ink-btn-solid ml-auto"
                  >
                    返回剧情 →
                  </button>
                </div>
                <p className="mt-2 text-[9px] text-ink/40">
                  {saved ? '本材料已记录，可在「打印记录」中再次查看。' : '保存后，本局所有打印材料会汇总在档案室的打印记录中。'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {createPortal(
        <div className="print-sheet">
          <MaterialSheet material={material} />
        </div>,
        document.getElementById('print-portal') ?? document.body,
      )}
    </>
  )
}
