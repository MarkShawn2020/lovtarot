import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Masonry from 'react-masonry-css'
import { QuestionInput } from '../components/QuestionInput'
import { ShufflingAnimation } from '../components/ShufflingAnimation'
import { drawCards } from '../data/tarot'
import { createSession, getSessions } from '../services/session'

export function HomePage() {
  const navigate = useNavigate()
  const [isDrawing, setIsDrawing] = useState(false)
  const sessions = getSessions().slice(0, 5)

  const handleSubmit = (question: string) => {
    setIsDrawing(true)

    // 洗牌动画后抽牌并跳转
    setTimeout(() => {
      const cards = drawCards(3)
      const session = createSession(question, cards)
      navigate(`/s/${session.id}`)
    }, 2500)
  }

  if (isDrawing) {
    return <ShufflingAnimation />
  }

  return (
    <>
      <QuestionInput onSubmit={handleSubmit} />

      {sessions.length > 0 && (
        <section className="mt-8 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-serif text-muted-foreground">历史占卜</h3>
            <Link
              to="/history"
              className="text-muted-foreground/60 hover:text-primary text-xs transition-colors"
            >
              查看全部 →
            </Link>
          </div>
          <Masonry
            breakpointCols={{ default: 2, 480: 1 }}
            className="flex gap-3 -ml-3"
            columnClassName="pl-3 space-y-3"
          >
            {sessions.map(session => (
              <Link
                key={session.id}
                to={`/s/${session.id}`}
                className="flex bg-card/40 border border-border/30 rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
              >
                {/* 左侧卡牌组 */}
                <div className="shrink-0 w-20 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-center py-3">
                  <div className="flex -space-x-5">
                    {session.cards.map((card, i) => (
                      <img
                        key={card.id}
                        src={card.image}
                        alt={card.name}
                        className="w-8 h-12 object-cover rounded shadow-sm border border-border/50"
                        style={{
                          transform: `rotate(${(i - 1) * 10}deg)`,
                          zIndex: i === 1 ? 10 : 1
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* 右侧文字内容 */}
                <div className="flex-1 px-3 py-2 min-w-0">
                  <p className="text-foreground/90 text-sm">{session.question}</p>
                  <p className="text-muted-foreground/50 text-xs mt-1 truncate">
                    {session.cards.map(c => c.name).join(' · ')}
                  </p>
                </div>
              </Link>
            ))}
          </Masonry>
        </section>
      )}
    </>
  )
}
