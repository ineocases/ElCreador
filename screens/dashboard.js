// screens/dashboard.js
// Dashboard principal convertido en un "feed de carrera": todo el trimestre
// se entiende de arriba hacia abajo y el jugador no tiene que saltar entre
// pantallas para saber qué hacer.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { icon } from "../components/Icon.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");
const money = n => `$${nf(n)}`;
const fame = n => String(Math.round(Number(n) || 0));

const skills = [
    ["Edición", "edicion", "Mejora la retención: cada video rinde más vistas.", "videocam"],
    ["Carisma", "carisma", "Convierte espectadores en suscriptores y mejora las colaboraciones.", "person_add"],
    ["Algoritmo", "algoritmo", "La plataforma te recomienda más: multiplica las vistas de todos tus videos.", "bolt"],
    ["Marketing", "marketing", "Mejor RPM y sponsors: más plata por vista.", "briefcase"],
    ["Constancia", "constancia", "Más videos automáticos por trimestre.", "refresh"],
    ["Humor", "humor", "Más chance de clips y momentos virales.", "bolt"],
    ["Creatividad", "creatividad", "Desbloquea videos especiales y mejores miniaturas.", "play"],
    ["Networking", "networking", "Más colaboraciones e invitaciones de otros canales.", "group"]
];

function eventCard(container, event) {
    if (!event) return "";
    const p = gameState.player;
    const option = (key, extra = "") => {
        const o = event[key];
        if (!o) return "";
        const req = o.requires;
        const locked = req && Number(p.atributos?.[req.atributo] || 0) < Number(req.valor || 0);
        return `<button class="feed-choice ${key === "b" ? "secondary" : ""} ${locked ? "locked" : ""}" data-event-option="${key}" ${locked ? "disabled" : ""}>
            <span>${key.toUpperCase()}${req ? ` · ${locked ? "🔒 " : "✓ "}${req.atributo} ${req.valor}` : ""}</span>
            <b>${o.label}</b>
            <small>${extra || o.tradeoff || o.desc || "Puede cambiar tu trimestre."}</small>
        </button>`;
    };
    return `<section class="career-card feed-event-card">
        <div class="feed-card-head"><div class="feed-icon red">${icon("bolt",18)}</div><div><div class="eyebrow">PASAN COSAS</div><h2>${event.title}</h2></div></div>
        <p>${event.text}</p>
        <div class="feed-choices">${option("a")}${option("b")}${option("c")}</div>
        <small class="feed-hint">Elegí una. La consecuencia se aplica al cierre de este trimestre.</small>
    </section>`;
}

function collabCard(offer) {
    if (!offer) return "";
    const costo = Number(offer.costoVuelo || 0);
    const puedePagar = costo <= Number(gameState.player.dinero || 0);
    return `<section class="career-card feed-collab-card">
        <div class="feed-card-head"><div class="feed-icon green">${icon("group",18)}</div><div><div class="eyebrow">${offer.direction === "outgoing" ? "COLAB ACEPTADA" : "TE LLEGÓ UNA COLAB"}</div><h2>${offer.creatorName}</h2><p class="muted">${nf(offer.creatorFollowers)} seguidores · ${offer.niche || "Variedad"} · ${offer.pais || "Argentina"}</p></div></div>
        <div class="feed-result-strip"><span>👁️ +${nf(offer.reward?.vistas)}</span><span>👥 +${nf(offer.reward?.subs)}</span><span>❤️ +15 relación</span></div>
        <p class="feed-muted">${costo > 0 ? `✈️ Requiere un viaje de ${money(costo)}.` : "📍 No requiere viaje."}</p>
        <div class="feed-actions">
            <button id="feedAcceptCollab" class="btn primary" ${puedePagar ? "" : "disabled"}>ACEPTAR</button>
            <button id="feedRejectCollab" class="btn ghost">RECHAZAR</button>
        </div>
    </section>`;
}

function sponsorCard(offer, campaign) {
    if (!offer && !campaign) return "";
    if (offer) return `<section class="career-card feed-sponsor-card">
        <div class="feed-card-head"><div class="feed-icon gold">${icon("briefcase",18)}</div><div><div class="eyebrow">NUEVO SPONSOR</div><h2>${offer.name}</h2><p class="muted">Propuesta fija · ${offer.duration} trimestre${offer.duration === 1 ? "" : "s"}</p></div></div>
        <div class="feed-result-strip"><span>💰 ${money(offer.pago)}</span><span>⭐ +${nf(offer.prestige)} prestigio</span></div>
        ${offer.tipo === "casino" || offer.tipo === "cripto" ? `<p class="feed-warning">⚠️ Tiene riesgo reputacional.</p>` : ""}
        <div class="feed-actions"><button id="feedNegotiateSponsor" class="btn ghost">NEGOCIAR</button><button id="feedAcceptSponsor" class="btn primary">ACEPTAR</button><button id="feedRejectSponsor" class="btn ghost">RECHAZAR</button></div>
    </section>`;
    return `<section class="career-card feed-sponsor-card">
        <div class="feed-card-head"><div class="feed-icon gold">${icon("briefcase",18)}</div><div><div class="eyebrow">CAMPAÑA POR RENDIMIENTO</div><h2>${campaign.name}</h2><p class="muted">${money(campaign.cpm)} por 1.000 vistas · ${nf(campaign.deliverables)} contenidos</p></div></div>
        <div class="feed-result-strip"><span>🎯 ${nf(campaign.targetViews)} vistas objetivo</span><span>💰 tope ${money(campaign.maxPayout)}</span></div>
        <div class="feed-actions"><button id="feedAcceptCampaign" class="btn primary">ACEPTAR</button><button id="feedRejectCampaign" class="btn ghost">RECHAZAR</button></div>
    </section>`;
}

function resultCard(res) {
    if (!res) return "";
    const mini = res.manualVideo?.miniResultado;
    const miniLabel = mini === "excelente" ? " · Minijuego perfecto" : mini === "fallo" ? " · Minijuego fallido" : "";
    return `<section class="career-card feed-result-card">
        <div class="feed-card-head"><div class="feed-icon">${icon("check",18)}</div><div><div class="eyebrow">CIERRE DEL TRIMESTRE ${gameState.time.trimestre}/4</div><h2>Así rindió tu canal</h2></div></div>
        <div class="feed-result-title"><strong>${nf(res.totalVideos)}</strong><span>videos publicados</span></div>
        <div class="feed-result-grid">
            <div><small>VISTAS</small><b>+${nf(res.totalVistas)}</b></div>
            <div><small>SUBS</small><b>+${nf(res.totalSubs)}</b></div>
            <div><small>INGRESOS</small><b>+${money(res.totalDinero)}</b></div>
            <div><small>VIRALES</small><b>${nf(res.virales)}</b></div>
        </div>
        <div class="feed-featured"><span>${icon("videocam",15)} VIDEO DESTACADO</span><b>${res.manualVideo?.titulo || "Tu video"}</b><small>👁️ ${nf(res.manualVideo?.vistas)} · 👥 +${nf(res.manualVideo?.suscriptores)}${miniLabel}</small></div>
        <div class="feed-factor">${icon("bolt",14)} Descubrimiento x${Number(res.manualVideo?.factorDescubrimiento || 1).toFixed(1)}</div>
    </section>`;
}

function collabResultCard(last) {
    if (!last?.estado || !last.creatorName) return "";
    const accepted = last.estado === "aceptada";
    return `<section class="career-card feed-small-result ${accepted ? "positive" : "negative"}">
        <div class="feed-card-head"><div class="feed-icon ${accepted ? "green" : "red"}">${icon(accepted ? "check" : "close",17)}</div><div><div class="eyebrow">COLABORACIÓN</div><h2>${accepted ? `Colaboraste con ${last.creatorName}` : `Rechazaste la colab de ${last.creatorName}`}</h2></div></div>
        <p>${accepted ? `+${nf(last.vistas)} vistas · +${nf(last.subs)} subs · la relación mejoró.` : "La relación con ese creador bajó un poco."}</p>
    </section>`;
}

function worldCard() {
    const news = (gameState.worldNews || []).slice(-3).reverse();
    if (!news.length) return "";
    return `<section class="career-card feed-world-card"><div class="eyebrow">MIENTRAS TANTO, EN EL MUNDO</div>${news.map(n => `<div class="feed-world-row"><span>${n.type === "viral" ? "🔥" : n.type === "drama" ? "⚠️" : "•"}</span><p>${n.text}</p></div>`).join("")}</section>`;
}

function nextActionCard(p, hasResult, blockedByOffer) {
    if (blockedByOffer) return "";
    if (!p.pretemporada) return `<section class="career-card feed-next-card"><div><div class="eyebrow">PRÓXIMO PASO</div><h2>Prepará tu carrera</h2><p>Elegí cómo mejorar tus atributos antes de empezar a publicar.</p></div><a href="#pretemporada" class="btn primary">IR A PRETEMPORADA</a></section>`;
    if (!p.videoSubidoEsteTrimestre) return `<section class="career-card feed-next-card publish-next"><div><div class="eyebrow">TU TURNO</div><h2>¿Qué vas a publicar?</h2><p>Elegí un video y jugá el minijuego. Después tu canal sigue solo.</p></div><a href="#publish" class="btn primary big">${icon("videocam",18)} PUBLICAR VIDEO</a></section>`;
    if (hasResult) {
        const t = Number(gameState.time.trimestre || 1);
        return `<section class="career-card feed-next-card"><div><div class="eyebrow">TODO LISTO</div><h2>${t === 4 ? "Terminaste el año." : `Terminaste T${t}.`}</h2><p>${t === 4 ? "Ahora podés ver el resumen anual y después los Awards." : `Cuando quieras, avanzá a T${t + 1}.`}</p></div><button id="advanceQuarter" class="btn primary big">${t === 4 ? "VER RESUMEN ANUAL" : `SIGUIENTE · T${t + 1}`}</button></section>`;
    }
    return "";
}

export function renderDashboard(el) {
    const container = el || document.getElementById("dashboardScreen");
    if (!container) return;
    const p = gameState.player;
    if (!p?.partidaIniciada) { window.location.hash = "#createChannel"; return container; }

    const rawResult = gameState.lastQuarterResult;
    const res = rawResult && Number(rawResult.trimestre || gameState.time.trimestre) === Number(gameState.time.trimestre) && Number(rawResult.año || gameState.time.año) === Number(gameState.time.año) ? rawResult : null;
    const event = gameState.pendingEvent;
    const collab = gameState.pendingCollabOffer;
    const sponsor = gameState.pendingSponsorOffer;
    const campaign = gameState.pendingCampaignOffer;
    const blockedByOffer = Boolean(event || collab || sponsor || campaign);
    const hasResult = Boolean(res && Number(res.totalVideos) >= 0);
    const improved = p.pretemporada?.atributo;

    container.innerHTML = `<div class="page-shell career-feed-page">
        ${renderHeaderHud()}

        <div class="career-feed-intro">
            <div class="eyebrow">TU CARRERA</div>
            <h1>${p.canal || "Mi Canal"}</h1>
            <p>${p.niche || "Gaming"} · Todo lo que pasa en tu carrera aparece acá, en orden.</p>
        </div>

        <section class="career-card feed-status-card">
            <div class="feed-status-main"><span>ESTADO DEL CANAL</span><strong>${nf(p.suscriptores)} subs</strong><small>${fame(p.fama)}/100 fama · ${money(p.dinero)}</small></div>
        </section>

        ${!event ? resultCard(res) : ""}
        ${event ? eventCard(container, event) : ""}
        ${collab ? collabCard(collab) : ""}
        ${sponsor || campaign ? sponsorCard(sponsor, campaign) : ""}
        ${!collab && !event && !sponsor && !campaign ? collabResultCard(gameState.lastCollab) : ""}

        ${nextActionCard(p, hasResult, blockedByOffer)}

        <details class="career-more"><summary>Ver más sobre tu carrera</summary><div class="career-more-grid">
            <a href="#store" class="btn ghost">${icon("store",15)} Tienda</a>
            <a href="#collabs" class="btn ghost">${icon("group",15)} Colabs</a>
            <a href="#sponsors" class="btn ghost">${icon("briefcase",15)} Sponsors</a>
            <a href="#awards" class="btn ghost">${icon("trophy",15)} Awards</a>
            <a href="#velada" class="btn ghost">${icon("sports_mma",15)} Velada</a>
        </div></details>
    </div>`;

    // Eventos: se resuelven acá mismo. Después de elegir, la página vuelve a
    // dibujarse debajo del mismo header, sin saltos ni pantallas intermedias.
    container.querySelectorAll("[data-event-option]").forEach(btn => btn.addEventListener("click", () => {
        if (!gameState.pendingEvent) return;
        container.querySelectorAll("[data-event-option]").forEach(b => b.disabled = true);
        const ok = gameState.resolverEvento(btn.dataset.eventOption);
        if (ok) { gameState.guardar(); renderDashboard(container); }
    }));

    container.querySelector("#feedAcceptCollab")?.addEventListener("click", () => {
        const b = container.querySelector("#feedAcceptCollab"); b.disabled = true; b.textContent = "PROCESANDO...";
        if (gameState.aceptarCollab()) renderDashboard(container); else { b.disabled = false; b.textContent = "ACEPTAR"; }
    });
    container.querySelector("#feedRejectCollab")?.addEventListener("click", () => { if (gameState.rechazarCollab()) renderDashboard(container); });
    container.querySelector("#feedNegotiateSponsor")?.addEventListener("click", () => { if (gameState.negociarSponsor(Math.round(Number(gameState.pendingSponsorOffer?.pago||0)*0.20))) renderDashboard(container); else alert("La marca rechazó la negociación."); });
    container.querySelector("#feedAcceptSponsor")?.addEventListener("click", () => { if (gameState.aceptarSponsor()) renderDashboard(container); });
    container.querySelector("#feedRejectSponsor")?.addEventListener("click", () => { if (gameState.rechazarSponsor()) renderDashboard(container); });
    container.querySelector("#feedAcceptCampaign")?.addEventListener("click", () => { if (gameState.aceptarCampaign()) renderDashboard(container); });
    container.querySelector("#feedRejectCampaign")?.addEventListener("click", () => { if (gameState.rechazarCampaign()) renderDashboard(container); });

    container.querySelector("#advanceQuarter")?.addEventListener("click", () => {
        if (Number(gameState.time.trimestre) === 4) {
            gameState.finalizarAño();
            gameState.guardar();
            window.location.hash = "#yearSummary";
            return;
        }
        gameState.nextQuarter();
        gameState.guardar();
        renderDashboard(container);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    return container;
}

export const dashboardScreen = { render: renderDashboard };
export default dashboardScreen;
