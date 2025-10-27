const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Alumno = require('../models/Alumno');
const Profesor = require('../models/Profesor');
const Institucion = require('../models/Institucion');

const modelsByTipo = {
  alumno: Alumno,
  profesor: Profesor,
  institucion: Institucion,
};

const getModel = (tipo) => {
  const key = String(tipo || '').toLowerCase();
  const Model = modelsByTipo[key];
  if (!Model) {
    const error = new Error('Tipo de usuario no soportado');
    error.status = 400;
    throw error;
  }
  return { Model, key };
};

const signTokens = (user, role) => {
  const payload = { id: user._id, role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const emailExistsInAnyModel = async (correo, onlyModel) => {
  // Si onlyModel está definido, verifica solo en ese modelo; de lo contrario, en todos.
  const checks = [];
  const toCheck = onlyModel ? [onlyModel] : [Alumno, Profesor, Institucion];
  for (const M of toCheck) {
    checks.push(M.findOne({ correo }).lean().exec());
  }
  const results = await Promise.all(checks);
  return results.some((doc) => !!doc);
};

exports.register = async (req, res) => {
  try {
    const { tipo } = req.params; // alumno | profesor | institucion
    const { correo, password, ...rest } = req.body || {};
    if (!correo || !password) {
      return res.status(400).json({ message: 'correo y password son obligatorios' });
    }

    const { Model, key } = getModel(tipo);

    // Evita duplicados de correo entre todos los roles (política global)
    const exists = await emailExistsInAnyModel(correo);
    if (exists) return res.status(409).json({ message: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const user = await Model.create({ correo, password: hash, ...rest });

    const tokens = signTokens(user, key);
    return res.status(201).json({
      user: { id: user._id, correo: user.correo, role: key },
      ...tokens,
    });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Error al registrar' });
  }
};

exports.login = async (req, res) => {
  try {
    const { tipo } = req.params; // alumno | profesor | institucion
    const { correo, password } = req.body || {};
    if (!correo || !password) {
      return res.status(400).json({ message: 'correo y password son obligatorios' });
    }

    const { Model, key } = getModel(tipo);
    const user = await Model.findOne({ correo });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const tokens = signTokens(user, key);
    return res.json({ user: { id: user._id, correo: user.correo, role: key }, ...tokens });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ message: err.message || 'Error al iniciar sesión' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: 'Token de refresh requerido' });

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, refreshSecret);
    const { id, role } = decoded;
    const { Model } = getModel(role);
    const user = await Model.findById(id).lean();
    if (!user) return res.status(401).json({ message: 'Token inválido' });

    const { accessToken } = signTokens({ _id: id }, role);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

exports.me = async (req, res) => {
  try {
    const { id, role } = req.user || {};
    if (!id || !role) return res.status(401).json({ message: 'No autorizado' });
    const { Model } = getModel(role);
    const user = await Model.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ message: 'Error al obtener perfil' });
  }
};
