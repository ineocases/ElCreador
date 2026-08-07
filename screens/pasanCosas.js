import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

// Banco de dilemas de streaming
const eventosDilemas = [
  {
    titulo: "🔥 POLÉMICA EN X / TWITTER",
    descripcion: "Un streamer mediano te tiró una indirecta diciendo que le copiaste la idea de tu último video.",
    opcionA: { texto: "Ignorar y seguir trabajando", riesgo: "Sin riesgo", beneficio: "+2 Constancia", accion: (p) => { p.atributos.constancia += 2; return "Decidiste no engancharte. Tu comunidad valora tu madurez (+2 Constancia)."; } },
    opcionB: { texto: "Responder con un tweet picante 🎲", riesgo: "Dado de Riesgo", accion: (p) => {
      const exito = Math.random() > 0.5;
      if (exito) {
        p.fama += 10;
        p.suscriptores += 150;
        return "🎯 ¡SALIÓ BIEN! Tu respuesta fue viral en TikTok. Ganaste +10 Fama y +150 subs.";
      } else {
        p.comunidad = Math.max(0, p.comunidad - 5);
        return "💥 SALIÓ MAL. Quedaste mal parado en las redes (-5 Comunidad).";
      }
    }}
  },
  {
    titulo: "⚽ INVITACIÓN A LA STREAMER CUP",
    descripcion: "Te invitaron a participar de un torneo relámpago presencial de fútbol/gaming organizado por creadores.",
    opcionA: { texto: "Rechazar para preparar tu próximo video", riesgo: "Sin riesgo", beneficio: "+2 Edición", accion: (p) => { p.atributos.edicion += 2; return "Te quedaste editando a full (+2 Edición)."; } },
    opcionB: { texto: "Ir a tirar magia y hacer contactos 🎲", riesgo: "Dado de Riesgo", accion: (p) => {
      const exito = Math.random() > 0.4;
      if (exito) {
        p.fama += 15;
        p.atributos.carisma += 3;
        return "🎯 ¡CRACK! Tiraste un caño viral en el torneo. Todos hablan de vos (+15 Fama, +3 Carisma).";
      } else {
        p.fama = Math.max(0, p.fama - 3);
        return "💥 PAPELÓN. Te errajaste un gol servido sin arquero y se hizo meme (-3 Fama).";
      }
    }}
  },
  {
    titulo: "💰 SPONSOR DUDOSO EN CASINOS",
    descripcion: "Te ofrecen US$ 300 por poner un banner de un sitio de apuestas no regulado en tus videos.",
    opcionA: { texto: "Rechazar por principios", riesgo: "Sin riesgo", beneficio: "+5 Comunidad", accion: (p) => { p.comunidad += 5; return "Tu audiencia respeta que no les vendas cosas raras (+5 Comunidad)."; } },
    opcionB: { texto: "Aceptar la plata fácil 🎲", riesgo: "Dado de Riesgo", accion: (p) => {
      const exito = Math.random() > 0.6;
      if (exito) {
        p.dinero += 300;
        return "🎯 ¡NEGOCIO REDONDO! Te pagaron a tiempo y nadie te criticó (+US$ 300).";
      } else {
        p.dinero += 300;
        p.fama = Math.max(0, p.fama - 8);
        return "💥 FUNADO. El chat descubrió que el sitio era estafa (-8 Fama, pero cobraste US$ 300).";
      }
    }}
  }
];

export function renderPasanCosas() {
  const container = document.createElement('div');
  container.style.cssText = `max-width: 900px; margin: 20px auto; padding: 0 15px;`;

  const evento = eventosDilemas[Math.floor(Math.random() * eventosDilemas.length)];

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="background: var(--bg-card); border: var(--border-card); border-radius: 16px; padding: 25px; margin-top: 20px;">
      <span style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">⚡ PASAN COSAS</span>
      <h2 style="font-family: var(--font-heading); font-size: 2rem; margin: 5px 0 15px 0; color: #fff;">
        ${evento.titulo}
      </h2>
      <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.5; margin-bottom: 25px;">
        ${evento.descripcion}
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <!-- Opción A -->
        <button id="opt-a" class="interactive-card" style="
          background: rgba(0,0,0,0.5); border: var(--border-subtle); padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;
        ">
          <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; display: block;">Opción Segura</span>
          <strong style="font-size: 1.1rem; display: block; margin: 8px 0;">${evento.opcionA.texto}</strong>
          <span style="color: var(--accent-green); font-size: 0.85rem;">Efecto: ${evento.opcionA.beneficio}</span>
        </button>

        <!-- Opción B -->
        <button id="opt-b" class="interactive-card" style="
          background: rgba(255,0,0,0.08); border: 1px solid var(--accent-red); padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;
        ">
          <span style="color: var(--accent-red); font-size: 0.75rem; text-transform: uppercase; display: block; font-weight: bold;">🎲 Opción Arriesgada</span>
          <strong style="font-size: 1.1rem; display: block; margin: 8px 0;">${evento.opcionB.texto}</strong>
          <span style="color: var(--accent-yellow); font-size: 0.85rem;">Si sale bien explotas, si falla hay consecuencias.</span>
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const p = gameState.player;
    container.querySelector('#opt-a').addEventListener('click', () => {
      gameState.ultimoEventoResultado = evento.opcionA.accion(p);
      window.location.hash = '#videoResult';
    });
    container.querySelector('#opt-b').addEventListener('click', () => {
      gameState.ultimoEventoResultado = evento.opcionB.accion(p);
      window.location.hash = '#videoResult';
    });
  }, 0);

  return container;
}
