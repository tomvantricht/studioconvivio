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
    return item.stock != null ? 'Max. ' + item.stock + ' per aanvraag' : '';
  }
  // Prijslabel zoals op de kaartjes: "€0,75/stuk", "vanaf €1,25/stuk" of
  // de tekst uit `unit` wanneer er (nog) geen vaste prijs is.
  function priceLabel(item) {
    if (item.price === null) return item.unit;
    return (item.priceFrom ? 'vanaf ' : '') + fmt(item.price) + '/' + item.unit;
  }

  // Bouwt de itemlijst (per categorie) als HTML-string: een compacte
  // vinklijst met een kleine foto per item (images/thumb-<key>.webp, 112px
  // vierkant). Gebruikt op reserveren.html. Heeft het item foto's in de
  // catalogus, dan is de miniatuur een knop die ze groot toont (de pagina
  // vangt de klik af via data-zoom, zodat het vinkje niet omklapt).
  // Ontbreekt een miniatuur, dan verdwijnt het lege vakje vanzelf.
  function thumbHtml(item) {
    var img = '<img class="sc-shop-thumb" src="images/thumb-' + item.key + '.webp" alt="" width="40" height="40" loading="lazy" decoding="async" onerror="this.remove()">';
    if (!item.photos || !item.photos.length) return img;
    var n = item.photos.length;
    var label = n > 1 ? 'Bekijk de ' + n + ' foto\'s van ' + item.name : 'Bekijk de foto van ' + item.name;
    return '<button type="button" class="sc-shop-zoom" data-zoom="' + item.key + '" aria-label="' + label + '">' + img +
      '<svg class="sc-shop-zoom-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/></svg></button>';
  }
  function renderCatalog() {
    var html = '';
    SC_EXTRAS_CATALOG.forEach(function (group) {
      html += '<div class="sc-shop-category"><span class="sc-shop-category-label">' + group.category + '</span><div class="sc-shop-grid sc-shop-grid--flat">';
      group.items.forEach(function (item) {
        var soldOut = isSoldOut(item);
        var label = soldOut ? 'Uitverkocht' : priceLabel(item);
        var stockNote = !soldOut && stockLabel(item) ? '<span class="sc-shop-stock">' + stockLabel(item) + '</span>' : '';
        var max = effectiveMax(item);
        html += '' +
          '<div class="sc-shop-item' + (soldOut ? ' is-soldout' : '') + '" data-key="' + item.key + '">' +
            '<label class="sc-shop-card sc-shop-card--flat">' +
              '<input type="checkbox" class="sc-shop-check"' + (soldOut ? ' disabled' : '') + '>' +
              '<span class="sc-shop-body">' +
                '<span class="sc-shop-name"><span class="sc-shop-check-icon"></span>' + thumbHtml(item) + item.name + '</span>' +
                '<span class="sc-shop-price">' + label + stockNote + '</span>' +
              '</span>' +
            '</label>' +
            (soldOut ? '' :
              '<div class="sc-qty-field sc-qty-field-flat sc-shop-qty">' +
                '<input type="number" class="sc-shop-qty-input" min="1"' + (max != null ? ' max="' + max + '"' : '') + ' value="1">' +
                (item.hasType ? '<input type="text" class="sc-shop-type-input" placeholder="' + (item.typePlaceholder || '') + '">' : '') +
              '</div>') +
          '</div>';
      });
      html += '</div></div>';
    });
    return html;
  }

  // Koppelt checkbox/aantal-gedrag aan alle .sc-shop-item's binnen `root`,
  // leest de opgeslagen keuzes uit ScCart en schrijft wijzigingen terug.
  function wire(root, onChange) {
    var cart = ScCart.read();
    root.querySelectorAll('.sc-shop-item').forEach(function (itemEl) {
      var key = itemEl.getAttribute('data-key');
      var check = itemEl.querySelector('.sc-shop-check');
      if (check.disabled) return; // Uitverkocht: niet aan te vinken, geen aantalveld.
      var qtyWrap = itemEl.querySelector('.sc-shop-qty');
      var qtyInput = itemEl.querySelector('.sc-shop-qty-input');
      var typeInput = itemEl.querySelector('.sc-shop-type-input');

      var saved = cart[key];
      if (saved && saved.qty > 0) {
        check.checked = true;
        qtyInput.value = saved.qty;
        qtyWrap.classList.add('sc-visible');
        if (typeInput && saved.type) typeInput.value = saved.type;
      }

      function sync() {
        var qty = check.checked ? (parseInt(qtyInput.value, 10) || 1) : 0;
        if (check.checked) { qtyWrap.classList.add('sc-visible'); } else { qtyWrap.classList.remove('sc-visible'); }
        var extra = typeInput ? { type: typeInput.value } : null;
        ScCart.setItem(key, qty, extra);
        if (onChange) onChange();
      }

      check.addEventListener('change', function () {
        if (check.checked && (!qtyInput.value || parseInt(qtyInput.value, 10) < 1)) qtyInput.value = 1;
        sync();
      });
      qtyInput.addEventListener('input', function () {
        var max = parseInt(qtyInput.max, 10);
        var v = parseInt(qtyInput.value, 10);
        if (!isNaN(max) && !isNaN(v) && v > max) qtyInput.value = max;
        sync();
      });
      if (typeInput) typeInput.addEventListener('input', sync);
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
        var linePrice = item.price * entry.qty;
        subtotal += linePrice;
        if (item.priceFrom) hasFrom = true;
        lines.push({ key: item.key, label: item.name + (entry.type ? ' (' + entry.type + ')' : '') + ' × ' + entry.qty, priceLabel: (item.priceFrom ? 'vanaf ' : '') + fmt(linePrice), overleg: false });
      }
    });
    return { lines: lines, subtotal: subtotal, hasFrom: hasFrom };
  }

  function findItem(key) {
    return flatItems().filter(function (item) { return item.key === key; })[0] || null;
  }

  return { findItem: findItem, fmt: fmt, priceLabel: priceLabel, stockLabel: stockLabel, flatItems: flatItems, renderCatalog: renderCatalog, wire: wire, summary: summary };
})();
