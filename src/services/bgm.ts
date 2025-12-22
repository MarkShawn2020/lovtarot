// 背景音乐服务
// 使用 Mixkit 免费音乐 (Mixkit Stock Music Free License)

const BGM_TRACKS = [
  'https://assets.mixkit.co/music/441/441.mp3',   // Meditation - Arulo
  'https://assets.mixkit.co/music/345/345.mp3',   // Nature Meditation - Arulo
  'https://assets.mixkit.co/music/365/365.mp3',   // Relaxation Meditation - Arulo
]

const STORAGE_KEY = 'taluo_bgm'

interface BGMState {
  volume: number
  enabled: boolean  // 用户是否希望播放音乐
}

let audio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let gainNode: GainNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let currentTrackIndex = 0
let isPlaying = false

function loadState(): BGMState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { volume: 0.3, enabled: true }
}

function saveState(state: Partial<BGMState>): void {
  try {
    const current = loadState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }))
  } catch {}
}

function getRandomTrack(): string {
  currentTrackIndex = Math.floor(Math.random() * BGM_TRACKS.length)
  return BGM_TRACKS[currentTrackIndex]
}

function getNextTrack(): string {
  currentTrackIndex = (currentTrackIndex + 1) % BGM_TRACKS.length
  return BGM_TRACKS[currentTrackIndex]
}

export function initBGM(): void {
  if (audio) return

  const state = loadState()
  audio = new Audio(getRandomTrack())
  audio.crossOrigin = 'anonymous'  // 需要设置才能用 Web Audio API
  audio.loop = false

  // 使用 Web Audio API 控制音量（iOS 上 audio.volume 无效）
  try {
    audioContext = new AudioContext()
    gainNode = audioContext.createGain()
    sourceNode = audioContext.createMediaElementSource(audio)
    sourceNode.connect(gainNode)
    gainNode.connect(audioContext.destination)
    gainNode.gain.value = sliderToVolume(state.volume)
  } catch (e) {
    // Web Audio API 不可用时回退到 audio.volume
    console.warn('Web Audio API not available, fallback to audio.volume')
    audio.volume = sliderToVolume(state.volume)
  }

  audio.addEventListener('ended', () => {
    if (isPlaying && audio) {
      audio.src = getNextTrack()
      audio.play().catch(() => {})
    }
  })
}

export async function playBGM(): Promise<void> {
  if (!audio) initBGM()
  if (!audio || isPlaying) return

  try {
    // iOS 会在后台挂起 AudioContext，需要恢复
    if (audioContext?.state === 'suspended') {
      await audioContext.resume()
    }
    await audio.play()
    isPlaying = true
    saveState({ enabled: true })
  } catch (e) {
    console.warn('BGM autoplay blocked:', e)
  }
}

export function pauseBGM(): void {
  if (audio && isPlaying) {
    audio.pause()
    isPlaying = false
    saveState({ enabled: false })
  }
}

export function stopBGM(): void {
  if (audio) {
    audio.pause()
    audio.currentTime = 0
    isPlaying = false
    saveState({ enabled: false })
  }
}

// 滑块值 -> 实际音量（指数曲线，低音量区更精细）
function sliderToVolume(slider: number): number {
  return Math.pow(slider, 3)  // 0.5 滑块 = 0.125 音量
}

// 实际音量 -> 滑块值（反函数）- 保留用于未来可能的双向转换
// @ts-expect-error unused but kept for symmetry with sliderToVolume
function _volumeToSlider(volume: number): number {
  return Math.pow(volume, 1/3)
}

export function setVolume(slider: number): void {
  const s = Math.max(0, Math.min(1, slider))
  const actualVolume = sliderToVolume(s)
  // 优先使用 GainNode（iOS 兼容），回退到 audio.volume
  if (gainNode) {
    gainNode.gain.value = actualVolume
  } else if (audio) {
    audio.volume = actualVolume
  }
  saveState({ volume: s })  // 存储滑块值
}

export function getVolume(): number {
  return loadState().volume  // 返回滑块值
}

export function getActualVolume(): number {
  return gainNode?.gain.value ?? audio?.volume ?? sliderToVolume(loadState().volume)
}

export function isBGMPlaying(): boolean {
  return isPlaying
}

export function isBGMEnabled(): boolean {
  return loadState().enabled
}

// 尝试自动播放（需要在用户交互后调用）
export async function tryAutoPlay(): Promise<void> {
  if (!loadState().enabled) return
  await playBGM()
}
