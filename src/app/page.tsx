// src/app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [gare, setGare] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const loadGare = async () => {
      const { data } = await supabase
        .from('gare')
        .select('id, avversario, data_gara, stato')
        .order('data_gara', { ascending: false })
      if (data) setGare(data)
    }
    loadGare()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          P.S.G. Molteno Brongio
        </h1>
        <h2 className="text-xl font-semibold mb-4 text-slate-700">
          Partite Recenti
        </h2>
        
        {gare.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-center text-slate-500">
            Nessuna partita trovata. 
            <br />
            <span className="text-sm">Usa Supabase per inserire una gara di test.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {gare.map((gara) => (
              <Link
                key={gara.id}
                href={`/gara/${gara.id}`}
                className="block bg-white p-4 rounded-xl shadow hover:shadow-md transition border border-slate-100"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800">vs {gara.avversario}</div>
                    <div className="text-sm text-slate-500">
                      {new Date(gara.data_gara).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    gara.stato === 'terminata' ? 'bg-green-100 text-green-700' :
                    gara.stato === 'in_corso' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {gara.stato === 'terminata' ? 'FINITA' :
                     gara.stato === 'in_corso' ? 'IN CORSO' : 'PROGRAMMATA'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/gara/nuova"
            className="inline-block bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition"
          >
            + Nuova Partita
          </Link>
        </div>
      </div>
    </div>
  )
}