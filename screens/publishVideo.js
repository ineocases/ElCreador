// screens/publishVideo.js
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";
import { generarVideos, procesarPublicacionTrimestre } from "../engine/videoSystem.js";
import { runMinigame } from "../engine/minigames.js";

export function renderPublishVideo(el) {
    const container = el || document.getElementById("publishScreen");
    if (!container) return;

    if (!gameState.player.pretemporada) {
        container.innerHTML = `${renderHeaderHud()}<div style="max-width:700px;margin:40px auto;padding:30px;background:var(--bg-card);border-radius:16px;text-align:center;"><h2>Primero hacé la pretemporada.</h2><a href="#pretemporada">Ir a pretemporada</a></div>`;
        return container;
    }

    if (!gameState.puedeSubirVideo()) {
        container.innerHTML = `${renderHeaderHud()}<div style="max-width:700px;margin:40px auto;padding:30px;background:var(--bg-card);border-radius:16px;text-align:center;"><h2>Ya publicaste tu video este trimestre.</h2><p style="color:var(--text-muted);">No podés subir otro hasta avanzar al próximo trimestre.</p><a href="#dashboard" style="color:var(--accent-red);">Volver al dashboard</a></div>`;
        return container;
    }

    const videos = generarVideos(gameState.player);

    const renderVideoCard = video => `
        <article class="video-option-card">
            <div class="video-option-top">
                <span class="video-option-tag ${video.costo === 0 ? 'free' : video.costo <= 35 ? 'cheap' : 'premium'}">
                    ${video.costo === 0 ? 'GRATIS' : '$' + video.costo.toLocaleString()}
                </span>
                <span class="video-risk" title="Riesgo: posibilidad de que el concepto rinda por debajo de lo esperado. Más riesgo = mayor variación.">RIESGO ${Math.max(1, Math.min(5, Math.ceil(video.riesgo / 20)))} / 5</span>
            </div>
            <h2>${video.titulo}</h2>
            <p class="video-option-meta">${video.formato} · ${video.tema}</p>
            <div class="video-option-bottom">
                <span title="La sinergia combina el atributo principal del video con tu nivel actual.">🎯 ${video.enfoquePrincipal} · ${Math.round((Number(gameState.player.atributos?.[video.enfoquePrincipal])||0)*1.5)} sinergia · ~${Math.max(100,Math.round((Number(gameState.player.suscriptores||0)*0.35)))}+ vistas base</span>
                <button class="select-video btn primary" data-video-id="${video.id}">PUBLICAR</button>
            </div>
        </article>
    `;

    container.innerHTML = `
        <div style="max-width:760px;margin:0 auto;padding:20px;">
            ${renderHeaderHud()}
            <div style="margin:25px 0;">
                <div style="color:var(--accent-red);font-size:.8rem;font-weight:bold;">TRIMESTRE ${gameState.time.trimestre}/2</div>
                <h1 style="font-family:var(--font-heading);margin:6px 0;">📹 Elegí tu video</h1>
                <p style="color:var(--text-muted);">Elegí 1 video. Solo aparecen producciones que podés pagar. Después, tu canal sigue publicando durante todo el trimestre.</p>
            </div>
            <div class="video-options-grid">
                ${videos.map(renderVideoCard).join("")}
            </div>
        </div>
    `;

    container.querySelectorAll(".select-video").forEach(button => {
        button.addEventListener("click", async () => {
            if (!gameState.puedeSubirVideo()) return;

            const video = videos.find(item => item.id === button.dataset.videoId);
            if (!video) return;

            if (video.costo > gameState.player.dinero) {
                alert("No tenés suficiente dinero para producir este video.");
                return;
            }

            button.disabled = true;
            button.textContent = "JUGANDO...";
            const miniType = Number(gameState.player.minigameIndex || 0) % 4;
            let miniScore = 0;
            try {
                miniScore = await runMinigame(miniType);
            } catch (error) {
                console.error("No se pudo completar el minijuego:", error);
                miniScore = 0;
            }
            gameState.player.minigameIndex = (miniType + 1) % 4;

            // El resultado del minijuego es parte real del rendimiento del video.
            // Un fallo no rompe la publicación: simplemente publica peor.
            const miniFactor = 0.72 + (miniScore / 100) * 0.53;
            const resultado = procesarPublicacionTrimestre(
                video.titulo,
                video.enfoquePrincipal,
                video.enfoqueSecundario,
                {
                    costo: video.costo,
                    tituloImpacto: (Number(video.tituloImpacto) || 1) * miniFactor,
                    minigameScore: miniScore
                }
            );
            resultado.minigameScore = miniScore;
            gameState.lastVideoResult.minigameScore = miniScore;
            // Feedback inmediato: un minijuego malo puede hacer que el video falle.
            // La publicación igualmente cuenta y el jugador puede continuar.
            if (miniScore < 35) {
                resultado.miniResultado = "fallo";
                resultado.miniPenalizacion = true;
            } else if (miniScore < 65) {
                resultado.miniResultado = "regular";
            } else if (miniScore < 90) {
                resultado.miniResultado = "bueno";
            } else {
                resultado.miniResultado = "excelente";
            }

            gameState.registrarVideoPublicado();
            gameState.guardar();
            
            // Mostrar pantalla de resultado del minijuego antes de continuar
            window.location.hash = "#videoResult";
        });
    });

    return container;
}

export const publishVideoScreen = { render: renderPublishVideo };
export default publishVideoScreen;
