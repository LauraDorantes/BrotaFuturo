const Vacante = require('../models/Vacante');

/*
    normalizeRequisitos
    Normaliza el campo de requisitos para que siempre sea un array de strings.
    Acepta tanto un string separado por comas como un array de strings.
    @param {string|Array} val - Requisitos en formato string o array
    @returns {Array} - Array de strings normalizados
*/
const normalizeRequisitos = (val) => {
    if (Array.isArray(val)) return val.map((r) => String(r).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((r) => r.trim()).filter(Boolean);
    return [];
};

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
        // Obtener datos de la vacante del cuerpo de la solicitud
        let { titulo, descripcion, requisitos, salario } = req.body;
        if (!titulo || !descripcion || !requisitos) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }
        // Normalizar requisitos
        requisitos = normalizeRequisitos(requisitos);
        if (requisitos.length === 0) {
            return res.status(400).json({ message: 'Requisitos no válidos' });
        }
        console.log('Creando vacante con datos:', { titulo, descripcion, requisitos, salario, propietario: req.user._id });
        // Crear la vacante
        const vacante = await Vacante.create({
            titulo,
            descripcion,
            requisitos,
            salario,
            propietarioTipo: req.user.role.toLowerCase() === 'institucion' ? 'Institucion' : 'Profesor',
            propietario: req.user.id,
        });
        // Retornar la vacante creada
        return res.status(201).json(vacante);
    } catch (err) {
        return res.status(500).json({ message: 'Error al crear la vacante' });
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
        if (!(vacante.propietario.toString() === String(req.user.id))) {
            return res.status(403).json({ message: 'No autorizado para actualizar esta vacante' });
        }

        // Actualizar campos permitidos
        const { titulo, descripcion, requisitos, salario } = req.body;
        if (titulo !== undefined) vacante.titulo = titulo;
        if (descripcion !== undefined) vacante.descripcion = descripcion;
        if (requisitos !== undefined) {
            const reqs = normalizeRequisitos(requisitos);
            if (reqs.length === 0) return res.status(400).json({ message: 'Requisitos no válidos' });
            vacante.requisitos = reqs;
        }
        if (salario !== undefined) vacante.salario = salario;
        // Guardar los cambios
        const guardada = await vacante.save();
        // Retornar la vacante actualizada
        return res.json(guardada);
    } catch (err) {
        return res.status(500).json({ message: 'Error al actualizar la vacante' });
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