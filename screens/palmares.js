// screens/palmares.js
// 📜 PALMARÉS: historial permanente de premios ganados.
// No resuelve Awards ni modifica resultados; solo consulta awardsHistory.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

function getAwards() {
    const history = Array.isArray(gameState.player?.awardsHistory)
        ? gameState.player.awardsHistory
        : [];

    return history
        .filter(a => a && (a.nombre || a.categoria))
        .map(a => ({
            año: Number(a.año) || Number(gameState.player?.año) || 2026,
            nombre: String(a.nombre || a.categoria || "Premio"),
            categoria: String(a.categoria || a.nombre || "Premio"),
            icono: String(a.icono || "🏆")
        }));
}

export function renderPalmares(container) {
    if (!container) return null;

    const awards = getAwards();
    const years = [...new Set(awards.map(a => a.año))].sort((a, b) => b - a);

    container.innerHTML = `
        <div class="page-shell awards-page trophy-cabinet-page">
            ${renderHeaderHud()}

            <section class="awards-cabinet-hero panel">
                <div class="eyebrow">📜 PALMARÉS</div>
                <div class="cabinet-title-row">
                    <div>
                        <h1>Mis premios</h1>
                        <p>Acá quedan guardadas todas las estatuillas que ganaste durante tu carrera.</p>
                    </div>
                    <div class="trophy-count">
                        <span>🏆</span>
                        <strong>${awards.length}</strong>
                        <small>premio${awards.length === 1 ? "" : "s"}</small>
                    </div>
                </div>
            </section>

            ${awards.length === 0 ? `
                <section class="panel empty-trophy-state">
                    <div class="empty-trophy-icon">🏆</div>
                    <h2>Todavía no tenés premios</h2>
                    <p class="muted">Cuando ganes una terna en los Coscu Army Awards, aparecerá acá y quedará guardada por año.</p>
                </section>
            ` : `
                <div class="trophy-years">
                    ${years.map(año => {
                        const items = awards.filter(a => a.año === año);
                        return `
                            <section class="panel trophy-year">
                                <div class="trophy-year-head">
                                    <div>
                                        <div class="eyebrow">TEMPORADA</div>
                                        <h2>${año}</h2>
                                    </div>
                                    <span>${items.length} premio${items.length === 1 ? "" : "s"}</span>
                                </div>
                                <div class="trophy-grid">
                                    ${items.map(a => `
                                        <article class="trophy-card">
                                            <div class="trophy-card-icon">${a.icono}</div>
                                            <div class="trophy-card-copy">
                                                <small>GANADOR</small>
                                                <strong>${a.nombre}</strong>
                                                ${a.categoria !== a.nombre ? `<span>${a.categoria}</span>` : ""}
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

            <div class="continue-row single-next">
                <a href="#dashboard" class="btn primary big">← VOLVER AL DASHBOARD</a>
                <a href="#awards" class="btn ghost big">🏆 COSCU ARMY AWARDS</a>
            </div>
        </div>
    `;

    return container;
}

export const palmaresScreen = { render: renderPalmares };
export default palmaresScreen;
