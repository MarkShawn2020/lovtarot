// TTS 服务 - 豆包语音合成 (WebSocket 二进制协议)

const DOUBAO_TTS_WS_URL = 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary'

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

// 二进制协议常量
enum MsgType {
  FullClientRequest = 0b0001,
  AudioOnlyServer = 0b1011,
  FrontEndResultServer = 0b1100,
  Error = 0b1111,
}

enum MsgTypeFlagBits {
  NoSeq = 0,
  PositiveSeq = 0b0001,
  NegativeSeq = 0b0011,
}

enum HeaderSizeBits {
  HeaderSize4 = 1,
}

enum VersionBits {
  Version1 = 1,
}

enum SerializationBits {
  JSON = 0b0001,
}

enum CompressionBits {
  None = 0,
}

// 序列化请求消息
function marshalMessage(payload: Uint8Array): Uint8Array {
  const headerSize = 4
  const payloadSize = payload.length

  // Header (4 bytes) + payload size (4 bytes) + payload
  const result = new Uint8Array(headerSize + 4 + payloadSize)

  // Byte 0: version (4 bits) | header size (4 bits)
  result[0] = (VersionBits.Version1 << 4) | HeaderSizeBits.HeaderSize4
  // Byte 1: msg type (4 bits) | flag (4 bits)
  result[1] = (MsgType.FullClientRequest << 4) | MsgTypeFlagBits.NoSeq
  // Byte 2: serialization (4 bits) | compression (4 bits)
  result[2] = (SerializationBits.JSON << 4) | CompressionBits.None
  // Byte 3: reserved
  result[3] = 0

  // Payload size (big endian)
  const view = new DataView(result.buffer, headerSize, 4)
  view.setUint32(0, payloadSize, false)

  // Payload
  result.set(payload, headerSize + 4)

  return result
}

// 解析响应消息
interface ParsedMessage {
  type: MsgType
  flag: number
  sequence?: number
  payload: Uint8Array
  errorCode?: number
}

function unmarshalMessage(data: Uint8Array): ParsedMessage {
  if (data.length < 4) {
    throw new Error(`Data too short: ${data.length}`)
  }

  const headerSizeUnits = data[0] & 0x0f
  const headerSize = headerSizeUnits * 4
  const msgType = (data[1] >> 4) as MsgType
  const flag = data[1] & 0x0f

  let offset = headerSize
  let sequence: number | undefined
  let errorCode: number | undefined

  // 读取 sequence（如果有）
  if (msgType === MsgType.AudioOnlyServer || msgType === MsgType.FrontEndResultServer) {
    if (flag === MsgTypeFlagBits.PositiveSeq || flag === MsgTypeFlagBits.NegativeSeq) {
      if (offset + 4 > data.length) {
        throw new Error('Insufficient data for sequence')
      }
      const view = new DataView(data.buffer, data.byteOffset + offset, 4)
      sequence = view.getInt32(0, false)
      offset += 4
    }
  }

  // 读取 error code（如果是错误消息）
  if (msgType === MsgType.Error) {
    if (offset + 4 > data.length) {
      throw new Error('Insufficient data for error code')
    }
    const view = new DataView(data.buffer, data.byteOffset + offset, 4)
    errorCode = view.getUint32(0, false)
    offset += 4
  }

  // 读取 payload size
  if (offset + 4 > data.length) {
    throw new Error('Insufficient data for payload size')
  }
  const payloadView = new DataView(data.buffer, data.byteOffset + offset, 4)
  const payloadSize = payloadView.getUint32(0, false)
  offset += 4

  // 读取 payload
  let payload = new Uint8Array(0)
  if (payloadSize > 0) {
    if (offset + payloadSize > data.length) {
      throw new Error('Insufficient data for payload')
    }
    payload = data.slice(offset, offset + payloadSize)
  }

  return { type: msgType, flag, sequence, payload, errorCode }
}

function voiceTypeToCluster(voiceType: string): string {
  if (voiceType.startsWith('S_')) {
    return 'volcano_icl'
  }
  return 'volcano_tts'
}

let currentAudio: HTMLAudioElement | null = null

async function speakWithDoubao(text: string): Promise<void> {
  const config = getConfig()

  if (!config.appId || !config.accessToken) {
    console.warn('豆包 TTS 未配置，使用浏览器 TTS')
    return speakWithBrowserTTS(text)
  }

  return new Promise((resolve, reject) => {
    // 浏览器 WebSocket 不支持自定义 headers，需要通过 URL 参数传递
    const wsUrl = `${DOUBAO_TTS_WS_URL}?authorization=Bearer;${encodeURIComponent(config.accessToken)}`
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'

    const audioChunks: Uint8Array[] = []
    let connected = false

    ws.onopen = () => {
      connected = true
      const request = {
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
        },
        request: {
          reqid: generateUUID(),
          text: text,
          operation: 'submit',
        },
      }

      const payload = new TextEncoder().encode(JSON.stringify(request))
      const message = marshalMessage(payload)
      ws.send(message)
    }

    ws.onmessage = (event) => {
      try {
        const data = new Uint8Array(event.data as ArrayBuffer)
        const msg = unmarshalMessage(data)

        if (msg.type === MsgType.Error) {
          const errorText = new TextDecoder().decode(msg.payload)
          ws.close()
          reject(new Error(`TTS Error (${msg.errorCode}): ${errorText}`))
          return
        }

        if (msg.type === MsgType.AudioOnlyServer && msg.payload.length > 0) {
          audioChunks.push(msg.payload)
        }

        // sequence < 0 表示最后一个包
        if (msg.type === MsgType.AudioOnlyServer && msg.sequence !== undefined && msg.sequence < 0) {
          ws.close()
        }
      } catch (e) {
        ws.close()
        reject(e)
      }
    }

    ws.onerror = (e) => {
      reject(new Error(`WebSocket error: ${e}`))
    }

    ws.onclose = () => {
      if (audioChunks.length === 0) {
        if (connected) {
          reject(new Error('未收到音频数据'))
        }
        return
      }

      // 合并音频并播放
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const audioBuffer = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of audioChunks) {
        audioBuffer.set(chunk, offset)
        offset += chunk.length
      }

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
    }
  })
}

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
