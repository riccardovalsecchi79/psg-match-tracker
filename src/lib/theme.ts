import { useState, useEffect } from 'react'

export type TemaTipo = 'team' | 'home'

export interface Tema {
  background: string
  backgroundCard: string
  backgroundHeader: string
  textPrimary: string
  textOnCard: string
  textSecondary: string
  textSecondaryOnCard: string
  accent1: string
  accent2: string
  accent3: string
  borderCard: string
  buttonPrimary: string
  buttonPrimaryText: string
  buttonSecondary: string
  buttonSecondaryText: string
  success: string
  danger: string
  warning: string
  info: string
  shadow: string
  gradientHeader: string
  nomeTema: string
}

// Rileva il tema: 'home' per la home page, 'team' per tutte le squadre
export function getTema(): Tema {
  if (typeof window === 'undefined') return TEMI.home
  
  const pathname = window.location.pathname
  
  // Home page
  if (pathname === '/' || pathname === '') {
    return TEMI.home
  }
  
  // Tutte le altre pagine usano il tema team
  return TEMI.team
}

// TEMA TEAM: Nero + Arancio + Giallo (per tutte le squadre)
const temaTeam: Tema = {
  background: '#0a0a0a',
  backgroundCard: '#1a1a1a',
  backgroundHeader: '#000000',
  textPrimary: '#ffffff',
  textOnCard: '#ffffff',
  textSecondary: '#a0a0a0',
  textSecondaryOnCard: '#a0a0a0',
  accent1: '#f97316',
  accent2: '#fbbf24',
  accent3: '#fef3c7',
  borderCard: 'rgba(249, 115, 22, 0.3)',
  buttonPrimary: '#f97316',
  buttonPrimaryText: '#000000',
  buttonSecondary: '#fbbf24',
  buttonSecondaryText: '#000000',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#fbbf24',
  info: '#3b82f6',
  shadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
  gradientHeader: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #f97316 100%)',
  nomeTema: 'team'
}

// TEMA HOME: Nero + Arancio + Blu (per la home page)
const temaHome: Tema = {
  background: '#0a0a0a',
  backgroundCard: '#141414',
  backgroundHeader: '#000000',
  textPrimary: '#ffffff',
  textOnCard: '#ffffff',
  textSecondary: '#a0a0a0',
  textSecondaryOnCard: '#a0a0a0',
  accent1: '#f97316',
  accent2: '#3b82f6',
  accent3: '#fbbf24',
  borderCard: '#262626',
  buttonPrimary: '#f97316',
  buttonPrimaryText: '#ffffff',
  buttonSecondary: '#3b82f6',
  buttonSecondaryText: '#ffffff',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#fbbf24',
  info: '#3b82f6',
  shadow: '0 4px 24px rgba(249, 115, 22, 0.25)',
  gradientHeader: 'linear-gradient(135deg, #000000 0%, #1a1a1a 40%, #f97316 100%)',
  nomeTema: 'home'
}

export const TEMI = {
  team: temaTeam,
  home: temaHome
}

export function useTema(): Tema {
  const [tema, setTema] = useState<Tema>(TEMI.home)
  
  useEffect(() => {
    setTema(getTema())
  }, [])
  
  return tema
}
