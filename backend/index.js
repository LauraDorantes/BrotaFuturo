const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Rutas
const authRoutes = require('./routes/auth');
const alumnosRoutes = require('./routes/alumnos');
const vacantesRoutes = require('./routes/vacantes');
// Nuevas rutas para estudiantes
const postulacionesRoutes = require('./routes/postulaciones');
const mensajesRoutes = require('./routes/mensajes');
const driveRoutes = require('./routes/drive');
const profesorRoutes = require('./routes/profesor');
const institucionRoutes = require('./routes/institucion');

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
// Nuevas rutas para estudiantes
app.use('/api/postulaciones', postulacionesRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/profesor', profesorRoutes);
app.use('/api/institucion', institucionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});