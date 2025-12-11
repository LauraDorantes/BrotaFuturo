const mongoose = require('mongoose');

/**
 * Modelo de Postulación
 * Representa una postulación de un estudiante a una vacante de servicio social
 * 
 * Campos:
 * - alumno: Referencia al estudiante que se postula (requerido)
 * - vacante: Referencia a la vacante a la que se postula (requerido)
 * - estado: Estado de la postulación (pendiente, aceptada, rechazada) - por defecto 'pendiente'
 * - mensaje: Mensaje opcional del estudiante al postularse
 * - fechaPostulacion: Fecha en que se realizó la postulación (automático)
 * - fechaRespuesta: Fecha en que se respondió la postulación (opcional)
 * - comentariosRespuesta: Comentarios del profesor/empresa al responder (opcional)
 */
const postulacionSchema = new mongoose.Schema({
    alumno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
        required: true,
    },
    vacante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vacante',
        required: true,
    },
    estado: {
        type: String,
        enum: ['pendiente', 'aceptada', 'rechazada'],
        default: 'pendiente',
        required: true,
    },
    mensaje: {
        type: String,
        default: '',
        trim: true,
    },
    fechaRespuesta: {
        type: Date,
        default: null,
    },
    comentariosRespuesta: {
        type: String,
        default: '',
        trim: true,
    }
}, { timestamps: true });

// Índices para optimizar consultas
// Índice único para evitar que un alumno se postule dos veces a la misma vacante
postulacionSchema.index({ alumno: 1, vacante: 1 }, { unique: true });
// Índice para buscar postulaciones por alumno
postulacionSchema.index({ alumno: 1, createdAt: -1 });
// Índice para buscar postulaciones por vacante
postulacionSchema.index({ vacante: 1, estado: 1, createdAt: -1 });
// Índice para buscar por estado
postulacionSchema.index({ estado: 1, createdAt: -1 });

module.exports = mongoose.model('Postulacion', postulacionSchema, 'postulaciones');

