/* Surrey Contracting Limited — interactions */

// ---------- Mobile nav ----------
const navToggle = document.getElementById('navToggle');
const navDrawer = document.getElementById('navDrawer');
navToggle.addEventListener('click', () => {
  const open = !navDrawer.hidden;
  navDrawer.hidden = open;
  navToggle.classList.toggle('open', !open);
});
navDrawer.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navDrawer.hidden = true;
    navToggle.classList.remove('open');
  });
});

// Drawer collapsible groups (Services)
navDrawer.querySelectorAll('[data-drawer-toggle]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const sub = btn.nextElementSibling;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !open);
    if (sub) sub.hidden = open;
  });
});

// ---------- Hero slider + word rotator ----------
const slides = document.querySelectorAll('.hero-slide');
const dotBtns = document.querySelectorAll('.dot-btn');
const wordTrack = document.getElementById('wordTrack');
const wordsCount = 3; // Groundworks, Bulk Earthworks, Commercial Surfacing (last duplicate for seamless loop)

let activeSlide = 0;
let wordIdx = 0;
let slideTimer = null;
let wordTimer = null;

const setSlide = (i) => {
  activeSlide = i;
  slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
  dotBtns.forEach((b, idx) => b.classList.toggle('is-active', idx === i));
  // swap hero background layers
  const heroBg = document.getElementById('heroBg');
  if (heroBg) heroBg.classList.toggle('show-2', i === 1);
  // when arriving on slide 2, kick off word rotator; when leaving, stop it
  if (i === 1) startWords(); else stopWords();
};

const startWords = () => {
  if (wordTimer) return;
  wordTimer = setInterval(rotateWord, 3000);
};
const stopWords = () => {
  if (wordTimer) { clearInterval(wordTimer); wordTimer = null; }
  // reset to first word
  wordIdx = 0;
  wordTrack.style.transition = 'none';
  wordTrack.style.transform = 'translateY(0)';
  // force reflow then restore transition
  void wordTrack.offsetHeight;
  wordTrack.style.transition = '';
};
const rotateWord = () => {
  wordIdx += 1;
  wordTrack.style.transform = `translateY(-${wordIdx}em)`;
  // when we hit the duplicate (index 3 == copy of index 0), snap back silently
  if (wordIdx === wordsCount) {
    setTimeout(() => {
      wordTrack.style.transition = 'none';
      wordIdx = 0;
      wordTrack.style.transform = 'translateY(0)';
      void wordTrack.offsetHeight;
      wordTrack.style.transition = '';
    }, 600);
  }
};

const advanceSlide = () => setSlide((activeSlide + 1) % slides.length);
const slideDurations = [5000, wordsCount * 3000]; // slide 1 = 5s, slide 2 = 4 words × 3s
const startSlideTimer = () => {
  if (slideTimer) clearTimeout(slideTimer);
  slideTimer = setTimeout(() => { advanceSlide(); startSlideTimer(); }, slideDurations[activeSlide] || 5000);
};

dotBtns.forEach((b) => {
  b.addEventListener('click', () => {
    setSlide(+b.dataset.go);
    startSlideTimer(); // reset timer on manual nav
  });
});

if (slides.length) {
  setSlide(0);
  startSlideTimer();
}

// ---------- Stats counters (count up when in view) ----------
const counters = document.querySelectorAll('.stat-num[data-target]');
const animateCount = el => {
  const target = +el.dataset.target;
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const statObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCount(e.target);
      statObs.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
counters.forEach(c => statObs.observe(c));

// ---------- Testimonial slider ----------
const tTrack = document.getElementById('tTrack');
const tDots = document.querySelectorAll('#tDots button');
if (tTrack && tDots.length) {
  const total = tDots.length;
  let tIdx = 0;
  let tTimer;
  const goTo = (i) => {
    tIdx = (i + total) % total;
    tTrack.style.transform = `translateX(-${tIdx * 100}%)`;
    tDots.forEach((d, n) => d.classList.toggle('is-active', n === tIdx));
  };
  const start = () => { tTimer = setInterval(() => goTo(tIdx + 1), 6500); };
  const reset = () => { clearInterval(tTimer); start(); };
  tDots.forEach((d, n) => d.addEventListener('click', () => { goTo(n); reset(); }));
  const tSlider = document.getElementById('tSlider');
  if (tSlider) {
    tSlider.addEventListener('mouseenter', () => clearInterval(tTimer));
    tSlider.addEventListener('mouseleave', start);
  }
  start();
}

// ---------- Quote form ----------
const form = document.getElementById('quoteForm');
const success = document.getElementById('qfSuccess');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // basic validation
    const required = form.querySelectorAll('[required]');
    let ok = true;
    required.forEach(f => {
      if (!f.value.trim()) {
        f.style.borderColor = '#ff6b6b';
        ok = false;
      } else {
        f.style.borderColor = '';
      }
    });
    if (!ok) return;

    const btn = form.querySelector('button[type=submit]');
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch('/api/contact', { method: 'POST', body: new FormData(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Send failed');
      if (success) {
        success.hidden = false;
        success.style.color = '';
        success.textContent = "Thanks — we've got it. A contracts manager will be in touch within one working day.";
      }
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          event_category: 'form',
          event_label: form.dataset.leadSource || 'quote_enquiry',
          form_id: form.id || 'quoteForm',
        });
      }
      btn.textContent = 'Sent ✓';
      form.reset();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = originalLabel;
      if (success) {
        success.hidden = false;
        success.style.color = '#ff6b6b';
        success.textContent = (err && err.message && err.message !== 'Send failed')
          ? err.message
          : 'Something went wrong — please call us on 01932 932650.';
      }
    }
  });
}

// ---------- Phone & email click tracking ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || typeof gtag !== 'function') return;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('tel:')) {
    gtag('event', 'phone_click', { event_category: 'contact', event_label: href.replace('tel:', '') });
  } else if (href.startsWith('mailto:')) {
    gtag('event', 'email_click', { event_category: 'contact', event_label: href.replace('mailto:', '') });
  }
});

// ---------- Landing page sticky CTA ----------
const stickyCta = document.querySelector('.lp-sticky-cta');
if (stickyCta) {
  const formEl = document.getElementById('quoteForm');
  let formVisible = false;
  const update = () => {
    stickyCta.classList.toggle('is-visible', window.scrollY > 320 && !formVisible);
  };
  if (formEl) {
    new IntersectionObserver((entries) => {
      formVisible = entries[0].isIntersecting;
      update();
    }, { threshold: 0.15 }).observe(formEl);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- Nav shadow is now baked in via CSS ----------

// ---------- Projects gallery filter ----------
const galleryGrid = document.getElementById('galleryGrid');
if (galleryGrid) {
  const cards = galleryGrid.querySelectorAll('.gallery-card');
  const state = { cat: 'All', svc: 'All' };
  const applyFilter = () => {
    cards.forEach(card => {
      // Support both data-cat (single) and data-cats (multiple, comma-separated)
      const cats = (card.dataset.cats || card.dataset.cat || '')
        .split(',').map(s => s.trim()).filter(Boolean);
      const s = card.dataset.svc;
      const catOk = state.cat === 'All' || cats.includes(state.cat);
      const svcOk = state.svc === 'All' || s === state.svc;
      card.classList.toggle('is-hidden', !(catOk && svcOk));
    });
  };
  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const value = btn.dataset.value;
      // deactivate sibling chips in the same group
      btn.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
      btn.classList.add('is-active');
      state[filter] = value;
      applyFilter();
    });
  });
}
