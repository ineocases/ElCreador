// screens/videoResult.js
import gameState from '../engine/gameState.js';
import eventSystem from '../engine/eventSystem.js';
import saveManager from '../engine/saveManager.js';

export const videoResultScreen = {
    render() {
        const resultData = sessionStorage.getItem('lastVideoResult');
        if (!resultData) return;
        
        const result = JSON.parse(resultData);
        
        // Elementos visuales
        const titleEl = document.getElementById('resultTitle');
        const viewsEl = document.getElementById('resultViews');
        const subsEl = document.getElementById('resultSubs');
        const moneyEl = document.getElementById('resultMoney');
        const fameEl = document.getElementById('resultFame');
        const nextBtn = document.getElementById('btnNextAction');
        const eventContainer = document.getElementById('eventContainer');

        if (titleEl) titleEl.innerText = result.title;
        if (viewsEl) viewsEl.innerText = `👀 ${result.views.toLocaleString()} vistas`;
        if (subsEl) subsEl.innerText = `👥 +${result.subs.toLocaleString()} subs`;
        if (moneyEl) moneyEl.innerText = `💵 +US$${result.money}`;
        if (fameEl) fameEl.innerText = `⭐ +${result.fameGained} fama`;

        if (eventContainer) eventContainer.innerHTML = ''; 

        if (nextBtn) {
            // LÓGICA DE FIN DE TRIMESTRE
            if (gameState.time.videosAvailable === 0) {
                if (gameState.time.quarter === 4) {
                    if (eventContainer) {
                        eventContainer.innerHTML = `
                            <div class="event-box" style="border-color: gold; padding: 10px; margin-top: 15px;">
                                <h3>🏆 ¡El año ha terminado!</h3>
                                <p>Es hora de asistir a los eventos de fin de año.</p>
                            </div>
                        `;
                    }
                    nextBtn.innerText = "Ir a los Coscu Army Awards";
                    nextBtn.onclick = () => {
                        saveManager.saveLocal();
                        window.location.hash = '#awards';
                    };
                } else {
                    const randomEvent = eventSystem.triggerRandomEvent();
                    if (eventContainer) {
                        eventContainer.innerHTML = `
                            <div class="event-box" style="padding: 10px; margin-top: 15px;">
                                <h3>🔔 Evento: ${randomEvent.title}</h3>
                                <p>${randomEvent.message}</p>
                                <strong>${randomEvent.effect ? randomEvent.effect : ''}</strong>
                            </div>
                        `;
                    }
                    nextBtn.innerText = "Avanzar al siguiente trimestre";
                    nextBtn.onclick = () => {
                        gameState.nextQuarter();
                        saveManager.saveLocal();
                        window.location.hash = '#dashboard';
                    };
                }
            } else {
                nextBtn.innerText = "Volver al Dashboard";
                nextBtn.onclick = () => {
                    saveManager.saveLocal();
                    window.location.hash = '#dashboard';
                };
            }
        }
    }
};
