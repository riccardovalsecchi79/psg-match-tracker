'use client'

import { useParams } from 'next/navigation'

export default function GaraPage() {
  const params = useParams()
  const id = params.id

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'blue', fontSize: '24px' }}>
        Partita ID: {id}
      </h1>
      <p style={{ color: 'gray', marginTop: '20px' }}>
        Pagina di gara funzionante!
      </p>
      <div style={{ marginTop: '30px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px' }}>Selettore Tempi</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button style={{ padding: '10px 20px', background: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}>1° Tempo</button>
          <button style={{ padding: '10px 20px', background: 'gray', color: 'white', border: 'none', borderRadius: '5px' }}>2° Tempo</button>
          <button style={{ padding: '10px 20px', background: 'gray', color: 'white', border: 'none', borderRadius: '5px' }}>3° Tempo</button>
          <button style={{ padding: '10px 20px', background: 'gray', color: 'white', border: 'none', borderRadius: '5px' }}>4° Tempo</button>
        </div>
      </div>
    </div>
  )
}
