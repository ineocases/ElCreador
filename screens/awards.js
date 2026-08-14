// Pantalla de premios: funciona como PALMARÉS del creador.
// Los Awards anuales se resuelven al cerrar el año; este botón solo muestra
// los premios que el jugador ya ganó.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Math.round(Number(n) || 0).toLocaleString("es-AR");

function getAwards() {
    const history = Array.isArray(gameState.player?.awardsHistory) ? gameState.player.awardsHistory : [];
    return history.filter(a => a && a.nombre).map(a => ({
        año: Number(a.año) || Number(gameState.player?.año) || 2026,
        nombre: String(a.nombre),
        categoria: String(a.categoria || "Premio"),
        icono: String(a.icono || "🏆")
    }));
}

export function renderAwards(container) {
    if (!container) return null;
    const p = gameState.player || {};
    const awards = getAwards();
    const total = awards.length;
    const years = [...new Set(awards.map(a => a.año))].sort((a,b) => b-a);

    container.innerHTML = `
        <div class="page-shell awards-page trophy-cabinet-page">
            ${renderHeaderHud()}
            <section class="awards-cabinet-hero panel">
                <div class="eyebrow">🏆 PALMARÉS</div>
                <div class="cabinet-title-row">
                    <div>
                        <h1>Mis premios</h1>
                        <p>Acá quedan guardados todos los premios que ganaste durante tu carrera.</p>
                    </div>
                    <div class="trophy-count"><span>🏆</span><strong>${total}</strong><small>premio${total === 1 ? "" : "s"}</small></div>
                </div>
            </section>

            ${total === 0 ? `
                <section class="panel empty-trophy-state">
                    <div class="empty-trophy-icon">🏆</div>
                    <h2>Todavía no tenés premios</h2>
                    <p class="muted">Cuando ganes una terna, va a aparecer acá. No importa si fue hace un año: tu palmarés queda guardado.</p>
                </section>
            ` : `
                <div class="trophy-years">
                    ${years.map(año => {
                        const items = awards.filter(a => a.año === año);
                        return `
                            <section class="panel trophy-year">
                                <div class="trophy-year-head">
                                    <div><div class="eyebrow">TEMPORADA</div><h2>${año}</h2></div>
                                    <span>${items.length} premio${items.length === 1 ? "" : "s"}</span>
                                </div>
                                <div class="trophy-grid">
                                    ${items.map(a => `
                                        <article class="trophy-card">
                                            <div class="trophy-card-icon">${a.icono}</div>
                                            <div class="trophy-card-copy">
                                                <small>GANADOR</small>
                                                <strong>${a.nombre}</strong>
                                                ${a.categoria !== "Premio" ? `<span>${a.categoria}</span>` : ""}
                                            </div>
                                            <div class="trophy-card-shine">🏆</div>
                                        </article>
                                    `).join("")}
                                </div>
                            </section>
                        `;
                    }).join("")}
                </div>
            `}
            <div class="continue-row single-next awards-continue-row">
                <a class="btn primary big next-button" href="${gameState.lastYearSummary ? "#newYear" : "#dashboard"}">
                    CONTINUAR ${gameState.lastYearSummary ? "→ NUEVO AÑO" : "→ DASHBOARD"}
                </a>
            </div>
        </div>
    `;

    return container;
}

export const awardsScreen = { render: renderAwards };
export default awardsScreen;
