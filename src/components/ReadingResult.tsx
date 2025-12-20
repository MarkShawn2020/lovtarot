import { useState, useEffect, useRef, useCallback } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { StreamingTTS, splitTextToSentences } from '../services/tts-streaming'

interface Props {
  question: string
  cards: TarotCard[]
  cachedReading?: string
  onComplete?: (reading: string) => void
}

export function ReadingResult({ question, cards, cachedReading, onComplete }: Props) {
  const [reading, setReading] = useState(cachedReading || '')
  const [isStreaming, setIsStreaming] = useState(!cachedReading)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ttsRef = useRef<StreamingTTS | null>(null)
  const sentSentencesRef = useRef<Set<string>>(new Set())
  const isSpeakingRef = useRef(false)

  // 发送新句子到 TTS
  const sendNewSentences = useCallback((text: string) => {
    if (!isSpeakingRef.current || !ttsRef.current) return

    const sentences = splitTextToSentences(text)
    for (const sentence of sentences) {
      if (!sentSentencesRef.current.has(sentence)) {
        sentSentencesRef.current.add(sentence)
        ttsRef.current.sendText(sentence)
      }
    }
  }, [])

  useEffect(() => {
    if (cachedReading) return

    let cancelled = false
    let fullReading = ''

    async function fetchReading() {
      setIsStreaming(true)
      setReading('')
      setError(null)

      try {
        await getReadingStream(question, cards, (chunk) => {
          if (!cancelled) {
            fullReading += chunk
            setReading(fullReading)
            // 如果正在播放，发送新句子
            sendNewSentences(fullReading)
          }
        })
        if (!cancelled) {
          onComplete?.(fullReading)
          // AI 生成完毕，通知 TTS 结束
          if (ttsRef.current && isSpeakingRef.current) {
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
      if (ttsRef.current) {
        ttsRef.current.stop()
        ttsRef.current = null
      }
    }
  }, [question, cards, cachedReading, onComplete, sendNewSentences])

  const handleSpeak = async () => {
    console.log('[DEBUG][ReadingResult] handleSpeak called, isSpeaking:', isSpeaking)
    if (isSpeaking) {
      // 停止播放
      console.log('[DEBUG][ReadingResult] 停止播放分支')
      if (ttsRef.current) {
        ttsRef.current.stop()
        ttsRef.current = null
      }
      isSpeakingRef.current = false
      setIsSpeaking(false)
    } else {
      // 开始播放
      console.log('[DEBUG][ReadingResult] 开始播放分支')
      isSpeakingRef.current = true
      setIsSpeaking(true)
      sentSentencesRef.current.clear()

      try {
        ttsRef.current = new StreamingTTS({
          onError: (err) => {
            console.error('[DEBUG][ReadingResult] TTS onError:', err)
          },
          onEnd: () => {
            console.log('[DEBUG][ReadingResult] TTS onEnd 回调触发')
            isSpeakingRef.current = false
            setIsSpeaking(false)
            ttsRef.current = null
          },
        })

        console.log('[DEBUG][ReadingResult] 调用 tts.start()')
        await ttsRef.current.start()
        console.log('[DEBUG][ReadingResult] tts.start() 完成')

        // 发送已有的文本
        console.log('[DEBUG][ReadingResult] 发送文本, reading长度:', reading.length, 'isStreaming:', isStreaming)
        sendNewSentences(reading)

        // 如果 AI 已经生成完毕，通知 TTS 结束
        if (!isStreaming) {
          console.log('[DEBUG][ReadingResult] AI已完成，调用 tts.finish()')
          ttsRef.current.finish()
        }
      } catch (err) {
        console.error('[DEBUG][ReadingResult] TTS start error:', err)
        isSpeakingRef.current = false
        setIsSpeaking(false)
        ttsRef.current = null
      }
    }
  }

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
        <p className="text-destructive text-sm mb-3">{error}</p>
        {/* 降级显示静态解读 */}
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
        <button
          onClick={handleSpeak}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/60
                   hover:bg-primary hover:text-primary-foreground
                   text-secondary-foreground rounded-lg transition-all text-xs
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary/60"
        >
          {isSpeaking ? (
            <>
              <span className="text-xs">⏹</span>
              停止
            </>
          ) : (
            <>
              <span className="text-xs">🔊</span>
              语音
            </>
          )}
        </button>
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
