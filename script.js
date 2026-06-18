/**
 * ═══════════════════════════════════════════════════════════════
 * MATHQUEST — script.js  (Full Supabase Edition)
 * Vanilla JavaScript — zero dependencies
 *
 * !! IMPORTANT — Replace the two placeholders below with your
 *    real Supabase project values from:
 *    Supabase Dashboard → Settings → API
 *
 * Sections:
 *  0.  Supabase config + tiny REST client
 *  1.  DOM Ready bootstrap
 *  2.  Starfield canvas animation
 *  3.  Sticky header / scroll effects
 *  4.  Mobile nav toggle
 *  5.  Hero counter animation
 *  6.  Scroll-reveal (Intersection Observer)
 *  7.  Analytics tracking
 *  8.  Grade card → sheet tab navigation
 *  9.  Practice sheets tab switcher
 * 10.  Weekly challenge loader (from challenges.json)
 * 11.  Challenge submit + leaderboard
 * 12.  Star rating interaction
 * 13.  Difficulty button group
 * 14.  Request form validation + Supabase insert
 * 15.  Feedback form validation + Supabase insert
 * 16.  Custom modal
 * 17.  Footer nav grade shortcuts
 * 18.  Footer year
 * 19.  Keyboard navigation for grade cards
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   0. SUPABASE CONFIG + TINY REST CLIENT
   Replace both values below. Find them at:
   Supabase Dashboard → Settings → API
───────────────────────────────────────────────────────────── */
var SUPABASE_URL      = 'https://abrgervesbaxsdvuyedd.supabase.co';  // ← REPLACE
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicmdlcnZlc2JheHNkdnV5ZWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjM5MDgsImV4cCI6MjA5NjM5OTkwOH0.ouaeWo1JXGMa1LOKk6voIoos7r-w744HvQeW__9Xdgo';

/**
 * Lightweight Supabase REST wrapper (no SDK needed).
 */
var db = {
  insert: function (table, payload) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (e) { return { data: null, error: e }; });
      return { data: true, error: null };
    })
    .catch(function (e) { return { data: null, error: e }; });
  },

  select: function (table, query) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + (query || ''), {
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (e) { return { data: [], error: e }; });
      return res.json().then(function (d) { return { data: d, error: null }; });
    })
    .catch(function (e) { return { data: [], error: e }; });
  }
};

/* Session ID — anonymous, per-tab, no cookies */
var SESSION_ID = (function () {
  try {
    var s = sessionStorage.getItem('mq_session');
    if (s) return s;
    var id = 'mq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem('mq_session', id);
    return id;
  } catch (e) { return 'mq_' + Date.now(); }
})();

/* ─────────────────────────────────────────────────────────────
   1. DOM READY BOOTSTRAP
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initStarfield();
  initStickyHeader();
  initMobileNav();
  initCounterAnimation();
  initScrollReveal();
  initAnalytics();
  initGradeCards();
  initTabSwitcher();
  initChallengeLoader();
  initStarRating();
  initDifficultyBtns();
  initRequestForm();
  initFeedbackForm();
  initModalClose();
  initFooterNavGrades();
  initFooterYear();
  initGradeCardKeyboard();
});

/* ─────────────────────────────────────────────────────────────
   2. STARFIELD CANVAS
───────────────────────────────────────────────────────────── */
function initStarfield() {
  var canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var stars = [];
  var animId = null;

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  function mkStar() {
    return { x: Math.random()*canvas.width, y: Math.random()*canvas.height,
             r: Math.random()*1.4+0.3, o: Math.random()*0.7+0.1,
             sp: Math.random()*0.004+0.001, d: Math.random()>0.5?1:-1 };
  }
  function build() { stars=[]; for(var i=0;i<160;i++) stars.push(mkStar()); }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(function(s){
      s.o += s.sp*s.d; if(s.o>0.85||s.o<0.08) s.d*=-1;
      s.y += 0.06; if(s.y>canvas.height){s.y=0;s.x=Math.random()*canvas.width;}
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle='rgba(224,235,255,'+s.o.toFixed(2)+')'; ctx.fill();
    });
    animId = requestAnimationFrame(draw);
  }
  resize(); build(); draw();
  var t; window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){cancelAnimationFrame(animId);resize();build();draw();},250);});
}

/* ─────────────────────────────────────────────────────────────
   3. STICKY HEADER
───────────────────────────────────────────────────────────── */
function initStickyHeader() {
  var h = document.getElementById('site-header'); if(!h) return;
  function s(){ h.classList.toggle('scrolled', window.scrollY>40); }
  window.addEventListener('scroll', s, {passive:true}); s();
}

/* ─────────────────────────────────────────────────────────────
   4. MOBILE NAV
───────────────────────────────────────────────────────────── */
function initMobileNav() {
  var toggle = document.getElementById('nav-toggle');
  var nav    = document.getElementById('nav-links');
  if(!toggle||!nav) return;
  var open = false;

  function ham(o) {
    var l = toggle.querySelectorAll('.hamburger-line');
    if(l.length<3) return;
    l[0].style.transform = o?'translateY(9px) rotate(45deg)':'';
    l[1].style.opacity   = o?'0':'';
    l[2].style.transform = o?'translateY(-9px) rotate(-45deg)':'';
  }
  function openNav()  { open=true;  nav.classList.add('open');    toggle.setAttribute('aria-expanded','true');  ham(true);  document.body.style.overflow='hidden'; }
  function closeNav() { open=false; nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); ham(false); document.body.style.overflow=''; }

  toggle.addEventListener('click', function(){ open?closeNav():openNav(); });
  nav.querySelectorAll('.nav-link').forEach(function(l){ l.addEventListener('click',function(){ if(open) closeNav(); }); });
  document.addEventListener('click', function(e){ if(open&&!toggle.contains(e.target)&&!nav.contains(e.target)) closeNav(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'&&open){closeNav();toggle.focus();} });
}

/* ─────────────────────────────────────────────────────────────
   5. HERO COUNTER ANIMATION
───────────────────────────────────────────────────────────── */
function initCounterAnimation() {
  var els = document.querySelectorAll('.stat-number[data-target]'); if(!els.length) return;
  var done = false;
  function ease(t){ return 1-Math.pow(1-t,3); }
  function anim(el,target){ var s=null; (function step(ts){ if(!s)s=ts; var p=Math.min((ts-s)/1600,1); el.textContent=Math.round(ease(p)*target); if(p<1)requestAnimationFrame(step); else el.textContent=target; })(performance.now()); }
  function run(){ if(done)return; done=true; els.forEach(function(e){ var t=parseInt(e.getAttribute('data-target'),10); if(!isNaN(t))anim(e,t); }); }
  var el=document.querySelector('.hero-stats'); if(!el){run();return;}
  if('IntersectionObserver' in window){ var o=new IntersectionObserver(function(en){ if(en[0].isIntersecting){run();o.disconnect();} },{threshold:0.5}); o.observe(el); } else run();
}

/* ─────────────────────────────────────────────────────────────
   6. SCROLL REVEAL
───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  var targets = document.querySelectorAll('.grade-card,.topic-card,.hub-card,.challenge-card,.section-header,.sheets-tabs');
  targets.forEach(function(el){ if(!el.classList.contains('reveal')) el.classList.add('reveal'); });
  document.querySelectorAll('.grade-card').forEach(function(c,i){ c.classList.add('reveal-delay-'+Math.min(i+1,4)); });
  if(!('IntersectionObserver' in window)){ targets.forEach(function(el){el.classList.add('visible');}); return; }
  var obs = new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);} }); },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
  targets.forEach(function(el){ obs.observe(el); });
}

/* ─────────────────────────────────────────────────────────────
   7. ANALYTICS
───────────────────────────────────────────────────────────── */
function initAnalytics() {
  trackEvent('page_view', { title: document.title, url: window.location.href, referrer: document.referrer });

  document.querySelectorAll('a.btn--download[download]').forEach(function(link){
    link.addEventListener('click', function(){
      trackEvent('download_click', { file: link.getAttribute('href'), label: link.textContent.trim() });
    });
  });

  document.querySelectorAll('.grade-card').forEach(function(card){
    card.addEventListener('click', function(){
      trackEvent('grade_card_click', { grade: card.getAttribute('data-grade') });
    });
  });
}

function trackEvent(type, meta) {
  if(SUPABASE_URL.indexOf('YOUR_PROJECT_ID')!==-1) return;
  db.insert('analytics_events', {
    event_type: type, page: window.location.pathname,
    metadata: meta||{}, session_id: SESSION_ID,
    referrer: document.referrer||null,
    user_agent: navigator.userAgent, screen_width: window.screen.width
  });
}

/* ─────────────────────────────────────────────────────────────
   8. GRADE CARDS NAVIGATION
───────────────────────────────────────────────────────────── */
function initGradeCards() {
  document.querySelectorAll('.grade-card').forEach(function(card){
    card.addEventListener('click', function(e){
      if(e.target.closest('.btn--card')) return;
      var g=card.getAttribute('data-grade'); if(g) goToGradeSheet(g);
    });
  });
  document.querySelectorAll('.btn--card[data-grade]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var g=btn.getAttribute('data-grade'); if(g) goToGradeSheet(g);
    });
  });
}
function goToGradeSheet(grade) {
  var s=document.getElementById('sheets'); if(!s) return;
  activateTab(String(grade));
  s.scrollIntoView({behavior:'smooth',block:'start'});
  trackEvent('tab_switch',{grade:grade,source:'grade_card'});
}

/* ─────────────────────────────────────────────────────────────
   9. TAB SWITCHER
───────────────────────────────────────────────────────────── */
function initTabSwitcher() {
  var btns   = document.querySelectorAll('.tab-btn[data-tab]');
  var panels = document.querySelectorAll('.tab-panel');
  if(!btns.length) return;

  window.activateTab = function(grade) {
    btns.forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    panels.forEach(function(p){ p.classList.remove('active'); p.hidden=true; });
    var tb=document.getElementById('tab-'+grade);
    var tp=document.getElementById('panel-grade-'+grade);
    if(tb){tb.classList.add('active');tb.setAttribute('aria-selected','true');}
    if(tp){tp.classList.add('active');tp.hidden=false;}
  };

  btns.forEach(function(btn,i){
    btn.addEventListener('click', function(){
      var g=btn.getAttribute('data-tab');
      if(g){ activateTab(g); trackEvent('tab_switch',{grade:g,source:'tab_bar'}); }
    });
    btn.addEventListener('keydown', function(e){
      var ni;
      if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();ni=(i+1)%btns.length;}
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();ni=(i-1+btns.length)%btns.length;}
      else if(e.key==='Home'){e.preventDefault();ni=0;}
      else if(e.key==='End'){e.preventDefault();ni=btns.length-1;}
      else return;
      var ng=btns[ni].getAttribute('data-tab'); if(ng){activateTab(ng);btns[ni].focus();}
    });
  });
  activateTab('5');
}

/* ─────────────────────────────────────────────────────────────
   10. WEEKLY CHALLENGE LOADER
───────────────────────────────────────────────────────────── */
function initChallengeLoader() {
  fetch('challenges.json')
    .then(function(r){ if(!r.ok) throw new Error('load fail'); return r.json(); })
    .then(function(data){
      var list = data.challenges||[];
      var active = null;
      for(var i=0;i<list.length;i++){ if(list[i].is_active){active=list[i];break;} }
      if(!active&&list.length) active=list.slice().sort(function(a,b){return new Date(b.posted_at)-new Date(a.posted_at);})[0];
      if(!active) return;
      renderChallenge(active);
      loadLeaderboard(active.id);
    })
    .catch(function(e){ console.warn('MathQuest: challenge load failed',e.message); });
}

function renderChallenge(ch) {
  var postedAt    = new Date(ch.posted_at);
  var daysElapsed = (Date.now()-postedAt) / 86400000;
  var answerReady = daysElapsed >= 7;
  var daysLeft    = Math.max(0, Math.ceil(7-daysElapsed));

  /* Week label */
  var wl = document.querySelector('.challenge-tag span');
  if(wl) wl.textContent = ch.week_label;

  /* Question */
  var re = document.getElementById('challenge-riddle');
  if(re) re.innerHTML = '<p>'+escapeHTML(ch.question).replace(/\n/g,'<br/>')+'</p>';

  /* Hint */
  var hi = document.querySelector('.challenge-hint span');
  if(hi){
    if(ch.hint){ hi.textContent='Hint: '+ch.hint; }
    else { var hw=hi.closest('.challenge-hint'); if(hw) hw.style.display='none'; }
  }

  /* Difficulty */
  var stars=ch.difficulty_stars||3;
  var ds=document.querySelector('.diff-star'); if(ds) ds.textContent='★'.repeat(stars)+'☆'.repeat(5-stars);
  var dl=document.querySelector('.diff-level'); if(dl) dl.textContent=ch.difficulty||'Intermediate';

  /* Countdown / status note */
  var note = document.querySelector('.challenge-refresh-note');
  if(note){
    if(answerReady) note.textContent='Answer now available! New challenge posted soon.';
    else if(daysLeft===1) note.textContent='Answer reveals tomorrow — submit your attempt below!';
    else note.textContent='Answer reveals in '+daysLeft+' days. Give it a go!';
  }

  renderAnswerSection(ch.answer, answerReady);
  if(!answerReady) renderSubmitForm(ch);
}

function renderAnswerSection(answerText, show) {
  var ae  = document.getElementById('challenge-answer');
  var rb  = document.getElementById('reveal-btn');
  var ate = ae ? ae.querySelector('.answer-text') : null;
  if(!ae) return;
  if(ate) ate.innerHTML = escapeHTML(answerText).replace(/\n/g,'<br/>');

  if(show) {
    ae.classList.remove('hidden'); ae.setAttribute('aria-hidden','false');
    var lbl=ae.querySelector('.answer-label'); if(lbl) lbl.textContent='Worked Answer';
    if(rb) rb.style.display='none';
  } else {
    ae.classList.add('hidden'); ae.setAttribute('aria-hidden','true');
    if(rb){ rb.style.display=''; setupRevealButton(rb,ae); }
  }
}

function setupRevealButton(rb, ae) {
  var fresh = rb.cloneNode(true);
  rb.parentNode.replaceChild(fresh,rb);
  var rev=false;
  fresh.addEventListener('click',function(){
    rev=!rev;
    if(rev){
      ae.classList.remove('hidden'); ae.setAttribute('aria-hidden','false');
      void ae.offsetWidth; ae.classList.add('reveal-animate');
      fresh.setAttribute('aria-expanded','true'); fresh.classList.add('revealed');
      fresh.querySelector('.reveal-btn-text').textContent='Hide Answer';
      trackEvent('reveal_answer',{});
    } else {
      ae.classList.add('hidden'); ae.setAttribute('aria-hidden','true');
      fresh.setAttribute('aria-expanded','false'); fresh.classList.remove('revealed');
      fresh.querySelector('.reveal-btn-text').textContent='Reveal Answer';
    }
  });
}

function renderSubmitForm(ch) {
  var wrapper = document.querySelector('.challenge-answer-wrapper'); if(!wrapper) return;
  var existing = document.getElementById('challenge-submit-form'); if(existing) existing.remove();

  var form = document.createElement('div');
  form.id='challenge-submit-form'; form.className='challenge-submit-block';
  form.innerHTML=
    '<p class="submit-block-label">Think you cracked it? Submit your answer:</p>'+
    '<div class="submit-block-row">'+
      '<input type="text" id="chal-name-input" class="form-input" placeholder="Your name (optional)" />'+
      '<div class="select-wrapper">'+
        '<select id="chal-grade-input" class="form-input form-select" aria-label="Your grade">'+
          '<option value="">Grade…</option>'+
          '<option value="5">Grade 5</option><option value="6">Grade 6</option>'+
          '<option value="7">Grade 7</option><option value="8">Grade 8</option>'+
        '</select>'+
        '<svg class="select-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'+
      '</div>'+
    '</div>'+
    '<textarea id="chal-answer-input" class="form-input form-textarea" rows="3" placeholder="Type your answer and working here…"></textarea>'+
    '<button type="button" class="btn btn--reveal" id="chal-submit-btn">'+
      '<span>Submit My Answer</span>'+
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'+
    '</button>'+
    '<p class="submit-block-note">All submissions appear on the leaderboard. Answer revealed on Day 7.</p>';

  var rb = document.getElementById('reveal-btn');
  if(rb) wrapper.insertBefore(form,rb); else wrapper.appendChild(form);

  document.getElementById('chal-submit-btn').addEventListener('click',function(){
    var name   = (document.getElementById('chal-name-input').value||'').trim()||'Anonymous';
    var grade  = (document.getElementById('chal-grade-input').value||'').trim();
    var answer = (document.getElementById('chal-answer-input').value||'').trim();
    if(!answer){ showModal('✏️','Enter your answer first!','Please type your answer in the box before submitting.'); return; }

    var btn=document.getElementById('chal-submit-btn');
    if(btn){btn.disabled=true;btn.querySelector('span').textContent='Submitting…';}

    db.insert('leaderboard',{
      challenge_id: ch.id, student_name: name,
      grade: grade||null, answer_given: answer, is_correct: false
    }).then(function(r){
      if(btn){btn.disabled=false;btn.querySelector('span').textContent='Submit My Answer';}
      if(r.error){ showModal('⚠️','Submission failed','Could not save your answer. Please try again.'); return; }
      trackEvent('challenge_submit',{challenge_id:ch.id,grade:grade});
      showModal('🚀','Answer submitted, '+escapeHTML(name)+'!',
        'Your answer is on the leaderboard! The worked solution reveals on Day 7. Check back then to see how you did!');
      document.getElementById('chal-name-input').value='';
      document.getElementById('chal-grade-input').value='';
      document.getElementById('chal-answer-input').value='';
      loadLeaderboard(ch.id);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   11. LEADERBOARD
───────────────────────────────────────────────────────────── */
function loadLeaderboard(challengeId) {
  if(SUPABASE_URL.indexOf('YOUR_PROJECT_ID')!==-1){ renderLeaderboard([]); return; }
  db.select('leaderboard',
    'challenge_id=eq.'+challengeId+'&order=submitted_at.asc&limit=10&select=student_name,grade,submitted_at,is_correct'
  ).then(function(r){ renderLeaderboard(r.data||[]); });
}

function renderLeaderboard(entries) {
  var section = document.getElementById('challenge'); if(!section) return;
  var cont = document.getElementById('leaderboard-container');
  if(!cont){
    cont=document.createElement('div'); cont.id='leaderboard-container'; cont.className='leaderboard-container';
    var card=section.querySelector('.challenge-card');
    if(card&&card.parentNode) card.parentNode.insertBefore(cont,card.nextSibling);
    else section.querySelector('.section-container').appendChild(cont);
  }

  if(!entries||!entries.length){
    cont.innerHTML='<div class="leaderboard-empty"><span class="lb-empty-icon">🏆</span><p>No submissions yet for this challenge.<br/>Be the first on the leaderboard!</p></div>';
    return;
  }

  var rows=entries.map(function(e,i){
    var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.';
    var d=new Date(e.submitted_at);
    var ds=d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    var status=e.is_correct?'<span class="lb-correct">✓ Correct</span>':'<span class="lb-pending">Pending</span>';
    return '<tr class="lb-row'+(i<3?' lb-row--top':'')+'">'+
      '<td class="lb-rank">'+medal+'</td>'+
      '<td class="lb-name">'+escapeHTML(e.student_name||'Anonymous')+'</td>'+
      '<td class="lb-grade">'+(e.grade?'Grade '+escapeHTML(e.grade):'—')+'</td>'+
      '<td class="lb-date">'+ds+'</td>'+
      '<td class="lb-status">'+status+'</td>'+
    '</tr>';
  }).join('');

  cont.innerHTML=
    '<div class="leaderboard-header">'+
      '<h3 class="leaderboard-title">🏆 This Week\'s Leaderboard</h3>'+
      '<p class="leaderboard-sub">'+entries.length+' submission'+(entries.length!==1?'s':'')+' this challenge</p>'+
    '</div>'+
    '<div class="leaderboard-table-wrap">'+
      '<table class="leaderboard-table" aria-label="Challenge leaderboard">'+
        '<thead><tr><th>#</th><th>Name</th><th>Grade</th><th>Submitted</th><th>Status</th></tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
      '</table>'+
    '</div>';
}

/* ─────────────────────────────────────────────────────────────
   12. STAR RATING
───────────────────────────────────────────────────────────── */
function initStarRating() {
  var sc=document.getElementById('star-rating');
  var de=document.getElementById('star-description');
  if(!sc||!de) return;
  var map={'1':'1 star — Poor','2':'2 stars — Needs Work','3':'3 stars — Okay','4':'4 stars — Good!','5':'5 stars — Excellent! 🌟'};

  sc.querySelectorAll('.star-label').forEach(function(l){
    l.addEventListener('mouseenter',function(){
      var inp=document.getElementById(l.getAttribute('for'));
      if(inp&&map[inp.value]){de.textContent=map[inp.value];de.style.color='var(--clr-star)';}
    });
  });
  sc.addEventListener('mouseleave',upd);
  sc.querySelectorAll('.star-input').forEach(function(inp){
    inp.addEventListener('change',function(){if(map[inp.value]){de.textContent=map[inp.value];de.style.color='var(--clr-star)';}});
  });
  function upd(){
    var c=sc.querySelector('.star-input:checked');
    if(c&&map[c.value]){de.textContent=map[c.value];de.style.color='var(--clr-star)';}
    else{de.textContent='Click a star to rate.';de.style.color='';}
  }
}

/* ─────────────────────────────────────────────────────────────
   13. DIFFICULTY BUTTONS
───────────────────────────────────────────────────────────── */
function initDifficultyBtns() {
  var dg=document.getElementById('difficulty-group');
  var hi=document.getElementById('fb-difficulty');
  if(!dg||!hi) return;
  dg.querySelectorAll('.diff-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var v=btn.getAttribute('data-value');
      dg.querySelectorAll('.diff-btn').forEach(function(b){b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
      if(hi.value===v){hi.value='';}
      else{btn.classList.add('selected');btn.setAttribute('aria-pressed','true');hi.value=v;}
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   14. REQUEST FORM
───────────────────────────────────────────────────────────── */
function initRequestForm() {
  var form=document.getElementById('request-form'); if(!form) return;
  form.addEventListener('submit',function(e){
    e.preventDefault(); clearFormErrors(form);
    var gf=form.querySelector('#req-grade');
    var tf=form.querySelector('#req-topic');
    var ok=true;
    if(!gf.value){markError(gf,'Please select your grade.');ok=false;}
    if(!tf.value.trim()){markError(tf,'Please enter a topic name.');ok=false;}
    if(!ok){var fe=form.querySelector('.error');if(fe)fe.focus();return;}

    var sb=form.querySelector('#request-submit-btn');
    if(sb){sb.disabled=true;sb.querySelector('span').textContent='Sending…';}

    var p={
      student_name:(form.querySelector('#req-name').value||'').trim()||null,
      grade:gf.value, topic_name:tf.value.trim(),
      struggle_notes:(form.querySelector('#req-struggle').value||'').trim()||null
    };

    db.insert('topic_requests',p).then(function(r){
      if(sb){sb.disabled=false;sb.querySelector('span').textContent='Submit Request';}
      if(r.error){showModal('⚠️','Submission failed','Something went wrong. Please try again.');return;}
      trackEvent('form_request',{grade:p.grade,topic:p.topic_name});
      showModal('🛸',p.student_name?'Got it, '+escapeHTML(p.student_name)+'! 🚀':'Request Received! 🚀',
        'We\'ve noted your request for a <strong>'+escapeHTML(p.topic_name)+'</strong> worksheet for <strong>Grade '+escapeHTML(p.grade)+'</strong>. Added to our queue!');
      form.reset();
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   15. FEEDBACK FORM
───────────────────────────────────────────────────────────── */
function initFeedbackForm() {
  var form=document.getElementById('feedback-form'); if(!form) return;
  form.addEventListener('submit',function(e){
    e.preventDefault(); clearFormErrors(form);
    var sf=form.querySelector('#fb-sheet');
    var ri=form.querySelector('.star-input:checked');
    var di=form.querySelector('#fb-difficulty');
    var ok=true;

    if(!sf.value.trim()){markError(sf,'Please specify which worksheet you are rating.');ok=false;}
    if(!ri){
      var sc=form.querySelector('#star-rating');
      var de=form.querySelector('#star-description');
      if(sc){sc.style.outline='2px solid var(--clr-error)';sc.style.outlineOffset='4px';sc.style.borderRadius='4px';}
      if(de){de.textContent='Please select a star rating.';de.style.color='var(--clr-error)';}
      ok=false;
    }
    if(!di||!di.value){
      var dg=form.querySelector('#difficulty-group');
      if(dg){dg.style.outline='2px solid var(--clr-error)';dg.style.outlineOffset='4px';dg.style.borderRadius='8px';}
      ok=false;
    }
    if(!ok){var fe=form.querySelector('.error');if(fe)fe.focus();return;}

    var sb=form.querySelector('#feedback-submit-btn');
    if(sb){sb.disabled=true;sb.querySelector('span').textContent='Sending…';}

    var db2=form.querySelector('.diff-btn.selected');
    var p={
      sheet_name:sf.value.trim(), star_rating:parseInt(ri.value,10),
      difficulty_felt:db2?db2.getAttribute('data-value'):null,
      review_text:(form.querySelector('#fb-review').value||'').trim()||null
    };

    db.insert('worksheet_feedback',p).then(function(r){
      if(sb){sb.disabled=false;sb.querySelector('span').textContent='Submit Feedback';}
      if(r.error){showModal('⚠️','Submission failed','Something went wrong. Please try again.');return;}
      trackEvent('form_feedback',{sheet:p.sheet_name,rating:p.star_rating});
      showModal('⭐','Thanks for your feedback!',
        'Thanks for rating <strong>'+escapeHTML(p.sheet_name)+'</strong> '+p.star_rating+' star'+(p.star_rating===1?'':'s')+'! Your feedback helps us make every worksheet better.');
      form.reset();
      var sc=form.querySelector('#star-rating'); if(sc){sc.style.outline='';sc.style.outlineOffset='';}
      var dg=form.querySelector('#difficulty-group');
      if(dg){dg.style.outline='';dg.style.outlineOffset='';dg.querySelectorAll('.diff-btn').forEach(function(b){b.classList.remove('selected');b.setAttribute('aria-pressed','false');});}
      var de=form.querySelector('#star-description'); if(de){de.textContent='Click a star to rate.';de.style.color='';}
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   16. MODAL
───────────────────────────────────────────────────────────── */
function initModalClose() {
  var cb=document.getElementById('modal-close-btn');
  var ov=document.getElementById('modal-overlay');
  if(!cb||!ov) return;
  cb.addEventListener('click',hideModal);
  ov.addEventListener('click',function(e){if(e.target===ov)hideModal();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!ov.hidden)hideModal();});
}
function showModal(icon,title,body){
  var ov=document.getElementById('modal-overlay');
  var ie=document.getElementById('modal-icon');
  var te=document.getElementById('modal-title');
  var de=document.getElementById('modal-desc');
  var cb=document.getElementById('modal-close-btn');
  if(!ov||!ie||!te||!de) return;
  ie.textContent=icon; te.textContent=title; de.innerHTML=body;
  ov.hidden=false; document.body.style.overflow='hidden';
  if(cb) setTimeout(function(){cb.focus();},60);
}
function hideModal(){
  var ov=document.getElementById('modal-overlay'); if(!ov) return;
  ov.hidden=true; document.body.style.overflow='';
}

/* ─────────────────────────────────────────────────────────────
   17. FOOTER GRADE SHORTCUTS
───────────────────────────────────────────────────────────── */
function initFooterNavGrades() {
  document.querySelectorAll('.footer-link[data-scroll-tab]').forEach(function(l){
    l.addEventListener('click',function(e){
      var t=l.getAttribute('data-scroll-tab'); if(!t) return;
      e.preventDefault();
      var s=document.getElementById('sheets'); if(!s) return;
      activateTab(t); s.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   18. FOOTER YEAR
───────────────────────────────────────────────────────────── */
function initFooterYear() {
  var el=document.getElementById('footer-year'); if(el) el.textContent=new Date().getFullYear();
}

/* ─────────────────────────────────────────────────────────────
   19. KEYBOARD NAV FOR GRADE CARDS
───────────────────────────────────────────────────────────── */
function initGradeCardKeyboard() {
  document.querySelectorAll('.grade-card[tabindex="0"]').forEach(function(card){
    card.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        var g=card.getAttribute('data-grade'); if(!g) return;
        var s=document.getElementById('sheets');
        if(s){activateTab(g);s.scrollIntoView({behavior:'smooth',block:'start'});}
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────── */
function markError(field,msg){
  field.classList.add('error'); field.setAttribute('aria-invalid','true');
  var p=field.closest('.form-group')||field.parentNode;
  var ex=p?p.querySelector('.form-error-msg'):null;
  if(!ex&&p){
    var e=document.createElement('span'); e.className='form-error-msg';
    e.setAttribute('role','alert'); e.style.display='block'; e.textContent=msg;
    var ia=field.closest('.select-wrapper')||field;
    ia.parentNode.insertBefore(e,ia.nextSibling);
  } else if(ex){ ex.textContent=msg; ex.style.display='block'; }
}
function clearFormErrors(form){
  form.querySelectorAll('.error').forEach(function(f){f.classList.remove('error');f.removeAttribute('aria-invalid');});
  form.querySelectorAll('.form-error-msg').forEach(function(m){m.style.display='none';});
}
function escapeHTML(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
