// === Config ===
const URL = 'https://script.google.com/macros/s/AKfycbz777LNNqDGop1P7v2ERF5MLf_tuNnl6Mlwb7LwBI9oRP_mrEYV7TPTFUXU3iSjIDwiAA/exec'; // mismo que tenías

// Estado: carrito acumulado de artículos por ID de fila (sheet)
const carrito = new Map();  // key = filaIndex, value = { n_ant, marca, modelo, color, armazon, calibre, fecha, vendedor, checked }
let ultimoIdAgregado = null; // para enfocar input de vendedor
const ventasSesion = [];     // resumen de esta sesión (solo lo que se registra ahora)

// Utilidad: mensajes flotantes
function mostrarMensaje(texto, color = "#28a745") {
  const div = document.getElementById("mensaje-flotante");
  div.innerText = texto;
  div.style.backgroundColor = color;
  div.style.display = "block";
  setTimeout(() => { div.style.display = "none"; }, 2000);
}

// ==== Inicio ====
document.addEventListener('DOMContentLoaded', () => {
  const hoy = new Date();
  document.getElementById("fechaActual").innerText = formatearFechaCorta(hoy);

  // Buscar con Enter
  document.getElementById("codigo").addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscarArticulo();
    if (e.key === "Tab") {
      // tu flujo original
      e.preventDefault();
      document.getElementById("vendedor").focus();
    }
  });

  // Buscar al salir del input
  document.getElementById("codigo").addEventListener("blur", buscarArticulo);

  // Registrar con Enter desde el vendedor global (compatibilidad)
  document.getElementById("vendedor").addEventListener("keydown", (e) => {
    if (e.key === "Enter") registrarVenta();
  });

  // crear panel de resumen (si no existe)
  ensureResumenPanel();

  actualizarTopVendedor();
  renderCarrito();
});

// ==== Buscar y ACUMULAR ====
async function buscarArticulo() {
  const codigo = document.getElementById('codigo').value.trim();
  if (!codigo) {
    mostrarMensaje("Ingresá un código.", "#dc3545");
    return;
  }

  document.getElementById('spinner').style.display = 'block';
  try {
    const response = await fetch(`${URL}?codigo=${encodeURIComponent(codigo)}`);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      mostrarMensaje("No se encontraron resultados.", "#dc3545");
      document.getElementById('spinner').style.display = 'none';
      return;
    }

    // Coincidencia EXACTA por N° ANT (col 0); sino el primero
    let fila = data.find(r => String(r[0]).trim() === codigo) || data[0];

    const filaIndex = fila[8];                // id de fila en sheet (como ya usabas)
    const n_ant    = fila[0] ?? "";
    const marca    = fila[1] ?? "";
    const modelo   = fila[2] ?? "";
    const color    = fila[3] ?? "";
    const armazon  = fila[4] ?? "";
    const calibre  = fila[5] ?? "";
    const fechaRaw = fila[10];
    const fecha    = fechaRaw ? formatearFechaTexto(fechaRaw) : "";
    const vendedor = (fila[11] ?? "").toString().toUpperCase();

    // Evitar duplicados: si ya existe, solo lo marca
    if (carrito.has(String(filaIndex))) {
      const item = carrito.get(String(filaIndex));
      item.checked = true;
      carrito.set(String(filaIndex), item);
    } else {
      carrito.set(String(filaIndex), {
        n_ant, marca, modelo, color, armazon, calibre, fecha,
        vendedor, checked: true
      });
    }

    ultimoIdAgregado = String(filaIndex); // para enfocar el input de vendedor
    renderCarrito();

    // limpiar input y foco en código para seguir buscando rápido
    document.getElementById('codigo').value = '';
  } catch (e) {
    console.error(e);
    mostrarMensaje("Error al buscar el artículo.", "#dc3545");
  } finally {
    document.getElementById('spinner').style.display = 'none';
  }
}

// ==== Render de la tabla acumulada ====
function renderCarrito() {
  const cont = document.getElementById('resultados');
  if (carrito.size === 0) {
    cont.innerHTML = "<p>No hay artículos en la lista.</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>✔</th>
          <th>N° ANT</th>
          <th>MARCA</th>
          <th>MODELO</th>
          <th>COLOR</th>
          <th>ARMAZON</th>
          <th>CALIBRE</th>
          <th>FECHA DE</th>
          <th>VENDEDOR</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const [id, it] of carrito.entries()) {
    html += `
      <tr data-id="${id}">
        <td>
          <input type="checkbox" ${it.checked ? "checked" : ""} onchange="toggleSeleccion(this)" data-id="${id}">
        </td>
        <td>${safe(it.n_ant)}</td>
        <td>${safe(it.marca)}</td>
        <td>${safe(it.modelo)}</td>
        <td>${safe(it.color)}</td>
        <td>${safe(it.armazon)}</td>
        <td>${safe(it.calibre)}</td>
        <td>${safe(it.fecha)}</td>
        <td>
          <input type="text"
                 class="input-vendedor"
                 style="text-transform:uppercase; width:140px; padding:6px"
                 value="${safe(it.vendedor)}"
                 data-id="${id}"
                 oninput="cambiarVendedor(this)">
        </td>
        <td>
          <button type="button" onclick="quitarFila('${id}')">Quitar</button>
        </td>
      </tr>
    `;
  }

  html += `</tbody></table>`;
  cont.innerHTML = html;

  // Enfocar el input de vendedor del último agregado (si existe)
  if (ultimoIdAgregado) {
    setTimeout(() => {
      const inputVend = cont.querySelector(`input.input-vendedor[data-id="${ultimoIdAgregado}"]`);
      if (inputVend) inputVend.focus();
    }, 0);
  }
}

// helper: escapar texto
function safe(v) {
  return (v ?? "").toString().replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}

// Cambiar vendedor por fila (mayúsculas)
function cambiarVendedor(el) {
  const id = el.dataset.id;
  if (!carrito.has(id)) return;
  carrito.get(id).vendedor = el.value.toUpperCase();
}

// Tildar/destildar una fila
function toggleSeleccion(chk) {
  const id = chk.dataset.id;
  if (!carrito.has(id)) return;
  carrito.get(id).checked = chk.checked;
}

// Quitar visualmente de la lista (no toca la hoja)
function quitarFila(id) {
  carrito.delete(id);
  renderCarrito();
}

// ==== Registrar ventas seleccionadas (todas juntas) ====
// Nota: mantiene tu esquema actual de requests: ?fila=X&vendedor=Y y espera {success:true}
async function registrarVenta() {
  const vendedorGlobal = (document.getElementById('vendedor').value || '').trim().toUpperCase();

  // Reunir seleccionados
  const seleccionados = Array.from(carrito.entries())
    .filter(([_, it]) => it.checked);

  if (seleccionados.length === 0) {
    mostrarMensaje("Seleccioná al menos un artículo.", "#dc3545");
    return;
  }

  // Validar vendedores por fila (fila con vacío toma el global si hay)
  for (const [id, it] of seleccionados) {
    const vend = it.vendedor && it.vendedor.trim() ? it.vendedor.trim() : vendedorGlobal;
    if (!vend) {
      mostrarMensaje(`Falta vendedor en N° ${it.n_ant}.`, "#dc3545");
      return;
    }
  }

  let exitos = 0;
  for (const [id, it] of seleccionados) {
    const vend = it.vendedor && it.vendedor.trim() ? it.vendedor.trim() : vendedorGlobal;
    try {
      const res = await fetch(`${URL}?fila=${encodeURIComponent(id)}&vendedor=${encodeURIComponent(vend)}`);
      const json = await res.json();
      if (json && json.success) {
        exitos++;
        // Guardar en resumen de sesión
        ventasSesion.push({
          n_ant: it.n_ant,
          vendedor: vend,
          hora: new Date()
        });
        carrito.delete(id); // removemos del carrito al venderse
      }
    } catch (e) {
      console.error("Error registrando venta en fila", id, e);
    }
  }

  if (exitos > 0) {
    mostrarMensaje(`Se registraron ${exitos} venta(s) correctamente.`);
    document.getElementById('vendedor').value = '';
    actualizarTopVendedor();
    renderCarrito();
    renderResumenSesion(); // actualizar panel de resumen
  } else {
    mostrarMensaje("Hubo un error al registrar las ventas.", "#dc3545");
  }
}

// ==== Eliminar ventas seleccionadas (deshacer en la hoja) ====
async function eliminarVenta() {
  const seleccionados = Array.from(carrito.keys())
    .filter(id => carrito.get(id).checked);

  if (seleccionados.length === 0) {
    mostrarMensaje("Seleccioná al menos un artículo para eliminar.", "#dc3545");
    return;
  }

  const confirmar = confirm(`¿Estás seguro de que querés eliminar ${seleccionados.length} venta(s)?`);
  if (!confirmar) return;

  let eliminados = 0;

  for (const id of seleccionados) {
    try {
      const res = await fetch(`${URL}?fila=${encodeURIComponent(id)}&borrar=true`);
      const json = await res.json();
      if (json && json.success) {
        eliminados++;
        carrito.delete(id);
      }
    } catch (e) {
      console.error("Error eliminando venta en fila", id, e);
    }
  }

  if (eliminados > 0) {
    mostrarMensaje(`Se eliminaron ${eliminados} venta(s) correctamente.`, "#ffc107");
    document.getElementById('vendedor').value = '';
    actualizarTopVendedor();
    renderCarrito();
  } else {
    mostrarMensaje("Error al eliminar las ventas.", "#dc3545");
  }
}

// ==== Ranking (igual que ya tenías) ====
function actualizarTopVendedor() {
  fetch(`${URL}?topVendedor=true`)
    .then(res => res.json())
    .then(data => {
      const ranking = data.ranking || [];
      if (ranking.length > 0) {
        const top = ranking[0];
        document.getElementById("top-vendedor").value = `${top.vendedor} (${top.cantidad} ventas)`;

        const lista = document.getElementById("lista-vendedores");
        lista.innerHTML = "";
        ranking.slice(1).forEach(item => {
          const li = document.createElement("li");
          li.textContent = `${item.vendedor} — ${item.cantidad} venta${item.cantidad === 1 ? "" : "s"}`;
          lista.appendChild(li);
        });
      } else {
        document.getElementById("top-vendedor").value = "Sin datos";
        document.getElementById("lista-vendedores").innerHTML = "<li>No hay vendedores aún.</li>";
      }
    })
    .catch(err => {
      console.error("Error obteniendo ranking de vendedores:", err);
      document.getElementById("top-vendedor").value = "Error";
      document.getElementById("lista-vendedores").innerHTML = "<li>Error al cargar ranking.</li>";
    });
}

// ==== Panel de RESUMEN DE SESIÓN ====
function ensureResumenPanel() {
  if (document.getElementById('resumen-sesion')) return;

  const container = document.querySelector('.container') || document.body; // container existe en tu HTML
  const panel = document.createElement('div');
  panel.id = 'resumen-sesion';
  panel.style.marginTop = '24px';
  panel.style.background = '#ffffff';
  panel.style.border = '1px solid #ccc';
  panel.style.borderRadius = '8px';
  panel.style.padding = '12px';

  panel.innerHTML = `
    <strong>🧾 Resumen de esta sesión</strong>
    <div id="resumen-contenido" style="margin-top:8px; color:#555">Todavía no registraste ventas.</div>
  `;
  container.appendChild(panel);
}

function renderResumenSesion() {
  const cont = document.getElementById('resumen-contenido');
  if (!cont) return;

  if (ventasSesion.length === 0) {
    cont.innerHTML = 'Todavía no registraste ventas.';
    return;
  }

  let html = `
    <table style="width:100%; border-collapse:collapse">
      <thead>
        <tr>
          <th style="border:1px solid #ccc; padding:6px; text-align:center">Hora</th>
          <th style="border:1px solid #ccc; padding:6px; text-align:center">N° ANT</th>
          <th style="border:1px solid #ccc; padding:6px; text-align:center">Vendedor</th>
        </tr>
      </thead>
      <tbody>
  `;
  for (const v of ventasSesion) {
    html += `
      <tr>
        <td style="border:1px solid #ccc; padding:6px; text-align:center">${formatearHora(v.hora)}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center">${safe(v.n_ant)}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center">${safe(v.vendedor)}</td>
      </tr>
    `;
  }
  html += `</tbody></table>`;
  cont.innerHTML = html;
}

function formatearHora(dateObj) {
  const d = (dateObj instanceof Date) ? dateObj : new Date(dateObj);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ==== Formatos de fecha ====
function formatearFechaCorta(fecha) {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const año = fecha.getFullYear();
  return `${dia}-${mes}-${año}`;
}

function formatearFechaTexto(fechaTexto) {
  const fecha = new Date(fechaTexto);
  if (isNaN(fecha)) return fechaTexto;
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const año = fecha.getFullYear();
  return `${dia}-${mes}-${año}`;
}

// Exponer funciones que se usan en atributos inline del render
window.toggleSeleccion = toggleSeleccion;
window.cambiarVendedor = cambiarVendedor;
window.quitarFila = quitarFila;
window.buscarArticulo = buscarArticulo;
window.registrarVenta = registrarVenta;
window.eliminarVenta = eliminarVenta;
