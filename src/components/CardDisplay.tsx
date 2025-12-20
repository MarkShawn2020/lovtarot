import type { TarotCard } from '../data/tarot'
import { FlipCard } from './FlipCard'

interface Props {
  cards: TarotCard[]
}

const positions = ['过去', '现在', '未来']

export function CardDisplay({ cards }: Props) {
  return (
    <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
      <div className="flex gap-3">
        {cards.map((card, index) => (
          <div key={card.id} className="flex-1">
            <FlipCard
              card={card}
              position={positions[index]}
              delay={index * 400 + 200}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
