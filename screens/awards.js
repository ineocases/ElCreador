// screens/awards.js
// 🏆 COSCU ARMY AWARDS: ceremonia anual.
// Esta pantalla NO es el palmarés. Los resultados ya son calculados por
// gameState al cerrar el año y acá simplemente se presentan como evento.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Math.round(Number(n) || 0).toLocaleString("es-AR");

function normalizeResult(r) {
    if (!r) return null;
    const nominados = Array.isArray(r.nominados) ? r.nominados : [];
    const ganador = r.ganador || nominados.find(n => n.ganador) || null;
    return { ...r, nominados, ganador };
}

export function renderAwards(container) {
    if (!container) return null;

    const summary = gameState.lastYearSummary;
    const resultados = Array.isArray(gameState.lastAwardsResults?.resultados)
        ? gameState.lastAwardsResults.resultados.map(normalizeResult)
        : [];

    if (!summary || !resultados.length) {
        container.innerHTML = `
            <div class="page-shell awards-page compact-awards-page">
                ${renderHeaderHud()}
                <section class="panel center">
                    <div class="eyebrow">🏆 COSCU ARMY AWARDS</div>
                    <h1>Todavía no hay una ceremonia disponible</h1>
                    <p class="muted">Los Awards aparecen después de cerrar el cuarto trimestre y ver el resumen anual.</p>
                    <a class="btn primary big" href="#dashboard">VOLVER AL DASHBOARD</a>
                </section>
            </div>`;
        return container;
    }

    const playerNominations = resultados.filter(r =>
        r.nominados.some(n => n?.id === "player" || n?.isPlayer || n?.ganador?.id === "player")
    ).length;
    const playerWins = resultados.filter(r =>
        r.ganador?.id === "player" || r.ganador?.isPlayer || r.jugadorGano
    ).length;

    container.innerHTML = `
        <div class="page-shell awards-page compact-awards-page">
            ${renderHeaderHud()}

            <div class="awards-hero-compact">
                <div class="eyebrow">🏆 COSCU ARMY AWARDS · ${summary.año}</div>
                <h1>${playerWins ? "Hay una estatuilla para vos." : "La temporada terminó."}</h1>
                <p>${playerNominations
                    ? `Tu canal recibió ${playerNominations} nominación${playerNominations === 1 ? "" : "es"}.`
                    : "Tu canal no quedó entre los nominados esta temporada."}</p>
                ${playerWins ? `<div class="award-result-badge">🏆 ${playerWins} PREMIO${playerWins === 1 ? "" : "S"}</div>` : ""}
            </div>

            <div class="awards-categories">
                ${resultados.map(r => {
                    const winnerIsPlayer = r.ganador?.id === "player" || r.ganador?.isPlayer || r.jugadorGano;
                    return `
                    <section class="award-terne panel ${winnerIsPlayer ? "player-won" : ""}">
                        <div class="award-terne-head">
                            <div>
                                <div class="eyebrow">${r.icono || "🏆"} TERNA</div>
                                <h2>${r.nombre || "Premio"}</h2>
                            </div>
                            <span>${r.nominados.length} nominados</span>
                        </div>
                        <p class="muted">${r.descripcion || r.desc || "Reconocimiento de la temporada."}</p>

                        <div class="award-nominee-grid">
                            ${r.nominados.map((n, i) => {
                                const isPlayer = n?.id === "player" || n?.isPlayer;
                                const isWinner = r.ganador?.id === n?.id;
                                return `
                                <div class="award-nominee-row ${isPlayer ? "is-player" : ""} ${isWinner ? "is-winner" : ""}">
                                    <b>#${i + 1}</b>
                                    <div class="award-name">
                                        <strong>${n?.nombre || "Creador"}</strong>
                                        <small>${nf(n?.seguidores)} seguidores · +${nf(n?.crecimiento)}</small>
                                    </div>
                                    ${isWinner ? `<span class="award-winner-tag">GANADOR</span>` : ""}
                                </div>`;
                            }).join("")}
                        </div>

                        <div class="award-reveal ${winnerIsPlayer ? "won" : "lost"}">
                            <span>${winnerIsPlayer ? "🏆" : "🥁"}</span>
                            <div>
                                <small>GANADOR</small>
                                <strong>${r.ganador?.nombre || "Sin ganador"}</strong>
                                <em>${winnerIsPlayer ? "Ganaste esta terna." : "Esta vez no fue tuya."}</em>
                            </div>
                        </div>
                    </section>`;
                }).join("")}
            </div>

            <div class="continue-row single-next">
                <button id="nextYear" class="btn primary big next-button">
                    ${Number(gameState.player?.edad) >= 40 ? "🏁 VER FIN DE CARRERA" : "🚀 CONTINUAR AL NUEVO AÑO"}
                </button>
                <a href="#palmares" class="btn ghost big next-button">📜 VER MI PALMARÉS</a>
            </div>
        </div>
    `;

    container.querySelectorAll(".award-reveal").forEach(el => {
        el.style.display = "flex";
        el.classList.add("revealed");
    });

    container.querySelector("#nextYear")?.addEventListener("click", () => {
        if (Number(gameState.player?.edad) >= 40) {
            gameState.player.retirado = true;
            gameState.guardar();
            window.location.hash = "#careerEnd";
            return;
        }
        gameState.prepararSiguienteAño();
        window.location.hash = "#newYear";
    });

    return container;
}

export const awardsScreen = { render: renderAwards };
export default awardsScreen;
