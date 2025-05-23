// provvigioni_admin.js – Gestione Provvigioni lato Admin

function formatCompetenza(val) {
    if (!val) return "";
    if (typeof val === "number") {
        const d = new Date(Date.UTC(1899, 11, 30) + val * 86400000);
        return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
    }
    if (typeof val === "string" && /^\d{2}[-/]\d{4}$/.test(val)) return val.replace("/", "-");
    const d = new Date(val);
    return !isNaN(d) ? `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}` : val.toString();
}

document.addEventListener("DOMContentLoaded", function () {
    let provvigioni = [];
    let ordine = { colonna: null, crescente: true };
    let listino = [];

    // 🔁 CARICA TABELLA PROVVIGIONI
    fetch("/provvigioni-tutte")
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data)) return;
            provvigioni = data;
            mostraTabella(provvigioni);
        })
        .catch(err => console.error("❌ Errore caricamento provvigioni:", err));

    function mostraTabella(dati) {
        const tbody = document.getElementById("tbody-provvigioni-admin");
        const totaleSpan = document.getElementById("totale-provvigioni-admin");
        if (!tbody || !totaleSpan) return;

        tbody.innerHTML = "";
        let totale = 0;

        dati.forEach(p => {
            const tr = document.createElement("tr");

            let valoreProvvigione = parseFloat(p.Provvigione.toString().replace(",", ".") || 0);
            if (!isNaN(valoreProvvigione)) totale += valoreProvvigione;

            tr.innerHTML = `
                <td>${formatCompetenza(p.Competenza)}</td>
                <td>${p.ID_Cliente}</td>
                <td>${p.Nome}</td>
                <td>${p.Categoria}</td>
                <td>${p.Stato}</td>
                <td>${p.Settore}</td>
                <td>${p.Nuovo_Fornitore}</td>
                <td class="importo">${valoreProvvigione.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</td>
                <td>
                    ${p.Modificabile
                    ? `<select class="select-esigibilita ${p.Esigibilità?.toLowerCase()}" data-id="${p.ID_Cliente}">
                            <option disabled ${!p.Esigibilità ? "selected" : ""}>Stato esigibilità</option>
                            <option value="Fatturabile" ${p.Esigibilità === "Fatturabile" ? "selected" : ""}>Fatturabile</option>
                            <option value="Fatturata" ${p.Esigibilità === "Fatturata" ? "selected" : ""}>Fatturata</option>
                            <option value="Pagata" ${p.Esigibilità === "Pagata" ? "selected" : ""}>Pagata</option>
                          </select>`
                    : p.Esigibilità || ""}
                </td>`;

            tbody.appendChild(tr);
        });

        // Eventi cambio stato esigibilità
        tbody.querySelectorAll(".select-esigibilita").forEach(sel => {
            sel.addEventListener("change", function () {
                const idCliente = this.dataset.id;
                const nuovaEsigibilita = this.value;

                this.classList.remove("fatturabile", "fatturata", "pagata");
                this.classList.add(nuovaEsigibilita.toLowerCase());

                fetch(`/admin/clienti/${idCliente}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ Esigibilità: nuovaEsigibilita })
                })
                    .then(res => {
                        if (!res.ok) throw new Error("Errore aggiornamento esigibilità");
                        return res.json();
                    })
                    .then(() => alert("Esigibilità aggiornata!"))
                    .catch(err => alert(err.message));
            });
        });

        totaleSpan.textContent = totale.toLocaleString("it-IT", {
            style: "currency",
            currency: "EUR"
        });
    }

    // --- Filtri ---
    const filtroTesto = document.getElementById("filtro-provvigioni-admin");
    const filtroCompetenza = document.getElementById("filtro-competenza");

    if (filtroTesto) filtroTesto.addEventListener("input", applicaFiltriCombinati);
    if (filtroCompetenza) filtroCompetenza.addEventListener("input", applicaFiltriCombinati);

    function applicaFiltriCombinati() {
        const testo = filtroTesto.value.toLowerCase();
        const competenzaInput = filtroCompetenza.value.trim().toLowerCase();

        const filtrati = provvigioni.filter(p => {
            const matchTesto = Object.values(p).some(val => val && val.toString().toLowerCase().includes(testo));
            const competenzaFormattata = formatCompetenza(p.Competenza).toLowerCase();
            const matchCompetenza = !competenzaInput || competenzaFormattata.includes(competenzaInput);
            return matchTesto && matchCompetenza;
        });

        mostraTabella(filtrati);
    }

    // --- Select dinamiche ---
    function aggiornaFiltriSelect() {
        const fornitore = document.getElementById("prov-fornitore").value;
        const partner = document.getElementById("prov-partner").value;
        const tipo = document.getElementById("prov-tipo").value;
        

        // 🔁 Filtro progressivo: partiamo da tutto il listino
        let filtrati = [...listino];

        if (fornitore) {
            filtrati = filtrati.filter(r => r.Nome_Fornitore === fornitore);
        }

        if (partner) {
            filtrati = filtrati.filter(r => r.Nome_Partner === partner);
        }

        if (tipo) {
            filtrati = filtrati.filter(r => r.Tipo_Utenza === tipo);
        }

        

        // --- RICALCOLA OGNI SELECT BASANDOSI SOLO SUI FILTRATI ---

        const fornitoriFiltrati = [...new Set(listino.map(r => r.Nome_Fornitore))];
        riempiSelect("prov-fornitore", fornitoriFiltrati, fornitore);

        const partnerFiltrati = [...new Set(
            listino.filter(r => !fornitore || r.Nome_Fornitore === fornitore).map(r => r.Nome_Partner)
        )];
        riempiSelect("prov-partner", partnerFiltrati, partner);

        const tipoFiltrati = [...new Set(
            listino.filter(r =>
                (!fornitore || r.Nome_Fornitore === fornitore) &&
                (!partner || r.Nome_Partner === partner)
            ).map(r => r.Tipo_Utenza)
        )];
        riempiSelect("prov-tipo", tipoFiltrati, tipo);

        
        // Servizi (escludendo Accessori)
        const servizi = [...new Set(
            filtrati.filter(r => r.Settore.toLowerCase() !== "accessori").map(r => r.Servizio_Prodotto)
        )];
        riempiSelect("prov-servizio", servizi);

        // Accessori 1–3 (solo se settore = Accessori)
        const accessori = [...new Set(
            filtrati.filter(r => r.Settore.toLowerCase() === "accessori").map(r => r.Servizio_Prodotto)
        )];

        ["prov-accessorio1", "prov-accessorio2", "prov-accessorio3"].forEach(id => {
            riempiSelect(id, accessori);
        });
    }



    function riempiSelect(id, valori, valoreSelezionato = "") {
        const select = document.getElementById(id);
        if (!select || select.disabled) return; // 🔒 Salta se disabilitato
        select.innerHTML = '<option value="">-- seleziona --</option>';
        valori.forEach(v => {
            const option = document.createElement("option");
            option.value = v;
            option.textContent = v;
            if (v === valoreSelezionato) option.selected = true;
            select.appendChild(option);
        });
    }

    ["prov-fornitore", "prov-partner", "prov-tipo", "prov-settore"].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener("change", () => {
                aggiornaFiltriSelect();

                const tipo = document.getElementById("prov-tipo").value;
                const fornitore = document.getElementById("prov-fornitore").value;
                const partner = document.getElementById("prov-partner").value;
                const servizio = document.getElementById("prov-servizio").value;

                const match = listino.find(r =>
                    r.Tipo_Utenza?.trim().toLowerCase() === tipo.trim().toLowerCase() &&
                    r.Nome_Fornitore?.trim().toLowerCase() === fornitore.trim().toLowerCase() &&
                    r.Nome_Partner?.trim().toLowerCase() === partner.trim().toLowerCase() &&
                    r.Servizio_Prodotto?.trim().toLowerCase() === servizio.trim().toLowerCase()
                );

                document.getElementById("prov-provvigione").value = match
                    ? (parseFloat(match.Gettone.toString().replace(",", ".")) / 100).toFixed(2).replace(".", ",")
                    : "";
            });
        }
    });


    const servizioElem = document.getElementById("prov-servizio");
    if (servizioElem) {
        servizioElem.addEventListener("change", () => {
            const tipo = document.getElementById("prov-tipo").value;
            const fornitore = document.getElementById("prov-fornitore").value;
            const partner = document.getElementById("prov-partner").value;
            const servizio = document.getElementById("prov-servizio").value;

            const match = listino.find(r =>
                r.Tipo_Utenza?.trim().toLowerCase() === tipo.trim().toLowerCase() &&
                r.Nome_Fornitore?.trim().toLowerCase() === fornitore.trim().toLowerCase() &&
                r.Nome_Partner?.trim().toLowerCase() === partner.trim().toLowerCase() &&
                r.Servizio_Prodotto?.trim().toLowerCase() === servizio.trim().toLowerCase()
            );

            document.getElementById("prov-provvigione").value = match ? (match.Gettone / 100).toFixed(2).replace(".", ",") : "";
        });
    }

    ["prov-accessorio1", "prov-accessorio2", "prov-accessorio3"].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener("change", () => {
                const tipo = document.getElementById("prov-tipo").value;
                const fornitore = document.getElementById("prov-fornitore").value;
                const partner = document.getElementById("prov-partner").value;
                const servizio = document.getElementById("prov-servizio").value;

                // Trova la provvigione del servizio principale
                const servizioMatch = listino.find(r =>
                    r.Settore?.trim().toLowerCase() !== "accessori" &&
                    r.Tipo_Utenza?.trim().toLowerCase() === tipo.trim().toLowerCase() &&
                    r.Nome_Fornitore?.trim().toLowerCase() === fornitore.trim().toLowerCase() &&
                    r.Nome_Partner?.trim().toLowerCase() === partner.trim().toLowerCase() &&
                    r.Servizio_Prodotto?.trim().toLowerCase() === servizio.trim().toLowerCase()
                );

                let totale = 0;

                if (servizioMatch) {
                    const base = parseFloat(servizioMatch.Gettone.toString().replace(",", ".")) / 100;
                    totale += base;
                }

                // Somma i gettoni degli accessori selezionati
                ["prov-accessorio1", "prov-accessorio2", "prov-accessorio3"].forEach(accId => {
                    const accValue = document.getElementById(accId).value;
                    if (accValue) {
                        const accMatch = listino.find(r =>
                            r.Settore?.trim().toLowerCase() === "accessori" &&
                            r.Tipo_Utenza?.trim().toLowerCase() === tipo.trim().toLowerCase() &&
                            r.Nome_Fornitore?.trim().toLowerCase() === fornitore.trim().toLowerCase() &&
                            r.Nome_Partner?.trim().toLowerCase() === partner.trim().toLowerCase() &&
                            r.Servizio_Prodotto?.trim().toLowerCase() === accValue.trim().toLowerCase()
                        );

                        if (accMatch) {
                            const accVal = parseFloat(accMatch.Gettone.toString().replace(",", ".")) / 100;
                            totale += accVal;
                        }
                    }
                });

                document.getElementById("prov-provvigione").value = totale.toFixed(2).replace(".", ",");
            });
        }
    });


    // Pre-caricamento dei dati esistenti (clienti-caricati)
    document.addEventListener("clienti-caricati", () => {
        document.querySelectorAll(".btn-provvigioni").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;

                document.getElementById("prov-id").value = id || "";
                document.getElementById("prov-nome").value = btn.dataset.nome || "";
                document.getElementById("prov-categoria").value = btn.dataset.categoria || "";

                const settoreField = document.getElementById("prov-settore");
                settoreField.value = btn.dataset.settore || "";
                settoreField.disabled = true; // 🔒 Disabilita il campo settore

                document.getElementById("prov-metodo").value = btn.dataset.metodo || "";
                document.getElementById("prov-bolletta").value = btn.dataset.bolletta || "";

                fetch(`/provvigioni/${id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.Tipo_Utenza) {
                            // 1. Fornitore
                            document.getElementById("prov-fornitore").value = data.Nome_Fornitore;
                            aggiornaFiltriSelect();

                            setTimeout(() => {
                                // 2. Partner
                                document.getElementById("prov-partner").value = data.Nome_Partner;
                                aggiornaFiltriSelect();

                                setTimeout(() => {
                                    // 3. Tipo Utenza
                                    document.getElementById("prov-tipo").value = data.Tipo_Utenza;
                                    aggiornaFiltriSelect();

                                    

                                        setTimeout(() => {
                                            // 5. Carica Servizio/Accessori prima di assegnarli
                                            /*caricaServizi();*/
                                            /*caricaAccessori();*/

                                            setTimeout(() => {
                                                // Assegna Servizio selezionato
                                                document.getElementById("prov-servizio").value = data.Servizio_Prodotto;

                                                // (opzionale: se vuoi precaricare anche Accessorio1/2/3)
                                                if (data.Accessorio1)
                                                    document.getElementById("prov-accessorio1").value = data.Accessorio1;
                                                if (data.Accessorio2)
                                                    document.getElementById("prov-accessorio2").value = data.Accessorio2;
                                                if (data.Accessorio3)
                                                    document.getElementById("prov-accessorio3").value = data.Accessorio3;

                                                // Provvigione
                                                let raw = data.Provvigione;
                                                if (typeof raw === "number") {
                                                    raw = raw.toFixed(2).replace(".", ",");
                                                }
                                                document.getElementById("prov-provvigione").value = raw || "";

                                                // Competenza
                                                if (data.Competenza) {
                                                    const [mm, yyyy] = data.Competenza.split(/[\/-]/);
                                                    document.getElementById("prov-competenza").value = `${yyyy}-${mm}`;
                                                } else {
                                                    document.getElementById("prov-competenza").value = "";
                                                }

                                            }, 200); // tempo per attendere popolamento delle select
                                        }, 100);
                                    
                                }, 100);
                            }, 100);

                        } else {
                            // 🔁 Reset campi
                            aggiornaFiltriSelect();
                            document.getElementById("prov-tipo").value = "";
                            
                            document.getElementById("prov-fornitore").value = "";
                            document.getElementById("prov-partner").value = "";
                            
                            document.getElementById("prov-servizio").value = "";
                            document.getElementById("prov-provvigione").value = "";
                            document.getElementById("prov-competenza").value = "";
                            document.getElementById("prov-accessorio1").value = "";
                            document.getElementById("prov-accessorio2").value = "";
                            document.getElementById("prov-accessorio3").value = "";
                        }
                    });

                document.getElementById("modale-provvigioni-cliente").style.display = "block";
            });
        });
    });


    // Carica il listino
    fetch("/listino-provvigioni")
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data)) throw new Error("Listino non valido");
            listino = data;

            const tipi = [...new Set(data.map(r => r.Tipo_Utenza))];
            const fornitori = [...new Set(data.map(r => r.Nome_Fornitore))];
            const partner = [...new Set(data.map(r => r.Nome_Partner))];
            const servizi = [...new Set(data.map(r => r.Servizio_Prodotto))];

            riempiSelect("prov-tipo", tipi);
            riempiSelect("prov-fornitore", fornitori);
            riempiSelect("prov-partner", partner);
            /*riempiSelect("prov-servizio", servizi);*/
        })
        .catch(err => {
            console.error("Errore nel caricamento listino:", err);
            alert("Errore nel caricamento del listino provvigioni.");
        });

    // --- Gestione Salvataggio con controllo duplicati e sovrascrivi ---
    const formProv = document.getElementById("form-provvigioni-cliente");
    if (formProv) {
        function inviaProvvigione(payload, sovrascrivi = false) {
            payload.sovrascrivi = sovrascrivi;
            fetch("/salva-provvigione", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
                .then(res => res.json().then(data => ({ ok: res.ok, data })))
                .then(({ ok, data }) => {
                    if (!ok && data.error === "duplicato") {
                        if (confirm("⚠️ Provvigione già presente per questo cliente e mese. Vuoi sovrascrivere?")) {
                            inviaProvvigione(payload, true);
                        }
                    } else if (!ok) {
                        throw new Error(data.error || "Errore sconosciuto");
                    } else {
                        // ✅ Dopo il salvataggio, invia anche le quote + competenza
                        const competenzaInput = document.getElementById("prov-competenza").value;
                        const competenzaFormatted = competenzaInput
                            ? competenzaInput.split("-").reverse().join("/")
                            : "";

                        const payloadQuote = {
                            ID_Cliente: document.getElementById("prov-id").value,
                            Provvigione: document.getElementById("prov-provvigione").value,
                            Competenza: competenzaFormatted
                        };

                        fetch("/salva-quote-prov", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payloadQuote)
                        })
                            .then(res => res.json())
                            .then(() => {
                                alert(data.message + "\nQuote e competenza salvate correttamente.");
                                document.getElementById("modale-provvigioni-cliente").style.display = "none";
                            })
                            .catch(err => {
                                console.error("⚠️ Errore salvataggio quote:", err);
                                alert("Provvigione salvata ma errore nel salvataggio delle quote.");
                            });
                    }
                })
                .catch(err => {
                    console.error("❌ Errore:", err);
                    alert("Errore durante il salvataggio: " + err.message);
                });
        }

        formProv.addEventListener("submit", e => {
            e.preventDefault();
            const competenzaInput = document.getElementById("prov-competenza").value;
            const [yyyy, mm] = competenzaInput.split("-");
            const competenza = `${mm}/${yyyy}`;

            const payload = {
                ID_Cliente: document.getElementById("prov-id").value,
                Nome: document.getElementById("prov-nome").value,
                Categoria: document.getElementById("prov-categoria").value,
                Settore: document.getElementById("prov-settore").value,
                Metodo_Pagamento: document.getElementById("prov-metodo").value,
                Invio_Bolletta: document.getElementById("prov-bolletta").value,
                Tipo_Utenza: document.getElementById("prov-tipo").value,
                Nome_Fornitore: document.getElementById("prov-fornitore").value,
                Nome_Partner: document.getElementById("prov-partner").value,
                Servizio_Prodotto: document.getElementById("prov-servizio").value,
                Provvigione: document.getElementById("prov-provvigione").value,
                Competenza: competenza,
                Accessorio1: document.getElementById("prov-accessorio1").value,
                Accessorio2: document.getElementById("prov-accessorio2").value,
                Accessorio3: document.getElementById("prov-accessorio3").value
            };

            inviaProvvigione(payload);
        });
    }

});

function caricaServizi() {
    const tipo = document.getElementById("prov-tipo").value;
    const fornitore = document.getElementById("prov-fornitore").value;
    const partner = document.getElementById("prov-partner").value;
    const select = document.getElementById("prov-servizio");

    if (!tipo || !fornitore || !partner || !select || select.disabled) return;

    fetch(`/servizi-listino?tipo=${encodeURIComponent(tipo)}&fornitore=${encodeURIComponent(fornitore)}&partner=${encodeURIComponent(partner)}`)
        .then(res => res.json())
        .then(servizi => {
            select.innerHTML = `<option value="">-- seleziona --</option>`;
            servizi.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s;
                opt.textContent = s;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error("Errore nel caricamento servizi:", err));
}



function caricaAccessori() {
    const tipo = document.getElementById("prov-tipo").value;
    const fornitore = document.getElementById("prov-fornitore").value;
    const partner = document.getElementById("prov-partner").value;

    if (!tipo || !fornitore || !partner) return;

    fetch(`/accessori-listino?tipo=${encodeURIComponent(tipo)}&fornitore=${encodeURIComponent(fornitore)}&partner=${encodeURIComponent(partner)}`)
        .then(res => res.json())
        .then(accessori => {
            const selects = [
                document.getElementById("prov-accessorio1"),
                document.getElementById("prov-accessorio2"),
                document.getElementById("prov-accessorio3")
            ];
            selects.forEach(sel => {
                sel.innerHTML = `<option value="">-- seleziona --</option>`;
                accessori.forEach(a => {
                    const opt = document.createElement("option");
                    opt.value = a;
                    opt.textContent = a;
                    sel.appendChild(opt);
                });
            });
        })
        .catch(err => console.error("Errore nel caricamento accessori:", err));
}
