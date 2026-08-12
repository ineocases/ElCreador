import { gameState } from "../engine/gameState.js";

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function renderOpportunityOverlay(route = window.location.hash) {
    const existing = document.getElementById("opportunityOverlay");
    if (existing) existing.remove();

    const isOpportunityRoute = ["#pasanCosas", "#collabs", "#sponsors"].includes(route);
    if (isOpportunityRoute) return;

    const event = gameState.pendingEvent;
    const collab = gameState.pendingCollabOffer;
    const sponsor = gameState.pendingSponsorOffer;
    if (!event && !collab && !sponsor) return;

    let type, icon, title, text, href, button;
    if (event) {
        type = "event"; icon = "⚡"; title = event.title;
        text = "Pasó algo mientras avanzaba tu carrera. Tenés que decidir qué hacer.";
        href = "#pasanCosas"; button = "VER QUÉ PASÓ";
    } else if (collab) {
        type = "collab"; icon = "🤝";
        title = `${escapeHtml(collab.creatorName)} quiere colaborar con vos`;
        text = "Una propuesta apareció de forma inesperada en tu carrera.";
        href = "#collabs"; button = "VER COLABORACIÓN";
    } else {
        type = "sponsor"; icon = "💼";
        title = `${escapeHtml(sponsor.name)} quiere trabajar con vos`;
        text = "Una marca te encontró. La propuesta ya está disponible.";
        href = "#sponsors"; button = "VER PROPUESTA";
    }

    const overlay = document.createElement("div");
    overlay.id = "opportunityOverlay";
    overlay.className = `opportunity-overlay opportunity-${type}`;
    overlay.innerHTML = `
        <div class="opportunity-backdrop"></div>
        <section class="opportunity-modal" role="dialog" aria-modal="true">
            <div class="opportunity-modal-icon">${icon}</div>
            <div class="eyebrow">${type === "event" ? "PASAN COSAS" : type === "collab" ? "COLABORACIÓN INESPERADA" : "PROPUESTA INESPERADA"}</div>
            <h2>${title}</h2>
            <p>${text}</p>
            <a class="btn primary opportunity-action" href="${href}">${button}</a>
        </section>
    `;
    document.body.appendChild(overlay);
}
