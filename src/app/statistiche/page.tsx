'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { getTema, TEMI } from '@/lib/theme'

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
  const [tema, setTema] = useState(TEMI.team)
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [statistiche, setStatistiche] = useState<Statistica[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'gol' | 'assist' | 'tiri' | 'minuti' | 'partite'>('gol')

  useEffect(() => {
    setTema(getTema())
    
    const squadraId = localStorage.getItem('squadra_selezionata_id')
    const squadraNome = localStorage.getItem('squadra_selezionata_nome')
    const squadraCategoria = localStorage.getItem('squadra_selezionata_categoria')

    if (!squadraId) {
      router.push('/')
      return
    }

    setSquadraInfo({ id: squadraId, nome: squadraNome || '', categoria: squadraCategoria || '' })

    const loadStatistiche = async () => {
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
          // ============================================
          // PARTITE DA TITOLARE
          // Raggruppa per gara_id per evitare duplicati
          // ============================================
          const { data: formazioniData } = await supabase
            .from('formazioni')
            .select('gara_id')
            .eq('giocatore_id', g.id)
            .eq('titolare', true)
          
          const partiteUniche = new Set(formazioniData?.map(f => f.gara_id) || [])
          const partiteCount = partiteUniche.size

          // ============================================
          // GOL, ASSIST, TIRI
          // Raggruppa per (gara_id, numero_tempo) e prendi il MAX
          // ============================================
          const { data: azioniData } = await supabase
            .from('azioni_gioco')
            .select('reti, assist, tiri, numero_tempo')
            .eq('giocatore_id', g.id)
          
          let golTotali = 0
          let assistTotali = 0
          let tiriTotali = 0
          
          if (azioniData && azioniData.length > 0) {
            // Raggruppa per numero_tempo (all'interno della stessa partita, 
            // ma poiché filtriamo per giocatore, prendiamo il max per sicurezza)
            // In realtà, poiché ogni record ha un tempo_id diverso ma stesso numero_tempo 
            // potrebbe essere duplicato, raggruppiamo per numero_tempo
            const azioniPerTempo: Record<number, {reti: number, assist: number, tiri: number}> = {}
            
            azioniData.forEach(a => {
              const tempo = a.numero_tempo || 1
              if (!azioniPerTempo[tempo]) {
                azioniPerTempo[tempo] = { reti: 0, assist: 0, tiri: 0 }
              }
              // Prendi il MAX in caso di duplicati
              azioniPerTempo[tempo].reti = Math.max(azioniPerTempo[tempo].reti, a.reti || 0)
              azioniPerTempo[tempo].assist = Math.max(azioniPerTempo[tempo].assist, a.assist || 0)
              azioniPerTempo[tempo].tiri = Math.max(azioniPerTempo[tempo].tiri, a.tiri || 0)
            })
            
            // Somma i valori di ogni tempo
            Object.values(azioniPerTempo).forEach(a => {
              golTotali += a.reti
              assistTotali += a.assist
              tiriTotali += a.tiri
            })
          }

          // ============================================
          // MINUTI GIOCATI
          // Raggruppa per (gara_id, numero_tempo) e prendi il MAX
          // ============================================
          const { data: minutiData } = await supabase
            .from('minuti_giocati')
            .select('minuti, numero_tempo, gara_id')
            .eq('giocatore_id', g.id)
          
          let minutiTotali = 0
          
          if (minutiData && minutiData.length > 0) {
            // Raggruppa per (gara_id, numero_tempo) - chiave unica per ogni tempo di ogni partita
            const minutiPerTempo: Record<string, number> = {}
            
            minutiData.forEach(m => {
              const key = `${m.gara_id}_${m.numero_tempo}`
              if (!minutiPerTempo[key]) {
                minutiPerTempo[key] = 0
              }
              // Prendi il MAX in caso di duplicati
              minutiPerTempo[key] = Math.max(minutiPerTempo[key], m.minuti || 0)
            })
            
            // Somma i minuti di ogni tempo
            minutiTotali = Object.values(minutiPerTempo).reduce((sum, m) => sum + m, 0)
          }

          return {
            giocatore_id: g.id,
            nome_completo: g.nome_completo,
            numero_maglia: g.numero_maglia,
            ruolo: g.ruolo,
            nome_squadra: g.squadre?.nome_squadra || '',
            categoria: g.squadre?.categoria || '',
            partite_da_titolare: partiteCount,
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
      case 'P': return '🧤'
      case 'D': return '🛡️'
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
    <div style={{ minHeight: '100vh', background: tema.background, padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/dashboard" style={{ marginRight: '15px', fontSize: '24px', textDecoration: 'none', color: tema.accent1 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: tema.textPrimary, fontSize: '24px', margin: 0, fontWeight: '900' }}>📊 Statistiche</h1>
            <p style={{ color: tema.textSecondary, fontSize: '14px', margin: '5px 0 0 0' }}>{squadraInfo.nome} - {squadraInfo.categoria}</p>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
          marginBottom: '20px'
        }}>
          {[
            { key: 'gol', label: '⚽ Gol', color: '#22c55e' },
            { key: 'assist', label: '🅰️ Assist', color: '#3b82f6' },
            { key: 'tiri', label: ' Tiri', color: '#db2777' },
            { key: 'minuti', label: '⏱️ Min', color: '#fbbf24' },
            { key: 'partite', label: '🎽 Tit', color: '#8b5cf6' }
          ].map(item => (
            <button key={item.key} onClick={() => setSortBy(item.key as any)} style={{
              padding: '10px 6px', background: sortBy === item.key ? item.color : tema.backgroundCard,
              color: sortBy === item.key ? '#000000' : tema.textOnCard, border: `2px solid ${item.color}`,
              borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '900'
            }}>{item.label}</button>
          ))}
        </div>

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
            Caricamento statistiche...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : sortedStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: tema.backgroundCard, borderRadius: '16px', color: tema.textSecondaryOnCard, border: `1px solid ${tema.borderCard}` }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0', color: tema.textOnCard, fontWeight: 'bold' }}>Nessuna statistica disponibile</p>
            <p style={{ margin: 0 }}>Le statistiche si aggiornano dopo il salvataggio di ogni partita</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedStats.map((stat, index) => (
              <div key={stat.giocatore_id} style={{
                background: tema.backgroundCard, borderRadius: '12px', padding: '15px',
                boxShadow: tema.shadow, border: `1px solid ${tema.borderCard}`,
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '32px', height: '32px', background: index < 3 ? '#fbbf24' : '#262626',
                  color: index < 3 ? '#000000' : '#a0a0a0', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '900', flexShrink: 0
                }}>{index + 1}</div>

                <div style={{
                  width: '44px', height: '44px', background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                  color: '#000000', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '18px', fontWeight: '900', flexShrink: 0
                }}>{stat.numero_maglia}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: tema.textOnCard }}>{stat.nome_completo}</div>
                  <div style={{ fontSize: '11px', color: tema.textSecondaryOnCard }}>{getRuoloIcon(stat.ruolo)} {stat.ruolo}</div>
                </div>

                <div style={{ display: 'flex', gap: '12px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>{stat.gol_totali}</div>
                    <div style={{ fontSize: '9px', color: tema.textSecondaryOnCard }}>GOL</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>{stat.assist_totali}</div>
                    <div style={{ fontSize: '9px', color: tema.textSecondaryOnCard }}>ASS</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#db2777' }}>{stat.tiri_totali}</div>
                    <div style={{ fontSize: '9px', color: tema.textSecondaryOnCard }}>TIR</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24' }}>{stat.minuti_totali}'</div>
                    <div style={{ fontSize: '9px', color: tema.textSecondaryOnCard }}>MIN</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#8b5cf6' }}>{stat.partite_da_titolare}</div>
                    <div style={{ fontSize: '9px', color: tema.textSecondaryOnCard }}>TIT</div>
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
