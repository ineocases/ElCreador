// screens/awards.js
// Coscu Army Awards: resultados anuales y ceremonia solo cuando el jugador gana.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Math.round(Number(n) || 0).toLocaleString("es-AR");

function metricForCreator(c) {
    const m = c.mundo || {};
    return {
        id: c.id,
        nombre: c.nombre || "Creador",
        seguidores: Number(c.seguidores || 0),
        crecimiento: Number(m.nuevosSeguidores || c.crecimiento || 0),
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
    const stats = p.awardsStats || {};
    return {
        id: "player",
        nombre: p.canal || "Mi Canal",
        seguidores: Number(summary?.suscriptoresFin || p.suscriptores || 0),
        crecimiento: Number(summary?.crecimientoSubs || 0),
        vistas: Number(summary?.vistasGanadas || 0),
        videos: Number(summary?.videosPublicados || 0),
        virales: Number(t1.virales || 0) + Number(t2.virales || 0),
        clips: Number(stats.clips || 0) + (Number(summary?.mejorVideo || 0) >= 100000 ? 2 : Number(summary?.mejorVideo || 0) >= 50000 ? 1 : 0),
        enojos: Number(stats.enojos || 0),
        popularidad: Number(summary?.famaFin || p.fama || 0),
        debutYear: Number(p.debutYear) || Number(summary?.año) || 2026,
        revelacionGanada: Boolean(p.revelacionGanada),
        isPlayer: true
    };
}

function candidatos(summary) {
    return [
        metricForPlayer(summary),
        ...(gameState.creators || [])
            .filter(c => c.activo !== false && (c.pais || "Argentina") === "Argentina")
            .map(metricForCreator)
    ];
}

function tier(subs) {
    if (subs >= 1000000) return 6;
    if (subs >= 250000) return 5;
    if (subs >= 50000) return 4;
    if (subs >= 10000) return 3;
    if (subs >= 1000) return 2;
    return 1;
}

function score(c, categoria) {
    const growth = Math.log10(Math.max(1, c.crecimiento));
    const views = Math.log10(Math.max(1, c.vistas));
    const followers = Math.log10(Math.max(1, c.seguidores));
    let value = 0;

    if (categoria === "streamer") {
        value = growth * 22 + views * 25 + c.popularidad * 0.30 + c.virales * 5 + Math.min(15, c.videos / 20) + followers * 2;
        value += tier(c.seguidores) * 14;
        if (c.seguidores < 10000) value -= 35;
        else if (c.seguidores < 50000) value -= 18;
    } else if (categoria === "revelacion") {
        const base = Math.max(1, c.seguidores - c.crecimiento);
        value = (c.crecimiento / base) * 100 + growth * 20 + views * 7 + c.virales * 5;
    } else if (categoria === "clip") {
        value = c.clips * 28 + c.virales * 12 + views * 3;
    } else if (categoria === "enojo") {
        value = c.enojos * 45 + c.virales * 3 + c.popularidad * 0.04;
    }

    return value + Math.random() * 4;
}

function nominados(pool, categoria) {
    const año = Number(gameState.lastYearSummary?.año) || 2026;
    let eligible = [...pool];

    if (categoria === "streamer") {
        eligible = eligible.filter(c => c.seguidores >= 100000 || c.popularidad >= 75);
    }
    if (categoria === "clip") {
        eligible = eligible.filter(c => c.clips > 0 && (c.vistas >= 100000 || c.seguidores >= 10000));
    }
    if (categoria === "enojo") {
        eligible = eligible.filter(c => c.enojos > 0 && (c.seguidores >= 15000 || c.popularidad >= 70));
    }
    if (categoria === "revelacion") {
        eligible = eligible.filter(c => {
            if (!Number.isInteger(c.debutYear)) return false;
            const años = año - c.debutYear;
            return años >= 0 && años < 5 && !c.revelacionGanada && (c.crecimiento >= 300 || c.seguidores >= 1000 || c.virales >= 2);
        });
    }

    eligible.sort((a, b) => score(b, categoria) - score(a, categoria));
    return [...new Map(eligible.slice(0, 5).map(c => [c.id, c])).values()];
}

const CATEGORIAS = [
    { id: "clip", nombre: "Clip del Año", icono: "🎬", desc: "El momento que más circuló durante la temporada." },
    { id: "revelacion", nombre: "Streamer Revelación", icono: "🚀", desc: "Un creador que está dentro de sus primeros cinco años y realmente dio el salto." },
    { id: "streamer", nombre: "Streamer del Año", icono: "🏆", desc: "La temporada más completa entre audiencia, impacto y crecimiento." },
    { id: "enojo", nombre: "Mejor Enojo", icono: "😡", desc: "La reacción que más quedó en la memoria de la comunidad." }
];

export function obtenerResultados(summary) {
    const pool = candidatos(summary);
    return CATEGORIAS.map(cat => {
        const nominadosCat = nominados(pool, cat.id);
        const ganador = [...nominadosCat].sort((a, b) => score(b, cat.id) - score(a, cat.id))[0] || null;
        return { ...cat, nominados: nominadosCat, ganador };
    });
}

export function obtenerOResolverAwards(summary) {
    return obtenerResultados(summary);
}

export function renderAwards(container) {
    if (!container) return null;

    const summary = gameState.lastYearSummary;
    if (!summary) {
        container.innerHTML = `<div class="page-shell"><p class="muted">Todavía no terminó una temporada.</p></div>`;
        return container;
    }

    const resultados = obtenerResultados(summary);
    const nominacionesJugador = resultados.filter(r => r.nominados.some(n => n.isPlayer)).length;
    const victoriasJugador = resultados.filter(r => r.ganador?.isPlayer).length;

    // El premio Revelación solo puede ganarse una vez.
    if (victoriasJugador > 0 && resultados.some(r => r.id === "revelacion" && r.ganador?.isPlayer)) {
        gameState.player.revelacionGanada = true;
    }
    gameState.player.awardsStats = gameState.player.awardsStats || { clips: 0, enojos: 0, reacciones: 0 };

    container.innerHTML = `
        <div class="page-shell awards-page compact-awards-page">
            ${renderHeaderHud()}
            <div class="awards-hero-compact">
                <div class="eyebrow">🏆 COSCU ARMY AWARDS · ${summary.año}</div>
                <h1>${victoriasJugador ? "Hay una estatuilla para vos." : "La temporada terminó."}</h1>
                <p>${nominacionesJugador ? `Tu canal recibió ${nominacionesJugador} nominación${nominacionesJugador === 1 ? "" : "es"}.` : "Tu canal todavía no está entre los nominados."}</p>
                ${victoriasJugador ? `<div class="award-result-badge">🏆 ${victoriasJugador} PREMIO${victoriasJugador === 1 ? "" : "S"}</div>` : ""}
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
                            <div><small>GANADOR</small><strong>${r.ganador?.nombre || "Sin ganador"}</strong>${r.ganador?.isPlayer ? `<em>Ganaste esta terna.</em>` : `<em>Esta vez no fue tuya.</em>`}</div>
                        </div>
                    </section>
                `).join("")}
            </div>

            <div class="continue-row single-next">
                <button id="nextYear" class="btn primary big next-button">🚀 EMPEZAR ${Number(summary.año) + 1}</button>
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
