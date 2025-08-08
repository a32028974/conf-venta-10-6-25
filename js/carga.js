const URL = 'https://script.google.com/macros/s/AKfycbwTzBbMEISZjU3rvn5uEzjQN20iO-xg_EBgXbwXgQTTv-4ULYGoRCft6bWUwDcimyeUMQ/exec';

// ===== Claves en localStorage =====
const LS_MARCA_KEY = 'ultimaMarcaAnteojos';
const LS_FAMILIA_KEY = 'ultimaFamiliaAnteojos';

const msg = () => document.getElementById("mensaje-flotante");
const btn = () => document.getElementById("btn-guardar");

// -------- helpers de mayúsculas --------
function toUpper(id) {
  const el = document.getElementById(id);
  return (el?.value || '').trim().toUpperCase();
}
function bindLiveUppercase(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      el.value = el.value.toUpperCase();
      // restaurar posición del cursor
      if (start != null && end != null) {
        el.setSelectionRange(start, end);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
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

  // Forzar mayúsculas en vivo en todos los campos de texto/textarea
  bindLiveUppercase([
    'n_anteojo','marca','modelo','codigo_color','color_armazon',
    'calibre','color_cristal','codigo_barras','observaciones'
  ]);

  // Número libre inicial
  await setNumeroLibre();

  // Persistir cambios de marca/familia
  const marcaEl = document.getElementById('marca');
  if (marcaEl) {
    const persistMarca = () => {
      const v = marcaEl.value.trim().toUpperCase();
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
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') {
      e.preventDefault();
      guardar();
    }
  }
});

// ------- Utils -------
async function setNumeroLibre() {
  try {
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
      const n = document.getElementById('n_anteojo');
      n.value = String(numeroLibre).toUpperCase();
      msg().innerText = "Listo para cargar 👓";
      msg().style.color = "black";
    } else {
      msg().innerText = "⚠ No se encontró número libre.";
      msg().style.color = "orange";
    }
  } catch (error) {
    console.error("Error al buscar número:", error);
    msg().innerText = "⚠ Error al buscar número.";
    msg().style.color = "red";
  }
}

function limpiarParaSiguiente() {
  const marcaGuardada = localStorage.getItem(LS_MARCA_KEY) || "";
  const familiaGuardada = localStorage.getItem(LS_FAMILIA_KEY) || "";

  // Limpiar todos menos marca/familia
  const ids = [
    'n_anteojo','modelo','codigo_color','color_armazon','calibre',
    'color_cristal','costo','precio','codigo_barras','observaciones'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Restaurar persistentes (en mayúsculas ya)
  document.getElementById('marca').value = marcaGuardada;
  document.getElementById('familia').value = familiaGuardada;

  // Focus donde te convenga para velocidad
  document.getElementById('modelo').focus();
}

// ------- Cálculo de precio -------
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
window.calcularPrecio = calcularPrecio; // por si lo usás inline en el HTML

// ------- Guardar -------
async function guardar() {
  // Tomo TODO en mayúsculas
  const n_anteojo   = toUpper("n_anteojo");
  const marca       = toUpper("marca");
  const modelo      = toUpper("modelo");

  if (!n_anteojo || !marca || !modelo) {
    mostrarMensaje("⚠ Completá N° anteojo, marca y modelo.", "red");
    return;
  }

  // Persistir marca (en mayúsculas) y familia
  localStorage.setItem(LS_MARCA_KEY, marca);
  const familiaVal = document.getElementById("familia").value;
  if (familiaVal) localStorage.setItem(LS_FAMILIA_KEY, familiaVal);

  const params = new URLSearchParams({
    n_anteojo,
    marca,
    modelo,
    codigo_color:   toUpper("codigo_color"),
    color_armazon:  toUpper("color_armazon"),
    calibre:        toUpper("calibre"),
    color_cristal:  toUpper("color_cristal"),
    familia:        familiaVal, // select, ya está en valor correcto
    precio:         document.getElementById("precio").value,
    costo:          document.getElementById("costo").value,
    fecha_ingreso:  new Date().toLocaleDateString("es-AR"),
    codigo_barras:  toUpper("codigo_barras"),
    observaciones:  toUpper("observaciones")
  });

  try {
    if (btn()) btn().disabled = true;
    const res = await fetch(`${URL}?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      mostrarMensaje(`✅ Guardado correctamente: ${n_anteojo}`, "green");
      // Preparar siguiente registro sin recargar
      limpiarParaSiguiente();
      await setNumeroLibre(); // trae el próximo libre
    } else {
      mostrarMensaje("❌ Error al guardar.", "red");
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje("❌ Error de conexión con el servidor.", "red");
  } finally {
    if (btn()) btn().disabled = false;
  }
}

function mostrarMensaje(texto, color = "black") {
  msg().innerText = texto;
  msg().style.color = color;
}

// Por si necesitás usar guardar/calcularPrecio desde el HTML
window.guardar = guardar;
