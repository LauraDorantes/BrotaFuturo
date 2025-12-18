let list = document.querySelectorAll(".navigation li");

function activeLink() {
    list.forEach((item) => {
        item.classList.remove("hovered");
    });
    this.classList.add("hovered");
}

list.forEach((item) => item.addEventListener("mouseover", activeLink));

let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

toggle.onclick = function () {
    navigation.classList.toggle("active");
    main.classList.toggle("active");
}

// CAMBIAR SECCIONES 
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
        const sectionClass = item.getAttribute("data-section");
        
        document.querySelectorAll("section").forEach(sec => {
            sec.classList.add("hidden");
        });
        
        const sectionToShow = document.querySelector(`.${sectionClass}`);
        if (sectionToShow) {
            sectionToShow.classList.remove("hidden");
        }
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    });
});


//MI PERFIL
document.addEventListener("DOMContentLoaded", () => {

    const editBtn = document.getElementById("editBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const perfilForm = document.getElementById("perfilForm");
    const perfilReadOnly = document.getElementById("perfilReadOnly");
    const avatarInput = document.getElementById("avatarInput");
    const perfilAvatar = document.getElementById("perfilAvatar");

    const nombreInput = document.getElementById("nombreInput");
    const aPaternoInput = document.getElementById("aPaternoInput");
    const aMaternoInput = document.getElementById("aMaternoInput");
    const emailInput = document.getElementById("emailInput");
    const phoneInput = document.getElementById("phoneInput");
    const deptInput = document.getElementById("deptInput");
    const sexoInput = document.getElementById("sexoInput");
    const rfcInput = document.getElementById("rfcInput");
    const curpInput = document.getElementById("curpInput");
    const passInput = document.getElementById("passInput");

    const ro_nombre = document.getElementById("ro_nombre");
    const ro_aPaterno = document.getElementById("ro_aPaterno");
    const ro_aMaterno = document.getElementById("ro_aMaterno");
    const ro_sexo = document.getElementById("ro_sexo");
    const ro_email = document.getElementById("ro_email");
    const ro_phone = document.getElementById("ro_phone");
    const ro_dept = document.getElementById("ro_dept");
    const ro_rfc = document.getElementById("ro_rfc");
    const ro_curp = document.getElementById("ro_curp");

    const displayName = document.getElementById("displayName");

    function loadPerfil() {
        const data = JSON.parse(localStorage.getItem("perfilData")) || {};

        if (data.avatar) perfilAvatar.src = data.avatar;

        nombreInput.value = data.nombre || "";
        aPaternoInput.value = data.aPaterno || "";
        aMaternoInput.value = data.aMaterno || "";
        emailInput.value = data.email || "";
        phoneInput.value = data.phone || "";
        deptInput.value = data.dept || "";
        sexoInput.value = data.sexo || "";
        passInput.value = data.password || "";

        rfcInput.value = data.rfc || "";

        ro_curp.textContent = data.curpNombre || "No subido";
        ro_nombre.textContent = data.nombre || "-";
        ro_aPaterno.textContent = data.aPaterno || "-";
        ro_aMaterno.textContent = data.aMaterno || "-";
        ro_sexo.textContent = data.sexo || "-";
        ro_email.textContent = data.email || "-";
        ro_phone.textContent = data.phone || "-";
        ro_dept.textContent = data.dept || "-";
        ro_rfc.textContent = data.rfc || "-";

        displayName.textContent = data.nombre
            ? `${data.nombre} ${data.aPaterno || ""}`.trim()
            : "Nombre Apellido";
    }
    loadPerfil();

    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            perfilAvatar.src = ev.target.result;
            perfilAvatar.dataset.tmp = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    editBtn.addEventListener("click", () => {
        perfilForm.classList.remove("hidden");
        perfilReadOnly.classList.add("hidden");
    });

    cancelBtn.addEventListener("click", () => {
        perfilForm.classList.add("hidden");
        perfilReadOnly.classList.remove("hidden");
        loadPerfil();
        delete perfilAvatar.dataset.tmp;
    });

    perfilForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const curpFile = curpInput.files[0];

        const perfilData = {
            nombre: nombreInput.value.trim(),
            aPaterno: aPaternoInput.value.trim(),
            aMaterno: aMaternoInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            dept: deptInput.value.trim(),
            sexo: sexoInput.value,
            password: passInput.value.trim(),

            avatar: perfilAvatar.dataset.tmp || perfilAvatar.src,
            rfc: rfcInput.value.trim(),
            curpNombre: curpFile ? curpFile.name : ro_curp.textContent
        };

        localStorage.setItem("perfilData", JSON.stringify(perfilData));

        delete perfilAvatar.dataset.tmp;

        loadPerfil();

        perfilForm.classList.add("hidden");
        perfilReadOnly.classList.remove("hidden");
    });
});

// SISTEMA DE PUBLICACIONES
class SistemaPublicaciones {
    constructor() {
        this.publicaciones = JSON.parse(localStorage.getItem('publicaciones')) || [];
        this.init();
    }

    init() {
        this.cargarElementos();
        this.agregarEventListeners();
        this.mostrarPublicaciones();
        this.actualizarEstadisticas();
        this.configurarFechas();
    }

    cargarElementos() {
        this.crearPublicacionBtn = document.getElementById('crearPublicacionBtn');
        this.modalPublicacion = document.getElementById('modalPublicacion');
        this.cerrarModalPub = document.getElementById('cerrarModalPub');
        this.cancelarPublicacionBtn = document.getElementById('cancelarPublicacionBtn');
        this.formPublicacion = document.getElementById('formPublicacion');
        this.modalTitulo = document.getElementById('modalTitulo');
        this.listaPublicaciones = document.getElementById('listaPublicaciones');

        this.filtroEstado = document.getElementById('filtroEstado');

        this.totalPublicaciones = document.getElementById('totalPublicaciones');
        this.activasPublicaciones = document.getElementById('activasPublicaciones');
        this.cerradasPublicaciones = document.getElementById('cerradasPublicaciones');
        this.totalPostulantes = document.getElementById('totalPostulantes');

        this.tituloPub = document.getElementById('tituloPub');
        this.areaPub = document.getElementById('areaPub');
        this.vacantesPub = document.getElementById('vacantesPub');
        this.objetivosPub = document.getElementById('objetivosPub');
        this.actividadesPub = document.getElementById('actividadesPub');
        this.carrerasPub = document.getElementById('carrerasPub');
        this.semestrePub = document.getElementById('semestrePub');
        this.creditosPub = document.getElementById('creditosPub');
        this.conocimientosPub = document.getElementById('conocimientosPub');
        this.habilidadesPub = document.getElementById('habilidadesPub');
        this.modalidadPub = document.getElementById('modalidadPub');
        this.horasPub = document.getElementById('horasPub');
        this.fechaInicioPub = document.getElementById('fechaInicioPub');
        this.fechaLimitePub = document.getElementById('fechaLimitePub');
        this.duracionPub = document.getElementById('duracionPub');
        this.contactoEmailPub = document.getElementById('contactoEmailPub');
        this.contactoTelefonoPub = document.getElementById('contactoTelefonoPub');
        this.infoAdicionalPub = document.getElementById('infoAdicionalPub');
        this.otrosBeneficiosPub = document.getElementById('otrosBeneficiosPub');

        // Datos del profesor
        this.perfilData = JSON.parse(localStorage.getItem('perfilData')) || {};
        this.edicionId = null;
    }

    agregarEventListeners() {
        // Botón crear publicación
        if (this.crearPublicacionBtn) {
            this.crearPublicacionBtn.addEventListener('click', () => this.abrirModalCrear());
        }

        if (this.cerrarModalPub) {
            this.cerrarModalPub.addEventListener('click', () => this.cerrarModal());
        }

        if (this.cancelarPublicacionBtn) {
            this.cancelarPublicacionBtn.addEventListener('click', () => this.cerrarModal());
        }

        if (this.modalPublicacion) {
            this.modalPublicacion.addEventListener('click', (e) => {
                if (e.target === this.modalPublicacion) this.cerrarModal();
            });
        }

        // Botón guardar publicación
        if (this.formPublicacion) {
            this.formPublicacion.addEventListener('submit', (e) => this.guardarPublicacion(e));
        }

        if (this.filtroEstado) {
            this.filtroEstado.addEventListener('change', () => this.mostrarPublicaciones());
        }

        if (this.listaPublicaciones) {
            this.listaPublicaciones.addEventListener('click', (e) => this.manejarAcciones(e));
        }
    }

    configurarFechas() {
        const hoy = new Date().toISOString().split('T')[0];
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

        if (this.fechaInicioPub) {
            this.fechaInicioPub.min = hoy;
            this.fechaInicioPub.value = hoy;
        }

        if (this.fechaLimitePub) {
            this.fechaLimitePub.min = hoy;
            this.fechaLimitePub.value = fechaLimiteStr;
        }
    }

    abrirModalCrear() {
        this.modalTitulo.textContent = 'Crear Nueva Publicación';
        this.formPublicacion.reset();
        this.edicionId = null;
        this.modalPublicacion.classList.remove('hidden');
        this.configurarFechas();

        // Rellenar datos del profesor
        if (this.perfilData.email) {
            this.contactoEmailPub.value = this.perfilData.email;
        }
        if (this.perfilData.phone) {
            this.contactoTelefonoPub.value = this.perfilData.phone;
        }
    }

    abrirModalEditar(id) {
    const publicacion = this.publicaciones.find(p => p.id === id);
    if (!publicacion) return;

    this.modalTitulo.textContent = 'Editar Publicación';
    this.edicionId = id;

    this.tituloPub.value = publicacion.titulo || '';
    this.areaPub.value = publicacion.areaId || publicacion.area || ''; 
    this.vacantesPub.value = publicacion.vacantes || 1;
    this.objetivosPub.value = publicacion.objetivos || '';
    this.actividadesPub.value = publicacion.actividades || '';

    if (publicacion.carreras || publicacion.carrerasIds) {
        const carrerasSelect = this.carrerasPub;
        Array.from(carrerasSelect.options).forEach(option => {
            if (publicacion.carrerasIds && publicacion.carrerasIds.includes(option.value)) {
                option.selected = true;
            } else if (publicacion.carreras && publicacion.carreras.includes(option.text)) {
                option.selected = true;
            } else {
                option.selected = false;
            }
        });
    }

    this.semestrePub.value = publicacion.semestre || '';
    this.creditosPub.value = publicacion.creditos || '';
    this.conocimientosPub.value = publicacion.conocimientos || '';
    this.habilidadesPub.value = publicacion.habilidades || '';
    this.modalidadPub.value = publicacion.modalidad || '';
    this.horasPub.value = publicacion.horas || 10;
    this.fechaInicioPub.value = publicacion.fechaInicio || '';
    this.fechaLimitePub.value = publicacion.fechaLimite || '';
    this.duracionPub.value = publicacion.duracion || 6;
    this.contactoEmailPub.value = publicacion.contactoEmail || '';
    this.contactoTelefonoPub.value = publicacion.contactoTelefono || '';
    this.infoAdicionalPub.value = publicacion.infoAdicional || '';
    this.otrosBeneficiosPub.value = publicacion.otrosBeneficios || '';

    document.querySelectorAll('input[name="beneficios"]').forEach(checkbox => {
        checkbox.checked = publicacion.beneficios && publicacion.beneficios.includes(checkbox.value);
    });

    this.modalPublicacion.classList.remove('hidden');
}

    cerrarModal() {
        this.modalPublicacion.classList.add('hidden');
        this.edicionId = null;
    }

guardarPublicacion(e) {
    e.preventDefault();

    const beneficios = [];
    document.querySelectorAll('input[name="beneficios"]:checked').forEach(checkbox => {
        beneficios.push(checkbox.value);
    });

    const areaSelect = this.areaPub;
    const areaTexto = areaSelect.options[areaSelect.selectedIndex].text;
    
    const carreras = Array.from(this.carrerasPub.selectedOptions).map(o => o.text);
    
    const nuevaVacantes = parseInt(this.vacantesPub.value);
    
    let vacantesDisponibles;
    let postulantes = [];
    
    if (this.edicionId) {
        const publicacionExistente = this.publicaciones.find(p => p.id === this.edicionId);
        postulantes = publicacionExistente ? publicacionExistente.postulantes : [];
        
        const postulantesCount = postulantes.length;
        const vacantesAnteriores = publicacionExistente ? publicacionExistente.vacantes : nuevaVacantes;
        
        if (nuevaVacantes >= postulantesCount) {
            vacantesDisponibles = nuevaVacantes - postulantesCount;
        } else {
            alert(`¡Atención! Ya tienes ${postulantesCount} postulantes. No puedes reducir las vacantes a menos de ${postulantesCount}.`);
            vacantesDisponibles = 0;
            this.vacantesPub.value = postulantesCount; 
        }
    } else {
        vacantesDisponibles = nuevaVacantes;
        postulantes = [];
    }

    const publicacion = {
        id: this.edicionId || Date.now(),
        titulo: this.tituloPub.value,
        area: areaTexto,
        areaId: this.areaPub.value,
        vacantes: nuevaVacantes,
        vacantesDisponibles: vacantesDisponibles,
        objetivos: this.objetivosPub.value,
        actividades: this.actividadesPub.value,
        carreras: carreras,
        carrerasIds: Array.from(this.carrerasPub.selectedOptions).map(o => o.value),
        semestre: this.semestrePub.value ? parseInt(this.semestrePub.value) : null,
        creditos: this.creditosPub.value ? parseInt(this.creditosPub.value) : null,
        conocimientos: this.conocimientosPub.value,
        habilidades: this.habilidadesPub.value,
        modalidad: this.modalidadPub.value,
        horas: parseInt(this.horasPub.value),
        fechaInicio: this.fechaInicioPub.value,
        fechaLimite: this.fechaLimitePub.value,
        duracion: parseInt(this.duracionPub.value),
        beneficios: beneficios,
        otrosBeneficios: this.otrosBeneficiosPub.value,
        contactoEmail: this.contactoEmailPub.value,
        contactoTelefono: this.contactoTelefonoPub.value,
        infoAdicional: this.infoAdicionalPub.value,
        estado: 'activa',
        fechaCreacion: new Date().toISOString(),
        profesor: {
            nombre: this.perfilData.nombre || 'Profesor',
            apellido: this.perfilData.aPaterno || '',
            departamento: this.perfilData.dept || '',
            email: this.perfilData.email || ''
        },
        postulantes: postulantes, 
        fechaActualizacion: new Date().toISOString()
    };

    if (this.edicionId) {
        const index = this.publicaciones.findIndex(p => p.id === this.edicionId);
        if (index !== -1) {
            publicacion.fechaCreacion = this.publicaciones[index].fechaCreacion;
            this.publicaciones[index] = publicacion;
        }
    } else {
        this.publicaciones.unshift(publicacion);
    }

    localStorage.setItem('publicaciones', JSON.stringify(this.publicaciones));

    this.mostrarPublicaciones();
    this.actualizarEstadisticas();
    this.cerrarModal();

    alert(this.edicionId ? 'Publicación actualizada exitosamente' : 'Publicación creada exitosamente');
}

    mostrarPublicaciones() {
        if (!this.listaPublicaciones) return;

        const filtro = this.filtroEstado ? this.filtroEstado.value : 'todas';
        let publicacionesFiltradas = [...this.publicaciones];

        if (filtro !== 'todas') {
            publicacionesFiltradas = publicacionesFiltradas.filter(p => p.estado === filtro);
        }

        // Ordenar por fecha, primero la mas reciente
        publicacionesFiltradas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

        this.listaPublicaciones.innerHTML = publicacionesFiltradas.length > 0
            ? publicacionesFiltradas.map(p => this.generarHTMLPublicacion(p)).join('')
            : '<div class="no-publicaciones"><p>No hay publicaciones disponibles</p></div>';
    }

    generarHTMLPublicacion(publicacion) {
        const fechaCreacion = new Date(publicacion.fechaCreacion).toLocaleDateString('es-MX');
        const postulantesCount = publicacion.postulantes ? publicacion.postulantes.length : 0;

        let estadoVacantes = 'disponible';
        if (publicacion.vacantesDisponibles === 0) estadoVacantes = 'lleno';
        else if (publicacion.vacantesDisponibles / publicacion.vacantes < 0.3) estadoVacantes = 'pocas';

        return `
            <div class="publicacion-card" data-id="${publicacion.id}">
                <div class="publicacion-header">
                    <h3>${publicacion.titulo}</h3>
                    <span class="publicacion-estado ${publicacion.estado}">${publicacion.estado === 'activa' ? 'Activa' : 'Cerrada'}</span>
                </div>
                
                <div class="publicacion-info">
                    <p><strong>Área:</strong> ${publicacion.area}</p>
                    <p><strong>Vacantes:</strong> 
                        <span class="vacantes ${estadoVacantes}">
                            ${publicacion.vacantesDisponibles}/${publicacion.vacantes}
                        </span>
                    </p>
                    <p><strong>Modalidad:</strong> ${publicacion.modalidad}</p>
                    <p><strong>Fecha límite:</strong> ${publicacion.fechaLimite}</p>
                    <p><strong>Postulantes:</strong> ${postulantesCount}</p>
                </div>
                
                <div class="publicacion-actions">
                    <button class="btn btn-small ver-postulantes" data-id="${publicacion.id}">
                        <ion-icon name="people-outline"></ion-icon> Postulantes (${postulantesCount})
                    </button>
                    <button class="btn btn-small outline editar-publicacion" data-id="${publicacion.id}">
                        <ion-icon name="pencil-outline"></ion-icon> Editar
                    </button>
                    <button class="btn btn-small outline eliminar-publicacion" data-id="${publicacion.id}">
                        <ion-icon name="trash-outline"></ion-icon> Eliminar
                    </button>
                    <button class="btn btn-small toggle-estado" data-id="${publicacion.id}">
                        <ion-icon name="${publicacion.estado === 'activa' ? 'lock-closed-outline' : 'lock-open-outline'}"></ion-icon>
                        ${publicacion.estado === 'activa' ? 'Cerrar' : 'Abrir'}
                    </button>
                </div>
                
                <div class="publicacion-footer">
                    <small>Creada: ${fechaCreacion}</small>
                </div>
            </div>
        `;
    }

    manejarAcciones(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const id = parseInt(target.dataset.id);
        const publicacion = this.publicaciones.find(p => p.id === id);
        if (!publicacion) return;

        if (target.classList.contains('editar-publicacion')) {
            this.abrirModalEditar(id);
        }
        else if (target.classList.contains('eliminar-publicacion')) {
            if (confirm('¿Estás seguro de eliminar esta publicación?')) {
                this.eliminarPublicacion(id);
            }
        }
        else if (target.classList.contains('toggle-estado')) {
            this.cambiarEstadoPublicacion(id);
        }
        else if (target.classList.contains('ver-postulantes')) {
            this.verPostulantes(id);
        }
    }

    eliminarPublicacion(id) {
        this.publicaciones = this.publicaciones.filter(p => p.id !== id);
        localStorage.setItem('publicaciones', JSON.stringify(this.publicaciones));
        this.mostrarPublicaciones();
        this.actualizarEstadisticas();
        alert('Publicación eliminada');
    }

    cambiarEstadoPublicacion(id) {
        const index = this.publicaciones.findIndex(p => p.id === id);
        if (index === -1) return;

        this.publicaciones[index].estado =
            this.publicaciones[index].estado === 'activa' ? 'cerrada' : 'activa';

        localStorage.setItem('publicaciones', JSON.stringify(this.publicaciones));
        this.mostrarPublicaciones();
        this.actualizarEstadisticas();
    }

    verPostulantes(id) {
        const publicacion = this.publicaciones.find(p => p.id === id);
        if (!publicacion) return;

        const postulantes = publicacion.postulantes || [];

        if (postulantes.length === 0) {
            alert('No hay postulantes para esta publicación');
            return;
        }

        let mensaje = `Postulantes para: ${publicacion.titulo}\n\n`;
        postulantes.forEach((postulante, index) => {
            mensaje += `${index + 1}. ${postulante.nombre} - ${postulante.correo}\n`;
        });

        alert(mensaje);
    }

    actualizarEstadisticas() {
        const total = this.publicaciones.length;
        const activas = this.publicaciones.filter(p => p.estado === 'activa').length;
        const cerradas = this.publicaciones.filter(p => p.estado === 'cerrada').length;
        const postulantes = this.publicaciones.reduce((sum, p) => sum + (p.postulantes ? p.postulantes.length : 0), 0);

        if (this.totalPublicaciones) this.totalPublicaciones.textContent = total;
        if (this.activasPublicaciones) this.activasPublicaciones.textContent = activas;
        if (this.cerradasPublicaciones) this.cerradasPublicaciones.textContent = cerradas;
        if (this.totalPostulantes) this.totalPostulantes.textContent = postulantes;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const publicacionesSection = document.getElementById('publicaciones-section');
                if (publicacionesSection && !publicacionesSection.classList.contains('hidden')) {
                    // Inicializar publicaciones 
                    window.sistemaPublicaciones = new SistemaPublicaciones();
                }
            }
        });
    });

    const publicacionesSection = document.getElementById('publicaciones-section');
    if (publicacionesSection) {
        observer.observe(publicacionesSection, { attributes: true });
    }

    if (publicacionesSection && !publicacionesSection.classList.contains('hidden')) {
        window.sistemaPublicaciones = new SistemaPublicaciones();
    }
});



//ALUMNOS
document.querySelectorAll(".fila-alumno").forEach(fila => {
    fila.addEventListener("click", () => {

        const nombre = fila.children[2].textContent;
        const correo = fila.children[3].textContent;
        const boleta = fila.children[1].textContent;

        document.getElementById("m_nombre").textContent = nombre;
        document.getElementById("m_correo").textContent = correo;
        document.getElementById("m_boleta").textContent = boleta;

        document.getElementById("m_telefono").textContent = "";
        document.getElementById("m_carrera").textContent = "";
        document.getElementById("m_creditos").textContent = "";
        document.getElementById("m_publicacion").textContent = "";

        document.getElementById("modalAlumno").classList.remove("hidden");
    });
});

//CIERRE DE MODALES EN GENERAL
(function initModals() {
    const modales = document.querySelectorAll('.modal');

    modales.forEach(modal => {
        const closeBtn = modal.querySelector('.close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
        }
    });
})();


//NOTIFICACIONES
const datosAlumnoEjemplo = {
    nombre: "Alumno de Ejemplo",
    creditos: "72.8%",
    correo: "alumno@alumno.ipn.mx",
    carrera: "ISC"
};

//CORREO REPORTE DE ALUMNOS
function enviarReporteAlumnos() {
    // 1. Obtener los datos almacenados en el navegador
    const publicaciones = JSON.parse(localStorage.getItem('publicaciones')) || [];
    const perfil = JSON.parse(localStorage.getItem('perfilData')) || {};

    if (publicaciones.length === 0) {
        alert("No hay proyectos registrados para generar una lista.");
        return;
    }

    // 3. Preparar la firma del profesor con sus datos de perfil
    const nombreProfe = `${perfil.nombre || 'Profesor'} ${perfil.aPaterno || ''} ${perfil.aMaterno || ''}`.trim();
    const departamento = perfil.dept || "Departamento Académico";
    
    //Construir el cuerpo del correo
    let cuerpoMensaje = `Estimados coordinadores de Servicio Social,\n\n`;
    cuerpoMensaje += `Por medio de la presente, envío la lista de alumnos asignados a mis proyectos:\n\n`;

    let totalAlumnos = 0;

    publicaciones.forEach(pub => {
        if (pub.postulantes && pub.postulantes.length > 0) {
            cuerpoMensaje += `------------------------------------------\n`;
            cuerpoMensaje += `PROYECTO: ${pub.titulo.toUpperCase()}\n`;
            cuerpoMensaje += `ÁREA: ${pub.area || 'General'}\n`;
            cuerpoMensaje += `------------------------------------------\n`;

            pub.postulantes.forEach((alumno, index) => {
                cuerpoMensaje += `${index + 1}. ${alumno.nombre} - (${alumno.correo || 'Sin correo registrado'})\n`;
                totalAlumnos++;
            });
            cuerpoMensaje += `\n`;
        }
    });

    if (totalAlumnos === 0) {
        alert("Aún no tienes alumnos aceptados o postulados en tus proyectos.");
        return;
    }

    cuerpoMensaje += `Total de alumnos: ${totalAlumnos}\n\n`;
    cuerpoMensaje += `Atentamente,\n`;
    cuerpoMensaje += `${nombreProfe}\n`;
    cuerpoMensaje += `${departamento}\n`;

    const destinatario = ""; 
    const asunto = `Reporte de Alumnos de Servicio Social - ${nombreProfe}`;
    
    const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoMensaje)}`;

    window.location.href = mailtoLink;
}

document.getElementById("noti1").addEventListener("click", () => {
    document.getElementById("n_nombre").textContent = datosAlumnoEjemplo.nombre;
    document.getElementById("n_creditos").textContent = datosAlumnoEjemplo.creditos;
    document.getElementById("n_correo").textContent = datosAlumnoEjemplo.correo;
    document.getElementById("n_carrera").textContent = datosAlumnoEjemplo.carrera;

    document.getElementById("modalNotificacion").classList.remove("hidden");
});

document.getElementById("btnAceptar").addEventListener("click", () => {
    alert("Alumno aceptado.");
});

document.getElementById("btnRechazar").addEventListener("click", () => {
    alert("Alumno rechazado.");
});