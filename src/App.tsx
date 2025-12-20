import { Outlet } from 'react-router-dom'
import { StarryBackground } from './components/StarryBackground'
import './index.css'

function App() {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* 星光背景 */}
      <StarryBackground />

      {/* 主内容区 - 16:9 画幅居中 */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 min-h-0">
        {/* 页面内容 - 接近 16:9 */}
        <main className="w-full max-w-5xl h-full max-h-[56vw] relative z-10 flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* 底部渐隐提示 */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
        <p className="text-muted-foreground/50 text-xs">
          塔罗牌仅供娱乐和自我探索
        </p>
      </div>
    </div>
  )
}

export default App
