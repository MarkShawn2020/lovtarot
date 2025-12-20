import { useState, useEffect } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReading } from '../services/ai'
import { speak, stopSpeaking } from '../services/tts'

interface Props {
  question: string
  cards: TarotCard[]
}

export function ReadingResult({ question, cards }: Props) {
  const [reading, setReading] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchReading() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getReading(question, cards)
        if (!cancelled) {
          setReading(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError('获取解读时出现问题，请稍后重试')
          console.error(err)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="bg-[var(--color-card)] rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3">
          <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-bounce delay-200" />
        </div>
        <p className="text-center text-[var(--color-muted)] mt-4">
          正在为你解读牌面...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[var(--color-card)] rounded-xl p-6 max-w-2xl mx-auto">
        <p className="text-center text-red-400">{error}</p>
        {/* 降级显示静态解读 */}
        <div className="mt-4 space-y-4">
          {cards.map((card, i) => (
            <div key={card.id} className="border-l-2 border-[var(--color-accent)] pl-4">
              <h4 className="text-[var(--color-accent)] font-medium">
                {['过去', '现在', '未来'][i]} · {card.name}
              </h4>
              <p className="text-[var(--color-text)] mt-1">{card.meaning}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-card)] rounded-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[var(--color-accent)] font-medium">
          牌面解读
        </h3>
        <button
          onClick={handleSpeak}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)]
                   hover:bg-[var(--color-secondary)] rounded-lg transition-colors text-sm"
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

      <div className="prose prose-invert max-w-none">
        {reading.split('\n').map((paragraph, i) => (
          paragraph.trim() && (
            <p key={i} className="text-[var(--color-text)] leading-relaxed mb-3">
              {paragraph}
            </p>
          )
        ))}
      </div>
    </div>
  )
}
