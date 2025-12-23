// TTS 音频缓存服务
// 生成 TTS 音频并存储到 Supabase Storage

import { supabase } from './supabase'

const getConfig = () => ({
  voiceType: (import.meta.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_female_wanqudashu_moon_bigtts').trim(),
})

// 生成 TTS 音频并缓存到 Supabase（失败时返回本地 Blob URL）
export async function generateAndCacheAudio(sessionId: string, text: string): Promise<string | null> {
  // Mock 模式跳过 TTS
  if (import.meta.env.VITE_DEV_MOCK === 'true') {
    console.log('[TTS Cache] Mock mode, skipping')
    return null
  }

  try {
    const config = getConfig()

    // 调用 TTS API
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceType: config.voiceType,
        encoding: 'mp3',
      }),
    })

    if (!response.ok) {
      console.error('[TTS Cache] API error:', response.status)
      return null
    }

    const result = await response.json() as { audio?: string; error?: string }
    if (result.error || !result.audio) {
      console.error('[TTS Cache] No audio:', result.error)
      return null
    }

    // base64 解码为 Uint8Array
    const binaryString = atob(result.audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 创建本地 Blob URL 作为备用
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    const localBlobUrl = URL.createObjectURL(blob)

    // 尝试上传到 Supabase Storage
    const fileName = `${sessionId}.mp3`
    const { error: uploadError } = await supabase.storage
      .from('tts-audio')
      .upload(fileName, bytes, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[TTS Cache] Upload error:', uploadError)
      console.log('[TTS Cache] Using local blob URL as fallback')
      return localBlobUrl
    }

    // 获取公开 URL（加时间戳绕过浏览器缓存）
    const { data: urlData } = supabase.storage
      .from('tts-audio')
      .getPublicUrl(fileName)

    const audioUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // 更新 session 记录
    const { error: updateError } = await supabase
      .from('tarot_sessions')
      .update({ audio_url: audioUrl })
      .eq('id', sessionId)

    if (updateError) {
      console.error('[TTS Cache] Update error:', updateError)
    }

    // 清理本地 Blob URL（因为有远程 URL 了）
    URL.revokeObjectURL(localBlobUrl)

    console.log('[TTS Cache] Audio cached:', audioUrl)
    return audioUrl
  } catch (e) {
    console.error('[TTS Cache] Error:', e)
    return null
  }
}

// 获取缓存的音频 URL（如果存在）
export async function getCachedAudioUrl(sessionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('tarot_sessions')
    .select('audio_url')
    .eq('id', sessionId)
    .single()

  if (error || !data?.audio_url) {
    return null
  }
  return data.audio_url
}

// 播放音频 URL
export function playAudioUrl(url: string, onEnd?: () => void): HTMLAudioElement {
  const audio = new Audio(url)
  audio.onended = () => onEnd?.()
  audio.play().catch(console.error)
  return audio
}
