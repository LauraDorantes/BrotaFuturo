const express = require('express');
// Controladores
const { 
    register,
    login,
    refresh,
    me,
    actualizarPerfil,
    cambiarPassword,
} = require('../controllers/authController');
// Middlewares
const { 
    requireAuth,
} = require('../middlewares/authMiddleware');

const router = express.Router();

/*
    POST register
    Endpoint para registrar un nuevo usuario en el sistema.
    @param {string} req.params.tipo - Tipo de usuario: 'alumno', 'profesor', 'institucion'.
    @param {string} req.body.correo - Correo electrónico del usuario.
    @param {string} req.body.password - Contraseña del usuario.
    @param {Object} req.body.rest - Otros datos del usuario (nombre, etc.).
    @return {Object} - Datos del usuario registrado y tokens JWT.
*/
router.post('/:tipo/register', register);

/*
    POST login
    Endpoint para autenticar a un usuario y obtener tokens JWT.
    @param {string} req.params.tipo - Tipo de usuario: 'alumno', 'profesor', 'institucion'.
    @param {string} req.body.correo - Correo electrónico del usuario.
    @param {string} req.body.password - Contraseña del usuario.
    @return {Object} - Tokens JWT del usuario autenticado.
*/
router.post(
    '/:tipo/login',
    login
);

/*
    POST refresh
    Endpoint para obtener un nuevo token de acceso usando un token de refresh.
    @param {string} req.body.token - Token de refresh JWT.
    @return {Object} - Nuevo token de acceso JWT.
*/
router.post(
    '/refresh',
    refresh
);

/*
    GET me
    Endpoint para obtener los datos del usuario autenticado sin incluir la contraseña.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'.
    @return {Object} - Datos del usuario autenticado.
*/
router.get(
    '/me',
    requireAuth,
    me
);

/*
    PUT password
    Endpoint para que un usuario autenticado cambie su contraseña.
    @param {String} req.headers.authorization - Token de acceso JWT en el formato 'Bearer <token>'.
    @param {string} req.body.currentPassword - Contraseña actual.
    @param {string} req.body.newPassword - Nueva contraseña.
    @return {Object} - Mensaje de éxito o error en caso de fallo.
*/
router.put(
    '/password',
    requireAuth,
    cambiarPassword
);

module.exports = router;
