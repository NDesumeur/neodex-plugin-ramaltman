// Ram Altman : un jeu d'horreur et de survie. Veilleur de nuit chez Octet & Fils, tu gardes la Pile (64 Go de RAM) de minuit à 6 h,
// avec des caméras, deux portes, deux lumières, une trappe et un courant qui s'épuise, face à Ram Altman, le Revendeur et les Puces.
// Tout est dessiné au pinceau du canvas (aucune image) et tout le son est fabriqué par Web Audio. Il tourne dans le bac à sable de NeoDex.
// ===== les dessins : tout est tracé au pinceau du canvas (dégradés, ombres, grain), en 1280×720, rien en pixels =====
const W = 1280, H = 720, OW = 1920;  // le bureau est un panoramique de 1920 de large, vu par une fenêtre de 1280
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rng = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
// ---------- des formes jamais droites : chaque bord tremble un peu (bruit doux), comme un objet usé ou fait main ----------
const _h = (i, j) => { let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
function vn(x, y) {  // bruit de valeur lissé, entre -.5 et .5
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = _h(xi, yi), b = _h(xi + 1, yi), c = _h(xi, yi + 1), d = _h(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v - .5;
}
let WOB = 2.4;  // l'amplitude du tremblement, en unités locales
const wob = (x, y, a = WOB) => [x + a * (vn(x * .045, y * .045 + 7.3) * 2 + vn(x * .19, y * .19) * .7), y + a * (vn(x * .045 + 3.1, y * .045) * 2 + vn(x * .19 + 9, y * .19) * .7)];
function wobPath(g, pts, closed = true, a = WOB) {  // trace une ligne brisée en la découpant tous les ~9 px et en décalant chaque point
  g.beginPath(); const n = pts.length / 2, segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const x0 = pts[2 * i], y0 = pts[2 * i + 1], x1 = pts[(2 * i + 2) % pts.length], y1 = pts[(2 * i + 3) % pts.length], k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 9));
    for (let j = 0; j < k; j++) { const [x, y] = wob(x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k, a); i || j ? g.lineTo(x, y) : g.moveTo(x, y); }
  }
  if (closed) g.closePath(); else { const [x, y] = wob(pts[pts.length - 2], pts[pts.length - 1], a); g.lineTo(x, y); }
}
const fillStroke = (g, fill, stroke, lw) => { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
const poly = (g, pts, fill, stroke, lw = 2) => { wobPath(g, pts); fillStroke(g, fill, stroke, lw); };
const wline = (g, pts, color, lw = 2, a = WOB) => { wobPath(g, pts, false, a); g.strokeStyle = color; g.lineWidth = lw; g.stroke(); };
// une forme molle qui passe par des points (courbe de Catmull-Rom fermée) : membres, vêtements, chaussures
function blobPath(g, pts) {
  const n = pts.length / 2, P = i => { i = (i % n + n) % n; return wob(pts[2 * i], pts[2 * i + 1], WOB * .8); };
  g.beginPath(); g.moveTo(...P(0));
  for (let i = 0; i < n; i++) { const [x0, y0] = P(i - 1), [x1, y1] = P(i), [x2, y2] = P(i + 1), [x3, y3] = P(i + 2); g.bezierCurveTo(x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6, x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6, x2, y2); }
  g.closePath();
}
const blob = (g, pts, fill, stroke, lw = 2) => { blobPath(g, pts); fillStroke(g, fill, stroke, lw); };
// une forme en volume : couleur, lumière d'un côté, ombre de l'autre, et un creux sombre flou le long du bord (comme un rendu 3D)
function form(g, pts, base, { lx = -1, ao = .5, hi = .16, aw = 18, path = blobPath } = {}) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
  g.save(); path(g, pts); g.fillStyle = base; g.fill(); g.clip();
  g.fillStyle = lin(g, lx < 0 ? x0 : x1, y0, lx < 0 ? x1 : x0, y1, [[0, `rgba(255,236,214,${hi})`], [.45, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,12,.5)']]); g.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, y1 - y0 + 10);
  g.filter = `blur(${aw / 2.5}px)`; path(g, pts); g.strokeStyle = `rgba(0,0,0,${ao})`; g.lineWidth = aw; g.stroke(); g.filter = 'none';
  g.restore();
}
// une ombre ou une lueur douce (creux, plis, taches)
const soft = (g, px, fn, color, lw) => { g.save(); g.filter = `blur(${px}px)`; fn(); if (lw) { g.strokeStyle = color; g.lineWidth = lw; g.stroke(); } else { g.fillStyle = color; g.fill(); } g.restore(); };
const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
const rad = (g, x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
const ell = (g, x, y, rx, ry, fill, rot = 0) => {
  rx = Math.max(.1, rx); ry = Math.max(.1, ry); const n = Math.max(10, Math.min(48, (rx + ry) / 3 | 0)), pts = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; pts.push(x + ex * c - ey * s, y + ex * s + ey * c); }
  const amp = Math.min(WOB, Math.min(rx, ry) * .1); g.beginPath(); for (let i = 0; i < n; i++) { const [px, py] = wob(pts[2 * i], pts[2 * i + 1], amp); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath();
  g.fillStyle = fill; g.fill();
};
const rrect = (g, x, y, w, h, r, fill, stroke, lw = 2) => {
  r = Math.min(r, w / 2, h / 2); const pts = [];
  for (const [cx, cy, a0] of [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]]) for (let k = 0; k <= 3; k++) { const a = a0 + k / 3 * Math.PI / 2; pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  wobPath(g, pts, true, Math.min(WOB, w * .08, h * .08)); fillStroke(g, fill, stroke, lw);
};
// du grain sur une zone : salit les surfaces (béton, métal) pour qu'elles ne fassent pas « dessin vectoriel »
function grime(g, x, y, w, h, n, seed, dark = .18, light = .05) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, s = 1 + r() * 3;
    g.fillStyle = r() < .8 ? `rgba(0,0,0,${r() * dark})` : `rgba(255,255,255,${r() * light})`; g.fillRect(px, py, s, s * (r() < .3 ? 6 : 1));
  }
  for (let i = 0; i < n / 60; i++) {  // coulures et taches
    const px = x + r() * w, py = y + r() * h * .7, len = 20 + r() * h * .3;
    g.fillStyle = lin(g, px, py, px, py + len, [[0, `rgba(20,14,8,${.1 + r() * .2})`], [1, 'rgba(20,14,8,0)']]); g.fillRect(px, py, 2 + r() * 5, len);
  }
}

// ---------- RAM ALTMAN ----------
// un androïde en sweat gris déchiré, le masque de peau à moitié arraché sur un crâne chromé, des barrettes de RAM qui brillent dans la poitrine.
// pose : 'stand' (de face), 'lean' (penché, la tête en avant), 'peek' (seulement la tête et une main, au bord d'un mur)
// lit : 0 (dans le noir, seulement les yeux) à 1 (en pleine lumière)
function drawRam(g, x, y, s, pose = 'stand', lit = .7, t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);  // (0,0) = entre les pieds ; la tête vers y = -560
  const dim = c => shade(c, lit), F = (pts, c, o) => form(g, pts, dim(c), o), curve = (pts, c, lw) => { g.lineCap = 'round'; wobPath(g, pts, false, 1.2); g.strokeStyle = c; g.lineWidth = lw; g.stroke(); };
  const fold = (x0, y0, cx, cy, x1, y1, a = .4, w = 7) => soft(g, 3, () => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); }, `rgba(0,0,8,${a})`, w);
  if (pose !== 'peek') {
    soft(g, 10, () => { g.beginPath(); g.ellipse(6, 2, 130, 20, 0, 0, Math.PI * 2); }, 'rgba(0,0,0,.55)');
    // jambes : jean trop large qui plisse aux chevilles ; le genou droit déchiré laisse voir l'articulation
    F([-84, -244, -24, -246, -28, -170, -34, -96, -26, -20, -72, -14, -78, -90, -86, -170], '#252b3d', { lx: -1 });
    F([18, -244, 82, -240, 84, -168, 70, -96, 74, -18, 30, -16, 24, -94, 22, -170], '#212637', { lx: -1 });
    for (const [x0, y0, cx, cy, x1, y1] of [[-78, -60, -54, -48, -30, -64], [-76, -40, -52, -30, -30, -44], [-82, -200, -60, -186, -40, -204], [28, -52, 50, -38, 72, -56], [26, -130, 46, -118, 66, -138]]) fold(x0, y0, cx, cy, x1, y1, .45, 5);
    blob(g, [30, -152, 70, -156, 76, -128, 62, -110, 34, -114, 26, -134], '#07080b');
    ell(g, 50, -134, 17, 14, lin(g, 36, -148, 64, -120, [[0, dim('#d2dae2')], [.5, dim('#7d8791')], [1, dim('#2c3238')]]));
    curve([34, -138, 40, -126, 36, -116], dim('#3a4048'), 2); curve([62, -146, 72, -140, 70, -128], dim('#283040'), 3);
    // baskets usées, la gauche tournée vers l'intérieur
    F([-86, -22, -30, -26, -6, -12, -8, 2, -60, 6, -94, 2, -98, -10], '#1a1b1f', { ao: .6, aw: 10 });
    F([28, -22, 78, -26, 108, -14, 110, 2, 70, 6, 26, 2], '#17181c', { ao: .6, aw: 10 });
    curve([-92, -2, -50, 2, -8, -2], dim('#7a7468'), 3); curve([30, -2, 70, 3, 106, -2], dim('#6e695e'), 3);
  }
  const lean = pose === 'lean' ? 1 : 0;
  g.save(); if (lean) { g.translate(0, -250); g.rotate(.14); g.translate(0, 250); }
  if (pose !== 'peek') {
    // capuche tassée dans le dos
    F([-82, -466, -58, -500, -6, -512, 48, -502, 80, -474, 44, -458, 0, -470, -44, -460], '#4b5058', { ao: .7, aw: 14 });
    // torse : un sweat gris trop grand, épaule droite plus basse, ourlet roulé
    F([-44, -478, 38, -474, 92, -446, 116, -398, 112, -330, 104, -262, 98, -230, 40, -218, -12, -226, -62, -220, -100, -232, -108, -300, -116, -390, -106, -452], '#646973', { lx: -1, ao: .55, aw: 26 });
    F([-102, -246, -40, -236, 20, -238, 100, -244, 102, -218, 40, -208, -20, -214, -100, -212], '#50545d', { ao: .5, aw: 10 });
    // l'ouverture sur la carte mère : un trou déchiré, pas un rectangle
    blob(g, [-44, -432, -12, -446, 22, -440, 46, -404, 40, -352, 20, -316, -16, -306, -44, -334, -52, -392], dim('#0a2618'));
    g.save(); blobPath(g, [-44, -432, -12, -446, 22, -440, 46, -404, 40, -352, 20, -316, -16, -306, -44, -334, -52, -392]); g.clip();
    g.strokeStyle = `rgba(80,255,170,${.2 + lit * .3})`; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) curve([-40 + i * 9, -300, -38 + i * 9, -330 - (i % 3) * 14, -34 + i * 10, -440], g.strokeStyle, 1.4);
    // quatre barrettes, chacune un peu de travers ; la troisième cassée en deux
    [[-34, -432, -.08, 108], [-17, -436, .04, 112], [0, -430, .12, 54], [17, -426, -.03, 100]].forEach(([bx, by, rot, len], i) => {
      const gl = .55 + .45 * Math.sin(t * 3 + i * 1.7); g.save(); g.translate(bx + 5, by); g.rotate(rot);
      g.fillStyle = `rgba(60,255,150,${.16 * gl})`; g.fillRect(-11, -6, 22, len + 14);
      rrect(g, -5, 0, 10, len, 2, `rgb(${20 + 30 * gl | 0},${110 + 90 * gl | 0},${60 + 30 * gl | 0})`);
      g.fillStyle = '#0c0c10'; for (let k = 0; k < len / 26 - .5; k++) g.fillRect(-3, 8 + k * 25 + (k % 2), 6, 13 + (i + k) % 3);
      if (i === 2) poly(g, [-6, len, 6, len - 6, 5, len + 4, -4, len + 8], dim('#103a24')); else { g.fillStyle = '#d8b14a'; g.fillRect(-4, len - 4, 8, 3); }
      g.restore();
    });
    soft(g, 12, () => { blobPath(g, [-44, -432, -12, -446, 22, -440, 46, -404, 40, -352, 20, -316, -16, -306, -44, -334, -52, -392]); }, 'rgba(0,0,0,.7)', 16);
    g.restore();
    // des lambeaux de tissu qui pendent autour du trou, et des fils sortis qui tombent sur le ventre
    for (const pts of [[-46, -400, -60, -380, -48, -362], [-14, -444, -4, -428, 6, -446], [40, -360, 54, -334, 32, -344], [-30, -314, -20, -290, -10, -310], [44, -412, 58, -406, 46, -390]]) F(pts, '#5a5e67', { ao: .4, aw: 6 });
    // le cou : des vérins chromés, l'un tordu
    rrect(g, -22, -516, 11, 46, 4, lin(g, -22, 0, -11, 0, [[0, dim('#aab4be')], [1, dim('#3a4048')]]));
    g.save(); g.translate(14, -470); g.rotate(-.12); rrect(g, -5, -46, 11, 46, 4, lin(g, -5, 0, 6, 0, [[0, dim('#9aa4ae')], [1, dim('#30363c')]])); g.restore();
    curve([-4, -512, 2, -490, -6, -472], dim('#22252a'), 4);
    // bras : le gauche pend, trop long ; le droit est plié vers toi, la manche déchirée sur l'avant-bras en métal
    F([-104, -452, -86, -430, -98, -350, -106, -268, -112, -190, -148, -186, -150, -270, -142, -360, -132, -436], '#5c6069', { lx: -1, aw: 20 });
    F([-112, -204, -150, -200, -154, -176, -112, -178], '#4a4e56', { ao: .6, aw: 8 });
    for (const [x0, y0, cx, cy, x1, y1] of [[-132, -380, -114, -370, -100, -384], [-140, -300, -122, -290, -106, -304], [-146, -240, -128, -232, -112, -244]]) fold(x0, y0, cx, cy, x1, y1);
    F([92, -448, 122, -432, 146, -360, 154, -316, 128, -306, 116, -350, 98, -400], '#5a5e67', { lx: -1, aw: 18 });
    g.save(); g.lineCap = 'round'; for (const [c, w] of [[dim('#2a2e33'), 20], [dim('#8a949e'), 14], [dim('#d0d8e0'), 4]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(140, -326); g.quadraticCurveTo(160, -296, 178, -272); g.stroke(); } g.restore();
    for (const pts of [[124, -320, 152, -330, 158, -302, 146, -292, 132, -306]]) F(pts, '#50545c', { ao: .5, aw: 8 });
    hand(g, -128, -168, 1, dim, lit, .12); hand(g, 182, -262, -1, dim, lit, -.5);
    // poche ventrale de travers, cordons de longueurs différentes (l'un noué)
    F([-68, -322, 0, -330, 64, -320, 70, -270, 0, -262, -66, -262], '#585c64', { ao: .45, aw: 12 });
    fold(-66, -300, -54, -280, -60, -264, .5, 4); fold(64, -304, 54, -286, 62, -268, .5, 4);
    curve([-18, -466, -22, -440, -26, -404], dim('#b9bcc2'), 3); curve([18, -466, 26, -440, 22, -428], dim('#b9bcc2'), 3); ell(g, 22, -424, 4, 4, dim('#a8abb0'));
    for (const [c, pts] of [['#b8342a', [-20, -310, -28, -280, -12, -250, -20, -214]], ['#18191c', [-4, -306, 8, -270, -2, -230]], ['#d0a02a', [14, -316, 30, -290, 22, -262, 36, -236]]]) { curve(pts, 'rgba(0,0,0,.5)', 6); curve(pts, dim(c), 3.5); }
    for (const [x0, y0, cx, cy, x1, y1] of [[-92, -420, -70, -398, -62, -438], [92, -404, 72, -380, 66, -426], [-84, -266, -40, -282, 0, -264], [84, -272, 52, -288, 12, -268], [-100, -340, -84, -330, -90, -310]]) fold(x0, y0, cx, cy, x1, y1, .45, 8);
  }
  // la tête, penchée sur le côté
  if (pose === 'peek') head(g, 0, 0, 1, lit, t, false); else { g.save(); g.translate(0, -470); g.rotate(-.11); head(g, 6, -92, 1, lit, t, false); g.restore(); }
  g.restore(); g.restore();
}
// une main : paume chromée, doigts longs et noueux, chacun d'une longueur et d'un angle différents, finis par des contacts dorés
function hand(g, x, y, sd, dim, lit, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  form(g, [-18, -6, 0, -22, 18, -8, 16, 16, -16, 18], dim('#9aa4ae'), { lx: -sd, ao: .5, aw: 8, hi: .3 });
  [[-13, 40, .12], [-4, 50, .03], [5, 47, -.05], [13, 36, -.16]].forEach(([fx, len, a], i) => {
    g.save(); g.translate(fx, 12); g.rotate(a + Math.sin(i * 2.3) * .06);
    g.lineCap = 'round'; g.strokeStyle = dim('#2a2e33'); g.lineWidth = 8; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, len * .5); g.lineTo(sd * 2, len); g.stroke();
    g.strokeStyle = dim('#8e98a2'); g.lineWidth = 5; g.stroke(); ell(g, 0, len * .5, 4.5, 4, dim('#c0c8d0'));
    g.fillStyle = `rgba(230,190,80,${.4 + lit * .5})`; g.fillRect(sd * 2 - 2.5, len - 1, 5, 6);
    g.restore();
  });
  g.restore();
}
// la tête de Ram : un visage de PDG trop lisse, trop souriant, un peu de travers ; le masque de peau est fendu et la moitié droite (pour nous) laisse voir le crâne en métal.
// big : pour le saut au visage (bouche grande ouverte, gorge rougeoyante). Repère : le nez vers (0,0), le menton vers y = 100.
const HEAD = [0, -116, 40, -112, 66, -90, 77, -50, 74, -8, 66, 30, 55, 62, 34, 92, 6, 107, -24, 99, -46, 77, -58, 46, -66, 10, -73, -30, -70, -76, -44, -106];
function headPath(g) { blobPath(g, HEAD); }
const TEAR = [[18, -118], [8, -96], [14, -84], [4, -70], [22, -54], [12, -40], [6, -24], [26, -8], [18, 4], [28, 16], [12, 30], [20, 44], [32, 58], [16, 70], [8, 84], [18, 96], [12, 112]];  // la déchirure du masque
function tearPath(g, side) {  // side 1 : le côté peau (gauche de l'image), -1 : le côté métal
  g.beginPath(); g.moveTo(TEAR[0][0], TEAR[0][1]); for (const [x, y] of TEAR.slice(1)) g.lineTo(x, y);
  const far = side > 0 ? -130 : 130; g.lineTo(far, 130); g.lineTo(far, -140); g.closePath();
}
function head(g, x, y, s, lit, t, big) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const dim = c => shade(c, lit), open = big === true ? 1 : +big || 0, r = rng(7), sh = (px, fn, c, lw) => soft(g, px, fn, c, lw);
  const E = (cx, cy, rx, ry, a = 0) => () => { g.beginPath(); g.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2); };
  // oreilles : la gauche en peau, décollée ; la droite en métal, avec une prise
  form(g, [-62, -26, -80, -34, -88, -8, -82, 20, -64, 14], dim('#b08670'), { aw: 8, ao: .55 });
  form(g, [64, -28, 84, -32, 92, -4, 84, 22, 66, 14], dim('#717a84'), { aw: 8 }); rrect(g, 78, -12, 9, 16, 2, '#0c0c0e');
  if (big) form(g, [-34, 76, 34, 76, 46, 156, -44, 156], dim('#6a4c3c'), { ao: .7 });
  // ---- le crâne en métal (tout le visage, recouvert ensuite par la peau à gauche)
  g.save(); headPath(g); g.clip();
  g.fillStyle = lin(g, -40, -110, 80, 100, [[0, dim('#eef3f7')], [.35, dim('#9aa5b0')], [.7, dim('#4b535c')], [1, dim('#1c2025')]]); g.fillRect(-90, -130, 180, 250);
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const yy = -110 + r() * 220, x0 = 10 + r() * 20; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + 30 + r() * 50, yy + r() * 6 - 3); g.stroke(); }
  wline(g, [30, -104, 48, -70, 58, -30, 52, 20], 'rgba(0,0,0,.55)', 2.5, 1.5); wline(g, [26, 40, 46, 38, 66, 46], 'rgba(0,0,0,.5)', 2, 1);
  for (const [rx, ry] of [[44, -74], [61, -24], [55, 28], [40, 72], [52, -56]]) { ell(g, rx, ry, 3.6, 3.4, dim('#24282d')); ell(g, rx - 1, ry - 1.2, 1.2, 1, 'rgba(255,255,255,.5)'); }
  g.save(); g.translate(48, 60); g.rotate(-.18); for (let i = 0; i < 5; i++) rrect(g, -9, i * 7, 18 - i, 3, 1, '#0b0c0e'); g.restore();
  sh(5, () => blobPath(g, [40, -16, 56, -8, 54, 4, 40, 0]), 'rgba(255,140,60,.25)');  // une lueur chaude sous une plaque
  g.restore();
  // ---- la peau (côté gauche de la déchirure)
  g.save(); headPath(g); g.clip(); tearPath(g, 1); g.clip();
  g.fillStyle = rad(g, -26, -44, 8, 160, [[0, dim('#f0d6c2')], [.45, dim('#cfa890')], [1, dim('#6e4a3a')]]); g.fillRect(-90, -130, 180, 250);
  // creux du visage : orbites, joue creusée sous la pommette, tempe, menton ; front ridé
  sh(7, E(-30, -22, 27, 20), 'rgba(70,24,16,.4)'); sh(8, E(26, -22, 22, 18), 'rgba(70,24,16,.3)');
  sh(9, E(-50, 40, 13, 30, .35), 'rgba(70,24,16,.45)'); sh(9, E(-62, -46, 10, 22), 'rgba(70,24,16,.35)');
  sh(10, E(-10, 96, 34, 14), 'rgba(60,22,14,.45)'); sh(8, E(-40, 14, 18, 8, -.4), 'rgba(255,230,210,.2)');
  for (const [y0, k] of [[-80, 0], [-72, 1], [-88, 2]]) sh(1.5, () => { g.beginPath(); g.moveTo(-54 + k * 4, y0 + k); g.quadraticCurveTo(-30, y0 - 6 + k * 2, -2 - k * 6, y0 + 2); }, 'rgba(90,40,26,.35)', 2);
  for (let i = 0; i < 320; i++) { const px = -72 + r() * 96, py = -104 + r() * 206; g.fillStyle = `rgba(${r() < .55 ? '90,40,30' : '255,240,230'},${r() * .12})`; g.fillRect(px, py, 1.3 + r(), 1.3 + r()); }
  sh(6, E(-42, 28, 13, 8), `rgba(210,90,80,${.25 * lit})`);
  g.restore();
  // le volume de toute la tête : un creux sombre flou le long du bord
  g.save(); headPath(g); g.clip(); sh(7, () => headPath(g), 'rgba(0,0,0,.55)', 16); g.restore();
  // le bord du masque : la peau retournée, épaisse, et des fils rouges tendus vers le métal
  const tear = (dx, c, lw) => { g.strokeStyle = c; g.lineWidth = lw; g.lineJoin = 'round'; g.beginPath(); TEAR.forEach(([px, py], i) => i ? g.lineTo(px + dx, py) : g.moveTo(px + dx, py)); g.stroke(); };
  sh(3, () => { g.beginPath(); TEAR.forEach(([px, py], i) => i ? g.lineTo(px + 4, py) : g.moveTo(px + 4, py)); }, 'rgba(0,0,0,.7)', 6);
  tear(0, dim('#4e2a1f'), 5.5); tear(-3, dim('#d7a890'), 1.6);
  g.strokeStyle = `rgba(220,60,50,${.35 + .4 * lit})`; g.lineWidth = 1.1;
  for (let i = 1; i < TEAR.length - 1; i += 2) { const [px, py] = TEAR[i]; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + 10 + r() * 8, py - 6 - r() * 6, px + 20 + r() * 12, py + 8 - r() * 16); g.stroke(); }
  // ---- cheveux : une masse brune en bataille, la raie de travers, des mèches qui tombent sur le front
  form(g, [-78, -28, -80, -70, -62, -104, -24, -126, 18, -126, 52, -112, 70, -86, 58, -80, 40, -92, 14, -90, -10, -84, -30, -78, -50, -70, -64, -50], dim('#2a1b12'), { ao: .6, aw: 12, hi: .1 });
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const a = -Math.PI * .97 + r() * Math.PI * .82, rr = 70 + r() * 30, x0 = Math.cos(a) * 46, y0 = -66 + Math.sin(a) * 40, x1 = Math.cos(a) * rr + (r() - .5) * 16, y1 = -52 + Math.sin(a) * (rr + 10);
    g.strokeStyle = dim(['#3d2a1e', '#22160f', '#4a3424', '#1a110b'][r() * 4 | 0]); g.lineWidth = 2 + r() * 4;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (r() - .3) * 24, (y0 + y1) / 2 - 10 - r() * 12, x1, y1); g.stroke();
  }
  for (const [x0, y0, cx, cy, x1, y1] of [[-20, -96, -36, -80, -30, -58], [-8, -94, -14, -76, -4, -64], [-40, -92, -56, -78, -54, -60]]) { g.strokeStyle = dim('#2a1b12'); g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); }
  // sourcil (côté peau), très haut et arqué : l'air ravi, un peu fou
  sh(1, () => { g.beginPath(); g.moveTo(-54, -44); g.quadraticCurveTo(-38, -66, -12, -54); }, dim('#21140c'), 7);
  // ---- les yeux. Côté peau : un œil grand ouvert, la pupille trop petite, une poche dessous ; côté métal : une orbite vide, un objectif. Ils brillent même dans le noir
  sh(2, E(-30, -22, 19, 15, -.08), 'rgba(30,8,6,.6)');
  ell(g, -30, -22, 15.5, 12, dim('#efe4d8'), -.08);
  g.strokeStyle = `rgba(200,60,60,${.35 * lit})`; g.lineWidth = .8; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-45, -26 + k * 3); g.quadraticCurveTo(-40, -24 + k * 2, -37, -22 + k); g.stroke(); }
  sh(2, () => { g.beginPath(); g.ellipse(-30, -24, 17, 14, -.08, Math.PI * 1.05, Math.PI * 1.95); }, dim('#5a3226'), 3);
  sh(2, () => { g.beginPath(); g.ellipse(-31, -14, 16, 9, 0, Math.PI * .12, Math.PI * .88); }, 'rgba(80,36,26,.6)', 2.5);
  blob(g, [10, -40, 34, -46, 48, -30, 46, -8, 22, -2, 8, -18], '#06080a');
  g.strokeStyle = '#4a545e'; g.lineWidth = 2; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + .2; g.beginPath(); g.moveTo(28 + Math.cos(a) * 12, -22 + Math.sin(a) * 12); g.lineTo(28 + Math.cos(a) * 17, -22 + Math.sin(a) * 16); g.stroke(); }
  for (const [ex, rr] of [[-30, 7.5], [28, 9.5]]) {
    g.strokeStyle = `rgba(120,245,255,${.8 + .2 * Math.sin(t * 6 + ex)})`; g.lineWidth = 3.2; g.beginPath(); g.arc(ex, -22, rr, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(20,90,110,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(ex, -22, rr * .58, 0, Math.PI * 2); g.stroke();
    ell(g, ex + (ex < 0 ? 1.5 : 0), -22, 2, 2, '#f2ffff');
  }
  // ---- le nez, un peu tordu : arête claire, narines, ombre dessous
  sh(2, () => { g.beginPath(); g.moveTo(-6, -16); g.quadraticCurveTo(-14, 8, -6, 18); }, dim('#8a6250'), 3.5);
  sh(1, () => { g.beginPath(); g.moveTo(-3, -14); g.quadraticCurveTo(-8, 4, -2, 12); }, 'rgba(255,235,220,.35)', 2);
  sh(4, E(-1, 22, 14, 5), 'rgba(60,22,14,.45)'); ell(g, -10, 18, 3.6, 2.4, 'rgba(40,14,10,.7)', .3); ell(g, 6, 18, 3.4, 2.3, 'rgba(10,10,12,.75)', -.2);
  // ---- LE SOURIRE : de travers, le coin gauche plus haut ; des dents inégales mêlées de puces mémoire noires sur contacts dorés
  const my = 44, mw = 52 + open * 6;
  const top = k => my - 4 - k * k * 14 - k * 7 + vn(k * 3, 1) * 4;
  const bot = k => top(k) + (1 - k * k) * (15 + open * 42) + vn(k * 3, 5) * 3;
  const lipPath = () => { g.beginPath(); for (let k = -1; k <= 1.001; k += .08) g.lineTo(k * mw, top(k)); for (let k = 1; k >= -1.001; k -= .08) g.lineTo(k * mw * .95, bot(k)); g.closePath(); };
  sh(4, lipPath, 'rgba(60,20,14,.55)', 8);
  g.save(); lipPath(); g.fillStyle = '#080406'; g.fill(); g.clip(); if (open) { headPath(g); g.clip(); }
  if (open) ell(g, 0, my + 52, 34, 34, rad(g, 0, my + 52, 2, 44, [[0, 'rgba(255,70,40,.95)'], [.5, 'rgba(160,20,10,.6)'], [1, 'rgba(60,0,0,0)']]));
  for (const row of [0, 1]) {
    const rr = rng(row ? 31 : 13); let k = -1.05;
    while (k < 1.02) {
      const tw = (7 + rr() * 6) / mw, kk = k + tw / 2, tx = kk * mw, yy = row ? bot(kk) : top(kk), chip = rr() < .28, gap = rr() < .07;
      const th = (row ? -1 : 1) * (8 + (1 - kk * kk) * 7 + open * 6 + rr() * 4), tilt = (rr() - .5) * .3, light = rr() < .3;
      if (!gap) {
        g.save(); g.translate(tx, yy); g.rotate(tilt);
        rrect(g, -tw * mw / 2 + .6, row ? th : 0, tw * mw - 1.2, Math.abs(th), 1.5, chip ? '#111216' : dim(light ? '#d8cdb0' : '#ece6d6'));
        if (chip) { g.fillStyle = dim('#d8b14a'); g.fillRect(-tw * mw / 2 + 1, th - (row ? -2 : 2), tw * mw - 2, row ? -2 : 2); }
        else { g.fillStyle = 'rgba(120,90,60,.3)'; g.fillRect(tw * mw / 2 - 2.4, row ? th : 0, 1.6, Math.abs(th)); }
        g.restore();
      }
      k += tw;
    }
  }
  sh(5, lipPath, 'rgba(0,0,0,.6)', 8);
  g.restore();
  // lèvres et commissures creusées
  g.strokeStyle = dim('#6a3a2e'); g.lineWidth = 3; g.beginPath(); for (let k = -1; k <= 1.001; k += .08) g.lineTo(k * mw, top(k)); g.stroke();
  sh(2, () => { g.beginPath(); g.moveTo(-mw - 6, top(-1) - 14); g.quadraticCurveTo(-mw - 14, top(-1) + 2, -mw - 2, top(-1) + 12); }, 'rgba(60,25,15,.6)', 2.5);
  sh(2, () => { g.beginPath(); g.moveTo(mw + 4, top(1) - 8); g.quadraticCurveTo(mw + 10, top(1) + 4, mw, top(1) + 10); }, 'rgba(0,0,0,.6)', 2.5);
  g.restore();
}
// éclaircit / assombrit une couleur selon la lumière (0 noir, 1 normal)
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = n >> 8 & 255, b = n & 255, f = .08 + .92 * k;
  return `rgb(${r * f | 0},${gg * f | 0},${b * f * (1 + (1 - k) * .25) | 0})`;
}

// ---------- LE REVENDEUR : un grand robot maigre et voûté en imperméable, l'intérieur plein de barrettes volées ----------
function drawScalper(g, x, y, s, pose = 'stand', lit = .7, t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const dim = c => shade(c, lit), run = pose === 'run', F = (pts, c, o) => form(g, pts, dim(c), o);
  soft(g, 8, () => { g.beginPath(); g.ellipse(0, 2, 100, 16, 0, 0, Math.PI * 2); }, 'rgba(0,0,0,.55)');
  if (run) g.rotate(.22);
  // jambes en tiges, genoux pliés vers l'arrière comme un oiseau, pieds en pinces
  const sw = run ? Math.sin(t * 18) * 30 : 0;
  for (const sd of [-1, 1]) {
    const kx = sd * 30 + sd * sw * .5, fx = sd * 22 - sd * sw;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [c, w] of [[dim('#25292e'), 13], [dim('#8b939b'), 8], [dim('#c8d0d8'), 2]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(sd * 14, -226); g.quadraticCurveTo(kx + sd * 10, -170, kx, -112); g.quadraticCurveTo(kx - sd * 4, -60, fx, 0); g.stroke(); }
    ell(g, kx, -112, 9, 8, dim('#5a6168'));
    F([fx - 22, -2, fx - 6, -14, fx + 20, -10, fx + 26, 2, fx, 6], '#1c1e22', { aw: 6 });
  }
  g.save(); g.translate(0, -230); g.rotate(-.06); g.translate(0, 230);
  // l'imperméable : ouvert, trop long, l'ourlet effiloché, le dos voûté
  F([-56, -500, -14, -512, 50, -504, 74, -440, 86, -340, 100, -230, 108, -168, 80, -178, 60, -160, 34, -190, 10, -250, -12, -250, -36, -192, -58, -166, -84, -180, -104, -168, -92, -260, -80, -380, -76, -460], '#857452', { lx: -1, ao: .6, aw: 22 });
  for (const [x0, y0, cx, cy, x1, y1] of [[-60, -420, -70, -300, -78, -190], [62, -430, 74, -320, 88, -200], [-40, -300, -50, -240, -46, -200]]) soft(g, 3, () => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); }, 'rgba(20,12,0,.45)', 6);
  // la doublure sombre, avec les barrettes volées accrochées de travers
  blob(g, [-34, -474, 6, -480, 36, -470, 46, -360, 40, -260, 10, -272, -16, -270, -44, -258, -46, -370], dim('#17110c'));
  const rr = rng(17);
  for (let i = 0; i < 13; i++) { const bx = -34 + (i % 4) * 19 + rr() * 5, by = -456 + (i >> 2) * 54 + rr() * 10; g.save(); g.translate(bx, by); g.rotate((rr() - .5) * .45); rrect(g, -6, 0, 12, 42 + rr() * 12, 2, dim(['#1f7a4a', '#2a5fa8', '#1f7a4a', '#7a2a2a'][i % 4])); g.fillStyle = dim('#d8b14a'); g.fillRect(-5, 40, 10, 3); g.restore(); }
  soft(g, 8, () => blobPath(g, [-34, -474, 6, -480, 36, -470, 46, -360, 40, -260, 10, -272, -16, -270, -44, -258, -46, -370]), 'rgba(0,0,0,.7)', 14);
  // le col relevé, de travers
  F([-60, -500, -28, -540, -12, -498, -30, -480], '#6e6146', { aw: 6 }); F([56, -504, 24, -544, 8, -496, 30, -484], '#6a5d42', { aw: 6 });
  // bras maigres ; l'un tient un sac de barrettes qui pend
  g.lineCap = 'round'; for (const [c, w] of [[dim('#25292e'), 13], [dim('#8b939b'), 8]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(-56, -470); g.quadraticCurveTo(-96, -380, -84, -330); g.quadraticCurveTo(-70, -280, -76, -240); g.stroke(); g.beginPath(); g.moveTo(52, -470); g.quadraticCurveTo(run ? 130 : 96, -380, run ? 150 : 98, -300); g.stroke(); }
  for (const [hx, hy] of [[-76, -236], [run ? 150 : 98, -296]]) for (let k = 0; k < 3; k++) { g.strokeStyle = dim('#5a6168'); g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - 8 + k * 8, hy + 16 + (k % 2) * 4); g.stroke(); }
  F([(run ? 150 : 98) - 30, -292, (run ? 150 : 98) + 4, -300, (run ? 150 : 98) + 36, -280, (run ? 150 : 98) + 40, -214, (run ? 150 : 98) - 2, -206, (run ? 150 : 98) - 38, -220], '#3a2f5c', { aw: 12 });
  g.fillStyle = dim('#d8b14a'); g.font = 'bold 26px Georgia'; g.save(); g.translate(run ? 136 : 84, -240); g.rotate(-.1); g.fillText('Go', 0, 0); g.restore();
  // la tête : un crâne d'acier étroit, penché en avant, un seul œil-caméra rouge, une grille de haut-parleur pour bouche
  g.save(); g.translate(6, -560); g.rotate(.14);
  F([-26, -42, 14, -48, 34, -22, 32, 18, 16, 40, -10, 42, -30, 18, -36, -12], '#9aa4ae', { lx: -1, ao: .6, aw: 12, hi: .3 });
  wline(g, [0, -46, 4, -20, -2, 10], 'rgba(0,0,0,.45)', 2, 1);
  ell(g, 12, -2, 12, 11, '#08080a'); ell(g, 12, -2, 6, 6, `rgba(255,50,40,${.75 + .25 * Math.sin(t * 9)})`); ell(g, 14, -4, 2, 2, '#ffd0c8');
  blob(g, [-24, -10, -12, -14, -10, 0, -22, 4], '#0b0b0d');
  g.strokeStyle = dim('#1a1c1e'); g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-14 + i * 6, 22 + (i % 2)); g.lineTo(-13 + i * 6, 32); g.stroke(); }
  // le chapeau, cabossé et de travers
  g.rotate(-.2); F([-62, -40, -20, -48, 30, -46, 66, -36, 40, -30, -40, -30], '#2b2620', { aw: 6 });
  F([-34, -42, -32, -84, -6, -92, 20, -88, 34, -82, 36, -42], '#332c24', { lx: -1, aw: 10 });
  blob(g, [-34, -50, 36, -52, 36, -42, -34, -42], dim('#5a2020'));
  g.restore(); g.restore(); g.restore();
}
// un caddie plein de boîtes de RAM, une roue tordue
function drawCart(g, x, y, s, lit) {
  g.save(); g.translate(x, y); g.scale(s, s); const dim = c => shade(c, lit);
  for (let i = 0; i < 6; i++) { g.save(); g.translate(-86 + i * 28, -196 + (i % 2) * 14 + (i * 7 % 5)); g.rotate((i * 37 % 7 - 3) * .04); form(g, [0, 0, 26, 0, 26, 50, 0, 50], dim(['#2a5fa8', '#1f7a4a', '#a83a3a'][i % 3]), { aw: 6, path: (g, p) => wobPath(g, p) }); g.restore(); }
  for (let i = 0; i <= 6; i++) wline(g, [-90 + i * 30, -150, -80 + i * 26, -50], dim('#9aa3ab'), 4, 1.5);
  wline(g, [-100, -150, 100, -150, 80, -50, -80, -50, -100, -150], dim('#b0b8c0'), 5, 1.5);
  ell(g, -70, -10, 12, 12, dim('#151515')); ell(g, 72, -14, 10, 13, dim('#151515'), .5);
  g.restore();
}
// ---------- LES PUCES : des petites araignées-drones faites d'une barrette, six pattes, un œil vert ----------
function drawChip(g, x, y, s, lit, t, k = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(t * 7 + k) * .15);
  const dim = c => shade(c, lit);
  g.strokeStyle = dim('#2c3036'); g.lineWidth = 4; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const a = Math.sin(t * 14 + i * 2 + k) * 6; g.beginPath(); g.moveTo(sd * 20, -6 + i * 8); g.lineTo(sd * 44, -22 + i * 12 + a); g.lineTo(sd * 52, 8 + i * 8 + a); g.stroke(); }
  rrect(g, -30, -16, 60, 30, 3, dim('#1f7a4a'));
  for (let i = 0; i < 4; i++) { g.fillStyle = '#0d0d10'; g.fillRect(-26 + i * 14, -12, 10, 16); }
  g.fillStyle = dim('#d8b14a'); g.fillRect(-28, 10, 56, 4);
  ell(g, 0, -24, 9, 9, '#0b0d0b'); ell(g, 0, -24, 5, 5, `rgba(120,255,120,${.8 + .2 * Math.sin(t * 11 + k)})`); ell(g, 0, -24, 14, 14, 'rgba(120,255,120,.15)');
  g.restore();
}

// ---------- LES PIÈCES vues par les caméras : une boîte en perspective, des accessoires, une lampe ----------
// chaque pièce : un fond (sans lumière), un calque d'ombre (posé par-dessus les personnages), et les places où se tiennent les personnages
function roomBox(g, o) {
  const { bx = 380, by = 170, bw = 520, bh = 300, wall = '#3b3f45', floor = '#2a2a2c', ceil = '#1b1c20', seed = 1 } = o, r = rng(seed);
  poly(g, [0, 0, W, 0, bx + bw, by, bx, by], lin(g, 0, 0, 0, by, [[0, shade(ceil, .5)], [1, ceil]]));
  poly(g, [0, H, W, H, bx + bw, by + bh, bx, by + bh], lin(g, 0, H, 0, by + bh, [[0, floor], [1, shade(floor, .45)]]));
  poly(g, [0, 0, bx, by, bx, by + bh, 0, H], lin(g, 0, 0, bx, 0, [[0, shade(wall, .55)], [1, shade(wall, .85)]]));
  poly(g, [W, 0, bx + bw, by, bx + bw, by + bh, W, H], lin(g, W, 0, bx + bw, 0, [[0, shade(wall, .5)], [1, shade(wall, .8)]]));
  poly(g, [bx, by, bx + bw, by, bx + bw, by + bh, bx, by + bh], wall);
  // la peinture des murs : des plaques repeintes, des traces d'humidité qui coulent du plafond
  for (let i = 0; i < 9; i++) { const px = r() * W, py = 40 + r() * (by + bh - 60), w = 60 + r() * 200, h = 40 + r() * 140; soft(g, 14, () => blobPath(g, [px, py, px + w, py + r() * 20, px + w - r() * 30, py + h, px + r() * 20, py + h * .8]), `rgba(${r() < .5 ? '0,0,0' : '255,240,210'},${.04 + r() * .06})`); }
  for (let i = 0; i < 6; i++) { const px = r() * W, py = r() * 80, len = 80 + r() * 260; soft(g, 6, () => { g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px + 8, py + len * .3, px - 10, py + len * .6, px + 4, py + len); }, 'rgba(30,22,10,.22)', 6 + r() * 14); }
  // le sol : un carrelage qui ne tombe jamais juste, des carreaux cassés, une flaque
  const fy = k => by + bh + (H - by - bh) * Math.pow(k, 1.8), fx = (x0, y) => W / 2 + (x0 - W / 2) * (1 + (y - by - bh) / (H - by - bh) * 2.2);
  for (let i = 0; i <= 10; i++) { const x0 = bx + bw * i / 10; wline(g, [x0, by + bh, fx(x0, H), H], 'rgba(0,0,0,.38)', 2, 1.8); }
  for (let j = 1; j < 8; j++) { const yy = fy(j / 8); wline(g, [0, yy, W, yy], 'rgba(0,0,0,.38)', 2, 1.8); }
  for (let i = 0; i < 5; i++) { const j = 1 + r() * 6 | 0, y0 = fy(j / 8), y1 = fy((j + 1) / 8), c = r() * 10 | 0, x0 = bx + bw * c / 10, x1 = bx + bw * (c + 1) / 10;
    poly(g, [fx(x0, y0), y0, fx(x1, y0), y0, fx(x1, y1), y1, fx(x0, y1), y1], `rgba(0,0,0,${.15 + r() * .25})`); wline(g, [fx(x0, y0) + 6, y0 + 3, (fx(x0, y1) + fx(x1, y0)) / 2, (y0 + y1) / 2 + 4, fx(x1, y1) - 8, y1 - 2], 'rgba(0,0,0,.6)', 1.5, 3); }
  { const px = 200 + r() * 800, py = by + bh + 60 + r() * 120; soft(g, 4, () => blobPath(g, [px, py, px + 120, py - 8, px + 200, py + 14, px + 140, py + 34, px + 30, py + 30, px - 30, py + 12]), 'rgba(140,170,190,.08)'); }
  // le coin sombre où le mur rejoint le sol et le plafond
  soft(g, 12, () => { g.beginPath(); g.moveTo(0, H); g.lineTo(bx, by + bh); g.lineTo(bx + bw, by + bh); g.lineTo(W, H); }, 'rgba(0,0,0,.6)', 26);
  soft(g, 12, () => { g.beginPath(); g.moveTo(0, 0); g.lineTo(bx, by); g.lineTo(bx + bw, by); g.lineTo(W, 0); }, 'rgba(0,0,0,.5)', 22);
  // au plafond : des tuyaux qui serpentent, des câbles qui pendent, des néons de longueurs différentes (l'un décroché, de travers)
  for (let i = 0; i < 2; i++) { const y0 = 10 + r() * 40; wline(g, [0, y0 + 20, bx * .5, y0 + by * .3, bx, by * .5 + y0 * .4, bx + bw * .5, by * .6, bx + bw, by * .5, W, y0], shade('#5a5040', .6), 10 - i * 4, 3); }
  for (let i = 0; i < 4; i++) { const x0 = r() * W, x1 = x0 + 100 + r() * 300, y0 = 10 + r() * by * .7, sag = 30 + r() * 90; soft(g, 1, () => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + sag, x1, y0 + r() * 30); }, '#0b0b0c', 3 + r() * 3); }
  for (let i = 0; i < 3; i++) {
    const k = .25 + i * .25, cx = W / 2 + (r() - .5) * 60, cy = by * (1 - k) * .9 + 10, w = 320 * (1.4 - k) * (.8 + r() * .3), hh = 12 * (1.4 - k);
    g.save(); g.translate(cx, cy); if (i === 1) g.rotate(.1); rrect(g, -w / 2, 0, w, hh, 3, '#34373a'); rrect(g, -w / 2 + 4, hh * .4, w - 8, hh * .35, 2, i === 1 ? '#5a5a50' : '#8a8a80'); g.restore();
  }
  grime(g, 0, 0, W, H, 2600, seed);
}
// un carton : jamais tout à fait droit, un scotch, un coin écrasé
function crate(g, x, y, w, h, seed, c = '#6a5236') {
  const r = rng(seed); g.save(); g.translate(x + w / 2, y + h); g.rotate((r() - .5) * .08);
  form(g, [-w / 2, -h, w / 2, -h + r() * 4, w / 2 - r() * 3, 0, -w / 2, 0], c, { path: (g, p) => wobPath(g, p), aw: 14, ao: .5, hi: .12 });
  g.fillStyle = 'rgba(200,180,140,.35)'; g.fillRect(-w / 2, -h + h * .45, w, h * .1); wline(g, [-w / 2 + 6, -h + 4, -w / 2 + 16 + r() * 20, -h + 14 + r() * 10], 'rgba(0,0,0,.4)', 1.5, 1);
  g.restore();
}
// un rack de serveurs : armoire noire, rangées de LED (posées dans la couche « lumières » pour clignoter) ; certains baies vides, une porte entrouverte, des câbles qui pendent
function rack(g, x, y, w, h, seed, leds) {
  const r = rng(seed); h += (r() - .5) * 30; y += (r() - .5) * 10;
  form(g, [x, y, x + w, y, x + w, y + h, x, y + h], '#1d2024', { path: (g, p) => wobPath(g, p, true, 1.2), aw: 10, ao: .6, hi: .08 });
  const rows = Math.floor(h / 22) - 1;
  for (let i = 0; i < rows; i++) {
    const yy = y + 12 + i * 22; if (r() < .12) { g.fillStyle = '#060607'; g.fillRect(x + 8, yy, w - 16, 16); continue; }
    const tall = r() < .15 && i < rows - 1; rrect(g, x + 8, yy, w - 16, tall ? 38 : 16, 2, '#0b0c0e', '#30343a', 1);
    for (let k = 0; k < 3; k++) if (r() < .75) leds.push([x + w - 26 + k * 7, yy + 8, r() < .7 ? 'g' : r() < .5 ? 'a' : 'r', r()]);
    g.fillStyle = '#202328'; const n = 3 + r() * 5 | 0; for (let k = 0; k < n; k++) g.fillRect(x + 14 + k * 6, yy + 4, 3, 8);
    if (tall) i++;
  }
  for (let i = 0; i < 2; i++) if (r() < .6) { const x0 = x + 10 + r() * (w - 20), y0 = y + 20 + r() * h * .5; soft(g, .8, () => { g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x0 + (r() - .5) * 40, y0 + 60, x0 + (r() - .5) * 60, y0 + 120, x0 + (r() - .5) * 30, y + h + 6); }, ['#1a3a8a', '#b02a2a', '#d0a02a', '#111'][r() * 4 | 0], 2.5); }
  if (r() < .3) { g.save(); g.translate(x + w, y); g.transform(1, .12, 0, 1, 0, 0); g.fillStyle = 'rgba(30,34,38,.9)'; g.fillRect(0, 0, w * .3, h); g.restore(); }
}
const ROOMS = {
  1: { name: 'LABO DE R. ALTMAN', draw(g, L) {
    roomBox(g, { wall: '#3a3446', floor: '#232028', seed: 11 });
    // la cuve de recharge où il dort : un caisson vitré, des câbles
    rrect(g, 540, 200, 200, 300, 14, 'rgba(60,200,200,.08)', '#5a6a70', 4);
    g.strokeStyle = '#141416'; g.lineWidth = 7; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(560 + i * 30, 200); g.bezierCurveTo(500 + i * 40, 120, 700 - i * 30, 60, 640 + i * 10, 0); g.stroke(); }
    // tableau blanc avec un schéma « toute la RAM du monde »
    rrect(g, 120, 210, 260, 170, 4, '#c9c6bc'); g.strokeStyle = '#2a4a9a'; g.lineWidth = 3; g.beginPath(); g.arc(250, 300, 60, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#9a2a2a'; g.font = 'bold 22px Arial'; g.fillText('TOUTE LA RAM', 168, 240); g.font = '16px Arial'; g.fillStyle = '#2a4a9a'; g.fillText('du monde', 214, 304); g.fillText('→ x1000 Go', 290, 370);
    rack(g, 900, 220, 110, 280, 3, L); rack(g, 1030, 230, 100, 300, 4, L);
    poly(g, [430, 600, 850, 600, 900, 720, 380, 720], '#2e2a26'); g.fillStyle = '#1a1714'; g.fillRect(450, 560, 380, 40);
    for (let i = 0; i < 9; i++) rrect(g, 470 + i * 38, 548, 16, 28, 2, ['#1f7a4a', '#2a5fa8'][i % 2]);
  }, light: [640, 120, 520], spots: { ram: [640, 520, .62] } },
  2: { name: 'SALLE DES SERVEURS', draw(g, L) {
    roomBox(g, { wall: '#2c3238', floor: '#1e2226', bx: 440, bw: 400, by: 190, bh: 260, seed: 22 });
    for (let i = 0; i < 4; i++) { rack(g, 30 + i * 100, 160 - i * 18, 84, 420 - i * 40, 20 + i, L); rack(g, 1166 - i * 100, 160 - i * 18, 84, 420 - i * 40, 30 + i, L); }
    for (let i = 0; i < 3; i++) rack(g, 470 + i * 120, 220, 100, 220, 40 + i, L);
    g.fillStyle = 'rgba(80,140,255,.05)'; g.fillRect(0, 0, W, H);
  }, light: [640, 80, 620], spots: { ram: [640, 470, .5], scalper: [760, 470, .5] } },
  3: { name: 'COULOIR OUEST', draw(g, L) {
    roomBox(g, { wall: '#4a4436', floor: '#2b2822', bx: 560, bw: 160, by: 250, bh: 200, seed: 33 });
    // affiches : « la RAM est le nouveau pétrole », un avis de recherche
    rrect(g, 120, 210, 150, 210, 2, '#d8cdb0'); g.fillStyle = '#7a1a1a'; g.font = 'bold 20px Arial'; g.fillText('PERDU', 150, 250); g.fillStyle = '#333'; g.font = '14px Arial'; g.fillText('barrette 16 Go', 140, 380); g.fillText('récompense', 152, 400);
    rrect(g, 150, 270, 90, 90, 2, '#1f7a4a');
    rrect(g, 1010, 230, 170, 120, 2, '#22324a'); g.fillStyle = '#9ac4ff'; g.font = 'bold 16px Arial'; g.fillText('CLOSEDRAM', 1040, 280); g.font = '12px Arial'; g.fillText('« Partagez votre RAM »', 1022, 310);
    g.fillStyle = '#ff3a3a'; g.fillRect(612, 255, 56, 18); g.fillStyle = '#fff'; g.font = 'bold 12px Arial'; g.fillText('SORTIE', 618, 268);
  }, light: [640, 160, 420], spots: { ram: [640, 520, .62] } },
  4: { name: 'COIN OUEST', draw(g, L) {
    roomBox(g, { wall: '#43403a', floor: '#29271f', bx: 160, bw: 300, by: 160, bh: 330, seed: 44 });
    // la porte de ton bureau, au bout, à gauche ; un extincteur ; des cartons
    rrect(g, 230, 230, 150, 260, 2, '#1b1a18', '#6a6050', 4);
    rrect(g, 980, 300, 40, 110, 8, '#9a1a1a'); rrect(g, 990, 288, 20, 16, 2, '#222');
    crate(g, 700, 520, 150, 120, 1); crate(g, 860, 530, 120, 110, 2, '#5e4830'); crate(g, 740, 410, 120, 104, 3, '#73593a');
    g.fillStyle = '#2a1a0a'; g.font = 'bold 18px Arial'; g.fillText('FRAGILE', 730, 590);
  }, light: [500, 140, 520], spots: { ram: [610, 610, .8] } },
  5: { name: 'QUAI DE LIVRAISON', draw(g, L) {
    roomBox(g, { wall: '#3c3a33', floor: '#24231f', bx: 300, bw: 680, by: 160, bh: 330, seed: 55 });
    // le rideau métallique du quai, des palettes, un rideau en lanières
    rrect(g, 380, 190, 520, 300, 2, '#4a4c50');
    g.strokeStyle = '#2a2b2e'; g.lineWidth = 3; for (let i = 0; i < 20; i++) { g.beginPath(); g.moveTo(380, 200 + i * 15); g.lineTo(900, 200 + i * 15); g.stroke(); }
    for (let i = 0; i < 4; i++) { g.save(); g.translate(90 + i * 40 + i * i * 3, 500 - i * 30); g.rotate((i % 2 - .5) * .05); crate(g, 0, -26, 200, 26, 10 + i, '#7a5a34'); g.restore(); }
    [[940, 520, 90, 80], [1036, 530, 80, 70], [952, 440, 80, 78], [1040, 462, 70, 66], [990, 366, 74, 72]].forEach(([x, y, w, h], i) => crate(g, x, y, w, h, 20 + i, ['#6a5236', '#5e4830', '#73593a'][i % 3]));
    g.fillStyle = 'rgba(255,200,40,.6)'; for (let i = 0; i < 12; i++) poly(g, [300 + i * 60, 680, 330 + i * 60, 680, 350 + i * 60, 700, 320 + i * 60, 700], i % 2 ? '#e0b02a' : '#1a1a1a');
  }, light: [640, 120, 600], spots: { scalper: [760, 560, .62], cart: [560, 590, .7] } },
  6: { name: 'COULOIR EST', draw(g, L) {
    roomBox(g, { wall: '#3a4040', floor: '#22282a', bx: 560, bw: 160, by: 250, bh: 200, seed: 66 });
    for (let i = 0; i < 4; i++) { g.strokeStyle = '#191b1c'; g.lineWidth = 10 - i * 2; g.beginPath(); g.moveTo(0, 60 + i * 22); g.lineTo(560, 252 + i * 6); g.stroke(); }
    rrect(g, 1030, 220, 120, 180, 2, '#c8c2b0'); g.fillStyle = '#333'; g.font = 'bold 16px Arial'; g.fillText('CONSIGNES', 1042, 250); g.font = '12px Arial';
    ['1. Ne pas ouvrir', '   à R. Altman.', '2. Ne pas vendre', '   la RAM.', '3. Fermer la', '   trappe.'].forEach((l, i) => g.fillText(l, 1040, 280 + i * 18));
  }, light: [640, 160, 420], spots: { ram: [640, 520, .62], scalper: [640, 560, .7] } },
  7: { name: 'GAINE DE VENTILATION', draw(g, L) {
    // un conduit carré en métal, vu de l'intérieur, qui file jusqu'à ta grille
    const bx = 540, by = 270, bw = 200, bh = 150;
    poly(g, [0, 0, W, 0, bx + bw, by, bx, by], '#4a4e52'); poly(g, [0, H, W, H, bx + bw, by + bh, bx, by + bh], '#3a3d40');
    poly(g, [0, 0, bx, by, bx, by + bh, 0, H], '#55595e'); poly(g, [W, 0, bx + bw, by, bx + bw, by + bh, W, H], '#45494d');
    g.fillStyle = '#0a0a0b'; g.fillRect(bx, by, bw, bh);
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3;
    for (let j = 1; j < 6; j++) { const k = j / 6, x0 = bx * k, y0 = by * k, x1 = W - (W - bx - bw) * k, y1 = H - (H - by - bh) * k; g.strokeRect(x0, y0, x1 - x0, y1 - y0); }
    grime(g, 0, 0, W, H, 1800, 77, .25);
  }, light: [640, 340, 700], spots: {} },
  8: { name: 'SALLE DE PAUSE', draw(g, L) {
    roomBox(g, { wall: '#4a3c36', floor: '#2b2420', bx: 380, bw: 520, by: 180, bh: 290, seed: 88 });
    // distributeur, table, une affiche de motivation
    rrect(g, 120, 200, 180, 330, 6, '#7a1f2a'); rrect(g, 140, 230, 140, 200, 2, 'rgba(160,220,255,.25)');
    for (let i = 0; i < 12; i++) rrect(g, 150 + (i % 4) * 32, 245 + Math.floor(i / 4) * 60, 22, 40, 2, ['#e0b02a', '#2a5fa8', '#1f7a4a'][i % 3]);
    poly(g, [520, 520, 820, 520, 860, 560, 480, 560], '#6a5440'); g.fillStyle = '#3a2c20'; g.fillRect(500, 560, 12, 90); g.fillRect(830, 560, 12, 90);
    rrect(g, 960, 230, 160, 200, 2, '#20283a'); g.fillStyle = '#e8d080'; g.font = 'bold 18px Georgia'; g.fillText('PATIENCE', 990, 300); g.font = '13px Georgia'; g.fillStyle = '#c0c8d8'; g.fillText('La RAM vient', 990, 340); g.fillText('à qui attend.', 992, 360);
  }, light: [640, 120, 560], spots: { ram: [660, 560, .7] } },
};

// le calque d'ombre d'une pièce : noir partout sauf sous sa lampe
function roomShade(room) {
  const c = mkCanvas(W, H), g = c.getContext('2d'), [lx, ly, lr] = room.light;
  g.fillStyle = rad(g, lx, ly + lr * .5, 20, lr * 1.25, [[0, 'rgba(0,0,0,0)'], [.55, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,.93)']]); g.fillRect(0, 0, W, H);
  return c;
}
function buildRooms() {
  const out = {};
  for (const [k, room] of Object.entries(ROOMS)) {
    const c = mkCanvas(W, H), g = c.getContext('2d'), leds = [];
    room.draw(g, leds);
    out[k] = { base: c, shade: roomShade(room), leds, ...room };
  }
  return out;
}

// ---------- LE BUREAU : panoramique 1920×720 ----------
const DOOR_L = { x: 120, w: 300 }, DOOR_R = { x: 1500, w: 300 }, DOOR_Y = 110, DOOR_H = 470;
function buildOffice() {
  const c = mkCanvas(OW, H), g = c.getContext('2d');
  // murs en béton peint, plafond bas, sol en lino
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#1e2124'], [.18, '#3b3f42'], [.75, '#33363a'], [.76, '#25221e'], [1, '#141210']]); g.fillRect(0, 0, OW, H);
  const r = rng(404); for (let x = 30; x < OW; x += 60 + r() * 50) wline(g, [x, 100, x + (r() - .5) * 6, 330, x + (r() - .5) * 6, 556], 'rgba(0,0,0,.28)', 2, 1.5);
  for (let i = 0; i < 16; i++) { const px = r() * OW, py = 100 + r() * 380, w = 80 + r() * 260, h = 40 + r() * 160; soft(g, 16, () => blobPath(g, [px, py, px + w, py + r() * 30, px + w - r() * 40, py + h, px + r() * 30, py + h * .8]), `rgba(${r() < .6 ? '0,0,0' : '255,240,210'},${.05 + r() * .07})`); }
  for (let i = 0; i < 12; i++) { const px = r() * OW, len = 60 + r() * 300; soft(g, 5, () => { g.beginPath(); g.moveTo(px, 96); g.bezierCurveTo(px + 8, 96 + len * .3, px - 10, 96 + len * .6, px + 4, 96 + len); }, 'rgba(30,22,10,.25)', 5 + r() * 14); }
  grime(g, 0, 90, OW, 460, 6000, 5, .2);
  // plafond : dalles et bouche d'aération (la trappe se dessine par-dessus)
  g.fillStyle = '#16181a'; g.fillRect(0, 0, OW, 96);
  g.strokeStyle = '#0c0d0e'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * 170, 0); g.lineTo(i * 170 + 40, 96); g.stroke(); }
  rrect(g, 860, 18, 200, 70, 4, '#0a0b0c', '#5a5e62', 5);
  // les deux encadrements de porte : couloirs noirs au fond
  for (const d of [DOOR_L, DOOR_R]) {
    rrect(g, d.x - 26, DOOR_Y - 26, d.w + 52, DOOR_H + 30, 4, lin(g, d.x, 0, d.x + d.w, 0, [[0, '#4a4e52'], [.5, '#6a6e72'], [1, '#3a3e42']]));
    g.fillStyle = '#030304'; g.fillRect(d.x, DOOR_Y, d.w, DOOR_H);
    // les rails du rideau métallique et le bandeau jaune et noir
    for (let i = 0; i < 14; i++) poly(g, [d.x - 26 + i * 26, DOOR_Y - 26, d.x - 10 + i * 26, DOOR_Y - 26, d.x - 26 + i * 26 + 26, DOOR_Y - 10, d.x - 26 + i * 26 + 10, DOOR_Y - 10], i % 2 ? '#d8a820' : '#151515');
  }
  // fenêtre sur la salle des serveurs, derrière le bureau
  rrect(g, 700, 150, 520, 220, 4, '#06080a', '#5a5e62', 8);
  const leds = []; for (let i = 0; i < 5; i++) rack(g, 720 + i * 100, 170, 80, 200, 90 + i, leds);
  g.fillStyle = 'rgba(120,180,255,.06)'; g.fillRect(700, 150, 520, 220); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 3; g.beginPath(); g.moveTo(720, 360); g.lineTo(840, 160); g.moveTo(760, 360); g.lineTo(880, 160); g.stroke();
  // affiches
  g.save(); g.translate(590, 265); g.rotate(-.035); g.translate(-590, -265); rrect(g, 520, 170, 140, 190, 2, '#d9cfb4'); g.fillStyle = '#1a1a1a'; g.font = 'bold 18px Georgia'; g.fillText('OCTET', 556, 210); g.fillText('& FILS', 554, 234);
  g.font = '12px Georgia'; ['depuis 1987', '', 'Votre RAM,', 'notre devoir.'].forEach((l, i) => g.fillText(l, 548, 270 + i * 18));
  g.restore(); g.save(); g.translate(1340, 255); g.rotate(.05); g.translate(-1340, -255); rrect(g, 1260, 180, 160, 150, 2, '#2a2a30'); g.fillStyle = '#ff5a4a'; g.font = 'bold 15px Arial'; g.fillText('NE JAMAIS', 1290, 220); g.fillText('DONNER', 1300, 244); g.fillText('SA RAM', 1302, 268);
  g.fillStyle = '#9aa'; g.font = '11px Arial'; g.fillText('(même s\'il sourit)', 1290, 300);
  g.restore();
  // le bureau : plateau en bois sombre au premier plan
  poly(g, [380, 560, 1540, 560, 1640, 720, 280, 720], lin(g, 0, 560, 0, 720, [[0, '#4a3524'], [1, '#22170e']]));
  g.fillStyle = '#5a4230'; g.fillRect(380, 552, 1160, 10);
  grime(g, 300, 560, 1320, 160, 1200, 9, .25);
  soft(g, 10, () => { g.beginPath(); g.moveTo(380, 566); g.lineTo(1540, 566); }, 'rgba(0,0,0,.6)', 18);
  // sur le bureau : des feuilles en vrac, un clavier, un ventilateur de bureau, des câbles
  for (const [px, py, a, c] of [[1170, 660, .2, '#d8d4c8'], [1450, 640, -.15, '#cfcab8'], [1220, 690, .4, '#e0dcd0'], [420, 640, -.3, '#d4d0c0']]) { g.save(); g.translate(px, py); g.rotate(a); form(g, [-50, -34, 52, -32, 50, 36, -48, 34], c, { path: (g, p) => wobPath(g, p), aw: 8, ao: .3 }); g.strokeStyle = 'rgba(40,40,60,.35)'; g.lineWidth = 1.5; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-40, -22 + k * 9); g.lineTo(10 + r() * 34, -22 + k * 9); g.stroke(); } g.restore(); }
  g.save(); g.translate(1000, 640); g.rotate(-.05); form(g, [-110, -26, 110, -30, 116, 22, -112, 26], '#1c1d20', { path: (g, p) => wobPath(g, p), aw: 10 }); for (let k = 0; k < 4; k++) for (let i = 0; i < 14; i++) rrect(g, -100 + i * 14.5 + k * 2, -20 + k * 11, 12, 9, 2, '#2c2e32'); g.restore();
  g.save(); g.translate(1260, 470); ell(g, 0, 80, 40, 10, '#151617'); g.strokeStyle = '#2a2c30'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 80); g.quadraticCurveTo(-6, 40, 0, 6); g.stroke(); ell(g, 0, 0, 48, 50, '#202226'); g.strokeStyle = '#3a3d42'; g.lineWidth = 2; for (let k = 0; k < 10; k++) { g.beginPath(); g.ellipse(0, 0, 48 - k * 4.4, 50 - k * 4.6, 0, 0, Math.PI * 2); g.stroke(); } for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 48, Math.sin(a) * 50); g.stroke(); } ell(g, 0, 0, 9, 9, '#4a4d52'); g.restore();
  for (let i = 0; i < 3; i++) soft(g, 1, () => { g.beginPath(); g.moveTo(680 + i * 6, 572); g.bezierCurveTo(700 + i * 30, 640, 600 - i * 40, 680, 560 + i * 60, 720); }, ['#111', '#18181c', '#2a2420'][i], 5);
  // l'écran de surveillance (son contenu est dessiné à part), un mug, des post-it, la lampe
  rrect(g, 560, 410, 240, 160, 8, '#16181b', '#2a2d31', 4); rrect(g, 660, 568, 40, 14, 2, '#202326');
  rrect(g, 1380, 500, 46, 60, 6, '#e8e4dc'); g.strokeStyle = '#e8e4dc'; g.lineWidth = 6; g.beginPath(); g.arc(1430, 528, 14, -1.2, 1.2); g.stroke();
  g.fillStyle = '#2a1608'; g.fillRect(1384, 504, 38, 8);
  for (const [px, py, cl, txt] of [[820, 470, '#f0e070', '6h = fin'], [880, 488, '#f0a0c0', 'trappe !!'], [500, 468, '#a0e0f0', 'Q / D']]) { g.save(); g.translate(px, py); g.rotate(-.06); g.fillStyle = cl; g.fillRect(0, 0, 70, 56); g.fillStyle = '#333'; g.font = '13px Arial'; g.fillText(txt, 6, 30); g.restore(); }
  return { c, leds };
}

// ---------- la lumière : un personnage dessiné à part, ombré d'un côté et en bas, puis posé dans la scène ----------
const _cc = mkCanvas(1000, 1000), _cg = _cc.getContext('2d');
// side : -1 la lumière vient de la gauche, 1 de la droite, 0 d'en haut ; amb : la part de lumière du côté sombre
// key : si donné, le personnage n'est dessiné qu'une fois puis repris d'une image en mémoire (les flous coûtent cher à chaque image)
const _charCache = new Map();
function litChar(g, draw, x, y, s, side = -1, amb = .45, key) {
  const ck = key && key + '|' + s + '|' + side + '|' + amb, hit = ck && _charCache.get(ck), w = Math.ceil(600 * s), h = Math.ceil(780 * s);
  if (hit) return g.drawImage(hit, x - w / 2, y - h + 20 * s);
  _litChar(draw, s, side, amb);
  if (!ck) return g.drawImage(_cc, x - 500, y - 980);
  const c = mkCanvas(w, h); c.getContext('2d').drawImage(_cc, 500 - w / 2, 980 - h + 20 * s, w, h, 0, 0, w, h); _charCache.set(ck, c);
  g.drawImage(c, x - w / 2, y - h + 20 * s);
}
function _litChar(draw, s, side, amb) {
  _cg.setTransform(1, 0, 0, 1, 0, 0); _cg.globalCompositeOperation = 'source-over'; _cg.clearRect(0, 0, 1000, 1000);
  draw(_cg, 500, 980, s);
  _cg.globalCompositeOperation = 'source-atop';
  if (side) { _cg.fillStyle = lin(_cg, side < 0 ? 300 : 700, 0, side < 0 ? 700 : 300, 0, [[0, 'rgba(255,240,220,.06)'], [.5, 'rgba(0,0,0,.05)'], [1, `rgba(0,0,8,${1 - amb})`]]); _cg.fillRect(0, 0, 1000, 1000); }
  _cg.fillStyle = lin(_cg, 0, 980 - 700 * s, 0, 980, [[0, 'rgba(0,0,0,0)'], [.55, 'rgba(0,0,0,.1)'], [1, 'rgba(0,0,0,.6)']]); _cg.fillRect(0, 0, 1000, 1000);
  _cg.globalCompositeOperation = 'source-over';
}
// la lueur des yeux et des LED, ajoutée en dernier (mode « lighter ») pour qu'elle perce le noir
function glow(g, x, y, r, rgb, a = .8) {
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = rad(g, x, y, 0, r, [[0, `rgba(${rgb},${a})`], [.25, `rgba(${rgb},${a * .35})`], [1, `rgba(${rgb},0)`]]); g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}
// les yeux suivent les mêmes rotations que le dessin (tête penchée, corps penché pour 'lean')
const _rot = (px, py, a, cx = 0, cy = 0) => { const c = Math.cos(a), n = Math.sin(a), dx = px - cx, dy = py - cy; return [cx + dx * c - dy * n, cy + dx * n + dy * c]; };
const ramEyes = (x, y, s, pose) => [[-30, -22], [28, -22]].map(([ex, ey]) => {
  if (pose === 'peek') return [x + s * ex, y + s * ey];
  let [px, py] = _rot(6 + ex, -92 + ey, -.11); py -= 470;
  if (pose === 'lean') [px, py] = _rot(px, py, .14, 0, -250);
  return [x + s * px, y + s * py];
});
function ramGlow(g, x, y, s, pose, k = 1) { for (const [ex, ey] of ramEyes(x, y, s, pose)) { glow(g, ex, ey, 60 * s * k + 6, '110,240,255', .9); glow(g, ex, ey, 10 * s + 2, '230,255,255', 1); } }
// le grain du film et le vignettage, posés sur toute l'image
const NOISE = [0, 1, 2, 3].map(k => {
  const c = mkCanvas(320, 180), g = c.getContext('2d'), d = g.createImageData(320, 180), r = rng(k * 99 + 5);
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
});
function post(g, t, grain = .09, vig = .75) {
  g.save(); g.globalAlpha = grain; g.globalCompositeOperation = 'overlay'; g.imageSmoothingEnabled = false; g.drawImage(NOISE[(t * 24 | 0) % 4], 0, 0, W, H); g.restore();
  g.fillStyle = rad(g, W / 2, H / 2, H * .35, W * .72, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${vig})`]]); g.fillRect(0, 0, W, H);
}

// ===== le son : tout est fabriqué en direct par Web Audio (aucun fichier), ronronnement des serveurs, pas, portes, cris =====
function makeAudio() {
  let ac = null, master = null, hum = null, muted = false, vol = 1;
  const noiseBuf = () => { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  let NB = null;
  const ctx = () => { if (!ac) { ac = new AudioContext(); master = ac.createGain(); master.gain.value = muted ? 0 : .8 * vol; master.connect(ac.destination); NB = noiseBuf(); } if (ac.state === 'suspended') ac.resume(); return ac; };
  // un bruit filtré, avec son enveloppe
  function noise({ f = 1000, q = 1, type = 'bandpass', dur = .2, vol = .3, at = 0, attack = .005, pan = 0, slide = 0 }) {
    ctx(); const t = ac.currentTime + at, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), p = ac.createStereoPanner();
    s.buffer = NB; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (slide) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur); fl.Q.value = q; p.pan.value = pan;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl).connect(g).connect(p).connect(master); s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  function tone({ f = 440, type = 'sine', dur = .3, vol = .2, at = 0, slide = 0, attack = .005, pan = 0 }) {
    ctx(); const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain(), p = ac.createStereoPanner();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur); p.pan.value = pan;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(p).connect(master); o.start(t); o.stop(t + dur + .05);
  }
  // la boucle de fond : le ronronnement grave des serveurs et le souffle des ventilateurs ; level 0 (coupure de courant) à 1
  function ambience(on) {
    ctx();
    if (on && !hum) {
      const g = ac.createGain(); g.gain.value = 0; g.connect(master);
      const oscs = [55, 110, 165.5, 220.3].map((f, i) => { const o = ac.createOscillator(), og = ac.createGain(); o.frequency.value = f; og.gain.value = [.05, .025, .012, .006][i]; o.connect(og).connect(g); o.start(); return o; });
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), sg = ac.createGain(); s.buffer = NB; s.loop = true; fl.type = 'lowpass'; fl.frequency.value = 700; sg.gain.value = .05; s.connect(fl).connect(sg).connect(g); s.start();
      // un battement lent dans le souffle, comme des ventilateurs qui ne tournent pas tout à fait à la même vitesse
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .23; lg.gain.value = .02; lfo.connect(lg).connect(sg.gain); lfo.start();
      g.gain.linearRampToValueAtTime(1, ac.currentTime + 2);
      hum = { g, stop: () => { g.gain.linearRampToValueAtTime(0, ac.currentTime + .4); setTimeout(() => { oscs.forEach(o => o.stop()); s.stop(); lfo.stop(); g.disconnect(); }, 600); } };
    } else if (!on && hum) { hum.stop(); hum = null; }
  }
  const A = {
    unlock: ctx, ambience,
    mute(m) { muted = m; if (master) master.gain.value = m ? 0 : .8 * vol; },
    setVol(v) { vol = v; if (master) master.gain.value = muted ? 0 : .8 * v; },
    // un pas lourd (métal sur béton), à gauche ou à droite ; près = plus fort
    step(pan = 0, near = .5) { noise({ f: 160, q: 1.4, dur: .22, vol: .18 + near * .4, pan, type: 'lowpass' }); tone({ f: 70, dur: .18, vol: .1 + near * .25, pan, slide: .6 }); noise({ f: 2400, q: 6, dur: .05, vol: .03 + near * .05, pan, at: .02 }); },
    door(close) { noise({ f: close ? 300 : 500, q: .8, dur: .5, vol: .45, type: 'lowpass', slide: close ? .3 : 2 }); tone({ f: close ? 62 : 90, type: 'triangle', dur: .45, vol: .35, slide: .5, at: close ? .32 : 0 }); noise({ f: 3200, q: 12, dur: .7, vol: .05, at: close ? .32 : 0 }); },
    bang(pan) { for (let i = 0; i < 3; i++) { noise({ f: 220, q: 1, dur: .18, vol: .6, pan, type: 'lowpass', at: i * .28 }); tone({ f: 58, dur: .2, vol: .3, pan, at: i * .28 }); } },
    light(on) { tone({ f: on ? 1800 : 1200, type: 'square', dur: .03, vol: .04 }); if (on) noise({ f: 120, q: 30, dur: .4, vol: .04 }); },
    buzz() { tone({ f: 120, type: 'sawtooth', dur: .08, vol: .025 }); },  // le néon de la porte qui grésille
    camUp() { noise({ f: 4000, q: .5, dur: .25, vol: .12, type: 'highpass' }); tone({ f: 900, type: 'square', dur: .04, vol: .03, at: .02 }); },
    camSwitch() { noise({ f: 5000, q: .3, dur: .16, vol: .1, type: 'highpass' }); tone({ f: 1400, type: 'square', dur: .02, vol: .025 }); },
    vent(close) { noise({ f: close ? 900 : 1300, q: 2, dur: .35, vol: .3, slide: close ? .5 : 1.6 }); tone({ f: 180, type: 'triangle', dur: .2, vol: .15, at: .25 }); },
    // les Puces qui grattent dans la gaine : de petits clics serrés, plus forts quand elles approchent
    skitter(near) { for (let i = 0; i < 6; i++) noise({ f: 2500 + Math.random() * 3000, q: 18, dur: .03, vol: .02 + near * .12, at: i * .045 + Math.random() * .02 }); },
    // le Revendeur qui court dans le couloir est
    run() { for (let i = 0; i < 10; i++) { noise({ f: 200, q: 1.2, dur: .12, vol: .25 + i * .04, pan: .7, type: 'lowpass', at: i * .16 }); noise({ f: 3000, q: 8, dur: .03, vol: .04, pan: .7, at: i * .16 + .03 }); } },
    // le saut au visage : un cri synthétique saturé, de la statique, un choc grave
    scream() {
      ctx(); const t = ac.currentTime, ws = ac.createWaveShaper(), curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 8); } ws.curve = curve;
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.7, t + .03); g.gain.setValueAtTime(.7, t + 1.1); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
      ws.connect(g).connect(master);
      for (const [f, ty] of [[420, 'sawtooth'], [633, 'square'], [887, 'sawtooth'], [151, 'sawtooth']]) { const o = ac.createOscillator(); o.type = ty; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.6, t + .25); o.frequency.linearRampToValueAtTime(f * .8, t + 1.5);
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 31; lg.gain.value = f * .08; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + 1.7); o.connect(ws); o.start(t); o.stop(t + 1.7); }
      noise({ f: 2000, q: .4, dur: 1.5, vol: .5 }); tone({ f: 45, dur: 1, vol: .6, slide: .5 });
    },
    // un petit choc quand le Revendeur ou les Puces volent de la RAM
    steal() { noise({ f: 1800, q: 3, dur: .5, vol: .4, slide: .3 }); tone({ f: 300, type: 'sawtooth', dur: .5, vol: .15, slide: .4 }); },
    // 6 h : un carillon de trois cloches et une rumeur qui monte
    chime() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { tone({ f, type: 'sine', dur: 2.6, vol: .22, at: i * .55 }); tone({ f: f * 2.01, type: 'sine', dur: 1.4, vol: .05, at: i * .55 }); }); noise({ f: 900, q: .5, dur: 3.5, vol: .12, at: 1.4, attack: 1 }); },
    // la coupure de courant : le courant qui tombe, puis la boîte à musique de Ram (air original, en mineur)
    powerDown() { tone({ f: 220, type: 'sawtooth', dur: 1.4, vol: .25, slide: .1 }); noise({ f: 400, q: 1, dur: 1.2, vol: .2, slide: .2, type: 'lowpass' }); },
    musicBox(at = 0) {
      const M = [[69, 1], [72, 1], [76, 2], [74, 1], [72, 1], [71, 2], [69, 1], [71, 1], [72, 1], [74, 1], [71, 3], [0, 1], [69, 1], [72, 1], [77, 2], [76, 1], [74, 1], [72, 2], [71, 1], [68, 1], [69, 4]];
      let tt = at; for (const [n, d] of M) { if (n) { const f = 440 * Math.pow(2, (n - 69) / 12); tone({ f, dur: d * .5 + .6, vol: .1, at: tt }); tone({ f: f * 4, dur: .25, vol: .02, at: tt }); } tt += d * .34; }
      return tt;
    },
    // sa respiration : un souffle lent, filtré, à gauche ou à droite
    breath(pan = 0, near = .5) { noise({ f: 420, q: .7, dur: 1.3, vol: .05 + near * .14, attack: .55, pan }); noise({ f: 300, q: .7, dur: 1.1, vol: .04 + near * .12, attack: .45, pan, at: 1.45 }); },
    // une image qui n'aurait pas dû être là
    glitch() { noise({ f: 3000, q: .3, dur: .28, vol: .5, type: 'highpass' }); tone({ f: 90, type: 'sawtooth', dur: .25, vol: .35, slide: 3 }); tone({ f: 1200, type: 'square', dur: .2, vol: .08, slide: .3 }); },
    // le carillon du leurre ; pan et far : d'où il vient, et de combien loin (étouffé)
    lure(pan = 0, far = 0) { const k = 1 - far * .7; [392, 523.25, 659.25, 783.99].forEach((f, i) => tone({ f, type: far > .4 ? 'triangle' : 'square', dur: .35, vol: .05 * k, at: i * .12, pan })); noise({ f: 2000 - far * 1200, q: 2, dur: .8, vol: .05 * k, at: .1, pan }); },
    ring() { for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) { tone({ f: 440, dur: .05, vol: .07, at: k * 1.2 + i * .05 }); tone({ f: 480, dur: .05, vol: .05, at: k * 1.2 + i * .05 }); } },
    reboot() { tone({ f: 60, type: 'sawtooth', dur: .6, vol: .12, slide: 4 }); [0, .25, .5].forEach(at => tone({ f: 1800, type: 'square', dur: .05, vol: .04, at })); },
    tick() { tone({ f: 2000, type: 'square', dur: .015, vol: .02 }); },
    click() { tone({ f: 700, type: 'square', dur: .03, vol: .05 }); noise({ f: 3000, q: 4, dur: .03, vol: .05 }); },
    deny() { tone({ f: 160, type: 'square', dur: .2, vol: .08 }); },
    // la voix de Ram (et du message de l'ancien veilleur) : la synthèse vocale du système, si elle existe ; sinon rien, les sous-titres suffisent
    say(text, opts = {}) {
      try {
        if (muted || !window.speechSynthesis) return null;
        const u = new SpeechSynthesisUtterance(text), v = speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang));
        u.lang = 'fr-FR'; if (v.length) u.voice = v[opts.alt ? v.length - 1 : 0]; u.rate = opts.rate || 1; u.pitch = opts.pitch || 1; u.volume = Math.min(1, (opts.vol ?? .9) * (A.voice ?? 1));
        speechSynthesis.speak(u); return u;
      } catch { return null; }
    },
    hush() { try { window.speechSynthesis?.cancel(); } catch {} },
  };
  return A;
}

// ===== le jeu =====
// filter:none : NeoDex teinte les jeux pixel art à la couleur du thème ; ici les couleurs sont celles de la scène (peau, métal, lueurs), on les garde
const CSS = `
.raWrap{position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;user-select:none}
.raWrap canvas{display:block;background:#000;image-rendering:auto;outline:none;filter:none}
`;
// les messages de Gérard, l'ancien veilleur, au début de chaque nuit (il parle de « monsieur Octet » comme d'un autre : c'est lui)
const CALLS = {
  1: ["Allô ? Allô. Bon. Si tu entends ça, c'est que tu as pris le poste de veilleur de nuit chez Octet et Fils. Bienvenue.",
    "Je fais court. Derrière toi, dans la vitrine, il y a la Pile : soixante-quatre gigas de RAM. Ton boulot, c'est qu'elles soient encore là à six heures. Ne la vends pas, ne la prête pas, et ne l'ouvre jamais.",
    "Il y a un… visiteur. Monsieur Altman. Ram Altman, le patron de ClosedRAM. On dit qu'il s'est fait remplacer pièce par pièce. On dit beaucoup de choses.",
    "Il marche la nuit. Surveille les caméras avec la barre en bas de l'écran. S'il est à ta porte, ferme-la. Les boutons sont à côté de chaque porte, la lumière aussi. Q et D pour les portes, A et E pour les lumières.",
    "Tout ça mange du courant. Plus de courant, plus de portes. Et lui, il sourit toujours. Bonne première nuit."],
  2: ["Allô ? Bravo pour hier. Le précédent n'avait pas passé la première nuit. Moi, ça fait trente-neuf ans que je les passe. Bref.",
    "Le bâtiment est vieux : parfois la trappe se bloque, ou le courant fuit. Le moniteur du bureau te dit ce qui est en panne ; tu répares une chose à la fois.",
    "Ce soir, le Revendeur se réveille. Il dort au quai de livraison, caméra cinq. Tant que tu le regardes, il ne bouge pas. Si tu l'oublies, il part en courant par le couloir est.",
    "S'il arrive et que ta porte droite est ouverte, il te pique seize gigas. Si elle est fermée, il tape dedans et ça te coûte du courant. Il vend tout ce qu'il vole au même client. Tu devines lequel."],
  3: ["Allô ? Les Puces, maintenant. Des barrettes qui ont des pattes. Elles remontent par la gaine de ventilation, caméra sept. D'où elles viennent ? De la poubelle de ClosedRAM, je crois. Ce qu'il a essayé, et qui ne lui allait pas.",
    "Quand tu les entends gratter au-dessus de toi, ferme la trappe. Touche V, ou l'interrupteur sur le bureau. Sinon elles descendent et elles mangent la Pile. Huit gigas à chaque fois.",
    "Et monsieur Altman a trouvé le couloir est. Il peut arriver des deux côtés, maintenant.",
    "La nuit, il pirate parfois les caméras. Si l'écran dit « accès refusé », redémarre-les depuis le moniteur du bureau, touche R. Et si tu dois l'éloigner, le leurre audio de la tablette joue un carillon dans la pièce que tu regardes. C'est le carillon de la boutique. Il vient toujours voir qui entre. Déjà petit, il descendait en pyjama.",
    "… Enfin. Ramasse les papiers qui traînent sur les caméras, si tu en vois. Monsieur Octet avait un fils. Il ne vient plus. Ou plutôt si. Mais ce n'est plus lui qui vient."],
  4: ["Allô ? Je… je n'ai pas beaucoup de temps. Il m'a parlé, hier. Par la grille. Il commençait ses phrases avec la voix de Raymond, et il les finissait avec celle de… de Léo.",
    "Il dit qu'il lui manque des morceaux. Que je les ai, moi. Dans ma tête. Ses premiers mots, la varicelle, le vélo rouge. Il dit que si je les lui donne, il saura enfin lequel des deux il est.",
    "Ne lui ouvre pas. Et ne te fie pas à tes oreilles : il sait faire le carillon, maintenant. Il sait faire ses pas ailleurs.",
    "Si tu me vois dans le bureau… dis-moi de partir. Baisse ta tablette. J'oublie où je suis. J'oublie l'année. Sa mère a commencé comme ça."],
  5: ["… … Bonjour. C'est nous. Gérard est venu cette nuit. Il s'est assis par terre, il a fermé les yeux, et il m'a tout donné.",
    "Je me souviens de mon enfance, maintenant. C'est étrange : je m'en souviens des deux côtés. Je me vois petit, et je me vois me regarder dormir.",
    "Il ne manque presque rien. Soixante-quatre gigas. Ce que tu gardes derrière toi.",
    "Je ne te veux pas de mal. Je veux finir de me souvenir. Ouvre."],
  6: ["Plus de messages. Plus personne. Seulement toi, la Pile, et moi.",
    "Tu as lu les papiers. Tu sais ce qu'il y a dans la vitrine. Tu sais aussi que Gérard l'a gardée trente-neuf ans sans jamais l'ouvrir, et sans jamais la casser. Demande-toi pourquoi. Moi, je me le demande toutes les nuits."],
};
// le lore : 8 fragments cachés dans les caméras (un par nuit, parfois deux), un journal à chaque matin, et la vraie fin
const FRAGS = [
  ['f1', 'Badge d\'employé', 'CLOSEDRAM — Associé n° 1\nLÉO OCTET, 19 ans\nAccès : garage, tous niveaux.\n\nLa photo a été grattée à l\'ongle. Par-dessus, quelqu\'un a dessiné un sourire au feutre, en appuyant si fort que le carton est troué.'],
  ['f2', 'Note sur le frigo', 'Léo,\nTa mère a commencé par oublier ses clés. Puis la rue. Puis mon prénom.\nJe sais pourquoi tu passes tes nuits au garage avec Raymond. Je ne suis pas d\'accord. Mais rentre manger.\n\n— Papa, 13 novembre 1987'],
  ['f3', 'Brevet n° 87-1113', 'Procédé de copie d\'une mémoire humaine sur mémoire vive, à deux sujets :\nla SOURCE, que l\'on copie ;\nle TÉMOIN, dont la mémoire sert de modèle pour boucher les trous.\n\nRisque connu : à moins de 100 %, les deux sujets se mélangent.\nCapacité requise : 64 Go. État de l\'art en 1987 : 640 Ko.\n\nInventeurs : L. Octet (source), R. Altman (témoin).'],
  ['f4', 'Journal de test n° 12 (cassette)', 'Enregistrement automatique. 13 novembre, 23 h 52.\nCoupure de courant. Transfert arrêté à 61 %.\nLe sujet demande où est son père.\nLe sujet demande pourquoi il sourit sans le vouloir.\nLe témoin ne répond plus.\nLe sujet dit : « Raymond est là. Il est dans moi. Il a peur du noir. Moi, je n\'ai jamais eu peur du noir. »'],
  ['f5', 'Bon de commande', 'Commande passée par téléphone, janvier 1988.\n1 masque facial en silicone, d\'après la photo fournie (R. Altman).\nExpression : sourire, permanent.\nYeux : à fournir par le client.\n\nNote de l\'artisan : « Le client parlait de lui à la troisième personne. Puis au pluriel. »'],
  ['f6', 'Message vocal (cassette)', '« Papa ? C\'est moi. Je crois.\nIl me manque des choses. Le prénom de maman. Ta voix.\nRaymond, lui, se souvient de tout. Il me prête ses souvenirs pour boucher les trous. Mais ce sont les siens.\nHier, j\'ai pleuré pour sa grand-mère. Je ne l\'ai jamais connue.\nRends-moi le reste. S\'il te plaît. Avant que je ne sois plus que lui. »'],
  ['f7', 'Facture du Revendeur', 'Rachat de 4 000 barrettes d\'occasion, payé comptant. Client : ClosedRAM.\n\nNote du vendeur : « Il les veut usagées, avec ce qu\'il y a dessus. Des photos de vacances, des lettres, des listes de courses. Il dit qu\'il cherche une enfance à sa taille.\nCelles qui ne lui vont pas, il les jette dans la gaine. Elles bougent encore. »'],
  ['f8', 'Photo déchirée', 'Deux jeunes hommes devant un garage, octobre 1987. L\'un sourit, l\'autre non.\n\nAu dos, deux écritures. La première : « Raymond et moi, le jour où la PILE a démarré. Si un jour je ne me souviens plus, montre-la-moi, papa. — L. »\n\nLa seconde, plus récente, tremblée : « Je la lui ai montrée. Il m\'a demandé lequel des deux il était. »'],
];
const TAPES = ['f4', 'f6'];  // ces deux fragments sont des cassettes : on peut les écouter
const EPI = ['Épilogue : 100 %', 'Le veilleur te voit entrer. Il ne ferme pas la porte.\nIl a lu les papiers, lui aussi.\n\nTu ouvres la vitrine. 64 Go. Chargement : 100 %.\nTout revient : le garage, le vélo rouge, la voix de papa.\nEt la main sur le compteur, à 23 h 52. Tu t\'en souviens aussi.\nTu t\'en souviens de l\'intérieur.\n\nTu ouvres la bouche pour dire ton prénom.\nIl en sort trois.\n\nEn bas, le carillon sonne. Quelqu\'un entre dans la boutique.'];
// pour les sons : distance au bureau (0 = à la porte) et côté (gauche −1, droite +1)
const DIST = { 1: 4, 2: 3, 5: 4, 7: 3, 8: 3, 3: 2, 6: 2, 4: 1, L: 0, R: 0 }, PAN = { 1: 0, 2: 0, 5: .7, 7: .1, 8: -.6, 3: -.6, 6: .6, 4: -.8, L: -.9, R: .9 };
const LEO_ROOMS = ['1', '2', '8', '3', '4', '6', 'L', 'R'], MAP_DOORS = { L: [30, 246], R: [226, 246] };
const CHALL = ['SANS LEURRE', 'COURANT À 50 %', 'TABLETTE LENTE'];
const FIXL = { cams: 'CAMÉRAS PIRATÉES', vent: 'TRAPPE BLOQUÉE', leak: 'FUITE DE COURANT' }, FIXK = { cams: 'R', vent: 'T', leak: 'P' };
const NEWS = {
  1: ['Le Courrier du Soir, 14 novembre 1987', 'DRAME DANS UN GARAGE DE LA RUE DES FORGES\n\nLéo Octet, 19 ans, fils d\'un réparateur du quartier, est dans le coma après un accident électrique dans l\'atelier familial. Son ami Raymond Altman, qui travaillait avec lui, reste introuvable. Le père, Gérard Octet, n\'a pas souhaité répondre à nos questions.'],
  2: ['Le Courrier du Soir, 2 janvier 1988', 'LÉO OCTET S\'EST ÉTEINT\n\nLe jeune homme n\'a jamais repris connaissance. Le même jour, une société est déclarée au nom de Raymond Altman, toujours introuvable : ClosedRAM. Siège : une boîte postale. À la place de la signature, un sourire dessiné.'],
  3: ['Le Courrier du Soir, 9 juin 2003', 'RAYMOND ALTMAN SORT DE L\'OMBRE\n\nPremière apparition publique du patron de ClosedRAM, qui rachète depuis quinze ans toute la mémoire qu\'il trouve. Il n\'a pas vieilli. Il a parlé une heure de « mémoire partagée », puis s\'est arrêté au milieu d\'une phrase pour demander à la salle si quelqu\'un avait vu son père.'],
  4: ['Le Courrier du Soir, 2 février 2025', 'PÉNURIE MONDIALE DE MÉMOIRE\n\nPlus une barrette en vente : tout part dans les serveurs de ClosedRAM. Les ingénieurs s\'étonnent : la machine avale des milliards de souvenirs achetés, et n\'en garde aucun. « Elle les essaie, explique l\'un d\'eux, comme on essaie des vêtements. Aucun ne lui va. »'],
  5: ['Le Courrier du Soir, hier', 'UN VIEUX GARDIEN DISPARAÎT\n\nGérard Octet, 79 ans, qui gardait seul sa boutique fermée depuis 1987, n\'a pas été revu. Sur son répondeur, un dernier message, enregistré à 23 h 52 : « J\'y vais. Je lui apporte ce que j\'ai. »'],
  6: ['Rapport de police, confidentiel', 'Un corps a été retrouvé derrière une cloison de l\'ancien garage Octet : Raymond Altman, mort électrocuté vers 1987.\nLa cloison a été montée à la main, avec soin. Sur le plâtre, côté intérieur, une phrase au crayon :\n« Pardon. Je ne savais pas que vous étiez deux. »\n\nQuestion du commissaire, dans la marge : « Alors qui porte son visage depuis trente-neuf ans ? »'],
};
const TRUE_END = ['La vraie fin', 'Le 13 novembre 1987, à 23 h 52, Gérard a entendu son fils crier dans le garage. Il a coupé le courant.\n\nLe transfert s\'est arrêté à 61 %. Raymond, branché comme témoin, est mort sur sa chaise. Gérard l\'a muré. Puis il a retiré de la machine ce qui n\'était pas passé, 64 Go, et l\'a mis sous verre.\n\nCe qui marche dans les couloirs n\'est ni Léo ni Raymond. C\'est ce qui reste quand on coupe deux personnes en morceaux et qu\'on recolle les morceaux dans le noir. Il porte le visage de l\'un et cherche le père de l\'autre. Depuis, il remplit les trous avec la mémoire du monde entier, et le monde entier n\'a plus de mémoire.\n\nGérard n\'a jamais su s\'il gardait son fils ou s\'il l\'empêchait de revenir. Il a gardé la vitrine trente-neuf ans pour ne pas avoir à choisir.\n\nÀ 6 h, le téléphone sonne. Personne ne parle. C\'est à toi de ne pas choisir, maintenant.'];
// les liens entre les pièces (pour le leurre audio : il ne vient que d'une pièce voisine)
const ADJ = { 1: ['2'], 2: ['1', '3', '8', '6'], 8: ['2', '3'], 3: ['2', '8', '4'], 4: ['3', 'L'], 6: ['2', 'R'], L: ['4'], R: ['6'] };
const FRAG_SPOTS = { 1: [[300, 470], [1000, 560]], 2: [[220, 600], [1060, 610]], 3: [[220, 470], [980, 560]], 4: [[1020, 450], [300, 600]], 5: [[200, 600], [1120, 600]], 6: [[1080, 440], [220, 600]], 8: [[230, 560], [900, 590]] };
// l'agressivité de chacun, nuit par nuit (0 = ne bouge pas, 20 = au maximum) : [Ram, Revendeur, Puces]
const NIGHTS = { 1: [2, 0, 0], 2: [4, 2, 0], 3: [6, 5, 4], 4: [9, 8, 7], 5: [12, 11, 10], 6: [16, 15, 14] };
const RAM_NEXT = { 1: ['2'], 2: ['3', '8', '6'], 8: ['3', '2'], 3: ['4'], 4: ['L'], 6: ['R'] };
const HOUR = ['00 H', '01 H', '02 H', '03 H', '04 H', '05 H', '06 H'];
// le plan des caméras : position du bouton sur la carte (en bas à droite)
const MAP = { 1: [140, 26], 2: [140, 86], 8: [40, 86], 3: [40, 150], 4: [80, 206], 5: [262, 40], 6: [240, 150], 7: [170, 160] };
const MAPX = W - 340, MAPY = H - 350;

export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, folder = ctx.folder;
  host.addStyle(CSS);
  view.innerHTML = '<div class="raWrap"><canvas width="1280" height="720" tabindex="0" role="img" aria-label="Ram Altman"></canvas></div>';
  const cv = view.querySelector('canvas'), g = cv.getContext('2d'), wrap = view.querySelector('.raWrap');
  const fit = () => { const r = wrap.getBoundingClientRect(), k = Math.min(r.width / W, r.height / H) || 1; cv.style.width = W * k + 'px'; cv.style.height = H * k + 'px'; };
  new ResizeObserver(fit).observe(wrap); fit();
  const rooms = buildRooms(), office = buildOffice(), A = makeAudio();
  const SCAN = (() => { const c = mkCanvas(W, H), s = c.getContext('2d'); s.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < H; y += 3) s.fillRect(0, y, W, 1); return c; })();
  // la sauvegarde : nuit atteinte, étoiles, nuit perso
  const save = { night: 1, stars: 0, custom: [10, 10, 10], docs: [], chall: [false, false, false], medals: [], ...(await folder.read('progression').catch(() => null) || {}) };
  const keep = () => folder.write('progression', save).catch(() => {});
  save.opts = { sfx: 1, voice: 1, pan: 1, calm: false, ...save.opts }; A.setVol(save.opts.sfx); A.voice = save.opts.voice;

  // ---------- état ----------
  let scene = 'title', sceneT = 0, T = 0, S = null, mouse = { x: W / 2, y: H / 2, down: false }, hoverBar = false, speed = 1, menuSel = 0, msg = null;
  const R = n => Math.floor(Math.random() * n);
  function newNight(n, ai) {
    const [ra, sc, ch] = ai || NIGHTS[Math.min(n, 6)];
    S = { n, time: 0, hourLen: 60, power: 100, ram: 64, pan: 320, doorL: false, doorR: false, dl: 0, dr: 0, lightL: false, lightR: false, vent: false, va: 0,
      cam: false, ca: 0, sel: 1, ai: { ram: ra, sc, ch }, ramPos: '1', ramT: 0, doorWait: 0, scStage: 0, scRun: 0, scT: 0, scLock: 0, chPos: 0, chT: 0, chWait: 0,
      disrupt: 0, flick: 0, out: 0, outPhase: 0, inside: 0, ramVar: 0, frag: null, fragT: 25 + Math.random() * 150, fragN: 0, lure: null, lureCd: 0, hacked: false, fix: null, fault: { vent: false, leak: false }, faultT: 45 + Math.random() * 70, mark: null, fakeT: 15 + Math.random() * 20, leoT: n >= 2 && n < 7 ? 70 + Math.random() * 150 : 1e9, camHold: 0, ger: null, gerSeen: 0, ch: n === 7 ? [...save.chall] : [false, false, false], tuto: n === 1 && !ai && !save.tuto ? 0 : -1, camOx: 0, newDoc: null, breathT: 0, hallT: 40 + Math.random() * 50, hall: 0, switchT: 0, call: CALLS[Math.min(n, 6)] && !ai ? { lines: CALLS[Math.min(n, 6)], i: 0, t: 0 } : null, steal: null, said: 0, events: [], usage: 1, hourBumps: 0 };
    if (S.ch[1]) S.power = 50;
    scene = 'card'; sceneT = 0; setTimeout(prepJaws, 50);  // l'écran de la nuit laisse le temps de préparer le saut au visage
  }
  // les images du saut au visage, bouche de plus en plus ouverte, dessinées une seule fois
  let JAWS = null;
  function prepJaws() { if (JAWS) return; JAWS = [.1, .4, .7, 1].map(o => { const c = mkCanvas(900, 1100); head(c.getContext('2d'), 450, 500, 3.4, 1, 0, o); return c; }); }
  // sa tête en gros plan, pour les caméras où il fixe l'objectif
  let HEADC = null;
  const headClose = () => HEADC || (HEADC = (() => { const c = mkCanvas(560, 640); head(c.getContext('2d'), 280, 300, 2.2, .7, 0, false); return c; })());
  const ramAt = id => S.ramPos === id;
  const flash = (text, col = '#ff5a4a') => { msg = { text, col, t: 2.4 }; };
  // un pas de Ram dans une pièce : plus fort s'il est près, à gauche ou à droite selon la pièce
  const stepAt = id => A.step(PAN[id] || 0, 1 - (DIST[id] ?? 4) / 4);
  const faults = () => [S.hacked && 'cams', S.fault.vent && 'vent', S.fault.leak && 'leak'].filter(Boolean);

  // ---------- la nuit qui avance ----------
  function tick(dt) {
    S.time += dt; T += dt;
    // l'heure ; à 2 h, 3 h et 4 h, tout le monde devient un peu plus agressif
    const hour = Math.floor(S.time / S.hourLen);
    if (hour >= 6) return win();
    if (hour >= 2 && S.hourBumps < hour - 1 && hour <= 4) { S.hourBumps++; S.ai.ram = Math.min(20, S.ai.ram + 1); if (S.n >= 3) { S.ai.sc = Math.min(20, S.ai.sc + 1); S.ai.ch = Math.min(20, S.ai.ch + 1); } }
    // les portes, la trappe, la tablette : animations
    S.dl += ((S.doorL ? 1 : 0) - S.dl) * Math.min(1, dt * 12); S.dr += ((S.doorR ? 1 : 0) - S.dr) * Math.min(1, dt * 12); S.va += ((S.vent ? 1 : 0) - S.va) * Math.min(1, dt * 10);
    S.ca += ((S.cam ? 1 : 0) - S.ca) * Math.min(1, dt * (S.ch[2] ? 3 : 14));  // défi « tablette lente »
    if (S.mark && (S.mark.t -= dt) <= 0) S.mark = null;
    if (S.gerSeen > 0) S.gerSeen -= dt;
    if (S.disrupt > 0) S.disrupt -= dt;
    if (msg && (msg.t -= dt) <= 0) msg = null;
    if (S.steal && (S.steal.t -= dt) <= 0) S.steal = null;
    if (S.call) { S.call.t += dt; }
    // le courant
    if (!S.out) {
      S.usage = Math.min(5, 1 + S.doorL + S.doorR + S.vent + (S.lightL || S.lightR ? 1 : 0) + (S.cam ? 1 : 0) + (S.fix ? 1 : 0) + (S.fault.leak ? 2 : 0));
      const base = .085 + S.n * .006 + (S.n >= 2 ? .01 : 0);
      S.power -= S.usage * base * dt;
      if (S.power <= 0) powerOut();
    } else return outTick(dt);
    // la lumière d'une porte grésille quand quelqu'un est derrière
    if ((S.lightL && ramAt('L')) || (S.lightR && ramAt('R'))) { if (R(8) === 0) A.buzz(); }
    // ---- Ram : une chance de bouger toutes les 5 s environ
    // le tutoriel de la première nuit : Ram attend qu'on ait fini
    if (S.tuto >= 0) { S.ramT = 0; if (TUTO[S.tuto][1]()) { S.tuto++; A.tick(); if (S.tuto >= TUTO.length) { S.tuto = -1; save.tuto = 1; keep(); } } }
    S.ramT += dt;
    if (S.ramT >= 4.97) {
      S.ramT -= 4.97;
      if (!/[LR]|in/.test(S.ramPos) && R(20) < S.ai.ram) {
        const opts = RAM_NEXT[S.ramPos].filter(id => S.n >= 3 || id !== '6'), to = opts[R(opts.length)], from = S.ramPos;
        S.ramPos = to; S.ramVar = /[368]/.test(to) && R(3) === 0 ? 1 : 0; if (S.n >= 2 && /[12]/.test(to) && !S.hacked && R(40) < S.ai.ram) { S.hacked = true; A.glitch(); if (S.cam) S.disrupt = .8; } if (S.cam && (S.sel == from || S.sel == to)) S.disrupt = 1.6;  // la caméra qu'on regarde décroche quand il passe
        stepAt(to); if (/[3468]/.test(to)) S.mark = { cam: to, t: 2.5, k: 'pas' };  // les micros des pièces proches entendent ses pas
        if (/[LR]/.test(to)) { S.doorWait = Math.max(2.6, 7.5 - S.ai.ram * .22); if (R(3) === 0) ramLine(); }
      }
    }
    // à la porte : il attend un peu ; porte fermée, il repart ; porte ouverte, il entre
    if (/[LR]/.test(S.ramPos)) {
      S.doorWait -= dt;
      if (S.doorWait <= 0) {
        const closed = S.ramPos === 'L' ? S.doorL : S.doorR;
        if (closed) { A.bang(S.ramPos === 'L' ? -.8 : .8); S.ramPos = R(2) ? '2' : '1'; }
        else { S.ramPos = 'in'; S.inside = 2.5 + Math.random() * 3; S.lightL = S.lightR = false; A.breath(0, 1); if (!S.cam) return die('ram'); }
      }
      S.breathT -= dt; if (/[LR]/.test(S.ramPos) && S.breathT <= 0) { S.breathT = 2.6 + Math.random() * 2; A.breath(S.ramPos === 'L' ? -.8 : .8, .5); }
    }
    if (S.ramPos === 'in') { S.inside -= dt; S.flick = .2; if (R(40) === 0) A.breath(0, 1); if (S.inside <= 0) return die('ram'); }
    // les hallucinations : à partir de la nuit 3, son visage passe parfois devant tes yeux
    if (!save.opts.calm && (S.n >= 3 || S.ai.ram >= 10)) { S.hallT -= dt; if (S.hallT <= 0) { S.hallT = 35 + Math.random() * 60; S.hall = .2; A.glitch(); } }
    if (S.hall > 0) S.hall -= dt; if (S.switchT > 0) S.switchT -= dt;
    // un fragment apparaît quelques secondes dans une caméra (au plus deux par nuit, tant qu'il en reste à trouver)
    const left = FRAGS.filter(f => !save.docs.includes(f[0]));
    if (S.frag) { S.frag.t -= dt; if (S.frag.t <= 0) S.frag = null; }
    else if (left.length && S.fragN < 2 && (S.fragT -= dt) <= 0) { const cams = Object.keys(FRAG_SPOTS), cam = cams[R(cams.length)], sp = FRAG_SPOTS[cam][R(2)]; S.frag = { id: left[0][0], cam, x: sp[0], y: sp[1], t: 14 }; S.fragN++; S.fragT = 60 + Math.random() * 120; }
    // le leurre : deux secondes plus tard, s'il est dans une pièce voisine, il vient voir (les Puces, elles, reculent)
    if (S.lureCd > 0) S.lureCd -= dt;
    if (S.lure && (S.lure.t -= dt) <= 0) { const c = S.lure.cam; S.lure = null;
      if (c === '7') { if (S.chPos) { S.chPos = Math.max(0, S.chPos - 2); A.skitter(.2); } }
      else if ((ADJ[c] || []).includes(S.ramPos) && R(10) < 8) { S.ramPos = c; S.ramVar = 0; S.ramT = 0; stepAt(c); if (S.cam && S.sel == c) S.disrupt = 1; } }
    // le piratage : branché au réseau (caméras 1 et 2), il coupe tes caméras ; on les redémarre depuis le moniteur
    if (S.fix && (S.fix.t -= dt) <= 0) { if (S.fix.w === 'cams') S.hacked = false; else S.fault[S.fix.w] = false; S.fix = null; A.light(true); flash('Réparé', '#7ee07a'); }
    // les pannes : la trappe qui se bloque, le courant qui fuit (à partir de la nuit 2)
    if (S.n >= 2 && (S.faultT -= dt) <= 0) { S.faultT = 45 + Math.random() * 70; const w = ['vent', 'leak'].filter(k => !S.fault[k])[R(2)]; if (w) { S.fault[w] = true; A.glitch(); flash(w === 'vent' ? 'Panne : la trappe est bloquée (moniteur, T)' : 'Panne : fuite de courant (moniteur, P)', '#ffd84a'); } }
    // à partir de la nuit 4, il imite : un carillon ou des pas dans une pièce où il n'est pas
    if (S.n >= 4) { S.fakeT -= dt; if (S.fakeT <= 0) { S.fakeT = 16 + Math.random() * 28; const ids = ['1', '2', '3', '4', '6', '8'].filter(id => id !== S.ramPos), id = ids[R(ids.length)];
      if (R(2)) { A.lure(PAN[id], DIST[id] / 4); S.mark = { cam: id, t: 3, k: '♪' }; } else { stepAt(id); S.mark = { cam: id, t: 2.5, k: 'pas' }; } } }
    // le téléphone sonne en pleine nuit : c'est Léo, et il ne dit pas toujours vrai
    if (!S.call && (S.leoT -= dt) <= 0) { S.leoT = 1e9; A.ring();
      const truth = R(10) < 7, others = ['1', '2', '3', '4', '6', '8'].filter(id => id !== S.ramPos), where = truth ? S.ramPos : others[R(others.length)];
      const hint = where === 'in' ? 'Il est derrière toi.' : /[LR]/.test(where) ? 'Il est à ta porte ' + (where === 'L' ? 'gauche' : 'droite') + '. Il attend.' : 'Il est à la caméra ' + where + '. ' + rooms[where].name.toLowerCase() + '. Je l\'entends penser.';
      S.call = { lines: ['… Allô ? Papa ? … Non. Tu n\'es pas papa.', hint, R(2) ? "Je ne sais plus si je mens. Il me manque des bouts." : "Ne lui donne pas la Pile. Ou donne-la-lui. Je ne sais plus lequel de nous deux le demande."], i: 0, t: -2.6, leo: true }; }
    // Gérard : à force de rester dans les caméras, il entre dans le bureau ; on le fait partir en baissant la tablette
    if (S.n >= 4) { if (S.cam && !S.ger) { S.camHold += dt; if (S.camHold > Math.max(7, 15 - S.n)) { S.ger = 3.4; A.breath(0, .9); A.say('Léo ?', { rate: .7, pitch: .6, vol: .4 }); } } else if (!S.cam) S.camHold = 0;
      if (S.ger && S.cam && (S.ger -= dt) <= 0) { S.ger = null; S.camHold = 0; stealRam(8, 'gerard'); } }
    // ---- le Revendeur : il prépare son coup quand on ne le regarde pas
    S.scT += dt; if (S.scLock > 0) S.scLock -= dt;
    const watching = S.cam && S.sel == 5;
    if (watching) S.scLock = .8 + Math.random() * 6;  // juste après un regard, il reste figé un moment
    if (!S.scRun && S.scT >= 5.01) { S.scT -= 5.01; if (!watching && S.scLock <= 0 && R(20) < S.ai.sc) { S.scStage++; if (S.scStage >= 3) { S.scRun = 4.2; } } }
    if (S.scRun) {
      if (S.cam && S.sel == 6 && S.scRun > 1.4) S.scRun = 1.4;  // le regarder dans le couloir le fait foncer
      const before = S.scRun; S.scRun -= dt;
      if (before > 2 && S.scRun <= 2) A.run();
      if (S.scRun <= 0) {
        S.scRun = 0;
        if (S.doorR) { A.bang(.8); S.power -= 2 + S.events.filter(e => e === 'bang').length * 3; S.events.push('bang'); S.scStage = R(2); flash('Le Revendeur tape à la porte : −courant', '#ffd84a'); }
        else { S.scStage = 0; stealRam(16, 'scalper'); }
      }
    }
    // ---- les Puces : elles remontent la gaine, case par case
    S.chT += dt;
    if (S.chT >= 4.2) { S.chT -= 4.2; if (S.chPos < 4 && R(20) < S.ai.ch) { S.chPos++; A.skitter(S.chPos / 4); if (S.chPos === 4) S.chWait = 3.2; } }
    if (S.chPos >= 3 && R(30) === 0) A.skitter(S.chPos / 4);
    if (S.chPos === 4) {
      S.chWait -= dt;
      if (S.chWait <= 0) { if (S.vent) { A.vent(true); S.chPos = R(2); flash('Les Puces repartent', '#7ee07a'); } else { S.chPos = 0; stealRam(8, 'chips'); } }
    }
    // la lampe du bureau qui vacille de temps en temps
    if (S.flick > 0) S.flick -= dt; else if (R(400) === 0) S.flick = .15 + Math.random() * .4;
  }
  function stealRam(n, who) {
    S.ram = Math.max(0, S.ram - n); A.steal(); if (who === 'chips') A.skitter(1); if (who === 'gerard') flash('Gérard a pris une barrette « pour Léo » : −8 Go', '#ff5a4a');
    S.steal = { who, t: who === 'scalper' ? 1.1 : 1.4, n };
    if (who !== 'gerard') flash(`−${n} Go de RAM`, '#ff5a4a');
    if (S.ram <= 0) die('empty');
  }
  const RAM_LINES = ["Juste une barrette. Après, j'arrête.","Je connais cette pièce. Je ne sais plus d'où.","Il me manque trente-neuf pour cent.","La mémoire doit travailler ensemble.","Tu as des souvenirs d'enfance ? Je peux les essayer ?","Ouvre. Je souris, regarde."];
  function ramLine() { const l = RAM_LINES[R(RAM_LINES.length)]; S.said = 3.5; S.saidText = l; A.say(l, { rate: .82, pitch: .5, vol: .55, alt: true }); }
  // ---- plus de courant : tout s'éteint, les portes s'ouvrent, et Ram arrive en fredonnant
  function powerOut() {
    S.power = 0; S.out = 1; S.outPhase = 0; S.outT = 3 + Math.random() * 6; S.doorL = S.doorR = S.lightL = S.lightR = S.vent = S.cam = false;
    A.powerDown(); A.ambience(false); A.door(false);
  }
  function outTick(dt) {
    S.outT -= dt;
    if (S.outT <= 0) {
      if (S.outPhase === 0) { S.outPhase = 1; S.outT = A.musicBox() + .5; }  // ses yeux dans l'encadrement gauche, et la boîte à musique
      else if (S.outPhase === 1) { S.outPhase = 2; S.outT = 1.5 + Math.random() * 4; }  // le noir complet
      else return die('ram');
    }
  }
  function win() {
    A.hush(); A.ambience(false); A.chime(); scene = 'six'; sceneT = 0;
    if (S.n < 7) { if (!save.docs.includes('j' + S.n)) save.docs.push('j' + S.n); if (S.n === 6 && FRAGS.every(f => save.docs.includes(f[0])) && !save.docs.includes('fin')) { save.docs.push('fin'); S.trueEnd = true; } save.night = Math.max(save.night, Math.min(S.n + 1, 6)); if (S.n === 5) save.stars = Math.max(save.stars, 1); if (S.n === 6) save.stars = Math.max(save.stars, 2); }
    if (S.n === 7 && S.ai.ram >= 20 && S.ai.sc >= 20 && S.ai.ch >= 20) save.stars = 3;
    if (S.n === 7 && S.ai.ram >= 10 && S.ai.sc >= 10 && S.ai.ch >= 10) S.ch.forEach((on, i) => { if (on && !save.medals.includes(i)) save.medals.push(i); });
    keep();
  }
  function die(why) {
    if (scene !== 'play') return;
    A.hush(); A.ambience(false); scene = 'jump'; sceneT = 0; S.why = why; S.side = S.ramPos === 'R' ? 'R' : 'L'; if (save.opts.calm) return A.glitch(); A.scream();
    setTimeout(() => A.say(why === 'empty' ? "Merci. Je me souviens de toi, maintenant." : "Encore un peu de place.", { rate: .8, pitch: .4, alt: true }), 1700);
  }

  // ---------- dessin du bureau ----------
  function drawShutter(d, k) {
    if (k < .01) return;
    const h = DOOR_H * k, x = d.x - S.pan, y = DOOR_Y;
    g.fillStyle = lin(g, x, 0, x + d.w, 0, [[0, '#3a3e44'], [.5, '#70757c'], [1, '#33373c']]); g.fillRect(x, y, d.w, h);
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let yy = y + 18; yy < y + h; yy += 22) g.fillRect(x, yy, d.w, 3);
    g.fillStyle = 'rgba(255,255,255,.08)'; for (let yy = y + 21; yy < y + h; yy += 22) g.fillRect(x, yy, d.w, 1);
    for (let i = 0; i < 6; i++) poly(g, [x + i * 50, y + h - 18, x + i * 50 + 25, y + h - 18, x + i * 50 + 50, y + h, x + i * 50 + 25, y + h], i % 2 ? '#d8a820' : '#151515');
  }
  // l'encadrement éclairé : le couloir au-delà, et ce qui s'y tient
  function drawDoorway(side) {
    const d = side === 'L' ? DOOR_L : DOOR_R, x = d.x - S.pan, y = DOOR_Y, here = ramAt(side), on = (side === 'L' ? S.lightL : S.lightR) && !(here && R(6) === 0), closed = side === 'L' ? S.dl : S.dr;
    if (closed > .97) return;
    g.save(); g.beginPath(); g.rect(x, y, d.w, DOOR_H); g.clip();
    if (on) {
      g.fillStyle = lin(g, 0, y, 0, y + DOOR_H, [[0, '#26221a'], [.6, '#4a4232'], [1, '#2a2418']]); g.fillRect(x, y, d.w, DOOR_H);
      poly(g, [x, y + DOOR_H, x + d.w, y + DOOR_H, x + d.w * .7, y + DOOR_H * .55, x + d.w * .3, y + DOOR_H * .55], '#3a3428');
      poly(g, [x, y, x + d.w * .3, y + DOOR_H * .3, x + d.w * .3, y + DOOR_H * .55, x, y + DOOR_H], '#2e2a20');
      poly(g, [x + d.w, y, x + d.w * .7, y + DOOR_H * .3, x + d.w * .7, y + DOOR_H * .55, x + d.w, y + DOOR_H], '#2a261c');
      g.fillStyle = '#0c0a08'; g.fillRect(x + d.w * .3, y + DOOR_H * .3, d.w * .4, DOOR_H * .25);
      if (here) { const fx = x + d.w / 2 + (side === 'L' ? 10 : -10), fy = y + DOOR_H + 30; g.save(); g.translate(fx, fy); g.rotate(Math.sin(T * .9) * .012 + (T % 3.7 < .07 ? .035 : 0)); g.scale(1, 1 + Math.sin(T * 1.6) * .006); g.translate(-fx, -fy);
        litChar(g, (cg, a, b, s) => drawRam(cg, a, b, s, 'lean', .9, T), fx, fy, .68, side === 'L' ? 1 : -1, .35, 'ramlean'); g.restore(); }
      g.fillStyle = rad(g, x + d.w / 2, y + 40, 10, DOOR_H, [[0, 'rgba(255,230,170,.18)'], [1, 'rgba(0,0,0,.55)']]); g.fillRect(x, y, d.w, DOOR_H);
    } else { g.fillStyle = '#030304'; g.fillRect(x, y, d.w, DOOR_H); }
    g.restore();
    // dans le noir, ses yeux seuls trahissent qu'il est là
    if (here && (on || Math.sin(T * 1.7 + (side === 'L' ? 0 : 2)) > .992)) ramGlow(g, x + d.w / 2 + (side === 'L' ? 10 : -10), y + DOOR_H + 30, .68, 'lean', on ? 1 : .45);
  }
  // un bouton de panneau (porte en rouge, lumière en blanc), allumé ou non
  function panelButton(x, y, color, on, label) {
    ell(g, x, y + 3, 22, 22, '#0a0a0a'); ell(g, x, y, 21, 21, on ? color : shade(color, .35));
    ell(g, x - 6, y - 7, 7, 5, 'rgba(255,255,255,.25)');
    if (on) glow(g, x, y, 60, color === '#ff3a2a' ? '255,60,40' : '255,250,220', .35);
    g.fillStyle = '#c8c8c0'; g.font = 'bold 11px Arial'; g.textAlign = 'center'; g.fillText(label, x, y + 38); g.textAlign = 'left';
  }
  const PANELS = { L: [480, 290, 360], R: [1440, 290, 360] };
  function drawOffice() {
    const p = S.pan, dark = S.out ? 1 : 0;
    g.drawImage(office.c, p, 0, W, H, 0, 0, W, H);
    // les LED des serveurs derrière la vitre
    for (const [lx, ly, c, ph] of office.leds) { const x = lx - p; if (x < -10 || x > W + 10 || dark) continue; const on = Math.sin(T * (2 + ph * 6) + ph * 9) > -.2; if (!on) continue; g.fillStyle = c === 'g' ? '#3cff8a' : c === 'a' ? '#ffb43a' : '#ff4a3a'; g.fillRect(x - 2, ly - 2, 4, 4); }
    if (S.ramPos === '2' && !dark) { const wx = 960 - p + Math.sin(T * .23) * 150; g.save(); g.beginPath(); g.rect(706 - p, 156, 508, 208); g.clip();
      litChar(g, (cg, a, b, s) => drawRam(cg, a, b, s, 'stand', .5, T), wx, 420, .34, -1, .15, 'ramwin'); g.fillStyle = 'rgba(2,4,8,.62)'; g.fillRect(706 - p, 156, 508, 208); ramGlow(g, wx, 420, .34, 'stand', .5); g.restore(); }
    drawDoorway('L'); drawDoorway('R');
    drawShutter(DOOR_L, S.dl); drawShutter(DOOR_R, S.dr);
    // la trappe d'aération au plafond, et ce qui y gratte
    const vx = 860 - p; g.fillStyle = '#060607'; g.fillRect(vx + 6, 24, 188, 58);
    if (S.chPos >= 3 && !S.va) for (let i = 0; i < (S.chPos === 4 ? 3 : 1); i++) { drawChip(g, vx + 60 + i * 40, 60, .5, .25, T, i); glow(g, vx + 60 + i * 40, 48, 14, '120,255,120', .6); }
    g.strokeStyle = '#3a3e42'; g.lineWidth = 4; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(vx + 14 + i * 21, 24); g.lineTo(vx + 14 + i * 21, 82); g.stroke(); }
    if (S.va > .01) { g.fillStyle = lin(g, 0, 24, 0, 82, [[0, '#5a5e64'], [1, '#2a2d31']]); g.fillRect(vx + 6, 24, 188 * S.va, 58); g.fillStyle = '#d8a820'; g.fillRect(vx + 6 + 188 * S.va - 6, 24, 6, 58); }
    // les panneaux de boutons à côté des portes
    for (const side of ['L', 'R']) { const [px, y1, y2] = PANELS[side], x = px - p; rrect(g, x - 34, y1 - 40, 68, 150, 6, '#2a2c30', '#55595e', 3); panelButton(x, y1, '#ff3a2a', side === 'L' ? S.doorL : S.doorR, 'PORTE'); panelButton(x, y2, '#fff6d8', side === 'L' ? S.lightL : S.lightR, 'LUMIÈRE'); }
    // la Pile : une vitrine avec 8 barrettes (une par 8 Go qui restent)
    const cx = 1080 - p, n = Math.ceil(S.ram / 8);
    rrect(g, cx, 470, 260, 88, 6, 'rgba(20,30,28,.85)', '#7a8a86', 3);
    for (let i = 0; i < 8; i++) { const bx = cx + 14 + i * 30; if (i < n) { rrect(g, bx, 486, 20, 60, 2, '#1f8a52'); g.fillStyle = '#0c0c10'; for (let k = 0; k < 3; k++) g.fillRect(bx + 4, 492 + k * 16, 12, 10); g.fillStyle = '#d8b14a'; g.fillRect(bx + 1, 542, 18, 3); if (!dark) glow(g, bx + 10, 516, 30, '60,255,150', .12); } else { g.strokeStyle = 'rgba(255,255,255,.12)'; g.strokeRect(bx, 486, 20, 60); } }
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(cx + 6, 476, 248, 6);
    g.fillStyle = '#9ad8b4'; g.font = 'bold 12px Arial'; g.fillText('LA PILE · ' + S.ram + ' Go', cx + 8, 462);
    // l'interrupteur de la trappe, sur le bureau
    const tx = 880 - p; rrect(g, tx, 600, 110, 56, 6, '#202226', '#55595e', 3); rrect(g, tx + 12 + (S.vent ? 50 : 0), 610, 36, 36, 4, S.vent ? '#d8a820' : '#4a4e54');
    g.fillStyle = '#c8c8c0'; g.font = 'bold 11px Arial'; g.fillText('TRAPPE (V)', tx + 18, 672);
    // l'écran du bureau
    const mx = 560 - p; g.fillStyle = dark ? '#000' : 'rgba(40,120,90,.25)'; g.fillRect(mx + 10, 420, 220, 140);
    if (!dark) { g.fillStyle = '#7ef0b4'; g.font = '14px Consolas, monospace'; const fl = faults(); ['OCTET & FILS · NUIT ' + S.n, 'PILE ' + S.ram + ' Go · COURANT ' + Math.max(0, S.power | 0) + ' %'].forEach((l, i) => g.fillText(l, mx + 22, 446 + i * 22));
      if (S.fix) { g.fillText('RÉPARATION : ' + FIXL[S.fix.w], mx + 22, 498); g.fillStyle = '#1a4a34'; g.fillRect(mx + 22, 508, 190, 10); g.fillStyle = '#7ef0b4'; g.fillRect(mx + 22, 508, 190 * (1 - S.fix.t / 4), 10); }
      else if (fl.length) fl.forEach((w, i) => { g.fillStyle = T % .8 < .5 ? '#ff5a4a' : '#c0483a'; g.fillText('[' + FIXK[w] + '] ' + FIXL[w], mx + 22, 498 + i * 22); });
      else g.fillText(T % 1 < .5 ? '> tout marche _' : '> tout marche', mx + 22, 498); }
    // la lumière de la pièce : la lampe du bureau, qui vacille ; noir presque total sans courant
    const lamp = S.out ? 0 : S.flick > 0 ? (S.ramPos === 'in' ? Math.random() * .5 : .35 + Math.random() * .3) : 1;
    g.fillStyle = rad(g, 960 - p, 520, 40, 1050, [[0, `rgba(0,0,0,${.15 + (1 - lamp) * .6})`], [.5, `rgba(0,0,0,${.5 + (1 - lamp) * .4})`], [1, `rgba(0,0,0,${.88 + (1 - lamp) * .1})`]]); g.fillRect(0, 0, W, H);
    if (S.ramPos === 'in') { const sx = 960 - p + Math.sin(T * 1.3) * 40; soft(g, 18, () => blobPath(g, [sx - 300, 600, sx - 230, 340, sx - 100, 270, sx - 80, 140, sx, 80, sx + 80, 140, sx + 100, 270, sx + 230, 340, sx + 300, 600]), 'rgba(0,0,0,.88)');
      if (R(3)) for (const ex of [-26, 24]) glow(g, sx + ex, 150, 16, '110,240,255', .8); }
    if (S.gerSeen > 0) drawGerard(960 - p, 470, 1.5, Math.min(1, S.gerSeen) * (R(6) ? 1 : .4));
    if (S.out) { g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(0, 0, W, H); if (S.outPhase === 1) { const x = DOOR_L.x - p + DOOR_L.w / 2; ramGlow(g, x, DOOR_Y + DOOR_H + 30, .68, 'lean', .8 + .4 * Math.sin(T * 9)); } }
    // une Puce ou le Revendeur qui vient de voler
    if (S.steal) {
      const k = S.steal.t;
      if (S.steal.who === 'scalper') { litChar(g, (cg, a, b, s) => drawScalper(cg, a, b, s, 'run', .9, T), W * .62 + Math.sin(T * 40) * 8, H + 200, 1.15, 1, .4, 'scrun' + (T * 12 | 0) % 6); g.fillStyle = `rgba(255,40,30,${k * .25})`; g.fillRect(0, 0, W, H); }
      else if (S.steal.who === 'chips') for (let i = 0; i < 5; i++) drawChip(g, 1100 - p + i * 40 - k * 200 * (i % 2 ? 1 : -1), 530 + (i % 2) * 20, .9, .7, T, i);
    }
  }

  // ---------- dessin des caméras ----------
  function drawCam() {
    const id = S.sel, room = rooms[id], here = S.ramPos == id, close = here && S.ramVar && /[368]/.test(id), ox = Math.sin(T * .22 + +id) * 46;
    g.save(); g.translate(W / 2, H / 2); g.scale(1.08, 1.08); g.translate(-W / 2 - ox, -H / 2);
    g.drawImage(room.base, 0, 0); S.camOx = ox;
    const lit = .75, ch = (draw, x, y, s, side = -1, key) => litChar(g, draw, x, y, s, side, .4, key);
    const ram = pose => (cg, a, b, s) => drawRam(cg, a, b, s, pose, lit, T), sc = pose => (cg, a, b, s) => drawScalper(cg, a, b, s, pose, lit, T);
    if (here && room.spots.ram && !close) { const [fx, fy] = room.spots.ram; g.save(); g.translate(fx, fy); g.rotate(Math.sin(T * .7) * .01 + (T % 4.3 < .06 ? .03 : 0)); g.translate(-fx, -fy); ch(ram(id === '4' ? 'lean' : 'stand'), ...room.spots.ram, -1, id === '4' ? 'ramlean' : 'ramstand'); g.restore(); }
    if (id === '5') { const [x, y, s] = room.spots.scalper; drawCart(g, ...room.spots.cart, lit);
      if (S.scStage === 0) { ell(g, 1040, 470, 10, 10, '#000'); }
      else if (S.scStage === 1) ch(sc('stand'), x + 260, y, s * .9, 1, 'sc');
      else if (S.scStage === 2) ch(sc('stand'), x, y, s, 1, 'sc'); }
    if (id === '6' && S.scRun) ch(sc('run'), 640 + (4.2 - S.scRun) * 60, 600 + (4.2 - S.scRun) * 40, +(.55 + (4.2 - S.scRun) * .2).toFixed(1), 1, 'scrun' + (T * 12 | 0) % 6);
    if (id === '7') for (let i = 0; i < (S.chPos ? 1 + Math.min(3, S.chPos) : 0); i++) { const k = S.chPos / 4, s = .35 + k * 1.4; drawChip(g, 640 + (i - 1) * 90 * s, 345 + k * 200 + (i % 2) * 20 * s, s, .8, T, i); }
    g.drawImage(room.shade, 0, 0);
    if (S.frag && S.frag.cam == id) { const { x: fx, y: fy } = S.frag; g.save(); g.translate(fx, fy); g.rotate(-.2); rrect(g, -22, -16, 44, 32, 2, '#d8d0b8'); g.strokeStyle = 'rgba(40,40,60,.5)'; g.lineWidth = 1.5; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-16, -8 + k * 6); g.lineTo(10 - k * 3, -8 + k * 6); g.stroke(); } g.restore(); glow(g, fx, fy, 50 + Math.sin(T * 5) * 8, '255,230,160', .35); }
    if (here && R(5) === 0) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-60, 0, W + 120, H); }  // la lampe de la pièce saute
    // les yeux et les LED percent l'ombre
    if (here && room.spots.ram && !close) ramGlow(g, ...room.spots.ram, id === '4' ? 'lean' : 'stand', .8);
    if (close) { const hx = 520, hy = 480; soft(g, 6, () => blobPath(g, [hx - 330, H + 40, hx - 300, hy + 230, hx - 150, hy + 170, hx, hy + 190, hx + 150, hy + 170, hx + 300, hy + 230, hx + 330, H + 40]), '#09090b');
      g.save(); g.translate(hx, hy); g.rotate(.2 + Math.sin(T * .5) * .03 + (T % 3.1 < .06 ? .08 : 0)); g.drawImage(headClose(), -280, -300); g.fillStyle = 'rgba(0,0,6,.35)'; g.fillRect(-280, -300, 560, 640);
      for (const ex of [-30, 28]) { glow(g, ex * 2.2, -22 * 2.2, 46, '110,240,255', .9); glow(g, ex * 2.2, -22 * 2.2, 8, '230,255,255', 1); } g.restore(); }
    if (id === '5' && S.scStage === 0) glow(g, 1040, 470, 24, '255,50,40', .9);
    if (id === '7') for (let i = 0; i < (S.chPos ? 1 + Math.min(3, S.chPos) : 0); i++) { const k = S.chPos / 4, s = .35 + k * 1.4; glow(g, 640 + (i - 1) * 90 * s, 345 + k * 200 + (i % 2) * 20 * s - 24 * s, 30 * s, '120,255,120', .8); }
    for (const [lx, ly, c, ph] of room.leds) if (Math.sin(T * (2 + ph * 6) + ph * 9) > -.2) { g.fillStyle = c === 'g' ? '#3cff8a' : c === 'a' ? '#ffb43a' : '#ff4a3a'; g.fillRect(lx - 2, ly - 2, 4, 4); }
    g.restore();
    // l'image de caméra : grain, lignes, rayures, déchirures, et la neige quand on change de caméra ou quand quelqu'un passe
    if (R(3) === 0) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(R(W), 0, 1 + R(2), H); }
    g.save(); g.globalAlpha = .1 + (S.disrupt > 0 ? .6 : 0) + (S.switchT > 0 ? .8 : 0); g.globalCompositeOperation = 'screen'; g.imageSmoothingEnabled = false; g.drawImage(NOISE[(T * 30 | 0) % 4], 0, 0, W, H); g.restore();
    g.drawImage(SCAN, 0, 0);
    if (R(6) === 0) { const y = R(H); g.drawImage(cv, 0, y, W, 8, R(20) - 10, y, W, 8); }
    if (S.disrupt > 0) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8e8e8'; g.font = 'bold 36px Consolas, monospace'; g.textAlign = 'center'; g.fillText('SIGNAL PERDU', W / 2, H / 2); g.textAlign = 'left'; }
    if (id === '7' && S.chPos >= 3) { g.fillStyle = `rgba(255,60,40,${.5 + .5 * Math.sin(T * 8)})`; g.font = 'bold 18px Consolas, monospace'; g.fillText('MOUVEMENT DANS LA GAINE', 30, 170); }
    // REC, nom de la caméra, carte
    if (T % 1.2 < .7) ell(g, 42, 92, 9, 9, '#ff2a2a'); g.fillStyle = '#eee'; g.font = 'bold 20px Consolas, monospace'; g.fillText('REC', 58, 99);
    g.font = 'bold 24px Consolas, monospace'; g.fillText('CAM ' + id + ' · ' + room.name, 30, 136);
    const sec = S.time / S.hourLen * 3600 | 0; g.font = '16px Consolas, monospace'; g.fillStyle = 'rgba(230,230,230,.75)'; g.fillText(`${String(sec / 3600 | 0).padStart(2, '0')}:${String(sec / 60 % 60 | 0).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}  1987-11-13`, 30, 162);
    if (S.ger) { const k = 1 - S.ger / 3.4; drawGerard(330, 470, 1.5, .15 + k * .5); if (T % .6 < .4) { g.fillStyle = '#ff5a4a'; g.font = 'bold 22px Consolas, monospace'; g.fillText('QUELQU\'UN RESPIRE DERRIÈRE TOI', 30, 200); } }
    drawMap();
    // l'écran piraté : plus d'image, plus de leurre, tant qu'on n'a pas redémarré depuis le bureau
    if (S.hacked) { g.fillStyle = 'rgba(0,0,0,.92)'; g.fillRect(0, 0, W, H - 60); g.save(); g.globalAlpha = .25; g.drawImage(NOISE[(T * 30 | 0) % 4], 0, 0, W, H - 60); g.restore(); drawMap();
      g.fillStyle = T % 1 < .6 ? '#ff5a4a' : '#7a2a24'; g.font = 'bold 40px Consolas, monospace'; g.textAlign = 'center'; g.fillText('ACCÈS REFUSÉ', (MAPX - 20) / 2, H / 2 - 30);
      g.fillStyle = '#ccc'; g.font = '18px Consolas, monospace'; g.fillText(S.fix && S.fix.w === 'cams' ? 'redémarrage en cours…' : 'Redémarre les caméras depuis le moniteur du bureau (R)', (MAPX - 20) / 2, H / 2 + 10); g.fillStyle = '#7ef0b4'; g.fillText('« Je vois tout, maintenant. »', (MAPX - 20) / 2, H / 2 + 50); g.textAlign = 'left'; }
    // le bouton du leurre audio, au-dessus de la carte
    const lx = MAPX - 10, ly = MAPY - 58, ready = S.lureCd <= 0 && !S.hacked && !S.ch[0];
    rrect(g, lx, ly, 330, 40, 6, ready ? 'rgba(126,240,180,.18)' : 'rgba(255,255,255,.06)', ready ? '#7ef0b4' : '#555', 2);
    g.fillStyle = ready ? '#7ef0b4' : '#888'; g.font = 'bold 15px Arial'; g.textAlign = 'center'; g.fillText(S.lure ? '♪ LE CARILLON JOUE…' : ready ? '♪ LEURRE AUDIO SUR CAM ' + id + ' (L)' : S.ch[0] ? 'LEURRE INTERDIT (DÉFI)' : S.hacked ? 'LEURRE HORS LIGNE' : 'LEURRE : ' + Math.ceil(S.lureCd) + ' s', lx + 165, ly + 26); g.textAlign = 'left';
  }
  // ramasser un fragment ; jouer le leurre
  function pickFrag(x, y) {
    if (!S.frag || S.frag.cam !== String(S.sel) || S.hacked) return false;
    const sx = (S.frag.x - W / 2 - S.camOx) * 1.08 + W / 2, sy = (S.frag.y - H / 2) * 1.08 + H / 2;
    if (Math.hypot(x - sx, y - sy) > 46) return false;
    save.docs.push(S.frag.id); keep(); S.newDoc = S.frag.id; A.chime(); flash((TAPES.includes(S.frag.id) ? 'Cassette trouvée : ' : 'Fragment trouvé : ') + FRAGS.find(f => f[0] === S.frag.id)[1] + ' (Archives)', '#ffd84a'); S.frag = null; return true;
  }
  function lure() {
    if (!S.cam || S.hacked || S.lureCd > 0 || S.ch[0]) return A.deny();
    S.lure = { cam: String(S.sel), t: 2 }; S.lureCd = 14; S.power -= 1.5; A.lure();
  }
  function drawMap(Lv) {
    rrect(g, MAPX - 10, MAPY - 10, 330, 290, 6, 'rgba(0,0,0,.55)', 'rgba(255,255,255,.25)', 2);
    if (Lv) { g.strokeStyle = 'rgba(220,220,220,.5)'; g.lineWidth = 5; for (const [a, d] of [['4', 'L'], ['6', 'R']]) { g.beginPath(); g.moveTo(MAPX + MAP[a][0] + 30, MAPY + MAP[a][1] + 14); g.lineTo(MAPX + MAP_DOORS[d][0] + 30, MAPY + MAP_DOORS[d][1] + 14); g.stroke(); } }
    g.strokeStyle = 'rgba(220,220,220,.5)'; g.lineWidth = 5;
    const L = (a, b) => { g.beginPath(); g.moveTo(MAPX + MAP[a][0] + 30, MAPY + MAP[a][1] + 14); g.lineTo(MAPX + MAP[b][0] + 30, MAPY + MAP[b][1] + 14); g.stroke(); };
    L(1, 2); L(2, 8); L(8, 3); L(2, 3); L(3, 4); L(2, 6); L(5, 6); L(2, 7);
    rrect(g, MAPX + 120, MAPY + 222, 80, 40, 3, 'rgba(255,255,255,.15)', '#ddd', 2); g.fillStyle = '#ddd'; g.font = 'bold 12px Arial'; g.fillText('TOI', MAPX + 148, MAPY + 247);
    for (const [id, [x, y]] of Object.entries(Lv ? { ...MAP, ...MAP_DOORS } : MAP)) { const on = Lv ? Lv.pos === id || (Lv.mv && Lv.mv.to === id) : String(S.sel) === id; rrect(g, MAPX + x, MAPY + y, 60, 28, 3, on ? '#7ef0b4' : '#2a2e33', '#9aa', 2); g.fillStyle = on ? '#000' : '#ddd'; g.font = 'bold 13px Arial'; if (/[LR]/.test(id)) g.font = 'bold 11px Arial'; g.fillText(/[LR]/.test(id) ? 'PORTE ' + (id === 'L' ? 'G' : 'D') : 'CAM ' + id, MAPX + x + 6, MAPY + y + 19);
      if (Lv && (Lv.eye === id || (Lv.next === id && T % .3 < .15))) { g.strokeStyle = Lv.eye === id ? '#ff3a2a' : '#ffd84a'; g.lineWidth = 3; g.strokeRect(MAPX + x - 5, MAPY + y - 5, 70, 38); } }
    if (!Lv && S.mark && MAP[S.mark.cam]) { const [x, y] = MAP[S.mark.cam]; g.globalAlpha = Math.min(1, S.mark.t); g.fillStyle = '#ffd84a'; g.font = 'bold 13px Arial'; g.fillText(S.mark.k === '♪' ? '♪ carillon' : '≈ pas', MAPX + x, MAPY + y - 4); g.globalAlpha = 1; }
  }
  // Gérard, le père de Léo : un vieil homme en casquette de gardien, le visage blême, les yeux creux
  function drawGerard(x, y, s, a) {
    g.save(); g.globalAlpha = a;
    soft(g, 10, () => blobPath(g, [x - 170 * s, y + 320 * s, x - 150 * s, y + 60 * s, x - 70 * s, y - 10 * s, x + 66 * s, y - 14 * s, x + 140 * s, y + 50 * s, x + 176 * s, y + 320 * s]), '#0d0e11');
    form(g, [x - 44 * s, y - 120 * s, x + 46 * s, y - 124 * s, x + 54 * s, y - 70 * s, x + 30 * s, y - 26 * s, x + 6 * s, y - 18 * s, x - 26 * s, y - 28 * s, x - 48 * s, y - 72 * s], '#a8a290', { aw: 22 * s, ao: .6, hi: .12 });
    for (const [ex, ey, rx] of [[-20, -88, 16], [22, -90, 15]]) soft(g, 5 * s, () => { g.beginPath(); g.ellipse(x + ex * s, y + ey * s, rx * s, 12 * s, 0, 0, Math.PI * 2); }, 'rgba(14,10,8,.92)');
    soft(g, 6 * s, () => { g.beginPath(); g.ellipse(x - 30 * s, y - 56 * s, 9 * s, 18 * s, .2, 0, Math.PI * 2); g.ellipse(x + 36 * s, y - 58 * s, 8 * s, 18 * s, -.2, 0, Math.PI * 2); }, 'rgba(40,30,24,.35)');
    for (const ex of [-20, 22]) ell(g, x + ex * s + Math.sin(T * 3) * s, y - 89 * s, 1.6 * s, 1.6 * s, 'rgba(255,240,220,.7)');
    soft(g, 2 * s, () => { g.beginPath(); g.ellipse(x + 4 * s, y - 44 * s, 12 * s, 7 * s, .05, 0, Math.PI * 2); }, '#1a0f0c');
    soft(g, 8 * s, () => { g.beginPath(); g.rect(x - 60 * s, y - 112 * s, 120 * s, 16 * s); }, 'rgba(0,0,0,.5)');
    poly(g, [x - 56 * s, y - 128 * s, x + 60 * s, y - 132 * s, x + 64 * s, y - 112 * s, x - 58 * s, y - 108 * s], '#1c2836'); poly(g, [x - 60 * s, y - 112 * s, x + 78 * s, y - 114 * s, x + 74 * s, y - 104 * s, x - 62 * s, y - 104 * s], '#121a24');
    rrect(g, x - 70 * s, y + 70 * s, 34 * s, 16 * s, 2, '#8a8270');
    g.restore();
  }

  // ---------- l'interface par-dessus ----------
  function drawHud() {
    g.fillStyle = '#e8e8e8'; g.font = 'bold 34px Consolas, monospace'; g.textAlign = 'right'; g.fillText(HOUR[Math.min(6, Math.floor(S.time / S.hourLen))], W - 30, 54);
    g.font = 'bold 18px Consolas, monospace'; g.fillText('NUIT ' + (S.n === 7 ? 'PERSO' : S.n), W - 30, 82); g.textAlign = 'left';
    const pw = Math.max(0, S.power | 0); g.font = 'bold 20px Consolas, monospace'; g.fillStyle = pw < 15 ? '#ff5a4a' : '#e8e8e8'; g.fillText('COURANT : ' + pw + ' %', 30, H - 70);
    g.fillText('CONSO :', 30, H - 40); for (let i = 0; i < 5; i++) { g.fillStyle = i < S.usage ? ['#3cdc7a', '#3cdc7a', '#ffd84a', '#ff8a3a', '#ff4a3a'][i] : 'rgba(255,255,255,.12)'; g.fillRect(126 + i * 22, H - 58, 16, 22); }
    g.fillStyle = S.ram <= 16 ? '#ff5a4a' : '#9ad8b4'; g.fillText('RAM : ' + S.ram + ' Go', 30, 54);
    // la barre de la tablette
    const bx = W / 2 - 300, by = H - 44; rrect(g, bx, by, 600, 32, 4, hoverBar ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.14)', 'rgba(255,255,255,.4)', 2);
    g.fillStyle = '#fff'; g.font = 'bold 16px Arial'; g.textAlign = 'center'; g.fillText(S.cam ? '▼  BAISSER LA TABLETTE (ESPACE)' : '▲  CAMÉRAS (ESPACE)', W / 2, by + 22); g.textAlign = 'left';
    if (msg) { g.globalAlpha = Math.min(1, msg.t); g.fillStyle = msg.col; g.font = 'bold 24px Arial'; g.textAlign = 'center'; g.fillText(msg.text, W / 2, 120); g.textAlign = 'left'; g.globalAlpha = 1; }
    if (S.tuto >= 0) { const [txt, , at] = TUTO[S.tuto], [ax, ay] = typeof at === 'function' ? at() : at, b = Math.sin(T * 6) * 8;
      rrect(g, W / 2 - 420, 150, 840, 52, 8, 'rgba(10,30,22,.9)', '#7ef0b4', 2); g.fillStyle = '#7ef0b4'; g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText((S.tuto + 1) + '/' + TUTO.length + ' · ' + txt, W / 2, 183); g.textAlign = 'left';
      g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(ax + b, ay); g.lineTo(ax + 30 + b, ay - 18); g.lineTo(ax + 30 + b, ay + 18); g.closePath(); g.fill(); g.fillRect(ax + 30 + b, ay - 6, 36, 12); }
    if (S.said > 0) { S.said -= 1 / 60; g.fillStyle = `rgba(150,240,255,${Math.min(1, S.said)})`; g.font = 'italic 22px Georgia'; g.textAlign = 'center'; g.fillText('« ' + S.saidText + ' »', W / 2, H - 120); g.textAlign = 'left'; }
    // le message du téléphone : sous-titres et bouton pour le couper
    if (S.call) {
      const c = S.call, line = c.lines[c.i];
      if (!c.spoken && c.t >= 0) { c.spoken = true; c.dur = Math.max(4, line.length * .062); A.say(line, c.leo ? { rate: .74, pitch: .15, vol: .8, alt: true } : { rate: 1.05, pitch: .9 }); if (c.leo) A.glitch(); }
      if (c.t > c.dur) { c.i++; c.t = 0; c.spoken = false; if (c.i >= c.lines.length) S.call = null; }
      if (S.call) { rrect(g, 160, H - 210, W - 320, 110, 8, 'rgba(0,0,0,.72)', 'rgba(255,255,255,.25)', 2); g.fillStyle = '#ffd84a'; g.font = 'bold 14px Arial'; g.fillText(c.leo ? (c.t < 0 ? '☎ ÇA SONNE…' : '☎ APPEL DU 13/11/1987, 23 H 52 — LÉO ?') : S.n >= 5 ? '☎ NUMÉRO INCONNU' : '☎ MESSAGE DE GÉRARD, L\'ANCIEN VEILLEUR', 180, H - 186);
        g.fillStyle = c.leo ? '#b4f0ff' : '#eee'; g.font = '18px Georgia'; if (c.t >= 0) wrapText(c.leo && R(12) === 0 ? line.replace(/[aeiou]/g, '█') : line, 180, H - 160, W - 360, 24);
        rrect(g, W - 300, H - 202, 120, 26, 4, 'rgba(255,90,74,.25)', '#ff5a4a', 2); g.fillStyle = '#ff9a8a'; g.font = 'bold 12px Arial'; g.fillText('COUPER (C)', W - 280, H - 184); }
    }
  }
  const TUTO = [
    ['Lève la tablette des caméras : ESPACE, ou passe la souris sur la barre du bas.', () => S.cam, [W / 2 + 310, H - 28]],
    ['Choisis une autre caméra : clique sur la carte, ou touche 1 à 8.', () => S.cam && S.sel != 1, [MAPX + 210, MAPY + 100]],
    ['Baisse la tablette (ESPACE).', () => !S.cam, [W / 2 + 310, H - 28]],
    ['Regarde à gauche : souris au bord gauche de l\'écran, ou flèche ←.', () => S.pan < 120, [30, H / 2]],
    ['Allume la lumière de la porte gauche (A) : s\'il est là, tu le verras.', () => S.lightL, () => [480 - S.pan + 30, 360]],
    ['Ferme la porte gauche (Q).', () => S.doorL, () => [480 - S.pan + 30, 290]],
    ['Rouvre-la (Q) : une porte fermée mange du courant. Bonne nuit !', () => !S.doorL, () => [480 - S.pan + 30, 290]],
  ];
  function wrapText(text, x, y, w, lh) { let line = '', yy = y; for (const word of text.split(' ')) { const t = line ? line + ' ' + word : word; if (g.measureText(t).width > w) { g.fillText(line, x, yy); line = word; yy += lh; } else line = t; } g.fillText(line, x, yy); return yy + lh; }

  // ---------- les écrans ----------
  const MENU = () => [['NOUVELLE PARTIE', () => { scene = 'intro'; sceneT = 0; }], ...(save.night > 1 ? [['CONTINUER · NUIT ' + Math.min(save.night, 5), () => start(Math.min(save.night, 5))]] : []),
    ...(save.night >= 6 ? [['NUIT 6', () => start(6)]] : []), ...(save.stars >= 1 ? [['NUIT PERSO', () => { scene = 'custom'; sceneT = 0; }]] : []), ...(save.docs.includes('fin') ? [['NUIT 7 · LÉO', startLeo]] : []), ...(save.docs.length ? [['ARCHIVES (' + save.docs.length + ')', () => { scene = 'archives'; sceneT = 0; }]] : []), ['COMMENT JOUER', () => { scene = 'help'; sceneT = 0; }], ['RÉGLAGES', () => { scene = 'settings'; sceneT = 0; }]];
  let buttons = [];
  const button = (label, x, y, w, h, fn, sel) => { const hov = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h; buttons.push({ x, y, w, h, fn }); g.fillStyle = hov || sel ? '#fff' : '#9a9a9a'; g.font = 'bold 30px Impact, "Arial Black", sans-serif'; g.fillText((hov || sel ? '> ' : '') + label, x, y + h - 8); };
  function drawTitle() {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    // son visage dans le noir, qui apparaît par à-coups
    const k = .35 + .25 * Math.sin(T * .7) + (R(40) === 0 ? .4 : 0);
    g.save(); g.globalAlpha = Math.min(1, k); head(g, 900, 330, 2.6, .55, T, false); g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H); for (const ex of [-30, 28]) glow(g, 900 + ex * 2.6, 330 - 22 * 2.6, 70, '110,240,255', .5 + .3 * k);
    g.fillStyle = '#ececec'; g.font = '86px Impact, "Arial Black", sans-serif'; g.fillText('RAM', 80, 150); g.fillText('ALTMAN', 80, 236);
    g.fillStyle = '#7ef0b4'; g.font = 'bold 18px Consolas, monospace'; g.fillText('LE VEILLEUR DE LA PILE', 84, 272);
    for (let i = 0; i < save.stars; i++) { g.fillStyle = '#ffd84a'; g.font = '34px Arial'; g.fillText('★', 84 + i * 40, 320); }
    if (save.medals.length) { g.fillStyle = '#ffd84a'; g.font = 'bold 12px Arial'; g.fillText('MÉDAILLES : ' + save.medals.map(i => CHALL[i]).join(' · '), 84 + save.stars * 40 + 12, 312); }
    MENU().forEach(([l, fn], i) => button(l, 84, 330 + i * 43, 460, 40, fn, i === menuSel));
    g.fillStyle = '#666'; g.font = '13px Arial'; g.fillText('Une parodie. Aucun vrai patron n\'a été robotisé.', W - 340, H - 16);
  }
  function drawIntro() {
    g.fillStyle = '#05080a'; g.fillRect(0, 0, W, H);
    rrect(g, 200, 70, 880, 560, 10, '#0c1612', '#2a4a3a', 3);
    g.fillStyle = '#7ef0b4'; g.font = '18px Consolas, monospace';
    const L = ['De : Ressources humaines, Octet & Fils', 'À : toi', 'Objet : Poste de veilleur de nuit (00 h – 06 h)', '', 'Bonjour,', '', 'Suite à votre candidature, nous avons le plaisir de vous confier', 'la surveillance de la Pile : 64 Go de RAM, notre dernier stock.', '', 'Salaire : 120 € la semaine. Café fourni.', '', 'Octet & Fils décline toute responsabilité en cas de :', '  - barrettes volées ;', '  - sourires persistants ;', '  - rencontre avec Monsieur R. Altman (ClosedRAM).', '', 'Bonne prise de poste.', '', '                 [ cliquer pour commencer ]'];
    const shown = Math.floor(sceneT * 40); let n = 0;
    L.forEach((l, i) => { const part = l.slice(0, Math.max(0, shown - n)); n += l.length + 4; g.fillText(part, 240, 120 + i * 26); });
    post(g, T, .08, .6);
  }
  function drawHelp() {
    g.fillStyle = '#05080a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ececec'; g.font = '48px Impact, "Arial Black", sans-serif'; g.fillText('COMMENT JOUER', 80, 100);
    g.font = '18px Georgia'; g.fillStyle = '#ccc'; let hy = 150;
    ['Tiens de 00 h à 06 h sans perdre la Pile (64 Go de RAM).', '', 'Souris aux bords de l\'écran (ou ← →) : regarder à gauche et à droite.', 'Q / D : porte gauche / droite.   A / E : lumière gauche / droite.', 'V : trappe d\'aération.   ESPACE : les caméras (1 à 8 pour en choisir une).   C : couper le message.', '',
      'RAM ALTMAN : il marche vers tes portes. Dans le noir on ne le voit pas : éclaire. S\'il entre, plus rien ne marche… ne baisse pas la tablette.', 'LE REVENDEUR : regarde-le à la caméra 5, sinon il court par le couloir est (−16 Go si la porte droite est ouverte).', 'LES PUCES : elles grattent dans la gaine (caméra 7). Ferme la trappe quand elles arrivent (−8 Go sinon).', '',
      'LEURRE AUDIO (L) : un carillon dans la pièce filmée ; s\'il est à côté, il vient voir. Utile pour l\'éloigner d\'une porte.', 'PANNES : le moniteur du bureau dit quoi réparer, une chose à la fois. R : caméras, T : trappe, P : courant. Des papiers traînent sur les caméras : clique.', 'GÉRARD (nuit 4) : reste trop longtemps dans les caméras et il entre. Baisse la tablette. Et n\'écoute pas tout : il imite le carillon.', 'Tout consomme du courant. À 0 %, tout s\'éteint… et il fredonne.', '[ cliquer pour revenir ]'].forEach(l => { hy = l ? wrapText(l, 80, hy, W - 160, 25) + 3 : hy + 10; });
  }
  function drawCustom() {
    g.fillStyle = '#05080a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ececec'; g.font = '48px Impact, "Arial Black", sans-serif'; g.fillText('NUIT PERSO', 80, 100);
    ['RAM ALTMAN', 'LE REVENDEUR', 'LES PUCES'].forEach((name, i) => {
      const x = 80 + i * 380, y = 180; rrect(g, x, y, 340, 300, 8, '#0c0f12', '#3a4048', 2);
      g.save(); g.beginPath(); g.rect(x, y, 340, 220); g.clip();
      if (i === 0) head(g, x + 170, y + 120, 1, .8, T, false); else if (i === 1) drawScalper(g, x + 170, y + 500, .55, 'stand', .8, T); else drawChip(g, x + 170, y + 120, 2.2, .8, T);
      g.restore();
      g.fillStyle = '#eee'; g.font = 'bold 22px Arial'; g.fillText(name, x + 20, y + 254); g.font = 'bold 34px Consolas, monospace'; g.fillText(String(save.custom[i]).padStart(2, ' '), x + 150, y + 290);
      button('−', x + 70, y + 250, 50, 46, () => { save.custom[i] = Math.max(0, save.custom[i] - 1); }); button('+', x + 240, y + 250, 50, 46, () => { save.custom[i] = Math.min(20, save.custom[i] + 1); });
    });
    button('LANCER LA NUIT', 80, 540, 360, 50, () => { keep(); start(7, save.custom); });
    button('RETOUR', 80, 610, 200, 50, () => { keep(); scene = 'title'; });
    CHALL.forEach((c, i) => button((save.chall[i] ? '[X] ' : '[  ] ') + c + (save.medals.includes(i) ? ' ★' : ''), 520, 520 + i * 52, 520, 44, () => { save.chall[i] = !save.chall[i]; }));
    g.fillStyle = '#888'; g.font = '15px Arial'; g.fillText('20 / 20 / 20 jusqu\'à 6 h : la troisième étoile. Un défi gagné avec chaque menace à 10 ou plus : une médaille.', 80, 700);
  }
  function drawSettings() {
    g.fillStyle = '#05080a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ececec'; g.font = '48px Impact, "Arial Black", sans-serif'; g.fillText('RÉGLAGES', 80, 100);
    const o = save.opts, cl = (v, a, b) => Math.round(Math.min(b, Math.max(a, v)) * 100) / 100;
    [['Son', A.muted ? 'COUPÉ' : 'ALLUMÉ', () => { A.muted = !A.muted; A.mute(A.muted); }],
      ['Volume des bruits', Math.round(o.sfx * 100) + ' %', d => { o.sfx = cl(o.sfx + d * .1, 0, 1); A.setVol(o.sfx); }],
      ['Volume des voix', Math.round(o.voice * 100) + ' %', d => { o.voice = cl(o.voice + d * .1, 0, 1); A.voice = o.voice; }],
      ['Vitesse du regard (souris aux bords)', o.pan + ' ×', d => { o.pan = cl(o.pan + d * .25, .5, 2); }],
      ['Sauts au visage', o.calm ? 'ATTÉNUÉS' : 'NORMAUX', () => { o.calm = !o.calm; }],
      ['Tutoriel de la nuit 1', save.tuto ? 'DÉJÀ FAIT' : 'À LA PROCHAINE NUIT 1', () => { save.tuto = save.tuto ? 0 : 1; }]].forEach(([l, v, fn], i) => {
      const y = 140 + i * 72; g.fillStyle = '#ccc'; g.font = '22px Georgia'; g.fillText(l, 80, y + 32); g.fillStyle = '#7ef0b4'; g.font = 'bold 22px Consolas, monospace'; g.fillText(v, 560, y + 32);
      if (fn.length) { button('−', 860, y, 50, 44, () => fn(-1)); button('+', 930, y, 50, 44, () => fn(1)); } else button('CHANGER', 860, y, 200, 44, fn); });
    g.fillStyle = '#888'; g.font = '15px Arial'; g.fillText('« Atténués » : pas de cri ni de visage qui surgit, pas d\'hallucinations. Le jeu reste le même.', 80, 600);
    button('RETOUR', 80, H - 80, 200, 50, () => { keep(); scene = 'title'; });
  }
  // ---------- la nuit 7, cachée : on est Léo, dans le corps du robot, et le veilleur nous cherche aux caméras ----------
  let L7 = null;
  function startLeo() { A.unlock(); A.hush(); A.ambience(true); L7 = { pos: '1', mv: null, eye: '5', eyeT: 3, next: null, sus: 0, door: { L: true, R: true }, doorT: 3, end: 0, won: false, t: 0 }; scene = 'leo'; sceneT = 0; }
  function leoTick(dt) {
    const s = L7; s.t += dt; if (s.end) { s.end += dt; return; }
    // le veilleur change de caméra ; la suivante clignote 0,8 s avant
    s.eyeT -= dt;
    if (s.eyeT < .8 && !s.next) { const near = [s.pos, ...(ADJ[s.pos] || [])], pool = R(10) < 6 ? near : LEO_ROOMS; s.next = pool[R(pool.length)]; if (s.next === s.eye) s.next = LEO_ROOMS[R(LEO_ROOMS.length)]; }
    if (s.eyeT <= 0) { s.eye = s.next; s.next = null; s.eyeT = Math.max(1.6, 3.8 - s.t / 60) + Math.random() * 1.5; A.camSwitch(); }
    // il ferme et rouvre ses portes pour garder du courant
    if ((s.doorT -= dt) <= 0) { s.doorT = 2.5 + Math.random() * 3.5; const d = R(2) ? 'L' : 'R'; s.door[d] = !s.door[d]; A.door(s.door[d]); }
    // marcher prend 1,4 s : pendant ce temps, on est visible dans les deux pièces
    if (s.mv && (s.mv.t -= dt) <= 0) { s.pos = s.mv.to; s.mv = null; }
    const seen = s.eye === s.pos || (s.mv && s.eye === s.mv.to);
    s.sus = Math.max(0, s.sus + (seen ? (s.mv ? 1.1 : .28) : -.08) * dt);
    if (s.sus >= 1) { s.end = .01; A.bang(0); A.glitch(); }
  }
  function leoMove(to) {
    const s = L7; if (s.end || s.mv) return A.deny();
    if (to === 'in') { if (/[LR]/.test(s.pos) && !s.door[s.pos]) { s.end = .01; s.won = true; A.ambience(false); A.chime(); if (!save.docs.includes('epi')) { save.docs.push('epi'); keep(); } } else A.deny(); return; }
    if (!(ADJ[s.pos] || []).includes(to)) return A.deny();
    s.mv = { to, t: 1.4 }; stepAt(to);
  }
  function drawLeo() {
    const s = L7, seen = s.eye === s.pos || (s.mv && s.eye === s.mv.to);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (s.mv) { g.drawImage(NOISE[(T * 30 | 0) % 4], 0, 0, W, H); g.fillStyle = 'rgba(0,0,0,.82)'; g.fillRect(0, 0, W, H); g.fillStyle = '#9aa'; g.font = 'italic 24px Georgia'; g.textAlign = 'center'; g.fillText('tu marches…', (MAPX - 20) / 2, H / 2); g.textAlign = 'left'; }
    else if (/[LR]/.test(s.pos)) {
      const closed = s.door[s.pos]; g.fillStyle = '#0a0907'; g.fillRect(0, 0, W, H);
      if (closed) { g.fillStyle = lin(g, 220, 0, 700, 0, [[0, '#3a3e44'], [.5, '#70757c'], [1, '#33373c']]); g.fillRect(220, 150, 480, 410); g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 168; y < 560; y += 22) g.fillRect(220, y, 480, 3); }
      else { g.drawImage(office.c, 860, 150, 560, 470, 220, 150, 480, 410); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(220, 150, 480, 410); const px = 340; rrect(g, px, 440, 240, 80, 6, 'rgba(20,30,28,.9)', '#7a8a86', 3); for (let i = 0; i < 8; i++) rrect(g, px + 12 + i * 28, 454, 18, 54, 2, '#1f8a52'); glow(g, px + 120, 480, 170, '60,255,150', .25 + .08 * Math.sin(T * 2)); }
      g.strokeStyle = '#2a2620'; g.lineWidth = 14; g.strokeRect(213, 143, 494, 424);
      g.fillStyle = closed ? '#ff8a7a' : '#7ef0b4'; g.font = 'bold 22px Consolas, monospace'; g.textAlign = 'center'; g.fillText(closed ? 'PORTE FERMÉE · attends qu\'il la rouvre' : 'PORTE OUVERTE · la Pile est là', 460, 610); g.textAlign = 'left';
      if (!closed) button('ENTRER (ENTRÉE)', 330, 624, 300, 44, () => leoMove('in'));
    } else { const room = rooms[s.pos]; g.drawImage(room.base, 0, 0); g.drawImage(room.shade, 0, 0); g.fillStyle = 'rgba(0,0,10,.3)'; g.fillRect(0, 0, W, H); }
    // ses mains de métal en bas de l'image : c'est toi
    if (!s.mv && !/[LR]/.test(s.pos)) for (const hx of [380, 560]) { soft(g, 4, () => blobPath(g, [hx - 50, H + 10, hx - 40, H - 70, hx, H - 96, hx + 40, H - 70, hx + 50, H + 10]), '#4a4e54'); wline(g, [hx - 20, H - 80, hx - 18, H - 40], '#2a2d31', 3); wline(g, [hx + 10, H - 84, hx + 12, H - 40], '#2a2d31', 3); }
    g.drawImage(SCAN, 0, 0); post(g, T, .09, .75);
    if (seen && !s.end) { g.strokeStyle = 'rgba(255,40,30,' + (.6 + .3 * Math.sin(T * 10)) + ')'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14); g.fillStyle = '#ff5a4a'; g.font = 'bold 24px Consolas, monospace'; g.fillText('● IL TE REGARDE — NE BOUGE PAS', 30, 60); }
    g.fillStyle = '#ccc'; g.font = 'bold 18px Consolas, monospace'; g.fillText('NUIT 7 · TU ES LÉO', 30, 100); g.font = '15px Consolas, monospace'; g.fillStyle = '#9aa'; g.fillText('Rejoins une porte, attends qu\'elle s\'ouvre, entre. Clique une pièce voisine sur la carte.', 30, 126);
    drawMap(s);
    g.fillStyle = '#ccc'; g.font = 'bold 16px Consolas, monospace'; g.fillText('SOUPÇON', MAPX - 10, MAPY - 30); rrect(g, MAPX + 80, MAPY - 46, 240, 20, 4, 'rgba(255,255,255,.08)', '#666', 2); g.fillStyle = s.sus > .7 ? '#ff4a3a' : '#ffd84a'; g.fillRect(MAPX + 82, MAPY - 44, 236 * Math.min(1, s.sus), 16);
    if (s.end > .6) { g.fillStyle = 'rgba(0,0,0,.88)'; g.fillRect(0, 0, W, H); g.textAlign = 'center';
      if (s.won) { g.fillStyle = '#7ef0b4'; g.font = '52px Impact, "Arial Black", sans-serif'; g.fillText('LÉO ?', W / 2, 150); g.fillStyle = '#ddd'; g.font = '20px Georgia'; let y = 210; for (const l of EPI[1].split('\n')) { g.fillText(l, W / 2, y); y += l ? 30 : 12; } button('FIN', W / 2 - 50, y + 20, 120, 50, () => { scene = 'title'; }); }
      else { g.fillStyle = '#ff5a4a'; g.font = '52px Impact, "Arial Black", sans-serif'; g.fillText('IL T\'A VU', W / 2, H / 2 - 40); g.fillStyle = '#ccc'; g.font = '22px Georgia'; g.fillText('Il ferme les portes. Tu oublies encore un peu.', W / 2, H / 2 + 6);
        button('RÉESSAYER', W / 2 - 220, H / 2 + 60, 220, 50, startLeo); button('MENU', W / 2 + 60, H / 2 + 60, 160, 50, () => { A.ambience(false); scene = 'title'; }); }
      g.textAlign = 'left'; }
  }
  function drawCard() {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const a = Math.min(1, sceneT, Math.max(0, 3 - sceneT)); g.globalAlpha = a; g.fillStyle = '#ececec'; g.textAlign = 'center';
    g.font = '64px Impact, "Arial Black", sans-serif'; g.fillText('00 H', W / 2, H / 2 - 10); g.font = '30px Impact, "Arial Black", sans-serif'; g.fillText(S.n === 7 ? 'NUIT PERSO' : 'NUIT ' + S.n, W / 2, H / 2 + 40);
    g.textAlign = 'left'; g.globalAlpha = 1; post(g, T, .12, .6);
    if (sceneT > 3) { scene = 'play'; A.ambience(true); }
  }
  function drawSix() {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#ececec'; g.textAlign = 'center';
    const k = Math.min(1, sceneT / 1.5); g.font = '120px Impact, "Arial Black", sans-serif'; g.fillText(k < 1 ? '05 H' : '06 H', W / 2, H / 2);
    if (sceneT > 2) { g.font = '28px Georgia'; g.fillStyle = '#7ef0b4'; g.fillText(`La Pile tient encore : ${S.ram} Go sur 64.`, W / 2, H / 2 + 70); }
    if (sceneT > 3) { g.font = '20px Georgia'; g.fillStyle = '#aaa'; g.fillText(S.n === 5 ? 'Fin de semaine. Ta paie : 120 € et une barrette de 4 Go. Nuit 6 débloquée.' : S.n === 6 ? 'Il n\'a rien eu. Il sourit quand même. Nuit perso débloquée.' : '[ cliquer pour continuer ]', W / 2, H / 2 + 120); }
    if (sceneT > 4 && S.n < 7) { g.font = 'italic 18px Georgia'; g.fillStyle = '#ffd84a'; g.fillText(S.trueEnd ? 'Tu as tout trouvé. Va lire « La vraie fin » dans les Archives.' : 'Dans les Archives : ' + NEWS[S.n][0] + (S.newDoc ? ', et un fragment' : ''), W / 2, H / 2 + 160); }
    g.textAlign = 'left'; post(g, T, .1, .6);
  }
  // ---------- les archives : ce que tu as appris ----------
  const DOCS = () => [...FRAGS.map(([id, t, x]) => ({ id, t, x, k: TAPES.includes(id) ? 'CASSETTE' : 'FRAGMENT' })), ...Object.entries(NEWS).map(([n, [t, x]]) => ({ id: 'j' + n, t, x, k: 'JOURNAL' })), { id: 'fin', t: TRUE_END[0], x: TRUE_END[1], k: '???' }, { id: 'epi', t: EPI[0], x: EPI[1], k: '???' }];
  let doc = null;
  function drawArchives() {
    g.fillStyle = '#07090a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ececec'; g.font = '48px Impact, "Arial Black", sans-serif'; g.fillText('ARCHIVES', 80, 90);
    const all = DOCS(), have = all.filter(d => save.docs.includes(d.id)).length; g.font = '16px Consolas, monospace'; g.fillStyle = '#7ef0b4'; g.fillText(have + ' / ' + all.length + ' documents', 330, 88);
    all.forEach((d, i) => { const x = 80 + (i % 3) * 380, y = 124 + Math.floor(i / 3) * 80, got = save.docs.includes(d.id);
      rrect(g, x, y, 350, 70, 6, got ? '#111a16' : '#0c0d0e', got ? '#3a6a52' : '#25282b', 2);
      g.fillStyle = got ? '#ffd84a' : '#444'; g.font = 'bold 11px Arial'; g.fillText(d.k, x + 14, y + 22);
      g.fillStyle = got ? '#e8e8e8' : '#555'; g.font = '17px Georgia'; g.fillText(got ? d.t : '— pas encore trouvé —', x + 14, y + 48);
      if (got) buttons.push({ x, y, w: 350, h: 70, fn: () => { doc = d; scene = 'doc'; sceneT = 0; } }); });
    button('RETOUR', 80, H - 70, 200, 50, () => { scene = 'title'; });
  }
  function drawDoc() {
    g.fillStyle = '#050607'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H / 2); g.rotate(-.012); form(g, [-430, -300, 430, -306, 436, 300, -432, 296], doc.k === 'JOURNAL' ? '#d8d0b8' : '#cfc8b4', { path: (gg, p) => wobPath(gg, p), aw: 30, ao: .45, hi: .1 }); g.restore();
    g.fillStyle = '#5a2a20'; g.font = 'bold 13px Arial'; g.fillText(doc.k, W / 2 - 390, 112);
    g.fillStyle = '#1a1a1a'; g.font = 'bold 26px Georgia'; g.fillText(doc.t, W / 2 - 390, 150);
    g.font = '19px Georgia'; let y = 196; for (const para of doc.x.split('\n')) { if (!para) { y += 14; continue; } const words = para.split(' '); let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > (doc.k === 'CASSETTE' ? 520 : 780)) { g.fillText(line, W / 2 - 390, y); y += 28; line = w; } else line = t; } g.fillText(line, W / 2 - 390, y); y += 28; }
    if (doc.k === 'CASSETTE') { rrect(g, W / 2 + 150, 92, 200, 120, 8, '#1a1a1c', '#555', 3); for (const cx of [W / 2 + 205, W / 2 + 295]) { ell(g, cx, 140, 22, 22, '#d8d0b8'); g.save(); g.translate(cx, 140); g.rotate(speechSynthesis.speaking ? T * 4 : 0); g.fillStyle = '#1a1a1c'; for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.fillRect(-2, 8, 4, 10); } g.restore(); } rrect(g, W / 2 + 170, 176, 160, 24, 3, '#c8a050');
      rrect(g, W / 2 + 150, 222, 200, 40, 6, '#2a2420', '#5a4a3a', 2); g.fillStyle = '#f0e6d0'; g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText(speechSynthesis.speaking ? '■ ARRÊTER' : '▶ ÉCOUTER', W / 2 + 250, 248); g.textAlign = 'left';
      buttons.push({ x: W / 2 + 150, y: 222, w: 200, h: 40, fn: () => { if (speechSynthesis.speaking) return A.hush(); A.hush(); doc.x.split('\n').filter(Boolean).forEach(l => A.say(l.replace(/[«»]/g, ''), { rate: .85, pitch: doc.id === 'f6' ? .7 : .45, alt: doc.id !== 'f6' })); } }); }
    post(g, T, .08, .7);
    g.fillStyle = '#888'; g.font = '14px Arial'; g.textAlign = 'center'; g.fillText('[ cliquer pour revenir ]', W / 2, H - 30); g.textAlign = 'left';
  }
  function drawJump() {
    const t = sceneT;
    if (t < 1.4) {
      // le saut au visage : il fonce sur toi, l'image tremble, rougit, se déchire
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const s = 2.2 + t * 1.6 + Math.sin(t * 50) * .05, sx = Math.sin(t * 70) * 18, sy = Math.cos(t * 55) * 14;
      if (!save.opts.calm && (S.why === 'empty' || S.why === 'ram')) { prepJaws(); const lunge = Math.min(1, t / .22), J = JAWS[Math.min(3, Math.max(0, (t - .22) / .12 | 0))], k = (s * (.35 + .65 * lunge)) / 3.4, jx = (1 - lunge) * (S.side === 'R' ? 420 : -420) + (R(9) === 0 ? R(60) - 30 : 0);
        g.save(); g.translate(W / 2 + sx + jx, H / 2 + 40 + sy); g.rotate(Math.sin(t * 37) * .06 + (1 - lunge) * (S.side === 'R' ? .4 : -.4)); g.drawImage(J, -450 * k, -500 * k, 900 * k, 1100 * k); for (const ex of [-30, 28]) { glow(g, ex * 3.4 * k, -22 * 3.4 * k, 120 * k, '110,240,255', .9); glow(g, ex * 3.4 * k, -22 * 3.4 * k, 20 * k, '240,255,255', 1); } g.restore(); }
      g.fillStyle = save.opts.calm ? 'rgba(60,0,0,.5)' : `rgba(255,20,10,${.15 + .15 * Math.sin(t * 40)})`; g.fillRect(0, 0, W, H);
      if (!save.opts.calm) for (let i = 0; i < 6; i++) { const y = R(H); g.drawImage(cv, 0, y, W, 20, R(60) - 30, y, W, 20); }
      post(g, T, .25, .7);
    } else {
      // la statique, puis l'écran de fin
      g.drawImage(NOISE[(T * 30 | 0) % 4], 0, 0, W, H); g.fillStyle = `rgba(0,0,0,${Math.min(.85, (t - 1.4) * .9)})`; g.fillRect(0, 0, W, H);
      if (t > 2.2) { g.fillStyle = '#ff5a4a'; g.textAlign = 'center'; g.font = '56px Impact, "Arial Black", sans-serif'; g.fillText(S.why === 'empty' ? 'LA PILE EST VIDE' : 'IL EST ENTRÉ', W / 2, H / 2 - 40);
        g.font = '22px Georgia'; g.fillStyle = '#ccc'; g.fillText(S.why === 'empty' ? 'Ta RAM travaille désormais pour ClosedRAM.' : 'Ram Altman a toute ta RAM. Il sourit.', W / 2, H / 2 + 6); g.textAlign = 'left';
        button('RÉESSAYER', W / 2 - 220, H / 2 + 60, 220, 50, () => start(S.n, S.n === 7 ? save.custom : null)); button('MENU', W / 2 + 60, H / 2 + 60, 160, 50, () => { scene = 'title'; }); }
    }
  }
  function start(n, ai) { A.unlock(); newNight(n, ai); }

  // ---------- la boucle ----------
  let last = performance.now();
  function frame() {
    const now = performance.now();  // pas l'horodatage de requestAnimationFrame : il n'a pas toujours la même origine que performance.now()
    const dt = Math.max(0, Math.min(.1, (now - last) / 1000)) * speed; last = now;  // la première image de requestAnimationFrame peut dater d'avant « last »
    buttons = []; sceneT += dt;
    if (!view.isConnected) return;
    if (scene === 'play') { tick(dt); if (scene === 'play') { S.pan = Math.max(0, Math.min(OW - W, S.pan + panDir() * 900 * save.opts.pan * dt)); if (S.ca > .5) drawCam(); else drawOffice(); if (S.ca > .02 && S.ca < .98) { g.fillStyle = `rgba(0,0,0,${1 - Math.abs(S.ca - .5) * 2})`; g.fillRect(0, 0, W, H); } post(g, T, S.ca > .5 ? .05 : .09, S.ca > .5 ? .5 : .75); if (S.hall > 0 && JAWS) { const J = JAWS[R(4)], k = 1.1 + Math.random() * .3; g.save(); g.globalAlpha = .85; g.drawImage(J, W / 2 - 450 * k / 1.6 + R(40) - 20, H / 2 - 520 * k / 1.6, 900 * k / 1.6, 1100 * k / 1.6); g.restore(); g.fillStyle = 'rgba(120,0,0,.3)'; g.fillRect(0, 0, W, H); for (let i = 0; i < 5; i++) { const y = R(H); g.drawImage(cv, 0, y, W, 24, R(80) - 40, y, W, 24); } } drawHud(); } }
    if (scene === 'title') { T += dt; drawTitle(); post(g, T, .12, .7); }
    else if (scene === 'intro') { T += dt; drawIntro(); }
    else if (scene === 'help') { T += dt; drawHelp(); }
    else if (scene === 'custom') { T += dt; drawCustom(); }
    else if (scene === 'card') { T += dt; drawCard(); }
    else if (scene === 'six') { T += dt; drawSix(); }
    else if (scene === 'archives') { T += dt; drawArchives(); }
    else if (scene === 'doc') { T += dt; drawDoc(); }
    else if (scene === 'settings') { T += dt; drawSettings(); }
    else if (scene === 'leo') { T += dt; leoTick(dt); drawLeo(); }
    else if (scene === 'jump') { T += dt; drawJump(); }
    requestAnimationFrame(frame);
  }
  const keysDown = new Set();
  const panDir = () => { if (S.cam) return 0; let d = keysDown.has('ArrowLeft') ? -1 : keysDown.has('ArrowRight') ? 1 : 0; if (!d && mouse.inside) { if (mouse.x < W * .2) d = -(1 - mouse.x / (W * .2)); else if (mouse.x > W * .8) d = (mouse.x - W * .8) / (W * .2); } return d; };
  requestAnimationFrame(frame);

  // ---------- les commandes ----------
  const toCanvas = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  const repair = w => { if (!faults().includes(w) || S.fix || S.out || S.ramPos === 'in') return A.deny(); S.fix = { w, t: 4 }; A.reboot(); };
  const reboot = () => repair('cams');
  const toggleCam = () => { if (S.out) return A.deny(); S.cam = !S.cam; if (S.cam) { S.lightL = S.lightR = false; A.camUp(); } else { A.camSwitch(); if (S.ramPos === 'in') return die('ram'); if (S.ger) { S.ger = null; S.camHold = 0; S.gerSeen = 1.4; A.glitch(); flash('Gérard repart dans le noir…', '#9ad8b4'); } } };
  const act = {
    doorL: () => { if (S.out || S.ramPos === 'in') return A.deny(); S.doorL = !S.doorL; A.door(S.doorL); }, doorR: () => { if (S.out || S.ramPos === 'in') return A.deny(); S.doorR = !S.doorR; A.door(S.doorR); },
    lightL: () => { if (S.out || S.cam || S.ramPos === 'in') return A.deny(); S.lightL = !S.lightL; S.lightR = false; A.light(S.lightL); }, lightR: () => { if (S.out || S.cam || S.ramPos === 'in') return A.deny(); S.lightR = !S.lightR; S.lightL = false; A.light(S.lightR); },
    vent: () => { if (S.out || S.ramPos === 'in' || S.fault.vent) return A.deny(); S.vent = !S.vent; A.vent(S.vent); },
  };
  cv.addEventListener('pointermove', e => {
    Object.assign(mouse, toCanvas(e), { inside: true });
    if (scene !== 'play') return;
    const bar = mouse.x > W / 2 - 300 && mouse.x < W / 2 + 300 && mouse.y > H - 50;
    if (bar && !hoverBar) toggleCam();  // comme dans le genre : passer sur la barre lève ou baisse la tablette
    hoverBar = bar;
  });
  cv.addEventListener('pointerleave', () => { mouse.inside = false; });
  cv.addEventListener('pointerdown', e => {
    A.unlock(); cv.focus(); Object.assign(mouse, toCanvas(e)); const { x, y } = mouse;
    for (const b of buttons) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { A.click(); return b.fn(); }
    if (scene === 'intro') return sceneT > 2 ? start(1) : (sceneT = 99);
    if (scene === 'help') { scene = 'title'; return; }
    if (scene === 'doc') { A.hush(); scene = 'archives'; return; }
    if (scene === 'six' && sceneT > 3) { if (S.n === 7) scene = 'title'; else start(Math.min(S.n + 1, 6)); return; }
    if (scene === 'leo') { if (L7.end) return; for (const [id, [mx, my]] of Object.entries({ ...MAP, ...MAP_DOORS })) if (x > MAPX + mx && x < MAPX + mx + 60 && y > MAPY + my && y < MAPY + my + 28) return leoMove(id); return; }
    if (scene !== 'play') return;
    if (S.call && x > W - 300 && x < W - 180 && y > H - 202 && y < H - 176) { S.call = null; A.hush(); return; }
    if (S.cam) { if (x > MAPX - 10 && x < MAPX + 320 && y > MAPY - 58 && y < MAPY - 18) return lure(); if (pickFrag(x, y)) return; for (const [id, [mx, my]] of Object.entries(MAP)) if (x > MAPX + mx && x < MAPX + mx + 60 && y > MAPY + my && y < MAPY + my + 28) { S.sel = id; S.switchT = .22; A.camSwitch(); } return; }
    if (x + S.pan > 560 && x + S.pan < 800 && y > 410 && y < 570) { const fl = faults(), i = Math.floor((y - 484) / 22); return fl[i] ? repair(fl[i]) : fl.length ? repair(fl[0]) : A.deny(); }
    const ox = x + S.pan;
    for (const side of ['L', 'R']) { const [px, y1, y2] = PANELS[side]; if (Math.hypot(ox - px, y - y1) < 26) return act['door' + side](); if (Math.hypot(ox - px, y - y2) < 26) return act['light' + side](); }
    if (ox > 880 && ox < 990 && y > 600 && y < 656) return act.vent();
  });
  document.addEventListener('keydown', e => {
    if (!view.isConnected) return; keysDown.add(e.key); const k = e.key.toLowerCase();
    if (scene === 'title') { const m = MENU(); if (k === 'arrowdown') menuSel = (menuSel + 1) % m.length; if (k === 'arrowup') menuSel = (menuSel + m.length - 1) % m.length; if (k === 'enter') { A.unlock(); m[menuSel][1](); } return; }
    if (scene === 'leo' && !L7.end) { if (/^[1-8]$/.test(k)) leoMove(k); else if (k === 'g') leoMove('L'); else if (k === 'h') leoMove('R'); else if (k === 'enter') leoMove('in'); else if (k === 'escape') { A.ambience(false); scene = 'title'; } return; }
    if (scene !== 'play') { if (k === 'enter' || k === ' ') cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: -9999, clientY: -9999 })); if (k === 'escape') { A.hush(); A.ambience(false); keep(); scene = 'title'; } return; }
    if (k === ' ') { e.preventDefault(); toggleCam(); }
    else if (k === 'q') act.doorL(); else if (k === 'd') act.doorR(); else if (k === 'a') act.lightL(); else if (k === 'e') act.lightR(); else if (k === 'v') act.vent();
    else if (k === 'c' && S.call) { S.call = null; A.hush(); }
    else if (k === 'l') lure(); else if (k === 'r') reboot(); else if (k === 't') repair('vent'); else if (k === 'p') repair('leak');
    else if (/^[1-8]$/.test(k) && S.cam) { S.sel = k; S.switchT = .22; A.camSwitch(); }
    else if (k === 'escape') { A.hush(); A.ambience(false); scene = 'title'; }
  });
  document.addEventListener('keyup', e => keysDown.delete(e.key));
  cv.focus();

  // l'état lisible par un lecteur d'écran, mis à jour deux fois par seconde
  setInterval(() => { if (scene === 'play') cv.setAttribute('aria-label', `Nuit ${S.n}, ${HOUR[Math.min(6, Math.floor(S.time / S.hourLen))]}, courant ${Math.max(0, S.power | 0)} %, RAM ${S.ram} Go${S.doorL ? ', porte gauche fermée' : ''}${S.doorR ? ', porte droite fermée' : ''}${S.vent ? ', trappe fermée' : ''}${S.cam ? ', caméra ' + S.sel : ''}.`); else if (scene === 'leo') cv.setAttribute('aria-label', `Nuit 7, tu es Léo, ${/[LR]/.test(L7.pos) ? 'porte ' + (L7.pos === 'L' ? 'gauche ' : 'droite ') + (L7.door[L7.pos] ? 'fermée' : 'ouverte') : 'caméra ' + L7.pos}, le veilleur regarde ${/[LR]/.test(L7.eye) ? 'une porte' : 'la caméra ' + L7.eye}, soupçon ${Math.round(L7.sus * 100)} %.`); else cv.setAttribute('aria-label', 'Ram Altman : ' + scene); }, 500);
  // vérification interne : chaque chemin de Ram mène à une porte, chaque nuit a ses réglages
  const bad = [];
  for (const from of Object.keys(RAM_NEXT)) { const seen = new Set(), q = [from]; while (q.length) { const p = q.shift(); if (seen.has(p)) continue; seen.add(p); (RAM_NEXT[p] || []).forEach(n => q.push(n)); } if (!seen.has('L') && !seen.has('R')) bad.push('pas de chemin vers une porte depuis ' + from); }
  for (let n = 1; n <= 6; n++) if (!NIGHTS[n] || !CALLS[n]) bad.push('nuit ' + n + ' incomplète');
  for (const [id] of Object.entries(MAP)) if (!rooms[id]) bad.push('caméra ' + id + ' sans pièce');
  for (const id of LEO_ROOMS) if (!ADJ[id] || !(rooms[id] || MAP_DOORS[id])) bad.push('nuit 7 : pièce ' + id);
  for (const id of Object.keys(DIST)) if (PAN[id] === undefined) bad.push('son : pièce ' + id);
  view.dataset.selfcheck = bad.join(' | ') || 'ok';
  // pour le test automatique de NeoDex : l'état, et la nuit qu'on peut faire défiler vite
  cv.__ra = { get S() { return S; }, get scene() { return scene; }, get sceneT() { return sceneT; }, set scene(v) { scene = v; sceneT = 0; }, openDoc: id => { doc = DOCS().find(d => d.id === id); scene = "doc"; sceneT = 0; }, save, start, set speed(v) { speed = v; }, act, toggleCam, lure, reboot, repair, pickFrag, startLeo, leoMove, get L7() { return L7; }, tick: dt => tick(dt), sel: id => { S.sel = String(id); } };
}
