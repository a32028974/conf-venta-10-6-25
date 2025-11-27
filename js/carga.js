/* ====== CONFIG ====== */
// Usar SIEMPRE este Apps Script (el que ya funcionaba con la versión anterior)
const API = 'https://script.google.com/macros/s/AKfycbwD8HyjyM_biqlm3Mvxn0IjFyfx7JVYnkkLLPN24uMrSkfa3NUhtju2JSC4BZcTKUVCtg/exec';

/* ====== HELPERS ====== */
const $   = s  => document.querySelector(s);
const byId = id => document.getElementById(id);

function msg(txt, ok = true) {
  const box = byId('mensaje-flotante');
  box.textContent = txt;
  box.style.color = ok ? '#111' : '#b00020';
}

function toNumber(v) {
  const n = parseFloat((v ?? '').toString().replace(',', '.'));
  return isNaN(n) ? '' : +n.toFixed(2);
}

function getFactor(fam) {
  const F = (fam || '').toUpperCase();
  if (F === 'RECETA') return 3.63;
  if (F === 'SOL')    return 2.42;
  return null;
}

/* ====== PRECIO <-> COSTO ====== */
function calcularPrecio() {
  const tengo = byId('tengo_precio').checked;
  const fam   = byId('familia').value;
  const k     = getFactor(fam);

  byId('precio').readOnly = !tengo;
  byId('costo').readOnly  =  tengo;

  const costo  = toNumber(byId('costo').value);
  const precio = toNumber(byId('precio').value);

  if (!k) return;

  if (tengo) {
    if (precio !== '') {
      byId('costo').value = (precio / k).toFixed(2);
    }
  } else {
    if (costo !== '') {
      byId('precio').value = (costo * k).toFixed(2);
    }
  }
}

/* ====== CARGAR NÚMERO SIGUIENTE ====== */
async function cargarNumeroSiguiente() {
  try {
    const r  = await fetch(`${API}?action=nextNumero`, { cache: 'no-store' });
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

/* ====== JSONP ====== */
function jsonp(url){
  return new Promise((resolve,reject)=>{
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    window[cb] = data => { resolve(data); delete window[cb]; s.remove(); };
    const s = document.createElement('script');
    s.src = url + (url.includes('?')?'&':'?') + 'callback=' + cb;
    s.onerror = ()=>{ delete window[cb]; s.remove(); reject(new Error('JSONP error')); };
    document.head.appendChild(s);
  });
}

/* ====== SERIALIZADOR ====== */
function qs(obj){
  return Object.entries(obj)
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
    .join('&');
}

/* ====== GUARDAR (SIN CORS) ====== */
async function guardar() {

  const codigoColor  = byId('codigo_color').value.trim();
  const colorArmazon = byId('color_armazon').value.trim();

 const payload = {
  n_anteojo      : byId('n_anteojo').value.trim(),
  fabrica        : byId('fabrica').value.trim(),
  marca          : byId('marca').value.trim(),
  modelo         : byId('modelo').value.trim(),

  // En todos los nombres, mandamos el valor correcto
  color          : codigoColor,      // para COLOR
  armazon        : colorArmazon,     // para ARMAZON

  codigo_color   : codigoColor,      // compatibilidad vieja
  color_armazon  : colorArmazon,     // compatibilidad vieja

  calibre        : byId('calibre').value.trim(),
  color_cristal  : byId('color_cristal').value.trim(),
  familia        : byId('familia').value.trim(),
  costo          : byId('costo').value,
  tengo_precio   : byId('tengo_precio').checked ? 'true' : 'false',
  precio         : byId('precio').value,
  codigo_barras  : byId('codigo_barras').value.trim(),
  observaciones  : byId('observaciones').value.trim(),
};


  if (!payload.familia){
    msg('Elegí una Familia (SOL / RECETA)', false);
    byId('familia').focus();
    return;
  }

  // ✅ Persistir fabrica / marca / familia
  localStorage.setItem('OC_PREF_FABRICA', payload.fabrica || '');
  localStorage.setItem('OC_PREF_MARCA', payload.marca || '');
  localStorage.setItem('OC_PREF_FAMILIA', payload.familia || '');

  byId('btn-guardar').disabled = true;
  msg('Guardando…');

  try {
    const url = `${API}?action=guardar&${qs(payload)}`;
    const data = await jsonp(url);

    if (data.ok){
      msg(`Guardado ✔ N° ${data.numero}`);

      // limpiar sin borrar fábrica/marca/familia
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
      msg(data.error || 'No se pudo guardar', false);
    }

  } catch (e){
    console.error(e);
    msg('Error de red al guardar', false);
  } finally {
    byId('btn-guardar').disabled = false;
  }
}


/* ====== INIT ====== */
function init() {
  // ✅ Prefill desde localStorage
  const prefFabrica = localStorage.getItem('OC_PREF_FABRICA') || '';
  const prefMarca   = localStorage.getItem('OC_PREF_MARCA')   || '';
  const prefFamilia = localStorage.getItem('OC_PREF_FAMILIA') || '';

  if (prefFabrica) byId('fabrica').value = prefFabrica;
  if (prefMarca)   byId('marca').value   = prefMarca;
  if (prefFamilia) byId('familia').value = prefFamilia;

  byId('tengo_precio').addEventListener('change', calcularPrecio);
  byId('familia').addEventListener('change',       calcularPrecio);
  byId('costo').addEventListener('input',          calcularPrecio);
  byId('precio').addEventListener('input',         calcularPrecio);

  // Atajo Enter para guardar
  byId('form-anteojo').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      guardar();
    }
  });

  cargarNumeroSiguiente();
}

window.addEventListener('DOMContentLoaded', init);
