import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { domToJpeg } from 'modern-screenshot'
import { getSession, updateReading, type Session } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult, type StreamingPhase } from '../components/ReadingResult'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<StreamingPhase>('idle')
  const [stopTrigger, setStopTrigger] = useState(0)

  useEffect(() => {
    if (id) {
      getSession(id).then(s => {
        setSession(s)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [id])

  const contentRef = useRef<HTMLDivElement>(null)
  const [retryTrigger, _setRetryTrigger] = useState(0)  // 暂时禁用重试功能

  const takeScreenshot = useCallback(async () => {
    if (!contentRef.current) return

    const computedBg = getComputedStyle(document.body).backgroundColor
    const dataUrl = await domToJpeg(contentRef.current, { scale: 4, quality: 0.9, backgroundColor: computedBg })

    const link = document.createElement('a')
    link.download = `塔罗-${Date.now()}.jpg`
    link.href = dataUrl
    link.click()
  }, [])

  const handleReadingComplete = useCallback((reading: string, reasoning: string, thinkingSeconds: number) => {
    if (session) {
      updateReading(session.id, reading, reasoning, thinkingSeconds)
      // 同步更新本地 session state，防止 cachedReading 为空导致重复请求
      setSession(prev => prev ? { ...prev, reading, reasoning, thinkingSeconds } : prev)
    }
  }, [session])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">未找到该占卜记录</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl"
          >
            开始新的占卜
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-full">
      {/* 顶部导航栏 - 仅桌面端显示 */}
      <nav className="hidden sm:flex items-center justify-between mb-6">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← 新占卜
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            历史记录
          </Link>
        </div>
      </nav>

      {/* 截图区域：标题 + 卡牌 + 解读 */}
      <div ref={contentRef} className="p-4 -mx-4">
        <h1 className="text-center text-3xl font-bold text-primary font-serif leading-tight drop-shadow-sm mb-10">
          {session.question}
        </h1>

        <div className="flex flex-col gap-6">
          <CardDisplay cards={session.cards} />
          <ReadingResult
            sessionId={session.id}
            question={session.question}
            cards={session.cards}
            cachedReading={session.reading}
            cachedReasoning={session.reasoning}
            cachedThinkingSeconds={session.thinkingSeconds}
            cachedAudioUrl={session.audioUrl}
            retryTrigger={retryTrigger}
            stopTrigger={stopTrigger}
            onComplete={handleReadingComplete}
            onPhaseChange={setPhase}
          />
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        {phase !== 'idle' && phase !== 'awaiting_confirmation' && (
          <button
            onClick={() => setStopTrigger(n => n + 1)}
            className="px-4 py-2 border rounded-xl transition-colors text-destructive/70 border-destructive/30 hover:text-destructive hover:border-destructive/50 active:scale-95"
          >
            中断解读
          </button>
        )}
        <button
          onClick={takeScreenshot}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors active:scale-95"
        >
          保存截图
        </button>
      </div>
    </div>
  )
}
