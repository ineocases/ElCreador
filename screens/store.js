import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { buyStaff, BUSINESS, buyBusiness } from "../engine/advancedSystems.js";
import items from "../data/items/items.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");

const STAFF_CONFIG = [
  ["editor", "✂️ Editor", 250],
  ["manager", "🧠 Mánager", 450],
  ["community", "📱 Community", 300],
  ["lawyer", "⚖️ Abogado", 220],
  ["trainer", "🥊 Entrenador", 260]
];

const BOOSTS = [
  ["algoritmo", "Boost algoritmo", "+15% alcance", 250],
  ["tendencia", "Impulso tendencia", "+28% alcance", 600],
  ["alcance", "Pack difusión", "+40% alcance", 1200]
];

const PATRIMONIO = [
  "Casa de tus viejos",
  "Habitación/estudio propio",
  "Departamento con estudio",
  "Casa con estudio profesional",
  "Country + estudio profesional"
];

function renderTabs(tab) {
  const tabs = [
    ["setup", "🖥️ Setup"],
    ["staff", "👥 Staff"],
    ["patrimonio", "🏠 Patrimonio"],
    ["negocios", "💼 Negocios"]
  ];

  return tabs.map(([id, label]) => {
    const activeClass = tab === id ? "primary" : "ghost";
    return `<button class="btn ${activeClass}" data-tab="${id}">${label}</button>`;
  }).join("");
}

function renderSetup(p) {
  const available = items.filter(item =>
    item.tier <= p.shopTier && !p.inventory.includes(item.id)
  );

  const boostsHtml = BOOSTS.map(([id, name, effect, price]) => `
    <button class="store-card boost-buy" data-boost="${id}">
      <b>${name}</b>
      <span>${effect}</span>
      <strong>$${nf(price)}</strong>
    </button>
  `).join("");

  const itemsHtml = available.length
    ? available.map(item => `
        <div class="store-card">
          <b>${item.icon} ${item.name}</b>
          <span>${item.slot} · edición +${item.editing || 0} · audio +${item.audio || 0}</span>
          <strong>${item.price ? `$${nf(item.price)}` : "GRATIS"}</strong>
          <button class="btn primary buy-item-btn" data-item-id="${item.id}">COMPRAR</button>
        </div>
      `).join("")
    : `<p class="muted">No hay nuevas mejoras desbloqueadas todavía.</p>`;

  return `
    <section class="panel">
      <div class="eyebrow">🚀 IMPULSOS</div>
      <div class="store-grid">${boostsHtml}</div>
    </section>
    <section class="panel">
      <div class="eyebrow">🖥️ SETUP</div>
      <div class="store-grid">${itemsHtml}</div>
    </section>
  `;
}

function renderStaff(p) {
  const staffHtml = STAFF_CONFIG.map(([id, name, cost]) => {
    const level = Number(p.staff?.[id]?.level || 0);
    const maxed = level >= 2;
    const buttonClass = maxed ? "ghost" : "primary";
    const buttonLabel = maxed ? "COMPLETO" : "MEJORAR";
    const disabled = maxed ? " disabled" : "";
    const price = maxed ? "MÁXIMO" : `$${nf(cost)}`;

    return `
      <div class="store-card">
        <b>${name}</b>
        <span>Nivel ${level}/2 · costo base $${nf(cost)} por nivel</span>
        <strong>${price}</strong>
        <button class="btn ${buttonClass} staff-buy" data-role="${id}"${disabled}>${buttonLabel}</button>
      </div>
    `;
  }).join("");

  return `
    <section class="panel">
      <div class="eyebrow">👥 STAFF · COSTO RECURRENTE</div>
      <div class="store-grid">${staffHtml}</div>
    </section>
  `;
}

function renderPatrimonio(p) {
  const currentStage = Number(p.patrimonio?.etapa || 0);

  const patrimonioHtml = PATRIMONIO.map((name, index) => {
    const owned = currentStage >= index;
    return `
      <div class="store-card ${owned ? "owned" : ""}">
        <b>${index + 1}. ${name}</b>
        <span>${owned ? "✓ Desbloqueado" : "🔒 Se desbloquea con más audiencia"}</span>
      </div>
    `;
  }).join("");

  return `
    <section class="panel">
      <div class="eyebrow">🏠 PATRIMONIO</div>
      <h2>${p.patrimonio?.nombre || "Casa de tus viejos"}</h2>
      <p class="muted">Tu patrimonio evoluciona con la audiencia.</p>
      <div class="store-grid">${patrimonioHtml}</div>
    </section>
  `;
}

function renderNegocios(p) {
  const negocios = Object.entries(BUSINESS).map(([id, business]) => {
    const owned = Boolean(p.negocios?.[id]?.owned);
    const locked = Number(p.fama || 0) < business.minFama;
    const buttonClass = owned ? "ghost" : "primary";
    const buttonLabel = owned ? "✓ COMPRADO" : locked ? "BLOQUEADO" : "COMPRAR";
    const disabled = owned || locked ? " disabled" : "";
    const requirement = locked
      ? `🔒 Requiere Fama ${business.minFama}/100`
      : `Costo $${nf(business.price)}`;

    return `
      <div class="store-card ${owned ? "owned" : ""}">
        <b>${business.name}</b>
        <span>+$${nf(business.monthly)}/mes · ${requirement}</span>
        <button class="btn ${buttonClass} business-buy" data-business="${id}"${disabled}>${buttonLabel}</button>
      </div>
    `;
  }).join("");

  return `
    <section class="panel">
      <div class="eyebrow">💼 NEGOCIOS</div>
      <p class="muted">Compras una vez y generan ingresos mensuales.</p>
      <div class="store-grid">${negocios}</div>
    </section>
  `;
}

function renderContent(tab, p) {
  switch (tab) {
    case "setup":
      return renderSetup(p);
    case "staff":
      return renderStaff(p);
    case "patrimonio":
      return renderPatrimonio(p);
    case "negocios":
      return renderNegocios(p);
    default:
      return renderSetup(p);
  }
}

function bindStoreEvents(c) {
  c.querySelectorAll("[data-tab]").forEach(button => {
    button.onclick = () => {
      sessionStorage.setItem("elcreador_store_tab", button.dataset.tab);
      renderStore(c);
    };
  });

  c.querySelectorAll(".boost-buy").forEach(button => {
    button.onclick = () => {
      if (!gameState.comprarBoost(button.dataset.boost)) {
        alert("No tenés suficiente dinero.");
      }
      renderStore(c);
    };
  });

  c.querySelectorAll(".staff-buy").forEach(button => {
    button.onclick = () => {
      if (!buyStaff(gameState, button.dataset.role)) {
        alert("No podés mejorar este puesto ahora.");
      }
      gameState.guardar();
      renderStore(c);
    };
  });

  c.querySelectorAll(".business-buy").forEach(button => {
    button.onclick = () => {
      if (!buyBusiness(gameState, button.dataset.business)) {
        alert("No podés comprar este negocio todavía.");
      }
      gameState.guardar();
      renderStore(c);
    };
  });

  c.querySelectorAll(".buy-item-btn").forEach(button => {
    button.onclick = () => {
      const item = items.find(entry => entry.id === button.dataset.itemId);
      const player = gameState.player;

      if (!item || Number(player.dinero || 0) < Number(item.price || 0)) {
        alert("No tenés suficiente dinero.");
        return;
      }

      player.dinero -= item.price;
      player.inventory.push(item.id);
      player.equipment ||= {};

      if (item.slot) player.equipment[item.slot] = item.id;
      if (item.editing) player.atributos.edicion += item.editing;
      if (item.audio) player.atributos.edicion += Math.floor(item.audio / 3);

      gameState.guardar();
      renderStore(c);
    };
  });
}

export function renderStore(el) {
  const c = el || document.getElementById("storeScreen");
  const player = gameState.player;
  if (!c || !player) return c;

  player.shopTier = Number(player.shopTier || 1);
  player.inventory ||= [];
  player.staff ||= {};

  const tab = sessionStorage.getItem("elcreador_store_tab") || "setup";

  c.innerHTML = `
    <div class="page-shell compact-page">
      ${renderHeaderHud()}
      <div class="dashboard-top">
        <div>
          <div class="eyebrow">🛒 TIENDA</div>
          <h1 class="page-title">Invertí en tu carrera</h1>
          <p class="page-subtitle">Setup, Staff y Patrimonio. Cada compra tiene impacto real.</p>
        </div>
        <a href="#dashboard" class="btn ghost">← Volver</a>
      </div>
      <div class="store-tabs">${renderTabs(tab)}</div>
      ${renderContent(tab, player)}
    </div>
  `;

  bindStoreEvents(c);
  return c;
}

export const storeScreen = { render: renderStore };
export default storeScreen;
