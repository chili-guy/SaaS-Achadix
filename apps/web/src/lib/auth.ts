'use client'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('shopbot_token')
}

export function setToken(token: string) {
  localStorage.setItem('shopbot_token', token)
}

export function removeToken() {
  localStorage.removeItem('shopbot_token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
