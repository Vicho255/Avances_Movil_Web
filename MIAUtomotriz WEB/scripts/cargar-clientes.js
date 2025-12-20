// cargar-clientes.js - Versión corregida

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Inicializando carga de clientes');
    
    cargarClientes();
    
    // Si hay un botón de recarga
    const btnRecargar = document.getElementById('btnRecargar');
    if (btnRecargar) {
        btnRecargar.addEventListener('click', cargarClientes);
    }
});

async function cargarClientes() {
    console.log('📡 Cargando clientes...');
    
    try {
        const response = await fetch('api/get-clientes.php', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'same-origin'
        });
        
        console.log('📊 Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Datos recibidos:', data);
        
        // Verificar la estructura de la respuesta
        let clientesArray = [];
        
        if (data.success === true) {
            // Formato 1: {success: true, data: [...]}
            if (Array.isArray(data.data)) {
                clientesArray = data.data;
                console.log(`✅ ${clientesArray.length} clientes en data.data`);
            } 
            // Formato 2: {success: true, clientes: [...]}
            else if (Array.isArray(data.clientes)) {
                clientesArray = data.clientes;
                console.log(`✅ ${clientesArray.length} clientes en data.clientes`);
            }
            // Formato 3: {success: true, results: [...]}
            else if (Array.isArray(data.results)) {
                clientesArray = data.results;
                console.log(`✅ ${clientesArray.length} clientes en data.results`);
            }
            // Buscar cualquier array en el objeto
            else {
                const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
                if (arrayKeys.length > 0) {
                    clientesArray = data[arrayKeys[0]];
                    console.log(`✅ ${clientesArray.length} clientes en data.${arrayKeys[0]}`);
                } else {
                    console.error('❌ No se encontró array en la respuesta:', data);
                    throw new Error('Formato de respuesta no reconocido');
                }
            }
        } 
        // Formato 4: Array directo
        else if (Array.isArray(data)) {
            clientesArray = data;
            console.log(`✅ ${clientesArray.length} clientes en array directo`);
        }
        // Error en la API
        else if (data.success === false) {
            throw new Error(data.message || data.error || 'Error en la API');
        }
        // Formato no reconocido
        else {
            console.error('❌ Formato no reconocido:', data);
            throw new Error('Formato de respuesta no válido');
        }
        
        // Verificar que tenemos un array
        if (!Array.isArray(clientesArray)) {
            throw new Error('Los datos recibidos no son un array válido');
        }
        
        console.log(`👥 ${clientesArray.length} clientes para mostrar`);
        
        if (clientesArray.length === 0) {
            mostrarMensaje('No hay clientes registrados');
            return;
        }
        
        // Mostrar clientes
        mostrarClientes(clientesArray);
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarMensaje('Error: ' + error.message);
    }
}

function mostrarClientes(clientes) {
    console.log('🎨 Mostrando', clientes.length, 'clientes');
    
    const contenedor = document.getElementById('clientesContainer');
    if (!contenedor) {
        console.error('❌ Elemento clientesContainer no encontrado');
        return;
    }
    
    // Limpiar contenedor
    contenedor.innerHTML = '';
    
    // Crear tabla
    const tabla = document.createElement('table');
    tabla.className = 'clientes-table';
    tabla.innerHTML = `
        <thead>
            <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody id="clientesTableBody">
        </tbody>
    `;
    
    contenedor.appendChild(tabla);
    
    const tbody = document.getElementById('clientesTableBody');
    
    // Agregar cada cliente
    clientes.forEach(cliente => {
        const fila = document.createElement('tr');
        
        // Obtener valores con valores por defecto
        const rut = cliente.RUT || cliente.rut || 'Sin RUT';
        const nombre = cliente.Nombre || cliente.nombre || '';
        const apellido = cliente.Apellido || cliente.apellido || '';
        const email = cliente.email || cliente.Email || cliente.correo || 'No registrado';
        const telefono = cliente.telefono || cliente.Telefono || cliente.phone || 'No registrado';
        const fechaRegistro = cliente.Fecha_Registro || cliente.fecha_registro || '';
        
        // Formatear fecha
        const fechaFormateada = fechaRegistro ? formatDate(fechaRegistro) : 'No registrada';
        
        fila.innerHTML = `
            <td>${escapeHTML(rut)}</td>
            <td>${escapeHTML(nombre)}</td>
            <td>${escapeHTML(apellido)}</td>
            <td>${escapeHTML(email)}</td>
            <td>${escapeHTML(telefono)}</td>
            <td>${fechaFormateada}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="verCliente('${escapeHTML(rut)}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editarCliente('${escapeHTML(rut)}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="eliminarCliente('${escapeHTML(rut)}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(fila);
    });
    
    // Actualizar contador si existe
    const contador = document.getElementById('clientCount');
    if (contador) {
        contador.textContent = clientes.length;
    }
    
    console.log('✅ Tabla creada con', clientes.length, 'filas');
}

function mostrarMensaje(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('clientesContainer');
    if (!contenedor) return;
    
    const color = tipo === 'error' ? '#dc2626' : 
                  tipo === 'success' ? '#059669' : '#3b82f6';
    
    contenedor.innerHTML = `
        <div style="text-align: center; padding: 40px; color: ${color};">
            <i class="fas fa-${tipo === 'error' ? 'exclamation-triangle' : 
                               tipo === 'success' ? 'check-circle' : 'info-circle'}" 
               style="font-size: 48px; margin-bottom: 20px;">
            </i>
            <h3>${escapeHTML(mensaje)}</h3>
            ${tipo === 'error' ? 
                '<button onclick="cargarClientes()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Reintentar</button>' : 
                ''}
        </div>
    `;
}

// Funciones auxiliares
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Funciones globales para botones
window.verCliente = function(rut) {
    console.log('Ver cliente:', rut);
    // Implementar lógica de visualización
    alert('Ver cliente: ' + rut);
};

window.editarCliente = function(rut) {
    console.log('Editar cliente:', rut);
    // Implementar lógica de edición
    alert('Editar cliente: ' + rut);
};

window.eliminarCliente = function(rut) {
    if (confirm(`¿Eliminar cliente ${rut}?`)) {
        console.log('Eliminar cliente:', rut);
        // Implementar lógica de eliminación
        alert('Eliminar cliente: ' + rut);
    }
};