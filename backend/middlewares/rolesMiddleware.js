/*
  Middleware para requerir roles específicos en rutas protegidas.
  Verifica que req.user.role esté entre los roles permitidos.
  Si no, responde con 403 Prohibido.  
*/
exports.requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Prohibido' });
  }
  return next();
};
