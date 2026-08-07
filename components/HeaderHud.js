import { gameState } from '../engine/gameState.js';

export function renderHeaderHud() {
  const { player, rival } = gameState;

  return `
    <div style="
      background: var(--bg-header-hud);
      border: var(--border-card);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    ">
      <!-- Fila 1: Datos del Perfil -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 15px;">
        <div>
          <h1 style="font-family: var(--font-heading); font-size: 2rem; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
            ${player.nombre} <span style="color: var(--accent-red);">- ${player.canal}</span>
          </h1>
          <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">
            NICHO: <strong style="color: #fff;">${player.niche}</strong> | AÑO ${player.año} (T${player.trimestre}) | FAMA: <strong style="color: var(--accent-yellow);">${player.fama}</strong>
          </p>
        </div>
        <div style="background: rgba(0,0,0,0.4); padding: 8px 16px; border-radius: 8px; border: var(--border-subtle); text-align: right;">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">RIVAL DE TEMPORADA</span>
          <strong style="color: var(--text-main); font-size: 0.95rem;">${rival.nombre}</strong>
        </div>
      </div>

      <!-- Fila 2: Cuadros de Estadísticas -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px;">
        <div style="background: var(--bg-slot); padding: 10px; border-radius: 8px; text-align: center;">
          <span style="font-size: 1.5rem; font-family: var(--font-heading); color: var(--accent-green); display: block;">${player.suscriptores.toLocaleString()}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Suscriptores</span>
        </div>
        <div style="background: var(--bg-slot); padding: 10px; border-radius: 8px; text-align: center;">
          <span style="font-size: 1.5rem; font-family: var(--font-heading); color: #fff; display: block;">${player.vistasTotales.toLocaleString()}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Vistas Totales</span>
        </div>
        <div style="background: var(--bg-slot); padding: 10px; border-radius: 8px; text-align: center;">
          <span style="font-size: 1.5rem; font-family: var(--font-heading); color: #fff; display: block;">${player.videosSubidos}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Videos Subidos</span>
        </div>
        <div style="background: var(--bg-slot); padding: 10px; border-radius: 8px; text-align: center;">
          <span style="font-size: 1.5rem; font-family: var(--font-heading); color: var(--accent-yellow); display: block;">US$ ${player.dinero}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Fondos</span>
        </div>
      </div>

      <!-- Fila 3: Atributos del Creador -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
        ${Object.entries(player.atributos).map(([key, value]) => `
          <div style="background: rgba(0,0,0,0.3); padding: 6px; border-radius: 6px; text-align: center; border: var(--border-subtle);">
            <div style="font-size: 1.1rem; font-weight: bold; color: var(--accent-green);">${value} ▲</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">${key}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
