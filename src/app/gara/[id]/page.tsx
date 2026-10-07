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
      // Carica la gara
      const { data: match } = await supabase
        .from('gare')
        .select('*')
        .eq('id', id)
        .single()
      
      if (match) {
        setScores({ home: match.risultato_casa || 0, away: match.risultato_ospite || 0 })
        
        // Carica nome squadra
        if (match.squadra_id) {
          const { data: squadra } = await supabase
            .from('squadre')
            .select('nome_squadra')
            .eq('id', match.squadra_id)
            .single()
          if (squadra) setSquadraNome(squadra.nome_squadra)
        }
        
        // Carica giocatori
        if (match.squadra_id) {
          const { data: playersData } = await supabase
            .from('giocatori')
            .select('*')
            .eq('squadra_id', match.squadra_id)
            .order('numero_maglia')
          if (playersData) setPlayers(playersData)
        }
        
        // Carica tempi
        const { data: tempi } = await supabase
          .from('tempi_gara')
          .select('*')
          .eq('gara_id', id)
        
        if (tempi && tempi.length > 0) {
          const tempoCorrente = tempi.find((t: any) => t.numero_tempo === 1) || tempi[0]
          setShots({ for: tempoCorrente.tiri_effettuati || 0, against: tempoCorrente.tiri_subiti || 0 })
          
          const { data: azioni } = await supabase
            .from('azioni_gioco')
            .select('*')
            .eq('tempo_id', tempoCorrente.id)
          
          if (azioni) {
            const stats: Record<string, {goals: number, assists: number}> = {}
            azioni.forEach((a: any) => {
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
      
     
