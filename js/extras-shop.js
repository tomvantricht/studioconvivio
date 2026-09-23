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
  function isLowStock(item) {
    return item.stock != null && item.stock > 0 && item.stock <= 5;
  }

  // Bouwt de itemlijst (per categorie) als HTML-string, zonder foto's: een
  // compacte vinklijst. Gebruikt op reserveren.html, waar de items alleen
  // hoeven te worden aangevinkt en de foto's van de shop-kaartjes op
  // extras.html geen meerwaarde hebben.
  function renderCatalog() {
    var html = '';
    SC_EXTRAS_CATALOG.forEach(function (group) {
      html += '<div class="sc-shop-category"><span class="sc-shop-category-label">' + group.category + '</span><div class="sc-shop-grid sc-shop-grid--flat">';
      group.items.forEach(function (item) {
        var soldOut = isSoldOut(item);
        var priceLabel = soldOut ? 'Uitverkocht' : (item.price === null ? item.unit : fmt(item.price) + '/' + item.unit);
        var stockNote = !soldOut && isLowStock(item) ? '<span class="sc-shop-stock">Nog ' + item.stock + ' beschikbaar</span>' : '';
        html += '' +
          '<div class="sc-shop-item' + (soldOut ? ' is-soldout' : '') + '" data-key="' + item.key + '">' +
            '<label class="sc-shop-card sc-shop-card--flat">' +
              '<input type="checkbox" class="sc-shop-check"' + (soldOut ? ' disabled' : '') + '>' +
              '<span class="sc-shop-body">' +
                '<span class="sc-shop-name"><span class="sc-shop-check-icon"></span>' + item.name + '</span>' +
                '<span class="sc-shop-price">' + priceLabel + stockNote + '</span>' +
              '</span>' +
            '</label>' +
            (soldOut ? '' :
              '<div class="sc-qty-field sc-qty-field-flat sc-shop-qty">' +
                '<input type="number" class="sc-shop-qty-input" min="1" max="' + effectiveMax(item) + '" value="1">' +
                (item.hasType ? '<input type="text" class="sc-shop-type-input" placeholder="Welk soort? bijv. menu-, naam-, welkom- of bedankkaarten">' : '') +
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
