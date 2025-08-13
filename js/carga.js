const URL = 'https://script.google.com/macros/s/AKfycbwTzBbMEISZjU3rvn5uEzjQN20iO-xg_EBgXbwXgQTTv-4ULYGoRCft6bWUwDcimyeUMQ/exec';

// ===== localStorage keys =====
const LS_MARCA_KEY   = 'ultimaMarcaAnteojos';
const LS_FAMILIA_KEY = 'ultimaFamiliaAnteojos';
const LS_FABRICA_KEY = 'ultimaFabricaAnteojos';

const msg = () => document.getElementById("mensaje-flotante");
const btn = () => document.getElementById("btn-guardar");

// --- helpers mayúsculas ---
function toUpper(id) {
  const el = document.getElementById(id);
  return (el?.value || '').trim().toUpperCase();
}
function bindLiveUppercase(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const s = el.selectionStart, e = el.selectionEnd;
      el.value = el.value.toUpperCase();
      if (s != null && e != null) el.setSelectionRange(s, e);
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Restaurar marca/familia/fabrica
  const m = localStorage.getItem(LS_MARCA_KEY);
  if (m) { const el = document.getElementById('marca'); if (el) el.value = m; }

  const f = localStorage.getItem(LS_FAMILIA_KEY);
  if (f) { const el = document.getElementById('familia'); if (el) el.value = f; }

  const fab = localStorage.getItem(LS_FABRICA_KEY);
  if (fab) { const el = document.getElementById('fabrica'); if (el) el.value = fab; }

  // Forzar mayúsculas en vivo (texto/textarea)
  bindLiveUppercase([
    'n_anteojo','marca','modelo','codigo_color','color_armazon',
    'calibre','color_cristal','codigo_barras','observaciones','fabrica'
  ]);

  // Número libre inicial
  await setNumeroLibre();

  // Persistir cambios de marca/familia/fabrica
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

  const fabricaEl = document.getElementById('fabrica');
  if (fabricaEl) {
    const persistFabrica = () => {
      const v = fabricaEl.value.trim().toUpperCase();
      if (v) localStorage.setItem(LS_FABRICA_KEY, v);
    };
    fabricaEl.addEventListener('change', persistFabrica);
    fabricaEl.addEventListener('input', persistFabrica);
  }
});

// Enter = guardar (salvo Shift+Enter)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const t = e.target.tagName;
    if (t === 'TEXTAREA' || t === 'INPUT' || t === 'SELECT') {
      e.preventDefault();
      guardar();
    }
  }
});

// --- número libre ---
async function setNumeroLibre() {
  try {
    const res = await fetch(`${URL}?todos=true`);
    const datos = await res.json();

    let numeroLibre = '';
    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      const estaVacia = fila.slice(1, 8).every(c => !c);
      if (fila[0] && estaVacia) { numeroLibre = fila[0]; break; }
    }

    if (numeroLibre) {
      const n = document.getElementById('n_anteojo');
      n.value = String(numeroLibre).toUpperCase();
      mostrarMensaje("Listo para cargar 👓", "black");
    } else {
      mostrarMensaje("⚠ No se encontró número libre.", "orange");
    }
  } catch (err) {
    console.error("Error al buscar número:", err);
    mostrarMensaje("⚠ Error al buscar número.", "red");
  }
}

function limpiarParaSiguiente() {
  const marcaGuardada   = localStorage.getItem(LS_MARCA_KEY)   || "";
  const familiaGuardada = localStorage.getItem(LS_FAMILIA_KEY) || "";
  const fabricaGuardada = localStorage.getItem(LS_FABRICA_KEY) || "";

  // Limpiar todos menos los persistentes
  ['n_anteojo','modelo','codigo_color','color_armazon','calibre',
   'color_cristal','costo','precio','codigo_barras','observaciones']
   .forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });

  document.getElementById('marca').value   = marcaGuardada;
  document.getElementById('familia').value = familiaGuardada;
  document.getElementById('fabrica').value = fabricaGuardada;

  document.getElementById('modelo').focus();
}

// --- precio automático ---
function calcularPrecio() {
  const costo = parseFloat(document.getElementById('costo').value);
  const fam = document.getElementById('familia').value;
  if (!isNaN(costo) && (fam === "SOL" || fam === "RECETA")) {
    const mult = fam === "RECETA" ? 3.63 : 2.42;
    document.getElementById('precio').value = Math.round(costo * mult);
  } else {
    document.getElementById('precio').value = '';
  }
}
window.calcularPrecio = calcularPrecio; // por si lo usás inline

// --- guardar ---
async function guardar() {
  // tomar todo en MAYÚSCULAS (texto)
  const n_anteojo   = toUpper("n_anteojo");
  const marca       = toUpper("marca");
  const modelo      = toUpper("modelo");

  if (!n_anteojo || !marca || !modelo) {
    mostrarMensaje("⚠ Completá N° anteojo, marca y modelo.", "red");
    return;
  }

  // persistir marca/familia/fabrica
  localStorage.setItem(LS_MARCA_KEY, marca);
  const familiaVal = document.getElementById("familia").value;
  if (familiaVal) localStorage.setItem(LS_FAMILIA_KEY, familiaVal);
  const fabricaVal = toUpper("fabrica");
  if (fabricaVal) localStorage.setItem(LS_FABRICA_KEY, fabricaVal);

  // 📌 Importante:
  // - Enviamos action=guardar_anteojo (nuevo handler en Apps Script).
  // - NO enviamos "costo" (así no se escribe la columna I).
  // - "fecha_ingreso" la mandamos normal; el backend la escribirá en el encabezado FECHA INGRESO,
  //   que vos ya moviste a la columna M.
const params = new URLSearchParams({
  action:        'guardar_anteojo',
  n_anteojo,
  marca,
  modelo,
  codigo_color:   toUpper("codigo_color"),
  color_armazon:  toUpper("color_armazon"),
  calibre:        toUpper("calibre"),
  color_cristal:  toUpper("color_cristal"),
  familia:        document.getElementById("familia").value,
  fecha_ingreso:  new Date().toLocaleDateString("es-AR"),
  costo:          document.getElementById("costo").value, // ← enviar
  codigo_barras:  toUpper("codigo_barras"),
  observaciones:  toUpper("observaciones"),
  fabrica:        toUpper("fabrica")
});



  try {
    if (btn()) btn().disabled = true;
    const res = await fetch(`${URL}?${params.toString()}`);
    const data = await res.json();

    // tolerante a {success:true} o {ok:true}
    if (data.success || data.ok) {
      mostrarMensaje(`✅ Guardado correctamente: ${n_anteojo}`, "green");
      limpiarParaSiguiente();
      await setNumeroLibre();
    } else {
      const errMsg = data.error || data.msg || "Error desconocido";
      mostrarMensaje("❌ " + errMsg, "red");
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

window.guardar = guardar;
