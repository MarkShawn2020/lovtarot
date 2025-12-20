// TTS HTTP 流式语音合成服务
// 支持边生成文本边播放语音

// TTS 代理地址（支持 https 或 wss 前缀，自动转换）
const getTTSProxyUrl = () => {
  const url = import.meta.env.VITE_TTS_PROXY_URL || ''
  // 移除 wss:// 或 ws:// 前缀，转换为 https://
  return url.replace(/^wss?:\/\//, 'https://')
}

const getConfig = () => ({
  appId: import.meta.env.VITE_DOUBAO_TTS_APP_ID || '',
  accessToken: import.meta.env.VITE_DOUBAO_TTS_ACCESS_TOKEN || '',
  voiceType: import.meta.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_male_taocheng_uranus_bigtts',
})

type AudioChunk = {
  data: Uint8Array
  isLast: boolean
}

export class StreamingTTS {
  private audioQueue: AudioChunk[] = []
  private isPlaying = false
  private currentAudio: HTMLAudioElement | null = null
  private onError?: (error: Error) => void
  private onEnd?: () => void
  private isStopped = false
  private pendingRequests = 0
  private isFinished = false
  private abortController: AbortController | null = null

  constructor(options?: { onError?: (error: Error) => void; onEnd?: () => void }) {
    this.onError = options?.onError
    this.onEnd = options?.onEnd
  }

  async start(): Promise<void> {
    console.log('[DEBUG][StreamingTTS] start()')
    const config = getConfig()
    console.log('[DEBUG][StreamingTTS] config:', {
      appId: config.appId ? '已配置' : '未配置',
      voiceType: config.voiceType,
    })

    if (!config.appId || !config.accessToken) {
      throw new Error('豆包 TTS 未配置：请设置 VITE_DOUBAO_TTS_APP_ID 和 VITE_DOUBAO_TTS_ACCESS_TOKEN')
    }

    const proxyUrl = getTTSProxyUrl()
    if (!proxyUrl) {
      throw new Error('TTS 代理未配置：请设置 VITE_TTS_PROXY_URL')
    }

    this.isStopped = false
    this.isFinished = false
    this.pendingRequests = 0
    this.audioQueue = []
    this.abortController = new AbortController()
  }

  async sendText(text: string): Promise<void> {
    console.log('[DEBUG][StreamingTTS] sendText:', text.substring(0, 30) + '...')
    if (this.isStopped) return

    const config = getConfig()
    const proxyUrl = getTTSProxyUrl()

    this.pendingRequests++

    try {
      const response = await fetch(`${proxyUrl}/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: this.abortController?.signal,
        body: JSON.stringify({
          text,
          appId: config.appId,
          accessToken: config.accessToken,
          voice_type: config.voiceType,
          encoding: 'mp3',
          speed_ratio: 1.0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`TTS请求失败: ${errorData.error || response.statusText}`)
      }

      const result = (await response.json()) as { audio?: string; error?: string }

      if (result.error) {
        throw new Error(`TTS错误: ${result.error}`)
      }

      if (result.audio) {
        // base64 解码
        const binaryString = atob(result.audio)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        this.audioQueue.push({
          data: bytes,
          isLast: true,
        })

        this.tryPlayNext()
      }
    } catch (e) {
      // 忽略 abort 错误
      if (e instanceof Error && e.name === 'AbortError') return
      console.error('[DEBUG][StreamingTTS] sendText error:', e)
      this.onError?.(e as Error)
    } finally {
      this.pendingRequests--
      this.checkEnd()
    }
  }

  async finish(): Promise<void> {
    console.log('[DEBUG][StreamingTTS] finish()')
    this.isFinished = true
    this.checkEnd()
  }

  private checkEnd(): void {
    // 当所有请求完成、没有在播放、队列为空时，触发结束
    if (this.isFinished && this.pendingRequests === 0 && !this.isPlaying && this.audioQueue.length === 0) {
      console.log('[DEBUG][StreamingTTS] 触发 onEnd')
      this.onEnd?.()
    }
  }

  private tryPlayNext(): void {
    console.log(
      '[DEBUG][StreamingTTS] tryPlayNext, isPlaying:',
      this.isPlaying,
      'queueLen:',
      this.audioQueue.length
    )
    if (this.isPlaying || this.audioQueue.length === 0 || this.isStopped) return

    const chunk = this.audioQueue.shift()!
    this.playAudio(chunk.data)
  }

  private playAudio(audioData: Uint8Array): void {
    if (this.isStopped) return

    this.isPlaying = true
    const blob = new Blob([audioData.buffer as ArrayBuffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    this.currentAudio = new Audio(url)

    this.currentAudio.onended = () => {
      URL.revokeObjectURL(url)
      this.currentAudio = null
      this.isPlaying = false

      if (this.isStopped) return

      // 继续播放队列中的音频
      if (this.audioQueue.length > 0) {
        this.tryPlayNext()
      } else {
        this.checkEnd()
      }
    }

    this.currentAudio.onerror = () => {
      URL.revokeObjectURL(url)
      this.currentAudio = null
      this.isPlaying = false
      this.tryPlayNext()
    }

    this.currentAudio.play().catch((e) => {
      console.error('Audio play error:', e)
      this.isPlaying = false
      this.tryPlayNext()
    })
  }

  stop(): void {
    this.isStopped = true
    this.isFinished = true
    this.audioQueue = []

    // 取消所有未完成的请求
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.src = ''
      this.currentAudio = null
    }

    this.isPlaying = false
  }

  get isSpeaking(): boolean {
    return this.isPlaying || this.audioQueue.length > 0
  }
}

// 简化版：分句发送的辅助函数
export function splitTextToSentences(text: string): string[] {
  // 按中文标点分句
  const sentences = text.split(/([。！？；\n]+)/).filter(Boolean)
  const result: string[] = []

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '')
    if (sentence.trim()) {
      result.push(sentence.trim())
    }
  }

  return result
}
