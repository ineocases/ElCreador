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
        // DATOS ACTUALES DEL JUGADOR
        // =====================================================

        const player = gameState.player;

        const año =
            gameState.time?.año ??
            player.año ??
            2026;

        const suscriptores =
            Number(player.suscriptores) || 0;

        const fama =
            Number(player.fama) || 0;

        const canal =
            player.canal ||
            player.nombre ||
            "Mi Canal";


        // =====================================================
        // PREMIO
        // =====================================================

        let premio =
            "Mención de honor — Seguí participando";

        let famaPremio = 0;


        if (suscriptores >= 100000) {

            premio =
                "🏆 Streamer Revelación del Año";

            famaPremio = 10;

        } else if (suscriptores >= 10000) {

            premio =
                "🥉 Promesa del Año";

            famaPremio = 5;
        }


        // Aplicamos la fama una sola vez
        if (famaPremio > 0) {

            player.fama =
                Number(player.fama || 0) +
                famaPremio;

        }


        // =====================================================
        // TÍTULO
        // =====================================================

        title.innerText =
            `🏆 Coscu Army Awards ${año}`;


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
                    ${canal}
                </p>


                <p>
                    <strong>Suscriptores totales:</strong>
                    ${suscriptores.toLocaleString()}
                </p>


                <p>
                    <strong>Fama actual:</strong>
                    ${Number(player.fama || 0)}/100
                </p>


                <p>
                    <strong>Galardón:</strong>
                    ${premio}
                </p>

            </div>


            <p>
                ¡Preparate para un nuevo año
                de creación de contenido!
            </p>
        `;


        // =====================================================
        // SIGUIENTE AÑO
        // =====================================================

        if (btnNextYear) {

            btnNextYear.onclick = () => {

                // Pasamos al siguiente año
                gameState.time.año += 1;

                gameState.time.trimestre = 1;

                // También mantenemos el año del jugador
                gameState.player.año =
                    gameState.time.año;


                // Reiniciamos ingresos del trimestre
                gameState.player.ingresosTrimestre = 0;


                // Guardamos
                if (
                    saveManager &&
                    typeof saveManager.saveLocal === "function"
                ) {

                    saveManager.saveLocal();

                }


                // Volvemos al dashboard
                window.location.hash =
                    "#dashboard";

            };

        }

    }

};


export default awardsScreen;
