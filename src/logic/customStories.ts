import type { Act, Choice, Story } from '../types'

const ACTIVE_KEY = 'echo-archive-custom-v1'
const PENDING_KEY = 'echo-archive-custom-pending-v1'

const KNOWN_IDS = ['class', 'scapegoat', 'echo-trial']

interface RegistryEntry {
  story: Story | null
  savedAt: string
}

type Registry = Record<string, RegistryEntry>

let activeCache: Registry | null = null
let pendingCache: Registry | null = null

function readRegistry(key: string): Registry {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Registry
  } catch {
    return {}
  }
}

function writeRegistry(key: string, registry: Registry) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(registry))
  } catch {
    // storage may be full or blocked; the in-memory cache still works for this page
  }
}

function activeRegistry(): Registry {
  if (!activeCache) activeCache = readRegistry(ACTIVE_KEY)
  return activeCache
}

function pendingRegistry(): Registry {
  if (!pendingCache) pendingCache = readRegistry(PENDING_KEY)
  return pendingCache
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function getCustomStory(id: string | null | undefined): Story | undefined {
  if (!id) return undefined
  return activeRegistry()[id]?.story ?? undefined
}

export function getPendingStory(id: string | null | undefined): Story | undefined {
  if (!id) return undefined
  return pendingRegistry()[id]?.story ?? undefined
}

export type PendingKind = 'update' | 'delete'

export function pendingKind(id: string): PendingKind | null {
  const entry = pendingRegistry()[id]
  if (!entry) return null
  return entry.story ? 'update' : 'delete'
}

export function pendingSavedAt(id: string): string | null {
  return pendingRegistry()[id]?.savedAt ?? null
}

export function savePendingStory(story: Story) {
  const registry = { ...pendingRegistry() }
  registry[story.id] = { story: clone(story), savedAt: new Date().toISOString() }
  pendingCache = registry
  writeRegistry(PENDING_KEY, registry)
}

export function deletePendingStory(id: string) {
  const registry = { ...pendingRegistry() }
  registry[id] = { story: null, savedAt: new Date().toISOString() }
  pendingCache = registry
  writeRegistry(PENDING_KEY, registry)
}

export function discardPendingStory(id: string) {
  const registry = { ...pendingRegistry() }
  delete registry[id]
  pendingCache = registry
  writeRegistry(PENDING_KEY, registry)
}

/** Called when a new run starts: staged edits become the version that run reads. */
export function commitPendingStories(): string[] {
  const pending = pendingRegistry()
  const ids = Object.keys(pending)
  if (ids.length === 0) return []
  const active = { ...activeRegistry() }
  for (const id of ids) {
    const entry = pending[id]
    if (entry.story) active[id] = { story: entry.story, savedAt: entry.savedAt }
    else delete active[id]
  }
  activeCache = active
  pendingCache = {}
  writeRegistry(ACTIVE_KEY, active)
  writeRegistry(PENDING_KEY, {})
  return ids
}

export function customStatus(id: string): {
  active: boolean
  activeAt: string | null
  pending: PendingKind | null
  pendingAt: string | null
} {
  const active = activeRegistry()[id]
  return {
    active: Boolean(active?.story),
    activeAt: active?.savedAt ?? null,
    pending: pendingKind(id),
    pendingAt: pendingSavedAt(id),
  }
}

export function exportStoryJson(story: Story): string {
  return JSON.stringify(
    {
      kind: 'echo-archive-story',
      version: 1,
      exportedAt: new Date().toISOString(),
      story,
    },
    null,
    2,
  )
}

export interface ImportResult {
  story?: Story
  error?: string
}

export function parseStoryJson(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { error: '不是有效的 JSON 文件。' }
  }
  const candidate =
    parsed && typeof parsed === 'object' && 'story' in parsed
      ? (parsed as { story: unknown }).story
      : parsed
  const errors = validateStory(candidate)
  if (errors.length) return { error: errors.join('；') }
  return { story: candidate as Story }
}

export function validateStory(candidate: unknown): string[] {
  const errors: string[] = []
  if (!candidate || typeof candidate !== 'object') return ['档案内容不是一个对象。']
  const story = candidate as Partial<Story>
  if (typeof story.id !== 'string' || !KNOWN_IDS.includes(story.id)) {
    errors.push('story.id 必须是 class / scapegoat / echo-trial 之一')
  }
  if (typeof story.title !== 'string' || !story.title.trim()) errors.push('缺少故事标题')
  if (typeof story.slot !== 'string') errors.push('缺少档案编号 slot')
  if (!Array.isArray(story.acts) || story.acts.length === 0) {
    errors.push('至少需要一幕剧情')
  } else {
    story.acts.forEach((act, i) => {
      const where = `第 ${i + 1} 幕`
      if (!act || typeof act !== 'object') {
        errors.push(`${where}不是有效对象`)
        return
      }
      const a = act as Partial<Act>
      if (!a.id) errors.push(`${where}缺少 id`)
      if (typeof a.no !== 'number') errors.push(`${where}缺少幕号`)
      if (!a.title?.trim()) errors.push(`${where}缺少标题`)
      if (!Array.isArray(a.choices) || a.choices.length < 2) {
        errors.push(`${where}至少需要 2 个行动选项`)
      } else {
        a.choices.forEach((choice, j) => {
          const c = choice as Partial<Choice>
          if (!c?.id) errors.push(`${where}第 ${j + 1} 个选项缺少 id`)
          if (!c?.title?.trim()) errors.push(`${where}第 ${j + 1} 个选项缺少标题`)
        })
      }
    })
  }
  if (!Array.isArray(story.endings) || story.endings.length === 0) errors.push('至少需要一个结局')
  if (!Array.isArray(story.characters) || story.characters.length === 0) errors.push('至少需要一个角色')
  if (!Array.isArray(story.clueBank)) errors.push('缺少线索库')
  if (!story.initialStats || typeof story.initialStats !== 'object') errors.push('缺少初始状态')
  return errors
}
