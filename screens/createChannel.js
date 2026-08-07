// screens/createChannel.js
import gameState from '../engine/gameState.js';
import saveManager from '../engine/saveManager.js';

export const createChannelScreen = {
    render() {
        const container = document.getElementById('createChannelScreen');
        if (!container) return;

        container.innerHTML = `
            <div class="auth-box" style="max-width: 500px; margin: 50px auto; text-align: left; padding: 20px; background: #121214; border-radius: 12px; color: white;">
                <h2 style="text-align: center; color: #00ff88;">🇦🇷 Configura tu Creador</h2>
                
                <div style="margin-bottom: 15px;">
                    <label>Nombre del Canal / Streamer:</label><br>
                    <input type="text" id="inputChannelName" placeholder="Ej: ElRanaStream" style="width: 100%; padding: 8px; margin-top: 5px; background: #202024; border: 1px solid #323238; color: white;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label>Nicho Principal:</label><br>
                    <select id="selectNiche" style="width: 100%; padding: 8px; margin-top: 5px; background: #202024; border: 1px solid #323238; color: white;">
                        <option value="gaming_futbol">⚽ Gaming & Fútbol (Estilo Davo / Momo)</option>
                        <option value="tech">📱 Tecnología & Gadgets (Estilo SupraPixel)</option>
                        <option value="irl_vlog">🎙️ Vlogs, IRL & Charla (Estilo Mernuel)</option>
                    </select>
                </div>

                <button id="btnStartGame" style="width: 100%; padding: 12px; background: #00ff88; color: black; font-weight: bold; border: none; cursor: pointer; border-radius: 6px; margin-top: 10px;">
                    ¡Empezar la Carrera! 🚀
                </button>
            </div>
        `;

        document.getElementById('btnStartGame').onclick = () => {
            const name = document.getElementById('inputChannelName').value.trim();
            const niche = document.getElementById('selectNiche').value;

            if (!name) {
                alert("Por favor ingresa un nombre para tu canal.");
                return;
            }

            // Guardamos en el estado global
            gameState.player.channelName = name;
            gameState.player.niche = niche;
            gameState.player.subs = 1000;
            gameState.player.fama = 5;

            saveManager.saveLocal();
            saveManager.saveToFirebase();

            window.location.hash = '#dashboard';
        };
    }
};
