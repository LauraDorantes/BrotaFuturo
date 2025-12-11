const jwt = require('jsonwebtoken');

/*
  Middleware para proteger rutas y requerir autenticación JWT.
  Verifica el token en el encabezado Authorization.
  Si es válido, agrega los datos del usuario decodificados a req.user.
  Si no, responde con 401 No autorizado.
*/
exports.requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    console.log("Usuario autenticado:", req.user);
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
