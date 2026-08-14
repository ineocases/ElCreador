// screens/pasanCosas.js
// Evento automático antes del cierre del trimestre.
// La decisión modifica el resultado final del trimestre.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Number(n || 0).toLocaleString();

function continuarDespuesDelEvento() {
    setTimeout(() => {
        // Una decisión de "Pasan cosas" nunca abre el directorio de Colabs.
        // Las listas, filtros e historial solo se muestran al entrar manualmente
        // en #collabs. Si el mundo dejó una invitación pendiente, el Dashboard
        // muestra únicamente esa invitación puntual.
        if (gameState.pendingSponsorOffer || gameState.pendingCampaignOffer) {
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

    const etiquetas = {
        dinero: "Dinero",
        reputacion: "Reputación",
        comunidad: "Comunidad",
        fama: "Fama",
        networking: "Networking",
        algoritmo: "Algoritmo",
        marketing: "Marketing",
        edicion: "Edición",
        constancia: "Constancia",
        energia: "Energía",
        salud: "Bienestar"
    };

    // El jugador no necesita ver los atributos internos del simulador para decidir.
    // Mostramos solo consecuencias fáciles de entender: dinero, vistas, subs y fama.
    // Los atributos secundarios (networking, reputación, constancia, algoritmo, etc.)
    // siguen modificando la partida por detrás, pero no saturan la decisión.
    const impactoLabels = opcion => {
        const choice = event[opcion] || {};
        const action = choice.action || {};
        const cierre = choice.cierre || {};
        const buenos = [];
        const malos = [];

        const format = (key, value) => {
            const n = Number(value) || 0;
            if (!n) return null;

            if (key === "dinero") {
                return `${n > 0 ? "+" : "−"}$${Math.abs(Math.round(n)).toLocaleString("es-AR")}`;
            }
            if (key === "subsPct") {
                return `${n > 0 ? "+" : "−"}${Math.abs(Math.round(n * 100))}% suscriptores`;
            }
            if (key === "vistasPct") {
                return `${n > 0 ? "+" : "−"}${Math.abs(Math.round(n * 100))}% vistas`;
            }
            if (key === "dineroPct") {
                return `${n > 0 ? "+" : "−"}${Math.abs(Math.round(n * 100))}% ingresos`;
            }
            if (key === "fama") {
                return `${n > 0 ? "+" : "−"}${Math.abs(Math.round(n))} fama`;
            }
            return null;
        };

        // Preferimos resultados concretos del cierre del trimestre.
        const visibles = [
            ...Object.entries(cierre),
            ...Object.entries(action)
        ];

        for (const [key, value] of visibles) {
            const n = Number(value) || 0;
            const text = format(key, n);
            if (!text) continue;
            (n > 0 ? buenos : malos).push(text);
        }

        // Si el evento solo afecta atributos internos, no mostramos el nombre
        // técnico. Traducimos la consecuencia a lenguaje de jugador.
        const internalValues = Object.entries(action).filter(([key]) =>
            ["reputacion","comunidad","networking","algoritmo","marketing","edicion","constancia","energia","salud","carisma","humor","creatividad"].includes(key)
        );

        if (!buenos.length && internalValues.some(([,v]) => Number(v) > 0)) {
            buenos.push("Mejora tu carrera");
        }
        if (!malos.length && internalValues.some(([,v]) => Number(v) < 0)) {
            malos.push("Tiene un costo");
        }

        // Cada alternativa debe explicar de forma simple que tiene una ventaja
        // y una contrapartida, sin llenar la tarjeta de números.
        if (!buenos.length) buenos.push("Mantiene el crecimiento");
        if (!malos.length) malos.push("Dejás pasar otra oportunidad");

        return {
            buenos: [...new Set(buenos)].slice(0, 2),
            malos: [...new Set(malos)].slice(0, 2)
        };
    };
    const impacto = opcion => impactoLabels(opcion);

    const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const listaImpactos = (items, clase) => `<div class="event-impact-list ${clase}">${items.map(x => `<span>${esc(x)}</span>`).join("")}</div>`;

    container.innerHTML = `
        <div class="page-shell event-page compact-event-page">
            ${renderHeaderHud()}

            <div class="event-topline">
                <div class="eyebrow">⚡ PASAN COSAS · ANTES DEL CIERRE</div>
                <span class="event-quarter">${gameState.time.año} · T${gameState.time.trimestre}/4</span>
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
                    <div class="decision-effects">
                        <div><small>TE BENEFICIA</small>${listaImpactos(impacto("a").buenos, "positive")}</div>
                        <div><small>TIENE UN COSTO</small>${listaImpactos(impacto("a").malos, "negative")}</div>
                    </div>
                </button>

                <button class="decision-card risky" data-option="b">
                    <span>OPCIÓN B</span>
                    <h2>${event.b.label}</h2>
                    <div class="decision-effects">
                        <div><small>TE BENEFICIA</small>${listaImpactos(impacto("b").buenos, "positive")}</div>
                        <div><small>TIENE UN COSTO</small>${listaImpactos(impacto("b").malos, "negative")}</div>
                    </div>
                </button>
                <button class="decision-card advanced" data-option="c" ${event.c?.requires?.atributo && Number(gameState.player.atributos?.[event.c.requires.atributo]||0)<Number(event.c.requires.valor||0)?'disabled':''}>
                    <span>OPCIÓN C · ${event.c?.requires ? `REQUIERE ${event.c.requires.atributo} ${event.c.requires.valor}` : 'AVANZADA'}</span>
                    <h2>${event.c?.label || 'Opción avanzada'}</h2>
                    <div class="decision-effects">
                        <div><small>TE BENEFICIA</small>${listaImpactos(impacto("c").buenos, "positive")}</div>
                        <div><small>TIENE UN COSTO</small>${listaImpactos(impacto("c").malos, "negative")}</div>
                    </div>
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

            const selected = gameState.pendingEvent?.[button.dataset.option];
            const resultAction = { ...(selected?.action || {}) };
            const resultCierre = { ...(selected?.cierre || {}) };
            gameState.resolverEvento(button.dataset.option);

            const names = { dinero:"Dinero", reputacion:"Reputación", comunidad:"Comunidad", fama:"Fama", networking:"Networking", algoritmo:"Algoritmo", marketing:"Marketing", edicion:"Edición", constancia:"Constancia", energia:"Energía", salud:"Bienestar", vistasPct:"Vistas", subsPct:"Suscriptores", dineroPct:"Ingresos" };
            const fmt = (key, value) => {
                const n = Number(value) || 0;
                if (!n) return null;
                const label = names[key] || key;
                const shown = key.endsWith("Pct") ? `${n > 0 ? "+" : ""}${Math.round(n * 100)}%` : `${n > 0 ? "+" : ""}${n}`;
                return `<span class="result-${n > 0 ? "good" : "bad"}">${shown} ${label}</span>`;
            };
            const resultItems = [...Object.entries(resultAction), ...Object.entries(resultCierre)].map(([k,v]) => fmt(k,v)).filter(Boolean);
            container.querySelector(".event-main-card")?.insertAdjacentHTML("afterend", `<div class="panel event-result-panel"><div class="eyebrow">RESULTADO</div><h2>${selected?.label || "Decisión tomada"}</h2><p>${selected?.desc || "La decisión tuvo consecuencias sobre tu carrera."}</p><div class="event-result-effects">${resultItems.join("")}</div></div>`);
            container.querySelector(".decision-grid")?.remove();
            setTimeout(continuarDespuesDelEvento, 1400);
        });
    });

    return container;
}

export const pasanCosasScreen = { render: renderPasanCosas };
export default pasanCosasScreen;
