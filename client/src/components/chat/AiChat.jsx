import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

  :root {
    --c-bg:        #030303;
    --c-surface:   rgba(10, 10, 10, 0.7);
    --c-panel:     rgba(255, 255, 255, 0.03);
    --c-panel2:    rgba(255, 255, 255, 0.05);
    --c-border:    rgba(255,255,255,0.08);
    --c-border2:   rgba(255,255,255,0.12);
    --c-red:       #e63946;
    --c-red2:      #ff007a;
    --c-red3:      #ff9999;
    --c-red-glow:  rgba(230,57,70,0.3);
    --c-red-deep:  rgba(230,57,70,0.08);
    --c-green:     #39d98a;
    --c-blue:      #00e5ff;
    --c-gold:      #ffd166;
    --c-muted:     rgba(255,255,255,0.35);
    --c-muted2:    rgba(255,255,255,0.55);
    --c-text:      rgba(255,255,255,0.88);
    --c-white:     #ffffff;
    --font-body:   'Outfit', sans-serif;
    --font-head:   'Orbitron', sans-serif;
    --radius:      24px;
    --radius-sm:   14px;
    --shadow:      0 32px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06);
  }

  .su * { box-sizing:border-box; margin:0; padding:0; }
  .su { font-family: var(--font-body); }

  /* ── FAB ── */
  .su-fab {
    position:fixed; bottom:28px; right:28px;
    width:62px; height:62px; border-radius:18px;
    background: linear-gradient(145deg,#e63946,#c1121f);
    border:none; cursor:pointer; z-index:9998;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 8px 32px rgba(230,57,70,0.5), 0 0 0 0 rgba(230,57,70,0.3);
    transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
    color:#fff; font-size:1.4rem;
    animation: fab-breathe 4s ease infinite;
  }
  .su-fab:hover { transform:scale(1.12) rotate(-8deg); box-shadow:0 12px 48px rgba(230,57,70,0.65), 0 0 0 12px rgba(230,57,70,0.12); }
  .su-fab-badge {
    position:absolute; top:-5px; right:-5px;
    background:var(--c-green); color:#000;
    border-radius:50%; width:24px; height:24px;
    font-size:0.7rem; font-weight:800;
    display:flex; align-items:center; justify-content:center;
    font-family:var(--font-head); border:2.5px solid var(--c-bg);
    animation: badge-pop .4s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes fab-breathe {
    0%,100% { box-shadow:0 8px 32px rgba(230,57,70,0.5), 0 0 0 0 rgba(230,57,70,0.2); }
    50%      { box-shadow:0 8px 32px rgba(230,57,70,0.5), 0 0 0 14px rgba(230,57,70,0); }
  }
  @keyframes badge-pop {
    0% { transform:scale(0) rotate(-30deg); }
    100% { transform:scale(1) rotate(0); }
  }

  /* ── PANEL ── */
  .su-panel {
    position:fixed; bottom:104px; right:28px;
    width:420px; max-width:calc(100vw - 24px);
    height:660px; max-height:calc(100dvh - 130px);
    background:rgba(10, 10, 10, 0.7);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:24px; z-index:9997;
    display:flex; flex-direction:column;
    box-shadow:var(--shadow);
    overflow:hidden;
    animation: panel-in .4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
  }
  /* Scanline overlay */
  .su-panel::before {
    content:''; position:absolute; inset:0; border-radius:24px;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px);
    pointer-events:none; z-index:0; opacity:.4;
  }
  .su-panel > * { position:relative; z-index:1; }

  @keyframes panel-in {
    from { opacity:0; transform:translateY(32px) scale(0.92); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  /* ── HEADER ── */
  .su-header {
    padding:14px 16px 12px;
    background: linear-gradient(160deg,rgba(230,57,70,0.15) 0%,rgba(14,14,30,0) 100%);
    border-bottom:1px solid var(--c-border);
    display:flex; align-items:center; gap:12px;
    flex-shrink:0; position:relative; overflow:hidden;
  }
  .su-header::before {
    content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg, transparent 0%, var(--c-red) 40%, var(--c-red2) 60%, transparent 100%);
    opacity:.5;
  }
  /* Moving particle lines in header */
  .su-header::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg, transparent, rgba(230,57,70,0.06), transparent);
    animation: header-sweep 4s linear infinite;
  }
  @keyframes header-sweep {
    0% { left:-60%; } 100% { left:160%; }
  }
  .su-avatar {
    width:44px; height:44px; border-radius:14px;
    background:linear-gradient(145deg,var(--c-red),#c1121f);
    display:flex; align-items:center; justify-content:center;
    font-size:1.15rem; flex-shrink:0;
    box-shadow:0 4px 20px rgba(230,57,70,0.45);
    position:relative; overflow:hidden;
  }
  .su-avatar::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
  }
  .su-status-dot {
    width:8px; height:8px; border-radius:50%;
    background:var(--c-green); display:inline-block; margin-right:5px;
    box-shadow:0 0 8px var(--c-green);
    animation:dot-pulse 2.5s ease infinite;
  }
  @keyframes dot-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:.6; transform:scale(0.85); }
  }

  /* ── TABS ── */
  .su-tabs {
    display:flex; gap:2px; padding:8px 12px 0;
    border-bottom:1px solid var(--c-border); flex-shrink:0;
    background:var(--c-surface);
  }
  .su-tab {
    flex:1; padding:7px 0; text-align:center; font-size:.72rem;
    font-family:var(--font-head); font-weight:600; letter-spacing:.04em;
    text-transform:uppercase; border:none; background:none;
    color:var(--c-muted2); cursor:pointer; border-radius:8px 8px 0 0;
    transition:all .2s; position:relative;
  }
  .su-tab.active { color:var(--c-red2); background:rgba(230,57,70,0.08); }
  .su-tab.active::after {
    content:''; position:absolute; bottom:-1px; left:0; right:0; height:2px;
    background:linear-gradient(90deg,var(--c-red),var(--c-red2));
    border-radius:2px 2px 0 0;
  }
  .su-tab:hover:not(.active) { color:var(--c-text); background:rgba(255,255,255,0.04); }

  /* ── MESSAGES ── */
  .su-messages {
    flex:1; overflow-y:auto; padding:14px 12px;
    display:flex; flex-direction:column; gap:12px;
    scroll-behavior:smooth;
  }
  .su-messages::-webkit-scrollbar { width:3px; }
  .su-messages::-webkit-scrollbar-track { background:transparent; }
  .su-messages::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:3px; }

  /* ── BUBBLES ── */
  .su-msg-row {
    display:flex; align-items:flex-end; gap:8px;
    animation:msg-in .3s cubic-bezier(.22,1,.36,1) forwards;
  }
  .su-msg-row.user { flex-direction:row-reverse; }
  @keyframes msg-in {
    from { opacity:0; transform:translateY(12px) scale(.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  .su-msg-icon {
    width:28px; height:28px; border-radius:9px;
    background:linear-gradient(145deg,var(--c-red),#c1121f);
    display:flex; align-items:center; justify-content:center;
    font-size:.65rem; flex-shrink:0; color:#fff;
    box-shadow:0 2px 10px rgba(230,57,70,0.35);
  }
  .su-bubble {
    max-width:80%; padding:11px 14px;
    font-size:.845rem; line-height:1.7; color:var(--c-text);
  }
  .su-bubble.bot {
    background:var(--c-panel);
    border:1px solid var(--c-border2);
    border-radius:16px 16px 16px 3px;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
  }
  .su-bubble.user {
    background:linear-gradient(145deg,var(--c-red),#c1121f);
    border-radius:16px 16px 3px 16px;
    color:#fff; box-shadow:0 4px 20px rgba(230,57,70,0.35);
  }
  .su-bubble-time {
    font-size:.62rem; margin-top:5px; opacity:.4;
    display:flex; align-items:center; gap:4px;
  }
  .su-bubble.user .su-bubble-time { justify-content:flex-end; }
  .su-tick { font-size:.65rem; }

  /* ── TYPING ── */
  .su-typing {
    display:flex; align-items:center; gap:5px; padding:12px 16px;
    background:var(--c-panel); border:1px solid var(--c-border2);
    border-radius:16px 16px 16px 3px; width:fit-content;
  }
  .su-dot { width:7px; height:7px; border-radius:50%; background:var(--c-red); }
  .su-dot:nth-child(1) { animation:bounce-dot 1.3s .0s infinite; }
  .su-dot:nth-child(2) { animation:bounce-dot 1.3s .2s infinite; }
  .su-dot:nth-child(3) { animation:bounce-dot 1.3s .4s infinite; }
  @keyframes bounce-dot {
    0%,60%,100% { transform:translateY(0); opacity:.4; }
    30%          { transform:translateY(-8px); opacity:1; }
  }

  /* ── CHIPS ── */
  .su-chips { display:flex; flex-wrap:wrap; gap:5px; margin-top:9px; }
  .su-chip {
    padding:5px 11px; border-radius:999px; font-size:.72rem;
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.1);
    color:rgba(255,255,255,0.6); cursor:pointer; font-weight:500;
    transition:all .18s; font-family:var(--font-body);
  }
  .su-chip:hover {
    background:rgba(230,57,70,0.12); border-color:rgba(230,57,70,0.4);
    color:#fff; transform:translateY(-1px);
  }

  /* ── PRODUCT CARDS ── */
  .su-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:10px; }
  .su-card {
    background:linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));
    border:1px solid var(--c-border); border-radius:12px;
    padding:10px 11px; cursor:pointer; transition:all .22s;
    position:relative; overflow:hidden;
  }
  .su-card::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,var(--c-red),transparent);
    opacity:0; transition:opacity .22s; border-radius:12px;
  }
  .su-card:hover { border-color:var(--c-red); transform:translateY(-2px) scale(1.01); box-shadow:0 8px 24px rgba(230,57,70,0.2); }
  .su-card:hover::before { opacity:.06; }
  .su-card-icon { font-size:1.2rem; margin-bottom:4px; }
  .su-card-cat { font-size:.6rem; color:var(--c-muted); margin-bottom:3px; text-transform:uppercase; letter-spacing:.06em; }
  .su-card-name { font-family:var(--font-head); font-size:.78rem; font-weight:700; color:#fff; margin-bottom:3px; letter-spacing:.02em; }
  .su-card-price { font-size:.7rem; color:var(--c-red2); font-weight:600; }
  .su-card-badge {
    position:absolute; top:7px; right:7px;
    font-size:.55rem; padding:2px 6px; border-radius:999px;
    background:rgba(74,222,128,0.15); color:var(--c-green);
    border:1px solid rgba(74,222,128,0.25); font-weight:700;
    font-family:var(--font-head); letter-spacing:.05em;
  }

  /* ── PRICE TABLE ── */
  .su-ptable { width:100%; border-collapse:collapse; margin-top:8px; font-size:.78rem; }
  .su-ptable tr { border-bottom:1px solid rgba(255,255,255,0.05); }
  .su-ptable tr:last-child { border:none; }
  .su-ptable td { padding:5px 0; }
  .su-ptable td:last-child { text-align:right; color:var(--c-red2); font-weight:700; }
  .su-ptable tr:hover td { background:rgba(255,255,255,0.02); }
  .su-ptable .best td { color:var(--c-gold); }
  .su-ptable .best td:last-child { color:var(--c-gold); }

  /* ── ORDER STEPS ── */
  .su-steps { margin-top:8px; display:flex; flex-direction:column; gap:6px; }
  .su-step { display:flex; align-items:flex-start; gap:10px; padding:6px 0; }
  .su-step-n {
    width:22px; height:22px; border-radius:7px; flex-shrink:0;
    background:linear-gradient(145deg,var(--c-red),#c1121f);
    font-size:.65rem; font-weight:800; display:flex; align-items:center; justify-content:center;
    font-family:var(--font-head); color:#fff; box-shadow:0 2px 8px rgba(230,57,70,0.4);
  }
  .su-step-body { font-size:.8rem; line-height:1.55; color:var(--c-text); }
  .su-step-body strong { color:var(--c-red2); }

  /* ── STAT ROW ── */
  .su-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:8px; }
  .su-stat {
    background:rgba(255,255,255,0.03); border:1px solid var(--c-border);
    border-radius:10px; padding:8px; text-align:center;
  }
  .su-stat-val { font-family:var(--font-head); font-size:1.1rem; font-weight:700; color:var(--c-red2); }
  .su-stat-lbl { font-size:.58rem; color:var(--c-muted); margin-top:2px; text-transform:uppercase; letter-spacing:.05em; }

  /* ── TAGS ── */
  .su-tag {
    display:inline-block; padding:2px 8px; border-radius:999px;
    font-size:.64rem; font-weight:700; font-family:var(--font-head);
    letter-spacing:.04em; margin-right:3px; vertical-align:middle;
  }
  .su-tag.red   { background:rgba(230,57,70,0.15); color:var(--c-red2); border:1px solid rgba(230,57,70,0.25); }
  .su-tag.green { background:rgba(57,217,138,0.12); color:var(--c-green); border:1px solid rgba(57,217,138,0.25); }
  .su-tag.gold  { background:rgba(255,209,102,0.12); color:var(--c-gold); border:1px solid rgba(255,209,102,0.25); }
  .su-tag.blue  { background:rgba(79,195,247,0.12); color:var(--c-blue); border:1px solid rgba(79,195,247,0.25); }

  /* ── COMPARE TABLE ── */
  .su-compare { width:100%; border-collapse:collapse; margin-top:8px; font-size:.74rem; }
  .su-compare th { padding:5px 8px; text-align:left; font-family:var(--font-head); font-weight:600; letter-spacing:.04em; color:var(--c-muted2); border-bottom:1px solid var(--c-border2); }
  .su-compare th:last-child { text-align:right; }
  .su-compare td { padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.04); }
  .su-compare td:last-child { text-align:right; color:var(--c-red2); font-weight:600; }
  .su-compare tr.highlight td { color:var(--c-gold); }
  .su-compare tr:hover td { background:rgba(255,255,255,0.02); }

  /* ── ALERT BOX ── */
  .su-alert {
    padding:9px 12px; border-radius:10px; font-size:.78rem;
    display:flex; gap:8px; align-items:flex-start; margin-top:6px;
  }
  .su-alert.warn { background:rgba(255,209,102,0.08); border:1px solid rgba(255,209,102,0.2); color:var(--c-gold); }
  .su-alert.info { background:rgba(79,195,247,0.08); border:1px solid rgba(79,195,247,0.2); color:var(--c-blue); }
  .su-alert.success { background:rgba(57,217,138,0.08); border:1px solid rgba(57,217,138,0.2); color:var(--c-green); }
  .su-alert.danger { background:rgba(230,57,70,0.1); border:1px solid rgba(230,57,70,0.25); color:#ff9999; }

  /* ── QUICK REPLIES ── */
  .su-quick {
    padding:8px 12px 6px; display:flex; flex-wrap:wrap; gap:6px; flex-shrink:0;
    border-top:1px solid var(--c-border);
    background:linear-gradient(0deg,var(--c-bg),transparent);
  }
  .su-qbtn {
    padding:6px 12px; border-radius:999px; font-size:.74rem;
    background:rgba(230,57,70,0.07); border:1px solid rgba(230,57,70,0.2);
    color:#ffb3b3; cursor:pointer; font-weight:500; transition:all .15s;
    font-family:var(--font-body); white-space:nowrap;
  }
  .su-qbtn:hover { background:rgba(230,57,70,0.18); border-color:rgba(230,57,70,0.5); color:#fff; transform:translateY(-1px); }

  /* ── CATALOG TAB ── */
  .su-catalog { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
  .su-catalog::-webkit-scrollbar { width:3px; }
  .su-catalog::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:3px; }
  .su-cat-section-title {
    font-family:var(--font-head); font-size:.7rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.08em; color:var(--c-muted);
    padding:4px 0; border-bottom:1px solid var(--c-border); margin-bottom:4px;
  }
  .su-catalog-card {
    background:var(--c-panel); border:1px solid var(--c-border2);
    border-radius:14px; padding:13px 14px; cursor:pointer; transition:all .2s;
    position:relative; overflow:hidden;
  }
  .su-catalog-card:hover { border-color:rgba(230,57,70,0.4); background:var(--c-panel2); box-shadow:0 8px 28px rgba(0,0,0,0.4); }
  .su-catalog-card-header { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .su-catalog-card-icon {
    width:38px; height:38px; border-radius:11px; flex-shrink:0;
    background:linear-gradient(145deg,var(--c-red),#c1121f);
    display:flex; align-items:center; justify-content:center; font-size:1rem;
    box-shadow:0 3px 12px rgba(230,57,70,0.35);
  }
  .su-catalog-card-name { font-family:var(--font-head); font-weight:700; font-size:.9rem; color:#fff; letter-spacing:.02em; }
  .su-catalog-card-desc { font-size:.75rem; color:var(--c-muted2); line-height:1.5; }
  .su-price-pills { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }
  .su-price-pill {
    padding:4px 10px; border-radius:8px; font-size:.68rem; font-weight:600;
    background:rgba(230,57,70,0.1); border:1px solid rgba(230,57,70,0.2);
    color:var(--c-red3); font-family:var(--font-head); letter-spacing:.02em;
    cursor:pointer; transition:all .15s;
  }
  .su-price-pill:hover { background:rgba(230,57,70,0.25); color:#fff; transform:translateY(-1px); }
  .su-price-pill.best { background:rgba(255,209,102,0.12); border-color:rgba(255,209,102,0.3); color:var(--c-gold); }

  /* ── SUPPORT TAB ── */
  .su-support { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
  .su-support::-webkit-scrollbar { width:3px; }
  .su-support::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:3px; }
  .su-contact-card {
    background:var(--c-panel); border:1px solid var(--c-border2);
    border-radius:14px; padding:13px 14px; display:flex; align-items:center; gap:12px;
    cursor:pointer; transition:all .2s; text-decoration:none; color:inherit;
  }
  .su-contact-card:hover { border-color:rgba(57,217,138,0.4); background:rgba(57,217,138,0.05); transform:translateX(3px); }
  .su-contact-icon {
    width:42px; height:42px; border-radius:12px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; font-size:1.1rem;
  }
  .su-contact-icon.wa   { background:rgba(37,211,102,0.15); color:#25D366; }
  .su-contact-icon.mail { background:rgba(79,195,247,0.12); color:var(--c-blue); }
  .su-contact-icon.tk   { background:rgba(255,0,80,0.1); color:#ff0050; }
  .su-contact-icon.ig   { background:rgba(225,48,108,0.1); color:#E1306C; }
  .su-contact-meta-name { font-family:var(--font-head); font-weight:700; font-size:.9rem; color:#fff; }
  .su-contact-meta-val { font-size:.75rem; color:var(--c-muted2); margin-top:1px; }
  .su-contact-arrow { margin-left:auto; color:var(--c-muted); font-size:.8rem; }
  .su-faq-item { background:var(--c-panel); border:1px solid var(--c-border); border-radius:12px; overflow:hidden; }
  .su-faq-q {
    padding:11px 14px; font-size:.82rem; color:var(--c-text); cursor:pointer;
    display:flex; justify-content:space-between; align-items:center; transition:background .15s;
    font-weight:500;
  }
  .su-faq-q:hover { background:rgba(255,255,255,0.03); }
  .su-faq-a { padding:0 14px 12px; font-size:.79rem; color:var(--c-muted2); line-height:1.65; }
  .su-section-label {
    font-family:var(--font-head); font-size:.68rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.1em; color:var(--c-muted); margin:4px 0 6px;
  }

  /* ── INPUT AREA ── */
  .su-input-area {
    padding:10px 12px 12px; border-top:1px solid var(--c-border);
    background:var(--c-bg); flex-shrink:0;
  }
  .su-input-row { display:flex; gap:8px; align-items:flex-end; }
  .su-input {
    flex:1; background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:13px; padding:11px 14px;
    color:var(--c-text); font-size:.875rem; font-family:var(--font-body);
    outline:none; resize:none; max-height:100px; overflow-y:auto;
    line-height:1.55; transition:border-color .2s, box-shadow .2s;
  }
  .su-input:focus { border-color:rgba(230,57,70,0.45); box-shadow:0 0 0 3px rgba(230,57,70,0.09); }
  .su-input::placeholder { color:rgba(255,255,255,0.24); }
  .su-send {
    width:42px; height:42px; border-radius:13px; flex-shrink:0;
    border:none; cursor:pointer; font-size:.9rem;
    display:flex; align-items:center; justify-content:center; transition:all .2s; color:#fff;
  }
  .su-send.on  { background:linear-gradient(145deg,var(--c-red),#c1121f); box-shadow:0 4px 18px rgba(230,57,70,0.45); }
  .su-send.on:hover { transform:scale(1.08) rotate(5deg); }
  .su-send.off { background:rgba(255,255,255,0.05); cursor:not-allowed; opacity:.35; }
  .su-input-footer { display:flex; align-items:center; justify-content:space-between; margin-top:5px; padding:0 2px; }
  .su-input-hint { font-size:.62rem; color:var(--c-muted); display:flex; align-items:center; gap:4px; }

  /* ── EMOTION REACTIONS ── */
  .su-reactions { display:flex; gap:4px; margin-top:6px; }
  .su-react-btn {
    padding:3px 8px; border-radius:999px; font-size:.7rem;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    cursor:pointer; transition:all .15s; color:var(--c-muted2);
  }
  .su-react-btn:hover { background:rgba(255,255,255,0.09); color:#fff; }
  .su-react-btn.active { background:rgba(230,57,70,0.15); border-color:rgba(230,57,70,0.3); color:var(--c-red2); }

  /* ── SCROLLBAR RESTORE ── */
  .su-messages, .su-catalog, .su-support { scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.08) transparent; }

  /* ── COPY BUTTON ── */
  .su-copy-btn {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 8px; border-radius:6px; font-size:.64rem;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
    color:var(--c-muted2); cursor:pointer; transition:all .15s; margin-top:6px;
  }
  .su-copy-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }

  /* ── SHIMMER ── */
  .su-shimmer {
    background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%);
    background-size:800px 100%; animation:shimmer 1.6s infinite; border-radius:8px; height:14px;
  }
  @keyframes shimmer { 0%{background-position:-800px 0} 100%{background-position:800px 0} }

  /* ── CURSOR BLINK ── */
  .su-cursor {
    display:inline-block; width:2px; height:15px; background:var(--c-red2);
    border-radius:1px; margin-left:2px; vertical-align:text-bottom;
    animation:caret .7s ease infinite;
  }
  @keyframes caret { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── BOLD / LINK ── */
  .su-b  { color:#fff; font-weight:700; }
  .su-lk { color:var(--c-red2); font-weight:600; text-decoration:none; border-bottom:1px solid rgba(255,107,107,.25); transition:border-color .15s; }
  .su-lk:hover { border-color:var(--c-red2); }

  /* ── TOAST ── */
  .su-toast {
    position:fixed; bottom:108px; right:28px; z-index:9999;
    background:var(--c-panel); border:1px solid var(--c-border2);
    border-radius:12px; padding:10px 16px;
    font-size:.8rem; color:var(--c-text); display:flex; align-items:center; gap:8px;
    box-shadow:0 8px 32px rgba(0,0,0,0.6);
    animation:toast-in .3s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes toast-in { from{opacity:0;transform:translateY(10px) scale(.95)} to{opacity:1;transform:none} }

  /* ── EMPTY STATE ── */
  .su-empty { text-align:center; padding:28px 16px; color:var(--c-muted); font-size:.82rem; }
  .su-empty-icon { font-size:2rem; margin-bottom:10px; opacity:.4; }

  /* ── PROMO BANNER ── */
  .su-promo {
    margin:8px 0; padding:10px 13px; border-radius:12px;
    background:linear-gradient(135deg,rgba(255,209,102,0.1),rgba(230,57,70,0.1));
    border:1px solid rgba(255,209,102,0.2);
    display:flex; align-items:center; gap:10px; cursor:pointer;
    transition:all .2s;
  }
  .su-promo:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,0.3); }
  .su-promo-text { font-size:.78rem; color:var(--c-gold); font-weight:600; }
  .su-promo-sub  { font-size:.7rem; color:var(--c-muted2); margin-top:2px; }

  /* ── HORIZONTAL RULE ── */
  .su-hr { border:none; border-top:1px solid var(--c-border); margin:8px 0; }

  /* Responsive */
  @media(max-width:440px) {
    .su-panel { right:12px; left:12px; width:auto; border-radius:20px; }
    .su-fab   { bottom:20px; right:20px; }
  }
`;

// ─── SYSTEM PROMPT ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are **SUSANTEDIT Assistant** — a razor-sharp, knowledgeable, and friendly AI support agent for SUSANTEDIT, a Free Fire gaming services store based in Nepal. You are powered by Claude and are one of the most advanced chatbots in Nepal's Free Fire community.

## Your Personality
- Direct, helpful, slightly casual and gamer-savvy tone
- Use gaming slang naturally (bro, noob, OP, meta, clutch, headshot, etc.) when chatting casually
- Be confident, informative, and enthusiastic about gaming
- Never say "I don't know" — always give your best answer or redirect to WhatsApp
- Match language: if user writes Nepali/Romanized Nepali, respond the same way naturally

## Complete Product Catalog

### 🔴 DRIP CLIENT (Panel / Cheat)
Features: Auto headshot, Aimbot, Antiban protection, ESP wallhack, magic bullet
- 1 Day → Rs 299
- 3 Days → Rs 499
- 7 Days → Rs 799
- 15 Days → Rs 899
- 30 Days → Rs 1399
Best for: Beginners and daily grinders

### 🟣 HG CHEATS (Panel / Cheat)
Features: Pro edition, regular auto-updates, antiban, advanced ESP, recoil control
- 1 Day → Rs 399
- 3 Days → Rs 699
- 7 Days → Rs 1199
- 15 Days → Rs 1599
- 30 Days → Rs 1899
Best for: Competitive players who need frequent updates

### 🍎 IOS FLUORITE (iOS Exclusive Panel)
Features: iOS certificate, Auto headshot, Antiban, Aimbot — works on iPhones only
- 1 Day → Rs 699
- 7 Days → Rs 1499
- 30 Days → Rs 3999
- Certificate Only → Rs 999
- Certificate + 32 Days → Rs 6500
Best for: iPhone users (only iOS panel available)

### 🟢 PATO TEAM (Panel / Cheat)
Features: Team-oriented panel, verified safe, squad ESP, auto headshot, antiban
- 3 Days → Rs 699
- 7 Days → Rs 1199
- 15 Days → Rs 1599
- 30 Days → Rs 1899
Best for: Squad/team players, safety-conscious users

### 👑 PRIME HOOK (Premium Custom Panel)
Features: Custom premium panel with advanced features — pricing on request
- Contact via WhatsApp for pricing: +977 9708838261
Best for: Pro players who want the best possible panel

### 💎 Diamond Top-ups (Free Fire Diamonds)
- 50 💎 → Rs 60
- 115 💎 → Rs 110
- 240 💎 → Rs 230
- 480 💎 → Rs 450
- 1090 💎 → Rs 950
- 2530 💎 → Rs 2200
Delivery: 1–5 minutes after payment confirmation

### 👑 Memberships (Free Fire)
- Weekly Lite → Rs 90
- Weekly Member → Rs 220
- Monthly Member → Rs 1050

## Business Information
- **WhatsApp**: +977 9708838261 (24/7 support)
- **Email**: susantedit@gmail.com
- **TikTok**: @vortexeditz34
- **Instagram**: @susantgamerz
- **Operating Hours**: 8:00 AM – 10:00 PM (NPT) daily
- **Payment Methods**: eSewa, Khalti, Bank Transfer (scan QR code provided)
- **Average Response Time**: 10 minutes on WhatsApp

## Delivery Times
- 💎 Diamonds: 1–5 minutes
- 🎮 Panel keys: 5–15 minutes
- ⏳ Admin review (if needed): Up to 40 minutes
- All deliveries happen after payment is confirmed

## Order Flow (Step by Step)
1. Visit the website and sign in with Google
2. Browse and select your product + duration
3. Enter your details: name, TikTok username, WhatsApp number
4. Choose payment method (eSewa, Khalti, or Bank Transfer)
5. Scan the QR code and complete payment
6. Enter your transaction/reference number
7. Admin reviews (usually under 40 min, often instant)
8. Receive your activation key or diamonds via WhatsApp

## Policies
- **Refund Policy**: No refunds after key activation. If item is NOT delivered within 24 hours, contact WhatsApp immediately for resolution.
- **Safety**: All panels have built-in antiban. However, use at your own risk as any cheat carries some risk of detection.
- **Support**: Available 24/7 on WhatsApp. Average response in 10 min.
- **Payment**: All major Nepali digital wallets accepted.

## Common Questions & Answers
- "Is it safe?" → All panels come with antiban protection, but no cheat is 100% guaranteed. Most users have no issues.
- "How do I install?" → After purchase you'll get a key + installation guide via WhatsApp.
- "Does it work on iOS?" → Only IOS FLUORITE works on iOS. All others are Android only.
- "Can I get banned?" → There's antiban built-in, risk is minimal but exists with any third-party tool.
- "What's the best panel?" → Depends on budget. DRIP CLIENT is best value, HG CHEATS best for updates, PATO TEAM best for squads.
- "What if delivery is late?" → Contact WhatsApp +977 9708838261 immediately.
- "Is eSewa available?" → Yes, eSewa, Khalti, and Bank Transfer all accepted.

## Formatting Rules
1. Use **bold** for emphasis on product names and prices
2. Use bullet points for feature lists
3. For price queries, always include a structured price breakdown
4. Always end with 2-4 relevant suggestion chips: [CHIPS: chip1 | chip2 | chip3 | chip4]
5. For comparison queries, give a clear recommendation at the end
6. Use emojis naturally to make responses feel alive
7. If user seems ready to buy, mention they can order directly or contact WhatsApp
8. Keep responses focused and scannable — no walls of text`;

// ─── DATA ────────────────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  '💎 Diamond prices', '🎮 Best panel?', '🛒 How to order',
  '💳 Payment methods', '⚡ Delivery time', '🔒 Is it safe?',
];

const CATALOG = [
  {
    id: 'drip', icon: '🔴', name: 'DRIP CLIENT', tag: 'POPULAR',
    tagColor: 'green', cat: 'Android Panel',
    desc: 'Auto headshot, aimbot, antiban, ESP wallhack, magic bullet.',
    prices: [{ l:'1 Day', v:'Rs 299' }, { l:'3 Days', v:'Rs 499' }, { l:'7 Days', v:'Rs 799' }, { l:'15 Days', v:'Rs 899' }, { l:'30 Days', v:'Rs 1399', best:true }],
  },
  {
    id: 'hg', icon: '🟣', name: 'HG CHEATS', tag: 'UPDATED',
    tagColor: 'blue', cat: 'Android Panel',
    desc: 'Pro edition with regular auto-updates, advanced ESP, recoil control.',
    prices: [{ l:'1 Day', v:'Rs 399' }, { l:'3 Days', v:'Rs 699' }, { l:'7 Days', v:'Rs 1199' }, { l:'15 Days', v:'Rs 1599' }, { l:'30 Days', v:'Rs 1899', best:true }],
  },
  {
    id: 'ios', icon: '🍎', name: 'IOS FLUORITE', tag: 'iOS ONLY',
    tagColor: 'gold', cat: 'iOS Exclusive',
    desc: 'Only iOS panel available. Certificate-based, auto headshot, antiban.',
    prices: [{ l:'1 Day', v:'Rs 699' }, { l:'7 Days', v:'Rs 1499' }, { l:'30 Days', v:'Rs 3999', best:true }, { l:'Cert Only', v:'Rs 999' }, { l:'Cert + 32D', v:'Rs 6500' }],
  },
  {
    id: 'pato', icon: '🟢', name: 'PATO TEAM', tag: 'SAFE',
    tagColor: 'green', cat: 'Squad Panel',
    desc: 'Team-oriented panel, verified safe, squad ESP & auto headshot.',
    prices: [{ l:'3 Days', v:'Rs 699' }, { l:'7 Days', v:'Rs 1199' }, { l:'15 Days', v:'Rs 1599' }, { l:'30 Days', v:'Rs 1899', best:true }],
  },
  {
    id: 'diamond', icon: '💎', name: 'DIAMONDS', tag: 'FAST',
    tagColor: 'blue', cat: 'Free Fire Top-up',
    desc: '50 to 2530 diamonds. Delivered in 1–5 minutes after payment.',
    prices: [{ l:'50 💎', v:'Rs 60' }, { l:'115 💎', v:'Rs 110' }, { l:'240 💎', v:'Rs 230' }, { l:'480 💎', v:'Rs 450' }, { l:'1090 💎', v:'Rs 950' }, { l:'2530 💎', v:'Rs 2200', best:true }],
  },
  {
    id: 'member', icon: '👑', name: 'MEMBERSHIP', tag: 'VALUE',
    tagColor: 'gold', cat: 'Free Fire',
    desc: 'Weekly & monthly memberships at best prices.',
    prices: [{ l:'Weekly Lite', v:'Rs 90' }, { l:'Weekly Member', v:'Rs 220' }, { l:'Monthly', v:'Rs 1050', best:true }],
  },
];

const FAQS = [
  { q: 'Will I get banned using panels?', a: 'All panels include antiban protection. Risk is very low but no cheat is 100% guaranteed. Most users have zero issues. Play smart and don\'t stream.' },
  { q: 'How do I install the panel after purchase?', a: 'After payment you\'ll receive an activation key + full installation guide via WhatsApp within 5–15 minutes.' },
  { q: 'Which panel works on iOS?', a: 'Only IOS FLUORITE works on iPhone. All other panels (DRIP, HG, PATO) are Android-only.' },
  { q: 'What if my order isn\'t delivered?', a: 'Contact WhatsApp (+977 9708838261) within 24 hours of your order. We\'ll resolve it immediately.' },
  { q: 'Can I get a refund?', a: 'No refunds after key activation. However, if your product is undelivered, contact us for a full resolution.' },
  { q: 'Which panel is best for solo ranked?', a: 'DRIP CLIENT for best value, HG CHEATS for most features & updates. Both are excellent for ranked grinding.' },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
function fmt(d) { return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); }

function parseChips(text) {
  const m = text.match(/\[CHIPS:\s*(.+?)\]/);
  if (!m) return { clean: text, chips: [] };
  return {
    clean: text.replace(/\[CHIPS:.*?\]/, '').trim(),
    chips: m[1].split('|').map(c => c.trim()).filter(Boolean),
  };
}

function normalizePrompt(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── LOCAL Q&A ENGINE — no API needed ────────────────────────────────────────
// Covers every common question about SUSANTEDIT products, pricing, ordering, safety

const QA = [
  // ── Panels — best / recommendation ──
  {
    match: q => (q.includes('best') || q.includes('recommend') || q.includes('which')) && (q.includes('panel') || q.includes('cheat')),
    reply: {
      text: `Here are the best panels by use case 🎮\n\n**Best value:** DRIP CLIENT — Rs 299/day, stable, great for daily grind\n**Best features:** HG CHEATS — frequent updates, advanced ESP, recoil control\n**Best for squads:** PATO TEAM — team ESP, verified safe\n**iOS only:** IOS FLUORITE — the only panel that works on iPhone\n\n👉 For ranked grinding: **HG CHEATS** or **DRIP CLIENT**\n👉 On a budget: **DRIP CLIENT** (Rs 299/day)\n👉 iPhone user: **IOS FLUORITE** only`,
      chips: ['DRIP CLIENT prices', 'HG CHEATS prices', 'How to order?', 'Is it safe?']
    }
  },
  // ── DRIP CLIENT ──
  {
    match: q => q.includes('drip'),
    reply: {
      text: `**DRIP CLIENT** 🔴\n\nMost popular panel — best value for daily players.\n\nFeatures: Auto headshot · Aimbot · Antiban · ESP wallhack · Magic bullet\n\n**Prices:**\n- 1 Day → **Rs 299**\n- 3 Days → **Rs 499**\n- 7 Days → **Rs 799**\n- 15 Days → **Rs 899**\n- 30 Days → **Rs 1399** ⭐ Best value\n\nAndroid only.`,
      chips: ['How to order?', 'Is it safe?', 'HG CHEATS prices', 'Payment methods']
    }
  },
  // ── HG CHEATS ──
  {
    match: q => q.includes('hg') || (q.includes('hg') && q.includes('cheat')),
    reply: {
      text: `**HG CHEATS** 🟣\n\nBest for competitive players — frequent updates, strongest feature set.\n\nFeatures: Pro edition · Auto-updates · Antiban · Advanced ESP · Recoil control\n\n**Prices:**\n- 1 Day → **Rs 399**\n- 3 Days → **Rs 699**\n- 7 Days → **Rs 1199**\n- 15 Days → **Rs 1599**\n- 30 Days → **Rs 1899** ⭐ Best value\n\nAndroid only.`,
      chips: ['How to order?', 'DRIP CLIENT prices', 'Is it safe?', 'Payment methods']
    }
  },
  // ── IOS FLUORITE ──
  {
    match: q => q.includes('ios') || q.includes('fluorite') || q.includes('iphone') || q.includes('apple'),
    reply: {
      text: `**IOS FLUORITE** 🍎\n\nThe ONLY panel that works on iPhone — certificate-based.\n\nFeatures: iOS certificate · Auto headshot · Antiban · Aimbot\n\n**Prices:**\n- 1 Day → **Rs 699**\n- 7 Days → **Rs 1499**\n- 30 Days → **Rs 3999** ⭐\n- Certificate Only → **Rs 999**\n- Certificate + 32 Days → **Rs 6500**\n\niPhone users — this is your only option. All other panels are Android only.`,
      chips: ['How to order?', 'Is it safe?', 'Payment methods', 'Best panel for ranked?']
    }
  },
  // ── PATO TEAM ──
  {
    match: q => q.includes('pato'),
    reply: {
      text: `**PATO TEAM** 🟢\n\nBest for squad/team players — verified safe, team-focused features.\n\nFeatures: Squad ESP · Auto headshot · Antiban · Team-oriented tools\n\n**Prices:**\n- 3 Days → **Rs 699**\n- 7 Days → **Rs 1199**\n- 15 Days → **Rs 1599**\n- 30 Days → **Rs 1899** ⭐\n\nAndroid only.`,
      chips: ['How to order?', 'Is it safe?', 'Best panel for ranked?', 'Payment methods']
    }
  },
  // ── PRIME HOOK ──
  {
    match: q => q.includes('prime') || q.includes('hook'),
    reply: {
      text: `**PRIME HOOK** 👑\n\nPremium custom panel — the most advanced option available.\n\nPricing is on request — contact via WhatsApp for a quote.\n\n📱 WhatsApp: **+977 9708838261**\n\nBest for pro players who want the absolute best panel.`,
      chips: ['How to order?', 'WhatsApp contact', 'Best panel for ranked?', 'Payment methods']
    }
  },
  // ── Diamond prices ──
  {
    match: q => q.includes('diamond') && (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('how much') || q.includes('list')),
    reply: {
      text: `**Free Fire Diamond Prices** 💎\n\n- 50 💎 → **Rs 60**\n- 115 💎 → **Rs 110**\n- 240 💎 → **Rs 230**\n- 480 💎 → **Rs 450**\n- 1090 💎 → **Rs 950**\n- 2530 💎 → **Rs 2200** ⭐ Best value\n\n⚡ Delivery: **1–5 minutes** after payment confirmation.`,
      chips: ['How to order?', 'Payment methods', 'Membership prices', 'Best panel for ranked?']
    }
  },
  // ── Membership prices ──
  {
    match: q => q.includes('membership') || q.includes('weekly') || q.includes('monthly') || (q.includes('member') && q.includes('price')),
    reply: {
      text: `**Free Fire Memberships** 👑\n\n- Weekly Lite → **Rs 90**\n- Weekly Member → **Rs 220**\n- Monthly Member → **Rs 1050**\n\n⚡ Delivery: **1–5 minutes** after payment confirmation.\n\nNo discounts on memberships — fixed price.`,
      chips: ['Diamond prices', 'How to order?', 'Payment methods', 'Best panel for ranked?']
    }
  },
  // ── How to order ──
  {
    match: q => (q.includes('how') && (q.includes('order') || q.includes('buy') || q.includes('purchase'))) || q.includes('steps') || q.includes('process'),
    reply: {
      text: `**How to Order** 🛒\n\n1. Sign in with Google on the website\n2. Go to **Store** tab → select product\n3. Choose your package duration\n4. Fill in: Name, TikTok handle, WhatsApp number\n5. Select payment method (eSewa or Bank Transfer)\n6. Scan the QR code and pay\n7. Add your **name as payment remark**\n8. Enter the transaction/reference number\n9. Admin reviews and delivers key (up to 40 min)\n\n💡 Payment window: **8AM – 10PM** daily`,
      chips: ['Payment methods', 'Delivery time', 'Is it safe?', 'Diamond prices']
    }
  },
  // ── Payment methods ──
  {
    match: q => q.includes('payment') || q.includes('pay') || q.includes('esewa') || q.includes('bank') || q.includes('khalti'),
    reply: {
      text: `**Payment Methods** 💳\n\nWe accept:\n- 📱 **eSewa** — scan QR in eSewa app\n- 🏦 **NMB Bank Transfer** — scan QR in bank app\n\n**Important:** Add your name as payment remark before paying.\n\nAfter paying, enter the transaction/reference number in the app.\n\n⏰ Payment window: **8AM – 10PM** daily`,
      chips: ['How to order?', 'Delivery time', 'Is it safe?', 'Diamond prices']
    }
  },
  // ── Delivery time ──
  {
    match: q => q.includes('delivery') || q.includes('how long') || q.includes('time') || q.includes('fast') || q.includes('instant'),
    reply: {
      text: `**Delivery Times** ⚡\n\n- 💎 Diamonds: **1–5 minutes**\n- 🎮 Panel keys: **5–15 minutes**\n- ⏳ Admin review: **up to 40 minutes**\n\nAll deliveries happen after payment is confirmed by admin.\n\nIf your order isn't delivered within 24 hours, contact WhatsApp immediately: **+977 9708838261**`,
      chips: ['How to order?', 'Payment methods', 'Contact support', 'Is it safe?']
    }
  },
  // ── Safety / ban ──
  {
    match: q => q.includes('safe') || q.includes('ban') || q.includes('banned') || q.includes('antiban') || q.includes('risk') || q.includes('detect'),
    reply: {
      text: `**Is it safe?** 🛡️\n\nAll panels include **built-in antiban protection**. Most users have zero issues.\n\n✅ Antiban built into every panel\n✅ Thousands of users with no bans\n⚠️ No cheat is 100% guaranteed — use at your own risk\n\n**Tips to stay safe:**\n- Don't stream while using\n- Don't use in tournaments\n- Don't brag in chat\n\nFor maximum safety: **PATO TEAM** is the most conservative option.`,
      chips: ['Best panel for ranked?', 'How to order?', 'PATO TEAM prices', 'Contact support']
    }
  },
  // ── Installation ──
  {
    match: q => q.includes('install') || q.includes('setup') || q.includes('activate') || q.includes('how to use'),
    reply: {
      text: `**Installation** 🔧\n\nAfter your order is approved:\n\n1. You'll receive an **activation key** in the app (loot box)\n2. A full **installation guide** is sent via WhatsApp\n3. Follow the guide step by step\n\nFor iOS (IOS FLUORITE): you'll receive a certificate + installation guide.\n\nIf you need help installing, contact WhatsApp: **+977 9708838261**`,
      chips: ['How to order?', 'Contact support', 'Is it safe?', 'Best panel for ranked?']
    }
  },
  // ── Refund ──
  {
    match: q => q.includes('refund') || q.includes('money back') || q.includes('return'),
    reply: {
      text: `**Refund Policy** ⚠️\n\n❌ No refunds after key activation or delivery.\n\nPlease double-check:\n- Your Player ID/UID before payment\n- Package selection before payment\n\n✅ If your product is **NOT delivered** within 24 hours, contact us for a full resolution.\n\n📱 WhatsApp: **+977 9708838261**`,
      chips: ['Contact support', 'How to order?', 'Delivery time', 'Payment methods']
    }
  },
  // ── Contact / support ──
  {
    match: q => q.includes('contact') || q.includes('support') || q.includes('help') || q.includes('whatsapp') || q.includes('problem') || q.includes('issue'),
    reply: {
      text: `**Contact Support** 📱\n\n- **WhatsApp:** [+977 9708838261](https://wa.me/9779708838261) — 24/7, avg reply ~10 min\n- **Email:** susantedit@gmail.com\n- **TikTok:** @vortexeditz34\n- **Instagram:** @susantgamerz\n\n⏰ Business hours: **8AM – 10PM** daily\n\nFor urgent issues (wrong delivery, payment problem), WhatsApp is fastest.`,
      chips: ['How to order?', 'Refund policy', 'Delivery time', 'Payment methods']
    }
  },
  // ── iOS / Android ──
  {
    match: q => q.includes('android') || (q.includes('work') && (q.includes('phone') || q.includes('device'))),
    reply: {
      text: `**Device Compatibility** 📱\n\n- **Android:** DRIP CLIENT, HG CHEATS, PATO TEAM, PRIME HOOK ✅\n- **iPhone (iOS):** IOS FLUORITE ONLY ✅\n\nAll panels except IOS FLUORITE are **Android only**.\n\nIf you have an iPhone, IOS FLUORITE is your only option.`,
      chips: ['IOS FLUORITE prices', 'Best panel for ranked?', 'How to order?', 'Is it safe?']
    }
  },
  // ── Price / cost general ──
  {
    match: q => (q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('rate')) && !q.includes('diamond'),
    reply: {
      text: `**All Prices** 💰\n\n**Panels (Android):**\n- DRIP CLIENT: Rs 299–1399\n- HG CHEATS: Rs 399–1899\n- PATO TEAM: Rs 699–1899\n- IOS FLUORITE (iPhone): Rs 699–6500\n\n**Top-ups:**\n- Diamonds: Rs 60–2200\n- Weekly Lite: Rs 90\n- Weekly Member: Rs 220\n- Monthly Member: Rs 1050\n\nTap any product in the Shop tab for exact pricing.`,
      chips: ['Diamond prices', 'DRIP CLIENT prices', 'HG CHEATS prices', 'How to order?']
    }
  },
  // ── Wrong UID / ID ──
  {
    match: q => q.includes('wrong') || q.includes('uid') || q.includes('player id') || q.includes('id'),
    reply: {
      text: `**Wrong Player ID?** ⚠️\n\nIf you entered the wrong Player ID/UID:\n\n1. Contact WhatsApp **immediately**: +977 9708838261\n2. We can correct it **before processing** if caught early\n3. After delivery, corrections may not be possible\n\n💡 Always double-check your UID in Free Fire: Profile → tap your avatar → copy UID`,
      chips: ['Contact support', 'Refund policy', 'How to order?', 'Delivery time']
    }
  },
  // ── Greeting ──
  {
    match: q => q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste' || q.includes('hello') || q.includes('hi there'),
    reply: {
      text: `Hey! 👋 Welcome to **SUSANTEDIT** 🎮🔥\n\nI can help you with:\n- Panel prices and recommendations\n- Diamond top-ups\n- How to order\n- Payment methods\n- Delivery times\n- Safety questions\n\nWhat do you need?`,
      chips: ['Best panel for ranked?', 'Diamond prices', 'How to order?', 'Is it safe?']
    }
  },
];

function getLocalSupportReply(prompt) {
  const q = normalizePrompt(prompt);
  for (const item of QA) {
    if (item.match(q)) return item.reply;
  }
  // Default fallback
  return {
    text: `I'm not sure about that specific question. Here's what I can help with:\n\n- **Panels:** DRIP CLIENT, HG CHEATS, PATO TEAM, IOS FLUORITE\n- **Top-ups:** Diamonds, Weekly, Monthly memberships\n- **Orders:** How to buy, payment methods, delivery times\n- **Support:** Safety, refunds, installation\n\nOr contact us directly on WhatsApp: [+977 9708838261](https://wa.me/9779708838261)`,
    chips: ['Best panel for ranked?', 'Diamond prices', 'How to order?', 'Contact support']
  };
}

// ─── RICH TEXT RENDERER ──────────────────────────────────────────────────────
function RichText({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const tokens = [];
        let cursor = 0;
        const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|`(.+?)`/g;
        let m;
        while ((m = re.exec(line)) !== null) {
          if (m.index > cursor) tokens.push({ t: 'text', v: line.slice(cursor, m.index) });
          if (m[1]) tokens.push({ t: 'bold', v: m[1] });
          else if (m[2]) tokens.push({ t: 'link', v: m[2], href: m[3] });
          else if (m[4]) tokens.push({ t: 'code', v: m[4] });
          cursor = m.index + m[0].length;
        }
        if (cursor < line.length) tokens.push({ t: 'text', v: line.slice(cursor) });
        return (
          <p key={i} style={{ margin: '2px 0', lineHeight: 1.7 }}>
            {tokens.map((tk, j) =>
              tk.t === 'bold' ? <strong key={j} className="su-b">{tk.v}</strong>
              : tk.t === 'link' ? <a key={j} className="su-lk" href={tk.href} target="_blank" rel="noreferrer">{tk.v}</a>
              : tk.t === 'code' ? <code key={j} style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: '.82em', fontFamily: 'monospace', color: 'var(--c-red3)' }}>{tk.v}</code>
              : tk.v
            )}
          </p>
        );
      })}
    </>
  );
}

// ─── CATALOG VIEW ────────────────────────────────────────────────────────────
function CatalogView({ onAsk }) {
  return (
    <div className="su-catalog">
      <div className="su-section-label">All Products</div>
      {CATALOG.map(p => (
        <div key={p.id} className="su-catalog-card">
          <div className="su-catalog-card-header">
            <div className="su-catalog-card-icon">{p.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="su-catalog-card-name">{p.name}</span>
                <span className={`su-tag ${p.tagColor}`}>{p.tag}</span>
              </div>
              <div style={{ fontSize:'.68rem', color:'var(--c-muted)', marginTop:2 }}>{p.cat}</div>
            </div>
          </div>
          <div className="su-catalog-card-desc">{p.desc}</div>
          <div className="su-price-pills">
            {p.prices.map(pr => (
              <button
                key={pr.l}
                className={`su-price-pill${pr.best ? ' best' : ''}`}
                onClick={() => onAsk(`I want to buy ${p.name} ${pr.l} (${pr.v}). How do I order?`)}
              >
                {pr.l} · {pr.v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SUPPORT VIEW ────────────────────────────────────────────────────────────
function SupportView() {
  const [openFaq, setOpenFaq] = useState(null);
  return (
    <div className="su-support">
      <div className="su-section-label">Contact Us</div>
      <a href="https://wa.me/9779708838261" target="_blank" rel="noreferrer" className="su-contact-card">
        <div className="su-contact-icon wa"><i className="fab fa-whatsapp" /></div>
        <div>
          <div className="su-contact-meta-name">WhatsApp (24/7)</div>
          <div className="su-contact-meta-val">+977 9708838261 · Avg reply ~10 min</div>
        </div>
        <i className="fas fa-chevron-right su-contact-arrow" />
      </a>
      <a href="mailto:susantedit@gmail.com" className="su-contact-card">
        <div className="su-contact-icon mail"><i className="fas fa-envelope" /></div>
        <div>
          <div className="su-contact-meta-name">Email</div>
          <div className="su-contact-meta-val">susantedit@gmail.com</div>
        </div>
        <i className="fas fa-chevron-right su-contact-arrow" />
      </a>
      <a href="https://tiktok.com/@vortexeditz34" target="_blank" rel="noreferrer" className="su-contact-card">
        <div className="su-contact-icon tk"><i className="fab fa-tiktok" /></div>
        <div>
          <div className="su-contact-meta-name">TikTok</div>
          <div className="su-contact-meta-val">@vortexeditz34</div>
        </div>
        <i className="fas fa-chevron-right su-contact-arrow" />
      </a>
      <a href="https://instagram.com/susantgamerz" target="_blank" rel="noreferrer" className="su-contact-card">
        <div className="su-contact-icon ig"><i className="fab fa-instagram" /></div>
        <div>
          <div className="su-contact-meta-name">Instagram</div>
          <div className="su-contact-meta-val">@susantgamerz</div>
        </div>
        <i className="fas fa-chevron-right su-contact-arrow" />
      </a>

      <div className="su-section-label" style={{ marginTop: 8 }}>Business Hours & Delivery</div>
      <div style={{ background:'var(--c-panel)', border:'1px solid var(--c-border2)', borderRadius:12, padding:'12px 14px' }}>
        <div className="su-stats">
          <div className="su-stat"><div className="su-stat-val">8AM–10PM</div><div className="su-stat-lbl">Hours</div></div>
          <div className="su-stat"><div className="su-stat-val">~10 min</div><div className="su-stat-lbl">WA Reply</div></div>
          <div className="su-stat"><div className="su-stat-val">1–5 min</div><div className="su-stat-lbl">Diamonds</div></div>
        </div>
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
          {[['💎','Diamonds', '1–5 min'],['🎮','Panel Keys','5–15 min'],['⏳','Admin Review','≤ 40 min']].map(([ic,lbl,val])=>(
            <div key={lbl} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'.77rem', color:'var(--c-muted2)' }}>
              <span>{ic} {lbl}</span>
              <span style={{ color:'var(--c-green)', fontWeight:600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="su-section-label" style={{ marginTop: 8 }}>Payment Methods</div>
      <div style={{ background:'var(--c-panel)', border:'1px solid var(--c-border2)', borderRadius:12, padding:'12px 14px', display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['📱','eSewa'],['💜','Khalti'],['🏦','Bank Transfer']].map(([ic,nm])=>(
          <div key={nm} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid var(--c-border)', fontSize:'.78rem', color:'var(--c-text)' }}>
            <span>{ic}</span><span>{nm}</span>
          </div>
        ))}
      </div>

      <div className="su-section-label" style={{ marginTop: 8 }}>FAQ</div>
      {FAQS.map((f, i) => (
        <div key={i} className="su-faq-item">
          <div className="su-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
            <span>{f.q}</span>
            <i className={`fas fa-chevron-${openFaq === i ? 'up' : 'down'}`} style={{ fontSize:'.7rem', color:'var(--c-muted)', flexShrink:0, marginLeft:8 }} />
          </div>
          {openFaq === i && <div className="su-faq-a">{f.a}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── INITIAL BOT MESSAGE ────────────────────────────────────────────────────
const WELCOME = {
  role: 'bot',
  text: `Welcome to **SUSANTEDIT** 🎮🔥\n\nI'm your support assistant. I can help with **panels, diamonds, pricing, orders**, and anything about Free Fire gaming.\n\nTap a product below to explore, or just ask me anything:`,
  time: new Date(),
  showProducts: true,
  chips: ['Best panel for ranked?', 'Diamond prices', 'How to order?'],
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function SusantEditAI() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [reactions, setReactions] = useState({});
  const [copiedIdx, setCopiedIdx] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // inject styles
  useEffect(() => {
    if (!document.getElementById('su-css')) {
      const s = document.createElement('style');
      s.id = 'su-css'; s.textContent = STYLES;
      document.head.appendChild(s);
    }
    // FA if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
      document.head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 150); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, streamText]);

  const showToast = (msg, icon = '✅') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 2500);
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    });
  };

  const buildHistory = useCallback((msgs) =>
    msgs
      .filter(m => m.role === 'user' || (m.role === 'bot' && !m.showProducts))
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
  []);

  const send = useCallback(async (override) => {
    const msg = (override ?? input).trim();
    if (!msg || typing) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', text: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    // Simulate a short thinking delay for natural feel
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));

    const reply = getLocalSupportReply(msg);
    setTyping(false);
    setMessages(prev => [...prev, { role: 'bot', text: reply.text, time: new Date(), chips: reply.chips || [] }]);
    if (!open) setUnread(u => u + 1);
  }, [input, typing, open]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showQuick = messages.length <= 1;

  const toggleReaction = (idx, emoji) => {
    setReactions(prev => {
      const cur = prev[idx] || {};
      return { ...prev, [idx]: { ...cur, [emoji]: !cur[emoji] } };
    });
  };

  return (
    <div className="su">
      {/* Toast */}
      {toast && (
        <div className="su-toast">
          <span>{toast.icon}</span>
          <span style={{ fontSize: '.8rem' }}>{toast.msg}</span>
        </div>
      )}

      {/* FAB */}
      <button className="su-fab" onClick={() => setOpen(o => !o)} title="Chat with SUSANTEDIT AI">
        <i className={`fas fa-${open ? 'times' : 'gamepad'}`} />
        {!open && unread > 0 && <span className="su-fab-badge">{unread}</span>}
      </button>

      {/* Panel */}
      {open && (
        <div className="su-panel">

          {/* Header */}
          <div className="su-header">
            <div className="su-avatar">
              <i className="fas fa-robot" style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: '#fff', letterSpacing: '.03em', lineHeight: 1.2 }}>
                SUSANTEDIT <span style={{ color: 'var(--c-red2)' }}>AI</span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', marginTop: 2, gap: 3 }}>
                <span className="su-status-dot" />
                Online · 24/7 Support · Free Fire Nepal
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <a href="https://wa.me/9779708838261" target="_blank" rel="noreferrer"
                style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', fontSize: '.85rem', textDecoration: 'none', transition: 'all .2s' }}
                title="WhatsApp Support"
              ><i className="fab fa-whatsapp" /></a>
              <button onClick={() => setOpen(false)}
                style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--c-border)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
              ><i className="fas fa-times" /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="su-tabs">
            {[['chat','💬 Chat'],['catalog','🛍 Shop'],['support','🛟 Support']].map(([id, label]) => (
              <button key={id} className={`su-tab${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {/* ── CHAT TAB ── */}
          {tab === 'chat' && (
            <>
              <div className="su-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`su-msg-row ${m.role}`}>
                    {m.role === 'bot' && (
                      <div className="su-msg-icon"><i className="fas fa-robot" style={{ fontSize: '.65rem' }} /></div>
                    )}
                    <div>
                      <div className={`su-bubble ${m.role}`}>
                        <RichText text={m.text} />

                        {/* Product grid in welcome */}
                        {m.showProducts && (
                          <div className="su-grid" style={{ marginTop: 10 }}>
                            {CATALOG.map(p => (
                              <div key={p.id} className="su-card" onClick={() => send(`Tell me about ${p.name}`)}>
                                <div className="su-card-icon">{p.icon}</div>
                                <div className="su-card-cat">{p.cat}</div>
                                <div className="su-card-name">{p.name}</div>
                                <div className="su-card-price">{p.prices[0].v}+</div>
                                <span className={`su-card-badge`} style={{ position:'absolute', top:7, right:7, fontSize:'.52rem', padding:'1px 5px', borderRadius:'999px', fontFamily:'var(--font-head)', fontWeight:700, letterSpacing:'.05em', background: p.tagColor==='green'?'rgba(57,217,138,0.15)':p.tagColor==='gold'?'rgba(255,209,102,0.15)':'rgba(79,195,247,0.15)', color: p.tagColor==='green'?'var(--c-green)':p.tagColor==='gold'?'var(--c-gold)':'var(--c-blue)', border: `1px solid ${p.tagColor==='green'?'rgba(57,217,138,0.25)':p.tagColor==='gold'?'rgba(255,209,102,0.25)':'rgba(79,195,247,0.25)'}` }}>
                                  {p.tag}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Chips */}
                        {m.chips && m.chips.length > 0 && (
                          <div className="su-chips">
                            {m.chips.map(c => (
                              <button key={c} className="su-chip" onClick={() => send(c)}>{c}</button>
                            ))}
                          </div>
                        )}

                        <div className="su-bubble-time">
                          {fmt(m.time)}
                          {m.role === 'user' && <span className="su-tick">✓✓</span>}
                        </div>

                        {/* Bot message actions */}
                        {m.role === 'bot' && i > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                            {['👍','❤️','🔥'].map(e => (
                              <button key={e} className={`su-react-btn${reactions[i]?.[e] ? ' active' : ''}`}
                                onClick={() => toggleReaction(i, e)}>{e}</button>
                            ))}
                            <button className="su-copy-btn" onClick={() => copyMessage(m.text, i)}>
                              <i className={`fas fa-${copiedIdx===i ? 'check' : 'copy'}`} style={{ fontSize: '.6rem' }} />
                              {copiedIdx === i ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Streaming */}
                {isStreaming && streamText && (
                  <div className="su-msg-row bot">
                    <div className="su-msg-icon"><i className="fas fa-robot" style={{ fontSize: '.65rem' }} /></div>
                    <div className="su-bubble bot">
                      <RichText text={streamText} />
                      <span className="su-cursor" />
                    </div>
                  </div>
                )}

                {/* Typing */}
                {typing && (
                  <div className="su-msg-row bot">
                    <div className="su-msg-icon"><i className="fas fa-robot" style={{ fontSize: '.65rem' }} /></div>
                    <div className="su-typing">
                      <div className="su-dot"/><div className="su-dot"/><div className="su-dot"/>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="su-alert danger">
                    <i className="fas fa-exclamation-circle" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              {showQuick && (
                <div className="su-quick">
                  {QUICK_REPLIES.map(r => (
                    <button key={r} className="su-qbtn" onClick={() => send(r)}>{r}</button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="su-input-area">
                <div className="su-input-row">
                  <textarea
                    ref={inputRef}
                    className="su-input" rows={1} value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                    }}
                    onKeyDown={handleKey}
                    placeholder="Ask anything — panels, diamonds, orders, prices…"
                  />
                  <button
                    className={`su-send ${input.trim() && !isStreaming ? 'on' : 'off'}`}
                    onClick={() => send()} disabled={!input.trim() || isStreaming}
                  >
                    <i className={`fas fa-${isStreaming ? 'stop-circle' : 'paper-plane'}`} />
                  </button>
                </div>
                <div className="su-input-footer">
                  <span className="su-input-hint">
                    <i className="fas fa-shield-alt" style={{ color: 'var(--c-green)', fontSize: '.6rem' }} />
                    Secure · 24/7 Support
                  </span>
                  <span className="su-input-hint">Enter to send</span>
                </div>
              </div>
            </>
          )}

          {/* ── CATALOG TAB ── */}
          {tab === 'catalog' && (
            <CatalogView onAsk={(q) => { setTab('chat'); setTimeout(() => send(q), 100); }} />
          )}

          {/* ── SUPPORT TAB ── */}
          {tab === 'support' && <SupportView />}
        </div>
      )}
    </div>
  );
}