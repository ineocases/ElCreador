// screens/publishVideo.js
import videoSystem from '../engine/videoSystem.js';
import gameState from '../engine/gameState.js';

export const publishVideoScreen = {
    render() {
        const container = document.getElementById('ideasContainer');
        if (!container) return;
        
        container.innerHTML = ''; // Limpiar ideas viejas

        // Generamos las 5 ideas nuevas
        const ideas = videoSystem.generateIdeas();

        // Creamos un botón en el HTML por cada idea
        ideas.forEach(idea => {
            const btn = document.createElement('button');
            btn.className = 'idea-btn'; // Tu clase de CSS
            btn.innerText = idea.title;
            
            btn.onclick = () => {
                // 1. Procesamos el video y gastamos la acción
                const result = videoSystem.processVideo(idea);
                gameState.useVideoAction(); 

                // 2. Guardamos el resultado temporalmente para mostrarlo en la otra pantalla
                sessionStorage.setItem('lastVideoResult', JSON.stringify(result));
                
                // 3. Mandamos a la pantalla de resultados
                window.location.hash = '#videoResult';
            };
            
            container.appendChild(btn);
        });
    }
};