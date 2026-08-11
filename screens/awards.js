// screens/awards.js
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

export function renderAwards(el) {
    const container = el || document.getElementById("awardsScreen");
    if (!container) return;

    const player = gameState.player;
    const año = gameState.time.año;
    const subs = Number(player.suscriptores) || 0;
    const famaAntes = Number(player.fama) || 0;
    const simulacion = gameState.ultimaSimulacionAnual;

    let premio = "🏅 Mención de honor";
    let famaPremio = 0;

    if (subs >= 1000000) {
        premio = "🏆 Streamer del Año";
        famaPremio = 25;
    } else if (subs >= 100000) {
        premio = "🌟 Streamer Revelación del Año";
        famaPremio = 10;
    } else if (subs >= 10000) {
        premio = "🚀 Promesa del Año";
        famaPremio = 5;
    }

    const flag = `awards_${año}_applied`;
    if (famaPremio > 0 && !player[flag]) {
        player.fama = famaAntes + famaPremio;
        player[flag] = true;
        gameState.guardar();
    }

    const famaActual = Number(player.fama) || 0;
    const videosSimulados = Number(simulacion?.videosPlataforma) || 0;

    container.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:20px;color:#fff;">
            ${renderHeaderHud()}
            <div style="background:var(--bg-card);border:var(--border-card);border-radius:16px;padding:35px;text-align:center;">
                <div style="font-size:4rem;">🏆</div>
                <span style="color:var(--accent-red);font-size:.8rem;font-weight:bold;">CEREMONIA ANUAL</span>
                <h1 style="font-family:var(--font-heading);margin:10px 0;">Coscu Army Awards ${año}</h1>
                <p style="color:var(--text-muted);">Terminaste los 2 trimestres del año.</p>

                <div class="stats-box" style="text-align:left;">
                    <p><strong>Canal:</strong> ${player.canal}</p>
                    <p><strong>Suscriptores:</strong> ${subs.toLocaleString()}</p>
                    <p><strong>Fama:</strong> ${famaActual}/100</p>
                    <p><strong>Galardón:</strong> ${premio}</p>
                    <p><strong>Videos de la plataforma simulados:</strong> ${videosSimulados.toLocaleString()}</p>
                </div>

                <button id="btnNextYear" style="margin-top:25px;padding:16px 30px;background:var(--accent-red);color:#fff;border:none;border-radius:8px;font-family:var(--font-heading);font-weight:bold;">
                    ▶ EMPEZAR AÑO ${año + 1}
                </button>
            </div>
        </div>
    `;

    container.querySelector("#btnNextYear")?.addEventListener("click", () => {
        gameState.nextQuarter();
        gameState.ultimaSimulacionAnual = null;
        gameState.guardar();
        window.location.hash = "#pretemporada";
    });

    return container;
}

export const awardsScreen = { render: renderAwards };
export default awardsScreen;
