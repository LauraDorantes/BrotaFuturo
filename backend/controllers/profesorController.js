const bcrypt = require('bcryptjs');
const Alumno = require('../models/Alumno');
const Institucion = require('../models/Institucion');
const Profesor = require('../models/Profesor');
const Vacante = require('../models/Vacante');

/*
    actualizarPerfil
    Endpoint para que un estudiante actualice su información personal.
    @param {Object} req.body - Datos a actualizar (nombres, apellidoPaterno, apellidoMaterno, telefono, departamento, rfc, curp, sexo, correo, password)
    @param {String} req.user - Usuario autenticado (profesor) dado por el middleware de autenticación
    @return {Object} - Datos del profesor actualizados o error en caso de fallo.
*/
exports.actualizarPerfil = async (req, res) => {
    try {
        const profesor = await Profesor.findById(req.user.id);
        if (!profesor) {
            return res.status(404).json({ message: 'Profesor no encontrado' });
        }
        const body = req.body || {};

        const correo = body.correo ? String(body.correo).trim() : null;
        const rfc = body.rfc ? String(body.rfc).trim().toUpperCase() : null;
        const curp = body.curp ? String(body.curp).trim().toUpperCase() : null;
        const telefono = body.telefono !== undefined && body.telefono !== null && String(body.telefono).trim() !== ''
            ? Number(body.telefono)
            : null;
        const password = body.password ? String(body.password) : null;

        // Unicidad de RFC
        if (rfc && rfc !== profesor.rfc) {
            const rfcExistente = await Profesor.findOne({ rfc, _id: { $ne: profesor._id } }).lean();
            if (rfcExistente) {
                return res.status(400).json({ message: 'El RFC ya está en uso por otro profesor' });
            }
            profesor.rfc = rfc;
        }

        // Unicidad de CURP
        if (curp && curp !== profesor.curp) {
            const curpExistente = await Profesor.findOne({ curp, _id: { $ne: profesor._id } }).lean();
            if (curpExistente) {
                return res.status(400).json({ message: 'La CURP ya está en uso por otro profesor' });
            }
            profesor.curp = curp;
        }

        // Unicidad de teléfono
        if (telefono !== null && Number.isFinite(telefono) && telefono !== profesor.telefono) {
            const telefonoExistente = await Profesor.findOne({ telefono, _id: { $ne: profesor._id } }).lean();
            if (telefonoExistente) {
                return res.status(400).json({ message: 'El teléfono ya está en uso por otro profesor' });
            }
            profesor.telefono = telefono;
        }

        // Unicidad de correo (política global: no repetir correo entre roles)
        if (correo && correo !== profesor.correo) {
            const [enAlumnos, enProfesores, enInstituciones] = await Promise.all([
                Alumno.findOne({ correo }).lean(),
                Profesor.findOne({ correo, _id: { $ne: profesor._id } }).lean(),
                Institucion.findOne({ correo }).lean(),
            ]);
            if (enAlumnos || enProfesores || enInstituciones) {
                return res.status(400).json({ message: 'El correo ya está registrado por otro usuario' });
            }
            profesor.correo = correo;
        }

        // Campos no únicos
        if (body.nombres) profesor.nombres = String(body.nombres).trim();
        if (body.apellidoPaterno) profesor.apellidoPaterno = String(body.apellidoPaterno).trim();
        if (body.apellidoMaterno) profesor.apellidoMaterno = String(body.apellidoMaterno).trim();
        if (body.departamento) profesor.departamento = String(body.departamento).trim();
        if (body.sexo) profesor.sexo = String(body.sexo).trim();

        // Password (guardar hasheada)
        if (password && password.trim()) {
            const hash = await bcrypt.hash(password, 10);
            profesor.password = hash;
        }

        await profesor.save();

        const safeProfesor = profesor.toObject();
        delete safeProfesor.password;
        return res.json({ message: 'Perfil actualizado correctamente', data: safeProfesor });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        return res.status(500).json({ message: 'Error al actualizar el perfil', error });
    }
};

/*
    obtenerVacantes
    Endpoint para que un profesor obtenga las vacantes que ha publicado.
    @param {String} req.user - Usuario autenticado (profesor) dado por el middleware de autenticación
    @return {Object} - Array de vacantes del profesor o error en caso de fallo.
*/
exports.obtenerVacantes = async (req, res) => {
    try {
        const profesorId = req.user && req.user.id;
        if (!profesorId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const vacantes = await Vacante.find({
            propietarioTipo: 'Profesor',
            propietario: profesorId,
        })
            .sort({ fechaPublicacion: -1 })
            .lean();

        return res.json({ message: 'Vacantes obtenidas correctamente', data: vacantes });
    } catch (err) {
        console.error('Error obteniendo vacantes del profesor:', err);
        return res.status(500).json({ message: 'Error al obtener vacantes' });
    }

};

/*
    obtenerAlumnosSupervisados
    Endpoint para que un profesor obtenga la lista de alumnos que supervisa o ha supervisado.
    @param {String} req.user - Usuario autenticado (profesor) dado por el middleware de autenticación
    @return {Object} - Array de alumnos supervisados por el profesor o error en caso de fallo.
*/
exports.obtenerAlumnosAsociados = async (req, res) => {
    try {
        const profesorId = req.user && req.user.id;
        if (!profesorId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const profesor = await Profesor.findById(profesorId)
            .populate({
                path: 'alumnosAsociados',
                select: '-password -__v',
            })
            .lean();

        if (!profesor) {
            return res.status(404).json({ message: 'Profesor no encontrado' });
        }

        const alumnos = Array.isArray(profesor.alumnosAsociados) ? profesor.alumnosAsociados : [];
        return res.json({ message: 'Alumnos obtenidos correctamente', data: alumnos });
    } catch (err) {
        console.error('Error obteniendo alumnos asociados:', err);
        return res.status(500).json({ message: 'Error al obtener alumnos asociados' });
    }

};