import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  getDmVoiceSnapshot,
  setDmVoiceBlocked,
  setDmVoiceEnabled,
  speakDm,
  subscribeDmVoice,
} from '../logic/dmVoice'

export function useDmVoice() {
  const snapshot = useSyncExternalStore(subscribeDmVoice, getDmVoiceSnapshot, getDmVoiceSnapshot)
  const toggle = useCallback(() => {
    setDmVoiceEnabled(!getDmVoiceSnapshot().enabled)
  }, [])
  const unavailable =
    snapshot.engine !== 'neural' &&
    snapshot.neuralState !== 'loading' &&
    (!snapshot.supported || (snapshot.voicesReady && !snapshot.hasChineseVoice))
  return { ...snapshot, unavailable, toggle }
}

/** Speaks a static DM line. Re-speaks only when the text itself changes. */
export function useDmVoiceLine(
  text: string | null,
  options: { owner?: string; rate?: number } = {},
) {
  const { owner, rate } = options
  useEffect(() => {
    if (!text || !text.trim()) return
    const handle = speakDm(text, { owner, rate })
    return () => handle.cancel()
  }, [text, owner, rate])
}

/** Stops and suppresses DM speech while a microphone is listening. */
export function useDmVoiceMicGate(owner: string, blocked: boolean) {
  useEffect(() => {
    setDmVoiceBlocked(owner, blocked)
    return () => setDmVoiceBlocked(owner, false)
  }, [owner, blocked])
}

export type TypewriterSpeechMode = 'idle' | 'speech' | 'fallback'

export interface TypewriterSpeechReveal {
  text: string
  count: number
}

/**
 * Starts DM speech for a typewriter line and reports how much text the voice
 * has reached. Boundary events drive the reveal; browsers or voices without
 * boundary support fall back to the ordinary timer after ~900ms.
 */
export function useTypewriterSpeech(
  full: string,
  options: { skip: boolean; enabled: boolean },
) {
  const { skip, enabled } = options
  const [mode, setMode] = useState<TypewriterSpeechMode>('idle')
  const [reveal, setReveal] = useState<TypewriterSpeechReveal | null>(null)
  const [waiting, setWaiting] = useState(false)
  const spokenRef = useRef(0)
  const prevEnabledRef = useRef(enabled)

  useEffect(() => {
    spokenRef.current = 0
    setMode('idle')
    setReveal(null)
  }, [full])

  useEffect(() => {
    if (!enabled || skip || !full.trim()) {
      setWaiting(false)
      return
    }

    let dead = false
    let sawBoundary = false
    let fallbackTimer = 0
    // Neural synthesis takes a moment; hold the typewriter until the voice
    // actually starts so text does not run ahead of the first sentence.
    setWaiting(true)

    const scheduleFallback = () => {
      if (dead || sawBoundary || fallbackTimer) return
      fallbackTimer = window.setTimeout(() => {
        if (!dead && !sawBoundary) setMode('fallback')
      }, 900)
    }

    const handle = speakDm(full, {
      owner: 'typewriter',
      onStart: () => {
        setWaiting(false)
        scheduleFallback()
      },
      onBoundary: (index) => {
        if (dead) return
        sawBoundary = true
        spokenRef.current = index + 1
        window.clearTimeout(fallbackTimer)
        fallbackTimer = 0
        setWaiting(false)
        setMode('speech')
        setReveal({ text: full, count: index + 1 })
      },
      onEnd: (reason) => {
        if (dead) return
        window.clearTimeout(fallbackTimer)
        fallbackTimer = 0
        setWaiting(false)
        if (reason === 'complete') {
          spokenRef.current = full.length
          setMode('speech')
          setReveal({ text: full, count: full.length })
        } else {
          setMode('fallback')
        }
      },
    })

    return () => {
      dead = true
      window.clearTimeout(fallbackTimer)
      handle.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, skip])

  // Switching the voice back on mid-line continues from where it stopped
  // instead of replaying text the class has already seen.
  useEffect(() => {
    const was = prevEnabledRef.current
    prevEnabledRef.current = enabled
    if (!enabled || was || skip || !full.trim()) return
    const start = Math.min(spokenRef.current, full.length)
    if (start >= full.length) return

    let dead = false
    let fallbackTimer = 0
    setWaiting(true)
    const handle = speakDm(full.slice(start), {
      owner: 'typewriter-resume',
      onStart: () => {
        if (dead) return
        setWaiting(false)
        fallbackTimer = window.setTimeout(() => {
          if (!dead) setMode('fallback')
        }, 900)
      },
      onBoundary: (index) => {
        if (dead) return
        window.clearTimeout(fallbackTimer)
        const count = start + index + 1
        spokenRef.current = count
        setWaiting(false)
        setMode('speech')
        setReveal({ text: full, count })
      },
      onEnd: (reason) => {
        if (dead) return
        window.clearTimeout(fallbackTimer)
        setWaiting(false)
        if (reason === 'complete') {
          spokenRef.current = full.length
          setMode('speech')
          setReveal({ text: full, count: full.length })
        } else {
          setMode('fallback')
        }
      },
    })
    return () => {
      dead = true
      window.clearTimeout(fallbackTimer)
      handle.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { mode, reveal, waiting }
}
