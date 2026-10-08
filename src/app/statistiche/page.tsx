'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Statistica {
  giocatore_id: string
  nome_completo: string
  numero_maglia: number
  ruolo: string
  nome_squadra: string
  categoria: string
  partite_da_titolare: number
  gol_totali: number
  assist_totali: number
  tiri_totali: number
  minuti_totali: number
}

export default function StatistichePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [statistiche, setStatistiche] = useState<Statistica[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'gol' | 'assist' | 'tiri' | 'minuti' | 'partite'>('gol')

  useEffect(() => {
    const squadraId = localStorage.getItem('squadra_selezionata_id')
    const squadraNome = localStorage.getItem('squadra_selezionata_nome')
    const squadraCategoria = localStorage.getItem('squadra_selezionata_categoria')

    if (!squadraId) {
      router.push('/')
      return
    }

    setSquadraInfo({ id: squadraId, nome: squadraNome || '', categoria: squadraCategoria || '' })

    const loadStatistiche = async () => {
      // Usa query diretta invece della vista per maggiore controllo
      const { data: giocatoriData, error } = await supabase
        .from('giocatori')
        .select(`
          id,
          nome_completo,
          numero_maglia,
          ruolo,
          squadre(nome_squadra, categoria)
        `)
        .eq('squadra_id', squadraId)
      
      if (error) {
        console.error('Errore caricamento:', error)
        setLoading(false)
        return
      }

      if (giocatoriData) {
        const statsPromises = giocatoriData.map(async (g: any) => {
          // Partite da titolare
          const { count: partiteCount } = await supabase
            .from('formazioni')
            .select('*', { count: 'exact', head: true })
            .eq('giocatore_id', g.id)
            .eq('titolare', true)

          // Gol, assist, tiri
          const { data: azioniData } = await supabase
            .from('azioni_gioco')
            .select('reti, assist, tiri')
            .eq('giocatore_id', g.id)
          
          let golTotali = 0
          let assistTotali = 0
          let tiriTotali = 0
          if (azioniData) {
            azioniData.forEach(a => {
              golTotali += a.reti || 0
              assistTotali += a.assist || 0
              tiriTotali += a.tiri || 0
            })
          }

          // Minuti totali
          const { data: minutiData } = await supabase
            .from('minuti_giocati')
            .select('minuti')
            .eq('giocatore_id', g.id)
          
          let minutiTotali = 0
          if (minutiData) {
            minutiData.forEach(m => {
              minutiTotali += m.minuti || 0
            })
          }

          return {
            giocatore_id: g.id,
            nome_completo: g.nome_completo,
            numero_maglia: g.numero_maglia,
            ruolo: g.ruolo,
            nome_squadra: g.squadre?.nome_squadra || '',
            categoria: g.squadre?.categoria || '',
            partite_da_titolare: partiteCount || 0,
            gol_totali: golTotali,
            assist_totali: assistTotali,
            tiri_totali: tiriTotali,
            minuti_totali: minutiTotali
          }
        })

        const stats = await Promise.all(statsPromises)
        setStatistiche(stats)
      }
      setLoading(false)
    }
    loadStatistiche()
  }, [router])

  const getRuoloIcon = (ruolo: string) => {
    switch (ruolo) {
      case 'P': return ''
      case 'D': return '️'
      case 'C': return '🎽'
      case 'A': return '🎯'
      default: return ''
    }
  }

  const getSortedStats = () => {
    return [...statistiche].sort((a, b) => {
      switch (sortBy) {
        case 'gol': return b.gol_totali - a.gol_totali
        case 'assist': return b.assist_totali - a.assist_totali
        case 'tiri': return b.tiri_totali - a.tiri_totali
        case 'minuti': return b.minuti_totali - a.minuti_totali
        case 'partite': return b.partite_da_titolare - a.partite_da_titolare
        default: return 0
      }
    })
  }

  const sortedStats = getSortedStats()

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/dashboard" style={{ marginRight: '15px', fontSize: '24px', textDecoration: 'none', color: '#1e3a8a' }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#1e3a8a', fontSize: '24px', margin: 0 }}> Statistiche</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '5px 0 0 0' }}>{squadraInfo.nome} - {squadraInfo.categoria}</p>
          </div>
        </div>

        {/* Selettore ordinamento */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
          marginBottom: '20px'
        }}>
          {[
            { key: 'gol', label: '⚽ Gol', color: '#16a34a' },
            { key: 'assist', label: '🅰️ Assist', color: '#2563eb' },
            { key: 'tiri', label: '🎯 Tiri', color: '#db2777' },
            { key: 'minuti', label: '️ Min', color: '#92400e' },
            { key: 'partite', label: '🎽 Tit', color: '#7c3aed' }
          ].map(item => (
            <button key={item.key} onClick={() => setSortBy(item.key as any)} style={{
              padding: '10px 6px', background: sortBy === item.key ? item.color : 'white',
              color: sortBy === item.key ? 'white' : '#64748b', border: `2px solid ${item.color}`,
              borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
            }}>{item.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Caricamento statistiche...</div>
        ) : sortedStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', color: '#64748b' }}>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Nessuna statistica disponibile</p>
            <p style={{ margin: 0 }}>Le statistiche si aggiornano dopo il salvataggio di ogni partita</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedStats.map((stat, index) => (
              <div key={stat.giocatore_id} style={{
                background: 'white', borderRadius: '12px', padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '32px', height: '32px', background: index < 3 ? '#fbbf24' : '#e2e8f0',
                  color: index < 3 ? '#92400e' : '#64748b', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 'bold', flexShrink: 0
                }}>{index + 1}</div>

                <div style={{
                  width: '44px', height: '44px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', flexShrink: 0
                }}>{stat.numero_maglia}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>{stat.nome_completo}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{getRuoloIcon(stat.ruolo)} {stat.ruolo}</div>
                </div>

                <div style={{ display: 'flex', gap: '12px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>{stat.gol_totali}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>GOL</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{stat.assist_totali}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>ASS</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#db2777' }}>{stat.tiri_totali}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>TIR</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400e' }}>{stat.minuti_totali}'</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>MIN</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>{stat.partite_da_titolare}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>TIT</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
