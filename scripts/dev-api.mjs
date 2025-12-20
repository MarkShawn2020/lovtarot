#!/usr/bin/env node
// 本地开发用 API 服务器，模拟 Vercel Serverless Functions

import http from 'node:http'

const TTS_V3_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

const PORT = 3000

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.url === '/api/tts' && req.method === 'POST') {
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    try {
      const data = JSON.parse(body)

      if (!data.text || !data.appId || !data.accessToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Missing text, appId or accessToken' }))
        return
      }

      const voiceType = data.voiceType || 'zh_female_wanqudashu_moon_bigtts'
      const resourceId = data.resourceId || (voiceType.startsWith('S_') ? 'seed-icl-1.0' : 'seed-tts-1.0')

      const ttsBody = {
        user: { uid: 'dev_user_' + Date.now() },
        req_params: {
          text: data.text,
          speaker: voiceType,
          audio_params: {
            format: data.encoding || 'mp3',
            sample_rate: data.sampleRate || 24000,
            speech_rate: Math.round(((data.speedRatio || 1.0) - 1) * 100),
            loudness_rate: Math.round(((data.loudnessRatio || 1.0) - 1) * 100),
          },
        },
      }

      const response = await fetch(TTS_V3_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-App-Id': data.appId,
          'X-Api-Access-Key': data.accessToken,
          'X-Api-Resource-Id': resourceId,
          'X-Api-Request-Id': crypto.randomUUID(),
        },
        body: JSON.stringify(ttsBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[TTS API] Upstream error:', errorText)
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'TTS service error', details: errorText }))
        return
      }

      // 收集流式响应
      const audioChunks = []
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const d = JSON.parse(line)
            if (d.code === 20000000) break
            else if (d.code !== 0) {
              console.error('[TTS API] Error:', d.message)
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: d.message, code: d.code }))
              return
            } else if (d.data) {
              audioChunks.push(d.data)
            }
          } catch {}
        }
      }

      if (buffer.trim()) {
        try {
          const d = JSON.parse(buffer)
          if (d.data) audioChunks.push(d.data)
        } catch {}
      }

      if (audioChunks.length === 0) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'No audio data received' }))
        return
      }

      // 合并 base64 音频
      const binaryChunks = audioChunks.map((c) => Buffer.from(c, 'base64'))
      const combinedAudio = Buffer.concat(binaryChunks)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ audio: combinedAudio.toString('base64') }))
    } catch (e) {
      console.error('[TTS API] Error:', e)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal error', details: String(e) }))
    }
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`[dev-api] TTS API server running at http://localhost:${PORT}`)
})
