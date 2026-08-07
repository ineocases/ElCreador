import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

// Banco extenso de títulos por nicho
const videoTemplates = {
  "Gaming & Fútbol": [
    "Probando el nuevo juego viral del momento",
    "Reacción en vivo al clásico futbolístico de la fecha",
    "Sobreviviendo 100 días en modo hardcore",
    "Jugando a 'El Ídolo': ¿El simulador definitivo?",
    "Debate picante: ¿Quién es la verdadera promesa del fútbol?",
    "Desafío extremo de gaming sin perder la paciencia",
    "Creé el equipo más caro de la liga y pasó esto",
    "Probando juegos basura de la Play Store",
    "Análisis táctico del partido de la fecha",
    "El bug más insólito que me pasó en directo",
    "Torneo relámpago contra otros streamers",
    "Reaccionando a los mejores goles del año"
  ],
  "Tecnología & Gadgets": [
    "Unboxing del nuevo celular insignia",
    "Armé una PC Gamer con presupuesto mínimo",
    "5 Gadgets ridículos que compré por internet",
    "¿Vale la pena comprar esta consola en 2026?",
    "Probando tecnología futurista que no conocías",
    "Mi setup definitivo de streaming explicado",
    "Puse a prueba los auriculares más caros del mercado",
    "Analizando el peor software del año"
  ],
  "Vlogs, IRL & Charla": [
    "24 Horas haciendo stream sin parar",
    "Charlando sobre la cultura del streaming en Argentina",
    "Reaccionando a las polémicas más virales de la semana",
    "Infiltrado en un evento masivo sin entrada",
    "Debate con el chat sobre las redes sociales",
    "Contando historias insólitas que me pasaron en la calle",
    "Mi rutina diaria como creador de contenido",
    "Respondiendo las preguntas más incómodas del chat"
  ]
};

const attributesList = [
  { key: 'edicion', label: 'Edición' },
  { key: 'carisma', label: 'Carisma' },
  { key: 'algoritmo', label: 'Algoritmo' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'constancia', label: 'Constancia' }
];

export function renderPublishVideo() {
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  `;

  const playerNiche = gameState.player.niche || "Gaming & Fútbol";
  const pool = videoTemplates[playerNiche] || videoTemplates["Gaming & Fútbol"];

  // Seleccionar 3 títulos aleatorios sin repetir
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selectedTitles = shuffled.slice(0, 3);

  // Generar 3 opciones con mejoras de atributos aleatorias
  const selectedOptions = selectedTitles.map(title => {
    const attr = attributesList[Math.floor(Math.random() * attributesList.length)];
    const pts = Math.floor(Math.random() * 3) + 1; // +1 a +3 puntos
    return {
      title,
      attrKey: attr.key,
      attrLabel: attr.label,
      attrPoints: pts
    };
  });

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
        🎬 Seleccioná una Idea
      </h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
        Elegí 1 de las 3 opciones generadas para tu nicho. Cada opción mejorará un atributo específico de tu creador:
      </p>

      <!-- Grilla de 3 Opciones -->
      <div id="ideas-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
        ${selectedOptions.map((opt, index) => `
          <div class="title-card interactive-card" data-index="${index}" style="
            background: rgba(0,0,0,0.5);
            border: ${index === 0 ? '2px solid var(--accent-red)' : 'var(--border-subtle)'};
            border-radius: 12px;
            padding: 18px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          ">
            <div>
              <h3 style="font-size: 1rem; margin: 0 0 15px 0; color: #fff; line-height: 1.4;">
                "${opt.title}"
              </h3>
            </div>
            <div style="
              background: rgba(0, 255, 102, 0.1);
              border: 1px solid var(--accent-green);
              color: var(--accent-green);
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 0.8rem;
              font-weight: bold;
              text-align: center;
              text-transform: uppercase;
            ">
              +${opt.attrPoints} ${opt.attrLabel} ▲
            </div>
          </div>
        `).join('')}
      </div>

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
      const chosenOption = selectedOptions[selectedIndex];
      const clickbait = container.querySelector('#video-clickbait').value;

      gameState.ultimoVideoDraft = {
        title: chosenOption.title,
        clickbait: clickbait,
        attrKey: chosenOption.attrKey,
        attrLabel: chosenOption.attrLabel,
        attrPoints: chosenOption.attrPoints
      };

      window.location.hash = '#videoResult';
    });
  }, 0);

  return container;
}
