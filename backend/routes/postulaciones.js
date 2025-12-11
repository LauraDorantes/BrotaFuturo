const express = require('express');
const {
    crearPostulacion,
    obtenerMisPostulaciones,
    obtenerPostulacionPorId,
    cancelarPostulacion,
} = require('../controllers/postulacionController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/rolesMiddleware');
const { validarObjectId } = require('../middlewares/validarObjectId');
const Postulacion = require('../models/Postulacion');

const router = express.Router();

/**
 * Rutas para gestionar postulaciones de estudiantes a vacantes
 * Todas las rutas requieren autenticación
 * Solo estudiantes pueden crear/cancelar postulaciones
 */

/*
    POST crearPostulacion
    Endpoint para que un estudiante se postule a una vacante
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {String} req.body.vacanteId - ID de la vacante a la que se postula
    @param {String} req.body.mensaje - Mensaje opcional del estudiante al postularse
    @return {Object} - Postulación creada o error en caso de fallo
*/
router.post(
    '/',
    requireAuth,
    requireRoles('alumno'),
    crearPostulacion
);

/*
    GET obtenerMisPostulaciones
    Endpoint para que un estudiante obtenga todas sus postulaciones
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {String} req.query.estado - Filtro opcional por estado: 'pendiente', 'aceptada', 'rechazada'
    @return {Object} - Array de postulaciones del estudiante
*/
router.get(
    '/mis-postulaciones',
    requireAuth,
    requireRoles('alumno'),
    obtenerMisPostulaciones
);

/*
    GET obtenerPostulacionPorId
    Endpoint para obtener los detalles de una postulación específica
    Solo el estudiante dueño de la postulación puede verla
    @param {String} req.params.postulacionId - ID de la postulación a obtener
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Detalles de la postulación
*/
router.get(
    '/:postulacionId',
    requireAuth,
    requireRoles('alumno'),
    validarObjectId('postulacionId', Postulacion, 'Postulacion'),
    obtenerPostulacionPorId
);

/*
    DELETE cancelarPostulacion
    Endpoint para que un estudiante cancele su propia postulación
    Solo se puede cancelar si está en estado 'pendiente'
    @param {String} req.params.postulacionId - ID de la postulación a cancelar
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Mensaje de éxito o error en caso de fallo
*/
router.delete(
    '/:postulacionId',
    requireAuth,
    requireRoles('alumno'),
    validarObjectId('postulacionId', Postulacion, 'Postulacion'),
    cancelarPostulacion
);

module.exports = router;

