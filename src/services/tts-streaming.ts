// TTS HTTP 流式语音合成服务
// 直接调用 /api/tts (Vercel Serverless Function)
// 支持按段落流式请求和播放

const getConfig = () => ({
  voiceType: (import.meta.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_female_wanqudashu_moon_bigtts').trim(),
})

type AudioChunk = {
  data: Uint8Array
  index: number // 段落索引，用于保证播放顺序
}

// 将文本按段落分割（以 \n\n 为分隔符，过滤空段落）
export function splitTextByParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

export class StreamingTTS {
  private audioChunks: Map<number, Uint8Array> = new Map() // 按索引存储音频
  private playedIndex = -1 // 已播放到的索引
  private isPlaying = false
  private currentAudio: HTMLAudioElement | null = null
  private onError?: (error: Error) => void
  private onEnd?: () => void
  private onAudioReady?: (allAudio: Uint8Array) => void // 所有音频就绪回调
  private isStopped = false
  private pendingRequests = 0
  private isFinished = false
  private audioReadyCalled = false // 防止 onAudioReady 重复调用
  private abortController: AbortController | null = null
  private totalParagraphs = 0

  constructor(options?: {
    onError?: (error: Error) => void
    onEnd?: () => void
    onAudioReady?: (allAudio: Uint8Array) => void
  }) {
    this.onError = options?.onError
    this.onEnd = options?.onEnd
    this.onAudioReady = options?.onAudioReady
  }

  async start(): Promise<void> {
    this.isStopped = false
    this.isFinished = false
    this.pendingRequests = 0
    this.audioChunks.clear()
    this.playedIndex = -1
    this.totalParagraphs = 0
    this.audioReadyCalled = false
    this.abortController = new AbortController()
    console.log('[TTS Streaming] Started')
  }

  // 发送单个段落进行 TTS（带索引）
  async sendParagraph(text: string, index: number): Promise<void> {
    if (this.isStopped || !text.trim()) return

    this.pendingRequests++
    this.totalParagraphs = Math.max(this.totalParagraphs, index + 1)

    // Mock 模式：使用浏览器内置 TTS
    if (import.meta.env.VITE_DEV_MOCK === 'true') {
      console.log('[TTS Streaming] Mock mode, paragraph', index)
      return new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'zh-CN'
        utterance.rate = 1.2
        utterance.onend = () => {
          this.pendingRequests--
          // Mock 模式标记该段落完成
          this.audioChunks.set(index, new Uint8Array(0))
          this.tryPlayNext()
          this.checkEnd()
          resolve()
        }
        utterance.onerror = () => {
          this.pendingRequests--
          this.checkEnd()
          resolve()
        }
        // Mock 模式按顺序等待播放
        if (index === this.playedIndex + 1) {
          speechSynthesis.speak(utterance)
          this.playedIndex = index
        } else {
          // 延迟播放，等前面的完成
          const checkAndSpeak = () => {
            if (this.isStopped) { resolve(); return }
            if (index === this.playedIndex + 1) {
              speechSynthesis.speak(utterance)
              this.playedIndex = index
            } else {
              setTimeout(checkAndSpeak, 100)
            }
          }
          checkAndSpeak()
        }
      })
    }

    const config = getConfig()

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.abortController?.signal,
        body: JSON.stringify({
          text,
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

        // 存储到对应索引
        this.audioChunks.set(index, bytes)
        console.log(`[TTS] Paragraph ${index} ready, ${bytes.length} bytes`)

        // 尝试播放下一个
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

  // 兼容旧接口：发送全文（内部按段落分割）
  async sendText(text: string): Promise<void> {
    const paragraphs = splitTextByParagraphs(text)
    console.log(`[TTS] Splitting text into ${paragraphs.length} paragraphs`)

    // 依次发送每个段落（串行请求以避免限流）
    for (let i = 0; i < paragraphs.length; i++) {
      if (this.isStopped) break
      await this.sendParagraph(paragraphs[i], i)
    }
  }

  async finish(): Promise<void> {
    console.log(`[TTS Streaming] finish() called, pendingRequests=${this.pendingRequests}, audioChunks.size=${this.audioChunks.size}`)
    this.isFinished = true
    this.checkEnd()
  }

  private checkEnd(): void {
    console.log(`[TTS Streaming] checkEnd: isFinished=${this.isFinished}, pendingRequests=${this.pendingRequests}, audioChunks.size=${this.audioChunks.size}, audioReadyCalled=${this.audioReadyCalled}`)

    // 检查是否所有音频都已准备好
    if (this.isFinished && this.pendingRequests === 0) {
      // 合并所有音频并回调（只调用一次）
      if (this.onAudioReady && this.audioChunks.size > 0 && !this.audioReadyCalled) {
        const allAudio = this.mergeAudioChunks()
        if (allAudio.length > 0) {
          this.audioReadyCalled = true
          console.log(`[TTS Streaming] onAudioReady callback, total audio size: ${allAudio.length} bytes`)
          this.onAudioReady(allAudio)
        }
      }

      // 如果播放完毕，触发结束回调
      if (!this.isPlaying && this.playedIndex >= this.totalParagraphs - 1) {
        this.onEnd?.()
      }
    }
  }

  // 合并所有音频块（按索引顺序）
  private mergeAudioChunks(): Uint8Array {
    const chunks: Uint8Array[] = []
    for (let i = 0; i < this.totalParagraphs; i++) {
      const chunk = this.audioChunks.get(i)
      if (chunk && chunk.length > 0) {
        chunks.push(chunk)
      }
    }
    if (chunks.length === 0) return new Uint8Array(0)

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result
  }

  private tryPlayNext(): void {
    if (this.isPlaying || this.isStopped) return

    // 尝试播放下一个索引的音频
    const nextIndex = this.playedIndex + 1
    const nextChunk = this.audioChunks.get(nextIndex)

    if (nextChunk && nextChunk.length > 0) {
      this.playAudio(nextChunk, nextIndex)
    }
  }

  private playAudio(audioData: Uint8Array, index: number): void {
    if (this.isStopped) return

    this.isPlaying = true
    const blob = new Blob([audioData.buffer as ArrayBuffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    this.currentAudio = new Audio(url)

    this.currentAudio.onended = () => {
      URL.revokeObjectURL(url)
      this.currentAudio = null
      this.isPlaying = false
      this.playedIndex = index

      if (this.isStopped) return

      // 继续播放下一个段落
      this.tryPlayNext()
      this.checkEnd()
    }

    this.currentAudio.onerror = () => {
      URL.revokeObjectURL(url)
      this.currentAudio = null
      this.isPlaying = false
      this.playedIndex = index
      this.tryPlayNext()
    }

    console.log(`[TTS] Playing paragraph ${index}`)
    this.currentAudio.play().catch((e) => {
      console.error('Audio play error:', e)
      this.isPlaying = false
      this.playedIndex = index
      this.tryPlayNext()
    })
  }

  stop(): void {
    this.isStopped = true
    this.isFinished = true
    this.audioChunks.clear()

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

    // Mock 模式：停止浏览器 TTS
    speechSynthesis.cancel()

    this.isPlaying = false
  }

  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause()
    }
    // Mock 模式：暂停浏览器 TTS
    speechSynthesis.pause()
  }

  resume(): void {
    if (this.currentAudio && !this.isStopped) {
      this.currentAudio.play().catch(console.error)
    }
    // Mock 模式：恢复浏览器 TTS
    speechSynthesis.resume()
  }

  get isSpeaking(): boolean {
    return this.isPlaying || this.audioChunks.size > this.playedIndex + 1
  }

  // 获取所有已收集的音频（用于缓存）
  getAllAudio(): Uint8Array | null {
    if (this.audioChunks.size === 0) return null
    return this.mergeAudioChunks()
  }
}
