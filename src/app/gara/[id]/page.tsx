'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function GaraPage() {
  const params = useParams()
  const id = params.id as string
  const [players, setPlayers] = useState<any[]>([])
  const [currentPeriod, setCurrentPeriod] = useState(1)
  const [scores, setScores] = useState({ home: 0, away: 0 })
  const [shots, setShots] = useState({ for: 0, against: 0 })
  const [playerStats, setPlayerStats] = useState<Record<string, {goals: number, assists: number}>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const supabase = createClient()

  // Carica dati all'apertura
  useEffect(() => {
    const loadData = async () => {
      // 1. Carica la gara
      const { data: match } = await supabase
        .from('gare')
        .select('*')
        .eq('id', id)
        .single()
      
      if (match) {
        setScores({ home: match.risultato_casa || 0, away: match.risultato_ospite || 0 })
        
        // 2. Carica i giocatori
        const { data: playersData } = await supabase
          .from('giocatori')
          .select('*')
          .eq('squadra_id', match.squadra_id)
          .order('numero_maglia')
        
        if (playersData) setPlayers(playersData)
        
        // 3. Carica i tempi e le azioni
        const { data: tempi } = await supabase
          .from('tempi_gara')
          .select('*')
          .eq('gara_id', id)
        
        if (tempi && tempi.length > 0) {
          const tempoCorrente = tempi.find(t => t.numero_tempo === 1) || tempi[0]
          setShots({ for: tempoCorrente.tiri_effettuati || 0, against: tempoCorrente.tiri_subiti || 0 })
          
          // Carica azioni giocatori del primo tempo
          const { data: azioni } = await supabase
            .from('azioni_gioco')
            .select('*')
            .eq('tempo_id', tempoCorrente.id)
          
          if (azioni) {
            const stats: Record<string, {goals: number, assists: number}> = {}
            azioni.forEach(a => {
              stats[a.giocatore_id] = { goals: a.reti || 0, assists: a.assist || 0 }
            })
            setPlayerStats(stats)
          }
        }
      }
    }
    loadData()
  }, [id])

  // Salva su Supabase
  const saveToDatabase = async () => {
    setSaving(true)
    setSaved(false)
    
    try {
      // Aggiorna risultato gara
      await supabase
        .from('gare')
        .update({ risultato_casa: scores.home, risultato_ospite: scores.away })
        .eq('id', id)
      
      // Aggiorna o crea il tempo corrente
      const { data: tempoEsistente } = await supabase
        .from('tempi_gara')
        .select('id')
        .eq('gara_id', id)
        .eq('numero_tempo', currentPeriod)
        .single()
      
      let tempoId = tempoEsistente?.id
      
      if (!tempoId) {
        const { data: nuovoTempo } = await supabase
          .from('tempi_gara')
          .insert({
            gara_id: id,
            numero_tempo: currentPeriod,
            risultato_casa: scores.home,
            risultato_ospite: scores.away,
            tiri_effettuati: shots.for,
            tiri_subiti: shots.against
          })
          .select()
          .single()
        tempoId = nuovoTempo.id
      } else {
        await supabase
          .from('tempi_gara')
          .update({
            tiri_effettuati: shots.for,
            tiri_subiti: shots.against
          })
          .eq('id', tempoId)
      }
      
      // Salva azioni giocatori
      for (const [playerId, stats] of Object.entries(playerStats)) {
        const { data: azioneEsistente } = await supabase
          .from('azioni_gioco')
          .select('id')
          .eq('tempo_id', tempoId)
          .eq('giocatore_id', playerId)
          .single()
        
        if (azioneEsistente) {
          await supabase
            .from('azioni_gioco')
            .update({ reti: stats.goals, assist: stats.assists })
            .eq('id', azioneEsistente.id)
        } else {
          await supabase
            .from('azioni_gioco')
            .insert({
              tempo_id: tempoId,
              giocatore_id: playerId,
              tipo_presenza: 'Titolare',
              reti: stats.goals,
              assist: stats.assists
            })
        }
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Errore salvataggio:', error)
      alert('Errore nel salvataggio!')
    } finally {
      setSaving(false)
    }
  }

  // Aggiorna statistiche giocatore
  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists', delta: number) => {
    setPlayerStats(prev => {
      const current = prev[playerId] || { goals: 0, assists: 0 }
      return {
        ...prev,
        [playerId]: {
          ...current,
          [field]: Math.max(0, current[field] + delta)
        }
      }
    })
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'blue', fontSize: '24px', marginBottom: '20px' }}>
        P.S.G. Molteno Brongio
      </h1>

      {/* Selettore Tempi */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(p => (
          <button
            key={p}
            onClick={() => setCurrentPeriod(p)}
            style={{
              padding: '10px 20px',
              background: currentPeriod === p ? 'blue' : 'gray',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {p}° Tempo
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f0f0f0', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'gray' }}>CASA</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{scores.home}</div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
            <button onClick={() => setScores(s => ({...s, home: Math.max(0, s.home - 1)}))} style={{ padding: '5px 15px', fontSize: '18px' }}>-</button>
            <button onClick={() => setScores(s => ({...s, home: s.home + 1}))} style={{ padding: '5px 15px', fontSize: '18px' }}>+</button>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'gray' }}>TIRI NOSTRI</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'orange' }}>{shots.for}</div>
          <button onClick={() => setShots(s => ({...s, for: s.for + 1}))} style={{ padding: '5px 10px', marginTop: '5px' }}>+ Tiro</button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'gray' }}>OSPITE</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{scores.away}</div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
            <button onClick={() => setScores(s => ({...s, away: Math.max(0, s.away - 1)}))} style={{ padding: '5px 15px', fontSize: '18px' }}>-</button>
            <button onClick={() => setScores(s => ({...s, away: s.away + 1}))} style={{ padding: '5px 15px', fontSize: '18px' }}>+</button>
          </div>
        </div>
      </div>

      {/* Pulsante Salva */}
      <button
        onClick={saveToDatabase}
        disabled={saving}
        style={{
          width: '100%',
          padding: '15px',
          background: saved ? 'green' : 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: saving ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {saving ? '💾 Salvataggio...' : saved ? '✅ Salvato!' : '💾 SALVA TUTTO'}
      </button>

      {/* Lista Giocatori */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Giocatori ({players.length})</h2>
        {players.map(player => {
          const stats = playerStats[player.id] || { goals: 0, assists: 0 }
          return (
            <div key={player.id} style={{ padding: '15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'blue', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {player.numero_maglia}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{player.nome_completo}</div>
                    <div style={{ fontSize: '12px', color: 'gray' }}>{player.ruolo}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'gray' }}>Reti</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>{stats.goals}</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => updatePlayerStat(player.id, 'goals', -1)} style={{ padding: '3px 10px' }}>-</button>
                      <button onClick={() => updatePlayerStat(player.id, 'goals', 1)} style={{ padding: '3px 10px' }}>+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'gray' }}>Assist</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'blue' }}>{stats.assists}</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => updatePlayerStat(player.id, 'assists', -1)} style={{ padding: '3px 10px' }}>-</button>
                      <button onClick={() => updatePlayerStat(player.id, 'assists', 1)} style={{ padding: '3px 10px' }}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
