// rendimento_agente.js - grafico lato Agente

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("grafico-rendimento-agente");
    const ctx = canvas.getContext("2d");
    let chart;

    const meseSelect = document.getElementById("filtro-mese");
    const annoSelect = document.getElementById("filtro-anno");
    const btnFiltra = document.getElementById("btn-filtra");

    const oggi = new Date();
    const annoCorrente = oggi.getFullYear();

    // Popola selettore mesi
    for (let i = 1; i <= 12; i++) {
        const val = i.toString().padStart(2, "0");
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        if (i === oggi.getMonth() + 1) opt.selected = true;
        meseSelect.appendChild(opt);
    }

    // Popola selettore anni (ultimi 5)
    for (let a = annoCorrente - 5; a <= annoCorrente; a++) {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        if (a === annoCorrente) opt.selected = true;
        annoSelect.appendChild(opt);
    }

    btnFiltra.addEventListener("click", () => {
        const mese = meseSelect.value;
        const anno = annoSelect.value;
        caricaDatiRendimento(mese, anno);
    });

    function caricaDatiRendimento(mese, anno) {
        fetch(`/api/rendimento-agente?mese=${mese}&anno=${anno}`)
            .then(res => res.json())
            .then(dati => {
                if (chart) chart.destroy();

                const labels = dati.map(d => d.competenza);
                const valori = dati.map(d => d.totale);

                chart = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "Provvigioni (€)",
                            data: valori,
                            backgroundColor: "#4caf50"
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,  // ✅ questa riga è fondamentale
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: "Provvigioni per mese"
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: value => `€ ${value.toLocaleString("it-IT")}`
                                }
                            }
                        }
                    }

                });
            })
            .catch(err => {
                console.error("❌ Errore nel caricamento del rendimento agente:", err);
                alert("Errore durante il caricamento del grafico.");
            });
    }

    // Caricamento iniziale
    caricaDatiRendimento(meseSelect.value, annoSelect.value);
});
