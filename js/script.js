window.addEventListener('DOMContentLoaded', () => {
        const navHeight = document.querySelector('nav').offsetHeight;
        document.querySelector('.contenedorgeneral').style.marginTop = `${navHeight}px`;
});

document.querySelectorAll('nav a[data-target]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('data-target');

    // Oculta todos los contenedores
    document.querySelectorAll('.contenedor1, .contenedor-columnas').forEach(div => {
      div.style.display = 'none';
    });

    // Muestra los div con id="inicio"
    if (targetId === 'inicio') {
      document.querySelectorAll('[id="inicio"]').forEach(div => {
        div.style.display = 'flex';
      });
    } else {
      // Muestra el div de la sección seleccionada
      const targetDiv = document.getElementById(targetId);
      if (targetDiv) {
        targetDiv.style.display = 'flex';
      }
    }
  });
});


//EmailJS
emailjs.init("zNZztQejzII9E9d1V");
document.getElementById("formContacto").addEventListener("submit", function(e){
    e.preventDefault();
    emailjs.sendForm("service_aqnbmhc", "template_sceiohr", this)
        .then(() => {
            Swal.fire({
                title: "Mensaje enviado",
                html: `
                        <video autoplay loop muted playsinline style="width:200px; border-radius:10px;">
                            <source src="./images/MensajeV.mp4" type="video/mp4">
                            Tu navegador no soporta.
                        </video>
                        <p style="margin-top:15px; font-size:16px; text-align:center;">Gracias por contactarnos, te responderemos pronto.</p>
                        `,
                showConfirmButton: true,
                confirmButtonColor: "#059224ff",
                confirmButtonText: "Aceptar",
                width: 500
            });
            this.reset();
        })
        .catch(err => {
            Swal.fire({
                title: "Oops...",
                text: "",
                html: `
                        <video autoplay loop muted playsinline style="width:200px; border-radius:10px;">
                            <source src="./images/ErrorV.mp4" type="video/mp4">
                            Tu navegador no soporta.
                        </video>
                        <p style="margin-top:15px; font-size:16px; text-align:center;">Hubo un error al enviar el mensaje. Intenta de nuevo.</p>
                        `,
                showConfirmButton: true,
                confirmButtonColor: "#d33",
                confirmButtonText: "Reintentar",
                width: 500
            });
            console.error("Error al enviar:", err);
        });
});