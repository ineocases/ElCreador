import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { buyStaff, BUSINESS, buyBusiness } from "../engine/advancedSystems.js";
import items from "../data/items/items.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");
const money = n => `$${nf(n)}`;

const STAFF = [
    ["editor", "Editor", "✂️", 250, "Mejora la calidad y consistencia de tus videos."],
    ["manager", "Mánager", "🧠", 450, "Negocia oportunidades y mejora tu networking."],
    ["community", "Community Manager", "📱", 300, "Cuida la comunidad y el rendimiento social."],
    ["lawyer", "Abogado", "⚖️", 220, "Reduce riesgos contractuales y de sponsors."],
    ["trainer", "Entrenador", "🥊", 260, "Ayuda a sostener el ritmo de trabajo."]
];

const TABS = [
    ["equipment", "🖥️", "Equipamiento"],
    ["boosts", "🚀", "Promoción"],
    ["staff", "👥", "Equipo"],
    ["home", "🏠", "Estudio"],
    ["business", "💼", "Negocios"]
];

function itemImpact(item) {
    const parts = [];
    if (item.quality) parts.push(`Calidad +${item.quality}`);
    if (item.editing) parts.push(`Edición +${item.editing}`);
    if (item.audio) parts.push(`Audio +${item.audio}`);
    const labels = { algoritmo:"Algoritmo", marketing:"Marketing", creatividad:"Creatividad", constancia:"Constancia", carisma:"Carisma", networking:"Networking", comunidad:"Comunidad", edicion:"Edición" };
    Object.entries(item.effects || {}).forEach(([key, value]) => {
        if (value) parts.push(`${labels[key] || key} +${value}`);
    });
    return parts.join(" · ") || "Mejora general";
}

function slotLabel(slot) {
    return ({
        pc: "PC",
        camera: "Cámara",
        microphone: "Micrófono",
        light: "Iluminación",
        monitor: "Monitor",
        controller: "Control",
        background: "Fondo",
        audio: "Acústica",
        general: "General"
    })[slot] || slot || "General";
}

export function renderStore(el) {
    const c = el || document.getElementById("storeScreen");
    const p = gameState.player;
    if (!c || !p) return;

    p.shopTier = Number(p.shopTier || 1);
    p.inventory ||= [];
    p.staff ||= {};
    p.patrimonio ||= { etapa: 0, nombre: "Casa de tus viejos" };
    p.negocios ||= {};
    p.equipment ||= {};

    let tab = sessionStorage.getItem("elcreador_store_tab") || "equipment";
    if (tab === "setup") tab = "equipment";

    const owned = new Set(p.inventory);
    let catalogFilter = sessionStorage.getItem("elcreador_store_catalog_filter") || "all";
    const available = items.filter(i => {
        if (catalogFilter !== "all" && String(i.slot || "general") !== catalogFilter) return false;
        return true;
    });
    const catalogSlots = ["all", ...new Set(items.map(i => String(i.slot || "general")))];
    const equippedIds = new Set(Object.values(p.equipment || {}));

    const equipmentHtml = `
        <section class="store-hero">
            <div>
                <span class="store-kicker">CENTRO DE INVERSIÓN</span>
                <h1>Tu creador necesita infraestructura.</h1>
                <p>Comprá equipo, mejorá tu producción y construí un estudio que acompañe el crecimiento del canal.</p>
            </div>
            <div class="store-wallet">
                <span>DINERO DISPONIBLE</span>
                <strong>${money(p.dinero)}</strong>
            </div>
        </section>

        <section class="store-section">
            <div class="store-section-head">
                <div>
                    <span class="eyebrow">SETUP ACTUAL</span>
                    <h2>Tu estación de trabajo</h2>
                </div>
                <span class="store-meta">${p.inventory.length} objetos adquiridos</span>
            </div>
            <div class="setup-overview">
                ${Object.entries(p.equipment || {}).length ? Object.entries(p.equipment).map(([slot, id]) => {
                    const item = items.find(x => x.id === id);
                    return item ? `<div class="setup-chip"><span>${item.icon || "🔧"}</span><div><small>${slotLabel(slot)}</small><b>${item.name}</b></div></div>` : "";
                }).join("") : `<div class="store-empty">Todavía no configuraste tu setup. Comprá tu primer equipo abajo.</div>`}
            </div>
        </section>

        <section class="store-section">
            <div class="store-section-head">
                <div>
                    <span class="eyebrow">CATÁLOGO</span>
                    <h2>Equipamiento disponible</h2>
                </div>
                <span class="store-meta">Tier ${p.shopTier}</span>
            </div>
            <div class="store-catalog-tools">
                ${catalogSlots.map(slot => `<button class="store-filter ${catalogFilter === slot ? "active" : ""}" data-catalog-filter="${slot}">${slot === "all" ? "TODO" : slotLabel(slot)}</button>`).join("")}
            </div>
            <div class="store-product-grid">
                ${available.length ? available.map(item => {
                    const locked = Number(item.tier || 0) > Number(p.shopTier || 1);
                    const isOwned = owned.has(item.id);
                    const canBuy = !locked && !isOwned && Number(p.dinero) >= Number(item.price || 0);
                    return `
                    <article class="product-card ${locked ? "locked" : ""} ${isOwned ? "owned" : ""}">
                        <div class="product-icon">${item.icon || "🔧"}</div>
                        <div class="product-main">
                            <div class="product-top"><span>${slotLabel(item.slot)}</span><span>Tier ${item.tier}</span></div>
                            <h3>${item.name}</h3>
                            <p>${itemImpact(item)}</p>
                            <div class="product-functions">
                                ${(item.effects && Object.keys(item.effects).length) ? Object.entries(item.effects).map(([k,v]) => `<span class="product-function">${k} +${v}</span>`).join("") : `<span class="product-function">Efecto en producción</span>`}
                            </div>
                            <div class="product-bottom">
                                <strong>${item.price ? money(item.price) : "GRATIS"}</strong>
                                <button class="btn ${locked || isOwned ? "ghost" : "primary"} buy-item-btn" data-item-id="${item.id}" ${locked || isOwned || !canBuy ? "disabled" : ""}>${isOwned ? "ADQUIRIDO" : locked ? `REQUIERE TIER ${item.tier}` : Number(p.dinero) < Number(item.price || 0) ? "NO ALCANZA" : "COMPRAR"}</button>
                            </div>
                        </div>
                    </article>
                `).join("") : `<div class="store-empty">No hay nuevos equipos desbloqueados. Seguí creciendo para ampliar el catálogo.</div>`}
            </div>
        </section>`;

    const activeBoost = gameState.player?.boosts?.viewBoostTurns > 0 ? Number(gameState.player.boosts.viewMultiplier || 1) : 1;
    const boostStatus = activeBoost > 1 ? `<div class="callout" style="margin-bottom:14px"><b>🚀 Boost activo</b><span>Próximo trimestre: x${activeBoost.toFixed(2)} vistas</span></div>` : "";

    const boostsHtml = `
        <section class="store-hero compact">
            <div>
                <span class="store-kicker">PROMOCIÓN</span>
                <h1>Comprá alcance cuando realmente lo necesitás.</h1>
                <p>Los impulsos duran un trimestre. No reemplazan un buen contenido: amplifican una estrategia.</p>
            </div>
            <div class="store-wallet"><span>DINERO</span><strong>${money(p.dinero)}</strong></div>
        </section>
        ${boostStatus}<section class="store-product-grid boost-grid">
            ${[
                ["algoritmo", "Boost de algoritmo", "🚀", "+15% alcance", 250, "Impulso moderado para el próximo trimestre."],
                ["tendencia", "Impulso de tendencia", "📈", "+28% alcance", 600, "Más exposición, con una inversión mayor."],
                ["alcance", "Pack de difusión", "📣", "+40% alcance", 1200, "Pensado para lanzamientos importantes."]
            ].map(([id, name, icon, effect, price, desc]) => `
                <article class="product-card promotion-card">
                    <div class="product-icon">${icon}</div>
                    <div class="product-main">
                        <div class="product-top"><span>1 TRIMESTRE</span><span>ALCANCE</span></div>
                        <h3>${name}</h3><p>${desc}</p>
                        <div class="promotion-effect">${effect}</div>
                        <div class="product-bottom"><strong>${money(price)}</strong><button class="btn primary boost-buy" data-boost="${id}" ${Number(p.dinero) < price ? "disabled" : ""}>COMPRAR</button></div>
                    </div>
                </article>`).join("")}
        </section>`;

    const staffHtml = `
        <section class="store-hero compact">
            <div><span class="store-kicker">STAFF</span><h1>No tenés que hacer todo solo.</h1><p>Contratá y mejorá profesionales. Cada nivel tiene un costo recurrente.</p></div>
            <div class="store-wallet"><span>DINERO</span><strong>${money(p.dinero)}</strong></div>
        </section>
        <section class="staff-list">
            ${STAFF.map(([id, name, icon, cost, desc]) => {
                const level = Number(p.staff?.[id]?.level || 0);
                const maxed = level >= 2;
                return `<article class="staff-card ${maxed ? "owned" : ""}">
                    <div class="staff-icon">${icon}</div>
                    <div class="staff-info"><div class="staff-title"><h3>${name}</h3><span>NIVEL ${level}/2</span></div><p>${desc}</p><small>Costo recurrente: ${money(cost)} por nivel</small></div>
                    <button class="btn ${maxed ? "ghost" : "primary"} staff-buy" data-role="${id}" ${maxed ? "disabled" : ""}>${maxed ? "COMPLETO" : "MEJORAR"}</button>
                </article>`;
            }).join("")}
        </section>`;

    const patrimonioEtapa = Number(p.patrimonio?.etapa || 0);
    const viviendas = [
        ["Casa de tus viejos", "Dormitorio compartido y setup básico.", 0],
        ["Habitación / estudio propio", "Primer espacio pensado para crear.", 1],
        ["Departamento con estudio", "Separás vivienda y producción.", 2],
        ["Casa con estudio profesional", "Un espacio diseñado alrededor del canal.", 3],
        ["Country + estudio profesional", "Infraestructura de creador consolidado.", 4]
    ];
    const homeHtml = `
        <section class="store-hero compact">
            <div><span class="store-kicker">PATRIMONIO</span><h1>${p.patrimonio?.nombre || "Casa de tus viejos"}</h1><p>Tu estudio no es decoración: representa la etapa de tu carrera.</p></div>
            <div class="home-stage">${patrimonioEtapa + 1}<small>/5</small></div>
        </section>
        <section class="home-timeline">
            ${viviendas.map(([name, desc, i]) => `<div class="home-step ${patrimonioEtapa >= i ? "active" : ""} ${patrimonioEtapa === i ? "current" : ""}">
                <div class="home-dot">${patrimonioEtapa >= i ? "✓" : i + 1}</div>
                <div><span>ETAPA ${i + 1}</span><h3>${name}</h3><p>${desc}</p></div>
                ${patrimonioEtapa === i ? `<b>ACTUAL</b>` : patrimonioEtapa > i ? `<b>DESBLOQUEADO</b>` : `<b>BLOQUEADO</b>`}
            </div>`).join("")}
        </section>`;

    const businessHtml = `
        <section class="store-hero compact">
            <div><span class="store-kicker">NEGOCIOS</span><h1>Convertí tu audiencia en patrimonio.</h1><p>Son inversiones permanentes con ingresos recurrentes.</p></div>
            <div class="store-wallet"><span>DINERO</span><strong>${money(p.dinero)}</strong></div>
        </section>
        <section class="business-grid">
            ${Object.entries(BUSINESS).map(([id, b]) => {
                const isOwned = Boolean(p.negocios?.[id]?.owned);
                const locked = Number(p.fama || 0) < Number(b.minFama || 0);
                return `<article class="business-card ${isOwned ? "owned" : ""}">
                    <div class="business-icon">💼</div>
                    <div class="business-body"><span>INVERSIÓN</span><h3>${b.name}</h3><p>${isOwned ? "Activo. Generando ingresos recurrentes." : `Requiere Fama ${b.minFama}/100.`}</p>
                    <div class="business-money"><b>${isOwned ? "+" : ""}${money(b.monthly)}<small>/mes</small></b><span>${isOwned ? "COMPRADO" : money(b.price)}</span></div></div>
                    <button class="btn ${isOwned || locked ? "ghost" : "primary"} business-buy" data-business="${id}" ${isOwned || locked ? "disabled" : ""}>${isOwned ? "✓ ACTIVO" : locked ? "BLOQUEADO" : "COMPRAR"}</button>
                </article>`;
            }).join("")}
        </section>`;

    const content = { equipment: equipmentHtml, boosts: boostsHtml, staff: staffHtml, home: homeHtml, business: businessHtml }[tab] || equipmentHtml;

    c.innerHTML = `
        <div class="page-shell store-page">
            ${renderHeaderHud()}
            <header class="store-header">
                <div><div class="eyebrow">🛒 CENTRO DEL CREADOR</div><h1>Tienda</h1><p>Invertí en las herramientas que hacen crecer tu carrera.</p></div>
                <a href="#dashboard" class="btn ghost">← Volver</a>
            </header>
            <nav class="store-nav">
                ${TABS.map(([id, icon, label]) => `<button class="store-nav-btn ${tab === id ? "active" : ""}" data-tab="${id}"><span>${icon}</span>${label}</button>`).join("")}
            </nav>
            ${content}
        </div>`;

    c.querySelectorAll("[data-tab]").forEach(btn => btn.onclick = () => {
        sessionStorage.setItem("elcreador_store_tab", btn.dataset.tab);
        renderStore(c);
    });

    c.querySelectorAll("[data-catalog-filter]").forEach(btn => btn.onclick = () => {
        sessionStorage.setItem("elcreador_store_catalog_filter", btn.dataset.catalogFilter);
        renderStore(c);
    });

    c.querySelectorAll(".buy-item-btn").forEach(btn => btn.onclick = () => {
        const item = items.find(x => x.id === btn.dataset.itemId);
        if (!item || Number(p.dinero) < Number(item.price || 0)) return;
        p.dinero -= Number(item.price || 0);
        p.inventory.push(item.id);
        p.equipment ||= {};
        if (item.slot) p.equipment[item.slot] = item.id;
        p.atributos ||= {};
        if (item.editing) p.atributos.edicion = Number(p.atributos.edicion || 0) + Number(item.editing);
        if (item.audio) p.atributos.edicion = Number(p.atributos.edicion || 0) + Math.floor(Number(item.audio) / 3);
        if (item.quality) p.atributos.edicion = Number(p.atributos.edicion || 0) + Math.max(1, Math.floor(Number(item.quality) / 8));
        Object.entries(item.effects || {}).forEach(([key, value]) => {
            if (typeof value !== "number") return;
            if (key === "comunidad") p.comunidad = Number(p.comunidad || 0) + value;
            else p.atributos[key] = Number(p.atributos[key] || 0) + value;
        });
        gameState.guardar();
        renderStore(c);
    });

    c.querySelectorAll(".boost-buy").forEach(btn => btn.onclick = () => {
        if (gameState.comprarBoost?.(btn.dataset.boost)) renderStore(c);
    });

    c.querySelectorAll(".staff-buy").forEach(btn => btn.onclick = () => {
        if (buyStaff(gameState, btn.dataset.role)) {
            gameState.guardar();
            renderStore(c);
        }
    });

    c.querySelectorAll(".business-buy").forEach(btn => btn.onclick = () => {
        if (buyBusiness(gameState, btn.dataset.business)) {
            gameState.guardar();
            renderStore(c);
        }
    });

    return c;
}

export const storeScreen = { render: renderStore };
export default storeScreen;
