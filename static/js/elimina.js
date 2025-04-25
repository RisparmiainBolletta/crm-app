// elimina.js - Gestione pulsante Elimina cliente
export function collegaPulsantiElimina() {
    document.querySelectorAll(".btn-elimina").forEach(btn => {
        const nuovoBtn = btn.cloneNode(true);  // Rimuove vecchi event listener
        btn.replaceWith(nuovoBtn);

        nuovoBtn.addEventListener("click", () => {
            const conferma = confirm(`⚠️ Attenzione: verranno eliminati anche tutti i documenti del cliente.\nVuoi procedere?`);
            if (!conferma) return;

            const riga = nuovoBtn.closest("tr");
            const idCliente = riga.dataset.id;

            fetch(`/clienti/${idCliente}`, {
                method: "DELETE"
            })
                .then(res => {
                    if (!res.ok) throw new Error("Errore durante l'eliminazione.");
                    return res.json();
                })
                .then(data => {
                    alert(data.message);
                    riga.remove(); // Rimuove la riga dalla tabella
                })
                .catch(err => {
                    console.error("❌ Errore eliminazione:", err);
                    alert("Errore: " + err.message);
                });
        });
    });
}
