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
  // Na een verstuurde aanvraag: mandje en bezorgkeuze leeg, zodat oude
  // extra's niet ongemerkt in een volgende aanvraag terugkomen.
  function clear() {
    try { localStorage.removeItem(KEY); localStorage.removeItem(DELIVERY_KEY); } catch (e) {}
  }
  return { read: read, setItem: setItem, getItem: getItem, count: count, clear: clear, setDeliveryMode: setDeliveryMode, getDeliveryMode: getDeliveryMode };
})();

// Foto's groot bekijken (lightbox), één viewer voor de hele site.
// - Links met data-lightbox="<reeks>" om een foto openen die foto; alle links
//   met dezelfde waarde vormen samen de reeks waar je doorheen bladert. Zonder
//   script opent de link gewoon het grote bestand.
// - Extra's en reserveren roepen ScLightbox.open() aan met een fotolijst uit
//   extras-catalog.js.
// De foto wordt pas geladen bij openen, in het formaat dat bij het scherm past.
window.ScLightbox = (function () {
  var box, img, count, closeBtn, prevBtn, nextBtn;
  var photos = [], index = 0, opener = null, touchX = null, touchY = null;

  function build() {
    box = document.createElement('div');
    box.className = 'gallery-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="gallery-close" aria-label="Sluiten">&times;</button>' +
      '<button type="button" class="gallery-nav gallery-nav--prev" aria-label="Vorige foto">&#8249;</button>' +
      '<button type="button" class="gallery-nav gallery-nav--next" aria-label="Volgende foto">&#8250;</button>' +
      '<figure class="gallery-lightbox-media"><figcaption class="gallery-count"></figcaption></figure>';
    document.body.appendChild(box);
    count = box.querySelector('.gallery-count');
    img = document.createElement('img');
    count.parentNode.insertBefore(img, count);
    closeBtn = box.querySelector('.gallery-close');
    prevBtn = box.querySelector('.gallery-nav--prev');
    nextBtn = box.querySelector('.gallery-nav--next');

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });
    // Klik naast de foto sluit; een klik op de foto zelf niet.
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('gallery-lightbox-media')) close();
    });
    img.addEventListener('load', function () { fit(); img.classList.remove('is-loading'); });
    // Vegen op telefoon: links/rechts bladert.
    box.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Tab') {
        // Focus binnen de viewer houden.
        var f = [closeBtn, prevBtn, nextBtn].filter(function (b) { return !b.hidden && !b.disabled; });
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
    window.addEventListener('resize', function () { if (!box.hidden) fit(); });
  }

  // Breedste bestand in de srcset: verder vergroten maakt de foto alleen wazig.
  function widest(srcset) {
    var max = 0;
    (srcset || '').replace(/\s(\d+)w/g, function (_, w) { max = Math.max(max, +w); });
    return max;
  }

  // Afmeting op het scherm: zo groot mogelijk binnen 84% van de hoogte. In de
  // breedte 92% op telefoon; vanaf 700px blijft er links en rechts ruimte
  // voor de pijlen, zodat die niet over de foto vallen (zelfde maat als in site.css).
  function ratioOf(p) {
    return p.ratio || (p === photos[index] && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 1);
  }
  function widthOf(p) {
    var vw = window.innerWidth;
    var maxW = vw >= 700 ? vw - 136 : vw * 0.92;
    var w = Math.min(maxW, window.innerHeight * 0.84 * ratioOf(p));
    var cap = widest(p.srcset);
    return Math.round(cap ? Math.min(w, cap) : w);
  }
  function fit() {
    var p = photos[index], w = widthOf(p);
    img.style.width = w + 'px';
    img.style.height = Math.round(w / ratioOf(p)) + 'px';
  }

  function load(target, p) {
    if (p.srcset) { target.sizes = widthOf(p) + 'px'; target.srcset = p.srcset; }
    else target.removeAttribute('srcset');
    target.src = p.src;
  }

  function render() {
    var p = photos[index];
    img.classList.add('is-loading');
    img.alt = p.alt || '';
    fit();
    load(img, p);
    if (img.complete && img.naturalWidth) img.classList.remove('is-loading');
    var many = photos.length > 1;
    prevBtn.hidden = nextBtn.hidden = !many;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === photos.length - 1;
    count.textContent = many ? (index + 1) + ' / ' + photos.length : '';
    // De buren alvast ophalen, zodat bladeren direct is.
    [index - 1, index + 1].forEach(function (i) {
      if (photos[i]) load(new Image(), photos[i]);
    });
  }

  function go(dir) {
    var i = index + dir;
    if (i < 0 || i >= photos.length) return;
    index = i;
    render();
  }

  // list: [{ src, srcset?, alt, ratio? }]; start: index; from: element dat
  // na sluiten de focus terugkrijgt; label: naam van de viewer voor schermlezers.
  function open(list, start, from, label) {
    if (!list || !list.length) return;
    if (!box) build();
    photos = list;
    index = start || 0;
    opener = from || null;
    box.setAttribute('aria-label', label || 'Foto\'s');
    box.hidden = false;
    document.body.classList.add('gallery-open');
    render();
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove('gallery-open');
    img.removeAttribute('srcset');
    img.removeAttribute('src');
    if (opener) opener.focus();
  }

  // Links met data-lightbox: de grote foto staat in href, het formaat en de
  // kleinere versies komen van de <img> in de link.
  function photoFromLink(a) {
    var t = a.querySelector('img');
    var w = +t.getAttribute('width'), h = +t.getAttribute('height');
    return { src: a.getAttribute('href'), srcset: t.getAttribute('srcset'), alt: t.alt, ratio: w && h ? w / h : 0 };
  }
  document.querySelectorAll('a[data-lightbox]').forEach(function (a) {
    var alt = a.querySelector('img').alt;
    a.setAttribute('aria-label', 'Foto vergroten' + (alt ? ': ' + alt : ''));
    a.addEventListener('click', function (e) {
      // Ctrl/Cmd-klik en middelste knop: gewoon in een nieuw tabblad.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var group = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox="' + a.getAttribute('data-lightbox') + '"]'));
      open(group.map(photoFromLink), group.indexOf(a), a);
    });
  });

  return { open: open };
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

  // Meldingsbalk boven de header: één punt tegelijk dat vanzelf
  // doorwisselt; met de pijltjes of door te vegen blader je zelf.
  var announceBar = document.getElementById('announceBar');
  var announceItems = announceBar ? announceBar.querySelectorAll('.announce-bar-list li') : [];
  if (announceItems.length > 1) {
    var AUTO_DELAY = 4500, AFTER_MANUAL_DELAY = 9000;
    var announceIndex = 0, announceTimer = null, announceHover = false;

    // Schuift opzij in de richting van het pijltje: bij "volgende" komt het
    // nieuwe punt van rechts en verdwijnt het oude naar links, en andersom.
    function showAnnounce(i, dir) {
      var leaving = announceItems[announceIndex];
      announceIndex = (i + announceItems.length) % announceItems.length;
      var entering = announceItems[announceIndex];
      entering.style.transition = 'none';
      entering.style.transform = 'translateX(' + (dir * 100) + '%)';
      void entering.offsetWidth; // startpositie vastleggen vóór het schuiven
      entering.style.transition = '';
      entering.style.transform = '';
      leaving.style.transform = 'translateX(' + (-dir * 100) + '%)';
      leaving.classList.remove('is-active');
      entering.classList.add('is-active');
    }
    function scheduleAnnounce(delay) {
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () {
        // Niet wisselen onder de muis, of als het toetsenbord in de balk staat.
        var keyboardFocus = announceBar.querySelector(':focus-visible');
        if (!announceHover && !keyboardFocus && !document.hidden) showAnnounce(announceIndex + 1, 1);
        scheduleAnnounce(AUTO_DELAY);
      }, delay);
    }
    // Zelf bladeren: daarna even langer wachten voor het weer vanzelf gaat.
    function stepAnnounce(dir) {
      showAnnounce(announceIndex + dir, dir);
      scheduleAnnounce(AFTER_MANUAL_DELAY);
    }

    var prevBtn = announceBar.querySelector('.announce-bar-prev');
    var nextBtn = announceBar.querySelector('.announce-bar-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { stepAnnounce(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stepAnnounce(1); });

    var touchX = null, touchY = null;
    announceBar.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
    }, { passive: true });
    announceBar.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) stepAnnounce(dx < 0 ? 1 : -1);
    });

    announceBar.addEventListener('mouseenter', function () { announceHover = true; });
    announceBar.addEventListener('mouseleave', function () { announceHover = false; });
    scheduleAnnounce(AUTO_DELAY);
  }

  if (!toggle || !nav) return;

  // Mobiel: header verbergen bij naar beneden scrollen, tonen bij omhoog.
  // Op reserveren blijft hij gewoon bovenaan de pagina staan (--static).
  var mobileQuery = window.matchMedia('(max-width: 860px)');
  if (header && !header.classList.contains('site-header--static')) {
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dy = y - lastY;
      if (!mobileQuery.matches || nav.classList.contains('is-open') || y <= header.offsetHeight) {
        header.classList.remove('is-hidden');
      } else if (dy > 6) {
        header.classList.add('is-hidden');
      } else if (dy < -6) {
        header.classList.remove('is-hidden');
      }
      if (Math.abs(dy) > 6) lastY = y;
    }, { passive: true });
    // Met het toetsenbord in de header tabben: dan moet hij zichtbaar zijn.
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  }

  function setOpen(isOpen) {
    // De header kan meegescrold zijn; het menu begint direct eronder.
    if (isOpen) { header.classList.remove('is-hidden'); setHeaderHeight(); }
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

  // Groepen (Gelegenheden, Collecties). Desktop: uitklapmenu, er staat er
  // maar één tegelijk open. Mobiel: open- en dichtklappen in de lijst; de
  // groep met de huidige pagina staat daar al open.
  var groups = nav.querySelectorAll('.nav-group');
  function setGroup(group, isOpen) {
    group.classList.toggle('is-open', isOpen);
    group.querySelector('.nav-group-toggle').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
  function closeGroups(except) {
    groups.forEach(function (g) { if (g !== except) setGroup(g, false); });
  }
  groups.forEach(function (group) {
    group.querySelector('.nav-group-toggle').addEventListener('click', function () {
      var open = !group.classList.contains('is-open');
      if (!mobileQuery.matches) closeGroups(group);
      setGroup(group, open);
    });
    if (mobileQuery.matches && group.classList.contains('is-current')) setGroup(group, true);
  });
  // Desktop: klik ergens anders sluit het uitklapmenu.
  document.addEventListener('click', function (e) {
    if (!mobileQuery.matches && !e.target.closest('.nav-group')) closeGroups();
  });
  // Wisselen tussen mobiel en desktop: geen uitklapmenu laten openstaan.
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', function () { closeGroups(); });

  // Escape sluit eerst een open uitklapmenu, anders het mobiele menu, en zet
  // de focus terug op de knop, zodat je met toetsenbord niet vast komt te
  // zitten achter het schermvullende overlay.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openGroup = !mobileQuery.matches && nav.querySelector('.nav-group.is-open');
    if (openGroup) {
      setGroup(openGroup, false);
      openGroup.querySelector('.nav-group-toggle').focus();
    } else if (nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
