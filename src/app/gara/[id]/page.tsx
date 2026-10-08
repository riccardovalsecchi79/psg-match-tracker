'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function GaraPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  
  const [players, setPlayers] = useState<any[]>([])
  const [titolariIds, setTitolariIds] = useState<Set<string>>(new Set())
  const [currentPeriod, setCurrentPeriod] = useState(1)
  const [playerStats, setPlayerStats] = useState<Record<string, {goals: number, assists: number, shots: number, shotsAgainst: number, goalsAgainst: number}>>({})
  const [playerMinutes, setPlayerMinutes] = useState<Record<string, number>>({})
  const [sostituzioni, setSostituzioni] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [matchInfo, setMatchInfo] = useState({ avversario: '', data: '', luogo: '' })
  
  const [showSubModal, setShowSubModal] = useState(false)
  const [subUscente, setSubUscente] = useState('')
  const [subEntrante, setSubEntrante] = useState('')
  const [subMinuto, setSubMinuto] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editForm, setEditForm] = useState({ avversario: '', luogo: '', data_gara: '' })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: match } = await supabase
        .from('gare')
        .select('*')
        .eq('id', id)
        .single()
      
      if (match) {
        setMatchInfo({ 
          avversario: match.avversario || '', 
          data: match.data_gara || '',
          luogo: match.luogo || ''
        })
        setEditForm({
          avversario: match.avversario || '',
          luogo: match.luogo || '',
          data_gara: match.data_gara || ''
        })
        
        const { data: playersData } = await supabase
          .from('giocatori')
          .select('*')
          .eq('squadra_id', match.squadra_id)
          .order('numero_maglia')
        if (playersData) setPlayers(playersData)
        
        await caricaDatiTempo(1)
      }
    }
    loadData()
  }, [id])

  const caricaDatiTempo = async (tempo: number) => {
    try {
      const { data: formazioni } = await supabase
        .from('formazioni')
        .select('giocatore_id')
        .eq('gara_id', id)
        .eq('numero_tempo', tempo)
        .eq('titolare', true)
      if (formazioni) {
        setTitolariIds(new Set(formazioni.map(f => f.giocatore_id)))
      } else {
        setTitolariIds(new Set())
      }

      const { data: tempi } = await supabase
        .from('tempi_gara')
        .select('*')
        .eq('gara_id', id)
        .eq('numero_tempo', tempo)
        .single()
      
      if (tempi) {
        const { data: azioni } = await supabase
          .from('azioni_gioco')
          .select('*')
          .eq('tempo_id', tempi.id)
        if (azioni) {
          const stats: Record<string, {goals: number, assists: number, shots: number, shotsAgainst: number, goalsAgainst: number}> = {}
          azioni.forEach(a => {
            stats[a.giocatore_id] = { 
              goals: a.reti || 0, 
              assists: a.assist || 0,
              shots: a.tiri || 0,
              shotsAgainst: a.tiri_subiti || 0,
              goalsAgainst: a.reti_subite || 0
            }
          })
          setPlayerStats(stats)
        } else {
          setPlayerStats({})
        }
        
        const { data: minutiData } = await supabase
          .from('minuti_giocati')
          .select('*')
          .eq('gara_id', id)
          .eq('numero_tempo', tempo)
        if (minutiData) {
          const minutes: Record<string, number> = {}
          minutiData.forEach(m => { minutes[m.giocatore_id] = m.minuti || 0 })
          setPlayerMinutes(minutes)
        } else {
          setPlayerMinutes({})
        }
        
        const { data: subsData } = await supabase
          .from('sostituzioni')
          .select('*')
          .eq('gara_id', id)
          .eq('numero_tempo', tempo)
          .order('minuto_sostituzione')
        if (subsData) {
          setSostituzioni(subsData)
        } else {
          setSostituzioni([])
        }
      } else {
        setPlayerStats({})
        setPlayerMinutes({})
        setSostituzioni([])
      }
    } catch (error) {
      console.error('Errore caricamento tempo:', error)
    }
  }

  const cambiaTempo = async (tempo: number) => {
    setCurrentPeriod(tempo)
    await caricaDatiTempo(tempo)
  }

  // Calcola tabellino automatico
  const calcolaTabellino = () => {
    let golPSG = 0
    let tiriPSG = 0
    let golSubiti = 0
    let tiriSubiti = 0

    players.forEach(player => {
      const stats = playerStats[player.id] || { goals: 0, assists: 0, shots: 0, shotsAgainst: 0, goalsAgainst: 0 }
      golPSG += stats.goals
      tiriPSG += stats.shots
      if (player.ruolo === 'P') {
        golSubiti += stats.goalsAgainst
        tiriSubiti += stats.shotsAgainst
      }
    })

    return { golPSG, tiriPSG, golSubiti, tiriSubiti }
  }

  const tabellino = calcolaTabellino()

  const saveToDatabase = async () => {
    setSaving(true)
    setSaved(false)
    try {
      // Aggiorna risultato gara con tabellino automatico
      await supabase.from('gare')
        .update({ 
          risultato_casa: tabellino.golPSG, 
          risultato_ospite: tabellino.golSubiti 
        })
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
            gara_id: id, numero_tempo: currentPeriod,
            risultato_casa: tabellino.golPSG, risultato_ospite: tabellino.golSubiti,
            tiri_effettuati: tabellino.tiriPSG, tiri_subiti: tabellino.tiriSubiti
          })
          .select().single()
        tempoId = nuovoTempo.id
      } else {
        await supabase.from('tempi_gara')
          .update({ 
            tiri_effettuati: tabellino.tiriPSG, 
            tiri_subiti: tabellino.tiriSubiti,
            risultato_casa: tabellino.golPSG,
            risultato_ospite: tabellino.golSubiti
          })
          .eq('id', tempoId)
      }
      
      await supabase.from('azioni_gioco')
        .delete()
        .eq('tempo_id', tempoId)
      
      for (const [playerId, stats] of Object.entries(playerStats)) {
        if (stats.goals > 0 || stats.assists > 0 || stats.shots > 0 || stats.shotsAgainst > 0 || stats.goalsAgainst > 0) {
          await supabase.from('azioni_gioco')
            .insert({
              tempo_id: tempoId, 
              giocatore_id: playerId,
              numero_tempo: currentPeriod,
              tipo_presenza: 'Titolare', 
              reti: stats.goals, 
              assist: stats.assists,
              tiri: stats.shots,
              tiri_subiti: stats.shotsAgainst,
              reti_subite: stats.goalsAgainst
            })
        }
      }
      
      await supabase.from('minuti_giocati')
        .delete()
        .eq('gara_id', id)
        .eq('numero_tempo', currentPeriod)
      
      for (const [playerId, minuti] of Object.entries(playerMinutes)) {
        if (minuti > 0) {
          await supabase.from('minuti_giocati')
            .insert({ 
              gara_id: id, 
              tempo_id: tempoId, 
              numero_tempo: currentPeriod,
              giocatore_id: playerId, 
              minuti 
            })
        }
      }
      
      await supabase.from('sostituzioni')
        .delete()
        .eq('gara_id', id)
        .eq('numero_tempo', currentPeriod)
      
      for (const sub of sostituzioni) {
        await supabase.from('sostituzioni')
          .insert({
            gara_id: id, 
            tempo_id: tempoId,
            numero_tempo: currentPeriod,
            giocatore_uscente_id: sub.giocatore_uscente_id,
            giocatore_entrante_id: sub.giocatore_entrante_id,
            minuto_sostituzione: sub.minuto_sostituzione
          })
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore nel salvataggio!')
    } finally { setSaving(false) }
  }

  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists' | 'shots' | 'shotsAgainst' | 'goalsAgainst', delta: number) => {
    setPlayerStats(prev => {
      const current = prev[playerId] || { goals: 0, assists: 0, shots: 0, shotsAgainst: 0, goalsAgainst: 0 }
      return { 
        ...prev, 
        [playerId]: { ...current, [field]: Math.max(0, current[field] + delta) } 
      }
    })
  }

  const updatePlayerMinutes = (playerId: string, delta: number) => {
    setPlayerMinutes(prev => {
      const current = prev[playerId] || 0
      return { ...prev, [playerId]: Math.max(0, Math.min(30, current + delta)) }
    })
  }

  const aggiungiSostituzione = () => {
    if (!subUscente || !subEntrante || !subMinuto) {
      alert('Compila tutti i campi')
      return
    }
    setSostituzioni(prev => [...prev, {
      giocatore_uscente_id: subUscente,
      giocatore_entrante_id: subEntrante,
      minuto_sostituzione: parseInt(subMinuto)
    }])
    setTitolariIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(subUscente)
      newSet.add(subEntrante)
      return newSet
    })
    setShowSubModal(false)
    setSubUscente('')
    setSubEntrante('')
    setSubMinuto('')
  }

  const rimuoviSostituzione = (index: number) => {
    setSostituzioni(prev => prev.filter((_, i) => i !== index))
  }

  const salvaModifiche = async () => {
    if (!editForm.avversario.trim()) {
      alert('Inserisci il nome dell\'avversario')
      return
    }
    try {
      const { error } = await supabase.from('gare')
        .update({
          avversario: editForm.avversario.trim(),
          luogo: editForm.luogo.trim() || null,
          data_gara: editForm.data_gara
        })
        .eq('id', id)
      if (error) throw error
      setMatchInfo({
        avversario: editForm.avversario.trim(),
        data: editForm.data_gara,
        luogo: editForm.luogo.trim()
      })
      setShowEditModal(false)
      alert('✅ Partita aggiornata!')
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore durante la modifica')
    }
  }

  const eliminaPartita = async () => {
    if (!confirm('⚠️ ATTENZIONE: Questa azione eliminerà la partita e TUTTE le statistiche associate. Sei sicuro?')) {
      return
    }
    setDeleting(true)
    try {
      const { error } = await supabase.from('gare').delete().eq('id', id)
      if (error) throw error
      alert('✅ Partita eliminata')
      router.push('/dashboard')
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore durante l\'eliminazione')
    } finally { setDeleting(false) }
  }

  const getRuoloIcon = (ruolo: string) => {
    switch (ruolo) {
      case 'P': return '🧤'
      case 'D': return '🛡️'
      case 'C': return '🎽'
      case 'A': return '🎯'
      default: return ''
    }
  }

  const titolari = players.filter(p => titolariIds.has(p.id))
  const panchina = players.filter(p => !titolariIds.has(p.id))
  const portieri = titolari.filter(p => p.ruolo === 'P')
  const giocatoriDiMovimento = titolari.filter(p => p.ruolo !== 'P')

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', paddingBottom: '100px' }}>
      <div style={{
        position: 'sticky', top: 0, background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white', padding: '15px', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: 'rgba(255,255,255,0.2)',
            color: 'white', textDecoration: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)'
          }}>
            ← Dashboard
          </Link>
          <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', opacity: 0.9 }}>
            vs {matchInfo.avversario || '...'}
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[1, 2, 3, 4].map(p => (
            <button key={p} onClick={() => cambiaTempo(p)} style={{
              padding: '12px 8px', background: currentPeriod === p ? '#f97316' : 'rgba(255,255,255,0.2)',
              color: 'white', border: currentPeriod === p ? '2px solid white' : '2px solid transparent',
              borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
            }}>{p}°</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '15px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* TABELLINO AUTOMATICO */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>
            TABELLINO {currentPeriod}° TEMPO (aggiornamento automatico)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#1e3a8a', marginBottom: '5px', fontWeight: 'bold' }}>PSG</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1e3a8a', lineHeight: 1 }}>{tabellino.golPSG}</div>
              <div style={{ fontSize: '14px', color: '#f97316', marginTop: '8px' }}>
                Tiri: <strong>{tabellino.tiriPSG}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '5px', fontWeight: 'bold' }}>OSPITE</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#dc2626', lineHeight: 1 }}>{tabellino.golSubiti}</div>
              <div style={{ fontSize: '14px', color: '#dc2626', marginTop: '8px' }}>
                Tiri: <strong>{tabellino.tiriSubiti}</strong>
              </div>
            </div>
          </div>
        </div>

        <button onClick={saveToDatabase} disabled={saving} style={{
          width: '100%', padding: '20px', background: saved ? '#22c55e' : saving ? '#94a3b8' : '#1e3a8a',
          color: 'white', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold',
          cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '10px',
          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
        }}>
          {saving ? '⏳ SALVATAGGIO...' : saved ? '✅ SALVATO!' : '💾 SALVA PARTITA'}
        </button>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setShowEditModal(true)} style={{
            flex: 1, padding: '15px', background: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            ✏️ MODIFICA
          </button>
          <button onClick={() => setShowDeleteModal(true)} style={{
            flex: 1, padding: '15px', background: '#dc2626', color: 'white',
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            🗑️ ELIMINA
          </button>
        </div>

        {/* PORTIERI - con tiri subiti e gol subiti */}
        {portieri.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', color: '#1e293b', fontWeight: 'bold', marginBottom: '15px' }}>
              🧤 PORTIERI {currentPeriod}° TEMPO
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {portieri.map(player => {
                const stats = playerStats[player.id] || { goals: 0, assists: 0, shots: 0, shotsAgainst: 0, goalsAgainst: 0 }
                const minuti = playerMinutes[player.id] || 0
                return (
                  <div key={player.id} style={{
                    background: 'white', borderRadius: '12px', padding: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0
                      }}>{player.numero_maglia}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{player.nome_completo}</div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>{getRuoloIcon(player.ruolo)} {player.ruolo}</div>
                      </div>
                    </div>

                    <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px', fontWeight: 'bold' }}>⏱️ MINUTI</div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e', lineHeight: 1, marginBottom: '8px' }}>{minuti}'</div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => updatePlayerMinutes(player.id, -5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: 'white',
                          color: '#92400e', border: '2px solid #92400e', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>−5</button>
                        <button onClick={() => updatePlayerMinutes(player.id, 5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: '#92400e',
                          color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>+5</button>
                      </div>
                    </div>

                    {/* TIRI SUBITI E GOL SUBITI (solo per portiere) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '4px', fontWeight: 'bold' }}>🎯 TIRI SUBITI</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', lineHeight: 1, marginBottom: '6px' }}>{stats.shotsAgainst}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'shotsAgainst', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: 'white',
                            color: '#dc2626', border: '2px solid #dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'shotsAgainst', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#dc2626',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: '#fecaca', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#991b1b', marginBottom: '4px', fontWeight: 'bold' }}>⚽ GOL SUBITI</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#991b1b', lineHeight: 1, marginBottom: '6px' }}>{stats.goalsAgainst}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'goalsAgainst', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: 'white',
                            color: '#991b1b', border: '2px solid #991b1b', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'goalsAgainst', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#991b1b',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                    </div>

                    {/* RETI E ASSIST (anche portiere può segnare) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#16a34a', marginBottom: '4px', fontWeight: 'bold' }}>⚽ RETI</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', lineHeight: 1, marginBottom: '6px' }}>{stats.goals}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: 'white',
                            color: '#16a34a', border: '2px solid #16a34a', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#16a34a',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: '#dbeafe', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#2563eb', marginBottom: '4px', fontWeight: 'bold' }}>🅰️ ASSIST</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', lineHeight: 1, marginBottom: '6px' }}>{stats.assists}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: 'white',
                            color: '#2563eb', border: '2px solid #2563eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#2563eb',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* GIOCATORI DI MOVIMENTO */}
        {giocatoriDiMovimento.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', color: '#1e293b', fontWeight: 'bold', margin: 0 }}>
                 GIOCATORI {currentPeriod}° TEMPO ({giocatoriDiMovimento.length})
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/formazione/${id}`} style={{
                  padding: '10px 15px', background: '#8b5cf6', color: 'white',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none'
                }}>👥 Formazione</Link>
                <button onClick={() => setShowSubModal(true)} style={{
                  padding: '10px 15px', background: '#f97316', color: 'white', border: 'none',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                }}>🔄 Sostituzione</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {giocatoriDiMovimento.map(player => {
                const stats = playerStats[player.id] || { goals: 0, assists: 0, shots: 0, shotsAgainst: 0, goalsAgainst: 0 }
                const minuti = playerMinutes[player.id] || 0
                return (
                  <div key={player.id} style={{
                    background: 'white', borderRadius: '12px', padding: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0
                      }}>{player.numero_maglia}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{player.nome_completo}</div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>{getRuoloIcon(player.ruolo)} {player.ruolo}</div>
                      </div>
                    </div>

                    <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px', fontWeight: 'bold' }}>⏱️ MINUTI</div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e', lineHeight: 1, marginBottom: '8px' }}>{minuti}'</div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => updatePlayerMinutes(player.id, -5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: 'white',
                          color: '#92400e', border: '2px solid #92400e', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>−5</button>
                        <button onClick={() => updatePlayerMinutes(player.id, 5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: '#92400e',
                          color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>+5</button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#16a34a', marginBottom: '4px', fontWeight: 'bold' }}>⚽ RETI</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', lineHeight: 1, marginBottom: '6px' }}>{stats.goals}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: 'white',
                            color: '#16a34a', border: '2px solid #16a34a', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#16a34a',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: '#dbeafe', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#2563eb', marginBottom: '4px', fontWeight: 'bold' }}>🅰️ ASSIST</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', lineHeight: 1, marginBottom: '6px' }}>{stats.assists}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: 'white',
                            color: '#2563eb', border: '2px solid #2563eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#2563eb',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: '#fce7f3', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#db2777', marginBottom: '4px', fontWeight: 'bold' }}>🎯 TIRI</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#db2777', lineHeight: 1, marginBottom: '6px' }}>{stats.shots}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'shots', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: 'white',
                            color: '#db2777', border: '2px solid #db2777', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'shots', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#db2777',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PANCHINA */}
        {panchina.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', color: '#1e293b', fontWeight: 'bold', marginBottom: '15px' }}>🪑 PANCHINA ({panchina.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {panchina.map(player => (
                <div key={player.id} style={{
                  background: '#f8fafc', borderRadius: '10px', padding: '12px',
                  border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '40px', height: '40px', background: '#94a3b8', color: 'white',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', fontWeight: 'bold'
                  }}>{player.numero_maglia}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{player.nome_completo}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{getRuoloIcon(player.ruolo)} {player.ruolo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOSTITUZIONI */}
        {sostituzioni.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', color: '#1e293b', fontWeight: 'bold', marginBottom: '15px' }}>🔄 SOSTITUZIONI {currentPeriod}° TEMPO ({sostituzioni.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sostituzioni.map((sub, index) => {
                const uscente = players.find(p => p.id === sub.giocatore_uscente_id)
                const entrante = players.find(p => p.id === sub.giocatore_entrante_id)
                return (
                  <div key={index} style={{
                    background: '#fff7ed', borderRadius: '10px', padding: '12px',
                    border: '1px solid #fdba74', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}><strong>{sub.minuto_sostituzione}'</strong></div>
                      <div style={{ fontSize: '14px', color: '#dc2626' }}>❌ {uscente?.nome_completo || 'Sconosciuto'}</div>
                      <div style={{ fontSize: '14px', color: '#16a34a' }}>✅ {entrante?.nome_completo || 'Sconosciuto'}</div>
                    </div>
                    <button onClick={() => rimuoviSostituzione(index)} style={{
                      padding: '8px 12px', background: '#dc2626', color: 'white', border: 'none',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                    }}>🗑️</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL SOSTITUZIONE */}
      {showSubModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '25px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#1e3a8a', fontSize: '22px', marginTop: 0, marginBottom: '20px' }}>🔄 Sostituzione {currentPeriod}° Tempo</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>Giocatore che ESCE ❌</label>
              <select value={subUscente} onChange={(e) => setSubUscente(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px' }}>
                <option value="">-- Seleziona --</option>
                {titolari.map(p => <option key={p.id} value={p.id}>#{p.numero_maglia} {p.nome_completo}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>Giocatore che ENTRA ✅</label>
              <select value={subEntrante} onChange={(e) => setSubEntrante(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px' }}>
                <option value="">-- Seleziona --</option>
                {panchina.map(p => <option key={p.id} value={p.id}>#{p.numero_maglia} {p.nome_completo}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>Minuto ⏱️</label>
              <input type="number" min="1" max="30" step="5" value={subMinuto} onChange={(e) => setSubMinuto(e.target.value)} placeholder="es. 15" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowSubModal(false); setSubUscente(''); setSubEntrante(''); setSubMinuto('') }} style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Annulla</button>
              <button onClick={aggiungiSostituzione} style={{ flex: 2, padding: '14px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>✓ Conferma</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICA */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '25px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ color: '#1e3a8a', fontSize: '22px', marginTop: 0, marginBottom: '20px' }}>✏️ Modifica Partita</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>Avversario *</label>
              <input type="text" value={editForm.avversario} onChange={(e) => setEditForm({...editForm, avversario: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>Luogo</label>
              <input type="text" value={editForm.luogo} onChange={(e) => setEditForm({...editForm, luogo: e.target.value})} placeholder="es. Campo Comunale" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>Data *</label>
              <input type="date" value={editForm.data_gara} onChange={(e) => setEditForm({...editForm, data_gara: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Annulla</button>
              <button onClick={salvaModifiche} style={{ flex: 2, padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>💾 SALVA MODIFICHE</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINA */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '25px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ color: '#dc2626', fontSize: '22px', marginTop: 0, marginBottom: '15px' }}>⚠️ Elimina Partita</h2>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '20px', lineHeight: '1.5' }}>
              Questa azione eliminerà <strong>definitivamente</strong> la partita e tutte le statistiche associate.
            </p>
            <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '20px' }}>Questa azione NON può essere annullata.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: deleting ? 'not-allowed' : 'pointer' }}>Annulla</button>
              <button onClick={eliminaPartita} disabled={deleting} style={{ flex: 2, padding: '14px', background: deleting ? '#94a3b8' : '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: deleting ? 'not-allowed' : 'pointer' }}>{deleting ? ' ELIMINAZIONE...' : '️ ELIMINA DEFINITIVAMENTE'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
