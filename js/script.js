const URL = 'https://script.google.com/macros/s/AKfycbyZpgCOy4VFFPE_gq_jpv9Ed5KsPjJqLAX-8SEohVRYl_qAm2PIpEtpAALLvRx9Bdt7Pg/exec';
let filasSeleccionadas = [];

document.addEventListener('DOMContentLoaded', () => {
  const hoy = new Date();
  document.getElementById("fechaActual").innerText = hoy.toLocaleDateString("es-AR") + " " + hoy.toLocaleTimeString("es-AR");

  document.getElementById("codigo").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      buscarArticulo();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      document.getElementById("vendedor").focus();
    }
  });

  document.getElementById("vendedor").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      registrarVenta();
    }
  });

  actualizarTopVendedor();
});

async function buscarArticulo() {
  const codigo = document.getElementById('codigo').value.trim();
  if (!codigo) {
    mostrarMensaje("Ingresá un código.", "#dc3545");
    return;
  }

  document.getElementById('spinner').style.display = 'block';

  const response = await fetch(`${URL}?codigo=${codigo}`);
  const data = await response.json();
  mostrarResultados(data);

  document.getElementById('spinner').style.display = 'none';
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
    html += `<td>${fila[0]}</td>`;  // N° ANT
    html += `<td>${fila[1]}</td>`;  // MARCA
    html += `<td>${fila[2]}</td>`;  // MODELO
    html += `<td>${fila[3]}</td>`;  // COLOR
    html += `<td>${fila[4]}</td>`;  // ARMAZON
    html += `<td>${fila[5]}</td>`;  // CALIBRE
    html += `<td>${fila[10]}</td>`; // FECHA DE VENTA
    html += `<td>${fila[11]}</td>`; // VENDEDOR
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
    actualizarTopVendedor();
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
    actualizarTopVendedor();
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
