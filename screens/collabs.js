// Pantalla de colaboraciones: propuestas reales, con feedback inmediato.
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";
import { icon } from "../components/Icon.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");

function continuar() {
    setTimeout(() => {
        if (gameState.pendingEvent) { window.location.hash = "#pasanCosas"; return; }
        if (gameState.pendingSponsorOffer || gameState.pendingCampaignOffer) { window.location.hash = "#sponsors"; return; }
        window.location.hash = "#videoResult";
    }, 120);
}

function normalizarTexto(valor = "") {
    return String(valor)
        .toLocaleLowerCase("es-AR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function renderCollabs(el) {
    const container = el || document.getElementById("collabsScreen");
    if (!container) return;

    const offer = gameState.pendingCollabOffer;
    const creators = (gameState.creators || [])
        .filter(c => c.activo !== false && c.id !== "player")
        .filter(c => !Number.isFinite(Number(c.debutYear)) || Number(c.debutYear) <= Number(gameState.time.año || 2026))
        .sort((a, b) => {
            const ia = gameState.obtenerInfoCollab(a.id) || { dentroDeAlcance: false };
            const ib = gameState.obtenerInfoCollab(b.id) || { dentroDeAlcance: false };
            if (Boolean(ia.dentroDeAlcance) !== Boolean(ib.dentroDeAlcance)) {
                return ia.dentroDeAlcance ? -1 : 1;
            }
            return Number(a.seguidores || 0) - Number(b.seguidores || 0);
        });

    container.innerHTML = `
        <div class="page-shell compact-page collabs-page">
            ${renderHeaderHud()}

            <div class="dashboard-top collabs-head">
                <div>
                    <div class="eyebrow">${icon("group", 16)} NETWORKING</div>
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
                        <div class="collab-offer-badge">${icon("group", 18)} COLAB</div>
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
                        <div class="eyebrow">PRIMERO: LOS QUE PODÉS CONTACTAR</div>
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
                        const info = gameState.obtenerInfoCollab(c.id) || { dentroDeAlcance: false, motivo: "No disponible" };
                        const difficulty = !info.dentroDeAlcance ? "Fuera de alcance" : ratio > 5 ? "Ambiciosa" : ratio > 2 ? "Difícil" : ratio > 1 ? "Posible" : "Natural";
                        const disabled = !info.dentroDeAlcance;
                        return `
                            <div class="collab-simple-row ${disabled ? "collab-locked" : ""}" data-name="${String(c.nombre).toLowerCase()}" data-niche="${c.nicho || ""}">
                                <div class="collab-person">
                                    <div class="collab-name-line"><strong>${c.nombre}</strong><span class="collab-difficulty">${difficulty}</span></div>
                                    <span>${nf(c.seguidores)} subs · ${c.nicho || "Variedad"} · Relación ${rel >= 0 ? "+" : ""}${rel}</span>
                                    ${disabled ? `<small class="collab-requirement">🔒 ${info.motivo}</small>` : `<small class="collab-requirement">${info.motivo}</small>`}
                                </div>
                                <button class="btn ${disabled ? "ghost" : "collab-red"} propose-collab" data-id="${c.id}" ${disabled ? 'disabled title="Todavía no tenés el alcance para esta colaboración"' : ""}>${disabled ? "NO DISPONIBLE" : "PROPONER COLAB"}</button>
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
        const q = normalizarTexto(search?.value || "").trim();
        const n = niche?.value || "";
        let visible = 0;

        rows.forEach(row => {
            const name = normalizarTexto(row.getAttribute("data-name") || "");
            const nicheValue = row.getAttribute("data-niche") || "";
            const ok = (!q || name.includes(q)) && (!n || nicheValue === n);
            row.hidden = !ok;
            row.style.display = ok ? "" : "none";
            if (ok) visible++;
        });

        if (empty) empty.hidden = visible !== 0;
        const count = container.querySelector(".directory-count");
        if (count) count.textContent = `${visible} perfiles`;
    };

    // El buscador usa delegación y doble evento para que funcione también
    // después de que la pantalla se vuelva a renderizar.
    search?.addEventListener("input", filterRows);
    search?.addEventListener("keyup", filterRows);
    niche?.addEventListener("change", filterRows);
    filterRows();

    // Un único listener de clicks para toda la pantalla evita que los
    // botones pierdan el evento cuando el DOM se vuelve a renderizar.
    container.addEventListener("click", async (event) => {
        const acceptButton = event.target.closest("#acceptCollab");
        const rejectButton = event.target.closest("#rejectCollab");
        const proposeButton = event.target.closest(".propose-collab");

        if (acceptButton) {
            event.preventDefault();
            if (acceptButton.disabled) return;

            acceptButton.disabled = true;
            acceptButton.textContent = "PROCESANDO...";

            try {
                const ok = gameState.aceptarCollab();
                if (ok) {
                    acceptButton.textContent = "✓ COLABORACIÓN ACEPTADA";
                    continuar();
                } else {
                    acceptButton.disabled = false;
                    acceptButton.textContent = "ACEPTAR COLAB";
                    const toast = document.createElement("div");
                    toast.className = "collab-toast";
                    toast.innerHTML = "<b>No se pudo aceptar</b><span>Revisá el dinero disponible y el estado de la propuesta.</span>";
                    container.appendChild(toast);
                    setTimeout(() => toast.remove(), 3500);
                }
            } catch (error) {
                console.error("Error aceptando colaboración:", error);
                acceptButton.disabled = false;
                acceptButton.textContent = "ACEPTAR COLAB";
            }
            return;
        }

        if (rejectButton) {
            event.preventDefault();
            if (rejectButton.disabled) return;
            rejectButton.disabled = true;
            rejectButton.textContent = "PROCESANDO...";

            try {
                if (gameState.rechazarCollab()) {
                    continuar();
                } else {
                    rejectButton.disabled = false;
                    rejectButton.textContent = "RECHAZAR";
                }
            } catch (error) {
                console.error("Error rechazando colaboración:", error);
                rejectButton.disabled = false;
                rejectButton.textContent = "RECHAZAR";
            }
            return;
        }

        if (proposeButton) {
            event.preventDefault();
            if (proposeButton.disabled) return;

            const creatorId = proposeButton.dataset.id;
            proposeButton.disabled = true;
            const originalText = proposeButton.textContent;
            proposeButton.textContent = "ENVIANDO...";

            try {
                const result = gameState.proponerCollab(creatorId);

                if (result === "aceptada") {
                    // La propuesta aceptada pasa a la bandeja superior.
                    // El jugador todavía debe confirmar el viaje/colaboración.
                    renderCollabs(container);
                    const offerCard = container.querySelector(".collab-offer-card");
                    offerCard?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                }

                if (result === "fuera_de_alcance") {
                    proposeButton.disabled = false;
                    proposeButton.textContent = originalText;
                    const toast = document.createElement("div");
                    toast.className = "collab-toast";
                    toast.innerHTML = "<b>Colaboración fuera de alcance</b><span>Primero necesitás crecer, mejorar tu networking o construir una relación con ese creador.</span>";
                    container.appendChild(toast);
                    setTimeout(() => toast.remove(), 3200);
                    return;
                }

                if (result === "rechazada") {
                    const creator = creators.find(c => c.id === creatorId);
                    const name = creator?.nombre || "El creador";
                    const toast = document.createElement("div");
                    toast.className = "collab-toast";
                    toast.innerHTML = `<b>Respuesta negativa</b><span>${name} no está interesado en colaborar ahora. Podés volver a intentarlo más adelante.</span>`;
                    container.appendChild(toast);
                    setTimeout(() => toast.remove(), 3200);
                    proposeButton.disabled = false;
                    proposeButton.textContent = originalText;
                    return;
                }

                proposeButton.disabled = false;
                proposeButton.textContent = originalText;
            } catch (error) {
                console.error("Error proponiendo colaboración:", error);
                proposeButton.disabled = false;
                proposeButton.textContent = originalText;
            }
        }
    });

    return container;
}

export const collabsScreen = { render: renderCollabs };
export default collabsScreen;
