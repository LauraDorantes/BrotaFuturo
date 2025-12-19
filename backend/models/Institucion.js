const mongoose = require('mongoose');

/**
 * Modelo de Institución
 * Representa una empresa o institución que puede publicar vacantes de servicio social
 * 
 * Campos:
 * - nombre: Nombre de la institución (requerido)
 * - nombreRepresentante: Nombre del representante de la institución (requerido)
 * - apellidosRepresentante: Apellidos del representante (requerido)
 * - correo: Email único de la institución (requerido, único)
 * - password: Contraseña encriptada (requerido)
 * - rfc: RFC único de la institución (requerido, único)
 * - telefono: Número de teléfono (requerido, único)
 * - direccion: Dirección única de la institución (requerido, único)
 * - tipo: Tipo de institución (Publica/Privada) (requerido)
 * - alumnosAsociados: Lista de alumnos que trabajan/trabajaron en la institución
 */
const institucionSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    nombreRepresentante: {
        type: String,
        required: true,
    },
    apellidosRepresentante: {
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
    rfc: {
        type: String,
        required: true,
        unique: true,
    },
    telefono: {
        type: Number,
        required: true,
        unique: true,
    },
    direccion: {
        type: String,
        required: true,
        unique: true,
    },
    tipo: {
        type: String,
        required: true,
        enum: ['Publica', 'Privada'],
    },
    alumnosAsociados: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Alumno',
            },
            vacante: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Vacante',
                required: true,
            },
            estado: {
                type: String,
                enum: ['Activo', 'Finalizado'],
                required: true,
            },
        },
    ],
}, { timestamps: true });

// Índices para optimizar consultas
institucionSchema.index({ createdAt: -1 });
institucionSchema.index({ nombre: 'text', nombreRepresentante: 'text', apellidosRepresentante: 'text' });

module.exports = mongoose.model('Institucion', institucionSchema, 'instituciones');