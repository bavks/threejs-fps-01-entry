import { WEAPONS, GRENADES, ARMOR } from './weapons.js';

export const BUY_ITEMS = [{ item: 'rook', key: '1', code: 'Digit1' }, { item: 'mastiff', key: '2', code: 'Digit2' }, { item: 'adder', key: '3', code: 'Digit3' }, { item: 'osprey', key: '4', code: 'Digit4' }, { item: 'falcon', key: '5', code: 'Digit5' }, { item: 'egret', key: '6', code: 'Digit6' }, { item: 'bison', key: '7', code: 'Digit7' }, { item: 'pike', key: '8', code: 'Digit8' }, { item: 'armor1', key: '9', code: 'Digit9' }, { item: 'armor2', key: '0', code: 'Digit0' }, { item: 'he', key: '-', code: 'Minus' }, { item: 'flash', key: '=', code: 'Equal' }];

export function itemInfo(item) {
  if (WEAPONS[item]) { const w = WEAPONS[item]; return { name: w.name, price: w.price, blurb: w.blurb }; }
  if (GRENADES[item]) { const g = GRENADES[item]; return { name: g.name, price: g.price, blurb: g.blurb }; }
  const a = ARMOR[item === 'armor1' ? 1 : 2];
  return { name: a.name, price: a.price, blurb: a.blurb };
}

const $ = (id) => document.getElementById(id);
const fmt = (n) => '$' + Number(n).toLocaleString('en-US');
function show(el, on) { if (el) el.classList.toggle('show', !!on); }
function txt(id, v) { const el = $(id); if (el) el.textContent = v; }
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function createHud() {
  const hud = { onPlay: null, onBuy: null, onResume: null, onRestart: null, onPickGun: null, onMenu: null };
  let bannerT = 0, callT = 0, hitT = 0, dmgT = 0;
  let loadBtns = [], buyBtns = [];

  // --- minimap ---
  const mm = $('minimap');
  const mctx = mm ? mm.getContext('2d') : null;
  const base = document.createElement('canvas');
  base.width = 352; base.height = 268;
  const bctx = base.getContext('2d');
  const mmX = (x) => 1.5 + (x + 34.6) * 2.5;
  const mmY = (z) => 0.5 + (z + 26.6) * 2.5;
  const posOf = (a) => ({ x: a.x ?? a.pos?.x ?? 0, z: a.z ?? a.pos?.z ?? 0 });

  function dot(c, x, z, r, col) {
    c.beginPath();
    c.arc(mmX(x), mmY(z), r, 0, 7);
    c.fillStyle = col;
    c.fill();
  }

  hud.setHealth = (hp, armorTier) => {
    const f = $('health-fill');
    if (f) { f.style.width = Math.max(0, Math.min(100, hp)) + '%'; f.classList.toggle('urgent', hp <= 30); }
    txt('health-num', Math.max(0, Math.ceil(hp)));
    const a = ARMOR[armorTier];
    txt('armor-num', a ? a.name : '—');
  };
  hud.setAmmo = (mag, reserve, name) => {
    txt('ammo-mag', mag);
    txt('ammo-reserve', reserve);
    txt('ammo-name', name);
    const el = $('ammo');
    if (el) el.classList.toggle('empty', mag === 0);
  };
  hud.setMoney = (n) => txt('money', fmt(n));
  hud.buildMinimap = (colliders, sites) => {
    if (!mctx) return;
    mm.width = 352; mm.height = 268;
    bctx.setTransform(2, 0, 0, 2, 0, 0);
    bctx.fillStyle = '#10161c';
    bctx.fillRect(0, 0, 176, 134);
    for (const c of colliders || []) {
      const sh = 70 + Math.min(90, (c.maxY || 1) * 18);
      bctx.fillStyle = `rgb(${sh | 0},${sh | 0},${(sh + 6) | 0})`;
      bctx.fillRect(mmX(c.minX), mmY(c.minZ), (c.maxX - c.minX) * 2.5, (c.maxZ - c.minZ) * 2.5);
    }
    for (const s of sites || []) {
      bctx.beginPath();
      bctx.arc(mmX(s.x), mmY(s.z), s.r * 2.5, 0, 7);
      bctx.strokeStyle = '#eda273';
      bctx.lineWidth = 1.5;
      bctx.stroke();
      bctx.fillStyle = '#eda273';
      bctx.font = 'bold 9px sans-serif';
      bctx.textAlign = 'center';
      bctx.fillText(String(s.id), mmX(s.x), mmY(s.z) + 3);
    }
  };
  hud.showMinimap = (on) => show(mm, on);
  hud.drawMinimap = (player, actors, targets, yaw, ffa) => {
    if (!mctx) return;
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.drawImage(base, 0, 0);
    mctx.setTransform(2, 0, 0, 2, 0, 0);
    for (const t of targets || []) { const p = posOf(t); dot(mctx, p.x, p.z, 2, '#ff5040'); }
    const pt = player ? player.team ?? 0 : 0;
    for (const a of actors || []) {
      if (a.alive === false) continue;
      const p = posOf(a);
      let col = '#ff5040';
      if (!ffa && (a.team ?? 0) === pt) col = (a.team ?? 0) === 0 ? '#eda273' : '#7fc6cc';
      dot(mctx, p.x, p.z, 2.5, col);
    }
    if (player) {
      const p = posOf(player);
      mctx.save();
      mctx.translate(mmX(p.x), mmY(p.z));
      mctx.rotate(-(yaw || 0));
      mctx.beginPath();
      mctx.moveTo(0, -5); mctx.lineTo(3.6, 4); mctx.lineTo(-3.6, 4); mctx.closePath();
      mctx.fillStyle = '#ffffff';
      mctx.fill();
      mctx.restore();
    }
    mctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  hud.setTimer = (text, urgent) => {
    txt('timer', text);
    const el = $('timer');
    if (el) el.classList.toggle('urgent', !!urgent);
  };
  hud.setScores = (s0, s1, roundText) => {
    txt('score-0', s0); txt('score-1', s1); txt('round-label', roundText);
  };
  hud.setLabels = (a, b) => { txt('label-0', a); txt('label-1', b); };
  hud.showMoney = (on) => show($('money'), on);
  hud.setRange = (text) => txt('range-info', text);
  hud.buildLoadout = (items) => {
    const el = $('loadout');
    if (!el) return;
    el.innerHTML = '';
    loadBtns = [];
    for (const it of items || []) {
      const info = itemInfo(it.id);
      const b = document.createElement('button');
      b.dataset.id = it.id;
      b.textContent = `${it.key} — ${info.name}`;
      b.addEventListener('click', () => { if (hud.onPickGun) hud.onPickGun(it.id); });
      el.appendChild(b);
      loadBtns.push(b);
    }
  };
  hud.showLoadout = (selId) => {
    show($('loadout'), true);
    for (const b of loadBtns) b.classList.toggle('on', b.dataset.id === selId);
  };
  hud.hideLoadout = () => show($('loadout'), false);
  hud.setSpread = (px) => {
    const el = $('crosshair');
    if (el) el.style.setProperty('--sp', px + 'px');
  };
  hud.hitmarker = (kill) => {
    const el = $('hitmarker');
    if (!el) return;
    el.classList.add('show');
    el.classList.toggle('urgent', !!kill);
    clearTimeout(hitT);
    hitT = setTimeout(() => el.classList.remove('show'), 130);
  };
  hud.addKill = (html) => {
    const feed = $('killfeed');
    if (!feed) return;
    const d = document.createElement('div');
    d.innerHTML = html;
    feed.appendChild(d);
    while (feed.children.length > 5) feed.removeChild(feed.firstChild);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 6000);
  };
  hud.clearKillfeed = () => { const f = $('killfeed'); if (f) f.innerHTML = ''; };
  hud.banner = (title, sub, ms = 2600) => {
    txt('banner-title', title);
    txt('banner-sub', sub || '');
    show($('banner'), true);
    clearTimeout(bannerT);
    bannerT = setTimeout(() => show($('banner'), false), ms);
  };
  hud.callout = (title, hot, sub) => {
    txt('callout-title', title);
    txt('callout-sub', sub || '');
    const el = $('callout');
    if (el) el.classList.toggle('urgent', !!hot);
    show(el, true);
    clearTimeout(callT);
    callT = setTimeout(() => show(el, false), 3000);
  };
  hud.prompt = (text) => {
    const el = $('prompt');
    if (!el) return;
    el.textContent = text || '';
    show(el, !!text);
  };
  hud.channel = (frac, label) => {
    const el = $('channel');
    if (!el) return;
    show(el, frac != null);
    if (frac == null) return;
    const f = $('channel-fill');
    if (f) f.style.width = (clamp01(frac) * 100) + '%';
    txt('channel-label', label || '');
  };
  hud.setBomb = (site) => {
    const el = $('bomb-status');
    if (!el) return;
    el.textContent = site == null ? '' : `BOMB — SITE ${site}`;
    show(el, site != null);
  };
  hud.setCarrier = (has) => show($('carrier-tag'), !!has);
  hud.damageFlash = () => {
    const el = $('damage-flash');
    if (!el) return;
    el.classList.add('show');
    clearTimeout(dmgT);
    dmgT = setTimeout(() => el.classList.remove('show'), 180);
  };
  hud.setBlind = (frac) => {
    const el = $('blind-flash');
    if (!el) return;
    el.style.opacity = String(clamp01(frac || 0));
    show(el, (frac || 0) > 0.02);
  };
  hud.setScope = (on, optic, label) => {
    const el = $('scope');
    show(el, !!on);
    if (!el) return;
    const z = $('scope-zoom');
    if (z) { z.textContent = label || ''; z.style.display = optic === 'scope' ? '' : 'none'; }
    el.classList.toggle('on', optic === 'dot');
  };
  hud.setSpectate = (text) => {
    const el = $('spectate');
    if (!el) return;
    el.textContent = text ? `SPECTATING ${text}` : '';
    show(el, !!text);
  };
  hud.showMenu = () => show($('menu'), true);
  hud.hideMenu = () => show($('menu'), false);
  hud.showPause = () => show($('pause'), true);
  hud.hidePause = () => show($('pause'), false);
  hud.showOver = (title, sub) => {
    txt('over-title', title);
    txt('over-sub', sub || '');
    show($('matchover'), true);
  };
  hud.hideOver = () => show($('matchover'), false);
  hud.buildBuy = () => {
    const grid = $('buy-grid');
    if (!grid) return;
    grid.innerHTML = '';
    buyBtns = [];
    for (const bi of BUY_ITEMS) {
      const info = itemInfo(bi.item);
      const b = document.createElement('button');
      b.dataset.item = bi.item;
      b.textContent = `${bi.key} · ${info.name} — ${fmt(info.price)}`;
      b.title = info.blurb || '';
      b.addEventListener('click', () => { if (hud.onBuy) hud.onBuy(bi.item); });
      grid.appendChild(b);
      buyBtns.push(b);
    }
  };
  hud.refreshBuy = (actor, canBuyNow) => {
    txt('buy-money', fmt(actor.money));
    txt('buy-note', canBuyNow ? '' : 'Buy phase closed');
    const counts = (actor.loadout && actor.loadout.grenades) || actor.grenades || {};
    const primary = actor.loadout ? actor.loadout.primary : null;
    const armor = actor.loadout ? actor.loadout.armor || 0 : 0;
    for (const b of buyBtns) {
      const item = b.dataset.item;
      const info = itemInfo(item);
      let off = !canBuyNow || info.price > actor.money;
      if (WEAPONS[item] && primary === item) off = true;
      if (item === 'armor1' && armor >= 1) off = true;
      if (item === 'armor2' && armor >= 2) off = true;
      if ((item === 'he' || item === 'flash') && (counts[item] || 0) >= 2) off = true;
      b.disabled = off;
    }
  };
  hud.showBuy = () => show($('buy'), true);
  hud.hideBuy = () => show($('buy'), false);
  hud.buyOpen = () => {
    const el = $('buy');
    return !!el && el.classList.contains('show');
  };
  return hud;
}
