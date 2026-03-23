/* ============================================================
   TECTOP — site.js
   - Navbar scroll shadow
   - Mobile nav toggle
   - Active nav link highlight
   - Smooth scroll for anchor links
   - Intersection Observer animations
   - Lenis smooth scroll
   - Custom cursor
   - Animated counters
   - Hero parallax
   - Rich card hover
   - Nav sliding indicator
   ============================================================ */

(function () {
  'use strict';

  /* ── Transition overlay com monograma ── */
  // Reutiliza overlay já inserido pelo inline script no <head>, ou cria novo
  let transitionOverlay = document.getElementById('transition-overlay');
  if (!transitionOverlay) {
    transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'transition-overlay';
    transitionOverlay.className = 'transition-overlay';
    document.body.appendChild(transitionOverlay);
  }
  // Sempre injeta o conteúdo (logo + barra) — o overlay pode ter sido criado vazio pelo inline script
  if (!transitionOverlay.querySelector('.transition-overlay__logo')) {
    transitionOverlay.innerHTML = `
      <div class="transition-overlay__inner">
        <div class="transition-overlay__logo">
          <img src="./home/logotectop.webp" alt="Tectop" style="width:72px;height:72px;object-fit:contain;display:block;">
        </div>
        <div class="transition-overlay__bar"></div>
      </div>`;
  }

  const isHistoryTraversal = () => {
    const navEntry = performance.getEntriesByType?.('navigation')?.[0];
    return (navEntry && navEntry.type === 'back_forward')
      || (performance.navigation && performance.navigation.type === 2);
  };

  const resetTransitionState = () => {
    sessionStorage.removeItem('page-transition');
    document.body.classList.remove('page-transitioning', 'page-entering');
    transitionOverlay.classList.remove('visible', 'covered', 'leaving');
    transitionOverlay.style.opacity = '';
  };

  if (isHistoryTraversal()) {
    resetTransitionState();
  }

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted && !isHistoryTraversal()) return;
    resetTransitionState();
  });

  /* ── Preloader logic ── */
  const preloader = document.querySelector('.preloader');
  const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  const alreadyShown = localStorage.getItem('preloaderShown');

  if (!isHome || alreadyShown) {
    if (preloader) preloader.style.display = 'none';
  } else {
    const preloaderCounter    = preloader.querySelector('.preloader-counter');
    const preloaderProgressBar = preloader.querySelector('.preloader-progress-bar');
    let progress = 0;
    const duration  = 9000;
    const startTime = Date.now();

    function animatePreloader() {
      const elapsed = Date.now() - startTime;
      progress = Math.min(100, (elapsed / duration) * 100);
      preloaderCounter.textContent     = Math.floor(progress);
      preloaderProgressBar.style.width = progress + '%';
      if (progress < 100) requestAnimationFrame(animatePreloader);
    }
    animatePreloader();

    window.addEventListener('load', () => {
      preloaderCounter.textContent     = '100';
      preloaderProgressBar.style.width = '100%';
      setTimeout(() => {
        preloader.classList.add('is-hidden');
        setTimeout(() => { preloader.classList.add('is-gone'); preloader.remove(); }, 900);
        localStorage.setItem('preloaderShown', 'true');
      }, 300);
    });
  }

  /* ── Navbar scroll class ── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile nav toggle ── */
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Fechar' : 'Menu';
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.textContent = 'Menu';
      }
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => { nav.classList.remove('open'); toggle.textContent = 'Menu'; });
    });
  }

  /* ── Smooth page transitions ── */
  const isSameOriginLink = (href) => {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin;
    } catch { return false; }
  };

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!isSameOriginLink(href)) return;
    link.addEventListener('click', (event) => {
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) return;
      if (url.pathname === window.location.pathname && !url.hash) return;
      event.preventDefault();
      if (document.body.classList.contains('page-transitioning')) return;
      document.body.classList.add('page-transitioning');
      transitionOverlay.classList.add('visible');
      sessionStorage.setItem('page-transition', '1');
      window.setTimeout(() => { window.location.href = url.href; }, 620);
    });
  });

  /* ── Active nav link ── */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentFile || (currentFile === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Page-entry reveal ── */
  const midTransition = sessionStorage.getItem('page-transition');
  if (midTransition) {
    sessionStorage.removeItem('page-transition');

    // Aplica 'covered' de forma síncrona ANTES do primeiro paint para evitar flash
    transitionOverlay.classList.add('covered');
    document.body.classList.add('page-entering');
    let pageRevealSettled = false;

    // Garante que o overlay está visível antes de qualquer outra coisa
    // usando dois rAF para garantir que o browser pintou o overlay primeiro
    const revealPage = () => {
      if (pageRevealSettled) return;
      pageRevealSettled = true;
      transitionOverlay.classList.remove('covered');
      transitionOverlay.classList.add('leaving');
      window.setTimeout(() => {
        transitionOverlay.classList.remove('leaving');
        document.body.classList.remove('page-entering');
      }, 750);
    };

    const waitForImages = () => {
      const imgs = Array.from(document.images).filter(img =>
        !img.complete && img.getAttribute('loading') !== 'lazy'
      );
      if (imgs.length === 0) {
        // Nenhuma imagem pendente: revela após um pequeno delay mínimo para garantir o paint
        const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
        fontsReady.then(() => {
          window.clearTimeout(fallback);
          window.requestAnimationFrame(() => window.requestAnimationFrame(revealPage));
        });
        return;
      }
      const decodes = imgs.map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve());
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      Promise.all([...decodes, fontsReady]).then(() => {
        window.clearTimeout(fallback);
        window.requestAnimationFrame(() => window.requestAnimationFrame(revealPage));
      });
    };

    const fallback = window.setTimeout(revealPage, 2000);
    if (document.readyState === 'complete') { waitForImages(); }
    else { window.addEventListener('load', waitForImages, { once: true }); }
  }

  /* ── Entrance animations via IntersectionObserver ── */
  const revealStyle = document.createElement('style');
  revealStyle.textContent = `
    .reveal { opacity: 0; transform: translateY(28px); transition: opacity .55s ease, transform .55s ease; }
    .reveal.visible { opacity: 1; transform: none; }
    .reveal-left  { opacity: 0; transform: translateX(-28px); transition: opacity .55s ease, transform .55s ease; }
    .reveal-left.visible  { opacity: 1; transform: none; }
    .reveal-right { opacity: 0; transform: translateX(28px); transition: opacity .55s ease, transform .55s ease; }
    .reveal-right.visible { opacity: 1; transform: none; }
  `;
  document.head.appendChild(revealStyle);

  document.querySelectorAll('.card, .service-card, .gallery img, .logo-grid img').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 6) * 60}ms`;
  });
  document.querySelectorAll('.home-hero-content').forEach(el => el.classList.add('reveal-left'));

  const shouldSkipViewportReveal = document.body.classList.contains('page-entering');
  if (shouldSkipViewportReveal) {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
      el.classList.add('visible');
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  if (!shouldSkipViewportReveal) {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));
  }

  /* ── Smooth scroll for # links (fallback — Lenis substitui após load) ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      if (window.__lenis) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ════════════════════════════════════════
     MELHORIAS AWWWARDS
  ════════════════════════════════════════ */

  /* ── 1. Lenis smooth scroll ── */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    try {
      const lenis = new Lenis({
        duration: 1.1,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false,
      });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      window.__lenis = lenis;

      /* Substituir scrollIntoView das âncoras pelo Lenis */
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
          const target = document.querySelector(a.getAttribute('href'));
          if (!target) return;
          e.preventDefault();
          e.stopPropagation();
          lenis.scrollTo(target, { offset: -80, duration: 1.1 });
        });
      });
    } catch (err) {
      console.warn('Lenis init failed:', err);
    }
  }

  const lenisScript = document.createElement('script');
  lenisScript.src = 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
  lenisScript.onload = initLenis;
  lenisScript.onerror = () => console.warn('Lenis CDN falhou — scroll nativo ativo');
  document.head.appendChild(lenisScript);

  /* ── 2. Custom cursor ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice  = window.matchMedia('(pointer: coarse)').matches;

  if (!prefersReduced && !isTouchDevice) {
    const cursorDot  = document.createElement('div');
    const cursorRing = document.createElement('div');
    cursorDot.className  = 'cursor-dot';
    cursorRing.className = 'cursor-ring';
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    /* Ring segue com lerp suave */
    function animateCursor() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    /* Expandir em elementos interativos */
    const interactiveSelectors = 'a, button, .btn, .service-card, .card, .nav-toggle, input, textarea, .logo-grid img';
    document.querySelectorAll(interactiveSelectors).forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('cursor-hover');
        cursorRing.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('cursor-hover');
        cursorRing.classList.remove('cursor-hover');
      });
    });

    /* Esconder cursor nativo */
    document.body.style.cursor = 'none';
    document.querySelectorAll('a, button, .btn, input, textarea').forEach(el => {
      el.style.cursor = 'none';
    });

    /* Click pulse */
    document.addEventListener('mousedown', () => cursorRing.classList.add('cursor-click'));
    document.addEventListener('mouseup',   () => cursorRing.classList.remove('cursor-click'));
  }

  /* ── 3. Contadores animados ── */
  function animateCounter(el) {
    const target  = parseFloat(el.dataset.target || el.textContent.replace(/[^\d.]/g, ''));
    const suffix  = el.dataset.suffix || el.textContent.replace(/[\d.]/g, '').trim();
    const prefix  = el.dataset.prefix || '';
    const duration = 1800;
    const start    = performance.now();

    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value    = easeOutExpo(progress) * target;
      el.textContent = prefix + (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* Observa .stat e elementos com data-counter */
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;

      /* Tenta extrair número e sufixo do texto atual */
      const raw    = el.textContent.trim();
      const numMatch = raw.match(/[\d.]+/);
      if (!numMatch) return;

      const num    = parseFloat(numMatch[0]);
      const suffix = raw.replace(numMatch[0], '').trim();

      el.dataset.target = num;
      el.dataset.suffix = suffix;
      animateCounter(el);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  /* Aplica em .stat strong, .stat span, e qualquer elemento com data-counter */
  document.querySelectorAll('.stat, [data-counter]').forEach(el => {
    /* Procura o elemento filho que tem o número, ou usa o próprio */
    const numEl = el.querySelector('strong, span, b') || el;
    if (/\d/.test(numEl.textContent)) counterObserver.observe(numEl);
  });

  /* ── 4. Parallax suave no hero ── */
  const heroMedia = document.querySelector('.home-hero-media');
  if (heroMedia && !prefersReduced) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          heroMedia.style.transform = `translateY(${scrollY * 0.35}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── 5. Hover rico nos cards de serviço ── */
  document.querySelectorAll('.service-card').forEach(card => {
    const iconWrap = card.querySelector('.service-icon, .card-icon, img:first-child, svg');

    card.addEventListener('mouseenter', () => {
      if (iconWrap) {
        iconWrap.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)';
        iconWrap.style.transform  = 'scale(1.15) rotate(-4deg)';
      }
    });
    card.addEventListener('mouseleave', () => {
      if (iconWrap) iconWrap.style.transform = 'scale(1) rotate(0deg)';
    });
  });

  /* ── 6. Nav sliding indicator ── */
  const sitNav = document.querySelector('.site-nav');
  if (sitNav) {
    const indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    sitNav.style.position = 'relative';
    sitNav.appendChild(indicator);

    function moveIndicator(el) {
      const navRect = sitNav.getBoundingClientRect();
      const elRect  = el.getBoundingClientRect();
      indicator.style.width  = elRect.width  + 'px';
      indicator.style.left   = (elRect.left - navRect.left) + 'px';
      indicator.style.opacity = '1';
    }

    const activeLink = sitNav.querySelector('a.active');
    if (activeLink) {
      /* Posiciona sem transição no load */
      indicator.style.transition = 'none';
      setTimeout(() => moveIndicator(activeLink), 50);
      setTimeout(() => { indicator.style.transition = ''; }, 100);
    }

    sitNav.querySelectorAll('a:not(:last-child)').forEach(a => {
      a.addEventListener('mouseenter', () => moveIndicator(a));
      a.addEventListener('mouseleave', () => {
        if (activeLink) moveIndicator(activeLink);
        else indicator.style.opacity = '0';
      });
    });
  }

  /* ── 7. Magnetic buttons ── */
  if (!prefersReduced && !isTouchDevice) {
    document.querySelectorAll('.btn.primary, .site-nav a:last-child').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width  / 2) * 0.2;
        const y = (e.clientY - rect.top  - rect.height / 2) * 0.2;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

})();
