const bcrypt = require('bcryptjs');
const Alumno = require('../models/Alumno');
const Profesor = require('../models/Profesor');
const Institucion = require('../models/Institucion');

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