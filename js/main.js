/* Elektro Slater – Navigation, Einblenden, Galerie, Kontaktformular */
(function () {
  'use strict';

  var EMAIL = 'elektro@slater.info';

  // Kopfzeile beim Scrollen abdunkeln
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobiles Menü
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Einblenden beim Scrollen
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Galerie-Großansicht
  var box = document.querySelector('.lightbox');
  if (box) {
    var bigImg = box.querySelector('img'), cap = box.querySelector('p');
    document.querySelectorAll('.gallery figure').forEach(function (fig) {
      fig.setAttribute('tabindex', '0');
      function open() {
        var img = fig.querySelector('img');
        bigImg.src = img.src; bigImg.alt = img.alt;
        cap.textContent = fig.querySelector('figcaption') ? fig.querySelector('figcaption').textContent : '';
        box.classList.add('is-open');
        box.querySelector('button').focus();
      }
      fig.addEventListener('click', open);
      fig.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    function close() { box.classList.remove('is-open'); }
    box.addEventListener('click', function (e) { if (e.target === box || e.target.tagName === 'BUTTON') close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // Kontaktformular: öffnet das E-Mail-Programm mit vorbereiteter Nachricht
  var form = document.querySelector('#anfrage-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var subject = 'Anfrage über slater.info: ' + (d.get('art') || 'Elektroarbeiten');
      var body = [
        'Name: ' + d.get('name'),
        'E-Mail: ' + d.get('email'),
        'Telefon: ' + (d.get('telefon') || '-'),
        'Ort / PLZ: ' + (d.get('ort') || '-'),
        'Art der Arbeit: ' + (d.get('art') || '-'),
        '',
        d.get('nachricht')
      ].join('\n');
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  // Jahreszahl
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Voltasche Säule: abwechselnd Kupfer, Pappe, Zink
  var stack = document.querySelector('.volta-stack');
  if (stack) {
    var svgNS = 'http://www.w3.org/2000/svg', y = 40;
    for (var i = 0; i < 9; i++) {
      [['url(#cu)', 9], ['#6b5a3e', 4], ['url(#zn)', 9]].forEach(function (l) {
        var e = document.createElementNS(svgNS, 'ellipse');
        e.setAttribute('cx', 60); e.setAttribute('cy', y); e.setAttribute('rx', 46); e.setAttribute('ry', 9);
        e.setAttribute('fill', l[0]); e.setAttribute('stroke', 'rgba(0,0,0,.5)');
        stack.appendChild(e);
        y += l[1] * 0.85;
      });
    }
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Flackernde Bilder: Glühbirne, Teslaspule, Funken, Gewitter, Trafo-Brummen
  var flickers = [];
  document.querySelectorAll('[data-flicker]').forEach(function (img) {
    flickers.push({ el: img, mode: img.getAttribute('data-flicker'), on: false, next: 0, level: 1, until: 0 });
  });
  if ('IntersectionObserver' in window) {
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        flickers.forEach(function (f) { if (f.el === e.target) f.on = e.isIntersecting; });
      });
    });
    flickers.forEach(function (f) { fo.observe(f.el); });
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function step(f, t) {
    var b = 1, o = null, tr = '';
    switch (f.mode) {
      case 'bulb': // alte Glühbirne: meist an, manchmal Aussetzer
        if (t > f.next) { f.until = t + rnd(60, 380); f.next = t + rnd(900, 3800); f.level = rnd(0.05, 0.5); }
        b = t < f.until ? (Math.random() < 0.5 ? f.level : 0.9) : 0.95 + Math.sin(t / 90) * 0.05;
        break;
      case 'tesla': // unruhige Entladungen
        b = rnd(0.55, 1.35); o = rnd(0.55, 1);
        tr = 'translate(' + rnd(-2, 2).toFixed(1) + 'px,' + rnd(-2, 2).toFixed(1) + 'px)';
        break;
      case 'storm': // dunkel, dann Doppelblitz
        if (t > f.next) { f.until = t + 420; f.next = t + rnd(3000, 7000); }
        b = t < f.until ? (((f.until - t) % 160) < 80 ? 1.6 : 0.7) : 0.55;
        break;
      case 'spark': // gelegentlicher Kurzschluss
        if (t > f.next) { f.until = t + rnd(150, 500); f.next = t + rnd(2500, 6000); }
        b = t < f.until ? rnd(0.9, 1.8) : 0.45;
        break;
      case 'hum': // Trafo brummt: leichtes Flimmern
        b = 0.85 + Math.sin(t / 10) * 0.04 + (Math.random() < 0.01 ? -0.3 : 0);
        break;
      default: // glow: ruhiges Pulsieren
        b = 0.85 + Math.sin(t / 900) * 0.15;
    }
    f.el.style.filter = 'brightness(' + b.toFixed(2) + ')';
    if (o !== null) f.el.style.opacity = o.toFixed(2);
    if (tr) f.el.style.transform = tr;
  }

  // Bilder in den Kapiteln bewegen sich beim Scrollen leicht (Parallaxe)
  var media = document.querySelectorAll('.chapter-media');
  function tick(t) {
    for (var i = 0; i < flickers.length; i++) if (flickers[i].on) step(flickers[i], t);
    var vh = window.innerHeight;
    for (var j = 0; j < media.length; j++) {
      var r = media[j].parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      media[j].style.transform = 'translateY(' + ((r.top + r.height / 2 - vh / 2) * -0.08).toFixed(1) + 'px)';
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
