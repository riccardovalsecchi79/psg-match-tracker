'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Giocatore {
  id: string
  numero_maglia: number
  nome_completo: string
  ruolo: string
  squadra_id: string
  nome_squadra?: string
}

interface Squadra {
  id: string
  nome_squadra: string
  categoria: string
}

export default function FormazionePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [tutteSquadre, setTutteSquadre] = useState<Squadra[]>([])
  const [tuttiGiocatori, setTuttiGiocatori] = useState<Giocatore[]>([])
  const [squadraSelezionataExtra, setSquadraSelezionataExtra] = useState('')
  const [titolari, setTitolari] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const squadraId = localStorage.getItem('squadra_selezionata_id')
    const squadraNome = localStorage.getItem('squadra_selezionata_nome')
    const squadraCategoria = localStorage.getItem('squadra_selezionata_categoria')

    if (!squadraId) { router.push('/'); return }
    
    setSquadraInfo({ 
      id: squadraId, 
      nome: squadraNome || '', 
      categoria: squadraCategoria || '' 
    })

    const loadData = async () => {
      try {
        // Carica tutte le squadre della società
        const { data: squadreData, error: squadreError } = await supabase
          .from('squadre')
          .select('*')
          .order('categoria', { ascending: true })
        
        if (squadreError) {
          console.error('Errore caricamento squadre:', squadreError)
          return
        }
        
        if (squadreData) {
          setTutteSquadre(squadreData as Squadra[])
          const altraSquadra = squadreData.find(s => s.id !== squadraId)
          if (altraSquadra) setSquadraSelezionataExtra(altraSquadra.id)
        }

        // Carica TUTTI i giocatori di TUTTE le squadre
        const { data: giocatoriData, error: giocatoriError } = await supabase
          .from('giocatori')
          .select('*, squadre(nome_squadra)')
          .order('numero_maglia', { ascending: true })
        
        if (giocatoriError) {
          console.error('Errore caricamento giocatori:', giocatoriError)
          return
        }
        
        if (giocatoriData) {
          const giocatoriConSquadra = giocatoriData.map(g => ({
            ...g,
            nome_squadra: (g as any).squadre?.nome_squadra || ''
          }))
          setTuttiGiocatori(giocatoriConSquadra as Giocatore[])
        }

        // Carica titolari esistenti
        const { data: formazioni, error: formazioniError } = await supabase
          .from('formazioni')
          .select('giocatore_id')
          .eq('gara_id', id)
          .eq('titolare', true)
        
        if (formazioniError) {
          console.error('Errore caricamento formazioni:', formazioniError)
          return
        }
        
        if (formazioni) {
          setTitolari(new Set(formazioni.map(f => f.giocatore_id)))
        }
      } catch (error) {
        console.error('Errore generale nel caricamento:', error)
      }
    }
    loadData()
  }, [id, router])

  const toggleTitolare = (giocatoreId: string) => {
    setTitolari(prev => {
      const newSet = new Set(prev)
      if (newSet.has(giocatoreId)) {
        newSet.delete(giocatoreId)
      } else {
        newSet.add(giocatoreId)
      }
      return newSet
    })
    setSaved(false)
    setErrorMessage('')
  }

  const salvaFormazione = async () => {
    if (titolari.size < 7) {
      setErrorMessage('Devi selezionare almeno 7 titolari')
      return
    }

    setSaving(true)
    setSaved(false)
    setErrorMessage('')
    
    try {
      console.log('Inizio salvataggio formazione per gara:', id)
      console.log('Titolari selezionati:', Array.from(titolari))

      // 1. Elimina formazioni esistenti
      const { error: deleteError } = await supabase
        .from('formazioni')
        .delete()
        .eq('gara_id', id)
      
      if (deleteError) {
        console.error('Errore eliminazione formazioni:', deleteError)
        throw new Error('Errore durante l\'eliminazione delle formazioni esistenti: ' + deleteError.message)
      }

      // 2. Inserisci nuovi titolari
      if (titolari.size > 0) {
        const formazioniData = Array.from(titolari).map(giocatoreId => ({
          gara_id: id,
          giocatore_id: giocatoreId,
          titolare: true
        }))

        console.log('Dati da inserire:', formazioniData)

        const { error: insertError } = await supabase
          .from('formazioni')
          .insert(formazioniData)
        
        if (insertError) {
          console.error('Errore inserimento formazioni:', insertError)
          throw new Error('Errore durante il salvataggio: ' + insertError.message)
        }
      }

      console.log('Formazione salvata con successo!')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Errore completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      setErrorMessage(errorMessage)
      alert('Errore nel salvataggio: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const getRuoloIcon = (ruolo: string) => {
    switch (ruolo) { case 'P': return '🧤'; case 'D': return '🛡️'; case 'C': return '🎽'; case 'A': return '🎯'; default: return '' }
  }

  const getRuoloLabel = (ruolo: string) => {
    switch (ruolo) { case 'P': return 'Portiere'; case 'D': return 'Difensore'; case 'C': return 'Centrocampista'; case 'A': return 'Attaccante'; default: return ruolo }
  }

  // Giocatori della squadra principale
  const giocatoriSquadraPrincipale = tuttiGiocatori.filter(g => g.squadra_id === squadraInfo.id)
  
  // Giocatori della squadra extra selezionata
  const giocatoriSquadraExtra = tuttiGiocatori.filter(g => g.squadra_id === squadraSelezionataExtra)
  const nomeSquadraExtra = tutteSquadre.find(s => s.id === squadraSelezionataExtra)?.nome_squadra || ''

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link href={`/gara/${id}`} style={{ marginRight: '15px', fontSize: '24px', textDecoration: 'none', color: '#1e3a8a' }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#1e3a8a', fontSize: '24px', margin: 0 }}>Formazione Titolare</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '5px 0 0 0' }}>{squadraInfo.nome}</p>
          </div>
        </div>

        {errorMessage && (
          <div style={{
            padding: '15px',
            background: '#fee2e2',
            border: '2px solid #dc2626',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#dc2626',
            fontWeight: 'bold'
          }}>
             {errorMessage}
          </div>
        )}

        <div style={{
          padding: '15px', background: titolari.size >= 7 ? '#dcfce7' : '#fee2e2',
          borderRadius: '10px', marginBottom: '20px', textAlign: 'center',
          border: `2px solid ${titolari.size >= 7 ? '#22c55e' : '#dc2626'}`
        }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>TITOLARI SELEZIONATI</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: titolari.size >= 7 ? '#16a34a' : '#dc2626' }}>{titolari.size}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            {titolari.size >= 7 ? '✅ Formazione completa' : '⚠️ Servono almeno 7 titolari'}
          </div>
        </div>

        {/* SEZIONE 1: GIOCATORI DELLA SQUADRA PRINCIPALE */}
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '18px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #1e3a8a' }}>
            ⚽ {squadraInfo.nome} ({giocatoriSquadraPrincipale.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {giocatoriSquadraPrincipale.map(giocatore => {
              const isTitolare = titolari.has(giocatore.id)
              return (
                <button key={giocatore.id} onClick={() => toggleTitolare(giocatore.id)} style={{
                  display: 'flex', alignItems: 'center', padding: '12px',
                  background: isTitolare ? '#dbeafe' : 'white',
                  border: isTitolare ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%'
                }}>
                  <div style={{
                    width: '44px', height: '44px',
                    background: isTitolare ? '#3b82f6' : '#e2e8f0',
                    color: isTitolare ? 'white' : '#64748b',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', marginRight: '12px', flexShrink: 0
                  }}>{giocatore.numero_maglia}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{giocatore.nome_completo}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{getRuoloIcon(giocatore.ruolo)} {getRuoloLabel(giocatore.ruolo)}</div>
                  </div>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: isTitolare ? '#3b82f6' : 'white',
                    border: `3px solid ${isTitolare ? '#3b82f6' : '#cbd5e1'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '16px', fontWeight: 'bold'
                  }}>{isTitolare ? '✓' : ''}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SEZIONE 2: GIOCATORI DI ALTRE SQUADRE */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '18px', color: '#f97316', fontWeight: 'bold', margin: 0, flex: 1 }}>
              🔄 Giocatori di altre squadre
            </h2>
            <select value={squadraSelezionataExtra} onChange={(e) => setSquadraSelezionataExtra(e.target.value)} style={{
              padding: '10px', border: '2px solid #f97316', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold',
              background: 'white', color: '#1e293b', cursor: 'pointer'
            }}>
              {tutteSquadre.filter(s => s.id !== squadraInfo.id).map(s => (
                <option key={s.id} value={s.id}>{s.nome_squadra} ({s.categoria})</option>
              ))}
            </select>
          </div>

          {giocatoriSquadraExtra.length === 0 ? (
            <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '10px', textAlign: 'center', color: '#92400e' }}>
              Nessun giocatore disponibile per {nomeSquadraExtra}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {giocatoriSquadraExtra.map(giocatore => {
                const isTitolare = titolari.has(giocatore.id)
                return (
                  <button key={giocatore.id} onClick={() => toggleTitolare(giocatore.id)} style={{
                    display: 'flex', alignItems: 'center', padding: '12px',
                    background: isTitolare ? '#ffedd5' : 'white',
                    border: isTitolare ? '2px solid #f97316' : '2px solid #e2e8f0',
                    borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%'
                  }}>
                    <div style={{
                      width: '44px', height: '44px',
                      background: isTitolare ? '#f97316' : '#e2e8f0',
                      color: isTitolare ? 'white' : '#64748b',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', marginRight: '12px', flexShrink: 0
                    }}>{giocatore.numero_maglia}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{giocatore.nome_completo}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {getRuoloIcon(giocatore.ruolo)} {getRuoloLabel(giocatore.ruolo)} • {giocatore.nome_squadra}
                      </div>
                    </div>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: isTitolare ? '#f97316' : 'white',
                      border: `3px solid ${isTitolare ? '#f97316' : '#cbd5e1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '16px', fontWeight: 'bold'
                    }}>{isTitolare ? '✓' : ''}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button 
          onClick={salvaFormazione} 
          disabled={saving || titolari.size < 7} 
          style={{
            position: 'fixed', 
            bottom: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)', 
            maxWidth: '760px', 
            padding: '20px',
            background: saved ? '#22c55e' : saving || titolari.size < 7 ? '#94a3b8' : '#1e3a8a',
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            fontSize: '18px',
            fontWeight: 'bold', 
            cursor: saving || titolari.size < 7 ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', 
            zIndex: 100
          }}
        >
          {saving ? '⏳ SALVATAGGIO...' : saved ? '✅ FORMAZIONE SALVATA!' : `💾 SALVA FORMAZIONE (${titolari.size} titolari)`}
        </button>
      </div>
    </div>
  )
}
