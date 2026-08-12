// screens/pasanCosas.js
// Evento automático antes del cierre del trimestre.
// La decisión modifica el resultado final del trimestre.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Number(n || 0).toLocaleString();

function continuarDespuesDelEvento() {
    setTimeout(() => {
        if (gameState.pendingCollabOffer) {
            window.location.hash = "#collabs";
            return;
        }

        if (gameState.pendingSponsorOffer) {
            window.location.hash = "#sponsors";
            return;
        }

        // El cierre del trimestre se muestra DESPUÉS de resolver el evento.
        // En T2, videoResult se encarga de llevar al resumen anual con el botón
        // siguiente, así el jugador siempre ve primero cuánto rindió el canal.
        window.location.hash = "#videoResult";
    }, 180);
}

export function renderPasanCosas(el) {
    const container = el || document.getElementById("pasanCosasScreen");
    if (!container) return;

    const event = gameState.pendingEvent;
    const actividad = gameState.player.actividadTrimestre;

    if (!event) {
        // No debería ser una pantalla manual. Si entran por URL, seguimos solos.
        continuarDespuesDelEvento();
        return container;
    }

    const bonusPreview = opcion => {
        const c = event[opcion]?.cierre || {};
        const bits = [];
        if (c.videosPct) bits.push(`+${Math.round(c.videosPct * 100)}% videos`);
        if (c.vistasPct) bits.push(`+${Math.round(c.vistasPct * 100)}% vistas`);
        if (c.subsPct) bits.push(`+${Math.round(c.subsPct * 100)}% subs`);
        if (c.dineroPct) bits.push(`+${Math.round(c.dineroPct * 100)}% ingresos`);
        return bits.join(" · ");
    };

    container.innerHTML = `
        <div class="page-shell event-page compact-event-page">
            ${renderHeaderHud()}

            <div class="event-topline">
                <div class="eyebrow">⚡ PASAN COSAS · ANTES DEL CIERRE</div>
                <span class="event-quarter">${gameState.time.año} · T${gameState.time.trimestre}/2</span>
            </div>

            <div class="panel event-main-card">
                <div class="event-icon">⚡</div>
                <h1 class="page-title">${event.title}</h1>
                <p class="page-subtitle">${event.text}</p>
            </div>

            <div class="decision-grid compact-decision-grid">
                <button class="decision-card" data-option="a">
                    <span>OPCIÓN A</span>
                    <h2>${event.a.label}</h2>
                    <strong class="decision-impact">${bonusPreview("a")}</strong>
                </button>

                <button class="decision-card risky" data-option="b">
                    <span>OPCIÓN B</span>
                    <h2>${event.b.label}</h2>
                    <strong class="decision-impact">${bonusPreview("b")}</strong>
                </button>
                <button class="decision-card advanced" data-option="c" ${event.c?.requires?.atributo && Number(gameState.player.atributos?.[event.c.requires.atributo]||0)<Number(event.c.requires.valor||0)?'disabled':''}>
                    <span>OPCIÓN C · ${event.c?.requires ? `REQUIERE ${event.c.requires.atributo} ${event.c.requires.valor}` : 'AVANZADA'}</span>
                    <h2>${event.c?.label || 'Opción avanzada'}</h2>
                    <strong class="decision-impact">${bonusPreview("c")}</strong>
                </button>
            </div>

            <p class="event-footnote">
                Esta decisión se aplica al cierre del trimestre. Después de elegir, el juego continúa automáticamente.
            </p>
        </div>
    `;

    container.querySelectorAll("[data-option]").forEach(button => {
        button.addEventListener("click", () => {
            if (!gameState.pendingEvent) return;
            container.querySelectorAll("[data-option]").forEach(b => b.disabled = true);

            gameState.resolverEvento(button.dataset.option);
            continuarDespuesDelEvento();
        });
    });

    return container;
}

export const pasanCosasScreen = { render: renderPasanCosas };
export default pasanCosasScreen;
