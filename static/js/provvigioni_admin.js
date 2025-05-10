// provvigioni_admin.js – Visualizzazione completa lato Admin

function formatCompetenza(val) {
    if (val == null || val === "") return "";
    if (typeof val === "number") {
        const msPerDay = 24 * 60 * 60 * 1000;
        const jsDate = new Date(Date.UTC(1899, 11, 30) + val * msPerDay);
        const mm = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
        const yyyy = jsDate.getUTCFullYear();
        return `${mm}/${yyyy}`;
    }
    if (typeof val === "string" && /^\d{2}\/\d{4}$/.test(val)) {
        return val;
    }
    const d = new Date(val);
    if (!isNaN(d)) {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${mm}/${yyyy}`;
    }
    return val.toString();
}

document.addEventListener("DOMContentLoaded", function () {
    let provvigioni = [];
    let ordine = { colonna: null, crescente: true };

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
            `;

            tbody.appendChild(tr);
        });

        totaleSpan.textContent = totale.toLocaleString("it-IT", {
            style: "currency",
            currency: "EUR"
        });
    }

    document.querySelectorAll("#thead-provvigioni-admin th").forEach((th) => {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
            const chiave = th.dataset.chiave;

            if (ordine.colonna === chiave) {
                ordine.crescente = !ordine.crescente;
            } else {
                ordine.colonna = chiave;
                ordine.crescente = true;
            }

            const datiOrdinati = [...provvigioni].sort((a, b) => {
                let v1 = a[chiave] || "";
                let v2 = b[chiave] || "";

                if (!isNaN(parseFloat(v1)) && !isNaN(parseFloat(v2))) {
                    v1 = parseFloat(v1);
                    v2 = parseFloat(v2);
                } else {
                    v1 = v1.toString().toLowerCase();
                    v2 = v2.toString().toLowerCase();
                }

                return ordine.crescente
                    ? v1 < v2 ? -1 : v1 > v2 ? 1 : 0
                    : v1 > v2 ? -1 : v1 < v2 ? 1 : 0;
            });

            mostraTabella(datiOrdinati);
        });
    });

    function applicaFiltriCombinati() {
        const testo = document.getElementById("filtro-provvigioni-admin").value.toLowerCase();
        const competenzaInput = document.getElementById("filtro-competenza").value.trim().toLowerCase();

        const filtrati = provvigioni.filter(p => {
            const matchTesto = Object.values(p).some(val =>
                val && val.toString().toLowerCase().includes(testo)
            );

            const competenzaFormattata = formatCompetenza(p.Competenza).toLowerCase();
            const matchCompetenza = !competenzaInput || competenzaFormattata.includes(competenzaInput);

            return matchTesto && matchCompetenza;
        });

        mostraTabella(filtrati);
    }

    document.getElementById("filtro-provvigioni-admin").addEventListener("input", applicaFiltriCombinati);
    document.getElementById("filtro-competenza").addEventListener("input", applicaFiltriCombinati);
});