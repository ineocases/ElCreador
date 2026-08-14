import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";
import { icon } from "../components/Icon.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");
const money = n => `$${nf(n)}`;

const officialDomains = {
    "King of the Kongo": "kingofthekongo.com",
    "Manaos": "manaos.com.ar",
    "Mercado Libre": "mercadolibre.com.ar",
    "Ualá": "uala.com.ar",
    "Naranja X": "naranjax.com",
    "Banco Galicia": "galicia.ar",
    "Personal": "personal.com.ar",
    "Flow": "flow.com.ar",
    "YPF": "ypf.com",
    "Quilmes": "quilmes.com.ar",
    "Topper": "topper.com.ar",
    "Mostaza": "mostazaweb.com.ar",
    "Grido": "gridohelado.com",
    "Havanna": "havanna.com.ar",
    "Cachafaz": "cachafaz.com",
    "Arcor": "arcor.com",
    "La Serenísima": "laserenisima.com.ar",
    "Guaymallén": "guaymallen.com.ar",
    "Frávega": "fravega.com",
    "Musimundo": "musimundo.com",
    "Noblex": "noblex.com.ar",
    "EXO": "exo.com.ar",
    "Banghó": "bangho.com.ar",
    "PCBOX": "pcbox.com.ar",
    "Dexter": "dexter.com.ar",
    "TyC Sports": "tycsports.com",
    "Andreani": "andreani.com",
    "Havanna Café": "havanna.com.ar",
    "Pindapoy": "pindapoy.com.ar",
    "iNeo Cases": null
};

function logoFor(brand, fallback) {
    const domain = officialDomains[brand];
    if (!domain) return fallback || "assets/sponsors/default.svg";
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function continuarDespuesDeMonetizacion() {
    setTimeout(() => {
        if (gameState.pendingEvent) { window.location.hash = "#pasanCosas"; return; }
        if (gameState.pendingCollabOffer) { window.location.hash = "#collabs"; return; }
        window.location.hash = "#videoResult";
    }, 120);
}

export function renderSponsors(el) {
    const container = el || document.getElementById("sponsorsScreen");
    if (!container) return;

    const p = gameState.player;
    const offer = gameState.pendingSponsorOffer;
    const campaign = gameState.pendingCampaignOffer;
    // Esta pantalla solo existe como bandeja de una oportunidad pendiente.
    // Si no hay oferta fija ni campaña, no debe aparecer durante el loop trimestral.
    if (!offer && !campaign) {
        continuarDespuesDeMonetizacion();
        return container;
    }

    container.innerHTML = `
        <div class="page-shell compact-page monetization-page">
            ${renderHeaderHud()}
            <div class="dashboard-top">
                <div>
                    <div class="eyebrow">💼 MONETIZACIÓN</div>
                    <h1 class="page-title">Acuerdos y campañas</h1>
                    <p class="page-subtitle">Revisá la propuesta y decidí si querés aceptarla, negociar o rechazarla.</p>
                </div>
                <a href="#dashboard" class="btn ghost">← Volver</a>
            </div>

            ${offer ? `<section class="panel contract-card sponsor-offer-card">
                <div class="eyebrow">📩 PROPUESTA FIJA</div>
                <div class="sponsor-brand"><img src="${logoFor(offer.name, offer.logo)}" onerror="this.onerror=null;this.src='${offer.logo || "assets/sponsors/default.svg"}'" alt="Logo de ${offer.name}" class="sponsor-logo"><h2>${offer.name}</h2></div>
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
                <div class="sponsor-brand"><img src="${logoFor(campaign.name, campaign.logo)}" onerror="this.onerror=null;this.src='${campaign.logo || "assets/sponsors/default.svg"}'" alt="Logo de ${campaign.name}" class="sponsor-logo"><h2>${campaign.name}</h2></div>
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
        </div>`;

    container.querySelector("#negotiateSponsor")?.addEventListener("click", () => {
        const extra = Math.round(Number(offer?.pago || 0) * 0.20);
        if (!gameState.negociarSponsor(extra)) alert("La marca rechazó la negociación.");
        renderSponsors(container);
    });
    container.querySelector("#acceptSponsor")?.addEventListener("click", () => {
        if (gameState.aceptarSponsor()) continuarDespuesDeMonetizacion();
    });
    container.querySelector("#rejectSponsor")?.addEventListener("click", () => {
        if (gameState.rechazarSponsor()) continuarDespuesDeMonetizacion();
    });
    container.querySelector("#acceptCampaign")?.addEventListener("click", () => {
        if (gameState.aceptarCampaign()) continuarDespuesDeMonetizacion();
    });
    container.querySelector("#rejectCampaign")?.addEventListener("click", () => {
        if (gameState.rechazarCampaign()) continuarDespuesDeMonetizacion();
    });

    return container;
}

export const sponsorsScreen = { render: renderSponsors };
export default sponsorsScreen;
