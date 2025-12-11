const Postulacion = require('../models/Postulacion');
const Vacante = require('../models/Vacante');
const Alumno = require('../models/Alumno');

/**
 * Controlador para gestionar postulaciones de estudiantes a vacantes
 */

/**
 * crearPostulacion
 * Endpoint para que un estudiante se postule a una vacante
 * Solo los estudiantes pueden crear postulaciones
 * @param {Object} req.body.vacanteId - ID de la vacante a la que se postula
 * @param {String} req.body.mensaje - Mensaje opcional del estudiante
 * @param {Object} req.user - Usuario autenticado (debe ser alumno)
 * @return {Object} - Postulación creada o error en caso de fallo
 */
exports.crearPostulacion = async (req, res) => {
    try {
        const { vacanteId, mensaje } = req.body;
        const alumnoId = req.user.id;

        // Validar que se proporcione el ID de la vacante
        if (!vacanteId) {
            return res.status(400).json({ message: 'ID de vacante requerido' });
        }

        // Verificar que la vacante existe
        const vacante = await Vacante.findById(vacanteId);
        if (!vacante) {
            return res.status(404).json({ message: 'Vacante no encontrada' });
        }

        // Verificar que el estudiante no se haya postulado ya a esta vacante
        const postulacionExistente = await Postulacion.findOne({
            alumno: alumnoId,
            vacante: vacanteId
        });

        if (postulacionExistente) {
            return res.status(409).json({ message: 'Ya te has postulado a esta vacante' });
        }

        // Crear la postulación
        const postulacion = await Postulacion.create({
            alumno: alumnoId,
            vacante: vacanteId,
            mensaje: mensaje || '',
            estado: 'pendiente'
        });

        // Poblar los datos relacionados para la respuesta
        const postulacionCompleta = await Postulacion.findById(postulacion._id)
            .populate('alumno', 'nombres apellidoPaterno apellidoMaterno correo boleta carrera creditos')
            .populate('vacante', 'titulo descripcion requisitos salario propietarioTipo propietario');

        return res.status(201).json(postulacionCompleta);
    } catch (error) {
        console.error('Error creando postulación:', error);
        return res.status(500).json({ message: 'Error al crear la postulación', error: error.message });
    }
};

/**
 * obtenerMisPostulaciones
 * Endpoint para que un estudiante obtenga todas sus postulaciones
 * @param {Object} req.user - Usuario autenticado (debe ser alumno)
 * @param {String} req.query.estado - Filtro opcional por estado (pendiente, aceptada, rechazada)
 * @return {Object} - Array de postulaciones del estudiante
 */
exports.obtenerMisPostulaciones = async (req, res) => {
    try {
        const alumnoId = req.user.id;
        const { estado } = req.query;

        // Construir el filtro
        const filtro = { alumno: alumnoId };
        if (estado && ['pendiente', 'aceptada', 'rechazada'].includes(estado)) {
            filtro.estado = estado;
        }

        // Obtener postulaciones con datos relacionados
        const postulaciones = await Postulacion.find(filtro)
            .populate('vacante', 'titulo descripcion requisitos salario propietarioTipo fechaPublicacion')
            .populate({
                path: 'vacante',
                populate: {
                    path: 'propietario',
                    select: 'nombres apellidoPaterno apellidoMaterno correo departamento nombre representante direccion'
                }
            })
            .sort({ createdAt: -1 });

        return res.json(postulaciones);
    } catch (error) {
        console.error('Error obteniendo postulaciones:', error);
        return res.status(500).json({ message: 'Error al obtener postulaciones', error: error.message });
    }
};

/**
 * obtenerPostulacionPorId
 * Endpoint para obtener los detalles de una postulación específica
 * Solo el estudiante dueño de la postulación puede verla
 * @param {Object} req.postulacionIdData - Postulación encontrada por el middleware
 * @param {Object} req.user - Usuario autenticado
 * @return {Object} - Detalles de la postulación
 */
exports.obtenerPostulacionPorId = async (req, res) => {
    try {
        const postulacion = req.postulacionIdData;

        // Verificar que el usuario autenticado sea el dueño de la postulación
        if (postulacion.alumno.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'No autorizado para ver esta postulación' });
        }

        // Poblar datos relacionados
        const postulacionCompleta = await Postulacion.findById(postulacion._id)
            .populate('alumno', 'nombres apellidoPaterno apellidoMaterno correo boleta carrera creditos cvID')
            .populate('vacante', 'titulo descripcion requisitos salario propietarioTipo fechaPublicacion')
            .populate({
                path: 'vacante',
                populate: {
                    path: 'propietario',
                    select: 'nombres apellidoPaterno apellidoMaterno correo departamento nombre representante direccion telefono'
                }
            });

        return res.json(postulacionCompleta);
    } catch (error) {
        console.error('Error obteniendo postulación:', error);
        return res.status(500).json({ message: 'Error al obtener la postulación', error: error.message });
    }
};

/**
 * cancelarPostulacion
 * Endpoint para que un estudiante cancele su propia postulación
 * Solo se puede cancelar si está en estado 'pendiente'
 * @param {Object} req.postulacionIdData - Postulación encontrada por el middleware
 * @param {Object} req.user - Usuario autenticado (debe ser alumno)
 * @return {Object} - Mensaje de éxito o error
 */
exports.cancelarPostulacion = async (req, res) => {
    try {
        const postulacion = req.postulacionIdData;

        // Verificar que el usuario autenticado sea el dueño de la postulación
        if (postulacion.alumno.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'No autorizado para cancelar esta postulación' });
        }

        // Solo se puede cancelar si está pendiente
        if (postulacion.estado !== 'pendiente') {
            return res.status(400).json({ 
                message: 'Solo se pueden cancelar postulaciones pendientes' 
            });
        }

        // Eliminar la postulación
        await Postulacion.deleteOne({ _id: postulacion._id });

        return res.json({ message: 'Postulación cancelada correctamente' });
    } catch (error) {
        console.error('Error cancelando postulación:', error);
        return res.status(500).json({ message: 'Error al cancelar la postulación', error: error.message });
    }
};

