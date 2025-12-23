import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMySessions, type Session } from '../services/session'
import { getMyProfile, saveProfile, uploadAvatarBlob, type UserProfile } from '../services/profile'
import { useState, useEffect, useRef } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
] as const

const AGE_OPTIONS = [
  { value: '18-25', label: '18-25岁' },
  { value: '26-35', label: '26-35岁' },
  { value: '36-45', label: '36-45岁' },
  { value: '46+', label: '46岁以上' }
] as const

const RELATIONSHIP_OPTIONS = [
  { value: 'single', label: '单身' },
  { value: 'dating', label: '恋爱中' },
  { value: 'married', label: '已婚' },
  { value: 'complicated', label: '复杂' }
] as const

const OCCUPATION_OPTIONS = [
  { value: 'student', label: '学生' },
  { value: 'employed', label: '职场人' },
  { value: 'freelance', label: '自由职业' },
  { value: 'other', label: '其他' }
] as const

const FOCUS_OPTIONS = [
  { value: 'love', label: '感情' },
  { value: 'career', label: '事业' },
  { value: 'health', label: '健康' },
  { value: 'finance', label: '财务' },
  { value: 'relationship', label: '人际' },
  { value: 'growth', label: '成长' }
] as const

interface ChipSelectProps<T extends string> {
  options: readonly { value: T; label: string }[]
  value: T | null
  onChange: (v: T | null) => void
}

function ChipSelect<T extends string>({ options, value, onChange }: ChipSelectProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface MultiChipSelectProps {
  options: readonly { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}

function MultiChipSelect({ options, value, onChange }: MultiChipSelectProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v))
    } else {
      onChange([...value, v])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            value.includes(opt.value)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function ProfilePage() {
  const { user, signOut, isLoading } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 })
  const [profileOpen, setProfileOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Profile form state
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<UserProfile['gender']>(null)
  const [ageRange, setAgeRange] = useState<UserProfile['ageRange']>(null)
  const [relationshipStatus, setRelationshipStatus] = useState<UserProfile['relationshipStatus']>(null)
  const [occupation, setOccupation] = useState<UserProfile['occupation']>(null)
  const [currentFocus, setCurrentFocus] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cropper states
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    if (!user) return
    getMySessions().then(list => {
      setSessions(list.slice(0, 5))
      const now = new Date()
      const thisMonth = list.filter(s => {
        const d = new Date(s.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length
      setStats({ total: list.length, thisMonth })
    })

    getMyProfile().then(profile => {
      if (profile) {
        setNickname(profile.nickname || '')
        setGender(profile.gender)
        setAgeRange(profile.ageRange)
        setRelationshipStatus(profile.relationshipStatus)
        setOccupation(profile.occupation)
        setCurrentFocus(profile.currentFocus)
        setDescription(profile.description || '')
        setAvatarUrl(profile.avatarUrl)
      }
    })
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    await saveProfile({
      nickname: nickname || null,
      gender,
      ageRange,
      relationshipStatus,
      occupation,
      currentFocus,
      description: description || null,
      avatarUrl
    })
    setSaving(false)
    setProfileOpen(false)
  }

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const handleCropCancel = () => {
    setSelectedImage(null)
    setCroppedAreaPixels(null)
  }

  const handleCropUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return

    setUploading(true)
    try {
      const blob = await getCroppedImage(selectedImage, croppedAreaPixels)
      if (blob) {
        const url = await uploadAvatarBlob(blob)
        if (url) setAvatarUrl(url)
      }
      setSelectedImage(null)
      setCroppedAreaPixels(null)
    } catch (err) {
      console.error('Crop upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  // 裁剪图片
  async function getCroppedImage(imageSrc: string, crop: Area): Promise<Blob | null> {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = reject
      image.src = imageSrc
    })

    const canvas = document.createElement('canvas')
    const size = 256
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // 圆形裁剪
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(
      image,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, size, size
    )

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png')
    })
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-serif text-foreground mb-2">登录后查看个人中心</h2>
        <p className="text-muted-foreground text-sm mb-6">登录后可同步占卜记录到云端</p>
        <Link
          to="/auth?redirect=/profile"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm shadow-lg shadow-primary/20"
        >
          立即登录
        </Link>
      </div>
    )
  }

  const displayName = nickname || user.email?.split('@')[0] || 'U'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelectFile}
        className="hidden"
      />

      {/* 裁剪弹窗 */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex-1 relative">
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="p-4 bg-card space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-8">缩放</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCropCancel}
                disabled={uploading}
                className="flex-1 py-2.5 text-sm border border-border rounded-xl text-muted-foreground"
              >
                取消
              </button>
              <button
                onClick={handleCropUpload}
                disabled={uploading || !croppedAreaPixels}
                className="flex-1 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
              >
                {uploading ? '上传中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用户信息卡片 */}
      <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* 头像 - 可点击上传 */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="relative w-16 h-16 rounded-full cursor-pointer group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="头像"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-medium">
                {initial}
              </div>
            )}
            {/* 悬浮遮罩 */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <span className="text-white text-xs">上传中...</span>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium truncate">
              {nickname || user.email}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              本月 {stats.thisMonth} 次 · 共 {stats.total} 次占卜
            </p>
          </div>
        </div>

        {/* 展开/收起个人信息设置 */}
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="mt-4 w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1 transition-colors"
        >
          <span>{profileOpen ? '收起' : '完善个人信息'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 个人信息表单 */}
        {profileOpen && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
            <p className="text-xs text-muted-foreground">
              完善信息让解读更贴合你的情况
            </p>

            {/* 昵称 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">称呼</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="你希望怎么称呼你？"
                className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* 性别 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">性别（可选）</label>
              <ChipSelect options={GENDER_OPTIONS} value={gender} onChange={setGender} />
            </div>

            {/* 年龄段 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">年龄段（可选）</label>
              <ChipSelect options={AGE_OPTIONS} value={ageRange} onChange={setAgeRange} />
            </div>

            {/* 感情状态 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">感情状态（可选）</label>
              <ChipSelect options={RELATIONSHIP_OPTIONS} value={relationshipStatus} onChange={setRelationshipStatus} />
            </div>

            {/* 职业 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">职业（可选）</label>
              <ChipSelect options={OCCUPATION_OPTIONS} value={occupation} onChange={setOccupation} />
            </div>

            {/* 当前关注 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">最近关注（可多选）</label>
              <MultiChipSelect options={FOCUS_OPTIONS} value={currentFocus} onChange={setCurrentFocus} />
            </div>

            {/* 个人描述 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">个人描述（可选）</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="可以写写你的性格、近况、困扰...帮助塔罗师更好地理解你"
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:border-primary/50 resize-none"
              />
              <p className="text-xs text-muted-foreground/60 mt-1 text-right">{description.length}/200</p>
            </div>

            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>

      {/* 最近占卜 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">最近占卜</h3>
        <Link to="/history" className="text-xs text-primary hover:text-primary/80">
          查看全部 →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl">
          <p className="text-muted-foreground text-sm mb-4">暂无占卜记录</p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            开始占卜
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <Link
              key={session.id}
              to={`/s/${session.id}`}
              className="block bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 hover:border-primary/50 transition-all"
            >
              <p className="text-foreground text-sm font-medium truncate">
                {session.question}
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                {session.cards.map(c => c.name).join(' · ')}
              </p>
              <p className="text-muted-foreground/50 text-xs mt-1">
                {formatDate(session.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* 退出登录 - 放在底部，需确认 */}
      <button
        onClick={() => {
          if (confirm('确定要退出登录吗？')) {
            signOut()
          }
        }}
        className="mt-8 w-full py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        退出登录
      </button>
    </div>
  )
}
