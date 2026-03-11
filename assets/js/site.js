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

    document.body.classList.add('preloader-active');

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
      completed = true;
      targetProgress = 100;
      preloaderMessage.textContent = 'Ambiente pronto';
    };

    const syncReadystate = () => {
      if (document.readyState === 'interactive') {
        targetProgress = Math.max(targetProgress, 70);
      }
      if (document.readyState === 'complete') {
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
    window.addEventListener('load', completeProgress, { once: true });

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


  /* ── Image loading optimization ── */
  const isCriticalImage = (img) => {
    return Boolean(
      img.closest('.site-header') ||
      img.closest('.top-banner') ||
      img.closest('.home-hero') ||
      img.closest('.hero-media') ||
      img.closest('.whatsapp-fab')
    );
  };

  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }

    if (isCriticalImage(img)) {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'eager');
      }
      if (!img.hasAttribute('fetchpriority')) {
        img.setAttribute('fetchpriority', 'high');
      }
      return;
    }

    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    if (!img.hasAttribute('fetchpriority')) {
      img.setAttribute('fetchpriority', 'low');
    }
  });

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