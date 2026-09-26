(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme ---------------------------------------------------- */
  function getStoredTheme() {
    try { return localStorage.getItem('theme'); } catch (_) { return null; }
  }

  function setTheme(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');

    var button = document.getElementById('themeBtn');
    if (button) {
      var light = theme === 'light';
      button.textContent = light ? '☀' : '☾';
      button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      button.setAttribute('aria-pressed', String(light));
    }

    try { localStorage.setItem('theme', theme); } catch (_) {}
  }

  window.toggleTheme = function () {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  };

  setTheme(getStoredTheme() || 'dark');

  var themeButton = document.getElementById('themeBtn');
  if (themeButton) themeButton.addEventListener('click', window.toggleTheme);

  /* Header scroll shadow --------------------------------------- */
  var topbar = document.getElementById('topbar');
  if (topbar) {
    var updateScroll = function () { topbar.classList.toggle('scrolled', window.scrollY > 8); };
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
  }

  body.classList.add('js-ready', 'page-ready');

  /* Soft page transitions on internal links --------------------- */
  if (!reduceMotion) {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href) ||
          link.target === '_blank' || link.hasAttribute('download')) return;

      link.addEventListener('click', function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        body.classList.remove('page-ready');
        body.classList.add('page-exit');
        setTimeout(function () { window.location.href = href; }, 220);
      });
    });
  }

  /* Dynamic project filtering ------------------------------------ */
  var list = document.querySelector('.index-list[data-filterable]');
  if (list) {
    var rows = Array.prototype.slice.call(list.querySelectorAll('.index-row'));
    var categories = ['All'];
    rows.forEach(function (row) {
      var cat = row.getAttribute('data-category');
      if (cat && categories.indexOf(cat) === -1) categories.push(cat);
    });

    var bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Filter projects');

    categories.forEach(function (category) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-btn' + (category === 'All' ? ' active' : '');
      button.textContent = category;
      button.dataset.filter = category;
      button.setAttribute('aria-pressed', String(category === 'All'));
      bar.appendChild(button);
    });

    list.parentNode.insertBefore(bar, list);

    bar.addEventListener('click', function (event) {
      var button = event.target.closest('.filter-btn');
      if (!button) return;
      var selected = button.dataset.filter;

      bar.querySelectorAll('.filter-btn').forEach(function (btn) {
        var isActive = btn === button;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });

      rows.forEach(function (row) {
        var match = selected === 'All' || row.getAttribute('data-category') === selected;
        row.classList.toggle('project-card-hidden', !match);
      });
    });
  }

  /* Subtle reveal-on-scroll for section wrappers ------------------ */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealTargets = document.querySelectorAll('[data-reveal]');
    revealTargets.forEach(function (el) { el.classList.add('pre-reveal'); });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pre-reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { observer.observe(el); });
  }
  /* Refined motion -------------------------------------------- */
  if (!reduceMotion) {
    // Scroll progress uses one rAF loop, avoiding layout-heavy work on scroll.
    var progress = document.createElement('div');
    progress.id = 'scroll-progress';
    document.body.appendChild(progress);

    var progressTicking = false;
    function updateProgress() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      progress.style.width = (ratio * 100).toFixed(2) + '%';
      progressTicking = false;
    }
    window.addEventListener('scroll', function () {
      if (!progressTicking) {
        progressTicking = true;
        requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
    updateProgress();

    // Reveal repeated content with a restrained stagger.
    var motionTargets = document.querySelectorAll(
      '.index-row, .case-media, .case-text > *, footer .footer-grid > *'
    );

    if ('IntersectionObserver' in window && motionTargets.length) {
      var motionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          motionObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

      motionTargets.forEach(function (el, index) {
        el.classList.add('motion-reveal');
        el.style.setProperty('--motion-delay', Math.min((index % 6) * 45, 225) + 'ms');
        motionObserver.observe(el);
      });
    }

    // Very subtle hero parallax. Disabled on touch devices.
    var heroVisual = document.querySelector('.hero-visual');
    var heroFrame = document.querySelector('.hero-frame');
    if (heroVisual && heroFrame && window.matchMedia('(pointer:fine)').matches) {
      var parallaxFrame = false;
      var targetX = 0, targetY = 0, currentX = 0, currentY = 0;

      heroVisual.addEventListener('pointermove', function (e) {
        var rect = heroVisual.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width - .5) * 7;
        targetY = ((e.clientY - rect.top) / rect.height - .5) * 5;
        if (!parallaxFrame) {
          parallaxFrame = true;
          requestAnimationFrame(function animateParallax() {
            currentX += (targetX - currentX) * .09;
            currentY += (targetY - currentY) * .09;
            heroFrame.style.transform = 'translate3d(' + currentX.toFixed(2) + 'px,' + currentY.toFixed(2) + 'px,0)';
            if (Math.abs(targetX - currentX) > .02 || Math.abs(targetY - currentY) > .02) {
              requestAnimationFrame(animateParallax);
            } else {
              parallaxFrame = false;
            }
          });
        }
      });

      heroVisual.addEventListener('pointerleave', function () {
        targetX = 0;
        targetY = 0;
      });
    }
  }

})();

/* Draggable profile photo -- small spring-physics detail on the
   homepage hero. Disabled under prefers-reduced-motion. */
(function () {
  var photo = document.getElementById('profilePhoto');
  if (!photo) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var baseRot = 2;
  var stiffness = 130;
  var damping = 9;
  var maxDrag = 130;
  var tiltPerPx = 0.13;
  var tiltFromVel = 0.012;

  var dx = 0, dy = 0, vx = 0, vy = 0;
  var dragging = false, pointerId = null;
  var startClientX = 0, startClientY = 0, startDX = 0, startDY = 0;
  var prevDX = 0, prevDY = 0;
  var lastTime = null;

  function clampDrag() {
    var dist = Math.hypot(dx, dy);
    if (dist > maxDrag) {
      var over = dist - maxDrag;
      var eased = maxDrag + over * 0.28;
      var s = eased / dist;
      dx *= s; dy *= s;
    }
  }

  function onPointerDown(e) {
    dragging = true;
    pointerId = e.pointerId;
    try { photo.setPointerCapture(pointerId); } catch (err) {}
    startClientX = e.clientX; startClientY = e.clientY;
    startDX = dx; startDY = dy;
    prevDX = dx; prevDY = dy;
  }
  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dx = startDX + (e.clientX - startClientX);
    dy = startDY + (e.clientY - startClientY);
    clampDrag();
  }
  function endDrag(e) {
    if (pointerId !== null && e.pointerId !== undefined && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
  }

  photo.addEventListener('pointerdown', onPointerDown);
  photo.addEventListener('pointermove', onPointerMove);
  photo.addEventListener('pointerup', endDrag);
  photo.addEventListener('pointercancel', endDrag);

  function frame(t) {
    if (lastTime === null) lastTime = t;
    var dt = Math.min((t - lastTime) / 1000, 0.032);
    lastTime = t;

    if (dragging) {
      if (dt > 0) {
        vx = (dx - prevDX) / dt;
        vy = (dy - prevDY) / dt;
      }
      prevDX = dx; prevDY = dy;
    } else if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
      var ax = -stiffness * dx - damping * vx;
      var ay = -stiffness * dy - damping * vy;
      vx += ax * dt; vy += ay * dt;
      dx += vx * dt; dy += vy * dt;
    } else {
      dx = 0; dy = 0; vx = 0; vy = 0;
    }

    var rot = baseRot + dx * tiltPerPx + vx * tiltFromVel;
    rot = Math.max(-42, Math.min(46, rot));

    photo.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px) rotate(' + rot.toFixed(2) + 'deg)';

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();


/* Premium interaction layer ---------------------------------
   Deliberately restrained: motion follows pointer intent and
   uses compositor-friendly transforms instead of layout thrashing. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var finePointer = window.matchMedia('(pointer:fine)').matches;
  if (!finePointer) return;

  /* Cursor spotlight: one ambient radial light, never a giant gimmick. */
  var spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  document.body.appendChild(spotlight);
  var sx = -200, sy = -200, scx = sx, scy = sy, raf = false;
  document.addEventListener('pointermove', function (e) {
    sx = e.clientX; sy = e.clientY;
    if (raf) return;
    raf = true;
    requestAnimationFrame(function () {
      scx += (sx - scx) * .18;
      scy += (sy - scy) * .18;
      spotlight.style.transform = 'translate3d(' + scx + 'px,' + scy + 'px,0)';
      raf = false;
    });
  }, { passive: true });

  /* Magnetic controls: tiny movement, not the usual button flying across the screen. */
  document.querySelectorAll('.btn, .btn-ghost, .theme-btn, .section-link, .case-nav-link').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width - .5) * 7;
      var y = ((e.clientY - r.top) / r.height - .5) * 5;
      el.style.setProperty('--mx', x.toFixed(2) + 'px');
      el.style.setProperty('--my', y.toFixed(2) + 'px');
      el.classList.add('magnetic-active');
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
      el.classList.remove('magnetic-active');
    });
  });

  /* Tilt only on visual cards, with a strict low-angle limit. */
  document.querySelectorAll('.case-media, .index-thumb, .pull-quote').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - .5;
      var py = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--tilt-x', (py * -3).toFixed(2) + 'deg');
      el.style.setProperty('--tilt-y', (px * 4).toFixed(2) + 'deg');
      el.style.setProperty('--glow-x', ((px + .5) * 100).toFixed(1) + '%');
      el.style.setProperty('--glow-y', ((py + .5) * 100).toFixed(1) + '%');
      el.classList.add('tilt-active');
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.classList.remove('tilt-active');
    });
  });

  /* Scroll-linked section depth. Uses IntersectionObserver to activate only visible sections. */
  if ('IntersectionObserver' in window) {
    var sections = document.querySelectorAll('.section, .case-body, footer');
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('section-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    sections.forEach(function (el) { sectionObserver.observe(el); });
  }

  /* Number reveal: project indices gently slide into place when their row appears. */
  if ('IntersectionObserver' in window) {
    var nums = document.querySelectorAll('.index-num');
    var numObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('number-visible');
        numObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { el.classList.add('number-reveal'); numObserver.observe(el); });
  }
})();
