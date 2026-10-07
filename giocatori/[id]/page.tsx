'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ModificaGiocatorePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    numero_maglia: '',
    nome_completo: '',
    ruolo: 'C'
  })

  useEffect(() => {
    const squadraId = localStorage.getItem('squadra_selezionata_id')
    const squadraNome = localStorage.getItem('squadra_selezionata_nome')

    if (!squadraId) {
      router.push('/')
      return
    }

    setSquadraInfo({
      id: squadraId,
      nome: squadraNome || ''
    })

    const loadGiocatore = async () => {
      const { data, error } = await supabase
        .from('giocatori')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        setError('Giocatore non trovato')
        setLoading(false)
        return
      }

      if (data) {
        setFormData({
          numero_maglia: data.numero_maglia.toString(),
          nome_completo: data.nome_completo,
          ruolo: data.ruolo || 'C'
        })
      }
      setLoading(false)
    }
    loadGiocatore()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!formData.numero_maglia) {
      setError('Inserisci il numero di maglia')
      setSaving(false)
      return
    }
    if (!formData.nome_completo.trim()) {
      setError('Inserisci il nome completo')
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('giocatori')
        .update({
          numero_maglia: parseInt(formData.numero_maglia),
          nome_completo: formData.nome_completo.trim(),
          ruolo: formData.ruolo
        })
        .eq('id', id)

      if (error) throw error

      router.push('/giocatori')
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '18px' }}>Caricamento...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/giocatori" style={{ marginRight: '15px', fontSize: '24px', textDecoration: 'none', color: '#1e3a8a' }}>←</Link>
          <h1 style={{ color: '#1e3a8a', fontSize: '24px', margin: 0 }}>Modifica Giocatore</h1>
        </div>

        {/* Info squadra */}
        <div style={{
          padding: '15px',
          background: '#dbeafe',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #93c5fd'
        }}>
          <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>SQUADRA</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>
            {squadraInfo.nome}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Numero Maglia */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
              Numero Maglia *
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={formData.numero_maglia}
              onChange={(e) => setFormData({...formData, numero_maglia: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
              required
            />
          </div>

          {/* Nome Completo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome_completo}
              onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
              required
            />
          </div>

          {/* Ruolo */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
              Ruolo *
            </label>
            <select
              value={formData.ruolo}
              onChange={(e) => setFormData({...formData, ruolo: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', background: 'white' }}
            >
              <option value="P">🧤 Portiere</option>
              <option value="D">🛡️ Difensore</option>
              <option value="C">🎽 Centrocampista</option>
              <option value="A">🎯 Attaccante</option>
            </select>
          </div>

          {/* Pulsanti */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/giocatori" style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#1e293b', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }}>
              Annulla
            </Link>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 2, padding: '14px', background: saving ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Salvataggio...' : '💾 SALVA MODIFICHE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
