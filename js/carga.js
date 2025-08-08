const URL = 'https://script.google.com/macros/s/AKfycbwTzBbMEISZjU3rvn5uEzjQN20iO-xg_EBgXbwXgQTTv-4ULYGoRCft6bWUwDcimyeUMQ/exec';

// ===== Claves en localStorage =====
const LS_MARCA_KEY = 'ultimaMarcaAnteojos';
const LS_FAMILIA_KEY = 'ultimaFamiliaAnteojos';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Recuperar MARCA y FAMILIA guardadas
    const guardadaMarca = localStorage.getItem(LS_MARCA_KEY);
    if (guardadaMarca) {
      const marcaInput = document.getElementById('marca');
      if (marcaInput) marcaInput.value = guardadaMarca;
    }
    const guardadaFamilia = localStorage.getItem(LS_FAMILIA_KEY);
    if (guardadaFamilia) {
      const familiaSelect = document.getElementById('familia');
      if (familiaSelect) familiaSelect.value = guardadaFamilia;
    }

    // Buscar número libre
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

    if (numeroLibre) {
      document.getElementById('n_anteojo').value = numeroLibre;
    } else {
      document.getElementById('mensaje-flotante').innerText = "⚠ No se encontró número libre.";
    }
  } catch (error) {
    console.error("Error al buscar número:", error);
    document.getElementById("mensaje-flotante").innerText = "⚠ Error al buscar número.";
  }

  // Guardar MARCA y FAMILIA a medida que cambian
  const marcaEl = document.getElementById('marca');
  if (marcaEl) {
    const persistMarca = () => {
      const v = marcaEl.value.trim();
      if (v) localStorage.setItem(LS_MARCA_KEY, v);
    };
    marcaEl.addEventListener('change', persistMarca);
    marcaEl.addEventListener('input', persistMarca);
  }

  const familiaEl = document.getElementById('familia');
  if (familiaEl) {
    const persistFamilia = () => {
      const v = familiaEl.value;
      if (v) localStorage.setItem(LS_FAMILIA_KEY, v);
    };
    familiaEl.addEventListener('change', persistFamilia);
  }
});

// ===== Enter = Guardar (salvo Shift+Enter en textarea) =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const tag = e.target.tagName;
    if (tag === 'TEXTAREA') {
      e.preventDefault();
      guardar();
    } else if (tag === 'INPUT' || tag === 'SELECT') {
      e.preventDefault();
      guardar();
    }
  }
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
  const n_anteojo = document.getElementById("n_anteojo").value.trim();
  const marca = document.getElementById("marca").value.trim();
  const modelo = document.getElementById("modelo").value.trim();

  if (!n_anteojo || !marca || !modelo) {
    mostrarMensaje("⚠ Completá N° anteojo, marca y modelo.", "red");
    return;
  }

  // Guardar en localStorage para la próxima carga
  localStorage.setItem(LS_MARCA_KEY, marca);
  const familiaVal = document.getElementById("familia").value;
  if (familiaVal) localStorage.setItem(LS_FAMILIA_KEY, familiaVal);

  const params = new URLSearchParams({
    n_anteojo,
    marca,
    modelo,
    codigo_color: document.getElementById("codigo_color").value.trim(),
    color_armazon: document.getElementById("color_armazon").value.trim(),
    calibre: document.getElementById("calibre").value.trim(),
    color_cristal: document.getElementById("color_cristal").value.trim(),
    familia: familiaVal,
    precio: document.getElementById("precio").value,
    costo: document.getElementById("costo").value,
    fecha_ingreso: new Date().toLocaleDateString("es-AR"),
    codigo_barras: document.getElementById("codigo_barras").value.trim(),
    observaciones: document.getElementById("observaciones").value.trim()
  });

  try {
    const res = await fetch(`${URL}?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      mostrarMensaje(`✅ Guardado correctamente: ${n_anteojo}`, "green");
      setTimeout(() => location.reload(), 800);
    } else {
      mostrarMensaje("❌ Error al guardar.", "red");
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje("❌ Error de conexión con el servidor.", "red");
  }
}

function mostrarMensaje(texto, color = "black") {
  const msg = document.getElementById("mensaje-flotante");
  msg.innerText = texto;
  msg.style.color = color;
}
