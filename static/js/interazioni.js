// interazioni.js - Gestione delle interazioni cliente

export function collegaPulsantiInterazioni() {
    document.querySelectorAll(".btn-interazioni").forEach(btn => {
        btn.addEventListener("click", () => {
            const riga = btn.closest("tr");
            const idCliente = riga.dataset.id;
            const nomeCliente = btn.dataset.nome || "";

            // Mostra titolo con nome cliente
            document.querySelector("#interazioni-titolo").textContent = `Interazioni - ${nomeCliente}`;
            document.querySelector("#modale-interazioni").style.display = "block";
            document.querySelector("#modale-interazioni").dataset.idCliente = idCliente;

            caricaInterazioni(idCliente);
            caricaDropdownInterazioni();
        });
    });
}

// 🟦 Carica i valori dinamici dai dropdown
function caricaDropdownInterazioni() {
    fetch("/tipi-interazione")
        .then(res => res.json())
        .then(tipi => {
            const selectTipo = document.getElementById("int-tipo");
            selectTipo.innerHTML = "";
            tipi.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t;
                opt.textContent = t;
                selectTipo.appendChild(opt);
            });
        });

    fetch("/esiti-interazione")
        .then(res => res.json())
        .then(esiti => {
            const selectEsito = document.getElementById("int-esito");
            selectEsito.innerHTML = "";
            esiti.forEach(e => {
                const opt = document.createElement("option");
                opt.value = e;
                opt.textContent = e;
                selectEsito.appendChild(opt);
            });
        });
}

// 📋 Carica interazioni esistenti
function caricaInterazioni(idCliente) {
    fetch(`/interazioni/${idCliente}`)
        .then(res => res.json())
        .then(interazioni => {
            const tbody = document.querySelector("#tbody-interazioni");
            tbody.innerHTML = "";

            if (!interazioni.length) {
                tbody.innerHTML = "<tr><td colspan='4'>Nessuna interazione trovata.</td></tr>";
                return;
            }

            interazioni.forEach(interazione => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${interazione.Data}</td>
                    <td>${interazione.Tipo}</td>
                    <td>${interazione.Esito}</td>
                    <td>${interazione.Descrizione}</td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// ➕ Gestione inserimento nuova interazione
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-nuova-interazione");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const idCliente = document.querySelector("#modale-interazioni").dataset.idCliente;
        const dataISO = document.getElementById("int-data").value;

        // Converte in formato italiano (gg/mm/aaaa)
        const [yyyy, mm, dd] = dataISO.split("-");
        const data = `${dd}/${mm}/${yyyy}`;

        const tipo = document.getElementById("int-tipo").value;
        const esito = document.getElementById("int-esito").value;
        const descrizione = document.getElementById("int-descrizione").value;

        if (!idCliente || !tipo || !esito) {
            return alert("Compila tutti i campi obbligatori.");
        }

        const nuovaInterazione = {
            ID_Cliente: idCliente,
            Data: data,
            Tipo: tipo,
            Esito: esito,
            Descrizione: descrizione
        };

        fetch("/interazioni", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuovaInterazione)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => {
                        throw new Error(err.message || "Errore sconosciuto");
                    });
                }
                return res.json();
            })
            .then(data => {
                alert(data.message);
                form.reset();
                caricaInterazioni(idCliente);
            })
            .catch(err => {
                console.error("❌ Errore:", err);
                alert("Errore: " + err.message);
            });

    });
});
