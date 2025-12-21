import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { domToJpeg } from 'modern-screenshot'
import { getSession, updateReading, type Session } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult } from '../components/ReadingResult'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)

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
  const [retryTrigger, setRetryTrigger] = useState(0)

  const takeScreenshot = useCallback(async () => {
    if (!contentRef.current) return

    const computedBg = getComputedStyle(document.body).backgroundColor
    const dataUrl = await domToJpeg(contentRef.current, { scale: 4, quality: 0.9, backgroundColor: computedBg })

    const link = document.createElement('a')
    link.download = `塔罗-${Date.now()}.jpg`
    link.href = dataUrl
    link.click()
  }, [])

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

  const handleReadingComplete = (reading: string, reasoning: string, thinkingSeconds: number) => {
    updateReading(session.id, reading, reasoning, thinkingSeconds)
  }

  return (
    <div className="w-full min-h-full">
      {/* 顶部导航栏 */}
      <nav className="flex items-center justify-between mb-6">
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
            onComplete={handleReadingComplete}
            onStreamingChange={setIsStreaming}
          />
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <button
          onClick={() => setRetryTrigger(n => n + 1)}
          disabled={isStreaming}
          className="px-4 py-2 border rounded-xl transition-colors disabled:cursor-not-allowed text-muted-foreground hover:text-primary border-border hover:border-primary/50 disabled:text-primary/70 disabled:border-primary/30 disabled:hover:text-primary/70 disabled:hover:border-primary/30"
        >
          {isStreaming ? (
            <span className="flex items-center gap-2">
              <span className="relative flex items-center justify-center w-4 h-4">
                <span className="absolute w-2 h-2 bg-primary/80 rounded-full" />
                <span className="absolute w-4 h-4 bg-primary/40 rounded-full animate-ping" />
              </span>
              正在解读
            </span>
          ) : '重新解读'}
        </button>
        <button
          onClick={takeScreenshot}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors"
        >
          保存截图
        </button>
      </div>
    </div>
  )
}
