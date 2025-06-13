const URL = 'https://script.google.com/macros/s/AKfycbxT6imc7LuSZUFIyPNXOrgnXoyLQzytzr-thNI4cylyg1s8Ms19dT2xv-okCCbdsZLWoA/exec';
let filaSeleccionada = null;

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
    html += "<tr>";
    html += `<td><input type="radio" name="seleccion" value="${filaIndex}" ${checked} onchange="filaSeleccionada=${filaIndex}"></td>`;
    html += `<td>${fila[0]}</td><td>${fila[1]}</td><td>${fila[3]}</td><td>${fila[4]}</td><td>${fila[6]}</td><td>${fila[7]}</td><td>${fila[10]}</td><td>${fila[11]}</td>`;
    html += "</tr>";

    if (index === 0) {
      filaSeleccionada = filaIndex;
    }
  });

  html += "</tbody></table>";
  contenedor.innerHTML = html;
}

async function registrarVenta() {
  const vendedor = document.getElementById('vendedor').value.trim();
  if (!vendedor) return alert("Ingresá el nombre del vendedor.");
  if (filaSeleccionada === null) return alert("Seleccioná un artículo.");

  const response = await fetch(`${URL}?fila=${filaSeleccionada}&vendedor=${encodeURIComponent(vendedor)}`);
  const result = await response.json();

  if (result.success) {
    alert("Venta registrada correctamente.");
    buscarArticulo();
    document.getElementById('vendedor').value = '';
  } else {
    alert("Hubo un error al registrar la venta.");
  }
}

async function eliminarVenta() {
  if (filaSeleccionada === null) return alert("Seleccioná un artículo para eliminar la venta.");

  const confirmar = confirm("¿Estás seguro de que querés eliminar esta venta?");
  if (!confirmar) return;

  const response = await fetch(`${URL}?fila=${filaSeleccionada}&borrar=true`);
  const result = await response.json();

  if (result.success) {
    alert("Venta eliminada correctamente.");
    buscarArticulo();
    document.getElementById('vendedor').value = '';
  } else {
    alert("Error al eliminar la venta.");
  }
}
