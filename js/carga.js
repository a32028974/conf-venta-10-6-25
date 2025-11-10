/* ====== CONFIG ====== */
// Pegá 1 sola vez tu URL /exec en la caja (o hardcodeala acá).
const API_FALLBACK = 'https://script.google.com/macros/s/AKfycbxVj1eryyemrFtnRkery0nm5cpWgUd0WxEuCsGsAg2V7ra8VYg3-_dh-3ljXb-bVVeK1g/exec'; // ej: 'https://script.google.com/macros/s/AKfycb.../exec'
const API = (localStorage.getItem('OC_API') || API_FALLBACK).trim();

/* ====== HELPERS ====== */
const $ = s => document.querySelector(s);
const byId = id => document.getElementById(id);

function msg(txt, ok=true) {
  const box = byId('mensaje-flotante');
  box.textContent = txt;
  box.style.color = ok ? '#111' : '#b00020';
}

function toNumber(v){
  const n = parseFloat((v??'').toString().replace(',','.'));
  return isNaN(n) ? '' : +n.toFixed(2);
}

function getFactor(fam){
  const F = (fam||'').toUpperCase();
  if (F === 'RECETA') return 3.63;
  if (F === 'SOL')    return 2.42;
  return null;
}

/* ====== PRECIO <-> COSTO ====== */
function calcularPrecio(){
  const tengo = byId('tengo_precio').checked;
  const fam   = byId('familia').value;
  const k     = getFactor(fam);

  // Toggle de readonly/disabled
  byId('precio').readOnly = !tengo;
  byId('costo').readOnly  =  tengo;

  const costo  = toNumber(byId('costo').value);
  const precio = toNumber(byId('precio').value);

  if (!k) return; // sin familia no calculamos

  if (tengo) {
    // Tengo precio -> inferir costo
    if (precio !== '') {
      byId('costo').value = (precio / k).toFixed(2);
    }
  } else {
    // Tengo costo -> calcular precio
    if (costo !== '') {
      byId('precio').value = (costo * k).toFixed(2);
    }
  }
}

/* ====== CARGAR NÚMERO SIGUIENTE ====== */
async function cargarNumeroSiguiente() {
  if (!API) {
    msg('Pegar URL de Apps Script (OC_API) faltante', false);
    return;
  }
  try {
    const r  = await fetch(`${API}?action=nextNumero`, { cache:'no-store' });
    const js = await r.json();
    if (js.ok) {
      byId('n_anteojo').value = js.numero;
      msg('Listo para cargar 👓');
    } else {
      msg(js.error || 'No pude obtener el número', false);
    }
  } catch (err) {
    console.error(err);
    msg('Error de red obteniendo número', false);
  }
}

/* ====== GUARDAR ====== */
async function guardar(){
  if (!API) { msg('Falta configurar la URL del Script', false); return; }

  const payload = {
    n_anteojo      : byId('n_anteojo').value.trim(), // el backend igual usa max+1
    fabrica        : byId('fabrica').value.trim(),
    marca          : byId('marca').value.trim(),
    modelo         : byId('modelo').value.trim(),
    codigo_color   : byId('codigo_color').value.trim(),
    color_armazon  : byId('color_armazon').value.trim(),
    calibre        : byId('calibre').value.trim(),
    color_cristal  : byId('color_cristal').value.trim(),
    familia        : byId('familia').value.trim(),
    costo          : byId('costo').value,
    tengo_precio   : byId('tengo_precio').checked,
    precio         : byId('precio').value,
    codigo_barras  : byId('codigo_barras').value.trim(),
    observaciones  : byId('observaciones').value.trim(),
  };

  // Validito mínimo
  if (!payload.familia) { msg('Elegí una Familia (SOL / RECETA)', false); byId('familia').focus(); return; }

  // Guardar defaults útiles
  localStorage.setItem('OC_PREF_MARCA', payload.marca || '');
  localStorage.setItem('OC_PREF_FAMILIA', payload.familia || '');

  byId('btn-guardar').disabled = true; msg('Guardando…');

  try {
    const res = await fetch(`${API}?action=guardar`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const js = await res.json();

    if (js.ok) {
      msg(`Guardado ✔ N° ${js.numero}`);
      // limpiar pero dejo marca/familia y traigo el próximo número
      byId('modelo').value = '';
      byId('codigo_color').value = '';
      byId('color_armazon').value = '';
      byId('calibre').value = '';
      byId('color_cristal').value = '';
      byId('costo').value = '';
      byId('tengo_precio').checked = false;
      byId('precio').value = '';
      byId('codigo_barras').value = '';
      byId('observaciones').value = '';

      await cargarNumeroSiguiente();
      byId('modelo').focus();
    } else {
      msg(js.error || 'No se pudo guardar', false);
    }
  } catch (err) {
    console.error(err);
    msg('Error de red al guardar', false);
  } finally {
    byId('btn-guardar').disabled = false;
  }
}

/* ====== INIT ====== */
function init() {
  // Prefill de marca/familia
  const prefMarca   = localStorage.getItem('OC_PREF_MARCA') || '';
  const prefFamilia = localStorage.getItem('OC_PREF_FAMILIA') || '';
  if (prefMarca) byId('marca').value = prefMarca;
  if (prefFamilia) byId('familia').value = prefFamilia;

  byId('tengo_precio').addEventListener('change', calcularPrecio);
  byId('familia').addEventListener('change', calcularPrecio);
  byId('costo').addEventListener('input',  calcularPrecio);
  byId('precio').addEventListener('input', calcularPrecio);

  // Atajo Enter para guardar
  byId('form-anteojo').addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      guardar();
    }
  });

  cargarNumeroSiguiente();
}

window.addEventListener('DOMContentLoaded', init);
