import { drawTheme } from './themes.js';
import { fitText, drawTintedIcon } from './utils.js';

// Standard icon images: university colour + theme, white icon.
export function renderIconModule(ctx, state) {
  const { canvas } = ctx;
  const w = canvas.width, h = canvas.height;
  drawTheme(ctx, state.theme, state.colour.hex, w, h);
  if (!state.iconImage) return;

  if (state.theme === 'watermark') {
    ctx.save(); ctx.globalAlpha = .07;
    drawTintedIcon(ctx, state.iconImage, w * .5, h * .5, w * 1.02, '#ffffff');
    ctx.restore();
  }

  const iconSize = Math.min(w, h) * (state.iconSize / 100);
  drawTintedIcon(ctx, state.iconImage, w / 2, h / 2, iconSize, '#ffffff');

  if (state.iconId === 'calendar') {
    drawCalendarText(ctx, state.calendarHeader, state.calendarMain, (w - iconSize) / 2, (h - iconSize) / 2, iconSize, '#ffffff');
  }
}

export function renderPhotoModule(ctx, state) {
  const { canvas } = ctx;
  const w = canvas.width, h = canvas.height;
  const k = w / 500; // border slider values were designed for a 500px canvas
  const border = state.borderWidth * k;
  ctx.clearRect(0, 0, w, h);

  if (state.photoImage) {
    const innerW = w - border * 2, innerH = h - border * 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(border, border, innerW, innerH); ctx.clip();
    ctx.filter = `saturate(${state.photoSaturation}%)`;
    drawCroppedImage(ctx, state.photoImage, border, border, innerW, innerH, state.photoZoom / 100, state.photoX / 100, state.photoY / 100);
    ctx.restore();
  } else {
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#59616b'; ctx.font = `700 ${Math.round(24 * k)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Upload an image', w / 2, h / 2);
  }

  if (border > 0) {
    ctx.strokeStyle = state.photoColour.hex; ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, w - border, h - border);
  }
}

// Positions are tuned to the calendar SVG: the header sits in the top band,
// the main text in the open body. (x, y) is the top-left of the icon's box.
export function drawCalendarText(ctx, header, main, x, y, size, colour) {
  header = header || 'Week'; main = main || '1';
  const headerBox = { x: x + size * .16, y: y + size * .17, width: size * .68, height: size * .13 };
  const mainBox = { x: x + size * .10, y: y + size * .50, width: size * .80, height: size * .28 };
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = colour;
  const hs = fitText(ctx, header, headerBox.width, size * .13, 8);
  ctx.font = `700 ${hs}px Arial`; ctx.fillText(header, headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
  const ms = fitText(ctx, main, mainBox.width, size * .28, 10);
  ctx.font = `800 ${ms}px Arial`; ctx.fillText(main, mainBox.x + mainBox.width / 2, mainBox.y + mainBox.height / 2);
  ctx.restore();
}

function drawCroppedImage(ctx, img, x, y, w, h, zoom, fx, fy) {
  const coverScale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * coverScale, dh = img.height * coverScale;
  const dx = x + (w - dw) * fx;
  const dy = y + (h - dh) * fy;
  ctx.drawImage(img, dx, dy, dw, dh);
}
