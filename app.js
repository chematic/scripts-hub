(() => {
  const cfg = window.AZU_CONFIG || { API_BASE: "" };
  const API = String(cfg.API_BASE || "").replace(/\/$/, "");
  const state = { cards: [], filtered: [], category: "All", typingIndex: 0 };
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const text = (value) => String(value ?? "");

  const gradients = {
    violet: ["#7d68ff", "#cf5dff"], cyan: ["#34d9ff", "#5376ff"], sunset: ["#ff6b7a", "#ff9c55"],
    rose: ["#ff4fa8", "#7c5cff"], toxic: ["#7bff70", "#12d7bd"], ice: ["#ecf6ff", "#5d8dff"], blueRed: ["#2d77ff", "#ff4b6e"]
  };

  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.__azToast);
    window.__azToast = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function api(path, options = {}) {
    return fetch(API + path, {
      ...options,
      cache: "no-store",
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
    });
  }

  function safeImage(value) {
    const v = String(value || "").trim();
    if (!v) return "assets/anime-ability-arena.png";
    try {
      if (v.startsWith("https://")) return new URL(v).href;
      if (v.startsWith("/") || /^[A-Za-z0-9._-]+\//.test(v)) return new URL(v, location.href).href;
    } catch {}
    return "assets/anime-ability-arena.png";
  }

  function safeExternal(value) {
    try {
      const u = new URL(value, location.href);
      return u.protocol === "https:" ? u.href : "";
    } catch { return ""; }
  }

  function icon(name) {
    const paths = {
      arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
      copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/></svg>'
    };
    return paths[name] || "";
  }

  function attachTilt(root = document) {
    $$(".tilt-card:not([data-tilt-ready])", root).forEach((card) => {
      card.dataset.tiltReady = "1";
      let frame = 0;
      let rect = null;
      let px = 0.5;
      let py = 0.5;
      let active = false;
      const strength = Number(card.dataset.tiltStrength || 5);

      const apply = () => {
        frame = 0;
        if (!active) return;
        const rx = (0.5 - py) * strength;
        const ry = (px - 0.5) * strength;
        card.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
        card.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
        card.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(0,-5px,0) scale(1.012)`;
      };

      const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };

      card.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        active = true;
        rect = card.getBoundingClientRect();
        card.classList.add("is-hover");
        card.classList.remove("sweep-now");
        void card.offsetWidth;
        card.classList.add("sweep-now");
        card.style.transition = "transform 90ms ease-out, box-shadow 180ms ease-out";
        px = (event.clientX - rect.left) / rect.width;
        py = (event.clientY - rect.top) / rect.height;
        schedule();
      });

      card.addEventListener("pointermove", (event) => {
        if (!active || event.pointerType === "touch") return;
        rect ||= card.getBoundingClientRect();
        px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        schedule();
      });

      card.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "touch") return;
        active = false;
        card.classList.remove("is-hover");
        card.style.transition = "transform 420ms cubic-bezier(.2,.7,.2,1), box-shadow 280ms ease";
        card.style.transform = "";
        cancelAnimationFrame(frame);
        frame = 0;
        rect = null;
      });
    });
  }

  function renderFilters() {
    const categories = ["All", ...new Set(state.cards.map((c) => text(c.category).trim()).filter(Boolean))];
    const wrap = $("#filters");
    wrap.replaceChildren();
    categories.forEach((category) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `filter-chip${category === state.category ? " active" : ""}`;
      b.textContent = category;
      b.addEventListener("click", () => { state.category = category; renderFilters(); renderCards(); });
      wrap.appendChild(b);
    });
  }

  function cardElement(card, index = 0) {
    const a = document.createElement("article");
    a.className = "script-card tilt-card";
    a.dataset.tiltStrength = "4.5";
    a.style.setProperty("--delay", `${Math.min(index * 45, 360)}ms`);
    a.style.setProperty("--accent", card.accent || "#6d7cff");
    a.style.setProperty("--accent-end", card.accentEnd || gradients[card.gradient]?.[1] || "#9a5eff");

    const media = document.createElement("div"); media.className = "card-media";
    const img = document.createElement("img"); img.src = safeImage(card.image); img.alt = text(card.title); img.loading = "lazy"; img.referrerPolicy = "no-referrer";
    const overlay = document.createElement("div"); overlay.className = "card-overlay";
    const sweep = document.createElement("div"); sweep.className = "glass-sweep";
    const mediaMeta = document.createElement("div"); mediaMeta.className = "media-meta";
    const status = document.createElement("span"); status.className = `status-chip ${text(card.status || "Live").toLowerCase()}`; status.innerHTML = `<span class="status-dot"></span>${text(card.status || "Live")}`;
    const version = document.createElement("span"); version.className = "version-chip"; version.textContent = text(card.version || "V1.0");
    mediaMeta.append(status, version); media.append(img, overlay, sweep, mediaMeta);

    const content = document.createElement("div"); content.className = "card-content";
    const context = document.createElement("div"); context.className = "card-context";
    const game = document.createElement("span"); game.textContent = text(card.game || "Game");
    const dot = document.createElement("span"); dot.className = "context-dot";
    const category = document.createElement("span"); category.className = "category-chip"; category.textContent = text(card.category || "Other");
    context.append(game, dot, category);

    const titleRow = document.createElement("div"); titleRow.className = "card-title-row";
    const h = document.createElement("h3"); h.textContent = text(card.title || "Untitled");
    const versionCopy = document.createElement("span"); versionCopy.className = "desktop-version version-chip"; versionCopy.textContent = text(card.version || "V1.0");
    titleRow.append(h, versionCopy);

    const p = document.createElement("p"); p.textContent = text(card.description || "");
    const tags = document.createElement("div"); tags.className = "tag-row";
    (Array.isArray(card.tags) ? card.tags : []).slice(0, 4).forEach((tag) => { const s = document.createElement("span"); s.className = "tag-chip"; s.textContent = text(tag); tags.appendChild(s); });

    const footer = document.createElement("div"); footer.className = "card-footer";
    const updated = document.createElement("span"); updated.className = "footer-note"; updated.textContent = text(card.status || "Live");
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "card-view-btn"; btn.innerHTML = `View ${icon("arrow")}`; btn.addEventListener("click", () => openModal(card));
    footer.append(updated, btn);

    content.append(context, titleRow, p, tags, footer);
    a.append(media, content);
    return a;
  }

  function renderCards() {
    const query = $("#searchInput").value.trim().toLowerCase();
    state.filtered = state.cards.filter((card) => {
      const categoryMatch = state.category === "All" || text(card.category) === state.category;
      const queryMatch = !query || [card.title, card.game, card.description, card.category, card.version, ...(Array.isArray(card.tags) ? card.tags : [])].join(" ").toLowerCase().includes(query);
      return categoryMatch && queryMatch;
    });

    const wrap = $("#cards"); wrap.replaceChildren();
    state.filtered.forEach((card, index) => wrap.appendChild(cardElement(card, index)));
    $("#resultCount").textContent = `${state.filtered.length} result${state.filtered.length === 1 ? "" : "s"}`;
    $("#emptyState").classList.toggle("hidden", state.filtered.length > 0);
    attachTilt(wrap);
  }

  function openModal(card) {
    const modal = $("#modal");
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); document.body.classList.add("modal-open");
    const media = $("#modalMedia"); media.replaceChildren();
    const img = document.createElement("img"); img.src = safeImage(card.image); img.alt = text(card.title); media.appendChild(img);
    $("#modalGame").textContent = text(card.game || "").toUpperCase();
    $("#modalTitle").textContent = text(card.title);
    $("#modalDescription").textContent = text(card.description);
    $("#modalBadges").replaceChildren();
    [card.category, card.version].filter(Boolean).forEach((value) => { const b = document.createElement("span"); b.className = "tag-chip"; b.textContent = text(value); $("#modalBadges").appendChild(b); });
    $("#modalTags").replaceChildren();
    (Array.isArray(card.tags) ? card.tags : []).forEach((value) => { const b = document.createElement("span"); b.className = "tag-chip"; b.textContent = text(value); $("#modalTags").appendChild(b); });
    const url = safeExternal(card.redirect);
    const get = $("#modalGet"); get.href = url || "#"; get.setAttribute("aria-disabled", String(!url));
    const modalPanel = $(".modal-panel"); modalPanel.style.setProperty("--accent", card.accent || "#6d7cff"); modalPanel.style.setProperty("--accent-end", card.accentEnd || gradients[card.gradient]?.[1] || "#9a5eff");
    $("#modalCopy").onclick = async () => { if (!url) return toast("No valid HTTPS link."); await navigator.clipboard.writeText(url); toast("Link copied."); };
    $("#modalCustomize").href = `admin.html?card=${encodeURIComponent(card.id)}`;
  }

  function closeModal() { $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open"); }

  async function copy(value, message) { try { await navigator.clipboard.writeText(value); toast(message); } catch { toast("Clipboard permission was blocked."); } }

  function startTyping() {
    const el = $("#typingStatus");
    if (!el) return;
    const scripts = state.cards.length;
    const categories = new Set(state.cards.map((c) => text(c.category)).filter(Boolean)).size;
    const latest = state.cards[0]?.title || "the latest drop";
    const phrases = [
      `${scripts} script${scripts === 1 ? "" : "s"} in the hub.`,
      `${categories} categor${categories === 1 ? "y" : "ies"} to explore.`,
      `Latest drop: ${latest}.`,
      "Fresh creator drops are landing.",
      "Built for script creators.",
      "Browse. Discover. Drop."
    ];
    let phraseIndex = 0; let char = 0; let deleting = false;
    const tick = () => {
      const phrase = phrases[phraseIndex % phrases.length];
      if (!deleting) { char += 1; el.textContent = phrase.slice(0, char); if (char >= phrase.length) { deleting = true; setTimeout(tick, 1400); return; } }
      else { char -= 1; el.textContent = phrase.slice(0, Math.max(char, 0)); if (char <= 0) { deleting = false; phraseIndex += 1; setTimeout(tick, 180); return; } }
      setTimeout(tick, deleting ? 28 : 46);
    };
    el.textContent = ""; tick();
  }

  async function load() {
    $("#year").textContent = String(new Date().getFullYear());
    attachTilt(document); // featured card works even when the API is unavailable
    try {
      const r = await api("/api/catalog");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Catalog unavailable");
      state.cards = Array.isArray(j.cards) ? j.cards : [];
      state.cards.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
      renderFilters(); renderCards();
      $("#scriptCount").textContent = String(state.cards.length);
      $("#categoryCount").textContent = String(new Set(state.cards.map((c) => text(c.category)).filter(Boolean)).size);
      const featured = state.cards.find((c) => c.featured) || state.cards[0];
      if (featured) {
        $("#featuredCard").style.setProperty("--accent", featured.accent || "#6d7cff");
        $("#featuredCard").style.setProperty("--accent-end", featured.accentEnd || gradients[featured.gradient]?.[1] || "#9a5eff");
        $("#featuredImage").src = safeImage(featured.image); $("#featuredGame").textContent = text(featured.game || "").toUpperCase(); $("#featuredCategory").textContent = text(featured.category || "").toUpperCase(); $("#featuredTitle").textContent = text(featured.title || ""); $("#featuredDescription").textContent = text(featured.description || ""); $("#featuredVersion").textContent = text(featured.version || "V1.0"); $("#featuredButton").onclick = () => openModal(featured);
      }
      startTyping();
    } catch (error) {
      startTyping();
      toast(error.message || "Catalog unavailable");
    }
  }

  $("#searchInput").addEventListener("input", renderCards);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { event.preventDefault(); $("#searchInput").focus(); }
    if (event.key === "Escape") closeModal();
  });
  $$('[data-close]').forEach((el) => el.addEventListener("click", closeModal));
  $("#copyDiscord")?.addEventListener("click", () => copy("@vhb7", "@vhb7 copied."));
  $(".icon-link")?.addEventListener("contextmenu", (e) => e.stopPropagation());
  load();
})();
