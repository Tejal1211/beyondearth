/* =========================================================================
   BEYOND EARTH — script.js
   Vanilla JS only. Organized into self-contained modules, each guarded
   so a missing element on the page never throws and blocks the rest.
   ========================================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------------
     0. UTILITIES
     ----------------------------------------------------------------------- */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* -----------------------------------------------------------------------
     1. LOADING SCREEN
     A staged fake-progress bar that always completes, then fades the
     loader out. Real asset loading isn't needed here (no external
     images/fonts beyond webfonts), so this is a deliberate pacing device
     that gives the hero animations a clean, synced start point.
     ----------------------------------------------------------------------- */
  function initLoader() {
    const loader = document.getElementById('loader');
    const fill = document.getElementById('loaderBarFill');
    const pct = document.getElementById('loaderPct');
    if (!loader || !fill || !pct) return;

    if (prefersReducedMotion) {
      loader.classList.add('is-hidden');
      document.body.classList.add('is-loaded');
      return;
    }

    let progress = 0;
    const tick = () => {
      // Ease toward 100, slowing near the end for a more deliberate feel.
      const remaining = 100 - progress;
      progress += Math.max(0.6, remaining * 0.09);
      progress = clamp(progress, 0, 100);
      fill.style.width = progress + '%';
      pct.textContent = Math.round(progress) + '%';

      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          loader.classList.add('is-hidden');
          document.body.classList.add('is-loaded');
        }, 250);
      }
    };
    requestAnimationFrame(tick);

    // Safety net: never let the loader trap the user.
    setTimeout(() => {
      loader.classList.add('is-hidden');
      document.body.classList.add('is-loaded');
    }, 4000);
  }

  /* -----------------------------------------------------------------------
     2. CUSTOM CURSOR + HOVER SPOTLIGHT
     ----------------------------------------------------------------------- */
  function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function animateRing() {
      ringX = lerp(ringX, mouseX, 0.18);
      ringY = lerp(ringY, mouseY, 0.18);
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const hoverTargets = document.querySelectorAll('a, button, [data-tilt], .planet, .gallery-item');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  }

  /* -----------------------------------------------------------------------
     3. NAVBAR: scroll state, active link, mobile toggle
     ----------------------------------------------------------------------- */
  function initNav() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (!navbar) return;

    function onScroll() {
      navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('is-open');
        navToggle.classList.toggle('is-active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('is-open');
          navToggle.classList.remove('is-active');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Active-link highlighting based on which section is in view.
    const sections = document.querySelectorAll('main section[id]');
    const navAnchors = document.querySelectorAll('[data-nav]');
    if (sections.length && navAnchors.length) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              navAnchors.forEach((a) => {
                a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
              });
            }
          });
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      sections.forEach((s) => sectionObserver.observe(s));
    }
  }

  /* -----------------------------------------------------------------------
     4. SCROLL PROGRESS BAR + BACK-TO-TOP
     ----------------------------------------------------------------------- */
  function initScrollProgress() {
    const fill = document.getElementById('scrollProgressFill');
    const backToTop = document.getElementById('backToTop');

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (fill) fill.style.width = pct + '%';
      if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > window.innerHeight * 0.6);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* -----------------------------------------------------------------------
     5. GENERIC SCROLL-REVEAL (IntersectionObserver on [data-reveal])
     ----------------------------------------------------------------------- */
  function initReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger siblings slightly for cards that share a parent grid.
            const delay = (entry.target.dataset.revealIndex || 0) * 80;
            setTimeout(() => entry.target.classList.add('is-visible'), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((t, i) => {
      // Assign a small index within each parent for stagger purposes.
      const parent = t.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.hasAttribute('data-reveal'));
        t.dataset.revealIndex = siblings.indexOf(t);
      }
      observer.observe(t);
    });
  }

  /* -----------------------------------------------------------------------
     Boot sequence
     ----------------------------------------------------------------------- */
  onReady(() => {
    initLoader();
    initCursor();
    initNav();
    initScrollProgress();
    initReveal();
  });
})();

/* =========================================================================
   6. HERO STARFIELD CANVAS — twinkling stars + occasional meteor shower
   ========================================================================= */
(function () {
  'use strict';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHeroCanvas() {
    const canvas = document.getElementById('starCanvas');
    const hero = document.getElementById('hero');
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    let width, height, stars, meteors, dpr;
    let rafId = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function buildStars() {
      const count = Math.floor((width * height) / 6000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      }));
      meteors = [];
    }

    function maybeSpawnMeteor() {
      if (Math.random() < 0.012 && meteors.length < 3) {
        const startX = Math.random() * width * 0.7 + width * 0.15;
        meteors.push({
          x: startX,
          y: -10,
          len: Math.random() * 90 + 60,
          speed: Math.random() * 9 + 7,
          angle: Math.PI / 3.2,
          life: 1,
        });
      }
    }

    let t = 0;
    function draw() {
      t += 1;
      ctx.clearRect(0, 0, width, height);

      // Twinkling stars
      stars.forEach((s) => {
        const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.25;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${clampAlpha(alpha)})`;
        ctx.fill();
      });

      // Meteors
      if (!prefersReducedMotion) {
        maybeSpawnMeteor();
        meteors.forEach((m) => {
          const dx = Math.cos(m.angle) * m.speed;
          const dy = Math.sin(m.angle) * m.speed;
          m.x += dx;
          m.y += dy;
          m.life -= 0.012;

          const tailX = m.x - Math.cos(m.angle) * m.len;
          const tailY = m.y - Math.sin(m.angle) * m.len;
          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255,255,255,${clampAlpha(m.life)})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        });
        meteors = meteors.filter((m) => m.life > 0 && m.y < height + 100);
      }

      rafId = requestAnimationFrame(draw);
    }

    function clampAlpha(a) {
      return Math.max(0, Math.min(1, a));
    }

    function handleVisibility() {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        draw();
      }
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
  }

  function initHeroParallax() {
    const hero = document.getElementById('hero');
    const layers = document.querySelectorAll('.hero-layer');
    const astronaut = document.getElementById('heroAstronaut');
    if (!hero || prefersReducedMotion) return;

    let targetX = 0, targetY = 0, curX = 0, curY = 0;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      targetY = (e.clientY - rect.top - rect.height / 2) / rect.height;
    });

    function animate() {
      curX = lerp(curX, targetX, 0.06);
      curY = lerp(curY, targetY, 0.06);

      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth || 0.2);
        layer.style.transform = `translate(${curX * depth * -60}px, ${curY * depth * -60}px)`;
      });

      if (astronaut) {
        astronaut.style.transform = `translate(${curX * 24}px, ${curY * 24}px)`;
      }

      requestAnimationFrame(animate);
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    animate();
  }

  function boot() {
    initHeroCanvas();
    initHeroParallax();
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();

/* =========================================================================
   7. MARS DRONE CANVAS — small flying vehicles drifting across the skyline
   ========================================================================= */
(function () {
  'use strict';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initDroneCanvas() {
    const canvas = document.getElementById('droneCanvas');
    const section = document.getElementById('mars');
    if (!canvas || !section || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let width, height, dpr, drones;
    let visible = false;
    let rafId = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = section.clientWidth;
      height = section.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildDrones();
    }

    function buildDrones() {
      drones = Array.from({ length: 6 }, () => spawnDrone());
    }

    function spawnDrone() {
      const y = Math.random() * height * 0.55 + height * 0.1;
      return {
        x: Math.random() * width,
        y,
        speed: Math.random() * 0.6 + 0.4,
        size: Math.random() * 3 + 2,
        blink: Math.random() * Math.PI * 2,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      drones.forEach((d) => {
        d.x += d.speed;
        d.blink += 0.08;
        if (d.x > width + 20) {
          d.x = -20;
          d.y = Math.random() * height * 0.55 + height * 0.1;
        }

        // Body
        ctx.fillStyle = 'rgba(20, 14, 30, 0.9)';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.size * 2.2, d.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Blinking light
        const blinkAlpha = (Math.sin(d.blink) + 1) / 2;
        ctx.fillStyle = `rgba(255, 107, 74, ${0.4 + blinkAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Thin contrail
        ctx.strokeStyle = 'rgba(63, 224, 229, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x - d.size * 3, d.y);
        ctx.lineTo(d.x - d.size * 8, d.y);
        ctx.stroke();
      });

      if (visible) rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;
          if (visible && !rafId) {
            draw();
          } else if (!visible && rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      },
      { threshold: 0.05 }
    );
    sectionObserver.observe(section);
  }

  if (document.readyState !== 'loading') initDroneCanvas();
  else document.addEventListener('DOMContentLoaded', initDroneCanvas);
})();

/* =========================================================================
   8. TECH CARD TILT — subtle 3D tilt following the cursor
   ========================================================================= */
(function () {
  'use strict';
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initTilt() {
    const cards = document.querySelectorAll('[data-tilt]');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${py * -8}deg) rotateY(${px * 8}deg) translateY(-8px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  if (document.readyState !== 'loading') initTilt();
  else document.addEventListener('DOMContentLoaded', initTilt);
})();

/* =========================================================================
   9. BLACK HOLE CANVAS — the signature element.
   Particles (representing stars/matter) spiral inward toward an event
   horizon, with a gravitational-lensing-style glow ring. Intensity is
   tied to scroll position within the section so it feels like the page
   itself is being pulled in as you scroll through it.
   ========================================================================= */
(function () {
  'use strict';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initBlackHole() {
    const canvas = document.getElementById('blackholeCanvas');
    const section = document.getElementById('blackhole');
    const textTargets = document.querySelectorAll('[data-bh-reveal]');
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    let width, height, dpr, particles, cx, cy, horizonR;
    let scrollIntensity = 0; // 0 -> 1, how deep into the section we are
    let visible = false;
    let rafId = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = section.clientWidth;
      height = section.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      cy = height / 2;
      horizonR = Math.min(width, height) * 0.075;
      buildParticles();
    }

    function buildParticles() {
      const count = prefersReducedMotion ? 0 : Math.floor((width * height) / 2600);
      particles = Array.from({ length: count }, () => spawnParticle());
    }

    function spawnParticle() {
      const angle = Math.random() * Math.PI * 2;
      const radius = horizonR + Math.random() * Math.max(width, height) * 0.55;
      return {
        angle,
        radius,
        speed: (Math.random() * 0.004 + 0.0015) * (1 + horizonR / radius),
        size: Math.random() * 1.6 + 0.4,
        hueShift: Math.random(),
      };
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Ambient deep-space gradient backdrop
      const bg = ctx.createRadialGradient(cx, cy, horizonR, cx, cy, Math.max(width, height) * 0.7);
      bg.addColorStop(0, 'rgba(5,3,10,1)');
      bg.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const pull = 1 + scrollIntensity * 1.8;

      // Particles spiraling inward
      particles.forEach((p) => {
        p.angle += p.speed * pull;
        p.radius -= (0.18 + scrollIntensity * 0.5) * (horizonR / p.radius);

        if (p.radius < horizonR * 0.9) {
          Object.assign(p, spawnParticle());
          p.radius = Math.max(width, height) * 0.55;
        }

        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius * 0.6; // slight ellipse for a disk feel

        const distFactor = clamp(1 - (p.radius - horizonR) / (Math.max(width, height) * 0.55), 0, 1);
        const r = Math.floor(lerp(63, 255, p.hueShift));
        const g = Math.floor(lerp(224, 107, p.hueShift));
        const b = Math.floor(lerp(229, 74, p.hueShift));
        ctx.beginPath();
        ctx.arc(x, y, p.size + distFactor * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + distFactor * 0.6})`;
        ctx.fill();
      });

      // Accretion glow ring just outside the horizon
      const glowR = horizonR * (1.5 + scrollIntensity * 0.4);
      const glow = ctx.createRadialGradient(cx, cy, horizonR * 0.6, cx, cy, glowR);
      glow.addColorStop(0, 'rgba(0,0,0,1)');
      glow.addColorStop(0.55, `rgba(123,92,255,${0.25 + scrollIntensity * 0.25})`);
      glow.addColorStop(0.85, `rgba(63,224,229,${0.18 + scrollIntensity * 0.2})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Event horizon — pure black core
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, horizonR, 0, Math.PI * 2);
      ctx.fill();

      if (visible && !prefersReducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function onScroll() {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when section top is at bottom of viewport, 1 when section top reaches top
      const raw = 1 - clamp(rect.top / vh, 0, 1);
      scrollIntensity = clamp(raw, 0, 1);

      if (!prefersReducedMotion) return; // static draw handled by RAF loop otherwise

      draw(); // single redraw when motion is reduced
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;
          if (visible && !rafId && !prefersReducedMotion) draw();
        });
      },
      { threshold: 0.05 }
    );
    sectionObserver.observe(section);

    // Text reveal tied to the same observer, slightly delayed for cinema pacing.
    if (textTargets.length) {
      const textObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
            }
          });
        },
        { threshold: 0.4 }
      );
      textTargets.forEach((t) => textObserver.observe(t));
    }
  }

  if (document.readyState !== 'loading') initBlackHole();
  else document.addEventListener('DOMContentLoaded', initBlackHole);
})();

/* =========================================================================
   10. TIMELINE PROGRESS FILL — vertical line fills as you scroll past items
   ========================================================================= */
(function () {
  'use strict';

  function initTimelineFill() {
    const track = document.querySelector('.timeline-track');
    const fill = document.getElementById('timelineLineFill');
    if (!track || !fill) return;

    function update() {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      // How far the viewport's vertical center has progressed through the track.
      const progressed = clamp((vh * 0.6 - rect.top), 0, total);
      const pct = total > 0 ? (progressed / total) * 100 : 0;
      fill.style.height = pct + '%';
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  if (document.readyState !== 'loading') initTimelineFill();
  else document.addEventListener('DOMContentLoaded', initTimelineFill);
})();

/* =========================================================================
   11. FINALE CANVAS — soft ambient drifting particles behind the closing CTA
   ========================================================================= */
(function () {
  'use strict';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initFinaleCanvas() {
    const canvas = document.getElementById('finaleCanvas');
    const section = document.getElementById('finale');
    if (!canvas || !section || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let width, height, dpr, particles;
    let visible = false;
    let rafId = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = section.clientWidth;
      height = section.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: 70 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.4,
        vy: -(Math.random() * 0.25 + 0.05),
        vx: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.2,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(63, 224, 229, ${p.alpha})`;
        ctx.fill();
      });
      if (visible) rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;
          if (visible && !rafId) draw();
          else if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = null; }
        });
      },
      { threshold: 0.05 }
    );
    sectionObserver.observe(section);
  }

  if (document.readyState !== 'loading') initFinaleCanvas();
  else document.addEventListener('DOMContentLoaded', initFinaleCanvas);
})();

/* =========================================================================
   12. PLANET → CARD LINKING
   Clicking an orbiting planet smooth-scrolls to its matching card and
   gives it a brief highlight, tying the orbit visualization to the
   informational cards below it.
   ========================================================================= */
(function () {
  'use strict';

  function initPlanetLinks() {
    const planets = document.querySelectorAll('.planet[data-planet]');
    const cards = document.querySelectorAll('.planet-card');
    if (!planets.length || !cards.length) return;

    const cardMap = {};
    cards.forEach((card) => {
      const name = card.querySelector('h3')?.textContent.trim().toLowerCase();
      if (name) cardMap[name] = card;
    });

    planets.forEach((planet) => {
      planet.setAttribute('role', 'button');
      planet.setAttribute('tabindex', '0');
      planet.setAttribute('aria-label', 'View ' + planet.dataset.planet + ' details');

      const activate = () => {
        const target = cardMap[planet.dataset.planet];
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.borderColor = 'rgba(63, 224, 229, 0.8)';
        target.style.boxShadow = '0 0 0 1px rgba(63,224,229,0.3), 0 8px 30px rgba(63,224,229,0.25)';
        setTimeout(() => {
          target.style.borderColor = '';
          target.style.boxShadow = '';
        }, 1400);
      };

      planet.addEventListener('click', activate);
      planet.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  if (document.readyState !== 'loading') initPlanetLinks();
  else document.addEventListener('DOMContentLoaded', initPlanetLinks);
})();

/* =========================================================================
   13. SMOOTH-SCROLL POLYFILL SAFETY
   Ensures in-page anchor links always smooth scroll even if a browser
   ignores the CSS `scroll-behavior` property, and respects reduced motion.
   ========================================================================= */
(function () {
  'use strict';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  if (document.readyState !== 'loading') initAnchorScroll();
  else document.addEventListener('DOMContentLoaded', initAnchorScroll);
})();
