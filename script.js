window.addEventListener('DOMContentLoaded', () => {
        const navHeight = document.querySelector('nav').offsetHeight;
        document.querySelector('.contenedorgeneral').style.marginTop = `${navHeight}px`;
});

document.querySelectorAll('nav a[data-target]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-target');

        // Oculta todos los contenedores
        document.querySelectorAll('.contenedor1').forEach(div => {
            div.style.display = 'none';
        });

        // Muestra lod div con id inicio
        if (targetId === 'inicio') {
            // Si es la sección de "Inicio", muestra todos los divs con id="inicio"
            document.querySelectorAll('.contenedor1[id="inicio"]').forEach(div => {
                div.style.display = 'flex';
            });
        } else {
            // muestras los div de las otras secciones
            const targetDiv = document.getElementById(targetId);
            if (targetDiv) {
                targetDiv.style.display = 'flex';
            }
        }
    });
});