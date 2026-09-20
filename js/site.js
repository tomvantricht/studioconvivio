// Studio Convivio: gedeeld site-script (mobiel menu). Geen dependencies.
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
  if (!toggle || !nav) return;

  // Het mobiele menu begint precies onder de header. Die hoogte hangt af
  // van de logogrootte, dus meten we 'm in plaats van een vast getal aan
  // te houden.
  function setHeaderHeight() {
    if (header) document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeaderHeight);

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
