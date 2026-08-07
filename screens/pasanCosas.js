import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

const bancoEventos = [
  // =========================================================================
  // NIVEL 1: 0 - 1.000 SUBS (PRINCIPIANTE)
  // =========================================================================
  {
    nicho: 'Gaming',
    minSubs: 0,
    maxSubs: 1000,
    titulo: "🎮 TORNEITO COMUNITARIO DE DISCORD",
    descripcion: "Un canal chico te invita a jugar un torneo rápido de gaming en vivo frente a 30 espectadores.",
    opcionA: {
      texto: "Jugar tranquilo y hacer grupo",
      beneficio: "+2 Constancia",
      accion: (p) => { p.atributos.constancia += 2; return "Sumaste horas de vuelo y contactos en el ambiente (+2 Constancia)."; }
    },
    opcionB: {
      texto: "Hacer 'Trash Talk' en el chat del torneo 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.fama += 5; p.suscriptores += 25;
          return "🎯 ¡GRACIOSO! En el servidor se rieron con tus chistes (+5 Fama, +25 subs).";
        } else {
          p.comunidad = Math.max(0, p.comunidad - 2);
          return "💥 SALIÓ MAL. Te tacharon de tóxico y te banearon (-2 Comunidad).";
        }
      }
    }
  },
  {
    nicho: 'Fútbol',
    minSubs: 0,
    maxSubs: 1000,
    titulo: "⚽ PICADITO EN EL POTRERO DEL BARRIO",
    descripcion: "Tus amigos van a jugar a la canchita y pensás en llevar el celular para grabar algunas jugadas.",
    opcionA: {
      texto: "Grabar desde afuera y analizar las jugadas con humor",
      beneficio: "+2 Edición",
      accion: (p) => { p.atributos.edicion += 2; return "Hiciste un análisis táctico divertido de tus amigos (+2 Edición)."; }
    },
    opcionB: {
      texto: "Entrar a jugar con la cámara encendida e intentar un lujo 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.fama += 8; p.suscriptores += 30;
          return "🎯 ¡MEME VIRAL! Tiraste un caño tremendo y el clip juntó vistas en TikTok (+8 Fama, +30 subs).";
        } else {
          p.atributos.constancia = Math.max(0, p.atributos.constancia - 1);
          return "💥 PAPELÓN. Te pisaste la pelota, te caíste de cara y rompiste la remera (-1 Constancia).";
        }
      }
    }
  },

  // =========================================================================
  // NIVEL 2: 1.000 - 10.000 SUBS (MICRO-CREADOR)
  // =========================================================================
  {
    nicho: 'Gaming',
    minSubs: 1000,
    maxSubs: 10000,
    titulo: "🎧 SPONSOR DE TECLADOS Y AURICULARES BARATOS",
    descripcion: "Una tienda china de periféricos te manda un mail ofreciendo canje de un teclado mecánico a cambio de 2 reviews.",
    opcionA: {
      texto: "Aceptar el canje para mejorar tu setup",
      beneficio: "+3 Edición",
      accion: (p) => { p.atributos.edicion += 3; return "El setup luce mejor en la cámara (+3 Edición)."; }
    },
    opcionB: {
      texto: "Pedirles plata además del producto 🎲",
      accion: (p) => {
        if (Math.random() > 0.6) {
          p.dinero += 80;
          return "🎯 ¡NEGOCIÓS! Te dieron el teclado y US$ 80 extra (+US$ 80).";
        } else {
          return "💥 TE CANCELARON. Consideraron que tenías muy pocos números para exigir presupuesto.";
        }
      }
    }
  },
  {
    nicho: 'Fútbol',
    minSubs: 1000,
    maxSubs: 10000,
    titulo: "🏟️ VLOG DENTRO DE LA TRIBUNA",
    descripcion: "Compraste entrada para ir a ver el clásico de la ciudad y querés grabar la fiesta de la gente.",
    opcionA: {
      texto: "Grabar con carisma sin buscar quilombo",
      beneficio: "+3 Carisma",
      accion: (p) => { p.atributos.carisma += 3; return "La gente de la tribuna se enganchó con buena onda (+3 Carisma)."; }
    },
    opcionB: {
      texto: "Meterte en medio de la barra a cantar y gritar 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.suscriptores += 180; p.fama += 10;
          return "🎯 ¡PURA PASIÓN! El video captó el folklore del fútbol y explotó (+180 subs, +10 Fama).";
        } else {
          p.dinero = Math.max(0, p.dinero - 50);
          return "💥 SALIÓ MAL. Entre el tumulto perdiste un trípode y el micrófono celular (-US$ 50).";
        }
      }
    }
  },

  // =========================================================================
  // NIVEL 3: 10.000 - 50.000 SUBS (CREADOR COMUNITARIO)
  // =========================================================================
  {
    nicho: 'Gaming',
    minSubs: 10000,
    maxSubs: 50000,
    titulo: "🏆 TORNEO DE STREAMERS MEDIANOS",
    descripcion: "Un creador de 40k subs organiza una copa con US$ 500 de premio y te invita a participar.",
    opcionA: {
      texto: "Jugar enfocado en la competencia",
      beneficio: "+4 Algoritmo",
      accion: (p) => { p.atributos.algoritmo += 4; return "Tu gameplay destacado atrajo a público técnico (+4 Algoritmo)."; }
    },
    opcionB: {
      texto: "Provocar a los rivales durante la transmisión 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.suscriptores += 600; p.fama += 15;
          return "🎯 ¡SHOWMAN! Fuiste el personaje principal del evento (+600 subs, +15 Fama).";
        } else {
          p.comunidad = Math.max(0, p.comunidad - 8);
          return "💥 RECHAZO. El chat te tildó de insoportable (-8 Comunidad).";
        }
      }
    }
  },
  {
    nicho: 'Fútbol',
    minSubs: 10000,
    maxSubs: 50000,
    titulo: "🎙️ ZONA MIXTA E INTERVIEW A JUGADORES",
    descripcion: "Conseguiste una acreditación independiente para hacer preguntas de color a los futbolistas post-partido.",
    opcionA: {
      texto: "Hacer preguntas tácticas y respetuosas",
      beneficio: "+4 Constancia",
      accion: (p) => { p.atributos.constancia += 4; return "Los periodistas tradicionales valoraron tu seriedad (+4 Constancia)."; }
    },
    opcionB: {
      texto: "Tirarle una chicana graciosa a la figura de la cancha 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.suscriptores += 800; p.fama += 20;
          return "🎯 ¡MOMENTO ÉPICO! El jugador se rió y la respuesta fue portada de diarios (+800 subs, +20 Fama).";
        } else {
          p.fama = Math.max(0, p.fama - 5);
          return "💥 INCÓMODO. El jugador te miró mal y te retiraron el micrófono (-5 Fama).";
        }
      }
    }
  },

  // =========================================================================
  // NIVEL 4: 50.000 - 100.000 SUBS (CREADOR CONSOLIDADO)
  // =========================================================================
  {
    nicho: 'Gaming',
    minSubs: 50000,
    maxSubs: 100000,
    titulo: "⚡ SPONSOR DE BEBIDA ENERGIZANTE / HARDWARE TOP",
    descripcion: "Una marca internacional te quiere como embajador para aparecer en tu stream luciendo sus latas y ropa.",
    opcionA: {
      texto: "Firmar contrato estándar por US$ 1.500",
      beneficio: "+US$ 1500",
      accion: (p) => { p.dinero += 1500; return "Ingreso de dinero seguro para renovar la PC (+US$ 1500)."; }
    },
    opcionB: {
      texto: "Exigir un viaje todo pago a la Gaming Convention 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.dinero += 1500; p.fama += 25; p.suscriptores += 2000;
          return "🎯 ¡VIAJE PAGO! Fuiste al evento en VIP y conociste streamers gigantes (+US$ 1500, +2000 subs, +25 Fama).";
        } else {
          p.dinero += 800;
          return "💥 REBAJA. La marca bajó la oferta de dinero por exigir de más (Solo cobraste US$ 800).";
        }
      }
    }
  },
  {
    nicho: 'Fútbol',
    minSubs: 50000,
    maxSubs: 100000,
    titulo: "⚽ INVITACIÓN A LA STREAMER CUP PRESENCIAL",
    descripcion: "Te invitan a jugar de titular en el torneo de fútbol 7 de influencers transmitido por Kick/Twitch ante 100k espectadores.",
    opcionA: {
      texto: "Entrenar duro para no dar lástima",
      beneficio: "+5 Carisma",
      accion: (p) => { p.atributos.carisma += 5; return "Tuviste un rendimiento sólido y te ganaste el respeto (+5 Carisma)."; }
    },
    opcionB: {
      texto: "Prometer un gol de chilena o picarla en un penal 🎲",
      accion: (p) => {
        if (Math.random() > 0.4) {
          p.fama += 35; p.suscriptores += 3500;
          return "🎯 ¡GOLAZO HISTÓRICO! Lo picaste, el clip dio la vuelta al mundo (+3500 subs, +35 Fama).";
        } else {
          p.fama = Math.max(0, p.fama - 10);
          return "💥 PAPELÓN EN VIVO. La errajaste feo y te convirtiste en el meme del mes (-10 Fama).";
        }
      }
    }
  },

  // =========================================================================
  // NIVEL 5: > 100.000 SUBS (ESTRELLA DEL STREAMING)
  // =========================================================================
  {
    nicho: 'Gaming',
    minSubs: 100000,
    maxSubs: 10000000,
    titulo: "🔥 DRAMA Y 'BEEF' CON UN TOP STREAMER",
    descripcion: "Un referente gigante del gaming te tiró una indirecta en su transmisión diciendo que tu contenido decayó.",
    opcionA: {
      texto: "Responder con educación y pruebas en un video",
      beneficio: "+5 Comunidad",
      accion: (p) => { p.comunidad += 5; return "Demostraste clase y tu comunidad te respaldó con orgullo (+5 Comunidad)."; }
    },
    opcionB: {
      texto: "Armar un directo reacción 'destruyéndolo' 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.suscriptores += 10000; p.fama += 50;
          return "🎯 ¡TERREMOTO EN INTERNET! Rompiste récords de audiencia en tu canal (+10.000 subs, +50 Fama).";
        } else {
          p.fama = Math.max(0, p.fama - 20); p.comunidad = Math.max(0, p.comunidad - 15);
          return "💥 FUNADO. Quedaste como un envidioso y te cayó el 'hate' de su fandom (-20 Fama, -15 Comunidad).";
        }
      }
    }
  },
  {
    nicho: 'Fútbol',
    minSubs: 100000,
    maxSubs: 10000000,
    titulo: "✈️ COBERTURA INTERNACIONAL EN LA COPA",
    descripcion: "Un sponsor de apuestas financia tu viaje para cubrir la final del torneo continental en Brasil/Europa.",
    opcionA: {
      texto: "Hacer una cobertura periodística impecable",
      beneficio: "+5 Marketing",
      accion: (p) => { p.atributos.marketing += 5; return "Marcas internacionales se interesaron en patrocinarte (+5 Marketing)."; }
    },
    opcionB: {
      texto: "Colarte en los festejos de los campeones en la cancha 🎲",
      accion: (p) => {
        if (Math.random() > 0.5) {
          p.suscriptores += 12000; p.fama += 60;
          return "🎯 ¡ÉXITO LEGENDARIO! Levantaste la copa con los jugadores y la foto recorrió el globo (+12.000 subs, +60 Fama).";
        } else {
          p.dinero = Math.max(0, p.dinero - 500);
          return "💥 MULTADO. La seguridad de la CONMEBOL/UEFA te sacó del estadio y tuviste que pagar fianza (-US$ 500).";
        }
      }
    }
  }
];

export function renderPasanCosas() {
  const container = document.createElement('div');
  container.style.cssText = `max-width: 900px; margin: 20px auto; padding: 0 15px;`;

  const p = gameState.player;

  // Filtrar eventos por nicho exacto y por el rango de suscriptores del jugador
  const eventosValidos = bancoEventos.filter(e => 
    e.nicho === p.niche &&
    p.suscriptores >= e.minSubs &&
    p.suscriptores <= e.maxSubs
  );

  // Fallback de seguridad en caso de rango extremo
  const evento = eventosValidos.length > 0 
    ? eventosValidos[Math.floor(Math.random() * eventosValidos.length)]
    : bancoEventos[bancoEventos.length - 1];

  container.innerHTML = `
    ${renderHeaderHud()}

    <div style="background: var(--bg-card); border: var(--border-card); border-radius: 16px; padding: 25px; margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">
          ⚡ PASAN COSAS — ${p.niche.toUpperCase()}
        </span>
        <span style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px;">
          Nivel de canal: ${p.suscriptores.toLocaleString()} subs
        </span>
      </div>

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
          <span style="color: var(--accent-green); font-size: 0.8rem;">Efecto: ${evento.opcionA.beneficio || 'Garantizado'}</span>
        </button>

        <!-- Opción B -->
        <button id="opt-b" class="interactive-card" style="
          background: rgba(255,0,0,0.08); border: 1px solid var(--accent-red); padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;
        ">
          <span style="color: var(--accent-red); font-size: 0.75rem; text-transform: uppercase; display: block; font-weight: bold;">🎲 Opción Arriesgada</span>
          <strong style="font-size: 1rem; display: block; margin: 8px 0;">${evento.opcionB.texto}</strong>
          <span style="color: var(--accent-yellow); font-size: 0.8rem;">Efecto: Dado de probabilidad alta recompensa o penalidad.</span>
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
