// notifiche_interazioni.js - Gestione 🔔 per interazioni non lette

export function mostraNotificheInterazioni() {
    fetch("/notifiche-interazioni-non-letto")
        .then(res => res.json())
        .then(clientiConNotifiche => {
            if (!Array.isArray(clientiConNotifiche)) return;

            clientiConNotifiche.forEach(idCliente => {
                const riga = document.querySelector(`tr[data-id='${idCliente}']`);
                const cellaNome = riga?.querySelector("td:first-child");
                if (riga && cellaNome && !cellaNome.innerHTML.includes("📩")) {
                    cellaNome.innerHTML = cellaNome.innerHTML + ` 📩`;
                }
            });
        })
        .catch(err => console.error("❌ Errore notifiche interazioni:", err));
}

export function segnaInterazioniComeLette(idCliente) {
    fetch(`/interazioni/segna-letti/${idCliente}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            const riga = document.querySelector(`tr[data-id='${idCliente}']`);
            const cellaNome = riga?.querySelector("td:first-child");
            if (cellaNome?.innerHTML.includes("📩")) {
                cellaNome.innerHTML = cellaNome.innerHTML.replace("📩", "").trim();
            }
        })
        .catch(err => console.error("❌ Errore segna letti:", err));
}
