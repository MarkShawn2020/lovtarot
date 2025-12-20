import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, updateReading } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult } from '../components/ReadingResult'
import { FAB, type MenuItem } from '../components/FAB'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = id ? getSession(id) : null

  // 语音控制
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speakToggleRef = useRef<(() => void) | null>(null)

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
    <div className="w-full min-h-full">
      <h1 className="text-center text-3xl font-bold text-primary font-serif leading-tight drop-shadow-sm my-10">
        {session.question}
      </h1>

      <div className="flex flex-col gap-6">
        <CardDisplay cards={session.cards} />
        <ReadingResult
          question={session.question}
          cards={session.cards}
          cachedReading={session.reading}
          onComplete={handleReadingComplete}
          onSpeakingChange={setIsSpeaking}
          speakToggleRef={speakToggleRef}
        />
      </div>

      <FAB items={menuItems} />
    </div>
  )
}
