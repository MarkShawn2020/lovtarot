// 全局 TTS 控制服务
// 用于在 MusicControl 中统一控制语音播放

type TTSController = {
  toggle: () => void
  stop: () => void
  isSpeaking: () => boolean
}

type Listener = (speaking: boolean) => void

let currentController: TTSController | null = null
const listeners = new Set<Listener>()

export function registerTTS(controller: TTSController): void {
  currentController = controller
  notifyListeners()
}

export function unregisterTTS(): void {
  currentController = null
  notifyListeners()
}

export function toggleTTS(): void {
  currentController?.toggle()
}

export function stopTTS(): void {
  currentController?.stop()
}

export function isTTSSpeaking(): boolean {
  return currentController?.isSpeaking() ?? false
}

export function hasTTS(): boolean {
  return currentController !== null
}

export function subscribeTTS(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyListeners(): void {
  const speaking = isTTSSpeaking()
  listeners.forEach(fn => fn(speaking))
}
