// Vercel Serverless Function: TTS V3 流式代理
// 调用火山引擎豆包 TTS 单向流式 HTTP API V3

import type { VercelRequest, VercelResponse } from '@vercel/node'

const TTS_V3_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

interface TTSRequestBody {
  text: string
  voiceType?: string
  encoding?: string
  sampleRate?: number
  speedRatio?: number
  loudnessRatio?: number
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
    const resourceId = process.env.VITE_DOUBAO_TTS_RESOURCE_ID || (voiceType.startsWith('S_') ? 'seed-icl-1.0' : 'seed-tts-1.0')

    const ttsBody = {
      user: { uid: 'vercel_user_' + Date.now() },
      req_params: {
        text: body.text,
        speaker: voiceType,
        audio_params: {
          format: body.encoding || 'mp3',
          sample_rate: body.sampleRate || 24000,
          speech_rate: Math.round((body.speedRatio || 1.0 - 1) * 100), // 转换为 [-50, 100] 范围
          loudness_rate: Math.round((body.loudnessRatio || 1.0 - 1) * 100),
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
      console.error('[TTS API] Upstream error:', errorText)
      return res.status(502).json({ error: 'TTS service error', details: errorText })
    }

    // V3 API 返回流式 JSON，每行是一个 JSON 对象
    // 收集所有音频数据
    const audioChunks: string[] = []
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (!reader) {
      return res.status(502).json({ error: 'No response body' })
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按行解析 JSON
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 最后一行可能不完整

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line) as { code: number; data?: string; message?: string }
          if (data.code === 20000000) {
            // 成功结束
            break
          } else if (data.code !== 0) {
            console.error('[TTS API] Error:', data.message)
            return res.status(400).json({ error: data.message, code: data.code })
          } else if (data.data) {
            audioChunks.push(data.data)
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    // 处理剩余 buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer) as { code: number; data?: string; message?: string }
        if (data.data) {
          audioChunks.push(data.data)
        }
      } catch {
        // 忽略
      }
    }

    if (audioChunks.length === 0) {
      return res.status(502).json({ error: 'No audio data received' })
    }

    // 合并 base64 音频数据
    // 注意：直接拼接 base64 是不正确的，需要先解码再合并再编码
    // 但对于 mp3 格式，可以直接拼接二进制数据
    const binaryChunks = audioChunks.map((chunk) => Buffer.from(chunk, 'base64'))
    const combinedAudio = Buffer.concat(binaryChunks)

    return res.status(200).json({ audio: combinedAudio.toString('base64') })
  } catch (e) {
    console.error('[TTS API] Error:', e)
    return res.status(500).json({ error: 'Internal error', details: String(e) })
  }
}
