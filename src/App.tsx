import { Outlet } from 'react-router-dom'
import { StarryBackground } from './components/StarryBackground'
import './index.css'

function App() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-auto">
        <main className="w-full max-w-2xl lg:max-w-4xl relative z-10">
          <Outlet />
        </main>

        <p className="shrink-0 py-6 text-muted-foreground/50 text-xs text-center">
          塔罗牌仅供娱乐和自我探索
        </p>
      </div>
    </div>
  )
}

export default App
