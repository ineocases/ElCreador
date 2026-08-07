import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

// Banco de dilemas divididos por Nicho y Nivel de Suscriptores
const bancoEventos = [
  // ================= GAMING (PRINCIPIANTE: < 1.000 subs) =================
  {
    nicho: 'Gaming',
    minSubs: 0,
    maxSubs: 1000,
    titulo: "🎮 TORNEITO COMUNITARIO DE DISCORD",
    descripcion: "Un canal chico de Twitch (200 seguidores) organiza un torneo de Gaming y falta un jugador.",
    opcionA: {
      texto: "Jugar tranquilo sin llamar la atención",
      beneficio: "+2 Constancia",
      accion: (p) => { p.atributos.constancia += 2; return "Jugaste tus partidas y mantuviste tu ritmo de trabajo (+2 Constancia)."; }
    },
    opcionB: {
      texto: "Hacer 'Trash Talk' en el chat del torneo 🎲",
      accion: (p) => {
        const exito = Math.random() > 0.5;
        if (exito) {
          p.fama += 5;
          p.suscriptores += 25;
          return "🎯 ¡GRACIOSO! En el servidor de Discord se rieron con tus chistes (+5 Fama, +25 subs).";
        } else {
          p.comunidad = Math.max(0, p.comunidad - 2);
          return "💥 SALIÓ MAL. Te techaron de tóxico y te banearon del Discord (-2 Comunidad).";
        }
      }
    }
  },
  {
    nicho: 'Gaming',
    minSubs: 0,
    maxSubs: 1000,
    titulo: "🎧 MICROFÓNO BARATO O DE AURICULARES",
    descripcion: "El audio de tus streams/gameplays se escucha con ruido de fondo. Un pibe en los comentarios te lo remarcó.",
    opcionA: {
      texto: "Aprender a usar filtros de software (Obs/RPNoise)",
      beneficio: "+3 Edición",
      accion: (p) => { p.atributos.edicion += 3; return "Configuraste bien el microfono sin gastar un peso (+3 Edición)."; }
    },
    opcionB: {
      texto: "Gastar tus ahorros en un micrófono usado de OLX 🎲",
      accion: (p) => {
        const exito = Math.random() > 0.4;
        if (exito) {
          p.atributos.algoritmo += 2;
          p.dinero = Math.max(0, p.dinero - 30);
          return "🎯 ¡OFERTÓN! El micrófono mejoró muchísimo la calidad de tus videos (-US$ 30, +2 Algoritmo).";
        } else {
          p.dinero = Math.max(0, p.dinero - 30);
          return "💥 ESTAFA. Te vendieron un micrófono usado que mete más ruido que el anterior (-US$ 30).";
        }
      }
    }
  },

  // ================= FÚTBOL (PRINCIPIANTE: < 1.000 subs) =================
  {
    nicho: 'Fútbol',
    minSubs: 0,
    maxSubs: 1000,
    titulo: "⚽ GRABAR UN PICADITO EN EL POTRERO",
    descripcion: "Tus amigos van a jugar un partido de fútbol en la canchita del barrio y pensás en llevar el celular para grabar.",
    opcionA: {
      texto: "Grabar solo desde afuera y analizar las jugadas",
      beneficio: "+2 Edición",
      accion: (p) => { p.atributos.edicion += 2; return "Hiciste un análisis táctico divertido de tus amigos (+2 Edición)."; }
    },
    opcionB: {
      texto: "Entrar a jugar con la cámara encendida e intentar un lujo 🎲",
      accion: (p) => {
        const exito = Math.random() > 0.5;
        if (exito) {
          p.fama += 8;
          p.suscriptores += 30;
          return "🎯 ¡MEME VIRAL! Tiraste un caño tremendo y el clip juntó vistas en TikTok (+8 Fama, +30 subs).";
        } else {
          p.atributos.constancia = Math.max(0, p.atributos.constancia - 1);
          return "💥 PAPELÓN. Te pisaste la pelota, te caíste de cara y se rompieron las medias (-1 Constancia).";
        }
      }
    }
  },
  {
    nicho: 'Fútbol',
    minSubs: 0,
    maxSubs: 1000,
    titulo: "🏟️ REACCIÓN A LA LIGA LOCAL",
    descripcion: "Terminó el clásico de la fecha y hay bastante debate picante en X/Twitter.",
    opcionA: {
      texto: "Subir un resumen objetivo de 3 minutos",
      beneficio: "+2 Algoritmo",
      accion: (p) => { p.atributos.algoritmo += 2; return "El algoritmo posicionó bien tu resumen rápido (+2 Algoritmo)."; }
    },
    opcionB: {
      texto: "Hacer un video eufórico picando al rival 🎲",
      accion: (p) => {
        const exito = Math.random() > 0.5;
        if (exito) {
          p.suscriptores += 40;
          p.fama += 5;
          return "🎯 ¡VIENTOS DE POLÉMICA! Atrajiste a hinchas con ganas de debatir (+40 subs, +5 Fama).";
        } else {
          p.comunidad = Math.max(0, p.comunidad - 3);
          return "💥 MALA RECEPCIÓN. Te llenaron la caja de comentarios con insultos (-3 Comunidad).";
        }
      }
    }
  },

  // ================= EVENTO GENERAL (AVANZADOS: > 1.000 subs) =================
  {
    nicho: 'General',
    minSubs: 1000,
    maxSubs: 1000000,
    titulo: "🤝 COLABORACIÓN CON OTRO CREADOR",
    descripcion: "Un streamer con un público similar al tuyo te propone hacer un stream conjunto esta semana.",
    opcionA: {
      texto: "Aceptar la colabo formal y preparar una estructura",
      beneficio: "+3 Carisma",
      accion: (p) => { p.atributos.carisma += 3; return "El stream salió fluido y conectaste muy bien (+3 Carisma)."; }
    },
    opcionB: {
      texto: "Apretar el acelerador e improvisar algo picante 🎲",
      accion: (p) => {
        const exito = Math.random() > 0.5;
        if (exito) {
          p.suscriptores += 250;
          p.fama += 12;
          return "🎯 ¡ÉXITO ROTUNDO! La química en pantalla fue excelente (+250 subs, +12 Fama).";
        } else {
          p.fama = Math.max(0, p.fama - 5);
          return "💥INCOMODIDAD. Quedaron silencios raros en vivo y la gente se fue (-5 Fama).";
        }
      }
    }
  }
];

export function renderPasanCosas() {
  const container = document.createElement('div');
  container.style.cssText = `max-width: 900px; margin: 20px auto; padding: 0 15px;`;

  const p = gameState.player;

  // Filtrar eventos compatibles con el Nicho del jugador y su rango de suscriptores
  const eventosValidos = bancoEventos.filter(e => 
    (e.nicho === p.niche || e.nicho === 'General') &&
    p.suscriptores >= e.minSubs &&
    p.suscriptores <= e.maxSubs
  );

  // Seleccionar uno al azar o usar uno genérico si no hay coincidencia
  const evento = eventosValidos.length > 0 
    ? eventosValidos[Math.floor(Math.random() * eventosValidos.length)]
    : bancoEventos[0];

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="background: var(--bg-card); border: var(--border-card); border-radius: 16px; padding: 25px; margin-top: 20px;">
      <span style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">⚡ PASAN COSAS — ${p.niche.toUpperCase()}</span>
      <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin: 5px 0 15px 0; color: #fff;">
        ${evento.titulo}
      </h2>
      <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px;">
        ${evento.descripcion}
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <!-- Opción A -->
        <button id="opt-a" class="interactive-card" style="
          background: rgba(0,0,0,0.5); border: var(--border-subtle); padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;
        ">
          <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; display: block;">Opción Segura</span>
          <strong style="font-size: 1rem; display: block; margin: 8px 0;">${evento.opcionA.texto}</strong>
          <span style="color: var(--accent-green); font-size: 0.8rem;">Efecto: ${evento.opcionA.beneficio}</span>
        </button>

        <!-- Opción B -->
        <button id="opt-b" class="interactive-card" style="
          background: rgba(255,0,0,0.08); border: 1px solid var(--accent-red); padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;
        ">
          <span style="color: var(--accent-red); font-size: 0.75rem; text-transform: uppercase; display: block; font-weight: bold;">🎲 Opción Arriesgada</span>
          <strong style="font-size: 1rem; display: block; margin: 8px 0;">${evento.opcionB.texto}</strong>
          <span style="color: var(--accent-yellow); font-size: 0.8rem;">Tirás el dado: recompensa mayor o consecuencia.</span>
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
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
