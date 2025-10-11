/*
Modelo de datos para Profesores en MongoDB usando Mongoose.
Contiene campos como nombres, apellidos, correo, password, departamento, rfc, curp, telefono y sexo.
*/
const mongoose = require('mongoose');

const profesorSchema = new mongoose.Schema({
    nombres: {
        type: String,
        required: true,
    },
    apellidos: {
        type: String,
        required: true,
    },
    correo: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        trype: String,
        required: trye,
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
});