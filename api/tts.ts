// Vercel Serverless Function: TTS V3 单向流式代理
// 调用火山引擎豆包 TTS 单向流式 HTTP API V3
// 参考文档: https://www.volcengine.com/docs/6561/1598757

import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  maxDuration: 60,
}

const TTS_V3_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

interface TTSRequestBody {
  text: string
  voiceType?: string
  encoding?: string
  sampleRate?: number
  speechRate?: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as TTSRequestBody

    if (!body.text) {
      return res.status(400).json({ error: 'Missing text' })
    }

    // 从服务端环境变量读取认证信息
    const appId = process.env.VITE_DOUBAO_TTS_APP_ID
    const accessToken = process.env.VITE_DOUBAO_TTS_ACCESS_TOKEN

    if (!appId || !accessToken) {
      return res.status(500).json({ error: 'TTS not configured on server' })
    }

    const voiceType = (body.voiceType || process.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_female_wanqudashu_moon_bigtts').trim()

    // 根据音色自动选择 resourceId
    // 豆包语音合成模型1.0: seed-tts-1.0
    // 豆包语音合成模型2.0: seed-tts-2.0
    // 声音复刻: seed-icl-1.0 / seed-icl-2.0
    const resourceId = process.env.VITE_DOUBAO_TTS_RESOURCE_ID || (voiceType.startsWith('S_') ? 'seed-icl-1.0' : 'seed-tts-1.0')

    // V3 API 请求体格式
    const ttsBody = {
      user: {
        uid: 'vercel_' + Date.now(),
      },
      req_params: {
        text: body.text,
        speaker: voiceType,
        audio_params: {
          format: body.encoding || 'mp3',
          sample_rate: body.sampleRate || 24000,
          speech_rate: body.speechRate || 0, // [-50, 100]，0 为正常语速
        },
      },
    }

    const response = await fetch(TTS_V3_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-App-Id': appId,
        'X-Api-Access-Key': accessToken,
        'X-Api-Resource-Id': resourceId,
        'X-Api-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify(ttsBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TTS V3] HTTP error:', response.status, errorText)
      return res.status(502).json({ error: 'TTS service error', details: errorText })
    }

    // V3 API 返回流式 JSON，每行是一个 JSON 对象
    const reader = response.body?.getReader()
    if (!reader) {
      return res.status(502).json({ error: 'No response body' })
    }

    const decoder = new TextDecoder()
    const audioChunks: Buffer[] = []
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按行解析 JSON（每行一个完整的 JSON 对象）
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一行（可能不完整）

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        try {
          const data = JSON.parse(trimmed) as {
            code: number
            data?: string | null
            message?: string
            sentence?: object
          }

          // code: 0 表示正常数据
          // code: 20000000 表示成功结束
          // 其他 code 表示错误
          if (data.code === 20000000) {
            // 合成结束
            continue
          } else if (data.code !== 0) {
            console.error('[TTS V3] Error:', data.code, data.message)
            return res.status(400).json({
              error: data.message || 'TTS synthesis failed',
              code: data.code
            })
          }

          // 收集音频数据（base64 编码）
          if (data.data) {
            audioChunks.push(Buffer.from(data.data, 'base64'))
          }
        } catch (parseErr) {
          console.warn('[TTS V3] JSON parse warning:', parseErr, 'line:', trimmed.substring(0, 100))
        }
      }
    }

    // 处理剩余 buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim()) as { code: number; data?: string | null }
        if (data.code === 0 && data.data) {
          audioChunks.push(Buffer.from(data.data, 'base64'))
        }
      } catch {
        // 忽略最后的解析错误
      }
    }

    if (audioChunks.length === 0) {
      return res.status(502).json({ error: 'No audio data received' })
    }

    // 合并所有音频 chunks
    const combinedAudio = Buffer.concat(audioChunks)

    // 返回 base64 编码的音频
    return res.status(200).json({ audio: combinedAudio.toString('base64') })
  } catch (e) {
    console.error('[TTS V3] Error:', e)
    return res.status(500).json({ error: 'Internal error', details: String(e) })
  }
}
