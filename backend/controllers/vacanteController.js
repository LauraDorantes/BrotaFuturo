const Vacante = require('../models/Vacante');

function normalizePropietarioTipo(role) {
    const r = String(role || '').toLowerCase();
    if (r === 'institucion') return 'Institucion';
    if (r === 'profesor') return 'Profesor';
    return null;
}

function normalizeString(value) {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    return s === '' ? null : s;
}

function normalizeNumber(value) {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function normalizeTelefono(value) {
    if (value === undefined || value === null) return null;
    const digits = String(value).replace(/\D/g, '');
    if (!digits) return null;
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
}

function normalizeDate(value) {
    if (value === undefined || value === null) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeModalidad(value) {
    const v = normalizeString(value);
    if (!v) return null;
    // Aceptar variantes comunes sin acento
    if (v === 'Hibrido' || v === 'Hibrida' || v === 'Hibrído') return 'Híbrido';
    if (v === 'Híbrido' || v === 'Presencial' || v === 'Remoto') return v;
    return v;
}

function normalizeBeneficiosAlumno(value) {
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) {
        const arr = value
            .map((x) => String(x || '').trim())
            .filter(Boolean);
        return arr.length ? arr : null;
    }
    const s = String(value).trim();
    if (!s) return null;
    // Permitir recibir "a, b, c"
    const arr = s
        .split(',')
        .map((x) => String(x || '').trim())
        .filter(Boolean);
    return arr.length ? arr : null;
}

// Endpoints de gestión de vacantes
/*
    crearVacante
    Endpoint para que una institución o profesor cree una nueva vacante.
    El endpoint está protegido por middleware rolesMiddleware que asegura que solo instituciones o profesores autenticados puedan acceder.
    @param {Object} req.body - Datos de la vacante a crear
    @param {Object} req.user - Usuario autenticado (institución o profesor) dado por el middleware de autenticación
    @return {Object} - Vacante creada o error en caso de fallo.
*/
exports.crearVacante = async (req, res) => {
    try {
        const propietarioTipo = normalizePropietarioTipo(req.user && req.user.role);
        if (!propietarioTipo) {
            return res.status(403).json({ message: 'Prohibido' });
        }

        const body = req.body || {};

        const vacanteData = {
            titulo: normalizeString(body.titulo),
            area: normalizeString(body.area),
            numeroVacantes: normalizeNumber(body.numeroVacantes),
            objetivos: normalizeString(body.objetivos),
            actividades: normalizeString(body.actividades),
            requerimientos: normalizeString(body.requerimientos),
            carreraRequerida: normalizeString(body.carreraRequerida),
            conocimientosTecnicos: normalizeString(body.conocimientosTecnicos),
            habilidades: normalizeString(body.habilidades),
            modalidad: normalizeModalidad(body.modalidad),
            horasSemanal: normalizeNumber(body.horasSemanal),
            fechaInicio: normalizeDate(body.fechaInicio),
            fechaLimite: normalizeDate(body.fechaLimite),
            duracionMeses: normalizeNumber(body.duracionMeses),
            beneficiosAlumno: normalizeBeneficiosAlumno(body.beneficiosAlumno),
            otrosBeneficios: body.otrosBeneficios !== undefined ? String(body.otrosBeneficios || '').trim() : undefined,
            informacionAdicional: body.informacionAdicional !== undefined ? String(body.informacionAdicional || '').trim() : undefined,
            correoConsulta: normalizeString(body.correoConsulta),
            telefonoConsulta: normalizeTelefono(body.telefonoConsulta),
            propietarioTipo,
            propietario: req.user.id,
        };

        // Default: si no mandan numeroVacantes, usar 1
        if (vacanteData.numeroVacantes === null) vacanteData.numeroVacantes = 1;

        // Limpiar campos opcionales undefined para que Mongoose aplique defaults
        Object.keys(vacanteData).forEach((k) => {
            if (vacanteData[k] === undefined) delete vacanteData[k];
        });

        const nueva = await Vacante.create(vacanteData);
        return res.status(201).json({ message: 'Vacante creada correctamente', data: nueva });
    } catch (err) {
        const isValidation = err && (err.name === 'ValidationError' || err.name === 'CastError');
        if (isValidation) {
            return res.status(400).json({ message: err.message || 'Datos inválidos' });
        }
        return res.status(500).json({ message: 'Error al crear vacante' });
    }
};

/*
    obtenerVacantes
    Endpoint para obtener todas las vacantes disponibles.
    @return {Object} - Array de vacantes o error en caso de fallo.
*/
exports.obtenerVacantes = async (req, res) => {
    try {
        // Obtener todas las vacantes ordenadas por fecha de publicación descendente
        const vacantes = await Vacante.find({}).sort({ fechaPublicacion: -1 }).lean();
        return res.json(vacantes);
    } catch (err) {
        return res.status(500).json({ message: 'Error al obtener vacantes' });
    }
};

/*
    actualizarVacante
    Endpoint para que una institución o profesor actualice una vacante existente.
    El endpoint está protegido por middleware rolesMiddleware que asegura que solo instituciones o profesores autenticados puedan acceder.
    La vacante a actualizar viene en req.vacanteIdData dado por el middleware validarObjectID.
    Solo el propietario de la vacante puede actualizarla.
    @param {Object} req.body - Datos de la vacante a actualizar
    @param {Object} req.user - Usuario autenticado (institución o profesor) dado por el middleware de autenticación
    @return {Object} - Vacante actualizada o error en caso de fallo.
*/
exports.actualizarVacante = async (req, res) => {
    try {
        const vacante = req.vacanteIdData;

        // Verificar que el usuario autenticado es el propietario de la vacante
        if (!vacante || !(vacante.propietario.toString() === String(req.user.id))) {
            return res.status(403).json({ message: 'No autorizado para actualizar esta vacante' });
        }

        const body = req.body || {};

        // Solo permitir actualizar campos del modelo (sin propietario/propietarioTipo/fechaPublicacion)
        const updates = {
            titulo: normalizeString(body.titulo),
            area: normalizeString(body.area),
            numeroVacantes: normalizeNumber(body.numeroVacantes),
            objetivos: normalizeString(body.objetivos),
            actividades: normalizeString(body.actividades),
            requerimientos: normalizeString(body.requerimientos),
            carreraRequerida: normalizeString(body.carreraRequerida),
            conocimientosTecnicos: normalizeString(body.conocimientosTecnicos),
            habilidades: normalizeString(body.habilidades),
            modalidad: normalizeModalidad(body.modalidad),
            horasSemanal: normalizeNumber(body.horasSemanal),
            fechaInicio: normalizeDate(body.fechaInicio),
            fechaLimite: normalizeDate(body.fechaLimite),
            duracionMeses: normalizeNumber(body.duracionMeses),
            beneficiosAlumno: normalizeBeneficiosAlumno(body.beneficiosAlumno),
            correoConsulta: normalizeString(body.correoConsulta),
            telefonoConsulta: normalizeTelefono(body.telefonoConsulta),
        };

        // Campos opcionales permiten setear a "" si lo mandan explícitamente
        if (body.otrosBeneficios !== undefined) updates.otrosBeneficios = String(body.otrosBeneficios || '').trim();
        if (body.informacionAdicional !== undefined) updates.informacionAdicional = String(body.informacionAdicional || '').trim();

        // Aplicar solo los campos realmente enviados (evitar borrar required con strings vacíos)
        const keysSent = new Set(Object.keys(body));
        Object.keys(updates).forEach((k) => {
            if (!keysSent.has(k)) {
                delete updates[k];
                return;
            }
            // Si es campo requerido y viene vacío -> inválido
            if (
                ['titulo', 'area', 'objetivos', 'actividades', 'requerimientos', 'carreraRequerida', 'conocimientosTecnicos', 'habilidades', 'modalidad', 'correoConsulta']
                    .includes(k)
                && (updates[k] === null)
            ) {
                return;
            }
        });

        // Validaciones básicas de campos requeridos si se enviaron
        const requiredKeys = ['titulo', 'area', 'objetivos', 'actividades', 'requerimientos', 'carreraRequerida', 'conocimientosTecnicos', 'habilidades', 'modalidad', 'horasSemanal', 'fechaInicio', 'fechaLimite', 'duracionMeses', 'beneficiosAlumno', 'correoConsulta', 'telefonoConsulta'];
        for (const k of requiredKeys) {
            if (!keysSent.has(k)) continue;
            if (updates[k] === null) {
                return res.status(400).json({ message: `Campo inválido: ${k}` });
            }
        }

        Object.keys(updates).forEach((k) => {
            vacante[k] = updates[k];
        });

        await vacante.save();
        return res.json({ message: 'Vacante actualizada correctamente', data: vacante });
    } catch (err) {
        const isValidation = err && (err.name === 'ValidationError' || err.name === 'CastError');
        if (isValidation) {
            return res.status(400).json({ message: err.message || 'Datos inválidos' });
        }
        return res.status(500).json({ message: 'Error al actualizar vacante' });
    }
};

/*
    eliminarVacante
    Endpoint para que una institución o profesor elimine una vacante existente.
    El endpoint está protegido por middleware rolesMiddleware que asegura que solo instituciones o profesores autenticados puedan acceder.
    Solo el propietario de la vacante puede eliminarla.
    El Id de la vacante a eliminar viene en req.vacanteID dado por el middleware validarObjectID.
    @param {Object} req.user - Usuario autenticado (institución o profesor) dado por el middleware de autenticación
    @return {Object} - Mensaje de éxito o error en caso de fallo.
*/
exports.eliminarVacante = async (req, res) => {
    try {
        const vacante = req.vacanteIdData;

        // Verificar que el usuario autenticado es el propietario de la vacante
        if (!(vacante.propietario.toString() === String(req.user.id))) {
            return res.status(403).json({ message: 'No autorizado para eliminar esta vacante' });
        }

        // Eliminar la vacante
        await Vacante.deleteOne({ _id: vacante._id });
        return res.json({ message: 'Vacante eliminada correctamente' });
    } catch (err) {
        return res.status(500).json({ message: 'Error al eliminar la vacante' });
    }
};