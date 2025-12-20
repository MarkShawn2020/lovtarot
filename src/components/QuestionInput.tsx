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
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="mb-6">
        <label className="block text-center text-muted-foreground mb-4">
          静下心来，想一个你想探索的问题
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 bg-card text-card-foreground
                     placeholder-muted-foreground rounded-xl border border-border
                     focus:border-primary focus:outline-none focus:ring-1
                     focus:ring-primary resize-none transition-colors"
        />
      </div>

      <div className="text-center">
        <button
          type="submit"
          disabled={!question.trim()}
          className="px-8 py-3 bg-primary hover:bg-primary/90
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-primary-foreground font-medium rounded-xl transition-colors duration-300"
        >
          开始抽牌
        </button>
      </div>

      <p className="text-center text-muted-foreground text-sm mt-6">
        将为你抽取三张牌，分别代表过去、现在和未来的启示
      </p>
    </form>
  )
}
