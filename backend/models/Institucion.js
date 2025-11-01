const mongoose = require('mongoose');

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
    alumnosAsociados : [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Alumno',
    }]
}, { timestamps: true });

// Índices para optimizar consultas
institucionSchema.index({ correo: 1 }, { unique: true });
institucionSchema.index({ createdAt: -1 });
institucionSchema.index({ nombre: 'text', nombreRepresentante: 'text', apellidosRepresentante: 'text' });

module.exports = mongoose.model('Institucion', institucionSchema);