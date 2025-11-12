
document.addEventListener('DOMContentLoaded', function(){
  const STORAGE_KEY = 'putting_league_final_v1';
  let state = { teams: [], teamSize:2, locked:false, swissRound:0, swissTotal:0, swissMatches:[], bracket:[] };

  // DOM refs
  const playerPool = document.getElementById('playerPool');
  const teamSizeEl = document.getElementById('teamSize');
  const swissRoundsEl = document.getElementById('swissRounds');
  const randomizeBtn = document.getElementById('randomizeBtn');
  const lockBtn = document.getElementById('lockBtn');
  const teamsList = document.getElementById('teamsList');
  const lockedNote = document.getElementById('lockedNote');
  const lockedFlag = document.getElementById('lockedFlag');
  const roundLabel = document.getElementById('roundLabel');
  const swissGrid = document.getElementById('swissGrid');
  const submitSwiss = document.getElementById('submitSwiss');
  const nextSwiss = document.getElementById('nextSwiss');
  const statusText = document.getElementById('statusText');
  const standingsCard = document.getElementById('standingsCard');
  const standingsGrid = document.getElementById('standingsGrid');
  const cutCard = document.getElementById('cutCard');
  const cutSizeEl = document.getElementById('cutSize');
  const makeCut = document.getElementById('makeCut');
  const bracketCard = document.getElementById('bracketCard');
  const bracketArea = document.getElementById('bracketArea');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const pauseMessage = document.getElementById('pauseMessage');
  const pauseProceed = document.getElementById('pauseProceed');
  const splash = document.getElementById('splash');
  const splashProceed = document.getElementById('splashProceed');
  const clearCacheBtn = document.getElementById('clearCacheBtn');

  function uid(){ return 't'+Math.random().toString(36).slice(2,9); }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function load(){ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return false; try{ Object.assign(state, JSON.parse(raw)); return true;}catch(e){console.error(e);return false;} }
  function splitNames(raw){ return raw.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean); }
  function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }

  function renderTeamsList(){ teamsList.innerHTML=''; if(!state.teams.length){ teamsList.innerHTML='<em>No teams yet</em>'; return; } state.teams.forEach(function(t){ const row=document.createElement('div'); row.className='team-row'; const name=document.createElement('input'); name.value=t.name; name.oninput=function(){ t.name=name.value; save(); renderTeamsList(); }; const players=document.createElement('input'); players.value=t.players.join(', '); players.oninput=function(){ t.players=players.value.split(',').map(s=>s.trim()).filter(Boolean); t.name=t.players.join(' & '); save(); renderTeamsList(); }; row.appendChild(name); row.appendChild(players); teamsList.appendChild(row); }); }

  function computeSwissRounds(n){ if(n<=4) return 2; return Math.max(3, Math.ceil(Math.log2(n))); }

  function makeSwissPairings(){ const teams = state.teams.slice(); teams.sort((a,b)=>(b.wins||0)-(a.wins||0)||(b.pd||0)-(a.pd||0)); const ids=teams.map(t=>t.id); const pairs=[]; let i=0; while(i<ids.length){ const a=ids[i]; const b=(i+1<ids.length)?ids[i+1]:null; if(!b){ pairs.push({a:a,b:null,scoreA:null,scoreB:null}); i+=1; continue; } const teamA=state.teams.find(t=>t.id===a); if(teamA && teamA.opponents && teamA.opponents.includes(b) && (i+2<ids.length)){ const c=ids[i+2]; ids[i+1]=c; ids[i+2]=b; pairs.push({a:a,b:ids[i+1],scoreA:null,scoreB:null}); i+=2; } else { pairs.push({a:a,b:b,scoreA:null,scoreB:null}); i+=2; } } return pairs; }

  function renderSwissMatches(){ swissGrid.innerHTML=''; if(!state.swissMatches || !state.swissMatches.length){ swissGrid.innerHTML='<div class="small">No matches — lock teams to start Swiss</div>'; return; } state.swissMatches.forEach(function(m, idx){ const a=state.teams.find(t=>t.id===m.a); const b=m.b?state.teams.find(t=>t.id===m.b):null; const card=document.createElement('div'); card.className='match-card'; if(!b){ card.innerHTML='<div class="match-teams">'+(a?a.name:'—')+'</div><div class="match-players small">'+(a?a.players.join(' • '):'')+'</div><div class="small">BYE (advances)</div>'; } else { card.innerHTML='<div class="match-teams">'+(a?a.name:'—')+' vs '+(b?b.name:'—')+'</div><div class="match-players small">'+(a?a.players.join(' • '):'')+' &nbsp; vs &nbsp; '+(b?b.players.join(' • '):'')+'</div>' + '<div class="match-scores"><input type="number" min="0" class="score" data-idx="'+idx+'" data-side="a" placeholder="A">' + '<input type="number" min="0" class="score" data-idx="'+idx+'" data-side="b" placeholder="B"></div>'; } swissGrid.appendChild(card); }); }

  function computeStandings(){ standingsGrid.innerHTML=''; const list=state.teams.slice().sort((a,b)=>(b.wins||0)-(a.wins||0)||(b.pd||0)-(a.pd||0)); list.forEach(function(t,i){ const card=document.createElement('div'); card.className='stand-card'; card.innerHTML='<div style="font-weight:800">'+t.name+'</div><div class="small">W: '+(t.wins||0)+'  PD: '+(t.pd||0)+'</div>'; standingsGrid.appendChild(card); setTimeout(()=>card.classList.add('show'),80*i); }); }

  function startSwissRound(){ if(!state.locked) return alert('Lock teams first'); if(state.swissRound>=state.swissTotal) return alert('All Swiss rounds completed'); state.swissRound+=1; state.swissMatches=makeSwissPairings(); state.swissMatches.forEach(function(m){ const a=state.teams.find(t=>t.id===m.a); if(!a.opponents) a.opponents=[]; if(m.b && a.opponents.indexOf(m.b)===-1) a.opponents.push(m.b); if(m.b){ const b=state.teams.find(t=>t.id===m.b); if(!b.opponents) b.opponents=[]; if(b.opponents.indexOf(m.a)===-1) b.opponents.push(m.a); } }); save(); renderSwissMatches(); roundLabel.textContent='Swiss Round '+state.swissRound+' / '+state.swissTotal; standingsCard.classList.remove('show'); standingsCard.setAttribute('aria-hidden','true'); standingsGrid.innerHTML=''; }

  function showPause(message, proceedLabel, callback){ pauseMessage.textContent=message || 'Paused'; pauseProceed.textContent=proceedLabel || 'Proceed'; pauseOverlay.classList.remove('hidden'); // attach one-time handler
    function once(){ pauseOverlay.classList.add('hidden'); pauseProceed.removeEventListener('click', once); if(callback) callback(); }
    pauseProceed.addEventListener('click', once); }

  function submitSwissResults(){ const inputs=Array.from(document.querySelectorAll('.score')); const map={}; inputs.forEach(function(inp){ const idx=Number(inp.dataset.idx); const side=inp.dataset.side; const val=inp.value===''?null:Number(inp.value); if(!map[idx]) map[idx]={a:null,b:null}; if(side==='a') map[idx].a=val; else map[idx].b=val; }); for(let i=0;i<state.swissMatches.length;i++){ const m=state.swissMatches[i]; if(m.b){ const sc=map[i]; if(!sc||sc.a===null||sc.b===null) return alert('Enter all scores before submitting'); } } for(let i=0;i<state.swissMatches.length;i++){ const m=state.swissMatches[i]; const aTeam=state.teams.find(t=>t.id===m.a); if(!m.b){ aTeam.wins=(aTeam.wins||0)+1; continue; } const bTeam=state.teams.find(t=>t.id===m.b); const sc=map[i]; m.scoreA=sc.a; m.scoreB=sc.b; if(sc.a>sc.b){ aTeam.wins=(aTeam.wins||0)+1; bTeam.losses=(bTeam.losses||0)+1; } else if(sc.b>sc.a){ bTeam.wins=(bTeam.wins||0)+1; aTeam.losses=(aTeam.losses||0)+1; } else { aTeam.wins=(aTeam.wins||0)+0.5; bTeam.wins=(bTeam.wins||0)+0.5; } aTeam.pd=(aTeam.pd||0)+(sc.a-sc.b); bTeam.pd=(bTeam.pd||0)+(sc.b-sc.a); } save(); computeStandings(); // show animated standings but pause until proceed
    showPause('Round complete — view standings', 'View Standings', function(){ standingsCard.classList.add('show'); standingsCard.setAttribute('aria-hidden','false'); if(state.swissRound>=state.swissTotal){ cutCard.style.display='block'; const n=state.teams.length; const cut=Math.floor(n/2)+1; cutSizeEl.textContent=cut; statusText.textContent='Swiss complete — make the cut.'; } else { statusText.textContent='Round '+state.swissRound+' complete — generating next round...'; setTimeout(function(){ startSwissRound(); statusText.textContent='Enter final scores and click Submit.'; },700); } }); }

  function makeCutAndBracket(){ const n=state.teams.length; const cut=Math.floor(n/2)+1; const seeded=state.teams.slice().sort((a,b)=>(b.wins||0)-(a.wins||0)||(b.pd||0)-(a.pd||0)); const qualifiers=seeded.slice(0,cut); let round=[]; if(qualifiers.length%2===1){ const top=qualifiers.shift(); round.push({a:top.id,b:null,scoreA:null,scoreB:null}); } for(let i=0;i<qualifiers.length;i+=2){ const a=qualifiers[i]; const b=qualifiers[i+1]; round.push({a:a.id,b:b.id,scoreA:null,scoreB:null}); } state.bracket=[round]; bracketCard.style.display='block'; renderBracket(); save(); }

  function renderBracket(){ bracketArea.innerHTML=''; const cur=state.bracket[state.bracket.length-1]||[]; cur.forEach(function(m,idx){ const a=state.teams.find(t=>t.id===m.a); const b=m.b?state.teams.find(t=>t.id===m.b):null; const div=document.createElement('div'); div.className='match-card'; if(!b){ div.innerHTML='<div class="match-teams">'+(a?a.name:'—')+'</div><div class="small">BYE (advances)</div>'; } else { div.innerHTML='<div class="match-teams">'+(a?a.name:'—')+' vs '+(b?b.name:'—')+'</div><div class="match-scores"><input type="number" class="br-score" data-idx="'+idx+'" data-side="a" placeholder="A"><input type="number" class="br-score" data-idx="'+idx+'" data-side="b" placeholder="B"></div>'; } bracketArea.appendChild(div); }); const btn=document.createElement('button'); btn.className='btn primary'; btn.textContent='Submit Bracket Round'; btn.addEventListener('click', submitBracketRound); bracketArea.appendChild(btn); }

  function submitBracketRound(){ const inputs=Array.from(document.querySelectorAll('.br-score')); const map={}; inputs.forEach(function(inp){ const idx=Number(inp.dataset.idx); const side=inp.dataset.side; const val=inp.value===''?null:Number(inp.value); if(!map[idx]) map[idx]={a:null,b:null}; if(side==='a') map[idx].a=val; else map[idx].b=val; }); const round=state.bracket[state.bracket.length-1]; for(let i=0;i<round.length;i++){ const m=round[i]; if(m.b){ const sc=map[i]; if(!sc||sc.a===null||sc.b===null) return alert('Enter all bracket scores before submitting'); m.scoreA=sc.a; m.scoreB=sc.b; } } const winners=[]; round.forEach(function(m){ if(!m.b) winners.push(m.a); else winners.push(m.scoreA>m.scoreB?m.a:m.b); }); if(winners.length===1){ showPause('Champion: '+(state.teams.find(t=>t.id===winners[0]).name), 'Finish', function(){ alert('Tournament complete'); }); return; } const next=[]; for(let i=0;i<winners.length;i+=2){ const a=winners[i]; const b=(i+1<winners.length)?winners[i+1]:null; next.push({a:a,b:b,scoreA:null,scoreB:null}); } state.bracket.push(next); renderBracket(); save(); }

  // bindings
  randomizeBtn.addEventListener('click', function(){ const raw=playerPool.value||''; const players=splitNames(raw); if(players.length<2) return alert('Enter at least two players'); state.teamSize=Number(teamSizeEl.value)||2; const shuffled=shuffle(players); const teams=[]; for(let i=0;i<shuffled.length;i+=state.teamSize){ const slice=shuffled.slice(i,i+state.teamSize); if(slice.length===0) continue; teams.push({id:uid(),name:slice.join(' & '),players:slice.slice(),wins:0,pd:0,opponents:[]}); } state.teams=teams; const n=state.teams.length; let sr=Number(swissRoundsEl.value)||0; if(!sr||sr<1) sr=computeSwissRounds(n); state.swissTotal=sr; state.swissRound=0; state.locked=false; save(); renderTeamsList(); statusText.textContent='Teams randomized. Lock teams to start Swiss.'; });

  lockBtn.addEventListener('click', function(){ if(!state.teams.length) return alert('No teams to lock'); state.locked=true; state.swissRound=0; save(); document.getElementById('leftPanel').style.display='none'; lockedNote.style.display='block'; lockedFlag.textContent='Yes'; startSwissRound(); });

  submitSwiss.addEventListener('click', submitSwissResults); nextSwiss.addEventListener('click', function(){ startSwissRound(); }); makeCut.addEventListener('click', makeCutAndBracket);

  // splash proceed behavior
  splashProceed.addEventListener('click', function(){ splash.style.opacity='0'; setTimeout(()=>{ splash.style.display='none'; },600); });

  // clear cache behavior
  clearCacheBtn.addEventListener('click', function(){ if(confirm('Clear saved tournament data?')){ try{ localStorage.removeItem(STORAGE_KEY); for(const k of Object.keys(localStorage)){ if(k && k.indexOf('putting_league')===0) localStorage.removeItem(k); } }catch(e){} sessionStorage.clear(); alert('Cache cleared — page will reload'); location.reload(); } });

  // load saved state
  load(); if(state.teams&&state.teams.length){ if(state.locked){ document.getElementById('leftPanel').style.display='none'; lockedNote.style.display='block'; lockedFlag.textContent='Yes'; } renderTeamsList(); computeStandings(); if(state.swissMatches&&state.swissMatches.length) renderSwissMatches(); }
});
