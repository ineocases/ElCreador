// screens/videoResult.js
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

export function renderVideoResult(el) {
    const container = el || document.getElementById("resultScreen");
    if (!container) return;

    const res = gameState.lastQuarterResult;
    const evento = gameState.ultimoEventoResultado;

    if (!res && evento) {
        container.innerHTML = `
            <div style="max-width:700px;margin:30px auto;padding:20px;color:#fff;">
                ${renderHeaderHud()}
                <div style="background:var(--bg-card);border:var(--border-card);border-radius:16px;padding:30px;text-align:center;">
                    <div style="font-size:3rem;">⚡</div>
                    <h1>PASARON COSAS</h1>
                    <p style="color:var(--text-muted);line-height:1.6;">${evento}</p>
                    <a href="#dashboard" style="display:inline-block;margin-top:20px;padding:14px 28px;background:var(--accent-red);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">CONTINUAR ▶</a>
                </div>
            </div>
        `;
        return container;
    }

    if (!res) {
        container.innerHTML = `${renderHeaderHud()}<div style="max-width:700px;margin:40px auto;text-align:center;"><h2>No hay resultado disponible.</h2><a href="#dashboard">Volver al Dashboard</a></div>`;
        return container;
    }

    const esFinDeAño = gameState.time.trimestre === 2;

    container.innerHTML = `
        <div style="max-width:760px;margin:0 auto;padding:20px;color:#fff;">
            ${renderHeaderHud()}
            
            <div style="background:var(--bg-card);border:var(--border-card);border-radius:16px;padding:30px;">
                <span style="color:var(--accent-red);font-size:.8rem;font-weight:bold;">📊 RESUMEN DEL TRIMESTRE</span>
                <h1 style="font-family:var(--font-heading);margin:8px 0;">Trimestre terminado</h1>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:15px; margin-bottom: 25px;">
                    ${[
                        ["VIDEOS PUBLICADOS", `${res.totalVideos}`, "white"],
                        ["VISTAS TOTALES", `+${res.totalVistas.toLocaleString()}`, "white"],
                        ["SUSCRIPTORES", `+${res.totalSubs.toLocaleString()}`, "#4cd137"],
                        ["INGRESOS", `+$${res.totalDinero.toLocaleString()}`, "#fbc531"],
                        ["FAMA", `+${res.totalFama}`, "#ffd700"]
                    ].map(([label,value,color])=>`
                        <div style="background:rgba(0,0,0,.5);padding:18px;border-radius:10px;">
                            <div style="color:var(--text-muted);font-size:.75rem;">${label}</div>
                            <strong style="display:block;margin-top:5px;font-size:1.5rem;color:${color};">${value}</strong>
                        </div>
                    `).join("")}
                </div>

                <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:20px;">
                    <div style="color:var(--accent-yellow);font-size:.8rem;font-weight:bold;margin-bottom:8px;">🎬 VIDEO DESTACADO DEL TRIMESTRE</div>
                    <h3 style="margin:0 0 10px;color:#fff;">${res.manualVideo.titulo}</h3>
                    <div style="display:flex;gap:15px;flex-wrap:wrap;color:var(--text-muted);font-size:.9rem;">
                        <span>👁️ ${res.manualVideo.vistas.toLocaleString()} vistas</span>
                        <span>👥 +${res.manualVideo.suscriptores.toLocaleString()} subs</span>
                        <span>💰 +$${res.manualVideo.dinero.toLocaleString()}</span>
                        ${res.manualVideo.viral ? '<span style="color:var(--accent-yellow);">🔥 VIRAL</span>' : ''}
                    </div>
                </div>

                <div style="margin-top:25px;text-align:right;">
                    <button id="continueAfterVideo" style="padding:14px 24px;background:var(--accent-red);color:#fff;border:none;border-radius:8px;font-weight:bold;font-family:var(--font-heading);">
                        ${esFinDeAño ? "🏆 TERMINAR AÑO" : "▶ SIGUIENTE TRIMESTRE"}
                    </button>
                </div>
            </div>
        </div>
    `;

    container.querySelector("#continueAfterVideo")?.addEventListener("click", () => {
        if (esFinDeAño) {
            gameState.finalizarAño();
            window.location.hash = "#awards";
            return;
        }
        gameState.nextQuarter();
        gameState.guardar();
        window.location.hash = "#dashboard";
    });

    return container;
}

export const videoResultScreen = { render: renderVideoResult };
export default videoResultScreen;
