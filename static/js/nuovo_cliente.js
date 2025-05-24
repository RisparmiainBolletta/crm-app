// nuovo_cliente.js - Gestione inserimento nuovo cliente

// Funzione per formattare il nome in Title Case
function formattaTitleCase(testo) {
    return testo
        .toLowerCase()
        .split(" ")
        .map(parola => parola.charAt(0).toUpperCase() + parola.slice(1))
        .join(" ");
}

function validaIBAN(iban) {
    const ibanPulito = iban.replace(/\s+/g, "").toUpperCase();
    const regex = /^IT\d{2}[A-Z]\d{10}[0-9A-Z]{12}$/;
    return regex.test(ibanPulito);
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-nuovo-cliente");
    if (!form) return;


    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const nuovoCliente = {
            Nome: formattaTitleCase(document.getElementById("nuovo-nome").value),  // 🔤 Nome formattato
            Categoria: document.getElementById("nuovo-categoria").value,
            POD_PDR: document.getElementById("nuovo-pod").value,
            Settore: document.getElementById("nuovo-settore").value,
            Email: document.getElementById("nuovo-email").value,
            Telefono: document.getElementById("nuovo-telefono").value,
            Citta: document.getElementById("nuovo-citta").value,
            Provincia: document.getElementById("nuovo-provincia").value,
            Nuovo_Fornitore: document.getElementById("nuovo-fornitore").value,
            Codice_Fiscale: document.getElementById("nuovo-cf").value,
            Partita_IVA: document.getElementById("nuovo-piva").value,
            Stato: document.getElementById("nuovo-stato").value,
            Metodo_Pagamento: document.getElementById("nuovo-metodo-pagamento").value,
            IBAN: document.getElementById("nuovo-iban").value,
            Invio_Bolletta: document.getElementById("nuovo-invio-bolletta").value,
            Tipo_richiesta: document.getElementById("nuovo-tipo-richiesta").value,
            Scadenza_Offerta: document.getElementById("nuovo-scadenza-offerta").value
            // Provvigione: document.getElementById("nuovo-provvigione").value,
        };

        // 🔍 Valida IBAN
        const iban = document.getElementById("nuovo-iban").value;
        if (iban && !validaIBAN(iban)) {
            alert("❌ IBAN non valido. Deve essere un IBAN italiano valido (27 caratteri).");
            return;
        }


        fetch("/clienti", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuovoCliente)
        })
            .then(res => {
                if (!res.ok) throw new Error("Errore durante l'inserimento");
                return res.json();
            })
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(err => alert(err.message));
    });
});
