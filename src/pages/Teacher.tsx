import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, Meter, SectionHead, Segmented, Stamp, Toggle } from '../components/ui'
import { getStory } from '../data/stories'
import { TEACHER_ART } from '../data/storyArt'
import { describeEffects } from '../logic/engine'
import { useGameStore } from '../store/useGameStore'
import { EFFECT_META, type EffectKey, type GamePhase } from '../types'

const PHASE_LABEL: Record<GamePhase, string> = {
  brief: 'AI DM 叙述 / 剧情介绍',
  choice: '玩家讨论 / 等待行动选择',
  feedback: 'AI 剧情反馈',
  actend: '幕末小结',
  ending: '结局报告',
}

const THEMES = ['同伴关系与群体压力', '家庭沟通与期待', '学业压力与自我评价', '师生信任', '网络生活与传播责任']

const DEBRIEF_QUESTIONS = [
  '哪个选择让当事人被保护了？哪个选择让更多人被卷进来？',
  '有没有一个时刻，所有人都觉得自己「没有恶意」，但事情仍然变糟了？',
  '如果班级里只能增加一条新的处理方式，你们会加什么？',
  '如果换一个座位、换一种介入方式，后续的处境可能会怎样不同？',
]

export function Teacher() {
  const navigate = useNavigate()
  const state = useGameStore()
  const teacher = state.teacher
  const setTeacher = useGameStore((s) => s.setTeacher)
  const setDevice = useGameStore((s) => s.setDevice)
  const setPaused = useGameStore((s) => s.setPaused)
  const setTakeoverNote = useGameStore((s) => s.setTakeoverNote)
  const setSkipSensitive = useGameStore((s) => s.setSkipSensitive)
  const teacherAdvance = useGameStore((s) => s.teacherAdvance)
  const clearTranscripts = useGameStore((s) => s.clearTranscripts)
  const story = getStory(state.storyId)
  const role = story?.characters.find((c) => c.id === state.roleId)
  const ending = story?.endings.find((e) => e.id === state.endingId)
  const currentAct = story?.acts[state.actIndex]
  const nextAct = story?.acts[state.actIndex + 1]
  const [note, setNote] = useState(state.takeoverNote ?? '')
  const [noteSaved, setNoteSaved] = useState(false)
  const [clearTranscriptsArmed, setClearTranscriptsArmed] = useState(false)

  const hasSession = Boolean(story && role && state.mode === 'classroom')
  const transcript = state.transcripts

  const saveNote = () => {
    setTakeoverNote(note.trim() ? note.trim() : null)
    setNoteSaved(true)
    window.setTimeout(() => setNoteSaved(false), 1600)
  }

  const exportTranscripts = () => {
    if (transcript.length === 0) return
    const lines = [
      '一念回响 / 课堂语音转写',
      `故事：${story?.slot ?? ''} ${story?.title ?? ''}`,
      `导出时间：${new Date().toLocaleString('zh-CN')}`,
      '说明：仅保存识别出的文字，不保存音频；文件只包含虚构角色与课堂发言。',
      '',
      ...transcript.map(
        (line) =>
          `[${new Date(line.at).toLocaleTimeString('zh-CN', { hour12: false })}] P${line.seat + 1} ${
            line.roleName
          }（${
            line.source === 'live' ? '实时识别' : line.source === 'local' ? '本地识别' : '模拟发言'
          }）：${line.text}`,
      ),
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `echo-transcript-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearAllTranscripts = () => {
    if (!clearTranscriptsArmed) {
      setClearTranscriptsArmed(true)
      return
    }
    clearTranscripts()
    setClearTranscriptsArmed(false)
  }

  return (
    <PageShell>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/menu')} className="hover:text-ink">
            ← 主菜单
          </button>
          <span>/</span>
          <span>TEACHER CONSOLE / 课堂控制台</span>
          <span className="ml-auto border border-ink/40 px-1.5 py-0.5">NO PSYCHOLOGICAL SCORING</span>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-b-[1.5px] border-ink pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label-mono text-red">EDUCATOR VIEW / 教师入口</div>
            <h1 className="title-serif mt-1 text-[34px] leading-none sm:text-[44px]">课堂控制台</h1>
            <p className="mt-2 max-w-[760px] text-[11.5px] leading-relaxed text-ink/55">
              这里只显示本机进行的虚构故事进度、玩家公开选择与打印材料。
              系统不生成学生人格评分、心理诊断或霸凌风险等级。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tone={hasSession ? 'ink' : 'line'}>{hasSession ? '本机有进行中的本局' : '本机暂无本局'}</Chip>
            <Chip tone="ink">课堂大屏模式</Chip>
            <Chip tone="line">{teacher.players} 人 · {teacher.duration} 分钟</Chip>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="frame-double flex gap-3 bg-sheet p-3">
              <div className="h-[112px] w-[76px] shrink-0 overflow-hidden border border-ink/50 bg-paper-2/60">
                <img src={TEACHER_ART} alt="课堂引导者形象" className="h-full w-full object-contain object-bottom" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="label-mono text-ink/45">EDUCATOR / 引导者</div>
                <h2 className="title-serif mt-1 text-[17px] leading-tight">课堂引导者</h2>
                <p className="mt-1 text-[9px] leading-relaxed text-ink/50">
                  虚构的引导者形象，代表「接管 AI DM」的教师角色，不对应任何真实教师身份。
                </p>
                <span className="mt-1.5 inline-block border border-ink/30 px-1 py-0.5 font-mono text-[7px] text-ink/45">
                  NOT A REAL PERSON
                </span>
              </div>
            </section>

            <section className="frame-double bg-sheet p-4">
              <SectionHead index="I" title="本局设置" en="SESSION SETTINGS" />
              <div className="mt-3 space-y-3">
                <div>
                  <div className="label-mono mb-1.5 text-ink/50">教育主题</div>
                  <div className="flex flex-wrap gap-1">
                    {THEMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTeacher({ theme: t })}
                        className={`border px-1.5 py-0.5 text-[9.5px] transition-colors ${
                          teacher.theme === t
                            ? 'border-ink bg-ink text-sheet'
                            : 'border-line-soft bg-sheet text-ink/60 hover:border-ink'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Segmented
                  label="参与人数"
                  value={teacher.players}
                  onChange={(players) => setTeacher({ players })}
                  options={[
                    { value: 4, label: '4 人', sub: '4 ROLES' },
                    { value: 5, label: '5 人', sub: '5 ROLES' },
                    { value: 6, label: '6 人', sub: '6 ROLES' },
                  ]}
                />
                <Segmented
                  label="课堂时长"
                  value={teacher.duration}
                  onChange={(duration) => setTeacher({ duration })}
                  options={[
                    { value: 35, label: '35 分钟', sub: '紧凑' },
                    { value: 45, label: '45 分钟', sub: '标准' },
                  ]}
                />
                <p className="text-[8.5px] leading-relaxed text-ink/40">
                  主题、人数与时长只影响下一局的开局设置；正在进行的一局不会被中途改写。
                </p>
              </div>
            </section>

            <section className="border border-ink/30 bg-paper-2/35 p-4">
              <div className="label-mono text-ink/45">DEVICE CHECK / 设备检查</div>
              <div className="mt-2 space-y-2">
                {[
                  { key: 'screen' as const, label: '教室大屏 / 投影', note: '一台设备供全班共用' },
                  { key: 'mic' as const, label: '座位话筒', note: '轮流开麦 · 真实识别失败可模拟' },
                  { key: 'printer' as const, label: '打印 / 热敏预览', note: '私人档案热敏纸模拟与文字遮蔽' },
                  { key: 'offline' as const, label: '离线可用', note: '本机规则引擎，不依赖网络' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2 border-b border-dotted border-ink/20 pb-1.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10.5px]">{item.label}</div>
                      <div className="text-[8px] text-ink/40">{item.note}</div>
                    </div>
                    <Toggle
                      checked={teacher.device[item.key]}
                      onChange={(v) => setDevice(item.key, v)}
                      label={item.label}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 font-mono text-[7.5px] leading-relaxed text-ink/35">
                CHECKLIST IS SELF-REPORTED / 不检测真实硬件
              </p>
            </section>

            <section className="frame-double bg-sheet p-4">
              <SectionHead index="C" title="课堂大屏" en="SHARED SCREEN" />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {[
                  ['模式', '课堂大屏'],
                  ['座位', `${state.seats.length} 个`],
                  ['开麦', `${state.seats.filter((seat) => seat.micOn && !seat.muted).length} 支`],
                  ['转写', `${transcript.length} 条`],
                ].map(([label, value]) => (
                  <div key={label} className="border border-ink/20 bg-paper-2/30 px-2 py-1">
                    <div className="font-mono text-[7px] tracking-[0.08em] text-ink/35">{label}</div>
                    <div className="mt-0.5 text-[10.5px]">{value}</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/classroom')}
                className="ink-btn ink-btn-solid mt-2 w-full"
              >
                进入课堂大屏 →
              </button>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/seats')}
                  className="ink-btn text-[9.5px]"
                >
                  编排座位
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/studio')}
                  className="ink-btn text-[9.5px]"
                >
                  剧本工坊
                </button>
              </div>
              <p className="mt-1.5 text-[8px] leading-relaxed text-ink/40">
                一台设备由老师统一操作。学生开麦的识别文字只保存在本机，不保存音频。
              </p>
            </section>

            <section className="frame-double bg-sheet p-4">
              <div className="label-mono text-ink/45">SAFETY / 课堂保护</div>
              <div className="mt-2 flex items-start gap-2 border border-ink/25 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px]">跳过敏感细节</div>
                  <p className="mt-0.5 text-[8.5px] leading-relaxed text-ink/40">
                    开启后，AI DM 会用概化语言替代冲突细节，剧情分支不受影响。
                  </p>
                </div>
                <Toggle
                  checked={state.skipSensitive || teacher.skipSensitive}
                  onChange={(v) => {
                    setSkipSensitive(v)
                    setTeacher({ skipSensitive: v })
                  }}
                  label="跳过敏感细节"
                />
              </div>
              <p className="mt-2 text-[8.5px] leading-relaxed text-ink/40">
                任何时候学生都可以暂停、找老师或退出。不要把「不参与」解释为不配合。
              </p>
            </section>
          </aside>

          <div className="min-w-0 space-y-4">
            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead
                index="II"
                title="当前剧情进度"
                en="LIVE PROGRESS"
                right={
                  hasSession ? (
                    <Stamp tone={state.phase === 'ending' ? 'ink' : 'brass'} rotate={false}>
                      {state.phase === 'ending' ? '已结束' : state.paused ? '已暂停' : '进行中'}
                    </Stamp>
                  ) : (
                    <FileTag>NO ACTIVE SESSION</FileTag>
                  )
                }
              />

              {hasSession && story ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ['故事', `${story.slot} ${story.title}`],
                      ['座位', `${state.seats.length} 个座位`],
                      ['当前幕', currentAct ? `第 ${currentAct.no} 幕` : '结局'],
                      ['已完成选择', `${state.history.length} 次`],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-ink/20 bg-paper-2/30 px-2 py-1.5">
                        <div className="font-mono text-[7.5px] tracking-[0.08em] text-ink/35">{label}</div>
                        <div className="mt-0.5 truncate text-[10.5px] text-ink/70">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 border-[1.5px] border-ink bg-paper p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[8px] tracking-[0.14em] text-red">
                        {currentAct ? `ACT ${String(currentAct.no).padStart(2, '0')}` : 'ENDING'}
                      </span>
                      <span className="text-[12px]">{ending ? `结局 · ${ending.title}` : currentAct?.title}</span>
                      <span className="ml-auto border border-ink/30 px-1.5 py-0.5 font-mono text-[8px] text-ink/50">
                        {PHASE_LABEL[state.phase]}
                      </span>
                    </div>
                    {ending ? (
                      <p className="mt-2 text-[10.5px] leading-relaxed text-ink/60">{ending.summary}</p>
                    ) : (
                      <p className="mt-2 text-[10.5px] leading-relaxed text-ink/60">{currentAct?.task}</p>
                    )}
                    {state.paused && (
                      <p className="mt-2 border-l-2 border-red bg-red/[0.05] px-2 py-1 text-[9.5px] text-ink/55">
                        本局已被{state.pausedBy === 'teacher' ? '教师' : '学生'}暂停。暂停不会丢失进度。
                      </p>
                    )}
                    {state.takeoverNote && (
                      <p className="mt-2 border border-brass/50 bg-brass/[0.06] px-2 py-1.5 text-[9.5px] leading-relaxed text-ink/60">
                        <span className="font-mono text-[7.5px] text-brass">人工接管备注 / </span>
                        {state.takeoverNote}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="border border-ink/20 p-2.5">
                      <div className="label-mono text-ink/40">NEXT ACT / 下一幕预览</div>
                      {nextAct ? (
                        <>
                          <p className="mt-1 text-[10.5px]">第 {nextAct.no} 幕「{nextAct.title}」</p>
                          <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-ink/45">{nextAct.setting}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-[10.5px] text-ink/50">没有下一幕，本局将进入结局。</p>
                      )}
                    </div>
                    <div className="border border-ink/20 p-2.5">
                      <div className="label-mono text-ink/40">CLUES / 线索</div>
                      <p className="mt-1 font-mono text-[16px] tabular-nums">{state.clues.length}</p>
                      <p className="text-[8.5px] text-ink/40">已归档 · 可在剧情页查看</p>
                    </div>
                    <div className="border border-ink/20 p-2.5">
                      <div className="label-mono text-ink/40">PRINTS / 打印</div>
                      <p className="mt-1 font-mono text-[16px] tabular-nums">{state.prints.length}</p>
                      <p className="text-[8.5px] text-ink/40">份已保存材料</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/25 pt-3">
                    {state.phase === 'ending' ? (
                      <>
                        <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/ending')}>
                          查看结局报告 →
                        </button>
                        <button type="button" className="ink-btn" onClick={() => navigate('/summary')}>
                          学习总结
                        </button>
                      </>
                    ) : (
                      <>
                        {state.paused ? (
                          <button type="button" className="ink-btn ink-btn-solid" onClick={() => setPaused(false)}>
                            ▶ 恢复本局
                          </button>
                        ) : (
                          <button type="button" className="ink-btn" onClick={() => setPaused(true, 'teacher')}>
                            ⏸ 教师暂停
                          </button>
                        )}
                        <button type="button" className="ink-btn" onClick={teacherAdvance}>
                          ⏭ 推进当前阶段
                        </button>
                        <button
                          type="button"
                          className="ink-btn"
                          onClick={() => navigate('/classroom')}
                        >
                          进入课堂大屏 ↗
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 font-mono text-[7.5px] text-ink/30">
                    TEACHER ADVANCE ONLY MOVES THE LOCAL DEMO STAGE / 不控制真实教室设备
                  </p>
                </>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center border border-dashed border-ink/30 px-4 py-8 text-center">
                  <span className="stamp-square size-9 text-[16px] text-ink/25">0</span>
                  <p className="mt-2 text-[11px] text-ink/55">本机还没有开始一局故事。</p>
                  <p className="mt-1 max-w-[360px] text-[9.5px] leading-relaxed text-ink/40">
                    先在课堂模式编排座位并打印课前档案。教师端会自动读取本机进度，不需要登录或云端账号。
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button type="button" className="ink-btn ink-btn-solid" onClick={() => navigate('/seats')}>
                      进入课堂模式 →
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="III" title="人工接管备注" en="MANUAL TAKEOVER NOTE" right={<FileTag>仅本机可见</FileTag>} />
              <p className="mt-2 text-[9.5px] leading-relaxed text-ink/45">
                记录你需要人工处理的原因，例如「学生希望跳过冲突片段」「班级需要先讨论现实中的一件事」。
                备注会显示在剧情界面的接管提示条上，不会写入学生档案。
              </p>
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value)
                  setNoteSaved(false)
                }}
                rows={3}
                placeholder="例如：暂停 3 分钟，先确认是否有人需要离开教室。"
                className="mt-2 w-full resize-none border border-ink/30 bg-paper/70 px-2.5 py-2 text-[11px] leading-relaxed outline-none placeholder:text-ink/25 focus:border-ink"
              />
              <div className="mt-2 flex items-center gap-2">
                <button type="button" className="ink-btn" onClick={saveNote}>
                  保存接管备注
                </button>
                {noteSaved && <span className="font-mono text-[8px] text-ink/45">已保存到本机</span>}
                <span className="ml-auto font-mono text-[7.5px] text-ink/30">NOT SENT ANYWHERE</span>
              </div>
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead
                index="IV"
                title="课堂语音转写"
                en="SPEECH TRANSCRIPT"
                right={<FileTag>仅文字 · 仅本机</FileTag>}
              />
              <p className="mt-2 text-[9.5px] leading-relaxed text-ink/45">
                课堂模式中，学生每次开麦的识别文字会记录在这里，供课后复盘。系统只保存文字，不保存音频，
                也不会上传。实时识别不可用时，模拟发言会以「模拟」标记。
              </p>
              {transcript.length > 0 ? (
                <>
                  <div className="mt-2 max-h-[300px] overflow-y-auto border border-ink/25 bg-paper/55">
                    {transcript.slice(-60).map((line) => (
                      <div
                        key={line.id}
                        className="flex items-start gap-2 border-b border-dotted border-ink/20 px-2 py-1.5 last:border-b-0"
                      >
                        <span className="w-7 shrink-0 font-mono text-[8px] text-red">
                          P{line.seat + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[7.5px] text-ink/40">
                            <span>{line.roleName}</span>
                            <span
                              className={`border px-1 ${
                                line.source === 'simulated'
                                  ? 'border-brass/50 text-brass'
                                  : 'border-ink/40 text-ink/55'
                              }`}
                            >
                              {line.source === 'live' ? '实时' : line.source === 'local' ? '本地' : '模拟'}
                            </span>
                            <span className="ml-auto">
                              {new Date(line.at).toLocaleTimeString('zh-CN', { hour12: false })}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-ink/70">{line.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={exportTranscripts} className="ink-btn">
                      导出转写 TXT
                    </button>
                    <button
                      type="button"
                      onClick={clearAllTranscripts}
                      className={`ink-btn ${clearTranscriptsArmed ? 'border-red text-red' : ''}`}
                    >
                      {clearTranscriptsArmed ? '确认清空转写' : '清空转写'}
                    </button>
                    <span className="ml-auto font-mono text-[7.5px] text-ink/35">
                      {transcript.length} LINES / TEXT ONLY
                    </span>
                  </div>
                  <p className="mt-1.5 text-[8.5px] leading-relaxed text-ink/40">
                    清空只删除本机转写，不影响剧情进度、打印记录或已保存的剧本。
                  </p>
                </>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2 border border-dashed border-ink/25 px-3 py-2.5">
                  <p className="min-w-0 flex-1 text-[9.5px] leading-relaxed text-ink/45">
                    还没有转写记录。进入课堂大屏并让学生开麦后，这里会显示逐人发言的文字。
                  </p>
                  <button type="button" className="ink-btn" onClick={() => navigate('/seats')}>
                    编排课堂 →
                  </button>
                </div>
              )}
            </section>

            <section className="frame-double bg-sheet p-4 sm:p-5">
              <SectionHead index="V" title="复盘材料" en="DEBRIEF MATERIAL" right={<FileTag>面向课堂讨论</FileTag>} />
              {hasSession && state.history.length ? (
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div>
                    <div className="label-mono text-ink/45">CHOICE LOG / 公开选择记录</div>
                    <ol className="mt-1.5 space-y-1.5">
                      {state.history.map((h, i) => (
                        <li key={`${i}-${h.actIndex}-${h.choiceId}`} className="border-b border-dotted border-ink/20 pb-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-[7.5px] text-red">A{h.actNo}</span>
                            {typeof h.seat === 'number' && (
                              <span className="font-mono text-[7.5px] text-ink/45">P{h.seat + 1}</span>
                            )}
                            <span className="text-[10.5px]">{h.choiceTitle}</span>
                            <span className="ml-auto font-mono text-[7.5px] text-ink/35">{h.actor}</span>
                          </div>
                          <p className="mt-0.5 text-[8.5px] text-ink/40">{describeEffects(h.effects)}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="label-mono text-ink/45">DEBRIEF PROMPTS / 复盘问题</div>
                    <ol className="mt-1.5 space-y-2">
                      {DEBRIEF_QUESTIONS.map((q, i) => (
                        <li key={q} className="flex gap-2 text-[10px] leading-relaxed text-ink/65">
                          <span className="font-mono text-[8px] text-red">0{i + 1}</span>
                          {q}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-2 border border-ink/20 bg-paper-2/40 px-2 py-1.5 text-[8.5px] leading-relaxed text-ink/45">
                      讨论时请对事不对人。不要要求学生解释「你为什么没有选那个更好的选项」。
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[10.5px] text-ink/45">完成至少一次行动选择后，这里会生成本局公开的行动记录与讨论问题。</p>
              )}

              {hasSession && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(EFFECT_META) as EffectKey[]).map((key) => (
                    <Meter
                      key={key}
                      label={EFFECT_META[key].label}
                      en={EFFECT_META[key].en}
                      value={state.stats[key]}
                      tone={key === 'tension' ? 'red' : 'ink'}
                    />
                  ))}
                </div>
              )}
              <p className="mt-3 border-t border-dashed border-ink/25 pt-2 text-[8.5px] leading-relaxed text-ink/40">
                以上数值只描述虚构班级的叙事状态，用于讨论故事如何变化。它们不是学生测评，
                不得用于评价真实学生的心理健康、人际关系或品行。
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
