import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

export function renderDashboard() {
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  `;

  const p = gameState.player;
  const r = gameState.rival;

  // Cálculo de Nivel General (Media de Atributos)
  const attrs = p.atributos;
  const media = Math.round((attrs.edicion + attrs.carisma + attrs.algoritmo + attrs.marketing + attrs.constancia) / 5);

  container.innerHTML = `
    ${renderHeaderHud()}

    <!-- Panel de Carrera Estilo "El Ídolo" -->
    <div style="
      background: var(--bg-card);
      border: var(--border-card);
      border-radius: 16px;
      padding: 25px;
      margin-top: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    ">
      <!-- Encabezado del Creador: Nivel, Nombre y Nicho -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: var(--border-subtle); padding-bottom: 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <!-- Badge de Media/Nivel General -->
          <div style="
            background: radial-gradient(circle, #3d0808 0%, #000 100%);
            border: 2px solid var(--accent-red);
            border-radius: 12px;
            padding: 10px 22px;
            text-align: center;
          ">
            <span style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: bold; color: #fff; line-height: 1;">${media}</span>
            <span style="display: block; font-size: 0.65rem; color: var(--accent-red); text-transform: uppercase; font-weight: bold; margin-top: 2px;">NIVEL</span>
          </div>

          <div>
            <h1 style="margin: 0; font-family: var(--font-heading); font-size: 1.8rem; text-transform: uppercase; color: #fff;">
              ${p.nombre} <span style="font-size: 1rem; color: var(--text-muted); font-weight: normal;">• ${p.canal}</span>
            </h1>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              <span style="color: var(--accent-red); font-weight: bold;">${p.niche}</span> — ${p.edad} Años | Año ${p.año} (Trimestre ${p.trimestre}/3)
            </div>
          </div>
        </div>

        <button onclick="window.location.hash = '#createChannel'" style="
          background: rgba(255,255,255,0.05);
          border: var(--border-subtle);
          color: var(--text-muted);
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
        ">⚙ Recrear</button>
      </div>

      <!-- Fila de Estadísticas Históricas -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <strong style="font-size: 1.6rem; color: #fff; font-family: var(--font-heading); display: block;">${p.videosSubidos}</strong>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">VIDEOS SUBIDOS</span>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <strong style="font-size: 1.6rem; color: #fff; font-family: var(--font-heading); display: block;">${p.vistasTotales.toLocaleString()}</strong>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">VISTAS TOTALES</span>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <strong style="font-size: 1.6rem; color: var(--accent-green); font-family: var(--font-heading); display: block;">${p.suscriptores.toLocaleString()}</strong>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">SUSCRIPTORES</span>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <strong style="font-size: 1.6rem; color: var(--accent-yellow); font-family: var(--font-heading); display: block;">${p.fama}</strong>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">FAMA / REPUTACIÓN</span>
        </div>
      </div>

      <!-- Atributos Técnicos del Creador -->
      <div style="margin-bottom: 20px;">
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 10px;">Atributos del Creador</span>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
          <div style="background: rgba(0,0,0,0.4); border: var(--border-subtle); padding: 10px; border-radius: 8px; text-align: center;">
            <strong style="color: var(--accent-green); font-size: 1.1rem; display: block;">${attrs.edicion} ▲</strong>
            <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Edición</span>
          </div>
          <div style="background: rgba(0,0,0,0.4); border: var(--border-subtle); padding: 10px; border-radius: 8px; text-align: center;">
            <strong style="color: var(--accent-green); font-size: 1.1rem; display: block;">${attrs.carisma} ▲</strong>
            <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Carisma</span>
          </div>
          <div style="background: rgba(0,0,0,0.4); border: var(--border-subtle); padding: 10px; border-radius: 8px; text-align: center;">
            <strong style="color: var(--accent-green); font-size: 1.1rem; display: block;">${attrs.algoritmo} ▲</strong>
            <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Algoritmo</span>
          </div>
          <div style="background: rgba(0,0,0,0.4); border: var(--border-subtle); padding: 10px; border-radius: 8px; text-align: center;">
            <strong style="color: var(--accent-green); font-size: 1.1rem; display: block;">${attrs.marketing} ▲</strong>
            <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Marketing</span>
          </div>
          <div style="background: rgba(0,0,0,0.4); border: var(--border-subtle); padding: 10px; border-radius: 8px; text-align: center;">
            <strong style="color: var(--accent-green); font-size: 1.1rem; display: block;">${attrs.constancia} ▲</strong>
            <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Constancia</span>
          </div>
        </div>
      </div>

      <!-- Tarjeta del Rival Directo -->
      <div style="
        background: linear-gradient(90deg, rgba(20,20,20,0.8) 0%, rgba(45,10,10,0.6) 100%);
        border: var(--border-card);
        padding: 15px 20px;
        border-radius: 12px;
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div>
          <span style="font-size: 0.75rem; color: var(--accent-red); font-weight: bold; text-transform: uppercase;">🥊 Duelo con tu Archirrival</span>
          <h3 style="margin: 3px 0 0 0; font-size: 1.2rem; color: #fff;">
            VS ${r.nombre}
          </h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            ${r.suscriptores.toLocaleString()} subs • ${r.videosSubidos} videos publicados
          </span>
        </div>

        <div style="text-align: right;">
          <span style="font-size: 0.85rem; font-weight: bold; color: ${p.suscriptores >= r.suscriptores ? 'var(--accent-green)' : 'var(--accent-red)'}">
            ${p.suscriptores >= r.suscriptores ? '▲ Vas Ganando el Duelo' : '▼ Vas Abajo en el Duelo'}
          </span>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            Diferencia: ${Math.abs(p.suscriptores - r.suscriptores)} subs
          </div>
        </div>
      </div>

      <!-- Botón de Acción Principal -->
      <button onclick="window.location.hash = '#publish'" style="
        width: 100%;
        padding: 18px;
        background: var(--accent-red);
        color: #fff;
        font-family: var(--font-heading);
        font-size: 1.3rem;
        font-weight: bold;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(255,0,0,0.4);
      ">
        ▶ JUGAR TRIMESTRE ${p.trimestre} (AÑO ${p.año})
      </button>
    </div>
  `;

  return container;
}
