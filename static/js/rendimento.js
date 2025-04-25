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

                // ✅ Conversione sicura come in provvigioni.js
                const valori = data.map(r => {
                    const testo = r.totale?.toString().replace(",", ".");
                    const num = parseFloat(testo);
                    return isNaN(num) ? 0 : num;
                });

                const labels = mese
                    ? data.map(r => r.agente)
                    : data.map(r => `${r.agente} - ${r.mese}`);

                const titolo = mese
                    ? `Provvigioni totali - ${mese}/${anno}`
                    : `Provvigioni - ${anno}`;

                chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: titolo,
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
                                    label: ctx => ctx.raw.toLocaleString("it-IT", {
                                        style: "currency",
                                        currency: "EUR"
                                    })
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
            })
            .catch(err => {
                console.error("❌ Errore nel caricamento del grafico:", err);
            });
    }




    // Caricamento iniziale
    caricaDatiRendimento(meseSelect.value, annoSelect.value);
});
