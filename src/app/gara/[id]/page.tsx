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
  const [squadraNome, setSquadraNome] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: match } = await supabase
        .from('gare')
        .select('*, squadre(nome_squadra)')
        .eq('id', id)
        .single()
      
      if (match) {
        setScores({ home: match.risultato_casa || 0, away: match.risultato_ospite || 0 })
        if (match.squadre) setSquadraNome(match.squadre.nome_squadra)
        
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F2F2F7', paddingBottom: '100px' }}>
      
      {/* Header sticky */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(242, 242, 247, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <Link href="/dashboard" style={{
            color: '#007AFF',
            textDecoration: 'none',
            fontSize: '17px',
            fontWeight: '400',
            marginRight: '8px',
          }}>
            ← Indietro
          </Link>
        </div>
        <h1 style={{
          fontSize: '1
