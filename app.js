// 1. Inicialización con tus credenciales exactas [cite: 95-97]
const supabaseUrl = 'https://nsoazwbxfjffmdqrmlly.supabase.co'; // Sin el /rest/v1/
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zb2F6d2J4ZmpmZm1kcXJtbGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDIzMzgsImV4cCI6MjA5NzI3ODMzOH0.7HFQ2uP0zExT7knO51iRPBYQLoQNJOQHPwEKnKpPtEc';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Ejecutar al cargar la página [cite: 99]
document.addEventListener('DOMContentLoaded', async () => {
    await cargarSelectsDinamicos();
    await cargarMascotas('todas'); // Cargar listado inicial
});

// 3. Llenar los menús desplegables (GET a Catálogos) [cite: 104]
async function cargarSelectsDinamicos() {
    const catalogos = [
        { tabla: 'especies', selectId: 'especie_id', esFiltro: true },
        { tabla: 'razas', selectId: 'raza_id', esFiltro: false },
        { tabla: 'tipos_atencion', selectId: 'tipo_atencion_id', esFiltro: false },
        { tabla: 'condiciones_medicas', selectId: 'condicion_medica_id', esFiltro: false }
    ];

    for (let cat of catalogos) {
        let { data, error } = await supabase.from(cat.tabla).select('id, nombre');
        if (!error && data) {
            const selectElement = document.getElementById(cat.selectId);
            data.forEach(item => {
                let opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.nombre;
                selectElement.appendChild(opt);
            });

            // Si es la tabla especies, llenamos también el filtro del listado
            if (cat.esFiltro) {
                const filtroEspecie = document.getElementById('filtroEspecie');
                data.forEach(item => {
                    let optFiltro = document.createElement('option');
                    optFiltro.value = item.id;
                    optFiltro.textContent = item.nombre;
                    filtroEspecie.appendChild(optFiltro);
                });
            }
        }
    }
}

// 4. Registro de Datos (POST a tabla principal) [cite: 108]
document.getElementById('formMascota').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    // Recolectar datos
    const nuevaMascota = {
        nombre_dueno: document.getElementById('nombre_dueno').value,
        apellido_dueno: document.getElementById('apellido_dueno').value,
        dni_dueno: document.getElementById('dni_dueno').value,
        celular: document.getElementById('celular').value,
        correo: document.getElementById('correo').value,
        nombre_mascota: document.getElementById('nombre_mascota').value,
        edad: parseInt(document.getElementById('edad').value),
        peso: parseFloat(document.getElementById('peso').value),
        especie_id: parseInt(document.getElementById('especie_id').value),
        raza_id: parseInt(document.getElementById('raza_id').value),
        tipo_atencion_id: parseInt(document.getElementById('tipo_atencion_id').value),
        condicion_medica_id: parseInt(document.getElementById('condicion_medica_id').value),
        observaciones: document.getElementById('observaciones').value
    };

    // Inserción en Supabase
    const { error } = await supabase.from('mascotas').insert([nuevaMascota]);

    const msj = document.getElementById('mensaje');
    msj.style.display = 'block';

    if (error) {
        msj.style.color = 'red';
        msj.textContent = 'Error al registrar: ' + error.message; [cite: 123]
    } else {
        msj.style.color = 'green';
        msj.textContent = 'Mascota registrada correctamente.'; [cite: 121]
        document.getElementById('formMascota').reset();
        await cargarMascotas(document.getElementById('filtroEspecie').value); // Recargar tabla
    }
    btn.disabled = false;
});

// 5. Cargar Listado con Cruce de Tablas (Joins)
async function cargarMascotas(especieFiltro) {
    const tbody = document.getElementById('tablaMascotas');
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Cargando registros...</td></tr>';

    // Construimos la consulta pidiendo los nombres de los catálogos en lugar de los IDs
    let query = supabase
        .from('mascotas')
        .select(`
            *,
            especies (nombre),
            razas (nombre),
            tipos_atencion (nombre),
            condiciones_medicas (nombre)
        `)
        .order('created_at', { ascending: false });

    // Aplicar filtro si no es "todas"
    if (especieFiltro !== 'todas') {
        query = query.eq('especie_id', parseInt(especieFiltro));
    }

    const { data, error } = await query;

    tbody.innerHTML = ''; // Limpiar cargando

    if (error) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:red;">Error cargando datos</td></tr>';
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No hay mascotas registradas.</td></tr>';
        return;
    }

    // Dibujar las filas en el HTML
    data.forEach(mascota => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${mascota.nombre_mascota}</strong></td>
            <td>${mascota.edad}</td>
            <td>${mascota.peso} kg</td>
            <td>${mascota.especies?.nombre || 'N/A'}</td>
            <td>${mascota.razas?.nombre || 'N/A'}</td>
            <td>${mascota.nombre_dueno} ${mascota.apellido_dueno}</td>
            <td>${mascota.dni_dueno}</td>
            <td>${mascota.celular}</td>
            <td>${mascota.tipos_atencion?.nombre || 'N/A'}</td>
            <td>${mascota.condiciones_medicas?.nombre || 'N/A'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 6. Evento del Filtro
document.getElementById('filtroEspecie').addEventListener('change', (e) => {
    cargarMascotas(e.target.value);
});
