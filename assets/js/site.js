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
  const preloaderShownKey = 'tectop-preloader-shown-v2';
  const prefetchDoneKey = 'tectop-prefetch-done-v1';
  const isHome = Boolean(preloader);
  const shouldShowPreloader = isHome && !localStorage.getItem(preloaderShownKey);
  const shouldPrefetch = isHome && !localStorage.getItem(prefetchDoneKey);

  const collectSameOriginHtmlLinks = () => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const urls = new Set();
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin && url.pathname.endsWith('.html')) {
          urls.add(url.href);
        }
      } catch (_) {
        // Ignore malformed URLs
      }
    });
    return Array.from(urls);
  };

  const prefetchAllRoutes = async () => {
    const routeUrls = collectSameOriginHtmlLinks();
    if (!routeUrls.length) {
      return [];
    }

    const assetUrls = new Set();
    const addAsset = (value, baseUrl) => {
      if (!value) return;
      try {
        const url = new URL(value, baseUrl);
        if (url.origin === window.location.origin) {
          assetUrls.add(url.href);
        }
      } catch (_) {
        // Ignore malformed URLs
      }
    };

    const htmlResponses = await Promise.all(routeUrls.map((url) => fetch(url, { cache: 'force-cache' }).catch(() => null)));
    await Promise.all(htmlResponses.map(async (response, idx) => {
      if (!response || !response.ok) return;
      const html = await response.clone().text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const baseUrl = routeUrls[idx];
      doc.querySelectorAll('link[rel="stylesheet"][href]').forEach((el) => addAsset(el.getAttribute('href'), baseUrl));
      doc.querySelectorAll('script[src]').forEach((el) => addAsset(el.getAttribute('src'), baseUrl));
      doc.querySelectorAll('img[src]').forEach((el) => addAsset(el.getAttribute('src'), baseUrl));
      doc.querySelectorAll('source[srcset]').forEach((el) => {
        const srcset = el.getAttribute('srcset') || '';
        srcset.split(',').forEach((entry) => {
          const candidate = entry.trim().split(' ')[0];
          addAsset(candidate, baseUrl);
        });
      });
    }));

    const uniqueAssets = Array.from(assetUrls);
    if (uniqueAssets.length) {
      if ('caches' in window) {
        try {
          const cache = await caches.open('tectop-preload-v1');
          await cache.addAll(uniqueAssets);
        } catch (_) {
          // Fall back to regular fetch if Cache API fails
        }
      }

      await Promise.all(uniqueAssets.map((url) => fetch(url, { cache: 'force-cache' }).catch(() => null)));
    }

    return uniqueAssets;
  };

  const prefetchPromise = shouldPrefetch ? prefetchAllRoutes() : Promise.resolve();
  const cacheHeroImage = async () => {
    const heroImg = document.querySelector('.hero-media img');
    if (!heroImg) return;
    const src = heroImg.currentSrc || heroImg.getAttribute('src');
    if (!src) return;
    try {
      const url = new URL(src, window.location.href).href;
      if ('caches' in window) {
        const cache = await caches.open('tectop-preload-v1');
        await cache.add(url);
      } else {
        await fetch(src, { cache: 'force-cache' });
      }
    } catch (_) {
      // Ignore caching errors
    }
  };
  const preloadImagesFromAssets = async (assets) => {
    const imageUrls = assets.filter((url) => /\.(png|jpe?g|webp|gif|svg)(\\?|#|$)/i.test(url));
    if (!imageUrls.length) return;
    await Promise.all(imageUrls.map((url) => {
      return new Promise((resolve) => {
        const img = new Image();
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        img.src = url;
      });
    }));
  };

  if (preloader && preloaderBar && preloaderPercent && preloaderMessage) {
    if (!shouldShowPreloader) {
      preloader.classList.add('is-gone');
    } else {
      const preloaderDelayMs = 350;
      let preloaderActivated = false;
      let preloaderTimer = 0;

      const startPreloader = () => {
        if (preloaderActivated) return;
        preloaderActivated = true;
        localStorage.setItem(preloaderShownKey, '1');

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
        let routesReady = !shouldPrefetch;
    
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
          if (!pageReady || !assetsReady || !routesReady) {
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
    
      prefetchPromise
        .then((assets) => preloadImagesFromAssets(assets || []))
        .catch(() => undefined)
        .finally(() => {
          routesReady = true;
          targetProgress = Math.max(targetProgress, 98);
          localStorage.setItem(prefetchDoneKey, '1');
          completeProgress();
        });

      cacheHeroImage();
    
        window.setTimeout(() => {
          assetsReady = true;
          targetProgress = Math.max(targetProgress, 95);
          completeProgress();
        }, 12000);
    
      window.setTimeout(() => {
        routesReady = true;
        targetProgress = Math.max(targetProgress, 98);
        localStorage.setItem(prefetchDoneKey, '1');
        completeProgress();
      }, 24000);
    
        syncReadystate();
        rafId = window.requestAnimationFrame(step);
      };

      const skipPreloader = () => {
        if (preloaderActivated) return;
        preloader.classList.add('is-gone');
      };

      if (document.readyState === 'complete') {
        skipPreloader();
      } else {
        preloaderTimer = window.setTimeout(() => {
          if (document.readyState !== 'complete') {
            startPreloader();
          } else {
            skipPreloader();
          }
        }, preloaderDelayMs);

        window.addEventListener('load', () => {
          if (!preloaderActivated) {
            window.clearTimeout(preloaderTimer);
            skipPreloader();
          }
        }, { once: true });
      }
    }
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
