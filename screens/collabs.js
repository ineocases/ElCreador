// screens/collabs.js
// CORREGIDO: Encoding UTF-8, uso consistente de creatorSystem

import { renderHeaderHud } from "../components/HeaderHud.js";
import {
    obtenerCreadoresDisponibles,
    calcularCompatibilidad,
    aumentarRelacion
} from "../engine/creatorSystem.js";
import { gameState } from "../engine/gameState.js";

export function renderCollabs(el) {

    const container = el || document.getElementById("collabsScreen");
    if (!container) return;

    const creators = obtenerCreadoresDisponibles();

    container.innerHTML = `
        ${typeof renderHeaderHud === "function" ? renderHeaderHud() : ""}
        <div style="max-width:900px; margin:25px auto; padding:20px; color:white;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <span style="color:var(--accent-red); font-size:.8rem; font-weight:bold;">
                        🤝 RED DE CREADORES
                    </span>
                    <h1 style="margin:5px 0; font-family:var(--font-heading);">Colaboraciones</h1>
                    <p style="color:var(--text-muted);">Conocé otros creadores y construí relaciones.</p>
                </div>
                <a href="#dashboard" style="color:var(--text-muted); text-decoration:none;">← Volver</a>
            </div>

            ${creators.length === 0 ? `
                <div style="background:var(--bg-card); padding:30px; border-radius:14px; text-align:center;">
                    <h2>Todavía no conocés otros creadores.</h2>
                    <p style="color:var(--text-muted);">Más adelante aparecerán creadores en tu nicho.</p>
                </div>
            ` : `
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px,1fr)); gap:15px;">
                    ${creators.map(creator => {
                        const compatibilidad = calcularCompatibilidad(gameState.player, creator);
                        const relacion = Number(creator.relacion) || 0;
                        return `
                            <div style="background:var(--bg-card); border:var(--border-card); border-radius:14px; padding:20px;">
                                <div style="display:flex; justify-content:space-between;">
                                    <strong style="font-size:1.2rem;">${creator.nombre}</strong>
                                    <span>${creator.nicho}</span>
                                </div>
                                <p style="color:var(--text-muted);">
                                    ${Number(creator.seguidores || 0).toLocaleString()} seguidores
                                </p>
                                <div style="margin:15px 0; background:rgba(255,255,255,.05); padding:12px; border-radius:8px;">
                                    Relación: <strong>${relacion}</strong><br>
                                    Compatibilidad: <strong>${Math.round(compatibilidad)}%</strong>
                                </div>
                                <button class="btn-collab" data-id="${creator.id}" style="
                                    width:100%;
                                    padding:12px;
                                    border:none;
                                    border-radius:8px;
                                    background:var(--accent-red);
                                    color:white;
                                    font-weight:bold;
                                    cursor:pointer;
                                ">🤝 Proponer colaboración</button>
                            </div>
                        `;
                    }).join("")}
                </div>
            `}
        </div>
    `;

    container.querySelectorAll(".btn-collab").forEach(button => {
        button.addEventListener("click", () => {
            const creator = creators.find(c => c.id === button.dataset.id);
            if (!creator) return;

            const compatibilidad = calcularCompatibilidad(gameState.player, creator);
            const chance = compatibilidad / 100;

            if (Math.random() < chance) {
                const vistas = Math.floor(creator.seguidores * 0.08);
                const subs = Math.floor(creator.seguidores * 0.01);

                gameState.player.vistasTotales += vistas;
                gameState.player.suscriptores += subs;
                gameState.player.fama += 5;

                aumentarRelacion(creator, 10);

                creator.colaboraciones = (creator.colaboraciones || 0) + 1;
                if (!gameState.player.stats) gameState.player.stats = {};
                gameState.player.stats.colaboraciones = (gameState.player.stats.colaboraciones || 0) + 1;

                gameState.lastCollab = {
                    creatorId: creator.id,
                    creatorName: creator.nombre,
                    vistas, subs, fama: 5
                };

                gameState.agregarNotificacion({
                    tipo: "collab",
                    titulo: `🤝 ¡Colaboración con ${creator.nombre}!`,
                    descripcion: `La colaboración generó +${subs.toLocaleString()} suscriptores.`
                });

                alert(
                    `🤝 ¡${creator.nombre} aceptó!\n\n` +
                    `+${vistas.toLocaleString()} vistas\n` +
                    `+${subs.toLocaleString()} subs\n` +
                    `+5 fama`
                );

                gameState.guardar();
                renderCollabs(container);
            } else {
                aumentarRelacion(creator, -2);
                alert(`${creator.nombre} rechazó la propuesta por ahora.`);
                gameState.guardar();
                renderCollabs(container);
            }
        });
    });

    return container;
}

export const collabsScreen = { render: renderCollabs };
export default collabsScreen;