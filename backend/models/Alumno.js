/*
Modelo de datos para un alumno en MongoDB usando Mongoose.
Contiene campos como nombres, apellidos, correo, password, boleta, curp, telefono, sexo, semestre y carrera.
*/
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
        enum: ['Maculino', 'Femenino'],
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
    }
});

module.exports = mongoose.model('Alumno', alumnoSchema);