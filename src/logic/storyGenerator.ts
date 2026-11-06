import type { Act, Character, Choice, Clue, Ending, Stats, Story } from '../types'
import { nextGeneratedSlot } from './generatedStories'

const ART = '/assets/yinian'

/* ------------------------------------------------------------------ */
/* presets                                                             */
/* ------------------------------------------------------------------ */

export type PlaceId =
  | 'classroom'
  | 'corridor'
  | 'library'
  | 'equipment'
  | 'online'
  | 'gate'
  | 'village'
  | 'town'
  | 'arcade'

export interface PlacePreset {
  id: PlaceId
  label: string
  en: string
  group: string
  name: string
  cue: string
  scene: string
  opening: string
  secondLine: string
  thirdLine: string
  fourthLine: string
  deadline: string
  surface: string
  evidenceLabel: string
  evidenceDetail: string
  secondEvidenceLabel: string
  secondEvidenceDetail: string
  supportChannel: string
  blurb: string
}

export const PLACES: PlacePreset[] = [
  {
    id: 'classroom',
    label: '教室',
    en: 'CLASSROOM',
    group: '教室',
    name: '午后的教室',
    cue: '第三排',
    scene: `${ART}/scenes/classroom.webp`,
    opening: '午休后的教室还没有完全安静下来。第三排靠窗的桌面被擦得很干净，像有人提前收拾过。',
    secondLine: '教室后面的公告板换了新的分组表，旧的一张被折起来塞在垃圾桶边缘。',
    thirdLine: '上课铃还没响。有人把椅子挪开，给中间空出一小块地方。',
    fourthLine: '一周后，同一间教室的座位表又被重新排了一次。',
    deadline: '下一节课上课前',
    surface: '后墙公告板',
    evidenceLabel: '座位表',
    evidenceDetail:
      '座位表上有一处用铅笔改过的痕迹，日期是事情发生的前一天。它能说明座位被调整过，不能说明是谁、为什么调整。',
    secondEvidenceLabel: '被收回的纸条',
    secondEvidenceDetail: '纸条上只有半句话，另一半被撕掉了。它可能和这件事有关，也可能只是另一件事的碎片。',
    supportChannel: '班主任和心理老师',
    blurb: '同一间教室，同一张名单，但位置悄悄变了。',
  },
  {
    id: 'corridor',
    label: '走廊',
    en: 'CORRIDOR',
    group: '走廊',
    name: '课间的走廊',
    cue: '走廊尽头',
    scene: `${ART}/scenes/corridor.webp`,
    opening: '课间的走廊总是很吵。可今天，靠近尽头的那一小段突然安静下来，像有人刚刚走开。',
    secondLine: '走廊的值日表被重新贴过，边缘还留着一圈旧胶带的印子。',
    thirdLine: '上课铃响过一遍，走廊里只剩下几个人的脚步声。',
    fourthLine: '一周后，同一条走廊恢复了原来的声音，但值日表又少了一个名字。',
    deadline: '放学前',
    surface: '走廊公告栏',
    evidenceLabel: '值日表',
    evidenceDetail: '值日表上有一行被划掉，又用另一种笔迹写回去。笔迹不同，但无法确认是谁改的。',
    secondEvidenceLabel: '储物柜上的便条',
    secondEvidenceDetail: '便条被折过两次，上面只写了一个时间。它指向一个具体时刻，但不解释那个时刻发生了什么。',
    supportChannel: '年级辅导员和班主任',
    blurb: '课间十分钟，一段突然安静下来的走廊。',
  },
  {
    id: 'library',
    label: '图书馆',
    en: 'LIBRARY',
    group: '图书馆',
    name: '放学后的图书馆',
    cue: '借阅卡背面',
    scene: `${ART}/scenes/library.webp`,
    opening: '放学后的图书馆只剩下翻页声。靠窗的位置空着，桌上放着一本没有被放回原处的书。',
    secondLine: '借阅记录显示，那本书在事情发生前被借出过两次，归还时间都比登记时间晚。',
    thirdLine: '管理员把归还的书一本本放回架上，动作比平时慢。',
    fourthLine: '一周后，那本书回到了原来的位置，借阅卡背面多了一行很小的字。',
    deadline: '闭馆前',
    surface: '还书台旁的软木板',
    evidenceLabel: '借阅记录',
    evidenceDetail: '借阅记录能说明书在什么时候离开、什么时候回来，不能说明书里夹过什么、被谁看过。',
    secondEvidenceLabel: '夹在书里的便签',
    secondEvidenceDetail: '便签上是一个名字和一句没写完的话。名字不属于这本书的任何一位借阅者。',
    supportChannel: '图书馆管理员和心理老师',
    blurb: '一本被放错位置的书，两个没有登记的时间。',
  },
  {
    id: 'equipment',
    label: '器材室',
    en: 'EQUIPMENT ROOM',
    group: '器材室',
    name: '器材室门口',
    cue: '器材室',
    scene: `${ART}/scenes/equipment-room.webp`,
    opening: '器材室的门虚掩着。借还登记本摊在门口的小桌上，最后一行的墨迹还没有干透。',
    secondLine: '登记本上多了一行不完整的记录，时间被写错，名字的位置空着。',
    thirdLine: '管理员开始清点器材，一件一件地念出编号。',
    fourthLine: '一周后，登记本换了新的一页，旧的一页被钉在柜门内侧。',
    deadline: '社团活动开始前',
    surface: '器材柜门',
    evidenceLabel: '借还登记本',
    evidenceDetail: '登记本能说明器材何时借出、何时归还，不能说明借用期间发生了什么。',
    secondEvidenceLabel: '没有归还的钥匙',
    secondEvidenceDetail: '钥匙还挂在原来的位置，但钥匙牌上的编号和登记本对不上。',
    supportChannel: '器材管理员和班主任',
    blurb: '借出与归还之间，少了一段没人愿意填的时间。',
  },
  {
    id: 'online',
    label: '网络空间',
    en: 'NETWORK',
    group: '班级群聊',
    name: '班级群聊',
    cue: '群里',
    scene: `${ART}/scenes/classroom.webp`,
    opening: '晚自习结束后，班级群突然热闹起来。有人发了一张截图，又在两分钟后撤回。',
    secondLine: '截图已经被保存下来，转发到了另一个没有老师的小群。',
    thirdLine: '群里安静了一阵，然后有人发了一句「所以到底是谁」。',
    fourthLine: '一周后，群里的消息已经翻不到那一天的记录，但有人仍然保存着截图。',
    deadline: '明天早上之前',
    surface: '班级群公告',
    evidenceLabel: '群聊截图',
    evidenceDetail: '截图能说明某条消息曾经出现过，不能说明它为什么被发出、后来为什么被撤回。',
    secondEvidenceLabel: '撤回提示',
    secondEvidenceDetail: '撤回提示只留下一个时间点。被撤回的内容已经看不到，但可能已经被别人保存。',
    supportChannel: '班主任和信息老师',
    blurb: '一条撤回的消息，在屏幕之外继续生长。',
  },
  {
    id: 'gate',
    label: '校门口',
    en: 'SCHOOL GATE',
    group: '校门口',
    name: '放学后的校门口',
    cue: '校门口',
    scene: `${ART}/scenes/corridor.webp`,
    opening: '放学铃响过很久，校门口的人群已经散得差不多。有一个人还站在原来的位置，没有往前走。',
    secondLine: '门禁记录显示，那天有几个人在放学后二十分钟才离开，其中一个人没有刷卡。',
    thirdLine: '天开始暗下来，保安把门口的路灯打开。',
    fourthLine: '一周后，同一个时间，校门口又出现了几个没有立刻离开的人。',
    deadline: '天黑之前',
    surface: '门卫室窗口',
    evidenceLabel: '门禁记录',
    evidenceDetail: '门禁记录能说明谁在什么时候离开，不能说明他们在校门内停留时发生了什么。',
    secondEvidenceLabel: '手机里的短视频',
    secondEvidenceDetail: '视频只有几秒，没有拍到开始和结束。它提供了一部分画面，也可能遗漏了最重要的上下文。',
    supportChannel: '班主任和学校心理老师',
    blurb: '放学后的十分钟，有人没有像往常一样离开。',
  },
  {
    id: 'village',
    label: '山谷村落',
    en: 'VALLEY VILLAGE',
    group: '山谷村落',
    name: '山谷里的村落',
    cue: '村口',
    scene: `${ART}/scenes/village.webp`,
    opening: '研学营解散后的山谷还没有完全安静。村口的小卖部亮着灯，几辆自行车横在路边，车筐里放着没人认领的外套。',
    secondLine: '村里的活动室刚借给研学小组用过，桌上的借用登记本还摊开着，最后一页被撕掉了一角。',
    thirdLine: '天色暗下来，有人提议先在村口把话说清楚，再各自回住处。',
    fourthLine: '一周后，村口重新摆好了长凳，但那本借用登记本已经没有原来的第一页。',
    deadline: '天黑之前',
    surface: '村口小卖部的窗台',
    evidenceLabel: '活动室借用登记',
    evidenceDetail: '登记本能说明谁在什么时候借过钥匙，不能说明借走的那段时间里发生了什么。',
    secondEvidenceLabel: '没人认领的外套',
    secondEvidenceDetail: '外套口袋里有一张折过的车票和半包糖。它们能说明有人来过，不能说明这个人为什么留下东西。',
    supportChannel: '带队老师和村里的大学生志愿者',
    blurb: '研学营地解散前，村口多了一件没人认领的东西。',
  },
  {
    id: 'town',
    label: '城堡小镇',
    en: 'OLD TOWN',
    group: '城堡小镇',
    name: '节庆前的城堡小镇',
    cue: '钟楼下',
    scene: `${ART}/scenes/town.webp`,
    opening: '节庆彩排结束后，小镇的石板路还留着水痕。钟楼下的海报被风吹起一角，露出底下另一张更早的名单。',
    secondLine: '镇上的公告栏里，志愿者的排班表被重新抄过一遍，有一个名字被贴纸盖住。',
    thirdLine: '店铺陆续打烊，只有拱门边的灯还亮着。',
    fourthLine: '一周后，节庆照常举行，但排班表上少了一个人，也没有人解释原因。',
    deadline: '节庆彩排结束前',
    surface: '钟楼下的公告栏',
    evidenceLabel: '志愿者排班表',
    evidenceDetail: '排班表能说明谁被安排在什么时间，不能说明被贴纸盖住的那个名字为什么消失。',
    secondEvidenceLabel: '被贴纸盖住的名字',
    secondEvidenceDetail: '贴纸底下还能摸到一点钢笔的凹痕。它证明这里曾写过字，但不能证明是谁的字。',
    supportChannel: '带队老师和镇文化站工作人员',
    blurb: '节庆前的排班表上，有一个名字被贴纸盖住。',
  },
  {
    id: 'arcade',
    label: '旧市场拱廊',
    en: 'ARCADE MARKET',
    group: '旧市场拱廊',
    name: '收摊前的旧市场拱廊',
    cue: '拱廊转角',
    scene: `${ART}/scenes/arcade.webp`,
    opening: '旧市场收摊前的拱廊里堆着纸箱。有人在转角停住，像是在等一个人，又像是在躲开一群人。',
    secondLine: '市场管理处的意见本被翻开，夹在里面的收据少了一张。',
    thirdLine: '卷帘门一扇接一扇落下，拱廊里的回声变得很清楚。',
    fourthLine: '一周后，同样的时间，拱廊转角多了一张空着的小桌。',
    deadline: '收摊之前',
    surface: '市场管理处的窗口',
    evidenceLabel: '摊位意见本',
    evidenceDetail: '意见本能说明谁在什么时候留下了话，不能说明写下这些话时旁边还有谁。',
    secondEvidenceLabel: '少了一张的收据',
    secondEvidenceDetail: '收据的编号是连续的，中间缺了一页。它能说明有东西被取走，不能说明是谁取走的。',
    supportChannel: '带队老师和市场管理员',
    blurb: '收摊前的拱廊，有人停在转角不肯往前走。',
  },
]

export type ThemeId = 'exclusion' | 'rumor' | 'blame' | 'family' | 'identity' | 'online'

export interface StoryBeat {
  event: string
  detail: string
  trace: string
  dm: string
  summary: string
}

export interface ThemePreset {
  id: ThemeId
  label: string
  en: string
  title: string
  accent: 'red' | 'brass' | 'ink'
  chips: [string, string]
  blurb: string
  leadTrait: string
  suspectLine: string
  leadQuote: string
  leadAsk: string
  openOutcome: string
  guardOutcome: string
  openAfter: string
  guardAfter: string
  evidence: { title: string; summary: string; detail: string }
  witness: { summary: string; detail: string }
  reflection: [string, string, string]
  beats: [StoryBeat, StoryBeat, StoryBeat, StoryBeat]
}

export const THEMES: ThemePreset[] = [
  {
    id: 'exclusion',
    label: '同伴排斥',
    en: 'EXCLUSION',
    title: '不在名单上的人',
    accent: 'red',
    chips: ['群体认同', '被忽略的情绪'],
    blurb: '没有人觉得自己在排除别人，但同一个位置总是空着。',
    leadTrait: '被排除过几次之后，学会了先替别人找理由。',
    suspectLine: '他确实说过一句不太友善的话，但那不是这次的全部。',
    leadQuote: '「我不想每次都最后一个知道。」',
    leadAsk: '「我想参加，但不想让全班先讨论我。」',
    openOutcome: '你们确认了遗漏确实发生过，也让 {a} 参与决定下一步。相关记录会被重新核对，通知流程也开始有人负责。',
    guardOutcome: '你们没有在班里公开材料，{a} 暂时不用再次解释自己。原来的流程仍然留在原处，等待下一次核对。',
    openAfter: '周一，新的{evidence}被贴回 {surface}；{a} 在 {time} 走进 {place} 时，先看了一眼，然后才放下书包。',
    guardAfter: '旧的{evidence}仍然留在 {surface} 后面；{a} 不再被当众追问，但每天仍然提前十分钟到。',
    evidence: {
      title: '被改动的记录',
      summary: '同一份记录出现了两个版本，{a} 的部分只出现在较早的那一版里。',
      detail:
        '两个版本的格式一致，改动集中在同一处。它能证明记录发生变化，不能证明是谁改的、为什么改。',
    },
    witness: {
      summary: '{c} 记得记录里少了一个人。',
      detail:
        '{c} 看见了空出来的位置，但以为 {a} 不想参加。现在回想起来，{c} 说不清当时为什么没有问。',
    },
    reflection: [
      '「照顾大家的感受」和「让当事人被听见」冲突时，你们先做哪一个？',
      '如果 {a} 说「算了，不用管」，你们还会继续吗？',
      '一个没有人觉得自己在排除别人的记录，是怎么一次次漏掉同一个人的？',
    ],
    beats: [
      {
        event:
          '{a} 在 {place} 站了将近一分钟，把 {object} 看了两遍，没有问旁边的人。{c} 在两米外整理作业本，抬头看了一眼，又低下头。',
        detail: '{b} 把 {a} 的书包从地上捡起来，放到椅背上；{a} 说「我自己来」，但没有伸手。',
        trace: '{c} 的练习本那一页写了又划掉，只剩一道很深的笔痕；{evidence} 被翻到有问题的那一处，没有再合上。',
        dm: '现在能确认的是：{a} 已经看见 {object} 上的变化，{c} 当时在场，但还没有人问过 {a} 想怎么处理。你们先查是谁改的，还是先问 {a}？',
        summary: '{a} 独自看完 {object}，{c} 看见了却没有开口。',
      },
      {
        event:
          '第二天午休，有人把{object}的照片转进班级群，配文是「人够了」。{a} 被拉进群，三分钟后又被移出。{c} 在群里发了一个「？」，两分钟后撤回。',
        detail:
          '{b} 把截图保存下来，单独发给 {a}，附了一句：「你看完告诉我，要不要我陪你去找老师。」{a} 只回了一个「嗯」。',
        trace: '群成员列表里，{a} 的头像出现过三分钟；{c} 撤回「？」之后，只剩一条「你撤回了一条消息」。',
        dm: '那张照片已经出了班级群，{a} 被拉进来又被移出。{c} 说「我不知道是谁移的」。现在要决定的是：先追查移人的人，还是先让 {a} 知道群里发生了什么？',
        summary: '{a} 被拉进群三分钟后移出，照片继续传播。',
      },
      {
        event:
          '第三天的班会要重新分组。分组表贴出来时，{a} 的名字在最后一组的最后一行。{d} 站起来说：「不是我改的。」{c} 低头翻书，没有看 {a}。',
        detail: '{e} 在分组表背面写下「{a} 未表态」，没有写「{a} 同意」。',
        trace: '分组表右下角有一个新订书钉；{evidence} 的第二页被抽走，只剩下两个装订孔。',
        dm: '分组表已经贴出来，{a} 还没有说自己想不想换组。{d} 说不是他改的，{c} 没有补充。你们要让 {a} 自己选，还是替 {a} 要求重贴？',
        summary: '分组表把 {a} 排在最后一行，{d} 当众否认。',
      },
      {
        event:
          '一周后，新的分组表上有了 {a} 的名字，但旧表的照片还留在群文件里。{a} 每天提前十分钟到 {place}，把书包放在靠门的位置。',
        detail: '{b} 每天在楼梯口等 {a}，两个人一起走，但都不提分组表的事。',
        trace: '旧表的下载次数是 7；新表的纸角被人折过，折痕对着 {a} 的座位。',
        dm: '新表补上了名字，旧照片也没有被删掉。{a} 仍然提前到校。你们认为这件事结束了吗？你们的判断依据是什么？',
        summary: '新表补上名字，旧照片仍在群里，{a} 提前到校。',
      },
    ],
  },
  {
    id: 'rumor',
    label: '流言与误解',
    en: 'RUMOR',
    title: '被剪掉的那一句',
    accent: 'red',
    chips: ['信息传播', '信任'],
    blurb: '一段离开上下文的话，比原来更确定，也更容易被记住。',
    leadTrait: '知道解释得越多，越容易被剪成更短的版本。',
    suspectLine: '他被当成消息的源头，但他也只是转发链上的一环。',
    leadQuote: '「那句话是我说的，但不是那个意思。」',
    leadAsk: '「我想把完整的部分说清楚，但不想被所有人围观。」',
    openOutcome: '你们把完整的时间和上下文放回消息旁边，也承认仍有部分内容无法确认。{a} 的解释第一次没有被剪短。',
    guardOutcome: '你们没有继续转发，也没有把完整材料放进群里。{a} 暂时不用面对新的猜测，但误解也没有被真正拆开。',
    openAfter: '完整版本被放回 {a} 的同意范围里；{surface} 上多了一行说明：「转发前先问原话。」',
    guardAfter: '短版本从群里消失，但完整版本仍留在 {a} 的手机里；{a} 没有再提这件事。',
    evidence: {
      title: '被转发的片段',
      summary: '一份缺少上下文的截图被转发进新的群，配文是「你们看这是不是有问题」。',
      detail:
        '片段本身无法说明完整经过。转发记录能证明传播路径，不能证明发布者的全部动机。',
    },
    witness: {
      summary: '{c} 在群里看到了那一份，没有回复。',
      detail: '{c} 记得自己当时觉得「应该不是这个意思」，但没有把握，所以什么也没说。',
    },
    reflection: [
      '完整解释和传播速度之间，你们更愿意守住哪一个？',
      '如果公开完整材料会让更多人围观当事人，你们还会公开吗？',
      '「我只是转发」在这条路径里造成了什么？',
    ],
    beats: [
      {
        event:
          '周三 {time}，{c} 在 {place} 把手机递到 {d} 面前：「你看，这是 {a} 的。」屏幕上是一张被裁过一半的截图。{a} 从旁边经过，停了一下，没有解释。',
        detail:
          '{b} 把 {a} 拉到一边，问：「要不要把完整的部分拿出来？」{a} 说：「不用，越解释越像真的。」',
        trace: '完整版本还在 {a} 的手机里；传出去的那一份只有一半，文件名被改成「别外传」。',
        dm: '传出去的那一份确实和 {a} 有关，但它只是裁过的截图，完整版本还在 {a} 手机里。截图之外还有什么、是谁第一次转发的，现在都不知道。你们先找完整版本，还是先让 {c} 停止转发？',
        summary: '被裁过的截图被拿给 {d} 看，{a} 看见了却没有解释。',
      },
      {
        event:
          '第二天，那张截图出现在没有老师的群里，标题从「你看」变成「{a} 的事，大家都来看看」。{b} 找到完整版本发给 {c}，{c} 看完后说：「那也不能改变这件事发生过。」',
        detail:
          '{d} 把自己的手机递到小组中间，说：「要看就看完整的，别只看截的那一段。」没有人接。',
        trace: '转发记录上有三个时间：第一次转发、七分钟后、十八分钟后；每转一次，文件名就少一个字。',
        dm: '完整版本已经找到，但群里的截图没有更新。{c} 说「那也不能改变这件事发生过」——这句话也是事实。你们要公开完整版本，还是只向被影响的人说明？',
        summary: '完整版本被发现，短版本仍在传播。',
      },
      {
        event:
          '第三天的午休，{d} 在班里说：「我看过完整的，事情不是截图里那样。」有人让 {d} 把完整的拿出来，{d} 把手机握在手里，没有解锁。{a} 坐在窗边，没有抬头。',
        detail: '{e} 在记录上写：「完整版本已找到，公开与否未决定。」没有写「{a} 拒绝」。',
        trace: '{a} 的手机屏幕朝下，通知亮了四次；{evidence2} 上写着第二次转发的时间。',
        dm: '完整版本现在不止一个人有，但没有人公开。{a} 没有说要不要公开。你们可以替 {a} 决定，也可以先问 {a}。这两件事的后果不同。',
        summary: '完整版本被提到，但没有人公开；{a} 没有表态。',
      },
      {
        event:
          '一周后，群里搜不到那张截图了，但 {a} 把群设成了免打扰。{b} 在 {place} 听见有人拿那张截图开玩笑，笑的人里有两个转过那条。',
        detail: '{a} 没有要求任何人道歉，只把手机里完整版本的文件名改成了日期。',
        trace: '群文件里只剩一个空文件夹，名字还是「别外传」；{a} 的聊天记录停在第二次转发的时间。',
        dm: '截图被删掉了，这件事还在被当成玩笑。{a} 没有要求任何人道歉。你们要怎样判断这件事有没有结束？',
        summary: '原截图被删，这件事变成了玩笑。',
      },
    ],
  },
  {
    id: 'blame',
    label: '责任分摊',
    en: 'BLAME',
    title: '谁来签这个字',
    accent: 'brass',
    chips: ['责任分摊', '群体归责'],
    blurb: '找不到具体的人时，惯例会自动找出一个最方便承担的人。',
    leadTrait: '习惯把责任先揽到自己身上，哪怕这次并不全是自己的问题。',
    suspectLine: '所有人都在看他，因为上次出事时，也是他签的字。',
    leadQuote: '「这次不是我，但我说了可能也没人信。」',
    leadAsk: '「我想把事实说清楚，但不想再替所有人道歉。」',
    openOutcome: '你们把每个人实际做过的事分开写下来，责任不再被推给一个人。{a} 第一次听见有人说：「这次需要我们几个人一起处理。」',
    guardOutcome: '你们把材料收了起来，没有继续追着问谁该签。{a} 暂时不用承担不属于自己的那部分，但惯例仍然留在原处。',
    openAfter: '新的双人确认流程开始执行；{d} 第一次在 {time} 经过 {place} 时，停了一下，但没有绕开。',
    guardAfter: '责任书被收进档案袋，签字栏仍然空着；{d} 不再被叫住，但也不再主动经过 {place}。',
    evidence: {
      title: '空白的责任书',
      summary: '责任书的签字栏空着，之前的每一份都由同一个人签。',
      detail: '惯例不能说明这一次是谁造成的，只能说明过去是谁承担了后果。',
    },
    witness: {
      summary: '{c} 承认自己当时可以把表格往上传。',
      detail: '{c} 说：「大家都默认他会签，我就没有多想。」他没有为自己辩解，也没有把责任推回去。',
    },
    reflection: [
      '让一个人反复承担，是不是也是一种「方便」？',
      '如果没有人愿意签字，问题会停下来，还是会被推给更弱的一方？',
      '你们怎么区分「承担后果」和「被当成替罪者」？',
    ],
    beats: [
      {
        event:
          '周三 {time}，{object}上的变化被问到第二遍，没有人认领。{d} 被叫住，因为前三次类似的事都是他签的字。{d} 站起来时把椅子带倒了，第一句话是：「这次不是我。」',
        detail:
          '{b} 把倒下的椅子扶起来，放到 {d} 桌边；{c} 看着 {evidence}，先说「我没看清」，又补了一句：「{before} 我经过门口。」',
        trace: '{evidence} 被放在责任书旁边，签字栏空着，一支拧开的笔搁在纸边；前三次的记录里，签名都是 {d}。',
        dm: '这次的事还没有人认，签字栏空着。前三次都是 {d} 签的，所以大家先看向他。这两件事都是真的，但「以前是他」不能证明「这次是他」。你们先查记录，还是先听 {d} 说完？',
        summary: '{evidence} 少了一条记录，{d} 被默认要签字。',
      },
      {
        event:
          '第二天，{evidence2} 被找到，上面写着时间 {before}，后面没有别的记录。{c} 说：「我看见 {d} 在门口，但没看清他在做什么。」{d} 把聊天记录翻到最前面，说：「你们要证据，我可以现在就翻。」',
        detail: '{e} 把 {before} 和 {time} 两个时间并排写下，中间画了一条线，标着「三分钟，未知」。',
        trace: '{evidence2}背面写着 {before}，墨迹比其他字新；钥匙牌上的编号和登记本差了一位。',
        dm: '现在有两个时间点：{before} 有人经过、{time} 发现{object}有了变化。{c} 看见 {d} 在门口，但没有看清他在做什么。{d} 愿意翻记录。你们先核对记录，还是先问 {c} 看到了什么？',
        summary: '出现 {before} 的记录，{c} 说看见 {d} 在门口。',
      },
      {
        event:
          '第三天的午休，班主任把责任书放在桌上，说：「谁做的，自己站出来，这件事就到这里。」没有人动。{d} 的手撑在桌沿上，{c} 低头翻书，{a} 看着窗外。',
        detail: '{b} 说：「如果没人承认，能不能先查谁最后用过？」班主任没有回答，只把笔往前推了推。',
        trace: '责任书的签字栏旁边多了一行小字：「本次由使用人共同承担。」是班主任的笔迹。',
        dm: '责任书要求一个人签字，但这次的事不是一个人做的。{d} 没有站起来，{c} 没有补充，{a} 也没有说话。你们要让谁签？还是改规则？',
        summary: '责任书要求一个人签字，没有人站出来。',
      },
      {
        event:
          '一周后，{place}换了新的登记流程：每次登记要两个人确认。{d} 的名字不再出现在第一行，但 {c} 说，{d} 现在每次经过 {place} 都会绕开那个门口。',
        detail: '{e} 在新流程表下面写：「双人确认，第一行仍空着。」',
        trace: '新流程表贴在柜门内侧，第一行的两个签名栏都空着；旧的登记本被钉在下面，{d} 的名字还在上面。',
        dm: '流程改了，但 {d} 开始绕开 {place}。规则变化有没有让 {d} 更安全？你们用什么来判断？',
        summary: '登记流程改为双人确认，{d} 仍绕开那个门口。',
      },
    ],
  },
  {
    id: 'family',
    label: '家庭期待',
    en: 'EXPECTATION',
    title: '没寄出的那封信',
    accent: 'ink',
    chips: ['期待', '沟通'],
    blurb: '有些压力不以争吵出现，它们只是让一个人越来越安静。',
    leadTrait: '在「让家里放心」和「让自己好受一点」之间，已经选了太多次前者。',
    suspectLine: '他被认为是最不需要被担心的那个，所以也没人问过他想要什么。',
    leadQuote: '「我怕说出来，他们会觉得我不懂事。」',
    leadAsk: '「我想先自己决定要不要告诉家里。」',
    openOutcome: '你们没有替 {a} 联系家里，也没有把信的内容说出去。{a} 自己决定先和谁谈，什么时候谈。',
    guardOutcome: '你们把信放回原处，决定不追问。{a} 暂时保住了一个不会被家里知道的秘密，但也没有得到更多支持。',
    openAfter: '{a} 自己决定先和 {support} 谈一次，没有让家里立刻知道；信被留在了 {a} 的书包里。',
    guardAfter: '信仍留在 {a} 的书包里；{a} 没有再提，但也没有把折痕抚平。',
    evidence: {
      title: '折起来的信',
      summary: '一封没有寄出的信被夹在作业本里，收件人一栏是空的。',
      detail: '信的内容属于当事人本人。看到它不等于有权替当事人决定如何处理。',
    },
    witness: {
      summary: '{c} 注意到 {a} 最近总是一个人留下来。',
      detail: '{c} 以为 {a} 只是喜欢安静。现在想起来，{c} 记得 {a} 收拾书包的动作越来越慢。',
    },
    reflection: [
      '关心一个人，和替一个人决定，边界在哪里？',
      '如果家里确实需要知道，谁来判断、什么时候说？',
      '「不想让家里担心」会不会让别人更难提供帮助？',
    ],
    beats: [
      {
        event:
          '周三 {time}，{a} 被问到{object}上的变化时，先看了一眼手机，说：「我家里会问。」然后把{object}收进课本，没有再看。{c} 看见了，没有追问。',
        detail: '{b} 把椅子往 {a} 那边挪了半格，说：「你可以先不说，但别一个人扛着。」{a} 没有回答，只把手机翻过去扣在桌上。',
        trace: '手机屏幕亮了两次，来电显示是「家」，{a} 都没有接；{evidence} 的边缘被握出了一道折痕。',
        dm: '能确认的是：{a} 没有否认{object}上的变化，但先想到的是「家里会问」。现在还不知道 {a} 在担心什么。你们要先问 {a} 愿不愿意说，还是先把{object}的事处理完？',
        summary: '{a} 回避了{object}的事，只说「家里会问」。',
      },
      {
        event:
          '第二天，{a} 没有来上课。班主任说家里请了假，但没有说原因。{b} 在 {place} 找到 {a} 的作业本，里面夹着一封没有寄出的信，最后一页写着：「如果我考不好，他们会不会后悔让我转学？」',
        detail: '{e} 把这句话原样抄在记录上，没有加「压力很大」之类的判断。',
        trace: '作业本最后一页被撕掉过一半，剩下的字压在装订线里；{evidence2} 上有一个 {before} 的未接来电记录，备注是「家」。',
        dm: '{a} 请假了，作业本上有一句没写完的话。这句话是 {a} 写的，但没有人知道它是在什么情况下写的。你们要先联系 {a}，还是先问家里？',
        summary: '{a} 请假，作业本上留下一句没写完的话。',
      },
      {
        event:
          '第三天，{a} 回到教室，手腕上有一道新的红印。{a} 说是搬东西蹭的，{c} 看见那道印子的形状，但没有说话。{a} 把袖子往下拉了拉，说：「别告诉我家里。」',
        detail: '{b} 没有追问，只把 {a} 桌上的作业本收好，放进 {a} 的书包。',
        trace: '{a} 的校服袖口有一小片洗不掉的灰；{evidence} 上 {before} 那一栏被画了一个圈。',
        dm: '{a} 说别告诉家里，{c} 看见了但没有说话。现在有两个选择：尊重 {a} 的要求，或者告诉 {support}。这两个选择都可能让 {a} 失去一些信任。你们要怎么决定？',
        summary: '{a} 回到教室，要求不要把这件事告诉家里。',
      },
      {
        event:
          '一周后，{a} 开始每天在楼下多站十分钟再上楼。{b} 问要不要一起走，{a} 说「不用」。{c} 在 {place} 看见 {a} 把信重新折好，放回书包最里面。',
        detail: '{e} 在复查记录上写：「{a} 每天按时到校，未说明原因。」',
        trace: '信还在原来的位置，折痕更深了一层；{a} 的作业本换成了新的，最后一页是空白的。',
        dm: '信没有寄出去，{a} 也没有再提。你们这一周做的事情，有没有让 {a} 多一个可以说的人？还是只是让事情安静下来？',
        summary: '{a} 每天在楼下停留，信仍没有寄出。',
      },
    ],
  },
  {
    id: 'identity',
    label: '自我认同',
    en: 'IDENTITY',
    title: '镜子里的另一个人',
    accent: 'brass',
    chips: ['自我认同', '同伴压力'],
    blurb: '当一个人开始隐藏自己喜欢什么，旁人只看见「最近怪怪的」。',
    leadTrait: '在别人面前有一个版本，在自己面前有另一个版本。',
    suspectLine: '他被说成「变了」，但没人问过是从什么时候开始的。',
    leadQuote: '「我不是不想说，我只是不知道哪个版本才是我。」',
    leadAsk: '「我想自己决定什么时候、跟谁说。」',
    openOutcome: '你们没有要求 {a} 当场解释自己。{a} 只说了愿意说的部分，其余的被留在原处。',
    guardOutcome: '你们没有继续问，也没有把记录上的事说出去。{a} 的日常恢复了原样，但那个问题仍然没有被回答。',
    openAfter: '{a} 在班里说了一次自己想被怎么称呼；{surface} 上原来的通知被换成了新的值日表。',
    guardAfter: '{surface} 上不再有新的动静；{a} 仍然每天低头经过，小镜子也还留在储物柜里。',
    evidence: {
      title: '被擦过的记录',
      summary: '{evidence} 上有一处被反复擦过的痕迹，同一位置出现过两种写法。',
      detail: '它能证明记录被改过，不能证明是谁、为什么改，也不能说明当事人全部的感受。',
    },
    witness: {
      summary: '{c} 记得 {a} 那天在 {surface} 前站了很久才进去。',
      detail: '{c} 当时以为 {a} 只是不想上课。现在想起来，{a} 那几天几乎没有和任何人说话。',
    },
    reflection: [
      '「做自己」是谁的自由，又需要谁的保护？',
      '当一个人不想解释时，支持还可以是什么样子？',
      '玩笑和伤害之间，由谁来判断那条线？',
    ],
    beats: [
      {
        event:
          '周三 {time}，{a} 被问起{object}上的变化时，只说了一句「随便吧」，然后把外套拉链拉到最上面。{c} 从门口经过，看见 {a} 在{surface}前站了一会儿，没有进去。',
        detail: '{b} 把 {a} 桌上被推到地上的笔袋捡起来，放回原处，没有问。',
        trace: '{a} 的储物柜里多了一面小镜子，镜面上有一道裂痕；{evidence} 上 {a} 的名字旁边有一块被反复擦过的痕迹。',
        dm: '{a} 没有解释{object}上的变化，只说了一句「随便吧」。这句话不是答案，但说明 {a} 不想在这里说。你们要先问 {a} 想不想换个地方说，还是先处理{object}？',
        summary: '{a} 只说「随便吧」，没有解释{object}的事。',
      },
      {
        event:
          '第二天，{a} 换了一件从不穿的宽大外套，把帽子戴在头上。{c} 在 {place} 说：「他最近怪怪的。」{d} 接了一句：「是不是那个事？」这句话被 {b} 听见了。',
        detail: '{b} 走过去，把 {a} 的帽子往下按了按，说：「风大。」没有提那句「怪怪的」。',
        trace: '{a} 的储物柜里多了一面小镜子，镜面上有一道裂痕；{evidence2} 上写着 {before}，旁边是 {a} 的名字。',
        dm: '{a} 换了衣服，{c} 说「怪怪的」，{d} 提到了「那个事」。这些都不是事实陈述，但它们正在变成班里的说法。你们要先让这些说法停下来，还是先问 {a} 想怎么被称呼？',
        summary: '{a} 换了装扮，班里开始用「怪怪的」形容他。',
      },
      {
        event:
          '第三天的班会，老师让大家做自我介绍，要说「我是谁」。轮到 {a} 时，{a} 站起来，停了几秒，说：「我叫 {a}。」然后坐下。{c} 小声说：「就这样？」{a} 没有回头。',
        detail: '{e} 在记录上写：「{a} 的自我介绍只有姓名，没有补充。」',
        trace: '{a} 的桌面上用铅笔写了一行很小的字，又被擦掉，只留下纸上的凹痕；{evidence} 上 {time} 那一栏是空的。',
        dm: '{a} 只说了一句「我叫 {a}」。没有人规定自我介绍必须说什么，但 {c} 的反应说明班里有一个默认版本。你们要让 {a} 再说一次吗？还是先检查这个默认版本是怎么形成的？',
        summary: '自我介绍时，{a} 只说了自己的名字。',
      },
      {
        event:
          '一周后，{a} 不再戴帽子，但仍然穿那件宽大的外套。{surface}上换了一张新的通知，{c} 经过时也不再和 {d} 交换眼神。{a} 走过 {surface} 时，还是低头看了一眼地板。',
        detail: '{b} 站在离 {a} 两步远的地方，没有跟上去，也没有走开。',
        trace: '{evidence} 上被反复擦过的那一块比周围浅；{a} 的储物柜里，小镜子还在原来的位置。',
        dm: '没有新的动静，{a} 也恢复了一部分日常。但 {a} 走过 {surface} 时还是会低头。你们认为「不再发生」和「可以自在」是同一件事吗？',
        summary: '没有新的动静，{a} 仍然避开 {surface}。',
      },
    ],
  },
  {
    id: 'online',
    label: '网络传播',
    en: 'VIRAL',
    title: '转发之后',
    accent: 'ink',
    chips: ['网络传播', '羞耻'],
    blurb: '一次转发只需要一秒，让消息真正停下来却需要很多人同时选择不转。',
    leadTrait: '每次手机震动，都会先想是不是又有人转发了那条消息。',
    suspectLine: '他被认为是「最开始发的人」，但他的转发也只是链条中的一次顺手。',
    leadQuote: '「我只发在小组里，没想到会传出去。」',
    leadAsk: '「我想让传播停下来，但不想再看见那些评论。」',
    openOutcome: '你们没有继续转发，也把能确认的事实放回消息旁边。传播没有立刻停止，但至少有人开始问：「原话是什么？」',
    guardOutcome: '你们删掉了手里的版本，也没有再公开讨论。{a} 不用面对新的评论，但消息仍然在别处流动。',
    openAfter: '群里出现了一条完整说明，标明了截图缺失的部分；{a} 第一次自己在群里回复：「那张截图不完整。」',
    guardAfter: '截图被管理员删除，但 {a} 仍然把群设成免打扰；那张截图还在走廊里被提起过一次。',
    evidence: {
      title: '截图与完整记录',
      summary: '一段被裁过的截图和更长的原始记录同时存在，两者意思并不相同。',
      detail: '截图缺少前后文，原始记录也不能证明发布者的全部动机。两者都需要被谨慎对待。',
    },
    witness: {
      summary: '{c} 转发过一次，很快又删掉了。',
      detail: '{c} 说：「我以为只有我们几个人看得到。」删除没有让已经发生的传播消失。',
    },
    reflection: [
      '「只是转发」需要承担多少责任？',
      '停止传播和保护当事人，哪个更难做到？',
      '如果完整记录也会伤害当事人，你们还会公开它吗？',
    ],
    beats: [
      {
        event:
          '周三 {time}，{place}里出现一张关于 {object} 的截图：画面只有一半，另一半被裁掉。发图的人配了一句：「你们看这是不是有问题。」两分钟后，截图被转到另一个群。',
        detail:
          '{b} 把完整内容发给 {a}，问：「要不要我把后半句也发出去？」{a} 说：「先别，越解释越乱。」',
        trace:
          '完整的那一份还在 {a} 的手机里；截图只保留了其中一半，边角有一道被裁过的白边。',
        dm: '截图是真的，但被裁掉了另一半。转发的人说自己只是随手一转。现在能确认的是：截图在传播，完整的那一份还在 {a} 的手机里。你们要先公开完整版本，还是先让 {a} 决定？',
        summary: '裁过的截图被转发，{a} 的另一半内容没有出现。',
      },
      {
        event:
          '第二天，截图被加上新的标题：「{a} 的事，大家都来看看」。群里有人发了三个笑哭的表情。{a} 没有回复，把群设成免打扰。',
        detail: '{d} 在群里发：「都看我干什么？」随后撤回，改成：「又不是我裁的。」',
        trace: '转发链上有 14 个名字，其中 4 个是班里的人；{evidence} 上显示的保存时间比第一次转发早一分钟。',
        dm: '截图被加了新标题，意思和原来的记录已经不一样。{a} 没有回复，把群设成免打扰。评论还在增加。你们要先联系 {a}，还是先在群里说明截图不完整？',
        summary: '截图被加标题，评论区出现嘲笑表情。',
      },
      {
        event:
          '第三天的午休，{d} 走到 {a} 的座位旁边，把手机屏幕转向 {a}，说：「你解释一下啊。」{a} 看着屏幕，没有接手机。{b} 站起来，挡在两个人中间，说：「先把手机放下。」',
        detail: '{c} 把椅子往后挪了半步，说：「我没看清是谁先转的。」但眼睛一直看着 {d} 的手机。',
        trace: '{a} 的桌角有一道新的划痕；{d} 的手机屏幕上，群消息还在往上滚。',
        dm: '{d} 要 {a} 当场解释，{b} 挡在中间。{a} 还没有说话。现在要决定的是：让 {a} 当场回应，还是先把手机收起来、换一个不会继续传播的地方？',
        summary: '{d} 要求 {a} 当场解释，{b} 挡在中间。',
      },
      {
        event:
          '一周后，群里的截图被新的消息盖过去了，但 {a} 仍然把群设成免打扰。有人拿那张截图开玩笑，旁边有人笑。{a} 从旁边走过去，没有停。',
        detail: '{e} 在复查记录上写：「原图已不可见，转发版本仍可检索。」',
        trace: '群里搜不到原图，但有人保存了截图；{a} 的手机在 {time} 仍然会自动亮一下，是群消息提醒。',
        dm: '截图被刷下去了，但这件事还在被当成玩笑。{a} 没有要求删除，也没有要求道歉。你们这一周做的事情，让 {a} 的日常恢复了多少？还差什么？',
        summary: '截图被刷走，那句话仍被当作玩笑。',
      },
    ],
  },
]

export type ToneId = 'gentle' | 'tense' | 'bright'

export interface TonePreset {
  id: ToneId
  label: string
  en: string
  blurb: string
  detail: string
  initialStats: Stats
}

export const TONES: TonePreset[] = [
  {
    id: 'gentle',
    label: '温和克制',
    en: 'GENTLE',
    blurb: '把冲突写得更慢，留出倾听的位置。',
    detail: '窗开着，纸角被风翻起来，又落回去。',
    initialStats: { tension: 34, trust: 50, openness: 34, safety: 54 },
  },
  {
    id: 'tense',
    label: '悬疑紧张',
    en: 'TENSE',
    blurb: '让每一次沉默都像在倒计时。',
    detail: '顶灯闪了一下，没有人去换。',
    initialStats: { tension: 52, trust: 40, openness: 32, safety: 46 },
  },
  {
    id: 'bright',
    label: '明亮治愈',
    en: 'WARM',
    blurb: '先看见仍然存在的善意，再讨论伤害。',
    detail: '午后的光照在桌面上，把修正带的痕迹照得很清楚。',
    initialStats: { tension: 30, trust: 55, openness: 40, safety: 54 },
  },
]

export const INCIDENT_PRESETS = [
  { id: 'list', label: '一张被改过的名单' },
  { id: 'recording', label: '一段被剪过的录音' },
  { id: 'broken', label: '一件被弄坏的东西' },
  { id: 'message', label: '一条被撤回的消息' },
  { id: 'absent', label: '一次没有解释的缺席' },
]

export const DEFAULT_CAST_NAMES = ['林澄', '周与安', '许禾', '沈一', '苏遥', '全班同学']

export const CAST_LABELS = ['当事人', '亲近的朋友', '旁观者', '被怀疑的人', '记录者', '集体角色']

export const CAST_EN = [
  'THE AFFECTED',
  'THE CLOSE FRIEND',
  'THE BYSTANDER',
  'THE SUSPECTED',
  'THE RECORDER',
  'THE GROUP',
]

export const CAST_SEALS = ['当', '友', '旁', '疑', '记', '全']

const CAST_ART = [
  { portrait: `${ART}/characters/su.png`, seated: `${ART}/characters/seated/su-seated.png` },
  { portrait: `${ART}/characters/jiang.png`, seated: `${ART}/characters/seated/jiang-seated.png` },
  { portrait: `${ART}/characters/shen.png`, seated: `${ART}/characters/seated/shen-seated.png` },
  { portrait: `${ART}/characters/zhou.png`, seated: `${ART}/characters/seated/zhou-seated.png` },
  { portrait: `${ART}/characters/xuzao.png`, seated: `${ART}/characters/seated/xuzao-seated.png` },
]

export function defaultCastNames(count: number): string[] {
  return DEFAULT_CAST_NAMES.slice(0, Math.max(4, Math.min(6, count)))
}

export interface StoryBrief {
  placeId: PlaceId
  themeId: ThemeId
  incident: string
  playerCount: number
  castNames: string[]
  toneId: ToneId
  actCount: 3 | 4
  title?: string
  customScene?: {
    name: string
    art: string
    backdrop?: string
  }
}

export interface IncidentDetail {
  id: string
  label: string
  object: string
  event: string
  trace: string
  clueTitle: string
  clueSummary: string
  clueDetail: string
}

interface Ctx {
  storyId: string
  place: PlacePreset
  theme: ThemePreset
  tone: TonePreset
  incident: string
  incidentDetail: IncidentDetail
  names: string[]
  playerCount: number
  actCount: 3 | 4
}

function incidentClock(place: PlacePreset): string {
  if (place.id === 'online') return '20:10'
  if (place.id === 'gate') return '16:50'
  if (place.id === 'library') return '16:30'
  if (place.id === 'equipment') return '16:10'
  if (place.id === 'village') return '17:20'
  if (place.id === 'town') return '15:40'
  if (place.id === 'arcade') return '16:40'
  return '12:40'
}

function threeMinutesBefore(clock: string): string {
  const [h, m] = clock.split(':').map(Number)
  const total = Math.max(0, h * 60 + m - 3)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function tokens(ctx: Ctx) {
  const names = ctx.names
  const clock = incidentClock(ctx.place)
  return {
    a: names[0] ?? DEFAULT_CAST_NAMES[0],
    b: names[1] ?? DEFAULT_CAST_NAMES[1],
    c: names[2] ?? DEFAULT_CAST_NAMES[2],
    d: names[3] ?? DEFAULT_CAST_NAMES[3],
    e: names[4] ?? DEFAULT_CAST_NAMES[4],
    f: names[5] ?? DEFAULT_CAST_NAMES[5],
    place: ctx.place.group,
    placeName: ctx.place.name,
    surface: ctx.place.surface,
    evidence: ctx.place.evidenceLabel,
    evidence2: ctx.place.secondEvidenceLabel,
    evidenceDetail: ctx.place.evidenceDetail,
    support: ctx.place.supportChannel,
    deadline: ctx.place.deadline,
    time: clock,
    before: threeMinutesBefore(clock),
    object: ctx.incidentDetail.object,
    incident: ctx.incident,
    incidentLabel: ctx.incidentDetail.label,
  }
}

export function detailIncident(text: string, place: PlacePreset, names: string[]): IncidentDetail {
  const a = names[0] ?? DEFAULT_CAST_NAMES[0]
  const g = place.group
  const clock = incidentClock(place)

  if (/名单|表格|分组|值日|报名|排行/.test(text)) {
    const object = /值日/.test(text)
      ? '值日表'
      : /分组/.test(text)
        ? '分组表'
        : /报名/.test(text)
          ? '报名表'
          : /排行/.test(text)
            ? '排行表'
            : /表格/.test(text)
              ? '表格'
              : '名单'
    const scratched = /划|涂掉|涂去|抹掉/.test(text)
    const edit = scratched ? '一笔划掉' : '修正带盖住'
    return {
      id: 'list',
      label: `被改过的${object}`,
      object,
      event: `周三 ${clock}，${g}的${object}上，${a} 的名字被${edit}，旁边多了一行铅笔字：「人够了」。`,
      trace: scratched
        ? `划痕很重，下面的原字还看得出来；${object}的纸角有一道新的折痕。`
        : `修正带下面还能看出原来的三个字；${object}的纸角有一道新的折痕。`,
      clueTitle: '被改动的那一行',
      clueSummary: `${a} 的名字出现在${object}上，又被${edit}。`,
      clueDetail: `痕迹下面还能看出原来的三个字。它能证明${object}被改动过，不能证明是谁改的、为什么改。`,
    }
  }
  if (/录音|音频|语音|视频/.test(text)) {
    return {
      id: 'recording',
      label: '被剪过的录音',
      object: '录音',
      event: `周三 ${clock}，${g}里，一段 19 秒的录音被放给三个人听；${a} 的声音在说到一半时被剪断。`,
      trace: `原始文件还在 ${a} 的手机里，时长 1 分 12 秒；转发出去的那一份只有 19 秒，文件名叫「别外传」。`,
      clueTitle: '19 秒的录音',
      clueSummary: `${a} 的声音在 19 秒处被剪断，完整版本有 1 分 12 秒。`,
      clueDetail:
        '剪掉的部分改变了这句话的意思。它能证明片段被剪过，不能证明是谁剪的、为什么剪。',
    }
  }
  if (/弄坏|损坏|摔|撕|砸|丢了|不见/.test(text)) {
    return {
      id: 'broken',
      label: '被弄坏的东西',
      object: '那件东西',
      event: `周三 ${clock}，${g}的柜子里少了一件东西，原来的位置留着一道新的裂口。`,
      trace: '登记本上那一行没有归还时间；裂口的边缘沾着一小片擦不掉的灰。',
      clueTitle: '空出来的那一格',
      clueSummary: '柜子里少了一件东西，登记本上没有归还记录。',
      clueDetail: '空位和裂口能说明东西被拿走或损坏过，不能说明是谁做的。',
    }
  }
  if (/消息|截图|撤回|群|转发|朋友圈/.test(text)) {
    return {
      id: 'message',
      label: '被撤回的消息',
      object: '那条消息',
      event: `周三 ${clock}，群里一条消息被撤回，但在撤回前的七秒，有人已经截了图。`,
      trace: '撤回提示还留在聊天记录里；截图少了前后两句，边角有一道被裁过的白边。',
      clueTitle: '撤回前的截图',
      clueSummary: `消息在 ${clock} 被撤回，截图在撤回前已经被保存。`,
      clueDetail:
        '截图能证明内容曾经出现过，不能证明它被裁掉了什么，也不能证明转发者的全部动机。',
    }
  }
  if (/缺席|没来|请假|消失|不来/.test(text)) {
    return {
      id: 'absent',
      label: '没有解释的缺席',
      object: '点名册',
      event: `周三 ${clock}，${a} 的座位空着；点名册上画了一个圈，旁边写着「家长未说明」。`,
      trace: `椅子被推进桌下，桌面上还放着 ${a} 昨天没有带走的作业本。`,
      clueTitle: '空着的座位',
      clueSummary: `${a} 当天没有到校，点名册只写了「家长未说明」。`,
      clueDetail: '缺席本身不能说明原因。它是一个需要被问一句的信号，而不是一个结论。',
    }
  }

  return {
    id: 'general',
    label: '留下痕迹的记录',
    object: '那份记录',
    event: `周三 ${clock}，${g}留下了 ${place.evidenceLabel}，上面有一处不属于平时的改动；${a} 是最先被问到的人。`,
    trace: place.evidenceDetail,
    clueTitle: '被改动的记录',
    clueSummary: `${place.evidenceLabel}上留着一处不属于平时的改动。`,
    clueDetail: place.evidenceDetail,
  }
}

function fill(text: string, ctx: Ctx): string {
  const map = tokens(ctx)
  return Object.entries(map).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(value),
    text,
  )
}

function toneEffects(effects: Partial<Stats>, tone: TonePreset): Partial<Stats> {
  if (tone.id === 'tense') return { ...effects, tension: (effects.tension ?? 0) + 2 }
  if (tone.id === 'bright') return { ...effects, trust: (effects.trust ?? 0) + 1 }
  return effects
}

function pickPlace(id: PlaceId | string | null | undefined): PlacePreset {
  return PLACES.find((p) => p.id === id) ?? PLACES[0]
}

function buildCustomPlace(base: PlacePreset, rawName: string, art: string): PlacePreset {
  const name = rawName.slice(0, 18)
  return {
    ...base,
    label: name,
    en: 'CUSTOM SCENE',
    group: '你指定的场景',
    name,
    cue: name,
    scene: art,
    opening: `${name}还没有完全安静下来。有人比约定时间早到，站在入口附近，没有先开口。`,
    secondLine: '入口处的登记本被翻过，最后一行的时间写得很急。',
    thirdLine: `${name}里的人渐渐少了，有人把椅子挪到一边，留出一小块空地。`,
    fourthLine: '一周后，同一个地方又聚了几个人，但没有人的位置和那天完全一样。',
    surface: '入口旁的桌面',
    evidenceLabel: '现场登记表',
    evidenceDetail: '登记表能说明谁在什么时候来过，不能说明那段时间里发生了什么。',
    secondEvidenceLabel: '被留下的纸条',
    secondEvidenceDetail: '纸条上只有半句话，另一半被撕掉了。它可能和这件事有关，也可能只是另一件事的碎片。',
    supportChannel: base.supportChannel,
    blurb: `由你输入的场景「${name}」，底图来自本地素材库并在浏览器内合成。`,
  }
}

function pickTheme(id: ThemeId | string | null | undefined): ThemePreset {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

function pickTone(id: ToneId | string | null | undefined): TonePreset {
  return TONES.find((t) => t.id === id) ?? TONES[0]
}

/* ------------------------------------------------------------------ */
/* clues                                                               */
/* ------------------------------------------------------------------ */

function buildClues(ctx: Ctx): Clue[] {
  const { storyId, place, theme, names, actCount, incidentDetail } = ctx
  const a = names[0]
  const clues: Clue[] = [
    {
      id: `${storyId}-a1`,
      code: 'EV-G1',
      title: incidentDetail.clueTitle,
      act: 1,
      source: place.group,
      time: `周三 ${incidentClock(place)}`,
      summary: incidentDetail.clueSummary,
      detail: incidentDetail.clueDetail,
      reliability: '已核实',
    },
    {
      id: `${storyId}-a2`,
      code: 'EV-G2',
      title: `${a} 的私下表达`,
      act: 1,
      source: '私下对话',
      time: '午休',
      summary: fill(theme.leadQuote, ctx),
      detail: `${a} 在私下里说出了自己的担心。这段表达只在本人同意后记录，不代替本人的决定。`,
      reliability: '单一来源',
    },
    {
      id: `${storyId}-b1`,
      code: 'EV-G3',
      title: fill(theme.evidence.title, ctx),
      act: 2,
      source: '被转发的材料',
      time: '第二天',
      summary: fill(theme.evidence.summary, ctx),
      detail: fill(theme.evidence.detail, ctx),
      reliability: '单一来源',
    },
    {
      id: `${storyId}-b2`,
      code: 'EV-G4',
      title: '旁观者的观察',
      act: 2,
      source: names[2] ?? '旁观者',
      time: '第二幕',
      summary: fill(theme.witness.summary, ctx),
      detail: fill(theme.witness.detail, ctx),
      reliability: '待核实',
    },
    {
      id: `${storyId}-c1`,
      code: 'EV-G5',
      title: '可联系的支持渠道',
      act: 3,
      source: place.supportChannel,
      time: '第三幕',
      summary: `${place.supportChannel}，以及当事人信任的任一成人。`,
      detail: '支持渠道不是把问题交出去，而是让有处理能力的人在保护隐私的前提下介入。',
      reliability: '已核实',
    },
    {
      id: `${storyId}-c2`,
      code: 'EV-G6',
      title: '当事人的下一步意愿',
      act: 3,
      source: '私下对话',
      time: '第三幕',
      summary: fill(theme.leadAsk, ctx),
      detail: `${a} 希望由自己决定下一步说到哪、让谁知道，而不是被代表。`,
      reliability: '单一来源',
    },
  ]

  if (actCount === 4) {
    clues.push(
      {
        id: `${storyId}-d1`,
        code: 'EV-G7',
        title: '一周后的复查记录',
        act: 4,
        source: '档案复查',
        time: '一周后',
        summary: fill(theme.beats[3].summary, ctx),
        detail:
          '复查记录把「没有再次发生」与「问题已经解决」分开。前者是观察，后者需要更多证据。',
        reliability: '待核实',
      },
      {
        id: `${storyId}-d2`,
        code: 'EV-G8',
        title: '记录的去处',
        act: 4,
        source: '小组记录',
        time: '第四幕',
        summary: '这份记录是否公开、由谁保存、什么时候销毁，还没有人作出决定。',
        detail: '记录本身也会影响当事人。决定记录去向之前，需要先确认当事人愿意让谁知道。',
        reliability: '待核实',
      },
    )
  }

  return clues
}

/* ------------------------------------------------------------------ */
/* characters                                                          */
/* ------------------------------------------------------------------ */

function buildCharacters(ctx: Ctx, clues: Clue[]): Character[] {
  const { place, theme, names, playerCount, incidentDetail } = ctx
  const known = (index: number) => clues[index]?.title ?? place.evidenceLabel
  const a = names[0]
  const b = names[1]
  const c = names[2]
  const d = names[3]
  const e = names[4]
  const f = names[5]
  const list: Character[] = [
    {
      id: `${ctx.storyId}-lead`,
      name: names[0],
      en: CAST_EN[0],
      portrait: CAST_ART[0].portrait,
      seated: CAST_ART[0].seated,
      seal: CAST_SEALS[0],
      identity: `${place.group} · 事情的中心`,
      traits: ['不主动解释', '先看周围再回答', '习惯退一步'],
      personality: `话不多，但不是没有想法。${theme.leadTrait} 被公开问到时，${a} 会先看一圈周围，再低声说「都可以」；不会在班里指责任何人。习惯动作：把书包带在手指上绕两圈。`,
      background: `这段时间一直和${place.group}打交道。${incidentDetail.label}发生之后，最先被问到的也是${a}。`,
      emotion: '紧张',
      emotionLabel: 70,
      goal: '让这件事停下来，同时不再被所有人盯着。',
      knownClues: [known(0), known(1)],
      hidden: ['保存着完整的原始记录，但还没有决定要不要给别人看。'],
      seatNote: 'P1 · 当事人',
    },
    {
      id: `${ctx.storyId}-friend`,
      name: names[1],
      en: CAST_EN[1],
      portrait: CAST_ART[1].portrait,
      seated: CAST_ART[1].seated,
      seal: CAST_SEALS[1],
      identity: `${place.group} · 最先听见的人`,
      traits: ['先站到当事人旁边', '答应保密', '不替当事人表态'],
      personality: `说话前会先把自己的椅子往 ${a} 那边挪半格。被问到时先说「我跟他聊过」，再决定讲多少；不会在 ${a} 不在场时替 ${a} 表态。`,
      background: `和 ${a} 认识很久，是少数知道一点内情的人。`,
      emotion: '为难',
      emotionLabel: 66,
      goal: '在不背叛信任的前提下，让当事人不被继续伤害。',
      knownClues: [known(1), known(2)],
      hidden: [`答应过 ${a} 不把一件事说出去；这件事让 ${b} 在小组面前显得像在隐瞒。`],
      seatNote: 'P2 · 亲近的朋友',
    },
    {
      id: `${ctx.storyId}-bystander`,
      name: names[2],
      en: CAST_EN[2],
      portrait: CAST_ART[2].portrait,
      seated: CAST_ART[2].seated,
      seal: CAST_SEALS[2],
      identity: `${place.group} · 看见了但没开口的人`,
      traits: ['先说没看清', '记得具体时间', '不主动作证'],
      personality: `被问到细节时，${c} 会先低头找东西，说「我没看清」；但被问到具体时间和位置时，能准确说出谁站在哪。${c} 不会主动站出来作证，也不会编造没看见的事。`,
      background: '坐在能看见事情发生的位置，却一直说自己「没看清」。',
      emotion: '回避',
      emotionLabel: 58,
      goal: '让讨论不要停在自己身上。',
      knownClues: [known(2), known(3)],
      hidden: ['把一张截图保存进了名为「作业」的相册，没有告诉任何人。'],
      seatNote: 'P3 · 旁观者',
    },
    {
      id: `${ctx.storyId}-suspect`,
      name: names[3],
      en: CAST_EN[3],
      portrait: CAST_ART[3].portrait,
      seated: CAST_ART[3].seated,
      seal: CAST_SEALS[3],
      identity: `${place.group} · 被大家先想到的人`,
      traits: ['被点名先站起来', '提高音量否认', '会主动翻记录'],
      personality: `被点名时，${d} 会先站起来，手撑在桌沿上，说「不是我」；然后把自己的聊天记录翻到最前面给人看。${d} 不会删除记录，也不会为不属于自己的部分道歉。`,
      background: '过去有过一次被误解的经历，所以对「被当成坏人」格外敏感。',
      emotion: '防御',
      emotionLabel: 72,
      goal: '把事情说清楚，但不替不属于自己的部分认错。',
      knownClues: [known(2), known(3)],
      hidden: [
        `确实在那天 ${threeMinutesBefore(incidentClock(place))} 经过 ${place.group}，但没有做记录上说的那件事；${d} 没有主动说，因为怕一开口就没人信。`,
      ],
      seatNote: 'P4 · 被怀疑的人',
    },
    {
      id: `${ctx.storyId}-recorder`,
      name: names[4],
      en: CAST_EN[4],
      portrait: CAST_ART[4].portrait,
      seated: CAST_ART[4].seated,
      seal: CAST_SEALS[4],
      identity: `${place.group} · 把事情写下来的人`,
      traits: ['记录时间', '区分事实与推测', '不写形容词'],
      personality: `用铅笔在纸角写时间，写完把笔夹回本子。记录前会先问：「这句话我能原样记下来吗？」${e} 不把推测写成事实，也不替任何人加形容词。`,
      background: '习惯在事情发生后写几行记录，防止记忆被后来的说法改写。',
      emotion: '专注',
      emotionLabel: 64,
      goal: '让小组带走一份可以核实的记录，而不是一句结论。',
      knownClues: [known(3), known(4)],
      hidden: ['记录里删掉过一句自己的话，因为那句话听起来像是在替某个人辩护。'],
      seatNote: 'P5 · 记录者',
    },
    {
      id: `${ctx.storyId}-group`,
      name: names[5],
      en: CAST_EN[5],
      portrait: null,
      seal: CAST_SEALS[5],
      identity: `${place.group} · 围观与转发`,
      traits: ['跟着最近的声音', '围观与转发', '说「我们也没说什么」'],
      personality: `这不是一个人，而是很多句「我也没想那么多」。${f} 会先看最近说话的人，再跟着重复一句；被问到时用「大家都……」开头，把自己的部分藏进人群。`,
      background: `由第 6 位玩家代表${place.group}里的「大家」。轮到这个角色时，先讨论「我们」会怎么做，再作出选择。`,
      emotion: '躁动',
      emotionLabel: 66,
      goal: '让事情快点过去，不要轮到自己。',
      knownClues: [known(4), known(5)],
      hidden: ['每个人都觉得自己只是「没有看见」，但群里的每一次转发都留下了记录。'],
      seatNote: 'P6 · 集体角色',
    },
  ]
  return list.slice(0, Math.max(4, Math.min(6, playerCount)))
}

/* ------------------------------------------------------------------ */
/* acts                                                                */
/* ------------------------------------------------------------------ */

function buildAct1(ctx: Ctx, clues: Clue[]): Act {
  const { storyId, place, theme, tone, incident, incidentDetail, names } = ctx
  const a = names[0]
  const b = names[1]
  const c = names[2]
  const d = names[3]
  const e = names[4]
  const beat = theme.beats[0]
  const sceneTone = place.id === 'online' ? '屏幕亮了一下，又暗下去。' : tone.detail
  const cid = (n: number) => clues[n]?.id

  const choices: Choice[] = [
    {
      id: `${storyId}-a1c1`,
      title: '先记录已经看见的事实',
      intent: '把观察、推测和未知分开，避免结论跑在材料前面。',
      description: `把${place.evidenceLabel}、时间与在场的人逐条写下来，暂时不判断任何人的动机。`,
      effects: toneEffects({ openness: 9, trust: 6, tension: -2, safety: 4 }, tone),
      clueId: cid(0),
      flags: ['open', 'facts_first'],
      feedback: `你们把能确认的写成一列，把「还不确定」写成另一列。${c} 先低头翻了两页，说「我没看清」，随后补了一句：「${threeMinutesBefore(incidentClock(place))}，我坐在第三排，看见有人走到 ${place.evidenceLabel} 前面。」${e} 把这句话原样记下，没有写「故意」。`,
      observerLine: `${b} 把 ${place.evidenceLabel} 翻到背面，没有说话。`,
      printBody: [
        `按时间整理了${place.evidenceLabel}与在场人员。`,
        `确认「${incident}」已经发生，影响仍在持续。`,
        '暂未确定行为者、原因与是否同一动机。',
        '事实与待核实项已分开归档。',
      ],
    },
    {
      id: `${storyId}-a1c2`,
      title: `私下问 ${a} 想怎么做`,
      intent: '不替当事人做决定，先确认他希望被怎样对待。',
      description: `找一个不会被打断的时间，问 ${a}：想让谁知道？希望被怎么称呼？现在最需要什么？`,
      effects: toneEffects({ safety: 12, trust: 11, tension: -4, openness: -2 }, tone),
      clueId: cid(1),
      flags: ['guard', 'asked_lead'],
      feedback: `你们没有在班里提起，而是先问 ${a} 想让谁知道。${a} 先看了一圈周围，才低声说：「先别让所有人看我。」${b} 把椅子往 ${a} 那边挪了半格，说：「我陪你，但我不替你说。」`,
      observerLine: `${a} 说完之后，把书包带从手指上松开了一点。`,
      printBody: [
        `在当事人同意后进行了私下询问。`,
        `${a} 表达了对公开范围的担心。`,
        '未在班级层面公开讨论，信息范围保持最小。',
        '当事人的下一步意愿已记录，尚未被代表。',
      ],
    },
    {
      id: `${storyId}-a1c3`,
      title: '当场问所有人，这是谁做的',
      intent: '把问题摆到明面上，要求一个解释。',
      description: '在所有人都在的时候直接发问，希望有人站出来说明。',
      effects: toneEffects({ tension: 15, openness: 9, trust: -8, safety: -10 }, tone),
      clueId: cid(2),
      flags: ['open', 'public_blame'],
      feedback: `${a} 低下头，把书包带绕在手指上。${d} 站起来，椅子在地上蹭了一声，说：「不是我。」${c} 把头低下去，说「我没看清」，但没有再说别的。你们得到了很多句子，没有多出一条证据。`,
      observerLine: `有人小声说：「我就知道会查到他。」`,
      printBody: [
        '在全体在场时公开提问。',
        '出现指认、否认与旁观三类反应。',
        '未形成可核实的新证据，紧张程度上升。',
        '当事人未获得额外的安全支持。',
      ],
    },
    {
      id: `${storyId}-a1c4`,
      title: '先暂停，把未知写下来',
      intent: '承认信息不足，先不指认、不扩散，保留继续核实的空间。',
      description: '约定在核实之前不把猜测说成结论，并记录下还缺什么信息。',
      effects: toneEffects({ tension: -5, trust: 6, openness: 1, safety: 6 }, tone),
      clueId: cid(1),
      flags: ['guard', 'paused'],
      feedback: `你们约定在核实之前不把猜测说成结论。${e} 在纸角写下「${incidentClock(place)}，第三排，未知」，没有写「故意」。${b} 把已经打好的那句「大家都知道是谁」删掉了。`,
      observerLine: `${c} 把已经写好的猜测划掉了。`,
      printBody: [
        '决定在信息不足时暂停判断。',
        '未公开指认任何人，也未扩散材料。',
        '记录了尚缺的信息与下一步核实方向。',
        '当事人的安全范围暂时保持稳定。',
      ],
    },
  ]

  return {
    id: `${storyId}-act1`,
    no: 1,
    code: 'ACT 01',
    title: `${incidentClock(place)} 的那件事`,
    en: `THE THING AT ${incidentClock(place)}`,
    scene: place.name,
    time: `周三 ${incidentClock(place)}`,
    setting: `${place.name} · ${incidentDetail.label}`,
    event: fill(incidentDetail.event, ctx),
    narration: [
      `${sceneTone}${place.opening}`,
      `你们把这天记成：「${incident}」。具体发生的是：${fill(incidentDetail.event, ctx)}`,
      fill(incidentDetail.trace, ctx),
      fill(beat.event, ctx),
      fill(beat.detail, ctx),
      `AI DM：${fill(beat.dm, ctx)}`,
    ],
    task: `在不急着指认任何人的前提下，确认 ${incidentDetail.label}留下了哪些可以核对的痕迹。`,
    question: '事情刚刚露头。你们先做哪一件事？',
    baseClueIds: [cid(0), cid(1)].filter((id): id is string => Boolean(id)),
    choices,
    closing: `第一幕结束时，${incidentDetail.label}已经写进记录。能确认的是发生了什么；还不能确认的是谁做的、为什么做。`,
  }
}

function buildAct2(ctx: Ctx, clues: Clue[]): Act {
  const { storyId, place, theme, tone, names } = ctx
  const a = names[0]
  const b = names[1]
  const c = names[2]
  const beat = theme.beats[1]
  const cid = (n: number) => clues[n]?.id

  const choices: Choice[] = [
    {
      id: `${storyId}-a2c1`,
      title: '核对材料的来源',
      intent: '先确认材料从哪里来、经过了谁的手，再决定它能不能作为讨论依据。',
      description: '顺着时间、截图边缘和发布位置逐项核对，把能确认和不能确认的部分分开。',
      effects: toneEffects({ openness: 11, trust: 5, tension: 2, safety: 2 }, tone),
      clueId: cid(2),
      flags: ['open', 'checked_source'],
      feedback: `你们顺着时间、截图边缘和发布位置核对了一遍。能确认的部分被标出来，不能确认的部分被打了问号。${c} 说：「至少现在我们知道哪一句是从哪里来的。」`,
      observerLine: '有人在材料的空白处写下：「来源 ≠ 动机。」',
      printBody: [
        `核对了${theme.evidence.title}的时间与来源。`,
        '区分了可确认内容与无法确认内容。',
        '未将材料单独用于指认具体个人。',
        '材料已标注可信度与缺口。',
      ],
    },
    {
      id: `${storyId}-a2c2`,
      title: `先保护 ${a} 的信息`,
      intent: '在当事人同意之前，不扩大知情范围。',
      description: `不转发材料，只把必要部分告诉 ${a}，让 ${a} 决定谁知道、知道多少。`,
      effects: toneEffects({ safety: 14, trust: 9, tension: -3, openness: -4 }, tone),
      clueId: cid(3),
      flags: ['guard', 'protected_lead'],
      feedback: `你们没有转发材料，只把必要部分告诉 ${a}，让 ${a} 决定谁知道。${b} 问：「要不要把群里那条也删了？」${a} 说：「不用，删了更像真的。」这句话之后，讨论才继续。`,
      observerLine: '原本已经举起手机的人，把屏幕扣在了桌上。',
      printBody: [
        `将知情范围限制在 ${a} 同意的人以内。`,
        '未转发、未截图、未在公开群讨论材料。',
        '当事人参与了信息范围的决定。',
        '核实工作保留在更小的范围内继续进行。',
      ],
    },
    {
      id: `${storyId}-a2c3`,
      title: '把材料发到班级群，让所有人讨论',
      intent: '认为只有让更多人看见，问题才不会被悄悄压下去。',
      description: '把材料连同自己的疑问一起发进班级群，希望形成公开讨论。',
      effects: toneEffects({ openness: 15, tension: 13, trust: -6, safety: -9 }, tone),
      clueId: cid(2),
      flags: ['open', 'spread_public'],
      feedback: `材料被发进班级群。讨论很快从「发生了什么」变成「到底是谁」。${a} 没有在群里说话，头像一直灰着；${c} 发了三个「？」，又全部撤回。传播的速度超过了核实的速度。`,
      observerLine: '有人的第一反应不是问经过，而是把截图保存了下来。',
      printBody: [
        '材料被发送至班级群。',
        '讨论转向身份猜测，当事人未参与。',
        '传播范围超出最初的知情圈。',
        '信息控制难度上升。',
      ],
    },
    {
      id: `${storyId}-a2c4`,
      title: '私下交给可信任的成人',
      intent: '让有处理能力的人介入，同时明确不公开材料。',
      description: `把必要材料交给${place.supportChannel}，请他们分别了解情况，不在班级里公开。`,
      effects: toneEffects({ safety: 13, openness: 4, trust: 5, tension: 3 }, tone),
      clueId: cid(4),
      flags: ['guard', 'adult_early'],
      feedback: `${place.supportChannel}答应私下核实，不公开材料，也不立即给出结论。你们第一次感觉事情有可能被接住。但你们也知道，接下来不再完全由你们决定。`,
      observerLine: '临走前，老师问：「当事人知道你们来找我吗？」',
      printBody: [
        `将材料交由${place.supportChannel}私下核实。`,
        '明确不在班级公开截图或转述细节。',
        '未提前认定责任，也未承诺立即解决。',
        '待确认当事人是否知情并同意这一步。',
      ],
    },
    {
      id: `${storyId}-a2c5`,
      title: '不再追问，等它过去',
      intent: '避免在事情最热的时候把矛盾放大。',
      description: '不再追查，也不再联系当事人，让日常先恢复正常。',
      effects: toneEffects({ tension: 8, trust: -9, openness: -9, safety: -8 }, tone),
      clueId: cid(3),
      flags: ['guard', 'drop_early'],
      feedback: `接下来几天，没有人再提这件事。${a} 照常来上课，也照常一个人吃饭。沉默让表面恢复了平静，但没有让任何事情回到原样。`,
      observerLine: `${place.evidenceLabel}被收进了抽屉，没有再被打开。`,
      printBody: [
        '决定停止追问与讨论。',
        '表面秩序恢复，当事人未获得额外支持。',
        '材料未继续核实，也未扩散。',
        '同类事件再次发生的条件仍然存在。',
      ],
    },
  ]

  return {
    id: `${storyId}-act2`,
    no: 2,
    code: 'ACT 02',
    title: '第二天，事情出了原来的圈子',
    en: 'THE DAY IT TRAVELED',
    scene: place.name,
    time: '第二天午休',
    setting: fill(beat.trace, ctx),
    event: fill(beat.event, ctx),
    narration: [
      fill(beat.event, ctx),
      fill(beat.detail, ctx),
      fill(beat.trace, ctx),
      `新的材料出现了：${fill(theme.evidence.summary, ctx)}它让一部分事情变清楚，也让 ${a} 更不愿意被看见。`,
      `AI DM：${fill(beat.dm, ctx)}`,
    ],
    task: '在保留必要线索的同时，确认信息应该被哪些人知道。',
    question: '新的材料摆在你们面前。你们怎么处理它？',
    baseClueIds: [cid(2), cid(3)].filter((id): id is string => Boolean(id)),
    choices,
    closing: `第二幕结束时，${fill(beat.summary, ctx)}第三幕，轮到你们决定下一步。`,
  }
}

function buildAct3(ctx: Ctx, clues: Clue[]): Act {
  const { storyId, place, theme, tone, names } = ctx
  const a = names[0]
  const b = names[1]
  const c = names[2]
  const d = names[3]
  const e = names[4]
  const beat = theme.beats[2]
  const cid = (n: number) => clues[n]?.id

  const choices: Choice[] = [
    {
      id: `${storyId}-a3c1`,
      title: `陪 ${a} 去说明，由 ${a} 决定说到哪`,
      intent: '先听当事人怎么想，再陪他去做他选择的下一步。',
      description: `陪 ${a} 去找${place.supportChannel}，但不替 ${a} 回答问题。`,
      effects: toneEffects({ safety: 14, trust: 12, tension: -5, openness: 2 }, tone),
      clueId: cid(5),
      flags: ['guard', 'path_support'],
      feedback: `${a} 站在 ${place.supportChannel} 的门口，先说了一句：「我自己说。」${b} 在走廊另一边等着，没有跟进去。门关上前，${a} 回头看了一眼，${b} 点了一下头。`,
      observerLine: '你们没有替当事人回答老师的问题，只在门口等他。',
      printBody: [
        '选择「陪同当事人说明」路径。',
        `由 ${a} 决定说到哪、让谁知道。`,
        '小组不代替当事人发言，也不替其作出决定。',
        '支持路径已建立，后续核实继续进行。',
      ],
    },
    {
      id: `${storyId}-a3c2`,
      title: '公开已知事实，和全班一起定新规则',
      intent: '认为只有让所有人参与，班级才有可能改变。',
      description: '把能确认的事实投影出来，邀请全班一起讨论「以后怎样避免同样的事」。',
      effects: toneEffects({ openness: 17, tension: 10, trust: -3, safety: -6 }, tone),
      clueId: cid(4),
      flags: ['open', 'path_public'],
      feedback: `你们把能确认的事实投影出来，邀请全班一起讨论「以后怎样避免同样的事」。${d} 站起来问：「那到底是谁？」${c} 把椅子往后挪了半步。${a} 坐在最后一排，没有举手。讨论很快分成两半：一半在谈规则，一半在找人。`,
      observerLine: '讨论很快分成两半：一半在谈规则，一半在找人。',
      printBody: [
        '选择「公开事实并共同制定规则」路径。',
        '班级开始讨论可执行的预防规则。',
        '讨论同时出现身份追问，当事人未参与。',
        '公开范围扩大，安全成本随之上升。',
      ],
    },
    {
      id: `${storyId}-a3c3`,
      title: '只保留必要材料，请成人私下核实',
      intent: '停止扩散，把需要核实的部分交给有处理能力的人。',
      description: `不再转发材料，只向${place.supportChannel}说明能确认的部分，请求私下核实。`,
      effects: toneEffects({ safety: 12, openness: 3, trust: 6, tension: 1 }, tone),
      clueId: cid(4),
      flags: ['guard', 'path_adult'],
      feedback: `你们把材料交给 ${place.supportChannel}，只留下能说明问题的那几页。老师问：「当事人知道你们来找我吗？」${b} 说：「我们想先确认怎么保护他。」老师答应分别了解情况，不公开聊天记录。`,
      observerLine: '档案员在行动卡背面写：「求助不是把问题丢出去，是让它进入可以被处理的地方。」',
      printBody: [
        '选择「保留必要材料并求助成人」路径。',
        '停止转发，缩小信息传播范围。',
        `向${place.supportChannel}说明情况并请求私下核实。`,
        '未承诺立即认定责任；核实流程由成人继续。',
      ],
    },
    {
      id: `${storyId}-a3c4`,
      title: '不再介入，让事情自己过去',
      intent: '避免把矛盾继续放大，把处理留到以后。',
      description: '不再追问，也不联系当事人，让日常按原计划继续。',
      effects: toneEffects({ tension: 9, trust: -11, openness: -8, safety: -10 }, tone),
      clueId: cid(5),
      flags: ['guard', 'path_drop'],
      feedback: `你们没有再去问 ${a}，也没有再看那份材料。${e} 在记录里写「本周无异常」，写完把笔盖上了。${a} 照常来上课，也照常一个人去食堂。空白从一件事变成了一种默认。`,
      observerLine: `${c} 在记录里写下：「本周无异常。」然后把笔盖上了。`,
      printBody: [
        '选择「不再介入」路径。',
        '日常按原计划继续，矛盾未被公开讨论。',
        '材料未扩散，也未继续核实。',
        '同类事件再次发生的条件仍然存在。',
      ],
    },
  ]

  return {
    id: `${storyId}-act3`,
    no: 3,
    code: 'ACT 03',
    title: '第三天，谁来开口',
    en: 'WHO SPEAKS',
    scene: place.name,
    time: `${place.deadline}前`,
    setting: fill(beat.trace, ctx),
    event: fill(beat.event, ctx),
    narration: [
      fill(beat.event, ctx),
      fill(beat.detail, ctx),
      fill(beat.trace, ctx),
      `事情已经不只是「发生了什么」，而是「接下来由谁承担」。${a} 还没有说想让谁陪、想让谁道歉、想不想继续参加。`,
      `AI DM：${fill(beat.dm, ctx)}`,
    ],
    task: '选择一条你们愿意承担后续的路径，并说明它会如何保护当事人的意愿与信息安全。',
    question: `${place.deadline}，你们决定怎么走下一步？`,
    baseClueIds: [cid(4), cid(5)].filter((id): id is string => Boolean(id)),
    choices,
    closing: `第三幕结束时，${fill(beat.summary, ctx)}每一条路径都留下了一张行动卡，写的不是「正确答案」，而是你们愿意负责的下一步。`,
  }
}

function buildAct4(ctx: Ctx, clues: Clue[]): Act {
  const { storyId, place, theme, tone, names } = ctx
  const a = names[0]
  const b = names[1]
  const c = names[2]
  const d = names[3]
  const e = names[4]
  const beat = theme.beats[3]
  const cid = (n: number) => clues[n]?.id

  const choices: Choice[] = [
    {
      id: `${storyId}-a4c1`,
      title: '复查是否真的发生了改变',
      intent: '把「没有再次发生」和「问题已经解决」分开确认。',
      description: `一周后去问 ${a}：这周有没有再发生？有哪些地方不一样了？`,
      effects: toneEffects({ openness: 9, trust: 8, tension: -3, safety: 3 }, tone),
      clueId: cid(6),
      flags: ['open', 'checked_change'],
      feedback: `你们去找 ${a}，不是问「你还好吗」，而是问「这周有没有再发生」。${a} 想了一会儿，说：「少了一次。」${e} 把这句话原样记下，没有在后面加「好转」。${b} 问：「那一次是什么时候？」${a} 没有回答。`,
      observerLine: '记录上多了一行：「少了一次。」后面没有形容词。',
      printBody: [
        '进行了为期一周的复查。',
        '确认同类事件频率有所下降，但未完全消失。',
        '未将「减少」等同于「解决」。',
        '复查结果已回到档案。',
      ],
    },
    {
      id: `${storyId}-a4c2`,
      title: `让 ${a} 决定记录要不要公开`,
      intent: '记录本身也可能伤害当事人，所以由当事人决定它的去向。',
      description: '把记录交给当事人，允许其删改、保留或公开。',
      effects: toneEffects({ safety: 12, trust: 9, openness: 1 }, tone),
      clueId: cid(7),
      flags: ['guard', 'lead_decides'],
      feedback: `${a} 看完记录，删掉了两句，又在最后加了一句：「那天我不想说话，不是因为我不在乎。」${c} 想问为什么，${b} 轻轻碰了一下 ${c} 的胳膊，${c} 没有开口。`,
      observerLine: '被删掉的不是事实，而是别人替当事人加上的评价。',
      printBody: [
        '记录去向由当事人决定。',
        `当事人删改了两处表述，并补充了个人说明。`,
        '小组未代替当事人决定公开范围。',
        '记录保留在当事人同意的版本上。',
      ],
    },
    {
      id: `${storyId}-a4c3`,
      title: '把这次经历写成给下一届的提醒',
      intent: '把一次具体事件变成可以被反复使用的经验。',
      description: `写一份不带姓名的提醒，贴在${place.group}，说明哪些流程需要有人确认。`,
      effects: toneEffects({ openness: 12, trust: 6, tension: -2, safety: 2 }, tone),
      clueId: cid(6),
      flags: ['open', 'wrote_forward'],
      feedback: `你们把过程写成一份不带姓名的提醒，贴在 ${place.group}。${e} 在最后一行写：「看到异常，先确认，再转述。」${d} 看了一遍，说：「这次没有我的名字。」`,
      observerLine: '提醒的最后一行是：「看到异常，先确认，再转述。」',
      printBody: [
        '将经验整理为匿名提醒。',
        '提醒聚焦流程与可执行动作，不指认个人。',
        '材料被张贴在公共区域，供后续参考。',
        '同类事件的预防条件被明确写出。',
      ],
    },
    {
      id: `${storyId}-a4c4`,
      title: '把档案封存，不再提起',
      intent: '让所有人回到日常，不再被这件事占用注意力。',
      description: '把记录放回档案袋，约定不再讨论。',
      effects: toneEffects({ tension: 7, trust: -7, openness: -8, safety: -5 }, tone),
      clueId: cid(7),
      flags: ['guard', 'sealed'],
      feedback: `记录被放回档案袋，袋子被放进最下层的柜子。${c} 问：「以后还会有人看吗？」没有人回答。${a} 从旁边经过，没有停下。`,
      observerLine: '档案袋上还留着一行铅笔字：「待复查。」没有人把它划掉。',
      printBody: [
        '记录被封存，讨论停止。',
        '日常秩序恢复，无公开指认。',
        '当事人未获得进一步支持。',
        '「待复查」标记仍然存在。',
      ],
    },
  ]

  return {
    id: `${storyId}-act4`,
    no: 4,
    code: 'ACT 04',
    title: '一周之后',
    en: 'ONE WEEK LATER',
    scene: place.name,
    time: '一周后',
    setting: fill(beat.trace, ctx),
    event: fill(beat.event, ctx),
    narration: [
      fill(beat.event, ctx),
      fill(beat.detail, ctx),
      fill(beat.trace, ctx),
      '档案员把上一周的记录重新摊开，问你们：这件事真的结束了吗？还是只是暂时没有人再提？',
      `AI DM：${fill(beat.dm, ctx)}`,
    ],
    task: '为这份记录决定一个去处，并说明它会不会让同类事情更难再次发生。',
    question: '一周之后，这份记录该怎么处理？',
    baseClueIds: [cid(6), cid(7)].filter((id): id is string => Boolean(id)),
    choices,
    closing: `故事在这里结束。${fill(beat.summary, ctx)}你们留下的不是一份完美记录，而是一份可以继续被打开的档案。`,
  }
}

/* ------------------------------------------------------------------ */
/* endings                                                             */
/* ------------------------------------------------------------------ */

function buildEndings(ctx: Ctx): Ending[] {
  const { storyId, place, theme, names, incident, incidentDetail } = ctx
  const a = names[0]

  return [
    {
      id: `${storyId}-demo-open`,
      code: 'ENDING A',
      title: '被说清楚的版本',
      en: 'THE VERSION SPOKEN ALOUD',
      stamp: '已核对',
      summary: `${a} 的处境被听见，能确认的事实也被放到了可以被处理的地方。`,
      paragraphs: [
        `在${place.name}，${incident}。能确认的事实是：${fill(incidentDetail.event, ctx)}你们没有把它当成一个人的错误，也没有假装它没有发生。`,
        fill(theme.openOutcome, ctx),
        `${fill(theme.openAfter, ctx)} 事情没有变得更轻松，但它变得可以谈论：${a} 知道下一次开口时，至少有人会先问「你希望怎么被听见」。`,
      ],
      consequences: [
        '当事人意愿：被听见，并由本人决定下一步',
        '信息范围：只在必要的人之间流动',
        '关系变化：没有形成公开指认，但留下了可以继续的对话',
        '后续处理：由可信任的成人继续核实',
      ],
      reflection: theme.reflection.map((line) => fill(line, ctx)),
    },
    {
      id: `${storyId}-demo-guard`,
      code: 'ENDING B',
      title: '被保护住的版本',
      en: 'THE VERSION HELD CLOSE',
      stamp: '已收拢',
      summary: `你们把范围收得很小，${a} 没有被再次推到人群中央；但有些问题也留在了原处。`,
      paragraphs: [
        `在${place.name}，${incident}。你们选择了更小的范围：先保护能确认的部分，再决定谁需要知道。`,
        fill(theme.guardOutcome, ctx),
        `${fill(theme.guardAfter, ctx)} 这不是一个失败的结果，也不是一个完成的答案。档案被合上时，${a} 不用再解释自己；而那份记录仍然留在柜子里，等待下一次核对。`,
      ],
      consequences: [
        '当事人意愿：未被再次曝光，意愿仍待确认',
        '信息范围：保持在最小范围',
        '关系变化：表面恢复平静，未公开对峙',
        '后续处理：部分问题仍未被确认',
      ],
      reflection: theme.reflection.map((line) => fill(line, ctx)),
    },
  ]
}

/* ------------------------------------------------------------------ */
/* assembly                                                            */
/* ------------------------------------------------------------------ */

export interface GenerateOptions {
  id?: string
  slot?: string
}

function tighten(text: string): string {
  return text
    .replace(/([一-鿿])[ \t]+(?=[一-鿿])/g, '$1')
    .replace(/([一-鿿])[ \t]+(?=[，。；：！？、「」（）《》])/g, '$1')
    .replace(/([，。；：！？、「」（）《》])[ \t]+(?=[一-鿿])/g, '$1')
}

function polish<T>(value: T): T {
  if (typeof value === 'string') return tighten(value) as T
  if (Array.isArray(value)) return value.map((item) => polish(item)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = polish(item)
    }
    return out as T
  }
  return value
}

export function generateStory(brief: StoryBrief, options: GenerateOptions = {}): Story {
  const basePlace = pickPlace(brief.placeId)
  const customSceneName = brief.customScene?.name.trim()
  const place = customSceneName
    ? buildCustomPlace(basePlace, customSceneName, brief.customScene?.art ?? basePlace.scene)
    : basePlace
  const theme = pickTheme(brief.themeId)
  const tone = pickTone(brief.toneId)
  const playerCount = Math.max(4, Math.min(6, Math.round(brief.playerCount) || 5))
  const actCount: 3 | 4 = brief.actCount === 4 ? 4 : 3
  const incident =
    brief.incident.trim().replace(/[\s。！？!?，,；;]+$/g, '') || '一件没有人愿意先说出口的事'
  const names = Array.from({ length: playerCount }, (_, i) => brief.castNames[i]?.trim() || DEFAULT_CAST_NAMES[i])
  const storyId = options.id ?? `gen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const slot = options.slot ?? nextGeneratedSlot()
  const title = brief.title?.trim() || `${place.cue}·${theme.title}`
  const incidentDetail = detailIncident(incident, place, names)

  const ctx: Ctx = {
    storyId,
    place,
    theme,
    tone,
    incident,
    incidentDetail,
    names,
    playerCount,
    actCount,
  }
  const clueBank = buildClues(ctx)
  const characters = buildCharacters(ctx, clueBank)
  const acts = [buildAct1(ctx, clueBank), buildAct2(ctx, clueBank), buildAct3(ctx, clueBank)]
  if (actCount === 4) acts.push(buildAct4(ctx, clueBank))
  const endings = buildEndings(ctx)

  return polish<Story>({
    id: storyId,
    slot,
    title,
    en: theme.en,
    type: `AI 生成 · ${theme.label}`,
    themes: [theme.label, ...theme.chips.filter((chip) => chip !== theme.label)],
    logline: `在${place.group}，${incident}。具体发生的是：${fill(incidentDetail.event, ctx)}${names[0]} 和同伴们要在不再次伤害彼此的前提下，决定接下来怎么做。`,
    description: `由本地模板编剧引擎根据教师输入组合生成的新档案：场景为${place.name}，核心议题是${theme.label}，触发事件为「${incident}」。每一幕都有一件具体发生的事，角色行为按固定人设推进；教育骨架固定为「看见伤害 → 群体影响 → 支持与责任 → 改变规则」。共 ${actCount} 幕、${playerCount} 个角色。所有人物与事件均为虚构；生成过程不连接任何真实大模型。${
      brief.customScene ? '场景卡以本地素材库中最接近的画面为底图，在浏览器内与输入的标题合成为静态图，不调用联网图像服务。' : ''
    }`,
    playable: true,
    duration: actCount === 4 ? '35–45 分钟' : '25–35 分钟',
    playerRange: `${playerCount} 人`,
    accent: theme.accent,
    initialStats: { ...tone.initialStats },
    characters,
    acts,
    endings,
    clueBank,
    generated: true,
    backdrop: (customSceneName && brief.customScene?.backdrop) || place.scene,
  })
}
