// screens/createChannel.js
// CORREGIDO: imports consistentes, flujo correcto hacia pretemporada

import { gameState } from '../engine/gameState.js';
import saveManager from '../engine/saveManager.js';

export function renderCreateChannel(el) {
    const container = el || document.getElementById('createChannelScreen');
    if (!container) return;

    container.innerHTML = `
        <div style="max-width: 600px; margin: 40px auto; padding: 30px; background: var(--bg-card); border: var(--border-card); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); color: #fff;">
            <h1 style="font-family: var(--font-heading); font-size: 2.5rem; text-align: center; margin-top: 0; color: var(--accent-red); text-transform: uppercase;">
                Creá tu Creador
            </h1>
            <p style="text-align: center; color: var(--text-muted); margin-bottom: 30px;">
                Configurá la identidad de tu personaje antes de arrancar tu carrera.
            </p>

            <form id="create-channel-form" style="display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Tu Nombre o Alias</label>
                    <input type="text" id="player-name" required placeholder="Ej: Mateo, Nico..." style="width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.5); border: var(--border-subtle); border-radius: 8px; color: #fff; font-size: 1rem; box-sizing: border-box;" />
                </div>

                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Nombre de tu Canal</label>
                    <input type="text" id="channel-name" required placeholder="Ej: Mateoplay, NicoVlogs..." style="width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.5); border: var(--border-subtle); border-radius: 8px; color: #fff; font-size: 1rem; box-sizing: border-box;" />
                </div>

                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Elegí tu Nicho Principal</label>
                    <select id="channel-niche" style="width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.8); border: var(--border-subtle); border-radius: 8px; color: #fff; font-size: 1rem; box-sizing: border-box;">
                        <option value="Gaming">🎮 Gaming</option>
                        <option value="Fútbol">⚽ Fútbol</option>
                        <option value="Vlog">📹 Vlog & IRL</option>
                        <option value="Tecnología">📱 Tecnología</option>
                        <option value="Cocina">🍳 Cocina</option>
                        <option value="Periodismo">📰 Periodismo</option>
                    </select>
                </div>

                <button type="submit" style="margin-top: 15px; padding: 16px; background: var(--accent-red); color: #fff; font-family: var(--font-heading); font-size: 1.2rem; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">
                    ▶ Ir a Pretemporada
                </button>
            </form>
            <button id="resetSave" type="button" style="display:block;width:100%;margin-top:12px;padding:11px;background:transparent;color:var(--text-muted);border:1px solid rgba(255,255,255,.08);border-radius:8px;">🗑️ Borrar partida guardada</button>
        </div>
    `;

    const reset = container.querySelector('#resetSave');
    reset?.addEventListener('click', () => {
        saveManager.deleteSave();
        gameState.resetPlayer();
        container.querySelector('#player-name').value = '';
        container.querySelector('#channel-name').value = '';
    });

    const form = container.querySelector('#create-channel-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = container.querySelector('#player-name').value;
            const canal = container.querySelector('#channel-name').value;
            const niche = container.querySelector('#channel-niche').value;

            // Iniciar partida con los datos
            gameState.iniciarPartida({ nombre, canal, niche });

            // Guardar la nueva partida
            gameState.guardar();

            // Redirección a pretemporada
            window.location.hash = '#pretemporada';
        });
    }

    return container;
}

export const createChannelScreen = { render: renderCreateChannel };
export default createChannelScreen;