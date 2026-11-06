import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, SectionHead, Stamp } from '../components/ui'

const FLOW = [
  ['01', '选择档案', '从课堂模式的档案库中选一份。A《没有坏人的班级》与 E《无人举手》为完整多幕；B/C 为明确标注的演示片段。'],
  ['02', '编排座位', '确定 4–6 个座位，把角色分配到座位；大屏只显示公开身份，不显示私人背景。'],
  ['03', '打印课前档案', '在座位编排页点「打印全部角色档案」。大屏会播放热敏纸模拟，私人文字以遮挡条呈现，再用浏览器打印一次输出全部档案；每份单独一页，按座位号分发。'],
  ['04', '进入课堂大屏', '老师在一台教室设备上推进剧情，学生按座位轮流开麦发言。'],
  ['05', '轮流发言', '同一时间只有一支话筒打开。识别到的发言先转成候选行动，确认后才记为该座位的行动。'],
  ['06', '逐座行动', '每个座位各行动一次，全部完成后汇总本轮反馈，并影响后续幕与结局。'],
  ['07', '查看反馈', 'AI DM 反馈剧情变化，状态条记录虚构班级的气氛。'],
  ['08', '打印材料', '行动回执与新证据可以在课堂中即时打印，并保存到本机记录。'],
  ['09', '完成全部幕', '最后一幕结束后生成本局结局，形成一份事件报告。'],
  ['10', '复盘与总结', '教师端可回看转写与决策记录；学习总结页帮助班级整理本局的感受与问题。'],
]

const PRINTS = [
  ['PRT/01', '角色档案', '课前在座位编排页批量生成。公开信息与私人信息由折叠线分隔，按座位号分发。'],
  ['PRT/02', '事件证据', '获得线索时生成。与线索编号一一对应，已打印内容不可改写。'],
  ['PRT/03', '行动回执', '作出选择后生成。记录行动、行动者、意图与虚构状态变化。'],
]

const FAQ = [
  {
    q: 'AI DM 是真的 AI 吗？',
    a: '不是。本原型使用本地规则引擎与预写分支生成叙述，界面常驻「AI DM · 本地规则引擎」标识，没有连接任何大模型 API。',
  },
  {
    q: 'DM 的声音从哪来？',
    a: '课堂与剧情的 DM 朗读优先使用本机的 Kokoro 少年音模型（约 320MB，首次进入课堂时加载），全部在本机推理，不联网、不上传，也不保存音频。模型尚未加载完成或设备不支持 WebGPU 时，自动回退到浏览器自带的中文语音。界面里的「语音」开关可随时关闭；两种语音都不可用时开关会置灰。',
  },
  {
    q: '打印是真的打印吗？',
    a: '默认是热敏纸模拟。点击「浏览器打印」会调用系统打印对话框，页面已准备打印样式；没有热敏打印设备也能完整演示。',
  },
  {
    q: '数据会被上传吗？',
    a: '不会。角色、选择、线索、打印记录、课堂转写与剧本草稿都只保存在本机浏览器的 localStorage。教师端读取的也是同一台设备上的进度；语音识别若由浏览器提供，只返回文字，本原型不保存音频。',
  },
  {
    q: '可以中途退出吗？',
    a: '可以。剧情页右上角有暂停与找老师入口。退出后进度会自动保存；在「学习总结」页可以主动清除本机记录。',
  },
  {
    q: 'B/C 故事为什么很快就结束？',
    a: '这两个故事只实装了第一幕与演示结局，并在故事选择页明确标注「演示片段 · 完整三幕未实装」。它们用于展示角色、选择与打印机制，不伪装成完整故事。',
  },
  {
    q: '《无人举手》和另一份完整档案有什么区别？',
    a: 'E《无人举手》是五幕教育剧：每一幕有一名当事人，其余玩家是旁观者；每一次介入、沉默或附和都会累积，并在公审一幕回到所有人身上。它与 A《没有坏人的班级》都沿用同一套选择、线索、逐座行动与打印机制。',
  },
  {
    q: '我们只有一台设备，怎么让全班一起玩？',
    a: '使用「课堂模式」。老师在教室大屏上编排座位并推进剧情，学生按座位轮流打开话筒发言。系统先在大屏显示识别到的候选行动，确认后记为该座位的行动；每个座位各行动一次，全部完成后汇总本轮反馈，并影响后续幕与结局。一台设备即可完成整局。',
  },
  {
    q: '话筒、语音识别与转写会保存什么？',
    a: '只保存识别出的文字、座位号与角色名，不保存音频，也不会上传。同一时间只有一支话筒打开，老师可以随时换麦或静音。浏览器不支持识别或麦克风被拒绝时，可以用「模拟发言」完成同样的确认流程。',
  },
  {
    q: '私人档案会出现在大屏上吗？',
    a: '不会。座位编排与大屏只显示角色的公开身份、性格与目标。私人背景、隐藏信息与已知线索只在打印的纸质档案上；打印时大屏只显示热敏纸模拟，私人文字以遮挡条呈现。',
  },
  {
    q: '剧本工坊会连接 AI 自动写故事吗？',
    a: '不会。剧本工坊可以可视化编辑每一幕与行动选项，也可以按主题用本地模板拼装草稿；界面明确标注「模拟生成，未连接大模型」。保存后先进入待生效版本，下一次开始新局时才会应用，正在进行的课堂不受影响。',
  },
  {
    q: '有没有正确选项？',
    a: '没有。结局由全班多个选择共同生成，不是为了找到唯一正确答案，而是理解不同处理方式如何改变处境。',
  },
]

export function Help() {
  const navigate = useNavigate()
  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/menu')} className="hover:text-ink">← 主菜单</button>
          <span>/</span>
          <span>OPERATING MANUAL / EA-MANUAL-01</span>
          <span className="ml-auto border border-ink/40 px-1.5 py-0.5">REV. 1.0</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <header className="frame-double bg-sheet p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="label-mono text-red">HOW TO PLAY / 使用说明</div>
                  <h1 className="title-serif mt-1 text-[34px] leading-none sm:text-[44px]">把档案翻开之前</h1>
                  <p className="mt-2 max-w-[680px] text-[11.5px] leading-relaxed text-ink/55">
                    这是一款在教室里运行的互动叙事游戏。你们不需要扮演「好人」或「坏人」，
                    只需要决定：在这个处境里，下一步怎么做。
                  </p>
                </div>
                <Stamp tone="ink" rotate={false} className="shrink-0">开始阅读</Stamp>
              </div>
            </header>

            <section className="mt-4 frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="I" title="一局怎么走" en="SESSION FLOW" right={<FileTag>10 STEPS</FileTag>} />
              <ol className="mt-3 grid grid-cols-1 gap-x-4 gap-y-0 sm:grid-cols-2">
                {FLOW.map(([no, title, desc]) => (
                  <li key={no} className="flex gap-2.5 border-b border-dotted border-ink/20 py-2">
                    <span className="font-mono text-[9px] text-red">{no}</span>
                    <div>
                      <div className="text-[11px] font-medium">{title}</div>
                      <p className="mt-0.5 text-[9.5px] leading-relaxed text-ink/50">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-4 frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="II" title="界面速查" en="SCREEN MAP" />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ['课前档案打印', '在座位编排页批量准备全部角色档案；打印时显示热敏纸模拟，私人文字遮蔽，再用浏览器一次输出全部档案。'],
                  ['打印预览', '确认打印 → 热敏纸模拟 → 可展开阅读 → 保存记录 / 浏览器打印 / 返回课堂。'],
                  ['结局报告', '事件报告式排版，包含经过、后果、复盘问题与本局决策记录。'],
                  ['学习总结', '回看本局摘要，写下只属于自己的三句话，然后选择保留或清除本机记录。'],
                  ['课堂座位', '编排 4–6 个座位与角色，只显示公开信息；进入后由老师统一控制大屏。'],
                  ['课堂大屏', '场景、叙述、行动候选与反馈；底部是座位话筒，右侧是语音确认与教师控制。'],
                  ['剧本工坊', '编辑幕与行动选项、用本地模板生成草稿、保存待生效版本、导入导出 JSON。'],
                  ['教师转写', '课堂发言的文字记录，可按座位回看、导出 TXT 或两步确认清空。'],
                ].map(([title, desc]) => (
                  <div key={title} className="border border-ink/25 p-2.5">
                    <div className="text-[10.5px] font-medium">{title}</div>
                    <p className="mt-0.5 text-[9.5px] leading-relaxed text-ink/50">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-4 frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="III" title="三种打印材料" en="PRINT MATERIALS" />
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ink">
                      <th className="py-1.5 pr-2 font-mono text-[8px] tracking-[0.1em] text-ink/40">CODE</th>
                      <th className="py-1.5 pr-2 text-[9.5px] text-ink/40">材料</th>
                      <th className="py-1.5 text-[9.5px] text-ink/40">什么时候生成</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRINTS.map(([code, name, desc]) => (
                      <tr key={code} className="border-b border-dotted border-ink/20">
                        <td className="py-2 pr-2 align-top font-mono text-[8.5px] text-red">{code}</td>
                        <td className="py-2 pr-2 align-top text-[10.5px] whitespace-nowrap">{name}</td>
                        <td className="py-2 align-top text-[9.5px] leading-relaxed text-ink/55">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[8.5px] leading-relaxed text-ink/40">
                打印材料来自具体选择，不是装饰。纸上的信息保持不可变；后续剧情只能补充新证据，不能覆盖旧记录。
              </p>
            </section>

            <section className="mt-4 border border-ink/30 bg-paper-2/35 p-4 sm:p-5">
              <SectionHead index="IV" title="常见问题" en="FAQ" />
              <div className="mt-2 divide-y divide-ink/15">
                {FAQ.map((item) => (
                  <details key={item.q} className="group py-2">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-[10.5px] font-medium">
                      <span className="font-mono text-[8px] text-red group-open:text-ink">Q</span>
                      {item.q}
                      <span className="ml-auto font-mono text-[9px] text-ink/30 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-1.5 pl-5 text-[10px] leading-relaxed text-ink/55">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="border-[1.5px] border-ink bg-ink p-4 text-sheet">
              <div className="font-mono text-[8px] tracking-[0.16em] text-sheet/45">BEFORE YOU START</div>
              <h2 className="title-serif mt-1.5 text-[22px] leading-tight">三条约定</h2>
              <ol className="mt-3 space-y-2.5">
                {[
                  '不替别人念出他的私人档案。',
                  '不把故事里的角色等同于现实中的同学。',
                  '感到不适可以随时暂停、跳过或离开。',
                ].map((t, i) => (
                  <li key={t} className="flex gap-2 text-[10.5px] leading-relaxed text-sheet/75">
                    <span className="font-mono text-[8px] text-red-soft">0{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
              <p className="mt-3 border-t border-sheet/20 pt-2 font-mono text-[7.5px] leading-relaxed text-sheet/35">
                SAFETY OVER IMMERSION / 安全优先于沉浸
              </p>
            </section>

            <section className="frame-double bg-sheet p-4">
              <div className="label-mono text-ink/45">AI DM / 四种状态</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {[
                  ['叙述', '介绍场景与任务'],
                  ['倾听', '等待玩家讨论'],
                  ['回应', '呈现选择后果'],
                  ['复盘', '提出讨论问题'],
                ].map(([name, desc]) => (
                  <div key={name} className="border border-ink/25 p-2">
                    <div className="text-[10.5px] font-medium">{name}</div>
                    <div className="mt-0.5 text-[8px] text-ink/40">{desc}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[8.5px] leading-relaxed text-ink/40">
                AI DM「管理员·零」是虚构的档案管理员，不是心理老师，也不能替你们判断谁对谁错。
              </p>
            </section>

            <section className="border border-ink/30 bg-sheet/70 p-4">
              <div className="label-mono text-ink/45">FOR TEACHERS / 给老师</div>
              <p className="mt-1.5 text-[9.5px] leading-relaxed text-ink/50">
                教师端可以编排座位、查看本机进度、暂停故事、填写接管备注、导出课堂转写，并获取复盘问题。
                剧本工坊可在课前修改或本地生成新幕。教师端不生成学生心理诊断或霸凌风险等级。
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                <button type="button" className="ink-btn ink-btn-solid justify-center" onClick={() => navigate('/seats')}>
                  进入课堂模式 →
                </button>
                <button type="button" className="ink-btn justify-center" onClick={() => navigate('/teacher')}>
                  打开教师端
                </button>
                <button type="button" className="ink-btn justify-center" onClick={() => navigate('/studio')}>
                  打开剧本工坊
                </button>
                <button type="button" className="ink-btn justify-center" onClick={() => navigate('/about')}>
                  查看项目档案
                </button>
              </div>
            </section>

            <div className="flex flex-wrap gap-1.5">
              <Chip tone="line">本地规则引擎</Chip>
              <Chip tone="line">一台设备</Chip>
              <Chip tone="line">轮流开麦</Chip>
              <Chip tone="line">无云端</Chip>
              <Chip tone="red">虚构故事</Chip>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
