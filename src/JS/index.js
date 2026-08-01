/* =========================================================================
   Shared site script — index.js
   Safe to include on ANY page: every block checks that its elements exist
   before doing anything, so pages that don't have a mobile menu, a hero
   carousel, a newsletter form, etc. are unaffected instead of crashing.
   ========================================================================= */

// ===== Mobile menu toggle =====
(function initMobileMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('icon-open');
  const iconClose = document.getElementById('icon-close');

  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener('click', () => {
    const isHidden = mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    if (iconOpen) iconOpen.classList.toggle('hidden', isHidden);
    if (iconClose) iconClose.classList.toggle('hidden', !isHidden);
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      if (iconOpen) iconOpen.classList.remove('hidden');
      if (iconClose) iconClose.classList.add('hidden');
    });
  });
})();

(function initImgHeroCarousel() {
  const heroImg = document.getElementById('hero-img');
  if (!heroImg) return;

  const heroPrev = document.getElementById('hero-prev');
  const heroNext = document.getElementById('hero-next');
  const heroProgressBars = document.querySelectorAll('#hero-progress span');

  // Read slide URLs from a data attribute on the img itself.
  // Falls back to the img's current src if no data-slides is set,
  // so pages that don't opt in still work with a single static image.
  let heroSlides = [];
  if (heroImg.dataset.slides) {
    try {
      heroSlides = JSON.parse(heroImg.dataset.slides);
    } catch (e) {
      heroSlides = [heroImg.src];
    }
  } else {
    heroSlides = [heroImg.src];
  }

  let heroIndex = 0;
  const HERO_AUTOPLAY_MS = 5000;
  let heroAutoplayTimer = null;

  function showHeroSlide(index) {
    heroImg.style.opacity = 0;
    window.setTimeout(() => {
      heroImg.src = heroSlides[index];
      heroImg.style.opacity = 1;
    }, 250);

    heroProgressBars.forEach((bar) => {
      const isActive = Number(bar.dataset.index) === index;
      bar.classList.toggle('bg-amber', isActive);
      bar.classList.toggle('bg-white/25', !isActive);
    });
  }

  function startHeroAutoplay() {
    stopHeroAutoplay();
    if (heroSlides.length < 2) return;
    heroAutoplayTimer = window.setInterval(() => {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      showHeroSlide(heroIndex);
    }, HERO_AUTOPLAY_MS);
  }

  function stopHeroAutoplay() {
    if (heroAutoplayTimer) {
      window.clearInterval(heroAutoplayTimer);
      heroAutoplayTimer = null;
    }
  }

  if (heroPrev && heroNext) {
    heroPrev.addEventListener('click', () => {
      heroIndex = (heroIndex - 1 + heroSlides.length) % heroSlides.length;
      showHeroSlide(heroIndex);
      startHeroAutoplay();
    });
    heroNext.addEventListener('click', () => {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      showHeroSlide(heroIndex);
      startHeroAutoplay();
    });
  }

  showHeroSlide(heroIndex);
  startHeroAutoplay();
})();
// ===== Hero carousel (Pattern B: #slides .slide divs + #dots pagination) =====
// Used by campaigns.html's crossfade hero. Runs independently of Pattern A
// above — only initializes if #slides/#dots actually exist on the page.
(function initDotHeroCarousel() {
  const slideEls = Array.from(document.querySelectorAll('#slides .slide'));
  const dotsWrap = document.getElementById('dots');
  if (!slideEls.length || !dotsWrap) return;

  const dotCount = slideEls.length;
  let active = 0;
  let autoTimer;

  function renderDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < dotCount; i++) {
      const d = document.createElement('span');
      d.className = 'dot h-2 rounded-full cursor-pointer ' + (i === active ? 'active' : 'inactive');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function renderSlides() {
    slideEls.forEach((s, i) => s.classList.toggle('active', i === active));
  }

  function goTo(i) {
    active = (i + dotCount) % dotCount;
    renderDots();
    renderSlides();
    resetAutoAdvance();
  }

  function next() { goTo(active + 1); }

  function resetAutoAdvance() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, 4000);
  }

  renderDots();
  renderSlides();
  resetAutoAdvance();
})();

// ===== Header shadow on scroll =====
(function initHeaderShadow() {
  const header = document.getElementById('site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('shadow-lg', window.scrollY > 8);
  });
})();

// ===== Scroll reveal (hardened) =====
(function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  requestAnimationFrame(() => {
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        el.classList.add('in-view');
        revealObserver.unobserve(el);
      }
    });
  });
})();

// ===== Animated counters =====
(function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const divide = parseInt(el.dataset.divide, 10) || null;
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      const display = divide ? Math.round(value / divide) : value;
      el.textContent = display.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((el) => counterObserver.observe(el));
})();

// ===== Newsletter form (front-end only) =====
(function initNewsletterForm() {
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterMsg = document.getElementById('newsletter-msg');
  if (!newsletterForm || !newsletterMsg) return;

  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    newsletterMsg.classList.remove('hidden');
    newsletterForm.reset();
    setTimeout(() => newsletterMsg.classList.add('hidden'), 4000);
  });
})();

// ===== Footer year =====
(function initFooterYear() {
  const yearEl = document.getElementById('year');
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
})();


//-----------Article page----------//
//-----------Article page----------//
(function () {
  const ITEMS_PER_PAGE = 6;

  const grid = document.getElementById('articles-grid');
  const pills = Array.from(document.querySelectorAll('.filter-pill'));
  const searchInput = document.getElementById('article-search');
  const showingCount = document.getElementById('showing-count');
  const noResults = document.getElementById('no-results');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageNumbers = document.getElementById('page-numbers');

  // Guard: this whole block only applies to the articles listing page.
  // On any other page (home, campaigns, etc.) these elements won't exist —
  // bail out instead of throwing and killing the rest of the script.
  if (!grid || !searchInput || !showingCount || !noResults || !prevBtn || !nextBtn || !pageNumbers) {
    return;
  }

  const cards = Array.from(grid.querySelectorAll('.article-card'));
  const state = { filter: 'all', query: '', page: 1 };

  function getFiltered() {
    return cards.filter((card) => {
      const cats = (card.dataset.category || '').split(' ');
      const matchesFilter = state.filter === 'all' || cats.includes(state.filter);
      const haystack = (card.dataset.title + ' ' + card.dataset.excerpt).toLowerCase();
      const matchesSearch = state.query === '' || haystack.includes(state.query);
      return matchesFilter && matchesSearch;
    });
  }

  function setActivePill(filter) {
    pills.forEach((pill) => {
      const isActive = pill.dataset.filter === filter;
      pill.classList.toggle('bg-navy', isActive);
      pill.classList.toggle('text-white', isActive);
      pill.classList.toggle('font-semibold', isActive);
      pill.classList.toggle('bg-white', !isActive);
      pill.classList.toggle('border', !isActive);
      pill.classList.toggle('border-gray-200', !isActive);
      pill.classList.toggle('text-gray-600', !isActive);
      pill.classList.toggle('font-medium', !isActive);
    });
  }

  function renderPageNumbers(totalPages) {
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className =
        'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ' +
        (i === state.page ? 'bg-navy text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100');
      btn.addEventListener('click', () => {
        state.page = i;
        render();
      });
      pageNumbers.appendChild(btn);
    }
  }

  function render() {
    const filtered = getFiltered();
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, end);

    cards.forEach((card) => {
      card.style.display = pageItems.includes(card) ? '' : 'none';
    });

    noResults.classList.toggle('hidden', totalItems !== 0);
    grid.classList.toggle('hidden', totalItems === 0);

    showingCount.textContent =
      totalItems === 0
        ? 'Showing 0 of 0 articles'
        : `Showing ${start + 1}\u2013${Math.min(end, totalItems)} of ${totalItems} article${totalItems === 1 ? '' : 's'}`;

    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;

    renderPageNumbers(totalPages);
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      state.filter = pill.dataset.filter;
      state.page = 1;
      setActivePill(state.filter);
      render();
    });
  });

  searchInput.addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    state.page = 1;
    render();
  });

  prevBtn.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      render();
    }
  });

  nextBtn.addEventListener('click', () => {
    state.page += 1;
    render();
  });

  render();
})();

