const URL = 'https://script.google.com/macros/s/AKfycbyZpgCOy4VFFPE_gq_jpv9Ed5KsPjJqLAX-8SEohVRYl_qAm2PIpEtpAALLvRx9Bdt7Pg/exec';

document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch(`${URL}?todos=true`);
  const datos = await res.json();

  let numeroLibre = '';
  for (let i = 1; i < datos.length; i++) {
    const fila = datos[i];
    const estaVacia = fila.slice(1, 8).every(c => !c);
    if (fila[0] && estaVacia) {
      numeroLibre = fila[0];
      break;
    }
  }

  document.getElementById('n_anteojo').value = numeroLibre;
});

function calcularPrecio() {
  const costo = parseFloat(document.getElementById('costo').value);
  const familia = document.getElementById('familia').value;
  if (!isNaN(costo) && (familia === "SOL" || familia === "RECETA")) {
    const multiplicador = familia === "RECETA" ? 3.63 : 2.42;
    const precio = Math.round(costo * multiplicador);
    document.getElementById('precio').value = precio;
  } else {
    document.getElementById('precio').value = '';
  }
}

async function guardar() {
  const params = new URLSearchParams({
    n_anteojo: document.getElementById("n_anteojo").value,
    marca: document.getElementById("marca").value,
    modelo: document.getElementById("modelo").value,
    codigo_color: document.getElementById("codigo_color").value,
    color_armazon: document.getElementById("color_armazon").value,
    calibre: document.getElementById("calibre").value,
    color_cristal: document.getElementById("color_cristal").value,
    familia: document.getElementById("familia").value,
    precio: document.getElementById("precio").value,
    costo: document.getElementById("costo").value,
    fecha_ingreso: new Date().toLocaleDateString("es-AR"),
    codigo_barras: document.getElementById("codigo_barras").value,
    observaciones: document.getElementById("observaciones").value
  });

  try {
    const res = await fetch(`${URL}?${params.toString()}`);
    const data = await res.json();

    const msg = document.getElementById("mensaje-flotante");
    if (data.success) {
      msg.innerText = `✅ Guardado correctamente: ${params.get("n_anteojo")}`;
      msg.style.color = "green";
      setTimeout(() => location.reload(), 1500);
    } else {
      msg.innerText = "❌ Error al guardar.";
      msg.style.color = "red";
    }
  } catch (error) {
    console.error(error);
    document.getElementById("mensaje-flotante").innerText = "❌ Error de conexión.";
  }
}
