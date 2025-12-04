const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
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
alumnoSchema.index({ correo: 1 }, { unique: true });
alumnoSchema.index({ boleta: 1 }, { unique: true });
alumnoSchema.index({ createdAt: -1 });
alumnoSchema.index({ nombres: 'text', apellidoPaterno: 'text', apellidoMaterno: 'text' });

module.exports = mongoose.model('Alumno', alumnoSchema);