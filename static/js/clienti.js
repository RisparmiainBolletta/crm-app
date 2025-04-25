// clienti.js – Caricamento e visualizzazione della tabella clienti

import { aggiornaConteggioDocumenti } from "./conteggio_documenti.js";
import { mostraNotificheNonLette } from "./notifiche_non_lette.js";
/*import { collegaPulsantiElimina } from "./elimina.js";*/

let tuttiClienti = [];  // ✅ serve per salvare la lista completa

document.addEventListener('DOMContentLoaded', function () {
    caricaClienti(); // Caricamento iniziale
});

function caricaClienti() {
    fetch("/clienti")
        .then(res => res.json())
        .then(clienti => {
            tuttiClienti = clienti; // ✅ salviamo tutti per i filtri
            const tbody = document.getElementById("tbody-clienti");
            if (!tbody) return;
            tbody.innerHTML = "";

            renderTabellaClienti(clienti);
            aggiornaScrollTabella();

            // 🔄 Dopo che la tabella è stata popolata, collega i pulsanti da moduli
            import("./dettagli.js").then(modulo => modulo.collegaPulsantiDettagli());
            import("./modifica.js").then(modulo => modulo.collegaPulsantiModifica());
            /*import("./documenti.js").then(modulo => modulo.collegaPulsantiDocumenti());*/
            import("./elimina.js").then(mod => mod.collegaPulsantiElimina());

            // 🔄 Aggiorna conteggio 📎 e notifiche 🔔
            aggiornaConteggioDocumenti();
            mostraNotificheNonLette();
            /*collegaPulsantiElimina();*/

            // ✅ Notifica altri moduli
            document.dispatchEvent(new CustomEvent("clienti-caricati"));
        })
        .catch(err => console.error("Errore caricamento clienti:", err));
}

function aggiornaScrollTabella() {
    const tabella = document.getElementById("tabella-clienti");
    const righe = document.querySelectorAll("#tbody-clienti tr");
    const soglia = 15;

    // Se il contenuto visibile è inferiore alla soglia, rimuovi scroll
    if (righe.length > soglia) {
        tabella.style.overflowY = "auto";
        tabella.style.maxHeight = "calc(100vh - 230px)";
    } else {
        tabella.style.overflowY = "unset";
        tabella.style.maxHeight = "unset";
    }
}



// 🔍 Filtro ricerca in tempo reale
document.addEventListener("DOMContentLoaded", () => {
    const inputFiltro = document.getElementById("filtro-clienti");
    if (inputFiltro) {
        inputFiltro.addEventListener("input", () => {
            const query = inputFiltro.value.toLowerCase();

            const filtrati = tuttiClienti.filter(c =>
                Object.values(c).some(val =>
                    val && val.toString().toLowerCase().includes(query)
                )
            );

            renderTabellaClienti(filtrati);
        });
    }
});

function renderTabellaClienti(clienti) {
    const tbody = document.getElementById("tbody-clienti");
    if (!tbody) return;
    tbody.innerHTML = "";

    clienti.forEach(cliente => {
        const tr = document.createElement("tr");
        tr.dataset.id = cliente.ID_Cliente;

        // Verifica se cliente è bloccato
        const bloccato = cliente.Stato === "Contratto ATTIVATO";

        let menuAzioni = `
            <button class="btn-interazioni" data-id="${cliente.ID_Cliente}" data-nome="${cliente.Nome}">📋 Interazioni</button>
            <button class="btn-dettagli"
                  data-nome="${cliente.Nome || ''}"
                  data-categoria="${cliente.Categoria || ''}"
                  data-pod="${cliente.POD_PDR || ''}"
                  data-settore="${cliente.Settore || ''}"
                  data-email="${cliente.Email || ''}"
                  data-telefono="${cliente.Telefono || ''}"
                  data-citta="${cliente.Città || ''}"
                  data-provincia="${cliente.Provincia || ''}"
                  data-fornitore="${cliente.Nuovo_Fornitore || ''}"
                  data-cf="${cliente.Codice_Fiscale || ''}"
                  data-piva="${cliente.Partita_IVA || ''}"
                  data-stato="${cliente.Stato || ''}"
                  data-provvigione="${cliente.Provvigione || ''}"
            >🔍 Dettagli</button>
        `;

        if (!bloccato) {
            menuAzioni += `
                <button class="btn-modifica"
                      data-nome="${cliente.Nome || ''}"
                      data-categoria="${cliente.Categoria || ''}"
                      data-pod="${cliente.POD_PDR || ''}"
                      data-settore="${cliente.Settore || ''}"
                      data-email="${cliente.Email || ''}"
                      data-telefono="${cliente.Telefono || ''}"
                      data-citta="${cliente.Città || ''}"
                      data-provincia="${cliente.Provincia || ''}"
                      data-fornitore="${cliente.Nuovo_Fornitore || ''}"
                      data-cf="${cliente.Codice_Fiscale || ''}"
                      data-piva="${cliente.Partita_IVA || ''}"
                      data-stato="${cliente.Stato || ''}"
                      data-provvigione="${cliente.Provvigione || ''}"
                >✏️ Modifica</button>
                <button class="btn-elimina">🗑 Elimina</button>
            `;
        }

        // Duplica sempre disponibile
        menuAzioni += `
            <button class="btn-duplica"
                data-nome="${cliente.Nome || ''}"
                data-categoria="${cliente.Categoria || ''}"
                data-pod="${cliente.POD_PDR || ''}"
                data-settore="${cliente.Settore || ''}"
                data-email="${cliente.Email || ''}"
                data-telefono="${cliente.Telefono || ''}"
                data-citta="${cliente.Città || ''}"
                data-provincia="${cliente.Provincia || ''}"
                data-fornitore="${cliente.Nuovo_Fornitore || ''}"
                data-cf="${cliente.Codice_Fiscale || ''}"
                data-piva="${cliente.Partita_IVA || ''}"
                data-stato="${cliente.Stato || ''}"
            >📄 Duplica</button>
        `;
        // Calcola classe colore per lo stato
        let stato = cliente.Stato || "";
        let classeStato = "";

        if (stato === "Contratto ATTIVATO") classeStato = "stato-verde";
        else if (stato === "Revisione documenti") classeStato = "stato-arancione";
        else if (stato === "Esito KO") classeStato = "stato-rosso";


        tr.innerHTML = `
            <td>${cliente.ID_Cliente || ""}</td>
            <td>${cliente.Nome || ""}</td>
            <td>${cliente.Categoria || ""}</td>
            <td>${cliente.Email || ""}</td>
            <td>${cliente.Telefono || ""}</td>
            <td>${cliente.Settore || ""}</td>
            <td><span class="${classeStato}">${stato}</span></td>
            <td>
                <button class="btn-documenti" data-nome="${cliente.Nome || ''}">📎 Documenti</button>
                <div class="menu-azioni-wrapper">
                    <button class="btn-menu-azioni">⋮</button>
                    <div class="menu-azioni">
                        ${menuAzioni}
                    </div>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });



    // Gestione apertura/chiusura del menu ⋮
    document.addEventListener("click", function (e) {
        // Chiude tutti i menu se clicchi fuori
        document.querySelectorAll(".menu-azioni-wrapper").forEach(wrapper => {
            wrapper.classList.remove("open");
        });

        // Se hai cliccato su un bottone ⋮, apri il relativo menu
        if (e.target.classList.contains("btn-menu-azioni")) {
            e.stopPropagation();
            const wrapper = e.target.closest(".menu-azioni-wrapper");
            wrapper.classList.add("open");
        }
    });
   
    // Ricollega tutti i pulsanti e badge
    import("./dettagli.js").then(modulo => modulo.collegaPulsantiDettagli());
    import("./modifica.js").then(modulo => modulo.collegaPulsantiModifica());
    import("./documenti.js").then(modulo => modulo.collegaPulsantiDocumenti());
    import("./elimina.js").then(mod => mod.collegaPulsantiElimina());
    import("./duplica.js").then(mod => mod.collegaPulsantiDuplica());
    import("./interazioni.js").then(modulo => modulo.collegaPulsantiInterazioni());

    aggiornaConteggioDocumenti();
    mostraNotificheNonLette();
    document.dispatchEvent(new CustomEvent("clienti-caricati"));
}



