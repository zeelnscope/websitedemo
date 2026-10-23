/* ==========================================================================
   STARK — interactions & motion layer
   Vanilla JS, no dependencies. Every module is wrapped in safe() so one
   failure can never take the rest of the page down.
   ========================================================================== */
(() => {
  "use strict";

  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const safe = (fn) => {
    try { fn(); } catch (err) { console.warn("[stark]", err); }
  };

  /* ---------- "ready" gate: hero entrance waits for the preloader ---------- */
  let isReady = false;
  const readyQueue = [];
  const onReady = (fn) => (isReady ? safe(fn) : readyQueue.push(fn));
  const fireReady = () => {
    if (isReady) return;
    isReady = true;
    doc.classList.add("ready");
    readyQueue.splice(0).forEach((fn) => safe(fn));
  };
  setTimeout(fireReady, 6500); // failsafe: never leave the page locked

  const header = $(".site-header");
  const nav = $(".nav");
  const toggle = $(".nav-toggle");

  /* ======================================================================
     NAV — mobile toggle, scrollspy, sliding indicator
     ====================================================================== */
  function initNav() {
    if (!nav) return;
    const links = $$("a", nav);
    links.forEach((a, i) => a.style.setProperty("--i", i));

    if (toggle) {
      const setOpen = (open) => {
        nav.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        if (open && header) header.classList.remove("is-hidden");
      };
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
      links.forEach((link) => link.addEventListener("click", () => setOpen(false)));
    }

    const ind = document.createElement("span");
    ind.className = "nav-indicator";
    ind.setAttribute("aria-hidden", "true");
    nav.appendChild(ind);

    let active = null;
    const place = () => {
      if (!active) return ind.classList.remove("show");
      ind.style.setProperty("--x", active.offsetLeft + "px");
      ind.style.setProperty("--w", active.offsetWidth + "px");
      ind.classList.add("show");
    };
    const setActive = (id) => {
      active = links.find((l) => l.getAttribute("href") === "#" + id) || null;
      links.forEach((l) => l.classList.toggle("is-active", l === active));
      place();
    };
    window.addEventListener("resize", place);

    if (!("IntersectionObserver" in window)) return;
    const opts = { rootMargin: "-45% 0px -50% 0px" };
    const spy = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), opts);
    links.forEach((l) => {
      const sec = document.getElementById(l.getAttribute("href").slice(1));
      if (sec) spy.observe(sec);
    });
    const clear = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive("")), opts);
    ["top", "about"].forEach((id) => { const el = document.getElementById(id); if (el) clear.observe(el); });
  }

  function initYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ======================================================================
     PRELOADER
     ====================================================================== */
  function runPreloader() {
    const pre = $("#preloader");
    if (!pre) return fireReady();
    if (reduce) { pre.remove(); return fireReady(); }

    const bar = $(".pre-bar i", pre);
    const count = $(".pre-count", pre);
    const MIN = 1800;
    const t0 = performance.now();
    let loaded = document.readyState === "complete";
    let finished = false;
    window.addEventListener("load", () => { loaded = true; }, { once: true });

    const finish = () => {
      if (finished) return;
      finished = true;
      bar.style.transform = "scaleX(1)";
      count.textContent = "100";
      pre.classList.add("done");
      setTimeout(fireReady, 480);            // hero starts while the curtains part
      setTimeout(() => pre.remove(), 1500);
    };
    const tick = (now) => {
      if (finished) return;
      const t = clamp((now - t0) / MIN, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const p = loaded ? eased : Math.min(eased, 0.92);
      bar.style.transform = `scaleX(${p})`;
      count.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (p >= 1) return finish();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(finish, 5000);
  }

  /* ======================================================================
     TEXT SPLITTING + REVEAL MARKING
     ====================================================================== */
  function splitWords(el, base) {
    let idx = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) return frag.appendChild(document.createTextNode(" "));
            const w = document.createElement("span");
            w.className = "w";
            w.setAttribute("aria-hidden", "true");
            const wi = document.createElement("span");
            wi.className = "wi";
            wi.style.setProperty("--wi", idx++);
            wi.textContent = tok;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    el.classList.add("split");
    if (base) el.style.setProperty("--base", base + "ms");
  }

  const mark = (el, type = "up", delay = 0) => {
    if (!el) return;
    el.setAttribute("data-reveal", type === "up" ? "" : type);
    el.style.setProperty("--d", delay.toFixed(2) + "s");
  };
  const group = (containerSel, childSel, type = "up", o = {}) => {
    const { step = 0.08, base = 0, max = 8 } = o;
    $$(containerSel).forEach((c) =>
      $$(childSel, c).forEach((el, i) => mark(el, type, base + Math.min(i, max) * step))
    );
  };

  function setupReveals() {
    // hero choreography (absolute delays — everything is in view at once)
    const h1 = $(".hero h1");
    if (h1) splitWords(h1, 180);
    mark($(".hero .kicker"), "up", 0.05);
    mark($(".hero-sub"), "up", 0.6);
    mark($(".hero .actions"), "up", 0.75);
    mark($(".hero .stats"), "up", 0.9);
    mark($(".hero-visual"), "scale", 0.35);

    // headlines
    $$(".section-head h2, .about-copy h2, .export h2").forEach((h) => splitWords(h, 90));

    group(".section-head", ".kicker, :scope > p", "up", { step: 0.12 });
    mark($(".about-visual"), "curtain", 0);
    group(".about-grid", ".about-copy .kicker, .about-copy > p, .facts > div", "up", { step: 0.09, base: 0.1 });
    group(".collection-grid", ".collection-card", "up", { step: 0.1 });
    group(".product-grid", ".product-card", "up", { step: 0.05, max: 18 });
    group(".video-showcase", ":scope > *", "up", { step: 0.12 });
    group(".feature-grid", ".feature-card", "up", { step: 0.07 });
    group(".mounts", ":scope > div", "up", { step: 0.14 });
    group(".finish-group", "h3, .swatch", "up", { step: 0.06 });
    group(".spec-tools", ":scope > *", "up", { step: 0.08 });
    mark($(".spec-scroll"), "up", 0.1);
    group("#specs tbody", "tr", "up", { step: 0.04, max: 18 });
    group(".export-card-body", ".globe-script-kicker, .kicker, .export-lead, .badges", "up", { step: 0.1 });
    mark($(".globe-pedestal-wrap"), "scale", 0.1);
    mark($(".export-grid > div:last-child"), "scale", 0.2);
    mark($(".contact-grid > .contact-col:first-child"), "left", 0);
    mark($(".contact-grid > .contact-col:last-child"), "right", 0.12);
    group(".contact-grid", ".cline", "up", { step: 0.08, base: 0.25 });
    group(".footer-top", ":scope > div, .cols > div", "up", { step: 0.1 });
    mark($(".legal"), "up", 0.2);
  }

  /* ---------- SVG line drawing ---------- */
  const SHAPES = "path, rect, circle, line, polyline, ellipse";
  function prepDraw(container) {
    if (!container) return;
    const shapes = [];
    const svgs = container.matches("svg") ? [container] : $$("svg", container);
    svgs.forEach((svg) =>
      $$(SHAPES, svg).forEach((s) => {
        if (s.matches(".drop, .ripple") || s.closest("[data-nodraw], .slot-icon")) return;
        let len = 0;
        try { len = s.getTotalLength(); } catch (e) { /* not a geometry element */ }
        if (!len || !isFinite(len)) return;
        s.style.strokeDasharray = len;
        s.style.strokeDashoffset = len;
        shapes.push({ s, len });
      })
    );
    container._shapes = shapes;
  }
  function playDraw(container, delay = 0) {
    const shapes = container && container._shapes;
    if (!shapes) return;
    shapes.forEach(({ s }, i) => {
      s.style.transition = `stroke-dashoffset 1.5s var(--ease) ${(delay + i * 0.035).toFixed(2)}s`;
      s.style.strokeDashoffset = 0;
    });
    setTimeout(() => shapes.forEach(({ s }) => {
      s.style.strokeDasharray = "none";
      s.style.transition = "";
    }), (delay + shapes.length * 0.035 + 1.8) * 1000);
  }

  /* ---------- counters / scramble ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    if (isNaN(to)) return;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const fmt = el.dataset.format === "inr" ? (n) => Math.round(n).toLocaleString("en-IN") : (n) => String(Math.round(n));
    const dur = 1700;
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      el.textContent = prefix + fmt(to * (1 - Math.pow(1 - t, 4))) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function scramble(el) {
    const final = el.textContent;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const total = 26;
    let frame = 0;
    const run = () => {
      const reveal = (frame / total) * final.length;
      el.textContent = Array.from(final).map((c, i) => (i < reveal ? c : chars[Math.floor(Math.random() * chars.length)])).join("");
      if (frame++ < total) requestAnimationFrame(run);
      else el.textContent = final;
    };
    run();
  }

  /* ---------- reveal observer ---------- */
  const reveals = new Map();
  function setupRevealCallbacks() {
    const heroCard = $(".sink-card");
    prepDraw(heroCard);
    reveals.set($(".hero-visual"), () => playDraw(heroCard, 0.5));

    const stats = $(".hero .stats");
    reveals.set(stats, () => {
      $$("[data-count]", stats).forEach(countUp);
      $$("[data-scramble]", stats).forEach(scramble);
    });

    $$(".collection-card").forEach((card) => {
      prepDraw(card);
      const price = $(".price b", card);
      if (price) {
        price.dataset.count = String(parseInt(price.textContent.replace(/\D/g, ""), 10));
        price.dataset.prefix = "₹";
        price.dataset.format = "inr";
      }
      reveals.set(card, () => { playDraw(card, 0.2); if (price) countUp(price); });
    });
    $$(".feature-card").forEach((c) => { prepDraw(c); reveals.set(c, () => playDraw(c, 0.15)); });
    $$(".mounts > div").forEach((c) => { prepDraw(c); reveals.set(c, () => playDraw(c, 0.2)); });
    const av = $(".about-visual");
    if (av) { prepDraw(av); reveals.set(av, () => playDraw(av, 0.3)); }
  }

  function startReveals() {
    const targets = $$("[data-reveal], .split");
    if (!("IntersectionObserver" in window)) return targets.forEach((t) => t.classList.add("in"));
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
        const cb = reveals.get(e.target);
        if (cb) safe(cb);
      }),
      { threshold: 0.14, rootMargin: "0px 0px -5% 0px" }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- hero line art + ambient particles ---------- */
  function setupHeroArt() {
    const art = $(".hero-art");
    if (!art) return;
    prepDraw(art);
    $$("polygon", art).forEach((p) => { p.style.opacity = 0; });
  }
  function playHeroArt() {
    const art = $(".hero-art");
    if (!art) return;
    playDraw(art, 0.2);
    $$("polygon", art).forEach((p, i) => {
      const target = p.getAttribute("opacity") || 1;
      p.style.opacity = "";
      p.animate([{ opacity: 0 }, { opacity: target }], { duration: 1800, delay: 500 + i * 220, easing: "ease-out", fill: "backwards" });
    });
  }
  function initSparkles() {
    const box = $("#sparkles");
    if (!box) return;
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("i");
      s.className = "spark";
      s.style.cssText = `left:${rnd(2, 98)}%;top:${rnd(4, 96)}%;--s:${rnd(6, 15).toFixed(1)}px;--t:${rnd(3, 7).toFixed(1)}s;--dl:${rnd(0, 6).toFixed(1)}s`;
      box.appendChild(s);
    }
    for (let i = 0; i < 4; i++) {
      const f = document.createElement("i");
      f.className = "facet";
      f.style.cssText = `left:${rnd(0, 85)}%;top:${rnd(0, 75)}%;--s:${rnd(90, 230).toFixed(0)}px;--t:${rnd(9, 16).toFixed(1)}s;--fx:${rnd(-40, 40).toFixed(0)}px;--fy:${rnd(-40, 40).toFixed(0)}px;--fr:${rnd(-14, 14).toFixed(0)}deg`;
      box.appendChild(f);
    }
  }

  /* ======================================================================
     POINTER EFFECTS — tilt, hero parallax, magnetic, spotlight, cursor
     ====================================================================== */
  function initTilt() {
    if (!fine) return;
    $$(".collection-card:not(.stack-card), .product-card, .swatch").forEach((el) => el.setAttribute("data-tilt", ""));
    $$("[data-tilt]").forEach((el) => {
      const glare = document.createElement("span");
      glare.className = "glare";
      glare.setAttribute("aria-hidden", "true");
      el.appendChild(glare);
      let raf = 0;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.classList.add("is-tilting");
          el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 12).toFixed(2)}deg) rotateY(${((px - 0.5) * 12).toFixed(2)}deg)`;
          el.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
          el.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        });
      });
      el.addEventListener("pointerleave", () => {
        cancelAnimationFrame(raf);
        el.classList.remove("is-tilting");
        el.style.transform = "";
      });
    });
  }

  function initHeroPointer() {
    const hero = $(".hero");
    if (!hero || !fine || reduce) return;
    const glow = $(".hero-glow");
    const card = $(".sink-card");
    if (card && !card.querySelector(".glare")) {
      const g = document.createElement("span");
      g.className = "glare";
      g.setAttribute("aria-hidden", "true");
      card.appendChild(g);
    }
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      if (glow) {
        glow.style.setProperty("--gx", (nx * 100).toFixed(1) + "%");
        glow.style.setProperty("--gy", (ny * 100).toFixed(1) + "%");
      }
      if (card) {
        // keep the swatches perfectly still under the pointer so they are easy to click
        if (e.target instanceof Element && e.target.closest(".finish-dots")) {
          card.classList.add("is-tilting");
          card.style.transform = "none";
          return;
        }
        const cr = card.getBoundingClientRect();
        card.classList.add("is-tilting", "is-live");
        card.style.transform = `perspective(1000px) rotateY(${((nx - 0.5) * 14).toFixed(2)}deg) rotateX(${((0.5 - ny) * 10).toFixed(2)}deg)`;
        card.style.setProperty("--gx", clamp(((e.clientX - cr.left) / cr.width) * 100, -20, 120).toFixed(1) + "%");
        card.style.setProperty("--gy", clamp(((e.clientY - cr.top) / cr.height) * 100, -20, 120).toFixed(1) + "%");
      }
    });
    hero.addEventListener("pointerleave", () => {
      if (!card) return;
      card.classList.remove("is-tilting", "is-live");
      card.style.transform = "";
    });
  }

  function initMagnetic() {
    if (!fine) return;
    $$(".btn, .cta-catalog, .to-top, .enquiry button[type='submit']").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + "px");
        el.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
      });
    });
  }

  function initSpotlight() {
    if (!fine) return;
    document.addEventListener("pointermove", (e) => {
      if (!(e.target instanceof Element)) return;
      const c = e.target.closest(".feature-card");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      c.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    }, { passive: true });
  }

  function initCursor() {
    const ring = $("#cursorRing");
    if (!ring || !fine) return;
    let x = -100, y = -100, rx = x, ry = y, seen = false;
    window.addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; rx = x; ry = y; doc.classList.add("has-cursor"); }
      ring.classList.remove("is-hidden");
      if (e.target instanceof Element) {
        ring.classList.toggle("is-link", !!e.target.closest("a, button, input, select, textarea, label, .swatch, .collection-card"));
        ring.classList.toggle("on-light", !!e.target.closest(".paper, .paper-alt, .about"));
      }
    }, { passive: true });
    const refresh = () => {
      if (!seen) return;
      const t = document.elementFromPoint(x, y);
      if (!t) return;
      ring.classList.toggle("is-link", !!t.closest("a, button, input, select, textarea, label, .swatch, .collection-card"));
      ring.classList.toggle("on-light", !!t.closest(".paper, .paper-alt, .about"));
    };
    window.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("pointerdown", () => ring.classList.add("is-down"));
    window.addEventListener("pointerup", () => ring.classList.remove("is-down"));
    doc.addEventListener("mouseleave", () => ring.classList.add("is-hidden"));
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ======================================================================
     SCROLL — progress bar, header hide/show, back-to-top ring, parallax
     ====================================================================== */
  function initScroll() {
    const bar = $("#scrollProgress");
    const toTop = $("#toTop");
    const ring = $("#toTopRing");
    const C = 2 * Math.PI * 24;
    if (ring) { ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; }
    const parallax = reduce ? [] : [
      { el: $(".about-visual svg"), k: 0.06 },
      { el: $(".export-grid > div:last-child svg"), k: 0.05 },
    ].filter((p) => p.el);
    const heroArt = reduce ? null : $(".hero-art");
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp(y / max, 0, 1) : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (ring) ring.style.strokeDashoffset = C * (1 - p);
      if (toTop) toTop.classList.toggle("show", y > 600);

      if (header && !reduce) {
        const dy = y - lastY;
        const menuOpen = nav && nav.classList.contains("open");
        if (y > 320 && dy > 6 && !menuOpen) header.classList.add("is-hidden");
        else if (dy < -6 || y < 320) header.classList.remove("is-hidden");
      }
      lastY = y;

      if (heroArt && y < window.innerHeight * 1.4) heroArt.style.transform = `translate3d(0, ${(y * 0.14).toFixed(1)}px, 0)`;
      parallax.forEach(({ el, k }) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
        const center = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-center * k).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    if (header) header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
    update();
  }

  /* marquee speeds up with scroll velocity */
  function initMarquee() {
    const track = $(".strip-track");
    if (!track || reduce || !track.getAnimations) return;
    let anim = null, v = 0, last = window.scrollY;
    const loop = () => {
      const y = window.scrollY;
      v += (Math.abs(y - last) - v) * 0.1;
      last = y;
      anim = anim || track.getAnimations()[0];
      if (anim) {
        const rate = 1 + Math.min(v * 0.3, 5);
        if (Math.abs(anim.playbackRate - rate) > 0.02) anim.playbackRate = rate;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ======================================================================
     FEATURES — finish preview, spec table search & column focus
     ====================================================================== */
  function initFinish() {
    const card = $(".sink-card");
    const dots = $$(".fdot");
    const nameEl = $("#finishName");
    if (!card || !dots.length) return;
    const body = $(".sink-body", card);
    const basin = $(".sink-basin", card);

    const applyDot = (d) => {
      dots.forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-pressed", "false"); });
      d.classList.add("is-active");
      d.setAttribute("aria-pressed", "true");
      card.classList.add("has-finish");
      card.classList.toggle("is-light", d.dataset.light === "1");
      body.style.fill = d.dataset.body;
      basin.style.fill = d.dataset.basin;
      nameEl.textContent = d.dataset.name;
    };

    let autoIdx = 0;
    let autoTimer = 0;
    const stopAuto = () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = 0;
      }
    };
    const startAuto = () => {
      if (reduce || autoTimer) return;
      autoTimer = setInterval(() => {
        applyDot(dots[autoIdx % dots.length]);
        autoIdx = (autoIdx + 1) % dots.length;
      }, 2800);
    };

    dots.forEach((d, idx) =>
      d.addEventListener("click", () => {
        stopAuto();
        const wasOn = d.getAttribute("aria-pressed") === "true";
        if (wasOn) {
          dots.forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-pressed", "false"); });
          card.classList.remove("has-finish", "is-light");
          body.style.fill = basin.style.fill = "";
          nameEl.textContent = "Tap a swatch";
          return;
        }
        autoIdx = (idx + 1) % dots.length;
        applyDot(d);
      })
    );

    onReady(() => {
      applyDot(dots[0]);
      autoIdx = 1;
      startAuto();
    });
  }

  function initSpec() {
    const input = $("#specSearch");
    const table = $("#specs table");
    if (!input || !table) return;
    const rows = $$("tbody tr", table);
    const count = $("#specCount");
    const tbody = $("tbody", table);
    const norm = (s) => s.toLowerCase().replace(/×/g, "x").replace(/\s+/g, " ").trim();
    const hay = rows.map((r) => norm(r.textContent));
    const empty = document.createElement("tr");
    empty.className = "no-results";
    empty.innerHTML = `<td colspan="6">No models match that search — try “single”, “double” or a size like 20x40.</td>`;
    empty.hidden = true;
    tbody.appendChild(empty);

    const filter = () => {
      const terms = norm(input.value).split(" ").filter(Boolean);
      let shown = 0;
      rows.forEach((r, i) => {
        const ok = terms.every((t) => hay[i].includes(t));
        r.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      empty.hidden = shown !== 0;
      count.textContent = terms.length ? `${shown} of ${rows.length} models` : `${rows.length} models`;
    };
    input.addEventListener("input", filter);
    filter();

    $$(".spec-toggle button").forEach((btn) =>
      btn.addEventListener("click", () => {
        $$(".spec-toggle button").forEach((b) => b.classList.toggle("is-active", b === btn));
        if (btn.dataset.focus === "all") delete table.dataset.focus;
        else table.dataset.focus = btn.dataset.focus;
      })
    );
  }

  /* ======================================================================
     ENQUIRY FORM — loading state, success tick, gold burst
     ====================================================================== */
  function burst(el) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const colors = ["#d9b073", "#e9d3ac", "#8c1d1d", "#f6f1e8"];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement("i");
      p.className = "burst";
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      p.style.background = colors[i % colors.length];
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2;
      const d = 70 + Math.random() * 130;
      const anim = p.animate(
        [
          { transform: "translate(-50%,-50%) rotate(0deg) scale(1)", opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 30}px) rotate(${Math.random() * 540}deg) scale(0)`, opacity: 0 },
        ],
        { duration: 800 + Math.random() * 600, easing: "cubic-bezier(.16,.84,.44,1)" }
      );
      anim.onfinish = () => p.remove();
    }
  }

  function initForm() {
    const form = document.getElementById("enquiry-form");
    const success = document.getElementById("f-success");
    if (!form || !success) return;
    const btn = $("button[type='submit']", form);
    const label = $(".btn-label", form);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (form.classList.contains("is-sending")) return;
      const prev = label ? label.textContent : "";
      form.classList.add("is-sending");
      if (btn) btn.disabled = true;
      if (label) label.textContent = "Sending…";
      success.hidden = true;
      setTimeout(() => {
        // Wire this to Formspree, Netlify Forms, or a CRM webhook (see README).
        form.classList.remove("is-sending");
        if (btn) btn.disabled = false;
        if (label) label.textContent = prev;
        success.hidden = false;
        form.reset();
        if (btn) burst(btn);
      }, 900);
    });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  safe(initNav);
  safe(initYear);
  safe(initForm);
  safe(initSpec);

  /* ======================================================================
     MEDIA SLOTS (Blank Photo/Video Shapes with Automatic Video Playback)
     & PRODUCT MODEL FILTER
     ====================================================================== */
  function initMediaSlots() {
    const videoObserver = ("IntersectionObserver" in window)
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const vid = entry.target;
            if (!(vid instanceof HTMLVideoElement)) return;
            const rawSrc = (vid.getAttribute("src") || "").trim();
            const sourceEl = $("source[src]", vid);
            const hasSrc = Boolean(rawSrc || (sourceEl && (sourceEl.getAttribute("src") || "").trim()));
            if (!hasSrc || vid.hasAttribute("data-errored")) return;
            if (entry.isIntersecting) {
              vid.defaultMuted = true;
              vid.muted = true;
              const p = vid.play();
              if (p && typeof p.catch === "function") p.catch(() => {});
            } else {
              vid.pause();
            }
          });
        }, { threshold: 0.25 })
      : null;

    $$(".media-slot").forEach((slot) => {
      const media = $("img, video", slot);
      const hintMsg = $(".slot-hint-msg", slot);
      const playBtn = $(".slot-play-btn", slot);
      if (!media) return;

      if (media.tagName === "VIDEO") {
        media.defaultMuted = true;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.autoplay = true;
        if (videoObserver) videoObserver.observe(media);
      }

      const tryAutoPlayVideo = () => {
        if (media.tagName !== "VIDEO" || media.hasAttribute("data-errored")) return;
        media.defaultMuted = true;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        const p = media.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            const resumeOnGesture = () => {
              media.muted = true;
              media.play().catch(() => {});
            };
            window.addEventListener("pointerdown", resumeOnGesture, { once: true, passive: true });
            window.addEventListener("keydown", resumeOnGesture, { once: true, passive: true });
          });
        }
      };

      const syncState = () => {
        const rawSrc = (media.getAttribute("src") || "").trim();
        const sourceEl = media.tagName === "VIDEO" ? $("source[src]", media) : null;
        const hasSrc = Boolean(rawSrc || (sourceEl && (sourceEl.getAttribute("src") || "").trim()));
        if (!hasSrc) {
          slot.classList.add("is-empty");
          slot.classList.remove("has-media");
          return;
        }
        slot.classList.remove("is-empty");
        if (media.tagName === "IMG") {
          if (media.complete && media.naturalWidth > 0) {
            media.removeAttribute("data-errored");
            slot.classList.add("has-media");
          }
        } else if (media.tagName === "VIDEO") {
          media.removeAttribute("data-errored");
          slot.classList.add("has-media");
          tryAutoPlayVideo();
        }
      };

      media.addEventListener("load", () => {
        media.removeAttribute("data-errored");
        slot.classList.remove("is-empty");
        slot.classList.add("has-media");
      });
      media.addEventListener("loadedmetadata", () => {
        media.removeAttribute("data-errored");
        slot.classList.remove("is-empty");
        slot.classList.add("has-media");
        tryAutoPlayVideo();
      });
      media.addEventListener("canplay", () => {
        tryAutoPlayVideo();
      });
      media.addEventListener("error", () => {
        media.setAttribute("data-errored", "1");
        slot.classList.add("is-empty");
        slot.classList.remove("has-media");
      });

      if ("MutationObserver" in window) {
        new MutationObserver(syncState).observe(media, { attributes: true, attributeFilter: ["src"] });
      }

      if (playBtn) {
        playBtn.addEventListener("click", () => {
          const rawSrc = (media.getAttribute("src") || "").trim();
          if (rawSrc && !media.hasAttribute("data-errored") && typeof media.play === "function") {
            media.play();
          } else if (hintMsg) {
            const pathHint = slot.getAttribute("data-slot-hint") || "assets/videos/video.mp4";
            hintMsg.textContent = `Add your video file path in src="${pathHint}" to auto-play.`;
          }
        });
      }

      syncState();
    });

    $$(".swatch-chip > img").forEach((img) => {
      img.addEventListener("error", () => img.setAttribute("data-errored", "1"));
      img.addEventListener("load", () => img.removeAttribute("data-errored"));
    });
  }

  function initProductFilter() {
    const btns = $$(".pfilter-btn");
    const cards = $$(".product-card");
    if (!btns.length || !cards.length) return;
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat || "all";
        btns.forEach((b) => b.classList.toggle("is-active", b === btn));
        cards.forEach((card) => {
          const cats = (card.dataset.cat || "").split(" ");
          const match = cat === "all" || cats.includes(cat);
          card.classList.toggle("is-filtered-out", !match);
        });
      });
    });
  }


  /* ======================================================================
     STICKY STACKING CARDS SCROLL ANIMATION (#collections)
     Calculates scroll-linked scale-down and depth shading as each card
     slides up and pins over the previous card (Varmora-style card stack).
     ====================================================================== */
  function initStickyStack() {
    const cards = $$(".collection-card.stack-card");
    if (!cards.length) return;

    // Wire "Explore Series ->" buttons to filter the 18-model gallery & scroll smoothly
    $$("[data-cat-jump]").forEach((link) => {
      link.addEventListener("click", (e) => {
        const cat = link.getAttribute("data-cat-jump");
        const targetBtn = $(`.pfilter-btn[data-cat="${cat}"]`);
        if (targetBtn) targetBtn.click();
      });
    });

    if (reduce) return;

    let ticking = false;
    const updateStack = () => {
      ticking = false;
      const rects = cards.map((c) => c.getBoundingClientRect());
      const stickyTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 88);

      for (let i = 0; i < cards.length; i++) {
        let overlap = 0;
        const cardHeight = Math.max(rects[i].height, 260);
        const startOverlapY = stickyTops[i] + cardHeight;

        for (let j = i + 1; j < cards.length; j++) {
          const nextTop = rects[j].top;
          const endOverlapY = stickyTops[j];
          const span = Math.max(startOverlapY - endOverlapY, 120);
          const p = clamp((startOverlapY - nextTop) / span, 0, 1);
          overlap += p;
        }

        const scale = Math.max(0.88, 1 - overlap * 0.036);
        const bright = Math.max(0.76, 1 - overlap * 0.075);
        cards[i].style.setProperty("--stack-scale", scale.toFixed(4));
        cards[i].style.setProperty("--stack-bright", bright.toFixed(3));
      }
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateStack);
      }
    }, { passive: true });
    window.addEventListener("resize", updateStack);
    updateStack();
  }


  /* ======================================================================
     3D ROTATING DOTTED PARTICLE GLOBE (#exportGlobe)
     Renders a Varmora-style 3D halftone dot-matrix world sphere with
     Fresnel rim lighting, Morbi (Gujarat) beacon, 3D great-circle export
     arcs, continuous 60fps auto-rotation, and pointer drag inertia.
     ====================================================================== */
  function initExportGlobe() {
    const canvas = $("#exportGlobe");
    const orb = $("#globeOrb");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");

    // Decode 62 lat bands x 150 lon steps halftone world continent bitmap
    const HEX_ROWS = ["00000000000000000000000000000000000000","00000000000000000000000000000000000000","00000000000000000000000000000000000000","00000000000200000000000000000000000000","00000000000600000000000000000000000000","00000000000f00000000000000000000000000","00000000000700000000000000000000000000","00000000000780000000000000000000000020","00000000000780000000000000000000000018","00000000000780000000000000000000000008","000000000007c0000000000000000000000004","000000000007f000000000000000000007c000","000000000003f80000001c000000001e1fc000","000000000003fc0000001f000000001fffe000","000000000003fe0000003f000000001fffe000","000000000003fe0000003f800000001fffe000","000000000003ff0000003f830000001fffe000","000000000003ffc000007fc30000001fffc000","000000000003ffe000007fc30000000fff8000","000000000003ffe000007fe300000003ff0000","000000000007ffe000007fe300000001ff0000","00000000000ffff00000fff300000000760000","00000000001ffff00000fff000000000020000","00000000001ffff00000fff000000000000000","00000000003ffff80000fff000000038038000","00000000003ffff00001fff0000001f81e0000","00000000003fffc00001fff8000003f8100000","00000000003fff800001fff8000007f8000000","00000000001ffe000001fffc00000c30000000","00000000001ffc000001fffe00000010000000","00000000001ff00001ffffff00000400000000","00000000007fe00003ffffff00040e03000000","000000000087000003ffffff80100e03000000","000000000180000007fffff800180f82000000","00000000070000000fffffff80380f82000000","000000001f0000000ffffff7c03c1f80000000","000000007f00000007ffffffe03e3f80000000","00000001e000000007ffffeff07f3fc0000000","00000001e000000007fffffff0fffff0000000","00000003e000000007ffffdfeffffff8000000","00000003f840000007ffffdfbffffff8000000","00000007ffe0000003ffffbdfffffffc000000","0000001fffe0000001fff003fffffffc200000","0000003ffff0000000ff000ffffffffc100000","0000007ffff00000000300fffffffffcc80000","000000fffff8000000f02dfffffffffdc40000","000000fffffc000000f87ffc7fffffffe60000","000000ffffff0000001cffe03ffffffff20000","000000ffffffe000003ffffe3ffffffff00000","000000ffffffe000003fffff9ffffffff80000","000001fffffff000000ffffffffffffffc0000","000003fffffff00000f7fffffffffffffc0000","000007ffffefe00000f1ffffffffffffff8000","00c00fffffc3c0000071fffffffffffffff800","01f07fffffc180000001fffffffffffffffe00","03ffffffffc003e00003ffffffffffffffff00","03ffffffff8007f80003ffffffffffffffff80","03fffffffe0007fe0000ffffffffffffffffc0","01fffffff0000fff80007ff07ffffffffffc00","00ffff0000001fffe0000780003ffffffe0000","0000000000003fffe00000000000ffe0000000","000000000000fffff000000000000000000000"];
    const points = [];
    const DEG = Math.PI / 180;

    for (let r = 0; r < HEX_ROWS.length; r++) {
      const latDeg = -60 + r * 2.2;
      const lat = latDeg * DEG;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const hex = HEX_ROWS[r];
      let bits = "";
      for (let c = 0; c < hex.length; c++) {
        bits += parseInt(hex[c], 16).toString(2).padStart(4, "0");
      }
      for (let col = 0; col < 150; col++) {
        if (bits[col] === "1") {
          const lonDeg = -180 + col * 2.4;
          const lon = lonDeg * DEG;
          points.push({ lat, lon, cosLat, sinLat });
        }
      }
    }

    // Morbi, Gujarat origin + global export destinations (lat, lon in degrees)
    const MORBI = { lat: 22.82 * DEG, lon: 70.84 * DEG, name: "MORBI · INDIA" };
    const DESTS = [
      { lat: 25.20 * DEG, lon: 55.27 * DEG },   // Dubai / Middle East
      { lat: 51.50 * DEG, lon: -0.12 * DEG },   // London / Europe
      { lat: 40.71 * DEG, lon: -74.00 * DEG },  // New York / North America
      { lat: -1.29 * DEG, lon: 36.82 * DEG },   // Nairobi / East Africa
      { lat: 1.35 * DEG, lon: 103.82 * DEG },   // Singapore / SE Asia
      { lat: -33.86 * DEG, lon: 151.20 * DEG }, // Sydney / Australia
      { lat: -23.55 * DEG, lon: -46.63 * DEG }  // Sao Paulo / South America
    ];

    // Precompute 3D unit vectors for great-circle arcs from Morbi to each destination
    const toVec = (lat, lon) => [
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon)
    ];
    const morbiVec = toVec(MORBI.lat, MORBI.lon);
    const arcs = DESTS.map((d) => {
      const endVec = toVec(d.lat, d.lon);
      const segs = [];
      const N = 28;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        let x = (1 - t) * morbiVec[0] + t * endVec[0];
        let y = (1 - t) * morbiVec[1] + t * endVec[1];
        let z = (1 - t) * morbiVec[2] + t * endVec[2];
        const len = Math.hypot(x, y, z) || 1;
        // Lift arc slightly off the sphere surface
        const lift = 1 + Math.sin(Math.PI * t) * 0.085;
        segs.push([(x / len) * lift, (y / len) * lift, (z / len) * lift]);
      }
      return { segs, destVec: endVec };
    });

    // Start centered near India / Africa / Europe / Americas sweep
    let rotY = -0.65;
    let rotX = 0.22;
    let velY = 0;
    let velX = 0;
    let dragging = false;
    let lastPX = 0;
    let lastPY = 0;
    let isVisible = true;
    let pulsePhase = 0;

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => {
        es.forEach((e) => { isVisible = e.isIntersecting; });
      }, { threshold: 0.05 }).observe(canvas);
    }

    if (orb) {
      orb.addEventListener("pointerdown", (e) => {
        dragging = true;
        lastPX = e.clientX;
        lastPY = e.clientY;
        velY = 0;
        velX = 0;
        orb.classList.add("is-dragging");
        try { orb.setPointerCapture(e.pointerId); } catch (_) {}
      });
      orb.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastPX;
        const dy = e.clientY - lastPY;
        lastPX = e.clientX;
        lastPY = e.clientY;
        velY = dx * 0.0065;
        velX = clamp(dy * 0.005, -0.04, 0.04);
        rotY += velY;
        rotX = clamp(rotX + velX, -0.65, 0.65);
      });
      const stopDrag = () => {
        dragging = false;
        orb.classList.remove("is-dragging");
      };
      orb.addEventListener("pointerup", stopDrag);
      orb.addEventListener("pointercancel", stopDrag);
    }

    // Project a 3D unit vector [vx, vy, vz] with current rotY and rotX
    const projectVec = (vx, vy, vz, cx, cy, R, cosRY, sinRY, cosRX, sinRX) => {
      const x1 = vx * cosRY + vz * sinRY;
      const z1 = -vx * sinRY + vz * cosRY;
      const y2 = vy * cosRX - z1 * sinRX;
      const z2 = vy * sinRX + z1 * cosRX;
      return {
        x: cx + x1 * R,
        y: cy - y2 * R,
        z: z2
      };
    };

    const render = () => {
      if (isVisible) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.clientWidth || 340;
        const h = canvas.clientHeight || 340;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w, h) * 0.455;

        // 1. Deep obsidian 3D sphere shading + subtle top-left specular & edge rim glow
        const coreGrad = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.28, R * 0.06, cx, cy, R);
        coreGrad.addColorStop(0, "#1c1818");
        coreGrad.addColorStop(0.55, "#080606");
        coreGrad.addColorStop(0.88, "#030202");
        coreGrad.addColorStop(1, "#1e1916");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        const cosRY = Math.cos(rotY);
        const sinRY = Math.sin(rotY);
        const cosRX = Math.cos(rotX);
        const sinRX = Math.sin(rotX);

        // 2. Render Halftone Continent Dots on Front Hemisphere (z > -0.05)
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          const dLon = pt.lon + rotY;
          const x1 = pt.cosLat * Math.sin(dLon);
          const z1 = pt.cosLat * Math.cos(dLon);
          const y2 = pt.sinLat * cosRX - z1 * sinRX;
          const z2 = pt.sinLat * sinRX + z1 * cosRX;

          if (z2 <= -0.02) continue;

          const sx = cx + x1 * R;
          const sy = cy - y2 * R;
          const depthAlpha = clamp((z2 + 0.05) / 0.92, 0.12, 1);
          const dotRadius = (0.85 + z2 * 0.95) * (w / 340);

          // Crisp silver-ivory halftone dots with subtle warm gold tint near center
          ctx.fillStyle = `rgba(242, 236, 224, ${(depthAlpha * 0.92).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Draw 3D Great-Circle Export Arcs from Morbi when visible on front hemisphere
        arcs.forEach((arc, idx) => {
          ctx.beginPath();
          let started = false;
          for (let k = 0; k < arc.segs.length; k++) {
            const [vx, vy, vz] = arc.segs[k];
            const p = projectVec(vx, vy, vz, cx, cy, R, cosRY, sinRY, cosRX, sinRX);
            if (p.z > 0.02) {
              if (!started) {
                ctx.moveTo(p.x, p.y);
                started = true;
              } else {
                ctx.lineTo(p.x, p.y);
              }
            } else {
              started = false;
            }
          }
          ctx.strokeStyle = "rgba(217, 176, 115, 0.34)";
          ctx.lineWidth = 1.25;
          ctx.stroke();

          // Animated travelling packet along each export arc
          const tIdx = Math.floor(((pulsePhase * 0.45 + idx * 0.17) % 1) * (arc.segs.length - 1));
          const [px, py, pz] = arc.segs[tIdx];
          const pp = projectVec(px, py, pz, cx, cy, R, cosRY, sinRY, cosRX, sinRX);
          if (pp.z > 0.05) {
            ctx.fillStyle = "#e9d3ac";
            ctx.beginPath();
            ctx.arc(pp.x, pp.y, 2.3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Destination pin
          const dp = projectVec(arc.destVec[0], arc.destVec[1], arc.destVec[2], cx, cy, R, cosRY, sinRY, cosRX, sinRX);
          if (dp.z > 0.05) {
            ctx.fillStyle = "rgba(217, 176, 115, 0.85)";
            ctx.beginPath();
            ctx.arc(dp.x, dp.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // 4. Highlight Morbi, Gujarat Origin Beacon
        const mp = projectVec(morbiVec[0], morbiVec[1], morbiVec[2], cx, cy, R, cosRY, sinRY, cosRX, sinRX);
        if (mp.z > 0.02) {
          const pulseR = 5 + (Math.sin(pulsePhase * 3.2) * 0.5 + 0.5) * 11;
          ctx.strokeStyle = `rgba(217, 176, 115, ${(0.75 * mp.z).toFixed(2)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(mp.x, mp.y, pulseR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#d9b073";
          ctx.beginPath();
          ctx.arc(mp.x, mp.y, 4.2, 0, Math.PI * 2);
          ctx.fill();

          if (mp.z > 0.25) {
            ctx.font = "600 10px 'Space Grotesk', sans-serif";
            ctx.fillStyle = "#e9d3ac";
            ctx.textAlign = "center";
            ctx.fillText("MORBI", mp.x, mp.y - 10);
          }
        }

        // 5. Crisp Fresnel Rim Highlight around the sphere perimeter
        const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
        rimGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        rimGrad.addColorStop(0.86, "rgba(255, 255, 255, 0.06)");
        rimGrad.addColorStop(1, "rgba(255, 255, 255, 0.38)");
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Advance rotation & inertia
        if (!dragging) {
          if (!reduce) {
            rotY -= 0.0048;
          }
          rotY += velY;
          rotX = clamp(rotX + velX, -0.65, 0.65);
          velY *= 0.94;
          velX *= 0.94;
        }
        pulsePhase += 0.025;
      }
      if (!reduce) requestAnimationFrame(render);
    };

    render();
  }

  safe(initFinish);
  safe(initMediaSlots);
  safe(initProductFilter);
  safe(initStickyStack);
  safe(initExportGlobe);
  safe(initScroll);

  if (reduce) {
    $$("svg").forEach((s) => s.pauseAnimations && s.pauseAnimations());
  } else {
    safe(setupReveals);
    safe(setupRevealCallbacks);
    safe(setupHeroArt);
    safe(initSparkles);
    safe(initTilt);
    safe(initHeroPointer);
    safe(initMagnetic);
    safe(initSpotlight);
    safe(initCursor);
    safe(initMarquee);
    onReady(() => { startReveals(); playHeroArt(); });
  }

  safe(runPreloader);
})();