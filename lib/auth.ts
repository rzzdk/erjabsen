import type { UserSession } from './types'

const SESSION_KEY = 'presensi_session'

// For demo purposes, we'll use localStorage
// In production with MySQL, use proper JWT tokens and server-side sessions

export function setSession(user: UserSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }
}

export function getSession(): UserSession | null {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem(SESSION_KEY)
    if (session) {
      try {
        return JSON.parse(session) as UserSession
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function isAdmin(): boolean {
  const session = getSession()
  return session?.role === 'admin'
}
