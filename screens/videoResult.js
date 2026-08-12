// screens/videoResult.js
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const nf = n => Number(n || 0).toLocaleString();

export function renderVideoResult(el) {
    const container = el || document.getElementById("resultScreen");
    if (!container) return;

    const res = gameState.lastQuarterResult;

    if (!res) {
        container.innerHTML = `
            <div class="page-shell">
                ${renderHeaderHud()}
                <div class="panel center">
                    <h2>No hay resultado disponible.</h2>
                    <a class="btn primary" href="#dashboard">Volver</a>
                </div>
            </div>
        `;
        return container;
    }

    const finDeAño = gameState.time.trimestre === 2;
    container.innerHTML = `
        <div class="page-shell result-page">
            ${renderHeaderHud()}

            <div class="result-kicker">
                📊 CIERRE DEL TRIMESTRE ${gameState.time.trimestre}/2
            </div>

            <h1 class="page-title">Así rindió tu canal.</h1>
            <p class="page-subtitle">
                Elegiste el video destacado. Tu canal siguió publicando por su cuenta
                durante todo el trimestre.
            </p>

            <div class="result-hero fade">
                <div class="result-number">${nf(res.totalVideos)}</div>
                <div>
                    <div class="eyebrow">PUBLICACIONES DEL CANAL</div>
                    <h2>videos este trimestre</h2>
                    <p>
                        1 fue tu video destacado y ${nf(res.simulatedVideos)}
                        fueron publicaciones normales de tu propio canal.
                    </p>
                </div>
            </div>

            <div class="stat-grid four">
                <div class="stat-tile result-stat">
                    <span>👁️ Vistas</span>
                    <strong>+${nf(res.totalVistas)}</strong>
                </div>
                <div class="stat-tile result-stat">
                    <span>👥 Suscriptores</span>
                    <strong>+${nf(res.totalSubs)}</strong>
                </div>
                <div class="stat-tile result-stat">
                    <span>💰 Ingresos</span>
                    <strong>+$${nf(res.totalDinero)}</strong>
                </div>
                <div class="stat-tile result-stat">
                    <span>🔥 Virales</span>
                    <strong>${nf(res.virales)}</strong>
                </div>
            </div>

            <div class="callout discovery-factor">🔎 Descubrimiento x${Number(res.manualVideo.factorDescubrimiento||1).toFixed(1)} <small>(Algoritmo + Edición + audiencia)</small></div>

            ${gameState.player.ultimoDesgloseFama?.texto ? `<div class="callout fame-breakdown-callout">⭐ ${gameState.player.ultimoDesgloseFama.texto}</div>` : ""}

            <div class="panel featured-video reveal-card">
                <div class="eyebrow">🎬 VIDEO QUE ELEGISTE</div>
                <h2>${res.manualVideo.titulo}</h2>
                <div class="mini-stats">
                    <span>👁️ ${nf(res.manualVideo.vistas)}</span>
                    <span>👥 +${nf(res.manualVideo.suscriptores)}</span>
                    <span>💰 +$${nf(res.manualVideo.dinero)}</span>
                    ${res.manualVideo.viral
                        ? `<b>🔥 ${res.manualVideo.nivelViralidad.toUpperCase()}</b>`
                        : `<span>Resultado normal</span>`}
                </div>
            </div>

            <div class="quarter-story panel">
                <div class="eyebrow">📌 QUÉ PASÓ</div>
                <h2>
                    ${res.totalVideos > 100
                        ? "Tu canal estuvo muy activo."
                        : res.totalVideos > 60
                            ? "Tu ritmo de publicación fue sólido."
                            : "Fue un trimestre tranquilo."}
                </h2>
                <p>
                    Publicaste ${nf(res.totalVideos)} videos y generaste
                    ${nf(res.totalVistas)} vistas. El crecimiento depende de tu
                    audiencia, tus atributos, tus decisiones y de lo que pase
                    alrededor de tu canal.
                </p>
            </div>

            <div class="continue-row single-next">
                <button id="continueAfterVideo" class="btn primary big next-button">
                    ${finDeAño ? "🏆 SIGUIENTE: RESUMEN DEL AÑO" : "▶ SIGUIENTE: TRIMESTRE 2"}
                </button>
            </div>
        </div>
    `;

    container.querySelector("#continueAfterVideo")?.addEventListener("click", () => {
        // Una sola flecha de avance controla todo el flujo.
        if (finDeAño) {
            gameState.finalizarAño();
            gameState.guardar();
            window.location.hash = "#yearSummary";
            return;
        }

        gameState.nextQuarter();
        gameState.guardar();
        window.location.hash = "#publish";
    });

    return container;
}

export const videoResultScreen = { render: renderVideoResult };
export default videoResultScreen;
