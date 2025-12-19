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
// Si existe js/config.js, usa API_BASE_URL; si no, usa el fallback.
const API_BASE_URL_ESTUDIANTE = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL)
    ? API_BASE_URL
    : 'http://localhost:5000/api';

function resolveEndpoint(template, params = {}) {
    if (typeof template !== 'string') return template;
    return template.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
        const value = params[key];
        return value !== undefined && value !== null ? encodeURIComponent(String(value)) : `:${key}`;
    });
}

function withQuery(url, query = {}) {
    const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== null && String(v) !== '');
    if (entries.length === 0) return url;
    const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
}

function requireConfigValue(objectName, obj, prop) {
    if (!obj || typeof obj[prop] !== 'string' || !obj[prop]) {
        throw new Error(`Falta configuraci\u00f3n: ${objectName}.${prop}. Revisa que se cargue js/config.js antes de este script.`);
    }
    return obj[prop];
}

/**
 * Almacenamiento del token de autenticación y datos del usuario
 */
function storageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // noop
    }
}

function storageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // noop
    }
}

// Compatibilidad: si existe js/config.js, usamos STORAGE_KEYS; si no, usamos strings.
function getAccessToken() {
    const key = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.ACCESS_TOKEN) ? STORAGE_KEYS.ACCESS_TOKEN : 'accessToken';
    return storageGet(key);
}

function setAccessToken(token) {
    const key = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.ACCESS_TOKEN) ? STORAGE_KEYS.ACCESS_TOKEN : 'accessToken';
    if (!token) {
        storageRemove(key);
        return;
    }
    storageSet(key, token);
}

function getRefreshToken() {
    const key = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.REFRESH_TOKEN) ? STORAGE_KEYS.REFRESH_TOKEN : 'refreshToken';
    return storageGet(key);
}

function clearAuthStorage() {
    const accessKey = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.ACCESS_TOKEN) ? STORAGE_KEYS.ACCESS_TOKEN : 'accessToken';
    const refreshKey = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.REFRESH_TOKEN) ? STORAGE_KEYS.REFRESH_TOKEN : 'refreshToken';
    storageRemove(accessKey);
    storageRemove(refreshKey);
    // Limpieza extra por si quedaron llaves antiguas
    storageRemove('authToken');
    storageRemove('refreshToken');
    if (typeof STORAGE_KEYS !== 'undefined') {
        if (STORAGE_KEYS.USER_ROLE) storageRemove(STORAGE_KEYS.USER_ROLE);
        if (STORAGE_KEYS.USER_ID) storageRemove(STORAGE_KEYS.USER_ID);
        if (STORAGE_KEYS.USER_EMAIL) storageRemove(STORAGE_KEYS.USER_EMAIL);
    } else {
        storageRemove('userRole');
        storageRemove('userId');
        storageRemove('userEmail');
    }
}

let authToken = getAccessToken();
let refreshToken = getRefreshToken();
let currentUser = null;

// ============================================
// ESTADO LOCAL: POSTULACIONES / VACANTES
// ============================================

let appliedVacanteIds = new Set();
let appliedVacanteIdsPromise = null;

function setAppliedVacanteIdsFromPostulaciones(postulaciones) {
    const ids = new Set();
    (Array.isArray(postulaciones) ? postulaciones : []).forEach((p) => {
        const vacanteId = (p && p.vacante && p.vacante._id) ? p.vacante._id : (p ? p.vacante : null);
        if (vacanteId) ids.add(String(vacanteId));
    });
    appliedVacanteIds = ids;
}

async function loadAppliedVacanteIds() {
    if (appliedVacanteIdsPromise) return appliedVacanteIdsPromise;

    appliedVacanteIdsPromise = (async () => {
        try {
            const baseUrl = requireConfigValue(
                'APPLICATION_ENDPOINTS',
                (typeof APPLICATION_ENDPOINTS !== 'undefined' ? APPLICATION_ENDPOINTS : null),
                'MY_APPLICATIONS'
            );
            const postulaciones = await fetchAPI(baseUrl);
            setAppliedVacanteIdsFromPostulaciones(postulaciones);
        } catch {
            appliedVacanteIds = new Set();
        }
        return appliedVacanteIds;
    })();

    return appliedVacanteIdsPromise;
}

function getVacantesDisponiblesNumber(vacante) {
    if (!vacante) return null;
    if (vacante.vacantesDisponibles != null) {
        const n = Number(vacante.vacantesDisponibles);
        return Number.isFinite(n) ? n : null;
    }
    if (vacante.numeroVacantes != null) {
        const n = Number(vacante.numeroVacantes);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function getVacantesDisponiblesBadgeClass(count) {
    const n = Number(count);
    if (!Number.isFinite(n)) return 'disponible';
    if (n <= 0) return 'lleno';
    if (n <= 2) return 'pocas';
    return 'disponible';
}

function getPropietarioNombre(propietario, propietarioTipo) {
    const p = propietario || {};
    if (String(propietarioTipo || '').toLowerCase() === 'profesor') {
        const full = `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.trim();
        return full || '-';
    }
    return p.nombre || p.nombreRepresentante || '-';
}

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

    // Sin token, no hay sesión: redirigir al login.
    authToken = getAccessToken();
    refreshToken = getRefreshToken();

    // Agregar token de autenticación si está disponible
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const requestUrl = (typeof url === 'string' && /^https?:\/\//i.test(url))
            ? url
            : `${API_BASE_URL_ESTUDIANTE}${url}`;

        const response = await fetch(requestUrl, {
            ...options,
            headers
        });

        // Si el token expiró, intentar refrescarlo
        if (response.status === 401 && refreshToken) {
            const newToken = await refreshAuthToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(requestUrl, { ...options, headers });

                if (!retryResponse.ok) {
                    const retryErrorData = await retryResponse.json().catch(() => ({ message: 'Error en la petición' }));
                    throw new Error(retryErrorData.message || `Error ${retryResponse.status}: ${retryResponse.statusText}`);
                }

                return await retryResponse.json();
            } else {
                // Si no se puede refrescar, redirigir al login
                clearAuthStorage();
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
        const refreshUrl = requireConfigValue('AUTH_ENDPOINTS', (typeof AUTH_ENDPOINTS !== 'undefined' ? AUTH_ENDPOINTS : null), 'REFRESH_TOKEN');

        const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.accessToken;
            setAccessToken(authToken);
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
    // Si no hay tokens, no hay sesión.
    authToken = getAccessToken();
    refreshToken = getRefreshToken();
    if (!authToken && !refreshToken) {
        window.location.href = 'login.html';
        return;
    }

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
        item.addEventListener("click", (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            const sectionClass = item.getAttribute("data-section");
            
            // Ocultar todas las secciones
            // Solo ocultar paneles principales, no sub-secciones internas (ej: #perfilReadOnly)
            document.querySelectorAll(".main > section").forEach(sec => {
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
            } else if (sectionClass === 'perfil-section') {
                // Volver a mostrar el perfil (y asegurar el estado de lectura)
                const perfilForm = document.getElementById('perfilForm');
                const perfilReadOnly = document.getElementById('perfilReadOnly');
                if (perfilForm) perfilForm.classList.add('hidden');
                if (perfilReadOnly) perfilReadOnly.classList.remove('hidden');
                cargarPerfil();
            }
        });
    });

    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearAuthStorage();
            window.location.href = 'login.html';
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
        const meUrl = requireConfigValue('AUTH_ENDPOINTS', (typeof AUTH_ENDPOINTS !== 'undefined' ? AUTH_ENDPOINTS : null), 'GET_USER');

        const data = await fetchAPI(meUrl);
        
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
        editBtn.addEventListener('click', async () => {
            // Asegura que el formulario tenga los datos más recientes
            if (!currentUser) {
                await cargarPerfil();
            } else {
                mostrarPerfil(currentUser);
            }
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

            const markInvalid = (el) => {
                if (!el) return;
                el.classList.add('input-invalid');
                if (typeof el.focus === 'function') el.focus();
            };
            const clearInvalid = (el) => {
                if (!el) return;
                el.classList.remove('input-invalid');
            };

            const elNombre = document.getElementById('nombreInput');
            const elAPaterno = document.getElementById('aPaternoInput');
            const elAMaterno = document.getElementById('aMaternoInput');
            const elCorreo = document.getElementById('emailInput');
            const elTelefono = document.getElementById('phoneInput');
            const elBoleta = document.getElementById('boletaInput');
            const elSexo = document.getElementById('sexoInput');
            const elCarrera = document.getElementById('carreraInput');
            const elCreditos = document.getElementById('creditosInput');
            const elCurp = document.getElementById('curpInput');

            // Limpia marcas previas
            [elNombre, elAPaterno, elAMaterno, elCorreo, elTelefono, elBoleta, elSexo, elCarrera, elCreditos, elCurp]
                .filter(Boolean)
                .forEach(clearInvalid);

            // Quitar marca al editar
            [elNombre, elAPaterno, elAMaterno, elCorreo, elTelefono, elBoleta, elCreditos, elCurp]
                .filter(Boolean)
                .forEach((el) => el.addEventListener('input', () => clearInvalid(el), { once: true }));
            [elSexo, elCarrera]
                .filter(Boolean)
                .forEach((el) => el.addEventListener('change', () => clearInvalid(el), { once: true }));

            // Validaciones alineadas con scripts_login.js
            const expresiones = {
                boleta: /^(\d{10})$/,
                nombre: /^[a-zA-ZÀ-ÿ\s]{1,40}$/,
                telefono: /^\d{7,10}$/,
                curp: /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/,
                correoAlumno: /^[a-zA-Z0-9_.+-]+@alumno\.ipn\.mx$/,
            };

            const nombresRaw = String(document.getElementById('nombreInput').value || '').trim();
            const apellidoPaternoRaw = String(document.getElementById('aPaternoInput').value || '').trim();
            const apellidoMaternoRaw = String(document.getElementById('aMaternoInput').value || '').trim();
            const correoRaw = String(document.getElementById('emailInput').value || '').trim();
            const telefonoDigits = String(document.getElementById('phoneInput').value || '').replace(/\D/g, '');
            const boletaDigits = String(document.getElementById('boletaInput').value || '').replace(/\D/g, '');
            const sexoRaw = String(document.getElementById('sexoInput').value || '').trim();
            const carreraRaw = String(document.getElementById('carreraInput').value || '').trim();
            const creditosRaw = String(document.getElementById('creditosInput').value || '').trim();
            const curpRaw = String(document.getElementById('curpInput').value || '').trim().toUpperCase();

            const creditosNum = creditosRaw === '' ? NaN : Number(creditosRaw);

            if (!nombresRaw || !expresiones.nombre.test(nombresRaw)) {
                markInvalid(elNombre);
                showError('Nombres inválidos');
                return;
            }
            if (!apellidoPaternoRaw || !expresiones.nombre.test(apellidoPaternoRaw)) {
                markInvalid(elAPaterno);
                showError('Apellido paterno inválido');
                return;
            }
            if (!apellidoMaternoRaw || !expresiones.nombre.test(apellidoMaternoRaw)) {
                markInvalid(elAMaterno);
                showError('Apellido materno inválido');
                return;
            }
            if (!correoRaw || !expresiones.correoAlumno.test(correoRaw)) {
                markInvalid(elCorreo);
                showError('Correo inválido (usa @alumno.ipn.mx)');
                return;
            }
            if (!telefonoDigits || !expresiones.telefono.test(telefonoDigits)) {
                markInvalid(elTelefono);
                showError('Teléfono inválido (7 a 10 dígitos)');
                return;
            }
            if (!boletaDigits || !expresiones.boleta.test(boletaDigits)) {
                markInvalid(elBoleta);
                showError('Boleta inválida (10 dígitos)');
                return;
            }
            if (!sexoRaw || (sexoRaw !== 'Masculino' && sexoRaw !== 'Femenino')) {
                markInvalid(elSexo);
                showError('Selecciona un sexo válido');
                return;
            }
            if (!carreraRaw || (carreraRaw !== 'ISC' && carreraRaw !== 'IIA' && carreraRaw !== 'LCD')) {
                markInvalid(elCarrera);
                showError('Selecciona una carrera válida');
                return;
            }
            if (!Number.isFinite(creditosNum) || creditosNum < 0 || creditosNum > 387) {
                markInvalid(elCreditos);
                showError('Créditos inválidos (0 a 387)');
                return;
            }
            if (!curpRaw || !expresiones.curp.test(curpRaw)) {
                markInvalid(elCurp);
                showError('CURP inválida');
                return;
            }
            
            // TODO: Implementar actualización de perfil cuando exista el endpoint
            // Por ahora solo guardamos en localStorage como ejemplo
            const formData = {
                nombres: nombresRaw,
                apellidoPaterno: apellidoPaternoRaw,
                apellidoMaterno: apellidoMaternoRaw,
                correo: correoRaw,
                telefono: Number(telefonoDigits),
                boleta: Number(boletaDigits),
                sexo: sexoRaw,
                carrera: carreraRaw,
                creditos: Number(creditosNum),
                curp: curpRaw,
            };

            const currentPasswordEl = document.getElementById('currentPasswordInput');
            const newPasswordEl = document.getElementById('newPasswordInput');
            const currentPassword = currentPasswordEl ? String(currentPasswordEl.value || '') : '';
            const newPassword = newPasswordEl ? String(newPasswordEl.value || '') : '';

            // Misma regla que en login/registro (scripts_login.js)
            const STRONG_PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/;

            try {
                // Llamada a la API para actualizar el perfil
                const profileUrl = requireConfigValue('STUDENT_ENDPOINTS', (typeof STUDENT_ENDPOINTS !== 'undefined' ? STUDENT_ENDPOINTS : null), 'PROFILE');

                const response = await fetchAPI(profileUrl, { 
                    method: 'PUT', 
                    body: JSON.stringify(formData) 
                });

                const updatedUser = response?.data || response?.user;
                if (updatedUser) {
                    currentUser = updatedUser;

                    // Cambio de contraseña (opcional)
                    if (newPassword.trim()) {
                        if (!currentPassword.trim()) {
                            showError('Para cambiar la contraseña, ingresa tu contraseña actual');
                            return;
                        }

                        if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
                            showError('La nueva contraseña debe tener al menos 6 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo');
                            return;
                        }

                        const changePasswordUrl = requireConfigValue('AUTH_ENDPOINTS', (typeof AUTH_ENDPOINTS !== 'undefined' ? AUTH_ENDPOINTS : null), 'CHANGE_PASSWORD');
                        await fetchAPI(changePasswordUrl, {
                            method: 'PUT',
                            body: JSON.stringify({
                                currentPassword: currentPassword,
                                newPassword: newPassword,
                            }),
                        });

                        if (currentPasswordEl) currentPasswordEl.value = '';
                        if (newPasswordEl) newPasswordEl.value = '';
                    }

                    showSuccess('Perfil actualizado correctamente');
                    perfilForm.classList.add('hidden');
                    perfilReadOnly.classList.remove('hidden');
                    mostrarPerfil(updatedUser);
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

        const studentEndpoints = (typeof STUDENT_ENDPOINTS !== 'undefined') ? STUDENT_ENDPOINTS : null;
        const isUpdate = Boolean(currentUser && currentUser.cvID);
        const url = isUpdate
            ? requireConfigValue('STUDENT_ENDPOINTS', studentEndpoints, 'UPDATE_CV')
            : requireConfigValue('STUDENT_ENDPOINTS', studentEndpoints, 'UPLOAD_CV');

        const method = isUpdate ? 'PUT' : 'POST';

        // Siempre toma el token más reciente (por si hubo refresh)
        authToken = getAccessToken();
        refreshToken = getRefreshToken();

        const doUpload = async (token) => {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            return await fetch(url, {
                method,
                headers,
                body: formData,
            });
        };

        let response = await doUpload(authToken);

        // Si expira el accessToken, refrescar y reintentar una vez
        if (response.status === 401 && refreshToken) {
            const newToken = await refreshAuthToken();
            if (newToken) {
                response = await doUpload(newToken);
            }
        }

        if (response.status === 401) {
            clearAuthStorage();
            window.location.href = 'login.html';
            return;
        }

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
        await loadAppliedVacanteIds();

        const vacantesUrl = requireConfigValue('VACANCY_ENDPOINTS', (typeof VACANCY_ENDPOINTS !== 'undefined' ? VACANCY_ENDPOINTS : null), 'GET_VACANCIES');
        const vacantes = await fetchAPI(vacantesUrl);

        // Ocultar vacantes sin cupo disponible (por si el backend devuelve todas)
        const vacantesDisponibles = (Array.isArray(vacantes) ? vacantes : []).filter(esVacanteDisponible);
        
        if (!vacantesDisponibles || vacantesDisponibles.length === 0) {
            listaVacantes.innerHTML = '<div class="no-publicaciones"><p>No hay vacantes disponibles en este momento</p></div>';
            return;
        }

        listaVacantes.innerHTML = '';
        vacantesDisponibles.forEach(vacante => {
            listaVacantes.appendChild(crearCardVacante(vacante));
        });

        // Configurar filtros
        configurarFiltrosVacantes(vacantesDisponibles);
    } catch (error) {
        console.error('Error al cargar vacantes:', error);
        listaVacantes.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar las vacantes</div>';
    }
}

function esVacanteDisponible(vacante) {
    if (!vacante) return false;
    // Si el backend manda vacantesDisponibles, úsalo como fuente de verdad.
    if (vacante.vacantesDisponibles != null) {
        const n = Number(vacante.vacantesDisponibles);
        return Number.isFinite(n) ? n > 0 : true;
    }
    // Fallback: si no viene, asume disponible.
    return true;
}

/**
 * Crear tarjeta de vacante para mostrar en la lista
 * @param {object} vacante - Datos de la vacante
 * @returns {HTMLElement} - Elemento HTML de la tarjeta
 */
function crearCardVacante(vacante) {
    const card = document.createElement('div');
    const propietarioTipo = String(vacante && vacante.propietarioTipo ? vacante.propietarioTipo : '');
    card.className = `vacante-card ${propietarioTipo ? propietarioTipo.toLowerCase() : ''}`;
    card.dataset.vacanteId = vacante._id;

    const tipoLabel = propietarioTipo === 'Profesor' ? 'Profesor' : 'Empresa/Institución';
    const tipoClass = propietarioTipo === 'Profesor' ? 'profesor' : 'institucion';

    const descripcionCorta = getVacanteDescripcion(vacante);

    const vacantesDisponibles = getVacantesDisponiblesNumber(vacante);
    const badgeClass = getVacantesDisponiblesBadgeClass(vacantesDisponibles);
    const alreadyApplied = appliedVacanteIds.has(String(vacante._id));
    const sinCupo = (vacantesDisponibles != null) ? Number(vacantesDisponibles) <= 0 : false;
    const disablePostular = alreadyApplied || sinCupo;

    card.innerHTML = `
        <div class="vacante-tipo ${tipoClass}">${tipoLabel}</div>
        <div class="publicacion-header">
            <h3>${vacante.titulo || 'Sin título'}</h3>
            <span class="vacantes ${badgeClass}">${vacantesDisponibles ?? '-'} disponibles</span>
        </div>
        <div class="publicacion-info">
            <p><strong>Descripción:</strong> ${descripcionCorta.substring(0, 100)}${descripcionCorta.length > 100 ? '...' : ''}</p>
            <p><strong>Área:</strong> ${vacante.area || '-'}</p>
            <p><strong>Vacantes:</strong> ${vacante.numeroVacantes != null ? vacante.numeroVacantes : '-'}</p>
            <p><strong>Fecha publicación:</strong> ${vacante.fechaPublicacion ? new Date(vacante.fechaPublicacion).toLocaleDateString('es-ES') : '-'}</p>
        </div>
        <div class="publicacion-actions">
            <button class="btn btn-primary ver-vacante" data-vacante-id="${vacante._id}">
                <ion-icon name="eye-outline"></ion-icon> Ver Detalles
            </button>
            <button class="btn btn-small postularse-vacante" data-vacante-id="${vacante._id}" ${disablePostular ? 'disabled' : ''}>
                <ion-icon name="send-outline"></ion-icon> ${alreadyApplied ? 'Postulado' : 'Postularse'}
            </button>
        </div>
    `;

    // Event listeners
    card.querySelector('.ver-vacante').addEventListener('click', () => mostrarDetalleVacante(vacante));

    const btnPostular = card.querySelector('.postularse-vacante');
    if (btnPostular) {
        btnPostular.addEventListener('click', () => {
            if (btnPostular.disabled) return;
            abrirModalPostulacion(vacante);
        });
    }

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

    let vacantesFiltradas = (Array.isArray(vacantes) ? vacantes : []).filter(esVacanteDisponible);

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
            (getVacanteDescripcion(v).toLowerCase().includes(buscarTexto)) ||
            (v.area && String(v.area).toLowerCase().includes(buscarTexto))
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
    mostrarModalDetalleVacante(vacante);
}

function mostrarModalDetalleVacante(vacante) {
    const modal = document.getElementById('modalDetalleVacante');
    const content = document.getElementById('detalleVacanteContent');
    if (!modal || !content) {
        // fallback si no existe el modal
        return;
    }

    const titulo = vacante && vacante.titulo ? vacante.titulo : 'Sin título';
    const tipo = vacante && vacante.propietarioTipo ? vacante.propietarioTipo : '-';

    const area = vacante && vacante.area ? vacante.area : '-';
    const vacantesNum = (vacante && vacante.numeroVacantes != null) ? vacante.numeroVacantes : '-';
    const modalidad = vacante && vacante.modalidad ? vacante.modalidad : '-';
    const horas = (vacante && vacante.horasSemanal != null) ? vacante.horasSemanal : '-';
    const duracion = (vacante && vacante.duracionMeses != null) ? vacante.duracionMeses : '-';

    const fechaInicio = vacante && vacante.fechaInicio ? new Date(vacante.fechaInicio).toLocaleDateString('es-ES') : '-';
    const fechaLimite = vacante && vacante.fechaLimite ? new Date(vacante.fechaLimite).toLocaleDateString('es-ES') : '-';
    const fechaPublicacion = vacante && vacante.fechaPublicacion ? new Date(vacante.fechaPublicacion).toLocaleDateString('es-ES') : '-';

    const descripcion = getVacanteDescripcion(vacante);
    const requisitos = getVacanteRequisitosTexto(vacante);
    const beneficios = getVacanteBeneficiosTexto(vacante);
    const contacto = getVacanteContactoTexto(vacante);

    content.innerHTML = `
        <div class="form-section">
            <h4>${escapeHtml(titulo)}</h4>
            <p><strong>Tipo:</strong> ${escapeHtml(tipo)}</p>
            <p><strong>Área:</strong> ${escapeHtml(area)}</p>
            <p><strong>Vacantes:</strong> ${escapeHtml(String(vacantesNum))}</p>
            <p><strong>Modalidad:</strong> ${escapeHtml(String(modalidad))}</p>
            <p><strong>Horas semanales:</strong> ${escapeHtml(String(horas))}</p>
            <p><strong>Duración (meses):</strong> ${escapeHtml(String(duracion))}</p>
            <p><strong>Fecha inicio:</strong> ${escapeHtml(String(fechaInicio))}</p>
            <p><strong>Fecha límite:</strong> ${escapeHtml(String(fechaLimite))}</p>
            <p><strong>Fecha publicación:</strong> ${escapeHtml(String(fechaPublicacion))}</p>
        </div>

        <div class="form-section">
            <h4>Descripción / Objetivos</h4>
            <p>${escapeHtml(descripcion || '-')}</p>
        </div>

        <div class="form-section">
            <h4>Requisitos</h4>
            <p>${escapeHtml(requisitos || '-')}</p>
        </div>

        <div class="form-section">
            <h4>Beneficios</h4>
            <p>${escapeHtml(beneficios || '-')}</p>
        </div>

        <div class="form-section">
            <h4>Contacto</h4>
            <p>${escapeHtml(contacto || '-')}</p>
        </div>
    `;

    const cerrarBtn = document.getElementById('cerrarModalDetalleVacante');
    const close = () => modal.classList.add('hidden');
    if (cerrarBtn) cerrarBtn.onclick = close;
    modal.onclick = (e) => {
        if (e.target === modal) close();
    };
    window.addEventListener('keydown', function onEsc(e) {
        if (e.key === 'Escape') {
            close();
            window.removeEventListener('keydown', onEsc);
        }
    });

    modal.classList.remove('hidden');
}

function escapeHtml(value) {
    const s = String(value == null ? '' : value);
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

    // Si existiera el campo legado de mensaje, ocultarlo
    const mensajeField = document.getElementById('mensajePostulacion');
    if (mensajeField) {
        mensajeField.value = '';
        const wrap = mensajeField.closest('label');
        if (wrap) wrap.style.display = 'none';
    }

    // Evitar doble postulación
    if (appliedVacanteIds.has(String(vacante._id))) {
        showError('Ya te postulaste a esta vacante');
        return;
    }

    // Mostrar información de la vacante (compatible con modelos antiguos y el actual)
    const descripcion = getVacanteDescripcion(vacante);
    const requisitos = getVacanteRequisitosTexto(vacante);
    vacanteInfo.innerHTML = `
        <h4>${vacante.titulo}</h4>
        <p><strong>Tipo:</strong> ${vacante.propietarioTipo}</p>
        <p><strong>Área:</strong> ${vacante.area || '-'}</p>
        <p><strong>Descripción:</strong> ${descripcion || '-'}</p>
        ${requisitos ? `<p><strong>Requisitos:</strong> ${requisitos}</p>` : ''}
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

        try {
            await crearPostulacion(vacante._id);

            appliedVacanteIds.add(String(vacante._id));
            cerrarModal();
            showSuccess('Postulación enviada correctamente');
            formPostulacion.reset();

            // Refresca vacantes para deshabilitar botón/estado
            cargarVacantes();
        } catch (error) {
            showError(error.message || 'Error al enviar la postulación');
        }
    };
}

function getVacanteDescripcion(v) {
    if (!v) return '';
    // Soporte para modelo anterior
    if (typeof v.descripcion === 'string' && v.descripcion.trim()) return v.descripcion.trim();

    const parts = [];
    if (typeof v.objetivos === 'string' && v.objetivos.trim()) parts.push(`Objetivos: ${v.objetivos.trim()}`);
    if (typeof v.actividades === 'string' && v.actividades.trim()) parts.push(`Actividades: ${v.actividades.trim()}`);
    if (typeof v.requerimientos === 'string' && v.requerimientos.trim()) parts.push(`Requerimientos: ${v.requerimientos.trim()}`);
    return parts.join(' | ');
}

function getVacanteRequisitosTexto(v) {
    if (!v) return '';
    // Modelo anterior: requisitos como array o string
    if (Array.isArray(v.requisitos)) return v.requisitos.filter(Boolean).join(', ');
    if (typeof v.requisitos === 'string' && v.requisitos.trim()) return v.requisitos.trim();

    const parts = [];
    if (typeof v.carreraRequerida === 'string' && v.carreraRequerida.trim()) parts.push(`Carrera: ${v.carreraRequerida.trim()}`);
    if (typeof v.conocimientosTecnicos === 'string' && v.conocimientosTecnicos.trim()) parts.push(`Conocimientos: ${v.conocimientosTecnicos.trim()}`);
    if (typeof v.habilidades === 'string' && v.habilidades.trim()) parts.push(`Habilidades: ${v.habilidades.trim()}`);
    if (typeof v.requerimientos === 'string' && v.requerimientos.trim()) parts.push(`Requerimientos: ${v.requerimientos.trim()}`);
    return parts.join(' | ');
}

function getVacanteBeneficiosTexto(v) {
    if (!v) return '';
    if (Array.isArray(v.beneficiosAlumno) && v.beneficiosAlumno.length) {
        return v.beneficiosAlumno.filter(Boolean).join(', ');
    }
    if (Array.isArray(v.beneficios) && v.beneficios.length) {
        return v.beneficios.filter(Boolean).join(', ');
    }
    return '';
}

function getVacanteContactoTexto(v) {
    if (!v) return '';
    const email = v.correoConsulta || v.contactoEmail || '';
    const tel = v.telefonoConsulta || v.contactoTelefono || '';
    const parts = [];
    if (email) parts.push(String(email));
    if (tel) parts.push(String(tel));
    return parts.join(' | ');
}

/**
 * Crear una nueva postulación
 * @param {string} vacanteId - ID de la vacante
 */
async function crearPostulacion(vacanteId) {
    try {
        const createUrl = requireConfigValue('APPLICATION_ENDPOINTS', (typeof APPLICATION_ENDPOINTS !== 'undefined' ? APPLICATION_ENDPOINTS : null), 'CREATE_APPLICATION');
        const data = await fetchAPI(createUrl, {
            method: 'POST',
            body: JSON.stringify({
                vacanteId
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
        const baseUrl = requireConfigValue('APPLICATION_ENDPOINTS', (typeof APPLICATION_ENDPOINTS !== 'undefined' ? APPLICATION_ENDPOINTS : null), 'MY_APPLICATIONS');
        const url = withQuery(baseUrl, { estado: estadoFiltro });
        
        const postulaciones = await fetchAPI(url);

        // Mantener estado local para deshabilitar “Postularse” en vacantes
        setAppliedVacanteIdsFromPostulaciones(postulaciones);
        appliedVacanteIdsPromise = Promise.resolve(appliedVacanteIds);

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
    const estadoRaw = String((postulacion && postulacion.estado) || '').trim();
    const estadoKey = estadoRaw.toLowerCase();
    card.className = `postulacion-card ${estadoKey}`;

    const vacante = postulacion.vacante || {};
    const estadoLabels = {
        'pendiente': 'Pendiente',
        'aceptada': 'Aceptada',
        'rechazada': 'Rechazada'
    };

    card.innerHTML = `
        <div class="publicacion-header">
            <h3>${vacante.titulo || 'Vacante'}</h3>
            <span class="postulacion-estado ${estadoKey}">${estadoLabels[estadoKey] || estadoRaw || '-'}</span>
        </div>
        <div class="publicacion-info">
            <p><strong>Tipo:</strong> ${postulacion.vacante?.propietarioTipo || '-'}</p>
            <p><strong>Fecha de postulación:</strong> ${new Date(postulacion.createdAt).toLocaleDateString('es-ES')}</p>
        </div>
        <div class="publicacion-actions">
            <button class="btn btn-small ver-detalle-postulacion" data-postulacion-id="${postulacion._id}">
                <ion-icon name="eye-outline"></ion-icon> Ver Detalles
            </button>
            ${estadoKey === 'pendiente' ? 
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
    const estadoRaw = String((postulacion && postulacion.estado) || '').trim();
    const estadoKey = estadoRaw.toLowerCase();
    const propietarioNombre = getPropietarioNombre(propietario, vacante.propietarioTipo);
    const vacantesDisponibles = getVacantesDisponiblesNumber(vacante);

    content.innerHTML = `
        <div class="vacante-info-modal">
            <h4>${vacante.titulo || 'Vacante'}</h4>
            <p><strong>Estado:</strong> <span class="postulacion-estado ${estadoKey}">${estadoRaw || '-'}</span></p>
            <p><strong>Vacantes disponibles:</strong> ${vacantesDisponibles ?? 0}</p>
            <p><strong>Descripción:</strong> ${getVacanteDescripcion(vacante) || '-'}</p>
            <p><strong>Requisitos:</strong> ${getVacanteRequisitosTexto(vacante) || '-'}</p>
            <p><strong>Publicado por:</strong> ${propietarioNombre}</p>
            <p><strong>Fecha de postulación:</strong> ${new Date(postulacion.createdAt).toLocaleString('es-ES')}</p>
        </div>
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
        const template = requireConfigValue('APPLICATION_ENDPOINTS', (typeof APPLICATION_ENDPOINTS !== 'undefined' ? APPLICATION_ENDPOINTS : null), 'DELETE_APPLICATION');
        const url = resolveEndpoint(template, { id: postulacionId });
        await fetchAPI(url, {
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
        const inboxBase = requireConfigValue('MESSAGE_ENDPOINTS', (typeof MESSAGE_ENDPOINTS !== 'undefined' ? MESSAGE_ENDPOINTS : null), 'INBOX');
        const data = await fetchAPI(withQuery(inboxBase, { limit: 50 }));
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
        const sentBase = requireConfigValue('MESSAGE_ENDPOINTS', (typeof MESSAGE_ENDPOINTS !== 'undefined' ? MESSAGE_ENDPOINTS : null), 'SENT');
        const data = await fetchAPI(withQuery(sentBase, { limit: 50 }));
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
        const template = requireConfigValue('MESSAGE_ENDPOINTS', (typeof MESSAGE_ENDPOINTS !== 'undefined' ? MESSAGE_ENDPOINTS : null), 'GET_MESSAGE');
        const url = resolveEndpoint(template, { id: mensajeId });
        const mensaje = await fetchAPI(url);
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

    // Botón nuevo mensaje (desde sección Mensajes)
    const nuevoMensajeBtn = document.getElementById('nuevoMensajeBtn');
    if (nuevoMensajeBtn) {
        nuevoMensajeBtn.addEventListener('click', () => abrirModalNuevoMensaje(true));
    }
});

/**
 * Abrir modal para crear nuevo mensaje
 * @param {boolean} desdeSeccionMensajes - Si es true, solo muestra destinatarios permitidos
 */
async function abrirModalNuevoMensaje(desdeSeccionMensajes = false) {
    const modal = document.getElementById('modalNuevoMensaje');
    const form = document.getElementById('formNuevoMensaje');
    const destinatarioTipoSelect = document.getElementById('destinatarioTipo');
    const destinatarioIdSelect = document.getElementById('destinatarioId');
    const destinatarioHelp = document.getElementById('destinatarioHelp');

    if (!modal || !form) return;

    form.reset();
    modal.classList.remove('hidden');

    // Si se abre desde la sección Mensajes, cargar solo destinatarios permitidos
    if (desdeSeccionMensajes) {
        await cargarDestinatariosPermitidos();
        const tipoDestinatarioHelp = document.getElementById('tipoDestinatarioHelp');
        if (tipoDestinatarioHelp) {
            tipoDestinatarioHelp.textContent = 'Solo profesores/empresas con los que compartas postulaciones';
        }
        if (destinatarioHelp) {
            destinatarioHelp.textContent = 'Solo puedes enviar mensajes a profesores/empresas con los que compartas postulaciones';
        }
    } else {
        // Si se abre desde una postulación, restaurar opciones originales
        const tipoDestinatarioHelp = document.getElementById('tipoDestinatarioHelp');
        if (tipoDestinatarioHelp) {
            tipoDestinatarioHelp.textContent = 'Selecciona desde una vacante o postulación para prellenar estos campos';
        }
        if (destinatarioTipoSelect) {
            destinatarioTipoSelect.innerHTML = `
                <option value="">Seleccionar tipo...</option>
                <option value="Profesor">Profesor</option>
                <option value="Institucion">Empresa/Institución</option>
            `;
        }
        if (destinatarioIdSelect) {
            destinatarioIdSelect.innerHTML = '<option value="">Seleccionar destinatario...</option>';
        }
        if (destinatarioHelp) {
            destinatarioHelp.textContent = 'Este campo se completa automáticamente al seleccionar desde una vacante o postulación';
        }
    }

    const cerrarBtn = document.getElementById('cerrarModalMensaje');
    const cancelarBtn = document.getElementById('cancelarMensajeBtn');

    const cerrarModal = () => {
        modal.classList.add('hidden');
        form.dataset.relacionadoTipo = '';
        form.dataset.relacionadoId = '';
        form.dataset.profesores = '';
        form.dataset.instituciones = '';
    };

    if (cerrarBtn) cerrarBtn.onclick = cerrarModal;
    if (cancelarBtn) cancelarBtn.onclick = cerrarModal;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const destinatarioId = destinatarioIdSelect ? destinatarioIdSelect.value : '';
        const destinatarioTipo = destinatarioTipoSelect ? destinatarioTipoSelect.value : '';
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
 * Cargar destinatarios permitidos (profesores/empresas con postulaciones compartidas)
 */
async function cargarDestinatariosPermitidos() {
    try {
        const data = await fetchAPI('/mensajes/destinatarios-permitidos');
        const destinatarioTipoSelect = document.getElementById('destinatarioTipo');
        const destinatarioIdSelect = document.getElementById('destinatarioId');
        const destinatarioHelp = document.getElementById('destinatarioHelp');

        if (!destinatarioTipoSelect || !destinatarioIdSelect) return;

        // Limpiar selects
        destinatarioTipoSelect.innerHTML = '<option value="">Seleccionar tipo...</option>';
        destinatarioIdSelect.innerHTML = '<option value="">Seleccionar destinatario...</option>';

        // Agregar opciones de profesores
        if (data.profesores && data.profesores.length > 0) {
            const profesorOption = document.createElement('option');
            profesorOption.value = 'Profesor';
            profesorOption.textContent = `Profesor (${data.profesores.length})`;
            destinatarioTipoSelect.appendChild(profesorOption);
        }

        // Agregar opciones de instituciones
        if (data.instituciones && data.instituciones.length > 0) {
            const institucionOption = document.createElement('option');
            institucionOption.value = 'Institucion';
            institucionOption.textContent = `Empresa/Institución (${data.instituciones.length})`;
            destinatarioTipoSelect.appendChild(institucionOption);
        }

        if (data.total === 0) {
            if (destinatarioHelp) {
                destinatarioHelp.textContent = 'No tienes destinatarios disponibles. Debes tener al menos una postulación para enviar mensajes.';
                destinatarioHelp.style.color = 'var(--red)';
            }
            return;
        }

        // Guardar datos en el formulario para usar cuando se seleccione el tipo
        const form = document.getElementById('formNuevoMensaje');
        if (form) {
            form.dataset.profesores = JSON.stringify(data.profesores || []);
            form.dataset.instituciones = JSON.stringify(data.instituciones || []);
        }

        // Event listener para cuando se seleccione el tipo
        destinatarioTipoSelect.onchange = () => {
            const tipo = destinatarioTipoSelect.value;
            destinatarioIdSelect.innerHTML = '<option value="">Seleccionar destinatario...</option>';

            if (tipo === 'Profesor') {
                const profesores = JSON.parse(form.dataset.profesores || '[]');
                profesores.forEach(profesor => {
                    const option = document.createElement('option');
                    option.value = profesor.id;
                    option.textContent = `${profesor.nombre} (${profesor.correo})`;
                    destinatarioIdSelect.appendChild(option);
                });
            } else if (tipo === 'Institucion') {
                const instituciones = JSON.parse(form.dataset.instituciones || '[]');
                instituciones.forEach(institucion => {
                    const option = document.createElement('option');
                    option.value = institucion.id;
                    option.textContent = `${institucion.nombre} (${institucion.correo})`;
                    destinatarioIdSelect.appendChild(option);
                });
            }
        };
    } catch (error) {
        console.error('Error cargando destinatarios permitidos:', error);
        showError('Error al cargar destinatarios. Solo puedes enviar mensajes a profesores/empresas con los que compartas postulaciones.');
    }
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

        const createUrl = requireConfigValue('MESSAGE_ENDPOINTS', (typeof MESSAGE_ENDPOINTS !== 'undefined' ? MESSAGE_ENDPOINTS : null), 'CREATE_MESSAGE');
        await fetchAPI(createUrl, {
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

