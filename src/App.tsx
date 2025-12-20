import { Outlet } from 'react-router-dom'
import { StarryBackground } from './components/StarryBackground'
import './index.css'

function App() {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* 星光背景 */}
      <StarryBackground />

      {/* 主内容区 - 16:9 画幅居中 */}
      <div className="flex-1 flex flex-col items-center px-4 py-4 md:justify-center md:px-6 md:py-8 min-h-0 overflow-auto md:overflow-hidden">
        {/* 页面内容 - 宽屏接近 16:9，窄屏自然流式 */}
        <main className="w-full max-w-5xl md:h-full md:max-h-[56vw] relative z-10">
          <Outlet />
        </main>

        {/* 底部提示 - 跟随内容滚动 */}
        <p className="shrink-0 py-6 text-muted-foreground/50 text-xs text-center">
          塔罗牌仅供娱乐和自我探索
        </p>
      </div>
    </div>
  )
}

export default App
