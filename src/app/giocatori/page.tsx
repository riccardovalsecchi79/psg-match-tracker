'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Giocatore {
  id: string
  numero_maglia: number
  nome_completo: string
  ruolo: string
}

export default function GiocatoriPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [giocatori, setGiocatori] = useState<Giocatore[]>([])
  const [loading, setLoading] = useState(true)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

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

    const loadGiocatori = async () => {
      const { data, error } = await supabase
        .from('giocatori')
        .select('*')
        .eq('squadra_id', squadraId)
        .order('numero_maglia')
      
      if (!error && data) {
        setGiocatori(data as Giocatore[])
      }
      setLoading(false)
    }
    loadGiocatori()
  }, [router])

  const eliminaGiocatore = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo giocatore?')) {
      return
    }

    setEliminandoId(id)
    try {
      const { error } = await supabase
        .from('giocatori')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setGiocatori(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      alert('Errore durante l\'eliminazione')
    } finally {
      setEliminandoId(null)
    }
  }

  const getRuoloIcon = (ruolo: string) => {
    switch (ruolo) {
      case 'P': return ''
      case 'D': return '🛡️'
      case 'C': return '🎽'
      case 'A': return '🎯'
      default: return ''
    }
  }

  const getRuoloLabel = (ruolo: string) => {
    switch (ruolo) {
      case 'P': return 'Portiere'
      case 'D': return 'Difensore'
      case 'C': return 'Centrocampista'
      case 'A': return 'Attaccante'
      default: return ruolo
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <Link 
            href="/dashboard"
            style={{
              marginRight: '15px',
              fontSize: '24px',
              textDecoration: 'none',
              color: '#1e3a8a'
            }}
          >
            ←
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#1e3a8a', fontSize: '24px', margin: 0 }}>
              Giocatori
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '5px 0 0 0' }}>
              {squadraInfo.nome} - {squadraInfo.categoria}
            </p>
          </div>
        </div>

        {/* Pulsante Aggiungi */}
        <Link 
          href="/giocatori/nuovo"
          style={{
            display: 'block',
            width: '100%',
            padding: '15px',
            background: '#22c55e',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          + AGGIUNGI GIOCATORE
        </Link>

        {/* Lista Giocatori */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Caricamento giocatori...
          </div>
        ) : giocatori.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: 'white',
            borderRadius: '10px',
            color: '#64748b'
          }}>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
              Nessun giocatore in rosa
            </p>
            <p style={{ margin: 0 }}>
              Clicca "Aggiungi Giocatore" per iniziare
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {giocatori.map(giocatore => (
              <div 
                key={giocatore.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {giocatore.numero_maglia}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: '#1e293b'
                    }}>
                      {giocatore.nome_completo}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      marginTop: '2px'
                    }}>
                      {getRuoloIcon(giocatore.ruolo)} {getRuoloLabel(giocatore.ruolo)}
                    </div>
                  </div>
                </div>

                {/* Pulsanti Azione */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href={`/giocatori/${giocatore.id}`}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#3b82f6',
                      color: 'white',
                      textAlign: 'center',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✏️ Modifica
                  </Link>
                  <button
                    onClick={() => eliminaGiocatore(giocatore.id)}
                    disabled={eliminandoId === giocatore.id}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: eliminandoId === giocatore.id ? '#94a3b8' : '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: eliminandoId === giocatore.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {eliminandoId === giocatore.id ? '...' : '🗑️ Elimina'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contatore */}
        {!loading && giocatori.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '15px',
            background: '#dbeafe',
            borderRadius: '10px',
            color: '#1e40af',
            fontWeight: 'bold'
          }}>
            Totale: {giocatori.length} giocatori in rosa
          </div>
        )}
      </div>
    </div>
  )
}
