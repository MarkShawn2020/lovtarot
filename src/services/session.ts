import { supabase } from './supabase'
import type { TarotCard } from '../data/tarot'

export interface SessionUser {
  nickname: string | null
  avatarUrl: string | null
}

export interface Session {
  id: string
  question: string
  cards: TarotCard[]
  reading?: string
  reasoning?: string
  thinkingSeconds?: number
  audioUrl?: string
  createdAt: number
  userId?: string
  user?: SessionUser
}

interface DbSession {
  id: string
  question: string
  cards: TarotCard[]
  reading: string | null
  reasoning: string | null
  thinking_seconds: number | null
  audio_url: string | null
  created_at: string
  user_id: string | null
}

interface DbProfile {
  nickname: string | null
  avatar_url: string | null
}

function toSession(row: DbSession, profile?: DbProfile | null): Session {
  return {
    id: row.id,
    question: row.question,
    cards: row.cards,
    reading: row.reading ?? undefined,
    reasoning: row.reasoning ?? undefined,
    thinkingSeconds: row.thinking_seconds ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    userId: row.user_id ?? undefined,
    user: profile ? { nickname: profile.nickname, avatarUrl: profile.avatar_url } : undefined
  }
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('tarot_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch sessions:', error)
    return []
  }

  const sessions = data as DbSession[]

  // 批量获取用户 profiles
  const userIds = [...new Set(sessions.map(s => s.user_id).filter(Boolean))] as string[]
  let profileMap: Record<string, DbProfile> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, nickname, avatar_url')
      .in('id', userIds)

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map(p => [p.id, { nickname: p.nickname, avatar_url: p.avatar_url }])
      )
    }
  }

  return sessions.map(s => toSession(s, s.user_id ? profileMap[s.user_id] : null))
}

export async function getMySessions(): Promise<Session[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('tarot_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch my sessions:', error)
    return []
  }
  return (data as DbSession[]).map(s => toSession(s))
}

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('tarot_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch session:', error)
    return null
  }
  return toSession(data as DbSession)
}

export async function createSession(question: string, cards: TarotCard[]): Promise<Session> {
  const { data: { user } } = await supabase.auth.getUser()

  const session = {
    id: generateId(),
    question,
    cards,
    user_id: user?.id ?? null,
    created_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('tarot_sessions')
    .insert(session)

  if (error) {
    console.error('Failed to create session:', error)
  }

  return {
    id: session.id,
    question,
    cards,
    createdAt: Date.now()
  }
}

export async function updateReading(id: string, reading: string, reasoning?: string, thinkingSeconds?: number): Promise<void> {
  const updates: Record<string, unknown> = { reading }
  if (reasoning !== undefined) updates.reasoning = reasoning
  if (thinkingSeconds !== undefined) updates.thinking_seconds = thinkingSeconds

  const { error } = await supabase
    .from('tarot_sessions')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Failed to update reading:', error)
  }
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('tarot_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete session:', error)
  }
}
