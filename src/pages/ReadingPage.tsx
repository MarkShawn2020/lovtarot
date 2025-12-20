import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, updateReading } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult } from '../components/ReadingResult'
import { FAB, type MenuItem } from '../components/FAB'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = id ? getSession(id) : null
  const [showReading, setShowReading] = useState(true)

  // 语音控制
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speakToggleRef = useRef<(() => void) | null>(null)

  // 快捷键
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
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">未找到该占卜记录</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl"
          >
            开始新的占卜
          </button>
        </div>
      </div>
    )
  }

  const handleReadingComplete = (reading: string) => {
    updateReading(session.id, reading)
  }

  const menuItems: MenuItem[] = [
    {
      icon: showReading ? '👁️' : '👁️‍🗨️',
      label: showReading ? '隐藏解读' : '显示解读',
      shortcut: 'R',
      onClick: () => setShowReading(prev => !prev),
    },
    {
      icon: isSpeaking ? '⏹' : '🔊',
      label: isSpeaking ? '停止语音' : '语音播放',
      onClick: () => speakToggleRef.current?.(),
      keepOpen: true,
    },
    {
      icon: '🔄',
      label: '重新开始',
      onClick: () => navigate('/'),
    },
    {
      icon: '📜',
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ]

  return (
    <div className="w-full min-h-full md:h-full md:overflow-hidden md:flex md:flex-col">
      {/* 标题 */}
      <h1 className="text-center text-3xl md:text-5xl font-bold text-primary font-serif
                     leading-tight drop-shadow-sm my-10 md:my-0 md:mb-6 md:shrink-0">
        {session.question}
      </h1>

      {/* 主体：窄屏纵向流式，宽屏横向flex */}
      <div className="md:flex-1 md:min-h-0 md:flex md:flex-row md:gap-6">
        <div className={`w-full mb-4 md:mb-0 md:w-auto transition-all duration-300
                        ${showReading ? 'md:flex-1' : 'md:flex-[2]'}`}>
          <CardDisplay cards={session.cards} />
        </div>

        <div className={`w-full transition-all duration-300 overflow-hidden
                        ${showReading ? 'md:flex-1 opacity-100' : 'h-0 md:w-0 opacity-0'}`}>
          <ReadingResult
            question={session.question}
            cards={session.cards}
            cachedReading={session.reading}
            onComplete={handleReadingComplete}
            onSpeakingChange={setIsSpeaking}
            speakToggleRef={speakToggleRef}
          />
        </div>
      </div>

      <FAB items={menuItems} />
    </div>
  )
}
