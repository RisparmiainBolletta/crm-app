// profilo_agente.js – Mostra il nome e codice dell'agente
//fetch("/dati-agente")
//    .then(res => {
//        if (!res.ok) throw new Error("Non autenticato");
//        return res.json();
//    })
//    .then(data => {
//        const div = document.getElementById("profilo-agente");
//        if (div) {
//            div.textContent = `Benvenuto, ${data.nome_completo} – ${data.codice}`;
//        }
//    })
//    .catch(err => {
//        console.error("Errore caricamento profilo agente:", err);
//    });

// profilo_agente.js - Mostra nome e ruolo dell'utente (agente o admin)

document.addEventListener("DOMContentLoaded", () => {
    fetch("/dati-agente")
        .then(res => {
            if (!res.ok) throw new Error("Non autenticato");
            return res.json();
        })
        .then(dati => {
            const div = document.getElementById("profilo-agente");
            if (!div) return;

            const ruolo = dati.ruolo || "agente";
            const codice = dati.codice || "";
            const nome = dati.nome_completo || "";

            // 👤 Testo diverso per admin e agente
            if (ruolo === "admin") {
                div.innerHTML = `👤 Benvenuto, <strong>${nome}</strong> (<em>${codice}</em>) - <span style="color: #e74c3c;">ADMIN</span>`;
            } else {
                div.innerHTML = `👤 Benvenuto, <strong>${nome}</strong> (<em>${codice}</em>)`;
            }
        })
        .catch(err => {
            console.error("Errore caricamento profilo agente:", err);
        });
});
