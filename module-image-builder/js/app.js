import { loadImage, readFileAsDataUrl, slugify } from './utils.js';
import { renderIconModule, renderPhotoModule } from './renderer.js';
import { drawStylised } from './styles.js';

const $ = id => document.getElementById(id);
const canvas = $('previewCanvas');
const ctx = canvas.getContext('2d');

const state = {
  mode: 'standard',               // standard | stylised | photo
  colours: [], themes: [], icons: [], styles: [],
  iconImages: {},                 // built-in icon id -> loaded image
  uploadedImage: null, uploadedName: '',

  // standard
  standardIcon: 'calendar',
  colour: null,
  theme: 'aurora',
  iconSize: 68,

  // stylised
  stylisedIcon: 'upload',
  stylisedColour: null,
  style: 'geometric',
  badgeSize: 42,
  stylisedIconSize: 58,
  mirror: false,

  // shared calendar text
  calendarHeader: 'Week',
  calendarMain: '1',

  // photo
  photoImage: null, photoColour: null,
  photoZoom: 120, photoSaturation: 75, photoX: 50, photoY: 50, borderWidth: 16,

  // file name
  courseId: '', fileLabel: ''
};

const ICON_LABELS = { calendar: 'Teaching week / month' };

async function init() {
  const [colours, icons, themes, styles] = await Promise.all(
    ['colours', 'icons', 'themes', 'styles'].map(n => fetch(`data/${n}.json`).then(r => r.json()))
  );
  Object.assign(state, { colours, icons, themes, styles });
  const blue = colours.find(c => c.name === 'University blue') || colours[0];
  state.colour = blue; state.stylisedColour = blue; state.photoColour = blue;

  await Promise.all(icons.map(async i => { state.iconImages[i.id] = await loadImage(i.file); }));

  try { state.courseId = localStorage.getItem('mib-course-id') || ''; } catch { /* storage unavailable */ }
  $('courseId').value = state.courseId;

  buildSwatches($('colourSwatches'), 'colour');
  buildSwatches($('stylisedSwatches'), 'stylisedColour');
  buildSwatches($('photoColourSwatches'), 'photoColour');
  buildThemes();
  buildStylePicker();
  buildIconSelect();
  bindEvents();
  updateVisibility();
  render();
}

/* ---------- builders ---------- */

function buildSwatches(container, key) {
  container.innerHTML = '';
  state.colours.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'swatch' + (state[key].hex === c.hex ? ' active' : '');
    btn.style.background = c.hex;
    btn.title = c.name;
    btn.type = 'button';
    btn.setAttribute('aria-label', c.name);
    btn.setAttribute('aria-pressed', state[key].hex === c.hex);
    btn.addEventListener('click', () => { state[key] = c; buildSwatches(container, key); render(); });
    container.appendChild(btn);
  });
}

function buildThemes() {
  const sel = $('themeSelect');
  sel.innerHTML = '';
  state.themes.forEach(t => sel.add(new Option(t.name, t.id)));
  sel.value = state.theme;
  updateThemeDescription();
}
function updateThemeDescription() {
  const t = state.themes.find(x => x.id === state.theme);
  $('themeDescription').textContent = t ? t.description : '';
}

function buildIconSelect() {
  const sel = $('iconSelect');
  sel.innerHTML = '';
  if (state.mode === 'stylised') sel.add(new Option('Upload your own SVG', 'upload'));
  state.icons.forEach(i => sel.add(new Option(ICON_LABELS[i.id] || i.title, i.id)));
  sel.value = state.mode === 'stylised' ? state.stylisedIcon : state.standardIcon;
}

function buildStylePicker() {
  const wrap = $('stylePicker');
  wrap.innerHTML = '';
  state.styles.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'style-option' + (s.id === state.style ? ' active' : '');
    btn.dataset.style = s.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', s.id === state.style);
    const c = document.createElement('canvas');
    c.width = c.height = 220;
    c.setAttribute('aria-hidden', 'true');
    const span = document.createElement('span');
    span.textContent = s.name;
    btn.append(c, span);
    btn.addEventListener('click', () => selectStyle(s.id));
    wrap.appendChild(btn);
  });
  updateStyleDescription();
}
function selectStyle(id) {
  state.style = id;
  const s = state.styles.find(x => x.id === id);
  if (s && s.badge) { state.badgeSize = s.badge; $('badgeSize').value = s.badge; }
  document.querySelectorAll('.style-option').forEach(b => {
    const on = b.dataset.style === id;
    b.classList.toggle('active', on); b.setAttribute('aria-checked', on);
  });
  updateStyleDescription();
  render();
}
function updateStyleDescription() {
  const s = state.styles.find(x => x.id === state.style);
  $('styleDescription').textContent = s ? s.description : '';
}

/* ---------- events ---------- */

function bindEvents() {
  $('moduleTypeGrid').addEventListener('click', e => {
    const btn = e.target.closest('.module-card'); if (!btn) return;
    document.querySelectorAll('.module-card').forEach(b => {
      b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn);
    });
    state.mode = btn.dataset.mode;
    if (state.mode !== 'photo') buildIconSelect();
    updateVisibility(); render();
  });

  $('iconSelect').addEventListener('change', e => {
    if (state.mode === 'stylised') state.stylisedIcon = e.target.value;
    else state.standardIcon = e.target.value;
    updateVisibility(); render();
  });

  $('themeSelect').addEventListener('change', e => { state.theme = e.target.value; updateThemeDescription(); render(); });
  $('mirrorLayout').addEventListener('change', e => { state.mirror = e.target.checked; render(); });

  const inputs = ['calendarHeader', 'calendarMain', 'iconSize', 'badgeSize', 'stylisedIconSize',
    'photoZoom', 'photoSaturation', 'photoX', 'photoY', 'borderWidth', 'fileLabel'];
  inputs.forEach(id => $(id).addEventListener('input', e => {
    state[id] = e.target.type === 'range' ? Number(e.target.value) : e.target.value;
    render();
  }));
  $('courseId').addEventListener('input', e => {
    state.courseId = e.target.value;
    try { localStorage.setItem('mib-course-id', state.courseId); } catch { /* storage unavailable */ }
    updateFileName();
  });

  $('svgUpload').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith('.svg')) { alert('Please upload an SVG file.'); e.target.value = ''; return; }
    try {
      state.uploadedImage = await loadImage(await readFileAsDataUrl(file));
      state.uploadedName = file.name.replace(/\.svg$/i, '');
    } catch {
      alert('That SVG could not be read. Try re-saving it from your design tool.');
      return;
    }
    render();
  });

  $('photoUpload').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    state.photoImage = await loadImage(await readFileAsDataUrl(file));
    state.photoName = file.name.replace(/\.[^.]+$/, '');
    render();
  });

  $('downloadBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = fileName();
    a.href = canvas.toDataURL('image/png');
    a.click();
  });
}

function updateVisibility() {
  const isPhoto = state.mode === 'photo';
  const icon = currentIconId();
  $('iconControls').classList.toggle('hidden', isPhoto);
  $('photoControls').classList.toggle('hidden', !isPhoto);
  $('standardControls').classList.toggle('hidden', state.mode !== 'standard');
  $('stylisedControls').classList.toggle('hidden', state.mode !== 'stylised');
  document.querySelectorAll('.calendar-only').forEach(el => el.classList.toggle('hidden', isPhoto || icon !== 'calendar'));
  document.querySelectorAll('.upload-only').forEach(el => el.classList.toggle('hidden', isPhoto || icon !== 'upload'));
}

/* ---------- rendering ---------- */

function currentIconId() {
  return state.mode === 'stylised' ? state.stylisedIcon : state.standardIcon;
}
function currentIconImage() {
  const id = currentIconId();
  return id === 'upload' ? state.uploadedImage : state.iconImages[id];
}

function stylisedOpts(style) {
  const id = currentIconId();
  return {
    style,
    colour: state.stylisedColour,
    badge: style === state.style ? state.badgeSize : (state.styles.find(s => s.id === style)?.badge || 42),
    iconScale: state.stylisedIconSize,
    mirror: state.mirror,
    iconImage: currentIconImage(),
    calendar: id === 'calendar' ? { header: state.calendarHeader, main: state.calendarMain } : null
  };
}

function render() {
  if (state.mode === 'photo') renderPhotoModule(ctx, state);
  else if (state.mode === 'stylised') {
    drawStylised(ctx, stylisedOpts(state.style));
    renderStyleThumbs();
  } else {
    renderIconModule(ctx, { ...state, iconId: state.standardIcon, iconImage: currentIconImage() });
  }
  updateFileName();
}

function renderStyleThumbs() {
  document.querySelectorAll('.style-option').forEach(btn => {
    const c = btn.querySelector('canvas');
    drawStylised(c.getContext('2d'), stylisedOpts(btn.dataset.style));
  });
}

/* ---------- file name ---------- */

function autoLabel() {
  if (state.mode === 'photo') return state.photoName || 'photo';
  const id = currentIconId();
  if (id === 'calendar') return `${state.calendarHeader || 'Week'} ${state.calendarMain || '1'}`;
  if (id === 'upload') return state.uploadedName || 'icon';
  return id;
}
function styleTag() {
  if (state.mode === 'standard') return state.theme;
  if (state.mode === 'stylised') return state.styles.find(s => s.id === state.style)?.short || state.style;
  return '';
}
function fileName() {
  const parts = [
    slugify(state.courseId) || 'module-image',
    slugify(state.fileLabel || autoLabel()).toLowerCase(),
    styleTag()
  ].filter(Boolean);
  return parts.join('_') + '.png';
}
function updateFileName() {
  $('fileLabel').placeholder = slugify(autoLabel()).toLowerCase() || 'label';
  $('fileNamePreview').textContent = fileName();
}

init().catch(err => {
  console.error(err);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#D50032'; ctx.font = '700 28px Arial'; ctx.fillText('App failed to load. Check file paths.', 60, 400);
});
