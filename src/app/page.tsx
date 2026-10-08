'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Squadra {
  id: string
  nome_squadra: string
  categoria: string
}

export default function Home() {
  const router = useRouter()
  const [squadre, setSquadre] = useState<Squadra[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadSquadre = async () => {
      const { data } = await supabase
        .from('squadre')
        .select('*')
        .order('categoria')
        .order('nome_squadra')
      
      if (data) setSquadre(data as Squadra[])
      setLoading(false)
    }
    loadSquadre()
  }, [])

  const selezionaSquadra = (squadra: Squadra) => {
    localStorage.setItem('squadra_selezionata_id', squadra.id)
    localStorage.setItem('squadra_selezionata_nome', squadra.nome_squadra)
    localStorage.setItem('squadra_selezionata_categoria', squadra.categoria)
    router.push('/dashboard')
  }

  // ============================================
  // LOGICA SIMBOLO E COLORE PER SQUADRA
  // ============================================
  const getConfigSquadra = (nome: string) => {
    const nomeTrim = nome.trim()
    
    // Squadre Miste → simbolo C, colore azzurro
    if (nomeTrim.includes('Mista') || nomeTrim.includes('Mista')) {
      return { 
        simbolo: 'C', 
        colore: '#06b6d4',        // Azzurro cyan
        coloreChiaro: 'rgba(6,182,212,0.15)',
        coloreBordo: 'rgba(6,182,212,0.3)',
        glowColor: 'rgba(6,182,212,0.3)',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        shadow: '0 4px 15px rgba(6,182,212,0.5)'
      }
    }
    
    // Squadre A → simbolo A, colore arancio
    if (nomeTrim.endsWith('A')) {
      return { 
        simbolo: 'A', 
        colore: '#f97316',
        coloreChiaro: 'rgba(249,115,22,0.15)',
        coloreBordo: 'rgba(249,115,22,0.3)',
        glowColor: 'rgba(249,115,22,0.3)',
        gradient: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
        shadow: '0 4px 15px rgba(249,115,22,0.5)'
      }
    }
    
    // Squadre B → simbolo B, colore blu
    if (nomeTrim.endsWith('B')) {
      return { 
        simbolo: 'B', 
        colore: '#3b82f6',
        coloreChiaro: 'rgba(59,130,246,0.15)',
        coloreBordo: 'rgba(59,130,246,0.3)',
        glowColor: 'rgba(59,130,246,0.3)',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
        shadow: '0 4px 15px rgba(59,130,246,0.5)'
      }
    }
    
    // Default
    return { 
      simbolo: nomeTrim.split(' ').pop() || '?', 
      colore: '#64748b',
      coloreChiaro: 'rgba(100,116,139,0.15)',
      coloreBordo: 'rgba(100,116,139,0.3)',
      glowColor: 'rgba(100,116,139,0.3)',
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      shadow: '0 4px 15px rgba(100,116,139,0.5)'
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'fixed',
        top: '-50%',
        right: '-20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-30%',
        left: '-20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          padding: '40px 30px',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #f97316 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          boxShadow: '0 10px 40px rgba(249, 115, 22, 0.2)'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#f97316', 
            fontWeight: 'bold',
            letterSpacing: '3px',
            marginBottom: '10px'
          }}>
            P.S.G. MOLTENO BRONGIO
          </div>
          <h1 style={{ 
            fontSize: '40px', 
            margin: '0 0 10px 0',
            color: '#ffffff',
            fontWeight: '900',
            letterSpacing: '-1px'
          }}>
            Statino Partite
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#a0a0a0', 
            fontSize: '16px',
            fontStyle: 'italic'
          }}>
            Seleziona la tua squadra
          </p>
          <div style={{
            marginTop: '15px',
            height: '3px',
            width: '80px',
            background: 'linear-gradient(90deg, #f97316, #06b6d4)',
            margin: '15px auto 0',
            borderRadius: '2px'
          }} />
        </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px',
            color: '#a0a0a0',
            fontSize: '18px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #262626',
              borderTop: '3px solid #f97316',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            Caricamento squadre...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : squadre.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: '#141414',
            borderRadius: '16px',
            color: '#a0a0a0',
            border: '1px solid #262626'
          }}>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
              Nessuna squadra trovata
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {squadre.map(squadra => {
              const config = getConfigSquadra(squadra.nome_squadra)
              
              return (
                <button
                  key={squadra.id}
                  onClick={() => selezionaSquadra(squadra)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '20px',
                    background: '#141414',
                    border: `2px solid ${config.colore}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 20px ${config.glowColor}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = `0 8px 30px ${config.glowColor}`
                    e.currentTarget.style.background = '#1a1a1a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 4px 20px ${config.glowColor}`
                    e.currentTarget.style.background = '#141414'
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: config.gradient,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: '900',
                    marginRight: '20px',
                    flexShrink: 0,
                    boxShadow: config.shadow
                  }}>
                    {config.simbolo}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '22px', 
                      fontWeight: '900', 
                      color: '#ffffff',
                      marginBottom: '4px',
                      letterSpacing: '-0.5px'
                    }}>
                      {squadra.nome_squadra}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: config.coloreChiaro,
                      color: config.colore,
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: `1px solid ${config.coloreBordo}`
                    }}>
                      {squadra.categoria}
                    </div>
                  </div>

                  <div style={{ 
                    fontSize: '28px', 
                    color: config.colore,
                    marginLeft: '10px',
                    fontWeight: 'bold'
                  }}>
                    →
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '20px',
          color: '#525252',
          fontSize: '13px'
        }}>
          <p style={{ margin: '0 0 5px 0' }}>La squadra selezionata verrà memorizzata</p>
          <p style={{ margin: 0 }}>per facilitare l'accesso nelle prossime visite</p>
        </div>
      </div>
    </div>
  )
}
