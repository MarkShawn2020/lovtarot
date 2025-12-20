import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSession, updateReading } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult } from '../components/ReadingResult'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = id ? getSession(id) : null
  const [showReading, setShowReading] = useState(true)

  // 按键切换解读显隐
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setShowReading(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">未找到该占卜记录</p>
        <Link
          to="/"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl inline-block"
        >
          开始新的占卜
        </Link>
      </div>
    )
  }

  const handleReadingComplete = (reading: string) => {
    updateReading(session.id, reading)
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 标题区 */}
      <div className="text-center mb-6 shrink-0">
        <h1 className="text-3xl md:text-5xl font-bold text-primary font-serif leading-tight
                       drop-shadow-sm">
          {session.question}
        </h1>
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-1.5 bg-secondary/50 hover:bg-primary hover:text-primary-foreground
                     text-secondary-foreground/80 rounded-lg transition-all text-xs"
          >
            重新开始
          </button>
          <Link
            to="/history"
            className="text-muted-foreground/60 hover:text-primary transition-colors text-xs"
          >
            历史记录
          </Link>
        </div>
      </div>

      {/* 主体：卡片组 + 解读 水平布局 */}
      <div className="flex-1 min-h-0 flex gap-6">
        {/* 左侧：三张卡片 */}
        <div className={`transition-all duration-300 ${showReading ? 'flex-1' : 'flex-[2]'}`}>
          <CardDisplay cards={session.cards} />
        </div>

        {/* 右侧：解读区（可切换） */}
        <div className={`transition-all duration-300 overflow-hidden
                        ${showReading ? 'flex-1 opacity-100' : 'w-0 opacity-0'}`}>
          <ReadingResult
            question={session.question}
            cards={session.cards}
            cachedReading={session.reading}
            onComplete={handleReadingComplete}
          />
        </div>
      </div>

      {/* 快捷键提示 */}
      <p className="text-center text-muted-foreground/40 text-xs mt-2 shrink-0">
        按 空格 或 R 键切换解读
      </p>
    </div>
  )
}
