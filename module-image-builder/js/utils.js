export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
export function mix(hex1, hex2, weight = 0.5) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  return rgbToHex(a.r + (b.r - a.r) * weight, a.g + (b.g - a.g) * weight, a.b + (b.b - a.b) * weight);
}
export function lighten(hex, amount = 0.2) { return mix(hex, '#ffffff', amount); }
export function darken(hex, amount = 0.2) { return mix(hex, '#000000', amount); }

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily = 'Arial') {
  let size = startSize;
  do {
    ctx.font = `700 ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size >= minSize);
  return minSize;
}

// Some SVGs have no width/height attributes and load with a size of 0.
function naturalSize(img) {
  const w = img.naturalWidth || img.width || 512;
  const h = img.naturalHeight || img.height || 512;
  return { w, h };
}

/**
 * Draws an icon as a solid single-colour silhouette, fitted inside a square box
 * centred on (cx, cy). Works for any SVG regardless of its original colours,
 * and works in every browser (no canvas filters needed).
 */
export function drawTintedIcon(ctx, img, cx, cy, box, colour) {
  if (!img) return null;
  const { w, h } = naturalSize(img);
  const scale = Math.min(box / w, box / h);
  const iw = Math.max(1, Math.round(w * scale)), ih = Math.max(1, Math.round(h * scale));
  const off = document.createElement('canvas');
  off.width = iw; off.height = ih;
  const o = off.getContext('2d');
  o.drawImage(img, 0, 0, iw, ih);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = colour;
  o.fillRect(0, 0, iw, ih);
  const x = cx - iw / 2, y = cy - ih / 2;
  ctx.drawImage(off, x, y);
  return { x, y, w: iw, h: ih };
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
