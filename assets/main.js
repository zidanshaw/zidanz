(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;

  // Avoid a flash of the wrong theme and keep the choice between pages.
  function getTheme() {
    try { return localStorage.getItem('theme') || 'dark'; } catch (_) { return 'dark'; }
  }

  function setTheme(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');

    const button = document.getElementById('themeBtn');
    if (button) {
      const light = theme === 'light';
      button.textContent = light ? '☀️' : '🌙';
      button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      button.setAttribute('aria-pressed', String(light));
    }

    try { localStorage.setItem('theme', theme); } catch (_) {}
  }

  window.toggleTheme = function () {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  };

  // Micro-interactions: scroll state + smooth page transitions.
  const topbar = document.getElementById('topbar');
  if (topbar) {
    const updateScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 30);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
  }

  body.classList.add('js-ready', 'page-ready');

  document.querySelectorAll('a[href]').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href) ||
        link.target === '_blank' || link.hasAttribute('download')) return;

    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      body.classList.remove('page-ready');
      body.classList.add('page-exit');
      setTimeout(() => { window.location.href = href; }, 260);
    });
  });

  // Theme button.
  const themeButton = document.getElementById('themeBtn');
  if (themeButton) {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'light' : getTheme());
    themeButton.addEventListener('click', window.toggleTheme);
  }

  // Dynamic project filtering. Cards use their existing badge text as categories.
  const grid = document.querySelector('.project-grid');
  if (grid) {
    const cards = Array.from(grid.querySelectorAll('.card'));
    const categories = ['All', ...new Set(cards.map(card => {
      const badge = card.querySelector('.badge');
      return badge ? badge.textContent.trim() : '';
    }).filter(Boolean))];

    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Filter projects');

    categories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-btn' + (category === 'All' ? ' active' : '');
      button.textContent = category;
      button.dataset.filter = category;
      bar.appendChild(button);
    });

    grid.parentNode.insertBefore(bar, grid);

    bar.addEventListener('click', function (event) {
      const button = event.target.closest('.filter-btn');
      if (!button) return;
      const selected = button.dataset.filter;

      bar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn === button);
        btn.setAttribute('aria-pressed', String(btn === button));
      });

      cards.forEach(card => {
        const badge = card.querySelector('.badge');
        const match = selected === 'All' || (badge && badge.textContent.trim() === selected);
        card.classList.toggle('project-card-hidden', !match);
      });
    });
  }
})();

(function(){
  var photo = document.getElementById('profilePhoto');
  if(!photo) return;

  var baseRot = 2;          // resting tilt, matches the original design
  var stiffness = 130;      // spring pull-back strength
  var damping = 9;          // energy loss (lower = bouncier)
  var maxDrag = 150;        // px before rubber-banding kicks in
  var tiltPerPx = 0.13;     // how much horizontal offset tilts the photo
  var tiltFromVel = 0.012;  // extra tilt from throw velocity (swing feel)

  var dx = 0, dy = 0, vx = 0, vy = 0;
  var dragging = false, pointerId = null;
  var startClientX = 0, startClientY = 0, startDX = 0, startDY = 0;
  var prevDX = 0, prevDY = 0;
  var lastTime = null;

  function clampDrag(){
    var dist = Math.hypot(dx, dy);
    if(dist > maxDrag){
      var over = dist - maxDrag;
      var eased = maxDrag + over * 0.28; // rubber-band past the limit
      var s = eased / dist;
      dx *= s; dy *= s;
    }
  }

  function onPointerDown(e){
    dragging = true;
    pointerId = e.pointerId;
    try{ photo.setPointerCapture(pointerId); }catch(err){}
    startClientX = e.clientX; startClientY = e.clientY;
    startDX = dx; startDY = dy;
    prevDX = dx; prevDY = dy;
  }
  function onPointerMove(e){
    if(!dragging || e.pointerId !== pointerId) return;
    dx = startDX + (e.clientX - startClientX);
    dy = startDY + (e.clientY - startClientY);
    clampDrag();
  }
  function endDrag(e){
    if(pointerId !== null && e.pointerId !== undefined && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
  }

  photo.addEventListener('pointerdown', onPointerDown);
  photo.addEventListener('pointermove', onPointerMove);
  photo.addEventListener('pointerup', endDrag);
  photo.addEventListener('pointercancel', endDrag);

  function frame(t){
    if(lastTime === null) lastTime = t;
    var dt = Math.min((t - lastTime) / 1000, 0.032);
    lastTime = t;

    if(dragging){
      if(dt > 0){
        vx = (dx - prevDX) / dt;
        vy = (dy - prevDY) / dt;
      }
      prevDX = dx; prevDY = dy;
    } else if(Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5){
      var ax = -stiffness * dx - damping * vx;
      var ay = -stiffness * dy - damping * vy;
      vx += ax * dt; vy += ay * dt;
      dx += vx * dt; dy += vy * dt;
    } else {
      dx = 0; dy = 0; vx = 0; vy = 0;
    }

    var rot = baseRot + dx * tiltPerPx + vx * tiltFromVel;
    rot = Math.max(-42, Math.min(46, rot));

    photo.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px) translateY(-50%) rotate(' + rot.toFixed(2) + 'deg)';

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
