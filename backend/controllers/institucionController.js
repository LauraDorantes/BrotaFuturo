const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Alumno = require('../models/Alumno');
const Institucion = require('../models/Institucion');
const Profesor = require('../models/Profesor');
const Vacante = require('../models/Vacante');
const Postulacion = require('../models/Postulacion');

/*
    actualizarPerfil
    Endpoint para que una institución actualice su información personal.
    Verifica unicidad de correo, rfc, telefono.
    @param {Object} req.body - Datos a actualizar (nombre, nombreRepresentante, apellidosRepresentante, correo, password, rfc, telefono, direccion, tipo)
    @param {String} req.user - Usuario autenticado (institución) dado por el middleware de autenticación
    @return {Object} - Datos de la institución actualizados o error en caso de fallo.
*/
exports.actualizarPerfil = async (req, res) => {
    try {
        const institucion = await Institucion.findById(req.user.id);
        if (!institucion) {
            return res.status(404).json({ message: 'Institución no encontrada' });
        }

        const body = req.body || {};

        const correo = body.correo ? String(body.correo).trim() : null;
        const rfc = body.rfc ? String(body.rfc).trim().toUpperCase() : null;
        const telefono = body.telefono !== undefined && body.telefono !== null && String(body.telefono).trim() !== ''
            ? Number(body.telefono)
            : null;
        const direccion = body.direccion ? String(body.direccion).trim() : null;
        const password = body.password ? String(body.password) : null;

        // Unicidad de RFC
        if (rfc && rfc !== institucion.rfc) {
            const rfcExistente = await Institucion.findOne({ rfc, _id: { $ne: institucion._id } }).lean();
            if (rfcExistente) {
                return res.status(400).json({ message: 'El RFC ya está en uso por otra institución' });
            }
            institucion.rfc = rfc;
        }

        // Unicidad de teléfono
        if (telefono !== null && Number.isFinite(telefono) && telefono !== institucion.telefono) {
            const telefonoExistente = await Institucion.findOne({ telefono, _id: { $ne: institucion._id } }).lean();
            if (telefonoExistente) {
                return res.status(400).json({ message: 'El teléfono ya está en uso por otra institución' });
            }
            institucion.telefono = telefono;
        }

        // Unicidad de dirección
        if (direccion && direccion !== institucion.direccion) {
            const direccionExistente = await Institucion.findOne({ direccion, _id: { $ne: institucion._id } }).lean();
            if (direccionExistente) {
                return res.status(400).json({ message: 'La dirección ya está en uso por otra institución' });
            }
            institucion.direccion = direccion;
        }

        // Unicidad de correo (política global: no repetir correo entre roles)
        if (correo && correo !== institucion.correo) {
            const [enAlumnos, enProfesores, enInstituciones] = await Promise.all([
                Alumno.findOne({ correo }).lean(),
                Profesor.findOne({ correo }).lean(),
                Institucion.findOne({ correo, _id: { $ne: institucion._id } }).lean(),
            ]);
            if (enAlumnos || enProfesores || enInstituciones) {
                return res.status(400).json({ message: 'El correo ya está registrado por otro usuario' });
            }
            institucion.correo = correo;
        }

        // Campos no únicos
        if (body.nombre) institucion.nombre = String(body.nombre).trim();
        if (body.nombreRepresentante) institucion.nombreRepresentante = String(body.nombreRepresentante).trim();
        if (body.apellidosRepresentante) institucion.apellidosRepresentante = String(body.apellidosRepresentante).trim();
        if (body.tipo) institucion.tipo = String(body.tipo).trim();

        // Password (guardar hasheada)
        if (password && password.trim()) {
            const hash = await bcrypt.hash(password, 10);
            institucion.password = hash;
        }

        await institucion.save();

        const safeInstitucion = institucion.toObject();
        delete safeInstitucion.password;
        return res.json({ message: 'Perfil actualizado correctamente', data: safeInstitucion });
    } catch (error) {
        console.error('Error actualizando perfil institución:', error);
        return res.status(500).json({ message: 'Error al actualizar el perfil', error });
    }
};

/*
    obtenerVacantes
    Endpoint para que una institución obtenga las vacantes que ha publicado.
    @param {String} req.user - Usuario autenticado (institución) dado por el middleware de autenticación
    @return {Object} - Array de vacantes de la institución o error en caso de fallo.
*/
exports.obtenerVacantes = async (req, res) => {
    try {
        const institucionId = req.user && req.user.id;
        if (!institucionId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        // Además del conteo de postulaciones, calculamos cupo disponible
        // cupo = numeroVacantes - aceptadas
        const pipeline = [
            {
                $match: {
                    propietarioTipo: 'Institucion',
                    propietario: new mongoose.Types.ObjectId(institucionId),
                },
            },
            { $sort: { fechaPublicacion: -1 } },
            {
                $lookup: {
                    from: 'postulaciones',
                    localField: '_id',
                    foreignField: 'vacante',
                    as: '__postulaciones',
                },
            },
            {
                $addFields: {
                    postulacionesCount: { $size: '$__postulaciones' },
                    __aceptadasCount: {
                        $size: {
                            $filter: {
                                input: '$__postulaciones',
                                as: 'p',
                                cond: { $eq: ['$$p.estado', 'Aceptada'] },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    vacantesDisponibles: {
                        $max: [
                            {
                                $subtract: [
                                    { $ifNull: ['$numeroVacantes', 1] },
                                    '$__aceptadasCount',
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            { $project: { __postulaciones: 0, __aceptadasCount: 0 } },
        ];

        const vacantes = await Vacante.aggregate(pipeline);
        return res.json({ message: 'Vacantes obtenidas correctamente', data: vacantes });
    } catch (err) {
        console.error('Error obteniendo vacantes de la institución:', err);
        return res.status(500).json({ message: 'Error al obtener vacantes' });
    }
};

/*
    obtenerAlumnosSupervisados
    Endpoint para que una institución obtenga la lista de alumnos que supervisa o ha supervisado.
    @param {String} req.user - Usuario autenticado (institución) dado por el middleware de autenticación
    @return {Object} - Array de alumnos supervisados por la institución o error en caso de fallo.
*/
//Modifique aquí
exports.obtenerAlumnosAsociados = async (req, res) => {
    try {
        const institucionId = req.user && req.user.id;
        if (!institucionId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const institucion = await Institucion.findById(institucionId)
            .populate('alumnosAsociados.id', 'boleta nombres apellidoPaterno apellidoMaterno correo')
            .populate('alumnosAsociados.vacante', 'titulo')
            .lean();

        if (!institucion) {
            return res.status(404).json({ message: 'Institución no encontrada' });
        }

        const asociados = Array.isArray(institucion.alumnosAsociados) ? institucion.alumnosAsociados : [];

        const alumnos = asociados.map((a, index) => {
            const alumno = a && a.id ? a.id : null;
            const vacante = a && a.vacante ? a.vacante : null;
            const tituloProyecto = vacante && vacante.titulo ? String(vacante.titulo) : '-';
            return {
                numero: index + 1,
                boleta: alumno && alumno.boleta != null ? alumno.boleta : '-',
                nombreCompleto: alumno
                    ? `${alumno.nombres || ''} ${alumno.apellidoPaterno || ''} ${alumno.apellidoMaterno || ''}`.replace(/\s+/g, ' ').trim()
                    : '-',
                correo: alumno && alumno.correo ? alumno.correo : '-',
                // Nuevo nombre explícito
                tituloProyecto,
                // Alias para compatibilidad con front antiguo
                publicacion: tituloProyecto,
                estado: a && a.estado ? a.estado : '-',
            };
        });

        return res.json(alumnos);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener alumnos' });
    }
};

/*
    obtenerPostulantesDeVacante
    Endpoint para que una institución obtenga los postulantes (postulaciones) de una vacante propia.
    @param {String} req.params.vacanteId - ID de la vacante
    @param {String} req.user - Usuario autenticado (institucion)
    @return {Object} - Array de postulaciones con alumno poblado
*/
exports.obtenerPostulantesDeVacante = async (req, res) => {
    try {
        const institucionId = req.user && req.user.id;
        const vacanteId = req.params && req.params.vacanteId;

        if (!institucionId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        if (!vacanteId || !mongoose.isValidObjectId(vacanteId)) {
            return res.status(400).json({ message: 'vacanteId inválido' });
        }

        const vacante = await Vacante.findOne({
            _id: vacanteId,
            propietarioTipo: 'Institucion',
            propietario: institucionId,
        }).select('_id titulo').lean();

        if (!vacante) {
            return res.status(404).json({ message: 'Vacante no encontrada para esta institución' });
        }

        const postulaciones = await Postulacion.find({ vacante: vacanteId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'alumno',
                select: 'nombres apellidoPaterno apellidoMaterno correo boleta carrera creditos telefono cvID',
            })
            .select('alumno estado mensaje createdAt fechaRespuesta comentariosRespuesta')
            .lean();

        return res.json({
            message: 'Postulantes obtenidos correctamente',
            data: {
                vacante,
                postulaciones,
                total: Array.isArray(postulaciones) ? postulaciones.length : 0,
            },
        });
    } catch (err) {
        console.error('Error obteniendo postulantes de vacante (institución):', err);
        return res.status(500).json({ message: 'Error al obtener postulantes' });
    }
};

/*
    aceptarPostulacionDeVacante
    Endpoint para que una institución acepte una postulación de una vacante propia.
    - Cambia estado a 'Aceptada'
    - Agrega al alumno a institucion.alumnosAsociados (estado: 'Activo')
*/
exports.aceptarPostulacionDeVacante = async (req, res) => {
    try {
        const institucionId = req.user && req.user.id;
        const vacanteId = req.params && req.params.vacanteId;
        const postulacionId = req.params && req.params.postulacionId;
        const body = req.body || {};

        if (!institucionId) return res.status(401).json({ message: 'No autorizado' });
        if (!vacanteId || !mongoose.isValidObjectId(vacanteId)) return res.status(400).json({ message: 'vacanteId inválido' });
        if (!postulacionId || !mongoose.isValidObjectId(postulacionId)) return res.status(400).json({ message: 'postulacionId inválido' });

        const vacanteObjectId = new mongoose.Types.ObjectId(vacanteId);

        const vacante = await Vacante.findOne({
            _id: vacanteId,
            propietarioTipo: 'Institucion',
            propietario: institucionId,
        }).select('_id numeroVacantes').lean();

        if (!vacante) {
            return res.status(404).json({ message: 'Vacante no encontrada para esta institución' });
        }

        // Validar cupo antes de aceptar
        const capacidad = vacante && vacante.numeroVacantes != null ? Number(vacante.numeroVacantes) : 1;
        const aceptadasCount = await Postulacion.countDocuments({ vacante: vacanteId, estado: 'Aceptada' });
        if (Number.isFinite(capacidad) && aceptadasCount >= capacidad) {
            return res.status(409).json({ message: 'Esta vacante ya no tiene cupo disponible' });
        }

        const postulacion = await Postulacion.findOne({ _id: postulacionId, vacante: vacanteId });
        if (!postulacion) {
            return res.status(404).json({ message: 'Postulación no encontrada para esta vacante' });
        }
        if (String(postulacion.estado || '').toLowerCase() !== 'pendiente') {
            return res.status(400).json({ message: 'Solo se pueden aceptar postulaciones en estado Pendiente' });
        }

        postulacion.estado = 'Aceptada';
        postulacion.fechaRespuesta = new Date();
        if (body.comentariosRespuesta !== undefined) {
            postulacion.comentariosRespuesta = String(body.comentariosRespuesta || '').trim();
        }

        await postulacion.save();

        // Convertir en alumno asociado (si no existe ya)
        const alumnoId = postulacion.alumno;
        await Institucion.updateOne(
            { _id: institucionId, alumnosAsociados: { $not: { $elemMatch: { id: alumnoId, vacante: vacanteObjectId } } } },
            { $push: { alumnosAsociados: { id: alumnoId, vacante: vacanteObjectId, estado: 'Activo' } } }
        );

        return res.json({ message: 'Postulación aceptada', data: { postulacionId: postulacion._id } });
    } catch (err) {
        console.error('Error aceptando postulación (institución):', err);
        return res.status(500).json({ message: 'Error al aceptar la postulación' });
    }
};

/*
    rechazarPostulacionDeVacante
    Endpoint para que una institución rechace una postulación de una vacante propia.
    - Cambia estado a 'Rechazada'
*/
exports.rechazarPostulacionDeVacante = async (req, res) => {
    try {
        const institucionId = req.user && req.user.id;
        const vacanteId = req.params && req.params.vacanteId;
        const postulacionId = req.params && req.params.postulacionId;
        const body = req.body || {};

        if (!institucionId) return res.status(401).json({ message: 'No autorizado' });
        if (!vacanteId || !mongoose.isValidObjectId(vacanteId)) return res.status(400).json({ message: 'vacanteId inválido' });
        if (!postulacionId || !mongoose.isValidObjectId(postulacionId)) return res.status(400).json({ message: 'postulacionId inválido' });

        const vacante = await Vacante.findOne({
            _id: vacanteId,
            propietarioTipo: 'Institucion',
            propietario: institucionId,
        }).select('_id').lean();

        if (!vacante) {
            return res.status(404).json({ message: 'Vacante no encontrada para esta institución' });
        }

        const postulacion = await Postulacion.findOne({ _id: postulacionId, vacante: vacanteId });
        if (!postulacion) {
            return res.status(404).json({ message: 'Postulación no encontrada para esta vacante' });
        }
        if (String(postulacion.estado || '').toLowerCase() !== 'pendiente') {
            return res.status(400).json({ message: 'Solo se pueden rechazar postulaciones en estado Pendiente' });
        }

        postulacion.estado = 'Rechazada';
        postulacion.fechaRespuesta = new Date();
        if (body.comentariosRespuesta !== undefined) {
            postulacion.comentariosRespuesta = String(body.comentariosRespuesta || '').trim();
        }

        await postulacion.save();
        return res.json({ message: 'Postulación rechazada', data: { postulacionId: postulacion._id } });
    } catch (err) {
        console.error('Error rechazando postulación (institución):', err);
        return res.status(500).json({ message: 'Error al rechazar la postulación' });
    }
};
