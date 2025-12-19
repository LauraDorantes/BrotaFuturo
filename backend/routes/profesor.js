const express = require('express');
const {
    actualizarPerfil,
    obtenerVacantes,
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