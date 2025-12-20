import { useState } from 'react'
import type { TarotCard } from './data/tarot'
import { drawCards } from './data/tarot'
import { CardDisplay } from './components/CardDisplay'
import { QuestionInput } from './components/QuestionInput'
import { ReadingResult } from './components/ReadingResult'
import { TTSTest } from './components/TTSTest'
import { MusicControl } from './components/MusicControl'
import { StarryBackground } from './components/StarryBackground'
import { ShufflingAnimation } from './components/ShufflingAnimation'
import './index.css'

type AppState = 'input' | 'drawing' | 'reading'

function App() {
  const [state, setState] = useState<AppState>('input')
  const [question, setQuestion] = useState('')
  const [cards, setCards] = useState<TarotCard[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleSubmit = (q: string) => {
    setQuestion(q)
    setIsTransitioning(true)

    // 先淡出当前内容
    setTimeout(() => {
      setState('drawing')
      setIsTransitioning(false)
    }, 300)

    // 洗牌动画后抽牌
    setTimeout(() => {
      setCards(drawCards(3))
      setIsTransitioning(true)
      setTimeout(() => {
        setState('reading')
        setIsTransitioning(false)
      }, 300)
    }, 2500)
  }

  const handleReset = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setState('input')
      setQuestion('')
      setCards([])
      setIsTransitioning(false)
    }, 300)
  }

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

        {/* 主内容区 - 带过渡效果 */}
        <main
          className={`w-full max-w-4xl relative z-10 transition-opacity duration-300
                     ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          {state === 'input' && (
            <QuestionInput onSubmit={handleSubmit} />
          )}

          {state === 'drawing' && (
            <ShufflingAnimation />
          )}

          {state === 'reading' && (
            <>
              <div className="mb-8">
                <p className="text-center text-muted-foreground mb-4">你的问题</p>
                <p className="text-center text-xl text-foreground font-serif">"{question}"</p>
              </div>

              <CardDisplay cards={cards} />

              <ReadingResult question={question} cards={cards} />

              <div className="text-center mt-8">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-secondary hover:bg-primary hover:text-primary-foreground
                           text-secondary-foreground rounded-xl transition-colors duration-300"
                >
                  再问一个问题
                </button>
              </div>
            </>
          )}
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
