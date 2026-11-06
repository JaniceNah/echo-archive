export type DmVoiceEndReason = 'complete' | 'cancelled' | 'superseded' | 'error'

export interface SpeakDmOptions {
  owner?: string
  rate?: number
  onStart?: () => void
  onBoundary?: (originalIndex: number) => void
  onEnd?: (reason: DmVoiceEndReason) => void
}

export interface DmSpeechHandle {
  cancel: () => void
}

export type NeuralState = 'idle' | 'loading' | 'ready' | 'failed' | 'unsupported'

export interface NeuralSnapshot {
  state: NeuralState
  progress: number | null
  voice: string
}

export type TtsRequest =
  | { type: 'load'; base: string }
  | { type: 'synth'; id: number; chunkIndex: number; text: string; voice: string; speed: number }
  | { type: 'cancel'; id: number }

export type TtsResponse =
  | { type: 'progress'; progress: number | null }
  | { type: 'ready' }
  | { type: 'unsupported'; reason: string }
  | { type: 'error'; message: string; id?: number }
  | { type: 'audio'; id: number; chunkIndex: number; samples: Float32Array; sampleRate: number }
