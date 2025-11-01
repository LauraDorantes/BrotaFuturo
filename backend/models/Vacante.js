const mongoose = require('mongoose');

const vacanteSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
    },
    descripcion: {
        type: String,
        required: true,
    },
    requisitos: {
        type: [String],
        required: true,
    },
    fechaPublicacion: {
        type: Date,
        default: Date.now,
        required: true,
    },
    salario: {
        type: Number,
        default: 0,
        required: false,
    },
    propietarioTipo: {
        type: String,
        required: true,
        enum: ['Institucion', 'Profesor'],
    },
    propietario: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'propietarioTipo',
        required: true,
    }
}, { timestamps: true });

// Indices para optimizar consultas
vacanteSchema.index({ titulo: 'text', descripcion: 'text', requisitos: 'text' });
vacanteSchema.index({ fechaPublicacion: -1 });
vacanteSchema.index({ propietario: 1, propietarioTipo: 1, fechaPublicacion: -1 });

module.exports = mongoose.model('Vacante', vacanteSchema);