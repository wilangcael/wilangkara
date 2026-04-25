// ============================================================
//  script.js — For You 💌 Confession Website
// ============================================================

// ── CONFIGURATION — ganti nama di sini! ──
const RECIPIENT_NAME = "Mikhael";   // nama penerima
const SENDER_NAME    = "Wilang";    // nama pengirim

// ============================================================
//  FLOATING HEARTS
// ============================================================
const EMOJIS = ['💕','💗','💖','💓','💝','🌸','✨','💫','🌹','🎀'];

function initFloatingHearts() {
  const container = document.getElementById('fh');
  for (let i = 0; i < 20; i++) {
    const h = document.createElement('span');
    h.className = 'heart-particle';
    h.textContent = EMOJIS[i % EMOJIS.length];
    h.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `font-size:${0.8 + Math.random() * 1.3}rem`,
      `animation-duration:${7 + Math.random() * 10}s`,
      `animation-delay:${Math.random() * 9}s`,
    ].join(';');
    container.appendChild(h);
  }
}

// ============================================================
//  PAGE NAVIGATION
// ============================================================
function showPage(n) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page' + n).classList.add('active');
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i < n));
  window.scrollTo(0, 0);
}

// ============================================================
//  PAGE 1 — ENVELOPE
// ============================================================
let opened = false;

function openEnvelope() {
  if (opened) return;
  opened = true;
  document.getElementById('envFlap').classList.add('open');
  setTimeout(() => showPage(2), 680);
}

// ============================================================
//  HEART PUZZLE ENGINE
// ============================================================

// Heart shape mask: 1 = active cell, 0 = ghost (7 cols × 6 rows)
const HEART_MASK = [
  [0,1,1,0,1,1,0],
  [1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1],
  [0,1,1,1,1,1,0],
  [0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0],
];

const ACTIVE_CELLS = HEART_MASK.flat().filter(v => v).length; // = 25

let puzzles = {};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePaddedLetters(name, totalCells) {
  const nameLetters = name.toUpperCase().split('');
  const fillers = 'ABCDEFGHIJKLMNOPRSTUVWY';
  const count = totalCells - nameLetters.length;
  const extra = [];
  for (let i = 0; i < count; i++) {
    extra.push(fillers[Math.floor(Math.random() * fillers.length)]);
  }
  return shuffle([...nameLetters, ...extra]);
}

function initPuzzle(boardId, statusId, bankId, name) {
  const grid     = document.getElementById(boardId);
  const statusEl = document.getElementById(statusId);
  const bankEl   = document.getElementById(bankId);
  const nameUpper = name.toUpperCase();
  const letters   = makePaddedLetters(name, ACTIVE_CELLS);

  // Map letters to active heart cells
  const activeCells = [];
  HEART_MASK.forEach((row, r) => row.forEach((v, c) => {
    if (v) activeCells.push({ r, c, idx: r * 7 + c });
  }));

  const cellLetterMap = {};
  activeCells.forEach((cell, i) => { cellLetterMap[cell.idx] = letters[i]; });

  // Build grid DOM
  grid.innerHTML = '';
  HEART_MASK.forEach((row, r) => {
    row.forEach((v, c) => {
      const cell = document.createElement('div');
      const idx  = r * 7 + c;
      if (v) {
        cell.className        = 'hcell active-cell';
        cell.textContent      = cellLetterMap[idx];
        cell.dataset.idx      = idx;
        cell.dataset.letter   = cellLetterMap[idx];
        cell.addEventListener('click', () => onCellClick(boardId, cell));
      } else {
        cell.className = 'hcell ghost';
      }
      grid.appendChild(cell);
    });
  });

  // Build letter bank
  const bankLetters = shuffle(nameUpper.split(''));
  bankEl.innerHTML = '';
  bankLetters.forEach((letter, i) => {
    const tile = document.createElement('div');
    tile.className       = 'letter-tile';
    tile.textContent     = letter;
    tile.dataset.bankIdx = i;
    tile.dataset.letter  = letter;
    tile.addEventListener('click', () => onTileClick(boardId, tile));
    bankEl.appendChild(tile);
  });

  puzzles[boardId] = {
    name:        nameUpper,
    selected:    [],
    usedTileIdx: [],
    solved:      false,
    statusEl,
    bankEl,
    grid,
  };
}

function onTileClick(boardId, tile) {
  const p = puzzles[boardId];
  if (p.solved || tile.classList.contains('used')) return;

  tile.classList.add('used');
  p.usedTileIdx.push(parseInt(tile.dataset.bankIdx));

  // Fill first available active cell
  const cells = Array.from(p.grid.querySelectorAll('.hcell.active-cell:not(.selected):not(.correct)'));
  if (cells.length === 0) return;
  const targetCell = cells[0];

  targetCell.dataset.inputLetter = tile.dataset.letter;
  targetCell.textContent         = tile.dataset.letter;
  targetCell.classList.add('selected');
  p.selected.push({ cell: targetCell, tileEl: tile, letter: tile.dataset.letter });

  checkPuzzle(boardId);
}

function onCellClick(boardId, cell) {
  const p = puzzles[boardId];
  if (p.solved) return;

  if (cell.classList.contains('selected')) {
    const lastIdx = p.selected.map(s => s.cell).lastIndexOf(cell);
    if (lastIdx === -1) return;
    const removed = p.selected.splice(lastIdx);
    removed.forEach(({ cell: c, tileEl }) => {
      c.classList.remove('selected', 'correct', 'wrong');
      c.textContent = c.dataset.letter;
      delete c.dataset.inputLetter;
      tileEl.classList.remove('used');
    });
    p.statusEl.textContent = '';
  }
}

function checkPuzzle(boardId) {
  const p               = puzzles[boardId];
  const target          = p.name;
  const selectedLetters = p.selected.map(s => s.letter).join('');

  if (selectedLetters.length < target.length) {
    p.statusEl.textContent = `${selectedLetters.length} / ${target.length} huruf ✍️`;
    return;
  }

  if (selectedLetters === target) {
    p.selected.forEach(({ cell }) => {
      cell.classList.remove('selected');
      cell.classList.add('correct');
    });
    p.solved = true;
    p.statusEl.innerHTML = '<span class="puzzle-solved-badge">✓ Benar!</span>';
    checkAllSolved();
  } else {
    p.selected.forEach(({ cell }) => cell.classList.add('wrong'));
    setTimeout(() => {
      p.selected.forEach(({ cell, tileEl }) => {
        cell.classList.remove('selected', 'wrong');
        cell.textContent = cell.dataset.letter;
        delete cell.dataset.inputLetter;
        tileEl.classList.remove('used');
      });
      p.selected = [];
      p.statusEl.textContent = '💔 Hmm, coba lagi!';
    }, 600);
  }
}

function checkAllSolved() {
  const allSolved = Object.values(puzzles).every(p => p.solved);
  if (allSolved) {
    document.getElementById('btnContinue').style.display = 'inline-block';
  }
}

// ============================================================
//  PAGE 2 → 3
// ============================================================
function goToLetter() {
  const r = RECIPIENT_NAME;
  const s = SENDER_NAME;
  document.getElementById('letterSalutation').textContent = 'My Love, ' + r + ' 🌸';
  document.getElementById('letterSign').textContent       = '— yours always, ' + s;
  window._rec = r;
  window._sen = s;
  showPage(3);
}

// ============================================================
//  PAGE 3 → 4
// ============================================================
function goToConfession() {
  const r = window._rec || RECIPIENT_NAME;
  document.getElementById('confTitle').textContent = 'For ' + r + '...';
  document.getElementById('confQ').textContent     = 'Will you be the most special person in my life, ' + r + '? ';
  showPage(4);
}

// ============================================================
//  PAGE 4 — YES
// ============================================================
function sayYes() {
  const r = window._rec || RECIPIENT_NAME;
  const s = window._sen || SENDER_NAME;
  document.getElementById('yesTitle').textContent = r + ' said YES!! ';
  document.getElementById('yesMsg').innerHTML =
    'I promise I will always be there for you,<br>' +
    'cheering you on at every step,<br>' +
    'and loving you with everything I have. 💗<br><br>' +
    'Thank you for accepting <strong>' + s + '</strong>\'s feelings.<br>' +
    'You are truly the most precious person. 🌹';
  showPage(5);
  launchConfetti();
}

// ============================================================
//  PAGE 4 — NO button shenanigans
// ============================================================
const NO_LINES = [
  "😤 Hmm, that option doesn't exist here!",
  "🙅 Sorry, this button seems to be broken~",
  "💔 Wow, that was really mean of you...",
  "🥺 One more time... pretty please?",
  "😭 NOOO, DON'T DO THIS TO ME!!",
  "🤧 Fine, I'll wait here until you say yes...",
  "💌 Did you even read the letter? Still no?!",
  "😩 Are you seriously trying to make me cry?!",
  "🌹 Come on... I worked up so much courage for this!",
  "😂 Okay I see you're just teasing — say YES already!",
];
let noCount = 0;
let alertTid;

function pressedNo() {
  showCuteAlert(NO_LINES[noCount % NO_LINES.length]);
  noCount++;
  const btn = document.getElementById('noBtn');
  if (!btn || btn.style.display === 'none') return;
  if (noCount >= 2) moveNoBtn();
  const sc = Math.max(0.22, 1 - noCount * 0.08);
  btn.style.transition = 'transform .2s, opacity .2s';
  btn.style.transform  = `scale(${sc})`;
  btn.style.opacity    = sc;
  if (noCount >= 9) {
    btn.style.display = 'none';
    showCuteAlert("The 'No' button got too embarrassed and disappeared! Just press YES already! 💖");
  }
}

function moveNoBtn() {
  const btn  = document.getElementById('noBtn');
  const maxX = window.innerWidth  - 160;
  const maxY = window.innerHeight - 70;
  btn.style.position   = 'fixed';
  btn.style.left       = Math.max(10, Math.floor(Math.random() * maxX)) + 'px';
  btn.style.top        = Math.max(10, Math.floor(Math.random() * maxY)) + 'px';
  btn.style.zIndex     = '999';
  btn.style.transition = 'left .25s ease, top .25s ease, transform .2s, opacity .2s';
}

// ============================================================
//  CUTE ALERT POPUP
// ============================================================
function showCuteAlert(msg) {
  const el = document.getElementById('cuteAlert');
  clearTimeout(alertTid);
  el.classList.remove('show');
  el.innerHTML = `
    <div style="font-size:2.2rem; margin-bottom:10px;">💌</div>
    <p style="font-style:italic;">${msg}</p>
    <button class="alert-close-btn" onclick="closeCuteAlert()">okay fine </button>
  `;
  requestAnimationFrame(() => el.classList.add('show'));
  alertTid = setTimeout(closeCuteAlert, 4500);
}

function closeCuteAlert() {
  document.getElementById('cuteAlert').classList.remove('show');
}

// ============================================================
//  CONFETTI
// ============================================================
function launchConfetti() {
  const COLORS = ['#c8a96e','#e8d5a3','#9e2a2a','#f5f0e8','#f4a0a0','#ffcccc','#fff'];
  for (let i = 0; i < 90; i++) {
    setTimeout(() => {
      const c  = document.createElement('div');
      const sz = 6 + Math.random() * 9;
      c.className = 'confetti-piece';
      c.style.cssText = [
        `left:${Math.random() * 100}vw`,
        `top:0`,
        `width:${sz}px`,
        `height:${sz}px`,
        `background:${COLORS[Math.floor(Math.random() * COLORS.length)]}`,
        `border-radius:${Math.random() > .5 ? '50%' : '2px'}`,
        `animation-duration:${2 + Math.random() * 2.5}s`,
      ].join(';');
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }, i * 28);
  }
}

// ============================================================
//  MUSIC PLAYER
// ============================================================
let musicPlaying = false;
let musicStarted = false;

function playMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  audio.volume = 0.7;
  const promise = audio.play();
  if (promise !== undefined) {
    promise.then(() => {
      musicPlaying = true;
      document.getElementById('musicIcon').textContent = '❚❚';
      document.getElementById('musicPlayer').classList.add('playing');
    }).catch(() => {
      // autoplay blocked, user must press play manually
    });
  }
}

function pauseMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  audio.pause();
  musicPlaying = false;
  document.getElementById('musicIcon').textContent = '▶';
  document.getElementById('musicPlayer').classList.remove('playing');
}

function toggleMusic() {
  if (musicPlaying) {
    pauseMusic();
  } else {
    musicStarted = true;
    playMusic();
  }
}

function startMusicOnFirstInteraction() {
  if (musicStarted) return;
  musicStarted = true;
  playMusic();
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initFloatingHearts();
  initPuzzle('heartGrid1', 'status1', 'bank1', RECIPIENT_NAME);
  initPuzzle('heartGrid2', 'status2', 'bank2', SENDER_NAME);

  // Mulai musik saat user pertama kali interaksi (klik/tap)
  document.addEventListener('click',      startMusicOnFirstInteraction, { once: true });
  document.addEventListener('touchstart', startMusicOnFirstInteraction, { once: true });
});