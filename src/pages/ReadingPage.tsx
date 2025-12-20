import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSession, updateReading } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult } from '../components/ReadingResult'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = id ? getSession(id) : null

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
    <>
      <div className="mb-8">
        <p className="text-center text-muted-foreground mb-4">你的问题</p>
        <p className="text-center text-xl text-foreground font-serif">"{session.question}"</p>
      </div>

      <CardDisplay cards={session.cards} />

      <ReadingResult
        question={session.question}
        cards={session.cards}
        cachedReading={session.reading}
        onComplete={handleReadingComplete}
      />

      <div className="text-center mt-8 flex justify-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-secondary hover:bg-primary hover:text-primary-foreground
                   text-secondary-foreground rounded-xl transition-colors duration-300"
        >
          再问一个问题
        </button>
        <Link
          to="/history"
          className="px-6 py-3 bg-secondary hover:bg-primary hover:text-primary-foreground
                   text-secondary-foreground rounded-xl transition-colors duration-300"
        >
          历史记录
        </Link>
      </div>
    </>
  )
}
