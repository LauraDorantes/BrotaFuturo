# Sección de Estudiantes - BrotaFuturo

## Resumen de implementación

Este documento describe los cambios realizados para implementar la sección de estudiantes en BrotaFuturo.

---

## Cambios realizados

### Backend: nuevos módulos

#### 1) Modelos creados

**`backend/models/Postulacion.js`**
- Modelo para gestionar postulaciones de estudiantes a vacantes de servicio social.
- Campos principales: `alumno`, `vacante`, `estado` (`pendiente`, `aceptada`, `rechazada`), `mensaje`, `fechaRespuesta`, `comentariosRespuesta`.
- Índices optimizados por alumno, vacante y estado.

**`backend/models/Mensaje.js`**
- Modelo para comunicación entre usuarios.
- Campos principales: `remitente`, `destinatario`, `asunto`, `contenido`, `relacionadoCon`, `leido`, `fechaLeido`.
- Índices optimizados por destinatario, remitente y relaciones.

#### 2) Controladores creados

**`backend/controllers/postulacionController.js`**
- `crearPostulacion`
- `obtenerMisPostulaciones`
- `obtenerPostulacionPorId`
- `cancelarPostulacion`

**`backend/controllers/mensajeController.js`**
- `enviarMensaje`
- `obtenerMensajesRecibidos`
- `obtenerMensajesEnviados`
- `obtenerMensajePorId`
- `marcarComoLeido`
- `eliminarMensaje`

**`backend/controllers/alumnoController.js` (modificado)**
- Nueva función `actualizarPerfil` para actualizar información personal.
- Campos actualizables: nombres, apellidoPaterno, apellidoMaterno, telefono, sexo, carrera, creditos.
- Campos protegidos: boleta, CURP, correo, password, cvID.

#### 3) Rutas creadas o modificadas

**`backend/routes/postulaciones.js` (nuevo)**
- `POST /api/postulaciones`
- `GET /api/postulaciones/mis-postulaciones`
- `GET /api/postulaciones/:postulacionId`
- `DELETE /api/postulaciones/:postulacionId`

**`backend/routes/mensajes.js` (nuevo)**
- `POST /api/mensajes`
- `GET /api/mensajes/recibidos`
- `GET /api/mensajes/enviados`
- `GET /api/mensajes/:mensajeId`
- `PUT /api/mensajes/:mensajeId/leido`
- `DELETE /api/mensajes/:mensajeId`

**`backend/routes/alumnos.js` (modificado)**
- Nueva ruta `PUT /api/alumnos/perfil`.

**`backend/index.js` (modificado)**
- Rutas agregadas: `app.use('/api/postulaciones', postulacionesRoutes);` y `app.use('/api/mensajes', mensajesRoutes);`

---

### Frontend: nueva interfaz

#### 1) Página principal

**`estudiante.html` (nuevo)**
- Estructura: navegación lateral, topbar con buscador y avatar, y secciones Mi Perfil, Vacantes Disponibles, Mis Postulaciones y Mensajes.
- Modales: postulación a vacante, nuevo mensaje y detalle de postulación.

#### 2) Estilos

**`css/styles_estudiante.css` (nuevo)**
- Basado en `styles_prof.css` para consistencia visual.
- Estilos para CV, tarjetas de vacantes y postulaciones, mensajería, modales y diseño responsive.

#### 3) Funcionalidad JavaScript

**`js/scripts_estudiante.js` (nuevo)**
- Utilidades y autenticación: `fetchAPI`, `refreshAuthToken`, manejo de errores.
- Gestión de perfil: `cargarPerfil`, `mostrarPerfil`, `subirCV`, actualización con validación.
- Gestión de vacantes: `cargarVacantes`, `crearCardVacante`, `filtrarVacantes`, `abrirModalPostulacion`.
- Gestión de postulaciones: `cargarPostulaciones`, `crearCardPostulacion`, `crearPostulacion`, `cancelarPostulacion`, `mostrarDetallePostulacion`.
- Sistema de mensajería: `cargarMensajesRecibidos`, `cargarMensajesEnviados`, `enviarMensaje`, `mostrarDetalleMensaje`, tabs de navegación.
- Búsqueda global en vacantes, postulaciones y mensajes.

---

## Correcciones realizadas

1. Endpoint de actualización de perfil
   - Agregado `PUT /api/alumnos/perfil` en rutas y controlador.
   - Validación de campos permitidos y formatos.
   - Integración en el frontend.

2. Botón de guardar en perfil
   - Ajuste de estilo (`btn-primary`) y funcionalidad completa.

3. Modal de nuevo mensaje
   - Formato organizado, labels y placeholders claros, texto de ayuda.

4. Buscador global
   - Funcionalidad en topbar con búsqueda contextual en vacantes, postulaciones y mensajes.

---

## Archivos nuevos

```
backend/
├── models/
│   ├── Postulacion.js
│   └── Mensaje.js
├── controllers/
│   ├── postulacionController.js
│   └── mensajeController.js
└── routes/
    ├── postulaciones.js
    └── mensajes.js

frontend/
├── estudiante.html
├── css/
│   └── styles_estudiante.css
└── js/
    └── scripts_estudiante.js
```

## Archivos modificados

```
backend/
├── controllers/
│   └── alumnoController.js     (agregado actualizarPerfil)
├── routes/
│   └── alumnos.js              (agregada ruta /perfil)
└── index.js                    (agregadas rutas nuevas)
```

---

## Pendientes de implementación

### Prioridad alta

1. Sistema de verificación ESCOM (boleta o correo institucional `@alumno.ipn.mx`).
2. Gestión de postulaciones para profesores/empresas (ver, aceptar/rechazar, comentarios).
3. Notificaciones en tiempo real (postulaciones, mensajes, nuevas vacantes relevantes).

### Prioridad media

4. Dashboard para empresas/instituciones (gestión de vacantes y postulaciones recibidas).
5. Filtros avanzados en vacantes (carrera, créditos, modalidad, rango de fechas).
6. Estadísticas y reportes (gráficos y actividad).
7. Adjuntos en mensajes.

### Prioridad baja o mejoras futuras

8. Búsqueda avanzada (semántica y filtros múltiples, búsquedas favoritas).
9. Sistema de favoritos para vacantes.
10. Perfil público del estudiante (CV y habilidades).
11. Calificaciones y reseñas posteriores al servicio social.
12. Exportar datos (PDF y reportes).

---

## Endpoints disponibles para estudiantes

### Autenticación
- `POST /api/auth/alumno/register`
- `POST /api/auth/alumno/login`
- `GET /api/auth/me`
- `PUT /api/auth/password`
- `POST /api/auth/refresh`

### Perfil y CV
- `PUT /api/alumnos/perfil`
- `POST /api/alumnos/subirCV`
- `PUT /api/alumnos/actualizarCV`

### Vacantes
- `GET /api/vacantes`

### Postulaciones
- `POST /api/postulaciones`
- `GET /api/postulaciones/mis-postulaciones?estado={estado}`
- `GET /api/postulaciones/:postulacionId`
- `DELETE /api/postulaciones/:postulacionId`

### Mensajes
- `POST /api/mensajes`
- `GET /api/mensajes/recibidos?leido={true|false}&limit={num}&skip={num}`
- `GET /api/mensajes/enviados?limit={num}&skip={num}`
- `GET /api/mensajes/:mensajeId`
- `PUT /api/mensajes/:mensajeId/leido`
- `DELETE /api/mensajes/:mensajeId`

---

## Seguridad y validaciones

### Implementadas
- Autenticación JWT para todas las operaciones.
- Validación de roles (los estudiantes solo crean sus propias postulaciones).
- Validación de permisos (solo el dueño puede ver o cancelar sus postulaciones).
- Validación de ObjectIds en rutas.
- Validación de campos en actualización de perfil.
- Validación de formatos de archivo para CV (PDF, DOC, DOCX).
- Validación de tamaño de archivo (máximo 5MB).

### Pendientes
- Rate limiting para prevenir spam.
- Validación de correo institucional en registro.
- Verificación de pertenencia a ESCOM.

---

## Características de la interfaz

### Diseño
- Interfaz responsive (móvil, tablet, desktop).
- Diseño consistente con la sección de profesores.
- Modales para formularios y detalles.
- Feedback visual de éxito y error.
- Estados de carga.

### Experiencia de usuario
- Navegación intuitiva entre secciones.
- Filtros y búsqueda en tiempo real.
- Confirmaciones para acciones destructivas.
- Formularios con validación.

---

## Testing sugerido

### Casos de prueba recomendados

1. Perfil
   - [ ] Actualizar información personal
   - [ ] Subir CV
   - [ ] Actualizar CV existente
   - [ ] Validar campos requeridos

2. Vacantes
   - [ ] Cargar lista de vacantes
   - [ ] Filtrar por tipo
   - [ ] Buscar por texto
   - [ ] Ver detalles de vacante

3. Postulaciones
   - [ ] Crear postulación
   - [ ] Ver lista de postulaciones
   - [ ] Filtrar por estado
   - [ ] Ver detalle de postulación
   - [ ] Cancelar postulación pendiente
   - [ ] Intentar postularse dos veces a la misma vacante (debe fallar)

4. Mensajes
   - [ ] Enviar mensaje
   - [ ] Ver mensajes recibidos
   - [ ] Ver mensajes enviados
   - [ ] Marcar como leído
   - [ ] Enviar mensaje relacionado con vacante
   - [ ] Eliminar mensaje

5. Búsqueda
   - [ ] Buscar en vacantes
   - [ ] Buscar en postulaciones
   - [ ] Buscar en mensajes

---

## Documentación de código

### Comentarios y JSDoc

Todos los archivos incluyen:
- Comentarios JSDoc en funciones principales.
- Descripción de parámetros y retornos.
- Comentarios en secciones complejas.
- Documentación de endpoints en rutas.

---

## Problemas conocidos

1. Carga de CV
   - Requiere credenciales de Google Drive configuradas.
   - Verificar que exista `credenciales-google.json` en el backend.

2. Búsqueda
   - Búsqueda sensible a mayúsculas en algunos casos.
   - No hay búsqueda avanzada con múltiples criterios.

---

## Soporte

Para dudas sobre la implementación, revisar:
- Comentarios en el código
- Este README
- Modelos de datos

---

## Historial de cambios

### Versión 1.0 (implementación inicial)
- Backend completo para postulaciones y mensajes.
- Frontend completo para estudiantes.
- Sistema de perfil y CV.
- Búsqueda y filtros básicos.

---

Última actualización: diciembre 2024

