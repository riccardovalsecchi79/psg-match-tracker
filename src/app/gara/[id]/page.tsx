'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

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
  const [squadraNome, setSquadraNome] = useState('Partita')
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: match } = await supabase.from('gare').select('*').eq('id', id).single()
      if (match) {
        setScores({ home: match.risultato_casa || 0, away: match.risultato_ospite || 0 })
        if (match.squadra_id) {
          const { data: squadra } = await supabase.from('squadre').select('nome_squadra').eq('id', match.squadra_id).single()
          if (squadra) setSquadraNome(squadra.nome_squadra)
          const { data: playersData } = await supabase.from('giocatori').select('*').eq('squadra_id', match.squadra_id).order('numero_maglia')
          if (playersData) setPlayers(playersData)
        }
        const { data: tempi } = await supabase.from('tempi_gara').select('*').eq('gara_id', id)
        if (tempi && tempi.length > 0) {
          const tempoCorrente = tempi.find((t: any) => t.numero_tempo === 1) || tempi[0]
          setShots({ for: tempoCorrente.tiri_effettuati || 0, against: tempoCorrente.tiri_subiti || 0 })
          const { data: azioni } = await supabase.from('azioni_gioco').select('*').eq('tempo_id', tempoCorrente.id)
          if (azioni) {
            const stats: Record<string, {goals: number, assists: number}> = {}
            azioni.forEach((a: any) => { stats[a.giocatore_id] = { goals: a.reti || 0, assists: a.assist || 0 } })
            setPlayerStats(stats)
          }
        }
      }
    }
    loadData()
  }, [id])

  const saveToDatabase = async () => {
    setSaving(true); setSaved(false)
    try {
      await supabase.from('gare').update({ risultato_casa: scores.home, risultato_ospite: scores.away }).eq('id', id)
      const { data: tempoEsistente } = await supabase.from('tempi_gara').select('id').eq('gara_id', id).eq('numero_tempo', currentPeriod).single()
      let tempoId = tempoEsistente?.id
      if (!tempoId) {
        const { data: nuovoTempo } = await supabase.from('tempi_gara').insert({ gara_id: id, numero_tempo: currentPeriod, risultato_casa: scores.home, risultato_ospite: scores.away, tiri_effettuati: shots.for, tiri_subiti: shots.against }).select().single()
        tempoId = nuovoTempo.id
      } else {
        await supabase.from('tempi_gara').update({ tiri_effettuati: shots.for, tiri_subiti: shots.against }).eq('id', tempoId)
      }
      for (const [playerId, stats] of Object.entries(playerStats)) {
        const { data: azioneEsistente } = await supabase.from('azioni_gioco').select('id').eq('tempo_id', tempoId).eq('giocatore_id', playerId).single()
        if (azioneEsistente) {
          await supabase.from('azioni_gioco').update({ reti: stats.goals, assist: stats.assists }).eq('id', azioneEsistente.id)
        } else {
          await supabase.from('azioni_gioco').insert({ tempo_id: tempoId, giocatore_id: playerId, tipo_presenza: 'Titolare', reti: stats.goals, assist: stats.assists })
        }
      }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (error) { alert('Errore nel salvataggio!') } 
    finally { setSaving(false) }
  }

  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists', delta: number) => {
    setPlayerStats(prev => {
      const current = prev[playerId] || { goals: 0, assists: 0 }
      return { ...prev, [playerId]: { ...current, [field]: Math.max(0, current[field] + delta) } }
    })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F2F2F7', paddingBottom: '100px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(242, 242, 247, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.1)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <Link href="/dashboard" style={{ color: '#007AFF', textDecoration: 'none', fontSize: '17px', fontWeight: '400', marginRight: '8px' }}>← Indietro</Link>
        </div>
        <h1 style={{ fontSize: '17px', fontWeight: '600', margin: 0, color: '#000000', textAlign: 'center' }}>{squadraNome}</h1>
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#E5E5EA', borderRadius: '9px', padding: '2px', display: 'flex', marginBottom: '16px' }}>
          {[1, 2, 3, 4].map(p => (
            <button key={p} onClick={() => setCurrentPeriod(p)} style={{ flex: 1, padding: '8px 0', background: currentPeriod === p ? 'white' : 'transparent', color: currentPeriod === p ? '#000000' : '#8E8E93', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', boxShadow: currentPeriod === p ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.2s' }}>{p}°</button>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '8px', fontWeight: '500' }}>CASA</div>
              <div style={{ fontSize: '56px', fontWeight: '700', color: '#000000', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{scores.home}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => setScores(s => ({...s, home: Math.max(0, s.home - 1)}))} style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#E5E5EA', color: '#000000', fontSize: '24px', fontWeight: '300', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <button onClick={() => setScores(s => ({...s, home: s.home + 1}))} style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#34C759', color: 'white', fontSize: '24px', fontWeight: '300', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
            <div style={{ fontSize: '32px', color: '#C7C7CC', fontWeight: '300' }}>-</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '8px', fontWeight: '500' }}>OSPITE</div>
              <div style={{ fontSize: '56px', fontWeight: '700', color: '#000000', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{scores.away}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => setScores(s => ({...s, away: Math.max(0, s.away - 1)}))} style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#E5E5EA', color: '#000000', fontSize: '24px', fontWeight: '300', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <button onClick={() => setScores(s => ({...s, away: s.away + 1}))} style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#FF3B30', color: 'white', fontSize: '24px', fontWeight: '300', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '0.5px solid rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '4px', fontWeight: '500' }}>TIRI NOSTRI</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#FF9500', fontVariantNumeric: 'tabular-nums' }}>{shots.for}</div>
              <button onClick={() => setShots(s => ({...s, for: s.for + 1}))} style={{ marginTop: '8px', padding: '8px 16px', background: '#FFF3E0', color: '#FF9500', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Tiro</button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '4px', fontWeight: '500' }}>TIRI SUBITI</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#FF3B30', fontVariantNumeric: 'tabular-nums' }}>{shots.against}</div>
              <button onClick={() => setShots(s => ({...s, against: s.against + 1}))} style={{ marginTop: '8px', padding: '8px 16px', background: '#FFE5E5', color: '#FF3B30', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Tiro</button>
            </div>
          </div>
        </div>

        <button onClick={saveToDatabase} disabled={saving} style={{ width: '100%', padding: '16px', background: saved ? '#34C759' : '#007AFF', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '16px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,122,255,0.3)' }}>
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato!' : '💾 Salva Partita'}
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 16px', marginBottom: '8px' }}>Giocatori ({players.length})</div>
          {players.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', color: '#8E8E93' }}>Nessun giocatore in rosa</div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
              {players.map((player, index) => {
                const stats = playerStats[player.id] || { goals: 0, assists: 0 }
                return (
                  <div key={player.id} style={{ padding: '14px 16px', borderBottom: index < players.length - 1 ? '0.5px solid rgba(0,0,0,0.1)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '600', marginRight: '12px', flexShrink: 0 }}>{player.numero_maglia}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '17px', fontWeight: '500', color: '#000000' }}>{player.nome_completo}</div>
                        <div style={{ fontSize: '13px', color: '#8E8E93' }}>{player.ruolo}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F2F2F7', borderRadius: '10px', padding: '8px 12px' }}>
                        <button onClick={() => updatePlayerStat(player.id, 'goals', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E5E5EA', border: 'none', color: '#000000', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '500' }}>RETI</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#34C759', fontVariantNumeric: 'tabular-nums' }}>{stats.goals}</div>
                        </div>
                        <button onClick={() => updatePlayerStat(player.id, 'goals', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#34C759', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F2F2F7', borderRadius: '10px', padding: '8px 12px' }}>
                        <button onClick={() => updatePlayerStat(player.id, 'assists', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E5E5EA', border: 'none', color: '#000000', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '500' }}>ASSIST</div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#007AFF', fontVariantNumeric: 'tabular-nums' }}>{stats.assists}</div>
                        </div>
                        <button onClick={() => updatePlayerStat(player.id, 'assists', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#007AFF', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
