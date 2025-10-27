const express = require('express');
const { register, login, refresh, me } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// Registro/Login por rol
router.post('/:tipo/register', register); // /api/auth/alumno/register
router.post('/:tipo/login', login); // /api/auth/profesor/login

// Refresh token
router.post('/refresh', refresh);

// Perfil del usuario autenticado
router.get('/me', requireAuth, me);

module.exports = router;
