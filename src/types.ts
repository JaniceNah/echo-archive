export type EffectKey = 'tension' | 'trust' | 'openness' | 'safety'

export type Stats = Record<EffectKey, number>

export const EFFECT_META: Record<
  EffectKey,
  { label: string; en: string; hint: string; invert?: boolean }
> = {
  tension: { label: '紧绷', en: 'TENSION', hint: '班级气氛的紧张程度', invert: true },
  trust: { label: '信任', en: 'TRUST', hint: '同伴之间愿意相信彼此的程度' },
  openness: { label: '公开', en: 'OPENNESS', hint: '信息被说清楚的程度' },
  safety: { label: '安全', en: 'SAFETY', hint: '当事人是否被保护' },
}

export interface Clue {
  id: string
  code: string
  title: string
  act: number
  source: string
  time: string
  summary: string
  detail: string
  reliability: '已核实' | '待核实' | '单一来源'
}

export interface Character {
  id: string
  name: string
  en: string
  portrait: string | null
  seated?: string | null
  seal: string
  identity: string
  traits: string[]
  personality: string
  background: string
  emotion: string
  emotionLabel: number
  goal: string
  knownClues: string[]
  hidden: string[]
  seatNote: string
}

export interface Choice {
  id: string
  title: string
  intent: string
  description: string
  effects: Partial<Stats>
  clueId?: string
  flags?: string[]
  feedback: string
  observerLine: string
  requires?: string
  requiresLabel?: string
  printBody: string[]
}

export interface Act {
  id: string
  no: number
  code: string
  title: string
  en: string
  scene: string
  time: string
  setting: string
  event?: string
  narration: string[]
  task: string
  question: string
  baseClueIds: string[]
  choices: Choice[]
  closing: string
}

export interface Ending {
  id: string
  code: string
  title: string
  en: string
  stamp: string
  summary: string
  paragraphs: string[]
  consequences: string[]
  reflection: string[]
  demo?: boolean
}

export interface Story {
  id: string
  slot: string
  title: string
  en: string
  type: string
  themes: string[]
  logline: string
  description: string
  playable: boolean
  demoLabel?: string
  duration: string
  playerRange: string
  accent: 'red' | 'brass' | 'ink'
  initialStats: Stats
  characters: Character[]
  acts: Act[]
  endings: Ending[]
  clueBank: Clue[]
  generated?: boolean
  backdrop?: string
}

export interface PrintLine {
  label: string
  value: string
}

export interface PrintMaterial {
  id: string
  kind: 'profile' | 'evidence' | 'receipt' | 'replay'
  code: string
  title: string
  subtitle: string
  lines: PrintLine[]
  body: string[]
  note: string
  stamp: string
}

export interface HistoryEntry {
  actIndex: number
  actNo: number
  actTitle: string
  choiceId: string
  choiceTitle: string
  intent: string
  feedback: string
  effects: Partial<Stats>
  flags: string[]
  clueId?: string
  actor: string
  seat?: number
  at: string
}

export interface Snapshot {
  actIndex: number
  stats: Stats
  flagList: string[]
  clueIds: string[]
}

export interface ReplayResult {
  actIndex: number
  altChoiceId: string
  altChoiceTitle: string
  altStats: Stats
  originalStats: Stats
  originalChoiceTitle: string
  originalEnding: Ending
  altEnding: Ending
  diffNotes: string[]
  reflection: string[]
  material: PrintMaterial
}

export interface PrintRecord {
  id: string
  material: PrintMaterial
  printedAt: string
  scope: string
}

export type GamePhase = 'brief' | 'choice' | 'feedback' | 'actend' | 'ending'

export type GameMode = 'solo' | 'classroom'

export interface Seat {
  index: number
  roleId: string
  micOn: boolean
  muted: boolean
}

export interface TranscriptLine {
  id: string
  seat: number
  roleId: string | null
  roleName: string
  text: string
  at: string
  source: 'live' | 'local' | 'simulated'
  actIndex: number
}

export type VoiceAction = 'beginDiscussion' | 'finishFeedback' | 'advanceAct'

export interface VoiceCandidate {
  id: string
  kind: 'choice' | 'stage'
  choiceId?: string
  action?: VoiceAction
  label: string
  hint: string
  score: number
}

export interface TeacherSettings {
  theme: string
  players: number
  duration: number
  skipSensitive: boolean
  device: {
    screen: boolean
    mic: boolean
    printer: boolean
    offline: boolean
  }
}

export interface RoleAssignment {
  playerIndex: number
  roleId: string
  isYou: boolean
}
