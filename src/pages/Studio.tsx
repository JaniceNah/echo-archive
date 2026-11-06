import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { Chip, FileTag, SectionHead, Stamp, Toggle } from '../components/ui'
import { STORIES, getStory } from '../data/stories'
import {
  customStatus,
  deletePendingStory,
  discardPendingStory,
  exportStoryJson,
  getPendingStory,
  parseStoryJson,
  pendingKind,
  savePendingStory,
  validateStory,
} from '../logic/customStories'
import { generateActDraft, generationNotes } from '../logic/generator'
import { EFFECT_META, type Act, type Choice, type EffectKey, type Story } from '../types'

const INPUT =
  'w-full border border-ink/35 bg-sheet px-2 py-1.5 text-[11.5px] leading-relaxed outline-none transition-colors placeholder:text-ink/25 focus:border-ink'
const LABEL = 'label-mono text-ink/40'
const EFFECT_KEYS = Object.keys(EFFECT_META) as EffectKey[]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function builtinStory(id: string): Story {
  return STORIES.find((story) => story.id === id) ?? STORIES[0]
}

function storySource(id: string): Story {
  const pending = getPendingStory(id)
  if (pending) return pending
  if (pendingKind(id) === 'delete') return builtinStory(id)
  return getStory(id) ?? builtinStory(id)
}

function parseList(raw: string): string[] {
  return raw
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

let seed = 0

function newChoice(title: string): Choice {
  seed += 1
  return {
    id: `edit-choice-${Date.now().toString(36)}-${seed}`,
    title,
    intent: '',
    description: '',
    effects: { trust: 4 },
    flags: [],
    feedback: '',
    observerLine: '',
    printBody: [''],
  }
}

function blankAct(story: Story, no: number): Act {
  seed += 1
  return {
    id: `edit-act-${Date.now().toString(36)}-${seed}`,
    no,
    code: `${story.slot}-${String(no).padStart(2, '0')}`,
    title: '未命名的一幕',
    en: `NEW ACT ${String(no).padStart(2, '0')}`,
    scene: '',
    time: '',
    setting: '',
    narration: [''],
    task: '',
    question: '你们准备先做哪一件事？',
    baseClueIds: [],
    choices: [newChoice('新行动一'), newChoice('新行动二')],
    closing: '',
  }
}

function renumber(acts: Act[]): Act[] {
  return acts.map((act, index) => ({ ...act, no: index + 1 }))
}

function Field({
  label,
  en,
  children,
  className = '',
}: {
  label: string
  en?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={LABEL}>{label}</span>
        {en && <span className="font-mono text-[7px] tracking-[0.12em] text-ink/30">{en}</span>}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function CsvInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string[]
  onChange: (next: string[]) => void
  ariaLabel: string
}) {
  const joined = value.join('、')
  const [text, setText] = useState(joined)

  useEffect(() => {
    setText((previous) =>
      parseList(previous).join('|') === value.join('|') ? previous : value.join('、'),
    )
  }, [joined, value])

  return (
    <input
      value={text}
      aria-label={ariaLabel}
      onChange={(event) => {
        setText(event.target.value)
        onChange(parseList(event.target.value))
      }}
      placeholder="用顿号或逗号分隔"
      className={INPUT}
    />
  )
}

function EffectField({
  effectKey,
  value,
  onChange,
}: {
  effectKey: EffectKey
  value: number
  onChange: (next: number) => void
}) {
  const meta = EFFECT_META[effectKey]
  const clamp = (next: number) => Math.max(-20, Math.min(20, Number.isFinite(next) ? next : 0))
  return (
    <div
      className={`border px-2 py-1.5 ${
        value === 0
          ? 'border-ink/20 bg-paper-2/25'
          : value > 0
            ? 'border-ink/40 bg-sheet'
            : 'border-red/35 bg-red/[0.035]'
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className={`text-[10px] ${value < 0 ? 'text-red' : ''}`}>{meta.label}</span>
        <span className="font-mono text-[7px] text-ink/30">{meta.en}</span>
      </div>
      <div className="mt-1 flex items-stretch gap-1">
        <button
          type="button"
          aria-label={`${meta.label}减少 1`}
          onClick={() => onChange(clamp(value - 1))}
          className="flex w-5 items-center justify-center border border-ink/30 text-[11px] leading-none hover:bg-ink hover:text-sheet"
        >
          −
        </button>
        <input
          type="number"
          aria-label={`${meta.label}效果值`}
          value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          className="w-full border border-ink/25 bg-transparent px-1 py-0.5 text-center font-mono text-[10px] tabular-nums outline-none focus:border-ink"
        />
        <button
          type="button"
          aria-label={`${meta.label}增加 1`}
          onClick={() => onChange(clamp(value + 1))}
          className="flex w-5 items-center justify-center border border-ink/30 text-[11px] leading-none hover:bg-ink hover:text-sheet"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function Studio() {
  const navigate = useNavigate()
  const initial = useMemo(() => storySource(STORIES[0].id), [])
  const [storyId, setStoryId] = useState(STORIES[0].id)
  const [draft, setDraft] = useState<Story>(() => clone(initial))
  const [actCursor, setActCursor] = useState(0)
  const [choiceCursor, setChoiceCursor] = useState(0)
  const [version, setVersion] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [themeInput, setThemeInput] = useState(initial.themes[0] ?? '同伴关系')
  const [genMode, setGenMode] = useState<'append' | 'replace'>('append')
  const [armDelete, setArmDelete] = useState<number | null>(null)
  const [resetArmed, setResetArmed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const source = useMemo(() => storySource(storyId), [storyId, version])
  const status = useMemo(() => customStatus(storyId), [storyId, version])
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(source),
    [draft, source],
  )
  const act = draft.acts[actCursor] ?? draft.acts[0]
  const choice = act?.choices[Math.min(choiceCursor, act.choices.length - 1)] ?? null
  const issues = useMemo(() => validateStory(draft), [draft])
  const warnings = useMemo(() => {
    const list: string[] = []
    if (!draft.playable) {
      list.push('「完整剧本」未开启：这一局会在第一幕结束时收束，后面的幕不会播放。')
    }
    if (draft.acts.length < 2) {
      list.push('目前只有一幕，适合片段演练；完整课堂建议至少三幕。')
    }
    return list
  }, [draft])

  const loadStory = (id: string) => {
    const next = storySource(id)
    setStoryId(id)
    setDraft(clone(next))
    setActCursor(0)
    setChoiceCursor(0)
    setThemeInput(next.themes[0] ?? '同伴关系')
    setFlash(null)
    setImportError(null)
    setArmDelete(null)
    setResetArmed(false)
  }

  const switchStory = (id: string) => {
    if (id === storyId) return
    if (dirty && !window.confirm('当前草稿有未保存的修改，切换档案会丢失这些修改。继续？')) return
    loadStory(id)
  }

  const patchDraft = (patch: Partial<Story>) => {
    setDraft((previous) => ({ ...previous, ...patch }))
    setFlash(null)
  }

  const patchAct = (patch: Partial<Act>) => {
    setDraft((previous) => ({
      ...previous,
      acts: previous.acts.map((item, index) => (index === actCursor ? { ...item, ...patch } : item)),
    }))
    setFlash(null)
  }

  const patchChoice = (patch: Partial<Choice>) => {
    if (!act) return
    setDraft((previous) => ({
      ...previous,
      acts: previous.acts.map((item, index) => {
        if (index !== actCursor) return item
        return {
          ...item,
          choices: item.choices.map((itemChoice, choiceIndex) =>
            choiceIndex === choiceCursor ? { ...itemChoice, ...patch } : itemChoice,
          ),
        }
      }),
    }))
    setFlash(null)
  }

  const selectAct = (index: number) => {
    setActCursor(index)
    setChoiceCursor(0)
    setArmDelete(null)
    setFlash(null)
  }

  const addBlank = () => {
    const next = blankAct(draft, draft.acts.length + 1)
    setDraft((previous) => ({ ...previous, acts: [...previous.acts, next] }))
    setActCursor(draft.acts.length)
    setChoiceCursor(0)
    setArmDelete(null)
    setFlash('已添加空白一幕。补全标题与两个以上行动选项后即可保存。')
  }

  const removeAct = () => {
    if (draft.acts.length <= 1) {
      setFlash('至少需要保留一幕，无法删除。')
      return
    }
    if (armDelete !== actCursor) {
      setArmDelete(actCursor)
      setFlash('再点一次「确认删除本幕」会从草稿中移除这一幕；保存前不会影响正在进行的课堂。')
      return
    }
    const next = renumber(draft.acts.filter((_, index) => index !== actCursor))
    setDraft((previous) => ({ ...previous, acts: next }))
    setActCursor(Math.max(0, Math.min(actCursor, next.length - 1)))
    setChoiceCursor(0)
    setArmDelete(null)
    setFlash('已从草稿删除这一幕。点「保存为待生效版本」后，下一次新局才会使用新的幕数。')
  }

  const addChoice = () => {
    if (!act) return
    const next = newChoice(`新行动 ${act.choices.length + 1}`)
    patchAct({ choices: [...act.choices, next] })
    setChoiceCursor(act.choices.length)
  }

  const removeChoice = () => {
    if (!act) return
    if (act.choices.length <= 2) {
      setFlash('每一幕至少保留两个行动选项。')
      return
    }
    const next = act.choices.filter((_, index) => index !== choiceCursor)
    patchAct({ choices: next })
    setChoiceCursor(Math.max(0, Math.min(choiceCursor, next.length - 1)))
  }

  const generate = () => {
    const theme = themeInput.trim() || draft.themes[0] || '同伴关系'
    if (genMode === 'replace') {
      const current = draft.acts[actCursor]
      const generated = generateActDraft(draft, {
        theme,
        previousTitle: draft.acts[actCursor - 1]?.title,
      })
      generated.no = actCursor + 1
      generated.code = current?.code ?? generated.code
      generated.en = current?.en ?? generated.en
      setDraft((previous) => ({
        ...previous,
        acts: previous.acts.map((item, index) => (index === actCursor ? generated : item)),
      }))
      setChoiceCursor(0)
      setFlash(`已用本地模板替换第 ${actCursor + 1} 幕草稿。请逐段改写，确认后再保存。`)
      return
    }
    const generated = generateActDraft(draft, {
      theme,
      previousTitle: draft.acts[draft.acts.length - 1]?.title,
    })
    const next = renumber([...draft.acts, generated])
    setDraft((previous) => ({ ...previous, acts: next }))
    setActCursor(next.length - 1)
    setChoiceCursor(0)
    setArmDelete(null)
    setFlash(`已追加第 ${next.length} 幕本地草稿。生成内容只是模板拼装，请先改写再保存。`)
  }

  const save = () => {
    if (issues.length > 0) {
      setFlash(`还差 ${issues.length} 项：${issues[0]}。补全前不会写入待生效版本。`)
      return
    }
    savePendingStory(draft)
    setVersion((value) => value + 1)
    setResetArmed(false)
    setFlash(
      '已保存为待生效版本。当前进行中的一局不受影响；下一次开始新局时会自动应用这份剧本。',
    )
  }

  const discard = () => {
    discardPendingStory(storyId)
    const next = storySource(storyId)
    setDraft(clone(next))
    setActCursor(0)
    setChoiceCursor(0)
    setThemeInput(next.themes[0] ?? '同伴关系')
    setVersion((value) => value + 1)
    setResetArmed(false)
    setArmDelete(null)
    setFlash('已丢弃待生效修改，编辑区回到当前生效版本。')
  }

  const resetBuiltin = () => {
    if (!status.active && status.pending === null) {
      setFlash('当前已经是内置版本，没有需要恢复的修改。')
      return
    }
    if (!resetArmed) {
      setResetArmed(true)
      setFlash(
        '再点一次「确认恢复内置」会把恢复操作排入下一次新局；当前进行中的一局和当前生效版本暂时不变。',
      )
      return
    }
    deletePendingStory(storyId)
    const next = builtinStory(storyId)
    setDraft(clone(next))
    setActCursor(0)
    setChoiceCursor(0)
    setThemeInput(next.themes[0] ?? '同伴关系')
    setVersion((value) => value + 1)
    setResetArmed(false)
    setArmDelete(null)
    setFlash('已排入内置版本恢复。下一次开始新局时使用内置剧本；当前进行中的一局不受影响。')
  }

  const exportDraft = () => {
    const blob = new Blob([exportStoryJson(draft)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${draft.id}-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setFlash('已导出当前草稿 JSON。文件只包含虚构剧本内容，不含学生姓名或转写。')
  }

  const importFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    const result = parseStoryJson(text)
    if (!result.story) {
      setImportError(result.error ?? '无法读取这份 JSON。')
      setFlash(null)
      return
    }
    const imported = result.story
    setImportError(null)
    setStoryId(imported.id)
    setDraft(clone(imported))
    setActCursor(0)
    setChoiceCursor(0)
    setThemeInput(imported.themes[0] ?? '同伴关系')
    setArmDelete(null)
    setResetArmed(false)
    setVersion((value) => value + 1)
    setFlash(
      `已载入「${imported.title}」的 JSON 草稿，尚未保存。确认内容后点「保存为待生效版本」。`,
    )
  }

  const pendingLabel =
    status.pending === 'update'
      ? `待生效修改 · ${fmtTime(status.pendingAt)}`
      : status.pending === 'delete'
        ? `待恢复内置 · ${fmtTime(status.pendingAt)}`
        : null

  const activeLabel = status.active
    ? `自定义剧本生效中${status.activeAt ? ` · ${fmtTime(status.activeAt)}` : ''}`
    : '内置剧本生效中'

  return (
    <PageShell hideFooter>
      <div className="page-in">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-ink/45">
          <button type="button" onClick={() => navigate('/menu')} className="hover:text-ink">
            ← 主菜单
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate('/seats')} className="hover:text-ink">
            课堂模式
          </button>
          <span>/</span>
          <span>SCRIPT STUDIO / 剧本工坊</span>
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="border border-brass/60 px-1.5 py-0.5 text-brass">LOCAL TEMPLATE</span>
            <span className="border border-ink/35 px-1.5 py-0.5">未连接大模型</span>
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-b-[1.5px] border-ink pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="label-mono text-red">WRITE · ADAPT · KEEP IT SAFE</div>
            <h1 className="title-serif mt-1.5 text-[34px] leading-none sm:text-[42px]">剧本工坊</h1>
            <p className="mt-2 max-w-[760px] text-[11.5px] leading-relaxed text-ink/55">
              在浏览器里直接修改虚构剧本，或用本地模板追加下一幕。所有修改先进入草稿，
              保存后只对<strong className="font-medium text-ink/80">下一次开始的新局</strong>生效，
              不会改写正在进行的课堂。
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="ink-btn h-8 px-2.5 text-[10px]"
              title="导入剧本 JSON，载入编辑器作为草稿"
            >
              导入剧本
            </button>
            {status.active ? <Chip tone="ink">CUSTOM ACTIVE</Chip> : <Chip>BUILT-IN</Chip>}
            {pendingLabel && <Chip tone="brass">{pendingLabel}</Chip>}
            <Stamp tone="brass">模拟生成</Stamp>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-1 border-[1.5px] border-ink bg-sheet/60 sm:grid-cols-3">
          {STORIES.map((story, index) => {
            const itemStatus = customStatus(story.id)
            const isActive = storyId === story.id
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => switchStory(story.id)}
                className={`flex flex-col items-start border-ink/25 px-3 py-2 text-left transition-colors ${
                  index > 0 ? 'border-t sm:border-t-0 sm:border-l' : ''
                } ${isActive ? 'bg-ink text-sheet' : 'hover:bg-paper-2/70'}`}
              >
                <span
                  className={`flex w-full items-center justify-between font-mono text-[8px] tracking-[0.12em] ${
                    isActive ? 'text-sheet/50' : 'text-ink/40'
                  }`}
                >
                  <span>{story.slot}</span>
                  <span>
                    {itemStatus.pending
                      ? 'PENDING'
                      : itemStatus.active
                        ? 'CUSTOM'
                        : story.playable
                          ? 'FULL'
                          : 'DEMO'}
                  </span>
                </span>
                <span className="mt-1 text-[13px] leading-tight">{story.title}</span>
                <span
                  className={`mt-0.5 text-[9px] ${isActive ? 'text-sheet/55' : 'text-ink/40'}`}
                >
                  {draft.id === story.id ? `${draft.acts.length} 幕 · 编辑中` : story.type}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[200px_minmax(0,1fr)_300px]">
          <aside className="frame-double h-fit bg-sheet/70 p-2.5 xl:sticky xl:top-3">
            <div className="flex items-center justify-between border-b border-ink/30 pb-1.5">
              <span className={LABEL}>ACT INDEX</span>
              <span className="font-mono text-[8px] text-ink/35">{draft.acts.length} ACTS</span>
            </div>
            <div className="mt-2 space-y-1">
              {draft.acts.map((item, index) => {
                const isActive = index === actCursor
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectAct(index)}
                    className={`block w-full border px-2 py-1.5 text-left transition-colors ${
                      isActive
                        ? 'border-ink bg-ink text-sheet'
                        : 'border-ink/25 bg-paper/50 hover:border-ink/60'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-between font-mono text-[7.5px] tracking-[0.1em] ${
                        isActive ? 'text-sheet/50' : 'text-ink/35'
                      }`}
                    >
                      <span>ACT {String(index + 1).padStart(2, '0')}</span>
                      <span>{item.choices.length} 选项</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-tight">
                      {item.title.trim() || '未命名的一幕'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-2 space-y-1.5 border-t border-dashed border-ink/25 pt-2">
              <button
                type="button"
                onClick={addBlank}
                className="ink-btn w-full text-[10.5px]"
              >
                + 空白的一幕
              </button>
              <button
                type="button"
                onClick={removeAct}
                className={`ink-btn w-full text-[10.5px] ${
                  armDelete === actCursor ? 'border-red text-red' : ''
                }`}
              >
                {armDelete === actCursor ? '确认删除本幕' : '删除本幕'}
              </button>
            </div>

            <p className="mt-2 text-[8.5px] leading-relaxed text-ink/40">
              删除只改动草稿。保存后，下一次新局才会使用新的幕数。
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-ink/20 pt-1.5">
              <span className="font-mono text-[7px] tracking-[0.1em] text-ink/35">
                {dirty ? 'UNSAVED DRAFT' : 'IN SYNC'}
              </span>
              <span className={`size-1.5 ${dirty ? 'bg-red' : 'bg-[#76854f]'}`} />
            </div>
          </aside>

          <main className="min-w-0 space-y-3">
            <section className="frame-double bg-sheet/70 p-3 sm:p-4">
              <SectionHead
                index="I"
                title="档案信息"
                en="FILE METADATA"
                right={<FileTag>{draft.slot}</FileTag>}
              />
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Field label="标题 / TITLE" en="ZH" className="sm:col-span-2">
                  <input
                    value={draft.title}
                    aria-label="故事标题"
                    onChange={(event) => patchDraft({ title: event.target.value })}
                    className={INPUT}
                  />
                </Field>
                <Field label="英文标题 / EN TITLE" en="EN">
                  <input
                    value={draft.en}
                    aria-label="故事英文标题"
                    onChange={(event) => patchDraft({ en: event.target.value })}
                    className={`${INPUT} font-mono uppercase`}
                  />
                </Field>
                <Field label="主题" en="THEMES">
                  <CsvInput
                    value={draft.themes}
                    ariaLabel="故事主题，用顿号分隔"
                    onChange={(themes) => patchDraft({ themes })}
                  />
                </Field>
                <Field label="一句话简介 / LOGLINE" en="LOG" className="sm:col-span-2">
                  <textarea
                    value={draft.logline}
                    aria-label="一句话简介"
                    rows={2}
                    onChange={(event) => patchDraft({ logline: event.target.value })}
                    className={INPUT}
                  />
                </Field>
                <Field label="档案描述 / DESCRIPTION" en="DESC" className="sm:col-span-2">
                  <textarea
                    value={draft.description}
                    aria-label="档案描述"
                    rows={2}
                    onChange={(event) => patchDraft({ description: event.target.value })}
                    className={INPUT}
                  />
                </Field>
                <div className="flex items-center justify-between gap-3 border border-ink/30 bg-paper-2/30 px-2.5 py-2 sm:col-span-2">
                  <div>
                    <div className="text-[11px]">完整剧本 / FULL PLAYABLE</div>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-ink/45">
                      关闭时，本局会在第一幕结束时收束，适合片段演练。补全多幕后请打开。
                    </p>
                  </div>
                  <Toggle
                    checked={draft.playable}
                    label="完整剧本"
                    onChange={(playable) => patchDraft({ playable })}
                  />
                </div>
              </div>
            </section>

            {act && (
              <section className="frame-double bg-sheet/70 p-3 sm:p-4">
                <SectionHead
                  index="II"
                  title={`第 ${actCursor + 1} 幕正文`}
                  en="ACT CONTENT"
                  right={<FileTag>{act.code}</FileTag>}
                />
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Field label="幕号 / NO." en="INT">
                    <input
                      type="number"
                      value={act.no}
                      aria-label="幕号"
                      min={1}
                      onChange={(event) =>
                        patchAct({ no: Math.max(1, Number(event.target.value) || 1) })
                      }
                      className={`${INPUT} font-mono`}
                    />
                  </Field>
                  <Field label="幕代码 / CODE" en="ID">
                    <input
                      value={act.code}
                      aria-label="幕代码"
                      onChange={(event) => patchAct({ code: event.target.value })}
                      className={`${INPUT} font-mono uppercase`}
                    />
                  </Field>
                  <Field label="幕标题 / TITLE" en="ZH" className="sm:col-span-2">
                    <input
                      value={act.title}
                      aria-label="幕标题"
                      onChange={(event) => patchAct({ title: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="英文短语 / EN" en="EN" className="sm:col-span-2">
                    <input
                      value={act.en}
                      aria-label="幕英文短语"
                      onChange={(event) => patchAct({ en: event.target.value })}
                      className={`${INPUT} font-mono uppercase`}
                    />
                  </Field>
                  <Field label="地点 / SCENE" en="SCENE">
                    <input
                      value={act.scene}
                      aria-label="场景地点"
                      onChange={(event) => patchAct({ scene: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="时间 / TIME" en="TIME">
                    <input
                      value={act.time}
                      aria-label="剧情时间"
                      onChange={(event) => patchAct({ time: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="场景说明 / SETTING" en="SET" className="sm:col-span-2">
                    <input
                      value={act.setting}
                      aria-label="场景说明"
                      onChange={(event) => patchAct({ setting: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field
                    label="叙述 / NARRATION"
                    en="每个换行是一段"
                    className="sm:col-span-2"
                  >
                    <textarea
                      value={act.narration.join('\n')}
                      aria-label="本幕叙述"
                      rows={5}
                      onChange={(event) =>
                        patchAct({ narration: event.target.value.split('\n') })
                      }
                      className={INPUT}
                    />
                  </Field>
                  <Field label="讨论任务 / TASK" en="REFERENCE">
                    <textarea
                      value={act.task}
                      aria-label="讨论任务"
                      rows={3}
                      onChange={(event) => patchAct({ task: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="核心提问 / QUESTION" en="PROMPT">
                    <textarea
                      value={act.question}
                      aria-label="核心提问"
                      rows={3}
                      onChange={(event) => patchAct({ question: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="收束 / CLOSING" en="CLOSE" className="sm:col-span-2">
                    <textarea
                      value={act.closing}
                      aria-label="本幕收束"
                      rows={3}
                      onChange={(event) => patchAct({ closing: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                </div>

                <div className="mt-3 border-t border-dashed border-ink/25 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className={LABEL}>本幕基础线索</span>
                    <span className="font-mono text-[7.5px] text-ink/35">
                      {act.baseClueIds.length} SELECTED
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {draft.clueBank.map((clue) => {
                      const checked = act.baseClueIds.includes(clue.id)
                      return (
                        <label
                          key={clue.id}
                          className={`flex cursor-pointer items-start gap-1.5 border px-1.5 py-1 text-[9.5px] leading-snug ${
                            checked
                              ? 'border-ink/55 bg-paper'
                              : 'border-ink/20 bg-paper-2/25'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              patchAct({
                                baseClueIds: checked
                                  ? act.baseClueIds.filter((id) => id !== clue.id)
                                  : [...act.baseClueIds, clue.id],
                              })
                            }
                            className="mt-0.5 accent-[#191a1c]"
                          />
                          <span>
                            <span className="font-mono text-[7.5px] text-red">{clue.code}</span>{' '}
                            {clue.title}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {draft.clueBank.length === 0 && (
                    <p className="text-[9px] text-ink/40">这份档案还没有线索库。</p>
                  )}
                </div>
              </section>
            )}

            {act && (
              <section className="frame-double bg-sheet/70 p-3 sm:p-4">
                <SectionHead
                  index="III"
                  title="行动选项"
                  en="CHOICES"
                  right={<FileTag>{act.choices.length} OPTIONS</FileTag>}
                />
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-b border-ink/25 pb-2">
                  {act.choices.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChoiceCursor(index)}
                      className={`border px-2 py-1 text-[10px] transition-colors ${
                        index === choiceCursor
                          ? 'border-ink bg-ink text-sheet'
                          : 'border-ink/30 bg-paper/50 hover:border-ink/70'
                      }`}
                    >
                      <span className="mr-1 font-mono text-[7.5px] opacity-55">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {item.title.trim() || '未命名选项'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={addChoice}
                    className="border border-dashed border-ink/40 px-2 py-1 text-[10px] hover:border-ink"
                  >
                    + 添加选项
                  </button>
                  <button
                    type="button"
                    onClick={removeChoice}
                    className="ml-auto border border-ink/25 px-2 py-1 text-[10px] text-ink/50 hover:border-red hover:text-red"
                  >
                    删除当前选项
                  </button>
                </div>

                {choice ? (
                  <div key={choice.id} className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Field label="选项标题 / TITLE" en="ZH" className="sm:col-span-2">
                      <input
                        value={choice.title}
                        aria-label="行动选项标题"
                        onChange={(event) => patchChoice({ title: event.target.value })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="意图 / INTENT" en="WHY">
                      <input
                        value={choice.intent}
                        aria-label="行动意图"
                        onChange={(event) => patchChoice({ intent: event.target.value })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="标记 / FLAGS" en="CSV">
                      <CsvInput
                        value={choice.flags ?? []}
                        ariaLabel="行动标记，用逗号分隔"
                        onChange={(flags) => patchChoice({ flags })}
                      />
                    </Field>
                    <Field label="行动描述 / DESCRIPTION" en="ACTION" className="sm:col-span-2">
                      <textarea
                        value={choice.description}
                        aria-label="行动描述"
                        rows={2}
                        onChange={(event) => patchChoice({ description: event.target.value })}
                        className={INPUT}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <div className="flex items-baseline justify-between">
                        <span className={LABEL}>状态影响 / EFFECTS</span>
                        <span className="font-mono text-[7px] text-ink/30">−20 … +20</span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {EFFECT_KEYS.map((key) => (
                          <EffectField
                            key={key}
                            effectKey={key}
                            value={choice.effects[key] ?? 0}
                            onChange={(next) =>
                              patchChoice({ effects: { ...choice.effects, [key]: next } })
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <Field label="反馈 / FEEDBACK" en="DM REPLY" className="sm:col-span-2">
                      <textarea
                        value={choice.feedback}
                        aria-label="行动反馈"
                        rows={3}
                        onChange={(event) => patchChoice({ feedback: event.target.value })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="观察句 / OBSERVER LINE" en="DEBRIEF" className="sm:col-span-2">
                      <textarea
                        value={choice.observerLine}
                        aria-label="观察句"
                        rows={2}
                        onChange={(event) => patchChoice({ observerLine: event.target.value })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="关联线索 / CLUE" en="OPTIONAL">
                      <select
                        value={choice.clueId ?? ''}
                        aria-label="关联线索"
                        onChange={(event) =>
                          patchChoice({ clueId: event.target.value || undefined })
                        }
                        className={INPUT}
                      >
                        <option value="">不关联线索</option>
                        {draft.clueBank.map((clue) => (
                          <option key={clue.id} value={clue.id}>
                            {clue.code} · {clue.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="选项 ID / ID" en="FIXED">
                      <input
                        value={choice.id}
                        readOnly
                        aria-label="选项 ID"
                        className={`${INPUT} font-mono text-ink/45`}
                      />
                    </Field>
                    <Field
                      label="回执正文 / PRINT BODY"
                      en="每个换行是一段"
                      className="sm:col-span-2"
                    >
                      <textarea
                        value={choice.printBody.join('\n')}
                        aria-label="打印回执正文"
                        rows={3}
                        onChange={(event) =>
                          patchChoice({ printBody: event.target.value.split('\n') })
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                ) : (
                  <p className="mt-3 text-[10px] text-ink/45">本幕还没有行动选项。</p>
                )}
              </section>
            )}

            {act && (
              <details className="border border-ink/30 bg-paper-2/30 px-3 py-2">
                <summary className="cursor-pointer text-[10.5px] text-ink/60">
                  查看这一幕在大屏上的呈现顺序
                  <span className="ml-2 font-mono text-[7px] text-ink/35">ON-SCREEN ORDER</span>
                </summary>
                <div className="mt-2 border-t border-dashed border-ink/25 pt-2">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[8px] tracking-[0.1em] text-ink/40">
                    <span className="border border-ink/35 px-1.5 py-0.5">{act.code}</span>
                    <span>{act.time || '时间未填'}</span>
                    <span className="text-ink/25">/</span>
                    <span>{act.scene || '地点未填'}</span>
                  </div>
                  <h3 className="title-serif mt-1.5 text-[20px] leading-tight">
                    {act.title || '未命名的一幕'}
                  </h3>
                  {act.setting && (
                    <p className="mt-0.5 text-[9px] text-ink/45">{act.setting}</p>
                  )}
                  <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink/75">
                    {act.narration.filter(Boolean).map((line, index) => (
                      <p key={`preview-${index}`}>{line}</p>
                    ))}
                  </div>
                  {act.task && (
                    <p className="mt-2 border-l-2 border-ink/40 pl-2 text-[10px] leading-relaxed text-ink/60">
                      {act.task}
                    </p>
                  )}
                  <p className="mt-2 border-t border-dotted border-ink/25 pt-1.5 text-[11px]">
                    {act.question || '（还没有核心提问）'}
                  </p>
                  <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-3">
                    {act.choices.map((item, index) => (
                      <div key={item.id} className="border border-ink/25 bg-sheet/60 p-1.5">
                        <div className="font-mono text-[7px] text-red">
                          选项 {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="text-[10.5px] leading-tight">{item.title || '未命名'}</div>
                        <div className="mt-0.5 text-[8px] text-ink/40">{item.intent}</div>
                      </div>
                    ))}
                  </div>
                  {act.closing && (
                    <p className="mt-2 text-[9.5px] leading-relaxed text-ink/45">{act.closing}</p>
                  )}
                </div>
              </details>
            )}
          </main>

          <aside className="min-w-0 space-y-3">
            <section className="frame-double bg-sheet p-3">
              <div className="flex items-start justify-between gap-2 border-b border-ink/30 pb-1.5">
                <div>
                  <div className="label-mono text-ink/45">LOCAL TEMPLATE</div>
                  <h2 className="title-serif mt-0.5 text-[17px]">生成下一幕草稿</h2>
                </div>
                <Stamp tone="brass">模拟</Stamp>
              </div>
              <p className="mt-2 text-[9.5px] leading-relaxed text-ink/50">
                按主题、上一幕标题和角色库拼装一幕。它不会访问网络，也不会替你做出教育判断——生成后请逐段改写。
              </p>
              <Field label="本幕主题 / THEME" en="INPUT" className="mt-2.5">
                <input
                  value={themeInput}
                  aria-label="本幕主题"
                  onChange={(event) => setThemeInput(event.target.value)}
                  placeholder="例如：同伴关系与群体压力"
                  className={INPUT}
                />
              </Field>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(
                  [
                    ['append', '追加新一幕'],
                    ['replace', '替换当前幕'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGenMode(mode)}
                    className={`border px-2 py-1.5 text-[10px] transition-colors ${
                      genMode === mode
                        ? 'border-ink bg-ink text-sheet'
                        : 'border-ink/30 bg-paper/50 hover:border-ink/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={generate} className="ink-btn ink-btn-red mt-2 w-full">
                ● 生成本地草稿
              </button>
              <ul className="mt-2 space-y-1">
                {generationNotes().map((note, index) => (
                  <li key={note} className="flex gap-1.5 text-[8.5px] leading-relaxed text-ink/40">
                    <span className="font-mono text-red">0{index + 1}</span>
                    {note}
                  </li>
                ))}
              </ul>
            </section>

            <section className="frame-double bg-sheet p-3 xl:sticky xl:top-3 xl:max-h-[calc(100dvh-1.5rem)] xl:overflow-y-auto">
              <div className="flex items-center justify-between border-b border-ink/30 pb-1.5">
                <span className={LABEL}>SAVE / 保存</span>
                <span className={`font-mono text-[7.5px] ${dirty ? 'text-red' : 'text-ink/40'}`}>
                  {dirty ? 'UNSAVED' : 'IN SYNC'}
                </span>
              </div>

              <dl className="mt-2 space-y-1 text-[9px] leading-relaxed">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink/40">当前生效</dt>
                  <dd className="text-right">{activeLabel}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink/40">待生效</dt>
                  <dd className={`text-right ${status.pending ? 'text-brass' : 'text-ink/40'}`}>
                    {pendingLabel ?? '无'}
                  </dd>
                </div>
              </dl>

              <div className="mt-2 border border-ink/25 bg-paper-2/30 px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className={LABEL}>结构检查</span>
                  <span className={`font-mono text-[7.5px] ${issues.length ? 'text-red' : 'text-[#5d6b3d]'}`}>
                    {issues.length ? `${issues.length} ISSUES` : 'PASS'}
                  </span>
                </div>
                {issues.length > 0 ? (
                  <ul className="mt-1 space-y-0.5">
                    {issues.map((issue) => (
                      <li key={issue} className="flex gap-1 text-[8.5px] leading-relaxed text-red">
                        <span>·</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[8.5px] leading-relaxed text-ink/45">
                    结构可用：幕数与行动选项满足最低要求。
                  </p>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="mt-1.5 border border-brass/45 bg-brass/[0.05] px-2 py-1.5">
                  <div className="label-mono text-brass">提示</div>
                  <ul className="mt-1 space-y-0.5">
                    {warnings.map((warning) => (
                      <li key={warning} className="text-[8.5px] leading-relaxed text-ink/55">
                        · {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={save}
                className="ink-btn ink-btn-solid mt-2 w-full"
              >
                保存为待生效版本
              </button>
              <p className="mt-1 text-[8.5px] leading-relaxed text-ink/40">
                {issues.length > 0
                  ? `保存条件：还差 ${issues.length} 项，先补全上面的结构问题。`
                  : '保存条件已满足。保存后不影响进行中的一局。'}
              </p>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={discard}
                  className="ink-btn text-[9.5px]"
                >
                  丢弃待生效修改
                </button>
                <button
                  type="button"
                  onClick={resetBuiltin}
                  className={`ink-btn text-[9.5px] ${resetArmed ? 'border-red text-red' : ''}`}
                >
                  {resetArmed ? '确认恢复内置' : '恢复内置版本'}
                </button>
              </div>

              {flash && (
                <p
                  role="status"
                  className="mt-2 border-l-2 border-red/60 bg-red/[0.04] px-2 py-1.5 text-[9px] leading-relaxed text-ink/65"
                >
                  {flash}
                </p>
              )}
            </section>

            <section className="border border-ink/30 bg-sheet/70 p-3">
              <div className="flex items-center justify-between border-b border-ink/25 pb-1.5">
                <span className={LABEL}>JSON / 迁移</span>
                <span className="font-mono text-[7px] text-ink/30">LOCAL FILE</span>
              </div>
              <p className="mt-1.5 text-[8.5px] leading-relaxed text-ink/45">
                换设备演示时，导出当前草稿 JSON，在另一台机器导入后继续编辑。文件不含学生姓名、座位或语音转写。
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button type="button" onClick={exportDraft} className="ink-btn text-[9.5px]">
                  导出草稿 JSON
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="ink-btn text-[9.5px]"
                >
                  导入 JSON
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                aria-label="导入剧本 JSON"
                className="hidden"
                onChange={(event) => {
                  void importFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              {importError && (
                <p className="mt-1.5 border border-red/40 bg-red/[0.04] px-2 py-1 text-[8.5px] leading-relaxed text-red">
                  {importError}
                </p>
              )}
            </section>

            <div className="border border-ink/20 bg-paper-2/35 p-2.5">
              <p className="text-[8.5px] leading-relaxed text-ink/45">
                安全边界：剧本工坊只编辑虚构故事内容。请不要写入真实学生姓名、联系方式或未经同意的私人信息；
                私人档案仍只在课堂中逐人遮蔽打印。
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <Chip>本机保存</Chip>
                <Chip>新局生效</Chip>
                <Chip>可导出 JSON</Chip>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
