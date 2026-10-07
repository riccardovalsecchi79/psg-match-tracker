'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function GaraPage() {
  const params = useParams()
  const id = params.id as string
  const [players, setPlayers] = useState<any[]>([])
  const [currentPeriod, setCurrentPeriod] = useState(1)
  const [scores, setScores] = useState({ home: 0, away: 0 })
  const [shots, setShots] = useState({ for: 0, against: 0 })
  
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      // Carica i giocatori della squadra
      const { data: match } = await supabase
        .from('gare')
        .select('squadra_id')
        .eq('id', id)
        .single()
      
      if (match) {
        const { data: players } = await supabase
          .from('giocatori')
          .select('*')
          .eq('squadra_id', match.squadra_id)
          .order('numero_maglia')
        
        if (players) setPlayers(players)
      }
    }
    loadData()
  }, [id])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'blue', fontSize: '24px', marginBottom: '20px' }}>
        P.S.G. Molteno Brongio
      </h1>

      {/* Selettore Tempi */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[1, 2, 3, 4].map(p => (
          <button
            key={p}
            onClick={() => setCurrentPeriod(p)}
            style={{
              padding: '10px 20px',
              background: currentPeriod === p ? 'blue' : 'gray',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {p}° Tempo
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f0f0f0', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'gray' }}>CASA</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{scores.home}</div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
            <button onClick={() => setScores(s => ({...s, home: Math.max(0, s.home - 1)}))} style={{ padding: '5px 10px' }}>-</button>
            <button onClick={() => setScores(s => ({...s, home: s.home + 1}))} style={{ padding: '5px 10px' }}>+</button>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'gray' }}>TIRI</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'orange' }}>{shots.for}</div>
          <button onClick={() => setShots(s => ({...s, for: s.for + 1}))} style={{ padding: '5px 10px', marginTop: '5px' }}>+ Tiro</button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'gray' }}>OSPITE</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{scores.away}</div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
            <button onClick={() => setScores(s => ({...s, away: Math.max(0, s.away - 1)}))} style={{ padding: '5px 10px' }}>-</button>
            <button onClick={() => setScores(s => ({...s, away: s.away + 1}))} style={{ padding: '5px 10px' }}>+</button>
          </div>
        </div>
      </div>

      {/* Lista Giocatori */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Giocatori ({players.length})</h2>
        {players.map(player => (
          <div key={player.id} style={{ padding: '15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', background: 'blue', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {player.numero_maglia}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{player.nome_completo}</div>
                  <div style={{ fontSize: '12px', color: 'gray' }}>{player.ruolo}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ padding: '8px 15px', background: 'green', color: 'white', border: 'none', borderRadius: '5px' }}>⚽ Rete</button>
                <button style={{ padding: '8px 15px', background: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}>🅰️ Assist</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
