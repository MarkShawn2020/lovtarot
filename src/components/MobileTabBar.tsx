import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MobileAudioPanel, MusicIcon } from './audio'

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
)

const CompassIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

interface TabItemProps {
  to?: string
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function TabItem({ to, icon, label, active, onClick }: TabItemProps) {
  const className = `flex flex-col items-center gap-0.5 transition-colors outline-none focus:outline-none cursor-pointer select-none ${
    active ? 'text-primary' : 'text-muted-foreground active:text-primary'
  }`

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur()
    onClick?.()
  }

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        tabIndex={-1}
        onClick={(e) => e.currentTarget.blur()}
      >
        {icon}
        <span className="text-xs">{label}</span>
      </Link>
    )
  }

  return (
    <button onClick={handleClick} className={className} tabIndex={-1}>
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}

export function MobileTabBar() {
  const location = useLocation()
  const [audioOpen, setAudioOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* 音频控制面板 */}
      <MobileAudioPanel open={audioOpen} onClose={() => setAudioOpen(false)} />

      {/* 底部导航栏 - 仅移动端显示 */}
      <nav className="fixed bottom-0 left-0 right-0 sm:hidden bg-card/95 backdrop-blur-sm border-t border-border z-30">
        <div className="flex items-center justify-around h-14 px-4">
          <TabItem
            to="/"
            icon={<PlusIcon />}
            label="新占卜"
            active={isActive('/')}
          />
          <TabItem
            to="/history"
            icon={<CompassIcon />}
            label="发现"
            active={isActive('/history')}
          />
          <TabItem
            icon={<MusicIcon />}
            label="控制"
            active={audioOpen}
            onClick={() => setAudioOpen(o => !o)}
          />
          <TabItem
            to="/profile"
            icon={<UserIcon />}
            label="个人"
            active={isActive('/profile')}
          />
        </div>
      </nav>
    </>
  )
}
