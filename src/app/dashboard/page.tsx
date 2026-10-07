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

  const formatData = (dataStr: string) => {
    if (!dataStr) return 'Data non impostata'
    const data = new Date(dataStr)
    return data.toLocaleDateString('it-IT', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    })
  }

  const getStatoConfig = (stato: string) => {
    switch (stato) {
      case 'terminata': return { color: '#34C759', label: 'Terminata', bg: '#E8F8EE' }
      case 'in_corso': return { color: '#FF9500', label: 'In corso', bg: '#FFF3E0' }
      default: return { color: '#007AFF', label: 'Programmata', bg: '#E3F2FD' }
    }
  }

  // Raggruppa gare per stato
  const gareInCorso = gare.filter(g => g.stato === 'in_corso')
  const gareProgrammate = gare.filter(g => g.stato === 'programmata')
  const gareTerminate = gare.filter(g => g.stato === 'terminata')

  const renderGaraCard = (gara: Gara, index: number, totale: number) => {
    const statoConfig = getStatoConfig(gara.stato)
    const haRisultato = gara.risultato_casa > 0 || gara.risultato_ospite > 0 || gara.stato === 'terminata'

    return (
      <Link
        key={gara.id}
        href={`/gara/${gara.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          background: 'transparent',
          textDecoration: 'none',
          color: 'inherit',
          borderBottom: index < totale - 1 ? '0.5px solid rgba(0,0,0,0.1)' : 'none',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F2F2F7'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {/* Icona pallone */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: haRisultato 
            ? 'linear-gradient(135deg, #34C759 0%, #30B350 100%)'
            : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          marginRight: '14px',
          flexShrink: 0,
          boxShadow: `0 2px 4px ${haRisultato ? 'rgba(52,199,89,0.3)' : 'rgba(0,122,255,0.3)'}`,
        }}>
          ⚽
        </div>

        {/* Info partita */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '17px',
            fontWeight: '500',
            color: '#000000',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            vs {gara.avversario}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#8E8E93',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📅 {formatData(gara.data_gara)}</span>
            {gara.luogo && <span>• 📍 {gara.luogo}</span>}
          </div>
        </div>

        {/* Risultato o stato */}
        <div style={{ 
          textAlign: 'right',
          marginLeft: '12px',
          flexShrink: 0
        }}>
          {haRisultato ? (
            <div style={{
              fontSize: '17px',
              fontWeight: '600',
              color: '#000000',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {gara.risultato_casa} - {gara.risultato_ospite}
            </div>
          ) : (
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: statoConfig.bg,
              color: statoConfig.color,
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              {statoConfig.label}
            </div>
          )}
        </div>

        {/* Freccia iOS */}
        <div style={{
          color: '#C7C7CC',
          fontSize: '20px',
          fontWeight: '300',
          marginLeft: '12px',
        }}>
          ›
        </div>
      </Link>
    )
  }

  const renderSezione = (titolo: string, lista: Gara[]) => {
    if (lista.length === 0) return null
    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600
