// clienti.js – Caricamento e visualizzazione della tabella clienti

import { aggiornaConteggioDocumenti } from "./conteggio_documenti.js";
import { mostraNotificheNonLette } from "./notifiche_non_lette.js";
import { mostraNotificheInterazioni, segnaInterazioniComeLette } from "./notifiche_interazioni.js";

let tuttiClienti = [];  // ✅ serve per salvare la lista completa

// Inizializzazione

document.addEventListener('DOMContentLoaded', function () {
    caricaClienti();
    inizializzaFiltroRicerca();
});

function caricaClienti() {
    fetch("/clienti")
        .then(res => res.json())
        .then(clienti => {
            tuttiClienti = clienti;
            const tbody = document.getElementById("tbody-clienti");
            if (!tbody) return;
            tbody.innerHTML = "";

            renderTabellaClienti(clienti);
            aggiornaScrollTabella();

            import("./dettagli.js").then(modulo => modulo.collegaPulsantiDettagli());
            import("./modifica.js").then(modulo => modulo.collegaPulsantiModifica());
            import("./elimina.js").then(mod => mod.collegaPulsantiElimina());

            aggiornaConteggioDocumenti();
            mostraNotificheNonLette();
            document.dispatchEvent(new CustomEvent("clienti-caricati"));
            mostraNotificheInterazioni();
        })
        .catch(err => console.error("Errore caricamento clienti:", err));
}

function aggiornaScrollTabella() {
    const tabella = document.getElementById("tabella-clienti");
    const righe = document.querySelectorAll("#tbody-clienti tr");
    const soglia = 15;

    if (righe.length > soglia) {
        tabella.style.overflowY = "auto";
        tabella.style.maxHeight = "calc(100vh - 180px)";
    } else {
        tabella.style.overflowY = "unset";
        tabella.style.maxHeight = "unset";
    }
}

function inizializzaFiltroRicerca() {
    const inputFiltro = document.getElementById("filtro-clienti");
    const filtroData = document.getElementById("filtro-data");

    if (inputFiltro) {
        inputFiltro.addEventListener("input", () => {
            const query = inputFiltro.value.toLowerCase();
            applicaFiltri(query, filtroData?.value || "");
        });
    }

    if (filtroData) {
        filtroData.addEventListener("change", () => {
            const query = inputFiltro?.value.toLowerCase() || "";
            applicaFiltri(query, filtroData.value);
        });

        fetch("/clienti")
            .then(res => res.json())
            .then(clienti => {
                const dateUniche = new Set();
                clienti.forEach(c => {
                    const data = c.Data_Inserimento;
                    if (data) {
                        const [gg, mm, aaaa] = data.split("/");
                        dateUniche.add(`${aaaa}-${mm}`);
                    }
                });

                const select = filtroData;
                select.innerHTML = '<option value="">📆 Tutti i mesi</option>';
                Array.from(dateUniche).sort().forEach(data => {
                    const opt = document.createElement("option");
                    opt.value = data;
                    opt.textContent = `${data.split("-")[1]}/${data.split("-")[0]}`;
                    select.appendChild(opt);
                });
            });
    }
}

function applicaFiltri(testo, dataFiltro) {
    const filtrati = tuttiClienti.filter(cliente => {
        const testoRiga = Object.values(cliente).join(" ").toLowerCase();
        const visibileTesto = testoRiga.includes(testo);

        if (!visibileTesto) return false;

        if (dataFiltro && cliente.Data_Inserimento) {
            const [gg, mm, aaaa] = cliente.Data_Inserimento.split("/");
            const dataRiga = `${aaaa}-${mm.padStart(2, "0")}`;
            return dataRiga === dataFiltro;
        }

        return true;
    });

    renderTabellaClienti(filtrati);
}

function renderTabellaClienti(clienti) {
    const tbody = document.getElementById("tbody-clienti");
    if (!tbody) return;
    tbody.innerHTML = "";

    clienti.forEach(cliente => {
        const tr = document.createElement("tr");
        tr.dataset.id = cliente.ID_Cliente;

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
                  data-metodo_pagamento="${cliente.Metodo_Pagamento || ''}"
                  data-invio_bolletta="${cliente.Invio_Bolletta || ''}"
                  data-scadenza_offerta="${cliente.Scadenza_Offerta || ''}"
                  data-iban="${cliente.IBAN || ''}"
                  data-tipo_richiesta="${cliente.Tipo_richiesta || ''}"
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
                      data-metodo_pagamento="${cliente.Metodo_Pagamento || ''}"
                      data-invio_bolletta="${cliente.Invio_Bolletta || ''}"
                      data-scadenza-offerta="${cliente.Scadenza_Offerta || ''}"
                      data-iban="${cliente.IBAN || ''}"
                      data-tipo_richiesta="${cliente.Tipo_richiesta || ''}"
                >✏️ Modifica</button>
                <button class="btn-elimina">🗑 Elimina</button>
            `;
        }

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
                data-metodo_pagamento="${cliente.Metodo_Pagamento || ''}"
                data-invio_bolletta="${cliente.Invio_Bolletta || ''}"
                data-scadenza-offerta="${cliente.Scadenza_Offerta || ''}"
            >📄 Duplica</button>
        `;

        let stato = cliente.Stato || "";
        let classeStato = "";

        if (stato === "Contratto ATTIVATO") classeStato = "stato-verde";
        else if (stato === "Revisione documenti") classeStato = "stato-arancione";
        else if (stato === "Esito KO") classeStato = "stato-rosso";
        else if (stato === "Comparato") classeStato = "stato-giallo";
        else if (stato === "Da comparare") classeStato = "stato-blu";

        tr.innerHTML = `
            <td>${cliente.ID_Cliente || ""}</td>
            <td>${cliente.Data_Inserimento || ""}</td>
            <td>${cliente.Nome || ""}</td>
            <td>${cliente.Categoria || ""}</td>
            <td>${cliente.Tipo_richiesta || ""}</td>
            <td>${cliente.POD_PDR || ""}</td>
            <td>${cliente.Nome_Fornitore || ""}</td>
            <td>${cliente.Settore || ""}</td>
            <td><span class="${classeStato}">${stato}</span></td>
            <td>
                <div class="menu-azioni-wrapper">
                    <button class="btn-menu-azioni">⋮</button>
                    <div class="menu-azioni">
                        ${menuAzioni}
                    </div>
                </div>
                <button class="btn-documenti" data-nome="${cliente.Nome || ''}">📎Documenti</button>
            </td>
        `;

        const btnInterazioni = tr.querySelector(".btn-interazioni");
        if (btnInterazioni) {
            btnInterazioni.addEventListener("click", () => {
                segnaInterazioniComeLette(cliente.ID_Cliente);
            });
        }

        tbody.appendChild(tr);
    });

    document.addEventListener("click", function (e) {
        document.querySelectorAll(".menu-azioni-wrapper").forEach(wrapper => {
            wrapper.classList.remove("open");
        });

        if (e.target.classList.contains("btn-menu-azioni")) {
            e.stopPropagation();
            const wrapper = e.target.closest(".menu-azioni-wrapper");
            wrapper.classList.add("open");
        }
    });

    import("./dettagli.js").then(modulo => modulo.collegaPulsantiDettagli());
    import("./modifica.js").then(modulo => modulo.collegaPulsantiModifica());
    import("./documenti.js").then(modulo => modulo.collegaPulsantiDocumenti());
    import("./elimina.js").then(mod => mod.collegaPulsantiElimina());
    import("./duplica.js").then(mod => mod.collegaPulsantiDuplica());
    import("./interazioni.js").then(modulo => modulo.collegaPulsantiInterazioni());

    aggiornaConteggioDocumenti();
    mostraNotificheNonLette();
    document.dispatchEvent(new CustomEvent("clienti-caricati"));
    mostraNotificheInterazioni();
}
