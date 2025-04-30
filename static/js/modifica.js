// modifica.js - Gestione modifica clienti

export function collegaPulsantiModifica() {
    document.querySelectorAll(".btn-modifica").forEach(btn => {
        btn.addEventListener("click", () => {
            const stato = btn.dataset.stato || "";
            if (stato === "Contratto ATTIVATO") {
                alert("❌ Non puoi modificare questo cliente: contratto già attivato.");
                return;
            }
            const riga = btn.closest("tr");
            const idCliente = riga.dataset.id;

            document.getElementById("mod-id-cliente").value = idCliente;
            document.getElementById("mod-nome").value = btn.dataset.nome || "";
            document.getElementById("mod-categoria").value = btn.dataset.categoria || "";
            document.getElementById("mod-pod").value = btn.dataset.pod || "";
            document.getElementById("mod-settore").value = btn.dataset.settore || "";
            document.getElementById("mod-email").value = btn.dataset.email || "";
            document.getElementById("mod-telefono").value = btn.dataset.telefono || "";
            document.getElementById("mod-citta").value = btn.dataset.citta || "";
            document.getElementById("mod-provincia").value = btn.dataset.provincia || "";
            document.getElementById("mod-fornitore").value = btn.dataset.fornitore || "";
            document.getElementById("mod-cf").value = btn.dataset.cf || "";
            document.getElementById("mod-piva").value = btn.dataset.piva || "";
            document.getElementById("mod-stato").value = btn.dataset.stato || "";
            /*document.getElementById("mod-provvigione").value = btn.dataset.provvigione || "";*/

            document.getElementById("modale-modifica-cliente").style.display = "block";
        });
    });
}

// Salvataggio modifiche cliente (questa parte rimane all’avvio normale)
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-modifica");
    if (!form) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const id = document.getElementById("mod-id-cliente").value;

        const datiAggiornati = {
            Nome: document.getElementById("mod-nome").value,
            Categoria: document.getElementById("mod-categoria").value,
            POD_PDR: document.getElementById("mod-pod").value,
            Settore: document.getElementById("mod-settore").value,
            Email: document.getElementById("mod-email").value,
            Telefono: document.getElementById("mod-telefono").value,
            Città: document.getElementById("mod-citta").value,
            Provincia: document.getElementById("mod-provincia").value,
            Nuovo_Fornitore: document.getElementById("mod-fornitore").value,
            Codice_Fiscale: document.getElementById("mod-cf").value,
            Partita_IVA: document.getElementById("mod-piva").value,
            Stato: document.getElementById("mod-stato").value,
            // Provvigione: document.getElementById("mod-provvigione").value,
        };

        const urlBase = window.location.pathname.includes("admin") ? "/admin/clienti" : "/clienti";
        fetch(`${urlBase}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datiAggiornati)
        })
            .then(res => {
                if (!res.ok) throw new Error("Errore durante la modifica");
                alert("Modifica salvata!");
                location.reload();
            })
            .catch(err => alert(err.message));
    });
});
