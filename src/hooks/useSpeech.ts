import { useCallback, useEffect, useRef, useState } from 'react'
import { loadLocalAsr, localAsrReady, localAsrSupported, transcribeLocal } from '../logic/asr'

interface SpeechResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechEventLike {
  resultIndex: number
  results: ArrayLike<SpeechResultLike>
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((event: SpeechEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike
export type SpeechEngine = 'browser' | 'local'

function getRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return candidates.find((mime) => {
    try {
      return MediaRecorder.isTypeSupported(mime)
    } catch {
      return false
    }
  })
}

interface LocalSession {
  stream: MediaStream
  recorder: MediaRecorder
  chunks: Blob[]
  session: number
  timer: number
  mime: string | undefined
}

/**
 * Speech input with two engines:
 * - `local`: Whisper running in the browser (works offline and without Google).
 * - `browser`: the built-in Web Speech API, used as a fallback.
 * Both feed the same transcript/intent pipeline; errors surface as short codes
 * so each screen can decide whether to retry or switch to simulated speech.
 */
export function useSpeech(lang = 'zh-CN') {
  const browserSupported = Boolean(getRecognition())
  const localSupported = localAsrSupported()
  const [engine, setEngineState] = useState<SpeechEngine>(localSupported ? 'local' : 'browser')
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [usedEngine, setUsedEngine] = useState<SpeechEngine | null>(null)
  const [modelReady, setModelReady] = useState(localAsrReady())
  const recognitionRef = useRef<RecognitionLike | null>(null)
  const localRef = useRef<LocalSession | null>(null)
  const finalRef = useRef('')
  const engineRef = useRef<SpeechEngine>(engine)
  // Each start() gets a session id. Late events from a previous recognition
  // instance must not flip the state of the newly started session — otherwise
  // seat 2's mic looks dead right after seat 1 finishes.
  const sessionRef = useRef(0)
  const fallbackRef = useRef(false)

  const setProgressSafe = useCallback((value: number | null) => {
    setProgress(value)
    if (value === null) setModelReady(localAsrReady())
  }, [])

  const clearLocal = useCallback((discard: boolean) => {
    const current = localRef.current
    if (!current) return
    localRef.current = null
    window.clearTimeout(current.timer)
    try {
      if (current.recorder.state !== 'inactive') current.recorder.stop()
    } catch {
      // recorder already stopped
    }
    current.stream.getTracks().forEach((track) => track.stop())
    if (discard) current.chunks.length = 0
  }, [])

  const stop = useCallback(() => {
    if (localRef.current) {
      // Normal end: keep the recording and transcribe it.
      clearLocal(false)
      setListening(false)
      setProcessing(true)
      return
    }
    if (processing) {
      // Switching seats while the model runs: drop the pending utterance.
      sessionRef.current += 1
      setProcessing(false)
      setInterim('')
      setProgress(null)
      return
    }
    sessionRef.current += 1
    fallbackRef.current = false
    const current = recognitionRef.current
    recognitionRef.current = null
    setListening(false)
    setInterim('')
    try {
      current?.stop()
    } catch {
      // ignore: the session already ended
    }
  }, [clearLocal, processing])

  const cancel = useCallback(() => {
    sessionRef.current += 1
    fallbackRef.current = false
    clearLocal(true)
    const current = recognitionRef.current
    recognitionRef.current = null
    try {
      current?.abort()
    } catch {
      // ignore: the session already ended
    }
    setListening(false)
    setProcessing(false)
    setProgress(null)
    setInterim('')
    setFinalText('')
    setError(null)
    setUsedEngine(null)
    finalRef.current = ''
  }, [clearLocal])

  const reset = useCallback(() => {
    sessionRef.current += 1
    finalRef.current = ''
    setFinalText('')
    setInterim('')
    setError(null)
    setUsedEngine(null)
  }, [])

  const setEngine = useCallback(
    (next: SpeechEngine) => {
      if (next === engineRef.current) return
      if (next === 'browser' && !browserSupported) return
      stop()
      sessionRef.current += 1
      setListening(false)
      setProcessing(false)
      setProgress(null)
      setInterim('')
      setError(null)
      setFinalText('')
      finalRef.current = ''
      engineRef.current = next
      setEngineState(next)
    },
    [browserSupported, stop],
  )

  const startLocal = useCallback(() => {
    if (!localSupported) {
      setError(window.isSecureContext ? 'unsupported' : 'insecure')
      return false
    }
    sessionRef.current += 1
    const session = sessionRef.current
    fallbackRef.current = false
    finalRef.current = ''
    setFinalText('')
    setInterim('')
    setError(null)
    setUsedEngine('local')

    void (async () => {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        })
      } catch (err) {
        if (session !== sessionRef.current) return
        const name = (err as DOMException)?.name
        setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error')
        setListening(false)
        return
      }
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const mime = pickMimeType()
      let recorder: MediaRecorder
      try {
        recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      } catch {
        stream.getTracks().forEach((track) => track.stop())
        setError('error')
        return
      }
      const chunks: Blob[] = []
      const timer = window.setTimeout(() => {
        if (localRef.current?.session === session) {
          clearLocal(false)
          setListening(false)
          setProcessing(true)
        }
      }, 30000)
      localRef.current = { stream, recorder, chunks, session, timer, mime }
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onerror = () => {
        clearLocal(true)
        setListening(false)
        setProcessing(false)
        setError('error')
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        if (session !== sessionRef.current) return
        const blob = new Blob(chunks, { type: mime ?? 'audio/webm' })
        setListening(false)
        setProcessing(true)
        void transcribeLocal(blob, (value) => {
          if (session === sessionRef.current) setProgressSafe(value)
        })
          .then((text) => {
            if (session !== sessionRef.current) return
            setUsedEngine('local')
            if (text) setFinalText(text)
            else setError('no-speech')
          })
          .catch((err) => {
            if (session !== sessionRef.current) return
            const code = err instanceof Error ? err.message : ''
            setError(code === 'no-speech' ? 'no-speech' : 'local-failed')
            if (code !== 'no-speech' && browserSupported) {
              engineRef.current = 'browser'
              setEngineState('browser')
              setError('switched-browser')
            }
          })
          .finally(() => {
            if (session !== sessionRef.current) return
            setProcessing(false)
            setProgressSafe(null)
          })
      }
      try {
        recorder.start(200)
      } catch {
        clearLocal(true)
        setError('error')
        return
      }
      setListening(true)
      setModelReady(localAsrReady())
      // Warm the model while the student is still speaking.
      void loadLocalAsr(setProgressSafe)
        .then(() => setModelReady(true))
        .catch(() => {
          // The error is reported when the recording is transcribed.
        })
    })()

    return true
  }, [browserSupported, clearLocal, localSupported, setProgressSafe])

  const start = useCallback(() => {
    if (engineRef.current === 'local' || !browserSupported) {
      if (!browserSupported && engineRef.current !== 'local') {
        engineRef.current = 'local'
        setEngineState('local')
      }
      return startLocal()
    }
    const Ctor = getRecognition()
    if (!Ctor) {
      engineRef.current = 'local'
      setEngineState('local')
      return startLocal()
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore: the previous session already ended
      }
    }
    sessionRef.current += 1
    const session = sessionRef.current
    const isCurrent = () => session === sessionRef.current
    fallbackRef.current = false

    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    finalRef.current = ''
    setFinalText('')
    setInterim('')
    setError(null)
    setUsedEngine('browser')

    recognition.onstart = () => {
      if (isCurrent()) setListening(true)
    }
    recognition.onresult = (event) => {
      if (!isCurrent()) return
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalRef.current += text
        else interimText += text
      }
      setFinalText(finalRef.current.trim())
      setInterim(interimText.trim())
    }
    recognition.onerror = (event) => {
      if (!isCurrent()) return
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') setError('denied')
      else if (event.error === 'no-speech') setError('no-speech')
      else if (event.error === 'network') {
        setError('network')
        fallbackRef.current = true
      } else if (event.error === 'audio-capture' || event.error === 'aborted') setError('error')
      else {
        setError('error')
        fallbackRef.current = true
      }
    }
    recognition.onend = () => {
      if (!isCurrent()) return
      setListening(false)
      setInterim('')
      recognitionRef.current = null
      if (fallbackRef.current && localSupported) {
        fallbackRef.current = false
        engineRef.current = 'local'
        setEngineState('local')
        setError('switched-local')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      return true
    } catch {
      recognitionRef.current = null
      if (localSupported) {
        engineRef.current = 'local'
        setEngineState('local')
        return startLocal()
      }
      setError('unsupported')
      return false
    }
  }, [browserSupported, lang, localSupported, startLocal])

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort()
      } catch {
        // ignore on unmount
      }
      clearLocal(true)
    }
  }, [clearLocal])

  return {
    supported: browserSupported,
    localSupported,
    engine,
    setEngine,
    modelReady,
    listening,
    processing,
    progress,
    finalText,
    interim,
    error,
    usedEngine,
    start,
    stop,
    cancel,
    reset,
  }
}
