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
                <span>🎯 ${video.enfoquePrincipal}</span>
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
                video.enfoquePrincipal,
                video.enfoqueSecundario,
                { tituloImpacto: video.tituloImpacto, tituloHook: video.tituloHook }
            );

            gameState.registrarVideoPublicado();
            gameState.lastVideo = video;
            gameState.guardar();

            // El cierre del trimestre pasa siempre por la misma puerta.
            // Si hubo un evento, Pasan Cosas lo muestra; si no hubo, la pantalla
            // avanza sola al siguiente trimestre/año sin mostrar un resumen intermedio.
            window.location.hash = "#pasanCosas";
        });
    });

    return container;
}

export const publishVideoScreen = { render: renderPublishVideo };
export default publishVideoScreen;
