(() => {
  const cfg = window.AZU_CONFIG || { API_BASE: "" };
  const API = String(cfg.API_BASE || "").replace(/\/$/, "");
  const state = { session: sessionStorage.getItem("azuscripts_session") || "", me: null, cards: [], gradient: "violet", users: [], devices: [], logs: [] };
  const gradients = {
    violet: ["#7d68ff", "#cf5dff"],
    cyan: ["#34d9ff", "#5376ff"],
    sunset: ["#ff6b7a", "#ff9c55"],
    rose: ["#ff4fa8", "#7c5cff"],
    toxic: ["#7bff70", "#12d7bd"],
    ice: ["#ecf6ff", "#5d8dff"],
    blueRed: ["#2d77ff", "#ff4b6e"],
  };
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "");

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.__azToast);
    window.__azToast = setTimeout(() => el.classList.remove("show"), 2400);
  }

  async function api(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) };
    if (state.session) headers.Authorization = `Bearer ${state.session}`;
    const response = await fetch(API + path, { ...options, headers, cache: "no-store" });
    let data = {};
    try { data = await response.json(); } catch {}
    if (response.status === 401) {
      state.session = "";
      sessionStorage.removeItem("azuscripts_session");
      showLogin("Session expired.");
      throw new Error("Session expired.");
    }
    return { response, data };
  }

  function showLogin(message = "") {
    $("#loginView").classList.remove("hidden");
    $("#consoleView").classList.add("hidden");
    $("#logoutBtn").classList.add("hidden");
    $("#sessionChip").textContent = "Signed out";
    if (message) setStatus($("#loginStatus"), message, false);
  }

  function showConsole() {
    $("#loginView").classList.add("hidden");
    $("#consoleView").classList.remove("hidden");
    $("#logoutBtn").classList.remove("hidden");
  }

  function setStatus(el, message, ok = false) {
    el.textContent = message;
    el.className = `status ${ok ? "ok" : "error"}`;
  }

  function copyText(value, message) {
    navigator.clipboard.writeText(value).then(() => toast(message)).catch(() => toast("Clipboard blocked."));
  }

  function fillGradients() {
    const wrap = $("#gradientChoices");
    wrap.replaceChildren();
    for (const [name, values] of Object.entries(gradients)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `gradient-choice${name === state.gradient ? " active" : ""}`;
      button.title = name;
      button.setAttribute("aria-label", name);
      button.style.background = `linear-gradient(135deg, ${values[0]}, ${values[1]})`;
      button.addEventListener("click", () => { state.gradient = name; fillGradients(); renderPreview(); });
      wrap.appendChild(button);
    }
  }

  function safeImage(value) {
    const v = String(value || "").trim();
    if (!v) return "assets/anime-ability-arena.png";
    try {
      if (v.startsWith("https://")) return new URL(v).href;
      if (/^\/(?!\/)/.test(v) || /^[A-Za-z0-9._-]+\//.test(v)) return new URL(v, location.href).href;
    } catch {}
    return "";
  }

  function renderPreview() {
    const [a, b] = gradients[state.gradient];
    const card = $("#previewCard");
    card.style.background = `linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.025)), linear-gradient(135deg, ${a}20, ${b}14)`;
    card.style.setProperty("--accent", $("#cardAccent").value || "#6b7cff");
    $("#previewTitle").textContent = $("#cardTitle").value || "Card title";
    $("#previewGame").textContent = ($("#cardGame").value || "Game").toUpperCase();
    $("#previewCategory").textContent = ($("#cardCategory").value || "Other").toUpperCase();
    $("#previewStatus").textContent = ($("#cardStatus").value || "Live").toUpperCase();
    $("#previewVersion").textContent = $("#cardVersion").value || "V1.0";
    $("#previewDescription").textContent = $("#cardDescription").value || "Description";
    $("#previewImage").src = safeImage($("#cardImage").value);
    $("#previewTags").replaceChildren();
    $("#cardTags").value.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 4).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = tag;
      $("#previewTags").appendChild(chip);
    });
  }

  function resetForm() {
    $("#cardForm").reset();
    $("#cardId").value = "";
    $("#cardAccent").value = "#6b7cff";
    state.gradient = "violet";
    fillGradients();
    renderPreview();
    $("#editorTitle").textContent = "New card";
    $("#deleteCardBtn").classList.add("hidden");
    $("#cardFeatured").checked = false;
    $("#formStatus").textContent = "";
  }

  function editCard(card) {
    $("#cardId").value = card.id;
    $("#cardTitle").value = card.title || "";
    $("#cardGame").value = card.game || "";
    $("#cardCategory").value = card.category || "Other";
    $("#cardVersion").value = card.version || "V1.0";
    $("#cardStatus").value = card.status || "Live";
    $("#cardDescription").value = card.description || "";
    $("#cardImage").value = card.image || "";
    $("#cardRedirect").value = card.redirect || "";
    $("#cardTags").value = Array.isArray(card.tags) ? card.tags.join(", ") : "";
    $("#cardAccent").value = /^#[0-9a-f]{6}$/i.test(card.accent || "") ? card.accent : "#6b7cff";
    $("#cardFeatured").checked = Boolean(card.featured);
    state.gradient = gradients[card.gradient] ? card.gradient : "violet";
    fillGradients();
    renderPreview();
    $("#editorTitle").textContent = `Edit ${card.title}`;
    $("#deleteCardBtn").classList.remove("hidden");
    $("#editorPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCards() {
    const query = $("#adminCardSearch").value.trim().toLowerCase();
    const cards = state.cards.filter((card) => JSON.stringify(card).toLowerCase().includes(query));
    $("#adminResultCount").textContent = String(cards.length);
    $("#metricCards").textContent = String(state.me?.role === "admin" ? state.cards.length : state.cards.filter((c) => c.ownerId === state.me?.id).length);
    const wrap = $("#adminCards");
    wrap.replaceChildren();
    cards.forEach((card) => {
      const row = document.createElement("div");
      row.className = "admin-card admin-card-v2";
      const img = document.createElement("img");
      img.src = safeImage(card.image);
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      const info = document.createElement("div");
      const owner = state.me?.role === "admin" ? ` · ${card.ownerName || card.ownerId || "—"}` : "";
      const meta = document.createElement("div");
      meta.className = "card-line-v2";
      const game = document.createElement("span"); game.textContent = card.game || "Game";
      const dot = document.createElement("span"); dot.textContent = "•";
      const category = document.createElement("span"); category.textContent = card.category || "Other";
      meta.append(game, dot, category);
      const title = document.createElement("h3"); title.textContent = card.title || "Untitled";
      const sub = document.createElement("p"); sub.textContent = `${card.version || "V1.0"}${owner}`;
      info.append(meta, title, sub);
      const actions = document.createElement("div"); actions.className = "card-actions";
      const edit = document.createElement("button"); edit.className = "tiny-btn"; edit.textContent = "Edit"; edit.addEventListener("click", () => editCard(card));
      const del = document.createElement("button"); del.className = "tiny-btn danger-btn"; del.textContent = "Delete"; del.addEventListener("click", () => deleteCard(card));
      actions.append(edit, del);
      row.append(img, info, actions);
      wrap.appendChild(row);
    });
    $("#adminEmpty").classList.toggle("hidden", cards.length > 0);
  }

  async function loadMe() {
    const { response, data } = await api("/api/me");
    if (!response.ok) throw new Error(data.error || "Could not load account.");
    state.me = data;
    $("#sessionChip").textContent = `${data.id} · ${data.role}`;
    $("#welcomeTitle").textContent = `Welcome, ${data.id}`;
    $("#roleLine").textContent = data.role;
    $("#deviceLine").textContent = `Device ${data.deviceId || "—"}`;
    $("#metricToday").textContent = data.dailyCreates < 0 ? "∞" : `${data.dailyCreatesRemaining} / ${data.dailyCreates}`;
    $("#quotaText").textContent = data.dailyCreates < 0 ? "Unlimited" : `${data.dailyCreatesRemaining} left today`;
    $("#profileUser").textContent = data.id;
    $("#profileRole").textContent = data.role;
    $("#profileDevice").textContent = data.deviceId || "—";
    if (data.role === "admin") {
      $("#adminTools").classList.remove("hidden");
      $("#featuredWrap").classList.remove("hidden");
      $("#deleteCardBtn").title = "Delete this card";
    } else {
      $("#adminTools").classList.add("hidden");
      $("#featuredWrap").classList.add("hidden");
    }
  }

  async function loadCards() {
    const { response, data } = await api("/api/me/cards");
    if (!response.ok) throw new Error(data.error || "Could not load cards.");
    state.cards = Array.isArray(data.cards) ? data.cards : [];
    renderCards();
  }

  async function loadAdminData() {
    if (state.me?.role !== "admin") return;
    const [stats, users, devices, audit, ip] = await Promise.all([
      api("/api/admin/stats"), api("/api/admin/users"), api("/api/admin/devices"), api("/api/admin/audit"), api("/api/me/ip"),
    ]);
    if (!stats.response.ok) throw new Error(stats.data.error || "Could not load stats.");
    state.users = users.data.users || [];
    state.devices = devices.data.devices || [];
    state.logs = audit.data.logs || [];
    $("#metricUsers").textContent = String(stats.data.users ?? 0);
    $("#metricDevices").textContent = String(stats.data.devices ?? 0);
    $("#userCount").textContent = String(state.users.length);
    $("#deviceCount").textContent = String(state.devices.length);
    $("#profileIp").textContent = ip.data.ip || "—";
    renderUsers();
    renderDevices();
    renderAudit();
  }

  function renderUsers() {
    const wrap = $("#usersList");
    wrap.replaceChildren();
    state.users.forEach((user) => {
      const row = document.createElement("div"); row.className = "user-row user-row-v2";
      const main = document.createElement("div"); main.className = "user-main";
      const title = document.createElement("strong"); title.textContent = user.id;
      const meta = document.createElement("span"); meta.textContent = `${user.cards} cards · ${user.devices} devices · ${user.sessions} sessions`;
      main.append(title, meta);
      const controls = document.createElement("div"); controls.className = "user-controls";
      const role = document.createElement("select");
      ["creator", "admin"].forEach((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value; role.appendChild(option); });
      role.value = user.role;
      const active = document.createElement("label"); active.className = "mini-check";
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = !Boolean(user.disabled); checkbox.disabled = user.id === state.me?.id;
      const label = document.createElement("span"); label.textContent = "Active";
      active.append(checkbox, label);
      const save = document.createElement("button"); save.className = "tiny-btn"; save.textContent = "Save"; save.addEventListener("click", () => updateUser(user.id, role.value, !checkbox.checked));
      const quota = document.createElement("button"); quota.className = "tiny-btn"; quota.textContent = "Reset quota"; quota.addEventListener("click", () => resetQuota(user.id));
      const sessions = document.createElement("button"); sessions.className = "tiny-btn"; sessions.textContent = "Revoke sessions"; sessions.addEventListener("click", () => revokeSessions(user.id));
      controls.append(role, active, save, quota, sessions);
      row.append(main, controls);
      wrap.appendChild(row);
    });
  }

  function renderDevices() {
    const wrap = $("#devicesList");
    wrap.replaceChildren();
    state.devices.forEach((device) => {
      const row = document.createElement("div"); row.className = "device-row";
      const main = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = device.userId;
      const meta = document.createElement("span"); meta.textContent = `${device.role} · ${device.revoked ? "revoked" : "active"}`;
      const details = document.createElement("small"); details.textContent = `${device.id} · HWID ${device.fingerprintHint}…${device.hwidHint}`;
      main.append(name, meta, details);
      const actions = document.createElement("div"); actions.className = "card-actions";
      const btn = document.createElement("button"); btn.className = "tiny-btn danger-btn"; btn.textContent = device.revoked ? "Revoked" : "Revoke"; btn.disabled = device.revoked || device.id === state.me?.deviceId;
      if (!btn.disabled) btn.addEventListener("click", () => revokeDevice(device.id));
      actions.appendChild(btn);
      row.append(main, actions);
      wrap.appendChild(row);
    });
  }

  function renderAudit() {
    const wrap = $("#auditList");
    wrap.replaceChildren();
    state.logs.slice(0, 60).forEach((log) => {
      const row = document.createElement("div"); row.className = "audit-row";
      const action = document.createElement("strong"); action.textContent = log.action;
      const detail = document.createElement("span"); detail.textContent = `${log.userId || "system"} · ${log.targetId || "—"}`;
      const time = document.createElement("time");
      const date = new Date(log.createdAt); time.textContent = Number.isNaN(date.valueOf()) ? log.createdAt : date.toLocaleString();
      row.append(action, detail, time);
      wrap.appendChild(row);
    });
  }

  async function login(event) {
    event.preventDefault();
    setStatus($("#loginStatus"), "Signing in…", true);
    try {
      const userId = $("#loginUser").value.trim();
      const hwid = $("#loginHwid").value.trim();
      const { response, data } = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ userId, hwid }) });
      if (!response.ok) throw new Error(data.error || "Sign in failed.");
      state.session = data.token;
      sessionStorage.setItem("azuscripts_session", state.session);
      await loadMe();
      await loadCards();
      await loadAdminData();
      showConsole();
      $("#loginStatus").textContent = "";
    } catch (error) {
      setStatus($("#loginStatus"), error.message || "Sign in failed.", false);
    }
  }

  async function saveCard(event) {
    event.preventDefault();
    setStatus($("#formStatus"), "Saving…", true);
    const id = $("#cardId").value;
    const body = {
      title: $("#cardTitle").value.trim(),
      game: $("#cardGame").value.trim(),
      category: $("#cardCategory").value,
      version: $("#cardVersion").value.trim(),
      status: $("#cardStatus").value,
      description: $("#cardDescription").value.trim(),
      image: $("#cardImage").value.trim(),
      redirect: $("#cardRedirect").value.trim(),
      tags: $("#cardTags").value.split(",").map((x) => x.trim()).filter(Boolean),
      accent: $("#cardAccent").value,
      gradient: state.gradient,
      featured: Boolean($("#cardFeatured").checked),
    };
    try {
      const { response, data } = await api(id ? `/api/cards/${encodeURIComponent(id)}` : "/api/cards", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
      if (!response.ok) throw new Error(data.error || "Could not save card.");
      toast(id ? "Card updated." : "Card created.");
      resetForm();
      await loadCards();
      await loadMe();
      await loadAdminData();
    } catch (error) {
      setStatus($("#formStatus"), error.message || "Could not save card.", false);
    }
  }

  async function deleteCard(card) {
    if (!confirm(`Delete “${card.title}”?`)) return;
    try {
      const { response, data } = await api(`/api/cards/${encodeURIComponent(card.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(data.error || "Could not delete card.");
      toast("Card deleted.");
      if ($("#cardId").value === card.id) resetForm();
      await loadCards();
      await loadMe();
      await loadAdminData();
    } catch (error) { toast(error.message || "Could not delete card."); }
  }

  async function authorize(event) {
    event.preventDefault();
    setStatus($("#deviceStatus"), "Saving…", true);
    try {
      const { response, data } = await api("/api/admin/devices", {
        method: "POST",
        body: JSON.stringify({ userId: $("#deviceUser").value.trim(), role: $("#deviceRole").value, hwid: $("#deviceHwid").value.trim(), ip: $("#deviceIp").value.trim() }),
      });
      if (!response.ok) throw new Error(data.error || "Could not authorize device.");
      setStatus($("#deviceStatus"), "Device authorized.", true);
      event.target.reset();
      await Promise.all([loadMe(), loadAdminData()]);
    } catch (error) { setStatus($("#deviceStatus"), error.message || "Could not authorize device.", false); }
  }

  async function updateUser(userId, role, disabled) {
    try {
      const { response, data } = await api(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ role, disabled }) });
      if (!response.ok) throw new Error(data.error || "Could not update user.");
      toast("User updated.");
      await loadAdminData();
      await loadMe();
    } catch (error) { toast(error.message || "Could not update user."); }
  }

  async function resetQuota(userId) {
    if (!confirm(`Reset today's quota for ${userId}?`)) return;
    try {
      const { response, data } = await api(`/api/admin/users/${encodeURIComponent(userId)}/quota/reset`, { method: "POST" });
      if (!response.ok) throw new Error(data.error || "Could not reset quota.");
      toast("Quota reset.");
      await loadAdminData();
    } catch (error) { toast(error.message || "Could not reset quota."); }
  }

  async function revokeSessions(userId) {
    if (!confirm(`Revoke sessions for ${userId}?`)) return;
    try {
      const { response, data } = await api(`/api/admin/users/${encodeURIComponent(userId)}/sessions/revoke`, { method: "POST" });
      if (!response.ok) throw new Error(data.error || "Could not revoke sessions.");
      toast(`${data.changes ?? 0} session(s) revoked.`);
      await loadAdminData();
    } catch (error) { toast(error.message || "Could not revoke sessions."); }
  }

  async function revokeDevice(deviceId) {
    if (!confirm("Revoke this device?")) return;
    try {
      const { response, data } = await api(`/api/admin/devices/${encodeURIComponent(deviceId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(data.error || "Could not revoke device.");
      toast("Device revoked.");
      await loadAdminData();
    } catch (error) { toast(error.message || "Could not revoke device."); }
  }

  async function logout() {
    try { if (state.session) await api("/api/auth/logout", { method: "POST" }); } catch {}
    state.session = "";
    sessionStorage.removeItem("azuscripts_session");
    location.reload();
  }

  async function loadInitial() {
    if (!API) return showLogin("API is not configured.");
    if (!state.session) return showLogin();
    try {
      await loadMe();
      await loadCards();
      await loadAdminData();
      showConsole();
      const wanted = new URLSearchParams(location.search).get("card");
      if (wanted) {
        const card = state.cards.find((x) => x.id === wanted);
        if (card) editCard(card);
      }
    } catch (error) {
      showLogin(error.message || "Sign in required.");
    }
  }

  ["cardTitle","cardGame","cardVersion","cardDescription","cardImage","cardTags","cardCategory","cardStatus","cardAccent"].forEach((id) => $("#" + id).addEventListener("input", renderPreview));
  $("#loginForm").addEventListener("submit", login);
  $("#cardForm").addEventListener("submit", saveCard);
  $("#newCardBtn").addEventListener("click", () => { resetForm(); $("#editorPanel").scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("#cancelEdit").addEventListener("click", resetForm);
  $("#deleteCardBtn").addEventListener("click", () => { const card = state.cards.find((x) => x.id === $("#cardId").value); if (card) deleteCard(card); });
  $("#logoutBtn").addEventListener("click", logout);
  $("#refreshBtn").addEventListener("click", async () => { try { await loadMe(); await loadCards(); await loadAdminData(); toast("Refreshed."); } catch (e) { toast(e.message || "Refresh failed."); } });
  $("#adminCardSearch").addEventListener("input", renderCards);
  $("#getHwidCommand").addEventListener("click", () => copyText('powershell -NoProfile -ExecutionPolicy Bypass -File .\\get-hwid.ps1', "HWID command copied."));
  $("#copyMyHwidCommand").addEventListener("click", () => copyText('powershell -NoProfile -ExecutionPolicy Bypass -File .\\get-hwid.ps1', "HWID command copied."));
  $("#copyMyIp").addEventListener("click", async () => { try { const { response, data } = await api("/api/me/ip"); if (!response.ok) throw new Error(data.error || "Could not read IP."); $("#profileIp").textContent = data.ip || "—"; $("#deviceIp").value = data.ip || ""; copyText(data.ip || "", "IP copied."); } catch (e) { toast(e.message || "Could not read IP."); } });
  fillGradients();
  renderPreview();
  loadInitial();
})();
