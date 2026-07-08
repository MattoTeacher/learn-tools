import { lighten, darken, mix } from './utils.js';

export function drawTheme(ctx, themeId, base, w, h) {
  ctx.clearRect(0, 0, w, h);
  const light = lighten(base, .34);
  const lighter = lighten(base, .55);
  const dark = darken(base, .28);
  const accent = mix(base, '#D0006F', .32);
  const cool = mix(base, '#487A7B', .42);


  if (themeId === 'soft-flare') {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w*.20, h*.20, w*.04, w*.20, h*.20, w*.62);
    g.addColorStop(0, 'rgba(255,255,255,.34)');
    g.addColorStop(.42, 'rgba(255,255,255,.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath(); ctx.arc(w*.94, h*.94, w*.30, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.beginPath(); ctx.arc(w*.12, h*1.02, w*.38, 0, Math.PI*2); ctx.fill();
    return;
  }

  if (themeId === 'classic') {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w*.5, h*.45, 20, w*.5, h*.45, w*.55);
    g.addColorStop(0, lighten(base, .28)); g.addColorStop(1, base);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); return;
  }

  if (themeId === 'aurora') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, light); g.addColorStop(.45, base); g.addColorStop(1, dark);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    blob(ctx, accent, w*.12, h*.18, w*.42, .36);
    blob(ctx, cool, w*.82, h*.34, w*.48, .26);
    blob(ctx, lighter, w*.45, h*.86, w*.55, .18); return;
  }

  if (themeId === 'paper') {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    curve(ctx, dark, -w*.1, h*.68, w*1.25, h*.52, .22);
    curve(ctx, light, w*.2, h*.58, w*1.05, h*.55, .28);
    curve(ctx, mix(base, '#ffffff', .18), -w*.25, h*.78, w*1.2, h*.45, .18); return;
  }

  if (themeId === 'spotlight') {
    const g = ctx.createRadialGradient(w*.18, h*.14, 0, w*.18, h*.14, w*1.05);
    g.addColorStop(0, lighter); g.addColorStop(.34, base); g.addColorStop(1, dark);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); return;
  }

  if (themeId === 'halo') {
    ctx.fillStyle = dark; ctx.fillRect(0, 0, w, h);
    blob(ctx, base, w*.5, h*.5, w*.82, .46);
    blob(ctx, light, w*.5, h*.5, w*.45, .42); return;
  }

  if (themeId === 'mesh') {
    const g = ctx.createLinearGradient(0, h, w, 0);
    g.addColorStop(0, dark); g.addColorStop(.35, base); g.addColorStop(.7, cool); g.addColorStop(1, accent);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    blob(ctx, lighter, w*.15, h*.86, w*.55, .16);
    blob(ctx, '#ffffff', w*.86, h*.12, w*.35, .1); return;
  }

  if (themeId === 'watermark') {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, lighten(base, .2)); g.addColorStop(1, darken(base, .15));
    ctx.globalAlpha = .55; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; return;
  }

  if (themeId === 'topography') {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 3;
    for (let r = 70; r < 520; r += 34) {
      ctx.beginPath(); ctx.ellipse(w*.18, h*.2, r, r*.62, .6, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w*.92, h*.84, r*.75, r*.42, -.4, 0, Math.PI*2); ctx.stroke();
    } return;
  }

  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
}

function blob(ctx, colour, x, y, size, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, colour); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.globalAlpha = 1;
}
function curve(ctx, colour, x, y, ww, hh, alpha) {
  ctx.globalAlpha = alpha; ctx.fillStyle = colour; ctx.beginPath();
  ctx.moveTo(x, y); ctx.bezierCurveTo(x+ww*.25, y-hh*.55, x+ww*.62, y+hh*.2, x+ww, y-hh*.35);
  ctx.lineTo(x+ww, y+hh); ctx.lineTo(x, y+hh); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}
