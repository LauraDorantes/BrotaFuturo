const mongoose = require('mongoose');

/**
 * Modelo de Mensaje
 * Representa un mensaje entre usuarios del sistema (estudiantes, profesores, instituciones)
 * 
 * Campos:
 * - remitente: ID y tipo del usuario que envía el mensaje (requerido)
 * - destinatario: ID y tipo del usuario que recibe el mensaje (requerido)
 * - asunto: Asunto del mensaje (requerido)
 * - contenido: Contenido del mensaje (requerido)
 * - relacionadoCon: Referencia opcional a una vacante o postulación relacionada
 * - leido: Indica si el mensaje ha sido leído (por defecto false)
 * - fechaLeido: Fecha en que se leyó el mensaje (opcional)
 */
const mensajeSchema = new mongoose.Schema({
    remitente: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        tipo: {
            type: String,
            enum: ['Alumno', 'Profesor', 'Institucion'],
            required: true,
        },
        nombre: {
            type: String,
            required: true,
        }
    },
    destinatario: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        tipo: {
            type: String,
            enum: ['Alumno', 'Profesor', 'Institucion'],
            required: true,
        },
        nombre: {
            type: String,
            required: true,
        }
    },
    asunto: {
        type: String,
        required: true,
        trim: true,
    },
    contenido: {
        type: String,
        required: true,
        trim: true,
    },
    relacionadoCon: {
        tipo: {
            type: String,
            enum: ['Vacante', 'Postulacion', null],
            default: null,
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        }
    },
    leido: {
        type: Boolean,
        default: false,
    },
    fechaLeido: {
        type: Date,
        default: null,
    }
}, { timestamps: true });

// Índices para optimizar consultas
// Índice para buscar mensajes por destinatario (bandeja de entrada)
mensajeSchema.index({ 'destinatario.id': 1, leido: 1, createdAt: -1 });
// Índice para buscar mensajes por remitente (enviados)
mensajeSchema.index({ 'remitente.id': 1, createdAt: -1 });
// Índice para conversaciones entre dos usuarios
mensajeSchema.index({ 'remitente.id': 1, 'destinatario.id': 1, createdAt: -1 });
// Índice para mensajes relacionados con vacantes/postulaciones
mensajeSchema.index({ 'relacionadoCon.tipo': 1, 'relacionadoCon.id': 1 });

module.exports = mongoose.model('Mensaje', mensajeSchema, 'mensajes');

