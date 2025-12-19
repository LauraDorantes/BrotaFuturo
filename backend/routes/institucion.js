const express = require('express');
const {
    actualizarPerfil,
    obtenerVacantes,
    obtenerPostulantesDeVacante,
    aceptarPostulacionDeVacante,
    rechazarPostulacionDeVacante,
    obtenerAlumnosAsociados,
} = require('../controllers/institucionController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/rolesMiddleware');

const router = express.Router();

/*
    PUT actualizarPerfil
    Endpoint para que una institución actualice su información.
*/
router.put(
    '/actualizarPerfil',
    requireAuth,
    actualizarPerfil
);

/*
    GET obtenerVacantes
    Endpoint para que una institución obtenga sus vacantes.
*/
router.get(
    '/vacantes',
    requireAuth,
    requireRoles('institucion'),
    obtenerVacantes
);

/*
    GET obtenerPostulantesDeVacante
    Endpoint para que una institución obtenga los postulantes de una vacante propia.
*/
router.get(
    '/vacantes/:vacanteId/postulantes',
    requireAuth,
    requireRoles('institucion'),
    obtenerPostulantesDeVacante
);

/*
    PUT aceptarPostulacionDeVacante
    Endpoint para que una institución acepte una postulación.
*/
router.put(
    '/vacantes/:vacanteId/postulaciones/:postulacionId/aceptar',
    requireAuth,
    requireRoles('institucion'),
    aceptarPostulacionDeVacante
);

/*
    PUT rechazarPostulacionDeVacante
    Endpoint para que una institución rechace una postulación.
*/
router.put(
    '/vacantes/:vacanteId/postulaciones/:postulacionId/rechazar',
    requireAuth,
    requireRoles('institucion'),
    rechazarPostulacionDeVacante
);

/*
    GET obtenerAlumnosAsociados
    Endpoint para que una institución obtenga su lista de alumnos asociados.
*/
router.get(
    '/alumnos',
    requireAuth,
    requireRoles('institucion'),
    obtenerAlumnosAsociados
);

module.exports = router;
