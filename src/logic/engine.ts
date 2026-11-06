import type {
  Act,
  Character,
  Choice,
  Clue,
  Ending,
  EffectKey,
  HistoryEntry,
  PrintMaterial,
  ReplayResult,
  RoleAssignment,
  Snapshot,
  Stats,
  Story,
} from '../types'
import { EFFECT_META } from '../types'

export function clamp(n: number) {
  return Math.max(0, Math.min(100, n))
}

export function applyEffects(stats: Stats, effects: Partial<Stats>): Stats {
  return {
    tension: clamp(stats.tension + (effects.tension ?? 0)),
    trust: clamp(stats.trust + (effects.trust ?? 0)),
    openness: clamp(stats.openness + (effects.openness ?? 0)),
    safety: clamp(stats.safety + (effects.safety ?? 0)),
  }
}

export function mergeEffects(list: Array<Partial<Stats>>): Partial<Stats> {
  return list.reduce<Partial<Stats>>((acc, cur) => {
    for (const key of Object.keys(cur) as EffectKey[]) {
      acc[key] = (acc[key] ?? 0) + (cur[key] ?? 0)
    }
    return acc
  }, {})
}

export function describeEffects(effects: Partial<Stats>): string {
  const parts = (Object.keys(EFFECT_META) as EffectKey[])
    .filter((k) => (effects[k] ?? 0) !== 0)
    .map((k) => `${EFFECT_META[k].label} ${(effects[k] ?? 0) > 0 ? '+' : ''}${effects[k]}`)
  return parts.length ? parts.join(' / ') : '状态未发生变化'
}

export function getChoices(act: Act): Choice[] {
  return act.choices
}

export function availableCharacters(story: Story, playerCount: number): Character[] {
  return story.characters.slice(0, Math.max(4, Math.min(6, playerCount)))
}

export function buildAssignment(
  story: Story,
  playerCount: number,
  youRoleId: string | null,
): RoleAssignment[] {
  return availableCharacters(story, playerCount).map((c, i) => ({
    playerIndex: i + 1,
    roleId: c.id,
    isYou: c.id === youRoleId,
  }))
}

export function computeEnding(story: Story, stats: Stats, flags: string[]): Ending {
  if (story.id === 'class') {
    const byId = (id: string) => story.endings.find((e) => e.id === id)!
    if (stats.tension >= 68 || stats.trust < 38) return byId('tear')
    if (stats.openness >= 65 && stats.safety < 50) return byId('exposed')
    if (stats.openness >= 60 && stats.trust >= 60 && stats.safety >= 50) return byId('repair')
    if (stats.safety >= 55 && stats.openness < 55) return byId('silent')
    return byId('echo')
  }

  if (story.id === 'raise-hand') {
    const byId = (id: string) => story.endings.find((e) => e.id === id)!
    const count = (prefix: string) => flags.filter((f) => f.startsWith(prefix)).length
    const intervene = count('intervene')
    const selfhold = count('selfhold')
    const join = count('join')
    const positive = intervene + selfhold

    if (join >= 3 || stats.trust < 42 || stats.safety < 42) {
      return byId('raise-cold')
    }
    if (positive >= 3 && stats.trust >= 58 && stats.safety >= 56 && stats.tension <= 90) {
      return byId('raise-warm')
    }
    if (positive >= 2 && stats.trust >= 52 && stats.openness >= 50 && stats.safety >= 48) {
      return byId('raise-third')
    }
    return byId('raise-zero')
  }

  const openCount = flags.filter((f) => f === 'open').length
  const guardCount = flags.filter((f) => f === 'guard').length
  const opened = openCount >= guardCount
  return story.endings.find((e) => e.id.endsWith(opened ? 'demo-open' : 'demo-guard'))!
}

export function buildEvidence(clue: Clue): PrintMaterial {
  return {
    id: `evidence-${clue.id}`,
    kind: 'evidence',
    code: clue.code,
    title: clue.title,
    subtitle: `事件证据 / EVIDENCE · 第 ${clue.act} 幕`,
    lines: [
      { label: '归档编号', value: clue.code },
      { label: '来源', value: clue.source },
      { label: '记录时间', value: clue.time },
      { label: '可信度', value: clue.reliability },
    ],
    body: [clue.summary, clue.detail],
    note: '本材料为虚构故事中的线索，不指向任何真实个人。已归档事实不会被后续剧情改写；新证据只能补充，不能覆盖。',
    stamp: '已归档',
  }
}

export function buildReceipt(params: {
  story: Story
  act: Act
  choice: Choice
  actor: string
  statsBefore: Stats
  statsAfter: Stats
}): PrintMaterial {
  const { story, act, choice, actor, statsBefore, statsAfter } = params
  const changes = (Object.keys(EFFECT_META) as EffectKey[])
    .filter((k) => statsBefore[k] !== statsAfter[k])
    .map((k) => `${EFFECT_META[k].label} ${statsBefore[k]} → ${statsAfter[k]}`)

  return {
    id: `receipt-${story.id}-${act.id}-${choice.id}-${Date.now()}`,
    kind: 'receipt',
    code: `RC-${story.slot}-${act.no}${choice.id.replace(/[^0-9]/g, '').padStart(2, '0')}`,
    title: '行动回执',
    subtitle: `ACTION RECEIPT · 第 ${act.no} 幕「${act.title}」`,
    lines: [
      { label: '档案', value: `${story.slot} ${story.title}` },
      { label: '行动者', value: actor },
      { label: '行动', value: choice.title },
      { label: '行动意图', value: choice.intent },
    ],
    body: [
      ...choice.printBody,
      changes.length ? `角色状态变化：${changes.join('；')}。` : '角色状态未发生明显变化。',
    ],
    note: '本回执记录的是虚构角色的状态变化，不是对真实玩家的心理测评、人格评分或道德评分。回执内容与本次选择一一对应。',
    stamp: '行动已记录',
  }
}

export function buildProfile(character: Character, story: Story): PrintMaterial {
  return {
    id: `profile-${story.id}-${character.id}`,
    kind: 'profile',
    code: `FILE-${story.slot}-${character.seal}`,
    title: character.name,
    subtitle: `${character.en} · ${character.identity}`,
    lines: [
      { label: '档案编号', value: `FILE-${story.slot}-${character.id.toUpperCase()}` },
      { label: '公开身份', value: character.identity },
      { label: '当前情绪', value: character.emotion },
      { label: '个人目标', value: character.goal },
    ],
    body: [
      `性格与行为：${character.personality}`,
      `私人背景：${character.background}`,
      `已知线索：${character.knownClues.join('；')}。`,
      `尚未揭示：${character.hidden.join('；')}。`,
    ],
    note: '沿虚线折叠：上半部分为公开信息，可向同桌展示；下半部分为私人信息，仅限本人阅读。不要替别人念出他的私人档案。',
    stamp: '角色已领取',
  }
}

export function buildReplayMaterial(params: {
  story: Story
  act: Act
  originalChoice: Choice
  altChoice: Choice
  originalEnding: Ending
  altEnding: Ending
  originalStats: Stats
  altStats: Stats
  diffNotes: string[]
}): PrintMaterial {
  const { story, act, originalChoice, altChoice, originalEnding, altEnding, altStats, diffNotes } = params
  return {
    id: `replay-${story.id}-${act.id}-${altChoice.id}-${Date.now()}`,
    kind: 'replay',
    code: `RP-${story.slot}-${act.no}`,
    title: '重演对照',
    subtitle: `REPLAY COMPARISON · 第 ${act.no} 幕「${act.title}」`,
    lines: [
      { label: '重演节点', value: `第 ${act.no} 幕` },
      { label: '第一次选择', value: originalChoice.title },
      { label: '第二次选择', value: altChoice.title },
      { label: '结局变化', value: `${originalEnding.title} → ${altEnding.title}` },
    ],
    body: [
      `第一次路径：${originalEnding.code}「${originalEnding.title}」。`,
      `重演路径：${altEnding.code}「${altEnding.title}」。`,
      ...diffNotes.map((n) => `状态对照：${n}`),
      `重演后的状态：紧绷 ${altStats.tension} / 信任 ${altStats.trust} / 公开 ${altStats.openness} / 安全 ${altStats.safety}。`,
    ],
    note: '重演的目的不是找到唯一正确答案，而是理解不同选择如何改变处境。两次记录都属于虚构演绎，不构成对真实玩家的评价。',
    stamp: '对照归档',
  }
}

export function statDiff(a: Stats, b: Stats): Array<{ key: EffectKey; from: number; to: number; delta: number }> {
  return (Object.keys(EFFECT_META) as EffectKey[]).map((key) => ({
    key,
    from: a[key],
    to: b[key],
    delta: b[key] - a[key],
  }))
}

export function simulateReplay(params: {
  story: Story
  snapshots: Snapshot[]
  history: HistoryEntry[]
  actIndex: number
  altChoiceId: string
  originalEnding: Ending
}): ReplayResult | null {
  const { story, snapshots, history, actIndex, altChoiceId, originalEnding } = params
  const act = story.acts[actIndex]
  const snapshot = snapshots.find((s) => s.actIndex === actIndex)
  const originalEntry = history.find((h) => h.actIndex === actIndex)
  const altChoice = act?.choices.find((c) => c.id === altChoiceId)
  const originalChoice = act?.choices.find((c) => c.id === originalEntry?.choiceId)
  if (!act || !snapshot || !originalEntry || !altChoice || !originalChoice) return null

  let stats: Stats = { ...snapshot.stats }
  let flags = [...snapshot.flagList]

  stats = applyEffects(stats, altChoice.effects)
  flags = Array.from(new Set([...flags, ...(altChoice.flags ?? [])]))

  for (const later of history.filter((h) => h.actIndex > actIndex)) {
    stats = applyEffects(stats, later.effects)
    flags = Array.from(new Set([...flags, ...later.flags]))
  }

  const altEnding = computeEnding(story, stats, flags)
  const finalStats = stats

  let oStats = { ...snapshot.stats }
  for (const entry of history.filter((h) => h.actIndex >= actIndex)) {
    oStats = applyEffects(oStats, entry.effects)
  }

  const diffs = statDiff(oStats, finalStats)
  const diffNotes = diffs
    .filter((d) => d.delta !== 0)
    .map((d) => `${EFFECT_META[d.key].label} ${d.from} → ${d.to}（${d.delta > 0 ? '+' : ''}${d.delta}）`)

  const reflection = [
    `你改选了「${altChoice.title}」。这个选择最先影响的是谁？`,
    altEnding.id === originalEnding.id
      ? '结局的标题没有改变，但过程中有哪些东西已经不同了？'
      : `结局从「${originalEnding.title}」变成了「${altEnding.title}」。你认为转折点在哪里？`,
    '如果只能在现实中考量一件事，你会保留哪个选择的哪一部分？',
  ]

  const material = buildReplayMaterial({
    story,
    act,
    originalChoice,
    altChoice,
    originalEnding,
    altEnding,
    originalStats: oStats,
    altStats: finalStats,
    diffNotes,
  })

  return {
    actIndex,
    altChoiceId,
    altChoiceTitle: altChoice.title,
    altStats: finalStats,
    originalStats: oStats,
    originalChoiceTitle: originalEntry.choiceTitle,
    originalEnding,
    altEnding,
    diffNotes,
    reflection,
    material,
  }
}
