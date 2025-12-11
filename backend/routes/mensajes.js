const express = require('express');
const {
    enviarMensaje,
    obtenerMensajesRecibidos,
    obtenerMensajesEnviados,
    obtenerMensajePorId,
    marcarComoLeido,
    eliminarMensaje,
} = require('../controllers/mensajeController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { validarObjectId } = require('../middlewares/validarObjectId');
const Mensaje = require('../models/Mensaje');

const router = express.Router();

/**
 * Rutas para gestionar mensajes entre usuarios del sistema
 * Todas las rutas requieren autenticación
 * Cualquier usuario autenticado puede enviar y recibir mensajes
 */

/*
    POST enviarMensaje
    Endpoint para enviar un mensaje entre usuarios
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {String} req.body.destinatarioId - ID del destinatario
    @param {String} req.body.destinatarioTipo - Tipo del destinatario: 'Alumno', 'Profesor', 'Institucion'
    @param {String} req.body.asunto - Asunto del mensaje (requerido)
    @param {String} req.body.contenido - Contenido del mensaje (requerido)
    @param {String} req.body.relacionadoConTipo - Tipo de relación: 'Vacante', 'Postulacion' o null (opcional)
    @param {String} req.body.relacionadoConId - ID de la vacante o postulación relacionada (opcional)
    @return {Object} - Mensaje creado o error en caso de fallo
*/
router.post(
    '/',
    requireAuth,
    enviarMensaje
);

/*
    GET obtenerMensajesRecibidos
    Endpoint para obtener los mensajes recibidos del usuario autenticado (bandeja de entrada)
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {String} req.query.leido - Filtro opcional por estado de lectura: 'true' o 'false'
    @param {Number} req.query.limit - Límite de resultados (opcional, por defecto 50)
    @param {Number} req.query.skip - Número de resultados a saltar para paginación (opcional)
    @return {Object} - Array de mensajes recibidos con información de paginación
*/
router.get(
    '/recibidos',
    requireAuth,
    obtenerMensajesRecibidos
);

/*
    GET obtenerMensajesEnviados
    Endpoint para obtener los mensajes enviados por el usuario autenticado
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {Number} req.query.limit - Límite de resultados (opcional, por defecto 50)
    @param {Number} req.query.skip - Número de resultados a saltar para paginación (opcional)
    @return {Object} - Array de mensajes enviados con información de paginación
*/
router.get(
    '/enviados',
    requireAuth,
    obtenerMensajesEnviados
);

/*
    GET obtenerMensajePorId
    Endpoint para obtener un mensaje específico y marcarlo como leído si es destinatario
    @param {String} req.params.mensajeId - ID del mensaje a obtener
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Detalles del mensaje
*/
router.get(
    '/:mensajeId',
    requireAuth,
    validarObjectId('mensajeId', Mensaje, 'Mensaje'),
    obtenerMensajePorId
);

/*
    PUT marcarComoLeido
    Endpoint para marcar un mensaje como leído
    Solo el destinatario puede marcar mensajes como leídos
    @param {String} req.params.mensajeId - ID del mensaje a marcar como leído
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Mensaje actualizado
*/
router.put(
    '/:mensajeId/leido',
    requireAuth,
    validarObjectId('mensajeId', Mensaje, 'Mensaje'),
    marcarComoLeido
);

/*
    DELETE eliminarMensaje
    Endpoint para eliminar un mensaje
    Tanto el remitente como el destinatario pueden eliminar sus mensajes
    @param {String} req.params.mensajeId - ID del mensaje a eliminar
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Mensaje de éxito o error en caso de fallo
*/
router.delete(
    '/:mensajeId',
    requireAuth,
    validarObjectId('mensajeId', Mensaje, 'Mensaje'),
    eliminarMensaje
);

module.exports = router;

