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
  const [matchInfo, setMatchInfo] = useState({ avversario: '', data: '' })
  
  const supabase = createClient()

  // Carica dati all'apertura
  useEffect(() => {
    const loadData = async () => {
      const { data: match } = await supabase
        .from('gare')
        .select('*')
        .eq('id', id)
        .single()
      
      if (match) {
        setMatchInfo({ avversario: match.avversario || '', data: match.data_gara || '' })
        setScores({ home: match.risultato_casa || 0, away: match.risultato_ospite || 0 })
        
        const { data: playersData } = await supabase
          .from('giocatori')
          .select('*')
          .eq('squadra_id', match.squadra_id)
          .order('numero_maglia')
        
        if (playersData) setPlayers(playersData)
        
        const { data: tempi } = await supabase
          .from('tempi_gara')
          .select('*')
          .eq('gara_id', id)
        
        if (tempi && tempi.length > 0) {
          const tempoCorrente = tempi.find(t => t.numero_tempo === 1) || tempi[0]
          setShots({ for: tempoCorrente.tiri_effettuati || 0, against: tempoCorrente.tiri_subiti || 0 })
          
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
      await supabase
        .from('gare')
        .update({ risultato_casa: scores.home, risultato_ospite: scores.away })
        .eq('id', id)
      
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
    <div style={{ 
      minHeight: '100vh', 
      background: '#f1f5f9',
      paddingBottom: '100px'
    }}>
      {/* HEADER FISSO */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        padding: '15px',
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            vs {matchInfo.avversario || '...'}
          </div>
        </div>

        {/* SELETTORE TEMPI - PULSANTI GRANDI */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '8px' 
        }}>
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => setCurrentPeriod(p)}
              style={{
                padding: '12px 8px',
                background: currentPeriod === p ? '#f97316' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: currentPeriod === p ? '2px solid white' : '2px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {p}°
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '15px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* SCOREBOARD - NUMERI ENORMI */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto 1fr', 
            gap: '15px',
            alignItems: 'center'
          }}>
            {/* CASA */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>CASA</div>
              <div style={{ 
                fontSize: '64px', 
                fontWeight: 'bold', 
                color: '#1e3a8a',
                lineHeight: 1
              }}>
                {scores.home}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                <button 
                  onClick={() => setScores(s => ({...s, home: Math.max(0, s.home - 1)}))}
                  style={{
                    width: '56px',
                    height: '56px',
                    fontSize: '28px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  −
                </button>
                <button 
                  onClick={() => setScores(s => ({...s, home: s.home + 1}))}
                  style={{
                    width: '56px',
                    height: '56px',
                    fontSize: '28px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* TIRI */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>TIRI</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#f97316',
                lineHeight: 1
              }}>
                {shots.for}
              </div>
              <button 
                onClick={() => setShots(s => ({...s, for: s.for + 1}))}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  background: '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                + TIRO
              </button>
            </div>

            {/* OSPITE */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>OSPITE</div>
              <div style={{ 
                fontSize: '64px', 
                fontWeight: 'bold', 
                color: '#dc2626',
                lineHeight: 1
              }}>
                {scores.away}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                <button 
                  onClick={() => setScores(s => ({...s, away: Math.max(0, s.away - 1)}))}
                  style={{
                    width: '56px',
                    height: '56px',
                    fontSize: '28px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  −
                </button>
                <button 
                  onClick={() => setScores(s => ({...s, away: s.away + 1}))}
                  style={{
                    width: '56px',
                    height: '56px',
                    fontSize: '28px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PULSANTE SALVA - GRANDE E VISIBILE */}
        <button
          onClick={saveToDatabase}
          disabled={saving}
          style={{
            width: '100%',
            padding: '20px',
            background: saved ? '#22c55e' : saving ? '#94a3b8' : '#1e3a8a',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          {saving ? '⏳ SALVATAGGIO...' : saved ? '✅ SALVATO!' : '💾 SALVA PARTITA'}
        </button>

        {/* LISTA GIOCATORI */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            color: '#1e293b',
            marginBottom: '15px',
            fontWeight: 'bold'
          }}>
            GIOCATORI ({players.length})
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {players.map(player => {
              const stats = playerStats[player.id] || { goals: 0, assists: 0 }
              return (
                <div 
                  key={player.id} 
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {/* Info giocatore */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {player.numero_maglia}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#1e293b'
                      }}>
                        {player.nome_completo}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#64748b',
                        marginTop: '2px'
                      }}>
                        {player.ruolo === 'P' ? '🧤 Portiere' : 
                         player.ruolo === 'D' ? '🛡️ Difensore' :
                         player.ruolo === 'C' ? ' Centrocampista' :
                         player.ruolo === 'A' ? '🎯 Attaccante' : player.ruolo}
                      </div>
                    </div>
                  </div>

                  {/* Contatori Reti e Assist - PULSANTI GRANDI */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '10px'
                  }}>
                    {/* RETI */}
                    <div style={{
                      background: '#dcfce7',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '5px', fontWeight: 'bold' }}>
                        ⚽ RETI
                      </div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: 'bold', 
                        color: '#16a34a',
                        lineHeight: 1,
                        marginBottom: '8px'
                      }}>
                        {stats.goals}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => updatePlayerStat(player.id, 'goals', -1)}
                          style={{
                            width: '48px',
                            height: '48px',
                            fontSize: '24px',
                            background: 'white',
                            color: '#16a34a',
                            border: '2px solid #16a34a',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          −
                        </button>
                        <button 
                          onClick={() => updatePlayerStat(player.id, 'goals', 1)}
                          style={{
                            width: '48px',
                            height: '48px',
                            fontSize: '24px',
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* ASSIST */}
                    <div style={{
                      background: '#dbeafe',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '5px', fontWeight: 'bold' }}>
                        ️ ASSIST
                      </div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: 'bold', 
                        color: '#2563eb',
                        lineHeight: 1,
                        marginBottom: '8px'
                      }}>
                        {stats.assists}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => updatePlayerStat(player.id, 'assists', -1)}
                          style={{
                            width: '48px',
                            height: '48px',
                            fontSize: '24px',
                            background: 'white',
                            color: '#2563eb',
                            border: '2px solid #2563eb',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          −
                        </button>
                        <button 
                          onClick={() => updatePlayerStat(player.id, 'assists', 1)}
                          style={{
                            width: '48px',
                            height: '48px',
                            fontSize: '24px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
