# Conexión Frontend ↔ Backend (Registro/Login Profesor)

Fecha: 15/12/2025

Este documento describe los cambios realizados para conectar el **registro de profesores** del frontend con el backend usando los endpoints de autenticación.

## Objetivo

- Conectar el formulario de **Registro de Profesor** en `login.html` con el backend:
  - `POST /api/auth/profesor/register`
- Conectar el formulario de **Login** (en `login.html`) con el backend cuando se seleccione **Profesor**:
  - `POST /api/auth/profesor/login`
- Enviar el payload con los nombres de campos que el backend/modelo `Profesor` espera.
- Guardar tokens JWT en `localStorage` y redirigir al rol correspondiente.

## Endpoint utilizado

Backend:

- `POST /api/auth/profesor/register`
  - URL completa en dev (según `js/config.js`):
    - `http://localhost:5000/api/auth/profesor/register`

- `POST /api/auth/profesor/login`
  - URL completa en dev (según `js/config.js`):
    - `http://localhost:5000/api/auth/profesor/login`

Body JSON esperado:

```json
{"correo":"profe@ipn.mx","password":"MiPass#123"}
```

### Payload esperado (backend)

El backend (`backend/controllers/authController.js`) recibe `{ correo, password, ...rest }` y crea el documento en el modelo `Profesor`.

El modelo `Profesor` requiere:
- `nombres`
- `apellidoPaterno`
- `apellidoMaterno`
- `correo`
- `password` (encriptado en backend)
- `departamento`
- `rfc`
- `curp`
- `telefono`
- `sexo` (`Masculino` | `Femenino`)

Ejemplo de body JSON:

```json
{
  "correo": "profe@ipn.mx",
  "password": "MiPass#123",
  "nombres": "Juan",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "López",
  "departamento": "Departamento de Formación Básica",
  "rfc": "PEPJ8001019Q8",
  "curp": "PEPJ800101HDFRRN09",
  "telefono": 5512345678,
  "sexo": "Masculino"
}
```

## Cambios realizados

### 1) [js/scripts_login.js](js/scripts_login.js)

Se habilitó el registro real de profesores desde el modal de confirmación:

- Se agregó `normalizeProfesorPayload(formulario)` para transformar datos del formulario al formato esperado por el backend.
  - Mapeos clave:
    - `name="nombre"` → `nombres`
    - `name="contrasena"` → `password`
    - `name="carrera"` (frontend) → `departamento` (backend)
      - Se usa primero el **texto** del option seleccionado (más descriptivo) y si no existe, el value.
- Se actualizó `enviarFormulario(tipo, formulario)`:
  - Si `tipo === 'Profesor'` hace `POST` a `AUTH_ENDPOINTS.REGISTER_PROFESOR`.
  - Valida requisitos mínimos antes de llamar al backend:
    - sexo válido
    - departamento seleccionado
    - correo y contraseña
    - nombre y apellidos
  - Guarda tokens/usuario en `localStorage` usando `STORAGE_KEYS`.
  - Redirige usando `REDIRECT_PAGES` (profesor → `profesor.html`).
- Se agregó manejo de error específico:
  - Si falla el registro de profesor, muestra el mensaje en `#mensaje_errorProfe`.

Notas:
- En esta entrega se conectó **registro y login de profesor**.

## Workflow de implementación (resumen)

1. Verificación de campos requeridos en `backend/models/Profesor.js`.
2. Verificación del endpoint en `backend/routes/auth.js` y base path `app.use('/api/auth', ...)`.
3. Revisión del formulario de profesor en `login.html` para confirmar `name` de inputs.
4. Implementación de mapeo y POST real en `scripts_login.js`.
5. Agregado de manejo de errores en el modal.

## Cómo probar (manual)

1. Levanta el backend:
   - `cd backend`
   - `npm.cmd install`
   - Configura `.env` con:
     - `PORT=5000`
     - `MONGO_URI=...`
     - `JWT_SECRET=...`
     - `JWT_REFRESH_SECRET=...`
   - `npm.cmd start`
2. Abre `login.html`.
3. Selecciona tipo de usuario: **Profesor**.
4. Llena el formulario y presiona **Enviar**.
5. En el modal, presiona **Confirmar y Enviar**.
   - Si todo sale bien: se guardan tokens en `localStorage` y redirige a `profesor.html`.

### Probar login de profesor

1. En `login.html`, selecciona tipo de usuario: **Profesor**.
2. Ingresa correo/contraseña y presiona **Iniciar Sesión**.
3. Si todo sale bien: se guardan tokens en `localStorage` y redirige a `profesor.html`.

## Errores comunes

- `409 El correo ya está registrado`: el correo ya existe en el sistema (se valida de forma global en backend).
- `400`: campos faltantes o inválidos (por ejemplo, no seleccionar sexo/departamento).
- `401`: no aplica al registro; suele ser de login.
