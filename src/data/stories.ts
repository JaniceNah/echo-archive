import type { Story } from '../types'
import { getCustomStory } from '../logic/customStories'
import { getGeneratedStory, listGeneratedStories } from '../logic/generatedStories'
import { CHARACTERS_A, CHARACTERS_B, CHARACTERS_C } from './characters'
import { ACTS_A, CLUES_A, ENDINGS_A } from './storyA'
import { ACTS_B, ACTS_C, CLUES_B, CLUES_C, ENDINGS_B, ENDINGS_C } from './storiesBC'
import { ACTS_RAISE, CHARACTERS_RAISE, CLUES_RAISE, ENDINGS_RAISE } from './storyRaiseHand'

export const STORIES: Story[] = [
  {
    id: 'class',
    slot: 'A-01',
    title: '没有坏人的班级',
    en: 'THE CLASS WITHOUT A VILLAIN',
    type: '校园悬疑',
    themes: ['同伴排斥', '群体认同', '被忽略的情绪', '责任与支持'],
    logline: '一个即将获得「零霸凌」荣誉的班级，有人却连续从活动名单中消失。',
    description:
      '评选还有三天。活动名单上少了三个名字，一段被剪过的录音开始在班里流传。没有人觉得自己是坏人——这正是最难处理的地方。',
    playable: true,
    duration: '35–45 分钟',
    playerRange: '4–6 人',
    accent: 'red',
    initialStats: { tension: 40, trust: 45, openness: 35, safety: 55 },
    characters: CHARACTERS_A,
    acts: ACTS_A,
    endings: ENDINGS_A,
    clueBank: CLUES_A,
  },
  {
    id: 'scapegoat',
    slot: 'B-02',
    title: '替罪者协议',
    en: 'THE SCAPEGOAT PROTOCOL',
    type: '奇幻寓言',
    themes: ['被误解', '委屈', '群体归责', '愤怒与不公平'],
    logline: '一个小镇每次发生故障，都把责任归给同一名学徒，并要求他独自承担修复任务。',
    description:
      '灰港镇的钟楼又停了。第十七份「故障责任书」被摊在工坊门口，签字栏旁边放着一支已经打开的笔。惯例比故障本身更牢固。',
    playable: false,
    demoLabel: '演示片段 · 完整三幕未实装',
    duration: '演示 8–10 分钟',
    playerRange: '4–6 人',
    accent: 'brass',
    initialStats: { tension: 50, trust: 40, openness: 30, safety: 50 },
    characters: CHARACTERS_B,
    acts: ACTS_B,
    endings: ENDINGS_B,
    clueBank: CLUES_B,
  },
  {
    id: 'echo-trial',
    slot: 'C-03',
    title: '回声审判',
    en: 'ECHO TRIAL',
    type: '未来科幻',
    themes: ['信息误解', '网络评价', '羞耻', '愤怒与传播责任'],
    logline: '一段被剪辑的私人录音持续传播，当事人受到嘲讽，却无法解释完整经过。',
    description:
      '校园「回声墙」上，一段 19 秒的录音冲上热搜第七位。转发的人说自己只是随手一转，平台说自己只是让信息流动。当事人关掉了手机。',
    playable: false,
    demoLabel: '演示片段 · 完整三幕未实装',
    duration: '演示 8–10 分钟',
    playerRange: '4–6 人',
    accent: 'ink',
    initialStats: { tension: 55, trust: 35, openness: 30, safety: 45 },
    characters: CHARACTERS_C,
    acts: ACTS_C,
    endings: ENDINGS_C,
    clueBank: CLUES_C,
  },
  {
    id: 'raise-hand',
    slot: 'E-05',
    title: '无人举手',
    en: 'NO ONE RAISED A HAND',
    type: '五幕教育剧',
    themes: ['旁观者', '五种伤害驱动', '身份与回声', '论坛戏剧'],
    logline: '转学生顾屿用五种方式让五名同学各自经历一次被伤害；公审那天，他们才发现他是谁。',
    description:
      '五幕镜像结构。每一幕有一名当事人和四名旁观者；每一次介入、沉默或附和都会被记录，并在最后一幕回到所有人身上。',
    playable: true,
    duration: '90–120 分钟',
    playerRange: '5–6 人',
    accent: 'ink',
    initialStats: { tension: 46, trust: 40, openness: 30, safety: 48 },
    characters: CHARACTERS_RAISE,
    acts: ACTS_RAISE,
    endings: ENDINGS_RAISE,
    clueBank: CLUES_RAISE,
  },
]

/** Custom edits committed at the start of a run take precedence over built-ins. */
export function getStory(id: string | null | undefined): Story | undefined {
  return getCustomStory(id) ?? getGeneratedStory(id) ?? STORIES.find((s) => s.id === id)
}

/** Built-in archives plus locally generated ones, in archive order. */
export function allStories(): Story[] {
  return [...STORIES, ...listGeneratedStories()]
}

export const STORY_BY_SLOT = Object.fromEntries(STORIES.map((s) => [s.slot, s]))
