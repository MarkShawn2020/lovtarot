import type { TarotCard } from '../data/tarot'
import { FlipCard } from './FlipCard'

interface Props {
  cards: TarotCard[]
}

const positions = ['过去', '现在', '未来']

export function CardDisplay({ cards }: Props) {
  return (
    <div className="flex justify-center gap-2 md:gap-6 md:h-full md:min-h-0">
      {cards.map((card, index) => (
        <div key={card.id} className="flex-1 min-w-0 md:flex-none">
          <FlipCard
            card={card}
            position={positions[index]}
            delay={index * 400 + 200}
          />
        </div>
      ))}
    </div>
  )
}
