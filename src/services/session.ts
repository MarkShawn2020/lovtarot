import { supabase } from './supabase'
import type { TarotCard } from '../data/tarot'

export interface Session {
  id: string
  question: string
  cards: TarotCard[]
  reading?: string
  reasoning?: string
  thinkingSeconds?: number
  audioUrl?: string
  createdAt: number
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
}

function toSession(row: DbSession): Session {
  return {
    id: row.id,
    question: row.question,
    cards: row.cards,
    reading: row.reading ?? undefined,
    reasoning: row.reasoning ?? undefined,
    thinkingSeconds: row.thinking_seconds ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    createdAt: new Date(row.created_at).getTime()
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
  return (data as DbSession[]).map(toSession)
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
  const session = {
    id: generateId(),
    question,
    cards,
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
