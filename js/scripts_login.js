const contenedor = document.getElementById('contenedor');
const registroBtn = document.getElementById('registro');
const accederBtn = document.getElementById('acceder');

// Función para seleccionar tipo de usuario
function tipoUsuario(type) {
    document.getElementById('selected-user-type').textContent = type;
    
    if (type === "Alumno") {
        mostrarRegistroForm();
        mostrarFormularioAlumno();
    } else if (type === "Profesor") {
        mostrarRegistroForm();
        mostrarFormularioProfesor();
    } else {
        mostrarInicioSesion();
    }
}

// Función para mostrar solo el formulario de alumno
function mostrarFormularioAlumno() {
    const alumnoForm = document.getElementById("registroForm");
    const profeForm = document.getElementById("registroProfe");
    
    // Remover activo de ambos
    alumnoForm.classList.remove("activo");
    profeForm.classList.remove("activo");
    
    // Activar solo el formulario de alumno
    alumnoForm.classList.add("activo");
    document.getElementById('selected-user-type').textContent = "Alumno";
}

// Función para mostrar solo el formulario de profesor
function mostrarFormularioProfesor() {
    const alumnoForm = document.getElementById("registroForm");
    const profeForm = document.getElementById("registroProfe");
    
    // Remover activo de ambos
    alumnoForm.classList.remove("activo");
    profeForm.classList.remove("activo");
    
    // Activar solo el formulario de profesor
    profeForm.classList.add("activo");
    document.getElementById('selected-user-type').textContent = "Profesor";
}

function confirmarAlumno() {
    event.preventDefault();
    validarYConfirmar('Alumno', 'formularioAlumno', 'confirmacionAlumno', 'datosAlumno', 'mensaje_errorAlumno');
}

function confirmarProfe() {
    event.preventDefault();
    validarYConfirmar('Profesor', 'formularioProfesor', 'confirmacionProfe', 'datosProfe', 'mensaje_errorProfe');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - inicializando formularios');
    
    // Configuración inicial correcta
    mostrarInicioSesion();
    
    console.log('Configuración inicial: Login visible, Registro oculto');
    
    // Inicializar event listeners después de que el DOM esté listo
    inicializarEventListeners();
    inicializarValidacionFormularios();
    inicializarEnvioFormularios();
});

// Función para mostrar inicio de sesión
function mostrarInicioSesion() {
    document.getElementById("loginForm").style.display = "flex";
    
    // Ocultar ambos formularios de registro
    const alumnoForm = document.getElementById("registroForm");
    const profeForm = document.getElementById("registroProfe");
    
    alumnoForm.classList.remove("activo");
    profeForm.classList.remove("activo");
    
    contenedor.classList.remove("activo");
    document.getElementById('selected-user-type').textContent = "Seleccione tipo de usuario";
}

// Función para mostrar el contenedor de registro
function mostrarRegistroForm() {
    document.getElementById("loginForm").style.display = "none";
    contenedor.classList.add("activo");
}

// Event listeners para los botones del toggle
function inicializarEventListeners() {
    if (registroBtn) {
        registroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            tipoUsuario('Alumno');
        });
    }

    if (accederBtn) {
        accederBtn.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarInicioSesion();
        });
    }
}

const campos = {
    boleta: false,
    nombre: false,
    telefono: false,
    curp: false,
    correo: false,
    contrasena: false,
    sexo: false,
    carrera: false,
    semestre: false,
    rfc: false
}

const expresiones = {
    boleta: /^(\d{10}|(PE|PM)\d{8})$/, //10 numeros o PE|PM seguido de 8 numeros
    nombre: /^[a-zA-ZÀ-ÿ\s]{1,40}$/, //Letras y espacios, pueden llevar acentos
    telefono: /^\d{7,10}$/, //Solo digitos, maximo 10
    curp: /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/,
    correoAlumno: /^[a-zA-Z0-9_.+-]+@alumno\.ipn\.mx$/,
    correoProfe: /^[a-zA-Z0-9_.+-]+@ipn\.mx$/,
    rfc: /^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/i, //3 o 4 letras, 6 digitos, 3 caracteres alfanumericos
    contrasena: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/, //Al menos una mayuscula, miniuscula, un digito un caracter especial. Minimo 6 caracteres de largo
}

function ocultarMostrarAlumno() {
    event.preventDefault();
    const textoVisible = document.getElementById("visibleAlumno");
    const textoOculto = document.getElementById("ocultoAlumno");

    if (textoOculto.style.display === "none" || !textoOculto.style.display) {
        textoVisible.style.display = "none";
        textoOculto.style.display = "block";
    } else {
        textoVisible.style.display = "block";
        textoOculto.style.display = "none";
    }
}

function ocultarMostrarProfe() {
    event.preventDefault();
    const textoVisible = document.getElementById("visibleProfe");
    const textoOculto = document.getElementById("ocultoProfe");

    if (textoOculto.style.display === "none" || !textoOculto.style.display) {
        textoVisible.style.display = "none";
        textoOculto.style.display = "block";
    } else {
        textoVisible.style.display = "block";
        textoOculto.style.display = "none";
    }
}

function editarFormulario(tipo) {
    if (tipo === 'Alumno') {
        document.getElementById('confirmacionAlumno').style.display = "none";
        document.getElementById('datosAlumno').innerHTML = "";
        document.getElementById('mensaje_errorAlumno').style.display = "none";
        ocultarMostrarAlumno();
        document.getElementById('formularioAlumno').reset();
        resetearCamposValidacion('formularioAlumno');
    } else if (tipo === 'Profesor') {
        document.getElementById('confirmacionProfe').style.display = "none";
        document.getElementById('datosProfe').innerHTML = "";
        document.getElementById('mensaje_errorProfe').style.display = "none";
        ocultarMostrarProfe();
        document.getElementById('formularioProfesor').reset();
        resetearCamposValidacion('formularioProfesor');
    }
}

function resetearCamposValidacion(formId) {
    const formulario = document.getElementById(formId);
    if (!formulario) return;
    
    const grupos = formulario.querySelectorAll('.formulario__grupo');
    grupos.forEach(grupo => {
        grupo.classList.remove('formulario__grupo-incorrecto');
        const error = grupo.querySelector('.formulario__input-error');
        if (error) {
            error.classList.remove('formulario__input-error-activo');
        }
    });
}

function validarYConfirmar(tipo, formularioId, confirmacionId, datosId, errorId) {
    const formulario = document.getElementById(formularioId);
    
    // Validar campos obligatorios según el tipo
    let formularioValido = true;
    
    if (tipo === 'Alumno') {
        formularioValido = validarFormularioAlumno(formulario);
    } else if (tipo === 'Profesor') {
        formularioValido = validarFormularioProfe(formulario);
    }
    
    if (formularioValido) {
        document.getElementById(errorId).style.display = "none";
        mostrarDatosConfirmacion(formulario, datosId, confirmacionId);
    } else {
        document.getElementById(errorId).innerHTML = "<br>Por favor revise los datos introducidos";
        document.getElementById(errorId).style.display = "block";
    }
}

function validarFormularioAlumno(formulario) {
    // Validar campos específicos de alumno
    const sexoValido = formulario.sexo.value !== "Sexo";
    const semestreValido = formulario.semestre.value !== "Semestre";
    const carreraValida = formulario.carrera.value !== "Carrera";
    
    // Validar campos de entrada
    const camposInputValidos = campos.boleta && campos.nombre && campos.curp && 
                              campos.telefono && campos.correo && campos.contrasena;
    
    return sexoValido && semestreValido && carreraValida && camposInputValidos;
}

function validarFormularioProfe(formulario) {
    // Validar campos específicos de profesor
    const sexoValido = formulario.sexo.value !== "Sexo";
    const carreraValida = formulario.carrera.value !== "Área o Departamento";
    
    // Validar campos de entrada
    const camposInputValidos = campos.rfc && campos.nombre && campos.curp && 
                              campos.telefono && campos.correo && campos.contrasena;
    
    return sexoValido && carreraValida && camposInputValidos;
}

function mostrarDatosConfirmacion(formulario, datosId, confirmacionId) {
    const nombre = formulario.nombre ? formulario.nombre.value : '';
    document.getElementById(datosId).innerHTML = `<br>Hola ${nombre}, por favor verifica que los datos estén correctos:`;

    const elementos = Array.from(formulario.elements);
    elementos.forEach(elemento => {
        if (elemento.value && elemento.name && elemento.type !== 'button' && elemento.type !== 'submit') {
            const campo = elemento.name.charAt(0).toUpperCase() + elemento.name.slice(1);
            let valor = elemento.value;
            
            if (elemento.tagName === 'SELECT') {
                const opcionSeleccionada = elemento.options[elemento.selectedIndex];
                valor = opcionSeleccionada.text;
            }
            
            if (elemento.name === 'contrasena') {
                valor = '••••••••';
            }
            
            document.getElementById(datosId).innerHTML += "<br>" + campo + ": " + valor;
        }
    });

    document.getElementById(confirmacionId).style.display = "block";
}

const validarFormulario = (e) => {
    const campo = e.target.name;
    const valor = e.target.value;
    
    switch(campo) {
        case "boleta":
            validarCampo(expresiones.boleta, e.target, 'boleta');
            break;
        case "nombre":
            validarCampo(expresiones.nombre, e.target, 'nombre');
            break;
        case "curp":
            validarCampo(expresiones.curp, e.target, 'curp');
            break;
        case "telefono":
            validarCampo(expresiones.telefono, e.target, 'telefono');
            break;
        case "correo":
            const formulario = e.target.closest('form');
            if (formulario && formulario.id === 'formularioAlumno') {
                validarCampo(expresiones.correoAlumno, e.target, 'correo');
            } else if (formulario && formulario.id === 'formularioProfesor') {
                validarCampo(expresiones.correoProfe, e.target, 'correo');
            }
            break;
        case "contrasena":
            validarCampo(expresiones.contrasena, e.target, 'contrasena');
            break;
        case "rfc":
            validarCampo(expresiones.rfc, e.target, 'rfc');
            break;
    }
}

const validarCampo = (expresion, input, campo) => {
    const grupo = input.closest('.formulario__grupo');
    if (!grupo) return;
    
    const errorElement = grupo.querySelector('.formulario__input-error');
    
    if (expresion.test(input.value)) {
        grupo.classList.remove('formulario__grupo-incorrecto');
        if (errorElement) {
            errorElement.classList.remove('formulario__input-error-activo');
        }
        campos[campo] = true;
    } else {
        grupo.classList.add('formulario__grupo-incorrecto');
        if (errorElement) {
            errorElement.classList.add('formulario__input-error-activo');
        }
        campos[campo] = false;
    }
}

function inicializarValidacionFormularios() {
    const inputsAlumno = document.querySelectorAll('#formularioAlumno input');
    const inputsProfe = document.querySelectorAll('#formularioProfesor input');
    
    inputsAlumno.forEach(input => {
        input.addEventListener('input', validarFormulario);
        input.addEventListener('blur', validarFormulario);
    });
    
    inputsProfe.forEach(input => {
        input.addEventListener('input', validarFormulario);
        input.addEventListener('blur', validarFormulario);
    });
    
    const selectsAlumno = document.querySelectorAll('#formularioAlumno select');
    const selectsProfe = document.querySelectorAll('#formularioProfesor select');
    
    selectsAlumno.forEach(select => {
        select.addEventListener('change', function() {
            validarSelects('Alumno');
        });
    });
    
    selectsProfe.forEach(select => {
        select.addEventListener('change', function() {
            validarSelects('Profesor');
        });
    });
}

function validarSelects(tipo) {
    if (tipo === 'Alumno') {
        const formulario = document.getElementById('formularioAlumno');
        if (formulario) {
            campos.sexo = formulario.sexo.value !== "Sexo";
            campos.semestre = formulario.semestre.value !== "Semestre";
            campos.carrera = formulario.carrera.value !== "Carrera";
        }
    } else if (tipo === 'Profesor') {
        const formulario = document.getElementById('formularioProfesor');
        if (formulario) {
            campos.sexo = formulario.sexo.value !== "Sexo";
            campos.carrera = formulario.carrera.value !== "Área o Departamento";
        }
    }
}

function inicializarEnvioFormularios() {
    const formularioAlumno = document.getElementById('formularioAlumno');
    const formularioProfesor = document.getElementById('formularioProfesor');
    
    if (formularioAlumno) {
        formularioAlumno.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Formulario de Alumno enviado correctamente');
        });
    }
    
    if (formularioProfesor) {
        formularioProfesor.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Formulario de Profesor enviado correctamente');
        });
    }
}