import { useState, useEffect } from 'react'
import type { TarotCard } from '../data/tarot'

interface Props {
  card: TarotCard
  position: string
  delay: number
  onFlipComplete?: () => void
}

export function FlipCard({ card, position, delay, onFlipComplete }: Props) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHover, setShowHover] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(true)
      setTimeout(() => {
        onFlipComplete?.()
      }, 600)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, onFlipComplete])

  return (
    <div className="flex flex-col items-center">
      {/* 位置标签 */}
      <span
        className="text-primary text-sm mb-2 font-serif opacity-0 animate-fade-in"
        style={{ animationDelay: `${delay + 400}ms`, animationFillMode: 'forwards' }}
      >
        {position}
      </span>

      {/* 3D 翻转卡片容器 */}
      <div
        className="relative w-28 md:w-36 aspect-[2/3] cursor-pointer group"
        style={{ perspective: '1000px' }}
        onMouseEnter={() => isFlipped && setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* 卡片背面 */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden border-2 border-primary/50 shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardBack />
          </div>

          {/* 卡片正面 */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden border-2 border-border shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover"
            />

            {/* Hover 信息遮罩 */}
            <div
              className={`absolute inset-0 bg-foreground/80 flex flex-col items-center justify-center
                         p-2 text-center transition-opacity duration-300
                         ${showHover ? 'opacity-100' : 'opacity-0'}`}
            >
              <span className="text-primary-foreground font-bold mb-1 font-serif">
                {card.name}
              </span>
              <span className="text-xs text-primary-foreground/70">
                {card.nameEn}
              </span>
            </div>
          </div>
        </div>

        {/* 翻转时的光效 */}
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300
                     ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
          style={{
            background: 'radial-gradient(circle at center, rgba(204, 120, 92, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* 卡片名称 - 翻转后渐显 */}
      <h3
        className="mt-3 text-foreground font-medium text-center font-serif opacity-0"
        style={{
          animation: isFlipped ? 'fade-in 0.6s ease-out forwards' : 'none',
          animationDelay: '200ms',
        }}
      >
        {card.name}
      </h3>

      {/* 关键词 */}
      <div
        className="flex flex-wrap justify-center gap-1 mt-1 max-w-28 md:max-w-36 opacity-0"
        style={{
          animation: isFlipped ? 'fade-in 0.6s ease-out forwards' : 'none',
          animationDelay: '400ms',
        }}
      >
        {card.keywords.slice(0, 2).map((keyword) => (
          <span
            key={keyword}
            className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  )
}

/** 塔罗牌背面设计 */
function CardBack() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center relative overflow-hidden">
      {/* 装饰图案 - 神秘几何 */}
      <div className="absolute inset-4 border border-primary-foreground/30 rounded-lg" />
      <div className="absolute inset-6 border border-primary-foreground/20 rounded-md" />

      {/* 中心太阳/月亮图案 */}
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        {/* 外环光芒 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-0.5 h-8 md:h-10 bg-primary-foreground/40 origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
            }}
          />
        ))}

        {/* 内环 */}
        <div className="absolute inset-2 border-2 border-primary-foreground/50 rounded-full" />

        {/* 核心圆 */}
        <div className="absolute inset-4 bg-primary-foreground/20 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-primary-foreground/60 rounded-full" />
        </div>
      </div>

      {/* 四角装饰 */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-primary-foreground/40" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-primary-foreground/40" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-primary-foreground/40" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-primary-foreground/40" />

      {/* 微光动画层 */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-transparent via-primary-foreground/5 to-transparent animate-pulse"
        style={{ animationDuration: '3s' }}
      />
    </div>
  )
}
