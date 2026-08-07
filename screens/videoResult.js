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

  // 1. Aplicar mejora de atributo
  if (draft.attrKey && draft.attrPoints) {
    gameState.mejorarAtributo(draft.attrKey, draft.attrPoints);
  }

  // 2. Simulación del Trimestre (10 a 40 videos producidos)
  const baseVideos = Math.floor(Math.random() * 20) + 10;
  const bonoConstancia = Math.floor(gameState.player.atributos.constancia / 2);
  const totalVideosTrimestre = baseVideos + bonoConstancia;

  // Rendimiento del Video Destacado
  const boostCarisma = gameState.player.atributos.carisma * 4;
  const boostEdicion = gameState.player.atributos.edicion * 3;
  const azarDestacado = Math.floor(Math.random() * 100) + 50;
  const vistasDestacado = Math.floor((boostCarisma + boostEdicion + azarDestacado) * (draft.clickbait === 'Alto' ? 1.4 : 1.0));

  // Rendimiento del resto de los videos del trimestre (Simulados)
  const promedioVistasPorVideo = Math.floor((boostCarisma + boostEdicion) * 0.4) + 15;
  const vistasSecundarias = (totalVideosTrimestre - 1) * promedioVistasPorVideo;

  // Totales Trimestrales
  const vistasTotalesTrimestre = vistasDestacado + vistasSecundarias;
  const conversionSubs = 0.05 + (gameState.player.atributos.algoritmo * 0.002);
  const subsGanadosTrimestre = Math.floor(vistasTotalesTrimestre * conversionSubs);
  
  const cpm = 0.015 + (gameState.player.atributos.marketing * 0.001);
  const dineroGanadoTrimestre = Math.floor(vistasTotalesTrimestre * cpm);

  // Actualizar estado global del jugador
  const trimestreActual = gameState.player.trimestre;
  const añoActual = gameState.player.año;

  gameState.player.vistasTotales += vistasTotalesTrimestre;
  gameState.sumarSuscriptores(subsGanadosTrimestre);
  gameState.sumarDinero(dineroGanadoTrimestre);
  gameState.player.videosSubidos += totalVideosTrimestre;

  // Simulación del Rival en el Trimestre
  const rivalVideos = Math.floor(Math.random() * 15) + 10;
  const rivalSubsGanados = Math.floor(Math.random() * 40) + 15;
  gameState.rival.suscriptores += rivalSubsGanados;
  gameState.rival.videosSubidos += rivalVideos;

  // Avanzar reloj del juego
  gameState.avanzarTrimestre();

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="
      background: var(--bg-card);
      border: var(--border-card);
      border-radius: 16px;
      padding: 25px;
      margin-top: 20px;
    ">
      <!-- Encabezado Estilo Reporte de Temporada -->
      <div style="border-bottom: var(--border-subtle); padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <span style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">
            📊 REPORTE DE TEMPORADA (AÑO ${añoActual} - T${trimestreActual})
          </span>
          <h2 style="font-family: var(--font-heading); font-size: 2rem; margin: 5px 0 0 0;">
            Resultados del Trimestre
          </h2>
        </div>
        <span style="background: rgba(255,255,255,0.08); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; color: var(--text-muted);">
          🎥 Total videos subidos: <strong>${totalVideosTrimestre}</strong>
        </span>
      </div>

      <!-- Tarjeta del Video Destacado -->
      <div style="background: rgba(0,0,0,0.4); border: var(--border-subtle); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <span style="font-size: 0.75rem; color: var(--accent-yellow); font-weight: bold; text-transform: uppercase;">
          ⭐ Video Principal del Trimestre
        </span>
        <h3 style="margin: 5px 0 8px 0; font-size: 1.1rem; color: #fff;">
          "${draft.title}"
        </h3>
        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">
          Consiguió <strong>${vistasDestacado.toLocaleString()} vistas</strong> y sumó <strong style="color: var(--accent-green);">+${draft.attrPoints} en ${draft.attrLabel}</strong>.
        </p>
      </div>

      <!-- Métricas Totales del Trimestre -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
        <div style="background: rgba(0,0,0,0.6); padding: 18px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">VISTAS TOTALES</span>
          <strong style="font-size: 1.8rem; color: var(--accent-red); font-family: var(--font-heading);">+${vistasTotalesTrimestre.toLocaleString()}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.6); padding: 18px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">NUEVOS SUBS</span>
          <strong style="font-size: 1.8rem; color: var(--accent-green); font-family: var(--font-heading);">+${subsGanadosTrimestre.toLocaleString()}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.6); padding: 18px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">INGRESOS EN T${trimestreActual}</span>
          <strong style="font-size: 1.8rem; color: var(--accent-yellow); font-family: var(--font-heading);">US$ +${dineroGanadoTrimestre}</strong>
        </div>
      </div>

      <!-- Comparativa con el Rival -->
      <div style="background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 25px;">
        <span style="font-size: 0.8rem; color: var(--accent-red); font-weight: bold; text-transform: uppercase;">🥊 Rendimiento del Rival (${gameState.rival.nombre})</span>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: var(--text-main);">
          Subió <strong>${rivalVideos} videos</strong> este trimestre acumulando <strong>+${rivalSubsGanados} subs</strong>. Total del rival: <strong>${gameState.rival.suscriptores} subs</strong>.
        </p>
      </div>

      <button onclick="window.location.hash = '#dashboard'" style="
        width: 100%;
        padding: 16px;
        background: var(--accent-red);
        color: #fff;
        font-family: var(--font-heading);
        font-size: 1.1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
      ">
        Avanzar al Trimestre ${gameState.player.trimestre} (Año ${gameState.player.año}) ▶
      </button>
    </div>
  `;

  return container;
}
