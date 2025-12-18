const express = require('express');
const { google } = require('googleapis');

const router = express.Router();

const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getOAuthClientFromEnv() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:5000/api/drive/oauth2callback';

    if (!clientId || !clientSecret) {
        return null;
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// 1) Abre esta URL para autorizar la cuenta de Google (Gmail personal)
router.get('/auth', (req, res) => {
    const oAuth2Client = getOAuthClientFromEnv();
    if (!oAuth2Client) {
        return res.status(400).json({
            message: 'Faltan variables GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en backend/.env',
            required: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'],
        });
    }

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
    });

    return res.redirect(authUrl);
});

// 2) Callback: Google redirige aquí con ?code=...
router.get('/oauth2callback', async (req, res) => {
    const oAuth2Client = getOAuthClientFromEnv();
    if (!oAuth2Client) {
        return res.status(400).json({
            message: 'Faltan variables GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en backend/.env',
        });
    }

    const code = req.query.code;
    if (!code) {
        return res.status(400).json({ message: 'Falta el parámetro code en el callback' });
    }

    try {
        const { tokens } = await oAuth2Client.getToken(code);

        if (!tokens.refresh_token) {
            return res.status(400).json({
                message: 'No se recibió refresh_token. Borra el permiso de la app en tu cuenta Google y vuelve a intentar (o usa prompt=consent).',
            });
        }

        return res.json({
            message: 'Copia este refresh_token a backend/.env como GOOGLE_OAUTH_REFRESH_TOKEN y reinicia el backend.',
            refresh_token: tokens.refresh_token,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Error intercambiando code por tokens', error: err?.message || err });
    }
});

module.exports = router;
