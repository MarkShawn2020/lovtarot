import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuestionInput } from '../components/QuestionInput'
import { ShufflingAnimation } from '../components/ShufflingAnimation'
import { FAB, type MenuItem } from '../components/FAB'
import { drawCards } from '../data/tarot'
import { createSession } from '../services/session'

export function HomePage() {
  const navigate = useNavigate()
  const [isDrawing, setIsDrawing] = useState(false)

  const handleSubmit = (question: string) => {
    setIsDrawing(true)

    // 洗牌动画后抽牌并跳转
    setTimeout(() => {
      const cards = drawCards(3)
      const session = createSession(question, cards)
      navigate(`/s/${session.id}`)
    }, 2500)
  }

  const menuItems: MenuItem[] = [
    {
      icon: '📜',
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ]

  if (isDrawing) {
    return <ShufflingAnimation />
  }

  return (
    <>
      <QuestionInput onSubmit={handleSubmit} />
      <FAB items={menuItems} />
    </>
  )
}
