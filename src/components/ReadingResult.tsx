import { useState, useEffect, useRef, useCallback } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { StreamingTTS } from '../services/tts-streaming'
import { registerTTS, unregisterTTS, notifyListeners } from '../services/tts-control'

interface Props {
  question: string
  cards: TarotCard[]
  cachedReading?: string
  cachedReasoning?: string
  cachedThinkingSeconds?: number
  retryTrigger?: number
  onComplete?: (reading: string, reasoning: string, thinkingSeconds: number) => void
}

export function ReadingResult({
  question,
  cards,
  cachedReading,
  cachedReasoning,
  cachedThinkingSeconds,
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

  const ttsRef = useRef<StreamingTTS | null>(null)
  const isSpeakingRef = useRef(false)
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

  // 开始 TTS（全文播报）
  const startTTS = useCallback(async (text?: string) => {
    if (ttsRef.current) return

    const content = text || readingRef.current
    if (!content) return

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
      notifyListeners()

      // 一次性发送全文
      ttsRef.current.sendText(content)
      ttsRef.current.finish()
    } catch (err) {
      console.error('[TTS] Start error:', err)
      ttsRef.current = null
    }
  }, [])

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

  // 重新播报
  const restartTTS = useCallback(() => {
    stopTTS()
    startTTS()
  }, [stopTTS, startTTS])

  // 重试
  const handleRetry = useCallback(() => {
    stopTTS()
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
          // 生成完成后自动播报全文
          startTTS(fullReading)
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
  }, [question, cards, cachedReading, ignoreCache, onComplete, startTTS, stopTTS, retryCount])

  // 注册到全局 TTS 控制
  useEffect(() => {
    registerTTS({
      toggle: toggleTTS,
      stop: stopTTS,
      restart: restartTTS,
      isSpeaking: () => isSpeakingRef.current,
    })
    return () => unregisterTTS()
  }, [toggleTTS, stopTTS, restartTTS])

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
