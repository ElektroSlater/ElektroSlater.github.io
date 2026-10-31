/* Elektro Slater – Gewitter über München
   Echtes Nachtfoto, echter Blitz (eingeblendet), feiner Regen, Logo flackert langsam an.
   Ton nur nach Klick (Web Audio, ohne externe Dateien). */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  var canvas = document.getElementById('rain');
  var bolt = document.querySelector('.hero-bolt');
  var sky = document.querySelector('.hero-flash');
  if (!hero || !canvas) return;

  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, DPR = 1, drops = [];
  var last = 0, running = true, visible = true;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- Regen ---------- */
  function layout() {
    var r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = Math.round(Math.min(W < 760 ? 180 : 420, (W * H) / 3200));
    drops = [];
    for (var i = 0; i < n; i++) drops.push(newDrop(true));
  }
  function newDrop(anyY) {
    var z = Math.random();
    return {
      x: rand(-W * 0.1, W * 1.1), y: anyY ? rand(-H, H) : rand(-H * 0.2, -20),
      z: z, len: 10 + z * 28, v: 700 + z * 900, a: 0.05 + z * 0.17, w: 0.6 + z * 0.7
    };
  }
  var glow = 0; // Regen wird beim Blitz kurz angeleuchtet
  function drawRain(dt) {
    ctx.clearRect(0, 0, W, H);
    var wind = -0.12, lit = 1 + glow * 2.5;
    ctx.lineCap = 'round';
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v * dt; d.x += d.v * wind * dt;
      if (d.y - d.len > H) { drops[i] = newDrop(false); continue; }
      ctx.strokeStyle = 'rgba(200,215,235,' + Math.min(0.75, d.a * lit) + ')';
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * wind, d.y - d.len);
      ctx.stroke();
    }
  }

  /* ---------- Blitze ---------- */
  function strike(big) {
    if (bolt) {
      var left = rand(W < 760 ? -10 : 5, W < 760 ? 45 : 70);
      var scale = big ? rand(1, 1.15) : rand(0.6, 0.85);
      bolt.style.left = left + '%';
      bolt.style.transform = 'scale(' + (Math.random() < 0.5 ? -scale : scale) + ',' + scale + ')';
    }
    // echtes Blitz-Flackern: mehrere kurze Entladungen
    var seq = big ? [[0, 1], [70, 0.15], [120, 0.95], [210, 0.3], [260, 0.8], [520, 0]]
                  : [[0, 0.7], [90, 0.1], [150, 0.55], [380, 0]];
    seq.forEach(function (s) {
      setTimeout(function () {
        if (bolt) bolt.style.opacity = s[1];
        if (sky) sky.style.opacity = s[1] * (big ? 0.9 : 0.6);
        hero.style.setProperty('--flash', s[1]);
        glow = s[1];
      }, s[0]);
    });
    if (logoOn) {
      hero.classList.remove('is-flicker'); void hero.offsetWidth; hero.classList.add('is-flicker');
    }
    Sound.thunder(big ? 1 : rand(0.4, 0.7), big ? rand(0.2, 0.6) : rand(1, 2.5));
  }

  var logoOn = false;
  function powerLogo() {
    if (logoOn) return;
    logoOn = true;
    hero.classList.add('is-powered');
  }

  var timers = [];
  function schedule() {
    timers.push(setTimeout(function () { strike(false); }, 900));
    timers.push(setTimeout(powerLogo, 1500));
    timers.push(setTimeout(function () { strike(true); }, 4200));
    (function loop() {
      timers.push(setTimeout(function () {
        if (running) strike(Math.random() < 0.35);
        loop();
      }, rand(4500, 9500)));
    })();
  }

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    glow = Math.max(0, glow - dt * 3);
    drawRain(dt);
    requestAnimationFrame(frame);
  }

  /* ---------- Ton (optional) ---------- */
  var Sound = (function () {
    // Lautstärke: aus, leise (startet von selbst beim ersten Klick/Tippen) oder laut (per Knopf)
    var ac = null, master = null, noise = null, on = false, level = 0, seen = true;
    var LEVELS = { off: 0, quiet: 0.14, loud: 0.9 };
    function init() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      var len = ac.sampleRate * 3;
      noise = ac.createBuffer(1, len, ac.sampleRate);
      var d = noise.getChannelData(0), b = 0;
      for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; b = 0.97 * b + 0.03 * w; d[i] = w * 0.6 + b * 2; }
      // Regenrauschen
      var src = ac.createBufferSource(); src.buffer = noise; src.loop = true;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      var g = ac.createGain(); g.gain.value = 0.22;
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); src.start();
      // tiefes Grundrauschen
      var src2 = ac.createBufferSource(); src2.buffer = noise; src2.loop = true; src2.playbackRate.value = 0.5;
      var lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 180;
      var g2 = ac.createGain(); g2.gain.value = 0.12;
      src2.connect(lp2); lp2.connect(g2); g2.connect(master); src2.start();
      return true;
    }
    function apply() {
      if (!ac) return;
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(seen ? level : 0, ac.currentTime + (seen ? 1.2 : 0.5));
    }
    function set(mode) {
      if (!ac && !init()) return false;
      if (ac.state === 'suspended') ac.resume();
      level = LEVELS[mode]; on = level > 0;
      apply();
      return ac.state !== 'suspended' || mode === 'off';
    }
    function setVisible(v) { seen = v; apply(); }
    function thunder(power, delay) {
      if (!on || !ac || !seen) return;
      var t0 = ac.currentTime + delay;
      var src = ac.createBufferSource(); src.buffer = noise; src.playbackRate.value = rand(0.6, 0.9);
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(power > 0.9 ? 2400 : 900, t0);
      lp.frequency.exponentialRampToValueAtTime(110, t0 + 2.5);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(1.4 * power, t0 + (power > 0.9 ? 0.02 : 0.25));
      var dur = rand(3, 5.5), tt = t0 + 0.4;
      while (tt < t0 + dur - 0.5) { g.gain.linearRampToValueAtTime(rand(0.3, 0.9) * power, tt); tt += rand(0.3, 0.8); }
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(lp); lp.connect(g); g.connect(master);
      src.start(t0, rand(0, 1)); src.stop(t0 + dur + 0.1);
    }
    return { set: set, setVisible: setVisible, thunder: thunder };
  })();

  // Ton: leise automatisch, sobald der Browser es erlaubt (erster Klick, Tipp oder Tastendruck).
  // Browser verbieten Ton ganz ohne Zutun des Besuchers – daher dieser Weg.
  var btn = document.querySelector('[data-sound]');
  var mode = 'off', muted = false;
  try { muted = localStorage.getItem('slater-ton') === 'aus'; } catch (e) {}
  function label() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', mode === 'off' ? 'false' : 'true');
    btn.querySelector('span').textContent = mode === 'off' ? 'Gewitter hören' : mode === 'quiet' ? 'Lauter' : 'Ton aus';
  }
  function setMode(m) { mode = m; Sound.set(m); label(); }
  function autoStart(e) {
    if (btn && btn.contains(e.target)) return;
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { document.removeEventListener(t, autoStart, true); });
    if (!muted && mode === 'off') setMode('quiet');
  }
  if (!muted) {
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { document.addEventListener(t, autoStart, true); });
    // manche Browser erlauben Ton sofort – dann gleich leise starten
    if (Sound.set('quiet')) { mode = 'quiet'; label(); } else { Sound.set('off'); }
  }
  if (btn) {
    btn.addEventListener('click', function () {
      var next = mode === 'off' ? 'loud' : mode === 'quiet' ? 'loud' : 'off';
      try { localStorage.setItem('slater-ton', next === 'off' ? 'aus' : 'an'); } catch (e) {}
      muted = next === 'off';
      setMode(next);
    });
  }

  /* ---------- Start ---------- */
  layout();
  var resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(layout, 150); });

  if (reduceMotion) { powerLogo(); return; }

  // Nur animieren, wenn der Startbereich sichtbar ist
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; setRunning(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', setRunning);
  // Ton nur ganz oben: sobald man losscrollt, verstummt das Gewitter – oben setzt es wieder ein
  var atTop = true;
  window.addEventListener('scroll', function () {
    var t = window.scrollY < 60;
    if (t !== atTop) { atTop = t; Sound.setVisible(atTop && !document.hidden); }
  }, { passive: true });
  function setRunning() {
    var should = visible && !document.hidden;
    Sound.setVisible(should && atTop);
    if (should && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    else if (!should) running = false;
  }
  schedule();
  requestAnimationFrame(frame);
})();
