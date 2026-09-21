(() => {
  const $ = s => document.querySelector(s);
  const items = [...document.querySelectorAll(".faq-item")];
  const search = $("#docsSearch");
  const year = $("#year"); if (year) year.textContent = new Date().getFullYear();
  const apply = () => { const q = (search?.value || "").trim().toLowerCase(); items.forEach(item => { item.hidden = q && !item.textContent.toLowerCase().includes(q); }); };
  search?.addEventListener("input", apply);
  document.addEventListener("keydown", e => { if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); search?.focus(); } });
})();