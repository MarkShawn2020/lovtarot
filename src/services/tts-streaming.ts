// TTS 2.0 双向流式语音合成服务
// 支持边生成文本边播放语音

import {
  EventType,
  MsgType,
  unmarshalMessage,
  createStartConnectionMessage,
  createFinishConnectionMessage,
  createStartSessionMessage,
  createFinishSessionMessage,
  createTaskRequestMessage,
  getEventName,
  type Message,
} from './tts-protocol'

const DOUBAO_TTS_WS_URL = 'wss://openspeech.bytedance.com/api/v3/tts/bidirection'

const getConfig = () => ({
  appId: import.meta.env.VITE_DOUBAO_TTS_APP_ID || '',
  accessToken: import.meta.env.VITE_DOUBAO_TTS_ACCESS_TOKEN || '',
  voiceType: import.meta.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_male_taocheng_uranus_bigtts',
})

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function voiceTypeToCluster(voiceType: string): string {
  if (voiceType.startsWith('S_')) {
    return 'volcano_icl'
  }
  return 'volcano_tts'
}

type AudioChunk = {
  data: Uint8Array
  isLast: boolean
}

export class StreamingTTS {
  private ws: WebSocket | null = null
  private sessionId: string = ''
  private audioQueue: AudioChunk[] = []
  private isPlaying = false
  private currentAudio: HTMLAudioElement | null = null
  private onError?: (error: Error) => void
  private onEnd?: () => void
  private pendingTexts: string[] = []
  private isSessionReady = false
  private isStopped = false
  private reqSeq = 0

  constructor(options?: { onError?: (error: Error) => void; onEnd?: () => void }) {
    this.onError = options?.onError
    this.onEnd = options?.onEnd
  }

  async start(): Promise<void> {
    console.log('[DEBUG][StreamingTTS] start() 入口')
    const config = getConfig()
    console.log('[DEBUG][StreamingTTS] config:', { appId: config.appId ? '已配置' : '未配置', voiceType: config.voiceType })

    if (!config.appId || !config.accessToken) {
      throw new Error('豆包 TTS 未配置：请设置 VITE_DOUBAO_TTS_APP_ID 和 VITE_DOUBAO_TTS_ACCESS_TOKEN')
    }

    this.isStopped = false
    this.sessionId = generateUUID()
    this.reqSeq = 0

    return new Promise((resolve, reject) => {
      const wsUrl = `${DOUBAO_TTS_WS_URL}?authorization=Bearer;${encodeURIComponent(config.accessToken)}`
      console.log('[DEBUG][StreamingTTS] 连接 WebSocket:', wsUrl.split('?')[0])
      this.ws = new WebSocket(wsUrl)
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = async () => {
        console.log('[DEBUG][StreamingTTS] WebSocket onopen')
        try {
          // Step 1: StartConnection
          this.ws!.send(createStartConnectionMessage())
        } catch (e) {
          reject(e)
        }
      }

      this.ws.onmessage = (event) => {
        if (this.isStopped) {
          console.log('[DEBUG][StreamingTTS] onmessage 但 isStopped=true，忽略')
          return
        }

        try {
          const data = new Uint8Array(event.data as ArrayBuffer)
          const msg = unmarshalMessage(data)
          this.handleMessage(msg, resolve, reject)
        } catch (e) {
          console.error('[DEBUG][StreamingTTS] message parse error:', e)
          this.onError?.(e as Error)
        }
      }

      this.ws.onerror = (e) => {
        console.error('[DEBUG][StreamingTTS] WebSocket error:', e)
        reject(new Error('WebSocket 连接失败'))
      }

      this.ws.onclose = (e) => {
        console.log('[DEBUG][StreamingTTS] WebSocket onclose, code:', e.code, 'reason:', e.reason, 'isStopped:', this.isStopped)
        if (!this.isStopped) {
          this.playRemainingAudio()
        }
      }
    })
  }

  private handleMessage(msg: Message, resolve?: () => void, reject?: (e: Error) => void): void {
    const config = getConfig()
    console.log('[DEBUG][StreamingTTS] handleMessage, type:', getMsgTypeName(msg.type), 'event:', msg.event !== undefined ? getEventName(msg.event) : 'none')

    if (msg.type === MsgType.Error) {
      const errorText = new TextDecoder().decode(msg.payload)
      const error = new Error(`TTS Error (${msg.errorCode}): ${errorText}`)
      console.error('[DEBUG][StreamingTTS] Error:', error)
      this.onError?.(error)
      reject?.(error)
      return
    }

    // 处理事件消息
    if (msg.event !== undefined) {
      console.log('[DEBUG][StreamingTTS] 处理事件:', getEventName(msg.event))

      switch (msg.event) {
        case EventType.ConnectionStarted:
          // Step 2: StartSession
          const sessionConfig = {
            app: {
              appid: config.appId,
              token: config.accessToken,
              cluster: voiceTypeToCluster(config.voiceType),
            },
            user: {
              uid: 'web_user_' + generateUUID(),
            },
            audio: {
              voice_type: config.voiceType,
              encoding: 'mp3',
              speed_ratio: 1.0,
            },
          }
          this.ws!.send(createStartSessionMessage(this.sessionId, sessionConfig))
          break

        case EventType.SessionStarted:
          console.log('[DEBUG][StreamingTTS] SessionStarted, resolve promise')
          this.isSessionReady = true
          resolve?.()
          // 发送待处理的文本
          this.flushPendingTexts()
          break

        case EventType.SessionFinished:
        case EventType.TTSEnded:
          // 会话结束，播放剩余音频
          console.log('[DEBUG][StreamingTTS] 会话结束事件，调用 playRemainingAudio')
          this.playRemainingAudio()
          break

        case EventType.SessionFailed:
          const errorPayload = new TextDecoder().decode(msg.payload)
          console.error('Session failed:', errorPayload)
          this.onError?.(new Error(`Session failed: ${errorPayload}`))
          break

        case EventType.TTSResponse:
          // 收到音频数据
          if (msg.payload.length > 0) {
            this.audioQueue.push({
              data: msg.payload,
              isLast: false,
            })
            this.tryPlayNext()
          }
          break

        case EventType.TTSSentenceEnd:
          // 一句话合成完毕，标记为可播放
          if (this.audioQueue.length > 0) {
            this.audioQueue[this.audioQueue.length - 1].isLast = true
          }
          this.tryPlayNext()
          break
      }
    }

    // 处理纯音频消息（无事件）
    if (msg.type === MsgType.AudioOnlyServer && msg.payload.length > 0) {
      this.audioQueue.push({
        data: msg.payload,
        isLast: msg.sequence !== undefined && msg.sequence < 0,
      })
      this.tryPlayNext()
    }
  }

  private flushPendingTexts(): void {
    for (const text of this.pendingTexts) {
      this.doSendText(text)
    }
    this.pendingTexts = []
  }

  private doSendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[DEBUG][StreamingTTS] doSendText 跳过，ws不可用')
      return
    }

    console.log('[DEBUG][StreamingTTS] doSendText:', text.substring(0, 30) + '...')
    const payload = {
      text: text,
      reqid: generateUUID(),
      sequence: ++this.reqSeq,
    }
    this.ws.send(createTaskRequestMessage(this.sessionId, payload))
  }

  sendText(text: string): void {
    console.log('[DEBUG][StreamingTTS] sendText, isStopped:', this.isStopped, 'isSessionReady:', this.isSessionReady)
    if (this.isStopped) return

    // 如果会话还没准备好，先缓存
    if (!this.isSessionReady) {
      this.pendingTexts.push(text)
      return
    }

    this.doSendText(text)
  }

  async finish(): Promise<void> {
    console.log('[DEBUG][StreamingTTS] finish() called, ws状态:', this.ws?.readyState)
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    // 发送 FinishSession
    this.ws.send(createFinishSessionMessage(this.sessionId))
  }

  private tryPlayNext(): void {
    console.log('[DEBUG][StreamingTTS] tryPlayNext, isPlaying:', this.isPlaying, 'queueLen:', this.audioQueue.length, 'isStopped:', this.isStopped)
    if (this.isPlaying || this.audioQueue.length === 0 || this.isStopped) return

    // 收集连续的音频块直到遇到 isLast
    const chunks: Uint8Array[] = []
    while (this.audioQueue.length > 0) {
      const chunk = this.audioQueue.shift()!
      chunks.push(chunk.data)
      if (chunk.isLast) break
    }

    if (chunks.length === 0) return

    // 合并音频并播放
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
    const audioBuffer = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset)
      offset += chunk.length
    }

    this.playAudio(audioBuffer)
  }

  private playAudio(audioData: Uint8Array): void {
    if (this.isStopped) return

    this.isPlaying = true
    const blob = new Blob([new Uint8Array(audioData)], { type: 'audio/mpeg' })
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
      } else if (this.ws?.readyState !== WebSocket.OPEN) {
        // WebSocket 已关闭且队列为空，播放结束
        this.onEnd?.()
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

  private playRemainingAudio(): void {
    console.log('[DEBUG][StreamingTTS] playRemainingAudio, queueLen:', this.audioQueue.length, 'isPlaying:', this.isPlaying)
    // 播放队列中剩余的所有音频
    if (this.audioQueue.length > 0 && !this.isPlaying) {
      // 标记最后一个为 isLast
      if (this.audioQueue.length > 0) {
        this.audioQueue[this.audioQueue.length - 1].isLast = true
      }
      this.tryPlayNext()
    } else if (!this.isPlaying) {
      console.log('[DEBUG][StreamingTTS] playRemainingAudio 触发 onEnd')
      this.onEnd?.()
    }
  }

  stop(): void {
    this.isStopped = true
    this.isSessionReady = false
    this.pendingTexts = []
    this.audioQueue = []

    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.src = ''
      this.currentAudio = null
    }

    if (this.ws) {
      try {
        this.ws.send(createFinishConnectionMessage())
      } catch {
        // ignore
      }
      this.ws.close()
      this.ws = null
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
