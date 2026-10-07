'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Squadra {
  id: string
  nome_squadra: string
  categoria: string
  colore_maglia?: string
}

export default function Home() {
  const router = useRouter()
  const [squadre, setSquadre] = useState<Squadra[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadSquadre = async () => {
      const { data, error } = await supabase
        .from('squadre')
        .select('*')
        .order('categoria', { ascending: true })
        .then(({ data, error }) => ({ data, error }))
      
      // Fallback se la query sopra non funziona
      const { data: squadreData } = await supabase
        .from('squadre')
        .select('*')
        .order('categoria')
      
      if (squadreData) {
        setSquadre(squadreData as Squadra[])
        // Ordina le squadre nell'ordine desiderato: Esordienti → Pulcini → Primi Calci
const ordineCategorie = ['Esordienti', 'Pulcini', 'Primi Calci']
const squadreOrdinate = squadreData.sort((a: Squadra, b: Squadra) => {
  const ordineA = ordineCategorie.indexOf(a.categoria)
  const ordineB = ordineCategorie.indexOf(b.categoria)
  if (ordineA !== ordineB) return ordineA - ordineB
  return a.nome_squadra.localeCompare(b.nome_squadra)
})
setSquadre(squadreOrdinate)
      }
      setLoading(false)
    }
    loadSquadre()
  }, [])

  const selezionaSquadra = (squadra: Squadra) => {
    // Salva la squadra selezionata nel browser
    localStorage.setItem('squadra_selezionata_id', squadra.id)
    localStorage.setItem('squadra_selezionata_nome', squadra.nome_squadra)
    localStorage.setItem('squadra_selezionata_categoria', squadra.categoria)
    
    // Vai alla dashboard
    router.push('/dashboard')
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          padding: '30px 20px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>
            P.S.G. Molteno Brongio
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '18px' }}>
            Seleziona la tua squadra
          </p>
        </div>

        {/* Lista Squadre */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#64748b',
            fontSize: '18px'
          }}>
            Caricamento squadre...
          </div>
        ) : squadre.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: 'white',
            borderRadius: '10px',
            color: '#64748b'
          }}>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
              Nessuna squadra trovata
            </p>
            <p style={{ margin: 0 }}>
              Contatta l'amministratore per aggiungere le squadre
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {squadre.map(squadra => (
              <button
                key={squadra.id}
                onClick={() => selezionaSquadra(squadra)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Icona squadra */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginRight: '20px',
                  flexShrink: 0
                }}>
                  ⚽
                </div>
                
                {/* Info squadra */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#1e293b',
                    marginBottom: '5px'
                  }}>
                    {squadra.nome_squadra}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      padding: '4px 10px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {squadra.categoria}
                    </span>
                  </div>
                </div>

                {/* Freccia */}
                <div style={{ 
                  fontSize: '24px', 
                  color: '#94a3b8',
                  marginLeft: '10px'
                }}>
                  →
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '20px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          <p>La squadra selezionata verrà memorizzata</p>
          <p>per facilitare l'accesso nelle prossime visite</p>
        </div>
      </div>
    </div>
  )
}
