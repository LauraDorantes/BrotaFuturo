const Mensaje = require('../models/Mensaje');
const Alumno = require('../models/Alumno');
const Profesor = require('../models/Profesor');
const Institucion = require('../models/Institucion');

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
 * @param {String} req.body.relacionadoConTipo - Tipo de relación: 'Vacante', 'Postulacion' o null (opcional)
 * @param {String} req.body.relacionadoConId - ID de la vacante o postulación relacionada (opcional)
 * @param {Object} req.user - Usuario autenticado (remitente)
 * @return {Object} - Mensaje creado o error en caso de fallo
 */
exports.enviarMensaje = async (req, res) => {
    try {
        const { destinatarioId, destinatarioTipo, asunto, contenido, relacionadoConTipo, relacionadoConId } = req.body;
        const remitenteId = req.user.id;
        const remitenteTipo = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1); // Capitalizar primera letra

        // Validar campos requeridos
        if (!destinatarioId || !destinatarioTipo || !asunto || !contenido) {
            return res.status(400).json({ message: 'Faltan campos requeridos: destinatarioId, destinatarioTipo, asunto, contenido' });
        }

        // Validar tipos válidos
        if (!['Alumno', 'Profesor', 'Institucion'].includes(destinatarioTipo)) {
            return res.status(400).json({ message: 'Tipo de destinatario no válido' });
        }

        // No permitir enviarse mensajes a sí mismo
        if (destinatarioId === remitenteId && destinatarioTipo === remitenteTipo) {
            return res.status(400).json({ message: 'No puedes enviarte mensajes a ti mismo' });
        }

        // Obtener datos del remitente
        const ModeloRemitente = obtenerModeloPorTipo(remitenteTipo);
        const remitente = await ModeloRemitente.findById(remitenteId);
        if (!remitente) {
            return res.status(404).json({ message: 'Remitente no encontrado' });
        }

        // Obtener datos del destinatario
        const ModeloDestinatario = obtenerModeloPorTipo(destinatarioTipo);
        const destinatario = await ModeloDestinatario.findById(destinatarioId);
        if (!destinatario) {
            return res.status(404).json({ message: 'Destinatario no encontrado' });
        }

        // Validar relación si se proporciona
        if (relacionadoConTipo && relacionadoConId) {
            if (!['Vacante', 'Postulacion'].includes(relacionadoConTipo)) {
                return res.status(400).json({ message: 'Tipo de relación no válido' });
            }
        }

        // Crear el mensaje
        const mensaje = await Mensaje.create({
            remitente: {
                id: remitenteId,
                tipo: remitenteTipo,
                nombre: obtenerNombreUsuario(remitenteTipo, remitente)
            },
            destinatario: {
                id: destinatarioId,
                tipo: destinatarioTipo,
                nombre: obtenerNombreUsuario(destinatarioTipo, destinatario)
            },
            asunto: asunto.trim(),
            contenido: contenido.trim(),
            relacionadoCon: {
                tipo: relacionadoConTipo || null,
                id: relacionadoConId || null
            },
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
            mensaje.fechaLeido = new Date();
            await mensaje.save();
        }

        return res.json(mensaje);
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
        mensaje.fechaLeido = new Date();
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

