/* Fish Fish: small, cheerful canvas illustrations. */
(function () {
  'use strict';

  const species = [
    { id: 0, name: 'Tangerine', color: '#ff9853', points: 10, rarity: 'common' },
    { id: 1, name: 'Bubblegum', color: '#f18fae', points: 15, rarity: 'common' },
    { id: 2, name: 'Blueberry', color: '#56c9c0', points: 20, rarity: 'common' },
    { id: 3, name: 'Stripey', color: '#6595ed', points: 25, rarity: 'uncommon' },
    { id: 4, name: 'Puffin', color: '#b4a2e5', points: 40, rarity: 'rare' },
    { id: 5, name: 'Sunbeam', color: '#ffc955', points: 75, rarity: 'legendary' }
  ];

  const TAU = Math.PI * 2;
  function path(ctx, draw, fill, stroke, width) {
    ctx.beginPath();
    draw(ctx);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1.6; ctx.stroke(); }
  }
  function ellipse(ctx, x, y, rx, ry, fill, stroke, width, rotation) {
    path(ctx, c => c.ellipse(x, y, rx, ry, rotation || 0, 0, TAU), fill, stroke, width);
  }
  function line(ctx, points, color, width) {
    path(ctx, c => {
      c.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(p => c.lineTo(p[0], p[1]));
    }, null, color, width);
  }
  function sparkle(ctx, x, y, size, color) {
    path(ctx, c => {
      c.moveTo(x, y - size);
      c.quadraticCurveTo(x + size * .2, y - size * .2, x + size, y);
      c.quadraticCurveTo(x + size * .2, y + size * .2, x, y + size);
      c.quadraticCurveTo(x - size * .2, y + size * .2, x - size, y);
      c.quadraticCurveTo(x - size * .2, y - size * .2, x, y - size);
    }, color);
  }

  function drawFish(ctx, type, x, y, size, direction, time, opts) {
    const id = typeof type === 'object' ? type.id : Number(type) || 0;
    const fish = species[((id % species.length) + species.length) % species.length];
    const kind = fish.id;
    const t = time || 0;
    const options = opts || {};
    const outline = ['#b75c35', '#ba607f', '#2a9297', '#3869a8', '#8774b5', '#ca8e30'][kind];
    const finColor = ['#f37549', '#db72a4', '#369eaa', '#f9ce52', '#9184c6', '#eeaa35'][kind];
    const isPuffer = kind === 4;
    const ry = isPuffer ? 29 : kind === 3 ? 25 : 22;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((size || 65) / 70 * (direction === -1 ? -1 : 1), (size || 65) / 70);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (options.alpha != null) ctx.globalAlpha *= options.alpha;

    if (kind === 5 || options.glow) {
      const glow = ctx.createRadialGradient(0, 0, 12, 0, 0, 63);
      glow.addColorStop(0, 'rgba(255,224,128,.30)');
      glow.addColorStop(1, 'rgba(255,224,128,0)');
      ellipse(ctx, 0, 0, 65, 56, glow);
    }
    // A little tail flick makes even the smallest fish feel alive.
    const tailY = Math.sin(t * 5 + kind) * 2.4;
    path(ctx, c => {
      c.moveTo(-25, -9);
      c.bezierCurveTo(-39, -13, -48, -24 + tailY, -54, -22 + tailY);
      c.quadraticCurveTo(-50, -7 + tailY, -54, 0 + tailY);
      c.quadraticCurveTo(-51, 9 + tailY, -54, 22 + tailY);
      c.bezierCurveTo(-45, 22 + tailY, -37, 11, -25, 9);
      c.closePath();
    }, finColor, outline, 1.8);
    line(ctx, [[-49, -13 + tailY], [-32, -4]], 'rgba(255,255,255,.36)', 1.8);
    line(ctx, [[-49, 12 + tailY], [-32, 4]], 'rgba(255,255,255,.27)', 1.6);

    if (isPuffer) {
      // Soft rounded spikes: this puffer is cuddly, never prickly.
      for (let i = 0; i < 12; i++) {
        const angle = i / 12 * TAU;
        if (Math.cos(angle) > .55) continue;
        const bx = Math.cos(angle) * 29;
        const by = Math.sin(angle) * 25;
        path(ctx, c => {
          c.moveTo(bx + Math.sin(angle) * 4, by - Math.cos(angle) * 4);
          c.quadraticCurveTo(Math.cos(angle) * 42, Math.sin(angle) * 38,
            bx - Math.sin(angle) * 4, by + Math.cos(angle) * 4);
          c.closePath();
        }, '#a494d4', outline, 1.2);
      }
    } else {
      path(ctx, c => {
        c.moveTo(-20, -15);
        c.quadraticCurveTo(-18, -34, -10, -31);
        c.quadraticCurveTo(-4, -36, 2, -29);
        c.quadraticCurveTo(11, -32, 17, -17);
        c.closePath();
      }, finColor, outline, 1.5);
      line(ctx, [[-10, -28], [-7, -19]], 'rgba(255,255,255,.35)', 1.3);
      path(ctx, c => {
        c.moveTo(-12, 17);
        c.quadraticCurveTo(-5, 35, 9, 28);
        c.lineTo(18, 15);
        c.closePath();
      }, finColor, outline, 1.4);
    }

    const body = ctx.createLinearGradient(-15, -ry, 8, ry);
    body.addColorStop(0, ['#ffb26c', '#ffa6be', '#75dfce', '#77acf9', '#c5b4ef', '#ffdf76'][kind]);
    body.addColorStop(.55, fish.color);
    body.addColorStop(1, ['#fb8c4c', '#e884aa', '#50b9b6', '#5585d5', '#a99ada', '#f9bb47'][kind]);
    ellipse(ctx, 0, 0, isPuffer ? 31 : 34, ry, body, outline, 1.9);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, isPuffer ? 30 : 33, ry - 1, 0, 0, TAU);
    ctx.clip();
    if (kind === 0) {
      // Wide cream bands with a soft orange border, like a tiny clownfish.
      [-21, -3].forEach((band, index) => {
        path(ctx, c => {
          c.moveTo(band - 3, -25);
          c.quadraticCurveTo(band + 4, 0, band - 2, 25);
          c.lineTo(band + 7 + index, 25);
          c.quadraticCurveTo(band + 13, 0, band + 7, -25);
          c.closePath();
        }, '#fff6d9', '#df7b4b', 1.1);
      });
    } else if (kind === 1) {
      const spots = [[-21, -7, 4], [-10, -13, 3], [-17, 7, 3], [-4, 11, 2.5], [2, -17, 2.5]];
      spots.forEach(p => ellipse(ctx, p[0], p[1], p[2], p[2], '#ffd5dc'));
      ellipse(ctx, 0, 16, 26, 8, 'rgba(255,223,229,.45)');
    } else if (kind === 2) {
      [-22, -8, 6].forEach((band, i) => {
        path(ctx, c => {
          c.moveTo(band - 3, -25);
          c.quadraticCurveTo(band + 3, -10, band - 6, 8);
          c.lineTo(band - 1, 15 - i * 3);
          c.quadraticCurveTo(band + 12, -5, band + 5, -25);
          c.closePath();
        }, '#2998a5');
      });
      ellipse(ctx, 0, 19, 27, 6, 'rgba(202,247,224,.6)');
    } else if (kind === 3) {
      path(ctx, c => {
        c.moveTo(-34, -5);
        c.bezierCurveTo(-14, -15, -6, -13, 4, -20);
        c.bezierCurveTo(12, -25, 19, -27, 28, -16);
        c.lineTo(18, -10);
        c.bezierCurveTo(2, -5, -7, -4, -30, 4);
        c.closePath();
      }, '#345e9f');
      path(ctx, c => {
        c.moveTo(-34, 2);
        c.bezierCurveTo(-14, -8, -6, -6, 3, -13);
        c.bezierCurveTo(11, -18, 18, -20, 27, -13);
      }, null, '#ffe178', 3.6);
      ellipse(ctx, -7, 21, 27, 7, 'rgba(175,210,255,.32)');
    } else if (kind === 4) {
      ellipse(ctx, 4, 13, 28, 18, '#e0d2f4');
      [[-19,-8,2.7],[-8,-17,2.1],[4,-20,2.4],[-21,5,2],[-9,-2,2.7],[2,1,2],[-10,15,1.8],[-1,21,1.7]].forEach(p =>
        ellipse(ctx, p[0], p[1], p[2], p[2], '#9a84c5'));
    } else {
      ellipse(ctx, -8, 15, 29, 9, 'rgba(255,244,175,.54)');
      sparkle(ctx, -14, -5, 6, '#fff7c9');
      sparkle(ctx, 1, -13, 3.5, '#fff7c9');
      sparkle(ctx, -3, 10, 3, '#fff7c9');
    }
    // A satin highlight follows the body rather than looking like a shiny button.
    path(ctx, c => {
      c.moveTo(-21, -ry * .55);
      c.quadraticCurveTo(-10, -ry * .9, 2, -ry * .7);
    }, null, 'rgba(255,255,255,.27)', 3);
    ctx.restore();

    // Side fin is drawn over the markings.
    const flap = Math.sin(t * 7 + kind) * 2;
    path(ctx, c => {
      c.moveTo(-1, 4);
      c.quadraticCurveTo(-15, 1 + flap, -16, 14 + flap);
      c.quadraticCurveTo(-7, 18 + flap, 1, 6);
      c.closePath();
    }, finColor, outline, 1.2);
    line(ctx, [[-12, 12 + flap], [-3, 6]], 'rgba(255,255,255,.4)', 1.3);

    // Big curious eyes and a smile, with just a hint of rosy cheek.
    ellipse(ctx, 16, -6, 7.6, 9, '#fffdf3', outline, 1.1);
    ellipse(ctx, 18.7, -5.3, 3.6, 4.6, '#273c4a');
    ellipse(ctx, 19.7, -7.5, 1.4, 1.7, '#ffffff');
    ellipse(ctx, 24, 7.1, 4.2, 2.8, kind === 1 ? '#e87595' : 'rgba(242,132,115,.5)');
    path(ctx, c => {
      c.moveTo(25, 10.4);
      c.quadraticCurveTo(30, 14.5, 32.1, 8.5);
    }, null, outline, 1.6);
    if (kind === 5) {
      const pulse = .75 + Math.sin(t * 3) * .2;
      sparkle(ctx, -34, -33, 5 * pulse, '#fff2ac');
      sparkle(ctx, 23, -37, 4 * (1.5 - pulse), '#fff4bd');
      sparkle(ctx, -44, 30, 3.6, '#ffe6a0');
    }
    ctx.restore();
  }

  function drawBoat(ctx, x, y, scale, time) {
    const s = scale == null ? 1 : scale;
    const t = time || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Tiny stern pennant.
    line(ctx, [[-53, -4], [-53, -66]], '#665545', 2.6);
    path(ctx, c => {
      c.moveTo(-52, -64);
      c.quadraticCurveTo(-38, -67 + Math.sin(t * 2) * 2, -31, -60);
      c.lineTo(-36, -53);
      c.quadraticCurveTo(-43, -58 + Math.sin(t * 2) * 2, -52, -55);
      c.closePath();
    }, '#fff2d1', '#d5c595', 1.1);
    path(ctx, c => {
      c.moveTo(-44, -60); c.lineTo(-38, -58);
      c.moveTo(-43, -57); c.lineTo(-39, -60);
    }, null, '#e89b63', 1.4);

    // Hair, ears, and a little fisher in a sunny yellow bucket hat.
    ellipse(ctx, -13, -60, 13, 15, '#694632');
    ellipse(ctx, -26, -56, 4, 4.6, '#eeb08a');
    ellipse(ctx, 0, -56, 3.5, 4.5, '#eeb08a');
    ellipse(ctx, -12, -57, 12.8, 13.5, '#f4bf94', '#c48264', 1.2);
    path(ctx, c => {
      c.moveTo(-25, -65); c.quadraticCurveTo(-24, -78, -11, -79);
      c.quadraticCurveTo(2, -76, 2, -66); c.closePath();
    }, '#f4c54f', '#c69732', 1.4);
    path(ctx, c => {
      c.moveTo(-27, -66); c.quadraticCurveTo(-12, -70, 4, -64);
      c.quadraticCurveTo(6, -59, -9, -60);
      c.quadraticCurveTo(-27, -59, -29, -62); c.closePath();
    }, '#ffda67', '#c69732', 1.4);
    path(ctx, c => { c.moveTo(-23, -70); c.quadraticCurveTo(-11, -72, -1, -68); }, null, '#dba940', 3);
    ellipse(ctx, -15, -55, 1.5, 1.8, '#49423f');
    ellipse(ctx, -5, -54.5, 1.5, 1.8, '#49423f');
    ellipse(ctx, -20, -50.5, 3, 1.8, '#e9a186');
    path(ctx, c => { c.moveTo(-13, -48.5); c.quadraticCurveTo(-8, -45, -4, -49); }, null, '#a16552', 1.3);

    path(ctx, c => {
      c.moveTo(-22, -43); c.quadraticCurveTo(-12, -47, -3, -41);
      c.lineTo(6, -16); c.lineTo(-29, -16); c.closePath();
    }, '#fff5dc', '#607980', 1.3);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-22, -43); ctx.quadraticCurveTo(-12, -47, -3, -41);
    ctx.lineTo(6, -16); ctx.lineTo(-29, -16); ctx.closePath(); ctx.clip();
    [-36, -27, -18].forEach(yy => line(ctx, [[-31, yy], [7, yy]], '#477c8e', 4));
    ctx.restore();
    // Arm and fingers around the fishing rod.
    path(ctx, c => { c.moveTo(-2, -37); c.quadraticCurveTo(3, -27, 12, -39); }, null, '#ce8d6d', 8);
    path(ctx, c => { c.moveTo(-2, -38); c.quadraticCurveTo(4, -30, 12, -40); }, null, '#f4bf94', 5.8);
    // Endpoint is intentionally exact: (+58, -95), used by the game line.
    path(ctx, c => {
      c.moveTo(9, -28); c.lineTo(15, -45);
      c.quadraticCurveTo(39, -103, 58, -95);
    }, null, '#675549', 2.9);
    line(ctx, [[9, -29], [14, -42]], '#bb8054', 5);
    ellipse(ctx, 12, -39, 3.8, 4.5, '#f4bf94', '#ce8d6d', 1);
    ellipse(ctx, 58, -95, 1.7, 1.7, '#eee9d8');

    // Seat, rounded timber hull, rim, and painted planks.
    line(ctx, [[-44, -17], [42, -17]], '#8c5938', 6);
    path(ctx, c => {
      c.moveTo(-71, -14); c.quadraticCurveTo(-64, 14, -41, 20);
      c.quadraticCurveTo(4, 31, 43, 15);
      c.quadraticCurveTo(62, 6, 72, -16);
      c.quadraticCurveTo(1, -5, -71, -14); c.closePath();
    }, '#e98945', '#a86034', 2.2);
    path(ctx, c => {
      c.moveTo(-61, 3); c.quadraticCurveTo(0, 19, 58, 1);
    }, null, '#c76d3a', 1.8);
    path(ctx, c => {
      c.moveTo(-47, 16); c.quadraticCurveTo(0, 28, 42, 15);
    }, null, '#c76d3a', 1.7);
    [-37, -3, 32].forEach(xx => {
      line(ctx, [[xx, -5], [xx + 4, 17]], 'rgba(150,81,43,.28)', 1.1);
      ellipse(ctx, xx + 1, 2, 1.6, 1.6, '#f8bc78');
    });
    path(ctx, c => {
      c.moveTo(-71, -14); c.quadraticCurveTo(-2, -3, 72, -16);
    }, null, '#ffbe74', 6);
    path(ctx, c => {
      c.moveTo(-69, -17); c.quadraticCurveTo(-2, -6, 70, -19);
    }, null, '#a8693d', 1.5);
    // A small cream fish badge on the bow.
    ellipse(ctx, 40, 4, 8, 3.6, '#fff2ca', null, null, -.18);
    path(ctx, c => { c.moveTo(33, 3); c.lineTo(29, 0); c.lineTo(29, 8); c.closePath(); }, '#fff2ca');
    ellipse(ctx, 44, 3, .8, .8, '#a86a3d');
    ctx.restore();
  }

  function drawSeaweed(ctx, x, y, scale, time, color) {
    const s = scale == null ? 1 : scale;
    const t = time || 0;
    const ink = color || '#429c8e';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stems = [
      { ox: -13, h: 66, w: 11, phase: 0 },
      { ox: 1, h: 98, w: 13, phase: 1.3 },
      { ox: 16, h: 76, w: 10, phase: 2.5 }
    ];
    stems.forEach(stem => {
      const wave = Math.sin(t * .85 + stem.phase + x * .002) * 9;
      path(ctx, c => {
        c.moveTo(stem.ox - 4, 3);
        c.bezierCurveTo(stem.ox - 17, -stem.h * .35, stem.ox + 18 + wave, -stem.h * .65, stem.ox + wave, -stem.h);
        c.bezierCurveTo(stem.ox - 14 + wave, -stem.h * .67, stem.ox + 4, -stem.h * .34, stem.ox + 4, 3);
        c.closePath();
      }, ink);
      path(ctx, c => {
        c.moveTo(stem.ox, 0);
        c.bezierCurveTo(stem.ox - 7, -stem.h * .35, stem.ox + 9 + wave, -stem.h * .67, stem.ox + wave, -stem.h + 8);
      }, null, 'rgba(211,246,203,.20)', 1.6);
    });
    ctx.restore();
  }

  function drawCoral(ctx, x, y, scale, color) {
    const s = scale == null ? 1 : scale;
    const ink = color || '#e59b88';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const branches = [
      { p: [[0, 2], [-4,-28], [0,-54], [-7,-79]], w: 10 },
      { p: [[-3,-24], [-25,-39], [-30,-62]], w: 8 },
      { p: [[-22,-37], [-42,-38], [-47,-52]], w: 6 },
      { p: [[-27,-52], [-16,-66], [-18,-78]], w: 5.5 },
      { p: [[-1,-38], [20,-49], [26,-75]], w: 8 },
      { p: [[17,-48], [38,-47], [43,-61]], w: 6 },
      { p: [[22,-61], [13,-72], [16,-85]], w: 5 },
      { p: [[-2,-56], [7,-66], [6,-85]], w: 5.5 }
    ];
    branches.forEach(b => {
      path(ctx, c => {
        c.moveTo(b.p[0][0], b.p[0][1]);
        c.bezierCurveTo(b.p[1][0], b.p[1][1], b.p[2][0], b.p[2][1], b.p[3] ? b.p[3][0] : b.p[2][0], b.p[3] ? b.p[3][1] : b.p[2][1]);
      }, null, ink, b.w);
    });
    // A subtle stippled surface keeps the coral soft and storybook-like.
    [[-3,-16],[-3,-32],[0,-49],[-5,-67],[-24,-45],[-29,-58],[20,-55],[25,-69],[36,-49]].forEach(p => {
      ellipse(ctx, p[0] - 1.5, p[1], 1.2, 1.8, 'rgba(255,241,215,.30)');
    });
    ctx.restore();
  }

  window.FishArt = { species, drawFish, drawBoat, drawSeaweed, drawCoral };
})();
