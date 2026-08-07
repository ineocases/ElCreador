import { gameState } from '../engine/gameState.js';

export function renderCreateChannel() {
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 600px;
    margin: 40px auto;
    padding: 30px;
    background: var(--bg-card);
    border: var(--border-card);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  `;

  container.innerHTML = `
    <h1 style="font-family: var(--font-heading); font-size: 2.5rem; text-align: center; margin-top: 0; color: var(--accent-green); text-transform: uppercase;">
      Creá tu Creador
    </h1>
    <p style="text-align: center; color: var(--text-muted); margin-bottom: 30px;">
      Configurá la identidad de tu personaje antes de arrancar tu carrera en el streaming.
    </p>

    <form id="create-channel-form" style="display: flex; flex-direction: column; gap: 20px;">
      <div>
        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Tu Nombre o Alias</label>
        <input type="text" id="player-name" required placeholder="Ej: Eros, Spreen, Momo..." style="
          width: 100%;
          padding: 12px 16px;
          background: rgba(0,0,0,0.5);
          border: var(--border-subtle);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          box-sizing: border-box;
        " />
      </div>

      <div>
        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Nombre de tu Canal</label>
        <input type="text" id="channel-name" required placeholder="Ej: ErosPlay, SpreenDMC..." style="
          width: 100%;
          padding: 12px 16px;
          background: rgba(0,0,0,0.5);
          border: var(--border-subtle);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          box-sizing: border-box;
        " />
      </div>

      <div>
        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Elegí tu Nicho Principal</label>
        <select id="channel-niche" style="
          width: 100%;
          padding: 12px 16px;
          background: rgba(0,0,0,0.8);
          border: var(--border-subtle);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          box-sizing: border-box;
        ">
          <option value="Gaming & Fútbol">🎮 Gaming & Fútbol</option>
          <option value="Tecnología & Gadgets">📱 Tecnología & Gadgets</option>
          <option value="Vlogs, IRL & Charla">🎙️ Vlogs, IRL & Charla</option>
        </select>
      </div>

      <button type="submit" style="
        margin-top: 15px;
        padding: 16px;
        background: var(--accent-green);
        color: #000;
        font-family: var(--font-heading);
        font-size: 1.2rem;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: transform 0.2s, background 0.2s;
      ">
        🚀 Iniciar Carrera
      </button>
    </form>
  `;

  // Evento de envio del formulario
  setTimeout(() => {
    const form = container.querySelector('#create-channel-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nombre = container.querySelector('#player-name').value;
      const canal = container.querySelector('#channel-name').value;
      const niche = container.querySelector('#channel-niche').value;

      // Guardar en gameState
      gameState.iniciarPartida({ nombre, canal, niche });

      // Cambiar a la pantalla del dashboard
      window.location.hash = '#dashboard';
    });
  }, 0);

  return container;
}
