import path from 'path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { LovinspPlugin } from 'lovinsp'

// 加载 .env 和 .env.local 到 process.env
const env = loadEnv('development', process.cwd(), '')
Object.assign(process.env, env)

const TTS_V3_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

// 开发环境 TTS API 插件
function ttsApiPlugin(): Plugin {
  return {
    name: 'tts-api',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.writeHead(200)
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        for await (const chunk of req) body += chunk

        try {
          const data = JSON.parse(body)
          if (!data.text) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Missing text' }))
            return
          }

          // 从环境变量读取认证信息（与 Vercel 函数一致）
          const appId = process.env.VITE_DOUBAO_TTS_APP_ID
          const accessToken = process.env.VITE_DOUBAO_TTS_ACCESS_TOKEN
          if (!appId || !accessToken) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'TTS not configured: missing VITE_DOUBAO_TTS_APP_ID or VITE_DOUBAO_TTS_ACCESS_TOKEN' }))
            return
          }

          const voiceType = (data.voiceType || process.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_female_shuangkuaisisi_moon_bigtts').trim()
          // 根据音色自动判断资源 ID：bigtts = 2.0, 其他 = 1.0
          const resourceId = voiceType.includes('bigtts') ? 'seed-tts-2.0' : 'seed-tts-1.0'
          console.log('[TTS] Request:', { voiceType, resourceId, textLen: data.text?.length })

          const ttsBody = {
            user: { uid: 'dev_' + Date.now() },
            req_params: {
              text: data.text,
              speaker: voiceType,
              audio_params: {
                format: data.encoding || 'mp3',
                sample_rate: 24000,
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
            },
            body: JSON.stringify(ttsBody),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('[TTS] Upstream error:', response.status, errorText)
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'TTS error', details: errorText }))
            return
          }

          // 读取完整响应体（V3 是流式的，每行一个 JSON）
          const fullText = await response.text()
          console.log('[TTS] Raw response length:', fullText.length)
          console.log('[TTS] Raw response preview:', fullText.substring(0, 500))

          const audioChunks: string[] = []
          const lines = fullText.split('\n')

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const d = JSON.parse(line)
              console.log('[TTS] Parsed line:', { code: d.code, hasData: !!d.data, dataLen: d.data?.length })
              if (d.data) audioChunks.push(d.data)
            } catch (e) {
              console.log('[TTS] Parse error for line:', line.substring(0, 100))
            }
          }

          console.log('[TTS] Total audio chunks:', audioChunks.length)

          if (audioChunks.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No audio chunks', raw: fullText.substring(0, 1000) }))
            return
          }

          const combined = Buffer.concat(audioChunks.map((c) => Buffer.from(c, 'base64')))
          console.log('[TTS] Combined audio size:', combined.length)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ audio: combined.toString('base64') }))
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: String(e) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [LovinspPlugin({ bundler: 'vite' }), react(), tailwindcss(), ttsApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
