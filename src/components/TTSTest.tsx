import { useState } from 'react'
import { speak, stopSpeaking } from '../services/tts'

export function TTSTest() {
  const [collapsed, setCollapsed] = useState(true)
  const [text, setText] = useState('你好，我是豆包语音助手，很高兴认识你。')
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSpeak = async () => {
    if (!text.trim()) return

    setStatus('loading')
    setError('')

    try {
      await speak(text)
      setStatus('idle')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : '未知错误')
    }
  }

  const handleStop = () => {
    stopSpeaking()
    setStatus('idle')
  }

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-xl z-50">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-between"
      >
        <span>TTS 测试</span>
        <span className="text-xs">{collapsed ? '▲' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 pt-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 bg-muted border-none rounded-lg text-sm mb-2 h-16 resize-none text-foreground placeholder:text-muted-foreground"
            style={{ width: '240px' }}
            placeholder="输入测试文本..."
          />

          <div className="flex gap-2">
            <button
              onClick={handleSpeak}
              disabled={status === 'loading' || status === 'playing'}
              className="flex-1 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? '加载中...' : '播放'}
            </button>
            <button
              onClick={handleStop}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm transition-colors"
            >
              停止
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-destructive break-all">{error}</p>
          )}

          <p className="mt-1.5 text-xs text-muted-foreground">
            状态: {status}
          </p>
        </div>
      )}
    </div>
  )
}
