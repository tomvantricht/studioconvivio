// Studio Convivio: catalogus van losse extra tafelitems. Eén bron voor
// naam/prijs/eenheid/icoon/voorraad, gebruikt door zowel extras.html
// (bladeren en toevoegen) als reserveren.html (offerte-berekening), zodat
// prijzen en voorraad op beide plekken altijd gelijk blijven.
//
// stock: het werkelijke aantal dat Studio Convivio bezit. Een klant kan
// nooit meer kiezen dan dit aantal, en bij stock: 0 is het item niet meer
// aan te vinken ("Uitverkocht"). stock: null betekent geen vast aantal
// (bv. handgemaakte kaarten, op bestelling gemaakt) — daarvoor is `max` de
// bovengrens voor het aantalveld; zonder `max` is er geen bovengrens.
// priceFrom: true toont de prijs als "vanaf" (de minimale prijs telt mee in
// de indicatie). price: null betekent "Prijs volgt" of "in overleg".
// sale: true is een verbruiksartikel dat je koopt in plaats van huurt.
window.SC_EXTRAS_CATALOG = [
  {
    category: 'Tafelitems',
    items: [
      { key: 'champagneglazen', name: 'Champagneglazen', price: 0.75, unit: 'stuk', stock: 50,
        icon: '<path d="M10.5 3h3l-.6 10a1 2.2 0 01-1.8 0L10.5 3zM12 13v6M9 21h6"/>' },
      { key: 'servetringen', name: 'Unieke servetringen', price: 0.50, unit: 'stuk', stock: 25,
        icon: '<circle cx="12" cy="12" r="7"/><path d="M12 7.5l2 4.5-2 4.5-2-4.5z"/>' },
      { key: 'strikjes', name: 'Strikjes (onbedrukt)', price: 0.30, unit: 'stuk', stock: null,
        icon: '<path d="M12 12L5 8v8zM12 12l7-4v8zM12 12l-2 7M12 12l2 7"/>' },
      { key: 'strikjes-bedrukt', name: 'Strikjes (bedrukt)', price: 0.80, unit: 'stuk', stock: null, hasType: true,
        typePlaceholder: 'Wat moet erop? Bijv. de namen van je gasten (mag ook in de opmerkingen)',
        icon: '<path d="M12 12L5 8v8zM12 12l7-4v8zM12 12l-2 7M12 12l2 7"/>' },
      { key: 'broodmandjes', name: 'Broodmandjes', price: 3.50, unit: 'stuk', stock: 2,
        icon: '<path d="M4 11h16l-2 8H6zM7 11c0-3 2-5 5-5s5 2 5 5"/>' }
    ]
  },
  {
    category: 'Decoratie & sfeer',
    items: [
      { key: 'tafellampen', name: 'Tafellampen', price: 3.95, unit: 'stuk', stock: 4,
        icon: '<circle cx="12" cy="9" r="6"/><path d="M9 20h6M10 15.5l-1.5 4.5M14 15.5l1.5 4.5"/>' },
      { key: 'zijdebloemen', name: 'Zijdebloemen (boeket)', price: 7.95, unit: 'bos', stock: 2,
        icon: '<path d="M12 3v10M12 13c-3 0-5 2-5 5M12 13c3 0 5 2 5 5M7 18h10"/>' },
      { key: 'kandelaar', name: 'Kandelaar', price: 1.95, unit: 'stuk', stock: 4,
        icon: '<path d="M12 2v5M8 8h8l-1.2 3H9.2zM12 11v7M8 21h8"/>' },
      { key: 'kaarsen', name: 'Kaarsen (te koop)', price: 0.40, unit: 'stuk', stock: null, sale: true,
        icon: '<path d="M12 3c1.5 2 1.5 3.5 0 5-1.5-1.5-1.5-3 0-5zM9 9h6v12H9z"/>' },
      { key: 'kleine-vaasjes', name: 'Kleine vaasjes', price: 6.00, unit: 'set van 3', stock: 3,
        icon: '<rect x="4" y="9" width="4" height="11" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="16" y="11" width="4" height="9" rx="1"/>' },
      { key: 'cilindervazen', name: 'Cilindervazen', price: 4.50, unit: 'set van 3', stock: 4,
        icon: '<rect x="4" y="9" width="4" height="11" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="16" y="11" width="4" height="9" rx="1"/>' },
      { key: 'handgemaakte-kaarten', name: 'Handgemaakte kaarten', price: 1.25, priceFrom: true, unit: 'stuk', stock: null, hasType: true,
        typePlaceholder: 'Welk soort? bijv. menu-, naam-, welkom- of bedankkaarten',
        icon: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M8 10h8M8 14h5"/>' }
    ]
  }
];
