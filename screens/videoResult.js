// screens/videoResult.js
import { gameState } from '../engine/gameState.js';

export function renderVideoResult(el) {
  const container = el || document.getElementById('resultScreen');
  if (!container) return;

  const res = gameState.player.ultimoVideoResultado || {
    titulo: 'Video Subido',
    vistasGanadas: 120,
    subsGanados: 12,
    dineroGanado: 0.50,
    rpmFinal: '1.50',
    esViral: false
  };

  container.innerHTML = `
    <div style="max-width: 600px; margin: 40px auto; padding: 30px; background: var(--bg-card); border: var(--border-card); border-radius: 12px; text-align: center; color: #fff;">
      ${res.esViral ? '<div style="background: #e1b12c; color: #000; padding: 5px 10px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 15px;">🔥 ¡EL VIDEO SE HIZO VIRAL!</div>' : ''}
      
      <h1 style="font-family: var(--font-heading); margin-top: 0;">Rendimiento del Video</h1>
      <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 25px;">"${res.titulo}"</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px;">
          <div style="color: var(--text-muted); font-size: 0.85rem;">VISTAS</div>
          <div style="font-size: 1.6rem; font-weight: bold; color: #00a8ff;">+${res.vistasGanadas.toLocaleString()}</div>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px;">
          <div style="color: var(--text-muted); font-size: 0.85rem;">NUEVOS SUBS</div>
          <div style="font-size: 1.6rem; font-weight: bold; color: #4cd137;">+${res.subsGanados.toLocaleString()}</div>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px;">
          <div style="color: var(--text-muted); font-size: 0.85rem;">INGRESOS</div>
          <div style="font-size: 1.6rem; font-weight: bold; color: #fbc531;">+$${res.dineroGanado.toLocaleString()}</div>
        </div>
        <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px;">
          <div style="color: var(--text-muted); font-size: 0.85rem;">RPM OBTENIDO</div>
          <div style="font-size: 1.6rem; font-weight: bold; color: #e84118;">$${res.rpmFinal}</div>
        </div>
      </div>

      <a href="#pasanCosas" style="display: inline-block; padding: 14px 28px; background: var(--accent-red); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: var(--font-heading); text-transform: uppercase;">
        Continuar ▶
      </a>
    </div>
  `;

  return container;
}

export const videoResultScreen = { render: renderVideoResult };
export default videoResultScreen;
