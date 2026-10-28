// Studio Convivio: gedeeld gedrag voor de "shop"-kaartjes van losse extra's.
// Werkt samen met SC_EXTRAS_CATALOG (extras-catalog.js) en ScCart (site.js).
// Gebruikt op extras.html en reserveren.html zodat een keuze op de ene
// pagina automatisch op de andere terugkomt.
window.ScExtrasShop = (function () {
  function fmt(n) { return '€' + n.toFixed(2).replace('.', ','); }

  function flatItems() {
    var out = [];
    SC_EXTRAS_CATALOG.forEach(function (group) {
      group.items.forEach(function (item) { out.push(item); });
    });
    return out;
  }

  // Het maximumaantal dat je van een item kunt kiezen: bij een vaste
  // voorraad is dat de voorraad zelf, anders de praktische bovengrens `max`.
  function effectiveMax(item) {
    return item.stock != null ? item.stock : item.max;
  }
  function isSoldOut(item) {
    return item.stock === 0;
  }
  // Toont hoeveel stuks er maximaal per aanvraag te kiezen zijn. Dat is de
  // totale voorraad, niet de beschikbaarheid op een specifieke datum; die
  // bevestigen we pas na controle.
  function stockLabel(item) {
    if (item.note) return item.note;
    return item.stock != null ? 'Max. ' + item.stock + ' per aanvraag' : '';
  }
  // Prijslabel zoals op de kaartjes: "€0,75/stuk", "vanaf €1,25/stuk" of
  // de tekst uit `unit` wanneer er (nog) geen vaste prijs is.
  function priceLabel(item) {
    if (item.price === null) return item.unit;
    return (item.priceFrom ? 'vanaf ' : '') + fmt(item.price) + '/' + item.unit;
  }

  // Bouwt de items (per categorie) als HTML-string: fototegels met een
  // vinkje op de foto. Gebruikt op reserveren.html (extras.html heeft eigen
  // HTML). De tegel toont de 480px-versie van de eerste productfoto; zonder
  // foto komt het icoon uit de catalogus op een effen vlak. Heeft het item
  // foto's, dan staat er een vergrootglas op de tegel dat ze groot toont (de
  // pagina vangt de klik af via data-zoom).
  function lowerFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function photoHtml(item) {
    if (!item.photos || !item.photos.length) {
      return '<span class="sc-shop-ph" aria-hidden="true"><svg viewBox="0 0 24 24">' + item.icon + '</svg></span>';
    }
    var src = item.photos[0].src.replace(/\.webp$/, '-480.webp');
    return '<img class="sc-shop-photo" src="' + src + '" alt="" width="480" height="480" loading="lazy" decoding="async">';
  }
  function zoomHtml(item) {
    if (!item.photos || !item.photos.length) return '';
    var n = item.photos.length;
    var label = n > 1 ? 'Bekijk de ' + n + ' foto\'s van ' + item.name : 'Bekijk de foto van ' + item.name;
    return '<button type="button" class="sc-shop-zoom" data-zoom="' + item.key + '" aria-label="' + label + '">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/></svg></button>';
  }
  // Aantal met min- en plusknop; typen kan ook.
  function stepperHtml(item, max) {
    var name = lowerFirst(item.name);
    return '<div class="sc-qty-stepper">' +
      '<button type="button" class="sc-qty-btn" data-qty="-1" aria-label="Minder ' + name + '"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10"/></svg></button>' +
      '<input type="number" class="sc-shop-qty-input" min="1"' + (max != null ? ' max="' + max + '"' : '') + ' value="1" inputmode="numeric" aria-label="Aantal ' + name + '">' +
      '<button type="button" class="sc-qty-btn" data-qty="1" aria-label="Meer ' + name + '"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10M7 2v10"/></svg></button>' +
    '</div>';
  }
  // Optie per stuk bij een item, bv. "Met kwastje (+€0,50/stuk)".
  function addonHtml(item) {
    return '<label class="sc-shop-addon"><input type="checkbox" class="sc-shop-addon-input"> ' + item.addon.label + ' (+' + fmt(item.addon.price) + '/stuk)</label>';
  }
  function renderCatalog() {
    var html = '';
    SC_EXTRAS_CATALOG.forEach(function (group) {
      html += '<div class="sc-shop-category"><span class="sc-shop-category-label">' + group.category + '</span>' +
        (group.note ? '<p class="sc-shop-category-note">' + group.note + '</p>' : '') +
        '<div class="sc-shop-grid sc-shop-grid--tiles">';
      group.items.forEach(function (item) {
        var soldOut = isSoldOut(item);
        var label = soldOut ? 'Uitverkocht' : priceLabel(item);
        var stockNote = !soldOut && stockLabel(item) ? '<span class="sc-shop-stock">' + stockLabel(item) + '</span>' : '';
        var max = effectiveMax(item);
        html += '' +
          '<div class="sc-shop-item' + (soldOut ? ' is-soldout' : '') + '" data-key="' + item.key + '">' +
            '<label class="sc-shop-card sc-shop-card--tile">' +
              '<input type="checkbox" class="sc-shop-check"' + (soldOut ? ' disabled' : '') + '>' +
              '<span class="sc-shop-media">' + photoHtml(item) + '<span class="sc-shop-tick" aria-hidden="true"></span></span>' +
              '<span class="sc-shop-body">' +
                '<span class="sc-shop-name">' + (item.tileName || item.name) + '</span>' +
                '<span class="sc-shop-price">' + label + '</span>' + stockNote +
              '</span>' +
            '</label>' +
            zoomHtml(item) +
            (soldOut ? '' :
              '<div class="sc-qty-field sc-shop-qty">' +
                stepperHtml(item, max) +
                // Op de smalle tegel past alleen een korte hint; de volledige uitleg is de toegankelijke naam.
                (item.hasType ? '<input type="text" class="sc-shop-type-input" placeholder="Wat moet erop?" aria-label="' + (item.typePlaceholder || 'Tekst voor ' + lowerFirst(item.name)) + '">' : '') +
                (item.addon ? addonHtml(item) : '') +
              '</div>') +
          '</div>';
      });
      html += '</div></div>';
    });
    return html;
  }

  // Koppelt checkbox/aantal-gedrag aan alle .sc-shop-item's binnen `root`,
  // leest de opgeslagen keuzes uit ScCart en schrijft wijzigingen terug.
  // guestCount (optioneel) geeft het aantal personen; items met perGuest
  // beginnen bij het aanvinken dan op dat aantal in plaats van op 1.
  function wire(root, onChange, guestCount) {
    var cart = ScCart.read();
    root.querySelectorAll('.sc-shop-item').forEach(function (itemEl) {
      var key = itemEl.getAttribute('data-key');
      var item = findItem(key);
      var check = itemEl.querySelector('.sc-shop-check');
      if (check.disabled) return; // Uitverkocht: niet aan te vinken, geen aantalveld.
      var qtyWrap = itemEl.querySelector('.sc-shop-qty');
      var qtyInput = itemEl.querySelector('.sc-shop-qty-input');
      var typeInput = itemEl.querySelector('.sc-shop-type-input');
      var addonInput = itemEl.querySelector('.sc-shop-addon-input');
      // Min/plus-knoppen (alleen op reserveren.html): [0] is min, [1] is plus.
      var stepBtns = itemEl.querySelectorAll('.sc-qty-btn');
      function syncStepBtns() {
        if (stepBtns.length < 2) return;
        var v = parseInt(qtyInput.value, 10) || 1;
        var max = parseInt(qtyInput.max, 10);
        stepBtns[0].disabled = v <= 1;
        stepBtns[1].disabled = !isNaN(max) && v >= max;
      }

      var saved = cart[key];
      if (saved && saved.qty > 0) {
        check.checked = true;
        qtyInput.value = saved.qty;
        qtyWrap.classList.add('sc-visible');
        if (typeInput && saved.type) typeInput.value = saved.type;
        if (addonInput) addonInput.checked = !!saved.addon;
      }
      syncStepBtns();

      function sync() {
        syncStepBtns();
        var qty = check.checked ? (parseInt(qtyInput.value, 10) || 1) : 0;
        if (check.checked) { qtyWrap.classList.add('sc-visible'); } else { qtyWrap.classList.remove('sc-visible'); }
        var extra = null;
        if (typeInput) extra = { type: typeInput.value };
        if (addonInput) { extra = extra || {}; extra.addon = addonInput.checked; }
        ScCart.setItem(key, qty, extra);
        if (onChange) onChange();
      }

      check.addEventListener('change', function () {
        if (check.checked && item && item.perGuest && guestCount) {
          var max = parseInt(qtyInput.max, 10);
          var n = Math.max(1, guestCount());
          qtyInput.value = isNaN(max) ? n : Math.min(n, max);
        } else if (check.checked && (!qtyInput.value || parseInt(qtyInput.value, 10) < 1)) {
          qtyInput.value = 1;
        }
        sync();
      });
      qtyInput.addEventListener('input', function () {
        var max = parseInt(qtyInput.max, 10);
        var v = parseInt(qtyInput.value, 10);
        if (!isNaN(max) && !isNaN(v) && v > max) qtyInput.value = max;
        sync();
      });
      stepBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = (parseInt(qtyInput.value, 10) || 1) + parseInt(btn.getAttribute('data-qty'), 10);
          var max = parseInt(qtyInput.max, 10);
          if (!isNaN(max)) v = Math.min(v, max);
          qtyInput.value = Math.max(1, v);
          sync();
          // Blijf op een bruikbare knop staan als deze net uitgeschakeld werd.
          if (btn.disabled) stepBtns[btn === stepBtns[0] ? 1 : 0].focus();
        });
      });
      if (typeInput) typeInput.addEventListener('input', sync);
      if (addonInput) addonInput.addEventListener('change', sync);
    });
  }

  // Geeft de gekozen items terug als samenvattingsregels, plus het numerieke
  // subtotaal (items zonder vaste prijs tellen niet mee in het bedrag; bij
  // "vanaf"-items telt de minimale prijs mee en is hasFrom true).
  function summary() {
    var cart = ScCart.read();
    var lines = [];
    var subtotal = 0;
    var hasFrom = false;
    flatItems().forEach(function (item) {
      var entry = cart[item.key];
      if (!entry || entry.qty < 1) return;
      if (item.price === null) {
        lines.push({ key: item.key, label: item.name + (entry.type ? ' (' + entry.type + ')' : '') + ' × ' + entry.qty, priceLabel: item.unit, overleg: true });
      } else {
        var withAddon = !!(item.addon && entry.addon);
        var linePrice = (item.price + (withAddon ? item.addon.price : 0)) * entry.qty;
        subtotal += linePrice;
        if (item.priceFrom) hasFrom = true;
        lines.push({ key: item.key, label: item.name + (entry.type ? ' (' + entry.type + ')' : '') + (withAddon ? ', ' + item.addon.label.toLowerCase() : '') + ' × ' + entry.qty, priceLabel: (item.priceFrom ? 'vanaf ' : '') + fmt(linePrice), overleg: false });
      }
    });
    return { lines: lines, subtotal: subtotal, hasFrom: hasFrom };
  }

  function findItem(key) {
    return flatItems().filter(function (item) { return item.key === key; })[0] || null;
  }

  return { findItem: findItem, fmt: fmt, priceLabel: priceLabel, stockLabel: stockLabel, flatItems: flatItems, renderCatalog: renderCatalog, wire: wire, summary: summary };
})();
