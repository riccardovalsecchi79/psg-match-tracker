// Sistema di temi per P.S.G. Molteno Brongio
// Squadre A: Nero + Arancio + Giallo (stile night mode)
// Squadre B: Blu + Arancio + Bianco + Nero (stile classico)
// Home: Nero + Arancio + Blu (stile professionale)

export type TemaTipo = 'A' | 'B' | 'home'

export interface Tema {
  background: string
  backgroundCard: string
  backgroundHeader: string
  textPrimary: string
  textSecondary: string
  accent1: string        // Arancio
  accent2: string        // Giallo (A) o Nero (B) o Blu (home)
  accent3: string        // Giallo chiaro (A) o Bianco (B) o Arancio (home)
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

// Rileva il tema in base al nome della squadra
export function getTema(): Tema {
  if (typeof window === 'undefined') return TEMI.home
  
  const nomeSquadra = localStorage.getItem('squadra_selezionata_nome') || ''
  
  // Squadre A: nome finisce con "A" (es. "2014 A", "2015 A")
  if (nomeSquadra.trim().endsWith('A')) {
    return TEMI.A
  }
  
  // Squadre B: nome finisce con "B"
  if (nomeSquadra.trim().endsWith('B')) {
    return TEMI.B
  }
  
  // Default: tema home
  return TEMI.home
}

// Tema A: Nero + Arancio + Giallo (stile night mode sportivo)
const temaA: Tema = {
  background: '#0a0a0a',
  backgroundCard: '#1a1a1a',
  backgroundHeader: '#000000',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  accent1: '#f97316',        // Arancio
  accent2: '#fbbf24',        // Giallo
  accent3: '#fef3c7',        // Giallo chiaro
  borderCard: '#f97316',
  buttonPrimary: '#f97316',
  buttonPrimaryText: '#ffffff',
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

// Tema B: Blu + Arancio + Bianco + Nero (stile classico)
const temaB: Tema = {
  background: '#1e3a8a',
  backgroundCard: '#ffffff',
  backgroundHeader: '#1e40af',
  textPrimary: '#ffffff',
  textSecondary: '#bfdbfe',
  accent1: '#f97316',        // Arancio
  accent2: '#000000',        // Nero
  accent3: '#ffffff',        // Bianco
  borderCard: '#3b82f6',
  buttonPrimary: '#f97316',
  buttonPrimaryText: '#ffffff',
  buttonSecondary: '#000000',
  buttonSecondaryText: '#ffffff',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#fbbf24',
  info: '#60a5fa',
  shadow: '0 4px 20px rgba(30, 58, 138, 0.4)',
  gradientHeader: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #f97316 100%)',
  nomeTema: 'B'
}

// Tema Home: Nero + Arancio + Blu (stile professionale)
const temaHome: Tema = {
  background: '#0a0a0a',
  backgroundCard: '#141414',
  backgroundHeader: '#000000',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  accent1: '#f97316',        // Arancio
  accent2: '#3b82f6',        // Blu
  accent3: '#fbbf24',        // Giallo
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

// Hook React per usare il tema nei componenti
export function useTema(): Tema {
  const [tema, setTema] = useState<Tema>(TEMI.home)
  
  useEffect(() => {
    setTema(getTema())
  }, [])
  
  return tema
}

import { useState, useEffect } from 'react'
