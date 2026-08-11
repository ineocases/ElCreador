import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { buyStaff, BUSINESS, buyBusiness } from "../engine/advancedSystems.js";
import items from "../data/items/items.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");

export function renderStore(el) {
    const c = el || document.getElementById("storeScreen");
    const p = gameState.player;
    if (!c) return;

    p.shopTier = Number(p.shopTier || 1);
    p.inventory ||= [];
    p.staff ||= {};
    p.patrimonio ||= { etapa: 0, nombre: "Casa de tus viejos" };
    p.negocios ||= {};

    const available = items.filter(i => i.tier <= p.shopTier && !p.inventory.includes(i.id));
    const staffCfg = [
        ["editor", "✂️ Editor", 250],
        ["manager", "🧠 Mánager", 450],
        ["community", "📱 Community", 300],
        ["lawyer", "⚖️ Abogado", 220],
        ["trainer", "🥊 Entrenador", 260]
    ];
    const tab = sessionStorage.getItem("elcreador_store_tab") || "setup";

    const setupHtml = `
        <section class="panel">
            <div class="eyebrow">🚀 IMPULSOS</div>
            <div class="store-grid">
                ${[
                    ["algoritmo", "Boost algoritmo", "+15% alcance", 250],
                    ["tendencia", "Impulso tendencia", "+28% alcance", 600],
                    ["alcance", "Pack difusión", "+40% alcance", 1200]
                ].map(([id, name, effect, price]) => `
                    <button class="store-card boost-buy" data-boost="${id}">
                        <b>${name}</b><span>${effect}</span><strong>$${nf(price)}</strong>
                    </button>
                `).join("")}
            </div>
        </section>
        <section class="panel">
            <div class="eyebrow">🖥️ SETUP</div>
            <div class="store-grid">
                ${available.length ? available.map(i => `
                    <div class="store-card">
                        <b>${i.icon || "🔧"} ${i.name}</b>
                        <span>${i.slot || "general"} · edición +${i.editing || 0} · audio +${i.audio || 0}</span>
                        <strong>${i.price ? "$" + nf(i.price) : "GRATIS"}</strong>
                        <button class="btn primary buy-item-btn" data-item-id="${i.id}">COMPRAR</button>
                    </div>
                `).join("") : `<p class="muted">No hay nuevas mejoras desbloqueadas todavía.</p>`}
            </div>
        </section>`;

    const staffHtml = `
        <section class="panel">
            <div class="eyebrow">👥 STAFF · COSTO RECURRENTE</div>
            <div class="store-grid">
                ${staffCfg.map(([id, name, cost]) => {
                    const level = Number(p.staff?.[id]?.level || 0);
                    const maxed = level >= 2;
                    return `
                        <div class="store-card">
                            <b>${name}</b>
                            <span>Nivel ${level}/2 · costo base $${nf(cost)} por nivel</span>
                            <strong>${maxed ? "MÁXIMO" : "$" + nf(cost)}</strong>
                            <button class="btn ${maxed ? "ghost" : "primary"} staff-buy" data-role="${id}" ${maxed ? "disabled" : ""}>
                                ${maxed ? "COMPLETO" : "MEJORAR"}
                            </button>
                        </div>`;
                }).join("")}
            </div>
        </section>`;

    const patrimonioEtapa = Number(p.patrimonio?.etapa || 0);
    const viviendas = [
        "Casa de tus viejos",
        "Habitación/estudio propio",
        "Departamento con estudio",
        "Casa con estudio profesional",
        "Country + estudio profesional"
    ];
    const patrimonioHtml = `
        <section class="panel">
            <div class="eyebrow">🏠 PATRIMONIO</div>
            <h2>${p.patrimonio?.nombre || viviendas[0]}</h2>
            <p class="muted">Tu patrimonio evoluciona con la audiencia.</p>
            <div class="store-grid">
                ${viviendas.map((name, i) => `
                    <div class="store-card ${patrimonioEtapa >= i ? "owned" : ""}">
                        <b>${i + 1}. ${name}</b>
                        <span>${patrimonioEtapa >= i ? "✓ Desbloqueado" : "🔒 Se desbloquea con más audiencia"}</span>
                    </div>
                `).join("")}
            </div>
        </section>`;

    const negociosHtml = `
        <section class="panel">
            <div class="eyebrow">💼 NEGOCIOS</div>
            <p class="muted">Comprás una vez y generan ingresos mensuales.</p>
            <div class="store-grid">
                ${Object.entries(BUSINESS).map(([id, b]) => {
                    const owned = Boolean(p.negocios?.[id]?.owned);
                    const locked = Number(p.fama || 0) < Number(b.minFama || 0);
                    let detail = owned
                        ? "✓ Comprado"
                        : locked
                            ? `🔒 Requiere Fama ${b.minFama}/100`
                            : `Costo $${nf(b.price)}`;
                    return `
                        <div class="store-card ${owned ? "owned" : ""}">
                            <b>${b.name}</b>
                            <span>+$${nf(b.monthly)}/mes · ${detail}</span>
                            <button class="btn ${owned || locked ? "ghost" : "primary"} business-buy" data-business="${id}" ${owned || locked ? "disabled" : ""}>
                                ${owned ? "✓ COMPRADO" : locked ? "BLOQUEADO" : "COMPRAR"}
                            </button>
                        </div>`;
                }).join("")}
            </div>
        </section>`;

    const content = tab === "setup" ? setupHtml
        : tab === "staff" ? staffHtml
        : tab === "patrimonio" ? patrimonioHtml
        : negociosHtml;

    c.innerHTML = `
        <div class="page-shell compact-page">
            ${renderHeaderHud()}
            <div class="dashboard-top">
                <div>
                    <div class="eyebrow">🛒 TIENDA</div>
                    <h1 class="page-title">Invertí en tu carrera</h1>
                    <p class="page-subtitle">Setup, Staff, Patrimonio y Negocios.</p>
                </div>
                <a href="#dashboard" class="btn ghost">← Volver</a>
            </div>
            <div class="store-tabs">
                <button class="btn ${tab === "setup" ? "primary" : "ghost"}" data-tab="setup">🖥️ Setup</button>
                <button class="btn ${tab === "staff" ? "primary" : "ghost"}" data-tab="staff">👥 Staff</button>
                <button class="btn ${tab === "patrimonio" ? "primary" : "ghost"}" data-tab="patrimonio">🏠 Patrimonio</button>
                <button class="btn ${tab === "negocios" ? "primary" : "ghost"}" data-tab="negocios">💼 Negocios</button>
            </div>
            ${content}
        </div>`;

    c.querySelectorAll("[data-tab]").forEach(button => {
        button.onclick = () => {
            sessionStorage.setItem("elcreador_store_tab", button.dataset.tab);
            renderStore(c);
        };
    });

    c.querySelectorAll(".boost-buy").forEach(button => {
        button.onclick = () => {
            if (!gameState.comprarBoost?.(button.dataset.boost)) alert("No tenés suficiente dinero.");
            renderStore(c);
        };
    });

    c.querySelectorAll(".staff-buy").forEach(button => {
        button.onclick = () => {
            if (!buyStaff(gameState, button.dataset.role)) alert("No podés mejorar este puesto ahora.");
            gameState.guardar();
            renderStore(c);
        };
    });

    c.querySelectorAll(".business-buy").forEach(button => {
        button.onclick = () => {
            if (!buyBusiness(gameState, button.dataset.business)) alert("No podés comprar este negocio todavía.");
            renderStore(c);
        };
    });

    c.querySelectorAll(".buy-item-btn").forEach(button => {
        button.onclick = () => {
            const item = items.find(x => x.id === button.dataset.itemId);
            if (!item || Number(p.dinero || 0) < Number(item.price || 0)) {
                alert("No tenés suficiente dinero.");
                return;
            }
            p.dinero -= Number(item.price || 0);
            p.inventory.push(item.id);
            p.equipment ||= {};
            if (item.slot) p.equipment[item.slot] = item.id;
            if (item.editing) p.atributos.edicion += Number(item.editing);
            if (item.audio) p.atributos.edicion += Math.floor(Number(item.audio) / 3);
            gameState.guardar();
            renderStore(c);
        };
    });

    return c;
}

export const storeScreen = { render: renderStore };
export default storeScreen;
