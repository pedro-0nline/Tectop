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

