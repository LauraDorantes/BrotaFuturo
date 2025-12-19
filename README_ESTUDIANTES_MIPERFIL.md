# README_ESTUDIANTES_MIPERFIL.md

Este documento explica cómo quedó conectada la sección **“Mi Perfil”** del alumno (frontend) con el backend.

## 1) Requisitos

- Backend corriendo (por defecto): `http://localhost:5000`
- Frontend abierto en navegador (por ejemplo con Live Server) apuntando al backend.
- Haber iniciado sesión/registrado un **Alumno** desde `login.html` (eso guarda tokens en `localStorage`).

## 2) Archivos involucrados

- Frontend:
  - `js/scripts_estudiante.js`
  - (Relacionado) `js/scripts_login.js` y `js/config.js` para el guardado de tokens.
- Backend:
  - `backend/routes/auth.js` (GET `/api/auth/me`, POST `/api/auth/refresh`)
  - `backend/routes/alumnos.js` (PUT `/api/alumnos/perfil`, POST `/api/alumnos/subirCV`, PUT `/api/alumnos/actualizarCV`)
  - `backend/controllers/alumnoController.js` (implementación de subir/actualizar CV y actualizarPerfil)

## 3) Autenticación y llaves en localStorage

La página del alumno usa:

- `accessToken` (JWT de acceso)
- `refreshToken` (JWT de refresco)

Estas llaves están definidas en `js/config.js` (objeto `STORAGE_KEYS`).

### Qué hace la página si no hay sesión

Al cargar `estudiante.html`, `js/scripts_estudiante.js` valida tokens:

- Si **no existe** `accessToken` **y** **no existe** `refreshToken` → redirige a `login.html`.

### Refresh automático del access token

- Si una petición responde **401** y existe `refreshToken`:
  - Se llama a `POST /api/auth/refresh` enviando `{ "token": "<refreshToken>" }`.
  - Si el refresh funciona, se actualiza `accessToken` en `localStorage`.
  - Se reintenta **una vez** la petición original.
  - Si falla el refresh, se limpia sesión y se redirige a `login.html`.

## 4) Obtener datos del perfil (GET /auth/me)

### Endpoint

- `GET /api/auth/me`

### Header requerido

- `Authorization: Bearer <accessToken>`

### Respuesta esperada

El backend devuelve:

```json
{
  "user": {
    "id": "...",
    "correo": "...",
    "role": "alumno",
    "nombres": "...",
    "apellidoPaterno": "...",
    "apellidoMaterno": "...",
    "boleta": 1234567890,
    "curp": "...",
    "telefono": 5512345678,
    "sexo": "Masculino",
    "carrera": "ISC",
    "creditos": 180,
    "cvID": "..." 
  }
}
```

### Qué hace el frontend con esos datos

- Muestra nombre/carrera/boleta en la cabecera de perfil.
- Rellena vista **solo lectura**.
- Rellena el **formulario de edición**.
- Si existe `cvID`, construye una liga de descarga:
  - `https://drive.google.com/uc?id=<cvID>`

## 5) Editar Perfil (PUT /alumnos/perfil)

### Endpoint

- `PUT /api/alumnos/perfil`

### Header requerido

- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

### Payload (JSON)

El frontend envía (en `scripts_estudiante.js`):

```json
{
  "nombres": "...",
  "apellidoPaterno": "...",
  "apellidoMaterno": "...",
  "telefono": 5512345678,
  "boleta": 1234567890,
  "sexo": "Masculino",
  "carrera": "ISC",
  "creditos": 180,
  "curp": "..."
}
```

Notas:
- `telefono`, `boleta` y `creditos` se envían como **número**.
- `sexo` debe ser `Masculino` o `Femenino`.
- `carrera` debe ser `ISC`, `IIA` o `LCD`.

### Respuesta del backend

El backend devuelve:

```json
{
  "message": "Perfil actualizado correctamente",
  "data": { "...": "..." }
}
```

El frontend ya está ajustado para leer `response.data` (y como fallback `response.user` si existiera).

## 6) Subir / Actualizar CV

### Campo multipart

- El backend espera el archivo con el nombre de campo: **`cvFile`**

### Endpoints

- Si el alumno **no tiene** CV (`currentUser.cvID` vacío):
  - `POST /api/alumnos/subirCV`
- Si el alumno **ya tiene** CV (`currentUser.cvID` existe):
  - `PUT /api/alumnos/actualizarCV`

### Headers

- `Authorization: Bearer <accessToken>`
- **No** se debe poner `Content-Type` manualmente en multipart; el navegador genera el boundary.

### Respuesta

El backend devuelve:

```json
{
  "message": "CV subido/actualizado correctamente",
  "data": {
    "cvID": "...",
    "cvURL": "https://drive.google.com/uc?id=..."
  }
}
```

El frontend usa `data.data.cvURL` para actualizar:
- La liga de descarga del CV.
- El texto “CV cargado”.
- El botón/label a “Actualizar CV”.

### Refresh durante upload

Si el upload responde **401**:
- Intenta refrescar el token y reintenta **una vez**.
- Si vuelve a dar 401, limpia sesión y redirige a `login.html`.

## 7) Cómo probar (checklist)

1. Inicia backend:
   - `cd backend`
   - `npm install`
   - `npm run dev` (o el comando que uses)
2. Abre `login.html`.
3. Registra o inicia sesión como **Alumno**.
4. Debe redirigir a `estudiante.html`.
5. En “Mi Perfil” valida:
   - Se cargan nombre/boleta/carrera.
6. Edita datos y guarda:
   - Debe mostrar mensaje de éxito.
   - Debe reflejar cambios en vista de solo lectura.
7. Sube un CV:
   - Debe aparecer enlace de descarga.
8. Vuelve a subir otro CV:
   - Debe usar actualizar y seguir mostrando enlace.

## 8) Notas técnicas

- `js/scripts_estudiante.js` define su propia constante `API_BASE_URL_ESTUDIANTE` para evitar choque si en algún momento se incluye `js/config.js` en `estudiante.html` (porque `config.js` también declara `API_BASE_URL`).
- Aun así, `scripts_estudiante.js` puede leer `STORAGE_KEYS` si `config.js` está cargado (para mantener consistencia de llaves en `localStorage`).
