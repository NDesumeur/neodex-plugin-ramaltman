// lancé par le test « local » de NeoDex : vérification interne, une nuit jouée en accéléré portes fermées, le redémarrage et le leurre, puis Ram qui entre par une porte ouverte
module.exports = async ({ pj, sleep }) => {
  const ra = e => pj(`(() => { const r = document.querySelector('canvas').__ra; return ${e}; })()`);
  const sc = await pj(`document.querySelector('[data-selfcheck]')?.dataset.selfcheck`); if (sc !== 'ok') throw new Error('vérification interne : ' + sc);
  // nuit 1 : on passe l'écran du titre de la nuit, on ferme tout, on fait défiler six heures
  await ra(`(r.start(1), r.speed = 40, 0)`);
  for (let i = 0; i < 50 && await ra('r.scene') !== 'play'; i++) await sleep(100);
  await ra(`(r.speed = 1, r.S.call = null, r.act.doorL(), r.act.doorR(), r.act.vent(), r.toggleCam(), r.sel(5), 0)`);
  await sleep(400);
  const label = await pj(`document.querySelector('canvas').getAttribute('aria-label')`);
  if (!/porte gauche fermée.*porte droite fermée.*trappe fermée.*caméra 5/.test(label)) throw new Error('commandes : « ' + label + ' »');
  await ra(`(r.toggleCam(), r.S.power = 1e6, (() => { for (let i = 0; i < 400 && r.scene === 'play'; i++) r.tick(1); })(), 0)`);
  if (await ra('r.scene') !== 'six') throw new Error('6 h pas atteintes : ' + await ra('r.scene + " " + r.S.time + " RAM " + r.S.ram'));
  if (await ra('r.save.night') < 2) throw new Error('nuit 2 pas débloquée');
  if (!await ra("r.save.docs.includes('j1')")) throw new Error('le journal de la nuit 1 manque aux archives');
  // nuit 3 : Ram arrive à la porte gauche ouverte, il doit entrer
  await ra(`(r.start(3), r.speed = 40, 0)`);
  for (let i = 0; i < 50 && await ra('r.scene') !== 'play'; i++) await sleep(100);
  // caméras piratées puis redémarrées depuis le moniteur ; le leurre attire Ram de la caméra 4 à la 3 (8 fois sur 10)
  const ok = await ra(`(r.speed = 1, r.S.call = null, r.S.ramT = -99, r.S.hacked = true, r.reboot(), r.tick(2), r.tick(2.1), r.toggleCam(), r.sel(3), (() => { let h = r.S.hacked; for (let k = 0; k < 10 && r.S.ramPos !== '3'; k++) { r.S.ramPos = '4'; r.S.ramT = -99; r.S.lureCd = 0; r.lure(); r.S.lure.t = .01; r.tick(.05); } return [h, r.S.ramPos]; })())`);
  if (ok[0] || ok[1] !== '3') throw new Error('redémarrage ou leurre : ' + JSON.stringify(ok));
  await ra(`(r.S.ramPos = 'L', r.S.doorWait = .2, 0)`);
  await sleep(800);
  if (await ra('r.S.ramPos') !== 'in') throw new Error('Ram devait entrer dans le bureau : ' + await ra('r.S.ramPos'));
  await ra('(r.toggleCam(), 0)');  // baisser la tablette : il attaque
  await sleep(300);
  if (await ra('r.scene') !== 'jump') throw new Error('Ram devait entrer : ' + await ra('r.scene'));
  // nuit 4 : Gérard entre si on reste dans les caméras, et repart quand on baisse la tablette ; une panne de trappe se répare au moniteur
  await ra(`(r.start(4), r.speed = 40, 0)`);
  for (let i = 0; i < 50 && await ra('r.scene') !== 'play'; i++) await sleep(100);
  const gf = await ra(`(r.speed = 1, r.S.call = null, r.S.ramT = -99, r.S.leoT = 1e9, r.toggleCam(), r.S.camHold = 99, r.tick(.05), (() => { const came = !!r.S.ger; r.toggleCam(); const gone = !r.S.ger && r.S.gerSeen > 0; r.S.fault.vent = true; r.act.vent(); const stuck = !r.S.vent; r.repair('vent'); r.tick(2); r.tick(2.1); return [came, gone, stuck, !r.S.fault.vent]; })())`);
  if (gf.includes(false)) throw new Error('Gérard ou panne : ' + JSON.stringify(gf));
  // nuit 7 cachée : Léo à la porte gauche ouverte entre et gagne
  const lw = await ra(`(r.startLeo(), Object.assign(r.L7, { pos: 'L' }), r.L7.door.L = false, r.leoMove('in'), [r.L7.won, r.save.docs.includes('epi')])`);
  if (lw.includes(false)) throw new Error('nuit de Léo : ' + JSON.stringify(lw));
  await ra(`(r.scene = 'title', 0)`);
  return 'nuit 1 tenue jusqu\'à 6 h portes fermées, nuit 2 débloquée, Ram entre par une porte ouverte et attaque quand on baisse la tablette, journal aux archives, redémarrage des caméras et leurre audio, Gérard chassé, trappe réparée, nuit de Léo gagnée';
};
