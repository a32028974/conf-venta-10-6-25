
const URL = 'https://script.google.com/macros/s/AKfycbwSV4RDJa95Ey7T4r-W4A7ZicdeczobxQ88vpSYoVPOVs5AIjwzrKEdxEGS5d3tfXEwhA/exec';
let filaSeleccionada = null;

document.addEventListener('DOMContentLoaded', () => {
  const hoy = new Date();
  document.getElementById("fechaActual").innerText = hoy.toLocaleDateString("es-AR") + " " + hoy.toLocaleTimeString("es-AR");
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

  let html = "<table><thead><tr><th>✔</th><th>D</th><th>E</th><th>G</th><th>H</th><th>I</th><th>K</th><th>L</th></tr></thead><tbody>";

  data.forEach((fila, index) => {
    html += "<tr>";
    html += `<td><input type="radio" name="seleccion" value="${fila[8]}" ${data.length === 1 ? "checked" : ""} onchange="filaSeleccionada=${fila[8]}"></td>`;
    html += `<td>${fila[3]}</td><td>${fila[4]}</td><td>${fila[6]}</td><td>${fila[7]}</td><td>${fila[8]}</td><td>${fila[10]}</td><td>${fila[11]}</td>`;
    html += "</tr>";
  });

  html += "</tbody></table>";
  contenedor.innerHTML = html;

  if (data.length === 1) {
    filaSeleccionada = data[0][8];
  }
}

async function registrarVenta() {
  const vendedor = document.getElementById('vendedor').value.trim();
  if (!vendedor) return alert("Ingresá el nombre del vendedor.");
  if (filaSeleccionada === null) return alert("Seleccioná un artículo.");

  const response = await fetch(`${URL}?fila=${filaSeleccionada}&vendedor=${encodeURIComponent(vendedor)}`);
  const result = await response.json();

  if (result.success) {
    alert("Venta registrada correctamente.");
    document.getElementById('resultados').innerHTML = '';
    document.getElementById('vendedor').value = '';
  } else {
    alert("Hubo un error al registrar la venta.");
  }
}
