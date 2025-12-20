import { useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { domToJpeg } from 'modern-screenshot'
import { getSession, updateReading } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult } from '../components/ReadingResult'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const session = id ? getSession(id) : null

  const contentRef = useRef<HTMLDivElement>(null)

  const takeScreenshot = useCallback(async () => {
    if (!contentRef.current) return

    const computedBg = getComputedStyle(document.body).backgroundColor
    const dataUrl = await domToJpeg(contentRef.current, { scale: 4, quality: 0.9, backgroundColor: computedBg })

    const link = document.createElement('a')
    link.download = `塔罗-${Date.now()}.jpg`
    link.href = dataUrl
    link.click()
  }, [])

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

  const handleReadingComplete = (reading: string) => {
    updateReading(session.id, reading)
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
            question={session.question}
            cards={session.cards}
            cachedReading={session.reading}
            onComplete={handleReadingComplete}
          />
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="mt-8 flex items-center justify-center text-sm">
        <button
          onClick={takeScreenshot}
          className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-card/60 rounded-lg transition-colors"
        >
          📷 保存截图
        </button>
      </div>
    </div>
  )
}
