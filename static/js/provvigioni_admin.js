// provvigioni_admin.js – Visualizzazione completa lato Admin

/**
 * Se val è un seriale Google Sheets (numero di giorni dal 1899-12-30), lo converte.
 * Se è già stringa "MM/YYYY", la restituisce. Altrimenti prova ISO/date-string.
 */
function formatCompetenza(val) {
    if (val == null || val === "") return "";
    // 1) numero seriale → data
    if (typeof val === "number") {
        const msPerDay = 24 * 60 * 60 * 1000;
        // Google usano base 1899-12-30
        const jsDate = new Date(Date.UTC(1899, 11, 30) + val * msPerDay);
        const mm = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
        const yyyy = jsDate.getUTCFullYear();
        return `${mm}/${yyyy}`;
    }
    // 2) già nel formato corretto?
    if (typeof val === "string" && /^\d{2}\/\d{4}$/.test(val)) {
        return val;
    }
    // 3) fallback su stringa/ISO date
    const d = new Date(val);
    if (!isNaN(d)) {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${mm}/${yyyy}`;
    }
    // 4) altro fallback
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
                <td>${valoreProvvigione.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</td>
            `;

            tbody.appendChild(tr);
        });

        // Totale
        totaleSpan.textContent = totale.toLocaleString("it-IT", {
            style: "currency",
            currency: "EUR"
        });
    }

    // 🔁 Ordinamento cliccando sull’intestazione
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

    // 🔍 Filtro in tempo reale
    document.getElementById("filtro-provvigioni-admin").addEventListener("input", function () {
        const valore = this.value.toLowerCase();

        const filtrati = provvigioni.filter(p => {
            return Object.values(p).some(val =>
                val && val.toString().toLowerCase().includes(valore)
            );
        });

        mostraTabella(filtrati);
    });
});
