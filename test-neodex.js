// lancé par le test « local » de NeoDex : vérification interne, une nuit jouée en accéléré portes fermées, puis Ram qui entre par une porte ouverte
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
  // nuit 3 : Ram arrive à la porte gauche ouverte, il doit entrer
  await ra(`(r.start(3), r.speed = 40, 0)`);
  for (let i = 0; i < 50 && await ra('r.scene') !== 'play'; i++) await sleep(100);
  await ra(`(r.speed = 1, r.S.call = null, r.toggleCam(), r.S.ramPos = 'L', r.S.doorWait = .2, 0)`);
  await sleep(800);
  if (await ra('r.S.ramPos') !== 'in') throw new Error('Ram devait entrer dans le bureau : ' + await ra('r.S.ramPos'));
  await ra('(r.toggleCam(), 0)');  // baisser la tablette : il attaque
  await sleep(300);
  if (await ra('r.scene') !== 'jump') throw new Error('Ram devait entrer : ' + await ra('r.scene'));
  return 'nuit 1 tenue jusqu\'à 6 h portes fermées, nuit 2 débloquée, Ram entre par une porte ouverte et attaque quand on baisse la tablette';
};
