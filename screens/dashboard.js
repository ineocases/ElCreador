// screens/dashboard.js
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");
const fame = n => String(Math.round(Number(n) || 0));

export function renderDashboard(el) {
    const container = el || document.getElementById("dashboardScreen");
    if (!container) return;

    const p = gameState.player;
    if (!p.partidaIniciada) {
        window.location.hash = "#createChannel";
        return container;
    }

    const hizoPretemporada = !!p.pretemporada;
    const actividad = p.actividadTrimestre;
    const sponsor = gameState.pendingSponsorOffer;
    const pendingEvent = gameState.pendingEvent;
    const collab = gameState.pendingCollabOffer;

    const progresoAño = p.trimestre === 1 ? 50 : 100;
    const mejorado = p.pretemporada?.atributo;


    const skills = [
        ["✂️ Edición", "edicion", "Mejora la retención: cada video rinde más vistas."], ["😎 Carisma", "carisma", "Convierte espectadores en suscriptores y mejora las colaboraciones."], ["🤖 Algoritmo", "algoritmo", "La plataforma te recomienda más: multiplica las vistas de todos tus videos."],
        ["📈 Marketing", "marketing", "Mejor RPM y sponsors: más plata por vista."], ["🔥 Constancia", "constancia", "Más videos automáticos por trimestre."], ["😂 Humor", "humor", "Más chance de clips y momentos virales."],
        ["💡 Creatividad", "creatividad", "Desbloquea videos especiales y mejores miniaturas."], ["🤝 Networking", "networking", "Más colaboraciones e invitaciones de otros canales."]
    ];

    container.innerHTML = `
        <div class="page-shell dashboard-page">
            ${renderHeaderHud()}

            <div class="dashboard-top dashboard-top-clean">
                <div class="channel-heading">
                    <div class="eyebrow">CARRERA · ${p.año} · T${p.trimestre}/2</div>
                    <div class="channel-title-row">
                        <h1 class="page-title">${p.canal}</h1>
                    </div>
                </div>
            </div>

            ${pendingEvent ? `<div class="callout event-callout dramatic-callout"><div class="callout-icon">⚡</div><div><b>${pendingEvent.title}</b><span>${pendingEvent.text}</span></div><a class="btn primary" href="#pasanCosas">TOMAR DECISIÓN</a></div>` : ""}
            ${collab ? `<div class="callout collab-callout dramatic-callout"><div class="callout-icon">🤝</div><div><b>${collab.creatorName} quiere colaborar con vos.</b><span>¡Te apareció una propuesta inesperada!</span></div><a class="btn primary" href="#collabs">VER INVITACIÓN</a></div>` : ""}
            ${sponsor && !collab ? `<div class="callout sponsor-callout dramatic-callout"><div class="callout-icon">💼</div><div><b>${sponsor.name} quiere trabajar con vos.</b><span>La propuesta apareció sola.</span></div><a class="btn gold" href="#sponsors">ABRIR PROPUESTA</a></div>` : ""}

            <div class="stat-grid four">
                <div class="stat-tile"><span>👥 Suscriptores</span><strong>${nf(p.suscriptores)}</strong></div>
                <div class="stat-tile"><span>👁️ Vistas</span><strong>${nf(p.vistasTotales)}</strong></div>
                <div class="stat-tile"><span>🎬 Videos</span><strong>${nf(p.videosSubidos)}</strong></div>
                <div class="stat-tile" id="moneyTile" style="cursor:pointer;position:relative;"><span>💰 Dinero</span><strong>$${nf(p.dinero)}</strong><small style="display:block;font-size:0.7em;opacity:0.7;">Click para ver detalle</small></div>
            </div>

            <section id="incomePanel" class="panel income-panel" style="display:none;"><div class="eyebrow">💰 INGRESOS</div><div class="income-grid"><div>Publicidad <b>$${nf(p.ingresosDesglose?.publicidad||0)}</b></div><div>Sponsors <b>$${nf(p.ingresosDesglose?.sponsors||0)}</b></div><div>Negocios <b>$${nf(p.ingresosDesglose?.negocios||0)}</b></div><div>Afiliados <b>$${nf(p.ingresosDesglose?.afiliados||0)}</b></div><div>Donaciones <b>$${nf(p.ingresosDesglose?.donaciones||0)}</b></div></div>${Number(p.suscriptores||0)<1000?'<p class="muted">🔒 Publicidad: se desbloquea con 1.000 suscriptores.</p>':''}</section>

            ${hizoPretemporada && !p.videoSubidoEsteTrimestre && !pendingEvent && !sponsor && !collab ? `<a href="#publish" class="btn primary big pulse publish-main-cta">📹 PUBLICAR VIDEO</a>` : ""}



            <div class="dashboard-grid">
                <section class="panel">
                    <div class="eyebrow">📈 ESTADO DEL CANAL</div>
                    <div class="skill-list">
                        ${skills.map(([label,key,tip]) => `
                            <div class="skill-row ${mejorado === key ? "skill-improved" : ""}">
                                <span title="${tip}">${label} <small>?</small></span>
                                <strong>${p.atributos?.[key] || 0}${mejorado === key ? " ▲" : ""}</strong>
                            </div>`).join("")}
                    </div>
                </section>

                <section class="panel">
                    <div class="eyebrow">🧠 REPUTACIÓN</div>
                    <div class="big-metric"><strong>${fame(p.fama)}/100</strong><span>Fama</span></div>
                    <small class="muted">Audiencia ${fame(p.famaAudiencia || 0)} · Logros ${fame(p.famaLogros || 0)}</small>
                    ${p.ultimoDesgloseFama?.texto ? `<div class="fame-breakdown">${p.ultimoDesgloseFama.texto}</div>` : ""}
                    <div class="metric-line"><span>Comunidad</span><b>${nf(p.comunidad)}/100</b></div>
                    <div class="progress"><i style="width:${Math.min(100,p.comunidad || 0)}%"></i></div>
                    <div class="metric-line"><span>Reputación</span><b>${nf(p.reputacion)}/100</b></div>
                    <div class="progress"><i style="width:${Math.min(100,p.reputacion || 0)}%"></i></div>
                </section>
            </div>

            ${actividad ? `<section class="panel activity-panel result-mini-panel"><div><div class="eyebrow">ÚLTIMO TRIMESTRE</div><h2>${nf(actividad.videos)} publicaciones</h2><p class="muted">${nf(actividad.vistas)} vistas · +${nf(actividad.suscriptores)} subs · $${nf(actividad.dinero)}</p></div><a class="btn ghost" href="#pasanCosas">CONTINUAR</a></section>` : ""}

            ${(gameState.worldNews || []).length ? `<section class="panel world-news-panel"><div class="eyebrow">🌎 MIENTRAS TANTO, EN EL MUNDO</div><div class="world-news-list">${(gameState.worldNews || []).slice(-4).reverse().map(n => `<div class="world-news-row"><span>${n.type === "viral" ? "🔥" : n.type === "drama" ? "⚠️" : "💼"}</span><p>${n.text}</p></div>`).join("")}</div></section>` : ""}

            <section class="danger-zone panel"><div><div class="eyebrow">⚙️ CARRERA</div><h3>¿Querés empezar de cero?</h3><p class="muted">Borra la partida actual y vuelve a la pantalla de creación.</p></div><button id="deleteCareer" class="btn danger-btn">🗑️ BORRAR CARRERA</button></section>
        </div>`;

    container.querySelector("#deleteCareer")?.addEventListener("click", () => {
        if (!window.confirm("¿Seguro que querés borrar esta carrera? Se perderá todo el progreso.")) return;
        gameState.resetPlayer();
    });

    // Toggle panel de ingresos al hacer click en dinero
    const moneyTile = container.querySelector("#moneyTile");
    const incomePanel = container.querySelector("#incomePanel");
    if (moneyTile && incomePanel) {
        moneyTile.addEventListener("click", () => {
            const isHidden = incomePanel.style.display === "none";
            incomePanel.style.display = isHidden ? "block" : "none";
            moneyTile.querySelector("small").textContent = isHidden ? "▲ Ocultar detalle" : "Click para ver detalle";
        });
    }

    return container;
}

export const dashboardScreen = { render: renderDashboard };
export default dashboardScreen;
