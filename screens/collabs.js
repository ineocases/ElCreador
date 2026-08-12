// screens/collabs.js
// Las colaboraciones aparecen solas. Esta pantalla funciona como bandeja e historial.
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";

const nf = n => Number(n || 0).toLocaleString();

function continuar() {
    setTimeout(() => {
        if (gameState.pendingSponsorOffer) {
            window.location.hash = "#sponsors";
            return;
        }
        // El resultado trimestral siempre se ve antes de pasar de trimestre/año.
        window.location.hash = "#videoResult";
    }, 160);
}

export function renderCollabs(el) {
    const container = el || document.getElementById("collabsScreen");
    if (!container) return;

    const offer = gameState.pendingCollabOffer;
    const last = gameState.lastCollab;
    const creators = (gameState.creators || [])
        .filter(c => c.activo !== false)
        .filter(c => c.id !== "player")
        .filter(c => gameState.puedeProponerCollab(c.id))
        .slice()
        .sort((a, b) => Number(b.seguidores || 0) - Number(a.seguidores || 0))
        .slice(0, 14);

    container.innerHTML = `
        <div class="page-shell compact-page">
            ${renderHeaderHud()}
            <div class="dashboard-top">
                <div>
                    <div class="eyebrow">🤝 RED DE CREADORES</div>
                    <h1 class="page-title">Colaboraciones</h1>
                    <p class="page-subtitle">Las oportunidades aparecen solas según tu tamaño, crecimiento, nicho y relaciones.</p>
                </div>
                <a href="#dashboard" class="btn ghost">← Volver</a>
            </div>

            ${offer ? `
                <section class="panel contract-card collab-offer-card">
                    <div class="eyebrow">${offer.direction === "outgoing" ? "📨 PROPUESTA ACEPTADA" : "📩 INVITACIÓN RECIBIDA"}</div>
                    <h2>${offer.direction === "outgoing" ? `🤝 Nueva colaboración con ${offer.creatorName}` : `${offer.creatorName} quiere hacer algo con vos.`}</h2>
                    <p>${offer.creatorName} tiene <b>${nf(offer.creatorFollowers)}</b> seguidores y descubrió tu contenido durante este trimestre.</p>
                    <div class="contract-stats">
                        <div><span>Vistas</span><b>+${nf(offer.reward.vistas)}</b></div>
                        <div><span>Seguidores</span><b>+${nf(offer.reward.subs)}</b></div>
                        <div><span>Nicho</span><b>${offer.niche}</b></div>
                        <div><span>Viaje</span><b>${Number(offer.costoVuelo || 0) ? `✈️ $${nf(offer.costoVuelo)}` : "🇦🇷 Sin vuelo"}</b></div>
                    </div>
                    <div class="contract-actions">
                        <button id="acceptCollab" class="btn primary" ${Number(offer.costoVuelo || 0) > Number(gameState.player.dinero || 0) ? "disabled" : ""}>${Number(offer.costoVuelo || 0) > 0 ? `PAGAR VIAJE · $${nf(offer.costoVuelo)}` : "ACEPTAR COLAB"}</button>
                        <button id="rejectCollab" class="btn ghost">RECHAZAR</button>
                    </div>
                </section>
            ` : `
                <section class="panel empty-opportunity">
                    <div class="empty-icon">🤝</div>
                    <h2>No tenés una invitación pendiente.</h2>
                    <p>No necesitás proponer nada. Seguí jugando y las colaboraciones van a surgir cuando tenga sentido.</p>
                </section>
            `}

            <section class="panel collab-propose-panel">
                <div class="eyebrow">📨 PROPONER COLABORACIÓN</div>
                <h2>Creadores disponibles</h2>
                <p class="muted">Solo aparecen personas a las que realmente podés enviarles una propuesta ahora.</p>
                <div class="collab-directory">
                    ${creators.length
                        ? creators.map(c => {
                            const rel = Number(gameState.player.relationships?.[c.id] || 0);
                            return `<div class="collab-directory-row"><div><b>${c.nombre}</b><span>${nf(c.seguidores)} subs · relación ${rel}</span></div><button class="btn primary propose-collab" data-id="${c.id}">PROPONER COLAB</button></div>`;
                        }).join("")
                        : `<div class="empty-opportunity"><div class="empty-icon">🔒</div><h3>No hay una propuesta que puedas enviar todavía.</h3><p>Seguí creciendo y construyendo relaciones. La lista se actualiza sola.</p></div>`
                    }
                </div>
            </section>

            ${last ? `
                <section class="panel">
                    <div class="eyebrow">ÚLTIMA COLABORACIÓN</div>
                    <h3>${last.estado === "aceptada" ? "🤝" : "↩️"} ${last.creatorName}</h3>
                    <p class="muted">${last.estado === "aceptada" ? `+${nf(last.subs)} seguidores · +${nf(last.vistas)} vistas` : "Decidiste no participar esta vez."}</p>
                </section>
            ` : ""}


        </div>
    `;

    container.querySelector("#acceptCollab")?.addEventListener("click", () => {
        gameState.aceptarCollab();
        continuar();
    });

    container.querySelector("#rejectCollab")?.addEventListener("click", () => {
        if (offer?.direction === "outgoing") {
            gameState.pendingCollabOffer = null;
            gameState.guardar();
        } else {
            gameState.rechazarCollab();
        }
        continuar();
    });

    container.querySelectorAll(".propose-collab").forEach(button => {
        button.addEventListener("click", () => {
            const result = gameState.proponerCollab(button.dataset.id);
            if (result === "aceptada" || result === "rechazada") window.location.hash = "#collabs";
        });
    });

    return container;
}

export const collabsScreen = { render: renderCollabs };
export default collabsScreen;
