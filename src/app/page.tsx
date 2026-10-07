// src/app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          P.S.G. Molteno Brongio
        </h1>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">
            Partite
          </h2>
          <p className="text-slate-500">
            Nessuna partita trovata. Aggiungi una gara su Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
