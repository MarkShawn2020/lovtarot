import { useState, useEffect, useRef, useCallback } from 'react'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { StreamingTTS } from '../services/tts-streaming'
import { registerTTS, unregisterTTS, notifyListeners, type TTSState } from '../services/tts-control'
import { generateAndCacheAudio } from '../services/tts-cache'

export type StreamingPhase =
  | 'idle'           // 空闲
  | 'requesting'     // 请求大模型回复
  | 'thinking'       // 大模型正在思考
  | 'reading'        // 大模型正在解读
  | 'generating_audio' // 正在生成音频
  | 'playing'        // 正在播放音频

interface Props {
  sessionId: string
  question: string
  cards: TarotCard[]
  cachedReading?: string
  cachedReasoning?: string
  cachedThinkingSeconds?: number
  cachedAudioUrl?: string
  retryTrigger?: number
  stopTrigger?: number
  onComplete?: (reading: string, reasoning: string, thinkingSeconds: number) => void
  onPhaseChange?: (phase: StreamingPhase) => void
}

// 保存之前的解读结果用于回退
interface PrevResult {
  reading: string
  reasoning: string
  thinkingSeconds: number
  audioUrl?: string
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
  stopTrigger,
  onComplete,
  onPhaseChange,
}: Props) {
  const [reasoning, setReasoning] = useState(cachedReasoning || '')
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const [reading, setReading] = useState(cachedReading || '')
  const [phase, setPhase] = useState<StreamingPhase>(cachedReading ? 'idle' : 'requesting')
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
  const prevPhaseRef = useRef<StreamingPhase | null>(null)
  const onPhaseChangeRef = useRef(onPhaseChange)
  const prevResultRef = useRef<PrevResult | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 保持 callback ref 最新
  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange
  }, [onPhaseChange])

  // 同步 ref
  useEffect(() => {
    readingRef.current = reading
  }, [reading])
  useEffect(() => {
    thinkingSecondsRef.current = thinkingSeconds
  }, [thinkingSeconds])

  // 通知父组件 phase 变化（仅在真正变化时，使用 ref 避免依赖 callback）
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase
      onPhaseChangeRef.current?.(phase)
    }
  }, [phase])

  // 思考计时器（在 requesting 或 thinking 阶段运行）
  useEffect(() => {
    if (phase === 'requesting' || phase === 'thinking') {
      setThinkingSeconds(0)
      const timer = setInterval(() => setThinkingSeconds(s => s + 1), 1000)
      return () => clearInterval(timer)
    }
  }, [phase])

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

  // 用于保存当前状态的 ref（避免 callback 依赖状态导致重复触发）
  const currentStateRef = useRef({ reading, reasoning, thinkingSeconds, audioUrl })
  useEffect(() => {
    currentStateRef.current = { reading, reasoning, thinkingSeconds, audioUrl }
  }, [reading, reasoning, thinkingSeconds, audioUrl])

  // 外部触发重试
  const retryTriggerRef = useRef(0)
  useEffect(() => {
    if (retryTrigger && retryTrigger > retryTriggerRef.current) {
      retryTriggerRef.current = retryTrigger
      console.log('[Reading] 用户点击重新解读')
      // 保存当前结果用于回退
      const { reading: r, reasoning: rs, thinkingSeconds: ts, audioUrl: au } = currentStateRef.current
      if (r) {
        prevResultRef.current = { reading: r, reasoning: rs, thinkingSeconds: ts, audioUrl: au }
      }
      stopTTS()
      setAudioUrl(undefined)
      setReasoning('')
      setReasoningExpanded(false)
      setReading('')
      setError(null)
      setIgnoreCache(true)
      setRetryCount(c => c + 1)
    }
  }, [retryTrigger, stopTTS])

  // 外部触发停止
  const stopTriggerRef = useRef(0)
  useEffect(() => {
    if (stopTrigger && stopTrigger > stopTriggerRef.current) {
      stopTriggerRef.current = stopTrigger
      console.log('[Reading] 用户点击停止解读')
      // 中止请求
      abortControllerRef.current?.abort()
      stopTTS()

      // 恢复之前的结果
      if (prevResultRef.current) {
        console.log('[Reading] 恢复之前的解读结果')
        setReading(prevResultRef.current.reading)
        setReasoning(prevResultRef.current.reasoning)
        setThinkingSeconds(prevResultRef.current.thinkingSeconds)
        setAudioUrl(prevResultRef.current.audioUrl)
      }
      setPhase('idle')
      setIgnoreCache(false)
    }
  }, [stopTrigger, stopTTS])

  // 保持 onComplete ref 最新
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (cachedReading && !ignoreCache) return

    let cancelled = false
    let fullReasoning = ''
    let fullReading = ''
    let hasReceivedReasoning = false
    let hasReceivedReading = false

    // 创建 AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    async function fetchReading() {
      console.log('[Reading] 开始请求大模型回复')
      setPhase('requesting')
      setReasoning('')
      setReading('')
      setError(null)

      try {
        await getReadingStream(question, cards, (chunk, type) => {
          if (cancelled || abortController.signal.aborted) return

          if (type === 'reasoning') {
            if (!hasReceivedReasoning) {
              hasReceivedReasoning = true
              console.log('[Reading] 大模型开始思考')
              setPhase('thinking')
            }
            fullReasoning += chunk
            setReasoning(fullReasoning)
          } else {
            if (!hasReceivedReading) {
              hasReceivedReading = true
              console.log('[Reading] 大模型思考结束，开始解读')
              setPhase('reading')
            }
            fullReading += chunk
            setReading(fullReading)
          }
        })

        if (!cancelled && !abortController.signal.aborted) {
          console.log('[Reading] 大模型解读完毕')

          // 生成音频
          console.log('[Reading] 开始请求音频')
          setPhase('generating_audio')

          const audioPromise = generateAndCacheAudio(sessionId, fullReading)

          // 同时开始实时 TTS 播放
          console.log('[Reading] 开始自动播放音频')
          setPhase('playing')
          playTTS(fullReading)

          // 等待音频生成完成
          const url = await audioPromise
          if (url && !cancelled && !abortController.signal.aborted) {
            setAudioUrl(url)
            console.log('[Reading] 音频缓存完成')
          }

          // 完成回调
          onCompleteRef.current?.(fullReading, fullReasoning, thinkingSecondsRef.current)
          setPhase('idle')
          console.log('[Reading] 流程结束')
        }
      } catch (err) {
        if (!cancelled && !abortController.signal.aborted) {
          setPhase('idle')
          setError('获取解读时出现问题，请稍后重试')
          console.error('[Reading] 请求出错:', err)
        }
      }
    }

    fetchReading()

    return () => {
      cancelled = true
      abortController.abort()
      stopTTS()
    }
  }, [sessionId, question, cards, cachedReading, ignoreCache, playTTS, stopTTS, retryCount])

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
          {(phase === 'requesting' || phase === 'thinking' || reasoning) && (
            <button
              onClick={() => setReasoningExpanded(e => !e)}
              disabled={phase === 'requesting'}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors disabled:cursor-default"
            >
              {(phase === 'requesting' || phase === 'thinking') && (
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
              <span>
                {phase === 'requesting' ? '正在请求' : '思考过程'}
                {thinkingSeconds > 0 && <span className="tabular-nums">（{thinkingSeconds}s）</span>}
              </span>
              {phase !== 'requesting' && <span className="text-[10px]">{reasoningExpanded ? '▲' : '▼'}</span>}
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
        {reading && reading.split('\n').map((paragraph, i, arr) => (
          paragraph.trim() && (
            <p key={i} className="text-foreground/90 leading-relaxed text-sm mb-3">
              {paragraph}
              {phase === 'reading' && i === arr.length - 1 && (
                <span className="inline-block w-1.5 h-3.5 bg-primary/60 ml-0.5 animate-pulse" />
              )}
            </p>
          )
        ))}
      </div>
    </div>
  )
}
