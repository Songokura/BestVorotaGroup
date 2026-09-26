/* ============================================================
   BEST VOROTA GROUP - скрипт страницы.
   Плиты и сварка кадра (герой и фото-плиты) · перевод RU/KZ/EN
   (словари kk и en грузятся по кнопке из assets/lang/) · меню · бегущая
   лента · ленты каталога со стрелками · WhatsApp с готовым текстом ·
   форма в WhatsApp · видео: петли по видимости, отзывы в модалке.
   Библиотек нет.
   ============================================================ */
(function(){
"use strict";
var WA = "77009517425";              /* для wa.me */

var RED = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("no-plate"); /* no-plate - плоская копия для съёмки */
var HAS_IO = typeof IntersectionObserver === "function";
var root = document.documentElement;

/* ---------------- КОНВЕРСИИ GOOGLE ADS ----------------
   Ярлыки задаёт index.html (window.BVG_CONV): phone, contact, lead. Пусто - не шлём. */
function conv(key){
  var id = (window.BVG_CONV || {})[key];
  if (!id || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {send_to: id, value: 1.0, currency: "USD", transport_type: "beacon"});
}
document.addEventListener("click", function(e){
  var a = e.target.closest ? e.target.closest("a[href]") : null;
  if (!a) return;
  var h = a.getAttribute("href") || "";
  if (h.indexOf("tel:") === 0) conv("phone");
  else if (h.indexOf("wa.me") > -1) conv("contact");
}, true);

/* ---------------- СЛОВАРИ ----------------
   Казахский и английский лежат в assets/lang/kk.js и assets/lang/en.js и грузятся только
   по выбору языка (или ?lang= / сохранённый выбор). В разметке и здесь казахского текста нет -
   проверка Google Ads видит русский сайт. */
var ASSET_V = ((document.currentScript && document.currentScript.src.match(/[?&]v=([^&]+)/)) || [])[1] || "";
var LANGS = {};                      /* lang -> {dict, wa, t, tick, form} */
function loadLang(lang, done){
  if (lang === "ru" || LANGS[lang]) return done();
  var s = document.createElement("script");
  s.src = "assets/lang/" + lang + ".js" + (ASSET_V ? "?v=" + ASSET_V : "");
  s.onload = function(){
    var pack = lang === "kk" ? window.SITE_KK : window.SITE_EN;
    if (pack) LANGS[lang] = pack;
    done();
  };
  s.onerror = function(){ done(); };
  document.head.appendChild(s);
}
function pack(){ var l = curLang(); return LANGS[l] || null; }

var WA_RU = {
  hero:"Здравствуйте! Хочу рассчитать стоимость.\nЧто нужно: ",
  svc:"Здравствуйте! Интересует: {t}.\nГород и размеры: ",
  card:"Здравствуйте! Интересует: {t}.\nГород и размеры: ",
  model:"Здравствуйте! Интересуют {t}, модель {m}.\nГород и размеры проёма: ",
  kontakty:"Здравствуйте! Пишу с сайта Best Vorota Group. Вопрос: "
};
var TICK_RU = ["Откатные ворота","Распашные ворота","Автоматические ворота","Кованые ворота","Навесы","Навесы хай-тек","Заборы и ограждения","Перила","Козырьки","Металлоконструкции","Астана","Актобе"];
var FORM_RU = {hello:"Здравствуйте! Заявка на замер с сайта Best Vorota Group.", name:"Имя", city:"Город", what:"Что нужно", phone:"Телефон", msg:"Комментарий", none:"не выбрано"};

/* ---------------- ПЕРЕВОД ---------------- */
var RU = {};
function snapshot(){
  document.querySelectorAll("[data-i]").forEach(function(el){ if (RU[el.dataset.i] === undefined) RU[el.dataset.i] = el.innerHTML; });
  document.querySelectorAll("[data-i-alt]").forEach(function(el){ RU[el.dataset.iAlt] = el.alt; });
  document.querySelectorAll("[data-i-aria]").forEach(function(el){ if (RU[el.dataset.iAria] === undefined) RU[el.dataset.iAria] = el.getAttribute("aria-label"); });
  document.querySelectorAll("[data-i-c]").forEach(function(el){ RU[el.dataset.iC] = el.getAttribute("content"); });
  document.querySelectorAll("[data-i-ph]").forEach(function(el){ RU[el.dataset.iPh] = el.getAttribute("placeholder"); });
  var t = document.querySelector("title[data-i-t]"); if (t) RU[t.dataset.iT] = t.textContent;
}
function curLang(){ return root.lang === "kk" ? "kk" : (root.lang === "en" ? "en" : "ru"); }
function pick(k, d){ return (d && d[k] !== undefined) ? d[k] : RU[k]; }

/* ссылки WhatsApp собираются заранее (при смене языка), а не в момент клика -
   так трекер LeadBot спокойно дописывает код обращения в href */
function setWaLinks(){
  var p = pack(), W = (p && p.wa) || WA_RU;
  document.querySelectorAll("[data-wa]").forEach(function(a){
    var key = a.dataset.wa, t = W[key] || W.hero;
    if (t.indexOf("{t}") > -1) {
      var name = a.dataset.t || "";
      if (name && p && p.t && p.t[name]) name = p.t[name];
      t = t.replace("{t}", name);
    }
    if (t.indexOf("{m}") > -1) {
      var box = a.closest(".gc"), h = box ? box.querySelector("h4 span") : null;
      var m = (a.dataset.m || "") + (h ? " «" + h.textContent.trim() + "»" : "");
      var cb = document.querySelector(".cat-city button.is-active");
      if (cb) m += ", " + cb.textContent.trim();          /* каталог какого города смотрел человек */
      t = t.replace("{m}", m);
    }
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t);
    a.target = "_blank"; a.rel = "noopener";
  });
  calcUpdate();
}

/* ---------------- ГОРОД КАТАЛОГА ----------------
   У Астаны и Актобе свои прайсы (разные PDF-каталоги клиента, фото и номера моделей общие).
   Цены обоих городов лежат в data-ast / data-akt у каждой карточки. ?city=akt в URL сильнее
   сохранённого выбора - так объявление на Актобе сразу открывает актюбинские цены. */
function fmtPrice(v){ return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0"); }
function setCity(city){
  if (city !== "akt") city = "ast";
  document.querySelectorAll(".pr[data-" + city + "]").forEach(function(b){ b.textContent = fmtPrice(b.getAttribute("data-" + city)); });
  document.querySelectorAll(".cat-city button").forEach(function(b){
    var on = b.getAttribute("data-city") === city;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  try { localStorage.setItem("bvg-city", city); } catch(e){}
  setWaLinks();
}
document.querySelectorAll(".cat-city button").forEach(function(b){
  b.addEventListener("click", function(){ setCity(b.getAttribute("data-city")); });
});
function initCity(){
  var url = new URLSearchParams(location.search).get("city"), saved = null;
  try { saved = localStorage.getItem("bvg-city"); } catch(e){}
  setCity(url === "akt" || url === "ast" ? url : saved);
}

/* ---------------- КАЛЬКУЛЯТОР НАВЕСА ----------------
   Клиент выбирает форму, размеры, кровлю, цвет и опции - схема перерисовывается сразу,
   а все параметры уходят готовым текстом в WhatsApp. Цены за м² по городам клиент ещё
   не прислал, поэтому стоимость считает менеджер (см. _project/chat-log.md). */
var calc = document.querySelector(".calc");
function calcUpdate(){}
if (calc) (function(){
  var svg = document.getElementById("cv-svg"), NS = "http://www.w3.org/2000/svg";
  var iW = document.getElementById("c-w"), iL = document.getElementById("c-l"), iH = document.getElementById("c-h");
  var CALC_RU = {"nc.wa":"Здравствуйте! Расчёт навеса с сайта Best Vorota Group."};
  var ROOF = {pc:{f:"#F0A23A", o:.62, s:"#C9771C"}, pl:{f:"#5B636C", o:1, s:"#3A4047"}, mt:{f:"#7A2E22", o:1, s:"#4E1B14"}};
  function on(sel){ var b = calc.querySelector(sel + " .is-on"); return b ? b.getAttribute("data-v") : ""; }
  function lbl(sel){ var b = calc.querySelector(sel + " .is-on"); return b ? b.textContent.trim() : ""; }
  function num(v){ var s = String(Math.round(v * 10) / 10); return curLang() === "en" ? s : s.replace(".", ","); }
  function el(n, a, p){ var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }

  /* верх профиля навеса в сечении: точки [x, y] в метрах, x от 0 до ширины */
  function profile(type, W, H){
    var pts = [], i, t, n = 24;
    for (i = 0; i <= n; i++) {
      t = i / n; var x = t * W, y;
      if (type === "arch") y = H + W * .24 * Math.sin(Math.PI * t);
      else if (type === "mono") y = H + W * .14 * (1 - t);
      else if (type === "gable") y = H + W * .24 * (1 - Math.abs(2 * t - 1));
      else if (type === "semi") y = H + W * .3 * Math.cos(t * Math.PI / 2) * (1 - .25 * t);
      else y = H + .32;
      pts.push([x, y]);
    }
    return pts;
  }
  function draw(){
    var W = +iW.value, L = +iL.value, H = +iH.value, type = on(".ctype"), roof = ROOF[on('[data-k="roof"]')] || ROOF.pc;
    var col = on('[data-k="col"]') || "#4A2E22";
    var ex = {}; calc.querySelectorAll(".cchk input").forEach(function(c){ ex[c.value] = c.checked; });
    if (type === "flat") roof = {f:col, o:1, s:col};
    var top = profile(type, W, H), maxY = 0; top.forEach(function(p){ if (p[1] > maxY) maxY = p[1]; });
    /* косоугольная проекция: z (длина) уходит вправо-вверх */
    var kx = .62, ky = .36;
    var bw = W + L * kx, bh = maxY + L * ky;
    var s = Math.min(420 / bw, 240 / bh), ox = 50 + (420 - bw * s) / 2, oy = 290 - (240 - bh * s) / 2 + 4;
    function P(x, y, z){ return [ox + s * (x + z * kx), oy - s * (y + z * ky)]; }
    function pts(a){ return a.map(function(p){ return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var sw = Math.max(1.6, Math.min(4, s * .09)), frame = {stroke:col, "stroke-width":sw, fill:"none", "stroke-linecap":"round", "stroke-linejoin":"round"};
    var edge = col === "#E9E7E2" ? "#8C9096" : "none";
    /* площадка */
    el("polygon", {points:pts([P(-.4,0,-.4),P(W+.4,0,-.4),P(W+.4,0,L+.4),P(-.4,0,L+.4)]), fill:"#C9C6BF"});
    el("polygon", {points:pts([P(0,0,0),P(W,0,0),P(W,0,L),P(0,0,L)]), fill:"#B3AFA7"});
    /* стена дома у левого края */
    if (ex.wall) el("polygon", {points:pts([P(0,0,-.2),P(0,maxY+.5,-.2),P(0,maxY+.5,L+.2),P(0,0,L+.2)]), fill:"#C98F74", stroke:"#A06A52", "stroke-width":1});
    /* столбы: шаг не больше 3 м */
    var nz = Math.max(1, Math.ceil(L / 3)), zs = []; for (var i = 0; i <= nz; i++) zs.push(L * i / nz);
    function postY(x){ var p = top[x ? top.length - 1 : 0]; return type === "flat" ? H : p[1] - (type === "arch" || type === "gable" ? 0 : 0); }
    var xs = ex.wall ? [W] : [0, W];
    zs.slice().reverse().forEach(function(z){
      xs.forEach(function(x){ var a = P(x, 0, z), b = P(x, postY(x), z); el("line", {x1:a[0], y1:a[1], x2:b[0], y2:b[1], stroke:col, "stroke-width":sw * 1.5, "stroke-linecap":"round", opacity: z === 0 ? 1 : .8}); });
    });
    /* кровля: полосы между соседними точками профиля по всей длине */
    for (i = top.length - 1; i > 0; i--) {
      var a = top[i - 1], b = top[i];
      el("polygon", {points:pts([P(a[0],a[1],0),P(b[0],b[1],0),P(b[0],b[1],L),P(a[0],a[1],L)]), fill:roof.f, "fill-opacity":roof.o, stroke:roof.s, "stroke-width":.4, "stroke-opacity":.5});
    }
    if (type === "flat") {
      el("polygon", {points:pts([P(0,H,0),P(W,H,0),P(W,H+.32,0),P(0,H+.32,0)]), fill:col, stroke:edge, "stroke-width":1});
      el("polygon", {points:pts([P(W,H,0),P(W,H,L),P(W,H+.32,L),P(W,H+.32,0)]), fill:col, "fill-opacity":.85, stroke:edge, "stroke-width":1});
    }
    /* фермы: профиль через каждые ~1,5 м */
    var nf = Math.max(2, Math.round(L / 1.5));
    for (i = nf; i >= 0; i--) {
      var z = L * i / nf, line = top.map(function(p){ return P(p[0], p[1], z); });
      el("polyline", Object.assign({points:pts(line), opacity: i ? .55 : 1}, frame));
      if (type !== "flat") el("line", {x1:P(0,postY(0),z)[0], y1:P(0,postY(0),z)[1], x2:P(W,postY(1),z)[0], y2:P(W,postY(1),z)[1], stroke:col, "stroke-width":sw * .7, opacity: i ? .45 : .9});
    }
    /* ковка: завитки по передней ферме */
    if (ex.kov && type !== "flat") {
      for (i = 1; i < 6; i++) {
        var t = i / 6, pt = top[Math.round(t * (top.length - 1))], c1 = P(pt[0], (pt[1] + postY(t > .5 ? 1 : 0)) / 2, 0), r = Math.max(4, s * .16);
        el("path", {d:"M" + (c1[0] - r) + "," + c1[1] + "a" + r + "," + r + " 0 1,1 " + r + "," + r + "a" + (r / 2) + "," + (r / 2) + " 0 1,1 " + (r / 2) + ",-" + (r / 2), fill:"none", stroke:"#D9B35B", "stroke-width":1.6});
      }
    }
    /* водосток по нижней кромке и труба */
    if (ex.drain) {
      var gx = W, gy = top[top.length - 1][1];
      var g1 = P(gx, gy, 0), g2 = P(gx, gy, L), g3 = P(gx, 0, 0);
      el("line", {x1:g1[0], y1:g1[1], x2:g2[0], y2:g2[1], stroke:"#2F3439", "stroke-width":sw * 1.3});
      el("line", {x1:g1[0] + 5, y1:g1[1], x2:g3[0] + 5, y2:g3[1], stroke:"#2F3439", "stroke-width":sw});
    }
    /* подсветка: тёплые точки под передней балкой */
    if (ex.light) for (i = 1; i < 6; i++) {
      var lp = P(W * i / 6, H - .08, L * .15); el("circle", {cx:lp[0], cy:lp[1] + 3, r:3.2, fill:"#FFE6A8"}); el("circle", {cx:lp[0], cy:lp[1] + 3, r:9, fill:"#FFD27A", opacity:.35});
    }
    /* размеры */
    var m = document.querySelector('[data-i="nc.m"]'), mu = m ? m.textContent : "м";
    function dim(a, b, text, dx, dy){
      el("line", {x1:a[0] + dx, y1:a[1] + dy, x2:b[0] + dx, y2:b[1] + dy, stroke:"#3C4148", "stroke-width":1, "stroke-dasharray":"4 3"});
      var tx = el("text", {x:(a[0] + b[0]) / 2 + dx, y:(a[1] + b[1]) / 2 + dy + (dy > 0 ? 14 : -6), "text-anchor":"middle", fill:"#23272C", "font-size":13, "font-weight":700, "font-family":"Golos Text,Segoe UI,sans-serif"}); tx.textContent = text;
    }
    dim(P(0,0,0), P(W,0,0), num(W) + " " + mu, 0, 12);
    dim(P(W,0,0), P(W,0,L), num(L) + " " + mu, 14, 8);
    var hl = el("text", {x:P(0,H/2,0)[0] - 10, y:P(0,H/2,0)[1], "text-anchor":"end", fill:"#23272C", "font-size":13, "font-weight":700, "font-family":"Golos Text,Segoe UI,sans-serif"}); hl.textContent = "h " + num(H) + " " + mu;
    /* итог */
    document.getElementById("o-w").textContent = num(W);
    document.getElementById("o-l").textContent = num(L);
    document.getElementById("o-h").textContent = num(H);
    document.getElementById("o-area").textContent = num(W * L);
    document.getElementById("o-size").textContent = num(W) + " × " + num(L) + " " + mu;
    /* текст заявки */
    var p = pack(), d = p ? p.dict : {}, T = function(k){ return pick(k, d) || CALC_RU[k] || ""; };
    var cb = calc.querySelector(".cat-city .is-active");
    var extra = []; calc.querySelectorAll(".cchk input:checked").forEach(function(c){ extra.push(c.nextElementSibling.textContent.trim()); });
    var msg = T("nc.wa") + "\n" +
      T("nc.city") + ": " + (cb ? cb.textContent.trim() : "") + "\n" +
      T("nc.type") + ": " + lbl(".ctype") + "\n" +
      T("nc.size") + ": " + num(W) + " × " + num(L) + " " + mu + " (" + num(W * L) + " " + mu + "²), " + T("nc.h").toLowerCase() + " " + num(H) + " " + mu + "\n" +
      T("nc.roof") + ": " + lbl('[data-k="roof"]') + "\n" +
      T("nc.col") + ": " + lbl('[data-k="col"]') +
      (extra.length ? "\n" + T("nc.ext") + ": " + extra.join(", ") : "");
    var go = document.getElementById("calc-go");
    go.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
  }
  calcUpdate = draw;
  function radio(group){
    group.querySelectorAll("button").forEach(function(b){
      b.addEventListener("click", function(){
        group.querySelectorAll("button").forEach(function(x){ var o = x === b; x.classList.toggle("is-on", o); x.setAttribute("aria-checked", o ? "true" : "false"); });
        draw();
      });
    });
  }
  calc.querySelectorAll(".ctype,.cseg").forEach(radio);
  [iW, iL, iH].forEach(function(i){ i.addEventListener("input", draw); });
  calc.querySelectorAll(".cchk input").forEach(function(c){ c.addEventListener("change", draw); });
  draw();
})();

function applyLang(lang){
  var d = LANGS[lang] ? LANGS[lang].dict : null;
  if (lang !== "ru" && !d) lang = "ru";
  root.setAttribute("lang", lang);
  document.querySelectorAll("[data-i]").forEach(function(el){
    var v = pick(el.dataset.i, d); if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll("[data-i-alt]").forEach(function(el){
    var v = pick(el.dataset.iAlt, d); if (v !== undefined) el.alt = v;
  });
  document.querySelectorAll("[data-i-aria]").forEach(function(el){
    var v = pick(el.dataset.iAria, d); if (v !== undefined) el.setAttribute("aria-label", v);
  });
  document.querySelectorAll("[data-i-c]").forEach(function(el){
    var v = pick(el.dataset.iC, d); if (v !== undefined) el.setAttribute("content", v);
  });
  document.querySelectorAll("[data-i-ph]").forEach(function(el){
    var v = pick(el.dataset.iPh, d); if (v !== undefined) el.setAttribute("placeholder", v);
  });
  var t = document.querySelector("title[data-i-t]");
  if (t) { var tv = pick(t.dataset.iT, d); if (tv !== undefined) t.textContent = tv; }
  var og = document.querySelector('meta[property="og:locale"]');
  if (og) og.setAttribute("content", lang === "kk" ? "kk_KZ" : (lang === "en" ? "en_US" : "ru_RU"));
  document.querySelectorAll(".lang button").forEach(function(b){
    var on = b.getAttribute("data-lang") === lang;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  try { localStorage.setItem("bvg-lang", lang); } catch(e){}
  setWaLinks();
  fillTicker();
  fitText();
  requestAnimationFrame(fitText);
}
/* ?lang= в URL сильнее localStorage: русское объявление не должно открыть казахскую версию.
   Язык по navigator.language не угадываем - казахский и английский только явным выбором. */
function initLang(){
  var url = new URLSearchParams(location.search).get("lang");
  var saved = null;
  try { saved = localStorage.getItem("bvg-lang"); } catch(e){}
  var lang = (url === "kk" || url === "ru" || url === "en") ? url : ((saved === "kk" || saved === "en") ? saved : "ru");
  setLang(lang);
}
function setLang(lang){
  if (lang === "kk" || lang === "en") loadLang(lang, function(){ applyLang(lang); });
  else applyLang("ru");
}
document.querySelectorAll(".lang button").forEach(function(b){
  b.addEventListener("click", function(){ setLang(b.getAttribute("data-lang")); });
});

/* дисплейные строки: казахский длиннее - ужимаем, пока не влезет */
function fitText(){
  document.querySelectorAll(".h1 span, .kphone").forEach(function(el){
    el.style.fontSize = "";
    var box = el.parentElement.clientWidth;
    if (!box) return;
    var size = parseFloat(getComputedStyle(el).fontSize), base = size;
    while (el.scrollWidth > box + 1 && size > base * 0.5) {
      size *= 0.95;
      el.style.fontSize = size + "px";
    }
  });
}

/* ---------------- БЕГУЩАЯ СТРОКА ---------------- */
function fillRow(el, list, speed){
  if (!el) return;
  var one = list.map(function(t){ return "<b>" + t + "</b>"; }).join("");
  el.innerHTML = one;
  var w = el.scrollWidth || 1000;
  var need = Math.max(2, Math.ceil((innerWidth * 2) / w) + 1);
  var html = "";
  for (var i = 0; i < need; i++) html += one;
  el.innerHTML = html;
  el.style.setProperty("--tkw", w + "px");
  el.style.setProperty("--tkd", Math.max(14, w / speed) + "s");
}
function fillTicker(){
  var p = pack();
  fillRow(document.getElementById("ticker"), (p && p.tick) || TICK_RU, 46);
}
var rsTimer;
addEventListener("resize", function(){ clearTimeout(rsTimer); rsTimer = setTimeout(function(){ fillTicker(); fitText(); laneStates(); }, 200); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fillTicker(); fitText(); });

/* ---------------- МЕНЮ ---------------- */
var burger = document.getElementById("burger");
var mnav = document.getElementById("mnav");
function closeMenu(){
  document.body.classList.remove("menu-open");
  if (burger) burger.setAttribute("aria-expanded", "false");
}
if (burger) burger.addEventListener("click", function(){
  var open = document.body.classList.toggle("menu-open");
  burger.setAttribute("aria-expanded", open ? "true" : "false");
});
if (mnav) mnav.addEventListener("click", function(e){ if (e.target.closest("a")) closeMenu(); });
addEventListener("keydown", function(e){ if (e.key === "Escape") { closeMenu(); closeModal(); } });

/* ---------------- ЯКОРЯ ----------------
   Плиты (.pw) встают на верх экрана, обычные секции и карточки - под шапку. */
var HH = function(){ return parseFloat(getComputedStyle(root).getPropertyValue("--hh")) || 70; };
function goTo(id, smooth){
  var t = document.getElementById(id); if (!t) return false;
  var top = t.getBoundingClientRect().top + scrollY - (t.classList.contains("pw") ? 0 : HH() + 12);
  if (!smooth) root.style.scrollBehavior = "auto";
  scrollTo({ top: Math.max(0, top), behavior: (smooth && !RED) ? "smooth" : "auto" });
  if (!smooth) setTimeout(function(){ root.style.scrollBehavior = ""; }, 50);
  return true;
}
document.addEventListener("click", function(e){
  var a = e.target.closest('a[href^="#"]'); if (!a) return;
  var id = a.getAttribute("href").slice(1); if (!id) return;
  if (!document.getElementById(id)) return;
  e.preventDefault();
  closeMenu();
  goTo(id, true);
  try { history.pushState(null, "", "#" + id); } catch(err){}
});

/* ---------------- ШАПКА ---------------- */
var hdr = document.getElementById("hdr");
function hdrState(){ if (hdr) hdr.classList.toggle("solid", scrollY > 40); }

/* ---------------- ПЛИТЫ И СВАРКА ----------------
   Один слушатель scroll через rAF. На каждую .pw пишем --enter/--exit/--stay и --open.
   Сварка: --fill (0..1, четыре ряда серпантином) и позиция искры --wr (ряд), --wx (доля ширины),
   --wd (направление), --wv (видимость). Герой варится на интро по --f, остальные - по --open. */
function clamp(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
function easeOut(t){ return 1 - Math.pow(1 - t, 2.4); }
var heroPw = document.getElementById("top");
var hero = document.getElementById("hero");
var pws = [].slice.call(document.querySelectorAll(".pw"));
var bar = document.getElementById("bar");
var kont = document.getElementById("kontakty");
var introK = 1, introDone = true;
var ROWS = 4;
function weld(pw, raw){
  var fill = clamp(raw / 0.9);
  var k = fill * ROWS, row = Math.min(ROWS - 1, Math.floor(k)), frac = k - row;
  if (fill >= 1) frac = 1;
  var dir = (row % 2 === 0) ? 1 : -1;
  var x = dir > 0 ? frac : 1 - frac;
  pw.style.setProperty("--fill", fill.toFixed(4));
  pw.style.setProperty("--fade", clamp(raw).toFixed(4));
  pw.style.setProperty("--wr", row);
  pw.style.setProperty("--wx", x.toFixed(4));
  pw.style.setProperty("--wd", dir);
  pw.style.setProperty("--wv", (fill > 0.005 && fill < 0.995) ? 1 : 0);
}
function update(){
  var H = innerHeight || root.clientHeight;
  pws.forEach(function(pw){
    var r = pw.getBoundingClientRect();
    var enter = clamp(1 - r.top / H);
    var exit  = clamp(1 - r.bottom / H);
    var stay  = r.height > H + 1 ? clamp(-r.top / (r.height - H)) : enter;
    var open  = pw === heroPw ? 1 : easeOut(clamp((enter - .34) / .62));
    pw.style.setProperty("--enter", enter.toFixed(3));
    pw.style.setProperty("--exit",  exit.toFixed(3));
    pw.style.setProperty("--stay",  stay.toFixed(3));
    pw.style.setProperty("--open",  open.toFixed(3));
    pw.classList.toggle("gone", exit >= 0.999);
    pw.classList.toggle("on", enter > 0.6);
    if (pw === heroPw) { var f = easeOut(introK); pw.style.setProperty("--f", f.toFixed(3)); weld(pw, f); }
    else weld(pw, open);
  });
  hdrState();
  if (bar) {
    var onKont = kont && kont.getBoundingClientRect().top < H * 0.6;
    bar.classList.toggle("show", scrollY > H * 0.55 && !onKont);
  }
}
if (RED) {
  root.classList.add("no-plate");
  root.classList.add("no-intro");
  if (hero) hero.classList.add("on");
  pws.forEach(function(pw){ pw.classList.add("on"); weld(pw, 1); });
  addEventListener("scroll", function(){ hdrState(); if (bar) bar.classList.toggle("show", scrollY > innerHeight * 0.55); }, {passive:true});
  hdrState();
} else {
  var tick = false;
  addEventListener("scroll", function(){
    if (tick) return; tick = true;
    requestAnimationFrame(function(){ tick = false; update(); });
  }, {passive:true});
  addEventListener("resize", update);
  addEventListener("load", update);
  /* интро 1400 мс: кадр вваривается в створку рядами, текст поднимается.
     Пропускаем при хэше / прокрутке - человек из рекламы сразу видит собранный экран. */
  var skip = location.hash || scrollY > 80;
  if (skip) {
    root.classList.add("no-intro");
    if (hero) hero.classList.add("on");
    update();
  } else {
    introK = 0; introDone = false; update();
    var t0 = null;
    var step = function(ts){
      if (introDone) return;
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / 1400);
      introK = p;
      update();
      if (p < 1) requestAnimationFrame(step);
      else introDone = true;
    };
    requestAnimationFrame(function(){ requestAnimationFrame(step); });
    setTimeout(function(){ if (hero) hero.classList.add("on"); }, 420);
    setTimeout(function(){ if (!introDone) { introDone = true; introK = 1; update(); } }, 2000);
  }
}
window.plateSync = function(){ introDone = true; introK = 1; if (hero) hero.classList.add("on"); update(); };
addEventListener("hashchange", function(){
  root.classList.add("no-intro");
  var id = location.hash.slice(1); if (!id || !document.getElementById(id)) return;
  goTo(id, false);
  setTimeout(function(){ goTo(id, false); }, 420);
});

/* ---------------- ВИДЕО-ПЕТЛИ ----------------
   Герой играет сразу (muted autoplay). Петля навеса грузится, когда её плита подходит к экрану,
   и ставится на паузу, когда плита ушла - телефон не греется. */
var heroV = document.querySelector(".hero-v");
if (heroV) { var pr = heroV.play(); if (pr && pr.catch) pr.catch(function(){}); }
var loops = [].slice.call(document.querySelectorAll("video.loop-v"));
if (HAS_IO && loops.length) {
  var vio = new IntersectionObserver(function(es){
    es.forEach(function(e){
      var v = e.target;
      if (e.isIntersecting) {
        if (!v.getAttribute("src") && v.dataset.src) { v.src = v.dataset.src; v.load(); }
        var p = v.play(); if (p && p.catch) p.catch(function(){});
      } else if (!v.paused) v.pause();
    });
  }, {rootMargin:"40% 0px 40% 0px", threshold:0});
  loops.forEach(function(v){ vio.observe(v); });
}

/* ---------------- ПОЯВЛЕНИЕ В КАТАЛОЖНЫХ СЕКЦИЯХ ---------------- */
if (HAS_IO) {
  if (!RED) root.classList.add("js");
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold:.08, rootMargin:"0px 0px -5% 0px"});
  document.querySelectorAll(".rv").forEach(function(el){ io.observe(el); });
  setTimeout(function(){ document.querySelectorAll(".rv:not(.in)").forEach(function(el){
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in");
  }); }, 1500);
} else {
  document.querySelectorAll(".rv").forEach(function(el){ el.classList.add("in"); });
}

/* ---------------- ЛЕНТЫ КАТАЛОГА: стрелки листают ровно одну карточку ---------------- */
var lanes = [].slice.call(document.querySelectorAll(".lane"));
function laneStep(lane){
  var li = lane.querySelector("li"); if (!li) return 300;
  var gap = parseFloat(getComputedStyle(lane).columnGap || getComputedStyle(lane).gap) || 0;
  return li.getBoundingClientRect().width + gap;
}
function laneState(lane){
  var prev = document.querySelector('[data-prev="' + lane.id + '"]'), next = document.querySelector('[data-next="' + lane.id + '"]');
  if (!prev || !next) return;
  var max = lane.scrollWidth - lane.clientWidth;
  var none = max <= 1;
  prev.hidden = none; next.hidden = none;
  prev.disabled = lane.scrollLeft <= 1;
  next.disabled = lane.scrollLeft >= max - 1;
}
function laneStates(){ lanes.forEach(laneState); }
lanes.forEach(function(lane){
  var prev = document.querySelector('[data-prev="' + lane.id + '"]'), next = document.querySelector('[data-next="' + lane.id + '"]');
  if (prev) prev.addEventListener("click", function(){ lane.scrollBy({left: -laneStep(lane), behavior: RED ? "auto" : "smooth"}); });
  if (next) next.addEventListener("click", function(){ lane.scrollBy({left: laneStep(lane), behavior: RED ? "auto" : "smooth"}); });
  lane.addEventListener("scroll", function(){ requestAnimationFrame(function(){ laneState(lane); }); }, {passive:true});
  laneState(lane);
});
addEventListener("load", laneStates);

/* ---------------- ВИДЕООТЗЫВЫ: модалка ---------------- */
var modal = document.getElementById("modal"), modalV = document.getElementById("modalV"), modalX = document.getElementById("modalX");
function openModal(src){
  if (!modal) return;
  modalV.src = src;
  modal.classList.add("open");
  document.body.classList.add("modal-open");
  var p = modalV.play(); if (p && p.catch) p.catch(function(){});
}
function closeModal(){
  if (!modal || !modal.classList.contains("open")) return;
  modal.classList.remove("open");
  document.body.classList.remove("modal-open");
  modalV.pause(); modalV.removeAttribute("src"); modalV.load();
}
document.querySelectorAll(".rev[data-video]").forEach(function(b){
  b.addEventListener("click", function(){ openModal(b.dataset.video); });
});
if (modalX) modalX.addEventListener("click", closeModal);
if (modal) modal.addEventListener("click", function(e){ if (e.target === modal) closeModal(); });

/* ---------------- ФОРМА → WhatsApp ---------------- */
var form = document.getElementById("form");
if (form) form.addEventListener("submit", function(e){
  e.preventDefault();
  var ok = document.getElementById("fmok"), err = document.getElementById("fmerr");
  if (form.company && form.company.value) return;          /* honeypot */
  var phone = form.phone.value.trim();
  if (phone.replace(/\D/g, "").length < 10) { err.hidden = false; ok.hidden = true; form.phone.focus(); return; }
  err.hidden = true;
  var p = pack(), F = (p && p.form) || FORM_RU;
  var sel = form.what, what = sel.value ? sel.options[sel.selectedIndex].textContent.trim() : F.none;
  var city = form.city.options[form.city.selectedIndex].textContent.trim();
  var name = form.name.value.trim(), msg = form.msg.value.trim();
  var t = F.hello + "\n" + (name ? F.name + ": " + name + "\n" : "") + F.city + ": " + city + "\n" + F.what + ": " + what + "\n" + F.phone + ": " + phone + (msg ? "\n" + F.msg + ": " + msg : "");
  ok.hidden = false;
  conv("lead");
  window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(t), "_blank", "noopener");
});

/* ---------------- СТАРТ ---------------- */
snapshot();
initCity();
initLang();
fillTicker();
fitText();
hdrState();
/* прямой переход по якорю: встать на блок, интро уже пропущено */
if (location.hash) {
  var hid = location.hash.slice(1);
  if (document.getElementById(hid)) {
    setTimeout(function(){ goTo(hid, false); }, 60);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (location.hash.slice(1) === hid) goTo(hid, false); });
  }
}
})();
