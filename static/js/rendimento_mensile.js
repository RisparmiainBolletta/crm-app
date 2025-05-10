// rendimento_mensile.js - Visualizza tabella provvigioni mensili per agente

document.addEventListener("DOMContentLoaded", () => {
    const selectAnno = document.getElementById("filtro-anno");
    if (!selectAnno) return;

    const annoCorrente = new Date().getFullYear();
    for (let a = annoCorrente; a >= 2022; a--) {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        selectAnno.appendChild(opt);
    }

    selectAnno.value = annoCorrente;

    selectAnno.addEventListener("change", () => {
        caricaTabella(selectAnno.value);
    });

    caricaTabella(annoCorrente);
});

function caricaTabella(anno) {
    fetch(`/api/rendimento-mensile?anno=${anno}`)
        .then(res => res.json())
        .then(dati => {
            const tbody = document.getElementById("tbody-rendimento");
            if (!tbody) return;

            tbody.innerHTML = "";

            // Inizializza i totali mese
            const totaliMese = {
                Gennaio: 0, Febbraio: 0, Marzo: 0, Aprile: 0, Maggio: 0, Giugno: 0,
                Luglio: 0, Agosto: 0, Settembre: 0, Ottobre: 0, Novembre: 0, Dicembre: 0, Totale: 0
            };

            // Calcola totali
            dati.forEach(riga => {
                for (const mese in totaliMese) {
                    totaliMese[mese] += parseFloat(riga[mese] || 0);
                }
            });

            // Aggiungi riga Totali mese
            const rigaTotali = document.createElement("tr");
            rigaTotali.classList.add("riga-totale");
            rigaTotali.innerHTML = `
                <td class="importo"><strong>Totale mese</strong></td>
                <td class="importo">${totaliMese.Gennaio.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Febbraio.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Marzo.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Aprile.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Maggio.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Giugno.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Luglio.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Agosto.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Settembre.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Ottobre.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Novembre.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo">${totaliMese.Dicembre.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                <td class="importo"><strong>${totaliMese.Totale.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</strong></td>
            `;
            tbody.appendChild(rigaTotali);

            // Aggiungi righe agenti
            dati.forEach(riga => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${riga.Agente || ""}</td>
                    <td class="importo">${(riga.Gennaio || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Febbraio || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Marzo || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Aprile || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Maggio || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Giugno || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Luglio || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Agosto || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Settembre || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Ottobre || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Novembre || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo">${(riga.Dicembre || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</td>
                    <td class="importo"><strong>${(riga.Totale || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}</strong></td>
                `;
                tbody.appendChild(tr);
            });

        })
        .catch(err => {
            console.error("Errore nel caricamento:", err);
            alert("Errore nel caricamento dei dati.");
        });
}
