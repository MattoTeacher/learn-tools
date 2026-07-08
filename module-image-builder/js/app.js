import { loadImage, readFileAsDataUrl } from './utils.js';
import { renderIconModule, renderPhotoModule } from './renderer.js';

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const moduleGrid = document.getElementById('moduleTypeGrid');
const colourSwatches = document.getElementById('colourSwatches');
const photoColourSwatches = document.getElementById('photoColourSwatches');
const themeSelect = document.getElementById('themeSelect');
const themeDescription = document.getElementById('themeDescription');
const iconControls = document.getElementById('iconControls');
const photoControls = document.getElementById('photoControls');

const state = {
  mode: 'teaching',
  colours: [], themes: [], icons: [],
  colour: { name: 'University blue', hex: '#041E42' },
  photoColour: { name: 'University blue', hex: '#041E42' },
  theme: 'aurora',
  iconSize: 68,
  calendarHeader: 'Week',
  calendarMain: '1',
  iconImage: null,
  uploadedSvgUrl: null,
  photoImage: null,
  photoZoom: 120,
  photoSaturation: 75,
  photoX: 50,
  photoY: 50,
  borderWidth: 16
};

async function init() {
  const [colours, icons, themes] = await Promise.all([
    fetch('data/colours.json').then(r => r.json()),
    fetch('data/icons.json').then(r => r.json()),
    fetch('data/themes.json').then(r => r.json())
  ]);
  state.colours = colours; state.icons = icons; state.themes = themes;
  state.colour = colours.find(c => c.name === 'University blue') || colours[0];
  state.photoColour = state.colour;
  buildSwatches(colourSwatches, 'colour');
  buildSwatches(photoColourSwatches, 'photoColour');
  buildThemes();
  await setIconForMode('teaching');
  bindEvents();
  updateVisibility();
  render();
}

function buildSwatches(container, key) {
  container.innerHTML = '';
  state.colours.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'swatch' + (state[key].hex === c.hex ? ' active' : '');
    btn.style.background = c.hex;
    btn.title = c.name;
    btn.type = 'button';
    btn.addEventListener('click', () => { state[key] = c; buildSwatches(container, key); render(); });
    container.appendChild(btn);
  });
}
function buildThemes() {
  themeSelect.innerHTML = '';
  state.themes.forEach(t => {
    const opt = document.createElement('option'); opt.value = t.id; opt.textContent = t.name; themeSelect.appendChild(opt);
  });
  themeSelect.value = state.theme;
  updateThemeDescription();
}
function updateThemeDescription() {
  const t = state.themes.find(x => x.id === state.theme);
  themeDescription.textContent = t ? t.description : '';
}
async function setIconForMode(mode) {
  let id = { teaching: 'calendar', reading: 'reading-week', assessment: 'assignment', welcome: 'welcome' }[mode];
  if (!id && mode === 'other' && state.uploadedSvgUrl) { state.iconImage = await loadImage(state.uploadedSvgUrl); return; }
  if (!id) id = 'calendar';
  const icon = state.icons.find(i => i.id === id);
  state.iconImage = await loadImage(icon.file);
}
function bindEvents() {
  moduleGrid.addEventListener('click', async e => {
    const btn = e.target.closest('.module-card'); if (!btn) return;
    document.querySelectorAll('.module-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    if (state.mode !== 'photo') await setIconForMode(state.mode);
    updateVisibility(); render();
  });
  themeSelect.addEventListener('change', () => { state.theme = themeSelect.value; updateThemeDescription(); render(); });
  ['calendarHeader','calendarMain','iconSize','photoZoom','photoSaturation','photoX','photoY','borderWidth'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
      const v = e.target.type === 'range' ? Number(e.target.value) : e.target.value;
      if (id === 'calendarHeader') state.calendarHeader = v;
      if (id === 'calendarMain') state.calendarMain = v;
      if (id === 'iconSize') state.iconSize = v;
      if (id === 'photoZoom') state.photoZoom = v;
      if (id === 'photoSaturation') state.photoSaturation = v;
      if (id === 'photoX') state.photoX = v;
      if (id === 'photoY') state.photoY = v;
      if (id === 'borderWidth') state.borderWidth = v;
      render();
    });
  });
  document.getElementById('svgUpload').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith('.svg')) { alert('Please upload an SVG file.'); e.target.value = ''; return; }
    state.uploadedSvgUrl = await readFileAsDataUrl(file);
    state.iconImage = await loadImage(state.uploadedSvgUrl);
    state.mode = 'other'; render();
  });
  document.getElementById('photoUpload').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    state.photoImage = await loadImage(await readFileAsDataUrl(file)); render();
  });
  document.getElementById('downloadBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `module-image-${state.mode}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  });
}
function updateVisibility() {
  const isPhoto = state.mode === 'photo';
  iconControls.classList.toggle('hidden', isPhoto);
  photoControls.classList.toggle('hidden', !isPhoto);
  document.querySelectorAll('.calendar-only').forEach(el => el.classList.toggle('hidden', state.mode !== 'teaching'));
  document.querySelectorAll('.other-only').forEach(el => el.classList.toggle('hidden', state.mode !== 'other'));
}
function render() {
  if (state.mode === 'photo') renderPhotoModule(ctx, state);
  else renderIconModule(ctx, state);
}

init().catch(err => {
  console.error(err);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#D50032'; ctx.font = '700 18px Arial'; ctx.fillText('App failed to load. Check file paths.', 40, 250);
});
