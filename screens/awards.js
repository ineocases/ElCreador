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
    } else if (categoria === "edicion") {
        value = c.videos * 2 + c.vistas * 0.00001 + c.virales * 6;
    } else if (categoria === "colab") {
        value = Number(c.mundo?.colaboraciones || 0) * 30 + c.vistas * 0.000008 + c.crecimiento * 0.2;
    } else if (categoria === "querido" || categoria === "comunidad") {
        value = c.popularidad * 0.7 + c.crecimiento * 0.4 + followers * 3;
    } else if (categoria === "trayectoria") {
        value = c.vistas * 0.00002 + Math.max(0, (c.debutYear ? 2026 - c.debutYear : 0)) * 4 + c.popularidad * 0.5;
    } else if (categoria === "crecimiento") {
        value = growth * 35 + c.crecimiento * 0.35 + c.virales * 6;
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
    { id:"clip", nombre:"Clip del Año", icono:"🎬", desc:"El momento que más circuló durante la temporada." },
    { id:"revelacion", nombre:"Streamer Revelación", icono:"🚀", desc:"Un creador dentro de sus primeros cinco años que realmente dio el salto." },
    { id:"streamer", nombre:"Streamer del Año", icono:"🏆", desc:"La temporada más completa entre audiencia, impacto y crecimiento." },
    { id:"enojo", nombre:"Mejor Enojo", icono:"😡", desc:"La reacción que más quedó en la memoria de la comunidad." }
]

export function obtenerResultados(summary) {
    if (gameState.lastAwardsResults && Number(gameState.lastAwardsResults.año) === Number(summary?.año)) return gameState.lastAwardsResults.resultados;
    const pool = candidatos(summary);
    const resultados = CATEGORIAS.map(cat => {
        const nominadosCat = nominados(pool, cat.id);
        const ganador = [...nominadosCat].sort((a, b) => score(b, cat.id) - score(a, cat.id))[0] || null;
        return { ...cat, nominados: nominadosCat, ganador };
    });
    gameState.lastAwardsResults = { año: Number(summary?.año), resultados };
    gameState.guardar();
    return resultados;
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
    // El premio Revelación SÍ cuenta como victoria para el resumen y la estadística.
    const victoriasCount = resultados.filter(r => r.ganador?.isPlayer).length;
    const premiosJugador = resultados.filter(r => r.ganador?.isPlayer).map(r => r.nombre);
    gameState.player.awardsHistory ||= [];
    const alreadyRecorded = gameState.player.awardsHistory.some(a => Number(a.año) === Number(summary.año));
    if (!alreadyRecorded) gameState.player.awardsHistory.push(...premiosJugador.map(nombre => ({ año: summary.año, nombre })));
    gameState.lastYearSummary.premiosGanados = premiosJugador;
    gameState.lastYearSummary.premiosGanadosCount = victoriasCount;

    // El premio Revelación solo puede ganarse una vez.
    if (resultados.some(r => r.id === "revelacion" && r.ganador?.isPlayer)) {
        gameState.player.revelacionGanada = true;
    }
    gameState.player.awardsStats = gameState.player.awardsStats || { clips: 0, enojos: 0, reacciones: 0 };

    container.innerHTML = `
        <div class="page-shell awards-page compact-awards-page">
            ${renderHeaderHud()}
            <div class="awards-hero-compact">
                <div class="eyebrow">🏆 COSCU ARMY AWARDS · ${summary.año}</div>
                <h1>${victoriasCount ? "Hay una estatuilla para vos." : "La temporada terminó."}</h1>
                <p>${nominacionesJugador ? `Tu canal recibió ${nominacionesJugador} nominación${nominacionesJugador === 1 ? "" : "es"}.` : "Tu canal todavía no está entre los nominados."}</p>
                ${victoriasCount ? `<div class="award-result-badge">🏆 ${victoriasCount} PREMIO${victoriasCount === 1 ? "" : "S"}</div>` : ""}
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
                <button id="nextYear" class="btn primary big next-button">${Number(gameState.player.edad) >= 40 ? "🏁 VER FIN DE CARRERA" : "🚀 CONTINUAR AL NUEVO AÑO"}</button>
            </div>
        </div>
    `;
    // Forzar que siempre se muestren los resultados (sin bloquear)
    const revealElements = container.querySelectorAll(".award-reveal");
    revealElements.forEach(el => {
        el.style.display = "flex";
        el.classList.add("revealed");
    });

    container.querySelector("#nextYear")?.addEventListener("click", () => {
        if (Number(gameState.player.edad) >= 40) { gameState.player.retirado = true; gameState.guardar(); window.location.hash = "#careerEnd"; return; }
        gameState.prepararSiguienteAño();
        window.location.hash = "#newYear";
    });

    return container;
}

export const awardsScreen = { render: renderAwards };
export default awardsScreen;
