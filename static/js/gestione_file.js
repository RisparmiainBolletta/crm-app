// gestione_file.js – eliminazione file + aggiornamento badge 📎

export function aggiungiGestioneEliminazioneFile(idCliente) {
    const riga = document.querySelector(`tr[data-id='${idCliente}']`);
    const stato = riga?.querySelector("td:nth-child(7)")?.textContent.trim();

    document.querySelectorAll(".btn-elimina-file").forEach(btn => {
        const nuovoBtn = btn.cloneNode(true); // 🔁 Clona il bottone per rimuovere eventi precedenti
        btn.replaceWith(nuovoBtn); // 🔄 Sostituisce il bottone vecchio con quello pulito

        // ✅ Evita binding multiplo
        if (!nuovoBtn.dataset.eventBound) {
            nuovoBtn.addEventListener("click", () => {
                if (stato === "Contratto ATTIVATO") {
                    alert("❌ Non puoi eliminare documenti per un contratto attivato.");
                    return;
                }

                const fileId = nuovoBtn.dataset.id;
                if (!confirm("Vuoi davvero eliminare questo file?")) return;

                fetch(`/file/${fileId}`, {
                    method: "DELETE"
                })
                    .then(res => res.json())
                    .then(data => {
                        alert(data.message);
                        nuovoBtn.parentElement.remove();

                        // 🔄 Aggiorna badge conteggio
                        fetch("/conteggio-documenti")
                            .then(res => res.json())
                            .then(conteggi => {
                                const riga = document.querySelector(`tr[data-id='${idCliente}']`);
                                const btnDocumenti = riga?.querySelector(".btn-documenti");
                                const numero = conteggi[idCliente] || 0;
                                if (btnDocumenti) {
                                    btnDocumenti.innerHTML = `📎 Documenti` + (numero > 0
                                        ? ` <span style="background: #00d1b2; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.9em;">(${numero})</span>`
                                        : '');
                                }
                            });
                    })
                    .catch(err => alert("Errore: " + err.message));
            });

            nuovoBtn.dataset.eventBound = "true"; // ✅ Marca il bottone per evitare duplicazioni
        }
    });
}
