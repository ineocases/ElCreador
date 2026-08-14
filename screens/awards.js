// Ceremonia anual + palmarés.
// Si hay un cierre anual pendiente, primero mostramos quién ganó cada premio.
// El palmarés del jugador queda abajo como historial permanente.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Math.round(Number(n) || 0).toLocaleString("es-AR");
const pct = n => `${Math.round((Number(n) || 0) * 100)}%`;

function getHistory() {
    const history = Array.isArray(gameState.player?.awardsHistory) ? gameState.player.awardsHistory : [];
    return history.filter(a => a && (a.nombre || a.categoria)).map(a => ({
        año: Number(a.año) || Number(gameState.player?.año) || 2026,
        nombre: String(a.nombre || a.categoria || "Premio"),
        categoria: String(a.categoria || a.nombre || "Premio"),
        icono: String(a.icono || "🏆")
    }));
}

function winnerName(item) {
    return item?.ganador?.id === "player" ? (gameState.player?.canal || "Tu canal") : (item?.ganador?.nombre || "Ganador");
}

function renderAnnualCeremony(results) {
    if (!Array.isArray(results) || !results.length) return "";
    const año = Number(gameState.lastAwardsResults?.año || gameState.lastYearSummary?.año || gameState.player?.año || 2026);
    const playerWins = results.filter(r => r.jugadorGano).length;
    return `
        <section class="awards-stage panel awards-annual-stage">
            <div class="eyebrow">🏆 PREMIOS DEL AÑO ${año}</div>
            <h1>La noche de los creadores</h1>
            <p>Estos son los ganadores de la temporada. Tu canal compite con todo el mundo, no solo por tu propio palmarés.</p>
            ${playerWins ? `<div class="award-result-badge">🎉 Ganaste ${playerWins} premio${playerWins === 1 ? "" : "s"}</div>` : `<div class="award-result-badge">La próxima temporada puede ser tuya.</div>`}
        </section>
        <div class="awards-categories annual-awards-categories">
            ${results.map((r, index) => `
                <section class="panel award-terne annual-award-card ${r.jugadorGano ? "player-won" : ""}" style="--award-delay:${index * 70}ms">
                    <div class="award-terne-head">
                        <div>
                            <span class="award-category">${r.icono} ${r.nombre}</span>
                            <h2>${winnerName(r)}</h2>
                        </div>
                        <span>${r.jugadorGano ? "GANASTE" : "GANADOR"}</span>
                    </div>
                    <p class="muted">${r.descripcion}</p>
                    <div class="award-winner-panel ${r.jugadorGano ? "won" : ""}">
                        <div class="winner-icon">${r.icono}</div>
                        <div>
                            <small>GANADOR</small>
                            <strong>${winnerName(r)}</strong>
                            <span>${r.ganador?.pais || "Argentina"} · ${r.ganador?.nicho || "Variedad"} · ${nf(r.ganador?.seguidores)} seguidores</span>
                        </div>
                    </div>
                    <div class="award-nominee-grid">
                        ${r.nominados.map((n, i) => `
                            <div class="award-nominee-row ${n.id === "player" ? "is-player" : ""} ${n.ganador ? "is-winner" : ""}">
                                <b>#${i + 1}</b>
                                <div class="award-name">
                                    <strong>${n.id === "player" ? (gameState.player?.canal || "Tu canal") : n.nombre}</strong>
                                    <small>${n.pais} · ${nf(n.seguidores)} seguidores</small>
                                </div>
                                ${n.ganador ? `<span class="award-winner-tag">🏆 GANÓ</span>` : ""}
                            </div>
                        `).join("")}
                    </div>
                </section>
            `).join("")}
        </div>
    `;
}

function renderPalmares(history) {
    const total = history.length;
    const years = [...new Set(history.map(a => a.año))].sort((a,b) => b-a);
    return `
        <section class="awards-cabinet-hero panel">
            <div class="eyebrow">📜 TU PALMARÉS</div>
            <div class="cabinet-title-row">
                <div>
                    <h1>Mis premios</h1>
                    <p>Acá quedan guardados los premios que ganó tu canal durante toda la carrera.</p>
                </div>
                <div class="trophy-count"><span>🏆</span><strong>${total}</strong><small>premio${total === 1 ? "" : "s"}</small></div>
            </div>
        </section>
        ${total === 0 ? `
            <section class="panel empty-trophy-state">
                <div class="empty-trophy-icon">🏆</div>
                <h2>Todavía no ganaste premios</h2>
                <p class="muted">Cuando tu canal gane una categoría, aparecerá acá.</p>
            </section>
        ` : `
            <div class="trophy-years">
                ${years.map(año => {
                    const items = history.filter(a => a.año === año);
                    return `<section class="panel trophy-year">
                        <div class="trophy-year-head"><div><div class="eyebrow">TEMPORADA</div><h2>${año}</h2></div><span>${items.length} premio${items.length === 1 ? "" : "s"}</span></div>
                        <div class="trophy-grid">${items.map(a => `
                            <article class="trophy-card">
                                <div class="trophy-card-icon">${a.icono}</div>
                                <div class="trophy-card-copy"><small>GANASTE</small><strong>${a.nombre}</strong><span>${a.categoria}</span></div>
                                <div class="trophy-card-shine">🏆</div>
                            </article>
                        `).join("")}</div>
                    </section>`;
                }).join("")}
            </div>
        `}
    `;
}

export function renderAwards(container) {
    if (!container) return null;
    const history = getHistory();
    const annual = gameState.lastAwardsResults?.resultados;
    const hasAnnual = Array.isArray(annual) && annual.length > 0 && Number(gameState.lastAwardsResults?.año) === Number(gameState.lastYearSummary?.año);

    container.innerHTML = `
        <div class="page-shell awards-page trophy-cabinet-page">
            ${renderHeaderHud()}
            ${hasAnnual ? renderAnnualCeremony(annual) : `
                <section class="awards-stage panel awards-annual-stage">
                    <div class="eyebrow">🏆 PREMIOS</div>
                    <h1>Premios de la comunidad</h1>
                    <p>Acá vas a ver los ganadores de cada temporada y tu palmarés.</p>
                </section>
            `}
            ${renderPalmares(history)}
            <div class="continue-row single-next awards-continue-row">
                <a class="btn primary big next-button" href="${hasAnnual ? "#newYear" : "#dashboard"}">
                    ${hasAnnual ? "CONTINUAR → NUEVO AÑO" : "CONTINUAR → DASHBOARD"}
                </a>
            </div>
        </div>
    `;
    return container;
}

export const awardsScreen = { render: renderAwards };
export default awardsScreen;
