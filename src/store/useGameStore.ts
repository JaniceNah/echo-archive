import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getStory } from '../data/stories'
import { commitPendingStories } from '../logic/customStories'
import { applyEffects, availableCharacters, buildAssignment, computeEnding, simulateReplay } from '../logic/engine'
import type {
  Act,
  Choice,
  Clue,
  Ending,
  GameMode,
  GamePhase,
  HistoryEntry,
  PrintMaterial,
  PrintRecord,
  ReplayResult,
  Seat,
  Snapshot,
  Stats,
  TeacherSettings,
  TranscriptLine,
} from '../types'

const DEFAULT_TEACHER: TeacherSettings = {
  theme: '同伴关系与群体压力',
  players: 5,
  duration: 45,
  skipSensitive: false,
  device: { screen: true, mic: true, printer: true, offline: true },
}

interface RunState {
  mode: GameMode
  storyId: string | null
  playerCount: number
  duration: number
  roleId: string | null
  actIndex: number
  phase: GamePhase
  stats: Stats
  history: HistoryEntry[]
  clues: Clue[]
  flags: string[]
  snapshots: Snapshot[]
  prints: PrintRecord[]
  currentChoiceId: string | null
  endingId: string | null
  actorSeat: number
  seats: Seat[]
  activeSeat: number
  transcripts: TranscriptLine[]
  startedAt: string | null
  savedAt: string | null
  paused: boolean
  pausedBy: 'student' | 'teacher' | null
  takeoverNote: string | null
  skipSensitive: boolean
  replay: ReplayResult | null
  activePrint: PrintMaterial | null
  teacher: TeacherSettings

  beginStory: (storyId: string, playerCount: number, duration: number) => void
  startClassroom: (storyId: string, playerCount: number, duration: number, roleIds: string[]) => void
  claimRole: (roleId: string) => void
  ensureSeats: () => void
  setSeatRole: (seatIndex: number, roleId: string) => void
  setSeatMic: (seatIndex: number, on: boolean) => void
  setSeatMuted: (seatIndex: number, muted: boolean) => void
  setAllMuted: (muted: boolean) => void
  setActiveSeat: (seatIndex: number) => void
  addTranscript: (line: Omit<TranscriptLine, 'id' | 'at'>) => void
  clearTranscripts: () => void
  enterAct: (index: number) => void
  beginDiscussion: () => void
  makeChoice: (choiceId: string) => void
  closeChoiceRound: () => void
  finishFeedback: () => void
  advanceAct: () => void
  setPaused: (paused: boolean, by?: 'student' | 'teacher') => void
  setTakeoverNote: (note: string | null) => void
  setSkipSensitive: (value: boolean) => void
  cycleActor: () => void
  openPrint: (material: PrintMaterial) => void
  closePrint: () => void
  savePrint: (material: PrintMaterial, scope: string) => void
  startReplay: (actIndex: number, altChoiceId: string) => ReplayResult | null
  clearReplay: () => void
  setTeacher: (patch: Partial<TeacherSettings>) => void
  setDevice: (key: keyof TeacherSettings['device'], value: boolean) => void
  teacherAdvance: () => void
  resetRun: () => void
}

const emptyRun = {
  mode: 'solo' as GameMode,
  storyId: null as string | null,
  playerCount: 5,
  duration: 45,
  roleId: null as string | null,
  actIndex: 0,
  phase: 'brief' as GamePhase,
  stats: { tension: 40, trust: 45, openness: 35, safety: 55 },
  history: [] as HistoryEntry[],
  clues: [] as Clue[],
  flags: [] as string[],
  snapshots: [] as Snapshot[],
  prints: [] as PrintRecord[],
  currentChoiceId: null as string | null,
  endingId: null as string | null,
  actorSeat: 0,
  seats: [] as Seat[],
  activeSeat: 0,
  transcripts: [] as TranscriptLine[],
  startedAt: null as string | null,
  savedAt: null as string | null,
  paused: false,
  pausedBy: null as 'student' | 'teacher' | null,
  takeoverNote: null as string | null,
  skipSensitive: false,
  replay: null as ReplayResult | null,
  activePrint: null as PrintMaterial | null,
}

function uniqueRoleIds(storyChars: string[], requested: string[]): string[] {
  const used = new Set<string>()
  const picked: string[] = []
  for (const id of requested) {
    if (storyChars.includes(id) && !used.has(id)) {
      used.add(id)
      picked.push(id)
    }
  }
  for (const id of storyChars) {
    if (!used.has(id)) {
      used.add(id)
      picked.push(id)
    }
  }
  return picked.slice(0, storyChars.length)
}

function findByCode(storyId: string | null, clueId: string): Clue | undefined {
  return getStory(storyId)?.clueBank.find((c) => c.id === clueId)
}

function buildSeats(storyChars: { id: string }[], claimedRoleId?: string | null): Seat[] {
  const seats: Seat[] = storyChars.map((character, index) => ({
    index,
    roleId: character.id,
    micOn: false,
    muted: false,
  }))
  if (claimedRoleId && !seats.some((seat) => seat.roleId === claimedRoleId) && seats[0]) {
    seats[0] = { ...seats[0], roleId: claimedRoleId }
  }
  return seats
}

// All seats act in a round; the most frequent choice becomes the party's
// action, so a 5-player round advances the plot once, not five times.
function pickConsensus(act: Act, entries: HistoryEntry[]): Choice | null {
  if (!entries.length) return null
  const counts = new Map<string, number>()
  for (const entry of entries) counts.set(entry.choiceId, (counts.get(entry.choiceId) ?? 0) + 1)
  let bestId = entries[entries.length - 1].choiceId
  let bestCount = -1
  for (const choice of act.choices) {
    const count = counts.get(choice.id) ?? 0
    if (count > bestCount) {
      bestCount = count
      bestId = choice.id
    }
  }
  return act.choices.find((choice) => choice.id === bestId) ?? null
}

function roundEntriesFor(state: RunState, actIndex: number): HistoryEntry[] {
  return state.history.filter(
    (entry) => entry.actIndex === actIndex && typeof entry.seat === 'number',
  )
}

// A double-click on "进入下一幕" lands its second click on whatever button
// the next phase renders in the same spot. A short lock keeps one physical
// click burst from chaining across panels (and from acting for two seats).
const ACTION_LOCK_MS = 500
let actionLockUntil = 0

function actionLocked(): boolean {
  return Date.now() < actionLockUntil
}

function lockActions(): void {
  actionLockUntil = Date.now() + ACTION_LOCK_MS
}

export const useGameStore = create<RunState>()(
  persist(
    (set, get) => ({
      ...emptyRun,
      teacher: DEFAULT_TEACHER,

      beginStory: (storyId, playerCount, duration) => {
        commitPendingStories()
        const story = getStory(storyId)
        if (!story) return
        set({
          ...emptyRun,
          mode: 'solo',
          storyId,
          playerCount,
          duration,
          stats: { ...story.initialStats },
          startedAt: new Date().toISOString(),
          teacher: { ...get().teacher, players: playerCount, duration },
        })
      },

      startClassroom: (storyId, playerCount, duration, roleIds) => {
        commitPendingStories()
        const story = getStory(storyId)
        if (!story) return
        const chars = availableCharacters(story, playerCount)
        const ordered = uniqueRoleIds(chars.map((c) => c.id), roleIds)
        const seats: Seat[] = chars.map((character, index) => ({
          index,
          roleId: ordered[index] ?? character.id,
          micOn: false,
          muted: false,
        }))
        set({
          ...emptyRun,
          mode: 'classroom',
          storyId,
          playerCount,
          duration,
          stats: { ...story.initialStats },
          seats,
          activeSeat: 0,
          roleId: seats[0]?.roleId ?? null,
          startedAt: new Date().toISOString(),
          savedAt: new Date().toISOString(),
          teacher: { ...get().teacher, players: playerCount, duration },
        })
        get().enterAct(0)
      },

      claimRole: (roleId) => {
        const story = getStory(get().storyId)
        if (!story) return
        const playerCount = get().playerCount
        const roster = availableCharacters(story, playerCount)
        const seats = playerCount > 1 ? buildSeats(roster, roleId) : []
        set({
          roleId,
          mode: 'solo',
          seats,
          activeSeat: 0,
          actorSeat: 0,
          savedAt: new Date().toISOString(),
          actIndex: 0,
          phase: 'brief',
          stats: { ...story.initialStats },
          history: [],
          clues: [],
          flags: [],
          snapshots: [],
          prints: [],
          transcripts: [],
          currentChoiceId: null,
          endingId: null,
          replay: null,
          paused: false,
          pausedBy: null,
          takeoverNote: null,
        })
        get().enterAct(0)
      },

      ensureSeats: () => {
        const state = get()
        if (state.seats.length > 0 || state.playerCount <= 1) return
        const story = getStory(state.storyId)
        if (!story || !state.roleId) return
        const roster = availableCharacters(story, state.playerCount)
        if (!roster.length) return
        set({
          seats: buildSeats(roster, state.roleId),
          activeSeat: 0,
          actorSeat: state.actorSeat % Math.max(1, roster.length),
          savedAt: new Date().toISOString(),
        })
      },

      setSeatRole: (seatIndex, roleId) => {
        const state = get()
        const seats = [...state.seats]
        const target = seats[seatIndex]
        if (!target || target.roleId === roleId) return
        const previous = target.roleId
        const holder = seats.findIndex((seat, i) => i !== seatIndex && seat.roleId === roleId)
        if (holder >= 0) seats[holder] = { ...seats[holder], roleId: previous }
        seats[seatIndex] = { ...target, roleId }
        set({
          seats,
          roleId: seats[0]?.roleId ?? null,
          savedAt: new Date().toISOString(),
        })
      },

      setSeatMic: (seatIndex, on) => {
        const state = get()
        if (!state.seats[seatIndex]) return
        const seats = state.seats.map((seat, i) => ({
          ...seat,
          micOn: i === seatIndex ? on && !seat.muted : false,
        }))
        set({
          seats,
          ...(on ? { activeSeat: seatIndex, actorSeat: seatIndex } : {}),
          savedAt: new Date().toISOString(),
        })
      },

      setSeatMuted: (seatIndex, muted) => {
        const seats = get().seats.map((seat, i) =>
          i === seatIndex ? { ...seat, muted, micOn: muted ? false : seat.micOn } : seat,
        )
        set({ seats, savedAt: new Date().toISOString() })
      },

      setAllMuted: (muted) => {
        const seats = get().seats.map((seat) => ({ ...seat, muted, micOn: false }))
        set({ seats, savedAt: new Date().toISOString() })
      },

      setActiveSeat: (seatIndex) => {
        const seats = get().seats
        if (!seats[seatIndex]) return
        set({ activeSeat: seatIndex, actorSeat: seatIndex })
      },

      addTranscript: (line) => {
        const state = get()
        const entry: TranscriptLine = {
          ...line,
          id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
        }
        set({
          transcripts: [...state.transcripts, entry].slice(-240),
          savedAt: new Date().toISOString(),
        })
      },

      clearTranscripts: () => set({ transcripts: [], savedAt: new Date().toISOString() }),

      enterAct: (index) => {
        const story = getStory(get().storyId)
        if (!story) return
        const act = story.acts[index]
        if (!act) {
          const ending = computeEnding(story, get().stats, get().flags)
          set({ phase: 'ending', endingId: ending.id, savedAt: new Date().toISOString() })
          return
        }
        const state = get()
        const existingIds = new Set(state.clues.map((c) => c.id))
        const baseClues = act.baseClueIds
          .map((id) => story.clueBank.find((c) => c.id === id))
          .filter((c): c is Clue => Boolean(c) && !existingIds.has(c!.id))
        const snapshots = state.snapshots.some((s) => s.actIndex === index)
          ? state.snapshots
          : [
              ...state.snapshots,
              {
                actIndex: index,
                stats: { ...state.stats },
                flagList: [...state.flags],
                clueIds: state.clues.map((c) => c.id),
              },
            ]
        const multi = state.seats.length > 0
        const stageSeats = Math.max(
          1,
          multi ? state.seats.length : buildAssignment(story, state.playerCount, state.roleId).length,
        )
        const actorSeat = index % stageSeats
        set({
          actIndex: index,
          phase: 'brief',
          currentChoiceId: null,
          clues: [...state.clues, ...baseClues],
          snapshots,
          actorSeat,
          activeSeat: multi ? actorSeat : state.activeSeat,
          seats: multi ? state.seats.map((seat) => ({ ...seat, micOn: false })) : state.seats,
          savedAt: new Date().toISOString(),
        })
      },

      beginDiscussion: () => {
        if (get().phase !== 'brief' || actionLocked()) return
        lockActions()
        set({ phase: 'choice' })
      },

      makeChoice: (choiceId) => {
        const state = get()
        if (state.phase !== 'choice') return
        const story = getStory(state.storyId)
        const act = story?.acts[state.actIndex]
        const choice = act?.choices.find((c) => c.id === choiceId)
        if (!story || !act || !choice) return
        if (actionLocked()) return
        lockActions()

        const multi = state.seats.length > 0
        const seatIndex = multi
          ? Math.min(Math.max(state.activeSeat, 0), state.seats.length - 1)
          : null
        if (seatIndex !== null) {
          const already = state.history.some(
            (entry) => entry.actIndex === state.actIndex && entry.seat === seatIndex,
          )
          if (already) return
        }

        let actor = '全班同学'
        if (seatIndex !== null) {
          const roleId = state.seats[seatIndex]?.roleId
          actor = story.characters.find((c) => c.id === roleId)?.name ?? `P${seatIndex + 1}`
        } else {
          const assignment = buildAssignment(story, state.playerCount, state.roleId)
          const actorId = assignment[state.actorSeat % Math.max(1, assignment.length)]?.roleId
          actor = story.characters.find((c) => c.id === actorId)?.name ?? '全班同学'
        }

        const entry: HistoryEntry = {
          actIndex: state.actIndex,
          actNo: act.no,
          actTitle: act.title,
          choiceId: choice.id,
          choiceTitle: choice.title,
          intent: choice.intent,
          feedback: choice.feedback,
          effects: choice.effects,
          flags: choice.flags ?? [],
          clueId: choice.clueId,
          actor,
          seat: seatIndex ?? undefined,
          at: new Date().toISOString(),
        }
        const history = [...state.history, entry]

        // Legacy single-role runs keep the old immediate behaviour.
        if (seatIndex === null) {
          const clue = choice.clueId ? findByCode(story.id, choice.clueId) : undefined
          set({
            stats: applyEffects(state.stats, choice.effects),
            clues:
              clue && !state.clues.some((c) => c.id === clue.id)
                ? [...state.clues, clue]
                : state.clues,
            flags: Array.from(new Set([...state.flags, ...(choice.flags ?? [])])),
            history,
            currentChoiceId: choice.id,
            phase: 'feedback',
            savedAt: new Date().toISOString(),
          })
          return
        }

        const roundEntries = roundEntriesFor({ ...state, history }, state.actIndex)
        const acted = new Set(roundEntries.map((item) => item.seat as number))
        const complete = acted.size >= state.seats.length

        if (!complete) {
          let nextSeat = seatIndex
          for (let step = 1; step <= state.seats.length; step += 1) {
            const candidate = (seatIndex + step) % state.seats.length
            if (!acted.has(candidate)) {
              nextSeat = candidate
              break
            }
          }
          set({
            history,
            currentChoiceId: choice.id,
            phase: 'choice',
            activeSeat: nextSeat,
            roleId:
              state.mode === 'classroom'
                ? (state.seats[nextSeat]?.roleId ?? state.roleId)
                : state.roleId,
            savedAt: new Date().toISOString(),
          })
          return
        }

        // Every seat has acted: the most frequent choice becomes the party's
        // action, and its effects apply once so a 5-seat round is not 5× stats.
        const consensus = pickConsensus(act, roundEntries) ?? choice
        const clue = consensus.clueId ? findByCode(story.id, consensus.clueId) : undefined
        set({
          stats: applyEffects(state.stats, consensus.effects),
          clues:
            clue && !state.clues.some((c) => c.id === clue.id)
              ? [...state.clues, clue]
              : state.clues,
          flags: Array.from(new Set([...state.flags, ...(consensus.flags ?? [])])),
          history,
          currentChoiceId: consensus.id,
          phase: 'feedback',
          activeSeat: seatIndex,
          roleId:
            state.mode === 'classroom'
              ? (state.seats[seatIndex]?.roleId ?? state.roleId)
              : state.roleId,
          savedAt: new Date().toISOString(),
        })
      },

      closeChoiceRound: () => {
        const state = get()
        if (state.seats.length === 0 || state.phase !== 'choice') return
        if (actionLocked()) return
        lockActions()
        const roundEntries = roundEntriesFor(state, state.actIndex)
        if (!roundEntries.length) return
        const story = getStory(state.storyId)
        const act = story?.acts[state.actIndex]
        const consensus = act ? pickConsensus(act, roundEntries) : null
        if (!consensus) {
          set({ phase: 'feedback', savedAt: new Date().toISOString() })
          return
        }
        const clue =
          consensus.clueId && story ? findByCode(story.id, consensus.clueId) : undefined
        set({
          stats: applyEffects(state.stats, consensus.effects),
          clues:
            clue && !state.clues.some((c) => c.id === clue.id)
              ? [...state.clues, clue]
              : state.clues,
          flags: Array.from(new Set([...state.flags, ...(consensus.flags ?? [])])),
          currentChoiceId: consensus.id,
          phase: 'feedback',
          savedAt: new Date().toISOString(),
        })
      },

      finishFeedback: () => {
        if (get().phase !== 'feedback' || actionLocked()) return
        lockActions()
        set({ phase: 'actend', savedAt: new Date().toISOString() })
      },

      advanceAct: () => {
        const state = get()
        const story = getStory(state.storyId)
        if (!story) return
        if (state.phase !== 'actend' || actionLocked()) return
        lockActions()
        const next = state.actIndex + 1
        if (!story.playable || next >= story.acts.length) {
          const ending = computeEnding(story, state.stats, state.flags)
          set({
            phase: 'ending',
            endingId: ending.id,
            savedAt: new Date().toISOString(),
          })
          return
        }
        get().enterAct(next)
      },

      setPaused: (paused, by = 'student') =>
        set({ paused, pausedBy: paused ? by : null }),
      setTakeoverNote: (note) => set({ takeoverNote: note }),
      setSkipSensitive: (value) => set({ skipSensitive: value }),

      cycleActor: () => {
        const state = get()
        const story = getStory(state.storyId)
        if (!story) return
        const multi = state.seats.length > 0
        const total = Math.max(
          1,
          multi ? state.seats.length : buildAssignment(story, state.playerCount, state.roleId).length,
        )
        const actorSeat = (state.actorSeat + 1) % total
        set({
          actorSeat,
          activeSeat: multi ? actorSeat : state.activeSeat,
          seats: multi ? state.seats.map((seat) => ({ ...seat, micOn: false })) : state.seats,
        })
      },

      openPrint: (material) => set({ activePrint: material }),
      closePrint: () => set({ activePrint: null }),

      savePrint: (material, scope) => {
        const state = get()
        if (state.prints.some((p) => p.material.id === material.id)) return
        set({
          prints: [
            ...state.prints,
            {
              id: `${material.id}-${Date.now()}`,
              material,
              printedAt: new Date().toISOString(),
              scope,
            },
          ],
          savedAt: new Date().toISOString(),
        })
      },

      startReplay: (actIndex, altChoiceId) => {
        const state = get()
        const story = getStory(state.storyId)
        if (!story) return null
        const ending: Ending | undefined = story.endings.find((e) => e.id === state.endingId)
        if (!ending) return null
        const result = simulateReplay({
          story,
          snapshots: state.snapshots,
          history: state.history,
          actIndex,
          altChoiceId,
          originalEnding: ending,
        })
        if (result) set({ replay: result, savedAt: new Date().toISOString() })
        return result
      },

      clearReplay: () => set({ replay: null }),

      setTeacher: (patch) =>
        set({ teacher: { ...get().teacher, ...patch, device: { ...get().teacher.device, ...(patch.device ?? {}) } } }),

      setDevice: (key, value) =>
        set({ teacher: { ...get().teacher, device: { ...get().teacher.device, [key]: value } } }),

      teacherAdvance: () => {
        const state = get()
        if (actionLocked()) return
        if (state.phase === 'brief') {
          lockActions()
          set({ phase: 'choice' })
        } else if (state.phase === 'feedback') {
          lockActions()
          set({ phase: 'actend' })
        } else if (state.phase === 'actend') {
          get().advanceAct()
        }
      },

      resetRun: () => {
        const teacher = get().teacher
        set({ ...emptyRun, teacher })
      },
    }),
    {
      name: 'echo-archive-session-v1',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<RunState>
        const teacher = saved.teacher
        return {
          ...current,
          ...saved,
          mode: saved.mode === 'classroom' ? 'classroom' : 'solo',
          seats: Array.isArray(saved.seats) ? saved.seats : [],
          transcripts: Array.isArray(saved.transcripts) ? saved.transcripts : [],
          activeSeat: typeof saved.activeSeat === 'number' ? saved.activeSeat : 0,
          teacher: {
            ...DEFAULT_TEACHER,
            ...(teacher ?? {}),
            device: { ...DEFAULT_TEACHER.device, ...(teacher?.device ?? {}) },
          },
        }
      },
      partialize: (state) => {
        const {
          activePrint: _activePrint,
          beginStory: _beginStory,
          startClassroom: _startClassroom,
          claimRole: _claimRole,
          ensureSeats: _ensureSeats,
          setSeatRole: _setSeatRole,
          setSeatMic: _setSeatMic,
          setSeatMuted: _setSeatMuted,
          setAllMuted: _setAllMuted,
          setActiveSeat: _setActiveSeat,
          addTranscript: _addTranscript,
          clearTranscripts: _clearTranscripts,
          enterAct: _enterAct,
          beginDiscussion: _beginDiscussion,
          makeChoice: _makeChoice,
          closeChoiceRound: _closeChoiceRound,
          finishFeedback: _finishFeedback,
          advanceAct: _advanceAct,
          setPaused: _setPaused,
          setTakeoverNote: _setTakeoverNote,
          setSkipSensitive: _setSkipSensitive,
          cycleActor: _cycleActor,
          openPrint: _openPrint,
          closePrint: _closePrint,
          savePrint: _savePrint,
          startReplay: _startReplay,
          clearReplay: _clearReplay,
          setTeacher: _setTeacher,
          setDevice: _setDevice,
          teacherAdvance: _teacherAdvance,
          resetRun: _resetRun,
          ...rest
        } = state
        void _activePrint
        void _beginStory
        void _startClassroom
        void _claimRole
        void _ensureSeats
        void _setSeatRole
        void _setSeatMic
        void _setSeatMuted
        void _setAllMuted
        void _setActiveSeat
        void _addTranscript
        void _clearTranscripts
        void _enterAct
        void _beginDiscussion
        void _makeChoice
        void _closeChoiceRound
        void _finishFeedback
        void _advanceAct
        void _setPaused
        void _setTakeoverNote
        void _setSkipSensitive
        void _cycleActor
        void _openPrint
        void _closePrint
        void _savePrint
        void _startReplay
        void _clearReplay
        void _setTeacher
        void _setDevice
        void _teacherAdvance
        void _resetRun
        return rest
      },
    },
  ),
)

// run-state helper (kept outside the store to avoid persisting it)
export function canContinue(state: Pick<RunState, 'storyId' | 'roleId' | 'savedAt'>): boolean {
  return Boolean(state.storyId && state.roleId && state.savedAt)
}
