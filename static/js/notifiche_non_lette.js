// notifiche_non_lette.js
export function mostraNotificheNonLette() {
    fetch("/notifiche-non-letto")
        .then(res => res.json())
        .then(nonLetti => {
            document.querySelectorAll("#tbody-clienti tr").forEach(tr => {
                const idCliente = tr.dataset.id;
                const haNonLetti = nonLetti.includes(idCliente);
                if (haNonLetti) {
                    const primaCella = tr.querySelector("td:first-child");
                    if (primaCella && !primaCella.innerHTML.includes("🔔")) {
                        primaCella.innerHTML = primaCella.innerHTML.trim() + ' <span class="badge-notifica">🔔</span>';
                    }
                }
            });
        });
}
