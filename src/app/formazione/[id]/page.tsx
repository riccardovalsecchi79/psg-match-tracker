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
}

export default function FormazionePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '' })
  const [giocatori, setGiocatori] = useState<Giocatore[]>([])
  const [titolari, setTitolari] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const squadraId = localStorage.getItem('squadra_selezionata_id')
    const squadraNome = localStorage.getItem('squadra_selezionata_nome')

    if (!squadraId) { router.push('/'); return }
    setSquadraInfo({ id: squadraId, nome: squadraNome || '' })

    const loadData = async () => {
      const { data: giocatoriData } = await supabase
        .from('giocatori')
        .select('*')
        .eq('squadra_id', squadraId)
        .order('numero_maglia')
      if (giocatoriData) setGiocatori(giocatoriData as Giocatore[])

      const { data: formazioni } = await supabase
        .from('formazioni')
        .select('giocatore_id')
        .eq('gara_id', id)
        .eq('titolare', true)
      if (formazioni) setTitolari(new Set(formazioni.map(f => f.giocatore_id)))
    }
    loadData()
  }, [id, router])

  const toggleTitolare = (giocatoreId: string) => {
    setTitolari(prev => {
      const newSet = new Set(prev)
      if (newSet.has(giocatoreId)) newSet.delete(giocatoreId)
      else newSet.add(giocatoreId)
      return newSet
    })
    setSaved(false)
  }

  const salvaFormazione = async () => {
    setSaving(true); setSaved(false)
    try {
      await supabase.from('formazioni').delete().eq('gara_id', id)
      if (titolari.size > 0) {
        const { error } = await supabase
          .from('formazioni')
          .insert(Array.from(titolari).map(giocatoreId => ({
            gara_id: id, giocatore_id: giocatoreId, titolare: true
          })))
        if (error) throw error
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore nel salvataggio')
    } finally { setSaving(false) }
  }

  const getRuoloIcon = (ruolo: string) => {
    switch (ruolo) { case 'P': return '🧤'; case 'D': return '🛡️'; case 'C': return '🎽'; case 'A': return '🎯'; default: return '' }
  }

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {giocatori.map(giocatore => {
            const isTitolare = titolari.has(giocatore.id)
            return (
              <button key={giocatore.id} onClick={() => toggleTitolare(giocatore.id)} style={{
                display: 'flex', alignItems: 'center', padding: '15px',
                background: isTitolare ? '#dbeafe' : 'white',
                border: isTitolare ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%'
              }}>
                <div style={{
                  width: '48px', height: '48px',
                  background: isTitolare ? '#3b82f6' : '#e2e8f0',
                  color: isTitolare ? 'white' : '#64748b',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', marginRight: '15px', flexShrink: 0
                }}>{giocatore.numero_maglia}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{giocatore.nome_completo}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{getRuoloIcon(giocatore.ruolo)} {giocatore.ruolo}</div>
                </div>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isTitolare ? '#3b82f6' : 'white',
                  border: `3px solid ${isTitolare ? '#3b82f6' : '#cbd5e1'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '18px', fontWeight: 'bold'
                }}>{isTitolare ? '✓' : ''}</div>
              </button>
            )
          })}
        </div>

        <button onClick={salvaFormazione} disabled={saving || titolari.size < 7} style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)', maxWidth: '760px', padding: '20px',
          background: saved ? '#22c55e' : saving || titolari.size < 7 ? '#94a3b8' : '#1e3a8a',
          color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px',
          fontWeight: 'bold', cursor: saving || titolari.size < 7 ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100
        }}>
          {saving ? '⏳ SALVATAGGIO...' : saved ? '✅ FORMAZIONE SALVATA!' : `💾 SALVA FORMAZIONE (${titolari.size} titolari)`}
        </button>
      </div>
    </div>
  )
}
