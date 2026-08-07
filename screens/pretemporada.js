import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

const bancoCartas = [
  { titulo: "CURSO RÁPIDO DE PREMIERE", tipo: "RARA", attr: "edicion", pts: 4, desc: "Aprendés a cortar silencios y meter memes como un pro.", color: "var(--accent-yellow)" },
  { titulo: "SETUP NUEVO EN CUOTAS", tipo: "COMÚN", attr: "algoritmo", pts: 3, desc: "Mejorás la calidad de imagen y el algoritmo te premia.", color: "var(--accent-green)" },
  { titulo: "CURSO DE TEATRO E IMPRO", tipo: "RARA", attr: "carisma", pts: 4, desc: "Aprendés a soltarte más frente a la cámara.", color: "var(--accent-yellow)" },
  { titulo: "ESTRATEGIA DE CONTENIDO EN TIKTOK", tipo: "COMÚN", attr: "marketing", pts: 3, desc: "Subís clips resumidos para atraer tráfico nuevo.", color: "var(--accent-green)" },
  { titulo: "DISCIPLINA DE STREAMER", tipo: "ÉPICA", attr: "constancia", pts: 5, desc: "Horarios fijos y rutina estricta de grabación.", color: "var(--accent-red)" }
];

export function renderPretemporada() {
  const container = document.createElement('div');
  container.style.cssText = `max-width: 900px; margin: 20px auto; padding: 0 15px;`;

  // Seleccionar 3 cartas aleatorias
  const opciones = [...bancoCartas].sort(() => 0.5 - Math.random()).slice(0, 3);

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="background: var(--bg-card); border: var(--border-card); border-radius: 16px; padding: 25px; margin-top: 20px;">
      <span style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">
        ⚡ PRETEMPORADA DE CONTENIDO ${gameState.player.año}
      </span>
      <h2 style="font-family: var(--font-heading); font-size: 2rem; margin: 5px 0 10px 0;">
        Elegí 1 Entrenamiento Anual
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 25px;">
        El dado trajo tres mejoras de inicio de año. Seleccioná una para potenciar a tu creador:
      </p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        ${opciones.map((c, idx) => `
          <div class="carta-box interactive-card" data-idx="${idx}" style="
            background: rgba(0,0,0,0.6); border: 1px solid ${c.color}; padding: 20px; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;
          ">
            <div>
              <span style="background: ${c.color}; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">
                ${c.tipo}
              </span>
              <h3 style="font-size: 1.1rem; margin: 12px 0 8px 0; color: #fff;">${c.titulo}</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${c.desc}</p>
            </div>
            <strong style="color: var(--accent-green); font-size: 1.1rem; margin-top: 15px; text-align: center;">
              +${c.pts} ${c.attr.toUpperCase()} ▲
            </strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  setTimeout(() => {
    const cards = container.querySelectorAll('.carta-box');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-idx'));
        const elegida = opciones[idx];

        gameState.mejorarAtributo(elegida.attr, elegida.pts);
        window.location.hash = '#dashboard';
      });
    });
  }, 0);

  return container;
}
