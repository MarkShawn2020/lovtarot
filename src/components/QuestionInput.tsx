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
        <label className="block text-center text-[var(--color-muted)] mb-4">
          静下心来，想一个你想探索的问题
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 bg-[var(--color-card)] text-[var(--color-text)]
                     placeholder-[var(--color-muted)] rounded-lg border border-[var(--color-primary)]
                     focus:border-[var(--color-accent)] focus:outline-none focus:ring-1
                     focus:ring-[var(--color-accent)] resize-none transition-colors"
        />
      </div>

      <div className="text-center">
        <button
          type="submit"
          disabled={!question.trim()}
          className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-medium rounded-lg transition-colors duration-300
                     shadow-lg shadow-[var(--color-primary)]/20"
        >
          开始抽牌
        </button>
      </div>

      <p className="text-center text-[var(--color-muted)] text-sm mt-6">
        将为你抽取三张牌，分别代表过去、现在和未来的启示
      </p>
    </form>
  )
}
