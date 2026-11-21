(function(){
  /* ---------- Publications ---------- */
  var PUBS = window.PUBS || [];

  var root = document.documentElement;
  var iceState = "freezing";
  var hoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = {theme:"all", first:false};
  var listEl = document.getElementById("pubList");
  var countEl = document.getElementById("pubCount");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var firstBox = document.getElementById("firstOnly");

  function isFirst(p){ return p.a.indexOf("X. Zou") === 0; }
  function authors(a){ return a.replace("X. Zou", "<strong>X. Zou</strong>"); }
  function zh(){ return root.lang === "zh-CN"; }

  function renderPubs(){
    var shown = PUBS.filter(function(p){
      return (state.theme === "all" || p.th === state.theme) && (!state.first || isFirst(p));
    });
    countEl.textContent = zh()
      ? "显示 " + shown.length + " / " + PUBS.length + " 项"
      : "Showing " + shown.length + " of " + PUBS.length;

    if (!shown.length){
      listEl.innerHTML = '<div class="empty">' + (zh()
        ? '该方向暂无第一作者论文。<button type="button" id="clearFirst">取消“仅第一作者”</button>即可查看全部。'
        : 'No first-author papers in this topic. <button type="button" id="clearFirst">Clear the first-author filter</button> to see all of them.') + '</div>';
      document.getElementById("clearFirst").addEventListener("click", function(){
        firstBox.checked = false; state.first = false; renderPubs();
      });
      return;
    }

    var years = [];
    shown.forEach(function(p){ if (years.indexOf(p.y) < 0) years.push(p.y); });
    years.sort(function(a,b){ return b - a; });

    listEl.innerHTML = years.map(function(y){
      var items = shown.filter(function(p){ return p.y === y; }).map(function(p){
        var title = p.doi
          ? '<a class="pt" href="https://doi.org/' + p.doi + '" target="_blank" rel="noopener">' + p.t + '</a>'
          : '<span class="pt">' + p.t + '</span>';
        var venue = p.thesis
          ? p.j + '<span class="kind">' + (zh() ? "博士论文" : "PhD thesis") + '</span>'
          : '<i>' + p.j + '</i>' + (p.v ? ", " + p.v : "");
        return '<li>' + title + '<div class="pa">' + authors(p.a) + '</div><div class="pv">' + venue + '</div></li>';
      }).join("");
      return '<section class="yr"><h3>' + y + '</h3><ol>' + items + '</ol></section>';
    }).join("");
  }

  function setTheme(t){
    state.theme = t;
    chips.forEach(function(c){ c.setAttribute("aria-pressed", String(c.dataset.theme === t)); });
    renderPubs();
  }

  chips.forEach(function(c){ c.addEventListener("click", function(){ setTheme(c.dataset.theme); }); });
  firstBox.addEventListener("change", function(){ state.first = firstBox.checked; renderPubs(); });

  Array.prototype.forEach.call(document.querySelectorAll(".see"), function(b){
    b.addEventListener("click", function(){
      setTheme(b.dataset.show);
      document.getElementById("publications").scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"});
    });
  });

  /* ---------- Language ---------- */
  function updateHint(){
    var el = document.getElementById("iceHint");
    if (!el) return;
    var z = zh(), t;
    if (iceState === "frosted") t = hoverFine
      ? (z ? "把鼠标移到玻璃上，冰就会碎掉。" : "Move your mouse onto the glass to break the ice.")
      : (z ? "轻点玻璃，把冰敲碎。" : "Tap the glass to break the ice.");
    else if (iceState === "freezing") t = z ? "玻璃正在结霜……" : "Frost is forming on the glass…";
    else t = z ? "稍等片刻，玻璃会重新结满霜。" : "Give it a moment and the glass frosts over again.";
    el.textContent = t;
  }

  var langBtn = document.getElementById("lang");
  function setLang(l){
    root.lang = l;
    langBtn.textContent = l === "en" ? "中文" : "English";
    langBtn.setAttribute("aria-label", l === "en" ? "切换到中文" : "Switch to English");
    try { localStorage.setItem("xz-lang", l); } catch(e) {}
    renderPubs();
    updateHint();
  }
  langBtn.addEventListener("click", function(){ setLang(root.lang === "en" ? "zh-CN" : "en"); });

  var initial = "en";
  try {
    var saved = localStorage.getItem("xz-lang");
    if (saved === "en" || saved === "zh-CN") initial = saved;
    else if ((navigator.language || "").toLowerCase().indexOf("zh") === 0) initial = "zh-CN";
  } catch(e) {}
  setLang(initial);

  /* ---------- The frozen window ---------- */
  var hero = document.querySelector(".hero");
  var view = document.getElementById("frost");
  var blurEl = document.getElementById("frostBlur");
  var snowC = document.getElementById("snow");
  var vctx = view.getContext && view.getContext("2d");
  if (!vctx || !window.Path2D) return;
  function layer(){ var c = document.createElement("canvas"); return [c, c.getContext("2d")]; }
  var L1 = layer(), iceC = L1[0], ictx = L1[1];    /* what shows on the glass, and what shatters */
  var L2 = layer(), texC = L2[0], xctx = L2[1];    /* rime: dense white frost, grains, needles, sparkles */
  var L3 = layer(), fernC = L3[0], fctx = L3[1];   /* frost ferns */
  var L4 = layer(), tmpC = L4[0], tctx = L4[1];    /* scratch */
  var L5 = layer(), maskC = L5[0], mctx = L5[1];   /* low-res freezing front */
  var L6 = layer(), glowC = L6[0], gctx = L6[1];   /* soft glow around the crystals */
  var L7 = layer(), bmC = L7[0], bmx = L7[1];      /* where the glass blurs what is behind it */
  var sctx = snowC.getContext("2d"), canFilter = "filter" in gctx;

  var W = 0, H = 0, DPR = 1, TAU = Math.PI * 2, raf = 0, S = 4, nz = null;
  var dirty = false, hasIce = false, anims = [], refreezeTimer = 0;
  var field = null, fw = 0, fh = 0, maskImg = null;
  var ferns = [], fernIdx = 0, freezing = false, freezeStart = 0, FREEZE_MS = 4200, sheenStart = -1, blurShown = -1;
  var pal = {};

  function cssVar(n, fb){ return getComputedStyle(hero).getPropertyValue(n).trim() || fb; }
  function readPalette(){
    pal.line = cssVar("--ice-line", "#D9F0FB");
    pal.haze = cssVar("--ice-haze", "214,236,248");
    pal.shadow = cssVar("--ice-shadow", "2,12,22");
  }
  function rand(a, b){ return a + Math.random() * (b - a); }
  function dist(x1, y1, x2, y2){ var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }
  function kick(){ if (!raf) raf = requestAnimationFrame(loop); }
  function setBlur(o){
    o = Math.round(o * 50) / 50;
    if (o === blurShown) return;
    blurShown = o; blurEl.style.opacity = String(o);
    /* snow is only seen through the window while it is icing up or iced over */
    snowC.style.opacity = String(o);
    if (o > 0) startSnow();
  }

  function setup(){
    var rect = hero.getBoundingClientRect();
    W = Math.round(rect.width); H = Math.round(rect.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    [view, iceC, texC, fernC, tmpC, snowC].forEach(function(c){ c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    glowC.width = Math.max(1, Math.round(W / 2)); glowC.height = Math.max(1, Math.round(H / 2));
    ictx.setTransform(DPR, 0, 0, DPR, 0, 0);
    xctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    hasIce = false; dirty = true;
    measureText();
    buildSnow();
  }
  /* The frost stays thinner over the text so it can still be read */
  var textBox = null;
  function measureText(){
    var hr = hero.getBoundingClientRect(), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, range = document.createRange();
    Array.prototype.forEach.call(hero.querySelectorAll(".status, h1, .lede, .post, .links, .portrait"), function(el){
      range.selectNodeContents(el);
      var r = range.getBoundingClientRect();
      if (!r.width) return;
      x0 = Math.min(x0, r.left - hr.left); y0 = Math.min(y0, r.top - hr.top);
      x1 = Math.max(x1, r.right - hr.left); y1 = Math.max(y1, r.bottom - hr.top);
    });
    textBox = x0 < Infinity ? [x0 - 20, y0 - 20, x1 + 20, y1 + 20] : null;
  }
  function calm(px, py){
    if (!textBox) return 0;
    var dx = Math.max(textBox[0] - px, 0, px - textBox[2]), dy = Math.max(textBox[1] - py, 0, py - textBox[3]), d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 80) return 0;
    var t = 1 - d / 80;
    return t * t * (3 - 2 * t);
  }

  /* Smooth value noise */
  function seeded(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function makeNoise(seed){
    var r = seeded(seed), vals = new Float32Array(256), perm = new Uint8Array(512), i;
    for (i = 0; i < 256; i++){ vals[i] = r(); perm[i] = i; }
    for (i = 255; i > 0; i--){ var j = Math.floor(r() * (i + 1)), tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; }
    for (i = 0; i < 256; i++) perm[i + 256] = perm[i];
    function at(x, y){ return vals[perm[perm[x & 255] + (y & 255)]]; }
    return function(x, y){
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      var a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  /* How close a point is to the window frame: 1 at the frame, 0 well inside. Frost is heaviest at the bottom. */
  function edgeness(px, py){
    var half = Math.min(W, H) / 2 || 1;
    var ed = Math.min(px, py * 1.25, W - px, (H - py) * .8) / half;
    var e = ed >= .7 ? 0 : 1 - ed / .7;
    return e * e * (3 - 2 * e);
  }

  /* When each spot freezes: early at the frame, late in the middle, in irregular fingers */
  function buildField(){
    nz = makeNoise((Math.random() * 1e9) | 0);
    fw = Math.ceil(W / S) + 1; fh = Math.ceil(H / S) + 1;
    field = new Float32Array(fw * fh);
    var half = Math.min(W, H) / 2 || 1, mn = Infinity, mx = -Infinity, i = 0;
    for (var y = 0; y < fh; y++){
      for (var x = 0; x < fw; x++, i++){
        var px = x * S, py = y * S;
        var e = Math.min(px * 1.1, py * 1.3, (W - px) * 1.1, (H - py) * .8) / half;
        var n = nz(px / 150, py / 150) * .55 + nz(px / 60, py / 60) * .3 + nz(px / 22, py / 22) * .15;
        var f = Math.min(e, 1.3) * .72 + n * .5;
        field[i] = f;
        if (f < mn) mn = f;
        if (f > mx) mx = f;
      }
    }
    var span = (mx - mn) || 1;
    for (i = 0; i < field.length; i++) field[i] = (field[i] - mn) / span;
    maskC.width = fw; maskC.height = fh;
    maskImg = mctx.createImageData(fw, fh);
    for (i = 0; i < fw * fh; i++){ maskImg.data[i * 4] = 255; maskImg.data[i * 4 + 1] = 255; maskImg.data[i * 4 + 2] = 255; }
  }
  function fieldAt(x, y){
    var gx = Math.max(0, Math.min(fw - 1, Math.round(x / S))), gy = Math.max(0, Math.min(fh - 1, Math.round(y / S)));
    return field[gy * fw + gx];
  }
  function paintMask(th){
    var d = maskImg.data, n = field.length;
    for (var i = 0; i < n; i++){
      var a = (th - field[i]) * 14;
      d[i * 4 + 3] = a <= 0 ? 0 : a >= 1 ? 255 : a * 255;
    }
    mctx.putImageData(maskImg, 0, 0);
  }

  /* Frosted glass blurs the night behind it: strongly at the frame, lightly over the text */
  function buildBlurMask(){
    bmC.width = fw; bmC.height = fh;
    var img = bmx.createImageData(fw, fh), d = img.data, i = 0;
    for (var y = 0; y < fh; y++){
      for (var x = 0; x < fw; x++, i += 4){
        var px = x * S, py = y * S, a = (.14 + edgeness(px, py) * .86 + (nz(px / 140, py / 140) - .5) * .35) * (1 - .75 * calm(px, py));
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = (a <= 0 ? 0 : a >= 1 ? 1 : a) * 255;
      }
    }
    bmx.putImageData(img, 0, 0);
    var url = "url(" + bmC.toDataURL() + ")";
    blurEl.style.webkitMaskImage = url; blurEl.style.maskImage = url;
  }

  /* Rime: a dense, uneven white crust at the frame thinning to a light film in the middle */
  function buildTex(){
    var g = xctx, i, n, R = 2, tw = Math.ceil(W / R), th = Math.ceil(H / R);
    var small = document.createElement("canvas"); small.width = tw; small.height = th;
    var sg = small.getContext("2d"), img = sg.createImageData(tw, th), d = img.data, k = 0;
    for (var y = 0; y < th; y++){
      for (var x = 0; x < tw; x++, k += 4){
        var px = x * R, py = y * R, e = edgeness(px, py);
        var n1 = nz(px / 140, py / 140), n2 = nz(px / 42 + 31, py / 42 + 17), n3 = nz(px / 12 + 71, py / 12 + 5);
        var dens = (e * .9 + .1) * (.4 + .85 * n1) + (n2 - .5) * .32 + (n3 - .5) * .24;
        dens *= 1 - .62 * calm(px, py);
        dens = dens <= 0 ? 0 : dens >= 1 ? 1 : dens;
        var a = Math.pow(dens, 1.2) * (.7 + Math.random() * .4);
        d[k] = 196 + 54 * n3; d[k + 1] = 224 + 28 * n3; d[k + 2] = 242 + 12 * n3; d[k + 3] = a >= .92 ? 235 : a * 255;
      }
    }
    sg.putImageData(img, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, texC.width, texC.height);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(small, 0, 0, tw * R, th * R);
    g.fillStyle = "rgba(" + pal.haze + ",.05)"; g.fillRect(0, 0, W, H);
    /* grains, more of them where the frost is thick */
    var gp = [new Path2D(), new Path2D(), new Path2D()];
    n = Math.round(W * H / 45);
    for (i = 0; i < n; i++){
      var gx = rand(0, W), gy = rand(0, H);
      if (Math.random() > (.25 + edgeness(gx, gy) * .75) * (1 - .5 * calm(gx, gy))) continue;
      var s = rand(.5, 1.5); gp[i % 3].rect(gx, gy, s, s);
    }
    g.fillStyle = "#fff";
    g.globalAlpha = .75; g.fill(gp[0]);
    g.globalAlpha = .4; g.fill(gp[1]);
    g.fillStyle = "rgb(" + pal.haze + ")"; g.globalAlpha = .55; g.fill(gp[2]);
    /* ice needles at 60° multiples */
    var np = [new Path2D(), new Path2D()];
    n = Math.round(W * H / 260);
    for (i = 0; i < n; i++){
      var nx = rand(0, W), ny = rand(0, H);
      if (Math.random() > (.3 + edgeness(nx, ny) * .7) * (1 - .5 * calm(nx, ny))) continue;
      var na = Math.floor(rand(0, 6)) * Math.PI / 3 + rand(-.1, .1), nl = rand(2, 9);
      np[i & 1].moveTo(nx, ny); np[i & 1].lineTo(nx + Math.cos(na) * nl, ny + Math.sin(na) * nl);
    }
    g.strokeStyle = "#fff"; g.lineWidth = .6; g.globalAlpha = .55; g.stroke(np[0]);
    g.strokeStyle = pal.line; g.lineWidth = .9; g.globalAlpha = .3; g.stroke(np[1]);
    /* sparkles */
    var sp = new Path2D(), dots = new Path2D();
    n = Math.max(10, Math.round(W * H / 11000));
    for (i = 0; i < n; i++){
      var sx = rand(0, W), sy = rand(0, H), sl = rand(2, 6);
      sp.moveTo(sx - sl, sy); sp.lineTo(sx + sl, sy); sp.moveTo(sx, sy - sl); sp.lineTo(sx, sy + sl);
      dots.moveTo(sx + 1.3, sy); dots.arc(sx, sy, 1.3, 0, TAU);
    }
    g.strokeStyle = "#fff"; g.globalAlpha = .85; g.lineWidth = .7; g.stroke(sp);
    g.fillStyle = "#fff"; g.globalAlpha = 1; g.fill(dots);
    /* the cold sheen of the ice itself */
    var lg = g.createLinearGradient(0, 0, W, H);
    lg.addColorStop(0, "rgba(255,255,255,.04)"); lg.addColorStop(.38, "rgba(255,255,255,0)");
    lg.addColorStop(.46, "rgba(255,255,255,.12)"); lg.addColorStop(.5, "rgba(255,255,255,0)");
    lg.addColorStop(.58, "rgba(255,255,255,.06)"); lg.addColorStop(.62, "rgba(255,255,255,0)"); lg.addColorStop(1, "rgba(255,255,255,.05)");
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
  }

  /* Frost ferns: feathered stems with 55–60° side branches, growing in from the frame and from specks on the glass */
  function buildFerns(){
    ferns = []; fernIdx = 0;
    var half = Math.min(W, H) / 2 || 1, K = .6 / half, CAP = Math.round(W * H / 9), sc = W < 600 ? .5 : W < 900 ? .75 : 1, seeds = [], i, gap = 56;
    function grow(x, y, a, len, d, t){
      var step = d ? 2.3 : 2.8, n = Math.max(2, Math.round(len / step)), drift = rand(-.025, .025);
      for (var i = 0; i < n; i++){
        if (ferns.length > CAP) return;
        a += drift + rand(-.06, .06);
        var x2 = x + Math.cos(a) * step, y2 = y + Math.sin(a) * step;
        ferns.push({x1: x, y1: y, x2: x2, y2: y2, t: t, d: d});
        x = x2; y = y2; t += step * K;
        if (i < 1 || i >= n - 1) continue;
        var rem = (n - i) * step;
        if (d === 0 && i % 2 === 0){
          var side = Math.min(rem * .5, len * .32) * rand(.5, 1);
          if (Math.random() < .9) grow(x, y, a + rand(.85, 1.05), side, 1, t);
          if (Math.random() < .9) grow(x, y, a - rand(.85, 1.05), side * rand(.8, 1.15), 1, t);
        } else if (d === 1 && Math.random() < .5){
          grow(x, y, a + (Math.random() < .5 ? 1 : -1) * rand(.9, 1.1), Math.min(rem * .55, 10) * rand(.5, 1), 2, t);
        }
      }
    }
    for (var bx = rand(0, gap); bx < W; bx += gap * rand(.7, 1.4)){
      seeds.push([bx, H + 2, -Math.PI / 2 + rand(-.7, .7), rand(70, 200), 0]);
      if (Math.random() < .6) seeds.push([bx, -2, Math.PI / 2 + rand(-.7, .7), rand(40, 120), 0]);
    }
    for (var by = rand(0, gap); by < H; by += gap * rand(.7, 1.4)){
      seeds.push([-2, by, rand(-.7, .7), rand(50, 140), 0]);
      seeds.push([W + 2, by, Math.PI + rand(-.7, .7), rand(50, 140), 0]);
    }
    /* Ice flowers: feathered petals radiating from one nucleus, bigger toward the frame */
    var blooms = Math.round(W * H / 15000), placed = [];
    for (i = 0; i < blooms * 4 && placed.length < blooms; i++){
      var px = rand(0, W), py = rand(0, H), e = edgeness(px, py), cz = calm(px, py);
      if ((W >= 600 && cz > 0) || Math.random() > .35 + e * .65) continue;
      var R = (32 + e * 78 + rand(0, 38)) * (1 - .55 * cz), ok = true;
      for (var q = 0; q < placed.length; q++){ if (dist(px, py, placed[q][0], placed[q][1]) < (R + placed[q][2]) * .55){ ok = false; break; } }
      if (!ok) continue;
      placed.push([px, py, R]);
      var petals = 5 + Math.floor(rand(0, 4)), a0 = rand(0, TAU), tf = fieldAt(px, py) * rand(.55, 1);
      for (var k = 0; k < petals; k++) seeds.push([px, py, a0 + (k + rand(-.18, .18)) * TAU / petals, R * rand(.75, 1.1), 1, tf]);
      for (k = 0; k < petals; k++) if (Math.random() < .6) seeds.push([px, py, a0 + (k + .5 + rand(-.1, .1)) * TAU / petals, R * rand(.35, .55), 1, tf]);
      for (k = 0; k < 12; k++){ var ca = rand(0, TAU), cl = rand(2, 7) * sc; ferns.push({x1: px, y1: py, x2: px + Math.cos(ca) * cl, y2: py + Math.sin(ca) * cl, t: tf, d: 1}); }
    }
    for (i = seeds.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), tmp = seeds[i]; seeds[i] = seeds[j]; seeds[j] = tmp; }
    seeds.forEach(function(s){
      var t0 = s[5] != null ? s[5] : fieldAt(s[0], s[1]);
      grow(s[0], s[1], s[2], s[3] * sc, 0, t0);
    });
    ferns.sort(function(p, q){ return p.t - q.t; });
  }
  /* depth: [halo width, halo alpha, core width, core alpha] */
  var FERN = [[2.4, .32, 1.05, .95], [1.6, .26, .7, .85], [1.05, .2, .45, .65]];
  function drawFerns(to){
    if (to <= fernIdx) return;
    var paths = [new Path2D(), new Path2D(), new Path2D()], k, d;
    for (k = fernIdx; k < to; k++){ var s = ferns[k]; paths[s.d].moveTo(s.x1, s.y1); paths[s.d].lineTo(s.x2, s.y2); }
    fctx.lineCap = "round";
    for (d = 0; d < 3; d++){
      fctx.strokeStyle = pal.line; fctx.lineWidth = FERN[d][0]; fctx.globalAlpha = FERN[d][1]; fctx.stroke(paths[d]);
      fctx.strokeStyle = "#fff"; fctx.lineWidth = FERN[d][2]; fctx.globalAlpha = FERN[d][3]; fctx.stroke(paths[d]);
    }
    fctx.globalAlpha = 1;
    fernIdx = to;
  }

  /* The ice = rime revealed behind the freezing front, ferns on top, and a soft glow around the crystals */
  function composeIce(){
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.clearRect(0, 0, tmpC.width, tmpC.height);
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(maskC, 0, 0, fw, fh, 0, 0, fw * S * DPR, fh * S * DPR);
    tctx.globalCompositeOperation = "source-in";
    tctx.drawImage(texC, 0, 0);
    tctx.globalCompositeOperation = "source-over";
    ictx.save(); ictx.setTransform(1, 0, 0, 1, 0, 0);
    ictx.clearRect(0, 0, iceC.width, iceC.height);
    ictx.drawImage(tmpC, 0, 0);
    ictx.drawImage(fernC, 0, 0);
    if (canFilter){
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, glowC.width, glowC.height);
      gctx.filter = "blur(2.5px)";
      gctx.drawImage(fernC, 0, 0, glowC.width, glowC.height);
      gctx.filter = "none";
      ictx.globalCompositeOperation = "lighter"; ictx.globalAlpha = .32;
      ictx.drawImage(glowC, 0, 0, iceC.width, iceC.height);
    }
    ictx.restore();
    hasIce = true; dirty = true;
  }
  function clearFerns(){ fctx.save(); fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fernC.width, fernC.height); fctx.restore(); fernIdx = 0; }
  function clearIce(){
    ictx.save(); ictx.setTransform(1, 0, 0, 1, 0, 0); ictx.clearRect(0, 0, iceC.width, iceC.height); ictx.restore();
    clearFerns();
    hasIce = false; dirty = true; kick();
  }
  function buildAll(){ buildField(); buildBlurMask(); buildTex(); buildFerns(); }
  function startFreeze(){
    clearIce(); setBlur(0);
    buildAll();
    freezing = true; freezeStart = performance.now(); sheenStart = -1;
    if (reduceMotion){ finishFreeze(true); return; }
    kick();
  }
  function finishFreeze(quiet){
    freezing = false;
    clearFerns(); drawFerns(ferns.length);
    paintMask(2); composeIce(); setBlur(1);
    iceState = "frosted"; updateHint();
    if (!quiet && !reduceMotion) sheenStart = performance.now();
    kick();
  }
  function refreeze(){
    clearTimeout(refreezeTimer);
    iceState = "freezing"; updateHint();
    startFreeze();
  }

  /* Snow falling outside the window, behind the text and the glass */
  var flakes = [], snowRaf = 0, snowLast = 0, heroVisible = true;
  function buildSnow(){
    flakes = [];
    var n = Math.round(W * H / 7500);
    for (var i = 0; i < n; i++){
      var z = Math.random();
      flakes.push({x: rand(0, W), y: rand(0, H), r: .5 + z * z * 2.6, v: 14 + z * 62, a: .22 + z * .6, ph: rand(0, TAU), w: rand(.3, 1.1), sway: 5 + z * 16});
    }
    drawSnow(0);
  }
  function drawSnow(dt){
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sctx.clearRect(0, 0, W, H);
    sctx.fillStyle = "#fff";
    for (var i = 0; i < flakes.length; i++){
      var f = flakes[i];
      if (dt){
        f.y += f.v * dt; f.ph += f.w * dt;
        if (f.y - f.r > H){ f.y = -f.r - rand(0, 30); f.x = rand(0, W); }
      }
      sctx.globalAlpha = f.a;
      sctx.beginPath(); sctx.arc(f.x + Math.sin(f.ph) * f.sway, f.y, f.r, 0, TAU); sctx.fill();
    }
    sctx.globalAlpha = 1;
  }
  function snowLoop(now){
    snowRaf = 0;
    var dt = snowLast ? Math.min(.05, (now - snowLast) / 1000) : 0;
    snowLast = now;
    drawSnow(dt);
    if (heroVisible && blurShown > 0) snowRaf = requestAnimationFrame(snowLoop); else snowLast = 0;
  }
  function startSnow(){ if (!snowRaf && heroVisible && blurShown > 0 && !reduceMotion) snowRaf = requestAnimationFrame(snowLoop); }
  if ("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) startSnow();
    }).observe(hero);
  }

  /* Cracks */
  function addAnim(list, dur, delay){
    var max = 0;
    for (var i = 0; i < list.length; i++) if (list[i].t > max) max = list[i].t;
    list.sort(function(a, b){ return a.t - b.t; });
    anims.push({start: performance.now() + (reduceMotion ? 0 : (delay || 0)), dur: reduceMotion ? 0 : dur, segs: list, idx: 0, max: max || 1});
    kick();
  }
  function drawSeg(s){
    var c = ictx, i;
    if (s.k === "crack"){
      c.lineCap = "round";
      c.strokeStyle = "rgba(" + pal.shadow + ",.55)"; c.lineWidth = s.w + .8;
      c.beginPath(); c.moveTo(s.x1 + .8, s.y1 + .8); c.lineTo(s.x2 + .8, s.y2 + .8); c.stroke();
      c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = s.w;
      c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke();
      c.lineCap = "butt";
    } else if (s.k === "spot"){
      c.beginPath();
      for (i = 0; i < s.pts.length; i++){ if (i) c.lineTo(s.pts[i][0], s.pts[i][1]); else c.moveTo(s.pts[i][0], s.pts[i][1]); }
      c.closePath();
      c.fillStyle = "rgba(255,255,255,.9)"; c.fill();
      c.strokeStyle = "rgba(" + pal.shadow + ",.4)"; c.lineWidth = .8; c.stroke();
    }
  }
  function jag(x, y, a, L, d0, w, reach, out, pts, depth){
    var d = 0;
    pts.push({x: x, y: y, d: d0});
    while (d < L){
      var st = rand(10, 22); a += rand(-.2, .2);
      var x2 = x + Math.cos(a) * st, y2 = y + Math.sin(a) * st, ww = Math.max(.5, w * (1 - d / L * .65));
      out.push({k: "crack", x1: x, y1: y, x2: x2, y2: y2, w: ww, t: (d0 + d) / reach});
      x = x2; y = y2; d += st;
      pts.push({x: x, y: y, d: d0 + d});
      if (depth < 2 && Math.random() < .1){
        jag(x, y, a + (Math.random() < .5 ? -1 : 1) * rand(.4, .9), (L - d) * rand(.25, .5), d0 + d, ww * .7, reach, out, [], depth + 1);
      }
    }
  }
  function pointAt(pts, R){ for (var i = 0; i < pts.length; i++) if (pts[i].d >= R) return pts[i]; return null; }
  function crack(x, y){
    var list = [], rays = 10 + Math.floor(Math.random() * 4), reach = Math.max(W, H) * .54, a0 = Math.random() * TAU, paths = [], spot = [];
    for (var i = 0; i < 10; i++){ var aa = i / 10 * TAU, rr = rand(4, 10); spot.push([x + Math.cos(aa) * rr, y + Math.sin(aa) * rr]); }
    list.push({k: "spot", pts: spot, t: 0});
    for (var r = 0; r < rays; r++){
      var pts = [];
      jag(x, y, a0 + (r + rand(-.3, .3)) / rays * TAU, reach * rand(.45, 1), 0, 2, reach, list, pts, 0);
      paths.push(pts);
    }
    [.1, .2, .34].forEach(function(f){
      var R = reach * f * rand(.85, 1.15);
      for (var i = 0; i < paths.length; i++){
        if (Math.random() < .25) continue;
        var p1 = pointAt(paths[i], R), p2 = pointAt(paths[(i + 1) % paths.length], R);
        if (!p1 || !p2) continue;
        var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        mx += (x - mx) * .08 + rand(-4, 4); my += (y - my) * .08 + rand(-4, 4);
        list.push({k: "crack", x1: p1.x, y1: p1.y, x2: mx, y2: my, w: .9, t: R / reach});
        list.push({k: "crack", x1: mx, y1: my, x2: p2.x, y2: p2.y, w: .9, t: R / reach + .02});
      }
    });
    addAnim(list, 170, 0);
  }

  /* Shatter: cut the pane into radial shards and let them fall */
  function bake(poly){
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity, i;
    for (i = 0; i < poly.length; i++){
      var p = poly[i];
      if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
      if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
    }
    minx = Math.max(0, Math.floor(minx)); miny = Math.max(0, Math.floor(miny));
    maxx = Math.min(W, Math.ceil(maxx)); maxy = Math.min(H, Math.ceil(maxy));
    var bw = maxx - minx, bh = maxy - miny;
    if (bw < 2 || bh < 2) return null;
    var cx = minx + bw / 2, cy = miny + bh / 2;
    var c = document.createElement("canvas");
    c.width = Math.ceil(bw * DPR); c.height = Math.ceil(bh * DPR);
    var g = c.getContext("2d");
    g.setTransform(DPR, 0, 0, DPR, -minx * DPR, -miny * DPR);
    g.beginPath();
    for (i = 0; i < poly.length; i++){ if (i) g.lineTo(poly[i][0], poly[i][1]); else g.moveTo(poly[i][0], poly[i][1]); }
    g.closePath();
    g.save(); g.clip();
    g.drawImage(tmpC, minx * DPR, miny * DPR, bw * DPR, bh * DPR, minx, miny, bw, bh);
    var lg = g.createLinearGradient(minx, miny, maxx, maxy);
    lg.addColorStop(0, "rgba(255,255,255,.24)");
    lg.addColorStop(.55, "rgba(" + pal.haze + ",.12)");
    lg.addColorStop(1, "rgba(255,255,255,.05)");
    g.fillStyle = lg; g.fillRect(minx, miny, bw, bh);
    g.restore();
    g.lineJoin = "round";
    g.strokeStyle = "rgba(" + pal.shadow + ",.35)"; g.lineWidth = 1.6; g.stroke();
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = .9; g.stroke();
    return {img: c, ox: minx - cx, oy: miny - cy, w: bw, h: bh, x: cx, y: cy, r: Math.max(bw, bh)};
  }
  function makeShards(x, y){
    tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, tmpC.width, tmpC.height);
    tctx.drawImage(iceC, 0, 0);
    var maxD = Math.max(dist(x, y, 0, 0), dist(x, y, W, 0), dist(x, y, 0, H), dist(x, y, W, H)) + 10;
    var K = 14 + Math.floor(Math.random() * 5), a0 = Math.random() * TAU, angs = [], radii = [0], r = rand(26, 40), i, j;
    for (i = 0; i < K; i++) angs.push(a0 + (i + rand(-.3, .3)) / K * TAU);
    while (r < maxD){ radii.push(r); r *= rand(1.45, 1.7); }
    radii.push(maxD * 1.08);
    var V = [];
    for (i = 0; i < K; i++){
      V.push([]);
      for (j = 0; j < radii.length; j++){
        if (j === 0){ V[i].push([x, y]); continue; }
        var last = j === radii.length - 1;
        var rr = radii[j] * (last ? 1 : rand(.86, 1.14)), aa = angs[i] + (last ? 0 : rand(-.07, .07));
        V[i].push([x + Math.cos(aa) * rr, y + Math.sin(aa) * rr]);
      }
    }
    var out = [];
    for (j = 0; j < radii.length - 1; j++){
      for (i = 0; i < K; i++){
        var i2 = (i + 1) % K, polys;
        if (j === 0) polys = [[V[i][0], V[i][1], V[i2][1]]];
        else {
          var q = [V[i][j], V[i][j + 1], V[i2][j + 1], V[i2][j]];
          if (j >= 2 && Math.random() < .55){
            polys = Math.random() < .5 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : [[q[0], q[1], q[3]], [q[1], q[2], q[3]]];
          } else polys = [q];
        }
        for (var k = 0; k < polys.length; k++){ var s = bake(polys[k]); if (s) out.push(s); }
      }
    }
    return out;
  }

  var fx = null, fxc = null, shards = [], parts = [], fxStart = 0, fxPrev = 0;
  function startFx(list, rect, x, y){
    if (!fx){
      fx = document.createElement("canvas");
      fx.setAttribute("aria-hidden", "true");
      fx.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:60";
      document.body.appendChild(fx);
      fxc = fx.getContext("2d");
    }
    fx.width = Math.round(window.innerWidth * DPR); fx.height = Math.round(window.innerHeight * DPR);
    var ix = rect.left + x, iy = rect.top + y;
    list.forEach(function(s){
      s.x += rect.left; s.y += rect.top;
      var dx = s.x - ix, dy = s.y - iy, d = Math.sqrt(dx * dx + dy * dy) || 1, f = Math.exp(-d / 240);
      s.vx = dx / d * (50 + 320 * f) + rand(-40, 40);
      s.vy = dy / d * (40 + 240 * f) - 160 * f + rand(-30, 30);
      s.ang = 0; s.va = rand(-1, 1) * (1.5 + 5 * f);
      s.delay = d / 1900 + rand(0, .07);
    });
    shards = shards.concat(list);
    for (var i = 0; i < 60; i++){
      var a = rand(0, TAU), sp = rand(120, 560);
      parts.push({x: ix, y: iy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 180, life: rand(.7, 1.4), age: 0, s: rand(1, 2.8)});
    }
    fxStart = fxPrev = performance.now();
  }
  function stepFx(now){
    var dt = Math.min(.05, (now - fxPrev) / 1000), el = (now - fxStart) / 1000, vh = window.innerHeight, G = 1500, i;
    fxPrev = now;
    fxc.setTransform(1, 0, 0, 1, 0, 0); fxc.clearRect(0, 0, fx.width, fx.height);
    fxc.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (i = shards.length - 1; i >= 0; i--){
      var s = shards[i];
      if (el > s.delay){ s.vy += G * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.ang += s.va * dt; }
      if (s.y - s.r > vh + 20){ shards.splice(i, 1); continue; }
      fxc.save(); fxc.translate(s.x, s.y); fxc.rotate(s.ang); fxc.drawImage(s.img, s.ox, s.oy, s.w, s.h); fxc.restore();
    }
    fxc.fillStyle = "#cfe8f6";
    for (i = parts.length - 1; i >= 0; i--){
      var p = parts[i];
      p.age += dt;
      if (p.age > p.life){ parts.splice(i, 1); continue; }
      p.vy += G * .5 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      fxc.globalAlpha = 1 - p.age / p.life; fxc.fillRect(p.x, p.y, p.s, p.s);
    }
    fxc.globalAlpha = 1;
    if (!shards.length && !parts.length){
      fx.remove(); fx = null; fxc = null;
      iceState = "clear"; updateHint();
      refreezeTimer = setTimeout(refreeze, 2200);
      return false;
    }
    return true;
  }
  function shatter(x, y){
    for (var i = 0; i < anims.length; i++){
      var A = anims[i];
      for (; A.idx < A.segs.length; A.idx++) drawSeg(A.segs[A.idx]);
    }
    anims = [];
    var rect = hero.getBoundingClientRect();
    var list = reduceMotion ? [] : makeShards(x, y);
    clearIce(); setBlur(0); sheenStart = -1;
    if (reduceMotion){ iceState = "clear"; updateHint(); refreezeTimer = setTimeout(refreeze, 3000); return; }
    startFx(list, rect, x, y);
    kick();
  }
  function jolt(){
    if (reduceMotion) return;
    hero.classList.remove("jolt"); void hero.offsetWidth; hero.classList.add("jolt");
  }
  function breakAt(x, y){
    if (iceState !== "frosted") return;
    iceState = "breaking"; updateHint();
    sheenStart = -1;
    crack(x, y);
    jolt();
    setTimeout(function(){ shatter(x, y); }, reduceMotion ? 0 : 170);
  }

  /* One loop drives freezing, the glint, cracks and falling shards */
  function loop(now){
    raf = 0;
    var more = false, i;
    if (freezing){
      var p = Math.min(1, (now - freezeStart) / FREEZE_MS);
      if (p >= 1) finishFreeze(false);
      else {
        var th = 1.4 * (1 - Math.pow(1 - p, 1.3)), j = fernIdx;
        paintMask(th);
        while (j < ferns.length && ferns[j].t <= th) j++;
        drawFerns(j);
        composeIce();
        setBlur(Math.min(1, p * 1.25));
        more = true;
      }
    }
    var keep = [];
    for (i = 0; i < anims.length; i++){
      var A = anims[i];
      if (now < A.start){ keep.push(A); continue; }
      var q = A.dur ? Math.min(1, (now - A.start) / A.dur) : 1, lim = (1 - Math.pow(1 - q, 2)) * A.max, k = A.idx;
      while (k < A.segs.length && A.segs[k].t <= lim){ drawSeg(A.segs[k]); k++; }
      if (k > A.idx) dirty = true;
      A.idx = k;
      if (k < A.segs.length) keep.push(A);
    }
    anims = keep;
    if (anims.length) more = true;
    var sheen = sheenStart >= 0 ? (now - sheenStart) / 1300 : -1;
    if (sheen >= 1){ sheenStart = -1; sheen = -1; dirty = true; }
    if (dirty || sheen >= 0){
      vctx.setTransform(1, 0, 0, 1, 0, 0); vctx.clearRect(0, 0, view.width, view.height);
      if (hasIce) vctx.drawImage(iceC, 0, 0);
      if (sheen >= 0 && hasIce){
        var span = Math.sqrt(view.width * view.width + view.height * view.height), bx = (-.6 + sheen * 1.2) * span, bw = span * .07;
        vctx.save();
        vctx.globalCompositeOperation = "source-atop";
        vctx.translate(view.width / 2, view.height / 2); vctx.rotate(.55);
        var lg = vctx.createLinearGradient(bx - bw, 0, bx + bw, 0);
        lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(.5, "rgba(255,255,255,.6)"); lg.addColorStop(1, "rgba(255,255,255,0)");
        vctx.fillStyle = lg; vctx.fillRect(bx - bw, -span, bw * 2, span * 2);
        vctx.restore();
        more = true;
      }
      dirty = false;
    }
    if (fx && stepFx(now)) more = true;
    if (more) kick();
  }

  /* Input */
  function local(e){ var r = hero.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
  function onHover(e){
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    var p = local(e);
    breakAt(p.x, p.y);
  }
  hero.addEventListener("pointerenter", onHover);
  hero.addEventListener("pointermove", onHover);
  hero.addEventListener("click", function(e){
    var p = local(e);
    breakAt(p.x, p.y);
  });

  /* Start: the window frosts over as the page opens, while snow falls outside */
  readPalette();
  setup();
  refreeze();
  startSnow();

  var lastW = W, lastH = H;
  if ("ResizeObserver" in window){
    new ResizeObserver(function(){
      var rect = hero.getBoundingClientRect(), nw = Math.round(rect.width), nh = Math.round(rect.height);
      if (nw === lastW && nh === lastH) return;
      lastW = nw; lastH = nh;
      setup();
      anims = [];
      if (iceState === "freezing"){ buildAll(); kick(); }
      else if (iceState === "frosted"){ buildAll(); finishFreeze(true); }
      else kick();
    }).observe(hero);
  }
})();
