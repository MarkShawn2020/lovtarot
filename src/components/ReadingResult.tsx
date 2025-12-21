import { useState, useEffect, useRef, useCallback } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { StreamingTTS } from '../services/tts-streaming'
import { registerTTS, unregisterTTS, notifyListeners, type TTSState } from '../services/tts-control'
import { generateAndCacheAudio } from '../services/tts-cache'

interface Props {
  sessionId: string
  question: string
  cards: TarotCard[]
  cachedReading?: string
  cachedReasoning?: string
  cachedThinkingSeconds?: number
  cachedAudioUrl?: string
  retryTrigger?: number
  onComplete?: (reading: string, reasoning: string, thinkingSeconds: number) => void
}

export function ReadingResult({
  sessionId,
  question,
  cards,
  cachedReading,
  cachedReasoning,
  cachedThinkingSeconds,
  cachedAudioUrl,
  retryTrigger,
  onComplete,
}: Props) {
  const [reasoning, setReasoning] = useState(cachedReasoning || '')
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const [reading, setReading] = useState(cachedReading || '')
  const [isStreaming, setIsStreaming] = useState(!cachedReading)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [ignoreCache, setIgnoreCache] = useState(false)
  const [thinkingSeconds, setThinkingSeconds] = useState(cachedThinkingSeconds || 0)
  const [audioUrl, setAudioUrl] = useState<string | undefined>(cachedAudioUrl)

  const ttsRef = useRef<StreamingTTS | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsStateRef = useRef<TTSState>('idle')
  const volumeRef = useRef(1)
  const readingRef = useRef(reading)
  const thinkingSecondsRef = useRef(thinkingSeconds)

  // 同步 ref
  useEffect(() => {
    readingRef.current = reading
  }, [reading])
  useEffect(() => {
    thinkingSecondsRef.current = thinkingSeconds
  }, [thinkingSeconds])

  // 思考计时器
  useEffect(() => {
    if (isStreaming && !reading) {
      setThinkingSeconds(0)
      const timer = setInterval(() => setThinkingSeconds(s => s + 1), 1000)
      return () => clearInterval(timer)
    }
  }, [isStreaming, reading])

  // 播放 TTS（优先使用缓存音频）
  const playTTS = useCallback(async (text?: string, url?: string) => {
    if (ttsStateRef.current !== 'idle') return

    const cachedUrl = url || audioUrl
    const content = text || readingRef.current
    if (!content && !cachedUrl) return

    // 优先使用缓存的音频 URL
    if (cachedUrl) {
      console.log('[TTS] Playing cached audio:', cachedUrl)
      const audio = new Audio(cachedUrl)
      audio.volume = volumeRef.current
      audioRef.current = audio
      audio.onended = () => {
        ttsStateRef.current = 'idle'
        audioRef.current = null
        notifyListeners()
      }
      audio.onerror = () => {
        ttsStateRef.current = 'idle'
        audioRef.current = null
        notifyListeners()
      }
      ttsStateRef.current = 'playing'
      notifyListeners()
      audio.play().catch(console.error)
      return
    }

    // 没有缓存，使用实时 TTS
    try {
      ttsRef.current = new StreamingTTS({
        onError: (err) => console.error('[TTS] Error:', err),
        onEnd: () => {
          ttsStateRef.current = 'idle'
          ttsRef.current = null
          notifyListeners()
        },
      })

      await ttsRef.current.start()
      ttsStateRef.current = 'playing'
      notifyListeners()

      // 一次性发送全文
      ttsRef.current.sendText(content!)
      ttsRef.current.finish()
    } catch (err) {
      console.error('[TTS] Start error:', err)
      ttsRef.current = null
    }
  }, [audioUrl])

  // 暂停 TTS（仅缓存音频支持）
  const pauseTTS = useCallback(() => {
    if (audioRef.current && ttsStateRef.current === 'playing') {
      audioRef.current.pause()
      ttsStateRef.current = 'paused'
      notifyListeners()
    }
  }, [])

  // 继续 TTS
  const resumeTTS = useCallback(() => {
    if (audioRef.current && ttsStateRef.current === 'paused') {
      audioRef.current.play().catch(console.error)
      ttsStateRef.current = 'playing'
      notifyListeners()
    }
  }, [])

  // 停止 TTS
  const stopTTS = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.stop()
      ttsRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    ttsStateRef.current = 'idle'
    notifyListeners()
  }, [])

  // 获取 TTS 状态
  const getTTSState = useCallback((): TTSState => ttsStateRef.current, [])

  // 音量控制
  const setVolume = useCallback((v: number) => {
    volumeRef.current = v
    if (audioRef.current) {
      audioRef.current.volume = v
    }
  }, [])

  const getVolume = useCallback(() => volumeRef.current, [])

  // 重试
  const handleRetry = useCallback(() => {
    stopTTS()
    setAudioUrl(undefined) // 清除音频 URL（数据库记录保留）
    setReasoning('')
    setReasoningExpanded(false)
    setReading('')
    setError(null)
    setIgnoreCache(true)
    setRetryCount(c => c + 1)
  }, [stopTTS])

  // 外部触发重试
  useEffect(() => {
    if (retryTrigger && retryTrigger > 0) {
      handleRetry()
    }
  }, [retryTrigger, handleRetry])

  useEffect(() => {
    if (cachedReading && !ignoreCache) return

    let cancelled = false
    let fullReasoning = ''
    let fullReading = ''

    async function fetchReading() {
      setIsStreaming(true)
      setReasoning('')
      setReading('')
      setError(null)

      try {
        await getReadingStream(question, cards, (chunk, type) => {
          if (cancelled) return

          if (type === 'reasoning') {
            fullReasoning += chunk
            setReasoning(fullReasoning)
          } else {
            fullReading += chunk
            setReading(fullReading)
          }
        })

        if (!cancelled) {
          onComplete?.(fullReading, fullReasoning, thinkingSecondsRef.current)
          // 生成完成后自动播报全文（实时 TTS）
          playTTS(fullReading)
          // 后台生成并缓存音频（下次播放使用）
          generateAndCacheAudio(sessionId, fullReading).then(url => {
            if (url && !cancelled) {
              setAudioUrl(url)
              console.log('[TTS] Audio cached for future playback')
            }
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError('获取解读时出现问题，请稍后重试')
          console.error(err)
        }
      } finally {
        if (!cancelled) {
          setIsStreaming(false)
        }
      }
    }

    fetchReading()

    return () => {
      cancelled = true
      stopTTS()
    }
  }, [sessionId, question, cards, cachedReading, ignoreCache, onComplete, playTTS, stopTTS, retryCount])

  // 注册到全局 TTS 控制（只有当有内容可播放时才注册）
  useEffect(() => {
    if (!reading && !audioUrl) {
      unregisterTTS()
      return
    }
    registerTTS({
      play: playTTS,
      pause: pauseTTS,
      resume: resumeTTS,
      stop: stopTTS,
      getState: getTTSState,
      setVolume,
      getVolume,
    })
    return () => unregisterTTS()
  }, [reading, audioUrl, playTTS, pauseTTS, resumeTTS, stopTTS, getTTSState, setVolume, getVolume])

  // 页面刷新/关闭前停止 TTS
  useEffect(() => {
    window.addEventListener('beforeunload', stopTTS)
    return () => window.removeEventListener('beforeunload', stopTTS)
  }, [stopTTS])

  if (error) {
    return (
      <div className="h-full flex flex-col bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            重试
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto space-y-3">
          {cards.map((card, i) => (
            <div key={card.id} className="border-l-2 border-primary/60 pl-3">
              <h4 className="text-primary text-sm font-medium font-serif">
                {['过去', '现在', '未来'][i]} · {card.name}
              </h4>
              <p className="text-foreground/80 text-sm mt-0.5">{card.meaning}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-primary text-sm font-medium font-serif">
          牌面解读
        </h3>
        <div className="flex items-center gap-3">
          {reasoning && (
            <button
              onClick={() => setReasoningExpanded(e => !e)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              {isStreaming && !reading && (
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
              <span>思考过程{thinkingSeconds > 0 && <span className="tabular-nums">（{thinkingSeconds}s）</span>}</span>
              <span className="text-[10px]">{reasoningExpanded ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto pr-2">
        {/* 思考过程 */}
        {reasoning && reasoningExpanded && (
          <div className="mb-3 pb-3 border-b border-border/30">
            <p className="text-muted-foreground/60 text-xs leading-relaxed italic whitespace-pre-wrap">
              {reasoning}
            </p>
          </div>
        )}

        {/* 牌面解读内容 */}
        {!reading && isStreaming ? (
          <p className="text-muted-foreground/60 text-sm">正在生成解读...</p>
        ) : (
          reading.split('\n').map((paragraph, i, arr) => (
            paragraph.trim() && (
              <p key={i} className="text-foreground/90 leading-relaxed text-sm mb-3">
                {paragraph}
                {isStreaming && i === arr.length - 1 && (
                  <span className="inline-block w-1.5 h-3.5 bg-primary/60 ml-0.5 animate-pulse" />
                )}
              </p>
            )
          ))
        )}
      </div>
    </div>
  )
}
