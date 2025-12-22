import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function UserMenu() {
  const { user, signOut, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return (
      <Link
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        登录
      </Link>
    )
  }

  // 获取用户邮箱的首字母作为头像
  const initial = user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="relative group">
      <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium hover:bg-primary/20 transition-colors">
        {initial}
      </button>
      {/* 悬浮下拉菜单 */}
      <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-b-xl"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
