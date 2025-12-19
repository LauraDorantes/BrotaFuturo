const Mensaje = require('../models/Mensaje');
const Alumno = require('../models/Alumno');
const Profesor = require('../models/Profesor');
const Institucion = require('../models/Institucion');
const Postulacion = require('../models/Postulacion');
const Vacante = require('../models/Vacante');

/**
 * Función auxiliar para obtener el nombre completo de un usuario según su tipo
 * @param {String} tipo - Tipo de usuario: 'Alumno', 'Profesor', 'Institucion'
 * @param {Object} usuario - Objeto del usuario de Mongoose
 * @returns {String} - Nombre completo del usuario
 */
const obtenerNombreUsuario = (tipo, usuario) => {
    if (tipo === 'Alumno') {
        return `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`.trim();
    } else if (tipo === 'Profesor') {
        return `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`.trim();
    } else if (tipo === 'Institucion') {
        return usuario.nombre || 'Institución';
    }
    return 'Usuario';
};

/**
 * Función auxiliar para obtener el modelo según el tipo de usuario
 * @param {String} tipo - Tipo de usuario: 'Alumno', 'Profesor', 'Institucion'
 * @returns {Object} - Modelo de Mongoose
 */
const obtenerModeloPorTipo = (tipo) => {
    const modelos = {
        'Alumno': Alumno,
        'Profesor': Profesor,
        'Institucion': Institucion
    };
    return modelos[tipo];
};

/**
 * enviarMensaje
 * Endpoint para enviar un mensaje entre usuarios
 * Cualquier usuario autenticado puede enviar mensajes
 * @param {Object} req.body.destinatarioId - ID del destinatario
 * @param {String} req.body.destinatarioTipo - Tipo del destinatario: 'Alumno', 'Profesor', 'Institucion'
 * @param {String} req.body.asunto - Asunto del mensaje (requerido)
 * @param {String} req.body.contenido - Contenido del mensaje (requerido)
 * @param {String} req.body.postulacionId - ID de la postulación relacionada (recomendado)
 * @param {Object} req.user - Usuario autenticado (remitente)
 * @return {Object} - Mensaje creado o error en caso de fallo
 */
exports.enviarMensaje = async (req, res) => {
    try {
        const { destinatarioId, destinatarioTipo, asunto, contenido, postulacionId } = req.body;
        const remitenteId = req.user.id;
        const remitenteTipo = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1); // Capitalizar primera letra

        // Validar campos requeridos
        if (!asunto || !contenido) {
            return res.status(400).json({ message: 'Faltan campos requeridos: asunto, contenido' });
        }

        // Restricción de negocio: solo mensajes Alumno <-> (Profesor|Institucion)
        const remitenteEsAlumno = remitenteTipo === 'Alumno';

        let postulacion = null;
        let destinatarioIdFinal = null;
        let destinatarioTipoFinal = null;

        // Caso A: se manda explicitamente la postulación
        if (postulacionId) {
            postulacion = await Postulacion.findById(postulacionId)
                .populate('alumno', 'nombres apellidoPaterno apellidoMaterno correo')
                .populate({
                    path: 'vacante',
                    select: 'propietario propietarioTipo titulo',
                });

            if (!postulacion) {
                return res.status(404).json({ message: 'Postulación no encontrada' });
            }

            // Determinar destinatario según quién envía
            const alumnoId = postulacion.alumno?._id?.toString();
            const propietarioId = postulacion.vacante?.propietario?.toString();
            const propietarioTipo = postulacion.vacante?.propietarioTipo;

            if (!alumnoId || !propietarioId || !propietarioTipo) {
                return res.status(400).json({ message: 'La postulación no tiene alumno/vacante completos' });
            }

            // Validar que el remitente pertenezca a la postulación
            const remitenteEsAlumnoDePost = remitenteTipo === 'Alumno' && alumnoId === String(remitenteId);
            const remitenteEsPropietarioDePost = propietarioTipo === remitenteTipo && propietarioId === String(remitenteId);
            if (!remitenteEsAlumnoDePost && !remitenteEsPropietarioDePost) {
                return res.status(403).json({ message: 'No autorizado para enviar mensajes en esta postulación' });
            }

            if (remitenteTipo === 'Alumno') {
                destinatarioIdFinal = propietarioId;
                destinatarioTipoFinal = propietarioTipo;
            } else {
                // Profesor/Institucion
                destinatarioIdFinal = alumnoId;
                destinatarioTipoFinal = 'Alumno';
            }
        } else {
            // Caso B (compat): se manda destinatarioId/destinatarioTipo; se resuelve la postulación más reciente
            if (!destinatarioId || !destinatarioTipo) {
                return res.status(400).json({ message: 'Falta postulacionId (recomendado) o destinatarioId/destinatarioTipo' });
            }
            if (!['Alumno', 'Profesor', 'Institucion'].includes(destinatarioTipo)) {
                return res.status(400).json({ message: 'Tipo de destinatario no válido' });
            }

            // Solo permitimos Alumno <-> (Profesor|Institucion)
            if (remitenteTipo !== 'Alumno' && destinatarioTipo !== 'Alumno') {
                return res.status(400).json({ message: 'Los mensajes solo pueden ser entre Alumno y (Profesor o Institucion)' });
            }

            // Resolver postulación más reciente que conecte a ambos
            const esAlumnoDestinatario = destinatarioTipo === 'Alumno';
            const alumnoId = remitenteEsAlumno ? String(remitenteId) : String(destinatarioId);
            const propietarioId = remitenteEsAlumno ? String(destinatarioId) : String(remitenteId);
            const propietarioTipo = remitenteEsAlumno ? destinatarioTipo : remitenteTipo;

            // Validar propietario tipo
            if (!['Profesor', 'Institucion'].includes(propietarioTipo)) {
                return res.status(400).json({ message: 'Tipo de propietario no válido' });
            }

            // Vacantes del propietario
            const vacanteIds = await Vacante.find({ propietario: propietarioId, propietarioTipo })
                .select('_id')
                .lean();

            const ids = (vacanteIds || []).map(v => v._id);
            if (ids.length === 0) {
                return res.status(400).json({ message: 'No existe una relación de postulación entre ambos usuarios' });
            }

            postulacion = await Postulacion.findOne({ alumno: alumnoId, vacante: { $in: ids } })
                .sort({ createdAt: -1 })
                .populate('alumno', 'nombres apellidoPaterno apellidoMaterno correo')
                .populate({
                    path: 'vacante',
                    select: 'propietario propietarioTipo titulo',
                });

            if (!postulacion) {
                return res.status(400).json({ message: 'No existe una postulación entre ambos usuarios' });
            }

            // Determinar destinatario final
            if (remitenteEsAlumno) {
                destinatarioIdFinal = propietarioId;
                destinatarioTipoFinal = propietarioTipo;
            } else {
                destinatarioIdFinal = alumnoId;
                destinatarioTipoFinal = 'Alumno';
            }
        }

        // No permitir enviarse mensajes a sí mismo
        if (String(destinatarioIdFinal) === String(remitenteId) && String(destinatarioTipoFinal) === String(remitenteTipo)) {
            return res.status(400).json({ message: 'No puedes enviarte mensajes a ti mismo' });
        }

        // Validar tipos válidos final
        if (!['Alumno', 'Profesor', 'Institucion'].includes(destinatarioTipoFinal)) {
            return res.status(400).json({ message: 'Tipo de destinatario no válido' });
        }

        // Aplicar regla Alumno <-> (Profesor|Institucion)
        if (remitenteTipo !== 'Alumno' && destinatarioTipoFinal !== 'Alumno') {
            return res.status(400).json({ message: 'Los mensajes solo pueden ser entre Alumno y (Profesor o Institucion)' });
        }

        // Obtener datos del destinatario
        const ModeloDestinatario = obtenerModeloPorTipo(destinatarioTipoFinal);
        const destinatario = await ModeloDestinatario.findById(destinatarioIdFinal);
        if (!destinatario) {
            return res.status(404).json({ message: 'Destinatario no encontrado' });
        }

        // Obtener datos del remitente
        const ModeloRemitente = obtenerModeloPorTipo(remitenteTipo);
        const remitente = await ModeloRemitente.findById(remitenteId);
        if (!remitente) {
            return res.status(404).json({ message: 'Remitente no encontrado' });
        }

        // Crear el mensaje
        const mensaje = await Mensaje.create({
            remitente: {
                id: remitenteId,
                tipo: remitenteTipo,
                nombre: obtenerNombreUsuario(remitenteTipo, remitente)
            },
            destinatario: {
                id: destinatarioIdFinal,
                tipo: destinatarioTipoFinal,
                nombre: obtenerNombreUsuario(destinatarioTipoFinal, destinatario)
            },
            asunto: asunto.trim(),
            contenido: contenido.trim(),
            postulacion: postulacion._id,
            leido: false
        });

        return res.status(201).json(mensaje);
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        return res.status(500).json({ message: 'Error al enviar el mensaje', error: error.message });
    }
};

/**
 * obtenerMensajesRecibidos
 * Endpoint para obtener los mensajes recibidos del usuario autenticado (bandeja de entrada)
 * @param {Object} req.user - Usuario autenticado
 * @param {String} req.query.leido - Filtro opcional por estado de lectura: 'true' o 'false'
 * @param {Number} req.query.limit - Límite de resultados (opcional, por defecto 50)
 * @param {Number} req.query.skip - Número de resultados a saltar para paginación (opcional)
 * @return {Object} - Array de mensajes recibidos
 */
exports.obtenerMensajesRecibidos = async (req, res) => {
    try {
        const destinatarioId = req.user.id;
        const destinatarioTipo = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);
        const { leido, limit = 50, skip = 0 } = req.query;

        // Construir el filtro
        const filtro = {
            'destinatario.id': destinatarioId,
            'destinatario.tipo': destinatarioTipo
        };

        if (leido !== undefined) {
            filtro.leido = leido === 'true';
        }

        // Obtener mensajes
        const mensajes = await Mensaje.find(filtro)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        // Contar total para paginación
        const total = await Mensaje.countDocuments(filtro);

        return res.json({
            mensajes,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error obteniendo mensajes recibidos:', error);
        return res.status(500).json({ message: 'Error al obtener mensajes', error: error.message });
    }
};

/**
 * obtenerMensajesEnviados
 * Endpoint para obtener los mensajes enviados por el usuario autenticado
 * @param {Object} req.user - Usuario autenticado
 * @param {Number} req.query.limit - Límite de resultados (opcional, por defecto 50)
 * @param {Number} req.query.skip - Número de resultados a saltar para paginación (opcional)
 * @return {Object} - Array de mensajes enviados
 */
exports.obtenerMensajesEnviados = async (req, res) => {
    try {
        const remitenteId = req.user.id;
        const remitenteTipo = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);
        const { limit = 50, skip = 0 } = req.query;

        // Construir el filtro
        const filtro = {
            'remitente.id': remitenteId,
            'remitente.tipo': remitenteTipo
        };

        // Obtener mensajes
        const mensajes = await Mensaje.find(filtro)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        // Contar total para paginación
        const total = await Mensaje.countDocuments(filtro);

        return res.json({
            mensajes,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error obteniendo mensajes enviados:', error);
        return res.status(500).json({ message: 'Error al obtener mensajes enviados', error: error.message });
    }
};

/**
 * obtenerMensajePorId
 * Endpoint para obtener un mensaje específico y marcarlo como leído si es destinatario
 * @param {Object} req.mensajeIdData - Mensaje encontrado por el middleware
 * @param {Object} req.user - Usuario autenticado
 * @return {Object} - Detalles del mensaje
 */
exports.obtenerMensajePorId = async (req, res) => {
    try {
        const mensaje = req.mensajeIdData;
        const usuarioId = req.user.id;
        const usuarioTipo = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);

        // Verificar que el usuario es el remitente o destinatario
        const esRemitente = mensaje.remitente.id.toString() === usuarioId && mensaje.remitente.tipo === usuarioTipo;
        const esDestinatario = mensaje.destinatario.id.toString() === usuarioId && mensaje.destinatario.tipo === usuarioTipo;

        if (!esRemitente && !esDestinatario) {
            return res.status(403).json({ message: 'No autorizado para ver este mensaje' });
        }

        // Si es el destinatario y no está leído, marcarlo como leído
        if (esDestinatario && !mensaje.leido) {
            mensaje.leido = true;
            await mensaje.save();
        }

        // Re-consultar con populate para que el front pueda mostrar Proyecto (vacante.titulo)
        const mensajeDetallado = await Mensaje.findById(mensaje._id)
            .populate({
                path: 'postulacion',
                select: 'vacante',
                populate: {
                    path: 'vacante',
                    select: 'titulo',
                },
            });

        return res.json(mensajeDetallado || mensaje);
    } catch (error) {
        console.error('Error obteniendo mensaje:', error);
        return res.status(500).json({ message: 'Error al obtener el mensaje', error: error.message });
    }
};

/**
 * marcarComoLeido
 * Endpoint para marcar un mensaje como leído
 * Solo el destinatario puede marcar mensajes como leídos
 * @param {Object} req.mensajeIdData - Mensaje encontrado por el middleware
 * @param {Object} req.user - Usuario autenticado (debe ser destinatario)
 * @return {Object} - Mensaje actualizado
 */
exports.marcarComoLeido = async (req, res) => {
    try {
        const mensaje = req.mensajeIdData;
        const usuarioId = req.user.id;
        const usuarioTipo = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);

        // Verificar que el usuario es el destinatario
        const esDestinatario = mensaje.destinatario.id.toString() === usuarioId && mensaje.destinatario.tipo === usuarioTipo;

        if (!esDestinatario) {
            return res.status(403).json({ message: 'Solo el destinatario puede marcar el mensaje como leído' });
        }

        // Marcar como leído
        mensaje.leido = true;
        await mensaje.save();

        return res.json(mensaje);
    } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        return res.status(500).json({ message: 'Error al marcar el mensaje como leído', error: error.message });
    }
};

/**
 * eliminarMensaje
 * Endpoint para eliminar un mensaje
 * Tanto el remitente como el destinatario pueden eliminar sus mensajes
 * @param {Object} req.mensajeIdData - Mensaje encontrado por el middleware
 * @param {Object} req.user - Usuario autenticado
 * @return {Object} - Mensaje de éxito o error
 */
exports.eliminarMensaje = async (req, res) => {
    try {
        const mensaje = req.mensajeIdData;
        const usuarioId = req.user.id;
        const usuarioTipo = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);

        // Verificar que el usuario es el remitente o destinatario
        const esRemitente = mensaje.remitente.id.toString() === usuarioId && mensaje.remitente.tipo === usuarioTipo;
        const esDestinatario = mensaje.destinatario.id.toString() === usuarioId && mensaje.destinatario.tipo === usuarioTipo;

        if (!esRemitente && !esDestinatario) {
            return res.status(403).json({ message: 'No autorizado para eliminar este mensaje' });
        }

        // Eliminar el mensaje
        await Mensaje.deleteOne({ _id: mensaje._id });

        return res.json({ message: 'Mensaje eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando mensaje:', error);
        return res.status(500).json({ message: 'Error al eliminar el mensaje', error: error.message });
    }
};

/**
 * obtenerDestinatariosPermitidos
 * Endpoint para que un estudiante obtenga los profesores/empresas con los que tiene postulaciones
 * Solo los estudiantes pueden usar este endpoint
 * @param {Object} req.user - Usuario autenticado (debe ser alumno)
 * @return {Object} - Array de destinatarios permitidos (profesores e instituciones)
 */
exports.obtenerDestinatariosPermitidos = async (req, res) => {
    try {
        const alumnoId = req.user.id;

        // Obtener todas las postulaciones del estudiante
        const postulaciones = await Postulacion.find({ alumno: alumnoId })
            .populate({
                path: 'vacante',
                populate: {
                    path: 'propietario',
                    select: 'nombres apellidoPaterno apellidoMaterno nombre correo'
                },
                select: 'propietarioTipo propietario titulo'
            });

        // Extraer profesores e instituciones únicos
        const profesoresMap = new Map();
        const institucionesMap = new Map();

        postulaciones.forEach(postulacion => {
            if (!postulacion.vacante || !postulacion.vacante.propietario) return;

            const propietario = postulacion.vacante.propietario;
            const propietarioTipo = postulacion.vacante.propietarioTipo;
            const propietarioId = propietario._id.toString();

            if (propietarioTipo === 'Profesor') {
                if (!profesoresMap.has(propietarioId)) {
                    profesoresMap.set(propietarioId, {
                        id: propietarioId,
                        tipo: 'Profesor',
                        nombre: `${propietario.nombres} ${propietario.apellidoPaterno} ${propietario.apellidoMaterno}`.trim(),
                        correo: propietario.correo
                    });
                }
            } else if (propietarioTipo === 'Institucion') {
                if (!institucionesMap.has(propietarioId)) {
                    institucionesMap.set(propietarioId, {
                        id: propietarioId,
                        tipo: 'Institucion',
                        nombre: propietario.nombre || 'Institución',
                        correo: propietario.correo
                    });
                }
            }
        });

        const profesores = Array.from(profesoresMap.values());
        const instituciones = Array.from(institucionesMap.values());

        return res.json({
            profesores,
            instituciones,
            total: profesores.length + instituciones.length
        });
    } catch (error) {
        console.error('Error obteniendo destinatarios permitidos:', error);
        return res.status(500).json({ message: 'Error al obtener destinatarios permitidos', error: error.message });
    }
};

/**
 * obtenerEstudiantesPostulados
 * Endpoint para que un profesor obtenga los estudiantes postulados a sus vacantes
 * Solo los profesores pueden usar este endpoint
 * @param {Object} req.user - Usuario autenticado (debe ser profesor)
 * @return {Object} - Array de estudiantes postulados
 */
exports.obtenerEstudiantesPostulados = async (req, res) => {
    try {
        const profesorId = req.user.id;

        // Obtener todas las vacantes del profesor
        const vacantes = await Vacante.find({ 
            propietario: profesorId, 
            propietarioTipo: 'Profesor' 
        }).select('_id');

        const vacanteIds = vacantes.map(v => v._id);

        if (vacanteIds.length === 0) {
            return res.json({ estudiantes: [], total: 0 });
        }

        // Obtener todas las postulaciones a estas vacantes
        const postulaciones = await Postulacion.find({ vacante: { $in: vacanteIds } })
            .populate('alumno', 'nombres apellidoPaterno apellidoMaterno correo boleta carrera creditos')
            .populate('vacante', 'titulo propietarioTipo')
            .sort({ createdAt: -1 });

        // Extraer estudiantes únicos
        const estudiantesMap = new Map();

        postulaciones.forEach(postulacion => {
            if (!postulacion.alumno) return;

            const alumnoId = postulacion.alumno._id.toString();
            if (!estudiantesMap.has(alumnoId)) {
                estudiantesMap.set(alumnoId, {
                    id: alumnoId,
                    tipo: 'Alumno',
                    nombre: `${postulacion.alumno.nombres} ${postulacion.alumno.apellidoPaterno} ${postulacion.alumno.apellidoMaterno}`.trim(),
                    correo: postulacion.alumno.correo,
                    boleta: postulacion.alumno.boleta,
                    carrera: postulacion.alumno.carrera,
                    creditos: postulacion.alumno.creditos
                });
            }
        });

        const estudiantes = Array.from(estudiantesMap.values());

        return res.json({
            estudiantes,
            total: estudiantes.length
        });
    } catch (error) {
        console.error('Error obteniendo estudiantes postulados:', error);
        return res.status(500).json({ message: 'Error al obtener estudiantes postulados', error: error.message });
    }
};

