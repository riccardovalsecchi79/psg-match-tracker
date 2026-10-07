'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function NuovaGaraPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  
  const [formData, setFormData] = useState({
    avversario: '',
    data_gara: new Date().toISOString().split('T')[0],
    luogo: '',
    stato: 'programmata'
  })

  useEffect(() => {
    const squadraId = localStorage.getItem('squadra_selezionata_id')
    const squadraNome = localStorage.getItem('squadra_selezionata_nome')
    const squadraCategoria = localStorage.getItem('squadra_selezionata_categoria')

    if (!squadraId) {
      router.push('/')
      return
    }

    setSquadraInfo({
      id: squadraId,
      nome: squadraNome || '',
      categoria: squadraCategoria || ''
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!squadraInfo.id) {
      setError('Nessuna squadra selezionata')
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
          squadra_id: squadraInfo.id,
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

      router.push(`/gara/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    fontSize: '17px',
    background: 'transparent',
    color: '#000000',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginBottom: '4px',
    display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F2F2F7' }}>
      
      {/* Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{
            color: '#007AFF',
            textDecoration: 'none',
            fontSize: '17px',
            fontWeight: '400',
          }}>
            ← Annulla
          </Link>
          <h1 style={{
            fontSize: '17px',
            fontWeight: '600',
            margin: 0,
            color: '#000000',
          }}>
            Nuova Partita
          </h1>
          <div style={{ width: '70px' }}></div>
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Info squadra */}
        <div style={{
          backgroundColor: '#E3F2FD',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '16px',
          border: '1px solid #90CAF9',
        }}>
          <div style={{ fontSize: '12px', color: '#1976D2', fontWeight: '600', marginBottom: '2px' }}>
            SQUADRA
          </div>
          <div style={{ fontSize: '17px', fontWeight: '600', color: '#0D47A1' }}>
            {squadraInfo.nome}
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>
              ({squadraInfo.categoria})
            </span>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#FFE5E5',
            color: '#FF3B30',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '15px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avversario */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 16px 4px 16px' }}>
                <label style={labelStyle}>Avversario</label>
              </div>
              <input
                type="text"
                value={formData.avversario}
                onChange={(e) => setFormData({...formData, avversario: e.target.value})}
                placeholder="Nome squadra avversaria"
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Data */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 16px 4px 16px' }}>
                <label style={labelStyle}>Data</label>
              </div>
              <input
                type="date"
                value={formData.data_gara}
                onChange={(e) => setFormData({...formData, data_gara: e.target.value})}
                style={{
                  ...inputStyle,
                  colorScheme: 'light',
                }}
                required
              />
            </div>
          </div>

          {/* Luogo */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 16px 4px 16px' }}>
                <label style={labelStyle}>Luogo</label>
              </div>
              <input
                type="text"
                value={formData.luogo}
                onChange={(e) => setFormData({...formData, luogo: e.target.value})}
                placeholder="Campo, indirizzo..."
                style={inputStyle}
              />
            </div>
          </div>

          {/* Stato */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 16px 4px 16px' }}>
                <label style={labelStyle}>Stato</label>
              </div>
              <select
                value={formData.stato}
                onChange={(e) => setFormData({...formData, stato: e.target.value})}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="programmata">📅 Programmata</option>
                <option value="in_corso">▶️ In Corso</option>
                <option value="terminata">✅ Terminata</option>
              </select>
            </div>
          </div>

          {/* Pulsante Crea */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#8E8E93' : '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Creazione...' : '✓ Crea Partita'}
          </button>
        </form>
      </div>
    </div>
  )
}
