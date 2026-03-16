/* ============================================================
   TECTOP — site.js
   - Navbar scroll shadow
   - Mobile nav toggle
   - Active nav link highlight
   - Smooth scroll for anchor links
   - Intersection Observer animations
   ============================================================ */

(function () {
  'use strict';

  const THEME_KEY = 'tectop-theme';
  const root = document.documentElement;

  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    const toggleIcon = document.querySelector('.theme-toggle .theme-icon');
    if (toggleIcon) toggleIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  };

  applyTheme(getPreferredTheme());

  /* ── Transition overlay (light overlay for page transitions) ── */
  const createTransitionOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'transition-overlay';
    document.body.appendChild(overlay);
    return overlay;
  };
  const transitionOverlay = createTransitionOverlay();

  /* ── Preloader logic (only on index.html, first visit) ── */
  const preloader = document.querySelector('.preloader');

  const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  const alreadyShown = localStorage.getItem('preloaderShown');

  if (!isHome || alreadyShown) {
    if (preloader) {
      preloader.style.display = 'none';
    }
  } else {
    const preloaderCounter = preloader.querySelector('.preloader-counter');
    const preloaderProgressBar = preloader.querySelector('.preloader-progress-bar');

    // Animate preloader
    let progress = 0;
    const duration = 5000; // 5 seconds (duração visual da barra)
    const minDisplay = 5000; // tempo mínimo de exibição garantido
    const startTime = Date.now();

    function animatePreloader() {
      const elapsed = Date.now() - startTime;
      progress = Math.min(100, (elapsed / duration) * 100);
      preloaderCounter.textContent = Math.floor(progress);
      preloaderProgressBar.style.width = progress + '%';

      if (progress < 100) {
        requestAnimationFrame(animatePreloader);
      }
    }

    animatePreloader();

    window.addEventListener('load', () => {
      // Espera o tempo mínimo antes de fechar, independente de quando o load disparou
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplay - elapsed);

      setTimeout(() => {
        // Garante que a barra chega a 100% antes de fechar
        preloaderCounter.textContent = '100';
        preloaderProgressBar.style.width = '100%';

        setTimeout(() => {
          preloader.classList.add('is-hidden');
          setTimeout(() => {
            preloader.classList.add('is-gone');
            preloader.remove();
          }, 900); // Match animation duration
          localStorage.setItem('preloaderShown', 'true');
        }, 300);
      }, remaining);
    });
  }

  /* ── Smooth page transitions ── */








  /* ── Theme toggle ── */
  const navControls = document.querySelector('.header-inner');
  const navToggle = document.querySelector('.nav-toggle');
  if (navControls) {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle';
    themeBtn.type = 'button';
    themeBtn.setAttribute('aria-label', 'Alternar tema');
    themeBtn.innerHTML = '<span class="theme-icon" aria-hidden="true"></span>';
    if (navToggle && navToggle.parentNode === navControls) {
      navControls.insertBefore(themeBtn, navToggle);
    } else {
      navControls.appendChild(themeBtn);
    }

    applyTheme(getPreferredTheme());

    themeBtn.addEventListener('click', () => {
      const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
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
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.textContent = 'Menu';
      }
    });
    // Close on link click
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.textContent = 'Menu';
      });
    });
  }

  /* ── Smooth page transitions ── */
  const isSameOriginLink = (href) => {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  };

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!isSameOriginLink(href)) return;

    link.addEventListener('click', (event) => {
      const url = new URL(href, window.location.href);
      // Ignore navigations within the same page
      if (url.pathname === window.location.pathname && url.hash) return;
      if (url.pathname === window.location.pathname && !url.hash) return;

      event.preventDefault();

      if (document.body.classList.contains('page-transitioning')) return;

      document.body.classList.add('page-transitioning');
      transitionOverlay.classList.add('visible');
      sessionStorage.setItem('page-transition', '1');

      window.setTimeout(() => {
        window.location.href = url.href;
      }, 620);
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

  /* ── Page-entry: overlay sobe revelando a nova página ── */
  const midTransition = sessionStorage.getItem('page-transition');
  if (midTransition) {
    sessionStorage.removeItem('page-transition');
    transitionOverlay.classList.add('covered');               // cobre instantaneamente (sem animação)
    document.documentElement.classList.remove('page-covered'); // passa cobertura do CSS para o overlay JS
    document.body.classList.add('page-entering');              // conteúdo pronto para animar

    const revealPage = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {        // duplo rAF garante paint antes da transição
          transitionOverlay.classList.remove('covered');
          transitionOverlay.classList.add('leaving'); // overlay sobe e sai pelo topo
          window.setTimeout(() => {
            transitionOverlay.classList.remove('leaving');
            document.body.classList.remove('page-entering');
          }, 750); // 600ms fade + 150ms buffer
        });
      });
    };

    const waitForImages = () => {
      // Espera imagens não-lazy (e lazy já cacheadas) serem carregadas E decodificadas
      const imgs = Array.from(document.images).filter(img =>
        img.getAttribute('loading') !== 'lazy' || img.complete
      );
      const decodes = imgs.map(img =>
        img.decode ? img.decode().catch(() => {}) : Promise.resolve()
      );
      // Também aguarda fontes para evitar flash de texto
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      Promise.all([...decodes, fontsReady]).then(() => {
        window.clearTimeout(fallback);
        // RAF extra: garante que o browser pintou os elementos decodificados antes de revelar
        window.requestAnimationFrame(() => revealPage());
      });
    };

    // Fallback de 2s para não bloquear se alguma imagem travar
    const fallback = window.setTimeout(revealPage, 2000);

    if (document.readyState === 'complete') {
      waitForImages();
    } else {
      window.addEventListener('load', waitForImages, { once: true });
    }
  }

  /* ── Entrance animations via IntersectionObserver ── */
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(28px); transition: opacity .55s ease, transform .55s ease; }
    .reveal.visible { opacity: 1; transform: none; }
    .reveal-left  { opacity: 0; transform: translateX(-28px); transition: opacity .55s ease, transform .55s ease; }
    .reveal-left.visible  { opacity: 1; transform: none; }
    .reveal-right { opacity: 0; transform: translateX(28px); transition: opacity .55s ease, transform .55s ease; }
    .reveal-right.visible { opacity: 1; transform: none; }
  `;
  document.head.appendChild(style);

  // Apply .reveal to major blocks
  document.querySelectorAll('.card, .service-card, .stat, .gallery img, .logo-grid img').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 6) * 60}ms`;
  });
  document.querySelectorAll('.home-hero-content').forEach(el => el.classList.add('reveal-left'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));


  /* ── Awwwards interactions (home) ── */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  const splitTitle = document.querySelector('[data-split]');
  if (splitTitle) {
    const words = splitTitle.textContent.trim().split(/\s+/).map((word) => `<span class="split-word">${word}&nbsp;</span>`).join('');
    splitTitle.innerHTML = words;
    requestAnimationFrame(() => splitTitle.classList.add('is-ready'));
  }

  const magneticButtons = document.querySelectorAll('.magnetic');
  if (!reducedMotion) {
    magneticButtons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        button.style.transform = `translate(${dx * 0.14}px, ${dy * 0.2}px)`;
      });
      button.addEventListener('pointerleave', () => {
        button.style.transform = 'translate(0, 0)';
      });
    });
  }

  const counters = document.querySelectorAll('[data-counter]');
  const formatCounter = (value) => {
    if (value >= 1000) return `+${Math.round(value / 1000)} mil`;
    return `+${value}`;
  };

  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.getAttribute('data-counter'));
      const duration = 1200;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatCounter(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.35 });

  counters.forEach((c) => counterObserver.observe(c));

  const staggerItems = document.querySelectorAll('.mvv-block, .stats-cards .stat, .service-card');
  staggerItems.forEach((item, index) => {
    item.setAttribute('data-stagger-item', '');
    item.style.transitionDelay = `${(index % 6) * 70}ms`;
  });

  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.15 });

  staggerItems.forEach((item) => staggerObserver.observe(item));

  const hero = document.querySelector('.home-awwwards .home-hero');
  if (hero && !reducedMotion) {
    const shiftBackground = () => {
      const ratio = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      hero.style.filter = `hue-rotate(${ratio * 18}deg)`;
    };
    window.addEventListener('scroll', shiftBackground, { passive: true });
    shiftBackground();
  }

  /* ── Smooth scroll for # links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();

