// screens/dashboard.js
import gameState from '../engine/gameState.js';

export const dashboardScreen = {
    render() {
        // 1. Actualizamos los textos en el HTML con los datos del estado
        document.getElementById('playerName').innerText = gameState.player.name || "Creador";
        document.getElementById('subsCount').innerText = gameState.player.subs.toLocaleString();
        document.getElementById('moneyCount').innerText = `$${gameState.player.money}`;
        document.getElementById('fameCount').innerText = `${gameState.player.fama}/100`;
        
        // 2. Información del tiempo
        document.getElementById('quarterInfo').innerText = `Año ${gameState.time.year} - Trimestre ${gameState.time.quarter}`;
        document.getElementById('videosLeft').innerText = `Videos disponibles: ${gameState.time.videosAvailable}/3`;

        // 3. Botón para ir a publicar
        const btnPublish = document.getElementById('btnPublish');
        if (btnPublish) {
            btnPublish.onclick = () => {
                if (gameState.time.videosAvailable > 0) {
                    // Cambiamos de pantalla (ajustalo según tu router)
                    window.location.hash = '#publish'; 
                } else {
                    alert("No te quedan videos este trimestre. ¡Avanzá al siguiente!");
                }
            };
        }
    }
};