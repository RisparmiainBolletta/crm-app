
document.addEventListener('DOMContentLoaded', function () {
    const modale = document.getElementById('modale-nuovo-cliente');
    const bottoneApri = document.getElementById('btn-apri-modale');
    const bottoniChiudi = document.querySelectorAll('.close-button');

    if (bottoneApri && modale) {
        bottoneApri.addEventListener('click', function () {
            modale.style.display = 'block';
        });
    }

    bottoniChiudi.forEach(function (btn) {
        btn.addEventListener('click', function () {
            btn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});
