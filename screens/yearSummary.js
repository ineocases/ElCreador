import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { obtenerOResolverAwards } from "./awards.js";

const nf = n => Number(n || 0).toLocaleString();

export function renderYearSummary(el) {
    const container = el || document.getElementById("yearSummaryScreen");
    if (!container) return;
    const s = gameState.lastYearSummary;
    if (!s) {
        container.innerHTML = `<div class="page-shell">${renderHeaderHud()}<div class="panel center"><h2>Todavía no terminó el año.</h2><a class="btn primary" href="#dashboard">Volver</a></div></div>`;
        return container;
    }

    const awardsResults = obtenerOResolverAwards(s);
    // El premio Revelación SÍ cuenta como victoria en el resumen del año.
    const awardsGanados = awardsResults.filter(r => r.ganador?.isPlayer);
    const ranking = s.rankingNicho || gameState.calcularRankingNicho?.() || {posicion:1,total:1,subio:0};
    const premiosTexto = awardsResults.map(r => `${r.nombre}: ${r.ganador?.nombre || "—"}`).join(" · ");

    const worldNews = Array.isArray(gameState.worldYearNews) ? gameState.worldYearNews : (gameState.worldNews || []);
    const dramas = worldNews.filter(n => n.type === "drama");
    const highlights = worldNews.filter(n => n.type !== "drama").slice(-5);

    container.innerHTML = `
        <div class="page-shell year-summary-page">
            ${renderHeaderHud()}
            <div class="year-cover">
                <div class="eyebrow">TEMPORADA ${s.año}</div>
                <h1>Así terminó tu año.</h1>
                <p>Los dos trimestres quedan unificados en un solo cierre.</p>
            </div>

            <div class="stat-grid four">
                <div class="stat-tile"><span>👥 Suscriptores</span><strong>${nf(s.suscriptoresFin)}</strong><small>total al cierre</small></div>
                <div class="stat-tile"><span>👁️ Vistas</span><strong>+${nf(s.vistasGanadas)}</strong><small>en la temporada</small></div>
                <div class="stat-tile"><span>🎬 Videos</span><strong>${nf(s.videosPublicados)}</strong><small>publicados</small></div>
                <div class="stat-tile"><span>💰 Ingresos</span><strong>+$${nf(s.ingresosGenerados)}</strong><small>generados</small></div>
            </div>

            <section class="panel season-total-panel">
                <div class="eyebrow">📊 TEMPORADA COMPLETA</div>
                <div class="season-total-grid">
                    <div><small>Seguidores al comenzar</small><b>${nf(s.suscriptoresInicio)}</b></div>
                    <div><small>Seguidores al terminar</small><b>${nf(s.suscriptoresFin)}</b></div>
                    <div><small>Vistas ganadas</small><b>${nf(s.vistasGanadas)}</b></div>
                    <div><small>Videos publicados</small><b>${nf(s.videosPublicados)}</b></div>
                    <div><small>Videos virales</small><b>${nf(s.videosVirales)}</b></div>
                    <div><small>Fama</small><b>${String(Math.round(Number(s.famaFin)||0))}/100</b></div>
                </div>
            </section>

            <section class="panel world-movers-panel">
                <div class="eyebrow">🌎 MIENTRAS TANTO, EN EL MUNDO</div>
                ${dramas.length ? `<div class="world-drama-list">${dramas.slice(-1).map(n => `<div class="world-drama-row"><span>⚠️</span><div><strong>${n.creator || "Un creador"}</strong><p>${n.text}</p></div></div>`).join("")}</div>` : `<p class="muted">No hubo una gran funa en la temporada.</p>`}
                ${highlights.length ? `<div class="world-news-list year-world-news">${highlights.map(n => `<div class="world-news-row"><span>${n.type === "viral" ? "🔥" : n.type === "collab" ? "🤝" : "💼"}</span><p>${n.text}</p></div>`).join("")}</div>` : ""}
            </section>

            <div class="panel highlight-panel">
                <div class="eyebrow">🔥 TU AÑO EN UNA FRASE</div>
                <h2>${s.crecimientoSubs >= 100000 ? "Tu canal dio un salto enorme." : s.crecimientoSubs >= 10000 ? "Tu canal empezó a hacerse notar." : "Todavía estás construyendo desde abajo."}</h2>
                <p>${s.mejorVideo > 0 ? `Tu mejor video llegó a ${nf(s.mejorVideo)} vistas.` : "Todavía no tuviste un gran pico de audiencia."}</p>
            </div>

            <section class="panel awards-summary-panel">
                <div class="eyebrow">🏆 COSCU ARMY AWARDS</div>
                <h2>${awardsGanados.length ? `Ganaste ${awardsGanados.length} premio${awardsGanados.length > 1 ? "s" : ""}.` : "Esta temporada no hubo premio para tu canal."}</h2>
                <p class="muted">${premiosTexto}</p>
            </section>

            <div class="continue-row single-next"><a class="btn gold big next-button" href="#awards">🏆 IR A LOS AWARDS</a></div>
        </div>`;
    return container;
}

export const yearSummaryScreen = { render: renderYearSummary };
export default yearSummaryScreen;
