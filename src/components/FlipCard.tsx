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
    <div className="flex flex-col items-center md:h-full md:min-h-0">
      {/* 位置标签 */}
      <span
        className="text-primary text-xs md:text-sm font-serif opacity-0 mb-1 md:mb-3 shrink-0"
        style={{ animation: `fade-in 0.5s ease-out ${delay + 400}ms forwards` }}
      >
        {position}
      </span>

      {/* 卡片容器 - 窄屏宽度驱动，宽屏高度驱动 */}
      <div
        className="relative cursor-pointer group w-full md:w-auto md:h-[calc(100%-80px)] aspect-[2/3]"
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
              className="absolute inset-0 overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <CardBack />
              {/* 翻转前的光效 */}
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300
                           ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
                style={{
                  background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                }}
              />
            </div>

            {/* 卡片正面 */}
            <div
              className="absolute inset-0 overflow-hidden bg-background"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-contain"
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
      </div>

      {/* 卡片名称 */}
      <h3
        className="mt-1 md:mt-2 text-foreground text-xs md:text-sm font-medium font-serif opacity-0 text-center shrink-0"
        style={{
          animation: isFlipped ? 'fade-in 0.6s ease-out 200ms forwards' : 'none',
        }}
      >
        {card.name}
      </h3>
      <p
        className="text-muted-foreground/60 text-[10px] md:text-xs opacity-0 text-center shrink-0 hidden md:block"
        style={{
          animation: isFlipped ? 'fade-in 0.6s ease-out 400ms forwards' : 'none',
        }}
      >
        {card.keywords.slice(0, 2).join(' · ')}
      </p>
    </div>
  )
}

/** 塔罗牌背面设计 */
function CardBack() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center relative overflow-hidden">
      {/* 装饰图案 - 神秘几何 */}
      <div className="absolute inset-3 border border-primary-foreground/30 rounded-lg" />
      <div className="absolute inset-5 border border-primary-foreground/20 rounded-md" />

      {/* 中心太阳/月亮图案 */}
      <div className="relative w-12 h-12">
        {/* 外环光芒 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-primary-foreground/40 origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
            }}
          />
        ))}

        {/* 内环 */}
        <div className="absolute inset-1.5 border-2 border-primary-foreground/50 rounded-full" />

        {/* 核心圆 */}
        <div className="absolute inset-3 bg-primary-foreground/20 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-primary-foreground/60 rounded-full" />
        </div>
      </div>

      {/* 四角装饰 */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-primary-foreground/40" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-primary-foreground/40" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-primary-foreground/40" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-primary-foreground/40" />

      {/* 微光动画层 */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-transparent via-primary-foreground/5 to-transparent"
        style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      />
    </div>
  )
}
