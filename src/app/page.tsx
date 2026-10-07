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
      const { data: squadreData } = await supabase
        .from('squadre')
        .select('*')
      
      if (squadreData) {
        // Ordina: Esordienti → Pulcini → Primi Calci
        const ordineCategorie = ['Esordienti', 'Pulcini', 'Primi Calci', 'Juniores', 'Allievi', 'Prima Squadra']
        const squadreOrdinate = [...squadreData].sort((a: Squadra, b: Squadra) => {
          const ordineA = ordineCategorie.indexOf(a.categoria)
          const ordineB = ordineCategorie.indexOf(b.categoria)
          if (ordineA !== ordineB) return ordineA - ordineB
          return a.nome_squadra.localeCompare(b.nome_squadra)
        })
        setSquadre(squadreOrdinate as Squadra[])
      }
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

  // Raggruppa squadre per categoria
  const squadrePerCategoria = squadre.reduce((acc, squadra) => {
    if (!acc[squadra.categoria]) acc[squadra.categoria] = []
    acc[squadra.categoria].push(squadra)
    return acc
  }, {} as Record<string, Squadra[]>)

  const ordineCategorie = ['Esordienti', 'Pulcini', 'Primi Calci', 'Juniores', 'Allievi', 'Prima Squadra']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F2F2F7' }}>
      
      {/* Header stile iOS con blur */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(242, 242, 247, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        padding: '12px 16px',
      }}>
        <h1 style={{
          fontSize: '34px',
          fontWeight: '700',
          margin: 0,
          color: '#000000',
          letterSpacing: '-0.5px',
        }}>
          Squadre
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#8E8E93',
          margin: '4px 0 0 0',
        }}>
          P.S.G. Molteno Brongio
        </p>
      </div>

      {/* Contenuto */}
      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8E8E93' }}>
            Caricamento...
          </div>
        ) : Object.keys(squadrePerCategoria).length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#8E8E93',
          }}>
            Nessuna squadra disponibile
          </div>
        ) : (
          ordineCategorie
            .filter(cat => squadrePerCategoria[cat])
            .map(categoria => (
              <div key={categoria} style={{ marginBottom: '24px' }}>
                
                {/* Titolo categoria stile iOS */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#8E8E93',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '0 16px',
                  marginBottom: '8px',
                }}>
                  {categoria}
                </div>

                {/* Lista squadre stile iOS */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}>
                  {squadrePerCategoria[categoria].map((squadra, index) => (
                    <button
                      key={squadra.id}
                      onClick={() => selezionaSquadra(squadra)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '14px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: index < squadrePerCategoria[categoria].length - 1 
                          ? '0.5px solid rgba(0,0,0,0.1)' 
                          : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F2F2F7'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Icona squadra */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        marginRight: '14px',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,122,255,0.3)',
                      }}>
                        ⚽
                      </div>

                      {/* Nome squadra */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '17px',
                          fontWeight: '500',
                          color: '#000000',
                          marginBottom: '2px',
                        }}>
                          {squadra.nome_squadra}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#8E8E93',
                        }}>
                          {squadra.categoria}
                        </div>
                      </div>

                      {/* Freccia iOS */}
                      <div style={{
                        color: '#C7C7CC',
                        fontSize: '20px',
                        fontWeight: '300',
                      }}>
                        ›
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#8E8E93',
          fontSize: '13px',
        }}>
          La squadra selezionata verrà memorizzata
        </div>
      </div>
    </div>
  )
}
