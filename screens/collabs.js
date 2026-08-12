// Pantalla de colaboraciones: propuestas reales, con feedback inmediato.
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");

function continuar() {
    setTimeout(() => {
        if (gameState.pendingEvent) { window.location.hash = "#pasanCosas"; return; }
        if (gameState.pendingSponsorOffer) { window.location.hash = "#sponsors"; return; }
        window.location.hash = "#collabs";
    }, 120);
}

export function renderCollabs(el) {
    const container = el || document.getElementById("collabsScreen");
    if (!container) return;

    const offer = gameState.pendingCollabOffer;
    const creators = (gameState.creators || [])
        .filter(c => c.activo !== false && c.id !== "player")
        .filter(c => !Number.isFinite(Number(c.debutYear)) || Number(c.debutYear) <= Number(gameState.time.año || 2026))
        .sort((a, b) => Number(b.seguidores || 0) - Number(a.seguidores || 0));

    container.innerHTML = `
        <div class="page-shell compact-page collabs-page">
            ${renderHeaderHud()}

            <div class="dashboard-top collabs-head">
                <div>
                    <div class="eyebrow">🤝 NETWORKING</div>
                    <h1 class="page-title">Colaboraciones</h1>
                    <p class="page-subtitle">Proponé una colab. La respuesta depende del tamaño del creador, tu relación y tu trayectoria.</p>
                </div>
                <a href="#dashboard" class="btn ghost">← Volver</a>
            </div>

            ${offer ? `
                <section class="panel collab-offer-card ${offer.direction === "outgoing" ? "outgoing" : ""}">
                    <div class="collab-offer-top">
                        <div>
                            <div class="eyebrow">${offer.direction === "outgoing" ? "📨 PROPUESTA ACEPTADA" : "📩 TE LLEGÓ UNA PROPUESTA"}</div>
                            <h2>${offer.creatorName}</h2>
                            <p>${nf(offer.creatorFollowers)} seguidores · ${offer.niche || "Variedad"} · ${offer.pais || "Argentina"}</p>
                        </div>
                        <div class="collab-offer-badge">🤝 COLAB</div>
                    </div>
                    <div class="collab-offer-stats">
                        <div><small>Impacto estimado</small><strong>+${nf(offer.reward?.vistas)} vistas</strong></div>
                        <div><small>Nuevos subs.</small><strong>+${nf(offer.reward?.subs)}</strong></div>
                        <div><small>Relación</small><strong>+15</strong></div>
                    </div>
                    ${Number(offer.costoVuelo || 0) > 0 ? `<p class="collab-cost">✈️ Esta colaboración requiere viaje: <b>$${nf(offer.costoVuelo)}</b></p>` : `<p class="collab-cost">📍 No requiere gastos de viaje.</p>`}
                    <div class="contract-actions">
                        <button id="acceptCollab" class="btn primary" ${Number(offer.costoVuelo || 0) > Number(gameState.player.dinero || 0) ? "disabled" : ""}>ACEPTAR COLAB</button>
                        <button id="rejectCollab" class="btn ghost">RECHAZAR</button>
                    </div>
                </section>
            ` : ""}

            <section class="panel collab-directory">
                <div class="directory-head">
                    <div>
                        <div class="eyebrow">CREADORES DISPONIBLES</div>
                        <h2>Elegí con quién querés trabajar</h2>
                    </div>
                    <div class="directory-count">${creators.length} perfiles</div>
                </div>
                <div class="collab-search-row">
                    <input id="collabSearch" class="collab-search" type="search" placeholder="Buscar creador..." autocomplete="off">
                    <select id="collabNiche" class="collab-filter">
                        <option value="">Todos los nichos</option>
                        ${[...new Set(creators.map(c => c.nicho).filter(Boolean))].sort().map(n => `<option value="${n}">${n}</option>`).join("")}
                    </select>
                </div>
                <div class="collab-list" id="collabList">
                    ${creators.map(c => {
                        const rel = Number(gameState.player.relationships?.[c.id] || 0);
                        const ratio = Number(c.seguidores || 0) / Math.max(1, Number(gameState.player.suscriptores || 1));
                        const difficulty = ratio > 8 ? "Muy difícil" : ratio > 3 ? "Difícil" : ratio > 1 ? "Competitiva" : "Accesible";
                        return `
                            <div class="collab-simple-row" data-name="${String(c.nombre).toLowerCase()}" data-niche="${c.nicho || ""}">
                                <div class="collab-person">
                                    <div class="collab-name-line"><strong>${c.nombre}</strong><span class="collab-difficulty">${difficulty}</span></div>
                                    <span>${nf(c.seguidores)} subs · ${c.nicho || "Variedad"} · Relación ${rel >= 0 ? "+" : ""}${rel}</span>
                                </div>
                                <button class="btn collab-red propose-collab" data-id="${c.id}">PROPONER COLAB</button>
                            </div>`;
                    }).join("")}
                </div>
                <div id="collabEmpty" class="empty-opportunity" hidden>
                    <h2>No encontramos ese creador.</h2>
                    <p>Probá con otro nombre o nicho.</p>
                </div>
            </section>
        </div>
    `;

    const search = container.querySelector("#collabSearch");
    const niche = container.querySelector("#collabNiche");
    const empty = container.querySelector("#collabEmpty");
    const rows = [...container.querySelectorAll(".collab-simple-row")];

    const filterRows = () => {
        const q = (search?.value || "").trim().toLowerCase();
        const n = niche?.value || "";
        let visible = 0;
        rows.forEach(row => {
            const ok = (!q || row.dataset.name.includes(q)) && (!n || row.dataset.niche === n);
            row.hidden = !ok;
            if (ok) visible++;
        });
        if (empty) empty.hidden = visible > 0;
    };
    search?.addEventListener("input", filterRows);
    niche?.addEventListener("change", filterRows);

    container.querySelector("#acceptCollab")?.addEventListener("click", () => {
        const ok = gameState.aceptarCollab();
        if (ok) {
            continuar();
        }
    });

    container.querySelector("#rejectCollab")?.addEventListener("click", () => {
        if (gameState.rechazarCollab()) continuar();
    });

    container.querySelectorAll(".propose-collab").forEach(button => {
        button.addEventListener("click", () => {
            button.disabled = true;
            const result = gameState.proponerCollab(button.dataset.id);
            if (result === "aceptada") {
                renderCollabs(container);
                return;
            }
            if (result === "rechazada") {
                const creator = creators.find(c => c.id === button.dataset.id);
                const name = creator?.nombre || "El creador";
                const toast = document.createElement("div");
                toast.className = "collab-toast";
                toast.innerHTML = `<b>Respuesta negativa</b><span>${name} no está interesado en colaborar ahora. La relación sigue abierta.</span>`;
                container.appendChild(toast);
                setTimeout(() => toast.remove(), 3200);
                button.disabled = false;
                return;
            }
            button.disabled = false;
        });
    });

    return container;
}

export const collabsScreen = { render: renderCollabs };
export default collabsScreen;
