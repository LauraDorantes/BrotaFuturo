// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

/**
 * URL base de la API
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

let list = document.querySelectorAll(".navigation li");

// Preferir claves centralizadas (definidas en js/config.js)
const PROFESOR_PROFILE_KEY = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.PROFESOR_PROFILE)
    ? STORAGE_KEYS.PROFESOR_PROFILE
    : 'perfilData';

const PROFESOR_PUBLICACIONES_KEY = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.PROFESOR_PUBLICACIONES)
    ? STORAGE_KEYS.PROFESOR_PUBLICACIONES
    : 'publicaciones';

function getAccessToken() {
    try {
        if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.ACCESS_TOKEN) {
            return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        }
    } catch { /* noop */ }
    return localStorage.getItem('accessToken');
}

function getStoredUserRole() {
    try {
        if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.USER_ROLE) {
            return localStorage.getItem(STORAGE_KEYS.USER_ROLE);
        }
    } catch { /* noop */ }
    return localStorage.getItem('userRole');
}

function clearAuthStorage() {
    const keys = (typeof STORAGE_KEYS !== 'undefined')
        ? [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER_ROLE, STORAGE_KEYS.USER_ID, STORAGE_KEYS.USER_EMAIL]
        : ['accessToken', 'refreshToken', 'userRole', 'userId', 'userEmail'];
    keys.filter(Boolean).forEach((k) => localStorage.removeItem(k));
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

async function fetchMe() {
    const token = getAccessToken();
    if (!token) return null;
    if (typeof AUTH_ENDPOINTS === 'undefined' || !AUTH_ENDPOINTS.GET_USER) return null;

    const res = await fetch(AUTH_ENDPOINTS.GET_USER, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) return null;
    try {
        return await res.json();
    } catch {
        return null;
    }
}

function mapApiProfesorToPerfilData(apiUser) {
    if (!apiUser) return {};
    return {
        nombre: apiUser.nombres || '',
        aPaterno: apiUser.apellidoPaterno || '',
        aMaterno: apiUser.apellidoMaterno || '',
        email: apiUser.correo || '',
        phone: apiUser.telefono != null ? String(apiUser.telefono) : '',
        dept: apiUser.departamento || '',
        sexo: apiUser.sexo || '',
        rfc: apiUser.rfc || '',
        curp: apiUser.curp || '',
    };
}

async function updateProfesorPerfil(payload) {
    const token = getAccessToken();
    if (!token) throw new Error('Sin token');
    if (typeof PROFESSOR_ENDPOINTS === 'undefined' || !PROFESSOR_ENDPOINTS.UPDATE_PROFILE) {
        throw new Error('Falta configuraci\u00f3n: PROFESSOR_ENDPOINTS.UPDATE_PROFILE');
    }

    const res = await fetch(PROFESSOR_ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload || {}),
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        const msg = data && data.message ? data.message : 'Error al actualizar perfil';
        throw new Error(msg);
    }

    return data;
}

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

function showSection(sectionClass) {
    if (!sectionClass) return;

    // Solo ocultar los paneles principales (evitar ocultar secciones internas como #perfilReadOnly)
    document.querySelectorAll(".main > section").forEach(sec => {
        sec.classList.add("hidden");
    });

    const sectionToShow = document.querySelector(`.${sectionClass}`);
    if (sectionToShow) {
        sectionToShow.classList.remove("hidden");
    }

    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function getSectionFromHash() {
    const hash = String(window.location.hash || '').replace('#', '').trim();
    if (!hash) return null;
    // Permitimos usar el hash como clase de sección (ej: #perfil-section)
    if (document.querySelector(`.${hash}`)) return hash;
    // Fallback: si usan el id en el hash, intentamos mapearlo a la sección contenedora
    const byId = document.getElementById(hash);
    if (byId && byId.tagName && byId.tagName.toLowerCase() === 'section') {
        const cls = Array.from(byId.classList).find(c => c.endsWith('-section'));
        return cls || null;
    }
    return null;
}

// CAMBIAR SECCIONES
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        const sectionClass = item.getAttribute("data-section");
        if (sectionClass) {
            history.replaceState(null, '', `#${sectionClass}`);
        }
        showSection(sectionClass);

        // Cargar alumnos asociados al abrir la sección
        if (sectionClass === 'alumnos-section') {
            cargarAlumnos();
        }
    });
});

// Sección inicial: Perfil (o la que venga en el hash)
document.addEventListener("DOMContentLoaded", () => {
    // Guard simple: si no hay sesión válida, regresar al login
    const role = String(getStoredUserRole() || '').toLowerCase();
    const token = getAccessToken();
    if (!token || (role && role !== 'profesor')) {
        clearAuthStorage();
        redirectToLogin();
        return;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            clearAuthStorage();
            redirectToLogin();
        });
    }

    const initialSection = getSectionFromHash() || 'perfil-section';
    showSection(initialSection);
    if (initialSection === 'alumnos-section') {
        cargarAlumnos();
    }
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
        const currentPasswordInput = document.getElementById("currentPasswordInput");
        const newPasswordInput = document.getElementById("newPasswordInput");

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

        if (!perfilForm || !perfilReadOnly) return;

        function loadPerfil() {
            const data = JSON.parse(localStorage.getItem(PROFESOR_PROFILE_KEY)) || {};

            if (perfilAvatar && data.avatar) perfilAvatar.src = data.avatar;

            if (nombreInput) nombreInput.value = data.nombre || "";
            if (aPaternoInput) aPaternoInput.value = data.aPaterno || "";
            if (aMaternoInput) aMaternoInput.value = data.aMaterno || "";
            if (emailInput) emailInput.value = data.email || "";
            if (phoneInput) phoneInput.value = data.phone || "";
            if (deptInput) deptInput.value = data.dept || "";
            if (sexoInput) sexoInput.value = data.sexo || "";
            if (rfcInput) rfcInput.value = data.rfc || "";
            if (curpInput) curpInput.value = data.curp || "";

            // Password: no se precarga
            if (currentPasswordInput) currentPasswordInput.value = "";
            if (newPasswordInput) newPasswordInput.value = "";

            if (ro_curp) ro_curp.textContent = data.curp || "-";
            if (ro_nombre) ro_nombre.textContent = data.nombre || "-";
            if (ro_aPaterno) ro_aPaterno.textContent = data.aPaterno || "-";
            if (ro_aMaterno) ro_aMaterno.textContent = data.aMaterno || "-";
            if (ro_sexo) ro_sexo.textContent = data.sexo || "-";
            if (ro_email) ro_email.textContent = data.email || "-";
            if (ro_phone) ro_phone.textContent = data.phone || "-";
            if (ro_dept) ro_dept.textContent = data.dept || "-";
            if (ro_rfc) ro_rfc.textContent = data.rfc || "-";

            if (displayName) {
                displayName.textContent = data.nombre
                    ? `${data.nombre} ${data.aPaterno || ""}`.trim()
                    : "Nombre Apellido";
            }
        }

        async function changePassword(currentPassword, newPassword) {
            const token = getAccessToken();
            if (!token) throw new Error('Sin token');
            if (typeof AUTH_ENDPOINTS === 'undefined' || !AUTH_ENDPOINTS.CHANGE_PASSWORD) {
                throw new Error('Falta configuraci\u00f3n: AUTH_ENDPOINTS.CHANGE_PASSWORD');
            }

            const res = await fetch(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
            });

            let data = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (!res.ok) {
                const msg = data && data.message ? data.message : 'Error al cambiar la contrase\u00f1a';
                throw new Error(msg);
            }
            return data;
        }

        // 1) Pintar lo que haya local (fallback)
        loadPerfil();

        // 2) Intentar cargar desde backend y sincronizar UI
        (async () => {
            try {
                const meResponse = await fetchMe();
                const apiUser = meResponse && meResponse.user ? meResponse.user : null;
                if (!apiUser) return;

                const perfilFromApi = mapApiProfesorToPerfilData(apiUser);
                const merged = {
                    ...JSON.parse(localStorage.getItem(PROFESOR_PROFILE_KEY)) || {},
                    ...perfilFromApi,
                };
                localStorage.setItem(PROFESOR_PROFILE_KEY, JSON.stringify(merged));
                loadPerfil();
            } catch {
                // Si falla, nos quedamos con el localStorage
            }
        })();

        if (avatarInput && perfilAvatar) {
            avatarInput.addEventListener("change", (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (ev) => {
                    perfilAvatar.src = ev.target.result;
                    perfilAvatar.dataset.tmp = ev.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (editBtn) {
            editBtn.addEventListener("click", () => {
                perfilForm.classList.remove("hidden");
                perfilReadOnly.classList.add("hidden");
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                perfilForm.classList.add("hidden");
                perfilReadOnly.classList.remove("hidden");
                loadPerfil();
                if (perfilAvatar) delete perfilAvatar.dataset.tmp;
            });
        }

        perfilForm.addEventListener("submit", async (e) => {
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

            // Limpia marcas previas
            [nombreInput, aPaternoInput, aMaternoInput, emailInput, phoneInput, deptInput, sexoInput, rfcInput, curpInput]
                .filter(Boolean)
                .forEach(clearInvalid);

            // Quitar marca al editar
            [nombreInput, aPaternoInput, aMaternoInput, emailInput, phoneInput, deptInput, rfcInput, curpInput]
                .filter(Boolean)
                .forEach((el) => el.addEventListener('input', () => clearInvalid(el), { once: true }));
            [sexoInput]
                .filter(Boolean)
                .forEach((el) => el.addEventListener('change', () => clearInvalid(el), { once: true }));

            // Validaciones alineadas con scripts_login.js
            const expresiones = {
                nombre: /^[a-zA-ZÀ-ÿ\s]{1,40}$/,
                telefono: /^\d{7,10}$/,
                curp: /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/,
                correoProfe: /^[a-zA-Z0-9_.+-]+@ipn\.mx$/,
                rfc: /^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/i,
            };

            const nombresRaw = String((nombreInput && nombreInput.value) || '').trim();
            const apellidoPaternoRaw = String((aPaternoInput && aPaternoInput.value) || '').trim();
            const apellidoMaternoRaw = String((aMaternoInput && aMaternoInput.value) || '').trim();
            const correoRaw = String((emailInput && emailInput.value) || '').trim();
            const telefonoDigits = String((phoneInput && phoneInput.value) || '').replace(/\D/g, '');
            const departamentoRaw = String((deptInput && deptInput.value) || '').trim();
            const sexoRaw = String((sexoInput && sexoInput.value) || '').trim();
            const rfcRaw = String((rfcInput && rfcInput.value) || '').trim().toUpperCase();
            const curpRaw = String((curpInput && curpInput.value) || '').trim().toUpperCase();

            if (!nombresRaw || !expresiones.nombre.test(nombresRaw)) {
                markInvalid(nombreInput);
                alert('Nombres inválidos');
                return;
            }
            if (!apellidoPaternoRaw || !expresiones.nombre.test(apellidoPaternoRaw)) {
                markInvalid(aPaternoInput);
                alert('Apellido paterno inválido');
                return;
            }
            if (!apellidoMaternoRaw || !expresiones.nombre.test(apellidoMaternoRaw)) {
                markInvalid(aMaternoInput);
                alert('Apellido materno inválido');
                return;
            }
            if (!correoRaw || !expresiones.correoProfe.test(correoRaw)) {
                markInvalid(emailInput);
                alert('Correo inválido (usa @ipn.mx)');
                return;
            }
            if (!telefonoDigits || !expresiones.telefono.test(telefonoDigits)) {
                markInvalid(phoneInput);
                alert('Teléfono inválido (7 a 10 dígitos)');
                return;
            }
            if (!departamentoRaw) {
                markInvalid(deptInput);
                alert('Departamento requerido');
                return;
            }
            if (!sexoRaw || (sexoRaw !== 'Masculino' && sexoRaw !== 'Femenino')) {
                markInvalid(sexoInput);
                alert('Selecciona un sexo válido');
                return;
            }
            if (!rfcRaw || !expresiones.rfc.test(rfcRaw)) {
                markInvalid(rfcInput);
                alert('RFC inválido');
                return;
            }
            if (!curpRaw || !expresiones.curp.test(curpRaw)) {
                markInvalid(curpInput);
                alert('CURP inválida');
                return;
            }

            // Misma regla que en login/registro (scripts_login.js)
            const STRONG_PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/;

            const currentPassword = currentPasswordInput ? String(currentPasswordInput.value || '') : '';
            const newPassword = newPasswordInput ? String(newPasswordInput.value || '') : '';

            // Validar cambio de contraseña (opcional)
            if (newPassword.trim()) {
                if (!currentPassword.trim()) {
                    alert('Para cambiar la contrase\u00f1a, ingresa tu contrase\u00f1a actual');
                    return;
                }
                if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
                    alert('La nueva contrase\u00f1a debe tener al menos 6 caracteres, 1 may\u00fascula, 1 min\u00fascula, 1 n\u00famero y 1 s\u00edmbolo');
                    return;
                }
            }

            const payload = {
                nombres: nombresRaw,
                apellidoPaterno: apellidoPaternoRaw,
                apellidoMaterno: apellidoMaternoRaw,
                correo: correoRaw,
                departamento: departamentoRaw,
                sexo: sexoRaw,
                rfc: rfcRaw,
                curp: curpRaw,
                telefono: Number(telefonoDigits),
            };

            // No enviar strings vacíos para no pisar datos existentes
            Object.keys(payload).forEach((k) => {
                if (payload[k] === '') delete payload[k];
            });

            const perfilData = {
                nombre: nombresRaw,
                aPaterno: apellidoPaternoRaw,
                aMaterno: apellidoMaternoRaw,
                email: correoRaw,
                phone: telefonoDigits,
                dept: departamentoRaw,
                sexo: sexoRaw,
                avatar: perfilAvatar ? (perfilAvatar.dataset.tmp || perfilAvatar.src) : '',
                rfc: rfcRaw,
                curp: curpRaw,
            };

            try {
                // 1) Cambiar contraseña (si aplica)
                if (newPassword.trim()) {
                    await changePassword(currentPassword, newPassword);
                    if (currentPasswordInput) currentPasswordInput.value = '';
                    if (newPasswordInput) newPasswordInput.value = '';
                }

                // 2) Actualizar perfil
                const updated = await updateProfesorPerfil(payload);
                const apiProfesor = updated && updated.data ? updated.data : null;
                if (apiProfesor) {
                    const perfilFromApi = mapApiProfesorToPerfilData(apiProfesor);
                    const merged = {
                        ...JSON.parse(localStorage.getItem(PROFESOR_PROFILE_KEY)) || {},
                        ...perfilFromApi,
                        avatar: perfilData.avatar,
                    };
                    localStorage.setItem(PROFESOR_PROFILE_KEY, JSON.stringify(merged));
                } else {
                    localStorage.setItem(PROFESOR_PROFILE_KEY, JSON.stringify(perfilData));
                }

                if (perfilAvatar) delete perfilAvatar.dataset.tmp;
                loadPerfil();
                perfilForm.classList.add("hidden");
                perfilReadOnly.classList.remove("hidden");
            } catch (err) {
                // Si falla el backend, al menos guardar local
                localStorage.setItem(PROFESOR_PROFILE_KEY, JSON.stringify(perfilData));
                if (perfilAvatar) delete perfilAvatar.dataset.tmp;
                loadPerfil();
                perfilForm.classList.add("hidden");
                perfilReadOnly.classList.remove("hidden");
                alert(err && err.message ? err.message : 'No se pudo actualizar el perfil');
            }
        });
    });

// SISTEMA DE PUBLICACIONES
class SistemaPublicaciones {
    constructor() {
        // LocalStorage se usa como fallback y para estado local (activa/cerrada)
        this.publicaciones = [];
        this.localPublicaciones = JSON.parse(localStorage.getItem(PROFESOR_PUBLICACIONES_KEY)) || [];
        this.init();
    }

    init() {
        this.cargarElementos();
        this.agregarEventListeners();
        this.configurarFechas();

        // Pintar algo rápido con lo local y luego sincronizar con backend
        this.publicaciones = Array.isArray(this.localPublicaciones) ? [...this.localPublicaciones] : [];
        this.mostrarPublicaciones();
        this.actualizarEstadisticas();

        this.cargarDesdeBackend();
    }

    cargarElementos() {
        this.crearPublicacionBtn = document.getElementById('crearPublicacionBtn');
        this.modalPublicacion = document.getElementById('modalPublicacion');
        this.cerrarModalPub = document.getElementById('cerrarModalPub');
        this.cancelarPublicacionBtn = document.getElementById('cancelarPublicacionBtn');
        this.formPublicacion = document.getElementById('formPublicacion');
        this.modalTitulo = document.getElementById('modalTitulo');
        this.listaPublicaciones = document.getElementById('listaPublicaciones');

        // Modal de postulantes
        this.modalPostulantes = document.getElementById('modalPostulantes');
        this.cerrarModalPostulantesBtn = this.modalPostulantes ? this.modalPostulantes.querySelector('.close') : null;
        this.postulantesVacante = document.getElementById('postulantesVacante');
        this.postulantesTotal = document.getElementById('postulantesTotal');
        this.tbodyPostulantes = document.getElementById('tbodyPostulantes');

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
        this.requerimientosPub = document.getElementById('requerimientosPub');
        this.carrerasPub = document.getElementById('carrerasPub');
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
        this.perfilData = JSON.parse(localStorage.getItem(PROFESOR_PROFILE_KEY)) || {};
        this.edicionId = null;
    }

    cerrarModalPostulantes() {
        if (this.modalPostulantes) {
            this.modalPostulantes.classList.add('hidden');
        }
        this._currentVacanteId = null;
    }

    setPostulantesModalLoading(titulo) {
        if (this.postulantesVacante) this.postulantesVacante.textContent = titulo || '-';
        if (this.postulantesTotal) this.postulantesTotal.textContent = '...';
        if (this.tbodyPostulantes) {
            this.tbodyPostulantes.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding: 16px;">Cargando postulantes...</td>
                </tr>
            `;
        }
    }

    setPostulantesModalEmpty(titulo) {
        if (this.postulantesVacante) this.postulantesVacante.textContent = titulo || '-';
        if (this.postulantesTotal) this.postulantesTotal.textContent = '0';
        if (this.tbodyPostulantes) {
            this.tbodyPostulantes.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding: 16px;">No hay postulantes aún.</td>
                </tr>
            `;
        }
    }

    buildDriveCvUrl(cvID) {
        const id = String(cvID || '').trim();
        if (!id) return null;
        return `https://drive.google.com/uc?id=${encodeURIComponent(id)}`;
    }

    async responderPostulacion(vacanteId, postulacionId, accion) {
        const token = getAccessToken();
        if (!token) {
            alert('Sesión expirada. Vuelve a iniciar sesión.');
            return;
        }
        if (typeof PROFESSOR_ENDPOINTS === 'undefined') {
            alert('Falta configuración: PROFESSOR_ENDPOINTS');
            return;
        }

        const endpoint = accion === 'aceptar'
            ? PROFESSOR_ENDPOINTS.ACCEPT_APPLICATION
            : PROFESSOR_ENDPOINTS.REJECT_APPLICATION;

        if (!endpoint) {
            alert('Falta configuración de endpoint para responder postulación');
            return;
        }

        try {
            const url = this.buildUrl(endpoint, { vacanteId, postulacionId });
            const { res, data } = await this.fetchJson(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                const msg = data && data.message ? data.message : 'No se pudo actualizar la postulación';
                throw new Error(msg);
            }

            // Refrescar lista de postulantes en el modal
            this.verPostulantes(String(vacanteId));
        } catch (err) {
            alert(err && err.message ? err.message : 'No se pudo actualizar la postulación');
        }
    }

    renderPostulantesTable(titulo, postulaciones) {
        if (this.postulantesVacante) this.postulantesVacante.textContent = titulo || '-';
        if (this.postulantesTotal) this.postulantesTotal.textContent = String(Array.isArray(postulaciones) ? postulaciones.length : 0);
        if (!this.tbodyPostulantes) return;

        const rows = Array.isArray(postulaciones) ? postulaciones : [];
        this.tbodyPostulantes.innerHTML = '';

        rows.forEach((p, idx) => {
            const a = p && p.alumno ? p.alumno : null;
            const nombre = a
                ? `${a.nombres || ''} ${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`.replace(/\s+/g, ' ').trim()
                : 'Alumno no disponible';

            const estadoRaw = String((p && p.estado) || '').trim();
            const estadoKey = estadoRaw.toLowerCase();

            const tr = document.createElement('tr');

            const c1 = document.createElement('td');
            c1.textContent = String(idx + 1);
            const c2 = document.createElement('td');
            c2.textContent = nombre;
            const c3 = document.createElement('td');
            c3.textContent = a && a.correo ? String(a.correo) : '-';
            const c4 = document.createElement('td');
            c4.textContent = a && a.boleta != null ? String(a.boleta) : '-';
            const c5 = document.createElement('td');
            c5.textContent = a && a.carrera ? String(a.carrera) : '-';
            const c6 = document.createElement('td');
            c6.textContent = a && a.creditos != null ? String(a.creditos) : '-';
            const c7 = document.createElement('td');

            // CV
            const c7cv = document.createElement('td');
            const cvUrl = a && a.cvID ? this.buildDriveCvUrl(a.cvID) : null;
            if (cvUrl) {
                const btnCv = document.createElement('button');
                btnCv.className = 'btn btn-small outline';
                btnCv.type = 'button';
                btnCv.textContent = 'Ver CV';
                btnCv.addEventListener('click', () => {
                    window.open(cvUrl, '_blank', 'noopener');
                });
                c7cv.appendChild(btnCv);
            } else {
                c7cv.textContent = '-';
            }

            // Estado
            c7.textContent = estadoRaw || '-';

            // Acciones
            const c8 = document.createElement('td');
            // Solo mostrar acciones si está Pendiente
            if (estadoKey === 'pendiente') {
                const aceptarBtn = document.createElement('button');
                aceptarBtn.className = 'btn btn-small aceptar';
                aceptarBtn.type = 'button';
                aceptarBtn.textContent = 'Aceptar';

                const rechazarBtn = document.createElement('button');
                rechazarBtn.className = 'btn btn-small rechazar';
                rechazarBtn.type = 'button';
                rechazarBtn.textContent = 'Rechazar';

                aceptarBtn.addEventListener('click', () => {
                    const vid = this._currentVacanteId;
                    if (!vid) return;
                    if (!confirm('¿Aceptar esta postulación?')) return;
                    this.responderPostulacion(vid, p._id, 'aceptar');
                });

                rechazarBtn.addEventListener('click', () => {
                    const vid = this._currentVacanteId;
                    if (!vid) return;
                    if (!confirm('¿Rechazar esta postulación?')) return;
                    this.responderPostulacion(vid, p._id, 'rechazar');
                });

                c8.appendChild(aceptarBtn);
                c8.appendChild(rechazarBtn);
            } else {
                c8.textContent = '-';
            }

            tr.appendChild(c1);
            tr.appendChild(c2);
            tr.appendChild(c3);
            tr.appendChild(c4);
            tr.appendChild(c5);
            tr.appendChild(c6);
            tr.appendChild(c7cv);
            tr.appendChild(c7);
            tr.appendChild(c8);

            this.tbodyPostulantes.appendChild(tr);
        });
    }

    getPerfilData() {
        this.perfilData = JSON.parse(localStorage.getItem(PROFESOR_PROFILE_KEY)) || {};
        return this.perfilData;
    }

    getMyVacanciesEndpoint() {
        if (typeof PROFESSOR_ENDPOINTS !== 'undefined' && PROFESSOR_ENDPOINTS.MY_VACANCIES) {
            return PROFESSOR_ENDPOINTS.MY_VACANCIES;
        }
        return null;
    }

    buildUrl(template, params) {
        let url = String(template || '');
        Object.keys(params || {}).forEach((k) => {
            url = url.replace(`:${k}`, encodeURIComponent(String(params[k])));
        });
        return url;
    }

    async fetchJson(url, options) {
        const res = await fetch(url, options);
        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        return { res, data };
    }

    mapModalidadToApi(value) {
        const v = String(value || '').toLowerCase();
        if (v === 'presencial') return 'Presencial';
        if (v === 'remoto') return 'Remoto';
        if (v === 'hibrido' || v === 'híbrido') return 'Híbrido';
        return value;
    }

    mapBeneficiosToApi(beneficiosValues) {
        const map = {
            certificacion: 'Certificación al término',
            cartarecomendacion: 'Carta de recomendación',
            experiencialaboral: 'Experiencia laboral comprobable',
        };
        return (beneficiosValues || [])
            .map((v) => map[String(v)] || String(v))
            .filter(Boolean);
    }

    mapBeneficiosToCheckboxValues(beneficiosAlumno) {
        const reverse = {
            'Certificación al término': 'certificacion',
            'Carta de recomendación': 'cartarecomendacion',
            'Experiencia laboral comprobable': 'experiencialaboral',
        };
        return (beneficiosAlumno || [])
            .map((b) => reverse[String(b)] || null)
            .filter(Boolean);
    }

    toInputDate(value) {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    normalizePhoneDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    mapVacanteToPublicacion(vacante) {
        const id = vacante && (vacante._id || vacante.id);
        const postulantesCount = (vacante && (vacante.postulacionesCount ?? vacante.postulantesCount)) != null
            ? Number(vacante.postulacionesCount ?? vacante.postulantesCount)
            : 0;

        const numeroVacantes = vacante && vacante.numeroVacantes != null ? Number(vacante.numeroVacantes) : 1;
        const vacantesDisponibles = vacante && vacante.vacantesDisponibles != null
            ? Number(vacante.vacantesDisponibles)
            : numeroVacantes;
        return {
            id: id ? String(id) : String(Date.now()),
            titulo: vacante && vacante.titulo ? String(vacante.titulo) : '',
            area: vacante && vacante.area ? String(vacante.area) : '',
            vacantes: numeroVacantes,
            vacantesDisponibles,
            objetivos: vacante && vacante.objetivos ? String(vacante.objetivos) : '',
            actividades: vacante && vacante.actividades ? String(vacante.actividades) : '',
            requerimientos: vacante && vacante.requerimientos ? String(vacante.requerimientos) : '',
            carreraRequerida: vacante && vacante.carreraRequerida ? String(vacante.carreraRequerida) : '',
            conocimientos: vacante && vacante.conocimientosTecnicos ? String(vacante.conocimientosTecnicos) : '',
            habilidades: vacante && vacante.habilidades ? String(vacante.habilidades) : '',
            modalidad: vacante && vacante.modalidad ? String(vacante.modalidad) : '',
            horas: vacante && vacante.horasSemanal != null ? Number(vacante.horasSemanal) : 10,
            fechaInicio: this.toInputDate(vacante && vacante.fechaInicio),
            fechaLimite: this.toInputDate(vacante && vacante.fechaLimite),
            duracion: vacante && vacante.duracionMeses != null ? Number(vacante.duracionMeses) : 6,
            beneficiosAlumno: Array.isArray(vacante && vacante.beneficiosAlumno) ? vacante.beneficiosAlumno : [],
            otrosBeneficios: vacante && vacante.otrosBeneficios ? String(vacante.otrosBeneficios) : '',
            infoAdicional: vacante && vacante.informacionAdicional ? String(vacante.informacionAdicional) : '',
            contactoEmail: vacante && vacante.correoConsulta ? String(vacante.correoConsulta) : '',
            contactoTelefono: vacante && vacante.telefonoConsulta != null ? String(vacante.telefonoConsulta) : '',
            estado: 'activa',
            fechaCreacion: vacante && (vacante.fechaPublicacion || vacante.createdAt) ? new Date(vacante.fechaPublicacion || vacante.createdAt).toISOString() : new Date().toISOString(),
            postulantesCount,
        };
    }

    mergeLocalState(publicacionesFromApi) {
        const localArr = (() => {
            try {
                const raw = JSON.parse(localStorage.getItem(PROFESOR_PUBLICACIONES_KEY));
                return Array.isArray(raw) ? raw : [];
            } catch {
                return [];
            }
        })();
        const localById = new Map(
            localArr
                .filter((x) => x && (x.id || x._id))
                .map((x) => [String(x.id || x._id), x])
        );

        return publicacionesFromApi.map((p) => {
            const local = localById.get(String(p.id));
            if (!local) return p;
            return {
                ...p,
                estado: local.estado || p.estado,
            };
        });
    }

    async cargarDesdeBackend() {
        const endpoint = this.getMyVacanciesEndpoint();
        const token = getAccessToken();
        if (!endpoint || !token) return;

        try {
            if (this.listaPublicaciones) {
                this.listaPublicaciones.innerHTML = '<div class="no-publicaciones"><p>Cargando publicaciones...</p></div>';
            }

            const { res, data } = await this.fetchJson(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                return;
            }

            const vacantes = Array.isArray(data)
                ? data
                : (data && Array.isArray(data.data) ? data.data : []);

            const publicacionesFromApi = vacantes.map((v) => this.mapVacanteToPublicacion(v));
            this.publicaciones = this.mergeLocalState(publicacionesFromApi);
            localStorage.setItem(PROFESOR_PUBLICACIONES_KEY, JSON.stringify(this.publicaciones));

            this.mostrarPublicaciones();
            this.actualizarEstadisticas();
        } catch {
            // noop
        }
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

        // Cerrar modal de postulantes
        if (this.cerrarModalPostulantesBtn) {
            this.cerrarModalPostulantesBtn.addEventListener('click', () => this.cerrarModalPostulantes());
        }
        if (this.modalPostulantes) {
            this.modalPostulantes.addEventListener('click', (e) => {
                if (e.target === this.modalPostulantes) this.cerrarModalPostulantes();
            });
        }
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalPostulantes && !this.modalPostulantes.classList.contains('hidden')) {
                this.cerrarModalPostulantes();
            }
        });

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

        // Correo/teléfono siempre desde perfil (solo lectura)
        const perfil = this.getPerfilData();
        if (this.contactoEmailPub) {
            this.contactoEmailPub.readOnly = true;
            this.contactoEmailPub.value = perfil.email || '';
        }
        if (this.contactoTelefonoPub) {
            this.contactoTelefonoPub.readOnly = true;
            this.contactoTelefonoPub.value = perfil.phone || '';
        }

    }

    abrirModalEditar(id) {
    const publicacion = this.publicaciones.find(p => String(p.id) === String(id));
    if (!publicacion) return;

    this.modalTitulo.textContent = 'Editar Publicación';
    this.edicionId = id;

    this.tituloPub.value = publicacion.titulo || '';
    if (this.areaPub) {
        if (publicacion.areaId) {
            this.areaPub.value = publicacion.areaId;
        } else {
            const areaTexto = String(publicacion.area || '').trim();
            const opt = Array.from(this.areaPub.options).find((o) => String(o.text || '').trim() === areaTexto);
            this.areaPub.value = opt ? opt.value : '';
        }
    }
    this.vacantesPub.value = publicacion.vacantes || 1;
    this.objetivosPub.value = publicacion.objetivos || '';
    this.actividadesPub.value = publicacion.actividades || '';
    if (this.requerimientosPub) this.requerimientosPub.value = publicacion.requerimientos || '';

    // carreraRequerida viene como string desde backend: intentamos seleccionar coincidencias por texto
    if (this.carrerasPub) {
        const carreraReq = String(publicacion.carreraRequerida || '');
        Array.from(this.carrerasPub.options).forEach((option) => {
            option.selected = carreraReq.includes(option.text);
        });
    }

    this.conocimientosPub.value = publicacion.conocimientos || '';
    this.habilidadesPub.value = publicacion.habilidades || '';
    // modalidad: el backend guarda con mayúscula/acentos; el select usa values en minúscula
    if (this.modalidadPub) {
        const m = String(publicacion.modalidad || '');
        this.modalidadPub.value = m.toLowerCase().includes('híbrido') || m.toLowerCase().includes('hibrido')
            ? 'hibrido'
            : m.toLowerCase();
    }
    this.horasPub.value = publicacion.horas || 10;
    this.fechaInicioPub.value = publicacion.fechaInicio || '';
    this.fechaLimitePub.value = publicacion.fechaLimite || '';
    this.duracionPub.value = publicacion.duracion || 6;
    // Correo/teléfono siempre desde perfil (solo lectura)
    const perfil = this.getPerfilData();
    if (this.contactoEmailPub) {
        this.contactoEmailPub.readOnly = true;
        this.contactoEmailPub.value = perfil.email || publicacion.contactoEmail || '';
    }
    if (this.contactoTelefonoPub) {
        this.contactoTelefonoPub.readOnly = true;
        this.contactoTelefonoPub.value = perfil.phone || publicacion.contactoTelefono || '';
    }
    this.infoAdicionalPub.value = publicacion.infoAdicional || '';
    this.otrosBeneficiosPub.value = publicacion.otrosBeneficios || '';

    const selectedCheckboxValues = this.mapBeneficiosToCheckboxValues(publicacion.beneficiosAlumno);
    document.querySelectorAll('input[name="beneficios"]').forEach((checkbox) => {
        checkbox.checked = selectedCheckboxValues.includes(checkbox.value);
    });

    this.modalPublicacion.classList.remove('hidden');
}

    cerrarModal() {
        this.modalPublicacion.classList.add('hidden');
        this.edicionId = null;
    }

async guardarPublicacion(e) {
    e.preventDefault();

    const beneficiosRaw = [];
    document.querySelectorAll('input[name="beneficios"]:checked').forEach((checkbox) => {
        beneficiosRaw.push(checkbox.value);
    });
    const beneficios = this.mapBeneficiosToApi(beneficiosRaw);

    const areaSelect = this.areaPub;
    const areaTexto = areaSelect && areaSelect.selectedIndex >= 0
        ? areaSelect.options[areaSelect.selectedIndex].text
        : '';

    const carrerasSeleccionadas = this.carrerasPub
        ? Array.from(this.carrerasPub.selectedOptions).map((o) => o.text)
        : [];

    if (!carrerasSeleccionadas.length) {
        alert('Selecciona al menos una carrera requerida');
        return;
    }

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

    const perfil = this.getPerfilData();
    const token = getAccessToken();
    if (!token) {
        alert('Sesión expirada. Vuelve a iniciar sesión.');
        return;
    }
    if (!perfil.email || !perfil.phone) {
        alert('Para publicar, primero completa tu correo y teléfono en tu perfil.');
        return;
    }

    // Payload para el modelo Vacante del backend
    const payload = {
        titulo: this.tituloPub.value,
        area: areaTexto,
        numeroVacantes: nuevaVacantes,
        objetivos: this.objetivosPub.value,
        actividades: this.actividadesPub.value,
        requerimientos: this.requerimientosPub ? this.requerimientosPub.value : '',
        carreraRequerida: carrerasSeleccionadas.join(', '),
        conocimientosTecnicos: this.conocimientosPub.value,
        habilidades: this.habilidadesPub.value,
        modalidad: this.mapModalidadToApi(this.modalidadPub.value),
        horasSemanal: parseInt(this.horasPub.value),
        fechaInicio: this.fechaInicioPub.value,
        fechaLimite: this.fechaLimitePub.value,
        duracionMeses: parseInt(this.duracionPub.value),
        beneficiosAlumno: beneficios,
        otrosBeneficios: this.otrosBeneficiosPub.value,
        informacionAdicional: this.infoAdicionalPub.value,
        correoConsulta: perfil.email,
        telefonoConsulta: this.normalizePhoneDigits(perfil.phone),
    };

    // Validaciones mínimas para evitar 400 por campos requeridos del backend
    const required = [
        { k: 'titulo', v: payload.titulo },
        { k: 'area', v: payload.area },
        { k: 'objetivos', v: payload.objetivos },
        { k: 'actividades', v: payload.actividades },
        { k: 'requerimientos', v: payload.requerimientos },
        { k: 'carreraRequerida', v: payload.carreraRequerida },
        { k: 'conocimientosTecnicos', v: payload.conocimientosTecnicos },
        { k: 'habilidades', v: payload.habilidades },
        { k: 'modalidad', v: payload.modalidad },
        { k: 'horasSemanal', v: payload.horasSemanal },
        { k: 'fechaInicio', v: payload.fechaInicio },
        { k: 'fechaLimite', v: payload.fechaLimite },
        { k: 'duracionMeses', v: payload.duracionMeses },
        { k: 'beneficiosAlumno', v: payload.beneficiosAlumno && payload.beneficiosAlumno.length },
        { k: 'correoConsulta', v: payload.correoConsulta },
        { k: 'telefonoConsulta', v: payload.telefonoConsulta },
    ];
    const missing = required.find((x) => !x.v);
    if (missing) {
        alert(`Completa el campo requerido: ${missing.k}`);
        return;
    }

    try {
        let url = null;
        let method = null;

        if (this.edicionId) {
            if (typeof VACANCY_ENDPOINTS === 'undefined' || !VACANCY_ENDPOINTS.UPDATE_VACANCY) {
                throw new Error('Falta configuración: VACANCY_ENDPOINTS.UPDATE_VACANCY');
            }
            url = this.buildUrl(VACANCY_ENDPOINTS.UPDATE_VACANCY, { id: this.edicionId });
            method = 'PUT';
        } else {
            if (typeof VACANCY_ENDPOINTS === 'undefined' || !VACANCY_ENDPOINTS.CREATE_VACANCY) {
                throw new Error('Falta configuración: VACANCY_ENDPOINTS.CREATE_VACANCY');
            }
            url = VACANCY_ENDPOINTS.CREATE_VACANCY;
            method = 'POST';
        }

        const { res, data } = await this.fetchJson(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const msg = data && data.message ? data.message : 'No se pudo guardar la publicación';
            throw new Error(msg);
        }

        // Refrescar desde backend (fuente de verdad)
        await this.cargarDesdeBackend();
        this.cerrarModal();
        alert(this.edicionId ? 'Publicación actualizada exitosamente' : 'Publicación creada exitosamente');
    } catch (err) {
        alert(err && err.message ? err.message : 'No se pudo guardar la publicación');
    }
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
        const postulantesCount = Number(
            publicacion && (publicacion.postulantesCount ?? (publicacion.postulantes ? publicacion.postulantes.length : 0))
        ) || 0;

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

        const id = String(target.dataset.id || '');
        const publicacion = this.publicaciones.find(p => String(p.id) === id);
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
        (async () => {
            const token = getAccessToken();
            if (!token) {
                alert('Sesión expirada. Vuelve a iniciar sesión.');
                return;
            }
            if (typeof VACANCY_ENDPOINTS === 'undefined' || !VACANCY_ENDPOINTS.DELETE_VACANCY) {
                alert('Falta configuración: VACANCY_ENDPOINTS.DELETE_VACANCY');
                return;
            }
            try {
                const url = this.buildUrl(VACANCY_ENDPOINTS.DELETE_VACANCY, { id });
                const { res, data } = await this.fetchJson(url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!res.ok) {
                    const msg = data && data.message ? data.message : 'No se pudo eliminar';
                    throw new Error(msg);
                }
                await this.cargarDesdeBackend();
                alert('Publicación eliminada');
            } catch (err) {
                alert(err && err.message ? err.message : 'No se pudo eliminar');
            }
        })();
    }

    cambiarEstadoPublicacion(id) {
        const index = this.publicaciones.findIndex(p => String(p.id) === String(id));
        if (index === -1) return;

        this.publicaciones[index].estado =
            this.publicaciones[index].estado === 'activa' ? 'cerrada' : 'activa';

        localStorage.setItem(PROFESOR_PUBLICACIONES_KEY, JSON.stringify(this.publicaciones));
        this.mostrarPublicaciones();
        this.actualizarEstadisticas();
    }

    verPostulantes(id) {
        const publicacion = this.publicaciones.find(p => p.id === id);
        if (!publicacion) return;

        // Guardar para acciones (aceptar/rechazar)
        this._currentVacanteId = String(id);

        const fallbackTitulo = publicacion.titulo || 'Publicación';

        if (!this.modalPostulantes || !this.tbodyPostulantes) {
            alert('No se encontró el modal de postulantes en el HTML.');
            return;
        }

        // Abrir modal y mostrar loading
        this.modalPostulantes.classList.remove('hidden');
        this.setPostulantesModalLoading(fallbackTitulo);

        (async () => {
            const token = getAccessToken();
            if (!token) {
                alert('Sesión expirada. Vuelve a iniciar sesión.');
                return;
            }
            if (typeof PROFESSOR_ENDPOINTS === 'undefined' || !PROFESSOR_ENDPOINTS.VACANCY_APPLICANTS) {
                alert('Falta configuración: PROFESSOR_ENDPOINTS.VACANCY_APPLICANTS');
                return;
            }

            try {
                const url = this.buildUrl(PROFESSOR_ENDPOINTS.VACANCY_APPLICANTS, { id });
                const { res, data } = await this.fetchJson(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const msg = data && data.message ? data.message : 'No se pudieron obtener los postulantes';
                    throw new Error(msg);
                }

                const payload = data && data.data ? data.data : data;
                const postulaciones = payload && Array.isArray(payload.postulaciones) ? payload.postulaciones : [];
                const total = payload && payload.total != null ? Number(payload.total) : postulaciones.length;

                // Mantener conteo actualizado en UI/local
                publicacion.postulantesCount = Number.isFinite(total) ? total : postulaciones.length;
                localStorage.setItem(PROFESOR_PUBLICACIONES_KEY, JSON.stringify(this.publicaciones));
                this.mostrarPublicaciones();
                this.actualizarEstadisticas();

                const titulo = (payload && payload.vacante && payload.vacante.titulo) ? payload.vacante.titulo : publicacion.titulo;

                if (postulaciones.length === 0) {
                    this.setPostulantesModalEmpty(titulo || fallbackTitulo);
                    return;
                }

                this.renderPostulantesTable(titulo || fallbackTitulo, postulaciones);
            } catch (err) {
                this.setPostulantesModalEmpty(fallbackTitulo);
                alert(err && err.message ? err.message : 'No se pudieron obtener los postulantes');
            }
        })();
    }

    actualizarEstadisticas() {
        const total = this.publicaciones.length;
        const activas = this.publicaciones.filter(p => p.estado === 'activa').length;
        const cerradas = this.publicaciones.filter(p => p.estado === 'cerrada').length;
        const postulantes = this.publicaciones.reduce((sum, p) => sum + (Number(p && p.postulantesCount) || 0), 0);

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
                    // Evitar múltiples instancias (cada instancia agrega listeners y duplicaría requests)
                    if (!window.sistemaPublicaciones) {
                        window.sistemaPublicaciones = new SistemaPublicaciones();
                    } else if (typeof window.sistemaPublicaciones.cargarDesdeBackend === 'function') {
                        window.sistemaPublicaciones.cargarDesdeBackend();
                    }
                }
            }
        });
    });

    const publicacionesSection = document.getElementById('publicaciones-section');
    if (publicacionesSection) {
        observer.observe(publicacionesSection, { attributes: true });
    }

    if (publicacionesSection && !publicacionesSection.classList.contains('hidden')) {
        if (!window.sistemaPublicaciones) {
            window.sistemaPublicaciones = new SistemaPublicaciones();
        } else if (typeof window.sistemaPublicaciones.cargarDesdeBackend === 'function') {
            window.sistemaPublicaciones.cargarDesdeBackend();
        }
    }
});



//ALUMNOS
async function cargarAlumnos() {
    const token = getAccessToken();
    const endpoint = (typeof PROFESSOR_ENDPOINTS !== 'undefined' && PROFESSOR_ENDPOINTS.MY_STUDENTS)
        ? PROFESSOR_ENDPOINTS.MY_STUDENTS
        : 'http://localhost:5000/api/profesor/alumnos';

    if (!token) {
        console.error('Sesión expirada');
        return;
    }

    const res = await fetch(endpoint, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        console.error('Error al cargar alumnos');
        return;
    }

    const alumnos = await res.json();
    const tbody = document.getElementById('tbodyAlumnos');

    if (!tbody) {
        console.error('No se encontró tbodyAlumnos');
        return;
    }

    tbody.innerHTML = '';

    (Array.isArray(alumnos) ? alumnos : []).forEach(a => {
        const tr = document.createElement('tr');
        const tituloProyecto = (a && (a.tituloProyecto || a.publicacion)) ? String(a.tituloProyecto || a.publicacion) : '-';
        tr.innerHTML = `
            <td>${a.numero}</td>
            <td>${a.boleta}</td>
            <td>${a.nombreCompleto}</td>
            <td>${a.correo}</td>
            <td>${tituloProyecto}</td>
            <td class="${a.estado === 'Activo' ? 'activo' : 'finalizado'}">
                ${a.estado}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

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

/**
 * Cargar notificaciones (mensajes recibidos de estudiantes)
 */
async function cargarNotificaciones() {
    const listaNotificaciones = document.getElementById('listaNotificaciones');
    if (!listaNotificaciones) return;

    listaNotificaciones.innerHTML = '<div class="loading-message">Cargando notificaciones...</div>';

    try {
        // Obtener solo mensajes de estudiantes
        const data = await fetchAPI('/mensajes/recibidos?limit=50');
        const mensajes = data.mensajes || [];
        
        // Filtrar solo mensajes de estudiantes
        const mensajesEstudiantes = mensajes.filter(m => m.remitente.tipo === 'Alumno');

        if (mensajesEstudiantes.length === 0) {
            listaNotificaciones.innerHTML = '<div class="loading-message">No hay notificaciones</div>';
            return;
        }

        listaNotificaciones.innerHTML = '';
        mensajesEstudiantes.forEach(mensaje => {
            listaNotificaciones.appendChild(crearCardNotificacion(mensaje));
        });
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        listaNotificaciones.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar las notificaciones</div>';
    }
}

/**
 * Crear tarjeta de notificación (mensaje)
 * @param {object} mensaje - Datos del mensaje
 * @returns {HTMLElement} - Elemento HTML de la tarjeta
 */
function crearCardNotificacion(mensaje) {
    const card = document.createElement('div');
    card.className = `notificaciones-card ${mensaje.leido ? 'leido' : 'no-leido'}`;
    card.dataset.mensajeId = mensaje._id;

    card.innerHTML = `
        <div class="notificacion-header">
            <strong>${mensaje.remitente.nombre}</strong>
            <span class="notificacion-fecha">${new Date(mensaje.createdAt).toLocaleDateString('es-ES')}</span>
        </div>
        <div class="notificacion-asunto">${mensaje.asunto}</div>
        <div class="notificacion-preview">${mensaje.contenido.substring(0, 100)}${mensaje.contenido.length > 100 ? '...' : ''}</div>
        ${mensaje.relacionadoCon?.tipo ? 
            `<div class="notificacion-relacionado">Relacionado con: ${mensaje.relacionadoCon.tipo}</div>` : ''}
        ${!mensaje.leido ? '<span class="notificacion-nueva">Nuevo</span>' : ''}
    `;

    card.addEventListener('click', () => mostrarDetalleNotificacion(mensaje._id));

    return card;
}

/**
 * Mostrar detalle de una notificación (mensaje)
 * @param {string} mensajeId - ID del mensaje
 */
async function mostrarDetalleNotificacion(mensajeId) {
    try {
        const mensaje = await fetchAPI(`/mensajes/${mensajeId}`);
        const modal = document.getElementById('modalNotificacion');
        const contenido = document.getElementById('modalNotificacionContenido');
        const titulo = document.getElementById('modalNotificacionTitulo');

        if (!modal || !contenido) return;

        titulo.textContent = mensaje.asunto;
        contenido.innerHTML = `
            <div class="mensaje-detalle-info">
                <p><strong>De:</strong> ${mensaje.remitente.nombre} (${mensaje.remitente.tipo})</p>
                <p><strong>Fecha:</strong> ${new Date(mensaje.createdAt).toLocaleString('es-ES')}</p>
                ${mensaje.relacionadoCon?.tipo ? 
                    `<p><strong>Relacionado con:</strong> ${mensaje.relacionadoCon.tipo}</p>` : ''}
            </div>
            <div class="mensaje-detalle-contenido">
                <p>${mensaje.contenido}</p>
            </div>
        `;

        // Guardar datos del mensaje para responder
        modal.dataset.mensajeId = mensaje._id;
        modal.dataset.remitenteId = mensaje.remitente.id;
        modal.dataset.remitenteTipo = mensaje.remitente.tipo;

        modal.classList.remove('hidden');

        // Configurar botón responder
        const btnResponder = document.getElementById('btnResponderMensaje');
        if (btnResponder) {
            btnResponder.onclick = () => {
                modal.classList.add('hidden');
                abrirModalNuevoMensajeProf(mensaje.remitente.id, mensaje.remitente.tipo);
            };
        }

        // Recargar notificaciones para actualizar estado de leído
        cargarNotificaciones();
    } catch (error) {
        console.error('Error al cargar notificación:', error);
        showError('Error al cargar la notificación');
    }
}

/**
 * Cargar estudiantes postulados para el select de nuevo mensaje
 */
async function cargarEstudiantesPostulados() {
    try {
        const data = await fetchAPI('/mensajes/estudiantes-postulados');
        const select = document.getElementById('destinatarioEstudiante');

        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar estudiante...</option>';

        if (data.estudiantes && data.estudiantes.length > 0) {
            data.estudiantes.forEach(estudiante => {
                const option = document.createElement('option');
                option.value = estudiante.id;
                option.textContent = `${estudiante.nombre} (${estudiante.boleta}) - ${estudiante.carrera}`;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">No hay estudiantes postulados</option>';
        }
    } catch (error) {
        console.error('Error cargando estudiantes postulados:', error);
        showError('Error al cargar estudiantes postulados');
    }
}

/**
 * Abrir modal para crear nuevo mensaje a estudiante
 * @param {string} estudianteId - ID del estudiante (opcional, para prellenar)
 * @param {string} estudianteTipo - Tipo del estudiante (opcional)
 */
async function abrirModalNuevoMensajeProf(estudianteId = null, estudianteTipo = null) {
    const modal = document.getElementById('modalNuevoMensajeProf');
    const form = document.getElementById('formNuevoMensajeProf');
    const selectEstudiante = document.getElementById('destinatarioEstudiante');

    if (!modal || !form) return;

    form.reset();
    await cargarEstudiantesPostulados();

    // Si se proporciona un estudiante, seleccionarlo
    if (estudianteId && selectEstudiante) {
        selectEstudiante.value = estudianteId;
    }

    modal.classList.remove('hidden');

    const cerrarBtn = document.getElementById('cerrarModalMensajeProf');
    const cancelarBtn = document.getElementById('cancelarMensajeProfBtn');

    const cerrarModal = () => {
        modal.classList.add('hidden');
    };

    if (cerrarBtn) cerrarBtn.onclick = cerrarModal;
    if (cancelarBtn) cancelarBtn.onclick = cerrarModal;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const destinatarioId = selectEstudiante.value;
        const asunto = document.getElementById('mensajeAsuntoProf').value;
        const contenido = document.getElementById('mensajeContenidoProf').value;

        if (!destinatarioId) {
            showError('Debes seleccionar un estudiante');
            return;
        }

        try {
            await fetchAPI('/mensajes', {
                method: 'POST',
                body: JSON.stringify({
                    destinatarioId,
                    destinatarioTipo: 'Alumno',
                    asunto,
                    contenido
                })
            });

            showSuccess('Mensaje enviado correctamente');
            cerrarModal();
            cargarNotificaciones();
        } catch (error) {
            showError(error.message || 'Error al enviar el mensaje');
        }
    };
}

// Configurar eventos cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar notificaciones cuando se muestra la sección
    const notificacionesSection = document.getElementById('notificaciones-section');
    if (notificacionesSection) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!notificacionesSection.classList.contains('hidden')) {
                        cargarNotificaciones();
                    }
                }
            });
        });
        observer.observe(notificacionesSection, { attributes: true });
    }

    // Botón nuevo mensaje
    const nuevoMensajeProfBtn = document.getElementById('nuevoMensajeProfBtn');
    if (nuevoMensajeProfBtn) {
        nuevoMensajeProfBtn.addEventListener('click', () => abrirModalNuevoMensajeProf());
    }

    // Botón cerrar mensaje
    const btnCerrarMensaje = document.getElementById('btnCerrarMensaje');
    if (btnCerrarMensaje) {
        btnCerrarMensaje.addEventListener('click', () => {
            document.getElementById('modalNotificacion').classList.add('hidden');
        });
    }
});