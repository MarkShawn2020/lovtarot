import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getSessions, type Session } from '../services/session'
import { useState, useEffect } from 'react'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function ProfilePage() {
  const { user, signOut, isLoading } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 })

  useEffect(() => {
    getSessions().then(list => {
      setSessions(list.slice(0, 5)) // 只显示最近5条
      const now = new Date()
      const thisMonth = list.filter(s => {
        const d = new Date(s.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length
      setStats({ total: list.length, thisMonth })
    })
  }, [])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-serif text-foreground mb-2">登录后查看个人中心</h2>
        <p className="text-muted-foreground text-sm mb-6">登录后可同步占卜记录到云端</p>
        <Link
          to="/auth?redirect=/profile"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm shadow-lg shadow-primary/20"
        >
          立即登录
        </Link>
      </div>
    )
  }

  const initial = user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 用户信息卡片 */}
      <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-medium">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium truncate">{user.email}</p>
            <p className="text-muted-foreground text-sm mt-1">
              本月 {stats.thisMonth} 次 · 共 {stats.total} 次占卜
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* 最近占卜 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">最近占卜</h3>
        <Link to="/history" className="text-xs text-primary hover:text-primary/80">
          查看全部 →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl">
          <p className="text-muted-foreground text-sm mb-4">暂无占卜记录</p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            开始占卜
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <Link
              key={session.id}
              to={`/s/${session.id}`}
              className="block bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 hover:border-primary/50 transition-all"
            >
              <p className="text-foreground text-sm font-medium truncate">
                {session.question}
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                {session.cards.map(c => c.name).join(' · ')}
              </p>
              <p className="text-muted-foreground/50 text-xs mt-1">
                {formatDate(session.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
