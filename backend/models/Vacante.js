
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
    institucion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institucion',
        default: null,
    },
    profesor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profesor',
        default: null,
    },
    salario: {
        type: Number,
        default: 0,
        required: false,
    },
});

module.exports = mongoose.model('Vacante', vacanteSchema);