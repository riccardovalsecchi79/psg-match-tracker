'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { getTema, TEMI } from '@/lib/theme'

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
  const [tema, setTema] = useState(TEMI.team)
  
  const [squadraInfo, setSquadraInfo] = useState({ id: '', nome: '', categoria: '' })
  const [gare, setGare] = useState<Gara[]>([])
  const [statsPerGara, setStatsPerGara] = useState<Record<string, { golCasa: number, golOspite: number, tiriEffettuati: number, tiriSubiti: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTema(getTema())
    
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
        
        const statsMap: Record<string, { golCasa: number, golOspite: number, tiriEffettuati: number, tiriSubiti: number }> = {}
        
        for (const gara of data as Gara[]) {
          const { data: tempi } = await supabase
            .from('tempi_gara')
            .select('risultato_casa, risultato_ospite, tiri_effettuati, tiri_subiti')
            .eq('gara_id', gara.id)
          
          let golCasa = 0, golOspite = 0, tiriEffettuati = 0, tiriSubiti = 0
          
          if (tempi) {
            tempi.forEach(t => {
              golCasa += t.risultato_casa || 0
              golOspite += t.risultato_ospite || 0
              tiriEffettuati += t.tiri_effettuati || 0
              tiriSubiti += t.tiri_subiti || 0
            })
          }
          
          statsMap[gara.id] = { golCasa, golOspite, tiriEffettuati, tiriSubiti }
        }
        
        setStatsPerGara(statsMap)
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
      case 'terminata': return { bg: tema.success, text: 'FINITA', textColor: '#fff' }
      case 'in_corso': return { bg: tema.warning, text: 'IN CORSO', textColor: '#000' }
      default: return { bg: tema.info, text: 'PROGRAMMATA', textColor: '#fff' }
    }
  }

  const formatData = (dataStr: string) => {
    if (!dataStr) return 'Data non impostata'
    return new Date(dataStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', background: tema.background, padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ 
          marginBottom: '25px', 
          padding: '25px', 
          background: tema.gradientHeader,
          borderRadius: '20px', 
          color: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          border: '1px solid rgba(249,115,22,0.4)',
          boxShadow: tema.shadow
        }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.7, letterSpacing: '2px', marginBottom: '5px' }}>
              SQUADRA
            </div>
            <h1 style={{ fontSize: '28px', margin: '0 0 5px 0', fontWeight: '900' }}>
              {squadraInfo.nome}
            </h1>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
              {squadraInfo.categoria}
            </p>
          </div>
          <button onClick={cambiaSquadra} style={{ 
            padding: '10px 18px', 
            background: 'rgba(255,255,255,0.15)', 
            color: 'white', 
            border: '1px solid rgba(255,255,255,0.3)', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontSize: '14px', 
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)'
          }}>
             Cambia
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
          <Link href="/giocatori" style={{
            display: 'block', width: '100%', padding: '18px', 
            background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
            color: '#000000', 
            textAlign: 'center', textDecoration: 'none', borderRadius: '14px',
            fontSize: '18px', fontWeight: '900',
            boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
            letterSpacing: '0.5px'
          }}>
             GESTISCI GIOCATORI
          </Link>

          <Link href="/statistiche" style={{
            display: 'block', width: '100%', padding: '18px', 
            background: '#fbbf24',
            color: '#000000',
            textAlign: 'center', textDecoration: 'none', borderRadius: '14px',
            fontSize: '18px', fontWeight: '900',
            boxShadow: '0 4px 20px rgba(251,191,36,0.3)',
            letterSpacing: '0.5px'
          }}>
             STATISTICHE
          </Link>

          <Link href="/nuova-gara" style={{
            display: 'block', width: '100%', padding: '18px', 
            background: '#ffffff',
            color: '#000000',
            textAlign: 'center', textDecoration: 'none', borderRadius: '14px',
            fontSize: '18px', fontWeight: '900',
            boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
            letterSpacing: '0.5px'
          }}>
            + CREA NUOVA PARTITA
          </Link>

          <Link href="/istruzioni" style={{
            display: 'block', width: '100%', padding: '18px', 
            background: 'rgba(255,255,255,0.08)',
            color: tema.textPrimary,
            textAlign: 'center', textDecoration: 'none', borderRadius: '14px',
            fontSize: '16px', fontWeight: 'bold',
            border: '1px solid rgba(249,115,22,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
             ISTRUZIONI PER I MISTER
          </Link>
        </div>

        <h2 style={{ 
          fontSize: '22px', 
          color: tema.textPrimary, 
          marginBottom: '15px',
          fontWeight: '900',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ color: tema.accent1 }}>⚽</span> Partite ({gare.length})
        </h2>

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
            Caricamento partite...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : gare.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '50px', 
            background: tema.backgroundCard, 
            borderRadius: '16px', 
            color: tema.textSecondaryOnCard,
            border: `1px solid ${tema.borderCard}`
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📅</div>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0', color: tema.textOnCard, fontWeight: 'bold' }}>
              Nessuna partita per questa squadra
            </p>
            <p style={{ margin: 0 }}>Clicca "Crea Nuova Partita" per iniziare</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gare.map(gara => {
              const badge = getStatoBadge(gara.stato)
              const stats = statsPerGara[gara.id] || { golCasa: 0, golOspite: 0, tiriEffettuati: 0, tiriSubiti: 0 }
              const hasStats = stats.golCasa > 0 || stats.golOspite > 0 || stats.tiriEffettuati > 0 || stats.tiriSubiti > 0
              
              return (
                <div key={gara.id} style={{
                  background: tema.backgroundCard, 
                  borderRadius: '16px', 
                  padding: '20px',
                  boxShadow: tema.shadow,
                  border: `1px solid ${tema.borderCard}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: '900', fontSize: '20px', color: tema.textOnCard }}>
                      vs {gara.avversario}
                    </div>
                    <div style={{ 
                      padding: '6px 14px', 
                      background: badge.bg, 
                      color: badge.textColor, 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '900',
                      letterSpacing: '1px'
                    }}>
                      {badge.text}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: tema.textSecondaryOnCard, marginBottom: '12px' }}>
                    <div>📅 {formatData(gara.data_gara)}</div>
                    {gara.luogo && <div>📍 {gara.luogo}</div>}
                  </div>
                  
                  {hasStats && (
                    <div style={{ 
                      padding: '15px', 
                      background: 'rgba(249,115,22,0.08)', 
                      borderRadius: '12px', 
                      marginBottom: '12px',
                      border: '1px solid rgba(249,115,22,0.2)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(249,115,22,0.2)'
                      }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '11px', color: tema.accent1, marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>PSG</div>
                          <div style={{ fontSize: '40px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1 }}>
                            {stats.golCasa}
                          </div>
                        </div>
                        <div style={{ fontSize: '24px', color: tema.textSecondaryOnCard, fontWeight: 'bold' }}>-</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '11px', color: tema.danger, marginBottom: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>OSPITE</div>
                          <div style={{ fontSize: '40px', fontWeight: '900', color: tema.textOnCard, lineHeight: 1 }}>
                            {stats.golOspite}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '10px', color: tema.textSecondaryOnCard, letterSpacing: '1px' }}>TIRI</div>
                          <div style={{ fontSize: '22px', fontWeight: '900', color: tema.accent1 }}>
                            {stats.tiriEffettuati}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '10px', color: tema.textSecondaryOnCard, letterSpacing: '1px' }}>TIRI SUBITI</div>
                          <div style={{ fontSize: '22px', fontWeight: '900', color: tema.danger }}>
                            {stats.tiriSubiti}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Link href={`/gara/${gara.id}`} style={{
                    display: 'block', width: '100%', padding: '14px', 
                    background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                    color: '#000000', 
                    textAlign: 'center', textDecoration: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: '900',
                    boxShadow: '0 4px 15px rgba(249,115,22,0.4)',
                    letterSpacing: '0.5px'
                  }}>
                    ⚽ APRI PARTITA
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
