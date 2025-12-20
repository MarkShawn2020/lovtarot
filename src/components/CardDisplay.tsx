import type { TarotCard } from '../data/tarot'

interface Props {
  cards: TarotCard[]
}

const positions = ['过去', '现在', '未来']

export function CardDisplay({ cards }: Props) {
  return (
    <div className="flex justify-center gap-4 md:gap-8 mb-8">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="flex flex-col items-center animate-fade-in"
          style={{ animationDelay: `${index * 200}ms` }}
        >
          {/* 位置标签 */}
          <span className="text-[var(--color-accent)] text-sm mb-2">
            {positions[index]}
          </span>

          {/* 卡片 */}
          <div className="relative group cursor-pointer">
            <div className="w-28 md:w-36 aspect-[2/3] rounded-lg overflow-hidden
                          border-2 border-[var(--color-accent)] shadow-xl
                          shadow-[var(--color-primary)]/30
                          transition-transform duration-300 hover:scale-105">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Hover 信息 */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100
                          transition-opacity duration-300 rounded-lg flex flex-col
                          items-center justify-center p-2 text-center">
              <span className="text-[var(--color-accent)] font-bold mb-1">
                {card.name}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {card.nameEn}
              </span>
            </div>
          </div>

          {/* 卡片名称 */}
          <h3 className="mt-3 text-[var(--color-text)] font-medium text-center">
            {card.name}
          </h3>

          {/* 关键词 */}
          <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-28 md:max-w-36">
            {card.keywords.slice(0, 2).map((keyword) => (
              <span
                key={keyword}
                className="text-xs px-2 py-0.5 bg-[var(--color-card)]
                         text-[var(--color-muted)] rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
