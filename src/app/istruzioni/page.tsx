import Link from 'next/link'

export default function IstruzioniPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
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
            Guida per i Mister
          </p>
        </div>

        {/* Sezione 1: Installazione */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e3a8a', fontSize: '24px', marginTop: 0, marginBottom: '15px' }}>
            📱 1. Installare l'App sul Telefono
          </h2>
          
          <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '10px' }}>iPhone (Safari):</h3>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '20px' }}>
            <li>Apri <strong>Safari</strong> (non Chrome!)</li>
            <li>Vai all'indirizzo dell'app</li>
            <li>Tocca il pulsante <strong>Condividi</strong> (quadrato con freccia in su ⬆️)</li>
            <li>Scorri e tocca <strong>"Aggiungi alla schermata Home"</strong></li>
            <li>Conferma il nome e tocca <strong>"Aggiungi"</strong></li>
          </ol>

          <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '10px' }}>Android (Chrome):</h3>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '0' }}>
            <li>Apri <strong>Chrome</strong></li>
            <li>Vai all'indirizzo dell'app</li>
            <li>Tocca i <strong>tre puntini</strong> in alto a destra</li>
            <li>Tocca <strong>"Aggiungi a schermata Home"</strong> o "Installa app"</li>
            <li>Conferma</li>
          </ol>
        </div>

        {/* Sezione 2: Prima volta */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e3a8a', fontSize: '24px', marginTop: 0, marginBottom: '15px' }}>
            🏟️ 2. Prima Volta che Apri l'App
          </h2>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Apri l'app dall'icona sulla Home</li>
            <li>Vedrai l'elenco di <strong>tutte le squadre</strong></li>
            <li>Tocca <strong>la tua squadra</strong> (es. "2014 A")</li>
            <li>L'app <strong>ricorderà la tua scelta</strong> per le prossime volte</li>
            <li>Se devi cambiare squadra, tocca <strong>"🔄 Cambia"</strong> in alto a destra</li>
          </ol>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#fef3c7', 
            borderRadius: '10px',
            border: '2px solid #fbbf24'
          }}>
            <p style={{ margin: 0, color: '#92400e', fontWeight: 'bold' }}>
              ⚠️ IMPORTANTE: Usa SEMPRE il TUO telefono personale. Non condividere il dispositivo con altri mister.
            </p>
          </div>
        </div>

        {/* Sezione 3: Creare una partita */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e3a8a', fontSize: '24px', marginTop: 0, marginBottom: '15px' }}>
            ➕ 3. Creare una Nuova Partita
          </h2>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Dalla dashboard, tocca il pulsante verde <strong>"+ CREA NUOVA PARTITA"</strong></li>
            <li>Inserisci:
              <ul style={{ marginTop: '5px' }}>
                <li><strong>Avversario</strong>: nome della squadra avversaria</li>
                <li><strong>Data</strong>: giorno della partita</li>
                <li><strong>Luogo</strong>: campo (opzionale)</li>
                <li><strong>Stato</strong>: Programmata / In Corso / Terminata</li>
              </ul>
            </li>
            <li>Tocca <strong>"✓ CREA PARTITA"</strong></li>
            <li>Verrai portato alla pagina della partita</li>
          </ol>
        </div>

        {/* Sezione 4: Gestire la partita */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e3a8a', fontSize: '24px', marginTop: 0, marginBottom: '15px' }}>
            ⚽ 4. Gestire la Partita
          </h2>
          
          <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '10px' }}>Prima della partita:</h3>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '15px' }}>
            <li>Tocca <strong>"👥 Formazione"</strong></li>
            <li>Seleziona i <strong>7+ titolari</strong> del 1° tempo</li>
            <li>Puoi anche aggiungere giocatori di altre squadre (sezione arancione)</li>
            <li>Tocca <strong>"💾 SALVA FORMAZIONE"</strong></li>
            <li>Puoi copiare la formazione negli altri tempi con i pulsanti arancioni</li>
          </ol>

          <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '10px' }}>Durante la partita:</h3>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '15px' }}>
            <li>Seleziona il <strong>tempo corrente</strong> (1°, 2°, 3°, 4°) in alto</li>
            <li>Per ogni giocatore puoi registrare:
              <ul style={{ marginTop: '5px' }}>
                <li>⏱️ <strong>Minuti giocati</strong> (multipli di 5)</li>
                <li>⚽ <strong>Reti</strong> segnate</li>
                <li>🅰️ <strong>Assist</strong></li>
                <li>🎯 <strong>Tiri</strong> effettuati</li>
              </ul>
            </li>
            <li>Per il <strong>portiere</strong> registra anche:
              <ul style={{ marginTop: '5px' }}>
                <li>🎯 <strong>Tiri subiti</strong></li>
                <li>⚽ <strong>Gol subiti</strong></li>
              </ul>
            </li>
            <li>Il <strong>tabellino si aggiorna automaticamente</strong></li>
            <li>Per le sostituzioni: tocca <strong>"🔄 Sostituzione"</strong></li>
          </ol>

          <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '10px' }}>Alla fine della partita:</h3>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Tocca <strong>" SALVA PARTITA"</strong></li>
            <li>I dati vengono salvati nel database</li>
            <li>Le statistiche dei giocatori si aggiornano automaticamente</li>
          </ol>
        </div>

        {/* Sezione 5: Statistiche */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e3a8a', fontSize: '24px', marginTop: 0, marginBottom: '15px' }}>
            📊 5. Vedere le Statistiche
          </h2>
          <ol style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Dalla dashboard, tocca <strong>"📊 STATISTICHE"</strong></li>
            <li>Vedrai la classifica dei giocatori per:
              <ul style={{ marginTop: '5px' }}>
                <li>⚽ Gol totali</li>
                <li>🅰️ Assist totali</li>
                <li>🎯 Tiri totali</li>
                <li>⏱️ Minuti giocati</li>
                <li>🎽 Partite da titolare</li>
              </ul>
            </li>
            <li>Tocca i pulsanti in alto per <strong>cambiare l'ordinamento</strong></li>
            <li>Le statistiche includono <strong>tutte le partite della stagione</strong></li>
          </ol>
        </div>

        {/* Sezione 6: Consigli */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e3a8a', fontSize: '24px', marginTop: 0, marginBottom: '15px' }}>
            💡 6. Consigli Utili
          </h2>
          <ul style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Salva spesso</strong>: non aspettare la fine della partita</li>
            <li><strong>Controlla il tempo selezionato</strong> prima di inserire dati</li>
            <li><strong>Non cancellare partite</strong> per errore: l'azione è irreversibile</li>
            <li><strong>Aggiorna l'app</strong>: le modifiche si applicano automaticamente</li>
            <li><strong>Usa solo il tuo telefono</strong>: la selezione squadra è locale</li>
          </ul>
        </div>

        {/* Sezione 7: Assistenza */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
          borderRadius: '12px', 
          padding: '25px', 
          marginBottom: '20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '15px' }}>
            🆘 Problemi o Domande?
          </h2>
          <p style={{ fontSize: '16px', margin: '0 0 10px 0', opacity: 0.9 }}>
            Contatta il responsabile tecnico:
          </p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>
            Riccardo Valsecchi
          </p>
          {/* <p style={{ fontSize: '18px', margin: '10px 0 0 0' }}>
            📞 [Il tuo numero di telefono]
          </p>
          <p style={{ fontSize: '18px', margin: '5px 0 0 0' }}>
            ✉️ [La tua email]
          </p> */}
        </div>

        {/* Pulsante torna alla dashboard */}
        <Link href="/dashboard" style={{
          display: 'block',
          width: '100%',
          padding: '18px',
          background: '#22c55e',
          color: 'white',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
        }}>
          ← TORNA ALLA DASHBOARD
        </Link>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px', 
          padding: '20px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          <p>P.S.G. Molteno Brongio - App Gestione Partite</p>
          <p>Versione 1.0 - Stagione 2024/2025</p>
        </div>
      </div>
    </div>
  )
}
