'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { getTema, TEMI } from '@/lib/theme'

export default function GaraPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const [tema, setTema] = useState(TEMI.team)
  
  const [players, setPlayers] = useState<any[]>([])
  const [titolariIds, setTitolariIds] = useState<Set<string>>(new Set())
  const [currentPeriod, setCurrentPeriod] = useState(1)
  const [playerStats, setPlayerStats] = useState<Record<string, {goals: number, assists: number, shots: number, shotsAgainst: number, goalsAgainst: number}>>({})
  const [playerMinutes, setPlayerMinutes] = useState<Record<string, number>>({})
  const [sostituzioni, setSostituzioni] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [matchInfo, setMatchInfo] = useState({ avversario: '', data: '', luogo: '', squadraId: '' })
  
  const [showSubModal, setShowSubModal] = useState(false)
  const [subUscente, setSubUscente] = useState('')
  const [subEntrante, setSubEntrante] = useState('')
  const [subMinuto, setSubMinuto] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editForm, setEditForm] = useState({ avversario: '', luogo: '', data_gara: '' })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setTema(getTema())
    
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
          luogo: match.luogo || '',
          squadraId: match.squadra_id
        })
        setEditForm({
          avversario: match.avversario || '',
          luogo: match.luogo || '',
          data_gara: match.data_gara || ''
        })
        
        // CARICA TUTTI I GIOCATORI DI TUTTE LE SQUADRE
        const { data: playersData } = await supabase
          .from('giocatori')
          .select('*, squadre(nome_squadra)')
          .order('numero_maglia')
        
        if (playersData) {
          const playersWithTeam = playersData.map(p => ({
            ...p,
            nome_squadra_provenienza: (p as any).squadre?.nome_squadra || ''
          }))
          setPlayers(playersWithTeam)
        }
        
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

      const { data: tempoData, error: tempoError } = await supabase
        .from('tempi_gara')
        .select('*')
        .eq('gara_id', id)
        .eq('numero_tempo', tempo)
        .single()
      
      if (tempoError) {
        setPlayerStats({})
        setPlayerMinutes({})
        setSostituzioni([])
        return
      }
      
      if (tempoData) {
        const { data: azioni } = await supabase
          .from('azioni_gioco')
          .select('*')
          .eq('tempo_id', tempoData.id)
        
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
      }
    } catch (error) {
      console.error('Errore caricamento tempo:', error)
    }
  }

  const cambiaTempo = async (tempo: number) => {
    setCurrentPeriod(tempo)
    await caricaDatiTempo(tempo)
  }

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
      
      for (const [playerId, stats] of Object.entries(playerStats)) {
        if (stats.goals > 0 || stats.assists > 0 || stats.shots > 0 || stats.shotsAgainst > 0 || stats.goalsAgainst > 0) {
          const { error } = await supabase
            .from('azioni_gioco')
            .upsert({
              tempo_id: tempoId, 
              giocatore_id: playerId,
              numero_tempo: currentPeriod,
              tipo_presenza: 'Titolare', 
              reti: stats.goals, 
              assist: stats.assists,
              tiri: stats.shots,
              tiri_subiti: stats.shotsAgainst,
              reti_subite: stats.goalsAgainst
            }, {
              onConflict: 'tempo_id,giocatore_id'
            })
          
          if (error) console.error('Errore upsert azioni:', error)
        }
      }
      
      for (const [playerId, minuti] of Object.entries(playerMinutes)) {
        const { error } = await supabase
          .from('minuti_giocati')
          .upsert({ 
            gara_id: id, 
            tempo_id: tempoId, 
            numero_tempo: currentPeriod,
            giocatore_id: playerId, 
            minuti: minuti || 0
          }, {
            onConflict: 'gara_id,giocatore_id,numero_tempo'
          })
        
        if (error) console.error('Errore upsert minuti:', error)
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
        luogo: editForm.luogo.trim(),
        squadraId: matchInfo.squadraId
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

  // Filtra giocatori: titolari della squadra della partita + titolari di altre squadre
  const titolari = players.filter(p => titolariIds.has(p.id))
  const panchina = players.filter(p => !titolariIds.has(p.id))
  const portieri = titolari.filter(p => p.ruolo === 'P')
  const giocatoriDiMovimento = titolari.filter(p => p.ruolo !== 'P')

  return (
    <div style={{ minHeight: '100vh', background: tema.background, paddingBottom: '120px' }}>
      <div style={{
        position: 'sticky', top: 0, background: tema.gradientHeader,
        color: 'white', padding: '15px', zIndex: 100, boxShadow: tema.shadow,
        border: '1px solid rgba(249,115,22,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: 'rgba(255,255,255,0.15)',
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
              padding: '12px 8px', background: currentPeriod === p ? tema.accent1 : 'rgba(255,255,255,0.15)',
              color: 'white', border: currentPeriod === p ? '2px solid #fbbf24' : '2px solid transparent',
              borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
            }}>{p}°</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '15px', maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ background: tema.backgroundCard, borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: tema.shadow, border: `1px solid ${tema.borderCard}` }}>
          <div style={{ fontSize: '12px', color: tema.textSecondaryOnCard, textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
            TABELLINO {currentPeriod}° TEMPO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: tema.accent1, marginBottom: '5px', fontWeight: 'bold', letterSpacing: '1px' }}>PSG</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1 }}>{tabellino.golPSG}</div>
              <div style={{ fontSize: '14px', color: tema.accent1, marginTop: '8px', fontWeight: 'bold' }}>
                Tiri: <strong>{tabellino.tiriPSG}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: tema.danger, marginBottom: '5px', fontWeight: 'bold', letterSpacing: '1px' }}>OSPITE</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1 }}>{tabellino.golSubiti}</div>
              <div style={{ fontSize: '14px', color: tema.danger, marginTop: '8px', fontWeight: 'bold' }}>
                Tiri: <strong>{tabellino.tiriSubiti}</strong>
              </div>
            </div>
          </div>
        </div>

        <button onClick={saveToDatabase} disabled={saving} style={{
          width: '100%', padding: '20px', background: saved ? tema.success : saving ? '#64748b' : tema.buttonPrimary,
          color: saved ? 'white' : tema.buttonPrimaryText, border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: '900',
          cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '20px',
          boxShadow: saved ? '0 4px 12px rgba(34,197,94,0.4)' : tema.shadow,
          letterSpacing: '0.5px'
        }}>
          {saving ? '⏳ SALVATAGGIO...' : saved ? '✅ SALVATO!' : '💾 SALVA PARTITA'}
        </button>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setShowEditModal(true)} style={{
            flex: 1, padding: '15px', background: tema.info, color: 'white',
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            ✏️ MODIFICA
          </button>
          <button onClick={() => setShowDeleteModal(true)} style={{
            flex: 1, padding: '15px', background: tema.danger, color: 'white',
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            🗑️ ELIMINA
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', color: tema.textOnCard, fontWeight: '900', margin: 0 }}>
              ⚽ TITOLARI {currentPeriod}° ({titolari.length})
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/formazione/${id}`} style={{
                padding: '10px 15px', background: '#8b5cf6', color: 'white',
                borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none'
              }}>👥 Formazione</Link>
              <button onClick={() => setShowSubModal(true)} style={{
                padding: '10px 15px', background: tema.accent1, color: tema.buttonPrimaryText, border: 'none',
                borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
              }}> Sostituzione</button>
            </div>
          </div>

          {titolari.length === 0 ? (
            <div style={{ 
              padding: '30px', 
              background: 'rgba(249,115,22,0.1)', 
              borderRadius: '12px', 
              textAlign: 'center',
              border: `2px solid ${tema.accent1}`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: tema.textOnCard, marginBottom: '10px' }}>
                Nessun titolare selezionato
              </div>
              <div style={{ fontSize: '14px', color: tema.textSecondaryOnCard, marginBottom: '20px' }}>
                Clicca il pulsante qui sotto per scegliere i titolari del {currentPeriod}° tempo
              </div>
              <Link href={`/formazione/${id}`} style={{
                display: 'inline-block',
                padding: '15px 30px',
                background: tema.accent1,
                color: tema.buttonPrimaryText,
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '900'
              }}>
                👥 SELEZIONA FORMAZIONE
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {portieri.map(player => {
                const stats = playerStats[player.id] || { goals: 0, assists: 0, shots: 0, shotsAgainst: 0, goalsAgainst: 0 }
                const minuti = playerMinutes[player.id] || 0
                const isExternal = player.squadra_id !== matchInfo.squadraId
                return (
                  <div key={player.id} style={{
                    background: tema.backgroundCard, borderRadius: '12px', padding: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', border: `1px solid ${isExternal ? '#06b6d4' : tema.borderCard}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', background: isExternal ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : tema.gradientHeader,
                        color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '20px', fontWeight: '900', flexShrink: 0
                      }}>{player.numero_maglia}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: tema.textOnCard }}>{player.nome_completo}</div>
                        <div style={{ fontSize: '14px', color: tema.textSecondaryOnCard }}>
                          {getRuoloIcon(player.ruolo)} {player.ruolo}
                          {isExternal && <span style={{ color: '#06b6d4', marginLeft: '8px', fontSize: '12px' }}>• {player.nome_squadra_provenienza}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(251,191,36,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '5px', fontWeight: 'bold', letterSpacing: '1px' }}>⏱️ MINUTI</div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '8px' }}>{minuti}'</div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => updatePlayerMinutes(player.id, -5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: tema.background,
                          color: '#fbbf24', border: '2px solid #fbbf24', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>−5</button>
                        <button onClick={() => updatePlayerMinutes(player.id, 5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: '#fbbf24',
                          color: '#000000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>+5</button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: tema.danger, marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>🎯 TIRI SUBITI</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '6px' }}>{stats.shotsAgainst}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'shotsAgainst', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.background,
                            color: tema.danger, border: `2px solid ${tema.danger}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'shotsAgainst', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.danger,
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(239,68,68,0.25)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#991b1b', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}> GOL SUBITI</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '6px' }}>{stats.goalsAgainst}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'goalsAgainst', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.background,
                            color: '#991b1b', border: '2px solid #991b1b', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'goalsAgainst', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: '#991b1b',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: tema.success, marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>⚽ RETI</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '6px' }}>{stats.goals}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.background,
                            color: tema.success, border: `2px solid ${tema.success}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.success,
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(59,130,246,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: tema.info, marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>🅰️ ASSIST</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '6px' }}>{stats.assists}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.background,
                            color: tema.info, border: `2px solid ${tema.info}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.info,
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {giocatoriDiMovimento.map(player => {
                const stats = playerStats[player.id] || { goals: 0, assists: 0, shots: 0, shotsAgainst: 0, goalsAgainst: 0 }
                const minuti = playerMinutes[player.id] || 0
                const isExternal = player.squadra_id !== matchInfo.squadraId
                return (
                  <div key={player.id} style={{
                    background: tema.backgroundCard, borderRadius: '12px', padding: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', border: `1px solid ${isExternal ? '#06b6d4' : tema.borderCard}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', background: isExternal ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : tema.gradientHeader,
                        color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '20px', fontWeight: '900', flexShrink: 0
                      }}>{player.numero_maglia}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: tema.textOnCard }}>{player.nome_completo}</div>
                        <div style={{ fontSize: '14px', color: tema.textSecondaryOnCard }}>
                          {getRuoloIcon(player.ruolo)} {player.ruolo}
                          {isExternal && <span style={{ color: '#06b6d4', marginLeft: '8px', fontSize: '12px' }}>• {player.nome_squadra_provenienza}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(251,191,36,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '5px', fontWeight: 'bold', letterSpacing: '1px' }}>⏱️ MINUTI</div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '8px' }}>{minuti}'</div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => updatePlayerMinutes(player.id, -5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: tema.background,
                          color: '#fbbf24', border: '2px solid #fbbf24', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>−5</button>
                        <button onClick={() => updatePlayerMinutes(player.id, 5)} style={{
                          width: '48px', height: '48px', fontSize: '20px', background: '#fbbf24',
                          color: '#000000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
                        }}>+5</button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: tema.success, marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>⚽ RETI</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '6px' }}>{stats.goals}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.background,
                            color: tema.success, border: `2px solid ${tema.success}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'goals', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.success,
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(59,130,246,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: tema.info, marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>🅰️ ASSIST</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '6px' }}>{stats.assists}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.background,
                            color: tema.info, border: `2px solid ${tema.info}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                          <button onClick={() => updatePlayerStat(player.id, 'assists', 1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.info,
                            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(219,39,119,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#db2777', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}> TIRI</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1, marginBottom: '6px' }}>{stats.shots}</div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => updatePlayerStat(player.id, 'shots', -1)} style={{
                            width: '36px', height: '36px', fontSize: '18px', background: tema.background,
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
          )}
        </div>

        {panchina.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', color: tema.textOnCard, fontWeight: '900', marginBottom: '15px' }}>🪑 PANCHINA ({panchina.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {panchina.map(player => {
                const isExternal = player.squadra_id !== matchInfo.squadraId
                return (
                  <div key={player.id} style={{
                    background: tema.backgroundCard, borderRadius: '10px', padding: '12px',
                    border: `1px solid ${isExternal ? '#06b6d4' : tema.borderCard}`, display: 'flex', alignItems: 'center', gap: '12px'
                  }}>
                    <div style={{
                      width: '40px', height: '40px', background: isExternal ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : '#64748b', color: 'white',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '18px', fontWeight: 'bold'
                    }}>{player.numero_maglia}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: tema.textOnCard }}>{player.nome_completo}</div>
                      <div style={{ fontSize: '12px', color: tema.textSecondaryOnCard }}>
                        {getRuoloIcon(player.ruolo)} {player.ruolo}
                        {isExternal && <span style={{ color: '#06b6d4', marginLeft: '8px' }}>• {player.nome_squadra_provenienza}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {sostituzioni.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', color: tema.textOnCard, fontWeight: '900', marginBottom: '15px' }}>🔄 SOSTITUZIONI {currentPeriod}° ({sostituzioni.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sostituzioni.map((sub, index) => {
                const uscente = players.find(p => p.id === sub.giocatore_uscente_id)
                const entrante = players.find(p => p.id === sub.giocatore_entrante_id)
                return (
                  <div key={index} style={{
                    background: 'rgba(249,115,22,0.1)', borderRadius: '10px', padding: '12px',
                    border: `1px solid ${tema.accent1}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: tema.accent1, marginBottom: '4px', fontWeight: 'bold' }}><strong>{sub.minuto_sostituzione}'</strong></div>
                      <div style={{ fontSize: '14px', color: tema.danger }}>❌ {uscente?.nome_completo || 'Sconosciuto'}</div>
                      <div style={{ fontSize: '14px', color: tema.success }}>✅ {entrante?.nome_completo || 'Sconosciuto'}</div>
                    </div>
                    <button onClick={() => rimuoviSostituzione(index)} style={{
                      padding: '8px 12px', background: tema.danger, color: 'white', border: 'none',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                    }}>🗑️</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {showSubModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: tema.backgroundCard, borderRadius: '16px', padding: '25px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: `1px solid ${tema.borderCard}` }}>
            <h2 style={{ color: tema.textOnCard, fontSize: '22px', marginTop: 0, marginBottom: '20px', fontWeight: '900' }}>🔄 Sostituzione {currentPeriod}° Tempo</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard }}>Giocatore che ESCE ❌</label>
              <select value={subUscente} onChange={(e) => setSubUscente(e.target.value)} style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', background: tema.background, color: tema.textOnCard }}>
                <option value="">-- Seleziona --</option>
                {titolari.map(p => <option key={p.id} value={p.id}>#{p.numero_maglia} {p.nome_completo}{p.squadra_id !== matchInfo.squadraId ? ` (${p.nome_squadra_provenienza})` : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard }}>Giocatore che ENTRA ✅</label>
              <select value={subEntrante} onChange={(e) => setSubEntrante(e.target.value)} style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', background: tema.background, color: tema.textOnCard }}>
                <option value="">-- Seleziona --</option>
                {panchina.map(p => <option key={p.id} value={p.id}>#{p.numero_maglia} {p.nome_completo}{p.squadra_id !== matchInfo.squadraId ? ` (${p.nome_squadra_provenienza})` : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard }}>Minuto ⏱️</label>
              <input type="number" min="1" max="30" step="5" value={subMinuto} onChange={(e) => setSubMinuto(e.target.value)} placeholder="es. 15" style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', background: tema.background, color: tema.textOnCard }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowSubModal(false); setSubUscente(''); setSubEntrante(''); setSubMinuto('') }} style={{ flex: 1, padding: '14px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Annulla</button>
              <button onClick={aggiungiSostituzione} style={{ flex: 2, padding: '14px', background: tema.accent1, color: tema.buttonPrimaryText, border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>✓ Conferma</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: tema.backgroundCard, borderRadius: '16px', padding: '25px', maxWidth: '500px', width: '100%', border: `1px solid ${tema.borderCard}` }}>
            <h2 style={{ color: tema.textOnCard, fontSize: '22px', marginTop: 0, marginBottom: '20px', fontWeight: '900' }}>✏️ Modifica Partita</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard }}>Avversario *</label>
              <input type="text" value={editForm.avversario} onChange={(e) => setEditForm({...editForm, avversario: e.target.value})} style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', background: tema.background, color: tema.textOnCard }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard }}>Luogo</label>
              <input type="text" value={editForm.luogo} onChange={(e) => setEditForm({...editForm, luogo: e.target.value})} placeholder="es. Campo Comunale" style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', background: tema.background, color: tema.textOnCard }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard }}>Data *</label>
              <input type="date" value={editForm.data_gara} onChange={(e) => setEditForm({...editForm, data_gara: e.target.value})} style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', background: tema.background, color: tema.textOnCard }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '14px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Annulla</button>
              <button onClick={salvaModifiche} style={{ flex: 2, padding: '14px', background: tema.info, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>💾 SALVA MODIFICHE</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: tema.backgroundCard, borderRadius: '16px', padding: '25px', maxWidth: '500px', width: '100%', border: `1px solid ${tema.borderCard}` }}>
            <h2 style={{ color: tema.danger, fontSize: '22px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>⚠️ Elimina Partita</h2>
            <p style={{ color: tema.textSecondaryOnCard, fontSize: '16px', marginBottom: '20px', lineHeight: '1.5' }}>
              Questa azione eliminerà <strong>definitivamente</strong> la partita e tutte le statistiche associate.
            </p>
            <p style={{ color: tema.danger, fontWeight: 'bold', marginBottom: '20px' }}>Questa azione NON può essere annullata.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} style={{ flex: 1, padding: '14px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: deleting ? 'not-allowed' : 'pointer' }}>Annulla</button>
              <button onClick={eliminaPartita} disabled={deleting} style={{ flex: 2, padding: '14px', background: deleting ? '#64748b' : tema.danger, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: deleting ? 'not-allowed' : 'pointer' }}>{deleting ? '⏳ ELIMINAZIONE...' : '🗑️ ELIMINA DEFINITIVAMENTE'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
