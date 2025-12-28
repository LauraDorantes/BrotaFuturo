const Postulacion = require('../models/Postulacion');
const Vacante = require('../models/Vacante');
const Alumno = require('../models/Alumno');
const mongoose = require('mongoose');

/**
 * Controlador para gestionar postulaciones de estudiantes a vacantes
 */

/**
 * crearPostulacion
 * Endpoint para que un estudiante se postule a una vacante
 * Solo los estudiantes pueden crear postulaciones
 * @param {Object} req.body.vacanteId - ID de la vacante a la que se postula
 * @param {Object} req.user - Usuario autenticado (debe ser alumno)
 * @return {Object} - Postulación creada o error en caso de fallo
 */
exports.crearPostulacion = async (req, res) => {
    try {
        const { vacanteId } = req.body;
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

        // Validar que la vacante tenga cupo disponible
        const capacidad = vacante && vacante.numeroVacantes != null ? Number(vacante.numeroVacantes) : 1;
        const aceptadasCount = await Postulacion.countDocuments({ vacante: vacanteId, estado: 'Aceptada' });
        if (Number.isFinite(capacidad) && aceptadasCount >= capacidad) {
            return res.status(409).json({ message: 'Esta vacante ya no tiene cupo disponible' });
        }

        // Validar que el alumno tenga CV cargado
        const alumno = await Alumno.findById(alumnoId).select('cvID').lean();
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        if (!alumno.cvID) {
            return res.status(400).json({ message: 'Para postularte debes subir tu CV en tu perfil primero' });
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
            estado: 'Pendiente'
        });

        // Poblar los datos relacionados para la respuesta
        const postulacionCompleta = await Postulacion.findById(postulacion._id)
            .populate('alumno', 'nombres apellidoPaterno apellidoMaterno correo boleta carrera creditos')
            .populate({
                path: 'vacante',
                select: 'titulo area numeroVacantes objetivos actividades requerimientos carreraRequerida conocimientosTecnicos habilidades modalidad horasSemanal fechaInicio fechaLimite duracionMeses beneficiosAlumno otrosBeneficios informacionAdicional correoConsulta telefonoConsulta propietarioTipo propietario fechaPublicacion',
                populate: {
                    path: 'propietario',
                    select: 'nombres apellidoPaterno apellidoMaterno correo departamento telefono nombre nombreRepresentante apellidosRepresentante direccion',
                },
            });

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

        const normalizarEstado = (value) => {
            const key = String(value || '').trim().toLowerCase();
            const map = {
                pendiente: 'Pendiente',
                aceptada: 'Aceptada',
                rechazada: 'Rechazada',
            };
            return map[key] || null;
        };

        // Construir el filtro
        // const filtro = { alumno: alumnoId };
        const filtro = { alumno: new mongoose.Types.ObjectId(alumnoId) };
        const estadoCanonico = normalizarEstado(estado);
        if (estadoCanonico) {
            filtro.estado = estadoCanonico;
        }

        // Obtener postulaciones con datos relacionados
const postulaciones = await Postulacion.aggregate([
            { $match: filtro },
            // Datos de la vacante
            {
                $lookup: {
                    from: 'vacantes',
                    localField: 'vacante',
                    foreignField: '_id',
                    as: 'vacante'
                }
            },
            { $unwind: '$vacante' },
            // Se obtienen TODAS las postulaciones de esa vacante para calcular el cupo
            {
                $lookup: {
                    from: 'postulaciones',
                    localField: 'vacante._id',
                    foreignField: 'vacante',
                    as: '__todasLasPostulaciones'
                }
            },
            // Se calcula vacantesDisponibles
            {
                $addFields: {
                    "vacante.vacantesDisponibles": {
                        $max: [
                            {
                                $subtract: [
                                    { $ifNull: ['$vacante.numeroVacantes', 1] },
                                    {
                                        $size: {
                                            $filter: {
                                                input: '$__todasLasPostulaciones',
                                                as: 'p',
                                                cond: { $eq: ['$$p.estado', 'Aceptada'] }
                                            }
                                        }
                                    }
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            // Se traen los datos del propietario (Profesor/Empresa)
            {
                $lookup: {
                    from: 'profesores', // La coleccion es profesores
                    localField: 'vacante.propietario',
                    foreignField: '_id',
                    as: 'vacante.propietario'
                }
            },
            { $unwind: { path: '$vacante.propietario', preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } },
            // Se limpian campos temporales
            { $project: { __todasLasPostulaciones: 0 } }
        ]);

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
            .populate({
                path: 'vacante',
                select: 'titulo area numeroVacantes objetivos actividades requerimientos carreraRequerida conocimientosTecnicos habilidades modalidad horasSemanal fechaInicio fechaLimite duracionMeses beneficiosAlumno otrosBeneficios informacionAdicional correoConsulta telefonoConsulta propietarioTipo propietario fechaPublicacion',
                populate: {
                    path: 'propietario',
                    select: 'nombres apellidoPaterno apellidoMaterno correo departamento telefono nombre nombreRepresentante apellidosRepresentante direccion',
                },
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
        if (String(postulacion.estado || '').toLowerCase() !== 'pendiente') {
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

