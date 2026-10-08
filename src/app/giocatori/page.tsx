'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { getTema, TEMI } from '@/lib/theme'

interface Giocatore {
  id: string
  numero_maglia: number
  nome_completo: string
  ruolo: string
}

export default function GiocatoriPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tema, setTema] = useState(TEMI.team)
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [giocatori, setGiocatori] = useState<Giocatore[]>([])
  const [loading, setLoading] = useState(true)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  useEffect(() => {
    setTema(getTema())
    
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
      case 'P': return '🧤'
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
    <div style={{ minHeight: '100vh', background: tema.background, padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link 
            href="/dashboard"
            style={{
              marginRight: '15px',
              fontSize: '24px',
              textDecoration: 'none',
              color: tema.accent1
            }}
          >
            ←
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: tema.textPrimary, fontSize: '24px', margin: 0, fontWeight: '900' }}>
              Giocatori
            </h1>
            <p style={{ color: tema.textSecondary, fontSize: '14px', margin: '5px 0 0 0' }}>
              {squadraInfo.nome} - {squadraInfo.categoria}
            </p>
          </div>
        </div>

        <Link 
          href="/giocatori/nuovo"
          style={{
            display: 'block',
            width: '100%',
            padding: '18px',
            background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
            color: '#000000',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '14px',
            fontSize: '18px',
            fontWeight: '900',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
            letterSpacing: '0.5px'
          }}
        >
          + AGGIUNGI GIOCATORE
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: tema.textSecondary }}>
            <div style={{
              width: '50px', height: '50px',
              border: '3px solid #262626',
              borderTop: '3px solid #f97316',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            Caricamento giocatori...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : giocatori.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            background: tema.backgroundCard,
            borderRadius: '16px',
            color: tema.textSecondaryOnCard,
            border: `1px solid ${tema.borderCard}`
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0', color: tema.textOnCard, fontWeight: 'bold' }}>
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
                  background: tema.backgroundCard,
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: tema.shadow,
                  border: `1px solid ${tema.borderCard}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                    color: '#000000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: '900',
                    flexShrink: 0
                  }}>
                    {giocatore.numero_maglia}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '900', 
                      color: tema.textOnCard
                    }}>
                      {giocatore.nome_completo}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: tema.textSecondaryOnCard,
                      marginTop: '4px'
                    }}>
                      {getRuoloIcon(giocatore.ruolo)} {getRuoloLabel(giocatore.ruolo)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href={`/giocatori/${giocatore.id}`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: tema.info,
                      color: 'white',
                      textAlign: 'center',
                      textDecoration: 'none',
                      borderRadius: '10px',
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
                      padding: '12px',
                      background: eliminandoId === giocatore.id ? '#64748b' : tema.danger,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: eliminandoId === giocatore.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {eliminandoId === giocatore.id ? '...' : '️ Elimina'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && giocatori.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(249,115,22,0.1)',
            borderRadius: '12px',
            color: tema.accent1,
            fontWeight: 'bold',
            border: '1px solid rgba(249,115,22,0.3)'
          }}>
            Totale: {giocatori.length} giocatori in rosa
          </div>
        )}
      </div>
    </div>
  )
}
