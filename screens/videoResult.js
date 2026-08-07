// screens/videoResult.js
import gameState from '../engine/gameState.js';
import eventSystem from '../engine/eventSystem.js';
import saveManager from '../engine/saveManager.js';

export const videoResultScreen = {
    render() {
        // Leemos el resultado del video que acabamos de guardar
        const resultData = sessionStorage.getItem('lastVideoResult');
        if (!resultData) return;
        
        const result = JSON.parse(resultData);
        
        // Mostramos las estadísticas del video
        document.getElementById('resultTitle').innerText = result.title;
        document.getElementById('resultViews').innerText = `👀 ${result.views.toLocaleString()} vistas`;
        document.getElementById('resultSubs').innerText = `👥 +${result.subs.toLocaleString()} subs`;
        document.getElementById('resultMoney').innerText = `💵 +US$${result.money}`;
        document.getElementById('resultFame').innerText = `⭐ +${result.fameGained} fama`;

        const nextBtn = document.getElementById('btnNextAction');
        const eventContainer = document.getElementById('eventContainer');
        eventContainer.innerHTML = ''; // Limpiamos por las dudas

        // LÓGICA DE FIN DE TRIMESTRE
        if (gameState.time.videosAvailable === 0) {
            
            // Verificamos si es fin de año (Trimestre 4)
            if (gameState.time.quarter === 4) {
                eventContainer.innerHTML = `
                    <div class="event-box" style="border-color: gold;">
                        <h3>🏆 ¡El año ha terminado!</h3>
                        <p>Es hora de asistir a los eventos de fin de año.</p>
                    </div>
                `;
                nextBtn.innerText = "Ir a los Coscu Army Awards";
                nextBtn.onclick = () => {
                    saveManager.saveLocal();
                    window.location.hash = '#awards';
                };
            } else {
                // Trimestre normal (1, 2 o 3): Tiramos dados de evento aleatorio
                const randomEvent = eventSystem.triggerRandomEvent();
                eventContainer.innerHTML = `
                    <div class="event-box">
                        <h3>🔔 Evento: ${randomEvent.title}</h3>
                        <p>${randomEvent.message}</p>
                        <strong>${randomEvent.effect ? randomEvent.effect : ''}</strong>
                    </div>
                `;
                nextBtn.innerText = "Avanzar al siguiente trimestre";
                nextBtn.onclick = () => {
                    gameState.nextQuarter();
                    saveManager.saveLocal();
                    window.location.hash = '#dashboard';
                };
            }
        }