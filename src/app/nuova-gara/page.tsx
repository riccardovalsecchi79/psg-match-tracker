'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { getTema, TEMI } from '@/lib/theme'

export default function NuovaGaraPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tema, setTema] = useState(TEMI.team)
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    avversario: '',
    data_gara: new Date().toISOString().split('T')[0],
    luogo: '',
    stato: 'programmata'
  })

  useEffect(() => {
    setTema(getTema())
    
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
      setError(err.message || 'Errore durante il salvataggio')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: tema.background, padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/dashboard" style={{ marginRight: '15px', fontSize: '24px', textDecoration: 'none', color: tema.accent1 }}>←</Link>
          <h1 style={{ color: tema.textPrimary, fontSize: '24px', margin: 0, fontWeight: '900' }}>Nuova Partita</h1>
        </div>

        <div style={{
          padding: '15px',
          background: 'rgba(249,115,22,0.1)',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid rgba(249,115,22,0.3)'
        }}>
          <div style={{ fontSize: '12px', color: tema.accent1, marginBottom: '4px', letterSpacing: '1px' }}>SQUADRA</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: tema.textOnCard }}>
            {squadraInfo.nome}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: tema.backgroundCard, padding: '25px', borderRadius: '16px', boxShadow: tema.shadow, border: `1px solid ${tema.borderCard}` }}>
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.15)', color: tema.danger, borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(239,68,68,0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard, fontSize: '14px' }}>
              Avversario *
            </label>
            <input
              type="text"
              value={formData.avversario}
              onChange={(e) => setFormData({...formData, avversario: e.target.value})}
              placeholder="es. A.C. Testopoli"
              style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', background: tema.background, color: tema.textOnCard }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard, fontSize: '14px' }}>
              Data *
            </label>
            <input
              type="date"
              value={formData.data_gara}
              onChange={(e) => setFormData({...formData, data_gara: e.target.value})}
              style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', background: tema.background, color: tema.textOnCard }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard, fontSize: '14px' }}>
              Luogo
            </label>
            <input
              type="text"
              value={formData.luogo}
              onChange={(e) => setFormData({...formData, luogo: e.target.value})}
              placeholder="es. Campo Comunale"
              style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', background: tema.background, color: tema.textOnCard }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textOnCard, fontSize: '14px' }}>
              Stato
            </label>
            <select
              value={formData.stato}
              onChange={(e) => setFormData({...formData, stato: e.target.value})}
              style={{ width: '100%', padding: '12px', border: `1px solid ${tema.borderCard}`, borderRadius: '8px', fontSize: '16px', background: tema.background, color: tema.textOnCard }}
            >
              <option value="programmata">📅 Programmata</option>
              <option value="in_corso">▶️ In Corso</option>
              <option value="terminata">✅ Terminata</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/dashboard" style={{ flex: 1, padding: '14px', background: '#64748b', color: 'white', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }}>
              Annulla
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 2, padding: '14px', background: loading ? '#64748b' : 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)', color: '#000000', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creazione...' : '✓ CREA PARTITA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
