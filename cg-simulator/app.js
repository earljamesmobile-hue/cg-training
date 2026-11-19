(function(){
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS = 'sanctus-cg-sim-v1';

/* ---------------- themes ---------------- */
const THEMES = {
  'song-bottom': {label:'Song · Bottom (IMAG campuses)', group:'Song', font:'Montserrat', size:3.4, weight:500, caps:true, color:'#ffffff', pos:'bottom', align:'center', shadow:true, stroke:false},
  'song-middle': {label:'Song · Middle', group:'Song', font:'Montserrat', size:4.2, weight:500, caps:true, color:'#ffffff', pos:'middle', align:'center', shadow:true, stroke:false},
  'song-top':    {label:'Song · Top', group:'Song', font:'Montserrat', size:3.4, weight:500, caps:true, color:'#ffffff', pos:'top', align:'center', shadow:true, stroke:false},
  'scripture-l3':{label:'Scripture L3rd', group:'Ordinary Holy (series)', kind:'l3'},
  'quote-l3':    {label:'Quote L3rd', group:'Ordinary Holy (series)', kind:'l3'},
  'scripture-fs':{label:'Scripture FS', group:'Ordinary Holy (series)', font:'Newsreader', size:4, weight:400, caps:false, color:'#ffffff', pos:'middle', align:'center', shadow:false, stroke:false, fill:'#154547', refShow:true},
  'quote-fs':    {label:'Quote FS', group:'Ordinary Holy (series)', font:'Newsreader', size:4.4, weight:300, italic:true, caps:false, color:'#03393B', pos:'middle', align:'center', shadow:false, stroke:false, fill:'#DEEBE4', refShow:true},
  'plain':       {label:'Plain', group:'Other', font:'Montserrat', size:4, weight:500, caps:false, color:'#ffffff', pos:'middle', align:'center', shadow:true, stroke:false},
  'old-style':   {label:'Old 2019 Song style', group:'Other', hidden:true, font:'Georgia', size:4.6, weight:700, caps:false, italic:true, color:'#ffe066', pos:'middle', align:'left', shadow:false, stroke:true}
};
const FONTS = ['Montserrat','Newsreader','Georgia','Helvetica','Courier New'];

/* ---------------- missions ---------------- */
const MISSIONS = [
  ['Lesson 1 · The interface', [
    ['m_stageprev','Switch the output preview to the stage display','Use the dropdown above the preview.'],
    ['m_kids','Send a Kids Call message','Messages tab → enter a code → Show.'],
    ['m_prop','Show a name lower third from Props','Props tab → click a name. It clears itself after 10 seconds.']]],
  ['Lesson 2 · Libraries and playlists', [
    ['m_header','Add a header to a playlist','Select a playlist, then + → New Header in the item list.'],
    ['m_drag','Add a library item to a playlist','Drag it from a library onto a playlist, or right-click → Add to Playlist.'],
    ['m_timer','Set a Go to Next Timer with Loop to Beginning','Right-click a slide → Go to Next Timer…']]],
  ['Lesson 3 · Importing media', [
    ['m_media','Add a media action to a slide','Right-click → Add Media Action…'],
    ['m_fg','Fix the loop graphic that isn’t showing','One slide in the Pre-Service Loop is set to Background. Change it to Foreground.'],
    ['m_stop','Stop the announcements video from looping','HOSTING → video slide → Edit Action → Playback → Stop.']]],
  ['Lesson 4 · Song management', [
    ['m_import','Import a song from SongSelect into the Worship library','File → Import → SongSelect (demo catalog).'],
    ['m_newpres','Create a new presentation with a Song theme','+ in the item list → New Presentation.']]],
  ['Lesson 5 · Editing slides', [
    ['m_quick','Fix a word with Quick Edit','Right-click a slide → Quick Edit.'],
    ['m_theme','Re-apply the Song theme to “Steady Ground”','Select every slide (Shift-click), right-click → Themes → Song.']]],
  ['Lesson 6 · Arrangements and Reflow', [
    ['m_arr','Change a song’s arrangement','Drag a group into the arrangement row, reorder it, or remove one.'],
    ['m_break','Insert a slide break in the Reflow editor','Right-click the song in the playlist → Reflow.'],
    ['m_group','Move a slide to a different group','Right-click a slide → Group.']]],
  ['Lesson 7 · Macros', [
    ['m_macro','Attach a macro to a slide, then click it','Right-click → Add Action → Macro.'],
    ['m_newmacro','Build a new macro with at least two actions','Macros tab → + New Macro.']]],
  ['Lesson 8 · Stage display', [
    ['m_stage','Switch the stage display layout','Stage tab → click a layout.'],
    ['m_stagenew','Create a stage layout with Current and Next slide','Stage tab → + New Layout.']]]
];
const MISSION_IDS = MISSIONS.flatMap(g=>g[1].map(m=>m[0]));
const MISSION_NAME = Object.fromEntries(MISSIONS.flatMap(g=>g[1].map(m=>[m[0],m[1]])));

/* ---------------- state ---------------- */
let S = load() || SIM_SEED();
function load(){ try{ const s = JSON.parse(localStorage.getItem(LS)); if(s && s.v===1) return s; }catch(e){} return null; }
let saveT; function save(){ clearTimeout(saveT); saveT = setTimeout(()=>{ try{ localStorage.setItem(LS, JSON.stringify(S)); }catch(e){} }, 300); }
const uid = p => p + '_' + (S.nextId++);

const UI = {
  libSel:{kind:'pl', id:'pl_sunday'}, presSel:null, slideSel:new Set(), anchor:null,
  preview:'aud', tab:'macros', thumb:190, filter:'', audienceOn:true, stageOn:true, clipboard:null
};
// live state (not persisted)
const L = {pres:null, slide:null, idx:-1, text:null, media:null, video:null, props:[], message:null, stage:'st_service', timerT:null};

/* ---------------- helpers ---------------- */
const P = id => S.presentations[id];
function displaySlides(p){
  if(!p) return [];
  if(p.kind==='song' && p.arrangement){
    const out=[]; p.arrangement.forEach(g => p.slides.forEach(s => { if(s.group===g) out.push(s); }));
    // slides whose group isn't in arrangement are still shown at end, dimmed
    return out;
  }
  return p.slides.slice();
}
function groupOf(p, s){ return p.groups && p.groups[s.group]; }
function themeOf(p, s){ return THEMES[s.themeOverride || p.theme] || THEMES.plain; }
function styleOf(p, s){ return Object.assign({}, themeOf(p,s), s.style||{}); }
function curList(){ return UI.libSel.kind==='lib' ? S.libraries.find(l=>l.id===UI.libSel.id) : S.playlists.find(l=>l.id===UI.libSel.id); }
function mediaAction(s){ return (s.actions||[]).find(a=>a.type==='media'); }
function macroActions(s){ return (s.actions||[]).filter(a=>a.type==='macro'); }
const fmt = sec => { const neg = sec<0; sec=Math.abs(Math.round(sec)); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return (neg?'-':'')+(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0'); };
function timerRemaining(t){ const el = t.elapsed + (t.running ? (Date.now()-t.startedAt)/1000 : 0); return t.duration - el; }

function toast(msg, kind=''){ const d=document.createElement('div'); d.className='toast '+kind; d.innerHTML=msg; $('#toasts').appendChild(d); setTimeout(()=>d.remove(), kind==='good'?3600:2800); }
function mission(id){ if(!S.missions[id]){ S.missions[id]=true; save(); toast('✓ Mission complete: '+esc(MISSION_NAME[id]), 'good'); renderMissionBtn(); if($('#drawer').classList.contains('open')) renderDrawer(); } }

/* ---------------- render: text & media ---------------- */
function textHTML(p, s, opts={}){
  if(!s) return '';
  const st = styleOf(p, s);
  if(s.l3name){ return `<div class="prop" style="animation:none"><b>${esc(s.l3name)}</b><small>${esc(s.l3role||'')}</small></div>`; }
  if(st.kind==='l3'){
    if(!s.text) return '';
    return `<div class="l3">${s.ref?`<div class="ref">${esc(s.ref)}</div>`:''}<div class="body">${esc(s.text)}</div></div>`;
  }
  if(!s.text && !s.solid) return '';
  let t = s.text; if(st.caps) t = t.toUpperCase();
  const pos = st.pos==='top' ? 'top:7%' : st.pos==='bottom' ? 'bottom:6%' : 'top:50%;transform:translateY(-50%)';
  const align = st.align==='left'?'flex-start':st.align==='right'?'flex-end':'center';
  const shadow = st.shadow ? 'text-shadow:0 .25cqw .6cqw rgba(0,0,0,.85);' : '';
  const stroke = st.stroke ? '-webkit-text-stroke:.12cqw #000;' : '';
  const ff = st.font==='Montserrat'?'var(--body)':st.font==='Newsreader'?'var(--display)':`'${st.font}',sans-serif`;
  const fill = (st.fill || s.solid) ? `<div class="layer" style="background:${st.fill||'#000'}"></div>` : '';
  const ref = (st.refShow && s.ref) ? `<div style="font-family:var(--body);font-size:${st.size*0.5}cqw;letter-spacing:.14em;text-transform:uppercase;margin-top:1.4cqw;opacity:.8">${esc(s.ref)}</div>` : '';
  return `${fill}<div class="txt" style="${pos};align-items:${align};text-align:${st.align};font-family:${ff};font-size:${st.size}cqw;font-weight:${st.bold?700:st.weight};font-style:${st.italic?'italic':'normal'};color:${st.color};${shadow}${stroke}${st.caps?'letter-spacing:.08em;':''}">${esc(t)}${ref}</div>`;
}
function mediaHTML(m, opts={}){
  if(!m) return '';
  if(m.type==='image') return `<div class="media-img" style="background:${m.bg};color:${m.color}"><div class="t">${m.title}</div><div class="s">${esc(m.sub||'')}</div></div>`;
  const rem = opts.remaining!=null ? opts.remaining : m.duration;
  return `<div class="media-vid" style="background:${m.bg}"><div class="t">${esc(m.title)}</div><div class="s">${m.countdown?'Starting in '+fmt(rem):'▶ '+fmt(rem)+' remaining'}</div><div class="play">VIDEO · ${esc(m.name)}</div></div>`;
}
function thumbHTML(p, s, i, live, isSelBlock){
  const g = groupOf(p, s); const ma = mediaAction(s); const m = ma && S.media[ma.media];
  const transparent = !(s.solid || (themeOf(p,s).fill));
  const badges = [];
  if(macroActions(s).length) badges.push('<span class="badge mac" title="Macro">M</span>');
  if(s.timer) badges.push(`<span class="badge tm" title="Go to Next Timer">${s.timer.sec}s${s.timer.loop?' ↻':''}</span>`);
  if(ma) badges.push(`<span class="badge md${ma.behavior==='background'?' bg':''}" title="Media action">${ma.behavior==='background'?'BG':''}${m&&m.type==='video'?'▶':'▣'}${m&&m.type==='video'&&ma.playback==='loop'?' ↻':''}</span>`);
  const label = s.label || (s.l3name ? 'Name key' : '');
  return `<div class="slide${isSelBlock&&UI.slideSel.has(i)?' sel':''}${live?' live':''}" data-i="${i}" data-pid="${p.id}" data-sid="${s.id}" draggable="false">
    <div class="badges">${badges.join('')}</div>
    <div class="frame${transparent?' checker':''}">${m?mediaHTML(m):''}${textHTML(p,s)}</div>
    <div class="foot" style="background:${g?g.color:'#3a3f44'}"><span class="num">${i+1}</span><span class="gn">${esc(g?g.name:label)}</span>${g&&label?`<span>${esc(label)}</span>`:''}</div></div>`;
}

/* ---------------- render: shell ---------------- */
function renderAll(){ renderLists(); renderItems(); renderPres(); renderTabs(); renderOutput(); renderPlayer(); renderMissionBtn(); }

function renderLists(){
  const h = [];
  h.push('<div class="sechead">Library<button data-act="newlib" title="New library">+</button></div>');
  S.libraries.forEach(l => h.push(`<div class="row${UI.libSel.kind==='lib'&&UI.libSel.id===l.id?' sel':''}" data-lib="${l.id}"><span class="ic lib"></span><span class="nm">${esc(l.name)}</span><span class="meta">${l.items.length}</span></div>`));
  h.push('<div class="sechead" style="border-top:1px solid var(--line)">Playlist<button data-act="newpl" title="New playlist">+</button></div>');
  S.playlists.forEach(l => h.push(`<div class="row${UI.libSel.kind==='pl'&&UI.libSel.id===l.id?' sel':''}" data-pl="${l.id}"><span class="ic pl"></span><span class="nm">${esc(l.name)}</span><span class="meta">${l.entries.filter(e=>e.type==='item').length}</span></div>`));
  $('#lists').innerHTML = h.join('');
}
function renderItems(){
  const c = curList(); if(!c){ $('#items').innerHTML=''; return; }
  const isPl = UI.libSel.kind==='pl';
  const f = UI.filter.toLowerCase();
  const h = [`<div class="sechead">${esc(c.name)} · ${isPl?c.entries.filter(e=>e.type==='item').length:c.items.length} items<button data-act="itemplus" title="New">+</button></div>`, `<input class="filter" id="filter" placeholder="Filter" value="${esc(UI.filter)}" aria-label="Filter items">`, '<div class="list" id="itemlist">'];
  if(isPl){
    c.entries.forEach((e,ix) => {
      if(e.type==='header'){ if(!f) h.push(`<div class="row hdr" draggable="true" data-ix="${ix}"><span class="nm">${esc(e.name)}</span></div>`); return; }
      const p = P(e.pres); if(!p) return; if(f && !p.name.toLowerCase().includes(f)) return;
      h.push(`<div class="row${UI.presSel===p.id?' sel':''}${L.pres===p.id?' live':''}" draggable="true" data-ix="${ix}" data-pres="${p.id}"><span class="nm">${esc(p.name)}</span></div>`);
    });
    if(!c.entries.length) h.push('<div class="empty">Empty playlist.<br>Drag items in from a library, or use + to add a header.</div>');
  } else {
    c.items.map(P).filter(Boolean).filter(p=>!f||p.name.toLowerCase().includes(f)).forEach(p => h.push(`<div class="row${UI.presSel===p.id?' sel':''}${L.pres===p.id?' live':''}" draggable="true" data-pres="${p.id}" data-libitem="1"><span class="nm">${esc(p.name)}</span></div>`));
    if(!c.items.length) h.push('<div class="empty">Empty library.<br>Use + → New Presentation.</div>');
  }
  h.push('</div>');
  $('#items').innerHTML = h.join('');
  const fi = $('#filter'); if(document.activeElement && document.activeElement.id==='filter-was'){ }
}
function blockHTML(p, key){
  const sel = UI.presSel===p.id;
  const ds = displaySlides(p);
  let h = `<div class="pblock${sel?' psel':''}" id="blk-${key}" data-pid="${p.id}">
    <div class="pbar"><span class="pic">▣</span><b>${esc(p.name)}</b><span class="meta">${THEMES[p.theme]&&p.kind==='song'?esc(THEMES[p.theme].label):''}</span>${L.pres===p.id?'<span class="livetag">LIVE</span>':''}<span class="sp"></span>
    ${p.kind==='song'?`<button class="chipbtn" data-act="reflow" data-pid="${p.id}">Reflow</button>`:''}<button class="chipbtn" data-act="edit" data-pid="${p.id}">Edit slide</button><button class="chipbtn" data-act="addslide" data-pid="${p.id}">+ Slide</button></div>`;
  if(p.kind==='song'){
    const gids = Object.keys(p.groups);
    h += `<div class="arr" data-pid="${p.id}"><label>Groups</label><div class="chips grow" data-pid="${p.id}">${gids.map(g=>`<span class="chip" draggable="true" data-g="${g}" style="background:${p.groups[g].color}" title="Drag into the arrangement, or double-click to add">${esc(p.groups[g].name)}</span>`).join('')}</div>
      <label>Arrangement</label><div class="chips arow" data-pid="${p.id}">${(p.arrangement||[]).map((g,i)=>p.groups[g]?`<span class="chip" draggable="true" data-ai="${i}" style="background:${p.groups[g].color}">${esc(p.groups[g].name)}<button data-rm="${i}" aria-label="Remove ${esc(p.groups[g].name)} from arrangement">×</button></span>`:'').join('') || '<span class="hint">Drag groups here</span>'}</div></div>`;
  }
  h += `<div class="pgrid">${ds.length ? ds.map((s,i)=>thumbHTML(p,s,i, L.pres===p.id && L.idx===i, sel)).join('') : '<div class="empty" style="grid-column:1/-1;padding:16px">No slides. Click + Slide, or add groups to the arrangement.</div>'}</div></div>`;
  return h;
}
function renderPres(){
  const head = $('#phead'), grid = $('#grid');
  const top = grid.scrollTop;
  grid.style.setProperty('--thumb', UI.thumb+'px');
  if(UI.libSel.kind==='pl'){
    const pl = curList();
    head.innerHTML = `<b>${esc(pl.name)}</b><span class="meta">Playlist · ${pl.entries.filter(e=>e.type==='item').length} items</span><span class="sp"></span><span class="meta">Click an item in the playlist to jump to it</span>`;
    grid.innerHTML = pl.entries.length ? pl.entries.map((e,ix)=> e.type==='header' ? `<div class="phdr" id="blk-h${ix}">${esc(e.name)}</div>` : (P(e.pres) ? blockHTML(P(e.pres), 'e'+ix) : '')).join('') : '<div class="empty">Empty playlist. Drag items in from a library, or use + to add a header.</div>';
  } else {
    const p = P(UI.presSel);
    if(!p){ head.innerHTML = '<b>No item selected</b>'; grid.innerHTML = '<div class="empty">Select an item in the library to see its slides.<br>Click a slide to send it live.</div>'; return; }
    head.innerHTML = `<b>${esc(curList().name)}</b><span class="meta">Library</span>`;
    grid.innerHTML = blockHTML(p, 'lib');
  }
  grid.scrollTop = top;
}
function scrollToBlock(ix){
  const el = UI.libSel.kind==='pl' ? $('#blk-e'+ix) : null;
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ---------------- render: output ---------------- */
let camCanvas, camCtx;
function renderOutput(){
  const host = $('#outframe');
  const isStage = UI.preview==='stage';
  $('#livedot').className = 'livedot' + ((isStage?UI.stageOn:UI.audienceOn)?'':' off');
  $('#livedot').textContent = (isStage?UI.stageOn:UI.audienceOn) ? '● LIVE' : 'OUTPUT OFF';
  if(isStage){ host.querySelector('.audlayers').hidden = true; const st = host.querySelector('.stagelayer'); st.hidden=false; st.innerHTML = UI.stageOn ? stageHTML(S.stageLayouts.find(l=>l.id===L.stage)) : ''; return; }
  host.querySelector('.stagelayer').hidden = true; host.querySelector('.audlayers').hidden = false;
  const p = P(L.pres);
  const m = L.media && S.media[L.media.id];
  const showMedia = m && L.media.behavior !== 'background';
  $('#lay-media').innerHTML = UI.audienceOn && showMedia ? mediaHTML(m, {remaining: L.video ? Math.max(0, m.duration - L.video.pos) : null}) : '';
  $('#lay-text').innerHTML = UI.audienceOn && L.text ? textHTML(P(L.text.pres), L.text.slide) : '';
  $('#lay-props').innerHTML = UI.audienceOn ? L.props.map(pr=>`<div class="prop"><b>${esc(pr.name)}</b><small>${esc(pr.role)}</small></div>`).join('') : '';
  $('#lay-msg').innerHTML = UI.audienceOn && L.message ? `<div class="msg">${esc(L.message)}</div>` : '';
  $('#lay-off').hidden = UI.audienceOn;
}
function liveContext(){
  const p = P(L.pres); const ds = displaySlides(p);
  return {cur: L.idx>=0 ? ds[L.idx] : null, next: L.idx>=0 ? ds[L.idx+1] : null, p};
}
function stageElHTML(e, ctx, edit){
  const box = `left:${e.x}%;top:${e.y}%;width:${e.w}%;height:${e.h}%;font-size:${e.size||5}cqw;text-align:${e.align||'left'};align-items:${e.align==='center'?'center':e.align==='right'?'flex-end':'flex-start'}`;
  let inner = '', cls = e.type;
  const d = new Date();
  if(e.type==='clock') inner = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  else if(e.type==='text') inner = esc(e.text||'Text');
  else if(e.type==='current') inner = edit ? 'Current Slide Text' : esc(ctx.cur ? (ctx.cur.text || (ctx.cur.l3name?ctx.cur.l3name:'')) : '');
  else if(e.type==='next') inner = edit ? 'Next Slide Text' : esc(ctx.next ? ctx.next.text : '');
  else if(e.type==='notes') inner = edit ? 'Current Slide Notes' : esc(ctx.cur && ctx.cur.notes || '');
  else if(e.type==='timer'){ const t = S.timers.find(x=>x.id===e.timer); const r = t?timerRemaining(t):0; if(r<0) cls+=' over'; inner = `<div class="cap">${esc(t?t.name:'Timer')}</div><div class="v">${fmt(r)}</div>`; }
  else if(e.type==='video'){ const m = L.media && S.media[L.media.id]; inner = `<div class="v" style="font-weight:700;color:#7ef0a5">${m&&m.type==='video'&&L.video?fmt(m.duration-L.video.pos):'0:00'}</div>`; }
  else if(e.type==='message') inner = esc(L.message||'');
  return `<div class="se ${cls}" style="${box};white-space:pre-wrap">${inner}</div>`;
}
function stageHTML(lay){ if(!lay) return ''; const ctx = liveContext(); return lay.els.map(e=>stageElHTML(e, ctx, false)).join(''); }

/* camera feed (IMAG simulation) */
function drawCam(t){
  if(!camCtx) return;
  const w = camCanvas.width, h = camCanvas.height, c = camCtx;
  const g = c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#3a2a1e'); g.addColorStop(1,'#1b130d'); c.fillStyle=g; c.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){ c.fillStyle = i%2?'rgba(120,80,45,.25)':'rgba(90,60,35,.25)'; c.fillRect(0, i*h/14, w, h/14-2); }
  c.fillStyle='rgba(30,70,40,.8)'; c.beginPath(); c.ellipse(w*.12,h*.95,w*.09,h*.35,0,0,7); c.fill(); c.beginPath(); c.ellipse(w*.9,h*.95,w*.1,h*.38,0,0,7); c.fill();
  const sway = Math.sin(t/1400)*w*.02, bob = Math.sin(t/700)*h*.006;
  const cx = w*.5 + sway;
  c.fillStyle='#5b6b7a'; c.beginPath(); c.ellipse(cx, h*1.02, w*.16, h*.42, 0, 0, 7); c.fill();
  c.fillStyle='#c99b7b'; c.beginPath(); c.ellipse(cx, h*.42+bob, w*.055, h*.12, 0, 0, 7); c.fill();
  c.fillStyle='#3b2a20'; c.beginPath(); c.ellipse(cx, h*.33+bob, w*.056, h*.05, 0, 0, 7); c.fill();
  const arm = Math.sin(t/500)*h*.04;
  c.strokeStyle='#5b6b7a'; c.lineWidth=w*.03; c.lineCap='round'; c.beginPath(); c.moveTo(cx+w*.12,h*.75); c.lineTo(cx+w*.2,h*.62+arm); c.stroke();
}
function camLoop(t){ drawCam(t); requestAnimationFrame(camLoop); }

/* ---------------- player & tabs ---------------- */
function renderPlayer(){
  const m = L.media && S.media[L.media.id];
  const box = $('#player');
  if(!m || m.type!=='video'){ box.innerHTML = '<div class="nm">Media player · no video playing</div><div class="prog"><i></i></div><div class="pctl"><span>0:00</span><span class="sp"></span><span>0:00</span></div>'; return; }
  const pos = L.video ? L.video.pos : 0;
  box.innerHTML = `<div class="nm">▶ ${esc(m.name)} · Playback: <b style="color:${L.media.playback==='loop'?'var(--warn)':'var(--good)'}">${L.media.playback==='loop'?'Loop':'Stop at end'}</b></div><div class="prog"><i style="width:${100*pos/m.duration}%"></i></div>
    <div class="pctl"><span>${fmt(pos)}</span><button data-act="vtoggle">${L.video&&L.video.paused?'Play':'Pause'}</button><button data-act="vrestart">Restart</button><span class="sp"></span><span>-${fmt(m.duration-pos)}</span></div>`;
}
function renderTabs(){
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===UI.tab));
  const body = $('#tabbody'); const h=[];
  if(UI.tab==='macros'){
    h.push('<button class="btn" data-act="newmacro" style="width:100%;margin-bottom:8px">+ New Macro</button>');
    S.macros.forEach(m=>h.push(`<div class="card click" data-macro="${m.id}" title="Click to run. Right-click to edit."><div class="h"><span class="macic" style="background:${m.color}">${esc(m.name[0])}</span><b>${esc(m.name)}</b><button class="ibtn" data-editmacro="${m.id}">Edit</button></div><div class="acts">${m.actions.map(a=>`<span class="act">${esc(actLabel(a))}</span>`).join('')||'<span class="act">No actions</span>'}</div></div>`));
  } else if(UI.tab==='timers'){
    S.timers.forEach(t=>{ const r=timerRemaining(t); h.push(`<div class="card"><div class="h"><b>${esc(t.name)}</b><span class="tmr${t.running?' run':''}${r<0?' over':''}" data-tmr="${t.id}">${fmt(r)}</span></div><div class="sub" style="display:flex;gap:6px;align-items:center">Countdown from ${fmt(t.duration)}<span style="flex:1"></span><button class="ibtn" data-tstart="${t.id}">${t.running?'Pause':'Start'}</button><button class="ibtn" data-treset="${t.id}">Reset</button></div></div>`); });
  } else if(UI.tab==='messages'){
    S.messages.forEach(m=>h.push(`<div class="card${L.message?' on':''}"><div class="h"><b>${esc(m.name)}</b></div><div class="sub">Shows on the audience screens: <i>${esc(m.template)}</i></div>
      <label class="field"><span>Token: code</span><input type="text" id="kidcode" value="${esc(m.code)}" maxlength="8"></label>
      <div class="sub" style="display:flex;gap:6px;align-items:center">Clears after ${m.autoClear}s<span style="flex:1"></span><button class="btn pri" data-act="showmsg">Show</button><button class="btn" data-act="clearmsg">Clear</button></div></div>`));
  } else if(UI.tab==='props'){
    h.push('<div class="hint" style="margin-bottom:8px">Props sit on top of everything with transparency. Each one dissolves after 10 seconds.</div>');
    S.props.forEach(pr=>h.push(`<div class="card click${L.props.some(x=>x.id===pr.id)?' on':''}" data-prop="${pr.id}"><div class="frame checker" style="border-radius:4px;margin-bottom:6px"><div class="prop" style="animation:none"><b>${esc(pr.name)}</b><small>${esc(pr.role)}</small></div></div><div class="h"><b>${esc(pr.name)}</b><span class="sub">Clear after 10s</span></div></div>`));
  } else if(UI.tab==='stage'){
    h.push('<button class="btn" data-act="newstage" style="width:100%;margin-bottom:8px">+ New Layout</button>');
    S.stageLayouts.forEach(l=>h.push(`<div class="card click${L.stage===l.id?' on':''}" data-stage="${l.id}"><div class="frame" style="border-radius:4px;margin-bottom:6px">${stageHTML(l)}</div><div class="h"><b>${esc(l.name)}</b>${L.stage===l.id?'<span class="sub" style="color:var(--good)">On stage</span>':''}<button class="ibtn" data-editstage="${l.id}">Edit</button></div></div>`));
  } else if(UI.tab==='media'){
    h.push('<div class="hint" style="margin-bottom:8px">Media bin. Right-click a slide → Add Media Action… to use these.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">');
    Object.values(S.media).forEach(m=>h.push(`<div><div class="frame" style="border-radius:4px">${mediaHTML(m)}</div><div class="sub" style="font-size:10px;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${m.type==='video'?'▶ ':''}${esc(m.name)}</div></div>`));
    h.push('</div>');
  }
  body.innerHTML = h.join('');
}
function actLabel(a){
  if(a.type==='clear') return 'Clear ' + ({all:'All', slide:'Slide', media:'Media', props:'Props', messages:'Messages'}[a.what]||a.what);
  if(a.type==='stage'){ const l=S.stageLayouts.find(x=>x.id===a.layout); return 'Stage: '+(l?l.name:'?'); }
  if(a.type==='timer'){ const t=S.timers.find(x=>x.id===a.timer); return 'Start timer: '+(t?t.name:'?'); }
  if(a.type==='timerreset'){ const t=S.timers.find(x=>x.id===a.timer); return 'Reset timer: '+(t?t.name:'?'); }
  return a.type;
}
function renderMissionBtn(){ const d = MISSION_IDS.filter(i=>S.missions[i]).length; $('#mbtn').textContent = `Practice missions · ${d}/${MISSION_IDS.length}`; }
function renderDrawer(){
  const d = MISSION_IDS.filter(i=>S.missions[i]).length;
  $('#drawer .db').innerHTML = MISSIONS.map(([g, ms])=>`<h3>${esc(g)}</h3>`+ms.map(([id,t,hint])=>`<div class="ms${S.missions[id]?' done':''}"><i>${S.missions[id]?'✓':''}</i><span>${esc(t)}<small>${esc(hint)}</small></span></div>`).join('')).join('');
  $('#drawer .meter i').style.width = (100*d/MISSION_IDS.length)+'%';
  $('#mcount').textContent = `${d} of ${MISSION_IDS.length} complete`;
}

/* ---------------- live engine ---------------- */
function goLive(pid, idx, opts){
  const p = P(pid); const ds = displaySlides(p); const s = ds[idx]; if(!s) return;
  L.pres = pid; L.idx = idx; L.slide = s.id;
  // macros first (they may clear layers), then the slide itself
  macroActions(s).forEach(a => { const m = S.macros.find(x=>x.id===a.macro); if(m) runMacro(m, true); });
  const ma = mediaAction(s);
  if(ma && S.media[ma.media]){
    L.media = {id:ma.media, behavior:ma.behavior, playback:ma.playback};
    const m = S.media[ma.media];
    L.video = m.type==='video' ? {pos:0, paused:false, last:performance.now()} : null;
    if(ma.behavior==='background') toast('That media action is set to <b>Background</b>, so it isn’t showing. Set it to Foreground.', 'warn');
  }
  L.text = (s.text || s.l3name || s.solid) ? {pres:pid, slide:s} : null;
  clearTimeout(L.timerT);
  if(s.timer){
    L.timerT = setTimeout(()=>{
      if(L.pres!==pid || L.slide!==s.id) return;
      const ds2 = displaySlides(P(pid)); let n = L.idx+1;
      if(n>=ds2.length){ if(s.timer.loop) n=0; else return; }
      goLive(pid, n, {reveal:true});
    }, s.timer.sec*1000);
  }
  if(macroActions(s).length && S._macroAttached && S._macroAttached[s.id]) mission('m_macro');
  renderPres(); renderItems(); renderOutput(); renderPlayer(); if(UI.tab==='stage'||UI.tab==='timers') renderTabs();
  const ls = document.querySelector('.slide.live'); if(ls && opts && opts.reveal) ls.scrollIntoView({block:'nearest', behavior:'smooth'});
}
function runMacro(m, fromSlide){
  m.actions.forEach(a=>{
    if(a.type==='clear') clearLayer(a.what, true);
    else if(a.type==='stage') L.stage = a.layout;
    else if(a.type==='timer'){ const t=S.timers.find(x=>x.id===a.timer); if(t){ t.elapsed=0; t.startedAt=Date.now(); t.running=true; } }
    else if(a.type==='timerreset'){ const t=S.timers.find(x=>x.id===a.timer); if(t){ t.elapsed=0; t.running=false; } }
  });
  if(!fromSlide){ renderOutput(); renderPlayer(); renderPres(); }
  renderTabs();
  toast('Macro: '+esc(m.name));
}
function clearLayer(what, quiet){
  if(what==='all'||what==='slide'){ L.text=null; L.idx=-1; L.pres=null; clearTimeout(L.timerT); }
  if(what==='all'||what==='media'){ L.media=null; L.video=null; }
  if(what==='all'||what==='props'){ L.props=[]; }
  if(what==='all'||what==='messages'){ L.message=null; }
  if(!quiet){ renderOutput(); renderPlayer(); renderPres(); renderItems(); renderTabs(); }
}
function advance(dir){
  const pid = L.pres || UI.presSel; if(!pid) return;
  const ds = displaySlides(P(pid));
  let i = (L.pres===pid ? L.idx : -1) + dir;
  if(i<0) i=0; if(i>=ds.length) return;
  if(UI.presSel!==pid){ UI.presSel=pid; }
  goLive(pid, i, {reveal:true});
}
// tick: video progress, timers, prop expiry, message expiry
let lastTick = performance.now();
setInterval(()=>{
  const now = performance.now(); const dt = (now-lastTick)/1000; lastTick = now;
  let outDirty=false;
  if(L.video && !L.video.paused && L.media){
    const m = S.media[L.media.id]; L.video.pos += dt;
    if(L.video.pos >= m.duration){
      if(L.media.playback==='loop'){ L.video.pos = 0; toast('⚠ The video started over. Its playback is set to <b>Loop</b>. Set it to Stop.', 'warn'); }
      else { L.media=null; L.video=null; toast('Video finished, so the cameras show through again.'); }
    }
    outDirty=true; renderPlayer();
  }
  const t = Date.now();
  const np = L.props.filter(p=>p.until>t); if(np.length!==L.props.length){ L.props=np; outDirty=true; if(UI.tab==='props') renderTabs(); }
  if(L.message && L.messageUntil && L.messageUntil<t){ L.message=null; outDirty=true; if(UI.tab==='messages') renderTabs(); }
  if(outDirty || UI.preview==='stage') renderOutput();
  if(UI.tab==='timers') document.querySelectorAll('[data-tmr]').forEach(el=>{ const tm=S.timers.find(x=>x.id===el.dataset.tmr); const r=timerRemaining(tm); el.textContent=fmt(r); el.classList.toggle('over', r<0); });
}, 250);

/* ---------------- context menu & modal ---------------- */
let menuEl=null;
function closeMenu(){ if(menuEl){ menuEl.remove(); menuEl=null; } }
function buildMenu(items){
  const m = document.createElement('div'); m.className='menu';
  items.forEach(it=>{
    if(it==='-'){ const s=document.createElement('div'); s.className='msep'; m.appendChild(s); return; }
    const d = document.createElement('div'); d.className='mi'+(it.disabled?' dis':''); d.setAttribute('role','menuitem');
    d.innerHTML = `<span class="ck">${it.checked?'✓':''}</span><span>${esc(it.label)}</span>${it.sub?'<span class="ar">›</span>':''}`;
    if(it.sub){ d.appendChild(buildMenu(it.sub)); }
    else d.addEventListener('click', e=>{ e.stopPropagation(); closeMenu(); it.action && it.action(); });
    m.appendChild(d);
  });
  return m;
}
function showMenu(x, y, items){
  closeMenu(); menuEl = buildMenu(items); document.body.appendChild(menuEl);
  const r = menuEl.getBoundingClientRect();
  menuEl.style.left = Math.min(x, innerWidth - r.width - 8)+'px';
  menuEl.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8))+'px';
  if(x > innerWidth - r.width*2 - 20) menuEl.querySelectorAll('.mi').forEach(mi=>mi.classList.add('flip'));
}
document.addEventListener('click', e=>{ if(menuEl && !menuEl.contains(e.target)) closeMenu(); });
function modal(title, body, buttons, opts={}){
  const ov = document.createElement('div'); ov.className='ov';
  ov.innerHTML = `<div class="modal${opts.wide?' wide':''}" role="dialog" aria-label="${esc(title)}"><div class="mh">${esc(title)}<span class="sp"></span><button aria-label="Close">×</button></div><div class="mb">${body}</div><div class="mf"></div></div>`;
  const close = ()=>ov.remove();
  ov.querySelector('.mh button').onclick = close;
  const mf = ov.querySelector('.mf');
  (buttons||[{label:'Close'}]).forEach(b=>{ const bt=document.createElement('button'); bt.className='btn'+(b.pri?' pri':'')+(b.danger?' danger':''); bt.textContent=b.label; bt.onclick=()=>{ if(b.action && b.action(ov)===false) return; close(); }; mf.appendChild(bt); });
  document.body.appendChild(ov);
  if(opts.mount) opts.mount(ov);
  const f = ov.querySelector('input,textarea,select'); if(f) f.focus();
  return ov;
}

/* ---------------- slide operations ---------------- */
function selectedSlides(p){ const ds=displaySlides(p); const ids=new Set([...UI.slideSel].map(i=>ds[i]&&ds[i].id).filter(Boolean)); return p.slides.filter(s=>ids.has(s.id)); }
function slideMenu(p, s, i, x, y){
  if(!UI.slideSel.has(i)){ UI.slideSel = new Set([i]); renderPres(); }
  const sel = selectedSlides(p);
  const ma = mediaAction(s); const m = ma && S.media[ma.media];
  const themeSub = [];
  let lastG=null; Object.entries(THEMES).filter(([k,t])=>!t.hidden).forEach(([k,t])=>{ if(lastG && lastG!==t.group) themeSub.push('-'); lastG=t.group; themeSub.push({label:t.label, checked:(s.themeOverride||p.theme)===k, action:()=>applyTheme(p, sel, k)}); });
  const groupSub = p.kind==='song' ? Object.entries(p.groups).map(([g,gr])=>({label:gr.name, checked:s.group===g, action:()=>{ sel.forEach(x=>x.group=g); afterGroupChange(p); mission('m_group'); }})).concat(['-',{label:'New group…', action:()=>newGroupFor(p, sel)}]) : [{label:'Groups are for songs', disabled:true}];
  const items = [
    {label:'Quick Edit', action:()=>quickEdit(p, s)},
    {label:'Edit Slide', action:()=>editSlide(p, s)},
    '-',
    {label:'Themes', sub:themeSub},
    {label:'Go to Next Timer…', action:()=>slideTimer(p, s)},
    s.timer ? {label:'Remove Go to Next Timer', action:()=>{ delete s.timer; save(); renderPres(); }} : null,
    '-',
    {label:'Add Action', sub:[{label:'Macro', sub:S.macros.map(mc=>({label:mc.name, checked:macroActions(s).some(a=>a.macro===mc.id), action:()=>attachMacro(p, sel, mc)}))}]},
    {label:'Add Media Action…', action:()=>pickMedia(p, sel)},
    ma ? {label:'Edit Action: '+(m?m.name:'media'), sub:[
      {label:'Behavior', sub:[{label:'Foreground', checked:ma.behavior==='foreground', action:()=>setBehavior(p,s,'foreground')},{label:'Background', checked:ma.behavior==='background', action:()=>setBehavior(p,s,'background')}]},
      m && m.type==='video' ? {label:'Playback Behavior', sub:[{label:'Stop', checked:ma.playback==='stop', action:()=>setPlayback(p,s,'stop')},{label:'Loop', checked:ma.playback==='loop', action:()=>setPlayback(p,s,'loop')}]} : {label:'Playback Behavior (videos only)', disabled:true},
      {label:'Show in Finder', action:()=>toast('In ProPresenter this opens the file on the hard drive: <b>'+esc(m?m.name:'')+'</b>')}]} : null,
    (s.actions||[]).length ? {label:'Remove Actions', sub:(s.actions||[]).map((a,ai)=>({label: a.type==='media' ? 'Media: '+(S.media[a.media]||{}).name : 'Macro: '+((S.macros.find(x=>x.id===a.macro)||{}).name||'?'), action:()=>{ s.actions.splice(ai,1); save(); renderPres(); }})).concat(['-',{label:'Remove All Actions', action:()=>{ sel.forEach(x=>x.actions=[]); save(); renderPres(); }}])} : null,
    '-',
    {label:'Group', sub:groupSub},
    '-',
    {label:'Copy', action:()=>{ UI.clipboard = sel.map(x=>JSON.parse(JSON.stringify(x))); toast(`Copied ${sel.length} slide${sel.length>1?'s':''}`); }},
    {label:'Paste', disabled:!UI.clipboard, action:()=>pasteSlides(p, s)},
    {label:'Duplicate', action:()=>{ UI.clipboard = sel.map(x=>JSON.parse(JSON.stringify(x))); pasteSlides(p, sel[sel.length-1]); }},
    {label:'Delete', action:()=>deleteSlides(p, sel)}
  ].filter(Boolean);
  showMenu(x, y, items);
}
function applyTheme(p, sel, key){
  const t = THEMES[key];
  if(p.kind==='song' && t.group==='Song' && sel.length >= p.slides.length-1){ p.theme = key; p.slides.forEach(s=>{ delete s.themeOverride; delete s.style; }); }
  else sel.forEach(s=>{ s.themeOverride = key; delete s.style; });
  if(p.kind==='song' && t.group==='Song' && p.slides.every(s=>(s.themeOverride||p.theme).startsWith('song-')) && p.name==='Steady Ground') mission('m_theme');
  save(); renderPres(); renderOutput(); toast('Theme applied: '+esc(t.label));
}
function slideTimer(p, s){
  const t = s.timer || {sec:5, loop:false};
  modal('Slide Timer', `<p class="hint">Set the amount of time, in seconds, that this slide will be displayed on screen before going to the next slide.</p>
    <div class="field"><span>Duration (seconds)</span><input type="number" id="tsec" min="1" max="600" value="${t.sec}"></div>
    <label class="check"><input type="checkbox" id="tloop" ${t.loop?'checked':''}> Loop to Beginning (use on the last slide of a loop)</label>`,
    [{label:'Remove', danger:true, action:()=>{ delete s.timer; save(); renderPres(); }},{label:'Cancel'},{label:'Done', pri:true, action:ov=>{ const sec=Math.max(1, +$('#tsec',ov).value||5); s.timer={sec, loop:$('#tloop',ov).checked}; if(s.timer.loop) mission('m_timer'); save(); renderPres(); }}]);
}
function attachMacro(p, sel, mc){
  sel.forEach(s=>{ s.actions = (s.actions||[]).filter(a=>a.type!=='macro'); s.actions.push({type:'macro', macro:mc.id}); S._macroAttached = S._macroAttached||{}; S._macroAttached[s.id]=true; });
  save(); renderPres(); toast(`Macro “${esc(mc.name)}” added. Click the slide to run it.`);
}
function pickMedia(p, sel){
  const items = Object.values(S.media);
  modal('Add Media Action', `<p class="hint">Choose a graphic or video for the selected slide${sel.length>1?'s':''}. Remember to set its behavior to Foreground.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${items.map(m=>`<button class="btn" data-m="${m.id}" style="padding:4px;text-align:left"><div class="frame" style="border-radius:4px">${mediaHTML(m)}</div><div style="font-size:10.5px;margin-top:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${m.type==='video'?'▶ ':''}${esc(m.name)}</div></button>`).join('')}</div>`, [{label:'Cancel'}], {wide:true, mount:ov=>{
    ov.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ const m=S.media[b.dataset.m]; sel.forEach(s=>{ s.actions=(s.actions||[]).filter(a=>a.type!=='media'); s.actions.unshift({type:'media', media:m.id, behavior:'background', playback:m.type==='video'?'loop':'stop'}); }); save(); ov.remove(); renderPres(); mission('m_media'); toast('Media added. Its behavior defaults to <b>Background</b>. Right-click → Edit Action → Behavior → Foreground.', 'warn'); });
  }});
}
function setBehavior(p, s, b){ const ma=mediaAction(s); ma.behavior=b; if(b==='foreground'){ if(p.name==='Pre-Service Loop') mission('m_fg'); } if(L.slide===s.id && L.media) L.media.behavior=b; save(); renderPres(); renderOutput(); toast('Behavior: '+b); }
function setPlayback(p, s, v){ const ma=mediaAction(s); ma.playback=v; if(v==='stop' && ma.media==='vid_announce') mission('m_stop'); if(L.slide===s.id && L.media) L.media.playback=v; save(); renderPres(); renderPlayer(); toast('Playback: '+(v==='stop'?'Stop at end':'Loop')); }
function pasteSlides(p, after){
  if(!UI.clipboard) return;
  const at = p.slides.indexOf(after)+1;
  const copies = UI.clipboard.map(x=>Object.assign(JSON.parse(JSON.stringify(x)), {id:uid('s')}));
  if(p.kind==='song') copies.forEach(c=>{ if(!p.groups[c.group]) c.group = after.group; });
  p.slides.splice(at, 0, ...copies); save(); renderPres(); toast(`Pasted ${copies.length} slide${copies.length>1?'s':''}`);
}
function deleteSlides(p, sel){ p.slides = p.slides.filter(s=>!sel.includes(s)); UI.slideSel.clear(); save(); renderPres(); }
function afterGroupChange(p){ Object.keys(p.groups).forEach(g=>{ if(!p.arrangement.includes(g) && p.slides.some(s=>s.group===g)) p.arrangement.push(g); }); save(); renderPres(); }
function newGroupFor(p, sel){
  modal('New Group', `<div class="field"><span>Group name</span><input type="text" id="gname" value="Tag"></div><div class="field"><span>Colour</span><input type="color" id="gcol" value="#d9822b"></div>`, [{label:'Cancel'},{label:'Create', pri:true, action:ov=>{ const nm=$('#gname',ov).value.trim()||'Group'; const g=uid('g'); p.groups[g]={name:nm, color:$('#gcol',ov).value}; sel.forEach(s=>s.group=g); afterGroupChange(p); mission('m_group'); }}]);
}
function quickEdit(p, s){
  modal('Quick Edit', `<textarea id="qe" rows="5" style="width:100%">${esc(s.text)}</textarea><p class="hint">A stripped-down editor for fixing a word or a typo.</p>`, [{label:'Cancel'},{label:'Save', pri:true, action:ov=>{ const v=$('#qe',ov).value; if(v!==s.text){ s.text=v; mission('m_quick'); } save(); renderPres(); if(L.slide===s.id) renderOutput(); }}]);
}
function editSlide(p, s){
  if(!s){ const ds=displaySlides(p); s = ds[[...UI.slideSel][0]] || ds.find(x=>x.text) || ds[0]; if(!s){ toast('This item has no slides'); return; } }
  const st = styleOf(p, s);
  const draft = {text:s.text, notes:s.notes||'', style:Object.assign({}, s.style||{})};
  const body = `<div class="edgrid"><div>
      <div class="frame checker" id="edprev" style="border-radius:6px"></div>
      <div class="field"><span>Text</span><textarea id="edtext" rows="4">${esc(s.text)}</textarea></div>
      <div class="field"><span>Slide notes (shown on the host’s stage display)</span><textarea id="ednotes" rows="2">${esc(s.notes||'')}</textarea></div>
    </div><div>
      <div class="field"><span>Font</span><select id="edfont">${FONTS.map(f=>`<option ${f===st.font?'selected':''}>${f}</option>`).join('')}</select></div>
      <div class="field"><span>Size</span><input type="range" id="edsize" min="2" max="9" step=".1" value="${st.size||4}"></div>
      <div class="field"><span>Style</span><div class="seg"><button data-k="bold" class="${st.bold?'on':''}"><b>B</b></button><button data-k="italic" class="${st.italic?'on':''}"><i>I</i></button><button data-k="caps" class="${st.caps?'on':''}">AA</button></div></div>
      <div class="field"><span>Alignment</span><div class="seg" id="edalign">${['left','center','right'].map(a=>`<button data-v="${a}" class="${st.align===a?'on':''}">${a}</button>`).join('')}</div></div>
      <div class="field"><span>Vertical position</span><div class="seg" id="edpos">${['top','middle','bottom'].map(a=>`<button data-v="${a}" class="${st.pos===a?'on':''}">${a}</button>`).join('')}</div></div>
      <div class="field"><span>Text colour</span><input type="color" id="edcolor" value="${st.color||'#ffffff'}"></div>
      <label class="check"><input type="checkbox" id="edstroke" ${st.stroke?'checked':''}> Stroke (outline)</label>
      <label class="check"><input type="checkbox" id="edshadow" ${st.shadow?'checked':''}> Shadow</label>
      <p class="hint">Changes here override the theme for this slide only. To restyle a whole song, use Themes instead.</p>
    </div></div>`;
  modal('Edit Slide · '+p.name, body, [{label:'Cancel'},{label:'Save', pri:true, action:()=>{ s.text=draft.text; s.notes=draft.notes; s.style=draft.style; save(); renderPres(); if(L.slide===s.id) renderOutput(); toast('Slide saved'); }}], {wide:true, mount:ov=>{
    const upd = ()=>{ $('#edprev',ov).innerHTML = textHTML(p, Object.assign({}, s, {text:draft.text, style:draft.style, l3name:null})); };
    $('#edtext',ov).oninput = e=>{ draft.text=e.target.value; upd(); };
    $('#ednotes',ov).oninput = e=>{ draft.notes=e.target.value; };
    $('#edfont',ov).onchange = e=>{ draft.style.font=e.target.value; upd(); };
    $('#edsize',ov).oninput = e=>{ draft.style.size=+e.target.value; upd(); };
    $('#edcolor',ov).oninput = e=>{ draft.style.color=e.target.value; upd(); };
    $('#edstroke',ov).onchange = e=>{ draft.style.stroke=e.target.checked; upd(); };
    $('#edshadow',ov).onchange = e=>{ draft.style.shadow=e.target.checked; upd(); };
    ov.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; draft.style[k]=!(draft.style[k]!=null?draft.style[k]:st[k]); b.classList.toggle('on', draft.style[k]); upd(); });
    [['#edalign','align'],['#edpos','pos']].forEach(([sel,k])=>$(sel,ov).querySelectorAll('button').forEach(b=>b.onclick=()=>{ draft.style[k]=b.dataset.v; $(sel,ov).querySelectorAll('button').forEach(x=>x.classList.toggle('on', x===b)); upd(); }));
    upd();
  }});
}

/* ---------------- reflow ---------------- */
function songToReflow(p){
  const parts=[]; Object.keys(p.groups).forEach(g=>{ const ss=p.slides.filter(s=>s.group===g); if(!ss.length) return; parts.push('['+p.groups[g].name+']\n'+ss.map(s=>s.text).join('\n\n')); });
  return parts.join('\n\n');
}
function reflowToSong(p, txt){
  const oldByName = {}; Object.entries(p.groups).forEach(([g,gr])=>oldByName[gr.name]=g);
  const oldSlides = p.slides.slice();
  const newSlides=[]; let cur=null;
  const blocks = txt.replace(/\r/g,'').split(/\n\s*\n/);
  blocks.forEach(b=>{
    let lines=b.split('\n');
    while(lines.length && /^\[.+\]$/.test(lines[0].trim())){ const nm=lines.shift().trim().slice(1,-1).trim(); if(!oldByName[nm]){ const g=uid('g'); p.groups[g]={name:nm, color:'#5d6266'}; oldByName[nm]=g; } cur=oldByName[nm]; }
    const t = lines.join('\n').replace(/^\n+|\n+$/g,'');
    if(!cur) return;
    const prev = oldSlides.find(s=>s.group===cur && !newSlides.includes(s));
    if(t==='' && !(prev && prev.text==='' )) { if(prev && prev.text===''){ newSlides.push(prev); } else if(!lines.length && newSlides.filter(s=>s.group===cur).length===0 && p.groups[cur].name==='Stage Display'){ newSlides.push(prev||{id:uid('s'), group:cur, text:'', actions:[]}); } return; }
    if(prev){ prev.text=t; newSlides.push(prev); } else newSlides.push({id:uid('s'), group:cur, text:t, actions:[]});
  });
  // keep the Stage Display slide(s) even if blank
  oldSlides.filter(s=>p.groups[s.group] && p.groups[s.group].name==='Stage Display' && !newSlides.includes(s)).forEach(s=>newSlides.unshift(s));
  p.slides = newSlides;
  Object.keys(p.groups).forEach(g=>{ if(!p.arrangement.includes(g) && newSlides.some(s=>s.group===g)) p.arrangement.push(g); });
}
function openReflow(p){
  if(!p || p.kind!=='song'){ toast('Reflow works on songs. Select a song first.'); return; }
  let broke=false;
  const body = `<div class="reflow"><div>
      <p class="hint" style="margin-top:0">Each blank line starts a new slide. Lines in [brackets] are groups. Fix single words left alone on a line, and match the lines to how the song is sung. Aim for two lines per slide.</p>
      <textarea id="rf" spellcheck="false">${esc(songToReflow(p))}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" id="rfbreak">Insert Slide Break</button><span class="hint" style="align-self:center">Put the cursor above where the break should go.</span></div>
    </div><div><div class="hint" style="margin-bottom:6px">Preview</div><div class="rprev" id="rfprev"></div></div></div>`;
  modal('Reflow Editor · '+p.name, body, [{label:'Cancel'},{label:'Done', pri:true, action:ov=>{ reflowToSong(p, $('#rf',ov).value); if(broke) mission('m_break'); UI.slideSel.clear(); save(); renderPres(); toast('Song reflowed'); }}], {wide:true, mount:ov=>{
    const ta = $('#rf',ov);
    const prev = ()=>{ const tmp = JSON.parse(JSON.stringify(p)); const saveNext=S.nextId; reflowToSong(tmp, ta.value); S.nextId=saveNext; $('#rfprev',ov).innerHTML = tmp.slides.filter(s=>s.text).map(s=>`<div class="frame checker" style="border-radius:4px">${textHTML(tmp,s)}</div>`).join(''); };
    ta.oninput = prev;
    $('#rfbreak',ov).onclick = ()=>{ const pos = ta.selectionStart; const v = ta.value; const lineEnd = v.indexOf('\n', pos); const at = lineEnd<0 ? v.length : lineEnd; ta.value = v.slice(0,at)+'\n'+v.slice(at); ta.focus(); ta.selectionStart=ta.selectionEnd=at+1; broke=true; prev(); };
    prev();
  }});
}

/* ---------------- songs: new / import ---------------- */
function themeOptions(sel){ return Object.entries(THEMES).filter(([k,t])=>!t.hidden).map(([k,t])=>`<option value="${k}" ${k===sel?'selected':''}>${esc(t.label)}</option>`).join(''); }
function libOptions(sel){ return S.libraries.map(l=>`<option value="${l.id}" ${l.id===sel?'selected':''}>${esc(l.name)}</option>`).join(''); }
function plOptions(sel){ return '<option value="">No playlist</option>'+S.playlists.map(l=>`<option value="${l.id}" ${l.id===sel?'selected':''}>${esc(l.name)}</option>`).join(''); }
function newPresentation(){
  const curLib = UI.libSel.kind==='lib'?UI.libSel.id:'lib_worship', curPl = UI.libSel.kind==='pl'?UI.libSel.id:'';
  modal('New Presentation', `<div class="field"><span>Name</span><input type="text" id="npname" placeholder="Name the song"></div>
    <div class="field"><span>Theme</span><select id="nptheme">${themeOptions('song-bottom')}</select></div>
    <div class="two"><div class="field"><span>Library</span><select id="nplib">${libOptions(curLib)}</select></div><div class="field"><span>Playlist</span><select id="nppl">${plOptions(curPl)}</select></div></div>
    <label class="check"><input type="checkbox" id="npsong" checked> This is a song (adds groups and an arrangement)</label>
    <p class="hint">At Sanctus, every song goes in the <b>Worship</b> library, with the Song theme for your campus.</p>`,
    [{label:'Cancel'},{label:'New', pri:true, action:ov=>{
      const name = $('#npname',ov).value.trim(); if(!name){ $('#npname',ov).focus(); return false; }
      const theme = $('#nptheme',ov).value, isSong = $('#npsong',ov).checked; const pid=uid('p');
      if(isSong){ const sd=uid('g'), v=uid('g'); S.presentations[pid]={id:pid,name,kind:'song',theme,groups:{[sd]:{name:'Stage Display',color:'#2f9e57'},[v]:{name:'Verse 1',color:'#2f6fd6'}},slides:[{id:uid('s'),group:sd,text:'',actions:[]},{id:uid('s'),group:v,text:'Type your lyrics here',actions:[]}],arrangement:[sd,v]}; }
      else S.presentations[pid]={id:pid,name,kind:'slides',theme,groups:{},slides:[{id:uid('s'),text:'',actions:[]}],arrangement:null};
      const lib=S.libraries.find(l=>l.id===$('#nplib',ov).value); lib.items.push(pid);
      const pl=S.playlists.find(l=>l.id===$('#nppl',ov).value); if(pl) pl.entries.push({type:'item', pres:pid});
      if(isSong && theme.startsWith('song-')) mission('m_newpres');
      UI.presSel=pid; save(); renderAll(); toast('Created “'+esc(name)+'”');
    }}]);
}
function songSelect(){
  let pick = null;
  const body = `<div class="two"><div><input type="text" id="ssq" placeholder="Search songs or catalog number" style="width:100%;margin-bottom:8px"><div class="sres" id="ssres"></div><p class="hint">Demo catalog. All songs are original practice songs, not real worship songs.</p></div>
    <div><div id="ssprev" class="lyr">Select a song to preview its lyrics.</div>
    <div class="field"><span>Lines per slide</span><input type="number" id="sslines" min="1" max="6" value="2"></div>
    <div class="field"><span>Theme</span><select id="sstheme">${themeOptions('song-bottom')}</select></div>
    <div class="two"><div class="field"><span>Library</span><select id="sslib">${libOptions('lib_worship')}</select></div><div class="field"><span>Playlist</span><select id="sspl">${plOptions(UI.libSel.kind==='pl'?UI.libSel.id:'')}</select></div></div></div></div>`;
  modal('SongSelect (demo catalog)', body, [{label:'Cancel'},{label:'Import', pri:true, action:ov=>{
    if(!pick){ toast('Choose a song first'); return false; }
    const lines = Math.max(1, +$('#sslines',ov).value||2); const theme=$('#sstheme',ov).value;
    const pid=uid('p'); const groups={}; const slides=[]; const sd=uid('g'); groups[sd]={name:'Stage Display',color:'#2f9e57'}; slides.push({id:uid('s'),group:sd,text:'',actions:[]});
    const col={Verse:'#2f6fd6',Chorus:'#d23a4f',Bridge:'#7b45d1',Tag:'#d9822b'}; const arrangement=[sd];
    pick.sections.forEach(([nm, ls])=>{ const g=uid('g'); groups[g]={name:nm,color:col[nm.split(' ')[0]]||'#5d6266'}; arrangement.push(g); for(let i=0;i<ls.length;i+=lines) slides.push({id:uid('s'),group:g,text:ls.slice(i,i+lines).join('\n'),actions:[]}); });
    // imports sometimes leave a stray word on its own line, like real imports do
    const last = slides[slides.length-1]; if(last && last.text.includes(' ')){ const w=last.text.split(' '); last.text = w.slice(0,-1).join(' ')+'\n'+w[w.length-1]; }
    S.presentations[pid]={id:pid,name:pick.title,kind:'song',theme,groups,slides,arrangement,ccli:pick.ccli};
    const libId=$('#sslib',ov).value; S.libraries.find(l=>l.id===libId).items.push(pid);
    const pl=S.playlists.find(l=>l.id===$('#sspl',ov).value); if(pl) pl.entries.push({type:'item', pres:pid});
    if(libId==='lib_worship') mission('m_import'); else toast('Tip: songs belong in the Worship library.', 'warn');
    UI.presSel=pid; save(); renderAll(); toast('Imported “'+esc(pick.title)+'”. Check it for stray words and fix them with Reflow.');
  }}], {wide:true, mount:ov=>{
    const draw = ()=>{ const q=$('#ssq',ov).value.toLowerCase(); $('#ssres',ov).innerHTML = SIM_CATALOG.filter(c=>!q||c.title.toLowerCase().includes(q)||c.ccli.toLowerCase().includes(q)).map(c=>`<div class="r${pick===c?' sel':''}" data-c="${c.ccli}">${esc(c.title)}<small>${esc(c.authors)} · ${c.ccli}</small></div>`).join('') || '<div class="r">No results</div>'; ov.querySelectorAll('[data-c]').forEach(r=>r.onclick=()=>{ pick=SIM_CATALOG.find(c=>c.ccli===r.dataset.c); $('#ssprev',ov).textContent = pick.title+'\n'+pick.ccli+'\n\n'+pick.sections.map(([n,l])=>n+'\n'+l.join('\n')).join('\n\n'); draw(); }); };
    $('#ssq',ov).oninput = draw; draw();
  }});
}

/* ---------------- macros & stage editors ---------------- */
function macroEditor(m){
  const isNew = !m; m = m ? JSON.parse(JSON.stringify(m)) : {id:uid('mac'), name:'New Macro', color:'#2aa198', actions:[]};
  const drawActs = ov => { $('#maacts',ov).innerHTML = m.actions.map((a,i)=>`<div class="card" style="display:flex;align-items:center;gap:8px;padding:6px 10px"><span style="flex:1">${esc(actLabel(a))}</span><button class="ibtn" data-rma="${i}">Remove</button></div>`).join('') || '<p class="hint">No actions yet. Use Add Action.</p>'; ov.querySelectorAll('[data-rma]').forEach(b=>b.onclick=()=>{ m.actions.splice(+b.dataset.rma,1); drawActs(ov); }); };
  modal(isNew?'New Macro':'Edit Macro', `<div class="two"><div class="field"><span>Name</span><input type="text" id="maname" value="${esc(m.name)}"></div><div class="field"><span>Colour</span><input type="color" id="macol" value="${m.color}"></div></div>
    <div class="field"><span>Actions</span><div id="maacts"></div></div><button class="btn" id="maadd">+ Add Action</button>`,
    [isNew?null:{label:'Delete', danger:true, action:()=>{ S.macros=S.macros.filter(x=>x.id!==m.id); save(); renderTabs(); }},{label:'Cancel'},{label:'Save', pri:true, action:ov=>{ m.name=$('#maname',ov).value.trim()||'Macro'; m.color=$('#macol',ov).value; const i=S.macros.findIndex(x=>x.id===m.id); if(i<0) S.macros.push(m); else S.macros[i]=m; if(m.actions.length>=2 && isNew) mission('m_newmacro'); save(); renderTabs(); toast('Macro saved'); }}].filter(Boolean), {mount:ov=>{
    drawActs(ov);
    $('#maadd',ov).onclick = e=>{ const r=e.target.getBoundingClientRect(); showMenu(r.left, r.bottom+4, [
      {label:'Clear', sub:['all','slide','media','props','messages'].map(w=>({label:actLabel({type:'clear',what:w}), action:()=>{ m.actions.push({type:'clear',what:w}); drawActs(ov); }}))},
      {label:'Stage Layout', sub:S.stageLayouts.map(l=>({label:l.name, action:()=>{ m.actions.push({type:'stage',layout:l.id}); drawActs(ov); }}))},
      {label:'Start Timer', sub:S.timers.map(t=>({label:t.name, action:()=>{ m.actions.push({type:'timer',timer:t.id}); drawActs(ov); }}))},
      {label:'Reset Timer', sub:S.timers.map(t=>({label:t.name, action:()=>{ m.actions.push({type:'timerreset',timer:t.id}); drawActs(ov); }}))}
    ]); e.stopPropagation(); };
  }});
}
function stageEditor(lay){
  const isNew = !lay; lay = lay ? JSON.parse(JSON.stringify(lay)) : {id:uid('st'), name:'New Layout', els:[{type:'clock',x:2,y:2,w:20,h:12,size:5}]};
  let sel = null;
  const body = `<div class="edgrid"><div><div class="frame stcanvas" id="stc" style="border-radius:6px"></div><p class="hint">Drag elements to move them. Drag the corner square to resize.</p></div><div>
    <div class="field"><span>Layout name</span><input type="text" id="stname" value="${esc(lay.name)}"></div>
    <div class="field"><span>Add element</span><select id="stadd"><option value="">Choose…</option><option value="current">Linked text: Current Slide</option><option value="next">Linked text: Next Slide</option><option value="notes">Linked text: Slide Notes</option><option value="clock">System Clock</option><option value="timer">Timer</option><option value="video">Video Countdown</option><option value="message">Stage Message</option><option value="text">Static text</option></select></div>
    <div id="stprops"></div></div></div>`;
  modal(isNew?'Stage Editor · New Layout':'Stage Editor · '+lay.name, body, [isNew?null:{label:'Delete', danger:true, action:()=>{ S.stageLayouts=S.stageLayouts.filter(x=>x.id!==lay.id); if(L.stage===lay.id) L.stage='st_blank'; save(); renderTabs(); renderOutput(); }},{label:'Cancel'},{label:'Save', pri:true, action:ov=>{ lay.name=$('#stname',ov).value.trim()||'Layout'; const i=S.stageLayouts.findIndex(x=>x.id===lay.id); if(i<0) S.stageLayouts.push(lay); else S.stageLayouts[i]=lay; const t=lay.els.map(e=>e.type); if(t.includes('current')&&t.includes('next')) mission('m_stagenew'); save(); renderTabs(); toast('Stage layout saved'); }}].filter(Boolean), {wide:true, mount:ov=>{
    const c = $('#stc',ov);
    const draw = ()=>{
      c.innerHTML = lay.els.map((e,i)=>`<div class="stel${sel===i?' sel':''}" data-i="${i}" style="left:${e.x}%;top:${e.y}%;width:${e.w}%;height:${e.h}%">${stageElHTML(Object.assign({},e,{x:0,y:0,w:100,h:100}), liveContext(), true)}<span class="lbl">${e.type}</span><span class="rz"></span></div>`).join('');
      const pp = $('#stprops',ov); const e = lay.els[sel];
      if(!e){ pp.innerHTML = '<p class="hint">Select an element to change its settings.</p>'; return; }
      pp.innerHTML = `<div class="field"><span>Element</span><b>${e.type}</b></div>
        ${e.type==='text'?`<div class="field"><span>Text</span><input type="text" id="sptext" value="${esc(e.text||'')}"></div>`:''}
        ${e.type==='timer'?`<div class="field"><span>Linked timer</span><select id="sptimer">${S.timers.map(t=>`<option value="${t.id}" ${t.id===e.timer?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>`:''}
        <div class="field"><span>Font size</span><input type="range" id="spsize" min="2" max="18" step=".5" value="${e.size||5}"></div>
        <div class="field"><span>Alignment</span><div class="seg" id="spal">${['left','center','right'].map(a=>`<button data-v="${a}" class="${(e.align||'left')===a?'on':''}">${a}</button>`).join('')}</div></div>
        <button class="btn danger" id="spdel">Remove element</button>`;
      const st=$('#sptext',ov); if(st) st.oninput=ev=>{ e.text=ev.target.value; drawEls(); };
      const tm=$('#sptimer',ov); if(tm) tm.onchange=ev=>{ e.timer=ev.target.value; drawEls(); };
      $('#spsize',ov).oninput=ev=>{ e.size=+ev.target.value; drawEls(); };
      $('#spal',ov).querySelectorAll('button').forEach(b=>b.onclick=()=>{ e.align=b.dataset.v; draw(); });
      $('#spdel',ov).onclick=()=>{ lay.els.splice(sel,1); sel=null; draw(); };
    };
    const drawEls = ()=>{ c.querySelectorAll('.stel').forEach(d=>{ const e=lay.els[+d.dataset.i]; d.firstElementChild.outerHTML = stageElHTML(Object.assign({},e,{x:0,y:0,w:100,h:100}), liveContext(), true); }); };
    c.addEventListener('pointerdown', ev=>{
      const d = ev.target.closest('.stel'); if(!d) { sel=null; draw(); return; }
      const i=+d.dataset.i; const e=lay.els[i]; const resize = ev.target.classList.contains('rz');
      if(sel!==i){ sel=i; draw(); }
      const r=c.getBoundingClientRect(); const sx=ev.clientX, sy=ev.clientY; const o={x:e.x,y:e.y,w:e.w,h:e.h};
      const mv = mv2=>{ const dx=(mv2.clientX-sx)/r.width*100, dy=(mv2.clientY-sy)/r.height*100;
        if(resize){ e.w=Math.max(5,Math.min(100-e.x,o.w+dx)); e.h=Math.max(5,Math.min(100-e.y,o.h+dy)); } else { e.x=Math.max(0,Math.min(100-e.w,o.x+dx)); e.y=Math.max(0,Math.min(100-e.h,o.y+dy)); }
        const el=c.querySelector(`.stel[data-i="${i}"]`); el.style.left=e.x+'%'; el.style.top=e.y+'%'; el.style.width=e.w+'%'; el.style.height=e.h+'%'; };
      const up = ()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); };
      addEventListener('pointermove',mv); addEventListener('pointerup',up); ev.preventDefault();
    });
    $('#stadd',ov).onchange = ev=>{ const t=ev.target.value; if(!t) return; const defs={current:{w:90,h:40,size:6,align:'center'},next:{w:90,h:30,size:5,align:'center'},notes:{w:90,h:60,size:4.5},clock:{w:22,h:12,size:5},timer:{w:30,h:16,size:6,timer:'t_worship'},video:{w:40,h:20,size:8,align:'center'},message:{w:90,h:12,size:4,align:'center'},text:{w:40,h:12,size:4,text:'Text'}}; lay.els.push(Object.assign({type:t,x:5,y:30},defs[t])); sel=lay.els.length-1; ev.target.value=''; draw(); };
    draw();
  }});
}

/* ---------------- playlist / library ops ---------------- */
function itemMenu(x, y, pid, ix){
  const p = P(pid); const isPl = UI.libSel.kind==='pl';
  showMenu(x, y, [
    p.kind==='song'?{label:'Reflow', action:()=>{ UI.presSel=pid; renderAll(); openReflow(p); }}:null,
    {label:'Rename…', action:()=>renamePrompt('Rename presentation', p.name, v=>{ p.name=v; save(); renderAll(); })},
    {label:'Add to Playlist', sub:S.playlists.map(pl=>({label:pl.name, action:()=>{ pl.entries.push({type:'item',pres:pid}); mission('m_drag'); save(); renderAll(); toast('Added to '+esc(pl.name)); }}))},
    '-',
    isPl ? {label:'Remove from Playlist', action:()=>{ curList().entries.splice(ix,1); save(); renderAll(); }} :
      {label:'Delete from Library', action:()=>modal('Delete presentation?', `<p>Delete <b>${esc(p.name)}</b> from the library? It will also be removed from every playlist.</p>`, [{label:'Cancel'},{label:'Delete', danger:true, action:()=>{ S.libraries.forEach(l=>l.items=l.items.filter(i=>i!==pid)); S.playlists.forEach(pl=>pl.entries=pl.entries.filter(e=>e.pres!==pid)); delete S.presentations[pid]; if(UI.presSel===pid) UI.presSel=null; if(L.pres===pid) clearLayer('slide',true); save(); renderAll(); }}])}
  ].filter(Boolean));
}
function renamePrompt(title, val, cb){ modal(title, `<div class="field"><span>Name</span><input type="text" id="rnv" value="${esc(val)}"></div>`, [{label:'Cancel'},{label:'Save', pri:true, action:ov=>{ const v=$('#rnv',ov).value.trim(); if(v) cb(v); }}]); }
function itemPlus(e){
  const r = e.target.getBoundingClientRect(); const isPl = UI.libSel.kind==='pl';
  showMenu(r.left, r.bottom+4, [
    {label:'New Presentation…', action:newPresentation},
    isPl?{label:'New Header…', action:()=>renamePrompt('New Header', 'Pre-Service', v=>{ curList().entries.push({type:'header', name:v}); mission('m_header'); save(); renderAll(); })}:null,
    {label:'Import from SongSelect…', action:songSelect}
  ].filter(Boolean));
}

/* ---------------- events ---------------- */
function bind(){
  document.addEventListener('click', e=>{
    const t = e.target;
    const act = t.closest('[data-act]'); if(act){ const a=act.dataset.act;
      if(a==='newlib') renamePrompt('New Library', 'New Library', v=>{ S.libraries.push({id:uid('lib'), name:v, items:[]}); save(); renderLists(); });
      if(a==='newpl') renamePrompt('New Playlist', 'New Playlist', v=>{ const id=uid('pl'); S.playlists.push({id, name:v, entries:[]}); UI.libSel={kind:'pl',id}; save(); renderAll(); });
      if(a==='itemplus') { itemPlus(e); e.stopPropagation(); }
      const bp = act.dataset.pid ? P(act.dataset.pid) : P(UI.presSel); if(act.dataset.pid && UI.presSel!==act.dataset.pid){ UI.presSel=act.dataset.pid; UI.slideSel.clear(); }
      if(a==='reflow') openReflow(bp);
      if(a==='edit') { if(bp) editSlide(bp); else toast('Select an item first'); }
      if(a==='addslide'){ const p=bp; if(!p) return; const ds=displaySlides(p); const lastSel=ds[Math.max(...[...UI.slideSel], ds.length-1)]; const ns={id:uid('s'), text:'New slide', actions:[], group: lastSel?lastSel.group:(Object.keys(p.groups)[1]||Object.keys(p.groups)[0])}; const at = lastSel? p.slides.indexOf(lastSel)+1 : p.slides.length; p.slides.splice(at,0,ns); if(p.kind==='song') afterGroupChange(p); save(); renderPres(); }
      if(a==='vtoggle' && L.video){ L.video.paused=!L.video.paused; renderPlayer(); }
      if(a==='vrestart' && L.video){ L.video.pos=0; L.video.paused=false; renderPlayer(); }
      if(a==='showmsg'){ const m=S.messages[0]; m.code=($('#kidcode')||{}).value||m.code; L.message=m.template.replace('{code}', m.code.toUpperCase()); L.messageUntil=Date.now()+m.autoClear*1000; mission('m_kids'); save(); renderOutput(); renderTabs(); }
      if(a==='clearmsg'){ clearLayer('messages'); }
      if(a==='newmacro') macroEditor(null);
      if(a==='newstage') stageEditor(null);
      if(a==='clear') clearLayer(act.dataset.what);
      if(a==='missions'){ const d=$('#drawer'); d.classList.toggle('open'); renderDrawer(); }
      if(a==='closemissions') $('#drawer').classList.remove('open');
      if(a==='reset') modal('Reset the simulator?', '<p>This puts all the demo content back the way it started and clears your mission progress.</p>', [{label:'Cancel'},{label:'Reset', danger:true, action:()=>{ try{ localStorage.removeItem(LS);}catch(e){} S=SIM_SEED(); Object.assign(L,{pres:null,slide:null,idx:-1,text:null,media:null,video:null,props:[],message:null,stage:'st_service'}); UI.presSel=null; UI.libSel={kind:'pl',id:'pl_sunday'}; UI.slideSel.clear(); renderAll(); renderDrawer(); toast('Simulator reset'); }}]);
      if(a==='help') showHelp();
      if(a==='tog-aud'){ UI.audienceOn=!UI.audienceOn; act.classList.toggle('on',UI.audienceOn); renderOutput(); }
      if(a==='tog-stage'){ UI.stageOn=!UI.stageOn; act.classList.toggle('on',UI.stageOn); renderOutput(); }
      if(a==='file'){ const r=act.getBoundingClientRect(); showMenu(r.left, r.bottom+4, [{label:'New Presentation…', action:newPresentation},{label:'New Library…', action:()=>$('[data-act=newlib]').click()},{label:'New Playlist…', action:()=>$('[data-act=newpl]').click()},'-',{label:'Import', sub:[{label:'SongSelect by CCLI (demo)…', action:songSelect},{label:'File… (not in demo)', disabled:true},{label:'PowerPoint… (not in demo)', disabled:true}]}]); e.stopPropagation(); }
      if(a==='themes'){ const r=act.getBoundingClientRect(); const p=P(UI.presSel); if(!p){ toast('Select an item first'); return; } const sel=selectedSlides(p).length?selectedSlides(p):p.slides; showMenu(r.left, r.bottom+4, Object.entries(THEMES).filter(([k,t])=>!t.hidden).map(([k,t])=>({label:t.label, action:()=>applyTheme(p, sel, k)}))); e.stopPropagation(); }
      if(a==='stageeditor') stageEditor(S.stageLayouts.find(l=>l.id===L.stage));
      if(a==='search') globalSearch();
      return;
    }
    const lib = t.closest('[data-lib]'); if(lib){ UI.libSel={kind:'lib', id:lib.dataset.lib}; UI.filter=''; renderLists(); renderItems(); return; }
    const pl = t.closest('[data-pl]'); if(pl){ UI.libSel={kind:'pl', id:pl.dataset.pl}; UI.filter=''; renderLists(); renderItems(); return; }
    const it = t.closest('#itemlist [data-pres]'); if(it){ if(UI.presSel!==it.dataset.pres){ UI.presSel=it.dataset.pres; UI.slideSel.clear(); } renderItems(); renderPres(); if(it.dataset.ix!=null) scrollToBlock(it.dataset.ix); return; }
    const hdrRow = t.closest('#itemlist .hdr'); if(hdrRow){ const el=$('#blk-h'+hdrRow.dataset.ix); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
    const rm = t.closest('[data-rm]'); if(rm){ const p=P(rm.closest('[data-pid]').dataset.pid); p.arrangement.splice(+rm.dataset.rm,1); mission('m_arr'); save(); renderPres(); return; }
    const sl = t.closest('.slide'); if(sl){ const i=+sl.dataset.i; const p=P(sl.dataset.pid); if(UI.presSel!==p.id){ UI.presSel=p.id; UI.slideSel.clear(); UI.anchor=null; renderItems(); }
      if(e.shiftKey && UI.anchor!=null){ const [a,b]=[Math.min(UI.anchor,i),Math.max(UI.anchor,i)]; UI.slideSel=new Set(Array.from({length:b-a+1},(_,k)=>a+k)); renderPres(); return; }
      if(e.metaKey||e.ctrlKey){ UI.slideSel.has(i)?UI.slideSel.delete(i):UI.slideSel.add(i); UI.anchor=i; renderPres(); return; }
      UI.slideSel=new Set([i]); UI.anchor=i; goLive(p.id, i); return; }
    const mc = t.closest('[data-editmacro]'); if(mc){ macroEditor(S.macros.find(m=>m.id===mc.dataset.editmacro)); return; }
    const mac = t.closest('[data-macro]'); if(mac){ runMacro(S.macros.find(m=>m.id===mac.dataset.macro)); return; }
    const es = t.closest('[data-editstage]'); if(es){ stageEditor(S.stageLayouts.find(l=>l.id===es.dataset.editstage)); return; }
    const sg = t.closest('[data-stage]'); if(sg){ L.stage=sg.dataset.stage; mission('m_stage'); renderTabs(); renderOutput(); toast('Stage display: '+esc(S.stageLayouts.find(l=>l.id===L.stage).name)); return; }
    const pr = t.closest('[data-prop]'); if(pr){ const p=S.props.find(x=>x.id===pr.dataset.prop); L.props=L.props.filter(x=>x.id!==p.id).concat([Object.assign({},p,{until:Date.now()+10000})]); mission('m_prop'); renderOutput(); renderTabs(); return; }
    const ts = t.closest('[data-tstart]'); if(ts){ const tm=S.timers.find(x=>x.id===ts.dataset.tstart); if(tm.running){ tm.elapsed+=(Date.now()-tm.startedAt)/1000; tm.running=false; } else { tm.startedAt=Date.now(); tm.running=true; } renderTabs(); return; }
    const tr = t.closest('[data-treset]'); if(tr){ const tm=S.timers.find(x=>x.id===tr.dataset.treset); tm.elapsed=0; tm.running=false; renderTabs(); return; }
    const tb = t.closest('.tabs button'); if(tb){ UI.tab=tb.dataset.tab; renderTabs(); return; }
  });
  document.addEventListener('dblclick', e=>{ const g=e.target.closest('.grow [data-g]'); if(g){ const p=P(g.closest('[data-pid]').dataset.pid); p.arrangement.push(g.dataset.g); mission('m_arr'); save(); renderPres(); } });
  document.addEventListener('contextmenu', e=>{
    const sl = e.target.closest('.slide'); if(sl){ e.preventDefault(); const p=P(sl.dataset.pid); if(UI.presSel!==p.id){ UI.presSel=p.id; UI.slideSel.clear(); renderItems(); } const ds=displaySlides(p); slideMenu(p, ds[+sl.dataset.i], +sl.dataset.i, e.clientX, e.clientY); return; }
    const it = e.target.closest('#itemlist [data-pres]'); if(it){ e.preventDefault(); itemMenu(e.clientX, e.clientY, it.dataset.pres, it.dataset.ix!=null?+it.dataset.ix:null); return; }
    const hd = e.target.closest('#itemlist .hdr'); if(hd){ e.preventDefault(); const ix=+hd.dataset.ix; const en=curList().entries[ix]; showMenu(e.clientX,e.clientY,[{label:'Rename Header…', action:()=>renamePrompt('Rename header', en.name, v=>{ en.name=v; save(); renderItems(); })},{label:'Delete Header', action:()=>{ curList().entries.splice(ix,1); save(); renderItems(); }}]); return; }
    const mac = e.target.closest('[data-macro]'); if(mac){ e.preventDefault(); macroEditor(S.macros.find(m=>m.id===mac.dataset.macro)); return; }
  });
  document.addEventListener('input', e=>{ if(e.target.id==='filter'){ UI.filter=e.target.value; const pos=e.target.selectionStart; renderItems(); const f=$('#filter'); f.focus(); f.setSelectionRange(pos,pos); } if(e.target.id==='thumbsize'){ UI.thumb=+e.target.value; $('#grid').style.setProperty('--thumb', UI.thumb+'px'); } });
  $('#prevsel').addEventListener('change', e=>{ UI.preview=e.target.value; if(UI.preview==='stage') mission('m_stageprev'); renderOutput(); });

  // drag & drop: library/playlist items, playlist reorder, arrangement chips
  let drag=null;
  document.addEventListener('dragstart', e=>{
    const it = e.target.closest('#itemlist .row'); const chip = e.target.closest('.chip');
    if(chip){ const cp=chip.closest('[data-pid]').dataset.pid; drag = chip.dataset.g ? {kind:'group', g:chip.dataset.g, pid:cp} : {kind:'arr', i:+chip.dataset.ai, pid:cp}; chip.classList.add('dragging'); }
    else if(it){ drag = UI.libSel.kind==='pl' ? {kind:'entry', ix:+it.dataset.ix} : {kind:'libitem', pres:it.dataset.pres}; }
    if(drag) e.dataTransfer.setData('text/plain','x'), e.dataTransfer.effectAllowed='copyMove';
  });
  document.addEventListener('dragend', e=>{ document.querySelectorAll('.dragging,.drop').forEach(x=>x.classList.remove('dragging','drop')); drag=null; });
  document.addEventListener('dragover', e=>{
    if(!drag) return;
    const pl = e.target.closest('[data-pl]'), row = e.target.closest('#itemlist .row'), arow = e.target.closest('.arow');
    document.querySelectorAll('.drop').forEach(x=>x.classList.remove('drop'));
    if(drag.kind==='libitem' && pl){ e.preventDefault(); pl.classList.add('drop'); }
    else if(drag.kind==='entry' && row){ e.preventDefault(); row.classList.add('drop'); }
    else if((drag.kind==='group'||drag.kind==='arr') && arow && arow.dataset.pid===drag.pid){ e.preventDefault(); arow.classList.add('drop'); }
  });
  document.addEventListener('drop', e=>{
    if(!drag) return; e.preventDefault();
    const pl = e.target.closest('[data-pl]'), row = e.target.closest('#itemlist .row'), arow = e.target.closest('.arow');
    if(drag.kind==='libitem' && pl){ const L2=S.playlists.find(x=>x.id===pl.dataset.pl); L2.entries.push({type:'item', pres:drag.pres}); mission('m_drag'); save(); renderLists(); toast('Added to '+esc(L2.name)); }
    else if(drag.kind==='entry' && row){ const en=curList().entries; const to=+row.dataset.ix; const [x]=en.splice(drag.ix,1); en.splice(to>drag.ix?to-1:to,0,x); save(); renderItems(); }
    else if(arow && arow.dataset.pid===drag.pid){ const p=P(arow.dataset.pid); const chips=[...arow.querySelectorAll('.chip')]; let to=chips.length; for(let k=0;k<chips.length;k++){ const r=chips[k].getBoundingClientRect(); if(e.clientY<r.bottom && e.clientX<r.left+r.width/2){ to=k; break; } }
      if(drag.kind==='group') p.arrangement.splice(to,0,drag.g); else { const [x]=p.arrangement.splice(drag.i,1); p.arrangement.splice(to>drag.i?to-1:to,0,x); }
      mission('m_arr'); save(); renderPres(); }
    drag=null; document.querySelectorAll('.drop').forEach(x=>x.classList.remove('drop'));
  });

  document.addEventListener('keydown', e=>{
    if(e.target.closest('input,textarea,select') || document.querySelector('.ov')){ if(e.key==='Escape'){ const ov=document.querySelector('.ov'); if(ov) ov.remove(); closeMenu(); } return; }
    if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' '||e.key==='PageDown'){ e.preventDefault(); advance(1); }
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='PageUp'){ e.preventDefault(); advance(-1); }
    else if(e.key==='F1'){ e.preventDefault(); clearLayer('all'); }
    else if(e.key==='F2'){ e.preventDefault(); clearLayer('slide'); }
    else if(e.key==='F3'){ e.preventDefault(); clearLayer('media'); }
    else if(e.key==='Escape'){ closeMenu(); $('#drawer').classList.remove('open'); }
  });
}
function globalSearch(){
  modal('Search everything', `<input type="text" id="gsq" placeholder="Song or item name" style="width:100%"><div class="sres" id="gsres" style="margin-top:8px"></div>`, [{label:'Close'}], {mount:ov=>{
    const draw=()=>{ const q=$('#gsq',ov).value.toLowerCase(); const res=Object.values(S.presentations).filter(p=>!q||p.name.toLowerCase().includes(q)); $('#gsres',ov).innerHTML=res.map(p=>{ const lib=S.libraries.find(l=>l.items.includes(p.id)); return `<div class="r" data-g="${p.id}">${esc(p.name)}<small>${esc(lib?lib.name:'')}</small></div>`; }).join(''); ov.querySelectorAll('[data-g]').forEach(r=>r.onclick=()=>{ const p=r.dataset.g; const lib=S.libraries.find(l=>l.items.includes(p)); if(lib) UI.libSel={kind:'lib',id:lib.id}; UI.presSel=p; UI.slideSel.clear(); ov.remove(); renderAll(); }); };
    $('#gsq',ov).oninput=draw; draw();
  }});
}
function showHelp(){
  modal('How to use the simulator', `<div class="hint" style="font-size:12.5px;line-height:1.7;color:var(--text)">
    <p><b>Click a slide</b> to send it live. The preview on the right shows what the auditorium sees, with a pretend camera (IMAG) behind transparent slides. Switch the preview to <b>Stage</b> to see what the band and host see.</p>
    <p><b>Right-click a slide</b> for Quick Edit, Edit Slide, Themes, Go to Next Timer, Add Media Action, Edit Action (Behavior, Playback), Add Action → Macro, Group, Copy, Paste and Delete.</p>
    <p><b>Right-click a song</b> in the playlist for Reflow. <b>Drag</b> library items onto a playlist, drag playlist rows to reorder them, and drag group chips into the arrangement row.</p>
    <p><b>Keys:</b> → or Space for the next slide, ← for the previous slide, F1 Clear All, F2 Clear Slide, F3 Clear Media.</p>
    <p>Open <b>Practice missions</b> for exercises that tick off on their own as you complete them. Your work saves in this browser. Use <b>Reset</b> to start over.</p>
    <p style="color:var(--muted)">This is a practice simulator modelled on the ProPresenter workflow used at Sanctus. It is not ProPresenter and isn’t affiliated with Renewed Vision. Demo songs are original practice songs. Scripture is from the World English Bible (public domain).</p></div>`, [{label:'Got it', pri:true}], {wide:true});
}

/* ---------------- boot ---------------- */
function boot(){
  camCanvas = $('#cam'); camCtx = camCanvas.getContext('2d'); requestAnimationFrame(camLoop);
  bind();
  UI.presSel = S.playlists[0].entries.find(e=>e.type==='item' && P(e.pres) && P(e.pres).kind==='song') ? S.playlists[0].entries.find(e=>e.type==='item' && P(e.pres).kind==='song').pres : null;
  renderAll();
  try{ if(!localStorage.getItem(LS+'-seen')){ localStorage.setItem(LS+'-seen','1'); showHelp(); } }catch(e){ }
}
boot();
})();
