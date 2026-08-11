// screens/videoResult.js
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

export function renderVideoResult(el) {
    const container = el || document.getElementById("resultScreen");
    if (!container) return;

    const res = gameState.lastVideoResult;
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

    const vistas = Number(res.vistas) || 0;
    const subs = Number(res.suscriptores) || 0;
    const dinero = Number(res.dinero) || 0;
    const fama = Number(res.famaGanada) || 0;
    const viral = Boolean(res.viral);
    const esFinDeAño = gameState.time.trimestre === 2;

    let titulo = "NORMAL";
    if (res.nivelViralidad === "fenomeno") titulo = "🌎 FENÓMENO";
    else if (res.nivelViralidad === "mega_viral") titulo = "🚀 MEGA VIRAL";
    else if (viral) titulo = "🔥 VIRAL";
    else if (vistas >= 10000) titulo = "📈 EXCELENTE";
    else if (vistas >= 3000) titulo = "👍 BUENO";

    container.innerHTML = `
        <div style="max-width:760px;margin:0 auto;padding:20px;color:#fff;">
            ${renderHeaderHud()}
            ${viral ? `<div style="background:rgba(255,215,0,.12);border:2px solid var(--accent-yellow);border-radius:16px;padding:20px;text-align:center;margin-bottom:18px;"><div style="font-size:2.4rem;">🔥🔥🔥</div><h2>¡EL VIDEO SE HIZO VIRAL!</h2></div>` : ""}

            <div style="background:var(--bg-card);border:var(--border-card);border-radius:16px;padding:30px;">
                <span style="color:var(--accent-red);font-size:.8rem;font-weight:bold;">📹 RESULTADO DEL VIDEO</span>
                <h1 style="font-family:var(--font-heading);margin:8px 0;">${res.titulo}</h1>
                <div style="color:var(--accent-green);font-weight:bold;margin-bottom:25px;">${titulo}</div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:15px;">
                    ${[
                        ["VISTAS", `+${vistas.toLocaleString()}`, "white"],
                        ["SUSCRIPTORES", `+${subs.toLocaleString()}`, "#4cd137"],
                        ["INGRESOS", `+$${dinero.toLocaleString()}`, "#fbc531"],
                        ["FAMA", `+${fama}`, "#ffd700"]
                    ].map(([label,value,color])=>`<div style="background:rgba(0,0,0,.5);padding:18px;border-radius:10px;"><div style="color:var(--text-muted);font-size:.75rem;">${label}</div><strong style="display:block;margin-top:5px;font-size:1.5rem;color:${color};">${value}</strong></div>`).join("")}
                </div>

                ${esFinDeAño ? `
                    <div style="margin-top:22px;padding:16px;border-radius:10px;background:rgba(229,9,20,.08);border:1px solid rgba(229,9,20,.35);">
                        🏆 Este fue tu video del <strong>Trimestre 2</strong>. Al continuar se simularán entre <strong>30 y 150 videos</strong> del resto de la plataforma y terminará el año.
                    </div>
                ` : `
                    <div style="margin-top:22px;padding:16px;border-radius:10px;background:rgba(76,209,55,.08);border:1px solid rgba(76,209,55,.25);">
                        ✅ Trimestre ${gameState.time.trimestre}/2 completado. Al continuar pasarás al Trimestre ${gameState.time.trimestre + 1}/2.
                    </div>
                `}

                <div style="margin-top:25px;text-align:right;">
                    <button id="continueAfterVideo" style="padding:14px 24px;background:var(--accent-red);color:#fff;border:none;border-radius:8px;font-weight:bold;font-family:var(--font-heading);">
                        ${esFinDeAño ? "🏆 TERMINAR AÑO" : "▶ SIGUIENTE TRIMESTRE"}
                    </button>
                </div>
            </div>
        </div>
    `;

    container.querySelector("#continueAfterVideo")?.addEventListener("click", () => {
        if (gameState.time.trimestre === 2) {
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
