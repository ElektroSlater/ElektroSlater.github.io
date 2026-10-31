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

  // Bildershow: ein Bild nach dem anderen, mit dunklem Blitz und Flackern beim Wechsel
  var reel = document.querySelector('[data-reel]');
  if (reel) {
    var shots = Array.prototype.slice.call(reel.querySelectorAll('.reel-shot'));
    var bg = reel.querySelector('.reel-bg');
    var flashEl = reel.querySelector('.reel-flash');
    var bar = reel.querySelector('.reel-progress i');
    var bc = reel.querySelector('.reel-bolt'), bctx = bc.getContext('2d');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = -1, timer = null, onScreen = false, HOLD = 4600;

    function sizeBolt() {
      var r = reel.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      bc.width = r.width * d; bc.height = r.height * d;
      bctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function boltPath(w, h) {
      var x = w * (0.25 + Math.random() * 0.5), pts = [[x, -10]], y = -10;
      while (y < h + 10) { y += 14 + Math.random() * 26; x += (Math.random() - 0.5) * 60; pts.push([x, y]); }
      return pts;
    }
    function drawBolt(pts, a) {
      var r = reel.getBoundingClientRect();
      bctx.clearRect(0, 0, r.width, r.height);
      if (a <= 0) return;
      bctx.lineJoin = 'round'; bctx.lineCap = 'round';
      bctx.beginPath(); bctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) bctx.lineTo(pts[i][0], pts[i][1]);
      bctx.globalAlpha = a;
      bctx.shadowColor = 'rgba(143,194,255,.95)'; bctx.shadowBlur = 28;
      bctx.strokeStyle = 'rgba(120,170,255,.55)'; bctx.lineWidth = 9; bctx.stroke(); // Glühen
      bctx.shadowBlur = 0;
      bctx.strokeStyle = '#000'; bctx.lineWidth = 4; bctx.stroke();                 // schwarzer Kern
      bctx.globalAlpha = 1;
    }
    function strike() {
      if (calm) return;
      var r = reel.getBoundingClientRect(), pts = boltPath(r.width, r.height);
      [[0, 1], [70, 0], [120, .9], [200, .2], [260, .75], [520, 0]].forEach(function (s) {
        setTimeout(function () { drawBolt(pts, s[1]); }, s[0]);
      });
      flashEl.classList.remove('is-on'); void flashEl.offsetWidth; flashEl.classList.add('is-on');
    }
    function show(n) {
      var prev = shots[cur];
      cur = (n + shots.length) % shots.length;
      var next = shots[cur];
      if (prev) { prev.classList.remove('is-in'); prev.classList.add('is-out'); setTimeout(function () { prev.classList.remove('is-out'); }, 1000); }
      strike();
      setTimeout(function () {
        next.classList.add('is-in');
        bg.style.backgroundImage = 'url("' + next.getAttribute('src') + '")';
      }, calm ? 0 : 160);
      var after = shots[(cur + 1) % shots.length]; if (after.loading === 'lazy') after.loading = 'eager';
      bar.style.transition = 'none'; bar.style.width = '0';
      void bar.offsetWidth;
      bar.style.transition = 'width ' + HOLD + 'ms linear'; bar.style.width = '100%';
    }
    function play() { stop(); timer = setInterval(function () { show(cur + 1); }, HOLD); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    reel.addEventListener('click', function () { show(cur + 1); if (onScreen) play(); });
    sizeBolt(); window.addEventListener('resize', sizeBolt);
    shots[0].loading = 'eager';
    show(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        onScreen = e[0].isIntersecting;
        if (onScreen && !document.hidden) play(); else stop();
      }, { threshold: 0.25 }).observe(reel);
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (onScreen) play(); });
    } else play();
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
