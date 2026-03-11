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


  /* ── Cinematic preloader ── */
  const preloader = document.querySelector('.preloader');
  const preloaderBar = document.querySelector('[data-preloader-bar]');
  const preloaderPercent = document.querySelector('[data-preloader-percent]');
  const preloaderMessage = document.querySelector('[data-preloader-message]');

  if (preloader && preloaderBar && preloaderPercent && preloaderMessage) {
    const messages = [
      'Carregando experiência...',
      'Inicializando sistema...',
      'Preparando interface...'
    ];

    let progress = 0;
    let targetProgress = 12;
    let messageIndex = 0;
    let rafId = 0;
    let completed = false;
    let lastTick = 0;
    let pageReady = false;
    let assetsReady = false;

    document.body.classList.add('preloader-active');

    const waitForImage = (img) => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'eager');
      } else if (img.getAttribute('loading') === 'lazy') {
        img.setAttribute('loading', 'eager');
      }

      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    };

    const waitForPageImages = () => {
      const images = Array.from(document.images);
      if (!images.length) {
        return Promise.resolve();
      }

      return Promise.all(images.map(waitForImage));
    };

    const updateVisuals = (value) => {
      const bounded = Math.max(0, Math.min(100, value));
      preloaderBar.style.width = `${bounded}%`;
      preloaderPercent.textContent = `${Math.round(bounded)}%`;
    };

    const advanceMessage = () => {
      messageIndex = (messageIndex + 1) % messages.length;
      preloaderMessage.textContent = messages[messageIndex];
    };

    const step = (timestamp) => {
      if (!lastTick) {
        lastTick = timestamp;
      }
      const delta = timestamp - lastTick;
      lastTick = timestamp;

      const smoothing = completed ? 0.14 : 0.05;
      progress += (targetProgress - progress) * smoothing * (delta / 16.6);

      if (Math.abs(targetProgress - progress) < 0.25) {
        progress = targetProgress;
      }

      if (!completed && progress < 92) {
        targetProgress = Math.min(92, targetProgress + 0.08 * (delta / 16.6));
      }

      updateVisuals(progress);

      if (completed && progress >= 100) {
        finalizePreloader();
        return;
      }

      rafId = window.requestAnimationFrame(step);
    };

    const finalizePreloader = () => {
      clearPreloaderTimers();
      document.removeEventListener('readystatechange', syncReadystate);
      preloader.classList.add('is-hidden');
      document.body.classList.remove('preloader-active');
      window.setTimeout(() => {
        preloader.classList.add('is-gone');
      }, 760);
    };

    const completeProgress = () => {
      if (!pageReady || !assetsReady) {
        return;
      }
      completed = true;
      targetProgress = 100;
      preloaderMessage.textContent = 'Ambiente pronto';
    };

    const syncReadystate = () => {
      if (document.readyState === 'interactive') {
        targetProgress = Math.max(targetProgress, 70);
      }
      if (document.readyState === 'complete') {
        pageReady = true;
        completeProgress();
      }
    };

    const messageTimer = window.setInterval(() => {
      if (!completed) {
        advanceMessage();
      }
    }, 1350);

    const clearPreloaderTimers = () => {
      window.clearInterval(messageTimer);
      window.cancelAnimationFrame(rafId);
    };

    window.addEventListener('beforeunload', clearPreloaderTimers, { once: true });
    document.addEventListener('readystatechange', syncReadystate);
    window.addEventListener('load', () => {
      pageReady = true;
      completeProgress();
    }, { once: true });

    waitForPageImages()
      .catch(() => undefined)
      .finally(() => {
        assetsReady = true;
        targetProgress = Math.max(targetProgress, 95);
        completeProgress();
      });

    window.setTimeout(() => {
      assetsReady = true;
      targetProgress = Math.max(targetProgress, 95);
      completeProgress();
    }, 12000);

    syncReadystate();
    rafId = window.requestAnimationFrame(step);
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

  /* ── Active nav link ── */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentFile || (currentFile === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── One-time preloader (per browser tab) ── */
  const preloaderKey = 'tectop-preloader-shown-v1';
  if (!sessionStorage.getItem(preloaderKey)) {
    const preloaderStyle = document.createElement('style');
    preloaderStyle.textContent = `
      .tectop-preloader {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: grid;
        place-items: center;
        gap: 16px;
        background: #0b172f;
        color: #fff;
        transition: opacity .4s ease;
      }
      .tectop-preloader.hide { opacity: 0; pointer-events: none; }
      .tectop-preloader__spinner {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 4px solid rgba(255, 255, 255, .25);
        border-top-color: #4ea3ff;
        animation: tectop-spin .9s linear infinite;
      }
      @keyframes tectop-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(preloaderStyle);

    const preloader = document.createElement('div');
    preloader.className = 'tectop-preloader';
    preloader.innerHTML = '<div class="tectop-preloader__spinner" aria-hidden="true"></div><strong>Carregando...</strong>';
    document.body.appendChild(preloader);
    document.body.style.overflow = 'hidden';

    const hidePreloader = () => {
      preloader.classList.add('hide');
      setTimeout(() => {
        preloader.remove();
        preloaderStyle.remove();
        document.body.style.overflow = '';
      }, 420);
      sessionStorage.setItem(preloaderKey, '1');
    };

    if (document.readyState === 'complete') {
      hidePreloader();
    } else {
      window.addEventListener('load', hidePreloader, { once: true });
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
  document.querySelectorAll('.hero-content, .home-hero-content').forEach(el => el.classList.add('reveal-left'));
  document.querySelectorAll('.hero-media').forEach(el => el.classList.add('reveal-right'));

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
