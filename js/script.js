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

  document.getElementById("vendedor").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      registrarVenta();
    }
  });
});

async function buscarArticulo() {
  const codigo = document.getElementById('codigo').value.trim();
  if (!codigo) {
    mostrarMensaje("Ingresá un código.", "#dc3545");
    return;
  }

  const response = await fetch(`${URL}?codigo=${codigo}`);
  const data = await response.json();
  mostrarResultados(data);
}

function mostrarResultados(data) {
  const contenedor = document.getElementById('resultados');
  filasSeleccionadas = [];

  if (data.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }

  const headers = ["✔", "N° ANT", "MARCA", "MODELO", "COLOR", "ARMAZON", "CALIBRE", "FECHA DE", "VENDEDOR"];
  let html = "<table><thead><tr>";
  headers.forEach(header => html += `<th>${header}</th>`);
  html += "</tr></thead><tbody>";

  const maxResultados = 5;
  data.slice(0, maxResultados).forEach((fila, index) => {
  const filaIndex = fila[8];
  const checked = index === 0 ? "checked" : "";
  if (index === 0) {
    filasSeleccionadas.push(filaIndex);
  }

  html += "<tr>";
  html += `<td><input type="checkbox" value="${filaIndex}" ${checked} onchange="toggleSeleccion(this)"></td>`;

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
  if (!vendedor) {
    mostrarMensaje("Ingresá el nombre del vendedor.", "#dc3545");
    return;
  }
  if (filasSeleccionadas.length === 0) {
    mostrarMensaje("Seleccioná al menos un artículo.", "#dc3545");
    return;
  }

  let exitos = 0;

  for (const fila of filasSeleccionadas) {
    const response = await fetch(`${URL}?fila=${fila}&vendedor=${encodeURIComponent(vendedor)}`);
    const result = await response.json();
    if (result.success) exitos++;
  }

  if (exitos > 0) {
    mostrarMensaje(`Se registraron ${exitos} venta(s) correctamente.`);
    buscarArticulo();
    document.getElementById('vendedor').value = '';
  } else {
    mostrarMensaje("Hubo un error al registrar las ventas.", "#dc3545");
  }
}

async function eliminarVenta() {
  if (filasSeleccionadas.length === 0) {
    mostrarMensaje("Seleccioná al menos un artículo para eliminar.", "#dc3545");
    return;
  }

  const confirmar = confirm(`¿Estás seguro de que querés eliminar ${filasSeleccionadas.length} venta(s)?`);
  if (!confirmar) return;

  let eliminados = 0;

  for (const fila of filasSeleccionadas) {
    const response = await fetch(`${URL}?fila=${fila}&borrar=true`);
    const result = await response.json();
    if (result.success) eliminados++;
  }

  if (eliminados > 0) {
    mostrarMensaje(`Se eliminaron ${eliminados} venta(s) correctamente.`, "#ffc107");
    buscarArticulo();
    document.getElementById('vendedor').value = '';
  } else {
    mostrarMensaje("Error al eliminar las ventas.", "#dc3545");
  }
}

function mostrarMensaje(texto, color = "#28a745") {
  const div = document.getElementById("mensaje-flotante");
  div.innerText = texto;
  div.style.backgroundColor = color;
  div.style.display = "block";

  setTimeout(() => {
    div.style.display = "none";
  }, 2000);
}
