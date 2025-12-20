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
          <span className="text-primary text-sm mb-2 font-serif">
            {positions[index]}
          </span>

          {/* 卡片 */}
          <div className="relative group cursor-pointer">
            <div className="w-28 md:w-36 aspect-[2/3] rounded-xl overflow-hidden
                          border-2 border-border shadow-lg
                          transition-transform duration-300 hover:scale-105">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Hover 信息 */}
            <div className="absolute inset-0 bg-foreground/80 opacity-0 group-hover:opacity-100
                          transition-opacity duration-300 rounded-xl flex flex-col
                          items-center justify-center p-2 text-center">
              <span className="text-primary-foreground font-bold mb-1 font-serif">
                {card.name}
              </span>
              <span className="text-xs text-primary-foreground/70">
                {card.nameEn}
              </span>
            </div>
          </div>

          {/* 卡片名称 */}
          <h3 className="mt-3 text-foreground font-medium text-center font-serif">
            {card.name}
          </h3>

          {/* 关键词 */}
          <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-28 md:max-w-36">
            {card.keywords.slice(0, 2).map((keyword) => (
              <span
                key={keyword}
                className="text-xs px-2 py-0.5 bg-secondary
                         text-muted-foreground rounded-full"
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
