import { renderHeaderHud } from '../components/HeaderHud.js';

export function renderDashboard() {
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  `;

  container.innerHTML = `
    <!-- Renderizado del HUD Superior estilo El Ídolo -->
    ${renderHeaderHud()}

    <!-- Acciones del Trimestre -->
    <div style="
      background: var(--bg-card);
      border: var(--border-card);
      border-radius: 16px;
      padding: 25px;
      margin-top: 20px;
    ">
      <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin-top: 0; text-transform: uppercase;">
        Acciones del Trimestre
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem;">
        Elegí qué querés hacer durante este trimestre para potenciar tu canal.
      </p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
        <button onclick="window.location.hash = '#publish'" style="
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border: var(--border-card);
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          text-align: center;
          transition: border-color 0.2s;
        ">
          <div style="font-size: 2rem; margin-bottom: 8px;">🎬</div>
          <strong style="display: block; font-size: 1rem;">Grabar Video</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Crear contenido y subirlo</span>
        </button>

        <button onclick="window.location.hash = '#collabs'" style="
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border: var(--border-card);
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          text-align: center;
        ">
          <div style="font-size: 2rem; margin-bottom: 8px;">🤝</div>
          <strong style="display: block; font-size: 1rem;">Colaboraciones</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Buscar otros streamers</span>
        </button>

        <button onclick="window.location.hash = '#store'" style="
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border: var(--border-card);
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          text-align: center;
        ">
          <div style="font-size: 2rem; margin-bottom: 8px;">🛒</div>
          <strong style="display: block; font-size: 1rem;">Tienda & Equipos</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Mejorar setup y atributos</span>
        </button>
      </div>
    </div>
  `;

  return container;
}
