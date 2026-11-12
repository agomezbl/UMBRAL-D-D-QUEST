/* Piezas de ejemplo y de uso general (sirven de modelo para escribir las demás) */
(() => {
  const WOOD = '#6a4526', WOOD_D = '#4a2f1a', IRON = '#3a3632';
  DECO.add('barril', { slot: 'corner', tags: ['bodega', 'guardia', 'comedor'] }, (b) => {
    const x = 0.3, z = 0.3;
    b.lathe([[0.2, 0], [0.25, 0.16], [0.265, 0.32], [0.25, 0.48], [0.2, 0.64], [0, 0.64]], 12, b.vary(WOOD), [x, 0, z]);
    [0.13, 0.5].forEach((y) => b.tor(0.245, 0.016, IRON, [x, y, z], [Math.PI / 2, 0, 0], 'x'));
    b.cyl(0.19, 0.19, 0.012, 12, WOOD_D, [x, 0.645, z]);
  });
  DECO.add('velas_suelo', { slot: 'corner', tags: ['capilla', 'osario', 'archivo'] }, (b, rnd) => {
    for (let k = 0; k < 4; k++) b.candle(0.14 + rnd() * 0.3, 0, 0.14 + rnd() * 0.3, 0.12 + rnd() * 0.22);
    b.cyl(0.2, 0.22, 0.02, 10, '#d8cbb0', [0.28, 0.01, 0.28], null, 'm', { ao: 0 });
    b.light(0.3, 0.4, 0.3, '#ffb35a', 0.7, 3.2);
  });
})();
