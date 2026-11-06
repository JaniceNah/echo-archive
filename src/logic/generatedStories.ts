import type { Story } from '../types'

const KEY = 'echo-archive-generated-v1'

interface GeneratedEntry {
  story: Story
  createdAt: string
}

type Registry = Record<string, GeneratedEntry>

let cache: Registry | null = null

function readRegistry(): Registry {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const registry: Registry = {}
    for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
      const candidate = entry as Partial<GeneratedEntry>
      if (candidate?.story && typeof candidate.story === 'object') {
        registry[id] = {
          story: candidate.story,
          createdAt: candidate.createdAt ?? new Date().toISOString(),
        }
      }
    }
    return registry
  } catch {
    return {}
  }
}

function writeRegistry(registry: Registry) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(registry))
  } catch {
    // storage may be full or blocked; the in-memory cache still works this session
  }
}

function registry(): Registry {
  if (!cache) cache = readRegistry()
  return cache
}

function sortedEntries(): GeneratedEntry[] {
  return Object.values(registry()).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function listGeneratedStories(): Story[] {
  return sortedEntries().map((entry) => entry.story)
}

export function getGeneratedStory(id: string | null | undefined): Story | undefined {
  if (!id) return undefined
  return registry()[id]?.story
}

export function saveGeneratedStory(story: Story): Story {
  const next: Registry = {
    ...registry(),
    [story.id]: { story, createdAt: new Date().toISOString() },
  }
  cache = next
  writeRegistry(next)
  return story
}

export function removeGeneratedStory(id: string): void {
  const next = { ...registry() }
  delete next[id]
  cache = next
  writeRegistry(next)
}

export function nextGeneratedSlot(): string {
  const used = new Set(Object.values(registry()).map((entry) => entry.story.slot))
  let n = 1
  while (used.has(`GEN-${String(n).padStart(2, '0')}`)) n += 1
  return `GEN-${String(n).padStart(2, '0')}`
}

export function generatedStoryCount(): number {
  return Object.keys(registry()).length
}
