const contenedor = document.getElementById('contenedor');
const registroBtn = document.getElementById('registro');
const accederBtn = document.getElementById('acceder');

const campos = {
    boleta: false,
    nombre: false,
    apellidoPaterno: false,
    apellidoMaterno: false,
    telefono: false,
    curp: false,
    correo: false,
    contrasena: false,
    sexo: false,
    carrera: false,
    creditos: false,
    rfc: false,
    representante: false,
    direccion: false,
    tipo: false
}

const expresiones = {
    boleta: /^(\d{10}|(PE|PM)\d{8})$/,
    nombre: /^[a-zA-ZÀ-ÿ\s]{1,40}$/,
    telefono: /^\d{7,10}$/,
    curp: /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/,
    correoAlumno: /^[a-zA-Z0-9_.+-]+@alumno\.ipn\.mx$/,
    correoProfe: /^[a-zA-Z0-9_.+-]+@ipn\.mx$/,
    correoGeneral: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
    rfc: /^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/i,
    contrasena: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/,
}

function tipoUsuario(type) {
    document.getElementById('selected-user-type').textContent = type;
    
    if (type === "Alumno") {
        mostrarRegistroForm();
        mostrarFormularioAlumno();
    } else if (type === "Profesor") {
        mostrarRegistroForm();
        mostrarFormularioProfesor();
    } else if (type === "Institucion/Empresa") {
        mostrarRegistroForm();
        mostrarFormularioInstitucion();
    } else if (type === "Administrador") {
        console.log("Tipo de usuario: Administrador");
        mostrarInicioSesion();
    } else {
        mostrarInicioSesion();
    }
}

// Función para mostrar solo el formulario de alumno
function mostrarFormularioAlumno() {
    const alumnoForm = document.getElementById("registroForm");
    const profeForm = document.getElementById("registroProfe");
    const institucionForm = document.getElementById("registroInstitucion");
    
    alumnoForm.classList.remove("activo");
    profeForm.classList.remove("activo");
    if (institucionForm) institucionForm.classList.remove("activo");
    
    // Activar solo el formulario de alumno
    alumnoForm.classList.add("activo");
    document.getElementById('selected-user-type').textContent = "Alumno";
}

// Función para mostrar solo el formulario de profesor
function mostrarFormularioProfesor() {
    const alumnoForm = document.getElementById("registroForm");
    const profeForm = document.getElementById("registroProfe");
    const institucionForm = document.getElementById("registroInstitucion");
    
    alumnoForm.classList.remove("activo");
    profeForm.classList.remove("activo");
    if (institucionForm) institucionForm.classList.remove("activo");
    
    // Activar solo el formulario de profesor
    profeForm.classList.add("activo");
    document.getElementById('selected-user-type').textContent = "Profesor";
}

// Función para mostrar solo el formulario de institución
function mostrarFormularioInstitucion() {
    const alumnoForm = document.getElementById("registroForm");
    const profeForm = document.getElementById("registroProfe");
    const institucionForm = document.getElementById("registroInstitucion");
    
    // Remover activo de todos
    alumnoForm.classList.remove("activo");
    profeForm.classList.remove("activo");
    if (institucionForm) institucionForm.classList.remove("activo");
    
    // Activar solo el formulario de institución
    institucionForm.classList.add("activo");
    document.getElementById('selected-user-type').textContent = "Institución/Empresa";
}

// Función para validar si todos los campos requeridos están completos
function validarFormularioCompleto(tipo) {
    if (tipo === 'Alumno') {
        return campos.boleta && campos.nombre && campos.apellidoPaterno && campos.apellidoMaterno && 
               campos.telefono && campos.curp && 
               campos.correo && campos.contrasena && campos.sexo && campos.carrera && campos.creditos;
    } else if (tipo === 'Profesor') {
        return campos.rfc && campos.nombre && campos.telefono && campos.curp && 
               campos.correo && campos.contrasena && campos.sexo && campos.carrera;
    } else if (tipo === 'Institucion') {
        return campos.nombre && campos.rfc && campos.representante && campos.telefono && 
               campos.correo && campos.contrasena && campos.tipo && campos.direccion;
    }
    return false;
}

function confirmarAlumno(event) {
    if (event) event.preventDefault();
    
    // Validar que todos los campos estén completos antes de proceder
    if (!validarFormularioCompleto('Alumno')) {
        const mensajeError = document.getElementById('mensaje_errorAlumno');
        if (mensajeError) {
            mensajeError.innerHTML = "<br>Por favor complete todos los campos correctamente antes de continuar";
            mensajeError.style.display = "block";

            const primerError = document.querySelector('#formularioAlumno .formulario__grupo-incorrecto');
            if (primerError) {
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return;
    }
    
    validarYConfirmar('Alumno', 'formularioAlumno', 'confirmacionAlumno', 'datosAlumno', 'mensaje_errorAlumno');
}

function confirmarProfe(event) {
    if (event) event.preventDefault();
    
    // Validar que todos los campos estén completos antes de proceder
    if (!validarFormularioCompleto('Profesor')) {
        const mensajeError = document.getElementById('mensaje_errorProfe');
        if (mensajeError) {
            mensajeError.innerHTML = "<br>Por favor complete todos los campos correctamente antes de continuar";
            mensajeError.style.display = "block";
            
            const primerError = document.querySelector('#formularioProfesor .formulario__grupo-incorrecto');
            if (primerError) {
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return;
    }
    
    validarYConfirmar('Profesor', 'formularioProfesor', 'confirmacionProfe', 'datosProfe', 'mensaje_errorProfe');
}

function confirmarInstitucion(event) {
    if (event) event.preventDefault();
    
    // Validar que todos los campos estén completos antes de proceder
    if (!validarFormularioCompleto('Institucion')) {
        const mensajeError = document.getElementById('mensaje_errorInstitucion');
        if (mensajeError) {
            mensajeError.innerHTML = "<br>Por favor complete todos los campos correctamente antes de continuar";
            mensajeError.style.display = "block";
            
            const primerError = document.querySelector('#formularioInstitucion .formulario__grupo-incorrecto');
            if (primerError) {
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return;
    }
    
    validarYConfirmarInstitucion();
}

function validarYConfirmarInstitucion() {
    const formulario = document.getElementById('formularioInstitucion');
    if (!formulario) {
        console.error('Formulario de institución no encontrado');
        return;
    }

    const mensajeError = document.getElementById('mensaje_errorInstitucion');
    if (mensajeError) {
        mensajeError.style.display = "none";
    }
    
    mostrarModalConfirmacion('Institucion', formulario);
}

function marcarCampoInvalido(input) {
    if (!input) return;
    const grupo = input.closest('.formulario__grupo');
    if (grupo) {
        grupo.classList.add('formulario__grupo-incorrecto');
        const error = grupo.querySelector('.formulario__input-error');
        if (error) {
            error.classList.add('formulario__input-error-activo');
        }
    }
}

// Función para mostrar inicio de sesión
function mostrarInicioSesion() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.style.display = "flex";
    }
    
    // Ocultar todos los formularios de registro usando clases
    const alumnoForm = document.getElementById("registroForm");
    const profeForm = document.getElementById("registroProfe");
    const institucionForm = document.getElementById("registroInstitucion");
    
    if (alumnoForm) alumnoForm.classList.remove("activo");
    if (profeForm) profeForm.classList.remove("activo");
    if (institucionForm) institucionForm.classList.remove("activo");
    
    if (contenedor) {
        contenedor.classList.remove("activo");
    }
    
    document.getElementById('selected-user-type').textContent = "Seleccione tipo de usuario";
}

// Función para mostrar el contenedor de registro
function mostrarRegistroForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.style.display = "none";
    }
    
    if (contenedor) {
        contenedor.classList.add("activo");
    }
}

function mostrarRegistro() {
    tipoUsuario('Alumno');
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

function ocultarMostrarAlumno(event) {
    if (event) event.preventDefault();
    const textoVisible = document.getElementById("visibleAlumno");
    const textoOculto = document.getElementById("ocultoAlumno");

    if (textoVisible && textoOculto) {
        if (textoOculto.style.display === "none" || !textoOculto.style.display) {
            textoVisible.style.display = "none";
            textoOculto.style.display = "block";
        } else {
            textoVisible.style.display = "block";
            textoOculto.style.display = "none";
        }
    }
}

function ocultarMostrarProfe(event) {
    if (event) event.preventDefault();
    const textoVisible = document.getElementById("visibleProfe");
    const textoOculto = document.getElementById("ocultoProfe");

    if (textoVisible && textoOculto) {
        if (textoOculto.style.display === "none" || !textoOculto.style.display) {
            textoVisible.style.display = "none";
            textoOculto.style.display = "block";
        } else {
            textoVisible.style.display = "block";
            textoOculto.style.display = "none";
        }
    }
}

function ocultarMostrarInstitucion(event) {
    if (event) event.preventDefault();
    const textoVisible = document.getElementById("visibleInstitucion");
    const textoOculto = document.getElementById("ocultoInstitucion");

    if (textoVisible && textoOculto) {
        if (textoOculto.style.display === "none" || !textoOculto.style.display) {
            textoVisible.style.display = "none";
            textoOculto.style.display = "block";
        } else {
            textoVisible.style.display = "block";
            textoOculto.style.display = "none";
        }
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
        resetearEstadoCampos('Alumno');
    } else if (tipo === 'Profesor') {
        document.getElementById('confirmacionProfe').style.display = "none";
        document.getElementById('datosProfe').innerHTML = "";
        document.getElementById('mensaje_errorProfe').style.display = "none";
        ocultarMostrarProfe();
        document.getElementById('formularioProfesor').reset();
        resetearCamposValidacion('formularioProfesor');
        resetearEstadoCampos('Profesor');
    } else if (tipo === 'Institucion') {
        document.getElementById('confirmacionInstitucion').style.display = "none";
        document.getElementById('datosInstitucion').innerHTML = "";
        document.getElementById('mensaje_errorInstitucion').style.display = "none";
        ocultarMostrarInstitucion();
        document.getElementById('formularioInstitucion').reset();
        resetearCamposValidacion('formularioInstitucion');
        resetearEstadoCampos('Institucion');
    }
}

function resetearEstadoCampos(tipo) {
    if (tipo === 'Alumno') {
        campos.boleta = false;
        campos.nombre = false;
        campos.apellidoPaterno = false;
        campos.apellidoMaterno = false;
        campos.telefono = false;
        campos.curp = false;
        campos.correo = false;
        campos.contrasena = false;
        campos.sexo = false;
        campos.carrera = false;
        campos.creditos = false;
    } else if (tipo === 'Profesor') {
        campos.rfc = false;
        campos.nombre = false;
        campos.telefono = false;
        campos.curp = false;
        campos.correo = false;
        campos.contrasena = false;
        campos.sexo = false;
        campos.carrera = false;
    } else if (tipo === 'Institucion') {
        campos.nombre = false;
        campos.rfc = false;
        campos.representante = false;
        campos.telefono = false;
        campos.correo = false;
        campos.contrasena = false;
        campos.tipo = false;
        campos.direccion = false;
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
    
    // Confirmación
    document.getElementById(errorId).style.display = "none";
    mostrarModalConfirmacion(tipo, formulario);
}

// Función para mostrar modal de Bootstrap con los datos
function mostrarModalConfirmacion(tipo, formulario) {
    // Crear el contenido del modal según el tipo de usuario
    let titulo = '';
    let contenido = '';
    const nombre = formulario.nombre ? formulario.nombre.value : '';

    if (tipo === 'Alumno') {
        titulo = 'Confirmación de Registro - Alumno';
        contenido = generarContenidoAlumno(formulario);
    } else if (tipo === 'Profesor') {
        titulo = 'Confirmación de Registro - Profesor';
        contenido = generarContenidoProfesor(formulario);
    } else if (tipo === 'Institucion') {
        titulo = 'Confirmación de Registro - Institución/Empresa';
        contenido = generarContenidoInstitucion(formulario);
    }

    // Crear o actualizar el modal
    let modal = document.getElementById('modalConfirmacion');
    if (!modal) {
        // Crear el modal si no existe
        modal = document.createElement('div');
        modal.id = 'modalConfirmacion';
        modal.className = 'modal fade';
        modal.tabIndex = '-1';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitulo">${titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalCuerpo">
                        ${contenido}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Editar Datos</button>
                        <button type="button" class="btn btn-primary" id="btnConfirmarEnvio">Confirmar y Enviar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Actualizar el contenido del modal existente
        document.getElementById('modalTitulo').textContent = titulo;
        document.getElementById('modalCuerpo').innerHTML = contenido;
    }

    // Configurar el evento del botón de confirmar
    const btnConfirmar = document.getElementById('btnConfirmarEnvio');
    btnConfirmar.onclick = function() {
        // Aquí puedes agregar la lógica para enviar los datos al servidor
        enviarFormulario(tipo, formulario);
        
        // Cerrar el modal
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
        
        // Mostrar mensaje de éxito
        mostrarMensajeExito(tipo);
    };

    // Mostrar el modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Función para generar el contenido del modal para Alumno
function generarContenidoAlumno(formulario) {
    return `
        <div class="alert alert-info">
            <strong>Hola ${formulario.nombre.value}</strong>, por favor verifica que tus datos estén correctos:
        </div>
        <div class="row">
            <div class="col-md-6">
                <p><strong>Boleta:</strong> ${formulario.boleta.value}</p>
                <p><strong>Nombre Completo:</strong> ${formulario.nombre.value} ${formulario.apellidoPaterno.value} ${formulario.apellidoMaterno.value}</p>
                <p><strong>CURP:</strong> ${formulario.curp.value}</p>
                <p><strong>Teléfono:</strong> ${formulario.telefono.value}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Correo:</strong> ${formulario.correo.value}</p>
                <p><strong>Sexo:</strong> ${formulario.sexo.options[formulario.sexo.selectedIndex].text}</p>
                <p><strong>Carrera:</strong> ${formulario.carrera.options[formulario.carrera.selectedIndex].text}</p>
                <p><strong>Créditos:</strong> ${formulario.creditos.value}</p>
            </div>
        </div>
    `;
}

// Función para generar el contenido del modal para Profesor
function generarContenidoProfesor(formulario) {
    return `
        <div class="alert alert-info">
            <strong>Hola ${formulario.nombre.value}</strong>, por favor verifica que tus datos estén correctos:
        </div>
        <div class="row">
            <div class="col-md-6">
                <p><strong>RFC:</strong> ${formulario.rfc.value}</p>
                <p><strong>Nombre:</strong> ${formulario.nombre.value}</p>
                <p><strong>CURP:</strong> ${formulario.curp.value}</p>
                <p><strong>Teléfono:</strong> ${formulario.telefono.value}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Correo:</strong> ${formulario.correo.value}</p>
                <p><strong>Sexo:</strong> ${formulario.sexo.options[formulario.sexo.selectedIndex].text}</p>
                <p><strong>Área/Departamento:</strong> ${formulario.carrera.options[formulario.carrera.selectedIndex].text}</p>
            </div>
        </div>
    `;
}

// Función para generar el contenido del modal para Institución
function generarContenidoInstitucion(formulario) {
    const nombre = formulario.querySelector("[name='nombre']");
    const rfc = formulario.querySelector("[name='rfc']");
    const representante = formulario.querySelector("[name='representante']");
    const telefono = formulario.querySelector("[name='telefono']");
    const correo = formulario.querySelector("[name='correo']");
    const direccion = formulario.querySelector("[name='direccion']");
    const tipo = formulario.querySelector("[name='tipo']");

    return `
        <div class="alert alert-info">
            <strong>Confirmación de Registro Institucional</strong>
        </div>
        <div class="row">
            <div class="col-md-6">
                <p><strong>Nombre de la Institución:</strong> ${nombre.value}</p>
                <p><strong>RFC:</strong> ${rfc.value}</p>
                <p><strong>Representante:</strong> ${representante.value}</p>
                <p><strong>Teléfono:</strong> ${telefono.value}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Correo:</strong> ${correo.value}</p>
                <p><strong>Dirección:</strong> ${direccion.value}</p>
                <p><strong>Tipo de Institución:</strong> ${tipo.options[tipo.selectedIndex].text}</p>
            </div>
        </div>
    `;
}

// Función para enviar el formulario (simulación)
function enviarFormulario(tipo, formulario) {
    console.log(`Enviando formulario de ${tipo}:`, formulario);
    // Aquí iría la lógica real para enviar los datos al servidor
    // Por ejemplo: fetch('/api/registro', { method: 'POST', body: new FormData(formulario) })
}

// Función para mostrar mensaje de éxito
function mostrarMensajeExito(tipo) {
    // Crear toast de Bootstrap para mostrar mensaje de éxito
    const toastContainer = document.getElementById('toastContainer');
    let toast = document.getElementById('toastExito');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastExito';
        toast.className = 'toast align-items-center text-white bg-success border-0';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    Registro completado exitosamente
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        if (!toastContainer) {
            const newContainer = document.createElement('div');
            newContainer.id = 'toastContainer';
            newContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            newContainer.appendChild(toast);
            document.body.appendChild(newContainer);
        } else {
            toastContainer.appendChild(toast);
        }
    }

    const toastInstance = new bootstrap.Toast(toast);
    toastInstance.show();

    // Resetear el formulario después de 2 segundos
    setTimeout(() => {
        if (tipo === 'Alumno') {
            document.getElementById('formularioAlumno').reset();
            resetearEstadoCampos('Alumno');
            resetearCamposValidacion('formularioAlumno');
        } else if (tipo === 'Profesor') {
            document.getElementById('formularioProfesor').reset();
            resetearEstadoCampos('Profesor');
            resetearCamposValidacion('formularioProfesor');
        } else if (tipo === 'Institucion') {
            document.getElementById('formularioInstitucion').reset();
            resetearEstadoCampos('Institucion');
            resetearCamposValidacion('formularioInstitucion');
        }
    }, 2000);
}

// Resto del código permanece igual...
const validarFormulario = (e) => {
    const campo = e.target.name;
    
    switch(campo) {
        case "boleta":
            validarCampo(expresiones.boleta, e.target, 'boleta');
            break;
        case "nombre":
            validarCampo(expresiones.nombre, e.target, 'nombre');
            break;
        case "apellidoPaterno":
            validarCampo(expresiones.nombre, e.target, 'apellidoPaterno');
            break;
        case "apellidoMaterno":
            validarCampo(expresiones.nombre, e.target, 'apellidoMaterno');
            break;
        case "creditos":
            validarCreditos(e.target);
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
            } else if (formulario && formulario.id === 'formularioInstitucion') {
                validarCampo(expresiones.correoGeneral, e.target, 'correo');
            }
            break;
        case "contrasena":
            validarCampo(expresiones.contrasena, e.target, 'contrasena');
            break;
        case "rfc":
            validarCampo(expresiones.rfc, e.target, 'rfc');
            break;
        case "representante":
            validarCampo(expresiones.nombre, e.target, 'representante');
            break;
        case "direccion":
            // Para dirección, solo validamos que no esté vacía
            const grupoDireccion = e.target.closest('.formulario__grupo');
            if (!grupoDireccion) return;
            const errorElementDireccion = grupoDireccion.querySelector('.formulario__input-error');
            
            if (e.target.value.trim() !== '') {
                grupoDireccion.classList.remove('formulario__grupo-incorrecto');
                if (errorElementDireccion) {
                    errorElementDireccion.classList.remove('formulario__input-error-activo');
                }
                campos.direccion = true;
            } else {
                grupoDireccion.classList.add('formulario__grupo-incorrecto');
                if (errorElementDireccion) {
                    errorElementDireccion.classList.add('formulario__input-error-activo');
                }
                campos.direccion = false;
            }
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

const validarCreditos = (input) => {
    const valor = parseInt(input.value);
    const grupo = input.closest('.formulario__grupo');
    if (!grupo) return;
    
    const errorElement = grupo.querySelector('.formulario__input-error');
    
    if (!isNaN(valor) && valor >= 0 && valor <= 387) {
        grupo.classList.remove('formulario__grupo-incorrecto');
        grupo.classList.add('formulario__grupo-correcto');
        if(errorElement) errorElement.classList.remove('formulario__input-error-activo');
        campos['creditos'] = true;
    } else {
        grupo.classList.add('formulario__grupo-incorrecto');
        grupo.classList.remove('formulario__grupo-correcto');
        if(errorElement) errorElement.classList.add('formulario__input-error-activo');
        campos['creditos'] = false;
    }
}

function inicializarValidacionFormularios() {
    const inputsAlumno = document.querySelectorAll('#formularioAlumno input');
    const inputsProfe = document.querySelectorAll('#formularioProfesor input');
    const inputsInstitucion = document.querySelectorAll('#formularioInstitucion input');
    
    inputsAlumno.forEach(input => {
        input.addEventListener('input', validarFormulario);
        input.addEventListener('blur', validarFormulario);
    });
    
    inputsProfe.forEach(input => {
        input.addEventListener('input', validarFormulario);
        input.addEventListener('blur', validarFormulario);
    });
    
    inputsInstitucion.forEach(input => {
        input.addEventListener('input', validarFormulario);
        input.addEventListener('blur', validarFormulario);
    });
    
    const selectsAlumno = document.querySelectorAll('#formularioAlumno select');
    const selectsProfe = document.querySelectorAll('#formularioProfesor select');
    const selectsInstitucion = document.querySelectorAll('#formularioInstitucion select');
    
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
    
    selectsInstitucion.forEach(select => {
        select.addEventListener('change', function() {
            validarSelects('Institucion');
        });
    });
}

function validarSelects(tipo) {
    if (tipo === 'Alumno') {
        const formulario = document.getElementById('formularioAlumno');
        if (!formulario) return;

        const sexoSelect = formulario.querySelector("select[name='sexo']");
        const carreraSelect = formulario.querySelector("select[name='carrera']");

        const sexoValido = !!sexoSelect && sexoSelect.selectedIndex > 0;
        const carreraValida = !!carreraSelect && carreraSelect.selectedIndex > 0;

        campos.sexo = sexoValido;
        campos.carrera = carreraValida;

        if (sexoSelect) actualizarEstiloSelect(sexoSelect, sexoValido);
        if (carreraSelect) actualizarEstiloSelect(carreraSelect, carreraValida);
    } else if (tipo === 'Profesor') {
        const formulario = document.getElementById('formularioProfesor');
        if (!formulario) return;

        const sexoSelect = formulario.querySelector("select[name='sexo']");
        const carreraSelect = formulario.querySelector("select[name='carrera']");

        const sexoValido = !!sexoSelect && sexoSelect.selectedIndex > 0;
        const carreraValida = !!carreraSelect && carreraSelect.selectedIndex > 0;

        campos.sexo = sexoValido;
        campos.carrera = carreraValida;

        if (sexoSelect) actualizarEstiloSelect(sexoSelect, sexoValido);
        if (carreraSelect) actualizarEstiloSelect(carreraSelect, carreraValida);
    } else if (tipo === 'Institucion') {
        const formulario = document.getElementById('formularioInstitucion');
        if (!formulario) return;

        const tipoSelect = formulario.querySelector("select[name='tipo']");
        const tipoValido = !!tipoSelect && tipoSelect.selectedIndex > 0;

        campos.tipo = tipoValido;
        if (tipoSelect) actualizarEstiloSelect(tipoSelect, tipoValido);
    }
}

function actualizarEstiloSelect(select, valido) {
    const grupo = select.closest('.formulario__grupo');
    if (!grupo) return;
    
    if (valido) {
        grupo.classList.remove('formulario__grupo-incorrecto');
        const error = grupo.querySelector('.formulario__input-error');
        if (error) {
            error.classList.remove('formulario__input-error-activo');
        }
    } else {
        grupo.classList.add('formulario__grupo-incorrecto');
        const error = grupo.querySelector('.formulario__input-error');
        if (error) {
            error.classList.add('formulario__input-error-activo');
        }
    }
}

function inicializarEnvioFormularios() {
    const formularioAlumno = document.getElementById('formularioAlumno');
    const formularioProfesor = document.getElementById('formularioProfesor');
    const formularioInstitucion = document.getElementById('formularioInstitucion');
    
    if (formularioAlumno) {
        formularioAlumno.addEventListener('submit', function(e) {
            e.preventDefault();
            confirmarAlumno(e);
        });
    }
    
    if (formularioProfesor) {
        formularioProfesor.addEventListener('submit', function(e) {
            e.preventDefault();
            confirmarProfe(e);
        });
    }
    
    if (formularioInstitucion) {
        formularioInstitucion.addEventListener('submit', function(e) {
            e.preventDefault();
            confirmarInstitucion(e);
        });
    }
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