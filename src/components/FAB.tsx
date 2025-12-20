import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { playBGM, pauseBGM, isBGMPlaying, setVolume, getVolume, initBGM } from '../services/bgm'

export interface MenuItem {
  icon: ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  keepOpen?: boolean
}

interface Props {
  items?: MenuItem[]
}

export function FAB({ items = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [vol, setVol] = useState(0.3)
  const [showVolume, setShowVolume] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  // 初始化音乐
  useEffect(() => {
    initBGM()
    setVol(getVolume())
  }, [])

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowVolume(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const toggleMusic = useCallback(() => {
    if (musicPlaying) {
      pauseBGM()
      setMusicPlaying(false)
    } else {
      playBGM().then(() => setMusicPlaying(isBGMPlaying()))
    }
  }, [musicPlaying])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVol(v)
    setVolume(v)
  }, [])

  // 合并菜单项：页面特定项 + 音乐控制
  const allItems: MenuItem[] = [
    ...items,
    {
      icon: musicPlaying ? '⏸' : '🎵',
      label: musicPlaying ? '暂停音乐' : '播放音乐',
      onClick: toggleMusic,
      keepOpen: true,
    },
  ]

  return (
    <div ref={fabRef} className="fixed bottom-6 right-6 z-50">
      {/* 展开菜单 */}
      <div className={`absolute bottom-12 right-0 flex flex-col gap-1.5 transition-all duration-200
                      ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>

        {allItems.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              item.onClick()
              if (!item.keepOpen) setOpen(false)
            }}
            onMouseEnter={() => item.label.includes('音乐') && setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
            className="flex items-center gap-3 px-4 py-2.5 bg-card/95 backdrop-blur-sm
                     border border-border/50 rounded-xl shadow-lg
                     hover:bg-primary hover:text-primary-foreground hover:border-primary
                     transition-all whitespace-nowrap text-sm"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.shortcut && (
              <kbd className="ml-auto text-xs text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded">
                {item.shortcut}
              </kbd>
            )}
          </button>
        ))}

        {/* 音量滑块 */}
        {showVolume && (
          <div className="absolute right-full mr-2 bottom-0 bg-card/95 backdrop-blur-sm
                        border border-border/50 rounded-xl shadow-lg px-3 py-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vol}
              onChange={handleVolumeChange}
              className="w-20 h-1 accent-primary cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* FAB 主按钮 - 低调风格 */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50
                   text-muted-foreground hover:text-foreground hover:bg-card
                   flex items-center justify-center text-lg shadow-sm
                   transition-all duration-200
                   ${open ? 'rotate-45 bg-card text-foreground' : ''}`}
      >
        +
      </button>
    </div>
  )
}
