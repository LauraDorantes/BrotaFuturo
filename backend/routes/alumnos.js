const express = require('express');
const {
    subirCV,
    actualizarCV,
    actualizarPerfil,
} = require('../controllers/alumnoController');
const { requireAuth } = require('../middlewares/authMiddleware');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoints de gestión de alumnos

/*
    POST subirCV
    Endpoint para que un alumno suba su CV a Google Drive y guarde el enlace en su perfil.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {File} req.file - Archivo del CV a subir
    @return {Object} - Datos del alumno con el CV actualizado o error en caso de fallo.
*/
router.post(
    '/subirCV',
    requireAuth,
    upload.single('cvFile'),
    subirCV
);

/*
    PUT actualizarCV
    Endpoint para que un alumno actualice su CV en Google Drive y guarde el nuevo enlace en su perfil.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {File} req.file - Nuevo archivo del CV a subir
    @return {Object} - Datos del alumno con el CV actualizado o error en caso de fallo.
*/
router.put(
    '/actualizarCV',
    requireAuth,
    upload.single('cvFile'),
    actualizarCV
);

/*
    PUT actualizarPerfil
    Endpoint para que un estudiante actualice su información personal.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'
    @param {Object} req.body - Datos a actualizar (nombres, apellidoPaterno, apellidoMaterno, telefono, sexo, carrera, creditos)
    @return {Object} - Datos del alumno actualizados o error en caso de fallo.
*/
/* router.put(
    '/perfil',
    requireAuth,
    actualizarPerfil
); */

module.exports = router;