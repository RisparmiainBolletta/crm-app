// dettagli.js – Gestione visualizzazione dettagli cliente

export function collegaPulsantiDettagli() {
    document.querySelectorAll(".btn-dettagli").forEach(btn => {
        btn.addEventListener("click", () => {
            document.getElementById("dettagli-nome").textContent = btn.dataset.nome || "";
            document.getElementById("dettagli-categoria").textContent = btn.dataset.categoria || "";
            document.getElementById("dettagli-pod").textContent = btn.dataset.pod || "";
            document.getElementById("dettagli-settore").textContent = btn.dataset.settore || "";
            document.getElementById("dettagli-email").textContent = btn.dataset.email || "";
            document.getElementById("dettagli-telefono").textContent = btn.dataset.telefono || "";
            document.getElementById("dettagli-citta").textContent = btn.dataset.citta || "";
            document.getElementById("dettagli-provincia").textContent = btn.dataset.provincia || "";
            document.getElementById("dettagli-fornitore").textContent = btn.dataset.fornitore || "";
            document.getElementById("dettagli-cf").textContent = btn.dataset.cf || "";
            document.getElementById("dettagli-piva").textContent = btn.dataset.piva || "";
            document.getElementById("dettagli-stato").textContent = btn.dataset.stato || "";
            const rawProvvigione = btn.dataset.provvigione || "";
            let provvigioneFormattata = rawProvvigione;
            if (!isNaN(rawProvvigione) && rawProvvigione !== "") {
                const valore = parseFloat(rawProvvigione.toString().replace(",", ".")) / 100;
                provvigioneFormattata = valore.toLocaleString("it-IT", {
                    style: "currency",
                    currency: "EUR"
                });
            }
            document.getElementById("dettagli-provvigione").textContent = provvigioneFormattata;


            document.getElementById("modale-dettagli-cliente").style.display = "block";
        });
    });
}

