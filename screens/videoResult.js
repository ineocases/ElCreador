import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

export function renderVideoResult() {
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  `;

  const draft = gameState.ultimoVideoDraft || { 
    title: "Video Sin Título", 
    clickbait: "Medio",
    attrKey: "carisma",
    attrLabel: "Carisma",
    attrPoints: 1
  };

  // Aplicar mejora de atributo
  if (draft.attrKey && draft.attrPoints) {
    gameState.mejorarAtributo(draft.attrKey, draft.attrPoints);
  }

  // Algoritmo de cálculo según atributos actuales
  const boostCarisma = gameState.player.atributos.carisma * 3;
  const boostEdicion = gameState.player.atributos.edicion * 2;
  const azar = Math.floor(Math.random() * 80) + 20;
  
  const vistasObtenidas = Math.floor((boostCarisma + boostEdicion + azar) * (draft.clickbait === 'Alto' ? 1.5 : 1.0));
  const nuevosSubs = Math.floor(vistasObtenidas * 0.08);
  const dineroGanado = Math.floor(vistasObtenidas * 0.02);

  // Actualizar métricas del jugador
  gameState.player.vistasTotales += vistasObtenidas;
  gameState.sumarSuscriptores(nuevosSubs);
  gameState.sumarDinero(dineroGanado);
  gameState.player.videosSubidos += 1;

  // Avance simulado del rival
  const rivalSubsGanados = Math.floor(Math.random() * 30) + 5;
  gameState.rival.suscriptores += rivalSubsGanados;

  // Evento aleatorio de streamer
  let eventoCreador = null;
  if (vistasObtenidas > 150) {
    eventoCreador = `👀 <strong>Coscu</strong> vio tu video en stream y comentó: <em>"Tiene potencial este pibe"</em> (+5 Fama)`;
    gameState.player.fama += 5;
  }

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="
      background: var(--bg-card);
      border: var(--border-card);
      border-radius: 16px;
      padding: 25px;
      margin-top: 20px;
    ">
      <div style="border-bottom: var(--border-subtle); padding-bottom: 15px; margin-bottom: 20px;">
        <span style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">
          Rendimiento del Video
        </span>
        <h2 style="font-family: var(--font-heading); font-size: 2rem; margin: 5px 0 0 0;">
          "${draft.title}"
        </h2>
      </div>

      <!-- Mejora de Atributo Obtenida -->
      <div style="background: rgba(0, 255, 102, 0.1); border: 1px solid var(--accent-green); padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <span style="color: var(--accent-green); font-weight: bold; font-size: 0.95rem;">
          ▲ ¡MEJORA DE ATRIBUTO! +${draft.attrPoints} en ${draft.attrLabel}
        </span>
      </div>

      <!-- Cuadros de Rendimiento -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">VISTAS</span>
          <strong style="font-size: 1.8rem; color: var(--accent-red); font-family: var(--font-heading);">+${vistasObtenidas.toLocaleString()}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">NUEVOS SUBS</span>
          <strong style="font-size: 1.8rem; color: var(--accent-green); font-family: var(--font-heading);">+${nuevosSubs}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">GANANCIAS</span>
          <strong style="font-size: 1.8rem; color: var(--accent-yellow); font-family: var(--font-heading);">US$ +${dineroGanado}</strong>
        </div>
      </div>

      ${eventoCreador ? `
        <div style="background: rgba(255, 0, 0, 0.1); border: 1px solid var(--accent-red); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          ${eventoCreador}
        </div>
      ` : ''}

      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; border: var(--border-subtle); margin-bottom: 25px;">
        <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Duelo de Rivales</span>
        <p style="margin: 5px 0 0 0; font-size: 0.95rem;">
          Tu rival <strong>${gameState.rival.nombre}</strong> subió contenido este trimestre y acumuló <strong>+${rivalSubsGanados} subs</strong> (Total: ${gameState.rival.suscriptores}).
        </p>
      </div>

      <button onclick="window.location.hash = '#dashboard'" style="
        width: 100%;
        padding: 16px;
        background: #222;
        color: #fff;
        font-family: var(--font-heading);
        font-size: 1.1rem;
        border: var(--border-subtle);
        border-radius: 8px;
        cursor: pointer;
        text-transform: uppercase;
      ">
        Volver al Panel Principal
      </button>
    </div>
  `;

  return container;
}
