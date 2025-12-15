# Conexión Frontend ↔ Backend (Login/Registro Alumno)

Fecha: 15/12/2025

Este documento describe los cambios realizados para conectar el **frontend** con el **backend** en el flujo de **registro** y **login** de **alumnos**, utilizando los endpoints definidos en `backend/routes/auth.js`.

## Objetivo

- Conectar `login.html` + `js/scripts_login.js` con el backend (`/api/auth/...`) para:
  - Registrar alumnos: `POST /api/auth/alumno/register`
  - Iniciar sesión alumnos: `POST /api/auth/alumno/login`
- Guardar tokens JWT en `localStorage` y redirigir al alumno autenticado.

## Endpoints implementados

Backend (ver `backend/routes/auth.js` y `backend/controllers/authController.js`):

- `POST /api/auth/alumno/register`
  - Body JSON esperado:
    ```json
    {
      "correo": "...",
      "password": "...",
      "nombres": "...",
      "apellidoPaterno": "...",
      "apellidoMaterno": "...",
      "boleta": 1234567890,
      "curp": "...",
      "telefono": 5512345678,
      "sexo": "Masculino",
      "creditos": 120,
      "carrera": "ISC"
    }
    ```
  - Respuesta JSON (ejemplo):
    ```json
    {
      "user": {"id":"...","correo":"...","role":"alumno"},
      "accessToken":"...",
      "refreshToken":"..."
    }
    ```

- `POST /api/auth/alumno/login`
  - Body JSON esperado:
    ```json
    {"correo":"...","password":"..."}
    ```
  - Respuesta JSON: igual que `register`.

## Cambios realizados (archivos)

### 1) [login.html](login.html)

- Se agregó `id="formLogin"` al formulario de inicio de sesión.
- Se agregaron `id`/`name` a los inputs de login:
  - `name="correo"` + `id="loginCorreo"`
  - `name="password"` + `id="loginPassword"`
- Se cambió el input de contraseña a `type="password"`.
- Se agregó un contenedor para errores: `#loginError`.
- Se cargó `js/config.js` antes de `js/scripts_login.js`.
- Se ajustaron valores del select `sexo` para que coincidan con el enum del backend:
  - `Masculino` / `Femenino`

### 2) [js/scripts_login.js](js/scripts_login.js)

Se implementó la integración real con el backend:

- **Login Alumno**
  - `fetch` a `AUTH_ENDPOINTS.LOGIN_ALUMNO`.
  - Guardado en `localStorage`:
    - `STORAGE_KEYS.ACCESS_TOKEN`
    - `STORAGE_KEYS.REFRESH_TOKEN`
    - `STORAGE_KEYS.USER_ROLE`
    - `STORAGE_KEYS.USER_ID`
    - `STORAGE_KEYS.USER_EMAIL`
  - Redirección por rol con `REDIRECT_PAGES` (alumno → `estudiante.html`).

- **Registro Alumno (desde el modal de confirmación)**
  - Se reemplazó la “simulación” de `enviarFormulario()` por un POST real a `AUTH_ENDPOINTS.REGISTER_ALUMNO`.
  - Se agregó mapeo de campos del formulario al payload esperado por el backend:
    - `nombre` (frontend) → `nombres` (backend)
    - `contrasena` (frontend) → `password` (backend)
  - Normalización:
    - `curp` se envía en mayúsculas.
    - `boleta`, `telefono`, `creditos` se envían como números.

- **Manejo de errores**
  - Login: muestra mensaje en `#loginError`.
  - Registro alumno: muestra mensaje en `#mensaje_errorAlumno`.

Nota: en esta entrega solo se conectó **Alumno** (tal como se solicitó). Para Profesor/Institución los formularios y modelos requieren mapeo adicional.

## Workflow de implementación (resumen)

1. Inspección del backend para confirmar:
   - URL base: `app.use('/api/auth', authRoutes)` en `backend/index.js`
   - Campos esperados en `authController.register/login`
   - Campos reales del modelo `Alumno` (`nombres`, enum de `sexo`, etc.)
2. Ajuste del HTML para que el login tenga `name/id` y se pueda capturar el submit.
3. Implementación de helpers en `scripts_login.js`:
   - `postJson()`, `saveAuthToStorage()`, `redirectAfterAuth()`
4. Sustitución del envío simulado por `fetch` real.
5. Verificación rápida de errores de sintaxis en los archivos modificados.

## Cómo probar (manual)

1. Levantar backend:
   - En `backend/`:
     - `npm install`
     - Configura variables en `.env` (mínimo):
       - `PORT=5000`
       - `JWT_SECRET=...`
       - `JWT_REFRESH_SECRET=...`
       - `MONGO_URI=...`
     - `npm start` (o el script que use tu `package.json`)
2. Abrir `login.html`.
3. Seleccionar usuario **Alumno**.
4. Probar registro:
   - Completa el formulario y confirma en el modal.
   - Debe crear el usuario y redirigir a `estudiante.html`.
5. Probar login:
   - Ingresa correo/contraseña.
   - Debe guardar tokens en `localStorage` y redirigir.

## Notas técnicas

- El backend tiene `cors()` habilitado en `backend/index.js`, lo que permite el consumo desde el frontend durante desarrollo.
- Si el backend responde `409`, típicamente es correo duplicado (`El correo ya está registrado`).
- Si el backend responde `401`, son credenciales inválidas.
