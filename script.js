new Swiper('.card-wrapper', {
  loop: true,
  spaceBetween: 30,

  // Pagination bullets
  pagination: {
    el: '.swiper-pagination',
    clickable : true,
    dymanicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  breakpoints: {
    0:{
        slidesPerView: 1
    },
    768:{
        slidesPerView: 2
    },
    1024:{
        slidesPerView: 3
    },

  }
});

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

        // Muestra el contenedor correspondiente
        const targetDiv = document.getElementById(targetId);
        if (targetDiv) {
            targetDiv.style.display = 'block';
        }
    });
});