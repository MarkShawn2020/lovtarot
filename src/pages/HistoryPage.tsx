import { Link, useNavigate } from 'react-router-dom'
import { getSessions, deleteSession, type Session } from '../services/session'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { PersonIcon } from '@radix-ui/react-icons'

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
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[] | null>(null)

  useEffect(() => {
    getSessions().then(setSessions)
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await deleteSession(id)
    const updated = await getSessions()
    setSessions(updated)
  }

  // 骨架屏占位
  const SkeletonItem = () => (
    <div className="bg-card/60 border border-border/50 rounded-xl p-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-3 bg-muted/60 rounded w-1/2 mb-1" />
      <div className="h-3 bg-muted/40 rounded w-1/3" />
    </div>
  )

  return (
    <div className="w-full max-w-lg flex flex-col mx-auto">
      {/* 顶部导航 - 仅桌面端 */}
      <div className="hidden sm:flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          ← 返回
        </button>
        <h2 className="text-lg font-serif text-foreground">历史记录</h2>
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:text-primary/80 transition-colors text-sm"
        >
          新占卜
        </button>
      </div>

      {/* 移动端标题 */}
      <h2 className="sm:hidden text-lg font-serif text-foreground text-center mb-4">发现</h2>

      {/* 内容区 */}
      <div className="flex-1 min-h-0 overflow-auto space-y-2">
        {sessions === null ? (
          // Loading 骨架屏
          <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </>
        ) : sessions.length === 0 ? (
          // 空状态
          <div className="text-center py-8">
            <p className="text-muted-foreground/80 mb-4 text-sm">暂无占卜记录</p>
            <Link
              to="/"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl inline-block text-sm shadow-lg shadow-primary/20"
            >
              开始第一次占卜
            </Link>
          </div>
        ) : (
          // 列表
          sessions.map(session => (
            <Link
              key={session.id}
              to={`/s/${session.id}`}
              className="block bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* 左侧：问题内容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">
                    {session.question}
                  </p>
                  <p className="text-muted-foreground/70 text-xs mt-1">
                    {session.cards.map(c => c.name).join(' · ')}
                  </p>
                </div>
                {/* 右侧：用户信息 + 时间 */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/70 text-xs">
                      {session.user?.nickname || '匿名'}
                    </span>
                    {session.user?.avatarUrl ? (
                      <img
                        src={session.user.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <PersonIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/50 text-xs">
                    <span>{formatDate(session.createdAt)}</span>
                    {user?.id === session.userId && (
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
