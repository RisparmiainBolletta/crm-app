// rendimento.js


document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("grafico-rendimento");
    const ctx = canvas.getContext("2d");
    let chart;

    const meseSelect = document.getElementById("filtro-mese");
    const annoSelect = document.getElementById("filtro-anno");
    const btnFiltra = document.getElementById("btn-filtra");

    const oggi = new Date();
    const annoCorrente = oggi.getFullYear();

    // Popola selettore mesi
    for (let i = 1; i <= 12; i++) {
        const opt = document.createElement("option");
        const val = i.toString().padStart(2, "0");
        opt.value = val;
        opt.textContent = val;
        if (i === oggi.getMonth() + 1) opt.selected = true;
        meseSelect.appendChild(opt);
    }

    // Popola selettore anni
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
        fetch(`/api/rendimento?mese=${mese}&anno=${anno}`)
            .then(res => res.json())
            .then(data => {
                if (chart) chart.destroy();

                if (mese) {
                    // ➤ Caso Mese + Anno: Provvigioni per agente
                    const labels = data.map(r => r.agente);
                    const valori = data.map(r => parseFloat(r.totale));

                    chart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: `Provvigioni totali - ${mese}/${anno}`,
                                data: valori,
                                backgroundColor: '#4DA6FF'
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: ctx => `€ ${ctx.raw.toFixed(2)}`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: v => v.toLocaleString("it-IT", {
                                            style: "currency",
                                            currency: "EUR",
                                            minimumFractionDigits: 2
                                        })
                                    }
                                }
                            }

                        }
                    });
                } else {
                    // ➤ Caso Solo Anno: Etichetta "AGENTE - MESE"
                    const labels = data.map(r => `${r.agente} - ${r.mese}`);
                    const valori = data.map(r => parseFloat(r.totale));

                    chart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [{
                                label: `Provvigioni - ${anno}`,
                                data: valori,
                                backgroundColor: '#4DA6FF'
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                label: ctx => ctx.raw.toLocaleString("it-IT", {
                                    style: "currency",
                                    currency: "EUR"
                                })

                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: v => v.toLocaleString("it-IT", {
                                            style: "currency",
                                            currency: "EUR",
                                            minimumFractionDigits: 2
                                        })
                                    }
                                }
                            }

                        }
                    });
                }
            })
            .catch(err => {
                console.error("Errore nel caricamento del grafico:", err);
            });
    }

    // Caricamento iniziale
    caricaDatiRendimento(meseSelect.value, annoSelect.value);
});
