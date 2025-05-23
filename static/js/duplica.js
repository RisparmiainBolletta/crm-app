// duolica.js - Gestione duplica clienti

export function collegaPulsantiDuplica() {
    document.querySelectorAll(".btn-duplica").forEach(btn => {
        btn.addEventListener("click", () => {
            // Compila la modale "Nuovo Cliente" con i dati del cliente selezionato
            document.getElementById("nuovo-nome").value = btn.dataset.nome || "";
            document.getElementById("nuovo-categoria").value = btn.dataset.categoria || "";
            document.getElementById("nuovo-pod").value = btn.dataset.pod || "";
            document.getElementById("nuovo-settore").value = btn.dataset.settore || "";
            document.getElementById("nuovo-email").value = btn.dataset.email || "";
            document.getElementById("nuovo-telefono").value = btn.dataset.telefono || "";
            document.getElementById("nuovo-citta").value = btn.dataset.citta || "";
            document.getElementById("nuovo-provincia").value = btn.dataset.provincia || "";
            document.getElementById("nuovo-fornitore").value = btn.dataset.fornitore || "";
            document.getElementById("nuovo-cf").value = btn.dataset.cf || "";
            document.getElementById("nuovo-piva").value = btn.dataset.piva || "";
            document.getElementById("nuovo-metodo-pagamento").value = btn.dataset.metodo_pagamento || "";
            document.getElementById("nuovo-invio-bolletta").value = btn.dataset.invio_bolletta || "";
            document.getElementById("nuovo-scadenza-offerta").value = btn.dataset.scadenza_offerta || "";

            document.getElementById("nuovo-stato").value = "Nuovo";

            // Mostra la modale
            document.getElementById("modale-nuovo-cliente").style.display = "block";
        });
    });
}
