import { Link } from 'react-router-dom'
import { getSessions, deleteSession, type Session } from '../services/session'
import { useState } from 'react'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>(getSessions)

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteSession(id)
    setSessions(getSessions())
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">暂无占卜记录</p>
        <Link
          to="/"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl inline-block"
        >
          开始第一次占卜
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif text-foreground">历史记录</h2>
        <Link
          to="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm"
        >
          新的占卜
        </Link>
      </div>

      <div className="space-y-3">
        {sessions.map(session => (
          <Link
            key={session.id}
            to={`/s/${session.id}`}
            className="block bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium truncate">
                  {session.question}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {session.cards.map(c => c.name).join(' · ')}
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  {formatDate(session.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(session.id, e)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                title="删除"
              >
                ✕
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
