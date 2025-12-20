// Cloudflare Worker: TTS HTTP API Proxy
// 代理浏览器请求到豆包 TTS v1 HTTP API

const TTS_HTTP_ENDPOINT = 'https://openspeech.bytedance.com/api/v1/tts'

interface TTSRequest {
  text: string
  voice_type?: string
  speed_ratio?: number
  encoding?: string
}

interface TTSConfig {
  appId: string
  accessToken: string
  voiceType: string
  cluster: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 健康检查
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // TTS 合成接口
    if (url.pathname === '/tts/synthesize' && request.method === 'POST') {
      try {
        const body = await request.json() as TTSRequest & Partial<TTSConfig>

        if (!body.text) {
          return new Response(JSON.stringify({ error: 'Missing text' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        if (!body.appId || !body.accessToken) {
          return new Response(JSON.stringify({ error: 'Missing appId or accessToken' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const voiceType = body.voice_type || body.voiceType || 'zh_female_vv_uranus_bigtts'
        const cluster = voiceType.startsWith('S_') ? 'volcano_icl' : 'volcano_tts'

        const ttsBody = {
          app: {
            appid: body.appId,
            token: body.accessToken,
            cluster: cluster,
          },
          user: {
            uid: 'web_user_' + crypto.randomUUID(),
          },
          audio: {
            voice_type: voiceType,
            encoding: body.encoding || 'mp3',
            speed_ratio: body.speed_ratio || 1.0,
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
            'Authorization': `Bearer;${body.accessToken}`,
          },
          body: JSON.stringify(ttsBody),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[TTS Proxy] Upstream error:', errorText)
          return new Response(JSON.stringify({ error: 'TTS service error', details: errorText }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const result = await response.json() as { code: number; data?: string; message?: string }

        if (result.code !== 3000) {
          return new Response(JSON.stringify({ error: result.message || 'TTS failed', code: result.code }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // 返回 base64 音频数据
        return new Response(JSON.stringify({ audio: result.data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (e) {
        console.error('[TTS Proxy] Error:', e)
        return new Response(JSON.stringify({ error: 'Internal error', details: String(e) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  },
}
