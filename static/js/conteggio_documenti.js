
// conteggio_documenti.js
export function aggiornaConteggioDocumenti() {
    fetch("/conteggio-documenti")
        .then(res => res.json())
        .then(conteggi => {
            document.querySelectorAll(".btn-documenti").forEach(btn => {
                const idCliente = btn.closest("tr").dataset.id;
                const numero = conteggi[idCliente] || 0;

                // ✅ Pulisce il contenuto del bottone prima di aggiungere il badge
                btn.innerHTML = "📎Documenti";

                if (numero > 0) {
                    btn.innerHTML += ` <span style="background: #44b514; color: white; padding: 2px 2px; border-radius: 10px; font-size: 0.8em;">(${numero})</span>`;
                }
            });
        })
        .catch(err => console.error("Errore nel conteggio documenti:", err));
}
