const mongoose = require('mongoose');

/**
 * Modelo de Vacante
 * Representa una vacante de servicio social publicada por un profesor o institución
 * 
 * Campos:
 * - titulo: Título de la vacante (requerido)
 * - descripcion: Descripción detallada de la vacante (requerido)
 * - requisitos: Lista de requisitos necesarios para la vacante (requerido)
 * - fechaPublicacion: Fecha de publicación de la vacante (automático)
 * - salario: Salario o compensación económica (opcional, por defecto 0)
 * - propietarioTipo: Tipo de propietario (Institucion/Profesor) (requerido)
 * - propietario: Referencia al profesor o institución que publica la vacante (requerido)
 */

const vacanteSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
    },
    area: {
        type: String,
        required: true,
    },
    numeroVacantes: {
        type: Number,
        required: true,
        default: 1,
    },
    objetivos: {
        type: String,
        required: true,
    },
    actividades: {
        type: String,
        required: true,
    },
    requerimientos: {
        type: String,
        required: true,
    },
    carreraRequerida: {
        type: String,
        required: true,
    },
    conocimientosTecnicos: {
        type: String,
        required: true,
    },
    habilidades: {
        type: String,
        required: true,
    },
    modalidad: {
        type: String,
        required: true,
        enum: ['Presencial', 'Remoto', 'Híbrido'],
    },
    horasSemanal: {
        type: Number,
        required: true,
    },
    fechaInicio: {
        type: Date,
        required: true,
    },
    fechaLimite: {
        type: Date,
        required: true,
    },
    duracionMeses: {
        type: Number,
        required: true,
    },
    beneficiosAlumno:{
        type: [String],
        required: true,
        enum:["Certificación al término", "Carta de recomendación", "Experiencia laboral comprobable"]
    },
    otrosBeneficios: {
        type: String,
        required: false,
    },
    informacionAdicional: {
        type: String,
        required: false,
    },
    correoConsulta: {
        type: String,
        required: true,
    },
    telefonoConsulta: {
        type: Number,
        required: true,
    },
    fechaPublicacion: {
        type: Date,
        default: Date.now,
        required: true,
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

module.exports = mongoose.model('Vacante', vacanteSchema, 'vacantes');