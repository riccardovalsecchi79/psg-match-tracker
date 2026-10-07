// app/gara/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useMatchStore } from '@/store/useMatchStore'
import { Plus, Minus, Save, Users } from 'lucide-react'

export default function MatchPage() {
  const params = useParams()
  const matchId = params.id as string
  const supabase = createClient()
  const store = useMatchStore()
  const [players, setPlayers] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)

  // Carica giocatori della squadra al mount
  useEffect(() => {
    store.setMatchId(matchId)
    const loadPlayers = async () => {
      // Nota: In produzione dovresti avere team_id nella gara
      const { data: match } = await supabase.from('gare').select('squadra_id').eq('id', matchId).single()
      if (match) {
        const { data } = await supabase.from('giocatori').select('*').eq('squadra_id', match.squadra_id).order('numero_maglia')
        setPlayers(data || [])
      }
    }
    loadPlayers()
  }, [matchId])

  const period = store.currentPeriod
  const pData = store.periods[period]

  const syncToSupabase = async () => {
    setSyncing(true)
    try {
      // Salva tempi
      for (const [pNum, pData] of Object.entries(store.periods)) {
        await supabase.from('tempi_gara').upsert({
          gara_id: matchId,
          numero_tempo: parseInt(pNum),
          risultato_casa: pData.homeScore,
          risultato_ospite: pData.awayScore,
          tiri_effettuati: pData.shotsOnTargetFor,
          tiri_subiti: pData.shotsOnTargetAgainst
        }, { onConflict: 'gara_id,numero_tempo' })

        // Salva azioni giocatori
        for (const action of Object.values(pData.actions)) {
          await supabase.from('azioni_gioco').upsert({
            tempo_id: `${matchId}-${pNum}`, // Nota: dovrai recuperare l'ID vero del tempo
            giocatore_id: action.playerId,
            tipo_presenza: action.type,
            minuti_giocati: action.minutes,
            reti: action.goals,
            assist: action.assists
          }, { onConflict: 'tempo_id,giocatore_id' })
        }
      }
      alert('Partita salvata con successo!')
    } catch (e) {
      alert('Errore durante il salvataggio. I dati sono comunque salvati localmente.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Fisso */}
      <header className="sticky top-0 z-50 bg-blue-900 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold">P.S.G. Molteno Brongio</h1>
          <button onClick={syncToSupabase} disabled={syncing} 
            className="bg-orange-500 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 active:scale-95 transition">
            <Save size={16} /> {syncing ? 'Salvataggio...' : 'SALVA'}
          </button>
        </div>
        
        {/* Selettore Tempi */}
        <div className="flex gap-2 overflow-x-auto">
          {[1,2,3,4].map(p => (
            <button key={p} onClick={() => store.switchPeriod(p as any)}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition ${
                period === p ? 'bg-orange-500 text-white' : 'bg-blue-800 text-blue-200'
              }`}>
              {p}° Tempo
            </button>
          ))}
        </div>

        {/* Scoreboard Rapido */}
        <div className="flex justify-between items-center mt-3 bg-blue-800/50 p-3 rounded-xl">
          <div className="text-center">
            <div className="text-xs opacity-70">CASA</div>
            <div className="text-3xl font-mono font-bold">{pData.homeScore}</div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => store.updateScore(period, 'home', -1)} className="bg-blue-700 p-1 rounded"><Minus size={14}/></button>
              <button onClick={() => store.updateScore(period, 'home', 1)} className="bg-green-600 p-1 rounded"><Plus size={14}/></button>
            </div>
          </div>
          <div className="text-2xl font-bold opacity-50">-</div>
          <div className="text-center">
            <div className="text-xs opacity-70">OSPITE</div>
            <div className="text-3xl font-mono font-bold">{pData.awayScore}</div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => store.updateScore(period, 'away', -1)} className="bg-blue-700 p-1 rounded"><Minus size={14}/></button>
              <button onClick={() => store.updateScore(period, 'away', 1)} className="bg-green-600 p-1 rounded"><Plus size={14}/></button>
            </div>
          </div>
        </div>

        {/* Tiri Pericolosi */}
        <div className="flex justify-between mt-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="opacity-70">Tiri Nostri:</span>
            <span className="font-bold text-orange-400">{pData.shotsOnTargetFor}</span>
            <button onClick={() => store.updateShots(period, 'for', 1)} className="bg-orange-600/30 p-1 rounded"><Plus size={12}/></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => store.updateShots(period, 'against', 1)} className="bg-red-600/30 p-1 rounded"><Plus size={12}/></button>
            <span className="font-bold text-red-400">{pData.shotsOnTargetAgainst}</span>
            <span className="opacity-70">:Tiri Loro</span>
          </div>
        </div>
      </header>

      {/* Lista Giocatori Touch-Friendly */}
      <main className="p-4 space-y-3">
        {players.map(player => {
          const action = pData.actions[player.id] || { minutes: 0, goals: 0, assists: 0 }
          return (
            <div key={player.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-900">
                    {player.numero_maglia}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{player.nome_completo}</div>
                    <div className="text-xs text-slate-500 uppercase">{player.ruolo}</div>
                  </div>
                </div>
                <select 
                  value={action.type} 
                  onChange={(e) => store.updatePlayer(period, player.id, 'type', e.target.value)}
                  className="text-sm border rounded px-2 py-1 bg-slate-50"
                >
                  <option value="Titolare">Titolare</option>
                  <option value="Riserva">Riserva</option>
                </select>
              </div>

              {/* Contatori Rapidi */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-slate-500 mb-1">MINUTI</div>
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={() => store.updatePlayer(period, player.id, 'minutes', Math.max(0, action.minutes - 5))} className="text-slate-400 hover:text-blue-600"><Minus size={16}/></button>
                    <span className="font-mono font-bold text-lg w-8">{action.minutes}'</span>
                    <button onClick={() => store.updatePlayer(period, player.id, 'minutes', action.minutes + 5)} className="text-slate-400 hover:text-blue-600"><Plus size={16}/></button>
                  </div>
                </div>
                
                <div className="bg-green-50 p-2 rounded-lg text-center border border-green-100">
                  <div className="text-xs text-green-700 mb-1">RETI</div>
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={() => store.updatePlayer(period, player.id, 'goals', Math.max(0, action.goals - 1))} className="text-green-400"><Minus size={16}/></button>
                    <span className="font-mono font-bold text-lg text-green-700 w-8">{action.goals}</span>
                    <button onClick={() => store.updatePlayer(period, player.id, 'goals', action.goals + 1)} className="text-green-600 bg-green-200 rounded-full w-6 h-6 flex items-center justify-center"><Plus size={14}/></button>
                  </div>
                </div>

                <div className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100">
                  <div className="text-xs text-blue-700 mb-1">ASSIST</div>
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={() => store.updatePlayer(period, player.id, 'assists', Math.max(0, action.assists - 1))} className="text-blue-400"><Minus size={16}/></button>
                    <span className="font-mono font-bold text-lg text-blue-700 w-8">{action.assists}</span>
                    <button onClick={() => store.updatePlayer(period, player.id, 'assists', action.assists + 1)} className="text-blue-600 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center"><Plus size={14}/></button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}