import { useState, useEffect, useRef, useCallback, type MutableRefObject } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { StreamingTTS, splitTextToSentences } from '../services/tts-streaming'

interface Props {
  question: string
  cards: TarotCard[]
  cachedReading?: string
  onComplete?: (reading: string) => void
  onSpeakingChange?: (speaking: boolean) => void
  speakToggleRef?: MutableRefObject<(() => void) | null>
}

export function ReadingResult({
  question,
  cards,
  cachedReading,
  onComplete,
  onSpeakingChange,
  speakToggleRef,
}: Props) {
  const [reading, setReading] = useState(cachedReading || '')
  const [isStreaming, setIsStreaming] = useState(!cachedReading)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            sendNewSentences(fullReading)
          }
        })
        if (!cancelled) {
          onComplete?.(fullReading)
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

  // 同步 isSpeaking 到父组件
  useEffect(() => {
    onSpeakingChange?.(isSpeaking)
  }, [isSpeaking, onSpeakingChange])

  const handleSpeak = useCallback(async () => {
    if (isSpeakingRef.current) {
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
            console.error('[TTS] Error:', err)
          },
          onEnd: () => {
            isSpeakingRef.current = false
            setIsSpeaking(false)
            ttsRef.current = null
          },
        })

        await ttsRef.current.start()
        sendNewSentences(readingRef.current)

        if (!isStreamingRef.current) {
          ttsRef.current.finish()
        }
      } catch (err) {
        console.error('[TTS] Start error:', err)
        isSpeakingRef.current = false
        setIsSpeaking(false)
        ttsRef.current = null
      }
    }
  }, [sendNewSentences])

  // 暴露控制函数给父组件
  useEffect(() => {
    if (speakToggleRef) {
      speakToggleRef.current = handleSpeak
    }
    return () => {
      if (speakToggleRef) {
        speakToggleRef.current = null
      }
    }
  }, [speakToggleRef, handleSpeak])

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
      <h3 className="text-primary text-sm font-medium font-serif mb-3 shrink-0">
        牌面解读
      </h3>

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
