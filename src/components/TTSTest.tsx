import { useState } from 'react'
import { speak, stopSpeaking } from '../services/tts'

export function TTSTest() {
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
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border w-80 z-50">
      <h3 className="font-bold mb-2">TTS 测试</h3>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded text-sm mb-2 h-20 resize-none"
        placeholder="输入测试文本..."
      />

      <div className="flex gap-2">
        <button
          onClick={handleSpeak}
          disabled={status === 'loading' || status === 'playing'}
          className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
        >
          {status === 'loading' ? '加载中...' : '播放'}
        </button>
        <button
          onClick={handleStop}
          className="px-3 py-1.5 bg-gray-500 text-white rounded text-sm"
        >
          停止
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 break-all">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-400">
        状态: {status}
      </p>
    </div>
  )
}
