
// documenti.js – gestione documenti cliente

export function collegaPulsantiDocumenti() {
    document.querySelectorAll(".btn-documenti").forEach(btn => {
        btn.addEventListener("click", () => {
            const riga = btn.closest("tr");
            const stato = riga.querySelector("td:nth-child(7)")?.textContent.trim();

            const uploadForm = document.getElementById("form-upload-file");
            if (stato === "Contratto ATTIVATO") {
                uploadForm.style.display = "none";
            } else {
                uploadForm.style.display = "block";
            }
            const idCliente = riga.dataset.id;
            const nomeCliente = btn.dataset.nome || "Cliente";

            // Mostra il nome cliente nella modale
            const titolo = document.getElementById("titolo-documenti");
            if (titolo) titolo.textContent = `Documenti Cliente: ${nomeCliente}`;

            // Segna come letti i file di questo cliente
            fetch(`/files/segna-letti/${idCliente}`, { method: "POST" }).then(() => {
                const nomeCell = riga.querySelector("td:first-child");
                if (nomeCell?.innerHTML.includes("🔔")) {
                    nomeCell.innerHTML = nomeCell.innerHTML.replace("🔔", "").trim();
                }
            });

            document.getElementById("modale-documenti").style.display = "block";
            document.getElementById("modale-documenti").dataset.idCliente = idCliente;

            caricaDocumenti(idCliente);
        });
    });
}

function caricaDocumenti(idCliente) {
    fetch(`/files/${idCliente}`)
        .then(res => {
            if (!res.ok) throw new Error("Errore nel recupero file");
            return res.json();
        })
        .then(files => {
            const ul = document.getElementById("lista-documenti");
            ul.innerHTML = "";

            files.forEach(file => {
                const li = document.createElement("li");

                // Se il file è approvato, mostra solo la spunta
                if (file.stato?.toLowerCase() === "approvato") {
                    li.innerHTML = `
                        <span style="color: green;">✅</span>
                        <a href="${file.url}" target="_blank" style="margin-left: 20px; font-size: 0.75em;">${file.name}</a>
                    `;
                } else {
                    // File non approvato → mostra tasto elimina
                    li.innerHTML = `
                        <button class="btn-elimina-file" data-id="${file.id}">🗑️</button>
                        <a href="${file.url}" target="_blank" style="margin-left: 8px; font-size: 0.75em;">${file.name}</a>
                    `;
                }

                ul.appendChild(li);
            });


            // Collega eventi elimina
            import("./gestione_file.js").then(modulo => {
                modulo.aggiungiGestioneEliminazioneFile(idCliente);
            });

            // Aggiorna badge 📎
            return fetch("/conteggio-documenti");
        })
        .then(res => {
            if (!res.ok) throw new Error("Errore conteggio documenti");
            return res.json();
        })
        .then(conteggi => {
            const riga = document.querySelector(`tr[data-id='${idCliente}']`);
            const btnDocumenti = riga?.querySelector(".btn-documenti");
            if (btnDocumenti) {
                const numero = conteggi[idCliente] || 0;
                btnDocumenti.innerHTML = `📎Documenti` + (numero > 0
                    ? ` <span style="background: #00d1b2; color: white; padding: 6px; border-radius: 10px; font-size: 0.7em;">(${numero})</span>`
                    : '');
            }
        })
        .catch(err => {
            console.error("❌ Errore in caricaDocumenti:", err);
            alert("Errore nel caricamento dei documenti.");
        });
}

// 🔒 Gestione APPROVA FILE (solo Admin)
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-approva-file")) {
        const fileId = e.target.dataset.id;
        const idCliente = document.getElementById("modale-documenti").dataset.idCliente;

        fetch(`/approva-file/${fileId}`, {
            method: "POST"
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                caricaDocumenti(idCliente);
            })
            .catch(err => {
                console.error("❌ Errore approvazione:", err);
                alert("Errore durante l'approvazione.");
            });
    }
});

// Gestione unica del form upload
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-upload-file");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            console.log("➡️ Form submit: carico file");

            const fileInput = form.querySelector("input[type='file']");
            const file = fileInput.files[0];
            const idCliente = document.getElementById("modale-documenti").dataset.idCliente;
            if (!file) return alert("Seleziona un file.");

            const formData = new FormData();
            formData.append("file", file);

            // 🔁 Indica il ruolo (admin o agente)
            const ruolo = window.location.pathname.includes("admin") ? "admin" : "agente";
            formData.append("ruolo", ruolo);

            fetch(`/upload/${idCliente}`, {
                method: "POST",
                body: formData
            })
                .then(async res => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ error: "Errore generico" }));
                        throw new Error(err.error || "Errore generico");
                    }
                    return res.json();
                })
                .then(data => {
                    alert(data.message);
                    fileInput.value = "";

                    // 🔁 Ricarica i documenti
                    caricaDocumenti(idCliente);

                    // 🔔 Ricarica le notifiche per l’altro ruolo
                    import("./notifiche_non_lette.js").then(mod => {
                        mod.mostraNotificheNonLette();
                    });
                })
                .catch(err => {
                    console.error("❌ ERRORE UPLOAD:", err);
                    alert("Errore: " + err.message);
                });
        });
    }
});
