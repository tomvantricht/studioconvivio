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

  // Bouwt de kaartjes-grid (per categorie) als HTML-string. Gebruikt op
  // reserveren.html, waar de catalogus niet los hoeft te staan als
  // doorzoekbare pagina-inhoud en dus uit de gedeelde data mag komen.
  function renderCatalog() {
    var html = '';
    SC_EXTRAS_CATALOG.forEach(function (group) {
      html += '<div class="sc-shop-category"><span class="sc-shop-category-label">' + group.category + '</span><div class="sc-shop-grid">';
      group.items.forEach(function (item) {
        var priceLabel = item.price === null ? item.unit : fmt(item.price) + '/' + item.unit;
        html += '' +
          '<div class="sc-shop-item" data-key="' + item.key + '">' +
            '<label class="sc-shop-card">' +
              '<input type="checkbox" class="sc-shop-check">' +
              '<span class="sc-shop-photo">' +
                '<svg class="sc-shop-ph-icon" viewBox="0 0 24 24">' + item.icon + '</svg>' +
                '<span class="sc-shop-ph-label">Foto volgt</span>' +
                '<span class="sc-shop-badge">✓</span>' +
              '</span>' +
              '<span class="sc-shop-body"><span class="sc-shop-name">' + item.name + '</span><span class="sc-shop-price">' + priceLabel + '</span></span>' +
            '</label>' +
            '<div class="sc-qty-field sc-qty-field-flat sc-shop-qty">' +
              '<input type="number" class="sc-shop-qty-input" min="1" max="' + item.max + '" value="1">' +
              (item.hasType ? '<input type="text" class="sc-shop-type-input" placeholder="Welk soort? bijv. menu-, naam-, welkom- of bedankkaarten">' : '') +
            '</div>' +
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
  // subtotaal (items "in overleg" tellen niet mee in het bedrag).
  function summary() {
    var cart = ScCart.read();
    var lines = [];
    var subtotal = 0;
    flatItems().forEach(function (item) {
      var entry = cart[item.key];
      if (!entry || entry.qty < 1) return;
      if (item.price === null) {
        lines.push({ key: item.key, label: item.name + (entry.type ? ' (' + entry.type + ')' : '') + ' × ' + entry.qty, priceLabel: 'Prijs in overleg', overleg: true });
      } else {
        var linePrice = item.price * entry.qty;
        subtotal += linePrice;
        lines.push({ key: item.key, label: item.name + ' × ' + entry.qty, priceLabel: fmt(linePrice), overleg: false });
      }
    });
    return { lines: lines, subtotal: subtotal };
  }

  return { fmt: fmt, flatItems: flatItems, renderCatalog: renderCatalog, wire: wire, summary: summary };
})();
