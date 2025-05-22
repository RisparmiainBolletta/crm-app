// modifica.js - Gestione modifica clienti

export function collegaPulsantiModifica() {
    document.querySelectorAll(".btn-modifica").forEach(btn => {
        btn.addEventListener("click", () => {
            const stato = btn.dataset.stato || "";
            if (stato === "Contratto ATTIVATO") {
                alert("❌ Non puoi modificare questo cliente: contratto già attivato.");
                return;
            }

            const riga = btn.closest("tr");
            const idCliente = riga.dataset.id;

            document.getElementById("mod-id-cliente").value = idCliente;
            document.getElementById("mod-nome").value = btn.dataset.nome || "";
            document.getElementById("mod-categoria").value = btn.dataset.categoria || "";
            document.getElementById("mod-pod").value = btn.dataset.pod || "";
            document.getElementById("mod-settore").value = btn.dataset.settore || "";
            document.getElementById("mod-email").value = btn.dataset.email || "";
            document.getElementById("mod-telefono").value = btn.dataset.telefono || "";
            document.getElementById("mod-citta").value = btn.dataset.citta || "";
            document.getElementById("mod-provincia").value = btn.dataset.provincia || "";
            document.getElementById("mod-fornitore").value = btn.dataset.fornitore || "";
            document.getElementById("mod-cf").value = btn.dataset.cf || "";
            document.getElementById("mod-piva").value = btn.dataset.piva || "";

            // CARICA LO STATO ATTUALE ANCHE SE DI ADMIN
            const selectStato = document.getElementById("mod-stato");
            const statoAttuale = btn.dataset.stato || "";

            // Carica le opzioni dallo stesso endpoint usato per la select
            fetch("/stati-cliente")
                .then(res => res.json())
                .then(opzioni => {
                    selectStato.innerHTML = "";

                    // Se lo stato attuale non è tra le opzioni, aggiungilo come disabilitato + selezionato
                    if (statoAttuale && !opzioni.includes(statoAttuale)) {
                        const opt = document.createElement("option");
                        opt.value = statoAttuale;
                        opt.textContent = statoAttuale + " (non modificabile)";
                        opt.selected = true;
                        /*opt.disabled = true;*/
                        selectStato.appendChild(opt);
                    }

                    // Aggiungi le opzioni standard
                    opzioni.forEach(val => {
                        const opt = document.createElement("option");
                        opt.value = val;
                        opt.textContent = val;
                        if (val === statoAttuale) opt.selected = true;
                        selectStato.appendChild(opt);
                    });
                });

            document.getElementById("mod-metodo-pagamento").value = btn.dataset.metodo_pagamento || "";
            document.getElementById("mod-invio-bolletta").value = btn.dataset.invio_bolletta || "";

            // Conversione data da gg/mm/aaaa a aaaa-mm-gg
            let scadenzaOfferta = btn.dataset.scadenzaOfferta || "";
            if (scadenzaOfferta) {
                const [gg, mm, aaaa] = scadenzaOfferta.split("/");
                scadenzaOfferta = `${aaaa}-${mm.padStart(2, '0')}-${gg.padStart(2, '0')}`;
            }
            document.getElementById("mod-scadenza-offerta").value = scadenzaOfferta;

            document.getElementById("modale-modifica-cliente").style.display = "block";
        });
    });
}

// Funzione per formattare un nome in Title Case
function formattaTitleCase(testo) {
    return testo
        .toLowerCase()
        .split(" ")
        .map(parola => parola.charAt(0).toUpperCase() + parola.slice(1))
        .join(" ");
}

// Salvataggio modifiche cliente
let statoPrecedente = "";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-modifica");
    if (!form) return;

    const statoInput = document.getElementById("mod-stato");
    statoInput.addEventListener("focus", () => {
        statoPrecedente = statoInput.value;
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const id = document.getElementById("mod-id-cliente").value;

        const datiAggiornati = {
            Nome: formattaTitleCase(document.getElementById("mod-nome").value),  // 🔤 Nome formattato
            Categoria: document.getElementById("mod-categoria").value,
            POD_PDR: document.getElementById("mod-pod").value,
            Settore: document.getElementById("mod-settore").value,
            Email: document.getElementById("mod-email").value,
            Telefono: document.getElementById("mod-telefono").value,
            Città: document.getElementById("mod-citta").value,
            Provincia: document.getElementById("mod-provincia").value,
            Nuovo_Fornitore: document.getElementById("mod-fornitore").value,
            Codice_Fiscale: document.getElementById("mod-cf").value,
            Partita_IVA: document.getElementById("mod-piva").value,
            Stato: document.getElementById("mod-stato").value,
            Metodo_Pagamento: document.getElementById("mod-metodo-pagamento").value,
            Invio_Bolletta: document.getElementById("mod-invio-bolletta").value,
            Scadenza_Offerta: document.getElementById("mod-scadenza-offerta").value,
        };

        const urlBase = window.location.pathname.includes("admin") ? "/admin/clienti" : "/clienti";

        console.log("📤 Invio aggiornamento cliente:", id, datiAggiornati);

        fetch(`${urlBase}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datiAggiornati)
        })
            .then(res => {
                if (!res.ok) throw new Error("Errore durante la modifica");

                console.log("🟢 Cliente aggiornato, sincronizzo comparazione...");
                return fetch(`/sincronizza-da-comparare/${id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ Stato: datiAggiornati.Stato })
                });
            })
            .then(res => res.json())
            .then(data => {
                console.log("✔️ Sincronizzazione:", data.message);
                alert("Modifica salvata!");
                location.reload();
            })
            .catch(err => alert("❌ " + err.message));
    });

    // Filtro mese/anno a destra della barra di ricerca
    const selectFiltro = document.getElementById("filtro-mese-anno");
    const inputFiltro = document.getElementById("filtro-clienti");
    const tabella = document.getElementById("tabella-clienti");

    if (selectFiltro && tabella) {
        const valori = new Set();

        tabella.querySelectorAll("tbody tr").forEach(tr => {
            const data = tr.dataset.inserimento;
            if (data && data.includes("/")) {
                const [gg, mm, aaaa] = data.split("/");
                valori.add(`${mm}/${aaaa}`);
            }
        });

        Array.from(valori).sort().forEach(val => {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = val;
            selectFiltro.appendChild(opt);
        });

        selectFiltro.addEventListener("change", () => {
            const meseAnno = selectFiltro.value;
            tabella.querySelectorAll("tbody tr").forEach(tr => {
                const data = tr.dataset.inserimento;
                const visibile = !meseAnno || (data && data.includes(meseAnno));
                tr.style.display = visibile ? "" : "none";
            });
        });
    }
});
