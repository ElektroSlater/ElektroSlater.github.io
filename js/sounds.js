/* Elektro Slater – Geräusche zu den Meilensteinen der Elektrik
   Alle Klänge werden im Browser erzeugt (Web Audio), es werden keine Dateien geladen.
   Jeder Kapitel-Knopf spielt sein Geräusch; es endet beim Weiterscrollen oder per Klick. */
(function () {
  'use strict';

  var buttons = document.querySelectorAll('[data-chapter-sound]');
  if (!buttons.length) return;

  var ac = null, master = null, noise = null, current = null;
  function rand(a, b) { return a + Math.random() * (b - a); }

  function init() {
    if (ac) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    var len = ac.sampleRate * 2;
    noise = ac.createBuffer(1, len, ac.sampleRate);
    var d = noise.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  // Bausteine
  function noiseSrc(rate) {
    var s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    if (rate) s.playbackRate.value = rate;
    return s;
  }
  function filter(type, freq, q) {
    var f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    if (q) f.Q.value = q;
    return f;
  }
  function gain(v) { var g = ac.createGain(); g.gain.value = v; return g; }
  function osc(type, freq) { var o = ac.createOscillator(); o.type = type; o.frequency.value = freq; return o; }
  function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); }

  // kurzer Knister-Funke
  function crack(out, t, level, freq, len) {
    var s = noiseSrc(), f = filter('bandpass', freq || 3000, 1.2), g = gain(0);
    chain(s, f, g, out);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 0.04));
    s.start(t, rand(0, 1.5)); s.stop(t + (len || 0.04) + 0.02);
  }
  // Donnergrollen
  function thunder(out, t, power) {
    var s = noiseSrc(rand(0.5, 0.8)), f = filter('lowpass', 1800), g = gain(0);
    chain(s, f, g, out);
    f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(120, t + 2.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(power, t + 0.03);
    var dur = rand(3, 5), tt = t + 0.4;
    while (tt < t + dur - 0.5) { g.gain.linearRampToValueAtTime(rand(0.3, 0.8) * power, tt); tt += rand(0.3, 0.7); }
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, rand(0, 1)); s.stop(t + dur + 0.1);
  }

  // Wiederholt eine Funktion in zufälligen Abständen, bis gestoppt
  function every(min, max, fn, timers) {
    (function loop() {
      timers.push(setTimeout(function () { fn(ac.currentTime); loop(); }, rand(min, max)));
    })();
  }

  /* ---------- Die sechs Klänge ---------- */
  var SOUNDS = {
    // 1752 Franklin: Regen, Donner, knisternder Drachenschlüssel
    franklin: function (out, timers, nodes) {
      var rain = noiseSrc(), hp = filter('highpass', 600), lp = filter('lowpass', 7000), g = gain(0.18);
      chain(rain, hp, lp, g, out); rain.start(); nodes.push(rain);
      thunder(out, ac.currentTime + 0.3, 0.9);
      every(4500, 8000, function (t) { thunder(out, t, rand(0.4, 0.9)); }, timers);
      every(300, 1400, function (t) { if (Math.random() < 0.5) crack(out, t, 0.25, 4500, 0.03); }, timers);
    },
    // 1800 Volta: leises Summen, Bläschen im Salzwasser, kleine Funken
    volta: function (out, timers, nodes) {
      var hum = osc('sine', 55), hg = gain(0.05); chain(hum, hg, out); hum.start(); nodes.push(hum);
      var fizz = noiseSrc(), bp = filter('bandpass', 6000, 0.8), fg = gain(0.05);
      chain(fizz, bp, fg, out); fizz.start(); nodes.push(fizz);
      every(60, 260, function (t) { crack(out, t, rand(0.05, 0.14), rand(1500, 4000), 0.015); }, timers);
      every(1500, 3500, function (t) { crack(out, t, 0.35, 2500, 0.08); }, timers);
    },
    // 1831 Faraday: Magnet fährt durch die Spule – anschwellendes Brummen
    faraday: function (out, timers, nodes) {
      var o1 = osc('sine', 50), o2 = osc('triangle', 100), g = gain(0);
      var lfo = osc('sine', 0.35), lg = gain(0.12);
      chain(lfo, lg); lg.connect(g.gain);
      o1.connect(g); o2.connect(g); g.connect(out);
      var whoosh = noiseSrc(0.5), wf = filter('bandpass', 400, 1.5), wg = gain(0);
      chain(whoosh, wf, wg, out);
      var wl = gain(0.04); chain(lfo, wl); wl.connect(wg.gain);
      var fm = gain(25); chain(lfo, fm); fm.connect(wf.frequency);
      [o1, o2, lfo, whoosh].forEach(function (n) { n.start(); nodes.push(n); });
      g.gain.value = 0.12;
    },
    // 1879 Edison: Glühbirne summt und flackert
    edison: function (out, timers, nodes) {
      var buzz = osc('sawtooth', 100), lp = filter('lowpass', 500), g = gain(0.06);
      chain(buzz, lp, g, out); buzz.start(); nodes.push(buzz);
      var fil = noiseSrc(), bp = filter('bandpass', 8000, 2), fg = gain(0.012);
      chain(fil, bp, fg, out); fil.start(); nodes.push(fil);
      every(900, 3200, function (t) {
        var n = Math.floor(rand(2, 5));
        for (var i = 0; i < n; i++) {
          var tt = t + i * rand(0.04, 0.12);
          g.gain.setValueAtTime(0.06, tt); g.gain.linearRampToValueAtTime(0.005, tt + 0.02);
          g.gain.linearRampToValueAtTime(0.06, tt + rand(0.04, 0.1));
          crack(out, tt, 0.08, 5000, 0.01);
        }
      }, timers);
    },
    // 1882 Miesbach – München: Hochspannungsleitung brummt und knistert im Wind
    miesbach: function (out, timers, nodes) {
      var hum = osc('sawtooth', 100), lp = filter('lowpass', 300), hg = gain(0.05);
      chain(hum, lp, hg, out); hum.start(); nodes.push(hum);
      var wind = noiseSrc(0.4), wl = filter('lowpass', 500), wg = gain(0.08);
      chain(wind, wl, wg, out); wind.start(); nodes.push(wind);
      var corona = noiseSrc(), cb = filter('bandpass', 3000, 0.7), cg = gain(0.02);
      chain(corona, cb, cg, out); corona.start(); nodes.push(corona);
      every(80, 500, function (t) { crack(out, t, rand(0.04, 0.12), rand(2000, 5000), 0.02); }, timers);
    },
    // 1888 Tesla: knallende Entladungen der Teslaspule
    tesla: function (out, timers, nodes) {
      var bed = osc('sawtooth', 120), bl = filter('lowpass', 900), bg = gain(0.025);
      chain(bed, bl, bg, out); bed.start(); nodes.push(bed);
      every(120, 900, function (t) {
        var len = rand(0.05, 0.35);
        var z = osc('square', rand(110, 140)), zn = noiseSrc(), mix = gain(0), bp = filter('bandpass', rand(1200, 2600), 0.9);
        z.connect(bp); zn.connect(bp); chain(bp, mix, out);
        mix.gain.setValueAtTime(0, t);
        mix.gain.linearRampToValueAtTime(rand(0.15, 0.35), t + 0.005);
        for (var k = t + 0.02; k < t + len; k += 0.025) mix.gain.setValueAtTime(Math.random() < 0.6 ? rand(0.1, 0.35) : 0.02, k);
        mix.gain.linearRampToValueAtTime(0, t + len);
        z.start(t); zn.start(t, rand(0, 1.5)); z.stop(t + len + 0.02); zn.stop(t + len + 0.02);
      }, timers);
    }
  };

  /* ---------- Steuerung ---------- */
  function stop() {
    if (!current) return;
    var c = current; current = null;
    c.timers.forEach(clearTimeout);
    c.out.gain.cancelScheduledValues(ac.currentTime);
    c.out.gain.setValueAtTime(c.out.gain.value, ac.currentTime);
    c.out.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5);
    setTimeout(function () { c.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); c.out.disconnect(); }, 600);
    c.btn.setAttribute('aria-pressed', 'false');
    c.btn.querySelector('span').textContent = 'Anhören';
  }
  function play(btn) {
    if (!init()) return;
    if (ac.state === 'suspended') ac.resume();
    stop();
    var out = gain(0); out.connect(master);
    out.gain.setValueAtTime(0, ac.currentTime);
    out.gain.linearRampToValueAtTime(1, ac.currentTime + 0.8);
    var c = { btn: btn, out: out, timers: [], nodes: [] };
    SOUNDS[btn.getAttribute('data-chapter-sound')](out, c.timers, c.nodes);
    current = c;
    btn.setAttribute('aria-pressed', 'true');
    btn.querySelector('span').textContent = 'Stopp';
  }

  // Nach dem ersten Klick/Tipp auf der Seite darf der Browser Ton abspielen –
  // dann starten die Kapitel-Geräusche von selbst, sobald man zum Kapitel scrollt.
  var unlocked = false, skipped = [], inView = [];
  function muted() { try { return localStorage.getItem('slater-ton-v2') === 'aus'; } catch (e) { return false; } }
  function autoPlay() {
    if (!unlocked || muted()) return;
    for (var i = 0; i < inView.length; i++) {
      var b = inView[i];
      if (skipped.indexOf(b) < 0) { if (!current || current.btn !== b) play(b); return; }
    }
  }
  function unlock() {
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { document.removeEventListener(t, unlock, true); });
    if (!init()) return;
    ac.resume();
    unlocked = true;
    setTimeout(autoPlay, 50);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { document.addEventListener(t, unlock, true); });

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (current && current.btn === btn) { stop(); if (skipped.indexOf(btn) < 0) skipped.push(btn); }
      else { skipped = skipped.filter(function (x) { return x !== btn; }); play(btn); }
    });
  });

  // Kapitel zur Hälfte im Bild: Geräusch an. Kapitel verlassen: Geräusch aus.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var b = e.target.querySelector('[data-chapter-sound]');
        if (e.intersectionRatio >= 0.5) {
          if (inView.indexOf(b) < 0) inView.push(b);
        } else if (e.intersectionRatio < 0.15) {
          inView = inView.filter(function (x) { return x !== b; });
          skipped = skipped.filter(function (x) { return x !== b; });
          if (current && current.btn === b) stop();
        }
      });
      autoPlay();
    }, { threshold: [0, 0.15, 0.5] });
    buttons.forEach(function (b) { io.observe(b.closest('section')); });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
})();
