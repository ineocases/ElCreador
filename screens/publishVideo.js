// screens/publishVideo.js
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";
import { generarVideos, procesarPublicacionTrimestre } from "../engine/videoSystem.js";

export function renderPublishVideo(el) {
    const container = el || document.getElementById("publishScreen");
    if (!container) return;

    if (!gameState.player.pretemporada) {
        container.innerHTML = `${renderHeaderHud()}<div style="max-width:700px;margin:40px auto;padding:30px;background:var(--bg-card);border-radius:16px;text-align:center;"><h2>Primero hacé la pretemporada.</h2><a href="#pretemporada">Ir a pretemporada</a></div>`;
        return container;
    }

    if (!gameState.puedeSubirVideo()) {
        container.innerHTML = `${renderHeaderHud()}<div style="max-width:700px;margin:40px auto;padding:30px;background:var(--bg-card);border-radius:16px;text-align:center;"><h2>Ya elegiste el video de esta temporada.</h2><p style="color:var(--text-muted);">Cada año elegís un solo video. Cuando termine, avanzás al próximo año.</p><a href="#dashboard" style="color:var(--accent-red);">Volver al dashboard</a></div>`;
        return container;
    }

    const videos = generarVideos(gameState.player);

    const renderVideoCard = video => `
        <article class="video-option-card">
            <div class="video-option-top">
                <span class="video-option-tag ${video.costo === 0 ? 'free' : video.costo <= 35 ? 'cheap' : 'premium'}">
                    ${video.costo === 0 ? 'GRATIS' : '$' + video.costo.toLocaleString()}
                </span>
                <span class="video-risk">RIESGO ${Math.max(1, Math.min(5, Math.ceil(video.riesgo / 20)))} / 5</span>
            </div>
            <h2>${video.titulo}</h2>
            <p class="video-option-meta">${video.formato} · ${video.tema}</p>
            <div class="video-option-bottom">
                <span>🎯 ${video.enfoquePrincipal} · ${Math.round((Number(gameState.player.atributos?.[video.enfoquePrincipal])||0)*1.5)} sinergia</span>
                <button class="select-video btn primary" data-video-id="${video.id}">PUBLICAR</button>
            </div>
        </article>
    `;

    container.innerHTML = `
        <div style="max-width:760px;margin:0 auto;padding:20px;">
            ${renderHeaderHud()}
            <div style="margin:25px 0;">
                <div style="color:var(--accent-red);font-size:.8rem;font-weight:bold;">TEMPORADA ${gameState.time.año}</div>
                <h1 style="font-family:var(--font-heading);margin:6px 0;">📹 Elegí tu video</h1>
                <p style="color:var(--text-muted);">Elegí el único video de tu año. Una decisión, un resultado y seguimos con tu carrera.</p>
            </div>
            <div class="video-options-grid">
                ${videos.map(renderVideoCard).join("")}
            </div>
        </div>
    `;

    container.querySelectorAll(".select-video").forEach(button => {
        button.addEventListener("click", () => {
            if (!gameState.puedeSubirVideo()) return;

            const video = videos.find(item => item.id === button.dataset.videoId);
            if (!video) return;

            if (video.costo > gameState.player.dinero) {
                alert("No tenés suficiente dinero para producir este video.");
                return;
            }

            gameState.pendingVideoSelection = { ...video };
            gameState.pendingMinigame = { type: "videoSetup", title: video.titulo, text: "Elegí cómo presentar tu video: una buena miniatura y el horario correcto pueden cambiar su rendimiento.", createdAt: Date.now() };
            gameState.guardar();
            window.location.hash = "#minigame";
        });
    });

    return container;
}

export const publishVideoScreen = { render: renderPublishVideo };
export default publishVideoScreen;
