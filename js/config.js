/**
 * Configuración de la aplicación
 * Este archivo contiene la configuración global de URLs y constantes
 */

// URL base de la API
// Cambiar esta URL según el entorno (desarrollo, producción, etc.)
const API_BASE_URL = 'http://localhost:5000/api';

// Rutas de autenticación
const AUTH_ENDPOINTS = {
    LOGIN_ALUMNO: `${API_BASE_URL}/auth/alumno/login`,
    LOGIN_PROFESOR: `${API_BASE_URL}/auth/profesor/login`,
    LOGIN_INSTITUCION: `${API_BASE_URL}/auth/institucion/login`,
    
    REGISTER_ALUMNO: `${API_BASE_URL}/auth/alumno/register`,
    REGISTER_PROFESOR: `${API_BASE_URL}/auth/profesor/register`,
    REGISTER_INSTITUCION: `${API_BASE_URL}/auth/institucion/register`,
    
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
    GET_USER: `${API_BASE_URL}/auth/me`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/password`,
};

// Rutas de estudiantes
const STUDENT_ENDPOINTS = {
    GET_STUDENTS: `${API_BASE_URL}/alumnos`,
    GET_STUDENT: `${API_BASE_URL}/alumnos/:id`,
    UPDATE_STUDENT: `${API_BASE_URL}/alumnos/:id`,
    DELETE_STUDENT: `${API_BASE_URL}/alumnos/:id`,
};

// Rutas de vacantes
const VACANCY_ENDPOINTS = {
    GET_VACANCIES: `${API_BASE_URL}/vacantes`,
    GET_VACANCY: `${API_BASE_URL}/vacantes/:id`,
    CREATE_VACANCY: `${API_BASE_URL}/vacantes`,
    UPDATE_VACANCY: `${API_BASE_URL}/vacantes/:id`,
    DELETE_VACANCY: `${API_BASE_URL}/vacantes/:id`,
};

// Rutas de postulaciones
const APPLICATION_ENDPOINTS = {
    GET_APPLICATIONS: `${API_BASE_URL}/postulaciones`,
    GET_APPLICATION: `${API_BASE_URL}/postulaciones/:id`,
    CREATE_APPLICATION: `${API_BASE_URL}/postulaciones`,
    UPDATE_APPLICATION: `${API_BASE_URL}/postulaciones/:id`,
    DELETE_APPLICATION: `${API_BASE_URL}/postulaciones/:id`,
};

// Rutas de mensajes
const MESSAGE_ENDPOINTS = {
    GET_MESSAGES: `${API_BASE_URL}/mensajes`,
    GET_MESSAGE: `${API_BASE_URL}/mensajes/:id`,
    CREATE_MESSAGE: `${API_BASE_URL}/mensajes`,
    UPDATE_MESSAGE: `${API_BASE_URL}/mensajes/:id`,
    DELETE_MESSAGE: `${API_BASE_URL}/mensajes/:id`,
};

// Páginas de redirección después del login
const REDIRECT_PAGES = {
    alumno: 'estudiante.html',
    profesor: 'profesor.html',
    institucion: 'institucion.html',
};

// Tiempos de expiración
const TIMEOUTS = {
    ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutos en milisegundos
    REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
};

// Claves de localStorage
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_ROLE: 'userRole',
    USER_ID: 'userId',
    USER_EMAIL: 'userEmail',
};
