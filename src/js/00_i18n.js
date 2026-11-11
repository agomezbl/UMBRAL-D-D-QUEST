/* ==========================================================================
   Idiomas: español y francés
   Cada texto del juego se escribe en los dos idiomas, uno junto al otro:
     L('Texto en español', 'Texte en français')
   El idioma se elige en la pantalla de inicio. Al cambiarlo, el juego se vuelve
   a cargar para que todos los textos salgan ya en el idioma nuevo.
   Orden de preferencia: ?lang=fr en la dirección > lo elegido en UMBRAL > lo elegido en la Estación de Curionaut > idioma del aparato.
   ========================================================================== */
const LANGS = { es: 'Español', fr: 'Français' };
const LANG = (() => {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS[q.slice(0, 2).toLowerCase()]) return q.slice(0, 2).toLowerCase();
  } catch (e) {}
  try {
    const s = JSON.parse(localStorage.getItem('umbral.lang'));
    if (s && LANGS[s]) return s;
  } catch (e) {}
  // dentro de Curionaut: el idioma que el niño eligió en la Estación
  try {
    const st = JSON.parse(localStorage.getItem('estacion-nil-v1'));
    if (st && LANGS[st.lang]) return st.lang;
  } catch (e) {}
  const n = ((navigator.languages && navigator.languages[0]) || navigator.language || 'es').toLowerCase();
  return n.startsWith('fr') ? 'fr' : 'es';
})();
// En francés, el espacio antes de « : ; ! ? » % » y después de « « » no debe partirse en dos líneas:
// se cambia solo por un espacio de no separación.
const frTypo = (s) => (typeof s === 'string' ? s.replace(/ ([:;!?»%])/g, '\u00a0$1').replace(/« /g, '«\u00a0') : s);
const L = (es, fr) => (LANG === 'fr' && fr != null ? frTypo(fr) : es);
const setLang = (l) => {
  if (!LANGS[l] || l === LANG) return;
  try { localStorage.setItem('umbral.lang', JSON.stringify(l)); } catch (e) {}
  // si el idioma venía en la dirección, se quita para que valga la elección nueva
  try { const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.toString()); } catch (e) { location.reload(); }
};
try { document.documentElement.lang = LANG; } catch (e) {}

/* Textos fijos de la página (body.html): en francés se cambian al arrancar */
(() => {
  if (LANG !== 'fr') return;
  const $ = (s) => document.querySelector(s);
  const txt = (s, t) => { const e = $(s); if (e) e.textContent = t; };
  const tip = (s, t, a) => { const e = $(s); if (e) { e.title = t; e.setAttribute('aria-label', a || t); } };
  try {
    txt('#loading-text', 'Les Tréfonds s’éveillent…'); txt('#q-loc', 'Antichambre'); txt('#boss-name', 'Chef');
    txt('#cancel-mode', 'Annuler la sélection · Échap'); txt('#dlg-skip', 'Passer le dialogue'); txt('.note-tap', 'Touche pour fermer');
    txt('#hint .eyebrow', 'Conseil'); txt('#hint-ok', 'Compris'); txt('#chronicle h3', 'Chronique');
    const pills = document.querySelectorAll('.res-pill');
    ['Or', 'Potions', 'Élixirs', 'Bombes', 'Manche', 'Présage'].forEach((t, i) => { if (pills[i]) pills[i].title = t; });
    const rp = $('.res-pill.round'); if (rp && rp.firstChild && rp.firstChild.nodeType === 3) rp.firstChild.textContent = 'Manche ';
    tip('#btn-party', 'Fiche du groupe (G)', 'Fiche du groupe'); tip('#btn-view', 'Vue de dessus (V)', 'Vue de dessus');
    tip('#btn-rotate', 'Tourner la caméra (Q/E)', 'Tourner la caméra'); tip('#btn-center', 'Centrer sur le héros (C)', 'Centrer sur le héros');
    tip('#btn-log', 'Chronique'); tip('#btn-sound', 'Son'); tip('#btn-menu', 'Menu (Échap)', 'Menu');
    const cc = $('#chronicle-close'); if (cc) cc.setAttribute('aria-label', 'Fermer la chronique');
  } catch (e) {}
})();
