// screens/awards.js
import gameState from '../engine/gameState.js';
import saveManager from '../engine/saveManager.js';

export const awardsScreen = {
    render() {
        const title = document.getElementById('awardsTitle');
        const summary = document.getElementById('awardsSummary');
        const btnNextYear = document.getElementById('btnNextYear');

        if (!title || !summary) return;

        // Textos del evento
        title.innerText = `🏆 Coscu Army Awards ${gameState.time.year}`;
        
        // Evaluamos cómo le fue al jugador para darle un premio o un mensaje
        let premio = "Mención de honor (Seguí participando)";
        if (gameState.player.subs > 100000) {
            premio = "Streamer Revelación del Año 🔥";
            gameState.player.fama += 10;
        } else if (gameState.player.subs > 10000) {
            premio = "Promesa del Año 🚀";
            gameState.player.fama += 5;
        }

        // Armamos el resumen visual
        summary.innerHTML = `
            <p>El año terminó y la comunidad se reúne para celebrar.</p>
            <div class="stats-box">
                <p><strong>Canal:</strong> ${gameState.player.channelName}</p>
                <p><strong>Suscriptores totales:</strong> ${gameState.player.subs.toLocaleString()}</p>
                <p><strong>Fama actual:</strong> ${gameState.player.fama}/100</p>
                <p><strong>Galardón:</strong> ${premio}</p>
            </div>
            <p>¡Preparate para un nuevo año de creación de contenido!</p>
        `;

        // Botón para avanzar al siguiente año
        btnNextYear.onclick = () => {
            // Avanzamos el trimestre (esto automáticamente pasará el año a +1 y el trimestre a 1)
            gameState.nextQuarter();
            saveManager.saveLocal();
            
            // Volvemos al dashboard para arrancar el nuevo año
            window.location.hash = '#dashboard';
        };
    }
};