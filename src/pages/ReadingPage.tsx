import { useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { domToJpeg } from 'modern-screenshot'
import { getSession, updateReading } from '../services/session'
import { CardDisplay } from '../components/CardDisplay'
import { ReadingResult } from '../components/ReadingResult'
import { playBGM, pauseBGM, isBGMPlaying, initBGM, setVolume, getVolume } from '../services/bgm'

export function ReadingPage() {
  const { id } = useParams<{ id: string }>()
  const session = id ? getSession(id) : null

  // 语音控制
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speakToggleRef = useRef<(() => void) | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // 音乐控制
  const [musicPlaying, setMusicPlaying] = useState(() => {
    initBGM()
    return isBGMPlaying()
  })
  const [showVolume, setShowVolume] = useState(false)
  const [vol, setVol] = useState(() => getVolume())

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

  const takeScreenshot = useCallback(async () => {
    if (!contentRef.current) return

    const computedBg = getComputedStyle(document.body).backgroundColor
    const dataUrl = await domToJpeg(contentRef.current, { scale: 4, quality: 0.9, backgroundColor: computedBg })

    const link = document.createElement('a')
    link.download = `塔罗-${Date.now()}.jpg`
    link.href = dataUrl
    link.click()
  }, [])

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">未找到该占卜记录</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl"
          >
            开始新的占卜
          </Link>
        </div>
      </div>
    )
  }

  const handleReadingComplete = (reading: string) => {
    updateReading(session.id, reading)
  }

  return (
    <div className="w-full min-h-full">
      {/* 顶部导航栏 */}
      <nav className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← 新占卜
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            历史记录
          </Link>
        </div>
      </nav>

      {/* 截图区域：标题 + 卡牌 + 解读 */}
      <div ref={contentRef} className="p-4 -mx-4">
        <h1 className="text-center text-3xl font-bold text-primary font-serif leading-tight drop-shadow-sm mb-10">
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
      </div>

      {/* 底部工具栏 */}
      <div className="mt-8 flex items-center justify-center gap-2 text-sm">
        <button
          onClick={() => speakToggleRef.current?.()}
          className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-card/60 rounded-lg transition-colors"
        >
          {isSpeaking ? '⏹ 停止语音' : '🔊 语音播放'}
        </button>
        <span className="text-border">|</span>
        <button
          onClick={takeScreenshot}
          className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-card/60 rounded-lg transition-colors"
        >
          📷 保存截图
        </button>
        <span className="text-border">|</span>
        <div className="relative">
          <button
            onClick={toggleMusic}
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
            className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-card/60 rounded-lg transition-colors"
          >
            {musicPlaying ? '⏸ 暂停音乐' : '🎵 播放音乐'}
          </button>
          {showVolume && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg px-3 py-2"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
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
      </div>
    </div>
  )
}
