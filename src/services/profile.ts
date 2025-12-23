import { supabase } from './supabase'

export interface UserProfile {
  id: string
  nickname: string | null
  gender: 'male' | 'female' | 'other' | null
  ageRange: '18-25' | '26-35' | '36-45' | '46+' | null
  relationshipStatus: 'single' | 'dating' | 'married' | 'complicated' | null
  occupation: 'student' | 'employed' | 'freelance' | 'other' | null
  currentFocus: string[]
  description: string | null
  avatarUrl: string | null
}

interface DbProfile {
  id: string
  nickname: string | null
  gender: string | null
  age_range: string | null
  relationship_status: string | null
  occupation: string | null
  current_focus: string[] | null
  description: string | null
  avatar_url: string | null
}

const AVATAR_BUCKET = 'avatars'

function toProfile(row: DbProfile): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    gender: row.gender as UserProfile['gender'],
    ageRange: row.age_range as UserProfile['ageRange'],
    relationshipStatus: row.relationship_status as UserProfile['relationshipStatus'],
    occupation: row.occupation as UserProfile['occupation'],
    currentFocus: row.current_focus ?? [],
    description: row.description,
    avatarUrl: row.avatar_url
  }
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Failed to fetch profile:', error)
    return null
  }
  return toProfile(data as DbProfile)
}

export async function saveProfile(profile: Partial<Omit<UserProfile, 'id'>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const dbProfile = {
    id: user.id,
    nickname: profile.nickname,
    gender: profile.gender,
    age_range: profile.ageRange,
    relationship_status: profile.relationshipStatus,
    occupation: profile.occupation,
    current_focus: profile.currentFocus,
    description: profile.description,
    avatar_url: profile.avatarUrl
  }

  const { error } = await supabase
    .from('user_profiles')
    .upsert(dbProfile, { onConflict: 'id' })

  if (error) {
    console.error('Failed to save profile:', error)
    return false
  }
  return true
}

// 上传头像 Blob 并返回 URL
export async function uploadAvatarBlob(blob: Blob): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const filePath = `${user.id}/avatar.png`

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, blob, {
      upsert: true,
      contentType: 'image/png'
    })

  if (error) {
    console.error('Failed to upload avatar:', error)
    return null
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
  return `${data.publicUrl}?t=${Date.now()}`
}

// 生成用于 AI prompt 的用户背景描述
export function buildUserContext(profile: UserProfile | null, nickname?: string): string {
  if (!profile && !nickname) return ''

  const name = profile?.nickname || nickname || '朋友'
  const parts: string[] = [`称呼：${name}`]

  if (profile?.gender) {
    const genderMap = { male: '男', female: '女', other: '其他' }
    parts.push(`性别：${genderMap[profile.gender]}`)
  }

  if (profile?.ageRange) {
    const ageMap = { '18-25': '18-25岁', '26-35': '26-35岁', '36-45': '36-45岁', '46+': '46岁以上' }
    parts.push(`年龄段：${ageMap[profile.ageRange]}`)
  }

  if (profile?.relationshipStatus) {
    const statusMap = { single: '单身', dating: '恋爱中', married: '已婚', complicated: '复杂' }
    parts.push(`感情状态：${statusMap[profile.relationshipStatus]}`)
  }

  if (profile?.occupation) {
    const occMap = { student: '学生', employed: '职场人', freelance: '自由职业', other: '其他' }
    parts.push(`职业：${occMap[profile.occupation]}`)
  }

  if (profile?.currentFocus?.length) {
    parts.push(`当前关注：${profile.currentFocus.join('、')}`)
  }

  if (profile?.description) {
    parts.push(`个人描述：${profile.description}`)
  }

  return parts.join('\n')
}
