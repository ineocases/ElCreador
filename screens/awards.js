```js
// screens/awards.js

import { gameState } from "../engine/gameState.js";
import saveManager from "../engine/saveManager.js";

export const awardsScreen = {

    render() {

        const title =
            document.getElementById("awardsTitle");

        const summary =
            document.getElementById("awardsSummary");

        const btnNextYear =
            document.getElementById("btnNextYear");


        if (!title || !summary) {
            return;
        }


        // =====================================================
        // DATOS ACTUALES
        // =====================================================

        const player =
            gameState.player;

        const año =
            gameState.time?.año ??
            player.año ??
            2026;

        const suscriptores =
            Number(player.suscriptores) || 0;

        const fama =
            Number(player.fama) || 0;


        // =====================================================
        // TÍTULO
        // =====================================================

        title.innerText =
            `🏆 Coscu Army Awards ${año}`;


        // =====================================================
        // PREMIO
        // =====================================================

        let premio =
            "Mención de honor — Seguí participando";


        if (suscriptores >= 100000) {

            premio =
                "Streamer Revelación del Año 🔥";

            player.fama += 10;

        } else if (suscriptores >= 10000) {

            premio =
                "Promesa del Año 🚀";

            player.fama += 5;
        }


        // =====================================================
        // RESUMEN
        // =====================================================

        summary.innerHTML = `

            <p>
                El año terminó y la comunidad
                se reúne para celebrar.
            </p>


            <div class="stats-box">

                <p>
                    <strong>Canal:</strong>
                    ${player.canal || "Mi Canal"}
                </p>


                <p>
                    <strong>
                        Suscriptores totales:
                    </strong>

                    ${suscriptores.toLocaleString()}
                </p>


                <p>
                    <strong>
                        Fama actual:
                    </strong>

                    ${player.fama}/100
                </p>


                <p>
                    <strong>
                        Galardón:
                    </strong>

                    ${premio}
                </p>

            </div>


            <p>
                ¡Preparáte para un nuevo año
                de creación de contenido!
            </p>

        `;


        // =====================================================
        // BOTÓN SIGUIENTE AÑO
        // =====================================================

        if (btnNextYear) {

            btnNextYear.onclick = () => {

                // Avanzamos directamente al siguiente año.
                // No dependemos de una función que todavía
                // no existe en gameState.

                gameState.time.año =
                    Number(gameState.time.año || año) + 1;

                gameState.time.trimestre = 1;


                // Mantener sincronizado el jugador

                gameState.player.año =
                    gameState.time.año;

                gameState.player.trimestre =
                    1;


                // Reiniciar ingresos del trimestre

                gameState.player.ingresosTrimestre =
                    0;


                // Guardar partida

                if (
                    saveManager &&
                    typeof saveManager.saveLocal === "function"
                ) {

                    saveManager.saveLocal();

                }


                // Volver al dashboard

                window.location.hash =
                    "#dashboard";

            };

        }

    }

};


export default awardsScreen;
```
