import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { TarotCard } from '../data/tarot'
import { getReadingStream } from '../services/ai'
import { StreamingTTS } from '../services/tts-streaming'
import { registerTTS, unregisterTTS, notifyListeners, type TTSState } from '../services/tts-control'
import { generateAndCacheAudio } from '../services/tts-cache'
import { useAuth } from '../hooks/useAuth'

// 水晶球蓄力动画组件
function CrystalBallLoader({ phase, thinkingSeconds }: { phase: StreamingPhase; thinkingSeconds: number }) {
  const isThinking = phase === 'requesting' || phase === 'thinking'

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* 水晶球容器 */}
      <div className="relative w-24 h-24">
        {/* 外层光晕 - 慢速脉动 */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-crystal-glow" />

        {/* 中层光环 - 旋转 */}
        <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-crystal-spin" />

        {/* 内核 - 渐变脉动 */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/40 via-primary/60 to-primary/40 animate-crystal-pulse shadow-lg shadow-primary/30" />

        {/* 中心光点 */}
        <div className="absolute inset-8 rounded-full bg-primary/80 animate-crystal-core" />

        {/* 微粒效果 */}
        {isThinking && (
          <>
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary/60 rounded-full animate-particle-1" />
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary/50 rounded-full animate-particle-2" />
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary/70 rounded-full animate-particle-3" />
          </>
        )}
      </div>

      {/* 状态文字 */}
      <div className="mt-6 text-center">
        <p className="text-primary/80 text-sm font-serif animate-fade-pulse">
          {phase === 'requesting' ? '正在连接塔罗灵感...' : '命运之轮正在旋转...'}
        </p>
        {thinkingSeconds > 0 && (
          <p className="text-muted-foreground/60 text-xs mt-1 tabular-nums">
            {thinkingSeconds}s
          </p>
        )}
      </div>
    </div>
  )
}

// 打字机文字组件
function TypewriterText({
  text,
  isStreaming,
  className
}: {
  text: string
  isStreaming: boolean
  className?: string
}) {
  const [displayedLength, setDisplayedLength] = useState(0)
  const prevTextLengthRef = useRef(0)

  useEffect(() => {
    // 如果文本变长了（streaming），追赶显示
    if (text.length > prevTextLengthRef.current) {
      prevTextLengthRef.current = text.length

      // 已显示的字符数如果落后，逐步追赶
      if (displayedLength < text.length) {
        // 持续追赶直到显示完毕
        const interval = setInterval(() => {
          setDisplayedLength(prev => {
            if (prev >= text.length) {
              clearInterval(interval)
              return prev
            }
            const lag = text.length - prev
            const step = lag > 20 ? 3 : lag > 10 ? 2 : 1
            return Math.min(prev + step, text.length)
          })
        }, 30) // 约 30-100 字/秒

        return () => clearInterval(interval)
      }
    }
  }, [text, displayedLength])

  // 如果不是 streaming 模式，直接显示全部
  const displayText = isStreaming ? text.slice(0, displayedLength) : text
  const showCursor = isStreaming && displayedLength < text.length

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span className="inline-block w-0.5 h-[1em] bg-primary/60 ml-0.5 animate-cursor-blink align-text-bottom" />
      )}
    </span>
  )
}

export type StreamingPhase =
  | 'idle'           // 空闲
  | 'awaiting_confirmation' // 等待用户确认开启解读（登录后的仪式感）
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
  const { user, isLoading: authLoading } = useAuth()
  const location = useLocation()

  const [reasoning, setReasoning] = useState(cachedReasoning || '')
  const [reasoningExpanded, setReasoningExpanded] = useState(false)
  const [reading, setReading] = useState(cachedReading || '')
  // 如果有缓存则直接 idle；否则已登录显示确认界面，未登录显示登录提示
  const [phase, setPhase] = useState<StreamingPhase>(cachedReading ? 'idle' : (user ? 'awaiting_confirmation' : 'idle'))
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
  const audioUrlRef = useRef(audioUrl)
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

  // 同时更新 audioUrl state 和 ref（避免 timing 问题）
  const updateAudioUrl = useCallback((url: string | undefined) => {
    setAudioUrl(url)
    audioUrlRef.current = url
  }, [])

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
    console.log('[TTS] playTTS called, audioUrlRef.current:', audioUrlRef.current, 'url param:', url)
    if (ttsStateRef.current !== 'idle') return

    // 使用 ref 确保获取最新的 audioUrl
    const cachedUrl = url || audioUrlRef.current
    const content = text || readingRef.current
    console.log('[TTS] cachedUrl:', cachedUrl, 'content length:', content?.length)
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
  }, [])

  // 暂停 TTS（支持缓存音频和实时 TTS）
  const pauseTTS = useCallback(() => {
    if (ttsStateRef.current !== 'playing') return

    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (ttsRef.current) {
      ttsRef.current.pause()
    }
    ttsStateRef.current = 'paused'
    notifyListeners()
  }, [])

  // 继续 TTS
  const resumeTTS = useCallback(() => {
    if (ttsStateRef.current !== 'paused') return

    if (audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
    if (ttsRef.current) {
      ttsRef.current.resume()
    }
    ttsStateRef.current = 'playing'
    notifyListeners()
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
      updateAudioUrl(undefined)
      setReasoning('')
      setReasoningExpanded(false)
      setReading('')
      setError(null)
      setIgnoreCache(true)
      setRetryCount(c => c + 1)
    }
  }, [retryTrigger, stopTTS, updateAudioUrl])

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
        updateAudioUrl(prevResultRef.current.audioUrl)
      }
      setPhase('idle')
      setIgnoreCache(false)
    }
  }, [stopTrigger, stopTTS, updateAudioUrl])

  // 保持 onComplete ref 最新
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // 有缓存则不重新请求
    if (cachedReading && !ignoreCache) return
    // 未登录且没有缓存，不请求 AI
    if (!user) return
    // 等待用户确认时不开始请求
    if (phase === 'awaiting_confirmation') return

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
            updateAudioUrl(url)
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
  }, [sessionId, question, cards, cachedReading, ignoreCache, playTTS, stopTTS, updateAudioUrl, retryCount, user, phase])

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

  // 未登录且无缓存，显示登录提示
  if (!user && !cachedReading && !authLoading) {
    const currentPath = location.pathname
    return (
      <div className="h-full flex flex-col bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-primary text-sm font-medium font-serif">
            牌面解读
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          {/* 锁定图标 */}
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <p className="text-foreground/80 text-sm mb-2">登录后开启牌面解读</p>
          <p className="text-muted-foreground text-xs mb-6">AI 解读由大模型生成，需要登录使用</p>
          <Link
            to={`/auth?redirect=${encodeURIComponent(currentPath)}`}
            className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors text-sm font-medium"
          >
            登录 / 注册
          </Link>
        </div>
      </div>
    )
  }

  // 已登录但等待确认，显示开启解读的仪式界面
  if (phase === 'awaiting_confirmation') {
    return (
      <div className="h-full flex flex-col bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-primary text-sm font-medium font-serif">
            牌面解读
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          {/* 水晶球图标 - 准备就绪状态 */}
          <div className="relative w-20 h-20 mb-6">
            {/* 外层柔和光晕 */}
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse" />
            {/* 中层光环 */}
            <div className="absolute inset-2 rounded-full border border-primary/30" />
            {/* 内核 - 静态渐变 */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/30 via-primary/50 to-primary/30 shadow-lg shadow-primary/20" />
            {/* 中心星星图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z" />
              </svg>
            </div>
          </div>
          <p className="text-foreground/90 text-sm mb-1 font-serif">牌面已就位</p>
          <p className="text-muted-foreground text-xs mb-6">静心凝神，准备聆听命运的回响</p>
          <button
            onClick={() => setPhase('requesting')}
            className="group relative px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            <span className="relative z-10">开启解读</span>
            {/* 按钮光效 */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => setRetryCount(c => c + 1)}
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

  const isLoadingPhase = phase === 'requesting' || phase === 'thinking'
  const isStreamingPhase = phase === 'reading'

  return (
    <div className="h-full flex flex-col bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
      {/* 顶部标题栏 - 仅在有内容或有思考过程时显示 */}
      {(reading || reasoning || !isLoadingPhase) && (
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
                <span>
                  思考过程
                  {thinkingSeconds > 0 && <span className="tabular-nums">（{thinkingSeconds}s）</span>}
                </span>
                <span className="text-[10px]">{reasoningExpanded ? '▲' : '▼'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto pr-2">
        {/* 水晶球蓄力动画 - 在 requesting/thinking 阶段显示 */}
        {isLoadingPhase && !reading && (
          <CrystalBallLoader phase={phase} thinkingSeconds={thinkingSeconds} />
        )}

        {/* 思考过程 */}
        {reasoning && reasoningExpanded && (
          <div className="mb-3 pb-3 border-b border-border/30">
            <p className="text-muted-foreground/60 text-xs leading-relaxed italic whitespace-pre-wrap">
              {reasoning}
            </p>
          </div>
        )}

        {/* 牌面解读内容 - 带打字机效果 */}
        {reading && reading.split('\n').map((paragraph, i, arr) => (
          paragraph.trim() && (
            <p key={i} className="text-foreground/90 leading-relaxed text-sm mb-3">
              {isStreamingPhase && i === arr.length - 1 ? (
                <TypewriterText
                  text={paragraph}
                  isStreaming={true}
                  className=""
                />
              ) : (
                paragraph
              )}
            </p>
          )
        ))}
      </div>
    </div>
  )
}
