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

interface TempiGara {
  id: string
  numero_tempo: number
  tiri_effettuati: number
  tiri_subiti: number
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [gare, setGare] = useState<Gara[]>([])
  const [tiriPerGara, setTiriPerGara] = useState<Record<string, { effettuati: number, subiti: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const squadraId = localStorage.getItem('squadra_selezionata_id')
    const squadraNome = localStorage.getItem('squadra_selezionata_nome')
    const squadraCategoria = localStorage.getItem('squadra_selezionata_categoria')

    if (!squadraId) { router.push('/'); return }
    setSquadraInfo({ id: squadraId, nome: squadraNome || '', categoria: squadraCategoria || '' })

    const loadGare = async () => {
      const { data, error } = await supabase
        .from('gare')
        .select('*')
        .eq('squadra_id', squadraId)
        .order('data_gara', { ascending: false })
      
      if (!error && data) {
        setGare(data as Gara[])
        
        // Carica tiri totali per ogni gara
        const tiriMap: Record<string, { effettuati: number, subiti: number }> = {}
        for (const gara of data as Gara[]) {
          const { data: tempi } = await supabase
            .from('tempi_gara')
            .select('tiri_effettuati, tiri_subiti')
            .eq('gara_id', gara.id)
          
          let tiriEffettuati = 0
          let tiriSubiti = 0
          if (tempi) {
            tempi.forEach(t => {
              tiriEffettuati += t.tiri_effettuati || 0
              tiriSubiti += t.tiri_subiti || 0
            })
          }
          tiriMap[gara.id] = { effettuati: tiriEffettuati, subiti: tiriSubiti }
        }
        setTiriPerGara(tiriMap)
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
    return new Date(dataStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ 
          marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>{squadraInfo.nome}</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>{squadraInfo.categoria}</p>
          </div>
          <button onClick={cambiaSquadra} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            🔄 Cambia
          </button>
        </div>

        <Link href="/giocatori" style={{
          display: 'block', width: '100%', padding: '15px', background: '#8b5cf6',
          color: 'white', textAlign: 'center', textDecoration: 'none', borderRadius: '10px',
          fontSize: '18px', fontWeight: 'bold', marginBottom: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          👥 GESTISCI GIOCATORI
        </Link>

        <Link href="/statistiche" style={{
          display: 'block', width: '100%', padding: '15px', background: '#f97316',
          color: 'white', textAlign: 'center', textDecoration: 'none', borderRadius: '10px',
          fontSize: '18px', fontWeight: 'bold', marginBottom: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
           STATISTICHE
        </Link>

        <Link href="/nuova-gara" style={{
          display: 'block', width: '100%', padding: '15px', background: '#22c55e',
          color: 'white', textAlign: 'center', textDecoration: 'none', borderRadius: '10px',
          fontSize: '18px', fontWeight: 'bold', marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          + CREA NUOVA PARTITA
        </Link>

        <h2 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '15px' }}>Partite ({gare.length})</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Caricamento partite...</div>
        ) : gare.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', color: '#64748b' }}>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Nessuna partita per questa squadra</p>
            <p style={{ margin: 0 }}>Clicca "Crea Nuova Partita" per iniziare</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gare.map(gara => {
              const badge = getStatoBadge(gara.stato)
              const tiri = tiriPerGara[gara.id] || { effettuati: 0, subiti: 0 }
              return (
                <div key={gara.id} style={{
                  background: 'white', borderRadius: '10px', padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>vs {gara.avversario}</div>
                    <div style={{ padding: '6px 12px', background: badge.bg, color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{badge.text}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>
                    <div>📅 {formatData(gara.data_gara)}</div>
                    {gara.luogo && <div>📍 {gara.luogo}</div>}
                  </div>
                  
                  {/* TABELLINO COMPLETO */}
                  {(gara.stato === 'terminata' || gara.risultato_casa > 0 || gara.risultato_ospite > 0 || tiri.effettuati > 0 || tiri.subiti > 0) && (
                    <div style={{ 
                      padding: '15px', 
                      background: '#f8fafc', 
                      borderRadius: '10px', 
                      marginBottom: '10px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {/* Risultato */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '2px solid #e2e8f0'
                      }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>PSG</div>
                          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e3a8a', lineHeight: 1 }}>
                            {gara.risultato_casa}
                          </div>
                        </div>
                        <div style={{ fontSize: '24px', color: '#94a3b8', fontWeight: 'bold' }}>-</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>OSPITE</div>
                          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626', lineHeight: 1 }}>
                            {gara.risultato_ospite}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tiri */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '14px'
                      }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>TIRI</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316' }}>
                            {tiri.effettuati}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>TIRI SUBITI</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                            {tiri.subiti}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Link href={`/gara/${gara.id}`} style={{
                    display: 'block', width: '100%', padding: '12px', background: '#3b82f6',
                    color: 'white', textAlign: 'center', textDecoration: 'none', borderRadius: '8px',
                    fontSize: '16px', fontWeight: 'bold'
                  }}>
                     APRI PARTITA
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
