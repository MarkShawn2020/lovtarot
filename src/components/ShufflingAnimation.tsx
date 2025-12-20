import { useEffect, useState } from 'react'

export function ShufflingAnimation() {
  const [phase, setPhase] = useState<'gather' | 'shuffle' | 'spread'>('gather')

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('shuffle'), 400)
    const timer2 = setTimeout(() => setPhase('spread'), 1600)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="text-center flex flex-col items-center justify-center mx-auto my-auto">
      {/* 标题 */}
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-serif">
        心灵塔罗
      </h1>

      <div className="relative h-36 md:h-40 flex items-center justify-center">
        {/* 牌堆动画 */}
        <div className="relative w-24 h-32 md:w-28 md:h-36">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-16 h-24 md:w-20 md:h-28 rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                ...getCardStyle(i, phase),
              }}
            >
              <CardBackMini />
            </div>
          ))}
        </div>

        {/* 光效 */}
        <div
          className={`absolute w-32 h-32 rounded-full transition-opacity duration-500
                     ${phase === 'shuffle' ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'radial-gradient(circle, rgba(204, 120, 92, 0.2) 0%, transparent 70%)',
          }}
        />
      </div>

      <p className="text-muted-foreground/80 mt-4 text-sm animate-pulse font-serif">
        {phase === 'gather' && '正在聚拢牌堆...'}
        {phase === 'shuffle' && '洗牌中...'}
        {phase === 'spread' && '请静心等待...'}
      </p>
    </div>
  )
}

function getCardStyle(index: number, phase: 'gather' | 'shuffle' | 'spread') {
  const baseTransform = 'translate(-50%, -50%)'

  if (phase === 'gather') {
    // 初始散开状态
    const angle = (index - 2) * 12
    const offsetX = (index - 2) * 14
    return {
      transform: `${baseTransform} translateX(${offsetX}px) rotate(${angle}deg)`,
      transition: 'all 0.4s ease-out',
    }
  }

  if (phase === 'shuffle') {
    // 洗牌动画 - 牌飞来飞去
    const shuffleAngle = Math.sin(index * 1.5) * 25
    const offsetY = Math.cos(index * 2) * 14
    return {
      transform: `${baseTransform} translateY(${offsetY}px) rotate(${shuffleAngle}deg)`,
      transition: 'all 0.3s ease-in-out',
      animation: `shuffle-${index % 2 === 0 ? 'left' : 'right'} 0.6s ease-in-out infinite`,
    }
  }

  // spread - 展开准备抽取
  const spreadAngle = (index - 2) * 6
  const spreadOffset = (index - 2) * 6
  return {
    transform: `${baseTransform} translateX(${spreadOffset}px) rotate(${spreadAngle}deg)`,
    transition: 'all 0.5s ease-out',
  }
}

function CardBackMini() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center relative overflow-hidden">
      {/* 简化的背面图案 */}
      <div className="absolute inset-1.5 border border-primary-foreground/30 rounded-md" />

      <div className="relative w-7 h-7 md:w-8 md:h-8">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-0.5 h-3.5 md:h-4 bg-primary-foreground/40 origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
            }}
          />
        ))}
        <div className="absolute inset-1.5 bg-primary-foreground/20 rounded-full" />
      </div>

      {/* 微光效果 */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-transparent via-primary-foreground/5 to-transparent"
        style={{ animation: 'pulse 2s infinite' }}
      />
    </div>
  )
}
