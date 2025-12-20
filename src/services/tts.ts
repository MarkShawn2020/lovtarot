// TTS 服务 - 豆包语音合成
// 暂时使用浏览器内置 TTS 作为后备方案

let currentUtterance: SpeechSynthesisUtterance | null = null

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

    // 尝试使用中文语音
    const voices = window.speechSynthesis.getVoices()
    const chineseVoice = voices.find(v => v.lang.includes('zh'))
    if (chineseVoice) {
      utterance.voice = chineseVoice
    }

    utterance.onend = () => {
      currentUtterance = null
      resolve()
    }

    utterance.onerror = (e) => {
      currentUtterance = null
      reject(e)
    }

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  })
}

// TODO: 接入豆包 TTS API
// async function speakWithDoubao(text: string): Promise<void> {
//   const apiKey = import.meta.env.VITE_DOUBAO_API_KEY
//   if (!apiKey) {
//     throw new Error('未配置豆包 API Key')
//   }
//   // 实现豆包 TTS 调用
// }

export async function speak(text: string): Promise<void> {
  try {
    // 当前使用浏览器 TTS，后续可切换为豆包
    await speakWithBrowserTTS(text)
  } catch (error) {
    console.error('TTS 错误:', error)
    throw error
  }
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

// 预加载语音列表
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}
