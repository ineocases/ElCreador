import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

export function renderVideoResult() {
  const container = document.createElement('div');
  container.style.cssText = `max-width: 900px; margin: 20px auto; padding: 0 15px;`;

  const draft = gameState.ultimoVideoDraft || { title: "Video Destacado", attrKey: "carisma", attrLabel: "Carisma", attrPoints: 1 };

  if (draft.attrKey && draft.attrPoints) {
    gameState.mejorarAtributo(draft.attrKey, draft.attrPoints);
  }

  // Cálculos de métricas del trimestre
  const baseVideos = Math.floor(Math.random() * 20) + 10;
  const totalVideos = baseVideos + Math.floor(gameState.player.atributos.constancia / 2);
  const vistas = Math.floor((gameState.player.atributos.carisma * 40 + gameState.player.atributos.edicion * 30 + 100));
  const subs = Math.floor(vistas * 0.05);
  const dinero = Math.floor(vistas * 0.02);

  const trimestreFinalizado = gameState.player.trimestre;
  const añoFinalizado = gameState.player.año;

  gameState.player.vistasTotales += vistas;
  gameState.sumarSuscriptores(subs);
  gameState.sumarDinero(dinero);
  gameState.player.videosSubidos += totalVideos;

  // Actualización del Rival
  const rivalSubsGanados = Math.floor(Math.random() * 30) + 10;
  gameState.rival.suscriptores += rivalSubsGanados;

  // Calculamos si se termina el año (Trimestre 3)
  const esFinDeAño = trimestreFinalizado === 3;
  const notaAño = (Math.min(10, (subs / 50) + 5)).toFixed(1);

  // Avanzar reloj
  gameState.avanzarTrimestre();

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="background: var(--bg-card); border: var(--border-card); border-radius: 16px; padding: 25px; margin-top: 20px;">
      
      <!-- Cierre Anual o Trimestral -->
      ${esFinDeAño ? `
        <div style="background: linear-gradient(180deg, rgba(255,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%); border: 1px solid var(--accent-red); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <span style="color: var(--accent-yellow); font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">🏆 CIERRE DE TEMPORADA ${añoFinalizado}</span>
          <h2 style="font-family: var(--font-heading); font-size: 2.5rem; margin: 5px 0;">NOTA DEL AÑO: ${notaAño} / 10</h2>
          <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">
            ${gameState.player.suscriptores >= gameState.rival.suscriptores ? `Le ganaste el duelo anual a ${gameState.rival.nombre} 🔥` : `Quedaste abajo de ${gameState.rival.nombre} esta temporada 🥊`}
          </p>
        </div>
      ` : ''}

      <div style="border-bottom: var(--border-subtle); padding-bottom: 12px; margin-bottom: 15px;">
        <span style="color: var(--accent-red); font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">REPORTE DE TEMPORADA AÑO ${añoFinalizado} - T${trimestreFinalizado}</span>
        <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin: 4px 0 0 0;">"${draft.title}"</h2>
      </div>

      <!-- Resultado de Pasan Cosas -->
      ${gameState.ultimoEventoResultado ? `
        <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid var(--accent-yellow); padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 0.9rem;">
          ${gameState.ultimoEventoResultado}
        </div>
      ` : ''}

      <!-- Métricas -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; text-align: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">VISTAS T${trimestreFinalizado}</span>
          <strong style="font-size: 1.5rem; color: var(--accent-red); font-family: var(--font-heading); display: block;">+${vistas.toLocaleString()}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; text-align: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">NUEVOS SUBS</span>
          <strong style="font-size: 1.5rem; color: var(--accent-green); font-family: var(--font-heading); display: block;">+${subs}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; text-align: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">GANANCIAS</span>
          <strong style="font-size: 1.5rem; color: var(--accent-yellow); font-family: var(--font-heading); display: block;">US$ +${dinero}</strong>
        </div>
      </div>

      <button id="btn-siguiente" style="
        width: 100%; padding: 16px; background: var(--accent-red); color: #fff; font-family: var(--font-heading); font-size: 1.2rem; border: none; border-radius: 8px; cursor: pointer; text-transform: uppercase;
      ">
        ${esFinDeAño ? `IR A LA PRETEMPORADA ${gameState.player.año} ▶` : `AVANZAR AL TRIMESTRE ${gameState.player.trimestre} ▶`}
      </button>
    </div>
  `;

  setTimeout(() => {
    container.querySelector('#btn-siguiente').addEventListener('click', () => {
      gameState.ultimoEventoResultado = null; // Limpiar evento
      window.location.hash = esFinDeAño ? '#pretemporada' : '#dashboard';
    });
  }, 0);

  return container;
}
