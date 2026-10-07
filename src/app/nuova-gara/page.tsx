'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Squadra {
  id: string
  nome_squadra: string
  categoria: string
}

export default function NuovaGaraPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [squadre, setSquadre] = useState<Squadra[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    squadra_id: '',
    avversario: '',
    data_gara: new Date().toISOString().split('T')[0],
    luogo: '',
    stato: 'programmata'
  })

  // Carica le squadre disponibili
  useEffect(() => {
    const loadSquadre = async () => {
      const { data, error } = await supabase
        .from('squadre')
        .select('*')
        .order('nome_squadra')
      
      if (!error && data) {
        setSquadre(data as Squadra[])
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, squadra_id: data[0].id }))
        }
      }
    }
    loadSquadre()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.squadra_id) {
      setError('Seleziona una squadra')
      setLoading(false)
      return
    }
    if (!formData.avversario.trim()) {
      setError('Inserisci il nome dell\'avversario')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('gare')
        .insert({
          squadra_id: formData.squadra_id,
          avversario: formData.avversario.trim(),
          data_gara: formData.data_gara,
          luogo: formData.luogo.trim() || null,
          stato: formData.stato,
          risultato_casa: 0,
          risultato_ospite: 0
        })
        .select()
        .single()

      if (error) throw error

      // Reindirizza alla pagina della nuova gara
      router.push(`/gara/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione')
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <Link 
            href="/"
            style={{
              marginRight: '15px',
              fontSize: '24px',
              textDecoration: 'none',
              color: '#1e3a8a'
            }}
          >
            ←
          </Link>
          <h1 style={{ 
            color: '#1e3a8a', 
            fontSize: '24px',
            margin: 0
          }}>
            Nuova Partita
          </h1>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit}
          style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Squadra */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#1e293b',
              fontSize: '14px'
            }}>
              Squadra *
            </label>
            <select
              value={formData.squadra_id}
              onChange={(e) => setFormData({...formData, squadra_id: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'white'
              }}
              required
            >
              <option value="">-- Seleziona squadra --</option>
              {squadre.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nome_squadra} ({s.categoria})
                </option>
              ))}
            </select>
          </div>

          {/* Avversario */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#1e293b',
              fontSize: '14px'
            }}>
              Avversario *
            </label>
            <input
              type="text"
              value={formData.avversario}
              onChange={(e) => setFormData({...formData, avversario: e.target.value})}
              placeholder="es. A.C. Testopoli"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* Data */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#1e293b',
              fontSize: '14px'
            }}>
              Data *
            </label>
            <input
              type="date"
              value={formData.data_gara}
              onChange={(e) => setFormData({...formData, data_gara: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* Luogo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#1e293b',
              fontSize: '14px'
            }}>
              Luogo
            </label>
            <input
              type="text"
              value={formData.luogo}
              onChange={(e) => setFormData({...formData, luogo: e.target.value})}
              placeholder="es. Campo Comunale"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Stato */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#1e293b',
              fontSize: '14px'
            }}>
              Stato
            </label>
            <select
              value={formData.stato}
              onChange={(e) => setFormData({...formData, stato: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'white'
              }}
            >
              <option value="programmata"> Programmata</option>
              <option value="in_corso">▶️ In Corso</option>
              <option value="terminata">✅ Terminata</option>
            </select>
          </div>

          {/* Pulsanti */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/"
              style={{
                flex: 1,
                padding: '14px',
                background: '#e2e8f0',
                color: '#1e293b',
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '14px',
                background: loading ? '#94a3b8' : '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creazione...' : '✓ CREA PARTITA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
