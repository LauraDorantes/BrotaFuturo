const express = require('express');
const {
    actualizarPerfil,
    obtenerVacantes,
    obtenerPostulantesDeVacante,
    aceptarPostulacionDeVacante,
    rechazarPostulacionDeVacante,
    obtenerAlumnosAsociados,
} = require('../controllers/profesorController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/rolesMiddleware');
const router = express.Router();

/*
    PUT actualizarPerfil
    Endpoint para que un profesor actualice su información personal.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {Object} req.body - Datos a actualizar (nombres, apellidoPaterno, apellidoMaterno, telefono, departamento, rfc, curp, sexo)
    @return {Object} - Datos del profesor actualizados o error en caso de fallo.
*/
router.put(
    '/actualizarPerfil',
    requireAuth,
    actualizarPerfil
);

/*
    GET obtenerVacantes
    Endpoint para que un profesor obtenga las vacantes que ha publicado.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Array de vacantes del profesor o error en caso de fallo.
*/
router.get(
    '/vacantes',
    requireAuth,
    requireRoles('profesor'),
    obtenerVacantes
);

/*
    GET obtenerPostulantesDeVacante
    Endpoint para que un profesor obtenga los postulantes de una vacante propia.
    @param {String} req.params.vacanteId - ID de la vacante
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Postulaciones con alumno poblado
*/
router.get(
    '/vacantes/:vacanteId/postulantes',
    requireAuth,
    requireRoles('profesor'),
    obtenerPostulantesDeVacante
);

/*
    PUT aceptarPostulacionDeVacante
    Endpoint para que un profesor acepte una postulación en una vacante propia.
*/
router.put(
    '/vacantes/:vacanteId/postulaciones/:postulacionId/aceptar',
    requireAuth,
    requireRoles('profesor'),
    aceptarPostulacionDeVacante
);

/*
    PUT rechazarPostulacionDeVacante
    Endpoint para que un profesor rechace una postulación en una vacante propia.
*/
router.put(
    '/vacantes/:vacanteId/postulaciones/:postulacionId/rechazar',
    requireAuth,
    requireRoles('profesor'),
    rechazarPostulacionDeVacante
);

/*
    GET obtenerAlumnosAsociados
    Endpoint para que un profesor obtenga la lista de alumnos que supervisa o ha supervisado.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Array de alumnos asociados al profesor o error en caso de fallo.
*/
router.get(
    '/alumnos',
    requireAuth,
    requireRoles('profesor'),
    obtenerAlumnosAsociados
);

module.exports = router;