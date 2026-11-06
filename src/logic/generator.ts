import type { Act, Choice, Story } from '../types'

const TITLES: Record<string, string[]> = {
  class: ['名单之外的人', '一间空掉的教室', '被删掉的十分钟', '没有署名的道歉'],
  scapegoat: ['第十八份责任书', '停摆的第二夜', '工坊门口的沉默', '谁替谁签字'],
  'echo-trial': ['转发之后', '热搜降下来的那天', '十九秒之外', '没有原声的道歉'],
}

const MOTIFS: Record<string, [string, string, string]> = {
  class: ['名单', '公告栏', '群聊'],
  scapegoat: ['责任书', '钟楼', '工坊'],
  'echo-trial': ['录音', '回声墙', '转发链'],
}

const SCENES: Record<string, string[]> = {
  class: ['教室 · 后排 · 放学后', '走廊尽头 · 公告栏前', '活动室 · 半开的门'],
  scapegoat: ['工坊 · 深夜的灯', '钟楼底下 · 起雾的清晨', '镇公所 · 长椅'],
  'echo-trial': ['宿舍 · 熄灯前', '回声墙 · 走廊屏幕', '操场边 · 没有信号的地方'],
}

const TIMES: Record<string, string[]> = {
  class: ['第二天 · 午休', '第三天 · 放学后', '评选前一晚'],
  scapegoat: ['故障后第二夜', '清晨 · 雾还没散', '第十七份责任书之后'],
  'echo-trial': ['热搜第七位之后', '第二天 · 凌晨', '传播的第三天'],
}

interface ChoiceSeed {
  id: string
  title: string
  intent: string
  description: string
  effects: Choice['effects']
  flags: string[]
  feedback: string
  observerLine: string
  printBody: string[]
}

function buildChoices(story: Story, motif: [string, string, string], theme: string): Choice[] {
  const protagonist = story.characters[1] ?? story.characters[0]
  const clue = story.clueBank[0]
  const seeds: ChoiceSeed[] = [
    {
      id: 'gen-open',
      title: `把${motif[0]}摊开说清楚`,
      intent: '让所有人看到同一份信息',
      description: `在${motif[1]}前，请当事人先决定哪些内容可以被公开。公开不是替别人做决定。`,
      effects: { openness: 12, tension: 8, safety: -3, trust: 2 },
      flags: ['open'],
      feedback: `你把${motif[0]}放到桌面上。有人松了一口气，也有人立刻开始解释自己「只是跟着做」。信息变清楚了，但${protagonist?.name ?? '当事人'}的处境并没有自动变安全。`,
      observerLine: '公开会改变谁被看见，也会改变谁被迫解释自己。',
      printBody: [
        `本幕行动：围绕「${theme}」的${motif[0]}被公开核对。`,
        '代价：紧张上升，当事人暴露在更多目光中；需要有人负责后续保护。',
      ],
    },
    {
      id: 'gen-guard',
      title: '先找当事人单独确认',
      intent: '先保护，再决定公开什么',
      description: '不替对方发言，也不把尚未确认的猜测带进公共讨论。先问一句：你现在需要什么？',
      effects: { safety: 12, trust: 7, openness: -5, tension: -4 },
      flags: ['guard'],
      feedback: `你先关掉了那扇会被所有人看见的门。${protagonist?.name ?? '当事人'}没有立刻回答，但愿意多坐一会儿。你们暂时少了一个「公开表态」的机会，却多了一次真实对话。`,
      observerLine: '保护有时意味着暂时不把信息交给所有人。',
      printBody: [
        `本幕行动：先与当事人私下确认，暂缓公开${motif[0]}。`,
        '代价：信息公开度下降；需要约定什么时候、由谁再说明。',
      ],
    },
    {
      id: 'gen-collective',
      title: '交给全班一起决定',
      intent: '让集体承担选择',
      description: '把选项写在黑板上，每个人匿名写下一个优先顺序。不点名，不逼人表态。',
      effects: { trust: 5, openness: 6, tension: 2, safety: -2 },
      flags: ['open'],
      feedback: `匿名纸条被一张张摊开。没有人被直接点名，但那些空白纸条本身也说明了一些事。集体开始承担选择的重量，只是这个重量还没有落到具体的人身上。`,
      observerLine: '集体决定不会自动保护少数人，除非有人明确负责。',
      printBody: [
        `本幕行动：${motif[0]}的处理方式交由全班匿名决定。`,
        '代价：责任被分散；需要明确后续由谁跟进。',
      ],
    },
  ]

  return seeds.map((seed, i) => ({
    id: seed.id,
    title: seed.title,
    intent: seed.intent,
    description: seed.description,
    effects: seed.effects,
    flags: seed.flags,
    feedback: seed.feedback,
    observerLine: seed.observerLine,
    clueId: i === 0 ? clue?.id : undefined,
    printBody: seed.printBody,
  }))
}

/**
 * Local template generation. It stitches the selected theme, the previous act,
 * and the story's own characters/motifs — there is no model call behind it.
 */
export function generateActDraft(story: Story, options: { theme: string; previousTitle?: string }): Act {
  const priorNo = story.acts.length
  const no = priorNo + 1
  const theme = options.theme.trim() || story.themes[0] || '同伴关系'
  const titles = TITLES[story.id] ?? TITLES.class
  const motif = MOTIFS[story.id] ?? MOTIFS.class
  const scenes = SCENES[story.id] ?? SCENES.class
  const times = TIMES[story.id] ?? TIMES.class
  const title = titles[priorNo % titles.length]
  const scene = scenes[priorNo % scenes.length]
  const time = times[priorNo % times.length]
  const protagonist = story.characters[0]
  const previousTitle = options.previousTitle?.trim()

  return {
    id: `gen-${story.id}-${no}-${Date.now().toString(36)}`,
    no,
    code: `${story.slot}-G${no}`,
    title,
    en: `GENERATED ACT ${String(no).padStart(2, '0')}`,
    scene,
    time,
    setting: `${scene} / 主题：${theme}`,
    narration: [
      previousTitle
        ? `上一幕「${previousTitle}」留下的问题没有消失，只是换了一个更安静的地方继续。`
        : '事情没有因为换了一天就结束，只是换了一个更安静的地方继续。',
      `${protagonist?.name ?? '有人'}在${scene.split(' · ')[0]}停下来。${theme}不再是一个抽象的词，它具体到一份${motif[0]}、一句没有说完的话、一个没有回复的对话框。`,
      '你们只有一次机会决定先做什么。不是「做对的事」，而是先做哪一件。',
    ],
    task: `用一句话说明：这个行动最先保护了谁，又让谁承担代价。讨论时不要替别人说出私人信息。`,
    question: `在${motif[1]}前，你们准备先做哪一件事？`,
    baseClueIds: [],
    choices: buildChoices(story, motif, theme),
    closing: `这一幕没有解决所有问题，但留下了一个可以继续追问的痕迹。下一幕开始前，请先确认：有没有人需要暂停？`,
  }
}

export function generationNotes(): string[] {
  return [
    '本地模板生成：按故事主题、上一幕标题与角色库拼装，未连接任何大模型。',
    '生成结果只是草稿。请逐段改写，使其符合你们的班级语境与安全边界。',
  ]
}
