// TTS 2.0 双向流式协议 - 浏览器兼容版本
// 基于 volcengine_binary_demo/src/protocols.ts 适配

export const EventType = {
  None: 0,
  StartConnection: 1,
  FinishConnection: 2,
  ConnectionStarted: 50,
  ConnectionFailed: 51,
  ConnectionFinished: 52,
  StartSession: 100,
  FinishSession: 102,
  SessionStarted: 150,
  SessionFinished: 152,
  SessionFailed: 153,
  TaskRequest: 200,
  TTSSentenceStart: 350,
  TTSSentenceEnd: 351,
  TTSResponse: 352,
  TTSEnded: 359,
} as const

export type EventType = (typeof EventType)[keyof typeof EventType]

export const MsgType = {
  Invalid: 0,
  FullClientRequest: 0b0001,
  AudioOnlyClient: 0b0010,
  FullServerResponse: 0b1001,
  AudioOnlyServer: 0b1011,
  FrontEndResultServer: 0b1100,
  Error: 0b1111,
} as const

export type MsgType = (typeof MsgType)[keyof typeof MsgType]

export const MsgTypeFlagBits = {
  NoSeq: 0,
  PositiveSeq: 0b0001,
  LastNoSeq: 0b0010,
  NegativeSeq: 0b0011,
  WithEvent: 0b0100,
} as const

export type MsgTypeFlagBits = (typeof MsgTypeFlagBits)[keyof typeof MsgTypeFlagBits]

const VersionBits = { Version1: 1 } as const
const HeaderSizeBits = { HeaderSize4: 1 } as const
const SerializationBits = { JSON: 0b0001 } as const
const CompressionBits = { None: 0 } as const

export interface Message {
  version: number
  headerSize: number
  type: MsgType
  flag: MsgTypeFlagBits
  serialization: number
  compression: number
  event?: EventType
  sessionId?: string
  connectId?: string
  sequence?: number
  errorCode?: number
  payload: Uint8Array
}

function createMessage(msgType: MsgType, flag: MsgTypeFlagBits): Message {
  return {
    version: VersionBits.Version1,
    headerSize: HeaderSizeBits.HeaderSize4,
    type: msgType,
    flag: flag,
    serialization: SerializationBits.JSON,
    compression: CompressionBits.None,
    payload: new Uint8Array(0),
  }
}

// 序列化消息
export function marshalMessage(msg: Message): Uint8Array {
  const buffers: Uint8Array[] = []
  const headerSize = 4 * msg.headerSize
  const header = new Uint8Array(headerSize)

  header[0] = (msg.version << 4) | msg.headerSize
  header[1] = (msg.type << 4) | msg.flag
  header[2] = (msg.serialization << 4) | msg.compression
  header[3] = 0

  buffers.push(header)

  // WithEvent 需要写入 event 和 sessionId
  if (msg.flag === MsgTypeFlagBits.WithEvent) {
    if (msg.event !== undefined) {
      const eventBuf = new Uint8Array(4)
      new DataView(eventBuf.buffer).setInt32(0, msg.event, false)
      buffers.push(eventBuf)
    }

    // 非连接事件需要写入 sessionId
    if (
      msg.event !== EventType.StartConnection &&
      msg.event !== EventType.FinishConnection &&
      msg.event !== EventType.ConnectionStarted &&
      msg.event !== EventType.ConnectionFailed
    ) {
      const sessionId = msg.sessionId || ''
      const sessionIdBytes = new TextEncoder().encode(sessionId)
      const sizeBuf = new Uint8Array(4)
      new DataView(sizeBuf.buffer).setUint32(0, sessionIdBytes.length, false)
      buffers.push(sizeBuf)
      if (sessionIdBytes.length > 0) {
        buffers.push(sessionIdBytes)
      }
    }
  }

  // 写入 sequence（如果有）
  if (
    (msg.flag === MsgTypeFlagBits.PositiveSeq || msg.flag === MsgTypeFlagBits.NegativeSeq) &&
    msg.sequence !== undefined
  ) {
    const seqBuf = new Uint8Array(4)
    new DataView(seqBuf.buffer).setInt32(0, msg.sequence, false)
    buffers.push(seqBuf)
  }

  // 写入 payload
  const payloadSizeBuf = new Uint8Array(4)
  new DataView(payloadSizeBuf.buffer).setUint32(0, msg.payload.length, false)
  buffers.push(payloadSizeBuf)
  if (msg.payload.length > 0) {
    buffers.push(msg.payload)
  }

  // 合并所有 buffer
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const buf of buffers) {
    result.set(buf, offset)
    offset += buf.length
  }

  return result
}

// 反序列化消息
export function unmarshalMessage(data: Uint8Array): Message {
  if (data.length < 4) {
    throw new Error(`Data too short: ${data.length}`)
  }

  const headerSizeUnits = data[0] & 0x0f
  const headerSize = headerSizeUnits * 4
  const msgType = (data[1] >> 4) as MsgType
  const flag = (data[1] & 0x0f) as MsgTypeFlagBits

  const msg: Message = {
    version: data[0] >> 4,
    headerSize: headerSizeUnits,
    type: msgType,
    flag: flag,
    serialization: data[2] >> 4,
    compression: data[2] & 0x0f,
    payload: new Uint8Array(0),
  }

  let offset = headerSize

  // 读取 event 和 sessionId（如果 WithEvent）
  if (flag === MsgTypeFlagBits.WithEvent) {
    if (offset + 4 > data.length) throw new Error('Insufficient data for event')
    msg.event = new DataView(data.buffer, data.byteOffset + offset, 4).getInt32(0, false) as EventType
    offset += 4

    // 读取 sessionId（非连接事件）
    if (
      msg.event !== EventType.StartConnection &&
      msg.event !== EventType.FinishConnection &&
      msg.event !== EventType.ConnectionStarted &&
      msg.event !== EventType.ConnectionFailed &&
      msg.event !== EventType.ConnectionFinished
    ) {
      if (offset + 4 > data.length) throw new Error('Insufficient data for sessionId size')
      const sessionIdSize = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, false)
      offset += 4
      if (sessionIdSize > 0) {
        msg.sessionId = new TextDecoder().decode(data.slice(offset, offset + sessionIdSize))
        offset += sessionIdSize
      }
    }

    // 读取 connectId（连接事件）
    if (
      msg.event === EventType.ConnectionStarted ||
      msg.event === EventType.ConnectionFailed ||
      msg.event === EventType.ConnectionFinished
    ) {
      if (offset + 4 > data.length) throw new Error('Insufficient data for connectId size')
      const connectIdSize = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, false)
      offset += 4
      if (connectIdSize > 0) {
        msg.connectId = new TextDecoder().decode(data.slice(offset, offset + connectIdSize))
        offset += connectIdSize
      }
    }
  }

  // 读取 sequence
  if (
    (msgType === MsgType.AudioOnlyServer ||
      msgType === MsgType.FrontEndResultServer ||
      msgType === MsgType.FullServerResponse) &&
    (flag === MsgTypeFlagBits.PositiveSeq || flag === MsgTypeFlagBits.NegativeSeq)
  ) {
    if (offset + 4 > data.length) throw new Error('Insufficient data for sequence')
    msg.sequence = new DataView(data.buffer, data.byteOffset + offset, 4).getInt32(0, false)
    offset += 4
  }

  // 读取 errorCode
  if (msgType === MsgType.Error) {
    if (offset + 4 > data.length) throw new Error('Insufficient data for errorCode')
    msg.errorCode = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, false)
    offset += 4
  }

  // 读取 payload
  if (offset + 4 > data.length) throw new Error('Insufficient data for payload size')
  const payloadSize = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, false)
  offset += 4

  if (payloadSize > 0) {
    if (offset + payloadSize > data.length) throw new Error('Insufficient data for payload')
    msg.payload = data.slice(offset, offset + payloadSize)
  }

  return msg
}

// 辅助函数：创建各类消息
export function createStartConnectionMessage(): Uint8Array {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent)
  msg.event = EventType.StartConnection
  msg.payload = new TextEncoder().encode('{}')
  return marshalMessage(msg)
}

export function createFinishConnectionMessage(): Uint8Array {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent)
  msg.event = EventType.FinishConnection
  msg.payload = new TextEncoder().encode('{}')
  return marshalMessage(msg)
}

export function createStartSessionMessage(sessionId: string, config: object): Uint8Array {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent)
  msg.event = EventType.StartSession
  msg.sessionId = sessionId
  msg.payload = new TextEncoder().encode(JSON.stringify(config))
  return marshalMessage(msg)
}

export function createFinishSessionMessage(sessionId: string): Uint8Array {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent)
  msg.event = EventType.FinishSession
  msg.sessionId = sessionId
  msg.payload = new TextEncoder().encode('{}')
  return marshalMessage(msg)
}

export function createTaskRequestMessage(sessionId: string, payload: object): Uint8Array {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent)
  msg.event = EventType.TaskRequest
  msg.sessionId = sessionId
  msg.payload = new TextEncoder().encode(JSON.stringify(payload))
  return marshalMessage(msg)
}

const EventTypeNames: Record<number, string> = {
  [EventType.None]: 'None',
  [EventType.StartConnection]: 'StartConnection',
  [EventType.FinishConnection]: 'FinishConnection',
  [EventType.ConnectionStarted]: 'ConnectionStarted',
  [EventType.ConnectionFailed]: 'ConnectionFailed',
  [EventType.ConnectionFinished]: 'ConnectionFinished',
  [EventType.StartSession]: 'StartSession',
  [EventType.FinishSession]: 'FinishSession',
  [EventType.SessionStarted]: 'SessionStarted',
  [EventType.SessionFinished]: 'SessionFinished',
  [EventType.SessionFailed]: 'SessionFailed',
  [EventType.TaskRequest]: 'TaskRequest',
  [EventType.TTSSentenceStart]: 'TTSSentenceStart',
  [EventType.TTSSentenceEnd]: 'TTSSentenceEnd',
  [EventType.TTSResponse]: 'TTSResponse',
  [EventType.TTSEnded]: 'TTSEnded',
}

export function getEventName(event: EventType): string {
  return EventTypeNames[event] || `Unknown(${event})`
}

const MsgTypeNames: Record<number, string> = {
  [MsgType.Invalid]: 'Invalid',
  [MsgType.FullClientRequest]: 'FullClientRequest',
  [MsgType.AudioOnlyClient]: 'AudioOnlyClient',
  [MsgType.FullServerResponse]: 'FullServerResponse',
  [MsgType.AudioOnlyServer]: 'AudioOnlyServer',
  [MsgType.FrontEndResultServer]: 'FrontEndResultServer',
  [MsgType.Error]: 'Error',
}

export function getMsgTypeName(type: MsgType): string {
  return MsgTypeNames[type] || `Unknown(${type})`
}
