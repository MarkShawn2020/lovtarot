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
    <div className="text-center py-16">
      <div className="relative h-48 flex items-center justify-center">
        {/* 牌堆动画 */}
        <div className="relative w-32 h-44">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-24 h-36 rounded-xl overflow-hidden border-2 border-primary/50 shadow-lg"
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
          className={`absolute w-40 h-40 rounded-full transition-opacity duration-500
                     ${phase === 'shuffle' ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'radial-gradient(circle, rgba(204, 120, 92, 0.2) 0%, transparent 70%)',
          }}
        />
      </div>

      <p className="text-muted-foreground mt-4 animate-pulse font-serif">
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
    const angle = (index - 2) * 15
    const offsetX = (index - 2) * 20
    return {
      transform: `${baseTransform} translateX(${offsetX}px) rotate(${angle}deg)`,
      transition: 'all 0.4s ease-out',
    }
  }

  if (phase === 'shuffle') {
    // 洗牌动画 - 牌飞来飞去
    const shuffleAngle = Math.sin(index * 1.5) * 30
    const offsetY = Math.cos(index * 2) * 20
    return {
      transform: `${baseTransform} translateY(${offsetY}px) rotate(${shuffleAngle}deg)`,
      transition: 'all 0.3s ease-in-out',
      animation: `shuffle-${index % 2 === 0 ? 'left' : 'right'} 0.6s ease-in-out infinite`,
    }
  }

  // spread - 展开准备抽取
  const spreadAngle = (index - 2) * 8
  const spreadOffset = (index - 2) * 8
  return {
    transform: `${baseTransform} translateX(${spreadOffset}px) rotate(${spreadAngle}deg)`,
    transition: 'all 0.5s ease-out',
  }
}

function CardBackMini() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center relative overflow-hidden">
      {/* 简化的背面图案 */}
      <div className="absolute inset-2 border border-primary-foreground/30 rounded-md" />

      <div className="relative w-10 h-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-0.5 h-5 bg-primary-foreground/40 origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
            }}
          />
        ))}
        <div className="absolute inset-2 bg-primary-foreground/20 rounded-full" />
      </div>

      {/* 微光效果 */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-transparent via-primary-foreground/5 to-transparent"
        style={{ animation: 'pulse 2s infinite' }}
      />
    </div>
  )
}
