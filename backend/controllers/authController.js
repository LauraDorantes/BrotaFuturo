const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Alumno = require('../models/Alumno');
const Profesor = require('../models/Profesor');
const Institucion = require('../models/Institucion');

// Mapeo de tipos (string) a modelos (Mongoose)
const modelsByTipo = {
  alumno: Alumno,
  profesor: Profesor,
  institucion: Institucion,
};

/*
  Obtiene el modelo Mongoose correspondiente al tipo de usuario.
  Lanza un error si el tipo no es soportado.
  @param {string} tipo - Tipo de usuario: 'alumno', 'profesor', 'institucion'
  @returns {Object} - { Model, key } donde Model es el modelo Mongoose y key es el tipo en minúsculas.
*/
const getModel = (tipo) => {
  // Normaliza el tipo a minúsculas.
  const key = String(tipo || '').toLowerCase();
  // Obtiene el modelo correspondiente y verifica su existencia.
  const Model = modelsByTipo[key];
  if (!Model) {
    const error = new Error('Tipo de usuario no soportado');
    error.status = 400;
    throw error;
  }
  return { Model, key };
};

/*
  Genera tokens JWT de acceso y refresh para un usuario dado.
  @param {Object} user - Objeto Mongoose
  @param {string} role - Rol del usuario: 'alumno', 'profesor', 'institucion'
  @returns {Object} - { accessToken, refreshToken }
*/
const signTokens = (user, role) => {
  const payload = { id: user._id, role };
  // Crear token de acceso con expiracion de 15 minutos
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  // Crear token de refresh con expiracion de 7 dias
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

/*
  Verifica si un correo ya existe en cualquiera de los modelos.
  @param {string} correo - Correo a verificar
  @param {Object} onlyModel - (Opcional) Modelo Mongoose específico para verificar
  @returns {boolean} - true si el correo existe, false si no
*/
const emailExistsInAnyModel = async (correo, onlyModel) => {
  // Si onlyModel está definido, verifica solo en ese modelo; de lo contrario, en todos.
  const checks = [];
  const toCheck = onlyModel ? [onlyModel] : [Alumno, Profesor, Institucion];
  // Crea una promesa para cada modelo que verifique la existencia del correo
  for (const M of toCheck) {
    checks.push(M.findOne({ correo }).lean().exec());
  }
  // Espera a que todas las verificaciones se completen
  const results = await Promise.all(checks);
  // Devuelve true si al menos una verificación encontró un documento
  return results.some((doc) => !!doc);
};

// Endpoints de autenticación
/*
  register
  Endpoint para registrar un nuevo usuario en el sistema.
  @param {string} req.params.tipo - Tipo de usuario: 'alumno', 'profesor', 'institucion'
  @param {string} req.body.correo - Correo electrónico del usuario
  @param {string} req.body.password - Contraseña del usuario
  @param {Object} req.body.rest - Otros campos del usuario
  @return {Object} - Datos del usuario registrado y tokens JWT
*/
exports.register = async (req, res) => {
  try {
    const { tipo } = req.params; // alumno | profesor | institucion
    const { correo, password, ...rest } = req.body || {};

    // Obtener el modelo correspondiente
    const { Model, key } = getModel(tipo);
    // Evita duplicados de correo entre todos los roles (política global)
    const exists = await emailExistsInAnyModel(correo);
    if (exists) return res.status(409).json({ message: 'El correo ya está registrado' });
    // Hashear la contraseña y crear el usuario
    const hash = await bcrypt.hash(password, 10);
    const user = await Model.create({ correo, password: hash, ...rest });

    // Generar tokens JWT
    const tokens = signTokens(user, key);
    return res.status(201).json({
      user: { _id: user._id, correo: user.correo, role: key },
      ...tokens,
    });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Error al registrar' });
  }
};


/*
  login
  Endpoint para autenticar a un usuario y obtener tokens JWT.
  @param {string} req.params.tipo - Tipo de usuario: 'alumno', 'profesor', 'institucion'
  @param {string} req.body.correo - Correo electrónico del usuario
  @param {string} req.body.password - Contraseña del usuario
  @return {Object} - Datos del usuario autenticado y tokens JWT
*/
exports.login = async (req, res) => {
  try {
    const { tipo } = req.params; // alumno | profesor | institucion
    const { correo, password } = req.body || {};

    // Obtener el modelo correspondiente
    const { Model, key } = getModel(tipo);
    // Buscar el usuario por correo
    const user = await Model.findOne({ correo });
    // Verificar existencia y contraseña
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Generar tokens JWT
    const tokens = signTokens(user, key);
    return res.json({ user: { _id: user._id, correo: user.correo, role: key }, ...tokens });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Error al iniciar sesión' });
  }
};


/*
  refresh
  Endpoint para obtener un nuevo token de acceso usando un token de refresh.
  @param {string} req.body.token - Token de refresh JWT
  @return {Object} - Nuevo token de acceso JWT
*/
exports.refresh = async (req, res) => {
  try {
    // Obtener y verificar el token de refresh
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: 'Token de refresh requerido' });
    // Verificar el token de refresh
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const decoded = jwt.verify(token, refreshSecret);
    // Extraer id y role del token decodificado (payload)
    const { id, role } = decoded;
    // Obtener el modelo correspondiente
    const { Model } = getModel(role);
    // Verificar que el usuario aún exista
    const user = await Model.findById(id).lean();
    if (!user) return res.status(401).json({ message: 'Token inválido' });

    // Generar un nuevo token de acceso
    const { accessToken } = signTokens({ _id: id }, role);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};


/*
  me
  Endpoint para obtener los datos del usuario autenticado sin incluir la contraseña.
  Requiere que el middleware de autenticación haya agregado req.user.
  @return {Object} - Datos del usuario autenticado
*/
exports.me = async (req, res) => {
  try {
    // Esperar que el middleware de autenticación haya agregado req.user
    const { id, role } = req.user;
    // Verificar que id y role estén presentes
    if (!id || !role) return res.status(401).json({ message: 'No autorizado' });
    // Obtener el modelo correspondiente
    const { Model } = getModel(role);
    // Buscar el usuario por id, excluyendo la contraseña
    const user = await Model.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ message: 'Error al obtener perfil' });
  }
};

/*
  cambiarPassword
  Endpoint para que un usuario autenticado cambie su contraseña.
  Requiere que el middleware de autenticación haya agregado req.user.
  @param {string} req.body.currentPassword - Contraseña actual
  @param {string} req.body.newPassword - Nueva contraseña
  @return {Object} - Mensaje de éxito o error
*/
exports.cambiarPassword = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { currentPassword, newPassword } = req.body || {};

    // Obtener el modelo correspondiente
    const { Model } = getModel(role);
    // Buscar el usuario por id
    const user = await Model.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    // Verificar la contraseña actual
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    // Hashear la nueva contraseña y actualizar
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    return res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (err) {
    return res.status(400).json({ message: 'Error al cambiar contraseña' });
  }
};