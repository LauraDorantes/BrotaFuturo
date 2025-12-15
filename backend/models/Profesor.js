const mongoose = require('mongoose');

/**
 * Modelo de Profesor
 * Representa un profesor que puede publicar vacantes y supervisar alumnos en servicio social
 * 
 * Campos:
 * - nombres: Nombre(s) del profesor (requerido)
 * - apellidoPaterno: Apellido paterno del profesor (requerido)
 * - apellidoMaterno: Apellido materno del profesor (requerido)
 * - correo: Email único del profesor (requerido, único)
 * - password: Contraseña encriptada del profesor (requerido)
 * - departamento: Departamento al que pertenece el profesor (requerido)
 * - rfc: RFC único del profesor (requerido, único)
 * - telefono: Número de teléfono del profesor (requerido, único)
 * - sexo: Sexo del profesor (Masculino/Femenino) (requerido)
 * - alumnosAsociados: Lista de alumnos que el profesor supervisa o ha supervisado
 */

const profesorSchema = new mongoose.Schema({
    nombres: {
        type: String,
        required: true,
    },
    apellidoPaterno: {
        type: String,
        required: true,
    },
    apellidoMaterno: {
        type: String,
        required: true,
    },
    correo: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    departamento: {
        type: String,
        required: true,
    },
    rfc: {
        type: String,
        required: true,
        unique: true,
    },
    curp: {
        type: String,
        required: true,
        unique: true,
    },
    telefono: {
        type: Number,
        required: true,
        unique: true,
    },
    sexo: {
        type: String,
        required: true,
        enum: ['Masculino', 'Femenino'],
    },
    alumnosAsociados : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
    }]
}, { timestamps: true });

// Índices para optimizar consultas
profesorSchema.index({ createdAt: -1 });
profesorSchema.index({ nombres: 'text', apellidoPaterno: 'text', apellidoMaterno: 'text' });

module.exports = mongoose.model('Profesor', profesorSchema, 'profesores');