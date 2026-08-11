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
        container.innerHTML = `${renderHeaderHud()}<div style="max-width:700px;margin:40px auto;padding:30px;background:var(--bg-card);border-radius:16px;text-align:center;"><h2>Ya publicaste tu video este trimestre.</h2><p style="color:var(--text-muted);">No podés subir otro hasta avanzar al próximo trimestre.</p><a href="#dashboard" style="color:var(--accent-red);">Volver al dashboard</a></div>`;
        return container;
    }

    const videos = generarVideos(gameState.player);

    const renderVideoCard = video => `
        <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:18px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <div>
                    <h2 style="margin:0 0 7px;color:#fff;font-size:1.1rem;">${video.titulo}</h2>
                    <div style="color:var(--text-muted);font-size:.85rem;">${video.formato} · ${video.tema}</div>
                </div>
                <strong style="white-space:nowrap;color:${video.costo===0?'var(--accent-green)':'var(--accent-red)'};">${video.costo===0?'GRATIS':'$'+video.costo.toLocaleString()}</strong>
            </div>
            <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <span style="color:var(--text-muted);font-size:.8rem;">Riesgo: ${"⭐".repeat(Math.max(1,Math.min(5,Math.ceil(video.riesgo/20))))}</span>
                <button class="select-video" data-video-id="${video.id}" style="padding:10px 16px;background:var(--accent-red);color:#fff;border:none;border-radius:8px;font-weight:bold;">PUBLICAR</button>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div style="max-width:760px;margin:0 auto;padding:20px;">
            ${renderHeaderHud()}
            <div style="margin:25px 0;">
                <div style="color:var(--accent-red);font-size:.8rem;font-weight:bold;">TRIMESTRE ${gameState.time.trimestre}/2</div>
                <h1 style="font-family:var(--font-heading);margin:6px 0;">📹 Elegí tu video</h1>
                <p style="color:var(--text-muted);">Este trimestre podés publicar exactamente 1 video manualmente. El resto de tu actividad se procesará al finalizar.</p>
            </div>
            ${videos.map(renderVideoCard).join("")}
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

            gameState.player.dinero -= video.costo;

            // Usamos la nueva función que procesa el video manual + simulación del trimestre
            const resultado = procesarPublicacionTrimestre(
                video.titulo,
                video.formato,
                video.tema
            );

            gameState.registrarVideoPublicado();
            gameState.lastVideo = video;
            gameState.guardar();

            window.location.hash = "#videoResult";
        });
    });

    return container;
}

export const publishVideoScreen = { render: renderPublishVideo };
export default publishVideoScreen;
