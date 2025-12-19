const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Alumno = require('../models/Alumno');
const Institucion = require('../models/Institucion');
const Profesor = require('../models/Profesor');
const Vacante = require('../models/Vacante');
const Postulacion = require('../models/Postulacion');

/*
    actualizarPerfil
    Endpoint para que un estudiante actualice su información personal.
    @param {Object} req.body - Datos a actualizar (nombres, apellidoPaterno, apellidoMaterno, telefono, departamento, rfc, curp, sexo, correo, password)
    @param {String} req.user - Usuario autenticado (profesor) dado por el middleware de autenticación
    @return {Object} - Datos del profesor actualizados o error en caso de fallo.
*/
exports.actualizarPerfil = async (req, res) => {
    try {
        const profesor = await Profesor.findById(req.user.id);
        if (!profesor) {
            return res.status(404).json({ message: 'Profesor no encontrado' });
        }
        const body = req.body || {};

        const correo = body.correo ? String(body.correo).trim() : null;
        const rfc = body.rfc ? String(body.rfc).trim().toUpperCase() : null;
        const curp = body.curp ? String(body.curp).trim().toUpperCase() : null;
        const telefono = body.telefono !== undefined && body.telefono !== null && String(body.telefono).trim() !== ''
            ? Number(body.telefono)
            : null;
        const password = body.password ? String(body.password) : null;

        // Unicidad de RFC
        if (rfc && rfc !== profesor.rfc) {
            const rfcExistente = await Profesor.findOne({ rfc, _id: { $ne: profesor._id } }).lean();
            if (rfcExistente) {
                return res.status(400).json({ message: 'El RFC ya está en uso por otro profesor' });
            }
            profesor.rfc = rfc;
        }

        // Unicidad de CURP
        if (curp && curp !== profesor.curp) {
            const curpExistente = await Profesor.findOne({ curp, _id: { $ne: profesor._id } }).lean();
            if (curpExistente) {
                return res.status(400).json({ message: 'La CURP ya está en uso por otro profesor' });
            }
            profesor.curp = curp;
        }

        // Unicidad de teléfono
        if (telefono !== null && Number.isFinite(telefono) && telefono !== profesor.telefono) {
            const telefonoExistente = await Profesor.findOne({ telefono, _id: { $ne: profesor._id } }).lean();
            if (telefonoExistente) {
                return res.status(400).json({ message: 'El teléfono ya está en uso por otro profesor' });
            }
            profesor.telefono = telefono;
        }

        // Unicidad de correo (política global: no repetir correo entre roles)
        if (correo && correo !== profesor.correo) {
            const [enAlumnos, enProfesores, enInstituciones] = await Promise.all([
                Alumno.findOne({ correo }).lean(),
                Profesor.findOne({ correo, _id: { $ne: profesor._id } }).lean(),
                Institucion.findOne({ correo }).lean(),
            ]);
            if (enAlumnos || enProfesores || enInstituciones) {
                return res.status(400).json({ message: 'El correo ya está registrado por otro usuario' });
            }
            profesor.correo = correo;
        }

        // Campos no únicos
        if (body.nombres) profesor.nombres = String(body.nombres).trim();
        if (body.apellidoPaterno) profesor.apellidoPaterno = String(body.apellidoPaterno).trim();
        if (body.apellidoMaterno) profesor.apellidoMaterno = String(body.apellidoMaterno).trim();
        if (body.departamento) profesor.departamento = String(body.departamento).trim();
        if (body.sexo) profesor.sexo = String(body.sexo).trim();

        // Password (guardar hasheada)
        if (password && password.trim()) {
            const hash = await bcrypt.hash(password, 10);
            profesor.password = hash;
        }

        await profesor.save();

        const safeProfesor = profesor.toObject();
        delete safeProfesor.password;
        return res.json({ message: 'Perfil actualizado correctamente', data: safeProfesor });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        return res.status(500).json({ message: 'Error al actualizar el perfil', error });
    }
};

/*
    obtenerVacantes
    Endpoint para que un profesor obtenga las vacantes que ha publicado.
    @param {String} req.user - Usuario autenticado (profesor) dado por el middleware de autenticación
    @return {Object} - Array de vacantes del profesor o error en caso de fallo.
*/
exports.obtenerVacantes = async (req, res) => {
    try {
        const profesorId = req.user && req.user.id;
        if (!profesorId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        // Además del conteo de postulaciones, calculamos cupo disponible
        // cupo = numeroVacantes - aceptadas
        const pipeline = [
            {
                $match: {
                    propietarioTipo: 'Profesor',
                    propietario: new mongoose.Types.ObjectId(profesorId),
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
        console.error('Error obteniendo vacantes del profesor:', err);
        return res.status(500).json({ message: 'Error al obtener vacantes' });
    }

};

/*
    obtenerAlumnosSupervisados
    Endpoint para que un profesor obtenga la lista de alumnos que supervisa o ha supervisado.
    @param {String} req.user - Usuario autenticado (profesor) dado por el middleware de autenticación
    @return {Object} - Array de alumnos supervisados por el profesor o error en caso de fallo.
*/
//Modifique aquí
exports.obtenerAlumnosAsociados = async (req, res) => {
    try {
        const profesorId = req.user && req.user.id;
        if (!profesorId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const profesor = await Profesor.findById(profesorId)
            .populate('alumnosAsociados.id', 'boleta nombres apellidoPaterno apellidoMaterno correo')
            .populate('alumnosAsociados.vacante', 'titulo')
            .lean();

        if (!profesor) {
            return res.status(404).json({ message: 'Profesor no encontrado' });
        }

        const asociados = Array.isArray(profesor.alumnosAsociados) ? profesor.alumnosAsociados : [];

        const alumnos = asociados
            .map((a, index) => {
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
    Endpoint para que un profesor obtenga los postulantes (postulaciones) de una vacante propia.
    @param {String} req.params.vacanteId - ID de la vacante
    @param {String} req.user - Usuario autenticado (profesor)
    @return {Object} - Array de postulaciones con alumno poblado
*/
exports.obtenerPostulantesDeVacante = async (req, res) => {
    try {
        const profesorId = req.user && req.user.id;
        const vacanteId = req.params && req.params.vacanteId;

        if (!profesorId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        if (!vacanteId || !mongoose.isValidObjectId(vacanteId)) {
            return res.status(400).json({ message: 'vacanteId inválido' });
        }

        const vacante = await Vacante.findOne({
            _id: vacanteId,
            propietarioTipo: 'Profesor',
            propietario: profesorId,
        }).select('_id titulo').lean();

        if (!vacante) {
            return res.status(404).json({ message: 'Vacante no encontrada para este profesor' });
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
        console.error('Error obteniendo postulantes de vacante:', err);
        return res.status(500).json({ message: 'Error al obtener postulantes' });
    }
};

/*
    aceptarPostulacionDeVacante
    Endpoint para que un profesor acepte una postulación de una vacante propia.
    - Cambia estado a 'Aceptada'
    - Agrega al alumno a profesor.alumnosAsociados (estado: 'Activo')
*/
exports.aceptarPostulacionDeVacante = async (req, res) => {
    try {
        const profesorId = req.user && req.user.id;
        const vacanteId = req.params && req.params.vacanteId;
        const postulacionId = req.params && req.params.postulacionId;
        const body = req.body || {};

        if (!profesorId) return res.status(401).json({ message: 'No autorizado' });
        if (!vacanteId || !mongoose.isValidObjectId(vacanteId)) return res.status(400).json({ message: 'vacanteId inválido' });
        if (!postulacionId || !mongoose.isValidObjectId(postulacionId)) return res.status(400).json({ message: 'postulacionId inválido' });

        const vacanteObjectId = new mongoose.Types.ObjectId(vacanteId);

        const vacante = await Vacante.findOne({
            _id: vacanteId,
            propietarioTipo: 'Profesor',
            propietario: profesorId,
        }).select('_id numeroVacantes').lean();

        if (!vacante) {
            return res.status(404).json({ message: 'Vacante no encontrada para este profesor' });
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
        await Profesor.updateOne(
            { _id: profesorId, alumnosAsociados: { $not: { $elemMatch: { id: alumnoId, vacante: vacanteObjectId } } } },
            { $push: { alumnosAsociados: { id: alumnoId, vacante: vacanteObjectId, estado: 'Activo' } } }
        );

        return res.json({ message: 'Postulación aceptada', data: { postulacionId: postulacion._id } });
    } catch (err) {
        console.error('Error aceptando postulación:', err);
        return res.status(500).json({ message: 'Error al aceptar la postulación' });
    }
};

/*
    rechazarPostulacionDeVacante
    Endpoint para que un profesor rechace una postulación de una vacante propia.
    - Cambia estado a 'Rechazada'
*/
exports.rechazarPostulacionDeVacante = async (req, res) => {
    try {
        const profesorId = req.user && req.user.id;
        const vacanteId = req.params && req.params.vacanteId;
        const postulacionId = req.params && req.params.postulacionId;
        const body = req.body || {};

        if (!profesorId) return res.status(401).json({ message: 'No autorizado' });
        if (!vacanteId || !mongoose.isValidObjectId(vacanteId)) return res.status(400).json({ message: 'vacanteId inválido' });
        if (!postulacionId || !mongoose.isValidObjectId(postulacionId)) return res.status(400).json({ message: 'postulacionId inválido' });

        const vacante = await Vacante.findOne({
            _id: vacanteId,
            propietarioTipo: 'Profesor',
            propietario: profesorId,
        }).select('_id').lean();

        if (!vacante) {
            return res.status(404).json({ message: 'Vacante no encontrada para este profesor' });
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
        console.error('Error rechazando postulación:', err);
        return res.status(500).json({ message: 'Error al rechazar la postulación' });
    }
};
