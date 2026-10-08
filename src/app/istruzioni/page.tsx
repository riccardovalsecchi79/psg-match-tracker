import Link from 'next/link'

export default function IstruzioniPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
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
            fontSize: '36px', 
            margin: '0 0 10px 0',
            color: '#ffffff',
            fontWeight: '900',
            letterSpacing: '-1px'
          }}>
            Guida per i Mister
          </h1>
          <div style={{
            marginTop: '15px',
            height: '3px',
            width: '80px',
            background: 'linear-gradient(90deg, #f97316, #fbbf24)',
            margin: '15px auto 0',
            borderRadius: '2px'
          }} />
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <h2 style={{ color: '#f97316', fontSize: '24px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>
            📱 1. Installare l'App sul Telefono
          </h2>
          
          <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '10px', fontWeight: 'bold' }}>iPhone (Safari):</h3>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '20px' }}>
            <li>Apri <strong style={{ color: '#ffffff' }}>Safari</strong> (non Chrome!)</li>
            <li>Vai all'indirizzo dell'app</li>
            <li>Tocca il pulsante <strong style={{ color: '#ffffff' }}>Condividi</strong> (quadrato con freccia in su ⬆️)</li>
            <li>Scorri e tocca <strong style={{ color: '#ffffff' }}>"Aggiungi alla schermata Home"</strong></li>
            <li>Conferma il nome e tocca <strong style={{ color: '#ffffff' }}>"Aggiungi"</strong></li>
          </ol>

          <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '10px', fontWeight: 'bold' }}>Android (Chrome):</h3>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '0' }}>
            <li>Apri <strong style={{ color: '#ffffff' }}>Chrome</strong></li>
            <li>Vai all'indirizzo dell'app</li>
            <li>Tocca i <strong style={{ color: '#ffffff' }}>tre puntini</strong> in alto a destra</li>
            <li>Tocca <strong style={{ color: '#ffffff' }}>"Aggiungi a schermata Home"</strong> o "Installa app"</li>
            <li>Conferma</li>
          </ol>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <h2 style={{ color: '#f97316', fontSize: '24px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>
            🏟️ 2. Prima Volta che Apri l'App
          </h2>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Apri l'app dall'icona sulla Home</li>
            <li>Vedrai l'elenco di <strong style={{ color: '#ffffff' }}>tutte le squadre</strong></li>
            <li>Tocca <strong style={{ color: '#ffffff' }}>la tua squadra</strong> (es. "2014 A")</li>
            <li>L'app <strong style={{ color: '#ffffff' }}>ricorderà la tua scelta</strong> per le prossime volte</li>
            <li>Se devi cambiare squadra, tocca <strong style={{ color: '#ffffff' }}>"🔄 Cambia"</strong> in alto a destra</li>
          </ol>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: 'rgba(251,191,36,0.1)', 
            borderRadius: '10px',
            border: '2px solid #fbbf24'
          }}>
            <p style={{ margin: 0, color: '#fbbf24', fontWeight: 'bold' }}>
              ⚠️ IMPORTANTE: Usa SEMPRE il TUO telefono personale. Non condividere il dispositivo con altri mister.
            </p>
          </div>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <h2 style={{ color: '#f97316', fontSize: '24px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>
            ➕ 3. Creare una Nuova Partita
          </h2>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Dalla dashboard, tocca il pulsante bianco <strong style={{ color: '#ffffff' }}>"+ CREA NUOVA PARTITA"</strong></li>
            <li>Inserisci:
              <ul style={{ marginTop: '5px' }}>
                <li><strong style={{ color: '#ffffff' }}>Avversario</strong>: nome della squadra avversaria</li>
                <li><strong style={{ color: '#ffffff' }}>Data</strong>: giorno della partita</li>
                <li><strong style={{ color: '#ffffff' }}>Luogo</strong>: campo (opzionale)</li>
                <li><strong style={{ color: '#ffffff' }}>Stato</strong>: Programmata / In Corso / Terminata</li>
              </ul>
            </li>
            <li>Tocca <strong style={{ color: '#ffffff' }}>"✓ CREA PARTITA"</strong></li>
            <li>Verrai portato alla pagina della partita</li>
          </ol>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <h2 style={{ color: '#f97316', fontSize: '24px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>
            ⚽ 4. Gestire la Partita
          </h2>
          
          <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '10px', fontWeight: 'bold' }}>Prima della partita:</h3>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '15px' }}>
            <li>Tocca <strong style={{ color: '#ffffff' }}>"👥 Formazione"</strong></li>
            <li>Seleziona i <strong style={{ color: '#ffffff' }}>7+ titolari</strong> del 1° tempo</li>
            <li>Puoi anche aggiungere giocatori di altre squadre (sezione arancione)</li>
            <li>Tocca <strong style={{ color: '#ffffff' }}>"💾 SALVA FORMAZIONE"</strong></li>
            <li>Puoi copiare la formazione negli altri tempi con i pulsanti arancioni</li>
          </ol>

          <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '10px', fontWeight: 'bold' }}>Durante la partita:</h3>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '15px' }}>
            <li>Seleziona il <strong style={{ color: '#ffffff' }}>tempo corrente</strong> (1°, 2°, 3°, 4°) in alto</li>
            <li>Per ogni giocatore puoi registrare:
              <ul style={{ marginTop: '5px' }}>
                <li>️ <strong style={{ color: '#ffffff' }}>Minuti giocati</strong> (multipli di 5)</li>
                <li> <strong style={{ color: '#ffffff' }}>Reti</strong> segnate</li>
                <li>🅰️ <strong style={{ color: '#ffffff' }}>Assist</strong></li>
                <li>🎯 <strong style={{ color: '#ffffff' }}>Tiri</strong> effettuati</li>
              </ul>
            </li>
            <li>Per il <strong style={{ color: '#ffffff' }}>portiere</strong> registra anche:
              <ul style={{ marginTop: '5px' }}>
                <li> <strong style={{ color: '#ffffff' }}>Tiri subiti</strong></li>
                <li>⚽ <strong style={{ color: '#ffffff' }}>Gol subiti</strong></li>
              </ul>
            </li>
            <li>Il <strong style={{ color: '#ffffff' }}>tabellino si aggiorna automaticamente</strong></li>
            <li>Per le sostituzioni: tocca <strong style={{ color: '#ffffff' }}>"🔄 Sostituzione"</strong></li>
          </ol>

          <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '10px', fontWeight: 'bold' }}>Alla fine della partita:</h3>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Tocca <strong style={{ color: '#ffffff' }}>"💾 SALVA PARTITA"</strong></li>
            <li>I dati vengono salvati nel database</li>
            <li>Le statistiche dei giocatori si aggiornano automaticamente</li>
          </ol>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <h2 style={{ color: '#f97316', fontSize: '24px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>
            📊 5. Vedere le Statistiche
          </h2>
          <ol style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Dalla dashboard, tocca <strong style={{ color: '#ffffff' }}>"📊 STATISTICHE"</strong></li>
            <li>Vedrai la classifica dei giocatori per:
              <ul style={{ marginTop: '5px' }}>
                <li> Gol totali</li>
                <li>🅰️ Assist totali</li>
                <li>🎯 Tiri totali</li>
                <li>⏱️ Minuti giocati</li>
                <li>🎽 Partite da titolare</li>
              </ul>
            </li>
            <li>Tocca i pulsanti in alto per <strong style={{ color: '#ffffff' }}>cambiare l'ordinamento</strong></li>
            <li>Le statistiche includono <strong style={{ color: '#ffffff' }}>tutte le partite della stagione</strong></li>
          </ol>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <h2 style={{ color: '#f97316', fontSize: '24px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>
            💡 6. Consigli Utili
          </h2>
          <ul style={{ color: '#a0a0a0', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong style={{ color: '#ffffff' }}>Salva spesso</strong>: non aspettare la fine della partita</li>
            <li><strong style={{ color: '#ffffff' }}>Controlla il tempo selezionato</strong> prima di inserire dati</li>
            <li><strong style={{ color: '#ffffff' }}>Non cancellare partite</strong> per errore: l'azione è irreversibile</li>
            <li><strong style={{ color: '#ffffff' }}>Aggiorna l'app</strong>: le modifiche si applicano automaticamente</li>
            <li><strong style={{ color: '#ffffff' }}>Usa solo il tuo telefono</strong>: la selezione squadra è locale</li>
          </ul>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #f97316 100%)', 
          borderRadius: '16px', 
          padding: '25px', 
          marginBottom: '20px',
          color: 'white',
          textAlign: 'center',
          border: '1px solid rgba(249,115,22,0.4)',
          boxShadow: '0 10px 40px rgba(249,115,22,0.2)'
        }}>
          <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '15px', fontWeight: '900' }}>
            🆘 Problemi o Domande?
          </h2>
          <p style={{ fontSize: '16px', margin: '0 0 10px 0', opacity: 0.9 }}>
            Contatta il responsabile tecnico:
          </p>
          <p style={{ fontSize: '20px', fontWeight: '900', margin: '0' }}>
            Riccardo Valsecchi
          </p>
        </div>

        <Link href="/dashboard" style={{
          display: 'block',
          width: '100%',
          padding: '18px',
          background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
          color: '#000000',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '14px',
          fontSize: '18px',
          fontWeight: '900',
          boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
          letterSpacing: '0.5px'
        }}>
          ← TORNA ALLA DASHBOARD
        </Link>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px', 
          padding: '20px',
          color: '#525252',
          fontSize: '14px'
        }}>
          <p>P.S.G. Molteno Brongio - Statino Partite</p>
          <p>Versione 1.0 - Stagione 2024/2025</p>
        </div>
      </div>
    </div>
  )
}
