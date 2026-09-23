// Studio Convivio: "stories"-rij op de homepage. Cirkeltjes bovenaan openen
// een schermvullende weergave (foto + korte tekst + link), naar het idee
// van Instagram-stories. Alleen op index.html geladen.
(function () {
  var stories = [
    {
      kicker: '01 · Collectie',
      heading: 'Moss & Mist',
      blurb: 'Zachte groentinten en natuurlijke rust, vanaf €16,75 per persoon.',
      cta: 'Ontdek Moss & Mist',
      href: 'moss-and-mist.html',
      img: 'images/img-044ae929.webp'
    },
    {
      kicker: '02 · Collectie',
      heading: 'Mocha Sky',
      blurb: 'Warme aardetinten, modern en tijdloos, vanaf €17,75 per persoon.',
      cta: 'Ontdek Mocha Sky',
      href: 'mocha-sky.html',
      img: 'images/img-25e2bb73.webp'
    },
    {
      kicker: 'Zo werkt het',
      heading: 'Hoe werkt het?',
      blurb: 'In vijf stappen naar een stijlvol gedekte tafel.',
      cta: 'Bekijk de stappen',
      href: 'hoe-werkt-het.html',
      img: 'images/img-52c47e24.webp'
    },
    {
      kicker: 'Maak het compleet',
      heading: "Extra's",
      blurb: 'Kandelaars, tafellampen en meer: los toe te voegen aan je reservering.',
      cta: "Bekijk de extra's",
      href: 'extras.html',
      img: 'images/img-c41acedc.webp'
    },
    {
      kicker: 'Voor elk moment',
      heading: 'Welk moment vier je?',
      blurb: 'Van 21-diner tot jubileum: voor elke bijzondere gelegenheid.',
      cta: 'Bekijk gelegenheden',
      href: 'index.html#gelegenheden',
      img: 'images/img-43ca6586.webp'
    },
    {
      kicker: 'Klaar voor je moment?',
      heading: 'Reserveer jouw tafel',
      blurb: 'Kies je collectie en dien je aanvraag in. Wij nemen contact met je op.',
      cta: 'Reserveer nu',
      href: 'reserveren.html',
      img: 'images/img-728b3f21.webp'
    }
  ];

  var row = document.querySelector('.story-row-scroll');
  var overlay = document.getElementById('storyOverlay');
  if (!row || !overlay) return;

  var mediaEl = overlay.querySelector('.story-slide-media');
  var imgEl = document.getElementById('storySlideImg');
  var kickerEl = document.getElementById('storySlideKicker');
  var headingEl = document.getElementById('storySlideHeading');
  var blurbEl = document.getElementById('storySlideBlurb');
  var ctaEl = document.getElementById('storySlideCta');
  var progressEl = document.getElementById('storyProgress');
  var prevBtn = document.getElementById('storyPrev');
  var nextBtn = document.getElementById('storyNext');
  var closeBtn = document.getElementById('storyClose');

  var current = 0;
  var lastFocused = null;

  function render(i) {
    current = i;
    var s = stories[i];
    imgEl.src = s.img;
    imgEl.alt = s.heading;
    kickerEl.textContent = s.kicker;
    headingEl.textContent = s.heading;
    blurbEl.textContent = s.blurb;
    ctaEl.textContent = s.cta;
    ctaEl.href = s.href;
    progressEl.innerHTML = stories.map(function (_, idx) {
      return '<span class="story-progress-seg' + (idx <= i ? ' is-active' : '') + '"></span>';
    }).join('');
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === stories.length - 1;
  }

  function open(i) {
    lastFocused = document.activeElement;
    render(i);
    overlay.hidden = false;
    document.body.classList.add('story-open');
    closeBtn.focus();
  }
  function close() {
    overlay.hidden = true;
    document.body.classList.remove('story-open');
    if (lastFocused) lastFocused.focus();
  }
  function next() { if (current < stories.length - 1) render(current + 1); }
  function prev() { if (current > 0) render(current - 1); }

  row.querySelectorAll('.story-avatar').forEach(function (btn, idx) {
    btn.addEventListener('click', function () { open(idx); });
  });
  closeBtn.addEventListener('click', close);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  mediaEl.addEventListener('click', function (e) {
    var rect = mediaEl.getBoundingClientRect();
    var x = e.clientX - rect.left;
    if (x < rect.width * 0.35) prev(); else next();
  });
  document.addEventListener('keydown', function (e) {
    if (overlay.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
})();
