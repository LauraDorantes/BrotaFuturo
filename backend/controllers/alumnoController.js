const { google } = require('googleapis');
const stream = require('stream');
const path = require('path');
const Alumno = require('../models/Alumno');

// Configuración de Google Drive API (Para subir CVs)
// Solo OAuth 2.0 (Gmail personal): usar GOOGLE_OAUTH_* en backend/.env
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function buildDriveAuth() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

    if (!clientId || !clientSecret || !refreshToken || !redirectUri) {
        throw new Error(
            'Faltan variables de OAuth para Google Drive. Requiere: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN, GOOGLE_OAUTH_REDIRECT_URI.'
        );
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    return oAuth2Client;
}

function getDriveClient() {
    const auth = buildDriveAuth();
    return google.drive({ version: 'v3', auth });
}

// Carpeta destino para CVs (recomendado: carpeta dentro de un Shared Drive)
// Configurar en backend/.env: DRIVE_CV_FOLDER_ID="<folderId>"
const CV_FOLDER_ID = process.env.DRIVE_CV_FOLDER_ID;

// Funcion para subir CVs
async function subirADrive(file, alumno, req){
    if (!CV_FOLDER_ID) {
        throw new Error('Falta DRIVE_CV_FOLDER_ID en backend/.env (ID de la carpeta destino en Google Drive).');
    }
    const drive = getDriveClient();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const { data } = await drive.files.create({
        supportsAllDrives: true,
        media: {
            mimeType: file.mimetype,
            body: bufferStream,
        },
        requestBody: {
            name: `cv-${alumno.boleta}${path.extname(req.file.originalname)}`,
            parents: [CV_FOLDER_ID], // Carpeta destino en Google Drive / Shared Drive
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
        const driveMessage = error?.response?.data?.error?.message || error?.message;
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
                const drive = getDriveClient();
                await drive.files.delete({ fileId: alumno.cvID, supportsAllDrives: true });
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
        const driveMessage = error?.response?.data?.error?.message || error?.message;
        return res.status(500).json({ message: 'Error al actualizar el CV', error });
    }
};

/*
    actualizarPerfil
    Endpoint para que un estudiante actualice su información personal.
    @param {Object} req.body - Datos a actualizar (nombres, apellidoPaterno, apellidoMaterno, telefono, boleta, sexo, carrera, creditos, curp)
    @param {String} req.user - Usuario autenticado (alumno) dado por el middleware de autenticación
    @return {Object} - Datos del alumno actualizados o error en caso de fallo.
*/
exports.actualizarPerfil = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.user.id);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        // Actualizar los campos
        alumno.nombres = req.body.nombres || alumno.nombres;
        alumno.apellidoPaterno = req.body.apellidoPaterno || alumno.apellidoPaterno;
        alumno.apellidoMaterno = req.body.apellidoMaterno || alumno.apellidoMaterno;
        alumno.telefono = req.body.telefono || alumno.telefono;
        alumno.sexo = req.body.sexo || alumno.sexo;
        alumno.carrera = req.body.carrera || alumno.carrera;
        alumno.creditos = req.body.creditos || alumno.creditos;
        // Verificar unicidad de boleta, curp y telefono si se actualizan
        if (req.body.boleta && req.body.boleta !== alumno.boleta) {
            const boletaExistente = await Alumno.findOne({ boleta: req.body.boleta });
            if (boletaExistente) {
                return res.status(400).json({ message: 'La boleta ya está en uso por otro alumno' });
            }
            alumno.boleta = req.body.boleta;
        }
        if (req.body.curp && req.body.curp !== alumno.curp) {
            const curpExistente = await Alumno.findOne({ curp: req.body.curp });
            if (curpExistente) {
                return res.status(400).json({ message: 'La CURP ya está en uso por otro alumno' });
            }
            alumno.curp = req.body.curp;
        }
        if (req.body.telefono && req.body.telefono !== alumno.telefono) {
            const telefonoExistente = await Alumno.findOne({ telefono: req.body.telefono });
            if (telefonoExistente) {
                return res.status(400).json({ message: 'El teléfono ya está en uso por otro alumno' });
            }
            alumno.telefono = req.body.telefono;
        } 
        await alumno.save();
        return res.json({ message: 'Perfil actualizado correctamente', data: alumno });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        return res.status(500).json({ message: 'Error al actualizar el perfil', error });
    }
};