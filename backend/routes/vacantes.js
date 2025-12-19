const express = require('express');
const {
  crearVacante,
  obtenerVacantes,
  actualizarVacante,
  eliminarVacante,
} = require('../controllers/vacanteController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/rolesMiddleware');
const { validarObjectId } = require('../middlewares/validarObjectId');
const Vacante = require('../models/Vacante');

const router = express.Router();

/*  
    GET obtenerVacantes
    Endpoint para obtener todas las vacantes disponibles.
    @return {Object} - Array de vacantes o error en caso de fallo.
*/
router.get(
    '/',
    obtenerVacantes
);

/*
    POST crearVacante
    Endpoint para que una institución o profesor cree una nueva vacante.
    @param {Object} req.body.titulo - Título de la vacante
    @param {Object} req.body.descripcion - Descripción de la vacante
    @param {Object} req.body.requisitos - Requisitos de la vacante
    @param {Object} req.body.salario - Salario de la vacante
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Vacante creada o error en caso de fallo.
*/
router.post(
    '/',
    requireAuth,
    requireRoles('institucion', 'profesor'),
    crearVacante
);

/*
    PUT actualizarVacante
    Endpoint para que una institución o profesor actualice una vacante existente.
    @param {String} req.params.vacanteId - ID de la vacante a actualizar
    @param {Object} req.body.titulo - Título de la vacante
    @param {Object} req.body.descripcion - Descripción de la vacante
    @param {Object} req.body.requisitos - Requisitos de la vacante
    @param {Object} req.body.salario - Salario de la vacante
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Vacante actualizada o error en caso de fallo.
*/
router.put(
    '/:vacanteId',
    requireAuth,
    requireRoles('institucion', 'profesor'),
    validarObjectId('vacanteId', Vacante, 'Vacante'),
    actualizarVacante
);

/*
    DELETE eliminarVacante
    Endpoint para que una institución o profesor elimine una vacante existente.
    @param {String} req.params.vacanteId - ID de la vacante a eliminar
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @return {Object} - Mensaje de éxito o error en caso de fallo.
*/
router.delete(
    '/:vacanteId',
    requireAuth,
    requireRoles('institucion', 'profesor'),
    validarObjectId('vacanteId', Vacante, 'Vacante'),
    eliminarVacante
);

module.exports = router;
