// store/useMatchStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PlayerAction {
  playerId: string
  type: 'Titolare' | 'Riserva'
  minutes: number
  goals: number
  assists: number
}

interface TimeData {
  homeScore: number
  awayScore: number
  shotsOnTargetFor: number
  shotsOnTargetAgainst: number
  actions: Record<string, PlayerAction> // chiave = playerId
}

interface MatchState {
  matchId: string | null
  currentPeriod: 1 | 2 | 3 | 4
  periods: Record<1 | 2 | 3 | 4, TimeData>
  
  setMatchId: (id: string) => void
  switchPeriod: (p: 1 | 2 | 3 | 4) => void
  updateScore: (period: 1|2|3|4, side: 'home'|'away', delta: number) => void
  updateShots: (period: 1|2|3|4, type: 'for'|'against', delta: number) => void
  updatePlayer: (period: 1|2|3|4, playerId: string, field: keyof PlayerAction, value: any) => void
  resetMatch: () => void
}

const defaultTime: TimeData = {
  homeScore: 0, awayScore: 0,
  shotsOnTargetFor: 0, shotsOnTargetAgainst: 0,
  actions: {}
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      matchId: null,
      currentPeriod: 1,
      periods: { 1: {...defaultTime}, 2: {...defaultTime}, 3: {...defaultTime}, 4: {...defaultTime} },

      setMatchId: (id) => set({ matchId: id }),
      switchPeriod: (p) => set({ currentPeriod: p }),
      
      updateScore: (period, side, delta) => set((state) => {
        const key = side === 'home' ? 'homeScore' : 'awayScore'
        return {
          periods: {
            ...state.periods,
            [period]: { ...state.periods[period], [key]: state.periods[period][key] + delta }
          }
        }
      }),

      updateShots: (period, type, delta) => set((state) => {
        const key = type === 'for' ? 'shotsOnTargetFor' : 'shotsOnTargetAgainst'
        return {
          periods: {
            ...state.periods,
            [period]: { ...state.periods[period], [key]: Math.max(0, state.periods[period][key] + delta) }
          }
        }
      }),

      updatePlayer: (period, playerId, field, value) => set((state) => {
        const currentActions = state.periods[period].actions[playerId] || {
          playerId, type: 'Titolare', minutes: 0, goals: 0, assists: 0
        }
        return {
          periods: {
            ...state.periods,
            [period]: {
              ...state.periods[period],
              actions: {
                ...state.periods[period].actions,
                [playerId]: { ...currentActions, [field]: value }
              }
            }
          }
        }
      }),

      resetMatch: () => set({ 
        matchId: null, currentPeriod: 1, 
        periods: { 1: {...defaultTime}, 2: {...defaultTime}, 3: {...defaultTime}, 4: {...defaultTime} } 
      })
    }),
    { name: 'psg-match-storage' }
  )
)