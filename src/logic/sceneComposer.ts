import type { PlaceId } from './storyGenerator'

const ART = '/assets/yinian'

export interface SceneBase {
  id: string
  label: string
  en: string
  art: string
  basePlaceId: PlaceId
  keywords: string[]
}

export const SCENE_BASES: SceneBase[] = [
  {
    id: 'classroom',
    label: '教室',
    en: 'CLASSROOM',
    art: `${ART}/scenes/classroom.webp`,
    basePlaceId: 'classroom',
    keywords: ['教室', '课桌', '黑板', '学校', '校园', '班级', '上课', '午休', '讲台', '操场'],
  },
  {
    id: 'corridor',
    label: '走廊',
    en: 'CORRIDOR',
    art: `${ART}/scenes/corridor.webp`,
    basePlaceId: 'corridor',
    keywords: ['走廊', '楼道', '楼梯', '门厅', '天台', '校门', '通道', '楼梯间'],
  },
  {
    id: 'library',
    label: '旧图书馆',
    en: 'LIBRARY',
    art: `${ART}/scenes/library.webp`,
    basePlaceId: 'library',
    keywords: ['图书馆', '书店', '书架', '阅览', '自习', '借书', '档案室', '藏书', '阅读区'],
  },
  {
    id: 'equipment',
    label: '器材室',
    en: 'EQUIPMENT',
    art: `${ART}/scenes/equipment-room.webp`,
    basePlaceId: 'equipment',
    keywords: ['器材室', '仓库', '储物间', '道具', '后台', '器械', '库房', '排练厅'],
  },
  {
    id: 'village',
    label: '山谷村落',
    en: 'VALLEY VILLAGE',
    art: `${ART}/scenes/village.webp`,
    basePlaceId: 'village',
    keywords: ['村', '山谷', '田野', '稻田', '农舍', '营地', '山', '河', '乡', '祠堂', '院子'],
  },
  {
    id: 'town',
    label: '城堡小镇',
    en: 'OLD TOWN',
    art: `${ART}/scenes/town.webp`,
    basePlaceId: 'town',
    keywords: ['小镇', '城堡', '古镇', '钟楼', '广场', '石桥', '石板', '街道', '节庆', '巷子', '海', '灯塔', '码头', '港口', '沙滩', '船', '港'],
  },
  {
    id: 'arcade',
    label: '旧市场拱廊',
    en: 'ARCADE MARKET',
    art: `${ART}/scenes/arcade.webp`,
    basePlaceId: 'arcade',
    keywords: ['拱廊', '市场', '商场', '集市', '摊位', '店铺', '车站', '地下', '街市'],
  },
]

export interface SceneMatch {
  base: SceneBase
  hits: string[]
  matched: boolean
}

export function resolveSceneText(text: string): SceneMatch {
  const cleaned = text.trim()
  let best = SCENE_BASES[0]
  let bestScore = 0
  let bestHits: string[] = []
  if (cleaned) {
    for (const base of SCENE_BASES) {
      const hits = base.keywords.filter((k) => cleaned.includes(k))
      const score = hits.reduce((sum, k) => sum + k.length, 0)
      if (score > bestScore) {
        best = base
        bestScore = score
        bestHits = hits
      }
    }
  }
  return { base: best, hits: bestHits, matched: bestScore > 0 }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`scene art failed: ${src}`))
    img.src = src
  })
}

function wrapTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const ch of text) {
    const next = line + ch
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function composeSceneCard(title: string, base: SceneBase): Promise<string> {
  if (typeof document === 'undefined') return base.art
  try {
    const img = await loadImage(base.art)
    const W = 1280
    const H = 720
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return base.art

    const ratio = Math.max(W / img.width, H / img.height)
    const dw = img.width * ratio
    const dh = img.height * ratio
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)

    ctx.fillStyle = 'rgba(28,24,20,0.16)'
    ctx.fillRect(0, 0, W, H)

    const bottom = ctx.createLinearGradient(0, H * 0.28, 0, H)
    bottom.addColorStop(0, 'rgba(14,14,16,0)')
    bottom.addColorStop(0.55, 'rgba(14,14,16,0.52)')
    bottom.addColorStop(1, 'rgba(10,10,12,0.94)')
    ctx.fillStyle = bottom
    ctx.fillRect(0, 0, W, H)

    const top = ctx.createLinearGradient(0, 0, 0, H * 0.32)
    top.addColorStop(0, 'rgba(10,10,12,0.5)')
    top.addColorStop(1, 'rgba(10,10,12,0)')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, W, H * 0.32)

    ctx.fillStyle = 'rgba(236,231,219,0.72)'
    ctx.font = '500 20px "SF Mono", ui-monospace, Menlo, monospace'
    ctx.fillText('LOCAL SCENE CARD / 本地合成场景', 64, 70)
    ctx.fillStyle = 'rgba(236,231,219,0.42)'
    ctx.font = '500 16px "SF Mono", ui-monospace, Menlo, monospace'
    ctx.fillText(`BASE / ${base.en} · ${base.label}`, 64, 100)

    ctx.fillStyle = '#b4322f'
    ctx.fillRect(W - 118, 52, 54, 54)
    ctx.fillStyle = '#f1f0e9'
    ctx.font = '600 26px "Songti SC", "Noto Serif SC", serif'
    ctx.textAlign = 'center'
    ctx.fillText('自定', W - 91, 88)
    ctx.textAlign = 'left'

    const name = title.trim().slice(0, 18)
    const size = name.length <= 8 ? 84 : name.length <= 13 ? 70 : 58
    ctx.font = `600 ${size}px "Songti SC", "Noto Serif SC", serif`
    const lines = wrapTitle(ctx, name, W - 180).slice(0, 2)
    const lineHeight = size * 1.2
    const baseY = H - 128 - (lines.length - 1) * lineHeight
    ctx.fillStyle = '#f1f0e9'
    lines.forEach((line, i) => {
      ctx.fillText(line, 64, baseY + i * lineHeight)
    })

    ctx.fillStyle = 'rgba(236,231,219,0.5)'
    ctx.font = '500 16px "SF Mono", ui-monospace, Menlo, monospace'
    ctx.fillText('SCENE CARD · COMPOSED FROM LOCAL ASSETS', 64, H - 66)
    ctx.textAlign = 'right'
    ctx.fillText('NO NETWORK · 未连接图像服务', W - 64, H - 66)
    ctx.textAlign = 'left'

    let seed = 20261105
    for (let i = 0; i < 620; i += 1) {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const x = (seed / 4294967296) * W
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const y = (seed / 4294967296) * H
      ctx.fillStyle = `rgba(241,240,233,${0.02 + ((seed % 100) / 100) * 0.05})`
      ctx.fillRect(x, y, 1.4, 1.4)
    }

    return canvas.toDataURL('image/jpeg', 0.72)
  } catch {
    return base.art
  }
}
