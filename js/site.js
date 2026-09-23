// Studio Convivio: gedeeld site-script (mobiel menu, extra's-winkelmandje). Geen dependencies.

// Winkelmandje voor losse extra's, gedeeld tussen extras.html en reserveren.html
// via localStorage zodat een keuze op de ene pagina op de andere terugkomt.
window.ScCart = (function () {
  var KEY = 'sc_extras_cart_v1';
  var DELIVERY_KEY = 'sc_delivery_mode_v1';
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function write(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function setItem(itemKey, qty, extra) {
    var cart = read();
    if (qty > 0) { cart[itemKey] = extra ? Object.assign({ qty: qty }, extra) : { qty: qty }; }
    else { delete cart[itemKey]; }
    write(cart);
    return cart;
  }
  function getItem(itemKey) {
    return read()[itemKey] || null;
  }
  function count() {
    var cart = read(), n = 0;
    for (var k in cart) { if (cart.hasOwnProperty(k)) n += cart[k].qty; }
    return n;
  }
  // Bezorgmodus (geen/bezorgen/styling) staat los van het item-winkelmandje:
  // het is een eenmalige keuze, geen aantal, en de definitieve prijs hangt af
  // van de afstand die alleen op reserveren.html wordt berekend.
  function setDeliveryMode(mode) {
    try {
      if (mode && mode !== 'geen') { localStorage.setItem(DELIVERY_KEY, mode); }
      else { localStorage.removeItem(DELIVERY_KEY); }
    } catch (e) {}
  }
  function getDeliveryMode() {
    try { return localStorage.getItem(DELIVERY_KEY); } catch (e) { return null; }
  }
  return { read: read, setItem: setItem, getItem: getItem, count: count, setDeliveryMode: setDeliveryMode, getDeliveryMode: getDeliveryMode };
})();

(function () {
  // Vangnet: de homepage draait binnen een paginaskelet waarvan het
  // <html>-element geen lang-attribuut meesturt. Schermlezers kiezen dan de
  // verkeerde uitspraak. Op de losse pagina's staat lang="nl" al in de bron
  // en doet deze regel niets.
  if (!document.documentElement.getAttribute('lang')) {
    document.documentElement.setAttribute('lang', 'nl');
  }

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');

  // Het mobiele menu begint precies onder de header. We meten de afstand
  // vanaf de viewport-top tot de onderkant van de header (niet alleen de
  // headerhoogte zelf), zodat een meldingsbalk erboven correct meetelt.
  function setHeaderHeight() {
    if (header) document.documentElement.style.setProperty('--header-h', header.getBoundingClientRect().bottom + 'px');
  }
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeaderHeight);

  // Meldingsbalk boven de header: sluit voor de rest van het bezoek (per
  // tabblad/sessie) en herbereken meteen de headerhoogte voor het mobiele menu.
  var announceBar = document.getElementById('announceBar');
  if (announceBar) {
    var ANNOUNCE_KEY = 'sc_announce_dismissed_v1';
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(ANNOUNCE_KEY) === '1'; } catch (e) {}
    if (dismissed) {
      announceBar.hidden = true;
      setHeaderHeight();
    }
    var announceClose = announceBar.querySelector('.announce-bar-close');
    if (announceClose) {
      announceClose.addEventListener('click', function () {
        announceBar.hidden = true;
        try { sessionStorage.setItem(ANNOUNCE_KEY, '1'); } catch (e) {}
        setHeaderHeight();
      });
    }
  }

  if (!toggle || !nav) return;

  function setOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    // Het label moet meebewegen: anders blijft een schermlezer "Menu openen"
    // voorlezen terwijl het menu al openstaat.
    toggle.setAttribute('aria-label', isOpen ? 'Menu sluiten' : 'Menu openen');
  }

  toggle.addEventListener('click', function () {
    setOpen(!nav.classList.contains('is-open'));
  });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      setOpen(false);
    });
  });

  // Escape sluit het menu en zet de focus terug op de knop, zodat je met
  // toetsenbord niet vast komt te zitten achter het schermvullende overlay.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
