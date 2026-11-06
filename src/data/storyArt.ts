import type { Story } from '../types'
import { getGeneratedStory } from '../logic/generatedStories'

const ART = '/assets/yinian'

export const ACT_SCENE_ART: Record<string, Record<string, string>> = {
  class: {
    act1: `${ART}/scenes/classroom.webp`,
    act2: `${ART}/scenes/classroom.webp`,
    act3: `${ART}/scenes/classroom-decorated.webp`,
  },
  'raise-hand': {
    'raise-act1': `${ART}/scenes/classroom.webp`,
    'raise-act2': `${ART}/scenes/classroom.webp`,
    'raise-act3': `${ART}/scenes/classroom.webp`,
    'raise-act4': `${ART}/scenes/classroom-decorated.webp`,
    'raise-act5': `${ART}/scenes/classroom-decorated.webp`,
  },
}

export const STORY_COVER_ART: Record<string, string> = {
  class: `${ART}/scenes/classroom-decorated.webp`,
  'raise-hand': `${ART}/scenes/classroom-decorated.webp`,
}

export const ENDING_BACKDROP: Record<string, string> = {
  class: `${ART}/scenes/classroom.webp`,
  'raise-hand': `${ART}/scenes/corridor.webp`,
}

export const BRAND_TITLE_ART = `${ART}/title/yinian-title.webp`

export const MENU_BACKDROP_ART = `${ART}/scenes/classroom-sketch.webp`

export const DM_ART = {
  avatar: `${ART}/dm/dm-2.webp`,
  hero: `${ART}/dm/dm-hero-original.png`,
  menuHero: '/assets/dm.png',
  menuIntro: `${ART}/dm/dm-intro.webp`,
}

export const CURTAIN_ART = {
  closed: `${ART}/curtain/curtain-closed.webp`,
}

export const TEACHER_ART = `${ART}/characters/teacher.png`

export const ACT_CAMEOS: Record<string, Record<string, Array<{ src: string; label: string }>>> = {
  'raise-hand': {
    'raise-act5': [
      { src: `${ART}/characters/guyu.png`, label: '顾屿 · 档案影像' },
      { src: `${ART}/characters/lin-memory.png`, label: '林知遥 · 回忆' },
    ],
  },
}

export const STOCK_SCENES = [
  { src: `${ART}/scenes/library.webp`, label: '旧图书馆' },
  { src: `${ART}/scenes/village.webp`, label: '山谷村落' },
  { src: `${ART}/scenes/town.webp`, label: '城堡小镇' },
  { src: `${ART}/scenes/arcade.webp`, label: '拱廊走廊' },
]

export const STOCK_CHARACTERS = Array.from({ length: 5 }, (_, i) => ({
  src: `${ART}/stock/stock-${i + 1}.webp`,
  label: `备用角色 0${i + 1}`,
}))

export function sceneArtFor(storyId: string | null | undefined, actId: string | null | undefined) {
  if (!storyId || !actId) return null
  const builtin = ACT_SCENE_ART[storyId]?.[actId]
  if (builtin) return builtin
  return getGeneratedStory(storyId)?.backdrop ?? null
}

export function coverArtFor(story: Story | null | undefined) {
  if (!story) return null
  return STORY_COVER_ART[story.id] ?? story.backdrop ?? null
}

export function endingBackdropFor(story: Story | null | undefined) {
  if (!story) return null
  return ENDING_BACKDROP[story.id] ?? story.backdrop ?? null
}

export function isPlatePortrait(src: string | null | undefined) {
  return Boolean(src?.startsWith(ART))
}

export function cluePropArt(title: string, tone: 'chalk' | 'ink' = 'chalk') {
  const suffix = tone === 'chalk' ? '-chalk' : ''
  let key = 'parchment'
  if (/钥匙|借用登记/.test(title)) key = 'key'
  else if (/词典|纪念册|笔记本|借阅/.test(title)) key = 'notebook'
  else if (/公约|作文|检讨|诗/.test(title)) key = 'quill'
  else if (/材料|通知|挂号|转发|信封/.test(title)) key = 'envelope'
  else if (/名单|值日表|记录|示意图|决定|登记|内页|合影/.test(title)) key = 'scroll'
  return `${ART}/props/${key}${suffix}.webp`
}
