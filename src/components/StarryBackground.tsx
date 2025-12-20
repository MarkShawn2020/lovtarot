import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  twinklePhase: number
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置 canvas 尺寸
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    // 初始化星星
    const initStars = () => {
      const starCount = Math.floor((canvas.width * canvas.height) / 8000)
      starsRef.current = []

      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          speed: Math.random() * 0.0005 + 0.0002,
          twinklePhase: Math.random() * Math.PI * 2,
        })
      }
    }

    // 绘制星星
    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制渐变背景
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      )
      gradient.addColorStop(0, 'rgba(204, 120, 92, 0.03)')
      gradient.addColorStop(0.5, 'rgba(240, 238, 230, 0.02)')
      gradient.addColorStop(1, 'rgba(249, 249, 247, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制星星
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(timestamp * star.speed + star.twinklePhase) * 0.3 + 0.7
        const currentOpacity = star.opacity * twinkle

        // 绘制星星核心
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(204, 120, 92, ${currentOpacity})`
        ctx.fill()

        // 绘制星星光晕
        const glowGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 4
        )
        glowGradient.addColorStop(0, `rgba(204, 120, 92, ${currentOpacity * 0.3})`)
        glowGradient.addColorStop(1, 'rgba(204, 120, 92, 0)')
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2)
        ctx.fillStyle = glowGradient
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animationRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  )
}
