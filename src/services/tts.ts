// TTS 服务 - 豆包语音合成 (HTTP V3 接口)

// V3 HTTP 单向流式接口，支持大模型音色 2.0
const DOUBAO_TTS_HTTP_URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

// 从环境变量读取配置
const getConfig = () => ({
  appId: import.meta.env.VITE_DOUBAO_TTS_APP_ID || '',
  accessToken: import.meta.env.VITE_DOUBAO_TTS_ACCESS_TOKEN || '',
  voiceType: import.meta.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_female_vv_uranus_bigtts',
})

// 生成 UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 当前播放状态
let currentAudio: HTMLAudioElement | null = null

// 使用豆包 TTS (HTTP 流式)
async function speakWithDoubao(text: string): Promise<void> {
  const config = getConfig()

  if (!config.appId || !config.accessToken) {
    console.warn('豆包 TTS 未配置，使用浏览器 TTS')
    return speakWithBrowserTTS(text)
  }

  const payload = {
    app: {
      appid: config.appId,
      token: 'fake_token',
      cluster: 'volcano_tts',
    },
    user: {
      uid: 'web_user',
    },
    audio: {
      voice_type: config.voiceType,
      encoding: 'mp3',
      speed_ratio: 1.0,
      rate: 24000,
    },
    request: {
      reqid: generateUUID(),
      text: text,
      operation: 'submit',
    },
  }

  const response = await fetch(DOUBAO_TTS_HTTP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer;${config.accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TTS 请求失败: ${response.status} ${errorText}`)
  }

  // 读取流式响应
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const audioChunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    // V3 HTTP 流式响应：每个 chunk 前 4 字节是 header，后面是音频数据
    if (value && value.length > 4) {
      const audioData = value.slice(4)
      if (audioData.length > 0) {
        audioChunks.push(audioData)
      }
    }
  }

  if (audioChunks.length === 0) {
    throw new Error('未收到音频数据')
  }

  // 合并音频数据
  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const audioBuffer = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of audioChunks) {
    audioBuffer.set(chunk, offset)
    offset += chunk.length
  }

  // 播放音频
  return new Promise((resolve, reject) => {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)

    currentAudio = new Audio(url)

    currentAudio.onended = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      resolve()
    }

    currentAudio.onerror = (e) => {
      URL.revokeObjectURL(url)
      currentAudio = null
      reject(e)
    }

    currentAudio.play().catch(reject)
  })
}

// 浏览器内置 TTS（后备方案）
function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('浏览器不支持语音合成'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    utterance.pitch = 1

    const voices = window.speechSynthesis.getVoices()
    const chineseVoice = voices.find((v) => v.lang.includes('zh'))
    if (chineseVoice) {
      utterance.voice = chineseVoice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e)

    window.speechSynthesis.speak(utterance)
  })
}

export async function speak(text: string): Promise<void> {
  try {
    await speakWithDoubao(text)
  } catch (error) {
    console.error('豆包 TTS 失败，回退到浏览器 TTS:', error)
    await speakWithBrowserTTS(text)
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

// 预加载浏览器语音列表
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}
