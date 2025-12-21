import { useState, type ReactNode, type ButtonHTMLAttributes } from 'react'

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
  const base = 'h-8 rounded-full border flex items-center transition-all'
  const padding = iconOnly ? 'w-8 justify-center' : 'px-3 gap-1.5 min-w-20'

  return (
    <button className={`${base} ${padding} ${variantStyles[variant]} ${className}`} {...props}>
      {icon}
      {label && <span className="text-xs font-medium">{label}</span>}
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
  const [showVolume, setShowVolume] = useState(false)

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      {children}
      {showVolume && (
        <div className="h-8 bg-secondary/90 px-3 rounded-full border border-border shadow flex items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1 accent-primary cursor-pointer"
          />
        </div>
      )}
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
