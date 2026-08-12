import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");
const money = n => `$${nf(n)}`;

function renderHistory(history) {
    if (!history.length) return `<p class="muted">Todavía no cerraste acuerdos con marcas.</p>`;
    return `<div class="mini-list">${history.map(s => {
        const active = s.estado === "activo";
        const completed = s.estado === "completado";
        const campaign = s.type === "cpm";
        const label = active ? "Activo" : completed ? "Completado" : s.estado === "aceptado" ? "Firmado" : "Rechazado";
        const detail = campaign
            ? `${nf(s.vistasAcumuladas || 0)} vistas · ${money(s.pagoAcumulado || 0)}`
            : s.estado === "aceptado" ? money(s.pago) : "—";
        return `<div class="history-row">
            <div><b>${s.name}</b><span>${campaign ? "Campaña por vistas" : "Acuerdo fijo"} · ${label}</span></div>
            <strong>${detail}</strong>
        </div>`;
    }).join("")}</div>`;
}

export function renderSponsors(el) {
    const container = el || document.getElementById("sponsorsScreen");
    if (!container) return;

    const p = gameState.player;
    const offer = gameState.pendingSponsorOffer;
    const campaign = gameState.pendingCampaignOffer;
    const history = [
        ...(gameState.sponsors || []),
        ...(gameState.campaigns || [])
    ].sort((a,b) => Number(b.firmadoEn || b.aceptadoEn || b.fecha || b.rechazadoEn || 0) - Number(a.firmadoEn || a.aceptadoEn || a.fecha || a.rechazadoEn || 0)).slice(0, 12);
    const activeCampaigns = (gameState.campaigns || []).filter(c => c.estado === "activo");
    const rpm = gameState.calcularRPMEstimado ? gameState.calcularRPMEstimado() : Number(p.monetizacion?.rpmEstimado || 0);
    const adsUnlocked = Number(p.suscriptores || 0) >= 1000;

    container.innerHTML = `
        <div class="page-shell compact-page monetization-page">
            ${renderHeaderHud()}
            <div class="dashboard-top">
                <div>
                    <div class="eyebrow">💼 MONETIZACIÓN</div>
                    <h1 class="page-title">Acuerdos y campañas</h1>
                    <p class="page-subtitle">No todo se cobra igual: algunas marcas pagan fijo y otras pagan según el rendimiento.</p>
                </div>
                <a href="#dashboard" class="btn ghost">← Volver</a>
            </div>

            <section class="monetization-overview">
                <article class="panel"><span>📺 Publicidad</span><strong>${adsUnlocked ? "ACTIVA" : "BLOQUEADA"}</strong><small>${adsUnlocked ? `RPM estimado ${money(rpm)}` : "Se habilita con 1.000 suscriptores."}</small></article>
                <article class="panel"><span>📊 Campañas activas</span><strong>${activeCampaigns.length}</strong><small>Liquidación según vistas verificadas.</small></article>
                <article class="panel"><span>🤝 Acuerdos firmados</span><strong>${nf(p.monetizacion?.acuerdosFirmados || p.stats?.sponsors || 0)}</strong><small>Incluye acuerdos fijos y campañas.</small></article>
            </section>

            ${offer ? `<section class="panel contract-card sponsor-offer-card">
                <div class="eyebrow">📩 PROPUESTA FIJA</div>
                <h2>${offer.name}</h2>
                <p>La marca quiere contratarte por un período definido. El pago se acuerda antes de publicar.</p>
                <div class="contract-stats">
                    <div><span>Pago</span><b>${money(offer.pago)}</b></div>
                    <div><span>Duración</span><b>${offer.duration} trimestre${offer.duration === 1 ? "" : "s"}</b></div>
                    <div><span>Prestigio</span><b>+${nf(offer.prestige)}</b></div>
                </div>
                ${offer.tipo === "casino" || offer.tipo === "cripto" ? `<p class="muted">⚠️ Es una propuesta de mayor riesgo reputacional.</p>` : ""}
                <div class="contract-actions">
                    <button id="negotiateSponsor" class="btn ghost">NEGOCIAR +20%</button>
                    <button id="acceptSponsor" class="btn primary">FIRMAR ACUERDO</button>
                    <button id="rejectSponsor" class="btn ghost">RECHAZAR</button>
                </div>
            </section>` : ""}

            ${campaign ? `<section class="panel contract-card campaign-offer-card">
                <div class="eyebrow">📊 PROPUESTA POR RENDIMIENTO</div>
                <h2>${campaign.name}</h2>
                <p>Te pagan por cada 1.000 vistas verificadas de los contenidos incluidos en el acuerdo. No hay un pago garantizado: si rendís más, cobrás más.</p>
                <div class="contract-stats">
                    <div><span>Pago</span><b>${money(campaign.cpm)} / 1.000 vistas</b></div>
                    <div><span>Objetivo</span><b>${nf(campaign.targetViews)} vistas</b></div>
                    <div><span>Entregables</span><b>${nf(campaign.deliverables)} contenido${campaign.deliverables === 1 ? "" : "s"}</b></div>
                    <div><span>Tope</span><b>${money(campaign.maxPayout)}</b></div>
                    <div><span>Duración</span><b>${campaign.duration} trimestre${campaign.duration === 1 ? "" : "s"}</b></div>
                </div>
                <p class="muted">Empieza en el próximo trimestre completo. Las vistas del trimestre de firma no cuentan. El pago se calcula sobre las vistas elegibles de los contenidos patrocinados y respeta el tope del contrato.</p>
                <div class="contract-actions">
                    <button id="acceptCampaign" class="btn primary">FIRMAR CAMPAÑA</button>
                    <button id="rejectCampaign" class="btn ghost">RECHAZAR</button>
                </div>
            </section>` : ""}

            ${!offer && !campaign ? `<section class="panel empty-opportunity"><div class="empty-icon">📈</div><h2>No tenés una propuesta pendiente.</h2><p>Las marcas aparecen cuando tu audiencia, nicho y rendimiento empiezan a tener valor comercial.</p></section>` : ""}

            <section class="panel">
                <div class="eyebrow">📌 ACUERDOS ACTIVOS</div>
                <h2>Lo que estás cumpliendo ahora</h2>
                ${activeCampaigns.length ? `<div class="mini-list">${activeCampaigns.map(c => `<div class="history-row"><div><b>${c.name}</b><span>${money(c.cpm)} / 1.000 vistas verificadas · ${c.trimestresRestantes} trimestre${c.trimestresRestantes === 1 ? "" : "s"} restante${c.trimestresRestantes === 1 ? "" : "s"}</span></div><strong>${nf(c.vistasAcumuladas || 0)} vistas</strong></div>`).join("")}</div>` : `<p class="muted">No tenés campañas por rendimiento activas.</p>`}
            </section>

            <section class="panel">
                <div class="eyebrow">📋 HISTORIAL</div>
                <h2>Tus acuerdos</h2>
                ${renderHistory(history)}
            </section>
        </div>`;

    container.querySelector("#negotiateSponsor")?.addEventListener("click", () => {
        const extra = Math.round(Number(offer?.pago || 0) * 0.20);
        if (!gameState.negociarSponsor(extra)) alert("La marca rechazó la negociación.");
        renderSponsors(container);
    });
    container.querySelector("#acceptSponsor")?.addEventListener("click", () => {
        if (gameState.aceptarSponsor()) renderSponsors(container);
    });
    container.querySelector("#rejectSponsor")?.addEventListener("click", () => {
        if (gameState.rechazarSponsor()) renderSponsors(container);
    });
    container.querySelector("#acceptCampaign")?.addEventListener("click", () => {
        if (gameState.aceptarCampaign()) renderSponsors(container);
    });
    container.querySelector("#rejectCampaign")?.addEventListener("click", () => {
        if (gameState.rechazarCampaign()) renderSponsors(container);
    });

    return container;
}

export const sponsorsScreen = { render: renderSponsors };
export default sponsorsScreen;
