import { useState } from 'react'

interface Props {
  onSubmit: (question: string) => void
}

const placeholders = [
  "我现在最需要关注的是什么？",
  "这段关系中我需要看见什么？",
  "如何找到内心的平静？",
  "什么在阻碍我前进？",
  "我的内心真正渴望什么？"
]

export function QuestionInput({ onSubmit }: Props) {
  const [question, setQuestion] = useState('')
  const [placeholder] = useState(
    () => placeholders[Math.floor(Math.random() * placeholders.length)]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      onSubmit(question.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg text-center mx-auto my-auto">
      {/* 标题 */}
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 font-serif">
        心灵塔罗
      </h1>
      <p className="text-muted-foreground/80 mb-8 text-sm">
        倾听内心的声音，找到属于你的指引
      </p>

      {/* 输入区 */}
      <div className="mb-5">
        <label className="block text-muted-foreground mb-3 text-sm">
          静下心来，想一个你想探索的问题
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !question) {
              e.preventDefault()
              setQuestion(placeholder)
            } else if (e.key === 'Enter' && !e.shiftKey && question.trim()) {
              e.preventDefault()
              onSubmit(question.trim())
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="w-full px-4 py-3 bg-card/80 backdrop-blur-sm text-card-foreground
                     placeholder-muted-foreground/60 rounded-xl border border-border/50
                     focus:border-primary focus:outline-none focus:ring-1
                     focus:ring-primary/50 resize-none transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={!question.trim()}
        className="px-8 py-2.5 bg-primary hover:bg-primary/90
                   disabled:opacity-40 disabled:cursor-not-allowed
                   text-primary-foreground font-medium rounded-xl transition-all duration-300
                   shadow-lg shadow-primary/20"
      >
        开始抽牌
      </button>

      <p className="text-muted-foreground/60 text-xs mt-5">
        将为你抽取三张牌 · 过去 · 现在 · 未来
      </p>
    </form>
  )
}
