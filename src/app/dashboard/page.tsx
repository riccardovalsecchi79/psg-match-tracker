'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Gara {
  id: string
  avversario: string
  data_gara: string
  luogo: string
  stato: string
  risultato_casa: number
  risultato_ospite: number
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({
    id: '',
    nome: '',
    categoria: ''
  })
  const [gare, setGare] = useState<Gara[]>([])
  const [loading, setLoading] = useState(true)

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

    const loadGare = async () => {
      const { data } = await supabase
        .from('gare')
        .select('*')
        .eq('squadra_id', squadraId)
        .order('data_gara', { ascending: false })
      
      if (data) {
        setGare(data as Gara[])
      }
      setLoading(false)
    }
    loadGare()
  }, [router])

  const cambiaSquadra = () => {
    localStorage.removeItem('squadra_selezionata_id')
    localStorage.removeItem('squadra_selezionata_nome')
    localStorage.removeItem('squadra_selezionata_categoria')
    router.push('/')
  }

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case 'terminata': return { bg: '#22c55e', text: 'FINITA' }
      case 'in_corso': return { bg: '#f97316', text: 'IN CORSO' }
      default: return { bg: '#3b82f6', text: 'PROGRAMMATA' }
    }
  }

  const formatData = (dataStr: string) => {
    if (!dataStr) return 'Data non impostata'
    const data = new Date(dataStr)
    return data.toLocaleDateString('it-IT', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderRadius: '12px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>
              {squadraInfo.nome}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              {squadraInfo.categoria}
            </p>
          </div>
          <button
            onClick={cambiaSquadra}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🔄 Cambia
          </button>
        </div>

        <Link 
          href="/nuova-gara"
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
          + CREA NUOVA PARTITA
        </Link>

        <h2 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '15px' }}>
          Partite ({gare.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Caricamento partite...
          </div>
        ) : gare.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: 'white',
            borderRadius: '10px',
            color: '#64748b'
          }}>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
              Nessuna partita per questa squadra
            </p>
            <p style={{ margin: 0 }}>
              Clicca "Crea Nuova Partita" per iniziare
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gare.map(gara => {
              const badge = getStatoBadge(gara.stato)
              return (
                <Link
                  key={gara.id}
                  href={`/gara/${gara.id}`}
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: 'white',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>
                      vs {gara.avversario}
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      background: badge.bg,
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {badge.text}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    color: '#64748b'
                  }}>
                    <div>📅 {formatData(gara.data_gara)}</div>
                    {gara.luogo && <div>📍 {gara.luogo}</div>}
                  </div>

                  {(gara.stato === 'terminata' || gara.risultato_casa > 0 || gara.risultato_ospite > 0) && (
                    <div style={{ 
                      marginTop: '15px',
                      padding: '10px',
                      background: '#f1f5f9',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      {gara.risultato_casa} - {gara.risultato_ospite}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
