let list = document.querySelectorAll('.navigation li');

// Preferir claves centralizadas (definidas en js/config.js)
const INSTITUCION_PROFILE_KEY = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.PROFESOR_PROFILE)
    ? STORAGE_KEYS.PROFESOR_PROFILE
    : 'perfilData';

const INSTITUCION_PUBLICACIONES_KEY = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.PROFESOR_PUBLICACIONES)
    ? STORAGE_KEYS.PROFESOR_PUBLICACIONES
    : 'publicaciones';

function activeLink() {
    list.forEach((item) => item.classList.remove('hovered'));
    this.classList.add('hovered');
}

list.forEach((item) => item.addEventListener('mouseover', activeLink));

let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

toggle.onclick = function () {
    navigation.classList.toggle('active');
    main.classList.toggle('active');
};

function getAccessToken() {
    try {
        if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.ACCESS_TOKEN) {
            return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        }
    } catch { /* noop */ }
    return localStorage.getItem('accessToken');
}

function setAccessToken(token) {
    try {
        if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.ACCESS_TOKEN) {
            if (!token) localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            else localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
            return;
        }
    } catch { /* noop */ }
    if (!token) localStorage.removeItem('accessToken');
    else localStorage.setItem('accessToken', token);
}

function getRefreshToken() {
    try {
        if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.REFRESH_TOKEN) {
            return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        }
    } catch { /* noop */ }
    return localStorage.getItem('refreshToken');
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

async function refreshAuthToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    if (typeof AUTH_ENDPOINTS === 'undefined' || !AUTH_ENDPOINTS.REFRESH_TOKEN) return null;

    const res = await fetch(AUTH_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
    });

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || !data.accessToken) return null;
    setAccessToken(data.accessToken);
    return data.accessToken;
}

async function fetchJsonWithAuth(url, options) {
    const token = getAccessToken();
    const headers = { ...(options && options.headers ? options.headers : {}) };
    if (!headers['Content-Type'] && options && options.body != null) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const doFetch = async (overrideToken) => {
        const h = { ...headers };
        if (overrideToken) h['Authorization'] = `Bearer ${overrideToken}`;
        const res = await fetch(url, { ...(options || {}), headers: h });
        const data = await res.json().catch(() => null);
        return { res, data };
    };

    let out = await doFetch();
    if (out.res.status !== 401) return out;

    const newToken = await refreshAuthToken();
    if (!newToken) return out;
    out = await doFetch(newToken);
    return out;
}

async function fetchMe() {
    const token = getAccessToken();
    if (!token) return null;
    if (typeof AUTH_ENDPOINTS === 'undefined' || !AUTH_ENDPOINTS.GET_USER) return null;
    const { res, data } = await fetchJsonWithAuth(AUTH_ENDPOINTS.GET_USER, { method: 'GET' });
    if (!res.ok) return null;
    return data;
}

async function changePassword(currentPassword, newPassword) {
    const token = getAccessToken();
    if (!token) throw new Error('Sesión expirada');
    if (typeof AUTH_ENDPOINTS === 'undefined' || !AUTH_ENDPOINTS.CHANGE_PASSWORD) {
        throw new Error('Falta configuración: AUTH_ENDPOINTS.CHANGE_PASSWORD');
    }

    const { res, data } = await fetchJsonWithAuth(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
        const msg = data && data.message ? data.message : 'No se pudo cambiar la contraseña';
        throw new Error(msg);
    }
    return data;
}

function mapApiInstitucionToPerfilData(apiUser) {
    if (!apiUser) return {};
    return {
        nombre: apiUser.nombre || '',
        nombreRepresentante: apiUser.nombreRepresentante || '',
        apellidosRepresentante: apiUser.apellidosRepresentante || '',
        email: apiUser.correo || '',
        phone: apiUser.telefono != null ? String(apiUser.telefono) : '',
        direccion: apiUser.direccion || '',
        tipo: apiUser.tipo || '',
        rfc: apiUser.rfc || '',
        avatar: null,
    };
}

async function updateInstitucionPerfil(payload) {
    const token = getAccessToken();
    if (!token) throw new Error('Sesión expirada');
    if (typeof INSTITUCION_ENDPOINTS === 'undefined' || !INSTITUCION_ENDPOINTS.UPDATE_PROFILE) {
        throw new Error('Falta configuración: INSTITUCION_ENDPOINTS.UPDATE_PROFILE');
    }

    const { res, data } = await fetchJsonWithAuth(INSTITUCION_ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const msg = data && data.message ? data.message : 'No se pudo actualizar el perfil';
        throw new Error(msg);
    }
    return data;
}

// ============================================
// CAMBIAR SECCIONES
// ============================================
function showSectionByClass(sectionClass) {
    // Oculta solo las secciones principales del dashboard (evita ocultar secciones internas como #perfilReadOnly)
    document.querySelectorAll('.main > section').forEach((sec) => sec.classList.add('hidden'));
    const sectionToShow = document.querySelector(`.main > section.${sectionClass}`);
    if (sectionToShow) sectionToShow.classList.remove('hidden');
    document.querySelectorAll('.modal').forEach((modal) => modal.classList.add('hidden'));
}

document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', async (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        const sectionClass = item.getAttribute('data-section');
        showSectionByClass(sectionClass);

        if (sectionClass === 'alumnos-section') {
            await cargarAlumnosDesdeBackend();
        }
        if (sectionClass === 'publicaciones-section') {
            if (window.sistemaPublicaciones) {
                await window.sistemaPublicaciones.cargarDesdeBackend();
            }
        }

        if (sectionClass === 'mensajes-section') {
            if (mensajeActualEmp === 'recibidos') {
                await cargarMensajesRecibidosEmp();
            } else {
                await cargarMensajesEnviadosEmp();
            }
        }
    });
});

// ============================================
// MI PERFIL
// ============================================
function safeSetText(el, value) {
    if (!el) return;
    el.textContent = value != null && String(value).trim() !== '' ? String(value) : '-';
}

function loadPerfilFromStorage() {
    try {
        const raw = JSON.parse(localStorage.getItem(INSTITUCION_PROFILE_KEY));
        return raw && typeof raw === 'object' ? raw : {};
    } catch {
        return {};
    }
}

function savePerfilToStorage(perfilData) {
    localStorage.setItem(INSTITUCION_PROFILE_KEY, JSON.stringify(perfilData || {}));
}

function renderPerfil(perfilData) {
    const perfilAvatar = document.getElementById('perfilAvatar');
    const nombreInput = document.getElementById('nombreInput');
    const apellidosInput = document.getElementById('apellidosInput');
    const nEmpresaInput = document.getElementById('nEmpresaInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const dirInput = document.getElementById('dirInput');
    const tipoInput = document.getElementById('tipoInput');
    const rfcInput = document.getElementById('rfcInput');
    const displayName = document.getElementById('displayName');

    if (perfilAvatar && perfilData.avatar) perfilAvatar.src = perfilData.avatar;

    if (nombreInput) nombreInput.value = perfilData.nombreRepresentante || '';
    if (apellidosInput) apellidosInput.value = perfilData.apellidosRepresentante || '';
    if (nEmpresaInput) nEmpresaInput.value = perfilData.nombre || '';
    if (emailInput) emailInput.value = perfilData.email || '';
    if (phoneInput) phoneInput.value = perfilData.phone || '';
    if (dirInput) dirInput.value = perfilData.direccion || '';
    if (tipoInput) tipoInput.value = perfilData.tipo || '';
    if (rfcInput) rfcInput.value = perfilData.rfc || '';

    // Sección de lectura (coherente con institución)
    safeSetText(document.getElementById('ro_institucion_nombre'), perfilData.nombre);
    safeSetText(document.getElementById('ro_representante_nombre'), perfilData.nombreRepresentante);
    safeSetText(document.getElementById('ro_representante_apellidos'), perfilData.apellidosRepresentante);
    safeSetText(document.getElementById('ro_email'), perfilData.email);
    safeSetText(document.getElementById('ro_phone'), perfilData.phone);
    safeSetText(document.getElementById('ro_direccion'), perfilData.direccion);
    safeSetText(document.getElementById('ro_tipo'), perfilData.tipo);
    safeSetText(document.getElementById('ro_rfc'), perfilData.rfc);

    if (displayName) {
        const full = `${perfilData.nombre || ''}`.trim();
        displayName.textContent = full || 'Institución';
    }
}

async function initPerfil() {
    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const perfilForm = document.getElementById('perfilForm');
    const perfilReadOnly = document.getElementById('perfilReadOnly');
    const avatarInput = document.getElementById('avatarInput');
    const perfilAvatar = document.getElementById('perfilAvatar');
    const passInput = document.getElementById('passInput');
    const currentPassInput = document.getElementById('currentPassInput');

    const perfilData = loadPerfilFromStorage();
    renderPerfil(perfilData);

    // Refrescar desde backend
    const me = await fetchMe();
    if (me && me.user) {
        const merged = { ...perfilData, ...mapApiInstitucionToPerfilData(me.user) };
        savePerfilToStorage(merged);
        renderPerfil(merged);
    }

    // Contraseñas (UI igual que estudiante/profesor): campos visibles,
    // pero solo se exige contraseña actual si se cambia la contraseña.

    if (avatarInput && perfilAvatar) {
        avatarInput.addEventListener('change', (e) => {
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

    if (editBtn && perfilForm && perfilReadOnly) {
        editBtn.addEventListener('click', () => {
            perfilForm.classList.remove('hidden');
            perfilReadOnly.classList.add('hidden');
        });
    }

    if (cancelBtn && perfilForm && perfilReadOnly) {
        cancelBtn.addEventListener('click', () => {
            perfilForm.classList.add('hidden');
            perfilReadOnly.classList.remove('hidden');
            const current = loadPerfilFromStorage();
            renderPerfil(current);
            if (perfilAvatar) delete perfilAvatar.dataset.tmp;
            if (passInput) passInput.value = '';
            if (currentPassInput) currentPassInput.value = '';
        });
    }

    if (perfilForm) {
        perfilForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombreRepresentante = (document.getElementById('nombreInput')?.value || '').trim();
            const apellidosRepresentante = (document.getElementById('apellidosInput')?.value || '').trim();
            const nombre = (document.getElementById('nEmpresaInput')?.value || '').trim();
            const correo = (document.getElementById('emailInput')?.value || '').trim();
            const telefono = (document.getElementById('phoneInput')?.value || '').trim();
            const direccion = (document.getElementById('dirInput')?.value || '').trim();
            const tipo = (document.getElementById('tipoInput')?.value || '').trim();
            const rfc = (document.getElementById('rfcInput')?.value || '').trim();
            const password = (document.getElementById('passInput')?.value || '').trim();
            const currentPassword = (document.getElementById('currentPassInput')?.value || '').trim();

            if (!nombreRepresentante || !apellidosRepresentante || !correo) {
                alert('Completa nombre del representante, apellidos y correo');
                return;
            }

            const payload = {
                nombre,
                nombreRepresentante,
                apellidosRepresentante,
                correo,
                telefono: telefono ? Number(String(telefono).replace(/\D/g, '')) : undefined,
                direccion,
                tipo,
                rfc,
            };

            try {
                // 1) Cambio de contraseña (igual que estudiante/profesor):
                // si uno de los campos viene lleno, se exigen ambos.
                if (password || currentPassword) {
                    if (!currentPassword || !password) {
                        alert('Para cambiar la contraseña, completa contraseña actual y nueva contraseña');
                        return;
                    }
                    await changePassword(currentPassword, password);
                }
                const result = await updateInstitucionPerfil(payload);
                const current = loadPerfilFromStorage();
                const updatedFromApi = result && result.data ? mapApiInstitucionToPerfilData(result.data) : {};
                const merged = {
                    ...current,
                    ...updatedFromApi,
                    avatar: (document.getElementById('perfilAvatar')?.dataset.tmp || current.avatar || null),
                };
                savePerfilToStorage(merged);
                renderPerfil(merged);

                // limpiar password + tmp avatar
                if (document.getElementById('perfilAvatar')) delete document.getElementById('perfilAvatar').dataset.tmp;
                if (passInput) passInput.value = '';
                if (currentPassInput) currentPassInput.value = '';

                if (perfilForm && perfilReadOnly) {
                    perfilForm.classList.add('hidden');
                    perfilReadOnly.classList.remove('hidden');
                }
                alert('Perfil actualizado correctamente');
            } catch (err) {
                alert(err && err.message ? err.message : 'No se pudo actualizar el perfil');
            }
        });
    }
}

// ============================================
// ALUMNOS
// ============================================
function renderAlumnos(alumnos) {
    const tbody = document.getElementById('tbodyAlumnos');
    if (!tbody) return;

    const rows = Array.isArray(alumnos) ? alumnos : [];
    const enc = (v) => encodeURIComponent(String(v == null ? '' : v));

    tbody.innerHTML = rows.length
        ? rows.map((a, idx) => {
            const numero = a && a.numero != null ? String(a.numero) : String(idx + 1);
            const boleta = a && a.boleta != null ? String(a.boleta) : '-';
            const nombre = a && a.nombreCompleto ? String(a.nombreCompleto) : '-';
            const correo = a && a.correo ? String(a.correo) : '-';
            const proyecto = a && (a.tituloProyecto || a.publicacion) ? String(a.tituloProyecto || a.publicacion) : '-';
            const estado = a && a.estado ? String(a.estado) : '-';
            const estadoClass = String(estado).toLowerCase() === 'activo' ? 'activo' : 'finalizado';

            const postulacionId = a && a.postulacionId ? String(a.postulacionId) : '';
            const destinatarioLabel = `${nombre} (Alumno)`;

            const disabledAttr = postulacionId ? '' : 'disabled';
            const btnLabel = postulacionId ? 'Enviar Mensaje' : 'Sin postulación';

            return `
                <tr>
                    <td>${numero}</td>
                    <td>${boleta}</td>
                    <td>${nombre}</td>
                    <td>${correo}</td>
                    <td>${proyecto}</td>
                    <td class="${estadoClass}">${estado}</td>
                    <td>
                        <button class="btn btn-small btn-primary btn-enviar-mensaje-emp" ${disabledAttr}
                            data-postulacion-id="${enc(postulacionId)}"
                            data-destinatario-label="${enc(destinatarioLabel)}"
                            data-proyecto-titulo="${enc(proyecto)}">
                            ${btnLabel}
                        </button>
                    </td>
                </tr>
            `;
        }).join('')
        : '<tr><td colspan="7">No hay alumnos asociados</td></tr>';
}

// Delegación de eventos para botones de mensaje en la tabla de alumnos
(function initAlumnosMensajeButtons() {
    const tbody = document.getElementById('tbodyAlumnos');
    if (!tbody) return;

    tbody.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('.btn-enviar-mensaje-emp') : null;
        if (!btn) return;
        if (btn.disabled) return;

        const postulacionId = decodeURIComponent(btn.dataset.postulacionId || '');
        const destinatarioLabel = decodeURIComponent(btn.dataset.destinatarioLabel || '');
        const proyectoTitulo = decodeURIComponent(btn.dataset.proyectoTitulo || '');
        enviarMensajeDesdePostulacionEmp(postulacionId, destinatarioLabel, proyectoTitulo);
    });
})();

async function cargarAlumnosDesdeBackend() {
    if (typeof INSTITUCION_ENDPOINTS === 'undefined' || !INSTITUCION_ENDPOINTS.MY_STUDENTS) return;
    const token = getAccessToken();
    if (!token) return;

    const { res, data } = await fetchJsonWithAuth(INSTITUCION_ENDPOINTS.MY_STUDENTS, { method: 'GET' });
    if (!res.ok) return;
    renderAlumnos(Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []));
}

// ============================================
// SISTEMA DE PUBLICACIONES (VACANTES)
// ============================================
class SistemaPublicaciones {
    constructor() {
        this.publicaciones = [];
        this.edicionId = null;
        this.currentVacanteId = null;

        this.cargarElementos();
        this.agregarEventListeners();
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

        // Modal postulantes
        this.modalPostulantes = document.getElementById('modalPostulantes');
        this.postulantesVacante = document.getElementById('postulantesVacante');
        this.postulantesTotal = document.getElementById('postulantesTotal');
        this.tbodyPostulantes = document.getElementById('tbodyPostulantes');
        this.cerrarModalPostulantesBtn = this.modalPostulantes ? this.modalPostulantes.querySelector('.close') : null;
    }

    getPerfilData() {
        try {
            return JSON.parse(localStorage.getItem(INSTITUCION_PROFILE_KEY)) || {};
        } catch {
            return {};
        }
    }

    buildUrl(template, params) {
        let url = String(template || '');
        Object.keys(params || {}).forEach((k) => {
            url = url.replace(`:${k}`, encodeURIComponent(String(params[k])));
        });
        return url;
    }

    async fetchJson(url, options) {
        return fetchJsonWithAuth(url, options);
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
        return (beneficiosValues || []).map((v) => map[String(v)] || String(v)).filter(Boolean);
    }

    mapBeneficiosToCheckboxValues(beneficiosAlumno) {
        const reverse = {
            'Certificación al término': 'certificacion',
            'Carta de recomendación': 'cartarecomendacion',
            'Experiencia laboral comprobable': 'experiencialaboral',
        };
        return (beneficiosAlumno || []).map((b) => reverse[String(b)] || null).filter(Boolean);
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
            fechaCreacion: vacante && (vacante.fechaPublicacion || vacante.createdAt)
                ? new Date(vacante.fechaPublicacion || vacante.createdAt).toISOString()
                : new Date().toISOString(),
            postulantesCount,
        };
    }

    mergeLocalState(publicacionesFromApi) {
        const localArr = (() => {
            try {
                const raw = JSON.parse(localStorage.getItem(INSTITUCION_PUBLICACIONES_KEY));
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
        if (typeof INSTITUCION_ENDPOINTS === 'undefined' || !INSTITUCION_ENDPOINTS.MY_VACANCIES) return;
        const token = getAccessToken();
        if (!token) return;

        if (this.listaPublicaciones) {
            this.listaPublicaciones.innerHTML = '<div class="no-publicaciones"><p>Cargando publicaciones...</p></div>';
        }

        const { res, data } = await this.fetchJson(INSTITUCION_ENDPOINTS.MY_VACANCIES, { method: 'GET' });
        if (!res.ok) return;
        const vacantes = data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        const publicacionesFromApi = vacantes.map((v) => this.mapVacanteToPublicacion(v));
        this.publicaciones = this.mergeLocalState(publicacionesFromApi);
        localStorage.setItem(INSTITUCION_PUBLICACIONES_KEY, JSON.stringify(this.publicaciones));
        this.mostrarPublicaciones();
    }

    agregarEventListeners() {
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
        if (this.formPublicacion) {
            this.formPublicacion.addEventListener('submit', (e) => this.guardarPublicacion(e));
        }
        if (this.listaPublicaciones) {
            this.listaPublicaciones.addEventListener('click', (e) => this.manejarAcciones(e));
        }

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
        if (!this.modalPublicacion) return;
        this.modalTitulo.textContent = 'Crear Nueva Publicación';
        this.formPublicacion.reset();
        this.edicionId = null;
        this.modalPublicacion.classList.remove('hidden');
        this.configurarFechas();

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
        const publicacion = this.publicaciones.find((p) => String(p.id) === String(id));
        if (!publicacion) return;
        this.modalTitulo.textContent = 'Editar Publicación';
        this.edicionId = id;

        this.tituloPub.value = publicacion.titulo || '';
        if (this.areaPub) {
            const areaTexto = String(publicacion.area || '').trim();
            const opt = Array.from(this.areaPub.options).find((o) => String(o.text || '').trim() === areaTexto);
            this.areaPub.value = opt ? opt.value : '';
        }
        this.vacantesPub.value = publicacion.vacantes || 1;
        this.objetivosPub.value = publicacion.objetivos || '';
        this.actividadesPub.value = publicacion.actividades || '';
        if (this.requerimientosPub) this.requerimientosPub.value = publicacion.requerimientos || '';

        if (this.carrerasPub) {
            const carreraReq = String(publicacion.carreraRequerida || '');
            Array.from(this.carrerasPub.options).forEach((option) => {
                option.selected = carreraReq.includes(option.text);
            });
        }

        this.conocimientosPub.value = publicacion.conocimientos || '';
        this.habilidadesPub.value = publicacion.habilidades || '';
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
        if (!this.modalPublicacion) return;
        this.modalPublicacion.classList.add('hidden');
        this.edicionId = null;
    }

    async guardarPublicacion(e) {
        e.preventDefault();

        const beneficiosRaw = [];
        document.querySelectorAll('input[name="beneficios"]:checked').forEach((checkbox) => beneficiosRaw.push(checkbox.value));
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

        const nuevaVacantes = parseInt(this.vacantesPub.value, 10);

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
            horasSemanal: parseInt(this.horasPub.value, 10),
            fechaInicio: this.fechaInicioPub.value,
            fechaLimite: this.fechaLimitePub.value,
            duracionMeses: parseInt(this.duracionPub.value, 10),
            beneficiosAlumno: beneficios,
            otrosBeneficios: this.otrosBeneficiosPub.value,
            informacionAdicional: this.infoAdicionalPub.value,
            correoConsulta: perfil.email,
            telefonoConsulta: this.normalizePhoneDigits(perfil.phone),
        };

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

            await this.cargarDesdeBackend();
            this.cerrarModal();
            alert(this.edicionId ? 'Publicación actualizada exitosamente' : 'Publicación creada exitosamente');
        } catch (err) {
            alert(err && err.message ? err.message : 'No se pudo guardar la publicación');
        }
    }

    mostrarPublicaciones() {
        if (!this.listaPublicaciones) return;
        const publicacionesFiltradas = [...this.publicaciones];
        publicacionesFiltradas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        this.listaPublicaciones.innerHTML = publicacionesFiltradas.length > 0
            ? publicacionesFiltradas.map((p) => this.generarHTMLPublicacion(p)).join('')
            : '<div class="no-publicaciones"><p>No hay publicaciones disponibles</p></div>';
    }

    generarHTMLPublicacion(publicacion) {
        const fechaCreacion = new Date(publicacion.fechaCreacion).toLocaleDateString('es-MX');
        const postulantesCount = Number(publicacion && (publicacion.postulantesCount ?? 0)) || 0;

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

    async manejarAcciones(e) {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (!id) return;
        const publicacion = this.publicaciones.find((p) => String(p.id) === String(id));
        if (!publicacion) return;

        if (target.classList.contains('editar-publicacion')) {
            this.abrirModalEditar(id);
        } else if (target.classList.contains('eliminar-publicacion')) {
            if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;
            await this.eliminarPublicacion(id);
        } else if (target.classList.contains('toggle-estado')) {
            this.cambiarEstadoPublicacion(id);
        } else if (target.classList.contains('ver-postulantes')) {
            await this.abrirModalPostulantes(id, publicacion.titulo);
        }
    }

    async eliminarPublicacion(id) {
        const token = getAccessToken();
        if (!token) return;
        if (typeof VACANCY_ENDPOINTS === 'undefined' || !VACANCY_ENDPOINTS.DELETE_VACANCY) {
            alert('Falta configuración: VACANCY_ENDPOINTS.DELETE_VACANCY');
            return;
        }

        const url = this.buildUrl(VACANCY_ENDPOINTS.DELETE_VACANCY, { id });
        const { res, data } = await this.fetchJson(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
            alert((data && data.message) ? data.message : 'No se pudo eliminar');
            return;
        }
        await this.cargarDesdeBackend();
        alert('Publicación eliminada');
    }

    cambiarEstadoPublicacion(id) {
        const index = this.publicaciones.findIndex((p) => String(p.id) === String(id));
        if (index === -1) return;
        this.publicaciones[index].estado = this.publicaciones[index].estado === 'activa' ? 'cerrada' : 'activa';
        localStorage.setItem(INSTITUCION_PUBLICACIONES_KEY, JSON.stringify(this.publicaciones));
        this.mostrarPublicaciones();
    }

    cerrarModalPostulantes() {
        if (!this.modalPostulantes) return;
        this.modalPostulantes.classList.add('hidden');
        this.currentVacanteId = null;
        if (this.tbodyPostulantes) this.tbodyPostulantes.innerHTML = '';
    }

    async abrirModalPostulantes(vacanteId, titulo) {
        if (!this.modalPostulantes) return;
        if (typeof INSTITUCION_ENDPOINTS === 'undefined' || !INSTITUCION_ENDPOINTS.VACANCY_APPLICANTS) return;

        this.currentVacanteId = vacanteId;
        if (this.postulantesVacante) this.postulantesVacante.textContent = titulo || '-';
        if (this.postulantesTotal) this.postulantesTotal.textContent = '0';
        if (this.tbodyPostulantes) this.tbodyPostulantes.innerHTML = '<tr><td colspan="10">Cargando...</td></tr>';
        this.modalPostulantes.classList.remove('hidden');

        const url = this.buildUrl(INSTITUCION_ENDPOINTS.VACANCY_APPLICANTS, { vacanteId });
        const { res, data } = await this.fetchJson(url, { method: 'GET' });
        if (!res.ok) {
            if (this.tbodyPostulantes) this.tbodyPostulantes.innerHTML = '<tr><td colspan="10">No se pudieron cargar los postulantes</td></tr>';
            return;
        }

        const postulaciones = data && data.data && Array.isArray(data.data.postulaciones)
            ? data.data.postulaciones
            : [];
        if (this.postulantesTotal) this.postulantesTotal.textContent = String(postulaciones.length);
        this.renderPostulantes(postulaciones);
    }

    async responderPostulacion(vacanteId, postulacionId, accion) {
        if (!vacanteId || !postulacionId) return;
        const template = accion === 'aceptar'
            ? INSTITUCION_ENDPOINTS.ACCEPT_APPLICATION
            : INSTITUCION_ENDPOINTS.REJECT_APPLICATION;
        const url = this.buildUrl(template, { vacanteId, postulacionId });
        const { res, data } = await this.fetchJson(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        if (!res.ok) {
            alert((data && data.message) ? data.message : 'No se pudo responder la postulación');
            return;
        }
        // refrescar postulantes y publicaciones
        await this.abrirModalPostulantes(vacanteId, this.postulantesVacante ? this.postulantesVacante.textContent : '');
        await this.cargarDesdeBackend();
    }

    renderPostulantes(postulaciones) {
        if (!this.tbodyPostulantes) return;
        this.tbodyPostulantes.innerHTML = '';

        if (!postulaciones.length) {
            this.tbodyPostulantes.innerHTML = '<tr><td colspan="10">Sin postulantes</td></tr>';
            return;
        }

        postulaciones.forEach((p, index) => {
            const alumno = p && p.alumno ? p.alumno : null;
            const nombre = alumno
                ? `${alumno.nombres || ''} ${alumno.apellidoPaterno || ''} ${alumno.apellidoMaterno || ''}`.replace(/\s+/g, ' ').trim()
                : '-';
            const correo = alumno && alumno.correo ? alumno.correo : '-';
            const boleta = alumno && alumno.boleta != null ? alumno.boleta : '-';
            const carrera = alumno && alumno.carrera ? alumno.carrera : '-';
            const creditos = alumno && alumno.creditos != null ? alumno.creditos : '-';
            const cvID = alumno && alumno.cvID ? alumno.cvID : null;
            const estado = p && p.estado ? p.estado : '-';

            const tr = document.createElement('tr');
            const c1 = document.createElement('td');
            const c2 = document.createElement('td');
            const c3 = document.createElement('td');
            const c4 = document.createElement('td');
            const c5 = document.createElement('td');
            const c6 = document.createElement('td');
            const c7cv = document.createElement('td');
            const c7 = document.createElement('td');
            const c8 = document.createElement('td');
            const c9msg = document.createElement('td');

            c1.textContent = String(index + 1);
            c2.textContent = nombre;
            c3.textContent = correo;
            c4.textContent = String(boleta);
            c5.textContent = String(carrera);
            c6.textContent = String(creditos);

            if (cvID) {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = 'Ver CV';
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('El CV se gestiona desde el panel de alumno/Drive.');
                });
                c7cv.appendChild(a);
            } else {
                c7cv.textContent = '-';
            }

            c7.textContent = estado;

            const accionBtn = document.createElement('button');
            accionBtn.type = 'button';
            console.log(estado);

            if (estado === 'Aceptada') {
                accionBtn.className = 'btn btn-small rechazar';
                accionBtn.textContent = 'Rechazar';
                accionBtn.onclick = () => {
                    if (!this.currentVacanteId) return;
                    if (!confirm('Rechazar esta postulación?')) return;
                    this.responderPostulacion(this.currentVacanteId, p._id, 'rechazar');
                }
                // const aceptarBtn = document.createElement('button');
                // aceptarBtn.className = 'btn btn-small aceptar';
                // aceptarBtn.textContent = 'Aceptar';
                // aceptarBtn.addEventListener('click', () => {
                //     if (!this.currentVacanteId) return;
                //     if (!confirm('¿Aceptar esta postulación?')) return;
                //     this.responderPostulacion(this.currentVacanteId, p._id, 'aceptar');
                // });

                // const rechazarBtn = document.createElement('button');
                // rechazarBtn.className = 'btn btn-small rechazar';
                // rechazarBtn.textContent = 'Rechazar';
                // rechazarBtn.addEventListener('click', () => {
                //     if (!this.currentVacanteId) return;
                //     if (!confirm('¿Rechazar esta postulación?')) return;
                //     this.responderPostulacion(this.currentVacanteId, p._id, 'rechazar');
                // });

                // c8.appendChild(aceptarBtn);
                // c8.appendChild(rechazarBtn);
            } else {
                // c8.textContent = '-';
                accionBtn.className = 'btn btn-small aceptar';
                accionBtn.textContent = 'Aceptar';
                accionBtn.onclick = () => {
                    if (!this.currentVacanteId) return;
                    if (!confirm('¿Aceptar esta postulación?')) return;
                    this.responderPostulacion(this.currentVacanteId, p._id, 'aceptar');
                }
            }

            c8.appendChild(accionBtn);

            tr.appendChild(c1);
            tr.appendChild(c2);
            tr.appendChild(c3);
            tr.appendChild(c4);
            tr.appendChild(c5);
            tr.appendChild(c6);
            tr.appendChild(c7cv);
            tr.appendChild(c7);
            tr.appendChild(c8);
            // Mensaje (siempre disponible: backend valida por rol y relación)
            const proyectoTitulo = this.postulantesVacante ? String(this.postulantesVacante.textContent || '-') : '-';
            const postulacionId = p && p._id ? String(p._id) : '';
            const destinatarioLabel = `${nombre} (Alumno)`;

            const btnMsg = document.createElement('button');
            btnMsg.className = 'btn btn-small btn-primary';
            btnMsg.textContent = 'Enviar Mensaje';
            btnMsg.addEventListener('click', () => {
                if (!postulacionId) {
                    showErrorEmp('No se encontró la postulación asociada');
                    return;
                }
                enviarMensajeDesdePostulacionEmp(postulacionId, destinatarioLabel, proyectoTitulo);
            });
            c9msg.appendChild(btnMsg);
            tr.appendChild(c9msg);

            this.tbodyPostulantes.appendChild(tr);
        });
    }
}

// ============================================
// MENSAJES (Institución)
// ============================================
let mensajeActualEmp = 'recibidos';

function showErrorEmp(message) {
    alert(message || 'Ocurrió un error');
}

function showSuccessEmp(message) {
    alert(message || 'Listo');
}

function buildUrl(template, params) {
    let url = String(template || '');
    Object.keys(params || {}).forEach((k) => {
        url = url.replace(`:${k}`, encodeURIComponent(String(params[k])));
    });
    return url;
}

async function cargarMensajesRecibidosEmp() {
    const lista = document.getElementById('listaMensajesEmp');
    if (!lista) return;

    lista.innerHTML = '<div class="loading-message">Cargando mensajes...</div>';

    try {
        if (typeof MESSAGE_ENDPOINTS === 'undefined' || !MESSAGE_ENDPOINTS.INBOX) {
            throw new Error('Falta configuración: MESSAGE_ENDPOINTS.INBOX');
        }

        const { res, data } = await fetchJsonWithAuth(`${MESSAGE_ENDPOINTS.INBOX}?limit=50`, { method: 'GET' });
        if (!res.ok) throw new Error((data && data.message) ? data.message : 'No se pudieron cargar los mensajes');

        const mensajes = (data && Array.isArray(data.mensajes)) ? data.mensajes : [];
        if (!mensajes.length) {
            lista.innerHTML = '<div class="loading-message">No hay mensajes recibidos</div>';
            return;
        }

        lista.innerHTML = '';
        mensajes.forEach((m) => lista.appendChild(crearItemMensajeEmp(m, 'recibido')));
    } catch (error) {
        console.error('Error al cargar mensajes recibidos (empresa):', error);
        lista.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar los mensajes</div>';
    }
}

async function cargarMensajesEnviadosEmp() {
    const lista = document.getElementById('listaMensajesEmp');
    if (!lista) return;

    lista.innerHTML = '<div class="loading-message">Cargando mensajes...</div>';

    try {
        if (typeof MESSAGE_ENDPOINTS === 'undefined' || !MESSAGE_ENDPOINTS.SENT) {
            throw new Error('Falta configuración: MESSAGE_ENDPOINTS.SENT');
        }

        const { res, data } = await fetchJsonWithAuth(`${MESSAGE_ENDPOINTS.SENT}?limit=50`, { method: 'GET' });
        if (!res.ok) throw new Error((data && data.message) ? data.message : 'No se pudieron cargar los mensajes');

        const mensajes = (data && Array.isArray(data.mensajes)) ? data.mensajes : [];
        if (!mensajes.length) {
            lista.innerHTML = '<div class="loading-message">No hay mensajes enviados</div>';
            return;
        }

        lista.innerHTML = '';
        mensajes.forEach((m) => lista.appendChild(crearItemMensajeEmp(m, 'enviado')));
    } catch (error) {
        console.error('Error al cargar mensajes enviados (empresa):', error);
        lista.innerHTML = '<div class="loading-message" style="color: var(--red);">Error al cargar los mensajes</div>';
    }
}

function crearItemMensajeEmp(mensaje, tipo) {
    const item = document.createElement('div');
    item.className = `mensaje-item ${mensaje.leido ? 'leido' : 'no-leido'}`;
    item.dataset.mensajeId = mensaje._id;

    const otraPersona = tipo === 'recibido' ? mensaje.remitente : mensaje.destinatario;

    item.innerHTML = `
        <div class="mensaje-item-header">
            <span class="mensaje-item-asunto">${mensaje.asunto}</span>
            <div class="mensaje-item-meta">
                ${tipo === 'enviado'
                    ? `<span class="mensaje-item-estado ${mensaje.leido ? 'leido' : 'no-leido'}">${mensaje.leido ? 'Leído' : 'No leído'}</span>`
                    : ''}
                <span class="mensaje-item-fecha">${new Date(mensaje.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
        </div>
        <div class="mensaje-item-remitente">${tipo === 'recibido' ? 'De' : 'Para'}: ${otraPersona?.nombre || '-'}</div>
    `;

    item.addEventListener('click', () => mostrarDetalleMensajeEmp(mensaje._id));
    return item;
}

async function mostrarDetalleMensajeEmp(mensajeId) {
    try {
        const detalle = document.getElementById('mensajeDetalleEmp');
        if (!detalle) return;

        if (typeof MESSAGE_ENDPOINTS === 'undefined' || !MESSAGE_ENDPOINTS.GET_MESSAGE) {
            throw new Error('Falta configuración: MESSAGE_ENDPOINTS.GET_MESSAGE');
        }

        const url = buildUrl(MESSAGE_ENDPOINTS.GET_MESSAGE, { id: mensajeId });
        const { res, data: mensaje } = await fetchJsonWithAuth(url, { method: 'GET' });
        if (!res.ok) throw new Error((mensaje && mensaje.message) ? mensaje.message : 'No se pudo cargar el mensaje');

        const remitente = mensaje.remitente;
        const destinatario = mensaje.destinatario;

        const postulacionObj = (mensaje && mensaje.postulacion && typeof mensaje.postulacion === 'object') ? mensaje.postulacion : null;
        const postulacionId = postulacionObj && postulacionObj._id ? String(postulacionObj._id) : (mensaje && mensaje.postulacion ? String(mensaje.postulacion) : '');
        const proyectoTitulo = postulacionObj && postulacionObj.vacante && postulacionObj.vacante.titulo ? String(postulacionObj.vacante.titulo) : '';
        const destinatarioLabel = `${remitente?.nombre || '-'} (${remitente?.tipo || '-'})`;

        detalle.innerHTML = `
            <div class="mensaje-detalle-header">
                <h3 class="mensaje-detalle-asunto">${mensaje.asunto}</h3>
                <div class="mensaje-detalle-info">
                    <span><strong>De:</strong> ${remitente?.nombre || '-'} (${remitente?.tipo || '-'})</span>
                    <span><strong>Para:</strong> ${destinatario?.nombre || '-'} (${destinatario?.tipo || '-'})</span>
                    <span><strong>Proyecto:</strong> ${proyectoTitulo || '-'}</span>
                    <span><strong>Fecha:</strong> ${new Date(mensaje.createdAt).toLocaleString('es-ES')}</span>
                </div>
            </div>
            <div class="mensaje-detalle-contenido">${mensaje.contenido}</div>
            ${mensajeActualEmp === 'recibidos'
                ? `<div class="mensaje-detalle-actions">
                        <button type="button" class="btn btn-small btn-primary" id="btnResponderMensajeEmp">Responder</button>
                   </div>`
                : ''}
        `;

        if (mensajeActualEmp === 'recibidos') {
            const btn = document.getElementById('btnResponderMensajeEmp');
            btn?.addEventListener('click', () => {
                if (!postulacionId) {
                    showErrorEmp('No se encontró la postulación asociada');
                    return;
                }

                const form = document.getElementById('formNuevoMensajeEmp');
                if (form) {
                    form.dataset.postulacionId = String(postulacionId);
                    form.dataset.destinatarioLabel = String(destinatarioLabel || '-');
                    form.dataset.proyectoTitulo = String(proyectoTitulo || '-');

                    const asuntoOriginal = String(mensaje.asunto || '').trim();
                    const yaEsRespuesta = /^re\s*:/i.test(asuntoOriginal);
                    form.dataset.asuntoPrefill = yaEsRespuesta ? asuntoOriginal : `Re: ${asuntoOriginal}`;
                }
                abrirModalNuevoMensajeEmp();
            });
        }
    } catch (error) {
        console.error('Error al cargar mensaje (empresa):', error);
        showErrorEmp(error.message || 'Error al cargar el mensaje');
    }
}

function enviarMensajeDesdePostulacionEmp(postulacionId, destinatarioLabel, proyectoTitulo) {
    if (!postulacionId) {
        showErrorEmp('No se encontró la postulación asociada');
        return;
    }

    // Cambiar a sección de mensajes
    document.querySelector('[data-section="mensajes-section"]')?.click();

    setTimeout(() => {
        const form = document.getElementById('formNuevoMensajeEmp');
        if (form) {
            form.dataset.postulacionId = String(postulacionId);
            form.dataset.destinatarioLabel = String(destinatarioLabel || '');
            form.dataset.proyectoTitulo = String(proyectoTitulo || '');
        }
        abrirModalNuevoMensajeEmp();
    }, 300);
}

function abrirModalNuevoMensajeEmp() {
    const modal = document.getElementById('modalNuevoMensajeEmp');
    const form = document.getElementById('formNuevoMensajeEmp');
    if (!modal || !form) return;

    const postulacionId = form.dataset.postulacionId || '';
    if (!postulacionId) {
        showErrorEmp('Solo puedes enviar mensajes desde un alumno/proyecto');
        return;
    }

    const destinatarioLabel = form.dataset.destinatarioLabel || '';
    const proyectoTitulo = form.dataset.proyectoTitulo || '';
    const asuntoPrefill = form.dataset.asuntoPrefill || '';

    form.reset();

    const destinatarioInput = document.getElementById('mensajeDestinatarioEmp');
    if (destinatarioInput) destinatarioInput.value = destinatarioLabel || '-';

    const proyectoInput = document.getElementById('mensajeProyectoEmp');
    if (proyectoInput) proyectoInput.value = proyectoTitulo || '-';

    const asuntoInput = document.getElementById('mensajeAsuntoEmp');
    if (asuntoInput) asuntoInput.value = asuntoPrefill || '';

    modal.classList.remove('hidden');

    const cerrarBtn = document.getElementById('cerrarModalMensajeEmp');
    const cancelarBtn = document.getElementById('cancelarMensajeEmpBtn');

    const cerrarModal = () => {
        modal.classList.add('hidden');
        form.dataset.postulacionId = '';
        form.dataset.destinatarioLabel = '';
        form.dataset.proyectoTitulo = '';
        form.dataset.asuntoPrefill = '';
    };

    if (cerrarBtn) cerrarBtn.onclick = cerrarModal;
    if (cancelarBtn) cancelarBtn.onclick = cerrarModal;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const asunto = document.getElementById('mensajeAsuntoEmp')?.value;
        const contenido = document.getElementById('mensajeContenidoEmp')?.value;

        try {
            if (typeof MESSAGE_ENDPOINTS === 'undefined' || !MESSAGE_ENDPOINTS.CREATE_MESSAGE) {
                throw new Error('Falta configuración: MESSAGE_ENDPOINTS.CREATE_MESSAGE');
            }

            const postulacionIdInner = form.dataset.postulacionId || '';
            if (!postulacionIdInner) {
                showErrorEmp('Falta la postulación asociada');
                return;
            }

            const { res, data } = await fetchJsonWithAuth(MESSAGE_ENDPOINTS.CREATE_MESSAGE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postulacionId: postulacionIdInner, asunto, contenido }),
            });

            if (!res.ok) {
                const msg = data && data.message ? data.message : 'Error al enviar el mensaje';
                throw new Error(msg);
            }

            showSuccessEmp('Mensaje enviado correctamente');
            cerrarModal();

            if (mensajeActualEmp === 'enviados') {
                cargarMensajesEnviadosEmp();
            } else {
                cargarMensajesRecibidosEmp();
            }
        } catch (error) {
            showErrorEmp(error.message || 'Error al enviar el mensaje');
        }
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    // Guard de sesión
    const token = getAccessToken();
    const role = getStoredUserRole();
    if (!token || role !== 'institucion') {
        clearAuthStorage();
        redirectToLogin();
        return;
    }

    // Mostrar perfil de inmediato (evita caer en Notificaciones por HTML default)
    showSectionByClass('perfil-section');

    // Logout
    const logoutIcon = document.querySelector('ion-icon[name="log-out-outline"]');
    const logoutLink = logoutIcon ? logoutIcon.closest('a') : null;
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            clearAuthStorage();
            redirectToLogin();
        });
    }

    // Inicializar perfil + publicaciones
    await initPerfil();
    window.sistemaPublicaciones = new SistemaPublicaciones();

    // Tabs de mensajes
    const tabButtons = document.querySelectorAll('#mensajes-section .tab-btn');
    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            mensajeActualEmp = tab;
            if (tab === 'recibidos') {
                cargarMensajesRecibidosEmp();
            } else {
                cargarMensajesEnviadosEmp();
            }
        });
    });

    // Cierre de modales
    (function initModals() {
        const modales = document.querySelectorAll('.modal');
        modales.forEach((modal) => {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
            }
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach((m) => m.classList.add('hidden'));
            }
        });
    })();
});

const imagenGrande = document.getElementById("imagenGrande");
const modal = document.getElementById("modalImagen");

// Funcion para abrir el modal
function abrirImagen(src) {
    imagenGrande.src = src;
    imagenGrande.classList.remove("zoom-activo");
    imagenGrande.style.transform = "scale(1)"; // Regresa el zoom a 1, lo reinicia
    modal.style.setProperty('display', 'flex', 'important');
}

// Logica de Zoom y Lupa
imagenGrande.onclick = function(e) {
    console.log('clic en imagenGrande')
    e.stopPropagation(); // Evita cerrar el modal al hacer clic en la imagen
    this.classList.toggle("zoom-activo");
    console.log(this.classList);

    // Si quitamos el zoom, reseteamos el origen al centro o a la posicion inicial
    if (!this.classList.contains("zoom-activo")) {
        this.style.transformOrigin = "center center";
    }
};

// Efecto Lupa: Mover el origen sigiendo el mouse
imagenGrande.onmousemove = function(e) {
    if (this.classList.contains("zoom-activo")) {
        // Se calcula la posición del mouse dentro de la imagen en porcentaje
        const rect = this.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Se mueve el origen del zoom a esa posición
        this.style.transformOrigin = `${x}% ${y}%`;
    }
};

// Cerrar al hacer clic en el fondo
modal.onclick = function(event) {
    if (event.target === this) {
        cerrarImagen();
    }
};

function cerrarImagen() {
    modal.style.display = "none";
}