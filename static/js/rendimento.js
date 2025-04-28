// rendimento.js aggiornato per la nuova struttura JSON

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

    // Caricamento iniziale
    caricaDatiRendimento(meseSelect.value, annoSelect.value);

    function caricaDatiRendimento(mese, anno) {
        fetch(`/api/rendimento?mese=${mese}&anno=${anno}`)
            .then(res => res.json())
            .then(dati => {
                console.log("📊 Dati rendimento ricevuti:", dati);

                const righe = Object.entries(dati).flatMap(([agente, valori]) =>
                    Object.entries(valori).map(([competenza, importo]) => {
                        const [mm, yyyy] = competenza.split("/");
                        return {
                            agente,
                            competenza,
                            importo,
                            timestamp: new Date(`${yyyy}-${mm}-01`).getTime()
                        };
                    })
                );

                righe.sort((a, b) => a.timestamp - b.timestamp);

                const mesiUnici = [...new Set(righe.map(r => r.competenza))];
                const agenti = [...new Set(righe.map(r => r.agente))];

                const serie = agenti.map(agente => {
                    return {
                        name: agente,
                        data: mesiUnici.map(mese => {
                            const riga = righe.find(r => r.agente === agente && r.competenza === mese);
                            return riga ? riga.importo : 0;
                        })
                    };
                });

                generaGraficoRendimento(mesiUnici, serie);
            })
            .catch(err => {
                console.error("❌ Errore nel caricamento del grafico:", err);
                alert("Errore durante il caricamento dei dati.");
            });
    }

    function generaGraficoRendimento(mesi, serie) {
        if (window.chartRendimento) {
            window.chartRendimento.destroy();
        }

        const datasets = serie.map(agente => ({
            label: agente.name,
            data: agente.data,
            backgroundColor: randomColor(),
            borderWidth: 1
        }));

        window.chartRendimento = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: mesi,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value.toLocaleString('it-IT', {
                                    style: 'currency',
                                    currency: 'EUR'
                                });
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let valore = context.raw || 0;
                                return valore.toLocaleString('it-IT', {
                                    style: 'currency',
                                    currency: 'EUR'
                                });
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    function randomColor() {
        const r = Math.floor(Math.random() * 156) + 100;
        const g = Math.floor(Math.random() * 156) + 100;
        const b = Math.floor(Math.random() * 156) + 100;
        return `rgba(${r}, ${g}, ${b}, 0.8)`;
    }
});
