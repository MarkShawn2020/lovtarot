import { Outlet } from 'react-router-dom'
import { TTSTest } from './components/TTSTest'
import { MusicControl } from './components/MusicControl'
import { StarryBackground } from './components/StarryBackground'
import './index.css'

function App() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* 星光背景 */}
      <StarryBackground />

      {/* 主内容区 - 垂直居中 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* 标题 */}
        <header className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-bold text-primary mb-2 font-serif">
            心灵塔罗
          </h1>
          <p className="text-muted-foreground">
            倾听内心的声音，找到属于你的指引
          </p>
        </header>

        {/* 页面内容 */}
        <main className="w-full max-w-4xl relative z-10">
          <Outlet />
        </main>
      </div>

      {/* 页脚 */}
      <footer className="py-4 text-center text-muted-foreground text-sm relative z-10">
        <p>塔罗牌仅供娱乐和自我探索，不构成任何专业建议</p>
      </footer>

      {/* TTS 测试组件 - 开发时使用 */}
      <TTSTest />

      {/* 背景音乐控制 */}
      <MusicControl />
    </div>
  )
}

export default App
