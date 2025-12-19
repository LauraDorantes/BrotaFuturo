const mongoose = require('mongoose');

/*
    Middleware para validar ObjectID de MongoDB en rutas.
    Valida que el ID proporcionado en los parámetros de la ruta es un ObjectID válido.
    Si no es válido o no se encuentra, responde con error 400 o 404 respectivamente.
    @param {String} paramName - Nombre del parámetro en la ruta que contiene el ID.
    @param {Object} model - Modelo Mongoose correspondiente al ID.
    @param {String} modelName - Nombre legible del modelo para mensajes de error.
    @returns {Function} - Middleware que valida el ID y carga el recurso en req.paramName.
*/
exports.validarObjectId = (paramName, model, modelName = 'Element') => {
    return async (req, res, next) => {
        const id = req.params[paramName];

        // Checa si el ID es un ObjectID válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: `${modelName} no válido` });
        }

        // Checa si el ID existe en la base de datos
        try {
            const item = await model.findById(id);
            if (!item) {
                return res.status(404).json({ message: `${modelName} no encontrado` });
            }

            // Guarda el ítem encontrado en req.paramNameData para uso posterior
            req[paramName + 'Data'] = item;

            next();
        } catch (error) {
            console.error(`Error validando ${modelName} ID:`, error);
            return res.status(500).json({ message: `Error validando ${modelName} ID`, error });
        }
    }
}