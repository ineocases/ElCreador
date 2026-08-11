// screens/awards.js
// Ceremonia anual inspirada en la lógica de los Army/Coscu Awards:
// primero aparecen nominaciones, después se resuelve cada terna y el jugador
// recibe consecuencias si gana o si pierde.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Number(n || 0).toLocaleString();
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));

function metricForCreator(c) {
    const m = c.mundo || {};
    return {
        id: c.id,
        nombre: c.nombre,
        seguidores: Number(c.seguidores || 0),
        crecimiento: Number(m.nuevosSeguidores || 0),
        vistas: Number(m.vistas || 0),
        videos: Number(m.videos || 0),
        virales: Number(m.virales || 0),
        clips: Number(m.clips || 0),
        enojos: Number(m.enojos || 0),
        popularidad: Number(c.popularidad || 0),
        debutYear: Number.isInteger(c.debutYear) ? c.debutYear : null,
        revelacionGanada: Boolean(c.revelacionGanada),
        isPlayer: false
    };
}

function metricForPlayer(summary) {
    const p = gameState.player;
    const t1 = summary?.trimestre1 || {};
    const t2 = summary?.trimestre2 || {};
    const awards = p.awardsStats || {};
    return {
        id: "player",
        nombre: p.canal,
        seguidores: Number(summary?.suscriptoresFin || p.suscriptores || 0),
        crecimiento: Number(summary?.crecimientoSubs || 0),
        vistas: Number(summary?.vistasGanadas || 0),
        videos: Number(summary?.videosPublicados || 0),
        virales: Number(t1.virales || 0) + Number(t2.virales || 0),
        clips: Number(awards.clips || 0) + (Number(summary?.mejorVideo || 0) >= 100000 ? 2 : Number(summary?.mejorVideo || 0) >= 50000 ? 1 : 0),
        enojos: Number(awards.enojos || 0),
        popularidad: Number(summary?.famaFin || p.fama || 0),
        reputacion: Number(summary?.reputacion || p.reputacion || 50),
        debutYear: Number(p.debutYear) || Number(summary?.año) || 2026,
        revelacionGanada: Boolean(p.revelacionGanada),
        isPlayer: true
    };
}

function todosCandidatos(summary) {
    return [
        metricForPlayer(summary),
        ...(gameState.creators || [])
            .filter(c => c.activo !== false && (c.pais || "Argentina") === "Argentina")
            .map(metricForCreator)
    ];
}

function tier(seguidores) {
    if (seguidores >= 1000000) return 6;
    if (seguidores >= 250000) return 5;
    if (seguidores >= 50000) return 4;
    if (seguidores >= 10000) return 3;
    if (seguidores >= 1000) return 2;
    return 1;
}

function score(c, categoria) {
    const growth = Math.log10(Math.max(1, c.crecimiento));
    const views = Math.log10(Math.max(1, c.vistas));
    const followers = Math.log10(Math.max(1, c.seguidores));
    const t = tier(c.seguidores);
    let value = 0;

    if (categoria === "streamer") {
        // La escala importa mucho. Un canal pequeño puede tener un año increíble,
        // pero no desplaza automáticamente a una estrella consolidada.
        value = growth * 22 + views * 25 + c.popularidad * 0.30 + c.virales * 5 + Math.min(15, c.videos / 20) + followers * 2;
        value += t * 14;
        if (c.seguidores < 10000) value -= 35;
        else if (c.seguidores < 50000) value -= 18;
    } else if (categoria === "revelacion") {
        const base = Math.max(1, c.seguidores - c.crecimiento);
        const pctGrowth = c.crecimiento / base;
        value = pctGrowth * 100 + growth * 20 + views * 7 + c.virales * 5;
    } else if (categoria === "clip") {
        value = c.clips * 28 + c.virales * 12 + views * 3;
    } else if (categoria === "enojo") {
        value = c.enojos * 45 + c.virales * 3 + c.popularidad * 0.04;
    }
    return value + Math.random() * 4;
}

function nominados(candidatos, categoria) {
    const añoPremio = Number(gameState.lastYearSummary?.año) || 2026;
    let pool = [...candidatos];

    // Los premios no son un sorteo: una temporada de un canal muy chico no
    // lo pone automáticamente contra los nombres grandes de la escena.
    if (categoria === "streamer") {
        pool = pool.filter(c => c.seguidores >= 100000 || c.popularidad >= 75 || (c.isPlayer && c.seguidores >= 100000));
    }

    if (categoria === "clip") {
        pool = pool.filter(c => c.clips > 0 && (c.vistas >= 100000 || c.seguidores >= 10000));
    }

    if (categoria === "enojo") {
        pool = pool.filter(c => c.enojos > 0 && (c.seguidores >= 15000 || c.popularidad >= 70));
    }

    if (categoria === "revelacion") {
        pool = pool.filter(c => {
            if (!Number.isInteger(c.debutYear)) return false;
            const añosDesdeDebut = añoPremio - c.debutYear;
            return añosDesdeDebut >= 0 && añosDesdeDebut < 5 && !c.revelacionGanada;
        });
        // La revelación tiene que haber demostrado que realmente está creciendo.
        pool = pool.filter(c => c.crecimiento >= 300 || c.seguidores >= 1000 || c.virales >= 2);
    }

    pool.sort((a, b) => score(b, categoria) - score(a, categoria));
    const top = pool.slice(0, 5);

    // Un jugador chico no entra sólo porque el sistema necesita cinco nombres.
    // Sólo se lo agrega si supera el umbral real de la categoría.
    const jugador = candidatos.find(c => c.isPlayer);
    if (jugador && !top.some(c => c.isPlayer)) {
        const playerScore = score(jugador, categoria);
        let elegible = false;
        if (categoria === "streamer") elegible = jugador.seguidores >= 100000 && jugador.popularidad >= 25;
        if (categoria === "clip") elegible = jugador.clips > 0 && (jugador.vistas >= 100000 || jugador.seguidores >= 10000);
        if (categoria === "enojo") elegible = jugador.enojos > 0 && (jugador.seguidores >= 15000 || jugador.popularidad >= 20);
        if (categoria === "revelacion") {
            const añosDesdeDebut = añoPremio - jugador.debutYear;
            elegible = !jugador.revelacionGanada && añosDesdeDebut >= 0 && añosDesdeDebut < 5 &&
                (jugador.crecimiento >= 300 || jugador.seguidores >= 1000 || jugador.virales >= 2) && playerScore >= 20;
        }
        if (elegible) {
            top.push(jugador);
            top.sort((a, b) => score(b, categoria) - score(a, categoria));
            top.splice(5);
        }
    }

    return [...new Map(top.map(c => [c.id, c])).values()].slice(0, 5);
}

const CATEGORIAS = [
    { id: "clip", nombre: "Clip del Año", icono: "🎬", desc: "El momento que más circuló y quedó en la memoria de la comunidad." },
    { id: "revelacion", nombre: "Streamer Revelación", icono: "🚀", desc: "El creador que más creció y dio el salto durante la temporada." },
    { id: "streamer", nombre: "Streamer del Año", icono: "🏆", desc: "La temporada más completa: audiencia, crecimiento, impacto y constancia." },
    { id: "enojo", nombre: "Mejor Enojo", icono: "😡", desc: "La reacción más recordada de la temporada." }
];

export function obtenerResultados(summary) {
    const candidatos = todosCandidatos(summary);
    return CATEGORIAS.map(categoria => {
        const nom = nominados(candidatos, categoria.id);
        const ganador = [...nom].sort((a, b) => score(b, categoria.id) - score(a, categoria.id))[0] || null;
        return { ...categoria, nominados: nom, ganador };
    });
}

export function obtenerOResolverAwards(summary) {
    if (!summary) return [];
    const año = summary.año;
    const resultados = obtenerOResolverAwards(summary);

    const nominacionesJugador = resultados.filter(r => r.nominados.some(n => n.isPlayer)).length;
    const victoriasJugador = resultados.filter(r => r.ganador?.isPlayer).length;

    container.innerHTML = `
        <div class="page-shell awards-page compact-awards-page">
            ${renderHeaderHud()}
            <div class="awards-hero-compact">
                <div class="eyebrow">🏆 COSCU ARMY AWARDS · ${año}</div>
                <h1>La temporada terminó. Ahora hablan los nombres.</h1>
                <p>${nominacionesJugador ? `Tu canal recibió ${nominacionesJugador} nominación${nominacionesJugador > 1 ? "es" : ""}.` : "Tu nombre todavía no apareció entre los nominados."}</p>
                ${victoriasJugador ? `<div class="award-result-badge">🏆 ${victoriasJugador} PREMIO${victoriasJugador > 1 ? "S" : ""}</div>` : ""}
            </div>

            <div class="awards-categories">
                ${resultados.map(r => `
                    <section class="award-terne panel ${r.ganador?.isPlayer ? "player-won" : ""}">
                        <div class="award-terne-head">
                            <div><div class="eyebrow">${r.icono} TERNA</div><h2>${r.nombre}</h2></div>
                            <span>${r.nominados.length} nominados</span>
                        </div>
                        <p class="muted">${r.desc}</p>
                        <div class="award-nominee-grid">
                            ${r.nominados.map((c, i) => `
                                <div class="award-nominee-row ${c.isPlayer ? "is-player" : ""} ${r.ganador?.id === c.id ? "is-winner" : ""}">
                                    <b>#${i + 1}</b>
                                    <div class="award-name"><strong>${c.nombre}</strong><small>${nf(c.seguidores)} seguidores · +${nf(c.crecimiento)}</small></div>
                                    ${r.ganador?.id === c.id ? `<span class="award-winner-tag">GANADOR</span>` : ""}
                                </div>
                            `).join("")}
                        </div>
                        <div class="award-reveal ${r.ganador?.isPlayer ? "won" : "lost"}">
                            <span>${r.ganador?.isPlayer ? "🏆" : "🥁"}</span>
                            <div><small>Y EL GANADOR ES</small><strong>${r.ganador?.nombre || "—"}</strong>${r.ganador?.isPlayer ? `<em>Ganaste esta terna.</em>` : `<em>Esta vez no fue tuya.</em>`}</div>
                        </div>
                    </section>
                `).join("")}
            </div>

            <div class="continue-row single-next">
                <button id="nextYear" class="btn primary big next-button">🚀 EMPEZAR ${año + 1}</button>
            </div>
        </div>
    `;

    container.querySelector("#nextYear")?.addEventListener("click", () => {
        gameState.prepararSiguienteAño();
        window.location.hash = "#pretemporada";
    });

    return container;
}

export const awardsScreen = { render: renderAwards };
export default awardsScreen;
