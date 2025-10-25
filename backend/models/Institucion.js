/*
Modelo de Institucion en MongoDB usando Mongoose.
Contiene campos como nombre, nombreRepresentante, apellidosRepresentante, correo, password, rfc, telefono, direccion y tipo.
*/
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
});

module.exports = mongoose.model('Institucion', institucionSchema);