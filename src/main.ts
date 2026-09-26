type Theme = 'dark' | 'light';

type Project = {
  id: string;
  number: string;
  title: string;
  description: string;
  category: string;
  href: string;
  image: string;
  imageStyle?: string;
};

const root = document.documentElement;
const body = document.body;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer:fine)').matches;

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem('theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function setTheme(theme: Theme): void {
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');

  const button = document.getElementById('themeBtn');
  if (button) {
    const light = theme === 'light';
    button.textContent = light ? '☀' : '☾';
    button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    button.setAttribute('aria-pressed', String(light));
  }

  try { localStorage.setItem('theme', theme); } catch { /* storage is optional */ }
}

function initTheme(): void {
  const initial = getStoredTheme() ?? 'dark';
  setTheme(initial);
  document.getElementById('themeBtn')?.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });
}

function initHeader(): void {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  const update = (): void => { topbar.classList.toggle('scrolled', window.scrollY > 8); };
  update();
  window.addEventListener('scroll', () => { update(); }, { passive: true });
}

function initPageState(): void {
  body.classList.add('js-ready', 'page-ready');
}

function initPageTransitions(): void {
  if (reduceMotion) return;

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      body.classList.remove('page-ready');
      body.classList.add('page-exit');
      window.setTimeout(() => { window.location.href = href; }, 220);
    });
  });
}

function initScrollProgress(): void {
  if (reduceMotion) return;

  const progress = document.createElement('div');
  progress.id = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.appendChild(progress);

  let ticking = false;
  const update = (): void => {
    const documentElement = document.documentElement;
    const max = documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  targets.forEach((el) => el.classList.add('pre-reveal'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('pre-reveal');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el) => observer.observe(el));
}

function initMotionReveal(scope: ParentNode = document): void {
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const targets = scope.querySelectorAll<HTMLElement>(
    '.index-row, .index-row-static, .case-media, .case-text > *, footer .footer-grid > *'
  );
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target as HTMLElement;
      target.classList.add('is-visible');
      observer.unobserve(target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  targets.forEach((el, index) => {
    el.classList.add('motion-reveal');
    el.style.setProperty('--motion-delay', `${Math.min((index % 6) * 45, 225)}ms`);
    observer.observe(el);
  });
}

function initHeroParallax(): void {
  if (reduceMotion || !finePointer) return;
  const visual = document.querySelector<HTMLElement>('.hero-visual');
  const frame = document.querySelector<HTMLElement>('.hero-frame');
  if (!visual || !frame) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let framePending = false;

  const animate = (): void => {
    currentX += (targetX - currentX) * 0.09;
    currentY += (targetY - currentY) * 0.09;
    frame.style.transform = `translate3d(${currentX.toFixed(2)}px,${currentY.toFixed(2)}px,0)`;

    if (Math.abs(targetX - currentX) > 0.02 || Math.abs(targetY - currentY) > 0.02) {
      requestAnimationFrame(animate);
    } else {
      framePending = false;
    }
  };

  visual.addEventListener('pointermove', (event) => {
    const rect = visual.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 5;
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(animate);
    }
  }, { passive: true });

  visual.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(animate);
    }
  });
}

function initSpotlight(): void {
  if (reduceMotion || !finePointer) return;

  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  spotlight.setAttribute('aria-hidden', 'true');
  body.appendChild(spotlight);

  let x = -200;
  let y = -200;
  let currentX = x;
  let currentY = y;
  let pending = false;

  const paint = (): void => {
    currentX += (x - currentX) * 0.18;
    currentY += (y - currentY) * 0.18;
    spotlight.style.transform = `translate3d(${currentX}px,${currentY}px,0)`;
    pending = false;
  };

  document.addEventListener('pointermove', (event) => {
    x = event.clientX;
    y = event.clientY;
    if (!pending) {
      pending = true;
      requestAnimationFrame(paint);
    }
  }, { passive: true });
}

function initMagneticControls(): void {
  if (reduceMotion || !finePointer) return;

  const selector = '.btn, .btn-ghost, .theme-btn, .section-link, .case-nav-link';
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 5;
      el.style.setProperty('--mx', `${x.toFixed(2)}px`);
      el.style.setProperty('--my', `${y.toFixed(2)}px`);
      el.classList.add('magnetic-active');
    }, { passive: true });

    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
      el.classList.remove('magnetic-active');
    });
  });
}

function initTilt(scope: ParentNode = document): void {
  if (reduceMotion || !finePointer) return;

  scope.querySelectorAll<HTMLElement>('.case-media, .index-thumb, .pull-quote').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--tilt-x', `${(py * -3).toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${(px * 4).toFixed(2)}deg`);
      el.style.setProperty('--glow-x', `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--glow-y', `${((py + 0.5) * 100).toFixed(1)}%`);
      el.classList.add('tilt-active');
    }, { passive: true });

    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.classList.remove('tilt-active');
    });
  });
}

function initIndexRows(scope: ParentNode = document): void {
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const rows = scope.querySelectorAll<HTMLElement>('.index-row');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  rows.forEach((row) => {
    const number = row.querySelector<HTMLElement>('.index-num');
    if (!number) return;
    number.classList.add('number-reveal');
    observer.observe(row);
  });
}

function projectRow(project: Project): HTMLAnchorElement {
  const row = document.createElement('a');
  row.className = 'index-row';
  row.href = project.href;
  row.dataset.category = project.category;
  row.innerHTML = `
    <span class="index-num">${project.number}</span>
    <div class="index-main"><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p></div>
    <span class="index-tag">${escapeHtml(project.category)}</span>
    <span class="index-thumb"><img src="${escapeHtml(project.image)}" alt="" loading="lazy"></span>
  `;
  return row;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
}

async function getProjects(): Promise<Project[] | null> {
  const candidates = ['/api/projects', 'data/projects.json'];
  for (const url of candidates) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) continue;
      const data: unknown = await response.json();
      if (!Array.isArray(data)) continue;
      return data as Project[];
    } catch {
      // Static hosting may not expose the API. Try the JSON source next.
    }
  }
  return null;
}

async function initProjectData(): Promise<void> {
  const list = document.querySelector<HTMLElement>('[data-project-list]');
  if (!list) return;

  const projects = await getProjects();
  if (!projects?.length) {
    initProjectFilter(list);
    return;
  }

  const fragment = document.createDocumentFragment();
  projects.forEach((project) => fragment.appendChild(projectRow(project)));
  list.replaceChildren(fragment);
  list.setAttribute('data-filterable', '');
  initProjectFilter(list);
  initMotionReveal(list);
  initTilt(list);
  initIndexRows(list);
}

function initProjectFilter(list: HTMLElement = document.querySelector<HTMLElement>('.index-list[data-filterable]') ?? document.body): void {
  if (!list.matches('.index-list')) return;
  if (list.previousElementSibling?.classList.contains('filter-bar')) return;

  const rows = Array.from(list.querySelectorAll<HTMLElement>('.index-row'));
  if (!rows.length) return;

  const categories = ['All', ...Array.from(new Set(rows.map((row) => row.dataset.category).filter(Boolean) as string[]))];
  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Filter projects');

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-btn${category === 'All' ? ' active' : ''}`;
    button.textContent = category;
    button.dataset.filter = category;
    button.setAttribute('aria-pressed', String(category === 'All'));
    bar.appendChild(button);
  });

  list.parentNode?.insertBefore(bar, list);
  bar.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const selected = target.dataset.filter ?? 'All';

    bar.querySelectorAll('.filter-btn').forEach((button) => {
      const active = button === target;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    rows.forEach((row) => {
      const visible = selected === 'All' || row.dataset.category === selected;
      row.classList.toggle('project-card-hidden', !visible);
    });
  });
}

function initDraggableProfile(): void {
  const photo = document.getElementById('profilePhoto') as HTMLImageElement | null;
  if (!photo || reduceMotion) return;

  const baseRotation = 2;
  const stiffness = 130;
  const damping = 9;
  const maxDrag = 130;
  const tiltPerPx = 0.13;
  const tiltFromVelocity = 0.012;

  let dx = 0;
  let dy = 0;
  let vx = 0;
  let vy = 0;
  let dragging = false;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let startDX = 0;
  let startDY = 0;
  let previousDX = 0;
  let previousDY = 0;
  let lastTime: number | null = null;

  const clamp = (): void => {
    const distance = Math.hypot(dx, dy);
    if (distance <= maxDrag) return;
    const eased = maxDrag + (distance - maxDrag) * 0.28;
    const scale = eased / distance;
    dx *= scale;
    dy *= scale;
  };

  photo.addEventListener('pointerdown', (event) => {
    dragging = true;
    pointerId = event.pointerId;
    photo.setPointerCapture(event.pointerId);
    startX = event.clientX;
    startY = event.clientY;
    startDX = dx;
    startDY = dy;
    previousDX = dx;
    previousDY = dy;
  });

  photo.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    dx = startDX + event.clientX - startX;
    dy = startDY + event.clientY - startY;
    clamp();
  });

  const endDrag = (event: PointerEvent): void => {
    if (pointerId !== null && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
  };

  photo.addEventListener('pointerup', endDrag);
  photo.addEventListener('pointercancel', endDrag);

  const frame = (time: number): void => {
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.032);
    lastTime = time;

    if (dragging) {
      vx = dt > 0 ? (dx - previousDX) / dt : vx;
      vy = dt > 0 ? (dy - previousDY) / dt : vy;
      previousDX = dx;
      previousDY = dy;
    } else if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
      const ax = -stiffness * dx - damping * vx;
      const ay = -stiffness * dy - damping * vy;
      vx += ax * dt;
      vy += ay * dt;
      dx += vx * dt;
      dy += vy * dt;
    } else {
      dx = 0;
      dy = 0;
      vx = 0;
      vy = 0;
    }

    const rotation = Math.max(-42, Math.min(46, baseRotation + dx * tiltPerPx + vx * tiltFromVelocity));
    photo.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(${rotation.toFixed(2)}deg)`;
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function init(): void {
  initTheme();
  initHeader();
  initPageState();
  initPageTransitions();
  initScrollProgress();
  initReveal();
  initMotionReveal();
  initHeroParallax();
  initSpotlight();
  initMagneticControls();
  initTilt();
  initIndexRows();
  initDraggableProfile();

  const projectList = document.querySelector<HTMLElement>('.index-list[data-project-list]');
  if (projectList) {
    void initProjectData();
  } else {
    initProjectFilter();
  }
}

document.addEventListener('DOMContentLoaded', init, { once: true });
