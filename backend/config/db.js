/*
Configuracion de la base de datos usando Mongoose y variables de entorno con dotenv.
Exporta una funcion que conecta a MongoDB usando la URI definida en las variables de entorno. 
*/
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = connectDB;