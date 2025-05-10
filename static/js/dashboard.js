let chart = null; // riferimento globale al grafico

document.addEventListener("DOMContentLoaded", () => {
    fetch("/clienti")
        .then(res => res.json())
        .then(clienti => {
            aggiornaDashboard(clienti); // 🔁 funzione centrale
            popolaFiltro(clienti);      // 🔁 filtro mese/anno
        });
});

function aggiornaDashboard(clienti) {
    const filtro = document.getElementById("filtro-dashboard").value;
    const datiFiltrati = clienti.filter(c => {
        const data = c.Data_Inserimento;
        if (!filtro || !data) return true;
        const [gg, mm, aaaa] = data.split("/");
        return `${mm}/${aaaa}` === filtro;
    });

    const conteggi = {};
    datiFiltrati.forEach(c => {
        const stato = c.Stato || "Sconosciuto";
        conteggi[stato] = (conteggi[stato] || 0) + 1;
    });

    mostraGrafico(conteggi);
}

function mostraGrafico(conteggi) {
    const ctx = document.getElementById("grafico-stato-clienti").getContext("2d");

    if (chart) chart.destroy(); // 🔥 rimuove grafico esistente

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.entries(conteggi).map(([stato, count]) => `${stato} (${count})`),
            datasets: [{
                data: Object.values(conteggi),
                backgroundColor: [
                    "#2ecc71", "#f39c12", "#e74c3c", "#f1c40f",
                    "#3498db", "#9b59b6", "#7f8c8d", "#95a5a6"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 🔧 Consente al canvas di riempire l'area disponibile
            plugins: {
                legend: { position: "right" }
            }
        }
    });
}

function popolaFiltro(clienti) {
    const select = document.getElementById("filtro-dashboard");
    const mesiUnici = new Set();

    clienti.forEach(c => {
        const data = c.Data_Inserimento;
        if (data && data.includes("/")) {
            const [gg, mm, aaaa] = data.split("/");
            mesiUnici.add(`${mm}/${aaaa}`);
        }
    });

    Array.from(mesiUnici).sort().forEach(mese => {
        const opt = document.createElement("option");
        opt.value = mese;
        opt.textContent = mese;
        select.appendChild(opt);
    });

    select.addEventListener("change", () => aggiornaDashboard(clienti));
}
