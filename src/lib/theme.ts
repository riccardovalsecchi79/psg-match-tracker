import { useState, useEffect } from 'react'

export type TemaTipo = 'A' | 'B' | 'home'

export interface Tema {
  background: string
  backgroundCard: string
  backgroundHeader: string
  textPrimary: string          // Testo su sfondo scuro
  textOnCard: string           // Testo su card (chiaro per B, scuro per A)
  textSecondary: string        // Testo secondario su sfondo scuro
  textSecondaryOnCard: string  // Testo secondario su card
  accent1: string              // Arancio
  accent2: string              // Giallo (A) / Nero (B) / Blu (home)
  accent3: string              // Giallo chiaro (A) / Bianco (B) / Arancio (home)
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

export function getTema(): Tema {
  if (typeof window === 'undefined') return TEMI.home
  
  const nomeSquadra = localStorage.getItem('squadra_selezionata_nome') || ''
  
  if (nomeSquadra.trim().endsWith('A')) {
    return TEMI.A
  }
  
  if (nomeSquadra.trim().endsWith('B')) {
    return TEMI.B
  }
  
  return TEMI.home
}

// TEMA A: Nero + Arancio + Giallo (card scure, testo bianco)
const temaA: Tema = {
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
  nomeTema: 'A'
}

// TEMA B: Blu + Arancio + Bianco + Nero (card bianche, testo nero)
const temaB: Tema = {
  background: '#1e3a8a',
  backgroundCard: '#ffffff',
  backgroundHeader: '#1e40af',
  textPrimary: '#ffffff',
  textOnCard: '#0f172a',           // NERO su card bianca
  textSecondary: '#bfdbfe',
  textSecondaryOnCard: '#64748b',  // GRIGIO su card bianca
  accent1: '#f97316',
  accent2: '#000000',
  accent3: '#ffffff',
  borderCard: 'rgba(255, 255, 255, 0.2)',
  buttonPrimary: '#f97316',
  buttonPrimaryText: '#ffffff',
  buttonSecondary: '#000000',
  buttonSecondaryText: '#ffffff',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#fbbf24',
  info: '#60a5fa',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  gradientHeader: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #f97316 100%)',
  nomeTema: 'B'
}

// TEMA HOME: Nero + Arancio + Blu
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
  nomeTema: 'Home'
}

export const TEMI = {
  A: temaA,
  B: temaB,
  home: temaHome
}

export function useTema(): Tema {
  const [tema, setTema] = useState<Tema>(TEMI.home)
  
  useEffect(() => {
    setTema(getTema())
  }, [])
  
  return tema
}
