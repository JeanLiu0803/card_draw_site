const STORAGE_KEY = 'reusable-card-draw-state-v2';
let config = null;
let availableCards = [];
let drawHistory = [];

const appTitle = document.getElementById('appTitle');
const appSubtitle = document.getElementById('appSubtitle');
const appBadge = document.getElementById('appBadge');
const nameInput = document.getElementById('nameInput');
const drawBtn = document.getElementById('drawBtn');
const undoBtn = document.getElementById('undoBtn');
const resetBtn = document.getElementById('resetBtn');
const totalCount = document.getElementById('totalCount');
const remainingCount = document.getElementById('remainingCount');
const drawnCount = document.getElementById('drawnCount');
const drawCardEl = document.getElementById('drawCard');
const resultImage = document.getElementById('resultImage');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const resultOwner = document.getElementById('resultOwner');
const historyList = document.getElementById('historyList');
const cardBackImage = document.getElementById('cardBackImage');
const drawStage = document.querySelector('.draw-stage');

function randomIndex(max){ return Math.floor(Math.random()*max); }

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ drawHistory }));
}

function restoreState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try{
    const state = JSON.parse(raw);
    const validIds = new Set(config.cards.map(c => c.id));
    drawHistory = (state.drawHistory || []).filter(item => validIds.has(item.card.id));
  }catch(e){ drawHistory = []; }
}

function recomputeAvailable(){
  const used = new Set(drawHistory.map(item => item.card.id));
  availableCards = config.cards.filter(card => !used.has(card.id));
}

function renderCounts(){
  totalCount.textContent = config.cards.length;
  remainingCount.textContent = availableCards.length;
  drawnCount.textContent = drawHistory.length;
}

function renderCurrent(){
  cardBackImage.src = config.card_back_image || '';
  if (!drawHistory.length){
    drawCardEl.classList.remove('flipped');
    resultImage.src = config.card_back_image || '';
    resultTitle.textContent = 'Ready';
    resultSubtitle.textContent = '尚未抽卡';
    resultOwner.textContent = '請先輸入名字';
    return;
  }
  const last = drawHistory[drawHistory.length - 1];
  drawCardEl.classList.add('flipped');
  resultImage.src = last.card.image || config.card_back_image || '';
  resultTitle.textContent = last.card.title || '';
  resultSubtitle.textContent = last.card.subtitle || '';
  resultOwner.textContent = `${last.name} 抽到這張卡`;
}

function renderHistory(){
  if (!drawHistory.length){
    historyList.innerHTML = '<div class="empty">目前還沒有抽卡紀錄。</div>';
    return;
  }
  historyList.innerHTML = drawHistory.map((item, idx) => `
    <div class="history-item">
      <div>
        <div class="history-name">${item.name}</div>
        <div class="history-card">${item.card.title}｜${item.card.subtitle || ''}</div>
      </div>
      <div class="history-index">#${idx + 1}</div>
    </div>
  `).join('');
}

function refresh(){
  recomputeAvailable();
  renderCounts();
  renderCurrent();
  renderHistory();
  saveState();
}

function validateName(name){
  if (!name){ alert('請先輸入名字。'); return false; }
  if (!availableCards.length){ alert('沒有剩餘卡片了。'); return false; }
  if (config.allow_same_name_once && drawHistory.some(item => item.name === name)){
    alert('這個名字已經抽過了。');
    return false;
  }
  return true;
}

function spawnSparkles(){
  const points = [
    {x: 110, y: 160}, {x: 50, y: 210}, {x: 175, y: 220}, {x: 205, y: 145}
  ];
  points.forEach((p, i) => {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = `calc(50% - 115px + ${p.x}px)`;
    s.style.top = `${p.y}px`;
    s.style.animationDelay = `${i * 0.05}s`;
    drawStage.appendChild(s);
    requestAnimationFrame(() => s.classList.add('show'));
    setTimeout(() => s.remove(), 700);
  });
}

function resetAnimationClasses(){
  drawCardEl.classList.remove('pulling', 'revealing');
  void drawCardEl.offsetWidth;
}

function drawCard(){
  const name = nameInput.value.trim();
  if (!validateName(name)) return;

  drawBtn.disabled = true;
  drawBtn.textContent = '抽卡中…';
  drawCardEl.classList.remove('flipped');
  resetAnimationClasses();
  drawCardEl.classList.add('pulling');

  setTimeout(() => {
    drawCardEl.classList.remove('pulling');
    drawCardEl.classList.add('revealing');
    spawnSparkles();
  }, 520);

  setTimeout(() => {
    const index = randomIndex(availableCards.length);
    const card = availableCards.splice(index, 1)[0];
    drawHistory.push({ name, card });
    resultImage.src = card.image || config.card_back_image || '';
    resultTitle.textContent = card.title || '';
    resultSubtitle.textContent = card.subtitle || '';
    resultOwner.textContent = `${name} 抽到這張卡`;
    drawCardEl.classList.add('flipped');
  }, 900);

  setTimeout(() => {
    nameInput.value = '';
    refresh();
    drawBtn.disabled = false;
    drawBtn.textContent = '再抽一次';
    drawCardEl.classList.remove('revealing');
  }, 1500);
}

function undoLast(){
  if (!drawHistory.length){ alert('目前沒有可以撤銷的紀錄。'); return; }
  drawHistory.pop();
  refresh();
}

function resetAll(){
  const ok = confirm('確定要清空所有抽卡紀錄嗎？');
  if (!ok) return;
  drawHistory = [];
  refresh();
}

async function init(){
  const res = await fetch('cards.json');
  config = await res.json();
  appTitle.textContent = config.app_title || '抽卡活動';
  appSubtitle.textContent = config.app_subtitle || 'Reusable card draw website';
  appBadge.textContent = config.badge_text || 'Reusable Card Draw';
  cardBackImage.src = config.card_back_image || '';
  restoreState();
  refresh();
}

drawBtn.addEventListener('click', drawCard);
undoBtn.addEventListener('click', undoLast);
resetBtn.addEventListener('click', resetAll);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') drawCard(); });

init();
