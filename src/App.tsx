import { useState } from 'react'
import type { TarotCard } from './data/tarot'
import { drawCards } from './data/tarot'
import { CardDisplay } from './components/CardDisplay'
import { QuestionInput } from './components/QuestionInput'
import { ReadingResult } from './components/ReadingResult'
import { TTSTest } from './components/TTSTest'
import './index.css'

type AppState = 'input' | 'drawing' | 'reading'

function App() {
  const [state, setState] = useState<AppState>('input')
  const [question, setQuestion] = useState('')
  const [cards, setCards] = useState<TarotCard[]>([])

  const handleSubmit = (q: string) => {
    setQuestion(q)
    setState('drawing')

    // 模拟抽牌过程
    setTimeout(() => {
      setCards(drawCards(3))
      setState('reading')
    }, 1500)
  }

  const handleReset = () => {
    setState('input')
    setQuestion('')
    setCards([])
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* 标题 */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2 font-serif">
          心灵塔罗
        </h1>
        <p className="text-muted-foreground">
          倾听内心的声音，找到属于你的指引
        </p>
      </header>

      {/* 主内容区 */}
      <main className="w-full max-w-4xl">
        {state === 'input' && (
          <QuestionInput onSubmit={handleSubmit} />
        )}

        {state === 'drawing' && (
          <div className="text-center py-20">
            <div className="inline-block animate-pulse">
              <div className="w-24 h-36 bg-card rounded-xl border-2 border-primary mx-auto" />
            </div>
            <p className="mt-6 text-muted-foreground">正在洗牌中...</p>
          </div>
        )}

        {state === 'reading' && (
          <>
            <div className="mb-8">
              <p className="text-center text-muted-foreground mb-4">你的问题</p>
              <p className="text-center text-xl text-foreground">"{question}"</p>
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

      {/* 页脚 */}
      <footer className="mt-auto pt-8 text-center text-muted-foreground text-sm">
        <p>塔罗牌仅供娱乐和自我探索，不构成任何专业建议</p>
      </footer>

      {/* TTS 测试组件 - 开发时使用 */}
      <TTSTest />
    </div>
  )
}

export default App
