/* $CHEF Study — app.js (script clásico, sin módulos) */
(function () {
  'use strict';

  var app = document.getElementById('app');

  // --- utilidades -----------------------------------------------------------
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'onclick') n.addEventListener('click', attrs[k]);
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function go(route) { location.hash = '#/' + route; }

  function backButton() {
    return el('button', { 'class': 'back', 'data-go': 'inicio', text: '‹ Inicio', onclick: function () { go('inicio'); } });
  }

  function screen(name, title, body) {
    var s = el('section', { 'data-screen': name });
    if (name !== 'inicio') s.appendChild(backButton());
    var warn = storageWarning();
    if (warn) s.appendChild(warn);
    s.appendChild(el('h1', { text: title }));
    (body || []).forEach(function (b) { if (b) s.appendChild(b); });
    return s;
  }

  function navButton(label, route) {
    return el('button', { 'data-go': route, text: label, onclick: function () { go(route); } });
  }

  // --- progreso (solo lectura aquí; guardar es T008) -----------------------
  var KEY = 'study-v1';
  function defaultProgress() {
    return {
      version: 1,
      settings: { minutesEn: 40, minutesUk: 20, voices: {}, audioFiles: true },
      streak: { current: 0, best: 0, lastDay: null },
      lessons: {}, cards: {},
      newToday: { day: null, en: 0, uk: 0 },
      reviewsToday: { day: null, en: 0, uk: 0 },
      ielts: [], errors: [], nativeCheck: {}, drafts: {}, savedAt: null
    };
  }
  // Solo se usa la clave study-v1; nunca se borra todo el almacenamiento.
  // Si localStorage no está disponible, el progreso vive solo en memoria y se avisa.
  var storageOk = true, memory = null;
  try { localStorage.getItem(KEY); } catch (e) { storageOk = false; }

  function merge(saved) {
    var p = defaultProgress();
    if (saved && typeof saved === 'object') {
      Object.keys(p).forEach(function (k) { if (saved[k] !== undefined) p[k] = saved[k]; });
      var s = defaultProgress().settings;
      Object.keys(s).forEach(function (k) { if (p.settings[k] === undefined) p.settings[k] = s[k]; });
    }
    return p;
  }
  function readProgress() {
    if (!storageOk) return merge(memory);
    try {
      var raw = localStorage.getItem(KEY);
      return merge(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return merge(null);  // dato dañado: se empieza con valores por defecto, sin borrar nada
    }
  }
  // keepSavedAt: al importar o deshacer se guarda el progreso tal cual, con su propio savedAt (T034).
  function saveProgress(p, keepSavedAt) {
    if (!keepSavedAt) p.savedAt = new Date().toISOString();
    if (storageOk) {
      try { localStorage.setItem(KEY, JSON.stringify(p)); return true; }
      catch (e) {
        // Primero el progreso a la memoria y después dibujar el aviso (si no, la pantalla saldría vacía).
        storageOk = false; memory = JSON.parse(JSON.stringify(p)); render(); return false;
      }
    }
    memory = JSON.parse(JSON.stringify(p));
    return false;
  }
  // Para las pruebas y las tareas siguientes.
  window.__study = { readProgress: readProgress, saveProgress: saveProgress };

  function storageWarning() {
    return storageOk ? null : el('p', { 'class': 'card bad', 'data-warning': 'storage',
      text: 'Aviso: tu progreso no se guardará en este teléfono (el navegador no deja guardar datos). Puedes estudiar igual.' });
  }

  // --- cálculos de la sesión de hoy ----------------------------------------
  var NEW_CAP = 20, REVIEW_CAP = 60;
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // Fecha local del teléfono (AAAA-MM-DD) de una fecha guardada en ISO (UTC).
  function localDay(iso) {
    var d = new Date(iso);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function usedToday(counter, lang) {
    return counter && counter.day === today() ? (counter[lang] || 0) : 0;
  }
  // --- racha (T033, data-model.md): una sola; sube con 1 lección o 20 repasos en el día; un día perdido la reinicia ---
  function yesterday() {
    var d = new Date(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function markStudyDay(p) {
    var d = today(), s = p.streak;
    if (s.lastDay === d) return;
    s.current = s.lastDay === yesterday() ? (s.current || 0) + 1 : 1;
    s.best = Math.max(s.best || 0, s.current);
    s.lastDay = d;
  }
  // Racha que se muestra: si el último día de estudio no es hoy ni ayer, ya se perdió.
  function currentStreak(p) {
    var s = p.streak;
    return s.lastDay === today() || s.lastDay === yesterday() ? (s.current || 0) : 0;
  }
  // Tarjetas calificadas hoy en total (nuevas y repasos, los dos idiomas).
  function ratedToday(p) {
    return ['en', 'uk'].reduce(function (n, l) { return n + usedToday(p.newToday, l) + usedToday(p.reviewsToday, l); }, 0);
  }
  // Tarjetas vencidas de un idioma, con sus topes (misma regla que la pantalla de repaso).
  function dueCounts(p, lang) {
    var q = reviewQueue(p, lang), fresh = 0;
    q.forEach(function (id) { if (p.cards[id].fsrs.state === 0) fresh++; });
    return { fresh: fresh, reviews: q.length - fresh };
  }
  // Lecciones de un curso, en orden de unidad.
  function courseLessons(lang) {
    var units = window.STUDY.units, out = [];
    Object.keys(units).filter(function (id) { return id.indexOf(lang + '-') === 0; }).sort()
      .forEach(function (id) { (units[id].lessons || []).forEach(function (l) { out.push(l); }); });
    return out;
  }
  function lessonMinutes(lesson) {
    return (lesson.activities || []).reduce(function (s, a) { return s + (a.minutes || 0); }, 0);
  }
  function nextLesson(p, lang) {
    var list = courseLessons(lang);
    for (var i = 0; i < list.length; i++) {
      if (!(p.lessons[list[i].id] && p.lessons[list[i].id].doneAt)) return list[i];
    }
    return null;
  }

  // Estado de una lección: hecha / disponible / bloqueada (bloqueada si la anterior no está hecha).
  function lessonState(p, list, id) {
    var done = function (l) { return !!(p.lessons[l.id] && p.lessons[l.id].doneAt); };
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== id) continue;
      if (done(list[i])) return 'hecha';
      return i === 0 || done(list[i - 1]) ? 'disponible' : 'bloqueada';
    }
    return 'bloqueada';
  }
  var session = null;   // «Empezar sesión de hoy»: datos para el resumen al terminar la lección
  // Resumen final (aciertos, repasos, tarjetas nuevas, tiempo) y «Seguir estudiando».
  // T047 (Historia 1): lo nuevo de la lección, sacado de su contenido (pretest, chunks y letras).
  function learnedList(lesson) {
    var out = [];
    (lesson && lesson.activities || []).forEach(function (a) {
      if (a.type === 'pretest') a.items.forEach(function (it) { out.push(it.word); });
      if (a.type === 'chunks') a.cards.forEach(function (cid) { var c = findUnitCard(cid); if (c) out.push(c.front); });
      if (a.type === 'letters') a.letters.forEach(function (l) { out.push(l.letter); });
    });
    return out;
  }
  // T047: tarjetas de un idioma que vencen hasta el final de mañana, con los topes de un día (20 nuevas, 60 repasos).
  function dueTomorrow(p, lang) {
    var t = startOfTomorrow(), end = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1).getTime();
    var fresh = 0, reviews = 0;
    Object.keys(p.cards).forEach(function (id) {
      var c = p.cards[id];
      if (!validCard(c) || String(c.lang).slice(0, 2) !== lang || new Date(c.fsrs.due).getTime() >= end) return;
      if (c.fsrs.state === 0) fresh++; else reviews++;
    });
    var shown = Math.min(fresh, NEW_CAP) + Math.min(reviews, REVIEW_CAP);
    return { shown: shown, waiting: fresh + reviews - shown };
  }
  function summaryBox(lang, info, tally, isLesson, lesson) {
    var p = readProgress();
    var mins = Math.max(1, Math.round((Date.now() - info.start) / 60000));
    var fresh = Math.max(0, Object.keys(p.cards).length - info.cardsBefore);
    var box = el('div', { 'class': 'card', 'data-summary': '1' }, [
      tally ? el('p', { 'data-field': 'score', text: 'Aciertos: ' + tally.correct + ' de ' + tally.total }) : null,
      info.reviews ? el('p', { 'data-field': 'reviews', text: 'Repasos: ' + info.reviews }) : null,
      el('p', { 'data-field': 'new-cards', text: 'Tarjetas nuevas para tu repaso: ' + fresh }),
      el('p', { 'data-field': 'time', text: 'Tiempo: unos ' + mins + ' min' })]);
    if (isLesson) box.setAttribute('data-lesson-done', '1');
    var next = nextLesson(p, lang);
    if (isLesson) {
      var learned = learnedList(lesson), due = dueTomorrow(p, lang);
      if (learned.length) box.appendChild(el('p', { 'data-field': 'learned', text: 'Lo que aprendiste: ' + learned.join(' · ') }));
      box.appendChild(el('p', { 'data-field': 'tomorrow', text: 'Para mañana: ' + due.shown + (due.shown === 1 ? ' tarjeta' : ' tarjetas') +
        ' de repaso' + (next ? ' y la lección «' + (next.title || next.id) + '»' : '') + '.' +
        (due.waiting ? ' Por el tope diario, ' + (due.waiting === 1 ? 'otra queda' : 'otras ' + due.waiting + ' quedan') +
                       ' para los días siguientes.' : '') }));
    }
    var more = el('div', { 'data-more': '1' }, [el('h2', { text: 'Seguir estudiando' })]);
    if (next) more.appendChild(el('button', { 'data-more-go': 'lesson', text: 'Siguiente lección: ' + (next.title || next.id),
                                              onclick: function () { go('leccion/' + next.id); } }));
    more.appendChild(el('button', { 'data-more-go': 'reviews', text: 'Adelantar repasos',
                                    onclick: function () { go('adelantar/' + lang); } }));
    if (lang === 'en') more.appendChild(el('button', { 'data-more-go': 'ielts', text: 'Práctica IELTS',
                                                       onclick: function () { go('ielts'); } }));
    more.appendChild(el('button', { 'data-more-go': 'course', text: 'Volver al curso',
                                    onclick: function () { go('curso/' + lang); } }));
    return el('div', null, [box, more]);
  }

  function todayCard(p, lang) {
    var name = lang === 'en' ? 'Inglés' : 'Ucraniano';
    var mins = lang === 'en' ? p.settings.minutesEn : p.settings.minutesUk;
    var due = dueCounts(p, lang);
    var next = nextLesson(p, lang);
    var nextText = next
      ? 'Lección que sigue: ' + (next.title || next.id) + ' · unos ' + lessonMinutes(next) + ' min'
      : 'Sin lecciones nuevas por ahora';
    return el('div', { 'class': 'card', 'data-today': lang }, [
      el('h2', { text: name + ' · ' + mins + ' min' }),
      el('p', { 'data-field': 'reviews', text: 'Repasos pendientes: ' + due.reviews }),
      el('p', { 'data-field': 'new', text: 'Tarjetas nuevas: ' + due.fresh }),
      el('p', { 'data-field': 'next', text: nextText }),
      el('button', { 'class': 'primary', 'data-open': lang, text: 'Ir a ' + name.toLowerCase(),
                     onclick: function () { go('curso/' + lang); } })
    ]);
  }

  // --- FSRS (reglas fijas de data-model.md) --------------------------------
  var scheduler = FSRS.fsrs(FSRS.generatorParameters({ request_retention: 0.9, enable_short_term: false }));
  function startOfTomorrow() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  }
  // Ítem fallado: crea la tarjeta ex-<ítem> (vence mañana) o, si ya existía, la califica «Otra vez».
  function failItem(itemId) {
    var p = readProgress(), id = 'ex-' + itemId, c = p.cards[id];
    if (!c) {
      p.cards[id] = { lang: itemId.slice(0, 2), fsrs: FSRS.createEmptyCard(startOfTomorrow()) };
    } else {
      c.fsrs = scheduler.next(c.fsrs, new Date(), FSRS.Rating.Again).card;
    }
    saveProgress(p);
  }

  // --- audio (T012): archivo aprobado → voz del teléfono → aviso ------------
  function voicesFor(lang) {
    var all = [];
    try { all = speechSynthesis.getVoices() || []; } catch (e) { all = []; }
    var base = lang.slice(0, 2).toLowerCase();
    return all.filter(function (v) { return String(v.lang).replace('_', '-').toLowerCase().slice(0, 2) === base; });
  }
  // Voz para un idioma: la elegida en Ajustes, si no la exacta pedida, si no otra del mismo idioma.
  // strict: la voz exacta pedida gana a la de Ajustes (por ejemplo, en «pairs», que alterna acentos).
  function pickVoice(lang, strict) {
    var list = voicesFor(lang);
    if (!list.length) return null;
    var wanted = (readProgress().settings.voices || {})[lang.slice(0, 2)];
    function find(l) {
      return list.filter(function (v) { return String(v.lang).replace('_', '-').toLowerCase() === l.toLowerCase(); })[0];
    }
    return strict ? (find(lang) || (wanted && find(wanted)) || list[0])
                  : ((wanted && find(wanted)) || find(lang) || list[0]);
  }
  // En ucraniano la voz lee solo el texto en cirílico (no las partes en español de una consigna).
  function cyrillicOnly(text) {
    var runs = String(text).match(/[\u0400-\u04FF][\u0400-\u04FF\u0301'’\s,.!?…-]*/g);
    return runs ? runs.map(function (r) { return r.trim(); }).join(' ') : String(text);
  }
  // T041: audios generados de antemano (content/uk/audio.js): texto exacto que suena → archivo.
  function audioFileFor(text, lang) {
    if (readProgress().settings.audioFiles === false) return null;
    var map = ((window.STUDY || {}).audio || {})[lang];
    if (!map) return null;
    return map[String(lang).slice(0, 2) === 'uk' ? cyrillicOnly(text) : String(text)] || null;
  }
  // Un solo reproductor para todos los archivos: en el iPhone, el que arrancó con un toque puede seguir
  // con la línea siguiente del diálogo cambiando de archivo (uno nuevo sin toque puede quedar bloqueado).
  var player = null, playing = null, waiting = [];   // el reproductor, la línea que suena y la fila
  function stopFiles() {
    waiting = [];
    if (playing) { playing = null; try { player.pause(); } catch (e) { /* nada */ } }
  }
  function playNext() {
    var job = waiting.shift();
    if (!job) { playing = null; return; }
    playing = job;
    // Si el archivo no se puede tocar, eso y lo que quedaba en la fila suena con la voz del teléfono.
    function fail() {
      if (playing !== job) return;
      var rest = [job].concat(waiting); waiting = []; playing = null;
      rest.forEach(function (j) { speakVoice(j.text, j.lang, j.strict, true); });
    }
    try { if (!player) player = new Audio(); } catch (e) { fail(); return; }
    player.onended = function () { if (playing === job) playNext(); };
    player.onerror = fail;
    try { player.src = job.file; var pr = player.play(); if (pr && pr.catch) pr.catch(fail); } catch (e) { fail(); }
  }
  // queue: el diálogo encola sus líneas; todo lo demás corta lo que estaba sonando (no se amontonan).
  function speak(text, lang, strict, queue) {
    var file = audioFileFor(text, lang);
    if (!queue) stopFiles();
    if (!file) return speakVoice(text, lang, strict, queue);
    if (!queue) { try { speechSynthesis.cancel(); } catch (e) { /* sin voz */ } }
    waiting.push({ file: file, text: text, lang: lang, strict: strict });
    if (!playing) playNext();
    return true;
  }
  // La voz del teléfono (speechSynthesis).
  function speakVoice(text, lang, strict, queue) {
    var v = pickVoice(lang, strict);
    if (!v) return false;
    if (String(lang).slice(0, 2) === 'uk') text = cyrillicOnly(text);
    try {
      if (!queue) speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = v.lang;
      u.voice = v;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function playFile(file, onFail) {
    try {
      var a = new Audio(file);
      var pr = a.play();
      if (pr && pr.catch) pr.catch(onFail);
    } catch (e) { onFail(); }
  }
  function noVoiceText(lang) {
    return 'Tu teléfono no tiene voz en ' + (lang.slice(0, 2) === 'uk' ? 'ucraniano' : 'inglés');
  }
  // En iPhone las voces pueden llegar después de abrir la página; el oyente se quita al salir de la pantalla.
  function watchVoices(fn) {
    try {
      speechSynthesis.addEventListener('voiceschanged', fn);
      onLeave(function () { speechSynthesis.removeEventListener('voiceschanged', fn); });
    } catch (e) { /* sin evento */ }
  }
  // Botón 🔊: suena el archivo (si existe y está activado) o la voz del sistema; si no hay ninguno, apagado con aviso.
  function audioButton(text, lang, file, label, strict) {
    var useFile = !!file && readProgress().settings.audioFiles !== false;
    var box = el('span', { 'class': 'audio' });
    var btn = el('button', { 'data-play': '1', text: label || '🔊 Escuchar', onclick: function () {
      if (useFile) playFile(file, function () { speak(text, lang, strict); });
      else speak(text, lang, strict);
    } });
    var note = el('span', { 'class': 'muted', 'data-novoice': '1' });
    function refresh() {
      var ok = useFile || !!audioFileFor(text, lang) || !!pickVoice(lang);
      btn.disabled = !ok;
      note.textContent = ok ? '' : noVoiceText(lang);
    }
    refresh();
    watchVoices(refresh);
    box.appendChild(btn);
    box.appendChild(note);
    return box;
  }
  window.__study.audioButton = audioButton;

  // --- actividades calificadas (T010) ---------------------------------------
  function norm(s) {
    return String(s).toLowerCase().replace(/[^\p{L}\p{N}\s%]/gu, '').replace(/\s+/g, ' ').trim();
  }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function isCorrect(type, item, given) {
    var a = item.answer;
    if (type === 'choice' || type === 'pairs') return given === a;
    if (type === 'gap') return (Array.isArray(a) ? a : [a]).some(function (x) { return norm(x) === norm(given || ''); });
    if (type === 'translate') return a.some(function (x) { return norm(x) === norm(given || ''); });
    if (type === 'order') return Array.isArray(given) && given.join('\u0001') === a.join('\u0001');
    if (type === 'match') return !!given && Object.keys(a).every(function (k) { return given[k] === a[k]; });
    return false;
  }

  // Si todavía no hay respuesta, el texto que lo pide; si la hay, ''.
  function emptyAnswerText(type, item, given) {
    if (type === 'gap' || type === 'translate') return String(given || '').trim() ? '' : 'Escribe tu respuesta.';
    if (type === 'order') return Array.isArray(given) && given.length ? '' : 'Toca las palabras para ordenar la frase.';
    if (type === 'match') return given && Object.keys(item.answer).every(function (k) { return given[k]; }) ? '' : 'Completa todas las parejas.';
    return given === null || given === undefined ? 'Elige una respuesta.' : '';
  }
  // Dibuja la parte de responder de un ítem; get() devuelve la respuesta elegida.
  function answerInput(type, item, act) {
    var box = el('div', { 'class': 'answer' }), value = null;
    function choices(options, labels) {
      options.forEach(function (o, i) {
        var b = el('button', { 'data-option': o, text: labels ? labels[i] : o, onclick: function () {
          value = o;
          box.querySelectorAll('[data-option]').forEach(function (x) { x.classList.toggle('selected', x === b); });
        } });
        box.appendChild(b);
      });
    }
    if (type === 'choice') {
      choices(shuffle(item.options));   // orden mezclado en cada vista (también listen y letters)
    } else if (type === 'pairs') {
      var voices = act.voices || ['en-GB'];
      var voice = voices[Math.floor(Math.random() * voices.length)];
      box.appendChild(audioButton(item[item.answer], voice, null, null, true));
      choices(['a', 'b'], [item.a, item.b]);
    } else if (type === 'gap' || type === 'translate') {
      var input = el('input', { type: 'text', 'data-input': '1', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
      box.appendChild(input);
      return { node: box, get: function () { return input.value; } };
    } else if (type === 'order') {
      value = [];
      var built = el('p', { 'class': 'card', 'data-built': '1', text: '…' });
      var pool = el('div');
      function draw() {
        built.textContent = value.length ? value.join(' ') : '…';
        pool.replaceChildren();
        var used = value.slice();
        order.forEach(function (piece) {
          var k = used.indexOf(piece);
          if (k >= 0) { used.splice(k, 1); return; }
          pool.appendChild(el('button', { 'data-piece': piece, text: piece, onclick: function () { value.push(piece); draw(); } }));
        });
      }
      var order = shuffle(item.answer);
      box.appendChild(built);
      box.appendChild(pool);
      box.appendChild(el('button', { 'data-reset': '1', text: 'Borrar', onclick: function () { value = []; draw(); } }));
      draw();
    } else if (type === 'match') {
      value = {};
      var rights = shuffle(Object.keys(item.answer).map(function (k) { return item.answer[k]; }));
      Object.keys(item.answer).forEach(function (left) {
        var sel = el('select', { 'data-left': left });
        sel.appendChild(el('option', { value: '', text: '—' }));
        rights.forEach(function (r) { sel.appendChild(el('option', { value: r, text: r })); });
        sel.addEventListener('change', function () { value[left] = sel.value; });
        box.appendChild(el('label', { 'class': 'match' }, [el('span', { text: left + ' → ' }), sel]));
      });
    }
    return { node: box, get: function () { return value; } };
  }

  function answerText(type, item) {
    var a = item.answer;
    if (type === 'pairs') return item[a];
    if (type === 'order') return a.join(' ');
    if (type === 'match') return Object.keys(a).map(function (k) { return k + ' → ' + a[k]; }).join(' · ');
    if (Array.isArray(a)) return a[0];
    return a;
  }

  // T046: qué suena con 🔊 después de «Comprobar» (la frase correcta), sin dar la respuesta antes.
  // Inglés: la frase completa de choice/gap (con hueco), order y translate. Ucraniano: la palabra en
  // cirílico (2 letras o más) de la consigna o de la respuesta. Nada en pairs ni en las preguntas de listen.
  function sayAfter(type, item, act) {
    if (type === 'pairs' || act.listen) return null;
    var a = item.answer, first = Array.isArray(a) ? a[0] : a;
    if (langOf(act.id) === 'en-GB') {
      if ((type === 'choice' || type === 'gap') && /___/.test(item.prompt || ''))
        return item.prompt.replace('___', first).replace(/\s*\([^)]*\)/g, '');
      if (type === 'order') return a.join(' ');
      if (type === 'translate') return first;
      return null;
    }
    var cyr = /[\u0400-\u04FF][\u0400-\u04FF\u0301]+/;
    var m = String(item.prompt || '').match(cyr) || String(first).match(cyr);
    return m ? m[0] : null;
  }

  var gradedHook = null;   // la lección cuenta aciertos para el resumen (T017)
  // Un ítem calificado: consigna, respuesta, «Comprobar» → correcto/incorrecto + why → onNext.
  function gradedItem(type, item, act, onNext) {
    var wrap = el('div', { 'class': 'item', 'data-item': item.id });
    var prompt = type === 'pairs' ? '¿Cuál sonó?' : item.prompt;
    wrap.appendChild(el('p', { 'class': 'prompt', text: prompt }));
    if (act.listen && langOf(act.id) === 'en-GB') wrap.appendChild(audioButton(prompt, 'en-GB'));   // T046
    var input = answerInput(type, item, act);
    var say = sayAfter(type, item, act);
    wrap.appendChild(input.node);
    var result = el('div', { 'data-result': '1' });
    var check = el('button', { 'class': 'primary', 'data-check': '1', text: 'Comprobar', onclick: function () {
      // Sin respuesta no se califica (un toque sin querer no cuenta como error ni crea tarjeta).
      var empty = emptyAnswerText(type, item, input.get());
      if (empty) {
        result.replaceChildren(el('p', { 'class': 'bad', 'data-empty': '1', text: empty }));
        return;
      }
      var ok = isCorrect(type, item, input.get());
      if (!ok) failItem(item.id);
      if (gradedHook) gradedHook(ok);
      check.disabled = true;
      input.node.querySelectorAll('button, input, select').forEach(function (x) { x.disabled = true; });
      result.replaceChildren.apply(result, [
        el('p', { 'class': ok ? 'ok' : 'bad', 'data-correct': ok ? 'yes' : 'no',
                  text: ok ? '✓ Correcto' : '✗ Incorrecto. Respuesta: ' + answerText(type, item) }),
        el('p', { 'class': 'why', text: item.why }),
        say ? el('div', { 'data-say': say }, [audioButton(say, langOf(act.id))]) : null,
        el('button', { 'class': 'primary', 'data-next': '1', text: 'Siguiente', onclick: onNext })
      ].filter(Boolean));
    } });
    wrap.appendChild(check);
    wrap.appendChild(result);
    return wrap;
  }

  // Actividad calificada completa: sus ítems uno tras otro.
  function gradedActivity(act, onDone) {
    var list = act.type === 'pairs' ? act.pairs : act.items;
    var box = el('div', { 'data-activity': act.id, 'data-type': act.type });
    var i = 0;
    function show() {
      box.replaceChildren(
        el('p', { 'class': 'muted', text: (i + 1) + ' de ' + list.length }),
        gradedItem(act.type, list[i], act, function () { i++; if (i < list.length) show(); else onDone(); })
      );
    }
    show();
    return box;
  }

  // --- pretest (T011): adivinar antes de aprender; no crea tarjeta ni cuenta como error ---
  function imageNode(image) {
    var box = el('div', { 'class': 'pic', 'data-image': '1' });
    if (/^\s*<svg[\s>]/.test(image)) box.innerHTML = image;   // dibujo SVG hecho para la app
    else box.textContent = image;                              // emoji
    return box;
  }
  function pretestActivity(act, onDone) {
    var box = el('div', { 'data-activity': act.id, 'data-type': 'pretest' });
    var i = 0;
    function show() {
      var it = act.items[i];
      var reveal = el('div', { 'data-reveal': '1' });
      var opts = el('div');
      shuffle(it.options).forEach(function (o) {
        opts.appendChild(el('button', { 'data-option': o, text: o, onclick: function () {
          opts.querySelectorAll('button').forEach(function (b) { b.disabled = true; b.classList.toggle('selected', b.getAttribute('data-option') === o); });
          reveal.replaceChildren(
            el('p', { 'data-guess': o === it.answer ? 'right' : 'wrong',
                      text: o === it.answer ? '¡Bien adivinado!' : 'Buen intento. Ahora ya la conoces.' }),
            el('p', { 'class': 'prompt', text: it.word + ' = ' + it.answer }),
            el('button', { 'class': 'primary', 'data-next': '1', text: 'Siguiente', onclick: function () {
              i++; if (i < act.items.length) show(); else onDone();
            } }));
        } }));
      });
      box.replaceChildren(
        el('p', { 'class': 'muted', text: 'Adivina: ¿qué crees que significa? (' + (i + 1) + ' de ' + act.items.length + ')' }),
        imageNode(it.image),
        el('p', { 'class': 'word', 'data-word': '1', text: it.word }),
        audioButton(it.word, langOf(act.id)),   // T046: oír la palabra no dice qué significa
        opts, reveal);
    }
    show();
    return box;
  }

  // --- actividades sin nota (T016) ------------------------------------------
  // Lo que queda corriendo (cronómetros, micrófono, grabaciones) se apaga al pasar de actividad o de pantalla.
  var cleanups = [];
  function onLeave(fn) { cleanups.push(fn); }
  function runCleanups() {
    stopFiles();   // el audio o la voz que sonaba (por ejemplo, el diálogo) no sigue en la otra pantalla
    try { speechSynthesis.cancel(); } catch (e) { /* sin voz */ }
    var list = cleanups; cleanups = [];
    list.forEach(function (fn) { try { fn(); } catch (e) { /* nada que hacer */ } });
  }
  function langOf(id) { return id.slice(0, 2) === 'uk' ? 'uk-UA' : 'en-GB'; }
  function nextButton(onDone, label) {
    return el('button', { 'class': 'primary', 'data-next': '1', text: label || 'Siguiente', onclick: onDone });
  }
  function paragraphs(text) {
    return String(text).split(/\n+/).map(function (t) { return el('p', { text: t }); });
  }
  function mmss(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function wordCount(text) {
    var m = String(text).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
    return m ? m.length : 0;
  }

  // Cuenta atrás que se ve en pantalla; usa la hora real (no se atrasa si el teléfono frena los cronómetros).
  function countdown(seconds, display, onEnd) {
    var end = Date.now() + seconds * 1000, h = null, done = false;
    function stop() { if (h) clearInterval(h); h = null; }
    function tick() {
      var left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      display.textContent = mmss(left);
      display.setAttribute('data-left', String(left));
      if (left <= 0 && !done) { done = true; stop(); if (onEnd) onEnd(); }
    }
    h = setInterval(tick, 250);
    tick();
    onLeave(stop);
    return { stop: stop };
  }
  // Cronómetro hacia arriba (relectura cronometrada).
  function stopwatch(display) {
    var start = Date.now(), h = null;
    function secs() { return Math.floor((Date.now() - start) / 1000); }
    function tick() { display.textContent = mmss(secs()); display.setAttribute('data-elapsed', String(secs())); }
    h = setInterval(tick, 250);
    tick();
    function stop() { if (h) clearInterval(h); h = null; tick(); return secs(); }
    onLeave(function () { if (h) clearInterval(h); });
    return { stop: stop };
  }

  // Grabación: solo en la memoria mientras dura la actividad; nunca se guarda ni sale del teléfono.
  var NO_MIC = 'No se puede usar el micrófono (no hay o no diste permiso). No se grabará, pero puedes seguir.';
  function recorder(onReady) {
    var rec = null, stream = null, chunks = [], url = null, wanted = false;
    function release() { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    function start() {
      wanted = true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return Promise.resolve(false);
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s;
        if (!wanted) { release(); return false; }     // se paró antes de que llegara el permiso
        chunks = [];
        rec = new MediaRecorder(s);
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          if (url) URL.revokeObjectURL(url);
          url = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/mp4' })) : null;
          release();
          if (url && onReady) onReady(url);
        };
        rec.start();
        return true;
      }).catch(function () { release(); return false; });
    }
    function stop() {
      wanted = false;
      if (rec && rec.state !== 'inactive') rec.stop(); else release();
    }
    onLeave(function () { stop(); if (url) URL.revokeObjectURL(url); url = null; });
    return { start: start, stop: stop };
  }
  function playRecordingButton(url, label) {
    return el('button', { 'data-playrec': '1', text: label || '▶ Escuchar mi grabación', onclick: function () {
      try { var a = new Audio(url); var pr = a.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) { /* sin audio */ }
    } });
  }

  // «Copiar para Claude»: portapapeles; si el navegador no deja, se selecciona el texto para copiarlo a mano.
  function copyButton(getText, label) {
    var note = el('p', { 'class': 'muted', 'data-copied': '' });
    var btn = el('button', { 'data-copy': '1', text: label || '📋 Copiar para Claude', onclick: function () {
      var text = getText();
      function manual() {
        var ta = el('textarea', { 'data-copytext': '1', rows: '6', readonly: 'readonly' });
        ta.value = text;
        note.replaceChildren(el('span', { text: 'No se pudo copiar solo. Mantén presionado el texto y elige Copiar:' }), ta);
        ta.focus(); ta.select();
      }
      try {
        navigator.clipboard.writeText(text).then(function () {
          note.setAttribute('data-copied', 'yes');
          note.textContent = 'Copiado. Pégalo en el chat de claude.ai.';
        }, manual);
      } catch (e) { manual(); }
    } });
    return el('div', null, [btn, note]);
  }
  function askClaude(kind, prompt, text, id) {
    var who = id && id.slice(0, 2) === 'uk'
      ? 'Estudio ucraniano desde cero (nivel A1; mi lengua es el español). '
      : 'Estudio inglés (nivel B1, con meta en el IELTS General Training). ';
    return who +
      'Corrige mi ' + kind + ': señala cada error, explícalo en español y dame una versión mejorada.\n\n' +
      'Consigna:\n' + prompt + '\n\nMi ' + kind + ' (' + wordCount(text) + ' palabras):\n' + text;
  }

  // read: texto con glosario; tocar una palabra del glosario muestra su glosa.
  function readActivity(act, onDone) {
    var gloss = el('p', { 'class': 'card', 'data-gloss': '', text: 'Toca una palabra subrayada para ver qué significa.' });
    var keys = {};
    Object.keys(act.glossary || {}).forEach(function (k) { keys[k.toLowerCase()] = k; });
    var text = el('div', { 'class': 'reading' });
    String(act.text).split(/\n+/).forEach(function (par) {
      var p = el('p');
      par.split(/([\p{L}'’]+)/u).forEach(function (part) {
        var k = keys[part.toLowerCase()];
        if (!k) { if (part) p.appendChild(document.createTextNode(part)); return; }
        p.appendChild(el('span', { 'class': 'glossed', 'data-word': k, role: 'button', tabindex: '0', text: part, onclick: function () {
          gloss.setAttribute('data-gloss', k);
          gloss.textContent = part + ': ' + act.glossary[k];
        } }));
      });
      text.appendChild(p);
    });
    return el('div', { 'data-activity': act.id, 'data-type': 'read' }, [
      act.title ? el('h2', { text: act.title }) : null,
      audioButton(act.text, langOf(act.id), act.audio, '🔊 Escuchar el texto'),
      gloss, text, nextButton(onDone)]);
  }

  // listen: el diálogo con sus voces, transcripción oculta y preguntas calificadas como en T010.
  function listenActivity(act, onDone) {
    var lang = langOf(act.id);
    var names = {};
    act.lines.forEach(function (l) { if (!names[l.voice]) names[l.voice] = String.fromCharCode(65 + Object.keys(names).length); });
    // Con una sola voz (por ejemplo, ucraniano), las líneas se marcan A y B alternando.
    var oneVoice = Object.keys(names).length === 1 && act.lines.length > 1;
    function who(l, i) { return oneVoice ? (i % 2 ? 'B' : 'A') : names[l.voice]; }
    var hasEs = act.lines.some(function (l) { return l.es; });
    var play = el('button', { 'data-play': 'dialog', text: '🔊 Escuchar el diálogo', onclick: function () {
      stopFiles();
      try { speechSynthesis.cancel(); } catch (e) { /* sin voz */ }
      act.lines.forEach(function (l) { speak(l.text, l.voice, true, true); });
    } });
    var note = el('span', { 'class': 'muted', 'data-novoice': '1' });
    function refresh() {
      var ok = !!pickVoice(lang) || act.lines.every(function (l) { return audioFileFor(l.text, l.voice); });
      play.disabled = !ok; note.textContent = ok ? '' : noVoiceText(lang); }
    refresh();
    watchVoices(refresh);
    var script = el('div', { 'class': 'card', 'data-transcript': '1', hidden: 'hidden' },
      (hasEs ? [el('p', { 'class': 'muted', text: 'Toca una línea para ver su traducción.' })] : []).concat(
      act.lines.map(function (l, i) {
        if (!l.es) return el('p', { text: who(l, i) + ': ' + l.text });
        var tr = el('span', { 'class': 'muted', 'data-es': String(i), hidden: 'hidden', text: ' → ' + l.es });
        return el('p', { 'class': 'glossed-line', 'data-line': String(i), role: 'button', tabindex: '0', onclick: function () {
          tr.hidden = !tr.hidden;
        } }, [document.createTextNode(who(l, i) + ': ' + l.text), tr]);
      })));
    var toggle = el('button', { 'data-toggle': 'transcript', text: 'Mostrar la transcripción', onclick: function () {
      script.hidden = !script.hidden;
      toggle.textContent = script.hidden ? 'Mostrar la transcripción' : 'Ocultar la transcripción';
    } });
    var questions = gradedActivity({ id: act.id + '-q', type: 'choice', listen: true,
      items: act.questions.map(function (q) { return Object.assign({}, q, { prompt: q.q }); }) }, onDone);
    return el('div', { 'data-activity': act.id, 'data-type': 'listen' }, [
      el('p', { 'class': 'muted', text: 'Escucha primero, sin leer. Después responde.' }),
      el('span', { 'class': 'audio' }, [play, note]), toggle, script, questions]);
  }

  // chunks: muestra las expresiones y las agrega al repaso (vencen al inicio de mañana).
  function addUnitCards(ids) {
    var p = readProgress(), added = 0;
    ids.forEach(function (cid) {
      var c = findUnitCard(cid);
      if (!c || p.cards[cid]) return;
      p.cards[cid] = { lang: c.lang, fsrs: FSRS.createEmptyCard(startOfTomorrow()) };
      added++;
    });
    if (added) saveProgress(p);
  }
  function chunksActivity(act, onDone) {
    addUnitCards(act.cards);
    var list = act.cards.map(findUnitCard).filter(Boolean).map(function (c) {
      return el('div', { 'class': 'card', 'data-chunk': c.id }, [
        el('p', { 'class': 'prompt', text: c.front }),
        el('p', { text: c.back }),
        c.example ? el('p', { 'class': 'muted', text: c.example }) : null,
        audioButton(c.example || c.front, c.lang, c.audio)]);
    });
    return el('div', { 'data-activity': act.id, 'data-type': 'chunks' }, [
      el('p', { 'class': 'muted', text: 'Estas expresiones ya quedaron en tu repaso: vuelven desde mañana.' })
    ].concat(list, [nextButton(onDone)]));
  }

  // grammar: explicación en español y ejemplos (🔊 sin la nota entre paréntesis).
  function grammarActivity(act, onDone) {
    var lang = langOf(act.id);
    return el('div', { 'data-activity': act.id, 'data-type': 'grammar' }, [
      act.title ? el('h2', { text: act.title }) : null
    ].concat(paragraphs(act.explanation), act.examples.map(function (x) {
      return el('div', { 'class': 'card' }, [el('p', { text: x }),
        audioButton(x.replace(/\s*\([^)]*\)\s*$/, ''), lang)]);
    }), [nextButton(onDone)]));
  }

  // write y task: caja de texto, contador de palabras, aviso de mínimo y «Copiar para Claude».
  function writingBox(prompt, minWords) {
    var ta = el('textarea', { 'data-write': '1', rows: '8', autocapitalize: 'sentences' });
    var count = el('p', { 'data-words': '0' });
    var warn = el('p', { 'class': 'bad', 'data-minwarn': '' });
    function upd() {
      var n = wordCount(ta.value);
      count.setAttribute('data-words', String(n));
      count.textContent = n + (n === 1 ? ' palabra' : ' palabras') + (minWords ? ' (mínimo ' + minWords + ')' : '');
      var short = minWords && n < minWords;
      warn.setAttribute('data-minwarn', short ? 'yes' : '');
      warn.textContent = short ? 'Te faltan ' + (minWords - n) + ' palabras para el mínimo.' : '';
    }
    ta.addEventListener('input', upd);
    upd();
    return { nodes: [ta, count, warn], text: function () { return ta.value; } };
  }
  function writeActivity(act, onDone) {
    var lang = langOf(act.id);
    var box = writingBox(act.prompt, act.minWords);
    var kind = act.type === 'task' ? 'texto' : 'párrafo';
    return el('div', { 'data-activity': act.id, 'data-type': act.type }, [
      el('div', { 'class': 'card' }, paragraphs(act.prompt).concat([audioButton(act.prompt, lang)]))
    ].concat(box.nodes, [
      copyButton(function () { return askClaude(kind, act.prompt, box.text(), act.id); }),
      el('p', { 'class': 'muted', text: 'Lo que escribes no se guarda: cópialo para Claude antes de seguir.' }),
      nextButton(onDone)]));
  }

  // speak: consigna → preparación (prepSeconds) → habla con grabación hasta speakSeconds → escuchar → texto dictado → Claude.
  function speakActivity(act, onDone) {
    var lang = langOf(act.id);
    var stage = el('div', { 'data-stage': 'idle' });
    var after = el('div');
    var clock = el('p', { 'class': 'timer', 'data-timer': '1' });
    var rec = recorder(function (url) { after.insertBefore(playRecordingButton(url), after.firstChild); });
    var dict = el('textarea', { 'data-dictation': '1', rows: '6',
      placeholder: 'Pega o dicta aquí lo que dijiste (con el micrófono del teclado del iPhone).' });
    function finish() {
      stage.setAttribute('data-stage', 'done');
      stage.replaceChildren(el('p', { 'data-spoke': '1', text: 'Tiempo terminado.' }));
      after.replaceChildren(dict, copyButton(function () {
        return askClaude('respuesta oral (la escribí con el dictado del teléfono)', act.prompt, dict.value, act.id);
      }));
      rec.stop();   // después de armar «after», para que el botón de escuchar quede arriba
    }
    function speakNow() {
      stage.setAttribute('data-stage', 'speak');
      var mic = el('p', { 'data-mic': 'wait', 'class': 'muted', text: 'Abriendo el micrófono…' });
      var t = countdown(act.speakSeconds, clock, finish);
      stage.replaceChildren(el('p', { 'class': 'prompt', text: 'Habla ahora' }), clock, mic,
        el('button', { 'data-stop': '1', text: 'Terminar', onclick: function () { t.stop(); finish(); } }));
      rec.start().then(function (ok) {
        mic.setAttribute('data-mic', ok ? 'on' : 'off');
        mic.className = ok ? 'muted' : 'bad';
        mic.textContent = ok ? '🎙️ Grabando (solo en este teléfono)' : NO_MIC;
      });
    }
    function prep() {
      stage.setAttribute('data-stage', 'prep');
      var t = countdown(act.prepSeconds, clock, speakNow);
      stage.replaceChildren(el('p', { 'class': 'prompt', text: 'Prepárate (puedes tomar notas)' }), clock,
        el('button', { 'data-skip': '1', text: 'Ya estoy listo', onclick: function () { t.stop(); speakNow(); } }));
    }
    var startLabel = act.prepSeconds > 0
      ? 'Empezar: ' + act.prepSeconds + ' s para prepararte y ' + mmss(act.speakSeconds) + ' min para hablar'
      : 'Empezar a hablar (' + mmss(act.speakSeconds) + ' min)';
    stage.appendChild(el('button', { 'class': 'primary', 'data-start': '1', text: startLabel,
      onclick: function () { if (act.prepSeconds > 0) prep(); else speakNow(); } }));
    return el('div', { 'data-activity': act.id, 'data-type': 'speak' }, [
      el('div', { 'class': 'card' }, paragraphs(act.prompt).concat([audioButton(act.prompt, lang)])),
      stage, after, nextButton(onDone)]);
  }

  // shadow: escuchar la frase, repetirla grabando y comparar.
  function shadowActivity(act, onDone) {
    var active = null;   // la frase que se está grabando (solo una a la vez)
    var rows = act.lines.map(function (l, i) {
      var mine = el('span');
      var status = el('p', { 'class': 'muted' });
      var rec = recorder(function (url) { mine.replaceChildren(playRecordingButton(url)); });
      var recording = false;
      function halt() { recording = false; rec.stop(); btn.textContent = '🎙️ Repetir grabando'; status.textContent = ''; }
      var btn = el('button', { 'data-record': String(i + 1), text: '🎙️ Repetir grabando', onclick: function () {
        if (recording) { halt(); active = null; return; }
        if (active) active();
        active = halt;
        recording = true; btn.textContent = '⏹ Parar';
        rec.start().then(function (ok) {
          if (!recording) return;   // se paró antes de que llegara el permiso
          if (ok) { status.className = 'muted'; status.textContent = 'Grabando…'; return; }
          if (active === halt) active = null;
          recording = false; btn.textContent = '🎙️ Repetir grabando';
          status.className = 'bad'; status.setAttribute('data-nomic', '1'); status.textContent = NO_MIC;
        });
      } });
      return el('div', { 'class': 'card', 'data-line': String(i + 1) }, [
        el('p', { 'class': 'prompt', text: l.text }),
        audioButton(l.text, l.voice, l.audio, null, true), btn, status, mine]);
    });
    return el('div', { 'data-activity': act.id, 'data-type': 'shadow' }, [
      el('p', { 'class': 'muted', text: 'Escucha la frase y repítela al mismo ritmo y con la misma entonación. Luego compara.' })
    ].concat(rows, [nextButton(onDone)]));
  }

  // fluency: «432» (la misma charla en 4, 3 y 2 min, con grabación), «reread» (relectura cronometrada) o «write10».
  function fluencyActivity(act, onDone) {
    var lang = langOf(act.id);
    var box = el('div', { 'data-activity': act.id, 'data-type': 'fluency', 'data-mode': act.mode });
    var head = el('div', { 'class': 'card' }, paragraphs(act.prompt || act.text)
      .concat([audioButton(act.prompt || act.text, lang)]));
    var stage = el('div');
    var clock = el('p', { 'class': 'timer', 'data-timer': '1' });
    box.appendChild(head);
    box.appendChild(stage);

    if (act.mode === '432') {
      var rounds = [240, 180, 120], r = 0, recs = el('div');
      var startRound = function () {
        var secs = rounds[r], n = r + 1;
        var mic = el('p', { 'class': 'muted', 'data-mic': 'wait', text: 'Abriendo el micrófono…' });
        var rec = recorder(function (url) { recs.appendChild(playRecordingButton(url, '▶ Escuchar la ronda ' + n)); });
        var end = function () {
          rec.stop(); r++;
          if (r < rounds.length) idle();
          else stage.replaceChildren(el('p', { 'data-rounds-done': '1', text: '¡Listo! Contaste la misma historia en 4, 3 y 2 minutos.' }), recs);
        };
        var t = countdown(secs, clock, end);
        stage.setAttribute('data-round', String(n));
        stage.replaceChildren(el('p', { 'class': 'prompt', text: 'Ronda ' + n + ': ' + (secs / 60) + ' min' }), clock, mic,
          el('button', { 'data-stop': '1', text: 'Terminar la ronda', onclick: function () { t.stop(); end(); } }), recs);
        rec.start().then(function (ok) {
          mic.setAttribute('data-mic', ok ? 'on' : 'off');
          mic.className = ok ? 'muted' : 'bad';
          mic.textContent = ok ? '🎙️ Grabando (solo en este teléfono)' : NO_MIC;
        });
      };
      var idle = function () {
        stage.setAttribute('data-round', '0');
        stage.replaceChildren(el('button', { 'class': 'primary', 'data-start': '1',
          text: 'Empezar la ronda ' + (r + 1) + ' (' + (rounds[r] / 60) + ' min)', onclick: startRound }), recs);
      };
      idle();
    } else if (act.mode === 'reread') {
      var times = [], k = 0, list = el('div');
      var idleRead = function () {
        stage.replaceChildren(el('button', { 'class': 'primary', 'data-start': '1',
          text: 'Empezar la lectura ' + (k + 1) + ' de 2', onclick: function () {
            var sw = stopwatch(clock);
            stage.replaceChildren(clock, el('button', { 'data-stop': '1', text: 'Terminé', onclick: function () {
              times.push(sw.stop()); k++;
              list.appendChild(el('p', { 'data-time': String(k), text: 'Lectura ' + k + ': ' + mmss(times[k - 1]) }));
              if (k < 2) idleRead(); else stage.replaceChildren(list);
            } }));
          } }), list);
      };
      idleRead();
    } else {   // write10: escritura libre de 10 min
      var wb = writingBox(act.prompt, 0);
      stage.appendChild(el('button', { 'class': 'primary', 'data-start': '1', text: 'Empezar (10 min)', onclick: function () {
        stage.replaceChildren.apply(stage, [clock].concat(wb.nodes, [
          copyButton(function () { return askClaude('texto', act.prompt || act.text, wb.text(), act.id); })]));
        wb.nodes[0].focus();
        countdown(600, clock, function () { wb.nodes[0].readOnly = true; });
      } }));
    }
    box.appendChild(nextButton(onDone));
    return box;
  }

  // --- práctica de Reading (T021) ---------------------------------------------
  // Instrucciones con el formato del examen (en inglés, como en el examen real).
  var READING_HOW = {
    tfng: 'Do the following statements agree with the information given in the text? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
    complete: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the text for each answer.',
    choice: 'Choose the correct answer.'
  };
  function readingPractice(pr) {
    var s = screen('practica', pr.title || pr.id);
    var holder = el('div');
    s.appendChild(holder);
    holder.appendChild(el('p', { 'class': 'muted', text: pr.minutes + ' min · ' + pr.questions.length + ' preguntas' +
      (pr.kind === 'short' ? ' · práctica corta: verás tus aciertos y la explicación de cada error, sin banda.' : '') }));
    holder.appendChild(el('p', { 'class': 'muted', text: 'El cronómetro cierra la práctica al llegar a 0. Si sales antes, no se guarda.' }));
    holder.appendChild(el('button', { 'class': 'primary', 'data-start': '1', text: 'Empezar (' + pr.minutes + ' min)', onclick: start }));

    function start() {
      var began = Date.now(), done = false, inputs = {};
      var clock = el('p', { 'class': 'timer sticky', 'data-timer': '1' });
      var nodes = [clock];
      pr.passages.forEach(function (ps) {
        nodes.push(el('div', { 'class': 'card', 'data-passage': ps.id }, [
          el('h2', { text: 'Text ' + ps.id + ' · ' + ps.title })].concat(paragraphs(ps.text))));
      });
      // Preguntas en grupos seguidos del mismo tipo y texto, cada grupo con sus instrucciones.
      var groups = [];
      pr.questions.forEach(function (q, i) {
        var g = groups[groups.length - 1];
        if (!g || g.type !== q.type || g.passage !== q.passage) groups.push(g = { type: q.type, passage: q.passage, list: [] });
        g.list.push({ q: q, n: i + 1 });
      });
      groups.forEach(function (g) {
        var a = g.list[0].n, b = g.list[g.list.length - 1].n;
        var box = el('div', { 'class': 'card', 'data-group': g.type }, [
          el('h2', { text: 'Questions ' + a + (b > a ? '–' + b : '') + (g.passage ? ' · Text ' + g.passage : '') }),
          el('p', { 'class': 'muted', text: READING_HOW[g.type] })]);
        g.list.forEach(function (x) {
          var q = x.q, row = el('div', { 'class': 'item', 'data-q': q.id }, [el('p', { 'class': 'prompt', text: x.n + '. ' + q.q })]);
          if (q.type === 'complete') {
            var inp = el('input', { type: 'text', 'data-answer': q.id, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
            inputs[q.id] = function () { return inp.value; };
            row.appendChild(inp);
          } else {
            var val = null;
            inputs[q.id] = function () { return val; };
            (q.options || []).forEach(function (o) {
              var btn = el('button', { 'data-option': o, text: o, onclick: function () {
                val = o;
                row.querySelectorAll('[data-option]').forEach(function (x2) { x2.classList.toggle('selected', x2 === btn); });
              } });
              row.appendChild(btn);
            });
          }
          box.appendChild(row);
        });
        nodes.push(box);
      });
      nodes.push(el('button', { 'class': 'primary', 'data-finish': '1', text: 'Terminar y ver el resultado', onclick: function () { t.stop(); finish(false); } }));
      holder.replaceChildren.apply(holder, nodes);
      var t = countdown(pr.minutes * 60, clock, function () { finish(true); });

      function finish(timeUp) {
        if (done) return;
        done = true;
        var seconds = Math.min(pr.minutes * 60, Math.round((Date.now() - began) / 1000));
        var wrong = [];
        pr.questions.forEach(function (q, i) {
          var given = inputs[q.id]();
          var ok = q.type === 'complete' ? isCorrect('gap', q, given) : given === q.answer;
          if (!ok) wrong.push({ q: q, n: i + 1, given: given });
        });
        var correct = pr.questions.length - wrong.length;
        var p = readProgress();
        p.ielts.push({ id: pr.id, part: pr.part, kind: pr.kind, date: new Date().toISOString(), seconds: seconds,
                       correct: correct, total: pr.questions.length });
        saveProgress(p);
        var res = [
          timeUp ? el('p', { 'class': 'bad', 'data-timeup': '1', text: 'Se acabó el tiempo.' }) : null,
          el('div', { 'class': 'card', 'data-reading-result': '1' }, [
            el('h2', { 'data-score': correct + '/' + pr.questions.length, text: 'Aciertos: ' + correct + ' de ' + pr.questions.length }),
            el('p', { 'class': 'muted', text: 'Tiempo usado: ' + mmss(seconds) + ' de ' + pr.minutes + ':00' })])];
        if (wrong.length) res.push(el('h2', { text: 'Tus errores' }));
        wrong.forEach(function (w) {
          var right = Array.isArray(w.q.answer) ? w.q.answer[0] : w.q.answer;
          res.push(el('div', { 'class': 'card', 'data-wrong': w.q.id }, [
            el('p', { 'class': 'prompt', text: w.n + '. ' + w.q.q }),
            el('p', { 'class': 'bad', text: 'Tu respuesta: ' + (w.given && String(w.given).trim() ? w.given : '(en blanco)') }),
            el('p', { 'class': 'ok', text: 'Correcta: ' + right }),
            el('p', { 'class': 'why', text: w.q.why })]));
        });
        if (!wrong.length) res.push(el('p', { 'class': 'ok', text: '¡Todas correctas!' }));
        res.push(el('button', { 'class': 'primary', 'data-go': 'ielts', text: 'Volver a Práctica IELTS', onclick: function () { go('ielts'); } }));
        holder.replaceChildren.apply(holder, res.filter(Boolean));
        window.scrollTo(0, 0);
      }
    }
    return s;
  }

  // --- Writing Task 1 (T022) ------------------------------------------------------
  var BAND_NOTE = 'aproximada, no oficial';
  function taskText(t) {
    return t.prompt + '\n' + t.bullets.map(function (b) { return '• ' + b; }).join('\n') +
      '\n\nWrite at least ' + t.minWords + ' words.\nYou do NOT need to write any addresses at the top of your letter.' +
      (t.begin ? '\n\nBegin your letter as follows:\n' + t.begin : '');
  }
  function claudeWriting(t, text, seconds) {
    return 'Preparo el IELTS General Training (meta: banda 7 en cada parte). Corrige mi Writing Task ' + t.n +
      ' como lo haría un examinador, con los 4 criterios de banda: Task Achievement, Coherence and Cohesion, ' +
      'Lexical Resource y Grammatical Range and Accuracy. Para cada criterio dame una banda (aproximada, no oficial) y por qué; ' +
      'luego la banda total (aproximada, no oficial). Señala cada error con su corrección, explicada en español, y dame una versión mejorada.\n\n' +
      'Consigna:\n' + taskText(t) + '\n\nMi carta (' + wordCount(text) + ' palabras, escrita en ' + mmss(seconds) + ' min):\n' + text;
  }
  function writingPractice(pr) {
    var t = pr.tasks[0];
    var s = screen('practica', pr.title || pr.id);
    var holder = el('div');
    s.appendChild(holder);
    holder.appendChild(el('p', { 'class': 'muted', text: t.minutes + ' min · mínimo ' + t.minWords +
      ' palabras. El cronómetro cierra la escritura al llegar a 0. Si sales o se cierra la app, tu carta queda ' +
      'guardada como borrador en este teléfono, y el cronómetro sigue corriendo, como en el examen.' }));
    // T039 (R3, aprobado por el dueño): borrador en drafts del progreso, para no perder la carta si el iPhone recarga la app.
    var draft = (readProgress().drafts || {})[pr.id];
    if (draft && typeof draft.text === 'string' && isFinite(new Date(draft.began).getTime())) {
      holder.appendChild(el('div', { 'class': 'card', 'data-draft': '1' }, [
        el('p', { text: 'Tienes una carta sin terminar (' + wordCount(draft.text) + ' palabras).' }),
        el('button', { 'class': 'primary', 'data-draft-resume': '1', text: 'Seguir la carta', onclick: function () { start(draft); } }),
        el('button', { 'data-draft-new': '1', text: 'Empezar de nuevo (borra el borrador)', onclick: function () {
          var p = readProgress(); if (p.drafts) delete p.drafts[pr.id]; saveProgress(p); start(null);
        } })]));
    } else {
      holder.appendChild(el('button', { 'class': 'primary', 'data-start': '1', text: 'Empezar (' + t.minutes + ' min)',
                                        onclick: function () { start(null); } }));
    }

    function start(resume) {
      var began = resume ? new Date(resume.began).getTime() : Date.now(), done = false;
      var clock = el('p', { 'class': 'timer sticky', 'data-timer': '1' });
      var box = writingBox(t.prompt, t.minWords);
      var ta = box.nodes[0];
      var task = el('div', { 'class': 'card', 'data-task': String(t.n) }, [
        el('p', { 'class': 'muted', text: 'You should spend about ' + t.minutes + ' minutes on this task.' })]
        .concat(paragraphs(taskText(t))));
      var finishBtn = el('button', { 'class': 'primary', 'data-finish': '1', text: 'Terminar', onclick: function () { timer.stop(); finish(false); } });
      holder.replaceChildren.apply(holder, [clock, task].concat(box.nodes, [finishBtn]));
      if (resume) { ta.value = resume.text; ta.dispatchEvent(new Event('input')); }
      // Borrador: se guarda un momento después de escribir, y siempre al salir de la pantalla o al ocultar la app.
      var pending = null;
      function saveDraft() {
        if (pending) { clearTimeout(pending); pending = null; }
        if (done) return;
        var p = readProgress();
        p.drafts = p.drafts || {};
        p.drafts[pr.id] = { text: ta.value, began: new Date(began).toISOString() };
        saveProgress(p);
      }
      function onHide() { if (document.visibilityState === 'hidden') saveDraft(); }
      ta.addEventListener('input', function () { if (pending) clearTimeout(pending); pending = setTimeout(saveDraft, 800); });
      document.addEventListener('visibilitychange', onHide);
      window.addEventListener('pagehide', saveDraft);
      onLeave(function () { saveDraft(); document.removeEventListener('visibilitychange', onHide);
                            window.removeEventListener('pagehide', saveDraft); });
      saveDraft();
      var left = Math.max(0, t.minutes * 60 - Math.floor((Date.now() - began) / 1000));
      var timer = countdown(left, clock, function () { finish(true); });

      function finish(timeUp) {
        if (done) return;
        done = true;
        ta.readOnly = true;
        finishBtn.remove();
        clock.remove();
        var seconds = Math.min(t.minutes * 60, Math.round((Date.now() - began) / 1000));
        var date = new Date().toISOString();
        if (pending) { clearTimeout(pending); pending = null; }
        var p = readProgress();
        p.ielts.push({ id: pr.id, part: 'writing', date: date, seconds: seconds, words: wordCount(ta.value), text: ta.value });
        if (p.drafts) delete p.drafts[pr.id];
        saveProgress(p);
        var bandIn = el('input', { type: 'number', 'data-selfband': '1', min: '0', max: '9', step: '0.5', inputmode: 'decimal' });
        var bandMsg = el('p', { 'data-band-saved': '' });
        holder.appendChild(el('div', { 'data-writing-done': '1' }, [
          timeUp ? el('p', { 'class': 'bad', 'data-timeup': '1', text: 'Se acabó el tiempo.' }) : null,
          el('p', { 'class': 'ok', text: 'Tu carta quedó guardada en este teléfono (' + wordCount(ta.value) + ' palabras, ' + mmss(seconds) + ' min).' }),
          el('h2', { text: 'Corrígela con Claude' }),
          copyButton(function () { return claudeWriting(t, ta.value, seconds); }),
          el('h2', { text: 'Banda que te dio Claude' }),
          el('p', { 'class': 'muted', 'data-band-note': '1', text: 'La banda es ' + BAND_NOTE + ': la da Claude con los criterios públicos, no un examinador.' }),
          bandIn,
          el('button', { 'data-save-band': '1', text: 'Guardar banda', onclick: function () {
            var v = Number(String(bandIn.value).replace(',', '.'));
            if (bandIn.value === '' || !(v >= 0 && v <= 9) || Math.round(v * 2) !== v * 2) {
              bandMsg.className = 'bad'; bandMsg.textContent = 'Escribe una banda entre 0 y 9, en pasos de 0,5 (por ejemplo, 6.5).';
              return;
            }
            var q = readProgress();
            var rec = q.ielts.filter(function (r) { return r.id === pr.id && r.date === date; })[0];
            if (rec) { rec.selfBand = v; saveProgress(q); }
            bandMsg.className = 'ok'; bandMsg.setAttribute('data-band-saved', String(v));
            bandMsg.textContent = 'Guardada: banda ' + v + ' (' + BAND_NOTE + ').';
          } }),
          bandMsg,
          el('button', { 'data-go': 'ielts', text: 'Volver a Práctica IELTS', onclick: function () { go('ielts'); } })]));
      }
    }
    return s;
  }

  // letters (ucraniano): cuadrícula de letras; tocar una suena y muestra su palabra; luego el quiz calificado (T010).
  function lettersActivity(act, onDone) {
    var lang = langOf(act.id);
    var detail = el('div', { 'class': 'card', 'data-letter-detail': '' }, [el('p', { 'class': 'muted', text: 'Toca una letra para oírla y ver su palabra.' })]);
    var grid = el('div', { 'class': 'letters' });
    act.letters.forEach(function (l) {
      grid.appendChild(el('button', { 'data-letter': l.letter, text: l.letter, onclick: function () {
        detail.setAttribute('data-letter-detail', l.letter);
        detail.replaceChildren.apply(detail, [
          el('p', { 'class': 'word', text: l.letter + ' ' + l.letter.toLowerCase() }),
          el('p', { text: 'Suena ' + l.soundEs + '.' }),
          l.image ? el('p', { 'class': 'pic', text: l.image }) : null,
          el('p', { 'class': 'prompt', 'data-letter-word': l.letter, text: l.word + ' = ' + l.wordEs }),
          audioButton(l.word, lang, l.audio),
          l.keyword ? el('p', { 'class': 'why', 'data-keyword': l.letter, text: '💡 ' + l.keyword }) : null].filter(Boolean));
        speak(l.word, lang);
      } }));
    });
    var box = el('div', { 'data-activity': act.id, 'data-type': 'letters' });
    box.replaceChildren(grid, detail, el('button', { 'class': 'primary', 'data-quiz': '1', text: 'Ahora, a reconocer', onclick: function () {
      box.replaceChildren(el('h2', { text: 'Reconocer' }),
        gradedActivity({ id: act.id + '-quiz', type: 'choice', items: act.quiz }, onDone));
    } }));
    return box;
  }

  var UNGRADED = { letters: lettersActivity, read: readActivity, listen: listenActivity, chunks: chunksActivity, grammar: grammarActivity,
                   write: writeActivity, task: writeActivity, speak: speakActivity, shadow: shadowActivity,
                   fluency: fluencyActivity };

  function findLesson(id) {
    var units = window.STUDY.units;
    for (var k in units) {
      var ls = units[k].lessons || [];
      for (var i = 0; i < ls.length; i++) if (ls[i].id === id) return ls[i];
    }
    return null;
  }

  // --- repaso con FSRS (T013) -----------------------------------------------
  // Busca un ítem por su id en el contenido (lecciones y prácticas de IELTS).
  function findItem(itemId) {
    var units = window.STUDY.units, found = null;
    Object.keys(units).forEach(function (k) {
      (units[k].lessons || []).forEach(function (l) {
        (l.activities || []).forEach(function (a) {
          ['items', 'questions', 'pairs', 'quiz'].forEach(function (f) {
            (a[f] || []).forEach(function (it) { if (it.id === itemId) found = { act: a, item: it, list: f }; });
          });
        });
      });
    });
    var ielts = window.STUDY.ielts || {};
    Object.keys(ielts).forEach(function (k) {
      (ielts[k].questions || []).forEach(function (q) { if (q.id === itemId) found = { act: { type: 'choice' }, item: q, list: 'questions' }; });
    });
    return found;
  }
  function findUnitCard(cardId) {
    var u = window.STUDY.units[cardId.replace(/-c\d{2}$/, '')];
    return u && (u.cards || []).filter(function (c) { return c.id === cardId; })[0];
  }
  // Frente y reverso de una tarjeta (data-model.md, «Repaso con FSRS»).
  function cardFaces(id, saved) {
    var lang = saved.lang;
    if (id.indexOf('ex-') === 0) {
      var f = findItem(id.slice(3));
      if (!f) return null;
      var it = f.item, t = f.act.type;
      var listen = t === 'pairs';
      var front = [el('p', { 'class': 'prompt', text: listen ? '¿Cuál sonó?' : (it.prompt || it.q) })];
      if (listen) front.push(audioButton(it[it.answer], (f.act.voices || [lang])[0], null, null, true));
      var ans = f.list === 'questions' || t === 'letters' ? String(it.answer)
              : answerText(t === 'pairs' ? 'pairs' : t, it);
      return { front: front, back: [el('p', { 'class': 'prompt', text: ans }), el('p', { 'class': 'why', text: it.why })] };
    }
    if (id.indexOf('err-') === 0) {
      var e = readProgress().errors.filter(function (x) { return x.id === id; })[0];
      if (!e) return null;
      return { front: [el('p', { 'class': 'muted', text: '¿Cómo se dice bien?' }), el('p', { 'class': 'prompt', text: e.wrong })],
               back: [el('p', { 'class': 'prompt', text: e.right }), e.note ? el('p', { 'class': 'why', text: e.note }) : null] };
    }
    var c = findUnitCard(id);
    if (!c) return null;
    var fr = [el('p', { 'class': 'prompt', text: c.front }), audioButton(c.front, c.lang, c.audio)];
    var bk = [el('p', { 'class': 'prompt', text: c.back })];
    if (c.example) bk.push(el('p', { 'class': 'muted', text: c.example }));
    if (c.keyword) bk.push(el('p', { 'class': 'why', text: 'Palabra clave: ' + c.keyword }));
    return { front: fr, back: bk };
  }
  // Tarjeta con fecha de repaso válida (una tarjeta dañada en un archivo importado se salta, no traba el repaso).
  function validCard(c) {
    return !!c && !!c.fsrs && isFinite(new Date(c.fsrs.due).getTime());
  }
  // Tarjetas para repasar hoy en un idioma, respetando los topes: primero repasos, luego nuevas.
  function reviewQueue(p, lang) {
    var now = Date.now(), reviews = [], fresh = [];
    Object.keys(p.cards).forEach(function (id) {
      var c = p.cards[id];
      if (!validCard(c) || String(c.lang).slice(0, 2) !== lang) return;
      if (new Date(c.fsrs.due).getTime() > now) return;
      (c.fsrs.state === 0 ? fresh : reviews).push(id);
    });
    var byDue = function (a, b) { return new Date(p.cards[a].fsrs.due) - new Date(p.cards[b].fsrs.due); };
    reviews.sort(byDue); fresh.sort(byDue);
    return reviews.slice(0, Math.max(0, REVIEW_CAP - usedToday(p.reviewsToday, lang)))
      .concat(fresh.slice(0, Math.max(0, NEW_CAP - usedToday(p.newToday, lang))));
  }
  function bump(p, counter, lang) {
    var d = today();
    if (!p[counter] || p[counter].day !== d) p[counter] = { day: d, en: 0, uk: 0 };
    p[counter][lang] = (p[counter][lang] || 0) + 1;
  }
  // Califica una tarjeta (1 Otra vez, 2 Difícil, 3 Bien, 4 Fácil) y cuenta para el tope del día.
  function rateCard(id, rating) {
    var p = readProgress(), c = p.cards[id], lang = String(c.lang).slice(0, 2);
    bump(p, c.fsrs.state === 0 ? 'newToday' : 'reviewsToday', lang);
    c.fsrs = scheduler.next(c.fsrs, new Date(), rating).card;
    if (ratedToday(p) >= 20) markStudyDay(p);
    saveProgress(p);
  }
  window.__study.reviewQueue = function (lang) { return reviewQueue(readProgress(), lang); };

  var RATINGS = [[1, 'Otra vez'], [2, 'Difícil'], [3, 'Bien'], [4, 'Fácil']];
  // Todas las tarjetas de un idioma por fecha, sin topes ni esperar a que venzan («Seguir estudiando»).
  function extraQueue(p, lang) {
    return Object.keys(p.cards).filter(function (id) {
      var c = p.cards[id];
      return validCard(c) && String(c.lang).slice(0, 2) === lang;
    }).sort(function (a, b) { return new Date(p.cards[a].fsrs.due) - new Date(p.cards[b].fsrs.due); });
  }
  // opts: { title, queue, onRated(), onDone(holder) } — sin opts es el repaso de hoy con topes.
  function reviewScreen(lang, opts) {
    opts = opts || {};
    var name = lang === 'uk' ? 'ucraniano' : 'inglés';
    var s = screen('repaso', opts.title || 'Repaso de ' + name);
    var holder = el('div');
    s.appendChild(holder);
    var queue = opts.queue || reviewQueue(readProgress(), lang), i = 0;
    function show() {
      while (i < queue.length && !cardFaces(queue[i], readProgress().cards[queue[i]])) i++;  // tarjeta sin contenido: se salta
      if (i >= queue.length) {
        if (opts.onDone) { opts.onDone(holder); return; }
        holder.replaceChildren(el('p', { 'data-review-done': '1', text: opts.queue
          ? '¡Listo! No hay más tarjetas de ' + name + ' para adelantar.'
          : '¡Listo! No quedan repasos de ' + name + ' por hoy.' }));
        return;
      }
      var id = queue[i], faces = cardFaces(id, readProgress().cards[id]);
      var back = el('div', { 'data-back': '1' });
      var showBtn = el('button', { 'class': 'primary', 'data-show': '1', text: 'Mostrar', onclick: function () {
        showBtn.remove();
        back.replaceChildren.apply(back, faces.back.filter(Boolean));
        var row = el('div', { 'class': 'ratings' });
        RATINGS.forEach(function (r) {
          row.appendChild(el('button', { 'data-rate': String(r[0]), text: r[1], onclick: function () {
            rateCard(id, r[0]); if (opts.onRated) opts.onRated(); i++; next();
          } }));
        });
        back.appendChild(row);
      } });
      holder.replaceChildren.apply(holder, [
        el('p', { 'class': 'muted', 'data-count': '1', text: (i + 1) + ' de ' + queue.length })
      ].concat([el('div', { 'class': 'card', 'data-card': id }, faces.front.filter(Boolean))], [showBtn, back]));
    }
    var next = show;
    show();
    return s;
  }

  // --- Conversar con Claude (T023, FR-019) ----------------------------------
  var IELTS_ME = 'Preparo el IELTS General Training (ahora tengo un nivel B1; mi meta es banda 7 en cada parte). ';
  var SPEAK_RULES = [
    '- Hazme una pregunta a la vez y espera mi respuesta antes de seguir.',
    '- Respondo con el dictado del teléfono: no corrijas la puntuación ni la ortografía que pone el dictado.',
    '- No me corrijas durante la práctica; espera al final.'];
  var SPEAK_END = [
    '- Al final, en español: una banda (aproximada, no oficial) para Fluency and Coherence, Lexical Resource ' +
    'y Grammatical Range and Accuracy, con el porqué de cada una. Pronunciation no se puede juzgar por un texto: no la califiques.',
    '- Luego, mis errores, uno por línea, en este formato: dije → correcto → nota (la nota en español).'];
  var UK_ME = 'Estudio ucraniano desde cero (nivel A1: estoy aprendiendo el alfabeto; mi lengua es el español). ';
  var UK_RULES = [
    '- Frases muy cortas (de 3 a 6 palabras) y una pregunta a la vez.',
    '- Escribe cada frase en cirílico, con el acento marcado (´) en la sílaba fuerte; debajo, cómo se lee con letras latinas; y debajo, la traducción al español.',
    '- Te respondo como pueda: en ucraniano, con letras latinas o en español. Si respondo en español, dime cómo se dice en ucraniano y pídeme que lo escriba.',
    '- Corrígeme con suavidad, explicando en español, y sigue la conversación.',
    '- Unas 8 preguntas. Al final, mis errores, uno por línea, en este formato: dije → correcto → nota (la nota en español).'];
  var CLAUDE_PROMPTS = [
    { id: 'speaking-1', lang: 'en', title: 'Speaking Part 1 · La comida',
      about: 'Preguntas cortas sobre ti, como al empezar el examen (4–5 min).',
      text: [IELTS_ME + 'Hazme un Speaking Part 1 como un examinador real, en inglés: unas 10 preguntas cortas sobre mí, ' +
        'en 2 o 3 temas de la vida diaria, empezando por la comida y la cocina.'].concat(SPEAK_RULES, SPEAK_END,
        ['', 'Empieza con la primera pregunta.']).join('\n') },
    { id: 'speaking-2', lang: 'en', title: 'Speaking Part 2 · Hablar 2 minutos',
      about: 'Una tarjeta con un tema: 1 min para prepararte y hasta 2 min para hablar.',
      text: [IELTS_ME + 'Hazme un Speaking Part 2 como en el examen real, en inglés:',
        '- Dame una tarjeta (cue card) con un tema de la vida diaria relacionado con la comida o la cocina, con sus puntos a cubrir.',
        '- Yo me preparo 1 minuto y hablo hasta 2 minutos (me cronometro yo). Luego te pego lo que dije, dictado con el teléfono.',
        '- Después hazme 1 o 2 preguntas cortas de cierre, como el examinador.',
        '- No me corrijas antes de terminar.'].concat(SPEAK_END,
        ['- Por último, una versión mejorada de mi respuesta, con vocabulario y gramática de banda 7.', '',
         'Empieza con la tarjeta.']).join('\n') },
    { id: 'speaking-3', lang: 'en', title: 'Speaking Part 3 · Discusión',
      about: 'Preguntas más abiertas sobre la comida en la sociedad (4–5 min).',
      text: [IELTS_ME + 'Hazme un Speaking Part 3 como un examinador real, en inglés: una discusión de 4 a 5 minutos ' +
        'con preguntas más abiertas sobre la comida en la sociedad (por ejemplo, cocinar en casa, la comida rápida, ' +
        'los restaurantes y el trabajo en una cocina).'].concat(SPEAK_RULES,
        ['- Si respondo muy corto, pídeme razones o un ejemplo, como hace el examinador.'], SPEAK_END,
        ['', 'Empieza con la primera pregunta.']).join('\n') },
    { id: 'ucraniano-comida', lang: 'uk', title: 'Ucraniano · La comida',
      about: 'Conversación muy simple: qué te gusta comer y qué hay de cena.',
      text: [UK_ME + 'Conversemos en ucraniano muy simple sobre la comida: qué me gusta comer y qué hay de cena hoy.']
        .concat(UK_RULES, ['', 'Empieza con un saludo y la primera pregunta.']).join('\n') },
    { id: 'ucraniano-casa', lang: 'uk', title: 'Ucraniano · La casa',
      about: 'Conversación muy simple: las habitaciones y la cocina de tu casa.',
      text: [UK_ME + 'Conversemos en ucraniano muy simple sobre mi casa: las habitaciones, la cocina y qué hay en ella.']
        .concat(UK_RULES, ['', 'Empieza con un saludo y la primera pregunta.']).join('\n') },
    { id: 'writing', lang: 'en', title: 'Corregir un Writing',
      about: 'Para una carta (Task 1) o un ensayo (Task 2) que escribiste: pega la consigna y tu texto donde se indica.',
      text: [IELTS_ME + 'Corrige mi Writing como lo haría un examinador, con los 4 criterios de banda: Task Achievement ' +
        '(en Task 2, Task Response), Coherence and Cohesion, Lexical Resource y Grammatical Range and Accuracy.',
        '- Para cada criterio, una banda (aproximada, no oficial) y por qué; luego la banda total (aproximada, no oficial).',
        '- Señala cada error con su corrección, explicada en español, y dame una versión mejorada.',
        '- Al final, mis errores, uno por línea, en este formato: dije → correcto → nota (la nota en español).', '',
        'Task (1 o 2):', '', 'Consigna:', '[pega aquí la consigna]', '', 'Mi texto:', '[pega aquí tu texto]'].join('\n') }
  ];

  // --- instalar con ícono (T027) ---------------------------------------------
  // Si la app no está abierta como instalada (pantalla completa), se explica cómo instalarla.
  function isInstalled() {
    try { if (navigator.standalone === true) return true; } catch (e) { /* sin dato */ }
    try { return window.matchMedia('(display-mode: standalone)').matches; } catch (e) { return false; }
  }
  function installNote() {
    if (isInstalled()) return null;
    return el('div', { 'class': 'card', 'data-install': '1' }, [
      el('p', { text: '📲 Instálala con ícono: en Safari toca Compartir y luego «Agregar a inicio».' }),
      el('p', { 'class': 'muted', text: 'El progreso de Safari y el de la app instalada van por separado: estudia siempre desde la app instalada.' })]);
  }

  // --- revisión de hablante nativa (T030): nativeCheck del progreso; sin entrada = pendiente ---
  function reviewBadge(unitId) {
    var u = window.STUDY.units[unitId];
    if (!u || !u.needsNativeCheck) return null;
    var c = readProgress().nativeCheck[unitId];
    var ok = !!c && c.status === 'approved';
    return el('p', { 'class': ok ? 'ok' : 'muted', 'data-review': ok ? 'approved' : 'pending',
                     text: ok ? 'Revisada ✓' : 'Pendiente de revisión' });
  }

  // --- Ajustes (T034): minutos, voces, audios, exportar e importar ---------------
  function settingsMinutes() {
    var msg = el('p', { 'data-minutes-msg': '' });
    function field(key, label) {
      var input = el('input', { type: 'number', inputmode: 'numeric', min: '5', max: '180', step: '5',
                                'data-minutes': key, value: String(readProgress().settings[key]) });
      input.addEventListener('change', function () {
        var v = Number(input.value);
        if (!(v >= 5 && v <= 180) || Math.round(v) !== v) {
          msg.className = 'bad'; msg.textContent = 'Escribe un número de minutos entre 5 y 180.';
          input.value = String(readProgress().settings[key]);
          return;
        }
        var p = readProgress(); p.settings[key] = v; saveProgress(p);
        msg.className = 'ok'; msg.textContent = 'Guardado.';
      });
      return el('label', { 'class': 'match' }, [el('span', { text: label }), input]);
    }
    return el('div', { 'class': 'card', 'data-settings': 'minutes' }, [
      el('h2', { text: 'Minutos por día' }),
      field('minutesEn', 'Inglés'), field('minutesUk', 'Ucraniano'), msg]);
  }

  var ACCENTS = { 'en-gb': 'Inglés británico', 'en-us': 'Inglés estadounidense', 'en-au': 'Inglés australiano', 'uk-ua': 'Ucraniano' };
  var VOICE_SAMPLE = { en: 'Good morning, chef. Today we are cooking fresh fish.', uk: 'Приві́т! Як спра́ви?' };
  function settingsVoices() {
    var box = el('div', { 'class': 'card', 'data-settings': 'voices' });
    function draw() {
      var wanted = readProgress().settings.voices || {};
      var rows = [el('h2', { text: 'Voces' }),
        el('p', { 'class': 'muted', text: 'Son las voces de tu teléfono. «Automática» usa la que pide cada ejercicio.' })];
      [['en', 'Inglés'], ['uk', 'Ucraniano']].forEach(function (x) {
        var lang = x[0], seen = {};
        var langs = voicesFor(lang).map(function (v) { return String(v.lang).replace('_', '-'); })
          .filter(function (l) { var k = l.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
        if (!langs.length) {
          rows.push(el('p', { 'data-voice-none': lang, text: x[1] + ': ' + noVoiceText(lang) + '.' }));
          return;
        }
        var sel = el('select', { 'data-voice': lang }, [el('option', { value: '', text: 'Automática' })].concat(
          langs.map(function (l) { return el('option', { value: l, text: (ACCENTS[l.toLowerCase()] || x[1]) + ' (' + l + ')' }); })));
        sel.value = langs.some(function (l) { return l === wanted[lang]; }) ? wanted[lang] : '';
        sel.addEventListener('change', function () {
          var p = readProgress();
          p.settings.voices = p.settings.voices || {};
          if (sel.value) p.settings.voices[lang] = sel.value; else delete p.settings.voices[lang];
          saveProgress(p);
        });
        rows.push(el('label', { 'class': 'match' }, [el('span', { text: x[1] }), sel]));
        rows.push(el('button', { 'data-voice-test': lang, text: '🔊 Probar voz en ' + x[1].toLowerCase(), onclick: function () {
          speakVoice(VOICE_SAMPLE[lang], sel.value || (lang === 'uk' ? 'uk-UA' : 'en-GB'), !!sel.value);
        } }));
      });
      box.replaceChildren.apply(box, rows);
    }
    draw();
    // En iPhone las voces pueden llegar después de abrir la página.
    try {
      speechSynthesis.addEventListener('voiceschanged', draw);
      onLeave(function () { speechSynthesis.removeEventListener('voiceschanged', draw); });
    } catch (e) { /* sin voces */ }
    return box;
  }

  function settingsAudio() {
    var box = el('input', { type: 'checkbox', 'data-audio-files': '1' });
    box.checked = readProgress().settings.audioFiles !== false;
    box.addEventListener('change', function () {
      var p = readProgress(); p.settings.audioFiles = box.checked; saveProgress(p);
    });
    return el('div', { 'class': 'card', 'data-settings': 'audio' }, [
      el('h2', { text: 'Audios' }),
      el('label', { 'class': 'check' }, [box, el('span', { text: ' Usar los audios de la app cuando existan' })]),
      el('p', { 'class': 'muted', text: 'La lección 1 de ucraniano trae sus audios (voz abierta). Si no hay audio, o está apagado, suena la voz del teléfono.' })]);
  }

  var beforeImport = null;   // copia del progreso anterior a la última importación (solo en memoria)
  function checkImported(data) {
    var isObj = function (x) { return !!x && typeof x === 'object' && !Array.isArray(x); };
    if (!isObj(data)) return 'El archivo no es un progreso de $CHEF Study.';
    if (data.version !== 1) return 'Este archivo es de otra versión (' + String(data.version) + '); esta app usa la versión 1.';
    var bad = [];
    ['settings', 'streak', 'lessons', 'cards', 'nativeCheck', 'drafts'].forEach(function (k) { if (data[k] !== undefined && !isObj(data[k])) bad.push(k); });
    ['ielts', 'errors'].forEach(function (k) { if (data[k] !== undefined && !Array.isArray(data[k])) bad.push(k); });
    // Auditoría T041: cada error debe ser un objeto con su id (si no, la lista y «Borrar» fallan).
    if (Array.isArray(data.errors) && data.errors.some(function (e) { return !isObj(e) || typeof e.id !== 'string' || !e.id; })) {
      bad.push('errors');
    }
    return bad.length ? 'El archivo está dañado (' + bad.join(', ') + ').' : '';
  }
  function settingsBackup() {
    var msg = el('p', { 'data-backup-msg': '' });
    var ask = el('div', { 'data-import-ask': '' });
    function say(cls, state, text) { msg.className = cls; msg.setAttribute('data-backup-msg', state); msg.textContent = text; }
    var exportBtn = el('button', { 'class': 'primary', 'data-export': '1', text: '⬇️ Exportar progreso', onclick: function () {
      var name = 'chef-study-' + today() + '.json';
      var blob = new Blob([JSON.stringify(readProgress(), null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = el('a', { href: url, download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      say('ok', 'exported', 'Listo: ' + name + '. Guárdalo en Archivos o en tu correo.');
    } });
    var file = el('input', { type: 'file', accept: 'application/json,.json', 'data-import-file': '1' });
    file.addEventListener('change', function () {
      ask.replaceChildren();
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var data = null;
        try { data = JSON.parse(String(reader.result)); } catch (e) { data = null; }
        var problem = checkImported(data);
        file.value = '';
        if (problem) { say('bad', 'rejected', problem + ' No se cambió nada.'); return; }
        var lessons = Object.keys(data.lessons || {}).filter(function (k) { return data.lessons[k] && data.lessons[k].doneAt; }).length;
        var cards = Object.keys(data.cards || {}).length;
        say('', 'asking', '');
        ask.replaceChildren(el('div', { 'class': 'card' }, [
          el('p', { text: 'Este archivo' + (data.savedAt ? ' es del ' + localDay(data.savedAt) + ' y' : '') + ' tiene ' +
                         lessons + (lessons === 1 ? ' lección hecha' : ' lecciones hechas') + ' y ' + cards + (cards === 1 ? ' tarjeta' : ' tarjetas') + '.' }),
          el('p', { text: 'Reemplazará todo tu progreso actual. ¿Seguir?' }),
          el('button', { 'class': 'primary', 'data-import-yes': '1', text: 'Sí, reemplazar', onclick: function () {
            beforeImport = readProgress();
            saveProgress(merge(data), true);
            render();
            var m = document.querySelector('[data-backup-msg]');
            if (m) { m.className = 'ok'; m.setAttribute('data-backup-msg', 'imported'); m.textContent = 'Progreso importado.'; }
          } }),
          el('button', { 'data-import-no': '1', text: 'Cancelar', onclick: function () {
            ask.replaceChildren(); say('', 'cancelled', 'No se cambió nada.');
          } })]));
      };
      reader.onerror = function () { file.value = ''; say('bad', 'rejected', 'No se pudo leer el archivo. No se cambió nada.'); };
      reader.readAsText(f);
    });
    var undo = beforeImport ? el('button', { 'data-import-undo': '1', text: 'Volver al progreso de antes de importar', onclick: function () {
      saveProgress(beforeImport, true); beforeImport = null;
      render();
      var m = document.querySelector('[data-backup-msg]');
      if (m) { m.className = 'ok'; m.setAttribute('data-backup-msg', 'undone'); m.textContent = 'Volviste al progreso de antes de importar.'; }
    } }) : null;
    return el('div', { 'class': 'card', 'data-settings': 'backup' }, [
      el('h2', { text: 'Copia de tu progreso' }),
      el('p', { 'class': 'muted', text: 'El progreso vive solo en este teléfono. Exporta una copia de vez en cuando; las grabaciones nunca se guardan.' }),
      exportBtn,
      el('label', { 'class': 'btn file', 'data-import-label': '1' }, [el('span', { text: '📂 Importar progreso' }), file]),
      ask, undo, msg]);
  }

  // --- pantallas (contracts/pantallas.md) -----------------------------------
  // Cada pantalla se completa en su tarea; aquí solo el armazón (T006).
  var screens = {
    inicio: function () {
      var p = readProgress();
      var days = currentStreak(p);
      return screen('inicio', '$CHEF Study', [
        el('p', { 'class': 'muted', text: 'Hola. Esta es tu sesión de hoy.' }),
        installNote(),
        todayCard(p, 'en'),
        todayCard(p, 'uk'),
        el('p', { 'data-field': 'streak', text: '🔥 Racha: ' + days + (days === 1 ? ' día' : ' días') }),
        navButton('Inglés', 'curso/en'),
        navButton('Ucraniano', 'curso/uk'),
        navButton('Práctica IELTS', 'ielts'),
        navButton('Conversar con Claude', 'claude'),
        navButton('Progreso', 'progreso'),
        navButton('Ajustes', 'ajustes')
      ]);
    },
    curso: function (lang) {
      lang = lang === 'uk' ? 'uk' : 'en';
      var p = readProgress(), list = courseLessons(lang), units = window.STUDY.units;
      var body = [];
      if (!list.length) body.push(el('p', { 'class': 'muted', text: 'Todavía no hay lecciones en este curso.' }));
      else body.push(el('button', { 'class': 'primary', 'data-session': lang, text: 'Empezar sesión de hoy',
                                     onclick: function () { go('sesion/' + lang); } }));
      var level = null;
      Object.keys(units).filter(function (k) { return k.indexOf(lang + '-') === 0; }).sort().forEach(function (k) {
        var u = units[k];
        // T049: el nivel (B1, A1…) sale del id de la unidad (data-model.md: <curso>-<nivel>-<nn>).
        var lv = k.split('-')[1].toUpperCase();
        if (lv !== level) { level = lv; body.push(el('h2', { 'data-level': lv, text: 'Nivel ' + lv })); }
        var box = el('div', { 'class': 'card', 'data-unit': k }, [
          el('h2', { text: u.title }), el('p', { 'class': 'muted', text: u.titleEs }), reviewBadge(k)]);
        (u.lessons || []).forEach(function (l) {
          var st = lessonState(p, list, l.id);
          var label = { hecha: 'Repetir', disponible: 'Empezar', bloqueada: 'Ir a esta lección' }[st];
          var saved = p.lessons[l.id];
          if (st !== 'bloqueada' && saved && saved.step > 0) label = 'Seguir donde quedaste';
          box.appendChild(el('div', { 'data-lesson': l.id, 'data-state': st }, [
            el('p', { text: (l.title || l.id) + ' · ' + { hecha: '✓ hecha', disponible: 'disponible', bloqueada: '🔒 bloqueada' }[st] +
                            ' · unos ' + lessonMinutes(l) + ' min' }),
            el('button', { 'data-goto': l.id, text: label, onclick: function () { go('leccion/' + l.id); } })]));
        });
        body.push(box);
      });
      return screen('curso', lang === 'uk' ? 'Ucraniano' : 'Inglés', body);
    },
    sesion: function (lang) {
      // «Empezar sesión de hoy»: repasos hasta el tope → lección que sigue → resumen.
      lang = lang === 'uk' ? 'uk' : 'en';
      var p = readProgress(), next = nextLesson(p, lang);
      var info = { lang: lang, start: Date.now(), cardsBefore: Object.keys(p.cards).length, reviews: 0 };
      return reviewScreen(lang, {
        title: 'Sesión de hoy · ' + (lang === 'uk' ? 'Ucraniano' : 'Inglés'),
        onRated: function () { info.reviews++; },
        onDone: function (holder) {
          if (next) { session = info; go('leccion/' + next.id); }
          else holder.replaceChildren(el('p', { 'class': 'muted', text: 'Ya hiciste todas las lecciones que hay por ahora.' }),
                                      summaryBox(lang, info, null));
        }
      });
    },
    leccion: function (id) {
      var lesson = findLesson(id);
      if (!lesson) return screen('leccion', 'Lección', [el('p', { text: 'No se encontró esta lección.' })]);
      var lang = id.slice(0, 2), acts = lesson.activities;
      var s = screen('leccion', lesson.title || 'Lección');
      var badge = reviewBadge(id.replace(/-l\d+$/, ''));
      if (badge) s.appendChild(badge);
      var holder = el('div');
      var p0 = readProgress(), saved = p0.lessons[id] || {};
      var info = session && session.lang === lang ? session
               : { lang: lang, start: Date.now(), cardsBefore: Object.keys(p0.cards).length, reviews: 0 };
      session = null;
      var step = typeof saved.step === 'number' && saved.step > 0 && saved.step < acts.length ? saved.step : 0;
      var tally = step && saved.score ? { correct: saved.score.correct || 0, total: saved.score.total || 0 } : { correct: 0, total: 0 };
      var finished = false;
      // Aciertos al empezar la actividad actual: al volver, la actividad se hace desde su inicio,
      // así que se guardan estos (si no, los ítems ya respondidos se contarían dos veces).
      var tallyAtStep = { correct: tally.correct, total: tally.total };
      // «Salir» (o «‹ Inicio», o cerrar la app) guarda en qué actividad quedó.
      function saveStep() {
        if (finished) return;
        var p = readProgress(), l = p.lessons[id] || {};
        l.step = step; l.score = { correct: tallyAtStep.correct, total: tallyAtStep.total };
        p.lessons[id] = l; saveProgress(p);
      }
      var back = s.querySelector('button.back');
      if (back) back.addEventListener('click', saveStep);
      s.appendChild(holder);
      s.appendChild(el('button', { 'data-exit': '1', text: 'Salir (guarda dónde quedaste)', onclick: function () {
        saveStep(); go('curso/' + lang);
      } }));
      function finish() {
        finished = true;
        var p = readProgress(), l = p.lessons[id] || {};
        l.doneAt = new Date().toISOString(); l.score = { correct: tally.correct, total: tally.total };
        delete l.step;
        p.lessons[id] = l; markStudyDay(p); saveProgress(p);
        var exit = s.querySelector('[data-exit]');
        if (exit) exit.remove();
        holder.replaceChildren(el('h2', { text: 'Lección terminada' }), summaryBox(lang, info, tally, true, findLesson(id)));
      }
      function show(resumed) {
        if (step >= acts.length) { finish(); return; }
        var act = acts[step];
        tallyAtStep = { correct: tally.correct, total: tally.total };
        var next = function () { runCleanups(); step++; show(); window.scrollTo(0, 0); };
        gradedHook = function (ok) { tally.total++; if (ok) tally.correct++; };
        var hide = function () { if (document.visibilityState === 'hidden') saveStep(); };
        document.addEventListener('visibilitychange', hide);
        window.addEventListener('pagehide', saveStep);
        onLeave(function () { gradedHook = null; document.removeEventListener('visibilitychange', hide);
                              window.removeEventListener('pagehide', saveStep); });
        var body = (GRADED.indexOf(act.type) >= 0 || act.type === 'pairs')
          ? gradedActivity(act, next)
          : act.type === 'pretest' ? pretestActivity(act, next)
          : UNGRADED[act.type] ? UNGRADED[act.type](act, next)
          : el('div', { 'data-activity': act.id, 'data-type': act.type }, [
              el('p', { 'class': 'muted', text: 'Actividad «' + act.type + '» (se arma en una tarea siguiente).' }),
              el('button', { 'class': 'primary', 'data-next': '1', text: 'Siguiente', onclick: next })]);
        holder.replaceChildren.apply(holder, [
          resumed ? el('div', { 'class': 'card', 'data-resumed': String(step) }, [
            el('p', { text: 'Sigues donde quedaste (actividad ' + (step + 1) + ').' }),
            el('button', { 'data-restart': '1', text: 'Empezar de nuevo', onclick: function () {
              runCleanups(); step = 0; tally = { correct: 0, total: 0 }; show();
            } })]) : null,
          el('p', { 'class': 'muted', 'data-progress': '1', text: 'Actividad ' + (step + 1) + ' de ' + acts.length }),
          // T048: barra de avance = actividades ya hechas de la lección.
          el('div', { 'class': 'bar', 'data-bar': String(Math.round(100 * step / acts.length)), role: 'progressbar',
                      'aria-valuemin': '0', 'aria-valuemax': String(acts.length), 'aria-valuenow': String(step) },
             [el('span', { style: 'width:' + (100 * step / acts.length) + '%' })]),
          body].filter(Boolean));
      }
      show(step > 0);
      return s;
    },
    adelantar: function (lang) {
      lang = lang === 'uk' ? 'uk' : 'en';
      return reviewScreen(lang, { title: 'Repasos adelantados · ' + (lang === 'uk' ? 'Ucraniano' : 'Inglés'),
                                  queue: extraQueue(readProgress(), lang) });
    },
    repaso: function (lang) {
      return reviewScreen(lang === 'uk' ? 'uk' : 'en');
    },
    ielts: function () {
      // En la muestra solo funcionan el Reading corto y el Writing Task 1; lo demás, «Próximamente».
      var p = readProgress(), all = window.STUDY.ielts || {};
      var body = [el('p', { 'class': 'muted', text: 'IELTS General Training, con el formato y el tiempo del examen.' })];
      ['reading', 'writing'].forEach(function (part) {
        Object.keys(all).sort().filter(function (k) { return all[k].part === part; }).forEach(function (k) {
          var pr = all[k];
          var last = p.ielts.filter(function (r) { return r.id === k; }).slice(-1)[0];
          var info = part === 'writing'
            ? pr.minutes + ' min · mínimo ' + pr.tasks[0].minWords + ' palabras · lo corriges con Claude'
            : pr.minutes + ' min · ' + pr.questions.length + ' preguntas' + (pr.kind === 'short' ? ' · práctica corta, sin banda' : '');
          var lastText = !last ? '' : part === 'writing'
            ? 'Última vez: ' + last.words + ' palabras' + (last.selfBand !== undefined ? ' · banda ' + last.selfBand + ' (' + BAND_NOTE + ')' : '') + ' (' + localDay(last.date) + ')'
            : 'Última vez: ' + last.correct + ' de ' + last.total + ' (' + localDay(last.date) + ')';
          body.push(el('div', { 'class': 'card', 'data-practice': k }, [
            el('h2', { text: pr.title || k }),
            el('p', { 'class': 'muted', text: info }),
            last ? el('p', { 'data-last': k, text: lastText }) : null,
            el('button', { 'class': 'primary', 'data-open-practice': k, text: 'Abrir', onclick: function () { go('practica/' + k); } })]));
        });
      });
      ['Listening', 'Speaking', 'Simulacro completo'].forEach(function (name) {
        body.push(el('div', { 'class': 'card', 'data-soon': name }, [
          el('h2', { text: name }), el('p', { 'class': 'muted', text: 'Próximamente' })]));
      });
      return screen('ielts', 'Práctica IELTS', body);
    },
    practica: function (id) {
      var pr = (window.STUDY.ielts || {})[id];
      if (pr && pr.part === 'writing') return writingPractice(pr);
      if (!pr || pr.part !== 'reading') return screen('practica', 'Práctica', [el('p', { text: 'No se encontró esta práctica.' })]);
      return readingPractice(pr);
    },
    claude: function () {
      // FR-019: 6 consignas listas para copiar y pegar en un chat nuevo de claude.ai (sin nombres).
      var body = [el('p', { 'class': 'muted', text: 'Copia una consigna, abre claude.ai y pégala en un chat nuevo. ' +
        'Al final, Claude te da tus errores en el formato «dije → correcto → nota», para tu registro de errores.' })];
      CLAUDE_PROMPTS.forEach(function (c) {
        var full = el('div', { 'data-prompt-text': c.id, hidden: 'hidden' }, paragraphs(c.text));
        var toggle = el('button', { 'data-toggle': c.id, text: 'Ver el texto', onclick: function () {
          full.hidden = !full.hidden;
          toggle.textContent = full.hidden ? 'Ver el texto' : 'Ocultar el texto';
        } });
        body.push(el('div', { 'class': 'card', 'data-claude-prompt': c.id }, [
          el('h2', { text: c.title }),
          el('p', { 'class': 'muted', text: c.about }),
          c.lang === 'uk' ? el('p', { 'class': 'muted', text: 'Lo que Claude escriba en ucraniano no lo revisa una hablante nativa.' }) : null,
          toggle, full,
          copyButton(function () { return c.text; }, '📋 Copiar consigna')]));
      });
      body.splice(1, 0, navButton('📝 Registro de errores', 'errores'));
      return screen('claude', 'Conversar con Claude', body);
    },
    errores: function () {
      // T024 (FR-018): idioma → parte → dije → correcto → nota; guarda en errors y crea err-<n> (vence mañana).
      function field(label, control) { return el('label', { 'class': 'match' }, [el('span', { text: label }), control]); }
      function options(list) { return list.map(function (o) { return el('option', { value: o[0], text: o[1] }); }); }
      var lang = el('select', { 'data-err': 'lang' }, options([['en', 'Inglés'], ['uk', 'Ucraniano']]));
      var part = el('select', { 'data-err': 'part' }, options([['writing', 'Writing'], ['speaking', 'Speaking'], ['otro', 'Otro']]));
      var wrong = el('textarea', { 'data-err': 'wrong', rows: '2' });
      var right = el('textarea', { 'data-err': 'right', rows: '2' });
      var note = el('textarea', { 'data-err': 'note', rows: '2' });
      var msg = el('p', { 'data-err-msg': '' });
      var count = el('p', { 'class': 'muted', 'data-err-count': '' });
      function showCount() {
        var n = readProgress().errors.length;
        count.textContent = n === 1 ? 'Tienes 1 error anotado.' : 'Tienes ' + n + ' errores anotados.';
      }
      // T041 (aprobado por el dueño): la lista de errores, con «Borrar» (pregunta antes; quita el error y su tarjeta).
      var list = el('div', { 'data-err-list': '1' });
      function showList() {
        var errs = readProgress().errors.slice().reverse();
        list.replaceChildren.apply(list, errs.length ? [el('h2', { text: 'Tus errores' })].concat(errs.map(errorCard)) : []);
      }
      function errorCard(e) {
        var ask = el('div');
        var del = el('button', { 'data-err-del': e.id, text: 'Borrar', onclick: function () {
          del.style.display = 'none';   // el CSS de los botones gana a «hidden»
          ask.replaceChildren(el('p', { text: '¿Borrar este error y su tarjeta de repaso?' }),
            el('button', { 'class': 'primary', 'data-err-del-yes': e.id, text: 'Sí, borrar', onclick: function () {
              var p = readProgress();
              p.errors = p.errors.filter(function (x) { return x.id !== e.id; });
              delete p.cards[e.id];
              saveProgress(p);
              msg.className = 'ok'; msg.setAttribute('data-err-msg', 'deleted');
              msg.textContent = 'Borrado.';
              showCount(); showList();
            } }),
            el('button', { 'data-err-del-no': e.id, text: 'No', onclick: function () { ask.replaceChildren(); del.style.display = ''; } }));
        } });
        return el('div', { 'class': 'card', 'data-err-item': e.id }, [
          el('p', { 'class': 'muted', text: (e.lang === 'uk' ? 'Ucraniano' : 'Inglés') + ' · ' +
                    ({ writing: 'Writing', speaking: 'Speaking', otro: 'Otro' }[e.part] || 'Otro') }),
          el('p', { text: 'Dije: ' + (e.wrong || '') }),
          el('p', { text: 'Correcto: ' + (e.right || '') }),
          e.note ? el('p', { 'class': 'muted', text: 'Nota: ' + e.note }) : null,
          del, ask]);
      }
      showCount();
      showList();
      var save = el('button', { 'class': 'primary', 'data-err-save': '1', text: 'Guardar error', onclick: function () {
        var w = wrong.value.trim(), r = right.value.trim();
        if (!w || !r) {
          msg.className = 'bad'; msg.setAttribute('data-err-msg', 'missing');
          msg.textContent = 'Escribe lo que dijiste y lo correcto.';
          return;
        }
        var p = readProgress(), n = 0;
        p.errors.forEach(function (e) { var k = Number(String(e.id).replace(/^err-/, '')); if (k > n) n = k; });
        Object.keys(p.cards).forEach(function (id) { var m = /^err-(\d+)$/.exec(id); if (m && Number(m[1]) > n) n = Number(m[1]); });
        var id = 'err-' + (n + 1);
        p.errors.push({ id: id, lang: lang.value, date: new Date().toISOString(), part: part.value,
                        wrong: w, right: r, note: note.value.trim() });
        p.cards[id] = { lang: lang.value, fsrs: FSRS.createEmptyCard(startOfTomorrow()) };
        saveProgress(p);
        wrong.value = ''; right.value = ''; note.value = '';
        msg.className = 'ok'; msg.setAttribute('data-err-msg', id);
        msg.textContent = 'Guardado. Lo repasarás como tarjeta desde mañana.';
        showCount(); showList();
      } });
      return screen('errores', 'Registro de errores', [
        el('p', { 'class': 'muted', text: 'Anota lo que Claude te corrigió. Cada error se vuelve una tarjeta de repaso desde mañana.' }),
        count,
        field('Idioma', lang), field('Parte', part),
        field('Dije', wrong), field('Correcto', right), field('Nota (opcional)', note),
        save, msg, list]);
    },
    progreso: function () {
      // T033 (contracts/pantallas.md §6). Dominada = estado «repaso» (2) y estabilidad de 21 días o más.
      var p = readProgress(), all = window.STUDY.ielts || {};
      var mastered = function (c) { return !!c && !!c.fsrs && c.fsrs.state === 2 && c.fsrs.stability >= 21; };
      var days = currentStreak(p), best = p.streak.best || 0;
      var body = [
        el('p', { 'data-field': 'streak', text: '🔥 Racha: ' + days + (days === 1 ? ' día' : ' días') +
                  ' · mejor racha: ' + best + (best === 1 ? ' día' : ' días') }),
        el('p', { 'class': 'muted', text: 'Sube con 1 lección o 20 repasos en el día.' })];

      // Por idioma: lecciones hechas y tarjetas dominadas.
      [['en', 'Inglés'], ['uk', 'Ucraniano']].forEach(function (x) {
        var lang = x[0];
        var lessons = Object.keys(p.lessons).filter(function (id) {
          return id.indexOf(lang + '-') === 0 && p.lessons[id] && p.lessons[id].doneAt; }).length;
        var cards = Object.keys(p.cards).filter(function (id) {
          var c = p.cards[id]; return c && String(c.lang).slice(0, 2) === lang; });
        var dom = cards.filter(function (id) { return mastered(p.cards[id]); }).length;
        body.push(el('div', { 'class': 'card', 'data-lang-progress': lang }, [
          el('h2', { text: x[1] }),
          el('p', { 'data-field': 'lessons', text: 'Lecciones hechas: ' + lessons }),
          el('p', { 'data-field': 'mastered', text: 'Tarjetas dominadas: ' + dom + ' de ' + cards.length })]));
      });

      // IELTS: las 4 partes contra la meta de 7. L y R: banda de las prácticas completas; W y S: la última banda anotada.
      var newest = function (part, field, kind) {
        var r = null;
        p.ielts.forEach(function (e) {
          if (e.part === part && typeof e[field] === 'number' && (!kind || e.kind === kind) &&
              (!r || new Date(e.date) >= new Date(r.date))) r = e;
        });
        return r ? r[field] : null;
      };
      var parts = [['listening', 'Listening', newest('listening', 'band', 'full')],
                   ['reading', 'Reading', newest('reading', 'band', 'full')],
                   ['writing', 'Writing', newest('writing', 'selfBand')],
                   ['speaking', 'Speaking', newest('speaking', 'selfBand')]];
      var withData = parts.filter(function (x) { return x[2] !== null; });
      var low = withData.length ? Math.min.apply(null, withData.map(function (x) { return x[2]; })) : null;
      var ieltsBox = el('div', { 'class': 'card', 'data-ielts-progress': '1' }, [
        el('h2', { text: 'IELTS · meta: banda 7 en cada parte' })]);
      parts.forEach(function (x) {
        var weak = x[2] !== null && x[2] === low;
        var attrs = { 'data-part': x[0], text: x[1] + ': ' + (x[2] === null ? 'sin datos'
          : 'banda ' + x[2] + ' de 7 (' + BAND_NOTE + ')' + (weak ? ' · la más débil' : '')) };
        if (weak) { attrs['data-weakest'] = '1'; attrs['class'] = 'bad'; }
        ieltsBox.appendChild(el('p', attrs));
      });
      ieltsBox.appendChild(el('p', { 'class': 'muted', text: 'Listening y Reading: de las prácticas completas. ' +
        'Writing y Speaking: la última banda que anotaste de Claude.' }));
      body.push(ieltsBox);

      // Historial de IELTS (lo más nuevo primero).
      var hist = el('div', { 'class': 'card', 'data-ielts-history': '1' }, [el('h2', { text: 'Historial de IELTS' })]);
      if (!p.ielts.length) hist.appendChild(el('p', { 'class': 'muted', text: 'Todavía no hay prácticas.' }));
      p.ielts.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).forEach(function (e) {
        var name = (all[e.id] && all[e.id].title) || e.id;
        var res = [];
        if (typeof e.correct === 'number' && typeof e.total === 'number') res.push(e.correct + ' de ' + e.total);
        if (typeof e.words === 'number') res.push(e.words + ' palabras');
        [e.band, e.selfBand].forEach(function (b) { if (typeof b === 'number') res.push('banda ' + b + ' (' + BAND_NOTE + ')'); });
        hist.appendChild(el('p', { 'data-history': e.id, text: [localDay(e.date), name].concat(res).join(' · ') }));
      });
      body.push(hist);

      // Reparto en los 4 hilos de la última lección hecha (minutos estimados del contenido).
      var last = null;
      Object.keys(p.lessons).forEach(function (id) {
        var l = p.lessons[id];
        if (l && l.doneAt && findLesson(id) && (!last || new Date(l.doneAt) > new Date(p.lessons[last].doneAt))) last = id;
      });
      var strandsBox = el('div', { 'class': 'card', 'data-strands': last || '' }, [el('h2', { text: 'Los 4 hilos de tu última lección' })]);
      if (!last) strandsBox.appendChild(el('p', { 'class': 'muted', text: 'Aparece cuando termines tu primera lección.' }));
      else {
        var lesson = findLesson(last), total = lessonMinutes(lesson), mins = {};
        lesson.activities.forEach(function (a) { mins[a.strand] = (mins[a.strand] || 0) + (a.minutes || 0); });
        strandsBox.appendChild(el('p', { text: lesson.title || last }));
        [['input', 'Entrada (input)'], ['output', 'Producción (output)'], ['language', 'Lengua (language)'],
         ['fluency', 'Fluidez (fluency)']].forEach(function (x) {
          var m = mins[x[0]] || 0;
          strandsBox.appendChild(el('p', { 'data-strand': x[0],
            text: x[1] + ': ' + m + ' min (' + (total ? Math.round(m * 100 / total) : 0) + ' %)' }));
        });
        strandsBox.appendChild(el('p', { 'class': 'muted', text: 'Minutos estimados del contenido, no el tiempo medido.' }));
      }
      body.push(strandsBox);

      // Registro de errores: cuántos hay y cuántos ya no se repiten (su tarjeta err-… está dominada).
      var gone = p.errors.filter(function (e) { return mastered(p.cards[e.id]); }).length;
      body.push(el('div', { 'class': 'card', 'data-errors-progress': '1' }, [
        el('h2', { text: 'Registro de errores' }),
        el('p', { 'data-field': 'errors', text: 'Errores anotados: ' + p.errors.length }),
        el('p', { 'data-field': 'errors-gone', text: 'Ya no se repiten: ' + gone })]));
      return screen('progreso', 'Progreso', body);
    },
    ajustes: function () {
      // T031: marcar o desmarcar cada unidad de ucraniano como revisada (nativeCheck; sin nombres).
      var units = window.STUDY.units, nc = readProgress().nativeCheck;
      var body = [settingsMinutes(), settingsVoices(), settingsAudio(), el('h2', { text: 'Revisión del ucraniano' }),
        el('p', { 'class': 'muted', text: 'Marca una unidad cuando una hablante nativa la haya revisado.' })];
      Object.keys(units).filter(function (k) { return units[k].needsNativeCheck; }).sort().forEach(function (k) {
        var c = nc[k], ok = !!c && c.status === 'approved';
        body.push(el('div', { 'class': 'card', 'data-review-unit': k }, [
          el('h2', { text: units[k].title }), el('p', { 'class': 'muted', text: units[k].titleEs }),
          el('p', { 'class': ok ? 'ok' : 'muted', 'data-review': ok ? 'approved' : 'pending',
                    text: ok ? 'Revisada por hablante nativa ✓' : 'Pendiente de revisión' }),
          c && c.date ? el('p', { 'class': 'muted', 'data-review-date': k, text: 'Fecha del cambio: ' + localDay(c.date) }) : null,
          el('button', { 'data-review-toggle': k, text: ok ? 'Desmarcar' : 'Marcar como revisada por hablante nativa',
            onclick: function () {
              var p = readProgress();
              p.nativeCheck[k] = { status: ok ? 'pending' : 'approved', date: new Date().toISOString() };
              saveProgress(p);
              render();
            } })]));
      });
      body.push(settingsBackup());
      return screen('ajustes', 'Ajustes', body);
    }
  };

  // --- navegador: #/pantalla/parámetro -------------------------------------
  // --- cargador de contenido: valida window.STUDY (data-model.md) ----------
  var STRANDS = ['input', 'output', 'language', 'fluency'];
  var GRADED = ['choice', 'gap', 'order', 'match', 'translate'];
  var TYPES = ['pretest', 'read', 'listen', 'chunks', 'grammar', 'pairs', 'letters',
               'write', 'speak', 'task', 'fluency', 'shadow'].concat(GRADED);

  function validateContent(study) {
    var errs = [];
    function bad(where, msg) { errs.push(where + ': ' + msg); }
    function isStr(v) { return typeof v === 'string' && v.trim() !== ''; }
    function isNum(v) { return typeof v === 'number' && isFinite(v) && v >= 0; }
    function isArr(v) { return Array.isArray(v) && v.length > 0; }
    function itemList(where, list, actId, need) {
      if (!isArr(list)) { bad(where, 'falta la lista de ítems'); return; }
      list.forEach(function (it, i) {
        var w = where + ' ítem ' + (i + 1);
        if (!it || it.id !== actId + '-' + (i + 1)) bad(w, 'id debe ser ' + actId + '-' + (i + 1));
        need.forEach(function (f) { if (it && it[f] === undefined) bad(w, 'falta ' + f); });
      });
    }
    function answerShape(where, type, it) {
      var a = it.answer;
      var ok = {
        choice: function () { return isArr(it.options) && it.options.indexOf(a) >= 0; },
        gap: function () { return isStr(a) || (isArr(a) && a.every(isStr)); },
        order: function () { return isArr(a) && a.every(isStr); },
        match: function () { return a && typeof a === 'object' && !Array.isArray(a) && Object.keys(a).length > 0; },
        translate: function () { return isArr(a) && a.every(isStr); }
      }[type];
      if (ok && !ok()) bad(where, 'answer con forma incorrecta para ' + type);
    }
    function checkActivity(act, actId, unit) {
      var w = actId;
      if (!act || act.id !== actId) { bad(w, 'id de actividad incorrecto (' + (act && act.id) + ')'); if (!act) return; }
      if (TYPES.indexOf(act.type) < 0) bad(w, 'type desconocido: ' + act.type);
      if (STRANDS.indexOf(act.strand) < 0) bad(w, 'falta strand o no es válido');
      if (!isNum(act.minutes) || act.minutes <= 0) bad(w, 'falta minutes');
      var t = act.type;
      if (GRADED.indexOf(t) >= 0) {
        itemList(w, act.items, actId, ['prompt', 'answer', 'why']);
        (act.items || []).forEach(function (it, i) {
          if (!it) return;
          if (!isStr(it.why)) bad(w + ' ítem ' + (i + 1), 'falta why');
          answerShape(w + ' ítem ' + (i + 1), t, it);
        });
      } else if (t === 'pretest') {
        itemList(w, act.items, actId, ['word', 'image', 'options', 'answer']);
        (act.items || []).forEach(function (it, i) {
          if (it && !(isArr(it.options) && it.options.indexOf(it.answer) >= 0)) bad(w + ' ítem ' + (i + 1), 'answer no está en options');
        });
      } else if (t === 'read') {
        if (!isStr(act.text)) bad(w, 'falta text');
        if (!act.glossary || typeof act.glossary !== 'object') bad(w, 'falta glossary');
      } else if (t === 'listen') {
        if (!isArr(act.lines) || !act.lines.every(function (l) { return l && isStr(l.voice) && isStr(l.text); })) bad(w, 'lines mal formadas');
        // es (opcional): traducción al español de la línea, que se muestra al tocarla.
        if (isArr(act.lines) && !act.lines.every(function (l) { return !l || l.es === undefined || isStr(l.es); })) bad(w, 'es debe ser texto');
        itemList(w, act.questions, actId, ['q', 'options', 'answer', 'why']);
        (act.questions || []).forEach(function (q, i) {
          if (!q) return;
          if (!isStr(q.why)) bad(w + ' pregunta ' + (i + 1), 'falta why');
          answerShape(w + ' pregunta ' + (i + 1), 'choice', q);
        });
      } else if (t === 'chunks') {
        if (!isArr(act.cards)) bad(w, 'falta cards');
        (act.cards || []).forEach(function (cid) {
          var c = (unit.cards || []).filter(function (x) { return x.id === cid; })[0];
          if (!c) bad(w, 'la tarjeta ' + cid + ' no está en la unidad');
        });
      } else if (t === 'grammar') {
        if (!isStr(act.explanation)) bad(w, 'falta explanation');
        if (!isArr(act.examples)) bad(w, 'falta examples');
      } else if (t === 'pairs') {
        itemList(w, act.pairs, actId, ['a', 'b', 'answer', 'why']);
        (act.pairs || []).forEach(function (pr, i) {
          if (!pr) return;
          if (pr.answer !== 'a' && pr.answer !== 'b') bad(w + ' par ' + (i + 1), 'answer debe ser "a" o "b"');
          if (!isStr(pr.why)) bad(w + ' par ' + (i + 1), 'falta why');
        });
        if (!isArr(act.voices)) bad(w, 'falta voices');
      } else if (t === 'letters') {
        if (!isArr(act.letters) || !act.letters.every(function (l) {
          return l && isStr(l.id) && isStr(l.letter) && isStr(l.soundEs) && isStr(l.word) && isStr(l.wordEs); }))
          bad(w, 'letters mal formadas');
        itemList(w, act.quiz, actId, ['prompt', 'options', 'answer', 'why']);
        (act.quiz || []).forEach(function (q, i) {
          if (!q) return;
          if (!isStr(q.why)) bad(w + ' quiz ' + (i + 1), 'falta why');
          answerShape(w + ' quiz ' + (i + 1), 'choice', q);
        });
      } else if (t === 'write') {
        if (!isStr(act.prompt)) bad(w, 'falta prompt');
        if (!isNum(act.minWords)) bad(w, 'falta minWords');
      } else if (t === 'speak') {
        if (!isStr(act.prompt)) bad(w, 'falta prompt');
        if (!isNum(act.prepSeconds) || !isNum(act.speakSeconds)) bad(w, 'faltan prepSeconds o speakSeconds');
      } else if (t === 'task') {
        if (!isStr(act.prompt)) bad(w, 'falta prompt');
      } else if (t === 'fluency') {
        if (['432', 'reread', 'write10'].indexOf(act.mode) < 0) bad(w, 'mode no válido');
        if (!isStr(act.prompt) && !isStr(act.text)) bad(w, 'falta prompt o text');
      } else if (t === 'shadow') {
        if (!isArr(act.lines) || !act.lines.every(function (l) { return l && isStr(l.voice) && isStr(l.text); })) bad(w, 'lines mal formadas');
      }
    }

    Object.keys(study.units || {}).forEach(function (key) {
      var u = study.units[key];
      if (!u || u.id !== key) { bad(key, 'el id de la unidad no coincide'); if (!u) return; }
      if (!/^(en|uk)-[a-c][12]-\d{2}$/.test(key)) bad(key, 'id de unidad no válido');
      if (!isStr(u.title) || !isStr(u.titleEs)) bad(key, 'falta title o titleEs');
      if (key.indexOf('uk-') === 0 && u.needsNativeCheck !== true) bad(key, 'falta needsNativeCheck: true');
      (u.cards || []).forEach(function (c, i) {
        if (!c || !/^.+-c\d{2}$/.test(c.id) || c.id.indexOf(key + '-c') !== 0) bad(key, 'id de tarjeta ' + (i + 1) + ' no válido');
        else if (!isStr(c.front) || !isStr(c.back) || !isStr(c.lang)) bad(c.id, 'falta front, back o lang');
      });
      if (!isArr(u.lessons)) { bad(key, 'no tiene lecciones'); return; }
      u.lessons.forEach(function (l, li) {
        var lid = key + '-l' + (li + 1);
        if (!l || l.id !== lid) { bad(lid, 'id de lección incorrecto'); if (!l) return; }
        if (!isArr(l.activities)) { bad(lid, 'no tiene actividades'); return; }
        l.activities.forEach(function (a, ai) {
          checkActivity(a, lid + '-a' + String(ai + 1).padStart(2, '0'), u);
        });
      });
    });

    Object.keys(study.ielts || {}).forEach(function (key) {
      var p = study.ielts[key];
      if (!p || p.id !== key) { bad(key, 'el id de la práctica no coincide'); if (!p) return; }
      if (!/^gt-(listening|reading|writing|speaking)-[a-z0-9]+-\d{2}$/.test(key)) bad(key, 'id de práctica no válido');
      if (['listening', 'reading', 'writing', 'speaking'].indexOf(p.part) < 0) bad(key, 'part no válido');
      if (!isNum(p.minutes) || p.minutes <= 0) bad(key, 'falta minutes');
      if (p.part === 'reading' || p.part === 'listening') {
        if (['short', 'full'].indexOf(p.kind) < 0) bad(key, 'kind debe ser short o full');
        var n = p.kind === 'full' ? 40 : 10;
        if (!Array.isArray(p.questions) || p.questions.length !== n) bad(key, 'debe tener exactamente ' + n + ' preguntas');
        (p.questions || []).forEach(function (q, i) {
          var w = key + ' pregunta ' + (i + 1);
          if (!q || !isStr(q.id)) { bad(w, 'falta id'); return; }
          if (['tfng', 'complete', 'choice'].indexOf(q.type) < 0) bad(w, 'type no válido');
          if (!isStr(q.q)) bad(w, 'falta q');
          if (q.answer === undefined) bad(w, 'falta answer');
          if (!isStr(q.why)) bad(w, 'falta why');
          if (q.type === 'choice' || q.type === 'tfng') answerShape(w, 'choice', q);
          if (q.type === 'complete') answerShape(w, 'gap', q);
        });
      }
      if (p.part === 'writing') {
        if (!isArr(p.tasks)) bad(key, 'falta tasks');
        (p.tasks || []).forEach(function (t, i) {
          if (!t || [1, 2].indexOf(t.n) < 0 || !isStr(t.prompt) || !isArr(t.bullets) || !isNum(t.minWords) || !isNum(t.minutes))
            bad(key + ' tarea ' + (i + 1), 'falta n, prompt, bullets, minWords o minutes');
          if (t && t.begin !== undefined && !isStr(t.begin)) bad(key + ' tarea ' + (i + 1), 'begin debe ser texto');
        });
      }
    });
    return errs;
  }
  window.__study.validateContent = validateContent;

  var contentErrors = validateContent(window.STUDY || {});
  if (contentErrors.length) console.error('Contenido con errores:\n' + contentErrors.join('\n'));

  function errorScreen() {
    var s = el('section', { 'data-screen': 'error' }, [
      el('h1', { text: 'El contenido tiene errores' }),
      el('p', { text: 'La app no puede abrir las lecciones hasta corregir esto:' })
    ]);
    contentErrors.forEach(function (e) { s.appendChild(el('p', { 'class': 'card bad', text: e })); });
    return s;
  }

  function render() {
    runCleanups();
    if (contentErrors.length) { app.replaceChildren(errorScreen()); return; }
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var name = screens[parts[0]] ? parts[0] : 'inicio';
    app.replaceChildren(screens[name](parts[1]));
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', render);
  render();
})();
