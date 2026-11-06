import type { Act, Choice, GamePhase, VoiceCandidate } from '../types'

const STOP_GRAMS = new Set([
  '我们',
  '你们',
  '他们',
  '怎么',
  '什么',
  '这个',
  '那个',
  '还是',
  '可以',
  '应该',
  '一下',
  '现在',
  '就是',
  '不是',
  '没有',
  '先做',
  '准备',
  '觉得',
  '因为',
  '所以',
  '如果',
  '然后',
  '一个',
  '这件',
  '事情',
])

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s，。！？、；：,.!?;:'"“”‘’（）()【】[\]…—\-]/g, '')
}

function grams(text: string): Set<string> {
  const clean = normalize(text)
  const out = new Set<string>()
  const cjkRuns = clean.match(/[一-龥]+/g) ?? []
  for (const run of cjkRuns) {
    for (let n = 2; n <= 3; n += 1) {
      for (let i = 0; i + n <= run.length; i += 1) {
        const gram = run.slice(i, i + n)
        if (!STOP_GRAMS.has(gram)) out.add(gram)
      }
    }
  }
  const latin = clean.match(/[a-z0-9]{2,}/g) ?? []
  for (const word of latin) out.add(word)
  return out
}

function choiceCorpus(choice: Choice): Set<string> {
  return grams(`${choice.title}${choice.intent}${choice.description}`)
}

const ORDINAL: Array<[RegExp, number]> = [
  [/(?:第|选项|选)\s*1|第一|选一/, 0],
  [/(?:第|选项|选)\s*2|第二|选二/, 1],
  [/(?:第|选项|选)\s*3|第三|选三/, 2],
  [/(?:第|选项|选)\s*4|第四|选四/, 3],
]

function cosineScore(textGrams: Set<string>, corpus: Set<string>, idf: Map<string, number>): number {
  if (!textGrams.size || !corpus.size) return 0
  let matched = 0
  let textWeight = 0
  let corpusWeight = 0
  for (const gram of textGrams) {
    const w = idf.get(gram) ?? 1
    textWeight += w
    if (corpus.has(gram)) matched += w
  }
  for (const gram of corpus) corpusWeight += idf.get(gram) ?? 1
  return matched / Math.sqrt(Math.max(1, textWeight * corpusWeight))
}

function stageCandidates(phase: GamePhase): Array<Omit<VoiceCandidate, 'score'>> {
  if (phase === 'brief') {
    return [
      {
        id: 'stage-begin',
        kind: 'stage',
        action: 'beginDiscussion',
        label: '进入小组讨论',
        hint: '结束叙述，进入讨论与行动选择',
      },
    ]
  }
  if (phase === 'feedback') {
    return [
      {
        id: 'stage-finish',
        kind: 'stage',
        action: 'finishFeedback',
        label: '结束本幕',
        hint: '收起回应，进入幕末复盘',
      },
    ]
  }
  if (phase === 'actend') {
    return [
      {
        id: 'stage-advance',
        kind: 'stage',
        action: 'advanceAct',
        label: '进入下一幕',
        hint: '保存本幕，继续剧情（或进入结局）',
      },
    ]
  }
  return []
}

const STAGE_PATTERNS: Record<string, string[]> = {
  beginDiscussion: ['进入讨论', '开始讨论', '讨论吧', '开始吧', '继续', '往下', '下一步'],
  finishFeedback: ['结束本幕', '进入复盘', '复盘', '下一步', '继续'],
  advanceAct: ['下一幕', '进入下一幕', '继续剧情', '继续', '往下走', '查看结局', '结束演示', '结束'],
}

export function stageHint(action: VoiceCandidate['action']): string {
  if (action === 'beginDiscussion') return '结束叙述，进入讨论与行动选择'
  if (action === 'finishFeedback') return '收起回应，进入幕末复盘'
  return '保存本幕，继续剧情（或进入结局）'
}

export function matchUtterance(text: string, phase: GamePhase, act: Act | undefined): VoiceCandidate[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  if (phase === 'choice' && act) {
    const choices = act.choices
    const corpora = choices.map(choiceCorpus)
    const df = new Map<string, number>()
    for (const corpus of corpora) {
      for (const gram of corpus) df.set(gram, (df.get(gram) ?? 0) + 1)
    }
    const idf = new Map<string, number>()
    for (const [gram, count] of df) idf.set(gram, Math.log(1 + choices.length / count) + 0.6)
    const textGrams = grams(trimmed)
    const cleanText = normalize(trimmed)

    const scored = choices.map((choice, index) => {
      let score = cosineScore(textGrams, corpora[index], idf)
      const cleanTitle = normalize(choice.title)
      if (cleanTitle.length >= 3 && cleanText.includes(cleanTitle)) score += 0.45
      else if (cleanTitle.length >= 2 && cleanText.includes(cleanTitle.slice(0, 2))) score += 0.16
      const ordinal = ORDINAL.find(([re]) => re.test(trimmed))
      if (ordinal && ordinal[1] === index) score += 0.35
      return {
        id: `choice-${choice.id}`,
        kind: 'choice' as const,
        choiceId: choice.id,
        label: choice.title,
        hint: choice.intent,
        score: Math.max(0, Math.min(1, score)),
      }
    })

    return scored
      .filter((c) => c.score >= 0.16)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  const candidates = stageCandidates(phase)
  return candidates
    .map((candidate) => {
      const patterns = STAGE_PATTERNS[candidate.action ?? ''] ?? []
      const hit = patterns.some((p) => trimmed.includes(p))
      const ratio = hit ? 1 : 0
      return { ...candidate, score: ratio }
    })
    .filter((c) => c.score >= 0.5)
}

export function simulateUtterance(act: Act | undefined, phase: GamePhase): string {
  if (phase === 'choice' && act?.choices.length) {
    const index = Math.floor(Math.random() * act.choices.length)
    const choice = act.choices[index]
    const templates = [
      `我们想先${choice.title}。${choice.intent}。`,
      `我觉得应该选「${choice.title}」，因为${choice.description.slice(0, 42)}`,
      `我们讨论后决定${choice.title}。先${choice.intent}。`,
    ]
    return `${templates[Math.floor(Math.random() * templates.length)]}（模拟发言）`
  }
  if (phase === 'brief') return '我们先讨论一下，再决定这一件事怎么做。（模拟发言）'
  if (phase === 'feedback') return '这段我们看完了，进入复盘吧。（模拟发言）'
  if (phase === 'actend') return '进入下一幕。（模拟发言）'
  return '我们准备好了。（模拟发言）'
}

export function scoreLabel(score: number): string {
  if (score >= 0.6) return '高匹配'
  if (score >= 0.35) return '可能匹配'
  return '弱匹配'
}

/* ---------- utterance classification ---------- */

export type UtteranceCategory =
  | 'proposal'
  | 'stance'
  | 'question'
  | 'fact'
  | 'guess'
  | 'feeling'
  | 'other'

export const CATEGORY_ORDER: UtteranceCategory[] = [
  'proposal',
  'stance',
  'question',
  'fact',
  'guess',
  'feeling',
  'other',
]

export const CATEGORY_META: Record<
  UtteranceCategory,
  { label: string; en: string; chip: string; dot: string }
> = {
  proposal: {
    label: '提议',
    en: 'PROPOSAL',
    chip: 'border-[#76854f]/55 bg-[#76854f]/10 text-[#4f5a36]',
    dot: 'bg-[#76854f]',
  },
  stance: {
    label: '立场',
    en: 'STANCE',
    chip: 'border-ink/40 bg-ink/[0.06] text-ink/70',
    dot: 'bg-ink',
  },
  question: {
    label: '提问',
    en: 'QUESTION',
    chip: 'border-[#3f6f86]/50 bg-[#3f6f86]/10 text-[#33596b]',
    dot: 'bg-[#3f6f86]',
  },
  fact: {
    label: '事实',
    en: 'FACT',
    chip: 'border-ink/30 bg-paper text-ink/65',
    dot: 'bg-ink/55',
  },
  guess: {
    label: '推测',
    en: 'GUESS',
    chip: 'border-brass/50 bg-brass/[0.08] text-brass',
    dot: 'bg-brass',
  },
  feeling: {
    label: '感受',
    en: 'FEELING',
    chip: 'border-red/45 bg-red/[0.05] text-red/80',
    dot: 'bg-red',
  },
  other: {
    label: '其他',
    en: 'OTHER',
    chip: 'border-ink/20 bg-paper-2/50 text-ink/45',
    dot: 'bg-ink/25',
  },
}

const CATEGORY_RULES: Array<[UtteranceCategory, RegExp]> = [
  [
    'proposal',
    /(我们(应该|可以|要不|不如)|建议|不如|先把|先让|先去|一起|让我|我来|可以试|要不要|下一步|怎么办)/,
  ],
  [
    'stance',
    /(我(觉得|认为|不同意|同意|支持|反对|不想|想)|不能|不该|必须|一定要|就应该|绝不|肯定不)/,
  ],
  ['question', /[?？]|(为什么|怎么|谁|是不是|会不会|有没有|能不能|要不要|哪一)/],
  [
    'fact',
    /(看到|看见|听见|听到|记录|档案|证据|事实上|确实|明明|当时|监控|照片|时间|地点|我记得|说过|做过)/,
  ],
  ['guess', /(可能|也许|大概|猜测|估计|说不定|似乎|好像|应该会|八成|没准)/],
  ['feeling', /(害怕|担心|难过|生气|委屈|紧张|不舒服|心疼|愤怒|受伤|焦虑|不安|难受|愧疚|丢脸|尴尬)/],
]

export function classifyUtterance(text: string): UtteranceCategory[] {
  const trimmed = text.trim()
  if (!trimmed) return ['other']
  const hits = new Set<UtteranceCategory>()
  const clauses = trimmed.split(/[。！？!?；;\n]+/).filter(Boolean)
  for (const clause of clauses.length ? clauses : [trimmed]) {
    for (const [category, rule] of CATEGORY_RULES) {
      if (rule.test(clause)) hits.add(category)
    }
  }
  if (hits.size === 0) return ['other']
  return CATEGORY_ORDER.filter((category) => hits.has(category))
}

export interface ClassifiedLine {
  seat: number
  roleName: string
  text: string
  categories: UtteranceCategory[]
}

export interface RoundDigest {
  lines: ClassifiedLine[]
  counts: Partial<Record<UtteranceCategory, number>>
  dominant: UtteranceCategory | null
  spread: number
  note: string
}

export function summarizeRound(
  lines: Array<{ seat: number; roleName: string; text: string }>,
): RoundDigest {
  const classified: ClassifiedLine[] = lines.map((line) => ({
    ...line,
    categories: classifyUtterance(line.text),
  }))
  const counts: Partial<Record<UtteranceCategory, number>> = {}
  for (const line of classified) {
    for (const category of line.categories) {
      counts[category] = (counts[category] ?? 0) + 1
    }
  }
  const substantive = CATEGORY_ORDER.filter((c) => c !== 'other' && (counts[c] ?? 0) > 0)
  const spread = substantive.length
  let dominant: UtteranceCategory | null = null
  for (const category of substantive) {
    if (!dominant || (counts[category] ?? 0) > (counts[dominant] ?? 0)) dominant = category
  }
  if (!classified.length) {
    return {
      lines: classified,
      counts,
      dominant: null,
      spread: 0,
      note: '本轮还没有语音发言记录；主持人可以直接按座位点选行动。',
    }
  }
  if (spread >= 3) {
    const labels = substantive.slice(0, 3).map((c) => `「${CATEGORY_META[c].label}」`).join('')
    return {
      lines: classified,
      counts,
      dominant,
      spread,
      note: `本轮发言同时出现了${labels}等不同依据。主持人可以先把「知道的」和「猜的」分开，再决定行动。`,
    }
  }
  if (dominant) {
    return {
      lines: classified,
      counts,
      dominant,
      spread,
      note: `本轮发言以「${CATEGORY_META[dominant].label}」为主（${counts[dominant] ?? 0} 条），剧情会优先回应这一类内容。`,
    }
  }
  return {
    lines: classified,
    counts,
    dominant: null,
    spread: 0,
    note: '本轮发言还没有形成明确分类，可以请每位玩家再说一句具体依据。',
  }
}
