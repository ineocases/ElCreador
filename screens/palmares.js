import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");

export function renderPalmares(el) {
    const container = el || document.getElementById("palmaresScreen");
    if (!container) return;

    const p = gameState.player || {};
    const history = Array.isArray(p.awardsHistory) ? p.awardsHistory : [];
    const grouped = history.reduce((acc, item) => {
        const year = Number(item?.año || 0);
        if (!acc[year]) acc[year] = [];
        if (item?.nombre) acc[year].push(item.nombre);
        return acc;
    }, {});
    const years = Object.keys(grouped).sort((a,b) => Number(b) - Number(a));

    container.innerHTML = `
        <div class="page-shell palmares-page">
            ${renderHeaderHud()}
            <section class="new-year-hero panel">
                <div class="eyebrow">📜 HISTORIAL DE LOGROS</div>
                <h1>Mi Palmarés</h1>
                <p>Todos los premios que conseguiste a lo largo de tu carrera.</p>
            </section>

            <div class="stat-grid four">
                <div class="stat-tile"><span>🏆 Premios</span><strong>${history.length}</strong><small>estatuillas ganadas</small></div>
                <div class="stat-tile"><span>📅 Años premiados</span><strong>${years.length}</strong><small>temporadas con premios</small></div>
                <div class="stat-tile"><span>👥 Subs</span><strong>${nf(p.suscriptores)}</strong><small>actuales</small></div>
                <div class="stat-tile"><span>🔥 Fama</span><strong>${Math.round(Number(p.fama)||0)}/100</strong><small>actual</small></div>
            </div>

            <section class="panel">
                ${years.length ? years.map(year => `
                    <div class="palmares-year" style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,.08)">
                        <div class="eyebrow">🏆 ${year}</div>
                        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
                            ${grouped[year].map(name => `<span class="skill-pill"><strong>🏆 ${name}</strong></span>`).join("")}
                        </div>
                    </div>
                `).join("") : `
                    <div class="center" style="padding:28px 10px">
                        <div style="font-size:2.4rem">🏆</div>
                        <h2>Tu palmarés todavía está vacío</h2>
                        <p class="muted">Cuando ganes un Coscu Army Award, aparecerá acá.</p>
                    </div>
                `}
            </section>

            <div class="continue-row single-next">
                <a href="#dashboard" class="btn primary big next-button">← VOLVER AL DASHBOARD</a>
            </div>
        </div>`;
    return container;
}

export const palmaresScreen = { render: renderPalmares };
export default palmaresScreen;
