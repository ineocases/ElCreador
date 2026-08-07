import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

export function renderPublishVideo() {
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  `;

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="
      background: var(--bg-card);
      border: var(--border-card);
      border-radius: 16px;
      padding: 25px;
      margin-top: 20px;
    ">
      <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin-top: 0; color: var(--accent-red); text-transform: uppercase;">
        🎬 Grabar Nuevo Video
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 25px;">
        Configurá la temática y el enfoque de tu próximo video para el algoritmo.
      </p>

      <form id="publish-form" style="display: flex; flex-direction: column; gap: 20px;">
        <div>
          <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
            Título del Video
          </label>
          <input type="text" id="video-title" required placeholder="Ej: PROBANDO JUEGO NUEVO Y PASA ESTO..." style="
            width: 100%;
            padding: 12px 16px;
            background: rgba(0,0,0,0.6);
            border: var(--border-subtle);
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
            box-sizing: border-box;
          " />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
              Temática
            </label>
            <select id="video-topic" style="
              width: 100%;
              padding: 12px;
              background: rgba(0,0,0,0.8);
              border: var(--border-subtle);
              border-radius: 8px;
              color: #fff;
            ">
              <option value="Gameplay Viral">🎮 Gameplay Viral</option>
              <option value="Reacción a Polémica">🔥 Reacción a Polémica</option>
              <option value="Vlog / Charla">🎙️ Vlog / Charla</option>
              <option value="Tutorial / Unboxing">📦 Tutorial / Unboxing</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
              Nivel de Clickbait
            </label>
            <select id="video-clickbait" style="
              width: 100%;
              padding: 12px;
              background: rgba(0,0,0,0.8);
              border: var(--border-subtle);
              border-radius: 8px;
              color: #fff;
            ">
              <option value="Bajo">🟢 Bajo (Más retención)</option>
              <option value="Medio">🟡 Medio (Equilibrado)</option>
              <option value="Alto">🔴 Alto (Riesgo de crítica)</option>
            </select>
          </div>
        </div>

        <button type="submit" style="
          margin-top: 10px;
          padding: 16px;
          background: var(--accent-red);
          color: #fff;
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          ▶ RENDERIZAR Y PUBLICAR
        </button>
      </form>
    </div>
  `;

  setTimeout(() => {
    const form = container.querySelector('#publish-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const title = container.querySelector('#video-title').value;
      const topic = container.querySelector('#video-topic').value;
      const clickbait = container.querySelector('#video-clickbait').value;

      // Guardamos la configuración del video temporalmente en gameState
      gameState.ultimoVideoDraft = { title, topic, clickbait };

      // Cambiamos a la pantalla de resultados del algoritmo
      window.location.hash = '#videoResult';
    });
  }, 0);

  return container;
}
