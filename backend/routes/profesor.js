const express = require('express');
const {
    actualizarPerfil,
} = require('../controllers/profesorController');
const { requireAuth } = require('../middlewares/authMiddleware');
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

module.exports = router;