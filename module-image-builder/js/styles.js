// Stylised module image styles, based on the four directions in the
// Module Thumbnail Design Specification (Oct 2026).
// Every style is drawn proportionally, so it works at any canvas size.

import { mix, lighten, darken, rgba, drawTintedIcon } from './utils.js';
import { drawCalendarText } from './renderer.js';

const NEUTRAL_BG = '#EFECE6';
const NEUTRAL_PANEL = '#E3E3DC';
const NEUTRAL_LINE = '#B8BDB7';
const WARM_BG = '#EEE8DF';

/**
 * opts: {
 *   style, colour: {hex, pair}, badge (% of width), iconScale (% of badge),
 *   mirror (bool), iconImage, calendar: {header, main} | null
 * }
 */
export function drawStylised(ctx, opts) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const base = opts.colour.hex;
  const pair = opts.colour.pair || lighten(base, .3);
  const D = w * (opts.badge / 100);            // badge diameter
  const fns = { geometric, editorial, gradient, structured };
  const fn = fns[opts.style] || geometric;

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  // Draw the background mirrored if asked. The function returns where the
  // badge centre is (in un-mirrored coordinates) and how the icon is coloured.
  if (opts.mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  const spot = fn(ctx, w, h, base, pair, D);
  ctx.restore();

  const cx = opts.mirror ? w - spot.cx : spot.cx;
  drawBadgeIcon(ctx, opts, cx, spot.cy, D, spot.iconColour);
}

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill; ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  ctx.fill();
}
function line(ctx, x1, y1, x2, y2, colour, width) {
  ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

// 01 Layered geometric — dark colour field, restrained circles, diagonal line,
// white disc with a coloured icon.
function geometric(ctx, w, h, base, pair, D) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  circle(ctx, w * .76, h * .07, w * .385, mix(base, lighten(pair, .35), .42));
  circle(ctx, w * .95, h * 1.0, w * .43, mix(base, lighten(pair, .15), .2));
  line(ctx, 0, h * .8, w, h * .335, 'rgba(255,255,255,.22)', w * .0067);
  const cx = w * .5, cy = h * .5, r = D / 2;
  circle(ctx, cx, cy, r * 1.26, 'rgba(255,255,255,.15)');
  circle(ctx, cx, cy, r, '#ffffff');
  return { cx, cy, iconColour: base };
}

// 02 Editorial minimalist — pale neutral surface, offset panel, coloured disc.
function editorial(ctx, w, h, base, pair, D) {
  ctx.fillStyle = NEUTRAL_BG; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = NEUTRAL_PANEL; ctx.fillRect(w * .655, 0, w * .345, h);
  circle(ctx, w * .94, h * .93, w * .44, rgba(mix(base, '#ffffff', .78), .7));
  line(ctx, w * .72, 0, w * .72, h, NEUTRAL_LINE, w * .0067);
  const cx = w * .45, cy = h * .5;
  circle(ctx, cx, cy, D / 2, base);
  return { cx, cy, iconColour: '#ffffff' };
}

// 03 Soft gradient — two related colours blended, translucent circles,
// white line icon on a frosted disc.
function gradient(ctx, w, h, base, pair, D) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, base);
  g.addColorStop(.55, mix(base, pair, .55));
  g.addColorStop(1, lighten(pair, .35));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  circle(ctx, w * .08, h * .08, w * .47, 'rgba(255,255,255,.08)');
  circle(ctx, w * .98, h * .95, w * .48, 'rgba(255,255,255,.16)');
  const cx = w * .5, cy = h * .5;
  circle(ctx, cx, cy, D / 2, 'rgba(255,255,255,.2)');
  return { cx, cy, iconColour: '#ffffff' };
}

// 04 Structured graphic — vertical colour band, fine diagonals, framed inset panel.
function structured(ctx, w, h, base, pair, D) {
  ctx.fillStyle = WARM_BG; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w * .275, h);
  line(ctx, w * .16, 0, w * 1.2, h * 1.04, '#BFC4BB', w * .0067);
  line(ctx, w * .35, 0, w * 1.2, h * .85, '#BFC4BB', w * .0067);
  const pw = D * 1.65, ph = D * 1.55;
  const cx = Math.min(w * .618, w * .965 - pw / 2), cy = h * .5;
  roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, D * .07, '#ffffff');
  const inset = D * .13;
  roundRect(ctx, cx - pw / 2 + inset, cy - ph / 2 + inset, pw - inset * 2, ph - inset * 2, D * .04, mix(base, '#ffffff', .88));
  circle(ctx, cx, cy, D / 2, base);
  return { cx, cy, iconColour: '#ffffff' };
}

function drawBadgeIcon(ctx, opts, cx, cy, D, colour) {
  const box = D * (opts.iconScale / 100);
  if (!opts.iconImage) {
    ctx.save();
    ctx.fillStyle = colour; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(D * .085)}px Arial`;
    ctx.fillText('Upload an', cx, cy - D * .06);
    ctx.fillText('SVG icon', cx, cy + D * .06);
    ctx.restore();
    return;
  }
  drawTintedIcon(ctx, opts.iconImage, cx, cy, box, colour);
  if (opts.calendar) {
    drawCalendarText(ctx, opts.calendar.header, opts.calendar.main, cx - box / 2, cy - box / 2, box, colour);
  }
}
