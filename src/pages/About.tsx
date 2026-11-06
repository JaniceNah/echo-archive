import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, SectionHead, Stamp } from '../components/ui'
import { STOCK_CHARACTERS, STOCK_SCENES } from '../data/storyArt'

const PROP_SHEET = [
  ['钥匙', 'key'],
  ['笔记本', 'notebook'],
  ['羽毛笔', 'quill'],
  ['信封', 'envelope'],
  ['记录册', 'scroll'],
  ['羊皮纸', 'parchment'],
].map(([label, key]) => ({ label, src: `/assets/yinian/props/${key}.webp` }))

const PAGES: Array<[string, string, string]> = [
  ['/', '主菜单', '复古全屏菜单、四入口、DM 状态面板、故事槽位'],
  ['/stories', '故事档案', '档案台账式列表、完整/演示标识、课堂模式入口'],
  ['/seats', '课堂模式', '一台设备说明、档案选择、进入座位编排'],
  ['/seats/:storyId', '课堂座位设置', '4–6 个座位、角色互换、课前批量打印全部角色档案'],
  ['/classroom', '课堂大屏', '轮流开麦、逐座行动与汇总反馈、热敏纸模拟打印、转写与暂停'],
  ['/studio', '剧本工坊', '可视化编辑、本地模板生成、待生效保存、JSON 导入导出'],
  ['/ending', '结局报告', '事件报告、后果、复盘问题、决策记录'],
  ['/summary', '学习总结', '本局摘要、私人三句话、退出并清除本机记录'],
  ['/teacher', '教师端', '设置、进度、暂停/接管、复盘材料'],
  ['/help', '使用说明', '流程、打印、AI 边界、安全约定'],
  ['/about', '项目档案', '信息架构、流程、页面清单、视觉规范、扩展说明'],
]

const TOKENS = [
  ['纸面', '#eae8e2 / #e1dfd8', 'bg-paper'],
  ['档案纸', '#f5f3ed', 'bg-sheet'],
  ['墨色', '#191a1c', 'text-ink'],
  ['低饱和红', '#8a3a31', 'text-red'],
  ['黄铜', '#8a7b66', 'text-brass'],
]

export function About() {
  const navigate = useNavigate()
  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/menu')} className="hover:text-ink">← 主菜单</button>
          <span>/</span>
          <span>PROJECT FILE / YN-DOC-00</span>
          <span className="ml-auto border border-ink/40 px-1.5 py-0.5">HCI COURSE PROTOTYPE</span>
        </div>

        <header className="frame-double mt-3 bg-sheet p-4 shadow-hard sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="label-mono text-red">ECHO OF A THOUGHT / 项目档案</div>
              <h1 className="title-serif mt-1 text-[38px] leading-[0.95] sm:text-[56px]">一念回响</h1>
              <p className="mt-1 font-mono text-[10px] tracking-[0.22em] text-ink/40">EVERY CHOICE LEAVES A TRACE.</p>
              <p className="mt-3 max-w-[760px] text-[12px] leading-relaxed text-ink/65">
                面向 12–16 岁学生的多人互动叙事与情绪教育系统原型。AI DM 带领 4–6 名玩家完成多幕故事，
                在家庭、学业、师生、同伴与网络生活等情境中，练习识别情绪、表达立场与承担选择的后果。
                课堂版把同一台教室大屏交给老师操作，学生按座位轮流开麦并各自行动一次，全部行动共同影响后续幕与结局；剧本可课前修改或本地生成。
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip tone="ink">React + TypeScript</Chip>
                <Chip tone="line">本地规则引擎</Chip>
                <Chip tone="line">一台设备 · 课堂大屏</Chip>
                <Chip tone="line">Zustand 持久化</Chip>
                <Chip tone="red">无真实 AI API</Chip>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Stamp tone="red" rotate={false} className="px-3 py-2 text-[12px]">原型 / PROTOTYPE</Stamp>
              <div className="text-right font-mono text-[8px] leading-relaxed text-ink/35">
                YN-2026<br />V1.0 / LOCAL BUILD<br />FICTION ONLY
              </div>
            </div>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4">
            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="I" title="信息架构" en="INFORMATION ARCHITECTURE" />
              <pre className="mt-3 overflow-x-auto border border-ink/20 bg-paper-2/40 p-3 font-mono text-[9.5px] leading-[1.8] text-ink/65">{`一念回响
├─ 主菜单 ── 故事档案 / 继续课堂 / 课堂模式 / 剧本工坊 / 说明 / 教师入口
├─ 课堂模式 ── 编排座位 → 课前打印 → 课堂大屏
│   ├─ 座位编排：4–6 座 / 角色分配 / 只显示公开身份
│   ├─ 课前档案：热敏纸模拟 + 文字遮蔽，批量打印全部角色档案
│   ├─ 座位话筒：一次一支 / 语音识别 / 模拟发言兜底
│   ├─ 屏幕候选确认：每座确认一次本幕行动，全部行动后汇总
│   └─ 课堂转写：只存文字 / 教师端导出
├─ 剧本工坊 ── 编辑幕与选项 / 本地模板生成 / 待生效 / JSON
├─ 故事档案 ── A/D/E 完整本（3–5 幕）· B/C 演示片段
├─ 结局报告 ── 经过 / 后果 / 复盘问题 / 决策记录
│   └─ 学习总结 ── 本局摘要 / 私人反思 / 退出角色
└─ 教师端 ── 设置 / 进度 / 暂停 / 接管 / 转写 / 复盘材料`}</pre>
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="II" title="核心用户流程" en="PRIMARY FLOW" right={<FileTag>学生视角</FileTag>} />
              <div className="mt-3 flex flex-col gap-1.5">
                {[
                  ['选择档案', '阅读题材、人数与完整度标识'],
                  ['编排座位', '确定 4–6 个座位并分配角色'],
                  ['打印课前档案', '热敏纸模拟后一次输出全部角色档案'],
                  ['分发与入座', '按座位号发放纸质档案'],
                  ['轮流开麦', '一次一支话筒，识别文字进入候选'],
                  ['逐座确认', '每个座位确认一次本幕行动'],
                  ['汇总反馈', 'AI DM 呈现状态变化与新线索'],
                  ['完成全部幕', '生成事件报告与结局'],
                  ['复盘与总结', '教师回看转写，班级完成学习总结'],
                ].map(([title, desc], i) => (
                  <div key={title} className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center border border-ink/40 bg-paper font-mono text-[8px]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1 border border-ink/20 px-2.5 py-1.5">
                      <span className="text-[10.5px] font-medium">{title}</span>
                      <span className="ml-2 text-[9.5px] text-ink/45">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-ink/25 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label-mono text-red">课堂模式 / ONE DEVICE</span>
                  <span className="font-mono text-[7.5px] text-ink/35">SHARED SCREEN FLOW</span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {[
                    ['编排座位', '只显示公开身份，角色冲突自动互换'],
                    ['轮流开麦', '一次一支话筒，识别文字本机保存'],
                    ['逐座行动', '语音或点选先进入候选栏；每座确认一次，自动轮到下一位'],
                    ['课前档案', '热敏纸模拟照常显示，私人文字遮蔽后按座位分发'],
                    ['改本与复盘', '剧本工坊改本；教师端导出转写'],
                  ].map(([title, desc], i) => (
                    <div key={title} className="flex items-center gap-2 border border-ink/20 bg-paper-2/25 px-2 py-1.5">
                      <span className="font-mono text-[8px] text-red">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[10px] font-medium">{title}</span>
                      <span className="ml-auto text-right text-[8.5px] text-ink/40">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="III" title="页面清单" en="SCREEN INVENTORY" right={<FileTag>{PAGES.length} ROUTES</FileTag>} />
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ink">
                      <th className="py-1.5 pr-2 font-mono text-[8px] tracking-[0.1em] text-ink/40">ROUTE</th>
                      <th className="py-1.5 pr-2 text-[9.5px] text-ink/40">页面</th>
                      <th className="py-1.5 text-[9.5px] text-ink/40">关键内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAGES.map(([route, name, desc]) => (
                      <tr key={route} className="border-b border-dotted border-ink/20">
                        <td className="py-1.5 pr-2 align-top font-mono text-[8px] text-red whitespace-nowrap">{route}</td>
                        <td className="py-1.5 pr-2 align-top text-[10px] whitespace-nowrap">{name}</td>
                        <td className="py-1.5 align-top text-[9px] leading-relaxed text-ink/50">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[8.5px] leading-relaxed text-ink/40">
                单人剧情相关页面（/setup、/roles、/game、/game/clues、/replay、/compare）仍保留在代码中，
                但界面不再提供入口；当前版本只开放课堂大屏模式。
              </p>
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="IV" title="技术实现" en="IMPLEMENTATION" />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ['前端', 'Vite 8 + React 19 + TypeScript strict + Tailwind CSS v4'],
                  ['路由', 'React Router HashRouter，便于本地直接打开与应用内演示'],
                  ['状态', 'Zustand + persist，本机 localStorage 保存本局'],
                  ['叙事引擎', '本地规则表 + 预写分支 + 状态函数，无网络请求'],
                  ['课堂模式', '座位状态 + 一次一支话筒 + Web Speech API（失败回退模拟）+ 逐座行动与汇总反馈'],
                  ['剧本工坊', '可视化编辑 + 本地模板拼装 + 待生效注册表 + JSON 校验与导入导出'],
                  ['打印', 'React Portal 到 #print-portal，浏览器打印样式 + 热敏纸模拟'],
                  ['课前档案打印', '批量 buildProfile + Portal 多页输出 + 打印记录归档'],
                ].map(([title, desc]) => (
                  <div key={title} className="border border-ink/25 p-2.5">
                    <div className="font-mono text-[8px] tracking-[0.1em] text-red">{title}</div>
                    <p className="mt-1 text-[9.5px] leading-relaxed text-ink/55">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="V" title="扩展说明" en="EXTENSION NOTES" right={<FileTag>未实装</FileTag>} />
              <div className="mt-3 space-y-3">
                <div className="border-l-2 border-red/60 bg-red/[0.04] px-3 py-2">
                  <div className="label-mono text-red/80">A. 接入真实 AI</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/60">
                    前端只发送「故事状态 + 当前幕 + 已发生选择」到自有服务端，由服务端持有 API 密钥并调用大模型；
                    返回内容必须经过结构化校验与内容安全过滤。原型阶段的所有叙述来自本地预写分支。
                  </p>
                </div>
                <div className="border-l-2 border-brass/60 bg-brass/[0.05] px-3 py-2">
                  <div className="label-mono text-brass">B. 真实热敏打印</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/60">
                    通过本地打印服务或蓝牙/USB 驱动把 MaterialSheet 转为 58mm 热敏指令。
                    需要处理纸张宽度、折行、条形码与离线重试；打印队列应保留材料编号，避免重复归档。
                  </p>
                </div>
                <div className="border-l-2 border-ink/40 bg-paper-2/40 px-3 py-2">
                  <div className="label-mono text-ink/50">C. 多设备课堂（未实装）</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/60">
                    当前课堂版是「一台设备 + 大屏 + 座位话筒」，数据都在本机。若要让每名玩家用自己的设备，
                    还需要一局一个会话码、教师端只读汇总、实时同步与角色私人档案的端到端隔离。
                  </p>
                </div>
                <div className="border-l-2 border-ink/40 bg-paper-2/40 px-3 py-2">
                  <div className="label-mono text-ink/50">D. 接入真实语音识别 / 大模型</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/60">
                    当前使用浏览器 Web Speech API，失败时回退到模拟发言；剧本生成是本地模板拼装。
                    真实部署需要自有服务端持有密钥、做转写纠错、内容安全过滤与课堂数据的最小化保存。
                  </p>
                </div>
                <div className="border-l-2 border-ink/40 bg-paper-2/40 px-3 py-2">
                  <div className="label-mono text-ink/50">E. 完整 B/C 故事</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/60">
                    B《替罪者协议》与 C《回声审判》目前只有第一幕与演示结局，页面明确标注「演示片段」。
                    扩展时需要补齐三幕、分支结局与线索库，并保持与 A/D/E 相同的打印材料结构。
                  </p>
                </div>
              </div>
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead
                index="VI"
                title="插画素材"
                en="ART LIBRARY"
                right={<FileTag>AI 生成 / 本地加载</FileTag>}
              />
              <p className="mt-2.5 text-[10px] leading-relaxed text-ink/55">
                剧情场景、角色图版与物证插画均为本项目的生成素材，随页面离线加载，不请求外部图床。
                已用于故事封面、沉浸式剧情、角色领取与证据打印；下列为尚未分配的备用素材。
              </p>

              <div className="mt-3">
                <div className="label-mono text-ink/45">SCENES / 备用场景底片</div>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {STOCK_SCENES.map((scene) => (
                    <figure key={scene.src} className="relative h-[92px] overflow-hidden border border-ink/35">
                      <img src={scene.src} alt={scene.label} className="h-full w-full object-cover object-[center_42%]" loading="lazy" />
                      <figcaption className="absolute bottom-1 left-1 border border-ink/30 bg-sheet/85 px-1 py-0.5 font-mono text-[7px] tracking-[0.08em] text-ink/60">
                        {scene.label}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
                <div>
                  <div className="label-mono text-ink/45">CAST / 备用角色</div>
                  <div className="mt-1.5 flex gap-1">
                    {STOCK_CHARACTERS.map((character) => (
                      <div key={character.src} className="h-[92px] flex-1 overflow-hidden border border-ink/40 bg-paper-2/40">
                        <img
                          src={character.src}
                          alt={character.label}
                          className="h-full w-full object-contain object-bottom"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label-mono text-ink/45">PROPS / 物证图版</div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1">
                    {PROP_SHEET.map((prop) => (
                      <div
                        key={prop.src}
                        className="flex h-[46px] items-center justify-center border border-ink/30 bg-paper-2/40"
                        title={prop.label}
                      >
                        <img src={prop.src} alt={prop.label} className="h-full w-full object-contain p-1" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="frame-double bg-sheet p-4">
              <div className="label-mono text-ink/45">VISUAL SPEC / 视觉规范</div>
              <div className="mt-2 space-y-1.5">
                {TOKENS.map(([name, hex, cls]) => (
                  <div key={name} className="flex items-center gap-2 border-b border-dotted border-ink/20 pb-1.5">
                    <span className={`size-5 shrink-0 border border-ink/30 ${cls.includes('text') ? cls.replace('text-', 'bg-') : cls}`} />
                    <span className="text-[10px]">{name}</span>
                    <span className="ml-auto font-mono text-[8px] text-ink/40">{hex}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-ink/20 pt-2">
                <div className="text-[9px] leading-relaxed text-ink/50">
                  复古档案界面：双线边框、硬阴影、半调网点、扫描线、票据纸、打字机叙事；
                  页面版式按内容区分——菜单、台账、表单、档案墙、视觉小说、事件报告、时间线。
                  标题使用宋体/衬线，正文保持中文可读，不使用高饱和渐变或玻璃拟态。
                </div>
              </div>
            </section>

            <section className="border border-ink/30 bg-paper-2/35 p-4">
              <div className="label-mono text-ink/45">STATUS / 完成度</div>
              <ul className="mt-2 space-y-1.5">
                {[
                  ['首页与主菜单', true],
                  ['故事选择与课堂座位编排', true],
                  ['课前角色档案批量打印', true],
                  ['A/D/E 完整多幕', true],
                  ['AI DM / 行动 / 反馈', true],
                  ['线索、打印、结局', true],
                  ['教师端基础能力', true],
                  ['一台设备 · 课堂大屏', true],
                  ['座位话筒与语音确认', true],
                  ['剧本工坊与 JSON', true],
                  ['课堂转写与导出', true],
                  ['B/C 完整故事', false],
                  ['多设备课堂 / 真实 AI / 热敏硬件', false],
                ].map(([label, done]) => (
                  <li key={String(label)} className="flex items-center gap-2 text-[9.5px]">
                    <span className={`font-mono text-[8px] ${done ? 'text-ink' : 'text-red'}`}>
                      {done ? '■' : '□'}
                    </span>
                    <span className={done ? 'text-ink/65' : 'text-ink/45'}>{label}</span>
                    {!done && <span className="ml-auto font-mono text-[7px] text-red">DEMO</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-dotted border-ink/25 pt-2 text-[8px] leading-relaxed text-ink/40">
                未完成项在界面上均明确标注，不伪装为已实装。
              </p>
            </section>

            <section className="border-[1.5px] border-ink bg-ink p-4 text-sheet">
              <div className="font-mono text-[8px] tracking-[0.16em] text-sheet/45">CONTEXT / 项目背景</div>
              <p className="mt-2 text-[10px] leading-relaxed text-sheet/70">
                交互设计课程项目原型。目标是探索：AI 如何在结构化叙事中支持情绪表达，
                同时不越界成为心理诊断工具。
              </p>
              <p className="mt-2 text-[9px] leading-relaxed text-sheet/45">
                所有故事、角色与机构均为虚构。系统不生成真实学生的人格评分、心理诊断或霸凌风险等级，
                不采集真实身份信息。
              </p>
            </section>

            <div className="flex flex-col gap-1.5">
              <button type="button" className="ink-btn justify-center" onClick={() => navigate('/help')}>
                打开使用说明
              </button>
              <button type="button" className="ink-btn justify-center" onClick={() => navigate('/studio')}>
                打开剧本工坊
              </button>
              <button type="button" className="ink-btn ink-btn-solid justify-center" onClick={() => navigate('/seats')}>
                进入课堂模式 →
              </button>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
