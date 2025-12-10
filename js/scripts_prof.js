let list = document.querySelectorAll(".navigation li");

function activeLink() {
    list.forEach((item) => {
        item.classList.remove("hovered");
    });
    this.classList.add("hovered");
}

list.forEach((item) => item.addEventListener("mouseover", activeLink));

let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

toggle.onclick = function () {
    navigation.classList.toggle("active");
    main.classList.toggle("active");
}

//CAMBIAR SECCIONES
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
        const sectionClass = item.getAttribute("data-section");

        document.querySelectorAll("section[class$='-section']").forEach(sec => {
            sec.classList.add("hidden");
        });

        document.querySelector(`.${sectionClass}`).classList.remove("hidden");
    });
});


//MI PERFIL
document.addEventListener("DOMContentLoaded", () => {

    const editBtn = document.getElementById("editBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const perfilForm = document.getElementById("perfilForm");
    const perfilReadOnly = document.getElementById("perfilReadOnly");
    const avatarInput = document.getElementById("avatarInput");
    const perfilAvatar = document.getElementById("perfilAvatar");

    const nombreInput = document.getElementById("nombreInput");
    const aPaternoInput = document.getElementById("aPaternoInput");
    const aMaternoInput = document.getElementById("aMaternoInput");
    const emailInput = document.getElementById("emailInput");
    const phoneInput = document.getElementById("phoneInput");
    const deptInput = document.getElementById("deptInput");
    const sexoInput = document.getElementById("sexoInput");
    const rfcInput = document.getElementById("rfcInput");
    const curpInput = document.getElementById("curpInput");
    const passInput = document.getElementById("passInput");

    const ro_nombre = document.getElementById("ro_nombre");
    const ro_aPaterno = document.getElementById("ro_aPaterno");
    const ro_aMaterno = document.getElementById("ro_aMaterno");
    const ro_sexo = document.getElementById("ro_sexo");
    const ro_email = document.getElementById("ro_email");
    const ro_phone = document.getElementById("ro_phone");
    const ro_dept = document.getElementById("ro_dept");
    const ro_rfc = document.getElementById("ro_rfc");
    const ro_curp = document.getElementById("ro_curp");

    const displayName = document.getElementById("displayName");

    function loadPerfil() {
        const data = JSON.parse(localStorage.getItem("perfilData")) || {};

        if (data.avatar) perfilAvatar.src = data.avatar;

        nombreInput.value = data.nombre || "";
        aPaternoInput.value = data.aPaterno || "";
        aMaternoInput.value = data.aMaterno || "";
        emailInput.value = data.email || "";
        phoneInput.value = data.phone || "";
        deptInput.value = data.dept || "";
        sexoInput.value = data.sexo || "";
        passInput.value = data.password || "";

        rfcInput.value = data.rfc || "";

        ro_curp.textContent = data.curpNombre || "No subido";
        ro_nombre.textContent = data.nombre || "-";
        ro_aPaterno.textContent = data.aPaterno || "-";
        ro_aMaterno.textContent = data.aMaterno || "-";
        ro_sexo.textContent = data.sexo || "-";
        ro_email.textContent = data.email || "-";
        ro_phone.textContent = data.phone || "-";
        ro_dept.textContent = data.dept || "-";
        ro_rfc.textContent = data.rfc || "-";

        displayName.textContent = data.nombre
            ? `${data.nombre} ${data.aPaterno || ""}`.trim()
            : "Nombre Apellido";
    }
    loadPerfil();

    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            perfilAvatar.src = ev.target.result;
            perfilAvatar.dataset.tmp = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    editBtn.addEventListener("click", () => {
        perfilForm.classList.remove("hidden");
        perfilReadOnly.classList.add("hidden");
    });

    cancelBtn.addEventListener("click", () => {
        perfilForm.classList.add("hidden");
        perfilReadOnly.classList.remove("hidden");
        loadPerfil(); 
        delete perfilAvatar.dataset.tmp;
    });

    perfilForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const curpFile = curpInput.files[0];

        const perfilData = {
            nombre: nombreInput.value.trim(),
            aPaterno: aPaternoInput.value.trim(),
            aMaterno: aMaternoInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            dept: deptInput.value.trim(),
            sexo: sexoInput.value,
            password: passInput.value.trim(),

            avatar: perfilAvatar.dataset.tmp || perfilAvatar.src,
            rfc: rfcInput.value.trim(),
            curpNombre: curpFile ? curpFile.name : ro_curp.textContent
        };

        localStorage.setItem("perfilData", JSON.stringify(perfilData));

        delete perfilAvatar.dataset.tmp;

        loadPerfil();

        perfilForm.classList.add("hidden");
        perfilReadOnly.classList.remove("hidden");
    });
});


//ALUMNOS
document.querySelectorAll(".fila-alumno").forEach(fila => {
    fila.addEventListener("click", () => {

        const nombre = fila.children[2].textContent;
        const correo = fila.children[3].textContent;
        const boleta = fila.children[1].textContent;

        document.getElementById("m_nombre").textContent = nombre;
        document.getElementById("m_correo").textContent = correo;
        document.getElementById("m_boleta").textContent = boleta;

        document.getElementById("m_telefono").textContent = "";
        document.getElementById("m_carrera").textContent = "";
        document.getElementById("m_creditos").textContent = "";
        document.getElementById("m_publicacion").textContent = "";

        document.getElementById("modalAlumno").classList.remove("hidden");
    });
});

//CIERRE DE MODALES EN GENERAL
(function initModals() {
    const modales = document.querySelectorAll('.modal');

    modales.forEach(modal => {
        const closeBtn = modal.querySelector('.close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
        }
    });
})();


//NOTIFICACIONES
const datosAlumnoEjemplo = {
    nombre: "Alumno de Ejemplo",
    creditos: "72.8%",
    correo: "alumno@alumno.ipn.mx",
    carrera: "ISC"
};

document.getElementById("noti1").addEventListener("click", () => {
    document.getElementById("n_nombre").textContent = datosAlumnoEjemplo.nombre;
    document.getElementById("n_creditos").textContent = datosAlumnoEjemplo.creditos;
    document.getElementById("n_correo").textContent = datosAlumnoEjemplo.correo;
    document.getElementById("n_carrera").textContent = datosAlumnoEjemplo.carrera;

    document.getElementById("modalNotificacion").classList.remove("hidden");
});

document.getElementById("btnAceptar").addEventListener("click", () => {
    alert("Alumno aceptado.");
});

document.getElementById("btnRechazar").addEventListener("click", () => {
    alert("Alumno rechazado.");
});