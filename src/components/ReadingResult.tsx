import { useState, useEffect } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { speak, stopSpeaking } from '../services/tts'

interface Props {
  question: string
  cards: TarotCard[]
}

export function ReadingResult({ question, cards }: Props) {
  const [reading, setReading] = useState('')
  const [isStreaming, setIsStreaming] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchReading() {
      setIsStreaming(true)
      setReading('')
      setError(null)

      try {
        await getReadingStream(question, cards, (chunk) => {
          if (!cancelled) {
            setReading((prev) => prev + chunk)
          }
        })
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
      stopSpeaking()
    }
  }, [question, cards])

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    } else {
      setIsSpeaking(true)
      await speak(reading)
      setIsSpeaking(false)
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
