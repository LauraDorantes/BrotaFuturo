/**
 * scripts_estudiante.js
 * Script principal para la interfaz de estudiantes en BrotaFuturo
 * 
 * Funcionalidades principales:
 * - Navegación entre secciones
 * - Gestión de perfil personal
 * - Subida y actualización de CV
 * - Visualización de vacantes disponibles
 * - Postulación a vacantes
 * - Gestión de mensajes con profesores y empresas
 */

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

/**
 * URL base de la API
 * Cambiar según el entorno (desarrollo/producción)
 */
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Almacenamiento del token de autenticación y datos del usuario
 */
let authToken = localStorage.getItem('authToken');
let refreshToken = localStorage.getItem('refreshToken');
let currentUser = null;

// ============================================
// UTILIDADES Y HELPERS
// ============================================

/**
 * Función auxiliar para hacer peticiones HTTP autenticadas
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch (method, body, headers, etc.)
 * @returns {Promise} - Promesa con la respuesta
 */
async function fetchAPI(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Agregar token de autenticación si está disponible
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers
        });

        // Si el token expiró, intentar refrescarlo
        if (response.status === 401 && refreshToken) {
            const newToken = await refreshAuthToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                return await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
            } else {
                // Si no se puede refrescar, redirigir al login
                window.location.href = 'login.html';
                return;
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error en la petición' }));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        throw error;
    }
}

/**
 * Refrescar el token de autenticación
 * @returns {Promise<string|null>} - Nuevo token o null si falla
 */
async function refreshAuthToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.accessToken;
            localStorage.setItem('authToken', authToken);
            return authToken;
        }
    } catch (error) {
        console.error('Error al refrescar token:', error);
    }
    return null;
}

/**
 * Mostrar mensaje de error al usuario
 * @param {string} message - Mensaje a mostrar
 */
function showError(message) {
    alert(`Error: ${message}`);
}

/**
 * Mostrar mensaje de éxito al usuario
 * @param {string} message - Mensaje a mostrar
 */
function showSuccess(message) {
    alert(`Éxito: ${message}`);
}

// ============================================
// NAVEGACIÓN Y UI
// ============================================

/**
 * Configurar navegación lateral y toggle
 */
document.addEventListener('DOMContentLoaded', () => {
    // Navegación hover
    let list = document.querySelectorAll(".navigation li");
    
    function activeLink() {
        list.forEach((item) => {
            item.classList.remove("hovered");
        });
        this.classList.add("hovered");
    }
    
    list.forEach((item) => item.addEventListener("mouseover", activeLink));

    // Toggle del menú lateral
    let toggle = document.querySelector(".toggle");
    let navigation = document.querySelector(".navigation");
    let main = document.querySelector(".main");

    if (toggle) {
        toggle.onclick = function () {
            navigation.classList.toggle("active");
            main.classList.toggle("active");
        };
    }

    // Cambiar entre secciones
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            const sectionClass = item.getAttribute("data-section");
            
            // Ocultar todas las secciones
            document.querySelectorAll("section").forEach(sec => {
                sec.classList.add("hidden");
            });
            
            // Mostrar la sección seleccionada
            const sectionToShow = document.querySelector(`#${sectionClass}`);
            if (sectionToShow) {
                sectionToShow.classList.remove("hidden");
            }
            
            // Remover clase active de todos los items
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Agregar clase active al item seleccionado
            item.classList.add('active');
            
            // Cerrar modales abiertos
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });

            // Cargar datos según la sección
            if (sectionClass === 'vacantes-section') {
                cargarVacantes();
            } else if (sectionClass === 'postulaciones-section') {
                cargarPostulaciones();
            } else if (sectionClass === 'mensajes-section') {
                cargarMensajesRecibidos();
            }
        });
    });

    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                window.location.href = 'login.html';
            }
        });
    }

    // Cargar perfil del usuario al iniciar
    cargarPerfil();

    // Configurar buscador global del topbar
    const searchInput = document.querySelector('.topbar .search input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = searchInput.value.trim().toLowerCase();
                
                if (!searchTerm) return;

                // Buscar en la sección activa
                const activeSection = document.querySelector('section:not(.hidden)');
                if (activeSection) {
                    const sectionId = activeSection.id;
                    
                    if (sectionId === 'vacantes-section') {
                        // Buscar en vacantes
                        const buscarInput = document.getElementById('buscarVacante');
                        if (buscarInput) {
                            buscarInput.value = searchTerm;
                            // Disparar evento input para activar el filtro
                            buscarInput.dispatchEvent(new Event('input'));
                        }
                    } else if (sectionId === 'postulaciones-section') {
                        // Buscar en postulaciones (en el título de la vacante)
                        buscarEnPostulaciones(searchTerm);
                    } else if (sectionId === 'mensajes-section') {
                        // Buscar en mensajes (asunto o contenido)
                        buscarEnMensajes(searchTerm);
                    }
                }
            }
        });
    }
});

// ============================================
// GESTIÓN DE PERFIL
// ============================================

/**
 * Cargar datos del perfil del estudiante desde la API
 */
async function cargarPerfil() {
    try {
        const data = await fetchAPI('/auth/me');
        
        if (data.user) {
            currentUser = data.user;
            mostrarPerfil(data.user);
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        showError('No se pudo cargar el perfil. Verifica tu conexión.');
    }
}

/**
 * Mostrar datos del perfil en la interfaz
 * @param {object} usuario - Datos del usuario
 */
function mostrarPerfil(usuario) {
    // Llenar campos de solo lectura
    const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidoPaterno || ''} ${usuario.apellidoMaterno || ''}`.trim();
    
    document.getElementById('displayName').textContent = nombreCompleto || 'Usuario';
    document.getElementById('displayBoleta').textContent = `Boleta: ${usuario.boleta || '-'}`;
    document.getElementById('displayCarrera').textContent = `Carrera: ${usuario.carrera || '-'}`;
    
    // Llenar vista de solo lectura
    document.getElementById('ro_nombre').textContent = nombreCompleto || '-';
    document.getElementById('ro_sexo').textContent = usuario.sexo || '-';
    document.getElementById('ro_curp').textContent = usuario.curp || '-';
    document.getElementById('ro_email').textContent = usuario.correo || '-';
    document.getElementById('ro_phone').textContent = usuario.telefono || '-';
    document.getElementById('ro_carrera').textContent = usuario.carrera || '-';
    document.getElementById('ro_creditos').textContent = usuario.creditos || '-';
    
    // Llenar formulario de edición
    document.getElementById('nombreInput').value = usuario.nombres || '';
    document.getElementById('aPaternoInput').value = usuario.apellidoPaterno || '';
    document.getElementById('aMaternoInput').value = usuario.apellidoMaterno || '';
    document.getElementById('emailInput').value = usuario.correo || '';
    document.getElementById('phoneInput').value = usuario.telefono || '';
    document.getElementById('boletaInput').value = usuario.boleta || '';
    document.getElementById('sexoInput').value = usuario.sexo || '';
    document.getElementById('carreraInput').value = usuario.carrera || '';
    document.getElementById('creditosInput').value = usuario.creditos || '';
    document.getElementById('curpInput').value = usuario.curp || '';
    
    // Gestión de CV
    if (usuario.cvID) {
        const cvUrl = `https://drive.google.com/uc?id=${usuario.cvID}`;
        document.getElementById('cvMessage').textContent = 'CV cargado';
        const cvDownloadLink = document.getElementById('cvDownloadLink');
        cvDownloadLink.href = cvUrl;
        cvDownloadLink.classList.remove('hidden');
        document.getElementById('cvUploadText').textContent = 'Actualizar CV';
    } else {
        document.getElementById('cvMessage').textContent = 'No hay CV cargado';
        document.getElementById('cvDownloadLink').classList.add('hidden');
        document.getElementById('cvUploadText').textContent = 'Subir CV';
    }
}

/**
 * Configurar eventos del formulario de perfil
 */
document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const perfilForm = document.getElementById('perfilForm');
    const perfilReadOnly = document.getElementById('perfilReadOnly');

    // Botón editar
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            perfilForm.classList.remove('hidden');
            perfilReadOnly.classList.add('hidden');
        });
    }

    // Botón cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            perfilForm.classList.add('hidden');
            perfilReadOnly.classList.remove('hidden');
            cargarPerfil(); // Recargar datos originales
        });
    }

    // Envío del formulario
    if (perfilForm) {
        perfilForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // TODO: Implementar actualización de perfil cuando exista el endpoint
            // Por ahora solo guardamos en localStorage como ejemplo
            const formData = {
                nombres: document.getElementById('nombreInput').value,
                apellidoPaterno: document.getElementById('aPaternoInput').value,
                apellidoMaterno: document.getElementById('aMaternoInput').value,
                correo: document.getElementById('emailInput').value,
                telefono: document.getElementById('phoneInput').value,
                sexo: document.getElementById('sexoInput').value,
                carrera: document.getElementById('carreraInput').value,
                creditos: parseInt(document.getElementById('creditosInput').value)
            };

            try {
                // Llamada a la API para actualizar el perfil
                const response = await fetchAPI('/alumnos/perfil', { 
                    method: 'PUT', 
                    body: JSON.stringify(formData) 
                });
                
                if (response.user) {
                    currentUser = response.user;
                    showSuccess('Perfil actualizado correctamente');
                    perfilForm.classList.add('hidden');
                    perfilReadOnly.classList.remove('hidden');
                    mostrarPerfil(response.user);
                }
            } catch (error) {
                showError(error.message || 'Error al actualizar el perfil');
            }
        });
    }

    // Gestión de CV
    const cvInput = document.getElementById('cvInput');
    if (cvInput) {
        cvInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validar tipo de archivo
            const allowedTypes = ['.pdf', '.doc', '.docx'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!allowedTypes.includes(fileExtension)) {
                showError('Formato no válido. Solo se permiten PDF, DOC y DOCX');
                return;
            }

            // Validar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('El archivo es demasiado grande. Máximo 5MB');
                return;
            }

            try {
                await subirCV(file);
            } catch (error) {
                showError('Error al subir el CV');
            }
        });
    }
});

/**
 * Subir o actualizar CV
 * @param {File} file - Archivo del CV
 */
async function subirCV(file) {
    try {
        const formData = new FormData();
        formData.append('cvFile', file);

        const url = currentUser && currentUser.cvID 
            ? '/alumnos/actualizarCV' 
            : '/alumnos/subirCV';

        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: url.includes('actualizar') ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error al subir CV' }));
            throw new Error(errorData.message);
        }

        const data = await response.json();
        showSuccess('CV subido correctamente');
        
        // Actualizar información del CV en la interfaz
        if (data.data && data.data.cvURL) {
            const cvDownloadLink = document.getElementById('cvDownloadLink');
            cvDownloadLink.href = data.data.cvURL;
            cvDownloadLink.classList.remove('hidden');
            document.getElementById('cvMessage').textContent = 'CV cargado';
            document.getElementById('cvUploadText').textContent = 'Actualizar CV';
        }

        // Recargar perfil para obtener datos actualizados
        cargarPerfil();
    } catch (error) {
        console.error('Error al subir CV:', error);
        throw error;
    }
}

// ============================================
// GESTIÓN DE VACANTES
// ============================================

/**
 * Cargar todas las vacantes disponibles
 */
async function cargarVacantes() {
    const listaVacantes = document.getElementById('listaVacantes');
    if (!listaVacantes) return;

    listaVacantes.innerHTML = '<div class="loading-message">Cargando vacantes...</div>';

    try {
        const vacantes = await fetchAPI('/vacantes');
        
        if (!vacantes || vacantes.length === 0) {
            listaVacantes.innerHTML = '<div class="no-publicaciones"><p>No hay vacantes disponibles en este momento</p></div>';
            return;
        }

        listaVacantes.innerHTML = '';
        vacantes.forEach(vacante => {
            listaVacantes.appendChild(crearCardVacante(vacante));
        });

        // Configurar filtros
        configurarFiltrosVacantes(vacantes);
    } catch (error) {
        console.error('Error al cargar vacantes:', error);
        listaVacantes.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar las vacantes</div>';
    }
}

/**
 * Crear tarjeta de vacante para mostrar en la lista
 * @param {object} vacante - Datos de la vacante
 * @returns {HTMLElement} - Elemento HTML de la tarjeta
 */
function crearCardVacante(vacante) {
    const card = document.createElement('div');
    card.className = `vacante-card ${vacante.propietarioTipo.toLowerCase()}`;
    card.dataset.vacanteId = vacante._id;

    const tipoLabel = vacante.propietarioTipo === 'Profesor' ? 'Profesor' : 'Empresa/Institución';
    const tipoClass = vacante.propietarioTipo === 'Profesor' ? 'profesor' : 'institucion';

    card.innerHTML = `
        <div class="vacante-tipo ${tipoClass}">${tipoLabel}</div>
        <div class="publicacion-header">
            <h3>${vacante.titulo || 'Sin título'}</h3>
        </div>
        <div class="publicacion-info">
            <p><strong>Descripción:</strong> ${(vacante.descripcion || '').substring(0, 100)}${vacante.descripcion && vacante.descripcion.length > 100 ? '...' : ''}</p>
            ${vacante.salario ? `<p><strong>Salario:</strong> $${vacante.salario.toLocaleString()}</p>` : ''}
            <p><strong>Fecha publicación:</strong> ${new Date(vacante.fechaPublicacion).toLocaleDateString('es-ES')}</p>
        </div>
        <div class="publicacion-actions">
            <button class="btn btn-primary ver-vacante" data-vacante-id="${vacante._id}">
                <ion-icon name="eye-outline"></ion-icon> Ver Detalles
            </button>
            <button class="btn btn-small postularse-vacante" data-vacante-id="${vacante._id}">
                <ion-icon name="send-outline"></ion-icon> Postularse
            </button>
        </div>
    `;

    // Event listeners
    card.querySelector('.ver-vacante').addEventListener('click', () => mostrarDetalleVacante(vacante));
    card.querySelector('.postularse-vacante').addEventListener('click', () => abrirModalPostulacion(vacante));

    return card;
}

/**
 * Configurar filtros de búsqueda para vacantes
 * @param {array} vacantes - Lista de todas las vacantes
 */
function configurarFiltrosVacantes(vacantes) {
    const filtroTipo = document.getElementById('filtroTipo');
    const buscarInput = document.getElementById('buscarVacante');

    if (filtroTipo) {
        filtroTipo.addEventListener('change', () => filtrarVacantes(vacantes));
    }

    if (buscarInput) {
        buscarInput.addEventListener('input', () => filtrarVacantes(vacantes));
    }
}

/**
 * Filtrar vacantes según los criterios seleccionados
 * @param {array} vacantes - Lista completa de vacantes
 */
function filtrarVacantes(vacantes) {
    const filtroTipo = document.getElementById('filtroTipo')?.value || '';
    const buscarTexto = document.getElementById('buscarVacante')?.value.toLowerCase() || '';
    const listaVacantes = document.getElementById('listaVacantes');

    if (!listaVacantes) return;

    let vacantesFiltradas = vacantes;

    // Filtrar por tipo
    if (filtroTipo) {
        vacantesFiltradas = vacantesFiltradas.filter(v => 
            v.propietarioTipo === filtroTipo
        );
    }

    // Filtrar por búsqueda de texto
    if (buscarTexto) {
        vacantesFiltradas = vacantesFiltradas.filter(v => 
            (v.titulo && v.titulo.toLowerCase().includes(buscarTexto)) ||
            (v.descripcion && v.descripcion.toLowerCase().includes(buscarTexto))
        );
    }

    // Mostrar resultados
    listaVacantes.innerHTML = '';
    if (vacantesFiltradas.length === 0) {
        listaVacantes.innerHTML = '<div class="no-publicaciones"><p>No se encontraron vacantes con los criterios seleccionados</p></div>';
    } else {
        vacantesFiltradas.forEach(vacante => {
            listaVacantes.appendChild(crearCardVacante(vacante));
        });
    }
}

/**
 * Mostrar detalle completo de una vacante
 * @param {object} vacante - Datos de la vacante
 */
function mostrarDetalleVacante(vacante) {
    // Implementar modal con detalles completos si es necesario
    alert(`Título: ${vacante.titulo}\n\nDescripción: ${vacante.descripcion}\n\nRequisitos: ${vacante.requisitos?.join(', ')}`);
}

/**
 * Abrir modal para postularse a una vacante
 * @param {object} vacante - Datos de la vacante
 */
function abrirModalPostulacion(vacante) {
    const modal = document.getElementById('modalPostulacion');
    const vacanteInfo = document.getElementById('vacanteInfoModal');
    const formPostulacion = document.getElementById('formPostulacion');

    if (!modal || !vacanteInfo) return;

    // Mostrar información de la vacante
    vacanteInfo.innerHTML = `
        <h4>${vacante.titulo}</h4>
        <p><strong>Tipo:</strong> ${vacante.propietarioTipo}</p>
        <p><strong>Descripción:</strong> ${vacante.descripcion}</p>
        ${vacante.requisitos && vacante.requisitos.length > 0 ? 
            `<p><strong>Requisitos:</strong> ${vacante.requisitos.join(', ')}</p>` : ''}
    `;

    // Guardar ID de la vacante en el formulario
    formPostulacion.dataset.vacanteId = vacante._id;

    // Mostrar modal
    modal.classList.remove('hidden');

    // Configurar eventos del modal
    const cerrarBtn = document.getElementById('cerrarModalPostulacion');
    const cancelarBtn = document.getElementById('cancelarPostulacionBtn');

    const cerrarModal = () => modal.classList.add('hidden');

    if (cerrarBtn) cerrarBtn.onclick = cerrarModal;
    if (cancelarBtn) cancelarBtn.onclick = cerrarModal;

    // Envío del formulario
    formPostulacion.onsubmit = async (e) => {
        e.preventDefault();
        const mensaje = document.getElementById('mensajePostulacion').value;
        
        try {
            await crearPostulacion(vacante._id, mensaje);
            cerrarModal();
            showSuccess('Postulación enviada correctamente');
            formPostulacion.reset();
        } catch (error) {
            showError(error.message || 'Error al enviar la postulación');
        }
    };
}

/**
 * Crear una nueva postulación
 * @param {string} vacanteId - ID de la vacante
 * @param {string} mensaje - Mensaje opcional del estudiante
 */
async function crearPostulacion(vacanteId, mensaje = '') {
    try {
        const data = await fetchAPI('/postulaciones', {
            method: 'POST',
            body: JSON.stringify({
                vacanteId,
                mensaje
            })
        });

        return data;
    } catch (error) {
        console.error('Error al crear postulación:', error);
        throw error;
    }
}

// ============================================
// GESTIÓN DE POSTULACIONES
// ============================================

/**
 * Cargar las postulaciones del estudiante
 */
async function cargarPostulaciones() {
    const listaPostulaciones = document.getElementById('listaPostulaciones');
    if (!listaPostulaciones) return;

    listaPostulaciones.innerHTML = '<div class="loading-message">Cargando postulaciones...</div>';

    try {
        const estadoFiltro = document.getElementById('filtroEstadoPostulacion')?.value || '';
        const url = estadoFiltro ? `/postulaciones/mis-postulaciones?estado=${estadoFiltro}` : '/postulaciones/mis-postulaciones';
        
        const postulaciones = await fetchAPI(url);

        if (!postulaciones || postulaciones.length === 0) {
            listaPostulaciones.innerHTML = '<div class="no-publicaciones"><p>No tienes postulaciones</p></div>';
            return;
        }

        listaPostulaciones.innerHTML = '';
        postulaciones.forEach(postulacion => {
            listaPostulaciones.appendChild(crearCardPostulacion(postulacion));
        });

        // Configurar filtro de estado
        const filtroEstado = document.getElementById('filtroEstadoPostulacion');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', () => cargarPostulaciones());
        }
    } catch (error) {
        console.error('Error al cargar postulaciones:', error);
        listaPostulaciones.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar las postulaciones</div>';
    }
}

/**
 * Crear tarjeta de postulación
 * @param {object} postulacion - Datos de la postulación
 * @returns {HTMLElement} - Elemento HTML de la tarjeta
 */
function crearCardPostulacion(postulacion) {
    const card = document.createElement('div');
    card.className = `postulacion-card ${postulacion.estado}`;

    const vacante = postulacion.vacante || {};
    const estadoLabels = {
        'pendiente': 'Pendiente',
        'aceptada': 'Aceptada',
        'rechazada': 'Rechazada'
    };

    card.innerHTML = `
        <div class="publicacion-header">
            <h3>${vacante.titulo || 'Vacante'}</h3>
            <span class="postulacion-estado ${postulacion.estado}">${estadoLabels[postulacion.estado] || postulacion.estado}</span>
        </div>
        <div class="publicacion-info">
            <p><strong>Tipo:</strong> ${postulacion.vacante?.propietarioTipo || '-'}</p>
            <p><strong>Fecha de postulación:</strong> ${new Date(postulacion.createdAt).toLocaleDateString('es-ES')}</p>
            ${postulacion.fechaRespuesta ? 
                `<p><strong>Fecha de respuesta:</strong> ${new Date(postulacion.fechaRespuesta).toLocaleDateString('es-ES')}</p>` : ''}
        </div>
        ${postulacion.mensaje ? `<p style="margin-top: 10px; font-style: italic; color: var(--black2);">"${postulacion.mensaje}"</p>` : ''}
        ${postulacion.comentariosRespuesta ? 
            `<p style="margin-top: 10px; padding: 10px; background: var(--gray); border-radius: 8px;">
                <strong>Comentarios:</strong> ${postulacion.comentariosRespuesta}
            </p>` : ''}
        <div class="publicacion-actions">
            <button class="btn btn-small ver-detalle-postulacion" data-postulacion-id="${postulacion._id}">
                <ion-icon name="eye-outline"></ion-icon> Ver Detalles
            </button>
            ${postulacion.estado === 'pendiente' ? 
                `<button class="btn btn-small outline cancelar-postulacion" data-postulacion-id="${postulacion._id}">
                    <ion-icon name="close-outline"></ion-icon> Cancelar
                </button>` : ''}
        </div>
    `;

    // Event listeners
    card.querySelector('.ver-detalle-postulacion')?.addEventListener('click', () => {
        mostrarDetallePostulacion(postulacion);
    });

    card.querySelector('.cancelar-postulacion')?.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que quieres cancelar esta postulación?')) {
            try {
                await cancelarPostulacion(postulacion._id);
                showSuccess('Postulación cancelada');
                cargarPostulaciones();
            } catch (error) {
                showError('Error al cancelar la postulación');
            }
        }
    });

    return card;
}

/**
 * Mostrar detalle completo de una postulación
 * @param {object} postulacion - Datos de la postulación
 */
function mostrarDetallePostulacion(postulacion) {
    const modal = document.getElementById('modalDetallePostulacion');
    const content = document.getElementById('detallePostulacionContent');

    if (!modal || !content) return;

    const vacante = postulacion.vacante || {};
    const propietario = vacante.propietario || {};

    content.innerHTML = `
        <div class="vacante-info-modal">
            <h4>${vacante.titulo || 'Vacante'}</h4>
            <p><strong>Estado:</strong> <span class="postulacion-estado ${postulacion.estado}">${postulacion.estado}</span></p>
            <p><strong>Descripción:</strong> ${vacante.descripcion || '-'}</p>
            <p><strong>Requisitos:</strong> ${vacante.requisitos?.join(', ') || '-'}</p>
            <p><strong>Publicado por:</strong> ${propietario.nombres || propietario.nombre || '-'}</p>
            <p><strong>Fecha de postulación:</strong> ${new Date(postulacion.createdAt).toLocaleString('es-ES')}</p>
            ${postulacion.fechaRespuesta ? 
                `<p><strong>Fecha de respuesta:</strong> ${new Date(postulacion.fechaRespuesta).toLocaleString('es-ES')}</p>` : ''}
        </div>
        ${postulacion.mensaje ? `
            <div style="margin-top: 20px;">
                <h4>Tu mensaje:</h4>
                <p style="padding: 10px; background: var(--gray); border-radius: 8px;">${postulacion.mensaje}</p>
            </div>
        ` : ''}
        ${postulacion.comentariosRespuesta ? `
            <div style="margin-top: 20px;">
                <h4>Comentarios del ${vacante.propietarioTipo}:</h4>
                <p style="padding: 10px; background: #e8f5e9; border-radius: 8px;">${postulacion.comentariosRespuesta}</p>
            </div>
        ` : ''}
        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="enviarMensajeDesdePostulacion('${vacante.propietario._id || ''}', '${vacante.propietarioTipo}', '${vacante._id}')">
                <ion-icon name="mail-outline"></ion-icon> Enviar Mensaje
            </button>
        </div>
    `;

    modal.classList.remove('hidden');

    const cerrarBtn = document.getElementById('cerrarModalDetallePost');
    if (cerrarBtn) {
        cerrarBtn.onclick = () => modal.classList.add('hidden');
    }
}

/**
 * Cancelar una postulación
 * @param {string} postulacionId - ID de la postulación
 */
async function cancelarPostulacion(postulacionId) {
    try {
        await fetchAPI(`/postulaciones/${postulacionId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error al cancelar postulación:', error);
        throw error;
    }
}

/**
 * Función global para enviar mensaje desde una postulación
 * @param {string} destinatarioId - ID del destinatario
 * @param {string} destinatarioTipo - Tipo del destinatario
 * @param {string} vacanteId - ID de la vacante relacionada
 */
window.enviarMensajeDesdePostulacion = function(destinatarioId, destinatarioTipo, vacanteId) {
    // Cerrar modal de postulación
    document.getElementById('modalDetallePostulacion')?.classList.add('hidden');
    
    // Cambiar a sección de mensajes
    document.querySelector('[data-section="mensajes-section"]')?.click();
    
    // Abrir modal de nuevo mensaje con datos precargados
    setTimeout(() => {
        const destinatarioTipoSelect = document.getElementById('destinatarioTipo');
        const destinatarioIdInput = document.getElementById('destinatarioId');
        
        if (destinatarioTipoSelect) destinatarioTipoSelect.value = destinatarioTipo;
        if (destinatarioIdInput) destinatarioIdInput.value = destinatarioId;
        
        // Guardar vacante relacionada (se usará al enviar el mensaje)
        const formNuevoMensaje = document.getElementById('formNuevoMensaje');
        if (formNuevoMensaje) {
            formNuevoMensaje.dataset.relacionadoTipo = 'Vacante';
            formNuevoMensaje.dataset.relacionadoId = vacanteId;
        }
        
        abrirModalNuevoMensaje();
    }, 300);
};

// ============================================
// GESTIÓN DE MENSAJES
// ============================================

let mensajeActual = 'recibidos'; // Tab activa

/**
 * Cargar mensajes recibidos
 */
async function cargarMensajesRecibidos() {
    const listaMensajes = document.getElementById('listaMensajes');
    if (!listaMensajes) return;

    listaMensajes.innerHTML = '<div class="loading-message">Cargando mensajes...</div>';

    try {
        const data = await fetchAPI('/mensajes/recibidos?limit=50');
        const mensajes = data.mensajes || [];

        if (mensajes.length === 0) {
            listaMensajes.innerHTML = '<div class="loading-message">No hay mensajes recibidos</div>';
            return;
        }

        listaMensajes.innerHTML = '';
        mensajes.forEach(mensaje => {
            listaMensajes.appendChild(crearItemMensaje(mensaje, 'recibido'));
        });
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        listaMensajes.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar los mensajes</div>';
    }
}

/**
 * Cargar mensajes enviados
 */
async function cargarMensajesEnviados() {
    const listaMensajes = document.getElementById('listaMensajes');
    if (!listaMensajes) return;

    listaMensajes.innerHTML = '<div class="loading-message">Cargando mensajes...</div>';

    try {
        const data = await fetchAPI('/mensajes/enviados?limit=50');
        const mensajes = data.mensajes || [];

        if (mensajes.length === 0) {
            listaMensajes.innerHTML = '<div class="loading-message">No hay mensajes enviados</div>';
            return;
        }

        listaMensajes.innerHTML = '';
        mensajes.forEach(mensaje => {
            listaMensajes.appendChild(crearItemMensaje(mensaje, 'enviado'));
        });
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        listaMensajes.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar los mensajes</div>';
    }
}

/**
 * Crear item de mensaje para la lista
 * @param {object} mensaje - Datos del mensaje
 * @param {string} tipo - 'recibido' o 'enviado'
 * @returns {HTMLElement} - Elemento HTML del item
 */
function crearItemMensaje(mensaje, tipo) {
    const item = document.createElement('div');
    item.className = `mensaje-item ${mensaje.leido ? 'leido' : 'no-leido'}`;
    item.dataset.mensajeId = mensaje._id;

    const otraPersona = tipo === 'recibido' ? mensaje.remitente : mensaje.destinatario;

    item.innerHTML = `
        <div class="mensaje-item-header">
            <span class="mensaje-item-asunto">${mensaje.asunto}</span>
            <span class="mensaje-item-fecha">${new Date(mensaje.createdAt).toLocaleDateString('es-ES')}</span>
        </div>
        <div class="mensaje-item-remitente">
            ${tipo === 'recibido' ? 'De' : 'Para'}: ${otraPersona?.nombre || '-'}
        </div>
        ${mensaje.relacionadoCon?.tipo ? 
            `<div style="font-size: 0.8rem; color: var(--blue); margin-top: 5px;">
                Relacionado con: ${mensaje.relacionadoCon.tipo}
            </div>` : ''}
    `;

    item.addEventListener('click', () => mostrarDetalleMensaje(mensaje._id));

    return item;
}

/**
 * Mostrar detalle completo de un mensaje
 * @param {string} mensajeId - ID del mensaje
 */
async function mostrarDetalleMensaje(mensajeId) {
    try {
        const mensaje = await fetchAPI(`/mensajes/${mensajeId}`);
        const detalle = document.getElementById('mensajeDetalle');

        if (!detalle) return;

        const remitente = mensaje.remitente;
        const destinatario = mensaje.destinatario;

        detalle.innerHTML = `
            <div class="mensaje-detalle-header">
                <h3 class="mensaje-detalle-asunto">${mensaje.asunto}</h3>
                <div class="mensaje-detalle-info">
                    <span><strong>De:</strong> ${remitente?.nombre || '-'} (${remitente?.tipo || '-'})</span>
                    <span><strong>Para:</strong> ${destinatario?.nombre || '-'} (${destinatario?.tipo || '-'})</span>
                    <span><strong>Fecha:</strong> ${new Date(mensaje.createdAt).toLocaleString('es-ES')}</span>
                </div>
                ${mensaje.relacionadoCon?.tipo ? 
                    `<p style="margin-top: 10px; color: var(--blue);">
                        <strong>Relacionado con:</strong> ${mensaje.relacionadoCon.tipo}
                    </p>` : ''}
            </div>
            <div class="mensaje-detalle-contenido">
                ${mensaje.contenido}
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar mensaje:', error);
        showError('Error al cargar el mensaje');
    }
}

/**
 * Configurar tabs de mensajes
 */
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            tabButtons.forEach(b => b.classList.remove('active'));
            // Agregar active al clickeado
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            mensajeActual = tab;
            
            if (tab === 'recibidos') {
                cargarMensajesRecibidos();
            } else {
                cargarMensajesEnviados();
            }
        });
    });

    // Botón nuevo mensaje
    const nuevoMensajeBtn = document.getElementById('nuevoMensajeBtn');
    if (nuevoMensajeBtn) {
        nuevoMensajeBtn.addEventListener('click', abrirModalNuevoMensaje);
    }
});

/**
 * Abrir modal para crear nuevo mensaje
 */
function abrirModalNuevoMensaje() {
    const modal = document.getElementById('modalNuevoMensaje');
    const form = document.getElementById('formNuevoMensaje');

    if (!modal || !form) return;

    form.reset();
    modal.classList.remove('hidden');

    const cerrarBtn = document.getElementById('cerrarModalMensaje');
    const cancelarBtn = document.getElementById('cancelarMensajeBtn');

    const cerrarModal = () => {
        modal.classList.add('hidden');
        form.dataset.relacionadoTipo = '';
        form.dataset.relacionadoId = '';
    };

    if (cerrarBtn) cerrarBtn.onclick = cerrarModal;
    if (cancelarBtn) cancelarBtn.onclick = cerrarModal;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const destinatarioId = document.getElementById('destinatarioId').value;
        const destinatarioTipo = document.getElementById('destinatarioTipo').value;
        const asunto = document.getElementById('mensajeAsunto').value;
        const contenido = document.getElementById('mensajeContenido').value;

        if (!destinatarioId || !destinatarioTipo) {
            showError('Debes seleccionar un destinatario');
            return;
        }

        try {
            const relacionadoConTipo = form.dataset.relacionadoTipo || null;
            const relacionadoConId = form.dataset.relacionadoId || null;

            await enviarMensaje({
                destinatarioId,
                destinatarioTipo,
                asunto,
                contenido,
                relacionadoConTipo,
                relacionadoConId
            });

            showSuccess('Mensaje enviado correctamente');
            cerrarModal();
            
            // Recargar mensajes
            if (mensajeActual === 'enviados') {
                cargarMensajesEnviados();
            } else {
                cargarMensajesRecibidos();
            }
        } catch (error) {
            showError(error.message || 'Error al enviar el mensaje');
        }
    };
}

/**
 * Enviar un mensaje
 * @param {object} datosMensaje - Datos del mensaje a enviar
 */
async function enviarMensaje(datosMensaje) {
    try {
        const body = {
            destinatarioId: datosMensaje.destinatarioId,
            destinatarioTipo: datosMensaje.destinatarioTipo,
            asunto: datosMensaje.asunto,
            contenido: datosMensaje.contenido
        };

        if (datosMensaje.relacionadoConTipo && datosMensaje.relacionadoConId) {
            body.relacionadoConTipo = datosMensaje.relacionadoConTipo;
            body.relacionadoConId = datosMensaje.relacionadoConId;
        }

        await fetchAPI('/mensajes', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        throw error;
    }
}

/**
 * Buscar en postulaciones
 * @param {string} termino - Término de búsqueda
 */
function buscarEnPostulaciones(termino) {
    const listaPostulaciones = document.getElementById('listaPostulaciones');
    if (!listaPostulaciones) return;

    const cards = listaPostulaciones.querySelectorAll('.postulacion-card');
    let encontrados = 0;
    
    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        if (texto.includes(termino)) {
            card.style.display = '';
            encontrados++;
        } else {
            card.style.display = 'none';
        }
    });

    // Si no hay resultados, mostrar mensaje
    if (encontrados === 0 && cards.length > 0) {
        const mensaje = document.createElement('div');
        mensaje.className = 'no-publicaciones';
        mensaje.innerHTML = '<p>No se encontraron postulaciones que coincidan con la búsqueda</p>';
        listaPostulaciones.appendChild(mensaje);
    }
}

/**
 * Buscar en mensajes
 * @param {string} termino - Término de búsqueda
 */
function buscarEnMensajes(termino) {
    const listaMensajes = document.getElementById('listaMensajes');
    if (!listaMensajes) return;

    const items = listaMensajes.querySelectorAll('.mensaje-item');
    let encontrados = 0;
    
    items.forEach(item => {
        const texto = item.textContent.toLowerCase();
        if (texto.includes(termino)) {
            item.style.display = '';
            encontrados++;
        } else {
            item.style.display = 'none';
        }
    });

    // Si no hay resultados, mostrar mensaje
    if (encontrados === 0 && items.length > 0) {
        const mensaje = document.createElement('div');
        mensaje.className = 'loading-message';
        mensaje.textContent = 'No se encontraron mensajes que coincidan con la búsqueda';
        mensaje.style.color = 'var(--black2)';
        listaMensajes.appendChild(mensaje);
    }
}

