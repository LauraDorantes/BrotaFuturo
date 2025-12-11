const mongoose = require('mongoose');

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
profesorSchema.index({ correo: 1 }, { unique: true });
profesorSchema.index({ createdAt: -1 });
profesorSchema.index({ nombres: 'text', apellidoPaterno: 'text', apellidoMaterno: 'text' });

module.exports = mongoose.model('Profesor', profesorSchema, 'profesores');