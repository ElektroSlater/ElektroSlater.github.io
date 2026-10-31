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

  // Bilder: immer vier sichtbar, sie wandern im Uhrzeigersinn weiter (oben links → oben rechts → unten rechts → unten links)
  var ring = document.querySelector('[data-ring]');
  if (ring) {
    var cards = Array.prototype.slice.call(ring.querySelectorAll('.ring-card'));
    var SLOTS = [[0, 0], [51, 0], [51, 51.5], [0, 51.5]];
    var ENTER = [-8, -12], EXIT = [-14, 64];
    var shown = [], nextIdx = 0, ringTimer = null;
    function place(el, pos, on) {
      el.style.left = pos[0] + '%'; el.style.top = pos[1] + '%';
      el.classList.toggle('is-on', on);
    }
    function jump(el, pos) { // ohne Animation an eine Stelle setzen
      el.style.transition = 'none'; place(el, pos, false); void el.offsetWidth; el.style.transition = '';
    }
    cards.forEach(function (c) { jump(c, ENTER); });
    for (var k = 0; k < 4 && k < cards.length; k++) { shown.push(cards[k]); place(cards[k], SLOTS[k], true); cards[k].loading = 'eager'; }
    nextIdx = shown.length % cards.length;
    function turn() {
      if (cards.length <= 4) return;
      var leaving = shown.pop();
      place(leaving, EXIT, false);
      setTimeout(function () { if (shown.indexOf(leaving) < 0) jump(leaving, ENTER); }, 1200);
      var incoming = cards[nextIdx]; nextIdx = (nextIdx + 1) % cards.length;
      while (shown.indexOf(incoming) >= 0) { incoming = cards[nextIdx]; nextIdx = (nextIdx + 1) % cards.length; }
      jump(incoming, ENTER);
      shown.unshift(incoming);
      requestAnimationFrame(function () { shown.forEach(function (c, i) { place(c, SLOTS[i], true); }); });
      var pre = cards[nextIdx]; if (pre.loading === 'lazy') pre.loading = 'eager';
    }
    function ringPlay() { ringStop(); ringTimer = setInterval(turn, 3400); }
    function ringStop() { if (ringTimer) clearInterval(ringTimer); ringTimer = null; }
    ring.addEventListener('click', turn);

    // Blitze an den Seiten, von oben links nach unten
    var sec = ring.closest('section'), bcv = sec.querySelector('.ring-bolts'), bx = bcv.getContext('2d');
    var calmBolts = window.matchMedia('(prefers-reduced-motion: reduce)').matches, boltTimer = null;
    function sizeB() {
      var d = Math.min(window.devicePixelRatio || 1, 2), r = sec.getBoundingClientRect();
      bcv.width = r.width * d; bcv.height = r.height * d; bx.setTransform(d, 0, 0, d, 0, 0);
    }
    function path(x0, y0, x1, y1, rough) {
      var pts = [[x0, y0], [x1, y1]];
      for (var n = 0; n < 6; n++) {
        var np = [pts[0]];
        for (var i = 0; i < pts.length - 1; i++) {
          var p = pts[i], q = pts[i + 1];
          np.push([(p[0] + q[0]) / 2 + (Math.random() - .5) * rough, (p[1] + q[1]) / 2 + (Math.random() - .5) * rough * .3], q);
        }
        pts = np; rough *= .55;
      }
      return pts;
    }
    function stroke(pts, w, a) {
      bx.beginPath(); bx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) bx.lineTo(pts[i][0], pts[i][1]);
      bx.globalAlpha = a;
      bx.shadowColor = 'rgba(143,194,255,1)'; bx.shadowBlur = 24;
      bx.strokeStyle = 'rgba(150,195,255,.6)'; bx.lineWidth = w * 3; bx.stroke();
      bx.shadowBlur = 0; bx.strokeStyle = '#fff'; bx.lineWidth = w; bx.stroke();
      bx.globalAlpha = 1;
    }
    function sideBolt() {
      var r = sec.getBoundingClientRect(), w = r.width, h = r.height;
      var right = Math.random() < 0.35, band = Math.max(w * 0.12, 70);
      var x0 = right ? w - band * 0.9 : band * 0.1 + Math.random() * band * 0.3;
      var x1 = right ? w - band * 0.15 : band * (0.5 + Math.random() * 0.5);
      var main = path(x0, -10, x1, h * (0.55 + Math.random() * 0.45), w * 0.06);
      var branches = [];
      for (var i = 6; i < main.length - 6; i += 9) if (Math.random() < .4) {
        var p = main[i]; branches.push(path(p[0], p[1], p[0] + (Math.random() - .3) * 90, p[1] + 40 + Math.random() * 90, 30));
      }
      [[0, 1], [60, 0], [110, .85], [190, .25], [240, .7], [480, 0]].forEach(function (s) {
        setTimeout(function () {
          bx.clearRect(0, 0, w, h);
          if (!s[1]) return;
          stroke(main, 1.6, s[1]);
          branches.forEach(function (b) { stroke(b, .8, s[1] * .7); });
        }, s[0]);
      });
    }
    function boltLoop() { boltTimer = setTimeout(function () { sideBolt(); boltLoop(); }, 1800 + Math.random() * 3200); }
    function boltStop() { if (boltTimer) clearTimeout(boltTimer); boltTimer = null; }
    sizeB(); window.addEventListener('resize', sizeB);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        var vis = e[0].isIntersecting && !document.hidden;
        if (vis) { ringPlay(); if (!calmBolts && !boltTimer) { sideBolt(); boltLoop(); } }
        else { ringStop(); boltStop(); }
      }, { threshold: 0.2 }).observe(sec);
    } else ringPlay();
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
