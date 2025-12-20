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
    if (isSpeaking) {
      // 停止播放
      if (ttsRef.current) {
        ttsRef.current.stop()
        ttsRef.current = null
      }
      isSpeakingRef.current = false
      setIsSpeaking(false)
    } else {
      // 开始播放
      isSpeakingRef.current = true
      setIsSpeaking(true)
      sentSentencesRef.current.clear()

      try {
        ttsRef.current = new StreamingTTS({
          onError: (err) => {
            console.error('TTS error:', err)
          },
          onEnd: () => {
            isSpeakingRef.current = false
            setIsSpeaking(false)
            ttsRef.current = null
          },
        })

        await ttsRef.current.start()

        // 发送已有的文本
        sendNewSentences(reading)

        // 如果 AI 已经生成完毕，通知 TTS 结束
        if (!isStreaming) {
          ttsRef.current.finish()
        }
      } catch (err) {
        console.error('TTS start error:', err)
        isSpeakingRef.current = false
        setIsSpeaking(false)
        ttsRef.current = null
      }
    }
  }

  if (isStreaming && !reading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
        </div>
        <p className="text-center text-muted-foreground mt-4">
          正在为你解读牌面...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl mx-auto">
        <p className="text-center text-destructive">{error}</p>
        {/* 降级显示静态解读 */}
        <div className="mt-4 space-y-4">
          {cards.map((card, i) => (
            <div key={card.id} className="border-l-2 border-primary pl-4">
              <h4 className="text-primary font-medium font-serif">
                {['过去', '现在', '未来'][i]} · {card.name}
              </h4>
              <p className="text-foreground mt-1">{card.meaning}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-primary font-medium font-serif">
          牌面解读
        </h3>
        <button
          onClick={handleSpeak}
          disabled={isStreaming}
          className="flex items-center gap-2 px-3 py-1.5 bg-secondary
                   hover:bg-primary hover:text-primary-foreground
                   text-secondary-foreground rounded-xl transition-colors text-sm
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary"
        >
          {isSpeaking ? (
            <>
              <span className="w-4 h-4">⏹</span>
              停止
            </>
          ) : (
            <>
              <span className="w-4 h-4">🔊</span>
              语音播放
            </>
          )}
        </button>
      </div>

      <div className="prose max-w-none">
        {reading.split('\n').map((paragraph, i, arr) => (
          paragraph.trim() && (
            <p key={i} className="text-foreground leading-relaxed mb-3">
              {paragraph}
              {isStreaming && i === arr.length - 1 && (
                <span className="inline-block w-2 h-4 bg-primary/60 ml-0.5 animate-pulse" />
              )}
            </p>
          )
        ))}
      </div>
    </div>
  )
}
