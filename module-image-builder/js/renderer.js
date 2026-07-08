import { drawTheme } from './themes.js';
import { fitText } from './utils.js';

export async function renderIconModule(ctx, state) {
  const { canvas } = ctx;
  const w = canvas.width, h = canvas.height;
  drawTheme(ctx, state.theme, state.colour.hex, w, h);

  if (state.theme === 'watermark' && state.iconImage) {
    ctx.save(); ctx.globalAlpha = .07; ctx.filter = 'none';
    drawCentredImage(ctx, state.iconImage, w*.5, h*.5, w*1.02, h*1.02, 'white');
    ctx.restore();
  }

  const iconSize = Math.min(w, h) * (state.iconSize / 100);
  drawCentredImage(ctx, state.iconImage, w/2, h/2, iconSize, iconSize, 'white');

  if (state.mode === 'teaching') {
    drawCalendarText(ctx, state.calendarHeader || 'Week', state.calendarMain || '1', w, h, iconSize);
  }
}

export function renderPhotoModule(ctx, state) {
  const { canvas } = ctx;
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#e8edf2'; ctx.fillRect(0, 0, w, h);

  if (state.photoImage) {
    const border = state.borderWidth;
    const innerW = w - border*2, innerH = h - border*2;
    ctx.save();
    ctx.beginPath(); ctx.rect(border, border, innerW, innerH); ctx.clip();
    ctx.filter = `saturate(${state.photoSaturation}%)`;
    drawCroppedImage(ctx, state.photoImage, border, border, innerW, innerH, state.photoZoom/100, state.photoX/100, state.photoY/100);
    ctx.restore();
  } else {
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#59616b'; ctx.font = '700 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Upload an image', w/2, h/2);
  }

  if (state.borderWidth > 0) {
    ctx.strokeStyle = state.photoColour.hex; ctx.lineWidth = state.borderWidth;
    ctx.strokeRect(state.borderWidth/2, state.borderWidth/2, w-state.borderWidth, h-state.borderWidth);
  }
}

function drawCentredImage(ctx, img, cx, cy, maxW, maxH) {
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const iw = img.width * scale, ih = img.height * scale;
  ctx.drawImage(img, cx - iw/2, cy - ih/2, iw, ih);
}

function drawCalendarText(ctx, header, main, w, h, iconSize) {
  const iconX = (w - iconSize) / 2;
  const iconY = (h - iconSize) / 2;
  const headerBox = { x: iconX + iconSize*.19, y: iconY + iconSize*.27, width: iconSize*.62, height: iconSize*.16 };
  const mainBox = { x: iconX + iconSize*.18, y: iconY + iconSize*.48, width: iconSize*.64, height: iconSize*.26 };
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'white';
  let hs = fitText(ctx, header, headerBox.width, iconSize*.105, 10);
  ctx.font = `700 ${hs}px Arial`; ctx.fillText(header, headerBox.x + headerBox.width/2, headerBox.y + headerBox.height/2);
  let ms = fitText(ctx, main, mainBox.width, iconSize*.2, 14);
  ctx.font = `800 ${ms}px Arial`; ctx.fillText(main, mainBox.x + mainBox.width/2, mainBox.y + mainBox.height/2);
}

function drawCroppedImage(ctx, img, x, y, w, h, zoom, fx, fy) {
  const coverScale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * coverScale, dh = img.height * coverScale;
  const dx = x + (w - dw) * fx;
  const dy = y + (h - dh) * fy;
  ctx.drawImage(img, dx, dy, dw, dh);
}
