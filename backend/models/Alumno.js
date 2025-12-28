const mongoose = require('mongoose');

/**
 * Modelo de Alumno
 * Representa un estudiante del sistema que puede postularse a vacantes de servicio social
 * 
 * Campos:
 * - nombres: Nombre(s) del alumno (requerido)
 * - apellidoPaterno: Apellido paterno del alumno (requerido)
 * - apellidoMaterno: Apellido materno del alumno (requerido)
 * - correo: Email único del alumno (requerido, único)
 * - password: Contraseña encriptada del alumno (requerido)
 * - boleta: Número de boleta única del alumno (requerido, único)
 * - curp: CURP del alumno (requerido, único)
 * - telefono: Número de teléfono del alumno (requerido, único)
 * - sexo: Sexo del alumno (Masculino/Femenino) (requerido)
 * - creditos: Número de créditos del alumno (requerido)
 * - carrera: Carrera del alumno (ISC/IIA/LCD) (requerido)
 * - cvID: ID del CV almacenado en la nube (opcional)
 */

const alumnoSchema = new mongoose.Schema({
    nombres: {
        type: String,
        required: true,
    },
    edad: {
        type: Number,
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
    boleta: {
        type: Number,
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
    creditos: {
        type: Number,
        required: true,
    },
    carrera: {
        type: String,
        required: true,
        enum: ['ISC', 'IIA', 'LCD'],
    },
    cvID: {
        type: String,
        default: null,
        required: false,
        trim: true,
    }
}, { timestamps: true });

// Índices para optimizar consultas
alumnoSchema.index({ createdAt: -1 });
alumnoSchema.index({ nombres: 'text', apellidoPaterno: 'text', apellidoMaterno: 'text' });

module.exports = mongoose.model('Alumno', alumnoSchema, 'alumnos');