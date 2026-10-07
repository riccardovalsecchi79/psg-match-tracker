'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function NuovoGiocatorePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '' })
  const [loading, setLoading] = useState(false)
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
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.numero_maglia) {
      setError('Inserisci il numero di maglia')
      setLoading(false)
      return
    }
    if (!formData.nome_completo.trim()) {
      setError('Inserisci il nome completo')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('giocatori')
        .insert({
          squadra_id: squadraInfo.id,
          numero_maglia: parseInt(formData.numero_maglia),
          nome_completo: formData.nome_completo.trim(),
          ruolo: formData.ruolo
        })

      if (error) throw error

      router.push('/giocatori')
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/giocatori" style={{ marginRight: '15px', fontSize: '24px', textDecoration: 'none', color: '#1e3a8a' }}>←</Link>
          <h1 style={{ color: '#1e3a8a', fontSize: '24px', margin: 0 }}>Nuovo Giocatore</h1>
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
              placeholder="es. 10"
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
              placeholder="es. Mario Rossi"
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
              <option value="A"> Attaccante</option>
            </select>
          </div>

          {/* Pulsanti */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/giocatori" style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#1e293b', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }}>
              Annulla
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 2, padding: '14px', background: loading ? '#94a3b8' : '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Salvataggio...' : '✓ AGGIUNGI GIOCATORE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
