// 1. INICIALIZAR CONFIGURACIÓN DE SUPABASE
const supabaseUrl = 'https://nsoazwbxfjffmdqrmlly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zb2F6d2J4ZmpmZm1kcXJtbGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDIzMzgsImV4cCI6MjA5NzI3ODMzOH0.7HFQ2uP0zExT7knO51iRPBYQLoQNJOQHPwEKnKpPtEc'; 

// ¡AQUÍ ESTÁ LA MAGIA! Cambiamos el nombre a "clienteSupabase" para evitar el choque
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. CAPTURA DE ELEMENTOS DEL DOM
const formMascota = document.getElementById('formMascota');
const tablaMascotas = document.getElementById('tablaMascotas');
const mensajeDiv = document.getElementById('mensaje');
const filtroEspecie = document.getElementById('filtroEspecie');

// 3. EVENTO INICIAL DE CARGA
document.addEventListener('DOMContentLoaded', () => {
    cargarSelectsDinamicos();
    cargarTablaMascotas();
});

// 4. FUNCIÓN PARA LLENAR TODOS LOS MENÚS DESPLEGABLES DESDE LA BD
async function cargarSelectsDinamicos() {
    try {
        // a) Cargar Especies
        const { data: especies, error: errEsp } = await clienteSupabase.from('especies').select('*').order('id', { ascending: true });
        if (errEsp) throw errEsp;
        const selectEspecie = document.getElementById('especie_id');
        especies.forEach(esp => {
            selectEspecie.innerHTML += `<option value="${esp.id}">${esp.nombre}</option>`;
            filtroEspecie.innerHTML += `<option value="${esp.id}">${esp.nombre}</option>`;
        });

        // b) Cargar Razas
        const { data: razas, error: errRaz } = await clienteSupabase.from('razas').select('*').order('id', { ascending: true });
        if (errRaz) throw errRaz;
        const selectRaza = document.getElementById('raza_id');
        razas.forEach(raz => {
            selectRaza.innerHTML += `<option value="${raz.id}">${raz.nombre}</option>`;
        });

        // c) Cargar Tipos de Atención
        const { data: tiposAtencion, error: errAtn } = await clienteSupabase.from('tipos_atencion').select('*').order('id', { ascending: true });
        if (errAtn) throw errAtn;
        const selectAtencion = document.getElementById('tipo_atencion_id');
        tiposAtencion.forEach(tipo => {
            selectAtencion.innerHTML += `<option value="${tipo.id}">${tipo.nombre}</option>`;
        });

        // d) Cargar Condiciones Médicas
        const { data: condiciones, error: errCond } = await clienteSupabase.from('condiciones_medicas').select('*').order('id', { ascending: true });
        if (errCond) throw errCond;
        const selectCondicion = document.getElementById('condicion_medica_id');
        condiciones.forEach(cond => {
            selectCondicion.innerHTML += `<option value="${cond.id}">${cond.nombre}</option>`;
        });

    } catch (error) {
        console.error("Error al inicializar los catálogos:", error);
    }
}

// 5. FUNCIÓN PARA REGISTRAR UN NUEVO PACIENTE (INSERT)
formMascota.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevaMascota = {
        nombre_mascota: document.getElementById('nombre_mascota').value,
        edad: parseInt(document.getElementById('edad').value),
        peso: parseFloat(document.getElementById('peso').value),
        nombre_dueno: document.getElementById('nombre_dueno').value,
        apellido_dueno: document.getElementById('apellido_dueno').value,
        dni_dueno: document.getElementById('dni_dueno').value,
        celular: document.getElementById('celular').value,
        correo: document.getElementById('correo').value || null,
        especie_id: parseInt(document.getElementById('especie_id').value),
        raza_id: parseInt(document.getElementById('raza_id').value),
        tipo_atencion_id: parseInt(document.getElementById('tipo_atencion_id').value),
        condicion_medica_id: parseInt(document.getElementById('condicion_medica_id').value),
        observaciones: document.getElementById('observaciones').value || null
    };

    try {
        const { data, error } = await clienteSupabase.from('mascotas').insert([nuevaMascota]);
        if (error) throw error;

        mostrarMensaje("¡Paciente registrado exitosamente en la nube!", "#28a745");
        formMascota.reset();
        cargarTablaMascotas(); 

    } catch (error) {
        console.error("Error en la inserción:", error);
        mostrarMensaje("Error al registrar: " + error.message, "red");
    }
});

// 6. FUNCIÓN PARA LEER Y MOSTRAR LOS REGISTROS
async function cargarTablaMascotas() {
    try {
        const { data: mascotas, error } = await clienteSupabase
            .from('mascotas')
            .select(`
                *,
                especies (nombre),
                razas (nombre),
                tipos_atencion (nombre),
                condiciones_medicas (nombre)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderizarTabla(mascotas);

    } catch (error) {
        console.error("Error al construir el listado:", error);
    }
}

// 7. FILTRADO DINÁMICO POR ESPECIE
filtroEspecie.addEventListener('change', async () => {
    const seleccion = filtroEspecie.value;
    try {
        let consulta = clienteSupabase
            .from('mascotas')
            .select(`
                *,
                especies (nombre),
                razas (nombre),
                tipos_atencion (nombre),
                condiciones_medicas (nombre)
            `)
            .order('created_at', { ascending: false });

        if (seleccion !== 'todas') {
            consulta = consulta.eq('especie_id', parseInt(seleccion));
        }

        const { data: mascotas, error } = await consulta;
        if (error) throw error;
        renderizarTabla(mascotas);

    } catch (error) {
        console.error("Error al aplicar el filtro:", error);
    }
});

// 8. FUNCIONES AUXILIARES DE INTERFAZ
function renderizarTabla(listaMascotas) {
    tablaMascotas.innerHTML = ''; 

    listaMascotas.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${m.nombre_mascota}</strong></td>
            <td>${m.edad} años</td>
            <td>${m.peso} Kg</td>
            <td>${m.especies?.nombre || 'No asignado'}</td>
            <td>${m.razas?.nombre || 'No asignado'}</td>
            <td>${m.nombre_dueno} ${m.apellido_dueno}</td>
            <td>${m.dni_dueno}</td>
            <td>${m.celular || 'N/A'}</td>
            <td>${m.tipos_atencion?.nombre || 'N/A'}</td>
            <td>${m.condiciones_medicas?.nombre || 'Ninguna'}</td>
        `;
        tablaMascotas.appendChild(tr);
    });
}

function mostrarMensaje(texto, color) {
    mensajeDiv.textContent = texto;
    mensajeDiv.style.backgroundColor = color === '#28a745' ? '#e2f0d9' : '#fce4d6';
    mensajeDiv.style.color = color;
    mensajeDiv.style.border = `1px solid ${color}`;
    mensajeDiv.style.padding = '10px';
    mensajeDiv.style.borderRadius = '4px';
    mensajeDiv.style.display = 'block';
    setTimeout(() => { mensajeDiv.style.display = 'none'; }, 4000);
}