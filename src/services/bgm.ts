// 背景音乐服务
// 使用 Mixkit 免费音乐 (Mixkit Stock Music Free License)

const BGM_TRACKS = [
  'https://assets.mixkit.co/music/441/441.mp3',   // Meditation - Arulo
  'https://assets.mixkit.co/music/345/345.mp3',   // Nature Meditation - Arulo
  'https://assets.mixkit.co/music/365/365.mp3',   // Relaxation Meditation - Arulo
]

let audio: HTMLAudioElement | null = null
let currentTrackIndex = 0
let isPlaying = false

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

  audio = new Audio(getRandomTrack())
  audio.volume = 0.3  // 默认 30% 音量，不抢 TTS
  audio.loop = false  // 手动处理循环，实现多曲目轮播

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
    await audio.play()
    isPlaying = true
  } catch (e) {
    // 浏览器可能需要用户交互才能播放
    console.warn('BGM autoplay blocked:', e)
  }
}

export function pauseBGM(): void {
  if (audio && isPlaying) {
    audio.pause()
    isPlaying = false
  }
}

export function toggleBGM(): boolean {
  if (isPlaying) {
    pauseBGM()
  } else {
    playBGM()
  }
  return isPlaying
}

export function setVolume(vol: number): void {
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, vol))
  }
}

export function getVolume(): number {
  return audio?.volume ?? 0.3
}

export function isBGMPlaying(): boolean {
  return isPlaying
}
