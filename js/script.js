const URL = 'https://script.google.com/macros/s/AKfycbxT6imc7LuSZUFIyPNXOrgnXoyLQzytzr-thNI4cylyg1s8Ms19dT2xv-okCCbdsZLWoA/exec';
let filasSeleccionadas = [];

document.addEventListener('DOMContentLoaded', () => {
  const hoy = new Date();
  document.getElementById("fechaActual").innerText = hoy.toLocaleDateString("es-AR") + " " + hoy.toLocaleTimeString("es-AR");

  document.getElementById("codigo").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      buscarArticulo();
    }
  });
});

async function buscarArticulo() {
  const codigo = document.getElementById('codigo').value.trim();
  if (!codigo) return alert("Ingresá un código.");

  const response = await fetch(`${URL}?codigo=${codigo}`);
  const data = await response.json();
  mostrarResultados(data);
}

function mostrarResultados(data) {
  const contenedor = document.getElementById('resultados');
  filasSeleccionadas = []; // Reiniciar selección

  if (data.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }

  const headers = ["✔", "N° ANT", "MARCA", "MODELO", "COLOR", "ARMAZON", "CALIBRE", "FECHA DE", "VENDEDOR"];
  let html = "<table><thead><tr>";
  headers.forEach(header => html += `<th>${header}</th>`);
  html += "</tr></thead><tbody>";

  const maxResultados = 5;
  data.slice(0, maxResultados).forEach((fila) => {
    const filaIndex = fila[8];
    html += "<tr>";
    html += `<td><input type="checkbox" value="${filaIndex}" onchange="toggleSeleccion(this)"></td>`;
    html += `<td>${fila[0]}</td><td>${fila[1]}</td><td>${fila[3]}</td><td>${fila[4]}</td><td>${fila[6]}</td><td>${fila[7]}</td><td>${fila[10]}</td><td>${fila[11]}</td>`;
    html += "</tr>";
  });

  html += "</tbody></table>";
  contenedor.innerHTML = html;
}

function toggleSeleccion(checkbox) {
  const valor = checkbox.value;
  if (checkbox.checked) {
    filasSeleccionadas.push(valor);
  } else {
    filasSeleccionadas = filasSeleccionadas.filter(f => f !== valor);
  }
}

async function registrarVenta() {
  const vendedor = document.getElementById('vendedor').value.trim();
  if (!vendedor) return alert("Ingresá el nombre del vendedor.");
  if (filasSeleccionadas.length === 0) return alert("Seleccioná al menos un artículo.");

  let exitos = 0;

  for (const fila of filasSeleccionadas) {
    const response = await fetch(`${URL}?fila=${fila}&vendedor=${encodeURIComponent(vendedor)}`);
    const result = await response.json();
    if (result.success) exitos++;
  }

  if (exitos > 0) {
    alert(`Se registraron ${exitos} venta(s) correctamente.`);
    buscarArticulo(); // Recarga la tabla
    document.getElementById('vendedor').value = '';
  } else {
    alert("Hubo un error al registrar las ventas.");
  }
}

async function eliminarVenta() {
  if (filasSeleccionadas.length === 0) return alert("Seleccioná al menos un artículo para eliminar la venta.");

  const confirmar = confirm(`¿Estás seguro de que querés eliminar ${filasSeleccionadas.length} venta(s)?`);
  if (!confirmar) return;

  let eliminados = 0;

  for (const fila of filasSeleccionadas) {
    const response = await fetch(`${URL}?fila=${fila}&borrar=true`);
    const result = await response.json();
    if (result.success) eliminados++;
  }

  if (eliminados > 0) {
    alert(`Se eliminaron ${eliminados} venta(s) correctamente.`);
    buscarArticulo();
    document.getElementById('vendedor').value = '';
  } else {
    alert("Error al eliminar las ventas.");
  }
}
