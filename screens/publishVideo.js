import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

// Banco de ideas de títulos por nicho
const videoIdeas = {
  "Gaming & Fútbol": [
    { title: "Probando la nueva actualización de FIFA / EA FC", topic: "Gameplay", boost: 1.1 },
    { title: "Sobrevivo 100 días en Minecraft Hardcore", topic: "Gaming", boost: 1.3 },
    { title: "Jugando a 'El Ídolo': ¿El mejor juego argentino?", topic: "Gameplay", boost: 1.2 },
    { title: "Reacción al partido de la fecha en la Liga Argentina", topic: "Reacción", boost: 1.15 },
    { title: "Debate Futbolístico: Top 10 mejores promesas", topic: "Charla", boost: 1.05 },
    { title: "Probando juegos insólitos de la Play Store", topic: "Gaming", boost: 1.0 }
  ],
  "Tecnología & Gadgets": [
    { title: "Unboxing y prueba del celular más caro del mercado", topic: "Unboxing", boost: 1.25 },
    { title: "Armé la PC Gamer de mis sueños y pasó esto...", topic: "Tech", boost: 1.3 },
    { title: "5 Gadgets insólitos que compré por internet", topic: "Review", boost: 1.1 },
    { title: "¿Vale la pena comprar esta consola en 2026?", topic: "Análisis", boost: 1.15 }
  ],
  "Vlogs, IRL & Charla": [
    { title: "24 Horas siendo streamer en Argentina", topic: "Vlog", boost: 1.2 },
    { title: "Charlando con la comunidad sobre el estado del streaming", topic: "Charla", boost: 1.0 },
    { title: "Reaccionando a las mejores polémicas de la semana", topic: "Reacción", boost: 1.35 },
    { title: "Me metí en el evento de streamers sin entrada", topic: "IRL", boost: 1.4 }
  ]
};

export function renderPublishVideo() {
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  `;

  // Obtener ideas según el nicho o usar Gaming por defecto
  const playerNiche = gameState.player.niche || "Gaming & Fútbol";
  const nichePool = videoIdeas[playerNiche] || videoIdeas["Gaming & Fútbol"];
  
  // Mezclar y elegir 4 opciones aleatorias
  const shuffled = [...nichePool].sort(() => 0.5 - Math.random());
  const selectedOptions = shuffled.slice(0, 4);

  let selectedIndex = 0;

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
        🎬 Seleccioná la Idea de tu Próximo Video
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
        Elegí una de las 4 tendencias sugeridas para tu nicho (<strong>${playerNiche}</strong>):
      </p>

      <!-- Grilla con las 4 Opciones -->
      <div id="ideas-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
        ${selectedOptions.map((opt, index) => `
          <div class="title-card interactive-card" data-index="${index}" style="
            background: rgba(0,0,0,0.5);
            border: ${index === 0 ? '2px solid var(--accent-red)' : 'var(--border-subtle)'};
            border-radius: 12px;
            padding: 18px;
            cursor: pointer;
            position: relative;
          ">
            <span style="
              font-size: 0.7rem;
              background: rgba(255,0,0,0.2);
              color: var(--accent-red);
              padding: 3px 8px;
              border-radius: 4px;
              font-weight: bold;
              text-transform: uppercase;
            ">
              ${opt.topic}
            </span>
            <h3 style="font-size: 1.1rem; margin: 12px 0 0 0; color: #fff;">
              ${opt.title}
            </h3>
          </div>
        `).join('')}
      </div>

      <!-- Selector de Clickbait -->
      <div style="margin-bottom: 25px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; border: var(--border-subtle);">
        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
          Estrategia de Miniatura y Clickbait
        </label>
        <select id="video-clickbait" style="
          width: 100%;
          padding: 12px;
          background: rgba(0,0,0,0.8);
          border: var(--border-subtle);
          border-radius: 8px;
          color: #fff;
        ">
          <option value="Bajo">🟢 Bajo (Más retención de audiencia)</option>
          <option value="Medio" selected>🟡 Medio (Equilibrado)</option>
          <option value="Alto">🔴 Alto (Pico de vistas, riesgo de crítica)</option>
        </select>
      </div>

      <button id="btn-publish" style="
        width: 100%;
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
        ▶ GRABAR Y SUBIR
      </button>
    </div>
  `;

  // Listener para la selección visual de tarjetas
  setTimeout(() => {
    const cards = container.querySelectorAll('.title-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.style.border = 'var(--border-subtle)');
        card.style.border = '2px solid var(--accent-red)';
        selectedIndex = parseInt(card.getAttribute('data-index'));
      });
    });

    const publishBtn = container.querySelector('#btn-publish');
    publishBtn.addEventListener('click', () => {
      const chosenIdea = selectedOptions[selectedIndex];
      const clickbait = container.querySelector('#video-clickbait').value;

      // Guardamos la elección completa en el estado global
      gameState.ultimoVideoDraft = {
        title: chosenIdea.title,
        topic: chosenIdea.topic,
        boost: chosenIdea.boost,
        clickbait: clickbait
      };

      window.location.hash = '#videoResult';
    });
  }, 0);

  return container;
}
