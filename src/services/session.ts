import type { TarotCard } from '../data/tarot'

export interface Session {
  id: string
  question: string
  cards: TarotCard[]
  reading?: string
  reasoning?: string
  createdAt: number
}

const STORAGE_KEY = 'taluo_sessions'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function getSessions(): Session[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function getSession(id: string): Session | null {
  return getSessions().find(s => s.id === id) || null
}

export function saveSession(session: Session): void {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.unshift(session)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function createSession(question: string, cards: TarotCard[]): Session {
  const session: Session = {
    id: generateId(),
    question,
    cards,
    createdAt: Date.now()
  }
  saveSession(session)
  return session
}

export function updateReading(id: string, reading: string, reasoning?: string): void {
  const session = getSession(id)
  if (session) {
    session.reading = reading
    if (reasoning !== undefined) {
      session.reasoning = reasoning
    }
    saveSession(session)
  }
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}
