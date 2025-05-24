// dashboard_admin.js - Dashboard Admin: riepilogo clienti per stato

document.addEventListener("DOMContentLoaded", () => {
    const selectFiltro = document.getElementById("filtro-dashboard-admin");
    let tuttiClienti = [];

    fetch("/clienti-admin")
        .then(res => res.json())
        .then(clienti => {
            tuttiClienti = clienti;
            popolaFiltroDate(clienti);
            aggiornaDashboard(clienti);

            selectFiltro.addEventListener("change", () => {
                const valore = selectFiltro.value;
                const filtrati = valore
                    ? tuttiClienti.filter(c => {
                        const [gg, mm, aaaa] = (c.Data_Inserimento || "").split("/");
                        return `${mm}/${aaaa}` === valore;
                    })
                    : tuttiClienti;
                aggiornaDashboard(filtrati);
            });
        })
        .catch(err => {
            console.error("Errore nel caricamento dei dati della dashboard admin:", err);
        });
});

function popolaFiltroDate(clienti) {
    const select = document.getElementById("filtro-dashboard-admin");
    const dateUniche = new Set();
    clienti.forEach(c => {
        const data = c.Data_Inserimento;
        if (data) {
            const [gg, mm, aaaa] = data.split("/");
            dateUniche.add(`${mm}/${aaaa}`);
        }
    });

    select.innerHTML = '<option value="">📅 Tutti</option>';
    Array.from(dateUniche).sort().forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        select.appendChild(opt);
    });
}

function aggiornaDashboard(clienti) {
    const conteggi = {};
    clienti.forEach(c => {
        const stato = c.Stato || "Sconosciuto";
        conteggi[stato] = (conteggi[stato] || 0) + 1;
    });
    mostraGrafico(conteggi);
}

function mostraGrafico(conteggi) {
    const canvas = document.getElementById("grafico-admin-stato"); // ✅ corretto
    const ctx = canvas.getContext("2d");
    if (window.chartAdmin) window.chartAdmin.destroy();

    window.chartAdmin = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.entries(conteggi).map(([stato, count]) => `${stato} (${count})`),
            datasets: [
                {
                    data: Object.values(conteggi),
                    backgroundColor: [
                        "#2ecc71",
                        "#f39c12",
                        "#e74c3c",
                        "#f1c40f",
                        "#3498db",
                        "#9b59b6",
                        "#7f8c8d",
                        "#95a5a6"
                    ]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "right"
                }
            }
        }
    });
}
