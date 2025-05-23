// provvigioni_partner.js – Visualizzazione provvigioni partner

document.addEventListener("DOMContentLoaded", function () {
    let provvigioni = [];
    let ordine = { colonna: null, crescente: true };

    const selectCompetenza = document.createElement("select");
    selectCompetenza.id = "filtro-competenza";
    selectCompetenza.innerHTML = `<option value="">Tutte le competenze</option>`;
    document.getElementById("filtro-provvigioni-partner").insertAdjacentElement("beforebegin", selectCompetenza);

    fetch("/api/provvigioni-partner")
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data)) return;
            provvigioni = data;

            // Carica competenze uniche
            const competenze = [...new Set(provvigioni.map(p => p.Competenza).filter(Boolean))].sort();
            competenze.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c;
                opt.textContent = c;
                selectCompetenza.appendChild(opt);
            });

            mostraTabella(provvigioni);
        })
        .catch(err => console.error("Errore caricamento provvigioni partner:", err));

    function mostraTabella(dati) {
        const tbody = document.getElementById("tbody-provvigioni-partner");
        tbody.innerHTML = "";

        let totale = 0;

        dati.forEach(p => {
            const tr = document.createElement("tr");

            let valoreProvvigione = parseFloat((p.Provvigione || "0").toString().replace(",", "."));
            if (!isNaN(valoreProvvigione)) totale += valoreProvvigione;

            tr.innerHTML = `
                <td>${p.Competenza || ""}</td>
                <td>${p.ID_Cliente || ""}</td>
                <td>${p.Nome || ""}</td>
                <td>${p.Settore || ""}</td>
                <td>${p.Tipo_Utenza || ""}</td>
                <td>${p.Nome_Fornitore || ""}</td>
                <td>${p.Nome_Partner || ""}</td>
                <td>${p.Servizio_Prodotto || ""}</td>
                <td>${p.Accessorio1 || ""}</td>
                <td>${p.Accessorio2 || ""}</td>
                <td>${p.Accessorio3 || ""}</td>
                <td>${valoreProvvigione.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</td>
            `;

            tbody.appendChild(tr);
        });

        document.getElementById("totale-provvigioni-partner").textContent = totale.toLocaleString("it-IT", {
            style: "currency",
            currency: "EUR"
        });
    }

    // 🔍 Filtro testo
    document.getElementById("filtro-provvigioni-partner").addEventListener("input", applicaFiltri);

    // 📅 Filtro competenza
    document.getElementById("filtro-competenza").addEventListener("change", applicaFiltri);

    function applicaFiltri() {
        const testo = document.getElementById("filtro-provvigioni-partner").value.toLowerCase();
        const competenza = document.getElementById("filtro-competenza").value;

        const filtrati = provvigioni.filter(p => {
            const matchTesto = Object.values(p).some(val =>
                val && val.toString().toLowerCase().includes(testo)
            );
            const matchCompetenza = !competenza || p.Competenza === competenza;
            return matchTesto && matchCompetenza;
        });

        mostraTabella(filtrati);
    }

    // Ordinamento colonne
    document.querySelectorAll("#thead-provvigioni-partner th").forEach(th => {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
            const chiave = th.dataset.chiave;

            if (ordine.colonna === chiave) {
                ordine.crescente = !ordine.crescente;
            } else {
                ordine.colonna = chiave;
                ordine.crescente = true;
            }

            const ordinati = [...provvigioni].sort((a, b) => {
                let v1 = a[chiave] || "";
                let v2 = b[chiave] || "";

                if (!isNaN(parseFloat(v1)) && !isNaN(parseFloat(v2))) {
                    v1 = parseFloat(v1);
                    v2 = parseFloat(v2);
                } else {
                    v1 = v1.toString().toLowerCase();
                    v2 = v2.toString().toLowerCase();
                }

                return v1 < v2 ? (ordine.crescente ? -1 : 1) : v1 > v2 ? (ordine.crescente ? 1 : -1) : 0;
            });

            mostraTabella(ordinati);
        });
    });
});

