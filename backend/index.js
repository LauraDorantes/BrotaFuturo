const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Rutas
const authRoutes = require('./routes/auth');
const alumnosRoutes = require('./routes/alumnos');
const vacantesRoutes = require('./routes/vacantes');

// Cargar variables de entorno
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API de BrotaFuturo funcionando');
});

// Importar rutas
app.use('/api/auth', authRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/vacantes', vacantesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});