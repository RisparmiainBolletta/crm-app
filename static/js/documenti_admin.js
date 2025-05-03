console.log("📁 documenti_admin.js caricato correttamente");

export function collegaPulsantiDocumentiAdmin() {
    document.querySelectorAll(".btn-documenti-admin").forEach(btn => {
        btn.addEventListener("click", () => {
            const riga = btn.closest("tr");
            const idCliente = riga.dataset.id;
            const nome = btn.dataset.nome || "";

            // Mostra la modale Admin
            const titolo = document.getElementById("titolo-documenti-admin");
            if (titolo) titolo.textContent = `Documenti Cliente (Admin): ${nome}`;

            const modale = document.getElementById("modale-documenti-admin");
            if (modale) {
                modale.style.display = "block";
                modale.dataset.idCliente = idCliente;
            }

            // Carica documenti
            caricaDocumentiAdmin(idCliente);
        });
    });
}


function caricaDocumentiAdmin(idCliente) {
    fetch(`/files/${idCliente}`)
        .then(res => {
            if (!res.ok) throw new Error("Errore nel recupero file");
            return res.json();
        })
        .then(files => {
            const ul = document.getElementById("lista-documenti-admin");
            if (!ul) return;
            ul.innerHTML = "";

            files.forEach(file => {
                const stato = file.stato || "";
                const li = document.createElement("li");

                // Genera il bottone in base allo stato
                const bottone = stato.toLowerCase() === "approvato"
                    ? `<button class="btn-elimina-file-admin" data-id="${file.id}">🗑️</button>`
                    : `<button class="btn-approva-file" data-id="${file.id}">✅ Approva</button>`;

                li.innerHTML = `
                    ${bottone}
                    <a href="${file.url}" target="_blank" style="margin-left: 8px;">${file.name}</a>
                    <span style="margin-left: auto; font-size: 0.9em; color: gray;">[${stato}]</span>
                `;

                ul.appendChild(li);
            });

            // Elimina file lato admin
            document.querySelectorAll(".btn-elimina-file-admin").forEach(btn => {
                btn.addEventListener("click", () => {
                    const idFile = btn.dataset.id;
                    if (!confirm("Sei sicuro di voler eliminare questo file?")) return;

                    fetch(`/admin/elimina-file/${idFile}`, {
                        method: "DELETE"
                    })
                        .then(res => {
                            if (!res.ok) throw new Error("Errore durante l'eliminazione");
                            return res.json();
                        })
                        .then(data => {
                            alert(data.message);
                            caricaDocumentiAdmin(idCliente);
                        })
                        .catch(err => {
                            console.error("❌ Errore eliminazione file:", err);
                            alert("Errore: " + err.message);
                        });
                });
            });


            // Collega eventi approvazione file
            document.querySelectorAll(".btn-approva-file").forEach(btn => {
                btn.addEventListener("click", () => {
                    const fileId = btn.dataset.id;
                    fetch(`/approva-file/${fileId}`, {
                        method: "POST"
                    })
                        .then(res => res.json())
                        .then(data => {
                            alert(data.message);
                            caricaDocumentiAdmin(idCliente);
                        })
                        .catch(err => alert("Errore approvazione: " + err.message));
                });
            });
        })
        .catch(err => {
            console.error("❌ Errore in caricaDocumentiAdmin:", err);
            alert("Errore nel caricamento documenti admin");
        });
}


// Caricamento file da Admin
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-upload-admin");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const fileInput = document.getElementById("file-allegato-admin");
        const file = fileInput.files[0];
        const idCliente = document.getElementById("modale-documenti-admin").dataset.idCliente;

        if (!file) return alert("Seleziona un file.");

        const formData = new FormData();
        formData.append("file", file);

        fetch(`/admin-upload/${idCliente}`, {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                caricaDocumentiAdmin(idCliente);
                fileInput.value = "";
            })
            .catch(err => alert("Errore: " + err.message));
    });
});
