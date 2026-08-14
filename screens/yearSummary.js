import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");

export function renderYearSummary(el) {
    const container = el || document.getElementById("yearSummaryScreen");
    if (!container) return;
    const s = gameState.lastYearSummary;

    if (!s) {
        container.innerHTML = `<div class="page-shell">${renderHeaderHud()}<div class="panel center"><h2>Todavía no terminó el año.</h2><a class="btn primary" href="#dashboard">Volver</a></div></div>`;
        return container;
    }

    container.innerHTML = `
        <div class="page-shell year-summary-page">
            ${renderHeaderHud()}
            <div class="year-cover">
                <div class="eyebrow">CIERRE ${s.año}</div>
                <h1>Así terminó tu año.</h1>
                <p>Un vistazo rápido a los números que realmente importan.</p>
            </div>

            <div class="stat-grid four">
                <div class="stat-tile"><span>👥 Suscriptores</span><strong>${nf(s.suscriptoresFin)}</strong><small>total al cierre</small></div>
                <div class="stat-tile"><span>👁️ Vistas</span><strong>+${nf(s.vistasGanadas)}</strong><small>ganadas este año</small></div>
                <div class="stat-tile"><span>🎬 Videos</span><strong>${nf(s.videosPublicados)}</strong><small>publicados</small></div>
                <div class="stat-tile"><span>💰 Ingresos</span><strong>+$${nf(s.ingresosGenerados)}</strong><small>generados este año</small></div>
            </div>

            <div class="continue-row single-next">
                <a class="btn gold big next-button" href="#awards">🏆 VER LOS AWARDS</a>
            </div>
        </div>`;
    return container;
}

export const yearSummaryScreen = { render: renderYearSummary };
export default yearSummaryScreen;
