import { Link, useNavigate } from 'react-router-dom'
import { getSessions, deleteSession, type Session } from '../services/session'
import { useState } from 'react'
import { FAB, type MenuItem } from '../components/FAB'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>(getSessions)

  const menuItems: MenuItem[] = [
    {
      icon: '🔮',
      label: '新的占卜',
      onClick: () => navigate('/'),
    },
  ]

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteSession(id)
    setSessions(getSessions())
  }

  if (sessions.length === 0) {
    return (
      <>
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 font-serif">
            心灵塔罗
          </h1>
          <p className="text-muted-foreground/80 mb-6 text-sm">暂无占卜记录</p>
          <Link
            to="/"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl inline-block text-sm
                     shadow-lg shadow-primary/20"
          >
            开始第一次占卜
          </Link>
        </div>
        <FAB items={menuItems} />
      </>
    )
  }

  return (
    <>
      <div className="w-full max-w-lg h-full flex flex-col mx-auto">
        <h2 className="text-lg font-serif text-foreground mb-4">历史记录</h2>

        <div className="flex-1 min-h-0 overflow-auto space-y-2">
          {sessions.map(session => (
            <Link
              key={session.id}
              to={`/s/${session.id}`}
              className="block bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">
                    {session.question}
                  </p>
                  <p className="text-muted-foreground/70 text-xs mt-1">
                    {session.cards.map(c => c.name).join(' · ')}
                  </p>
                  <p className="text-muted-foreground/50 text-xs mt-1">
                    {formatDate(session.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <FAB items={menuItems} />
    </>
  )
}
