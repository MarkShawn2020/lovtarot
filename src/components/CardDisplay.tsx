import type { TarotCard } from '../data/tarot'
import { FlipCard } from './FlipCard'

interface Props {
  cards: TarotCard[]
}

const positions = ['过去', '现在', '未来']

export function CardDisplay({ cards }: Props) {
  return (
    <div className="h-full flex justify-center gap-6">
      {cards.map((card, index) => (
        <FlipCard
          key={card.id}
          card={card}
          position={positions[index]}
          delay={index * 400 + 200}
        />
      ))}
    </div>
  )
}
