// Vercel Serverless Function: TTS HTTP API 代理
// 调用火山引擎豆包 TTS v1 HTTP API

import type { VercelRequest, VercelResponse } from '@vercel/node'

// 增加超时时间到 60 秒（Hobby 计划最大）
export const config = {
  maxDuration: 60,
}

const TTS_HTTP_ENDPOINT = 'https://openspeech.bytedance.com/api/v1/tts'

interface TTSRequestBody {
  text: string
  voiceType?: string
  encoding?: string
  speedRatio?: number
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
    // 根据音色自动选择 cluster
    const cluster = voiceType.startsWith('S_') ? 'volcano_icl' : 'volcano_tts'

    const ttsBody = {
      app: {
        appid: appId,
        token: accessToken,
        cluster: cluster,
      },
      user: {
        uid: 'vercel_user_' + Date.now(),
      },
      audio: {
        voice_type: voiceType,
        encoding: body.encoding || 'mp3',
        speed_ratio: body.speedRatio || 1.0,
        rate: 24000,
        bitrate: 160,
        loudness_ratio: 1.0,
      },
      request: {
        reqid: crypto.randomUUID(),
        text: body.text,
        operation: 'query',
      },
    }

    const response = await fetch(TTS_HTTP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer;${accessToken}`,
      },
      body: JSON.stringify(ttsBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TTS API] Upstream error:', errorText)
      return res.status(502).json({ error: 'TTS service error', details: errorText })
    }

    const result = await response.json() as { code: number; data?: string; message?: string }

    if (result.code !== 3000) {
      console.error('[TTS API] Error:', result.message, 'code:', result.code)
      return res.status(400).json({ error: result.message || 'TTS failed', code: result.code })
    }

    // 返回 base64 音频数据
    return res.status(200).json({ audio: result.data })
  } catch (e) {
    console.error('[TTS API] Error:', e)
    return res.status(500).json({ error: 'Internal error', details: String(e) })
  }
}
