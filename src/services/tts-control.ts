// 全局 TTS 控制服务
// 用于在 MusicControl 中统一控制语音播放

export type TTSState = 'idle' | 'playing' | 'paused'

type TTSController = {
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  getState: () => TTSState
  setVolume: (v: number) => void
  getVolume: () => number
}

type Listener = (state: TTSState) => void

let currentController: TTSController | null = null
let globalVolume = 1
const listeners = new Set<Listener>()

export function registerTTS(controller: TTSController): void {
  currentController = controller
  notifyListeners()
}

export function unregisterTTS(): void {
  currentController = null
  notifyListeners()
}

export function playTTS(): void {
  currentController?.play()
}

export function pauseTTS(): void {
  currentController?.pause()
}

export function resumeTTS(): void {
  currentController?.resume()
}

export function stopTTS(): void {
  currentController?.stop()
}

export function getTTSState(): TTSState {
  return currentController?.getState() ?? 'idle'
}

export function setTTSVolume(v: number): void {
  globalVolume = v
  currentController?.setVolume(v)
}

export function getTTSVolume(): number {
  return currentController?.getVolume() ?? globalVolume
}

export function hasTTS(): boolean {
  return currentController !== null
}

export function subscribeTTS(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyListeners(): void {
  const state = getTTSState()
  listeners.forEach(fn => fn(state))
}
