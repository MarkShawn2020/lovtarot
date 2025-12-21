// TTS 音频缓存服务
// 生成 TTS 音频并存储到 Supabase Storage

import { supabase } from './supabase'

const getConfig = () => ({
  voiceType: (import.meta.env.VITE_DOUBAO_TTS_VOICE_TYPE || 'zh_female_wanqudashu_moon_bigtts').trim(),
})

// 生成 TTS 音频并缓存到 Supabase
export async function generateAndCacheAudio(sessionId: string, text: string): Promise<string | null> {
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

    // 上传到 Supabase Storage
    const fileName = `${sessionId}.mp3`
    const { error: uploadError } = await supabase.storage
      .from('tts-audio')
      .upload(fileName, bytes, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[TTS Cache] Upload error:', uploadError)
      return null
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('tts-audio')
      .getPublicUrl(fileName)

    const audioUrl = urlData.publicUrl

    // 更新 session 记录
    const { error: updateError } = await supabase
      .from('tarot_sessions')
      .update({ audio_url: audioUrl })
      .eq('id', sessionId)

    if (updateError) {
      console.error('[TTS Cache] Update error:', updateError)
    }

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
