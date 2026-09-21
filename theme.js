(() => {
  const THEMES = {
    night: { label: "Night", icon: "◐" },
    spring: { label: "Spring", icon: "✿" },
    summer: { label: "Summer", icon: "☀" },
    autumn: { label: "Autumn", icon: "✦" },
    winter: { label: "Winter", icon: "❄" }
  };
  const root = document.documentElement;
  const stored = localStorage.getItem("azuno_theme");
  root.dataset.theme = THEMES[stored] ? stored : "night";
  const $ = (s) => document.querySelector(s);
  const menu = () => {
    const wrap = $("#themeMenu"); if (!wrap) return;
    wrap.replaceChildren();
    Object.entries(THEMES).forEach(([key, item]) => {
      const button = document.createElement("button"); button.type = "button"; button.className = `theme-option${root.dataset.theme === key ? " active" : ""}`; button.setAttribute("role", "menuitem");
      button.innerHTML = `<span class="theme-option-icon">${item.icon}</span><span>${item.label}</span>`;
      button.addEventListener("click", () => { apply(key); closeMenu(); });
      wrap.appendChild(button);
    });
  };
  const apply = (key) => { if (!THEMES[key]) return; root.dataset.theme = key; localStorage.setItem("azuno_theme", key); menu(); };
  const closeMenu = () => { const t=$("#themeTrigger"), m=$("#themeMenu"); if(!t||!m)return; t.setAttribute("aria-expanded","false"); m.setAttribute("aria-hidden","true"); m.classList.remove("open"); };
  const openMenu = () => { const t=$("#themeTrigger"),m=$("#themeMenu"); if(!t||!m)return; menu(); t.setAttribute("aria-expanded","true");m.setAttribute("aria-hidden","false");m.classList.add("open"); };
  window.AZUNO_THEME = { apply };
  document.addEventListener("DOMContentLoaded", () => {
    const t=$("#themeTrigger"),m=$("#themeMenu"); if(!t||!m)return; menu();
    t.addEventListener("click", () => m.classList.contains("open") ? closeMenu() : openMenu());
    document.addEventListener("click", e => { if (!e.target.closest(".theme-wrap")) closeMenu(); });
    document.addEventListener("keydown", e => { if(e.key === "Escape") closeMenu(); });
  });
})();