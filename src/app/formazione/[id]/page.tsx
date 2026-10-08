'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { getTema, TEMI } from '@/lib/theme'

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

// Estrae l'anno dal nome squadra (es. "2014 A" → "2014", "2016/17 Mista" → "2016/17")
function estraiAnno(nomeSquadra: string): string {
  const match = nomeSquadra.trim().match(/^(\d{4}(?:\/\d{2})?)/)
  return match ? match[1] : ''
}

export default function FormazionePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [tema, setTema] = useState(TEMI.team)
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [tutteSquadre, setTutteSquadre] = useState<Squadra[]>([])
  const [tuttiGiocatori, setTuttiGiocatori] = useState<Giocatore[]>([])
  const [squadraSelezionataExtra, setSquadraSelezionataExtra] = useState('')
  const [tempoSelezionato, setTempoSelezionato] = useState(1)
  const [titolari, setTitolari] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [squadreCompatibili, setSquadreCompatibili] = useState<Squadra[]>([])

  useEffect(() => {
    setTema(getTema())
    
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
        const { data: squadreData } = await supabase
          .from('squadre')
          .select('*')
          .order('categoria', { ascending: true })
        
        if (squadreData) {
          setTutteSquadre(squadreData as Squadra[])
          
          // Filtra solo squadre della stessa annata (esclusa la squadra corrente)
          const annoCorrente = estraiAnno(squadraNome || '')
          const compatibili = (squadreData as Squadra[]).filter(s => 
            s.id !== squadraId && estraiAnno(s.nome_squadra) === annoCorrente
          )
          setSquadreCompatibili(compatibili)
          
          if (compatibili.length > 0) {
            setSquadraSelezionataExtra(compatibili[0].id)
          }
        }

        const { data: giocatoriData } = await supabase
          .from('giocatori')
          .select('*, squadre(nome_squadra)')
          .order('numero_maglia', { ascending: true })
        
        if (giocatoriData) {
          const giocatoriConSquadra = giocatoriData.map(g => ({
            ...g,
            nome_squadra: (g as any).squadre?.nome_squadra || ''
          }))
          setTuttiGiocatori(giocatoriConSquadra as Giocatore[])
        }

        await caricaTitolari(1)
      } catch (error) {
        console.error('Errore generale:', error)
      }
    }
    loadData()
  }, [id, router])

  const caricaTitolari = async (tempo: number) => {
    try {
      const { data: formazioni } = await supabase
        .from('formazioni')
        .select('giocatore_id')
        .eq('gara_id', id)
        .eq('numero_tempo', tempo)
        .eq('titolare', true)
      
      if (formazioni) {
        setTitolari(new Set(formazioni.map(f => f.giocatore_id)))
      } else {
        setTitolari(new Set())
      }
    } catch (error) {
      console.error('Errore:', error)
    }
  }

  const cambiaTempo = async (tempo: number) => {
    setTempoSelezionato(tempo)
    setSaved(false)
    setErrorMessage('')
    await caricaTitolari(tempo)
  }

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

  const copiaDaAltroTempo = async (tempoOrigine: number) => {
    if (tempoOrigine === tempoSelezionato) return
    
    const { data, error } = await supabase
      .from('formazioni')
      .select('giocatore_id')
      .eq('gara_id', id)
      .eq('numero_tempo', tempoOrigine)
      .eq('titolare', true)
    
    if (error) {
      console.error('Errore copia:', error)
      alert('Errore nel copiare la formazione')
      return
    }
    
    if (data) {
      setTitolari(new Set(data.map(f => f.giocatore_id)))
      setSaved(false)
      alert(`✅ Formazione del ${tempoOrigine}° tempo copiata!`)
    }
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
      const { error: deleteError } = await supabase
        .from('formazioni')
        .delete()
        .eq('gara_id', id)
        .eq('numero_tempo', tempoSelezionato)
      
      if (deleteError) throw new Error('Errore eliminazione: ' + deleteError.message)

      if (titolari.size > 0) {
        const formazioniData = Array.from(titolari).map(giocatoreId => ({
          gara_id: id,
          giocatore_id: giocatoreId,
          numero_tempo: tempoSelezionato,
          titolare: true
        }))

        const { error: insertError } = await supabase
          .from('formazioni')
          .insert(formazioniData)
        
        if (insertError) throw new Error('Errore inserimento: ' + insertError.message)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      setErrorMessage(errorMessage)
      alert('Errore nel salvataggio: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const getRuoloIcon = (ruolo: string) => {
    switch (ruolo) { case 'P': return '🧤'; case 'D': return '️'; case 'C': return ''; case 'A': return '🎯'; default: return '' }
  }

  const getRuoloLabel = (ruolo: string) => {
    switch (ruolo) { case 'P': return 'Portiere'; case 'D': return 'Difensore'; case 'C': return 'Centrocampista'; case 'A': return 'Attaccante'; default: return ruolo }
  }

  const giocatoriSquadraPrincipale = tuttiGiocatori.filter(g => g.squadra_id === squadraInfo.id)
  const giocatoriSquadraExtra = tuttiGiocatori.filter(g => g.squadra_id === squadraSelezionataExtra)
  const nomeSquadraExtra = tutteSquadre.find(s => s.id === squadraSelezionataExtra)?.nome_squadra || ''

  return (
    <div style={{ minHeight: '100vh', background: tema.background, padding: '20px', paddingBottom: '120px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link href={`/gara/${id}`} style={{ marginRight: '15px', fontSize: '24px', textDecoration: 'none', color: tema.accent1 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: tema.textPrimary, fontSize: '24px', margin: 0, fontWeight: '900' }}>Formazione Titolare</h1>
            <p style={{ color: tema.textSecondary, fontSize: '14px', margin: '5px 0 0 0' }}>{squadraInfo.nome}</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: tema.textSecondary, marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>
            SELEZIONA IL TEMPO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[1, 2, 3, 4].map(t => (
              <button
                key={t}
                onClick={() => cambiaTempo(t)}
                style={{
                  padding: '12px',
                  background: tempoSelezionato === t ? tema.accent1 : tema.backgroundCard,
                  color: tempoSelezionato === t ? tema.buttonPrimaryText : tema.textOnCard,
                  border: `2px solid ${tempoSelezionato === t ? tema.accent1 : tema.borderCard}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '900'
                }}
              >
                {t}° Tempo
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: tema.textSecondary, marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>
            📋 COPIA FORMAZIONE DA:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[1, 2, 3, 4].filter(t => t !== tempoSelezionato).map(t => (
              <button
                key={t}
                onClick={() => copiaDaAltroTempo(t)}
                style={{
                  padding: '10px',
                  background: tema.accent1,
                  color: tema.buttonPrimaryText,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {t}° Tempo
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div style={{
            padding: '15px', background: 'rgba(239,68,68,0.15)', border: `2px solid ${tema.danger}`,
            borderRadius: '10px', marginBottom: '20px', textAlign: 'center',
            color: tema.danger, fontWeight: 'bold'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div style={{
          padding: '15px', background: titolari.size >= 7 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          borderRadius: '10px', marginBottom: '20px', textAlign: 'center',
          border: `2px solid ${titolari.size >= 7 ? tema.success : tema.danger}`
        }}>
          <div style={{ fontSize: '14px', color: tema.textSecondaryOnCard, marginBottom: '5px', letterSpacing: '1px' }}>
            TITOLARI {tempoSelezionato}° TEMPO
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: titolari.size >= 7 ? tema.success : tema.danger }}>
            {titolari.size}
          </div>
          <div style={{ fontSize: '12px', color: tema.textSecondaryOnCard, marginTop: '5px' }}>
            {titolari.size >= 7 ? '✅ Formazione completa' : '⚠️ Servono almeno 7 titolari'}
          </div>
        </div>

        {/* SEZIONE 1: GIOCATORI DELLA SQUADRA PRINCIPALE */}
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '18px', color: tema.textPrimary, fontWeight: '900', marginBottom: '12px', paddingBottom: '8px', borderBottom: `2px solid ${tema.accent1}` }}>
            ⚽ {squadraInfo.nome} ({giocatoriSquadraPrincipale.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {giocatoriSquadraPrincipale.map(giocatore => {
              const isTitolare = titolari.has(giocatore.id)
              return (
                <button key={giocatore.id} onClick={() => toggleTitolare(giocatore.id)} style={{
                  display: 'flex', alignItems: 'center', padding: '12px',
                  background: isTitolare ? 'rgba(249,115,22,0.2)' : tema.backgroundCard,
                  border: isTitolare ? `2px solid ${tema.accent1}` : `2px solid ${tema.borderCard}`,
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%'
                }}>
                  <div style={{
                    width: '44px', height: '44px',
                    background: isTitolare ? tema.accent1 : '#64748b',
                    color: isTitolare ? tema.buttonPrimaryText : 'white',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', fontWeight: '900', marginRight: '12px', flexShrink: 0
                  }}>{giocatore.numero_maglia}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: tema.textOnCard }}>{giocatore.nome_completo}</div>
                    <div style={{ fontSize: '12px', color: tema.textSecondaryOnCard, marginTop: '2px' }}>{getRuoloIcon(giocatore.ruolo)} {getRuoloLabel(giocatore.ruolo)}</div>
                  </div>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: isTitolare ? tema.accent1 : 'transparent',
                    border: `3px solid ${isTitolare ? tema.accent1 : tema.borderCard}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tema.buttonPrimaryText, fontSize: '16px', fontWeight: 'bold'
                  }}>{isTitolare ? '✓' : ''}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SEZIONE 2: GIOCATORI DI ALTRE SQUADRE DELLA STESSA ANNATA */}
        {squadreCompatibili.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', color: '#06b6d4', fontWeight: '900', margin: 0, flex: 1 }}>
                🔄 Altra squadra della stessa annata
              </h2>
              <select value={squadraSelezionataExtra} onChange={(e) => setSquadraSelezionataExtra(e.target.value)} style={{
                padding: '10px', border: '2px solid #06b6d4', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold',
                background: tema.backgroundCard, color: tema.textOnCard, cursor: 'pointer'
              }}>
                {squadreCompatibili.map(s => (
                  <option key={s.id} value={s.id}>{s.nome_squadra} ({s.categoria})</option>
                ))}
              </select>
            </div>

            {giocatoriSquadraExtra.length === 0 ? (
              <div style={{ padding: '15px', background: 'rgba(6,182,212,0.1)', borderRadius: '10px', textAlign: 'center', color: tema.textOnCard, border: '1px solid rgba(6,182,212,0.3)' }}>
                Nessun giocatore disponibile per {nomeSquadraExtra}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {giocatoriSquadraExtra.map(giocatore => {
                  const isTitolare = titolari.has(giocatore.id)
                  return (
                    <button key={giocatore.id} onClick={() => toggleTitolare(giocatore.id)} style={{
                      display: 'flex', alignItems: 'center', padding: '12px',
                      background: isTitolare ? 'rgba(6,182,212,0.2)' : tema.backgroundCard,
                      border: isTitolare ? '2px solid #06b6d4' : `2px solid ${tema.borderCard}`,
                      borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%'
                    }}>
                      <div style={{
                        width: '44px', height: '44px',
                        background: isTitolare ? '#06b6d4' : '#64748b',
                        color: 'white',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '18px', fontWeight: '900', marginRight: '12px', flexShrink: 0
                      }}>{giocatore.numero_maglia}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: tema.textOnCard }}>{giocatore.nome_completo}</div>
                        <div style={{ fontSize: '12px', color: tema.textSecondaryOnCard, marginTop: '2px' }}>
                          {getRuoloIcon(giocatore.ruolo)} {getRuoloLabel(giocatore.ruolo)} • {giocatore.nome_squadra}
                        </div>
                      </div>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: isTitolare ? '#06b6d4' : 'transparent',
                        border: `3px solid ${isTitolare ? '#06b6d4' : tema.borderCard}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '16px', fontWeight: 'bold'
                      }}>{isTitolare ? '✓' : ''}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <button 
          onClick={salvaFormazione} 
          disabled={saving || titolari.size < 7} 
          style={{
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)', maxWidth: '760px', padding: '20px',
            background: saved ? tema.success : saving || titolari.size < 7 ? '#64748b' : tema.accent1,
            color: saved ? 'white' : tema.buttonPrimaryText, border: 'none', borderRadius: '12px', fontSize: '18px',
            fontWeight: '900', cursor: saving || titolari.size < 7 ? 'not-allowed' : 'pointer',
            boxShadow: tema.shadow, zIndex: 100, letterSpacing: '0.5px'
          }}
        >
          {saving ? '⏳ SALVATAGGIO...' : saved ? '✅ FORMAZIONE SALVATA!' : `💾 SALVA FORMAZIONE ${tempoSelezionato}° TEMPO (${titolari.size} titolari)`}
        </button>
      </div>
    </div>
  )
}
