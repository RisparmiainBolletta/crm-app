import { aggiornaConteggioDocumenti } from "./conteggio_documenti.js";
import { mostraNotificheNonLette } from "./notifiche_non_lette.js";
import { mostraNotificheInterazioni, segnaInterazioniComeLette } from "./notifiche_interazioni.js";

console.log("✅ admin.js caricato e DOM pronto");

document.addEventListener("DOMContentLoaded", function () {
    caricaClientiAdmin();
});

function caricaClientiAdmin() {
    console.log("📦 Tentativo di caricare clienti admin...");

    fetch("/clienti-admin")
        .then(res => {
            if (!res.ok) throw new Error(`Errore fetch /clienti-admin → ${res.status}`);
            return res.json();
        })
        .then(clienti => {
            console.log(`✅ ${clienti.length} clienti ricevuti`);

            const tbody = document.getElementById("tbody-clienti");
            if (!tbody) {
                console.warn("⛔ tbody-clienti non ancora disponibile. Ritento...");
                return setTimeout(caricaClientiAdmin, 300);
            }

            tbody.innerHTML = "";

            clienti.reverse().forEach(cliente => {
                const tr = document.createElement("tr");
                tr.dataset.id = cliente.ID_Cliente;

                let stato = cliente.Stato || "";
                let classeStato = "";

                if (stato === "Contratto ATTIVATO") classeStato = "stato-verde";
                else if (stato === "Revisione documenti") classeStato = "stato-arancione";
                else if (stato === "Esito KO") classeStato = "stato-rosso";
                else if (stato === "Comparato") classeStato = "stato-giallo";
                else if (stato === "Da comparare") classeStato = "stato-blu";

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
                        <button class="btn-documenti-admin" data-nome="${cliente.Nome || ''}">(Admin)</button>
                        <div class="menu-azioni-wrapper">
                            <button class="btn-menu-azioni">⋮</button>
                            <div class="menu-azioni">
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
                            </div>
                        </div>
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

            gestisciMenuAzioni();
            collegaFunzionalita();
        })
        .catch(err => {
            console.error("❌ Errore caricamento clienti admin:", err);

            const tbody = document.getElementById("tbody-clienti");
            if (tbody && document.body.contains(tbody)) {
                tbody.innerHTML = `<tr><td colspan="8" style="color:red;">Errore: ${err.message}</td></tr>`;
            }
        });
}

// 🔍 Filtro ricerca lato Admin
document.addEventListener("DOMContentLoaded", () => {
    const inputFiltro = document.getElementById("filtro-clienti");
    if (!inputFiltro) return;

    inputFiltro.addEventListener("input", () => {
        const query = inputFiltro.value.toLowerCase();

        const righe = document.querySelectorAll("#tbody-clienti tr");

        righe.forEach(riga => {
            const testoRiga = riga.textContent.toLowerCase();
            riga.style.display = testoRiga.includes(query) ? "" : "none";
        });
    });
});

function gestisciMenuAzioni() {
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
}

function collegaFunzionalita() {
    import("./dettagli.js").then(mod => mod.collegaPulsantiDettagli());
    import("./modifica.js").then(mod => mod.collegaPulsantiModifica());
    import("./documenti.js").then(mod => mod.collegaPulsantiDocumenti());
    import("./documenti_admin.js").then(mod => mod.collegaPulsantiDocumentiAdmin());
    import("./elimina.js").then(mod => mod.collegaPulsantiElimina());
    import("./duplica.js").then(mod => mod.collegaPulsantiDuplica());
    import("./interazioni.js").then(mod => mod.collegaPulsantiInterazioni());

    aggiornaConteggioDocumenti();
    mostraNotificheNonLette();
    document.dispatchEvent(new CustomEvent("clienti-caricati"));
    mostraNotificheInterazioni();
}
