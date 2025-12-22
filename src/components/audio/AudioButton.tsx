import { type ReactNode, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon: ReactNode
  label?: string
  iconOnly?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary',
  secondary: 'bg-secondary/80 hover:bg-secondary border-border text-muted-foreground shadow-sm',
}

export function AudioButton({ variant = 'primary', icon, label, iconOnly, className = '', ...props }: ButtonProps) {
  // 移动端适配：最小触摸目标 44px
  const base = 'h-10 sm:h-8 rounded-full border flex items-center transition-all active:scale-95'
  const padding = iconOnly ? 'w-10 sm:w-8 justify-center' : 'px-4 sm:px-3 gap-2 sm:gap-1.5 min-w-[5rem]'

  return (
    <button className={`${base} ${padding} ${variantStyles[variant]} ${className}`} {...props}>
      {icon}
      {label && <span className="text-sm sm:text-xs font-medium">{label}</span>}
    </button>
  )
}

// 带音量控制的按钮组
interface AudioControlGroupProps {
  children: ReactNode
  volume: number
  onVolumeChange: (volume: number) => void
}

export function AudioControlGroup({ children, volume, onVolumeChange }: AudioControlGroupProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <div className="h-12 sm:h-8 bg-secondary/90 px-4 sm:px-3 rounded-full border border-border shadow flex items-center gap-2">
        <SpeakerIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-28 sm:w-20 h-3 sm:h-1 accent-primary cursor-pointer
                     [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                     sm:[&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-primary
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    </div>
  )
}

// 常用图标
export const PlayIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)

export const PauseIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
)

export const StopIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" />
  </svg>
)

export const SpeakerIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
  </svg>
)
