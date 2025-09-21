const contenedor = document.getElementById('contenedor');
const registroBtn = document.getElementById('registro');
const accederBtn = document.getElementById('acceder');

const formulario = document.getElementById('formulario');
const inputs = document.querySelectorAll('#formulario input');

const campos =
{
    boleta: false,
    nombre: false,
    telefono: false,
    curp: false,
    correo: false,
    contasena: false,
    sexo: false,
    carrera: false,
    semestre: false,
    concurso: false
}

const expresiones =
{
    boleta:/^(\d{10}|(PE|PM)\d{8})$/, //10 numeros o PE|PM seguido de 8 numeros
    nombre:/^[a-zA-ZÀ-ÿ\s]{1,40}$/, //Letras y espacios, pueden llevar acentos
    telefono: /^\d{7,10}$/, //Solo digitos, maximo 10
    curp: /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/,
    correo:/^[a-zA-Z0-9_.+-]+@alumno.ipn.mx$/,
    contrasena:/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/, //Al menos una mayuscula, miniuscula, un digito un caracter especial. Minimo 6 caracteres de largo
    // correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
}

registroBtn.addEventListener('click', () =>
{
    contenedor.classList.add("activo");
});

accederBtn.addEventListener('click', () =>
{
    contenedor.classList.remove("activo");
});

function ocultarMostrar()
{
        event.preventDefault();
        const textoVisible = document.getElementById("visible");
        const textoOculto = document.getElementById("oculto");
        const btn_toogle_form = document.getElementById("btn-toogle-form");

        const estilo = window.getComputedStyle(textoOculto);
        const estilo_btn = window.getComputedStyle(btn_toogle_form);

        if (estilo.display == "none")
        {
            textoVisible.style.display = "none";
            btn_toogle_form.style.display = "none";
            textoOculto.style.display = "block";

        }
        else
        {
            textoVisible.style.display = "block";
            textoOculto.style.display = "none";

            if(estilo_btn.fontSize != "18px")
                btn_toogle_form.style.display = "flex"; //Se pone flex porque el div de btn_toogle_form tiene display: flex
        }
}

function mostrarRegistro() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registroForm').style.display = 'block';
}

function mostrarInicio() {
    document.getElementById('registroForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

const validarFormulario = (e) => {
    switch(e.target.name)
    {
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
            validarCampo(expresiones.correo, e.target, 'correo');
            break;
        case "contrasena":
            validarCampo(expresiones.contrasena, e.target, 'contrasena');
            break;
        
    }
}

const validarCampo = (expresion, input, campo) =>
{
    if(expresion.test(input.value)) //Valido
    {
        document.getElementById(`grupo__${campo}`).classList.remove('formulario__grupo-incorrecto');
        document.querySelector(`#grupo__${campo} .formulario__input-error`).classList.remove('formulario__input-error-activo');
        campos[campo] = true;
    }
    else //No valido
    {
        document.getElementById(`grupo__${campo}`).classList.add('formulario__grupo-incorrecto');
        document.querySelector(`#grupo__${campo} .formulario__input-error`).classList.add('formulario__input-error-activo');
        campos[campo] = false;
    }
}

inputs.forEach((input) => {
    input.addEventListener('input', validarFormulario);
    // input.addEventListener('blur', validarFormulario);
});

function confirmar()
{
    event.preventDefault();

    if(formulario.sexo.value != "Sexo" && formulario.semestre.value != "Semestre" && formulario.carrera.value != "Carrera" && formulario.concurso.value != "Concurso")
    {
        campos.sexo = true;
        campos.semestre = true;
        campos.carrera = true;
        campos.concurso = true;
    }
    else
    {
        campos.sexo = false;
        campos.semestre = false;
        campos.carrera = false;
        campos.concurso = false;
    }

    if(campos.boleta && campos.nombre && campos.telefono && campos.curp && campos.correo && campos.contrasena && campos.sexo && campos.semestre && campos.carrera && campos.concurso)
    {
        document.getElementById('mensaje_error').classList.remove('visible');

        const nombre = document.getElementById('nombre').value;
        document.getElementById('datos').innerHTML = `<br>Hola ${nombre}, por favor verifica que los datos estén correctos:`;

        const elementos = Array.from(formulario.elements);
        elementos.forEach(elemento => {
            const campo =  elemento.name.charAt(0).toUpperCase() + elemento.name.slice(1); //Los 'name' de los input estan en minusculas,
            //la linea de arriba define una variable que pone la primera letra del 'name' en mayuscula y lo demas en miscula, ejemplo: boleta -> Boleta.
            if(elemento.value)
            document.getElementById('datos').innerHTML += "<br>"+campo+": "+elemento.value;
        });

        document.getElementById('confirmacion').classList.add('visible');   
    }
    else
    {
        editar();
        document.getElementById('mensaje_error').innerHTML = "<br>Por favor revise los datos introducidos";
        document.getElementById('mensaje_error').classList.add('visible');
    }
}

function editar() //Borra y oculta el contenido que muestra los datos introducidos para su verificacion
{
    // event.preventDefault();
    document.getElementById('datos').innerHTML = ""; //Borra el contenido
    document.getElementById('confirmacion').classList.remove('visible'); //Oculta el contenido
}
