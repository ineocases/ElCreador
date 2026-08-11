// screens/dashboard.js
// CORREGIDO: Encoding, compatibilidad con gameState y pretemporada

import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

export function renderDashboard(el) {

    const container = el || document.getElementById("dashboardScreen");
    if (!container) return;

    const player = gameState.player;

    // Compatibilidad con partidas viejas
    if (!player.atributos) {
        player.atributos = {
            edicion: 10, carisma: 15, algoritmo: 10, marketing: 5,
            constancia: 15, humor: 10, creatividad: 12, networking: 5
        };
    }

    ["humor", "creatividad", "networking"].forEach(attr => {
        if (player.atributos[attr] === undefined) {
            player.atributos[attr] = attr === "humor" ? 10 : attr === "creatividad" ? 12 : 5;
        }
    });

    const hizoPretemporada = !!player.pretemporada;

    const dinero = Number(player.dinero) || 0;
    const suscriptores = Number(player.suscriptores) || 0;
    const vistas = Number(player.vistasTotales) || 0;
    const videos = Number(player.videosSubidos) || 0;
    const fama = Number(player.fama) || 0;
    const comunidad = Number(player.comunidad) || 0;
    const reputacion = Number(player.reputacion) || 50;

    container.innerHTML = `
        <div style="padding:20px; max-width:1000px; margin:0 auto; color:#fff;">

            ${typeof renderHeaderHud === "function" ? renderHeaderHud() : ""}

            ${!hizoPretemporada ? `
                <div style="
                    background: linear-gradient(135deg, rgba(220,38,38,.18), rgba(0,0,0,.35));
                    border: 1px solid var(--accent-red);
                    border-radius: 12px;
                    padding: 22px;
                    margin-bottom: 25px;
                ">
                    <div style="font-size:.75rem; color:var(--accent-red); font-weight:bold; text-transform:uppercase; margin-bottom:6px;">
                        ⚡ Antes de comenzar
                    </div>
                    <h2 style="margin:0 0 8px; font-family:var(--font-heading);">
                        Tu carrera todavía no empezó
                    </h2>
                    <p style="margin:0 0 18px; color:var(--text-muted); line-height:1.5;">
                        Antes de arrancar tu primer trimestre tenés que elegir cómo vas a preparar a tu creador.
                    </p>
                    <a href="#pretemporada" style="
                        display:inline-block;
                        padding:13px 22px;
                        background:var(--accent-red);
                        color:#fff;
                        text-decoration:none;
                        border-radius:8px;
                        font-weight:bold;
                        text-transform:uppercase;
                        font-family:var(--font-heading);
                    ">⚡ Hacer pretemporada</a>
                </div>
            ` : `
                <div style="
                    background: rgba(76,209,55,.08);
                    border: 1px solid rgba(76,209,55,.3);
                    border-radius: 12px;
                    padding: 15px 18px;
                    margin-bottom: 25px;
                ">
                    <strong>✅ Pretemporada completada</strong>
                    <div style="color:var(--text-muted); font-size:.85rem; margin-top:4px;">
                        ${player.pretemporada.entrenamiento}
                    </div>
                </div>
            `}

            <div style="
                display:grid;
                grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));
                gap:15px;
                margin-bottom:20px;
            ">
                ${[
                    ["Suscriptores", suscriptores.toLocaleString()],
                    ["Vistas Totales", vistas.toLocaleString()],
                    ["Videos", videos],
                    ["Fama", fama],
                    ["Comunidad", comunidad],
                    ["Reputación", reputacion]
                ].map(([label, value]) => `
                    <div style="
                        background:var(--bg-card);
                        padding:15px;
                        border-radius:10px;
                        border:var(--border-subtle);
                        text-align:center;
                    ">
                        <div style="font-size:.8rem; color:var(--text-muted); text-transform:uppercase;">
                            ${label}
                        </div>
                        <div style="font-size:1.6rem; font-weight:bold; margin-top:5px;">
                            ${value}
                        </div>
                    </div>
                `).join("")}
            </div>

            <div style="
                background:var(--bg-card);
                padding:20px;
                border-radius:10px;
                border:var(--border-subtle);
                margin-bottom:30px;
            ">
                <h3 style="margin-top:0; color:var(--text-muted); font-size:1rem; text-transform:uppercase;">
                    Mis habilidades
                </h3>
                <div style="display:flex; flex-wrap:wrap; gap:10px;">
                    ${[
                        ["✂️ Edición", "edicion"],
                        ["😎 Carisma", "carisma"],
                        ["🤖 Algoritmo", "algoritmo"],
                        ["📈 Marketing", "marketing"],
                        ["🔥 Constancia", "constancia"],
                        ["😂 Humor", "humor"],
                        ["💡 Creatividad", "creatividad"],
                        ["🤝 Networking", "networking"]
                    ].map(([label, key]) => `
                        <span class="skill-pill">${label}: <strong>${player.atributos[key]}</strong></span>
                    `).join("")}
                </div>
            </div>

            <nav style="display:flex; gap:15px; flex-wrap:wrap; justify-content:center;">
                ${[
                    ["📹 Publicar Video", "#publish", "var(--accent-red)"],
                    ["🛒 Tienda", "#store", "#2f3640"],
                    ["🤝 Colabs", "#collabs", "#2f3640"],
                    ["💼 Sponsors", "#sponsors", "#2f3640"],
                    ["🏆 Premios", "#awards", "#2f3640"],
                    ["⚙️ Admin", "#admin", "#111"]
                ].map(([label, href, bg]) => `
                    <a href="${href}" style="
                        padding:14px 28px;
                        background:${bg};
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                        font-weight:bold;
                        font-family:var(--font-heading);
                        text-transform:uppercase;
                        letter-spacing:1px;
                        ${href === "#admin" ? "border:1px solid #ffd700; color:#ffd700;" : ""}
                    ">${label}</a>
                `).join("")}
            </nav>
        </div>
    `;

    return container;
}

export const dashboardScreen = { render: renderDashboard };
export default dashboardScreen;