(() => {
  const cfg = window.AZU_CONFIG || { API_BASE: "" };
  const API = String(cfg.API_BASE || "").replace(/\/$/, "");
  const DISCORD = "@vhb7";
  const state = { cards: [], filtered: [], category: "All" };

  const $ = (s) => document.querySelector(s);

  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.__azuToast);
    window.__azuToast = setTimeout(() => el.classList.remove("show"), 2300);
  }

  function api(path, options = {}) {
    return fetch(API + path, {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
  }

  function imgSrc(value) {
    const v = String(value || "").trim();
    if (!v) return "assets/anime-ability-arena.png";
    try {
      return new URL(v, location.href).href;
    } catch {
      return "";
    }
  }

  function safeExternal(value) {
    try {
      const u = new URL(value, location.href);
      return u.protocol === "https:" ? u.href : "";
    } catch {
      return "";
    }
  }

  function accentPair(value) {
    const raw = String(value || "").trim().toLowerCase();
    const parts = raw.split(",");
    const hex = /^#[0-9a-f]{6}$/i;
    if (hex.test(parts[0] || "") && hex.test(parts[1] || "")) return [parts[0], parts[1]];
    if (hex.test(parts[0] || "")) return [parts[0], parts[0]];
    return ["#6b7cff", "#9a5eff"];
  }

  function attachTilt(root = document) {
    const cards = root.querySelectorAll?.(".tilt-card:not([data-tilt-ready])") || [];
    cards.forEach((card) => {
      card.dataset.tiltReady = "1";

      const motion = {
        rect: null,
        raf: 0,
        active: false,
        px: 0,
        py: 0,
        targetX: 0,
        targetY: 0,
        x: 0,
        y: 0,
        targetMX: 50,
        targetMY: 50,
        mx: 50,
        my: 50,
        strength: Math.max(1, Math.min(12, Number(card.dataset.tiltStrength || 5))),
      };

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      const measure = () => {
        motion.rect = card.getBoundingClientRect();
      };

      const animate = () => {
        motion.raf = 0;

        const easing = motion.active ? 0.16 : 0.11;
        motion.x += (motion.targetX - motion.x) * easing;
        motion.y += (motion.targetY - motion.y) * easing;
        motion.mx += (motion.targetMX - motion.mx) * 0.18;
        motion.my += (motion.targetMY - motion.my) * 0.18;

        const rx = -motion.y * motion.strength;
        const ry = motion.x * motion.strength;
        const lift = motion.active ? -7 : 0;
        const scale = motion.active ? 1.014 : 1;

        card.style.setProperty("--tilt-x", `${rx.toFixed(3)}deg`);
        card.style.setProperty("--tilt-y", `${ry.toFixed(3)}deg`);
        card.style.setProperty("--mx", `${motion.mx.toFixed(2)}%`);
        card.style.setProperty("--my", `${motion.my.toFixed(2)}%`);
        card.style.setProperty("--tilt-lift", `${lift}px`);
        card.style.setProperty("--tilt-scale", String(scale));

        const settled =
          Math.abs(motion.targetX - motion.x) < 0.0015 &&
          Math.abs(motion.targetY - motion.y) < 0.0015 &&
          Math.abs(motion.targetMX - motion.mx) < 0.08 &&
          Math.abs(motion.targetMY - motion.my) < 0.08 &&
          Math.abs(lift) < 0.5;

        if (!settled || motion.active) {
          motion.raf = requestAnimationFrame(animate);
        }
      };

      const requestFrame = () => {
        if (!motion.raf) motion.raf = requestAnimationFrame(animate);
      };

      const move = (event) => {
        if (!motion.rect) measure();
        if (!motion.rect || !motion.rect.width || !motion.rect.height) return;

        const px = clamp((event.clientX - motion.rect.left) / motion.rect.width, 0, 1);
        const py = clamp((event.clientY - motion.rect.top) / motion.rect.height, 0, 1);

        motion.px = px;
        motion.py = py;
        motion.targetX = px - 0.5;
        motion.targetY = py - 0.5;
        motion.targetMX = px * 100;
        motion.targetMY = py * 100;
        requestFrame();
      };

      const enter = (event) => {
        motion.active = true;
        measure();
        card.classList.add("is-tilting");
        move(event);
      };

      const leave = () => {
        motion.active = false;
        motion.targetX = 0;
        motion.targetY = 0;
        motion.targetMX = 50;
        motion.targetMY = 50;
        requestFrame();

        window.setTimeout(() => {
          if (motion.active) return;
          card.classList.remove("is-tilting");
        }, 360);
      };

      card.addEventListener("mouseenter", enter);
      card.addEventListener("mousemove", move);
      card.addEventListener("mouseleave", leave);

      measure();
    });
  }

  function renderFilters() {
    const categories = ["All", ...new Set(state.cards.map((card) => card.category).filter(Boolean))];
    const wrap = $("#filters");
    wrap.replaceChildren();

    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter${category === state.category ? " active" : ""}`;
      button.textContent = category;
      button.addEventListener("click", () => {
        state.category = category;
        renderFilters();
        renderCards();
      });
      wrap.appendChild(button);
    });
  }

  function cardElement(card) {
    const article = document.createElement("article");
    article.className = "script-card tilt-card";
    article.dataset.tiltStrength = "5";

    const [accentStart, accentEnd] = accentPair(card.accent);
    article.style.setProperty("--accent-start", accentStart);
    article.style.setProperty("--accent-end", accentEnd);

    const media = document.createElement("div");
    media.className = "card-media";

    const img = document.createElement("img");
    img.src = imgSrc(card.image);
    img.alt = String(card.title || "Script");
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      img.src = "assets/anime-ability-arena.png";
    };

    const shine = document.createElement("div");
    shine.className = "card-shine";
    media.append(img, shine);

    const content = document.createElement("div");
    content.className = "card-content";

    const line = document.createElement("div");
    line.className = "card-meta-line";

    const game = document.createElement("span");
    game.className = "card-game";
    game.textContent = String(card.game || "Game");

    const category = document.createElement("span");
    category.className = "category-pill";
    category.textContent = String(card.category || "Other");

    line.append(game, category);

    const top = document.createElement("div");
    top.className = "card-top";

    const badge = document.createElement("span");
    badge.className = `mini-badge status-${String(card.status || "Live").toLowerCase()}`;
    badge.textContent = String(card.status || "Live");

    const version = document.createElement("span");
    version.className = "version";
    version.textContent = String(card.version || "V1.0");

    top.append(badge, version);

    const title = document.createElement("h3");
    title.textContent = String(card.title || "Untitled");

    const description = document.createElement("p");
    description.textContent = String(card.description || "");

    const tags = document.createElement("div");
    tags.className = "card-tags";
    (Array.isArray(card.tags) ? card.tags : []).slice(0, 4).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = String(tag);
      tags.appendChild(chip);
    });

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const status = document.createElement("span");
    status.className = "status-label";
    const dot = document.createElement("i");
    const statusText = document.createElement("span");
    statusText.textContent = String(card.status || "Live");
    status.append(dot, statusText);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "small-button";
    button.textContent = "View";
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openModal(card);
    });

    footer.append(status, button);
    content.append(line, top, title, description, tags, footer);
    article.append(media, content);

    article.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openModal(card);
    });

    return article;
  }

  function renderCards() {
    const q = $("#searchInput").value.trim().toLowerCase();

    state.filtered = state.cards.filter((card) => {
      const categoryMatch = state.category === "All" || card.category === state.category;
      const searchMatch = !q || JSON.stringify(card).toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });

    const wrap = $("#cards");
    wrap.replaceChildren();

    state.filtered.forEach((card, index) => {
      const node = cardElement(card);
      node.style.animationDelay = `${Math.min(index * 45, 350)}ms`;
      wrap.appendChild(node);
    });

    const count = state.filtered.length;
    $("#resultCount").textContent = `${count} result${count === 1 ? "" : "s"}`;
    $("#emptyState").classList.toggle("hidden", count > 0);
    attachTilt(wrap);
  }

  function openModal(card) {
    const modal = $("#modal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    $("#modalMedia").replaceChildren();

    const img = document.createElement("img");
    img.src = imgSrc(card.image);
    img.alt = String(card.title || "Script");
    img.referrerPolicy = "no-referrer";
    $("#modalMedia").appendChild(img);

    $("#modalBadges").replaceChildren();
    [card.status, card.version].filter(Boolean).forEach((value) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = String(value);
      $("#modalBadges").appendChild(chip);
    });

    $("#modalGame").textContent = String(card.game || "Game");
    $("#modalCategory").textContent = String(card.category || "Other");
    $("#modalTitle").textContent = String(card.title || "Untitled");
    $("#modalDescription").textContent = String(card.description || "");

    $("#modalTags").replaceChildren();
    (Array.isArray(card.tags) ? card.tags : []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = String(tag);
      $("#modalTags").appendChild(chip);
    });

    const url = safeExternal(card.redirect);
    const get = $("#modalGet");
    get.href = url || "#";
    get.setAttribute("aria-disabled", url ? "false" : "true");

    $("#modalCopy").onclick = async () => {
      if (!url) return toast("No valid HTTPS link.");
      try {
        await navigator.clipboard.writeText(url);
        toast("Link copied.");
      } catch {
        toast("Clipboard blocked.");
      }
    };

    $("#modalCustomize").href = `admin.html?card=${encodeURIComponent(card.id)}`;
  }

  function closeModal() {
    const modal = $("#modal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      toast("Clipboard blocked.");
    }
  }

  function startTyping() {
    const target = $("#typingText");
    if (!target) return;

    const phrases = [
      "Fresh scripts are landing.",
      "New creator drops are here.",
      "Browse the latest script cards.",
      "Updated scripts, one clean hub.",
      "Built for script creators.",
      "New cards are ready to explore."
    ];

    let phraseIndex = Math.floor(Math.random() * phrases.length);
    let charIndex = 0;
    let deleting = false;
    let pause = 0;

    const tick = () => {
      const phrase = phrases[phraseIndex];
      if (pause > 0) {
        pause -= 1;
        setTimeout(tick, 90);
        return;
      }

      if (!deleting) {
        charIndex += 1;
        target.textContent = phrase.slice(0, charIndex);
        if (charIndex === phrase.length) {
          pause = 16;
          deleting = true;
        }
      } else {
        charIndex -= 1;
        target.textContent = phrase.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          pause = 4;
        }
      }

      setTimeout(tick, deleting ? 42 : 58);
    };

    tick();
  }

  attachTilt(document);

  async function load() {
    document.title = cfg.SITE_TITLE || "Azuno | Script Hub";
    $("#year").textContent = new Date().getFullYear();

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      let response;
      try {
        response = await api("/api/catalog", { signal: controller.signal });
      } finally {
        window.clearTimeout(timeout);
      }
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Catalog unavailable.");

      state.cards = Array.isArray(data.cards) ? data.cards : [];
      state.cards.sort((a, b) => (Number(b.featured) || 0) - (Number(a.featured) || 0));

      renderFilters();
      renderCards();

      $("#scriptCount").textContent = String(state.cards.length);
      $("#categoryCount").textContent = String(new Set(state.cards.map((card) => card.category).filter(Boolean)).size);

      const featured = state.cards[0];
      if (featured) {
        $("#featuredImage").src = imgSrc(featured.image);
        $("#featuredGame").textContent = String(featured.game || "Game");
        $("#featuredCategory").textContent = String(featured.category || "Script");
        $("#featuredTitle").textContent = String(featured.title || "Untitled");
        $("#featuredDescription").textContent = String(featured.description || "");
        $("#featuredVersion").textContent = String(featured.version || "V1.0");
        $("#featuredButton").onclick = () => openModal(featured);

        const [start, end] = accentPair(featured.accent);
        $("#featuredCard").style.setProperty("--accent-start", start);
        $("#featuredCard").style.setProperty("--accent-end", end);
      }
    } catch (error) {
      toast(error.message || "Could not load the catalog.");
    }

    attachTilt(document);
    startTyping();
  }

  $("#searchInput").addEventListener("input", renderCards);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
      event.preventDefault();
      $("#searchInput").focus();
    }
    if (event.key === "Escape") closeModal();
  });

  document.querySelectorAll("[data-close]").forEach((element) => element.addEventListener("click", closeModal));

  $("#headerCopyDiscord")?.addEventListener("click", () => copy(DISCORD, "Discord copied."));
  $("#creatorDiscordButton")?.addEventListener("click", () => copy(DISCORD, "Discord copied."));

  load();
})();
