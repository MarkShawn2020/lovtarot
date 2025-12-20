// TTS HTTP 流式语音合成服务
// 直接调用 /api/tts (Vercel Serverless Function)

const getConfig = () => ({
  appId: import.meta.env.VITE_DOUBAO_TTS_APP_ID || '',
  accessToken: import.meta.env.VITE_DOUBAO_TTS_ACCESS_TOKEN || '',
  voiceType: import.meta.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_female_wanqudashu_moon_bigtts',
  resourceId: import.meta.env.VITE_DOUBAO_TTS_RESOURCE_ID || 'seed-tts-1.0',
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
  // 请求队列，避免并发导致豆包限流
  private requestQueue: string[] = []
  private isProcessingQueue = false

  constructor(options?: { onError?: (error: Error) => void; onEnd?: () => void }) {
    this.onError = options?.onError
    this.onEnd = options?.onEnd
  }

  async start(): Promise<void> {
    const config = getConfig()

    if (!config.appId || !config.accessToken) {
      throw new Error('豆包 TTS 未配置：请设置 VITE_DOUBAO_TTS_APP_ID 和 VITE_DOUBAO_TTS_ACCESS_TOKEN')
    }

    this.isStopped = false
    this.isFinished = false
    this.pendingRequests = 0
    this.audioQueue = []
    this.abortController = new AbortController()
  }

  async sendText(text: string): Promise<void> {
    if (this.isStopped) return

    // 加入队列，串行处理避免并发限流
    this.requestQueue.push(text)
    this.pendingRequests++
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return
    this.isProcessingQueue = true

    while (this.requestQueue.length > 0 && !this.isStopped) {
      const text = this.requestQueue.shift()!
      await this.doSendText(text)
    }

    this.isProcessingQueue = false
  }

  private async doSendText(text: string): Promise<void> {
    const config = getConfig()

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.abortController?.signal,
        body: JSON.stringify({
          text,
          appId: config.appId,
          accessToken: config.accessToken,
          resourceId: config.resourceId,
          voiceType: config.voiceType,
          encoding: 'mp3',
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string }
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

        this.audioQueue.push({ data: bytes, isLast: true })
        this.tryPlayNext()
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      this.onError?.(e as Error)
    } finally {
      this.pendingRequests--
      this.checkEnd()
    }
  }

  async finish(): Promise<void> {
    this.isFinished = true
    this.checkEnd()
  }

  private checkEnd(): void {
    if (this.isFinished && this.pendingRequests === 0 && !this.isPlaying && this.audioQueue.length === 0) {
      this.onEnd?.()
    }
  }

  private tryPlayNext(): void {
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
    this.requestQueue = []

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

// 智能断句器：处理流式文本，只返回完整句子
export class SentenceBuffer {
  private buffer = ''
  private sentSentences = new Set<string>()

  // 添加新文本，返回新的完整句子
  addText(text: string): string[] {
    this.buffer = text
    const newSentences: string[] = []

    // 匹配所有完整句子（以中文标点或换行结尾）
    const pattern = /[^。！？；\n]+[。！？；\n]+/g
    let match: RegExpExecArray | null

    while ((match = pattern.exec(this.buffer)) !== null) {
      const sentence = match[0].trim()
      if (sentence && !this.sentSentences.has(sentence)) {
        this.sentSentences.add(sentence)
        newSentences.push(sentence)
      }
    }

    return newSentences
  }

  // 流结束时，发送剩余的不完整句子
  flush(): string | null {
    // 找到最后一个标点后的内容
    const lastPuncIndex = Math.max(
      this.buffer.lastIndexOf('。'),
      this.buffer.lastIndexOf('！'),
      this.buffer.lastIndexOf('？'),
      this.buffer.lastIndexOf('；'),
      this.buffer.lastIndexOf('\n')
    )

    const remaining = lastPuncIndex >= 0
      ? this.buffer.slice(lastPuncIndex + 1).trim()
      : this.buffer.trim()

    if (remaining && !this.sentSentences.has(remaining)) {
      this.sentSentences.add(remaining)
      return remaining
    }
    return null
  }

  clear(): void {
    this.buffer = ''
    this.sentSentences.clear()
  }
}
