const { google } = require('googleapis');
const stream = require('stream');
const path = require('path');
const Alumno = require('../models/Alumno');

// Configuración de Google Drive API (Para subir CVs)
const KEYFILEPATH = path.join(__dirname, '../credenciales-google.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});
const drive = google.drive({ version: 'v3', auth });

// Funcion para subir CVs
async function subirADrive(file, alumno, req){
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const { data } = await drive.files.create({
        media: {
            mimeType: file.mimetype,
            body: bufferStream,
        },
        requestBody: {
            name: `cv-${alumno.boleta}${path.extname(req.file.originalname)}`,
            parents: ['1jFxeX3MDK510qOP_8WjvNWjlup6eDIDQ'], // Carpeta específica en Google Drive
        },
        fields: 'id',
    });

    return data.id;
};

// Endpoints de gestión de alumnos
/*
    subirCV
    Endpoint para que un alumno suba Su currículum vitae (CV).
    @param {Object} req.body - Datos del CV a subir o actualizar
    @param {String} req.user - Usuario autenticado (alumno) dado por el middleware de autenticación
    @return {Object} - Datos del alumno con el CV actualizado o error en caso de fallo.
*/
exports.subirCV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha proporcionado ningún archivo' });
        }
        const alumno = await Alumno.findById(req.user.id);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        // Subir y guardar el CV a Google Drive
        alumno.cvID = await subirADrive(req.file, alumno, req);
        
        await alumno.save();
        return res.json({ message: 'CV subido/actualizado correctamente', data: { cvID: alumno.cvID, cvURL: `https://drive.google.com/uc?id=${alumno.cvID}` } });
    } catch (error) {
        console.error('Error subiendo CV:', error);
        return res.status(500).json({ message: 'Error al subir el CV', error });
    }
};

/*
    actualizarCV
    Endpoint para que un alumno actualice su CV en Google Drive y guarde el nuevo enlace en su perfil.
    @param {Object} req.body - Datos del CV a actualizar
    @param {String} req.user - Usuario autenticado (alumno) dado por el middleware de autenticación
    @return {Object} - Datos del alumno con el CV actualizado o error en caso de fallo.
*/
exports.actualizarCV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha proporcionado ningún archivo' });
        }
        const alumno = await Alumno.findById(req.user.id);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }

        // Verificar si el alumno ya tiene un CV y eliminarlo de Google Drive
        if (alumno.cvID) {
            try {
                await drive.files.delete({ fileId: alumno.cvID });
            } catch (err) {
                console.warn('No se pudo eliminar el CV anterior de Google Drive:', err);
            }
        }
        // Subir y guardar el nuevo CV a Google Drive
        alumno.cvID = await subirADrive(req.file, alumno, req);

        await alumno.save();
        return res.json({ message: 'CV actualizado correctamente', data: { cvID: alumno.cvID, cvURL: `https://drive.google.com/uc?id=${alumno.cvID}` } });
    } catch (error) {
        console.error('Error actualizando CV:', error);
        return res.status(500).json({ message: 'Error al actualizar el CV', error });
    }
};