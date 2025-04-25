// Carica dinamicamente il menu "Stato" nella modale nuovo cliente

const statiExtraAdmin = [
    "In lavorazione",
    "Revisione documenti",
    "Attesa attivazione",
    "Esito KO"
];

// NUOVO CLIENTE – Stato
const selectStato = document.getElementById("nuovo-stato");
if (selectStato) {
    fetch("/stati-cliente")
        .then(res => res.json())
        .then(stati => {
            const isAdmin = window.location.pathname.includes("admin");
            selectStato.innerHTML = "";

            // Unisci gli extra solo se admin
            if (isAdmin) stati = stati.concat(statiExtraAdmin);

            stati.forEach(stato => {
                if (!isAdmin && stato === "Contratto ATTIVATO") return;
                const option = document.createElement("option");
                option.value = stato;
                option.textContent = stato;
                selectStato.appendChild(option);
            });
        });
}

// MODIFICA CLIENTE – Stato
const selectModifica = document.getElementById("mod-stato");
if (selectModifica) {
    fetch("/stati-cliente")
        .then(res => res.json())
        .then(stati => {
            const isAdmin = window.location.pathname.includes("admin");
            selectModifica.innerHTML = "";

            if (isAdmin) stati = stati.concat(statiExtraAdmin);

            stati.forEach(stato => {
                if (!isAdmin && stato === "Contratto ATTIVATO") return;
                const option = document.createElement("option");
                option.value = stato;
                option.textContent = stato;
                selectModifica.appendChild(option);
            });
        });
}


// Carica dinamicamente il menu "Categoria"
fetch("/categorie")
    .then(res => res.json())
    .then(categorie => {
        const selectCategoria = document.getElementById("nuovo-categoria");
        categorie.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            selectCategoria.appendChild(option);
        });
    })
    .catch(err => console.error("Errore caricamento categorie:", err));

// Carica dinamicamente il menu "Settore"
fetch("/settori")
    .then(res => res.json())
    .then(settori => {
        const selectSettore = document.getElementById("nuovo-settore");
        settori.forEach(sett => {
            const option = document.createElement("option");
            option.value = sett;
            option.textContent = sett;
            selectSettore.appendChild(option);
        });
    })
    .catch(err => console.error("Errore caricamento settori:", err));


// Menu a tendina MODIFICA – Categoria
fetch("/categorie")
    .then(res => res.json())
    .then(categorie => {
        const select = document.getElementById("mod-categoria");
        categorie.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    })
    .catch(err => console.error("Errore caricamento categorie MODIFICA:", err));

// Menu a tendina MODIFICA – Settore
fetch("/settori")
    .then(res => res.json())
    .then(settori => {
        const select = document.getElementById("mod-settore");
        settori.forEach(sett => {
            const option = document.createElement("option");
            option.value = sett;
            option.textContent = sett;
            select.appendChild(option);
        });
    })
    .catch(err => console.error("Errore caricamento settori MODIFICA:", err));
