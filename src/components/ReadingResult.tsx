import { useState, useEffect, useRef, useCallback } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { StreamingTTS, splitTextToSentences } from '../services/tts-streaming'
import { registerTTS, unregisterTTS, notifyListeners } from '../services/tts-control'

interface Props {
  question: string
  cards: TarotCard[]
  cachedReading?: string
  onComplete?: (reading: string) => void
}

export function ReadingResult({
  question,
  cards,
  cachedReading,
  onComplete,
}: Props) {
  const [reading, setReading] = useState(cachedReading || '')
  const [isStreaming, setIsStreaming] = useState(!cachedReading)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [ignoreCache, setIgnoreCache] = useState(false)

  const ttsRef = useRef<StreamingTTS | null>(null)
  const sentSentencesRef = useRef<Set<string>>(new Set())
  const isSpeakingRef = useRef(false)
  const readingRef = useRef(reading)
  const isStreamingRef = useRef(isStreaming)

  // 同步 ref
  useEffect(() => {
    readingRef.current = reading
  }, [reading])

  useEffect(() => {
    isStreamingRef.current = isStreaming
  }, [isStreaming])

  // 发送新句子到 TTS
  const sendNewSentences = useCallback((text: string) => {
    if (!ttsRef.current) return

    const sentences = splitTextToSentences(text)
    for (const sentence of sentences) {
      if (!sentSentencesRef.current.has(sentence)) {
        sentSentencesRef.current.add(sentence)
        ttsRef.current.sendText(sentence)
      }
    }
  }, [])

  // 开始 TTS
  const startTTS = useCallback(async () => {
    if (ttsRef.current) return

    try {
      ttsRef.current = new StreamingTTS({
        onError: (err) => console.error('[TTS] Error:', err),
        onEnd: () => {
          isSpeakingRef.current = false
          ttsRef.current = null
          notifyListeners()
        },
      })

      await ttsRef.current.start()
      isSpeakingRef.current = true
      sentSentencesRef.current.clear()
      sendNewSentences(readingRef.current)
      notifyListeners()

      if (!isStreamingRef.current) {
        ttsRef.current.finish()
      }
    } catch (err) {
      console.error('[TTS] Start error:', err)
      ttsRef.current = null
    }
  }, [sendNewSentences])

  // 停止 TTS
  const stopTTS = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.stop()
      ttsRef.current = null
    }
    isSpeakingRef.current = false
    notifyListeners()
  }, [])

  // 切换 TTS
  const toggleTTS = useCallback(() => {
    if (isSpeakingRef.current) {
      stopTTS()
    } else {
      startTTS()
    }
  }, [startTTS, stopTTS])

  // 重试
  const handleRetry = useCallback(() => {
    console.log('[DEBUG][ReadingResult] handleRetry 被调用')
    stopTTS()
    sentSentencesRef.current.clear()
    setReading('')
    setError(null)
    setIgnoreCache(true)
    setRetryCount(c => c + 1)
  }, [stopTTS])

  useEffect(() => {
    console.log('[DEBUG][ReadingResult] useEffect 触发:', { cachedReading: !!cachedReading, ignoreCache, retryCount })
    if (cachedReading && !ignoreCache) {
      console.log('[DEBUG][ReadingResult] 使用缓存，跳过 fetchReading')
      return
    }

    let cancelled = false
    let fullReading = ''
    let ttsStarted = false

    async function fetchReading() {
      console.log('[DEBUG][ReadingResult] fetchReading 开始执行')
      setIsStreaming(true)
      setReading('')
      setError(null)

      try {
        await getReadingStream(question, cards, async (chunk) => {
          if (cancelled) return

          fullReading += chunk
          setReading(fullReading)

          // 首次收到文本时自动开始 TTS
          if (!ttsStarted && fullReading.length > 0) {
            ttsStarted = true
            await startTTS()
          }

          sendNewSentences(fullReading)
        })

        if (!cancelled) {
          onComplete?.(fullReading)
          if (ttsRef.current) {
            ttsRef.current.finish()
          }
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
  }, [question, cards, cachedReading, ignoreCache, onComplete, sendNewSentences, startTTS, stopTTS, retryCount])

  // 注册到全局 TTS 控制
  useEffect(() => {
    registerTTS({
      toggle: toggleTTS,
      stop: stopTTS,
      isSpeaking: () => isSpeakingRef.current,
    })
    return () => unregisterTTS()
  }, [toggleTTS, stopTTS])

  // 页面刷新/关闭前停止 TTS
  useEffect(() => {
    window.addEventListener('beforeunload', stopTTS)
    return () => window.removeEventListener('beforeunload', stopTTS)
  }, [stopTTS])

  if (isStreaming && !reading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full" style={{ animation: 'bounce 1s infinite' }} />
          <div className="w-1.5 h-1.5 bg-primary rounded-full" style={{ animation: 'bounce 1s infinite 100ms' }} />
          <div className="w-1.5 h-1.5 bg-primary rounded-full" style={{ animation: 'bounce 1s infinite 200ms' }} />
        </div>
        <p className="text-muted-foreground/80 text-sm mt-3">
          正在为你解读牌面...
        </p>
      </div>
    )
  }

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
        {!isStreaming && (
          <button
            onClick={handleRetry}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            重新解读
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto pr-2">
        {reading.split('\n').map((paragraph, i, arr) => (
          paragraph.trim() && (
            <p key={i} className="text-foreground/90 leading-relaxed text-sm mb-3">
              {paragraph}
              {isStreaming && i === arr.length - 1 && (
                <span className="inline-block w-1.5 h-3.5 bg-primary/60 ml-0.5 animate-pulse" />
              )}
            </p>
          )
        ))}
      </div>
    </div>
  )
}
