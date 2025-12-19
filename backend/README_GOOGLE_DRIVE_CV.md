# Subida de CV a Google Drive (OAuth)

Este proyecto sube CVs a Google Drive **solo con OAuth 2.0** (recomendado para **Gmail personal**). No se usa Service Account para CVs.

## 1) Crea credenciales OAuth en Google Cloud
- Habilita **Google Drive API**
- Crea un **OAuth Client ID** tipo **Web application**
- Authorized redirect URI:

`http://localhost:5000/api/drive/oauth2callback`

## 2) Configura el backend
En `backend/.env`:

```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/drive/oauth2callback
DRIVE_CV_FOLDER_ID=<ID de una carpeta en tu Drive>
```

## 3) Genera el refresh token
- Levanta el backend
- Abre en el navegador:

`http://localhost:5000/api/drive/auth`

- Acepta permisos
- Copia el `refresh_token` que te regresa el backend y agrégalo a `backend/.env`:

```
GOOGLE_OAUTH_REFRESH_TOKEN=...
```

Reinicia el backend.

## Notas
- Si al autorizar no recibes `refresh_token`, revoca el acceso de la app en tu cuenta Google (Seguridad → Acceso de terceros / Permisos) y vuelve a entrar a `http://localhost:5000/api/drive/auth`.
