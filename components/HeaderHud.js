import { gameState } from '../engine/gameState.js';

export function renderHeaderHud() {
  const p = gameState.player;
  
  return `
    <header style="
      background: var(--bg-header-hud);
      border: var(--border-subtle);
      border-radius: 12px;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    ">
      <div>
        <h3 style="margin: 0; font-family: var(--font-heading); color: #fff; font-size: 1.2rem;">
          ${p.canal || 'Mi Canal'}
        </h3>
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          ${p.nombre} | ${p.niche}
        </span>
      </div>

      <!-- Indicador de Tiempo Trimestral -->
      <div style="background: rgba(255, 0, 0, 0.15); border: 1px solid var(--accent-red); padding: 6px 14px; border-radius: 20px; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--accent-red); font-weight: bold; display: block; text-transform: uppercase;">Temporada</span>
        <strong style="font-size: 0.95rem; color: #fff;">Año ${p.año} — Trimestre ${p.trimestre}/3</strong>
      </div>

      <div style="display: flex; gap: 20px;">
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">SUSCRIPTORES</span>
          <strong style="color: var(--accent-red); font-size: 1.1rem; font-family: var(--font-heading);">${p.suscriptores.toLocaleString()}</strong>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">FAMA</span>
          <strong style="color: var(--accent-yellow); font-size: 1.1rem; font-family: var(--font-heading);">${p.fama} pts</strong>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">DINERO</span>
          <strong style="color: var(--accent-green); font-size: 1.1rem; font-family: var(--font-heading);">US$ ${p.dinero.toLocaleString()}</strong>
        </div>
      </div>
    </header>
  `;
}
