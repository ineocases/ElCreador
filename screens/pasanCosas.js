import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

const bancoEventos = [
  // =========================================================================
  // 1. GAMING
  // =========================================================================
  {
    nicho: 'Gaming', minSubs: 0, maxSubs: 1000,
    titulo: "🎮 TORNEITO COMUNITARIO DE DISCORD",
    descripcion: "Un streamer chico organiza una copa rápida y falta un integrante.",
    opcionA: { texto: "Jugar tranquilo sin llamar la atención", beneficio: "+2 Constancia", accion: (p) => { p.atributos.constancia += 2; return "Sumaste horas de stream (+2 Constancia)."; } },
    opcionB: { texto: "Hacer 'Trash Talk' en el chat 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 5, p.suscriptores += 25, "🎯 Risas en el servidor (+5 Fama, +25 subs).") : (p.comunidad = Math.max(0, p.comunidad - 2), "💥 Te banearon por tóxico (-2 Comunidad).") }
  },
  {
    nicho: 'Gaming', minSubs: 10000, maxSubs: 50000,
    titulo: "🎧 SPONSOR DE HARDWARE MEDIANO",
    descripcion: "Una marca te ofrece un combo de teclado y mouse a cambio de 3 videos.",
    opcionA: { texto: "Aceptar la review formal", beneficio: "+3 Edición", accion: (p) => { p.atributos.edicion += 3; return "Mejoró la calidad del setup (+3 Edición)."; } },
    opcionB: { texto: "Pedir dinero en efectivo además del canje 🎲", accion: (p) => Math.random() > 0.5 ? (p.dinero += 200, "🎯 ¡Aceptaron! Te pagaron US$ 200 extra.") : "💥 Rechazaron la propuesta por pedir de más." }
  },

  // =========================================================================
  // 2. FÚTBOL
  // =========================================================================
  {
    nicho: 'Fútbol', minSubs: 0, maxSubs: 1000,
    titulo: "⚽ PICADITO EN EL POTRERO",
    descripcion: "Tus amigos van a jugar y pensás en grabar con el celular.",
    opcionA: { texto: "Grabar desde afuera y analizar con humor", beneficio: "+2 Edición", accion: (p) => { p.atributos.edicion += 2; return "Hiciste una edición divertida (+2 Edición)."; } },
    opcionB: { texto: "Entrar a jugar e intentar un lujo 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 8, p.suscriptores += 30, "🎯 ¡Tiraste un caño viral! (+8 Fama, +30 subs).") : (p.atributos.constancia = Math.max(0, p.atributos.constancia - 1), "💥 Te pisaste la pelota y te caíste (-1 Constancia).") }
  },
  {
    nicho: 'Fútbol', minSubs: 50000, maxSubs: 100000,
    titulo: "🏟️ INVITACIÓN A LA STREAMER CUP PRESENCIAL",
    descripcion: "Te convocan a jugar en una canchita con tribuna llena transmitida en vivo.",
    opcionA: { texto: "Entrenar para dar un rendimiento sólido", beneficio: "+5 Carisma", accion: (p) => { p.atributos.carisma += 5; return "Rendiste bien y sumaste respeto (+5 Carisma)."; } },
    opcionB: { texto: "Prometer picarla si hay un penal 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 35, p.suscriptores += 3000, "🎯 ¡La picaste y fue golazo! (+3000 subs, +35 Fama).") : (p.fama = Math.max(0, p.fama - 10), "💥 La atajó el arquero sin moverse (-10 Fama).") }
  },

  // =========================================================================
  // 3. VLOG
  // =========================================================================
  {
    nicho: 'Vlog', minSubs: 0, maxSubs: 1000,
    titulo: "📹 PROBANDE COMIDA DE CALLE",
    descripcion: "Salís a probar la hamburguesa más barata de la zona.",
    opcionA: { texto: "Hacer una reseña sincera y tranquila", beneficio: "+2 Carisma", accion: (p) => { p.atributos.carisma += 2; return "Tu honestidad agradó a los pocos espectadores (+2 Carisma)."; } },
    opcionB: { texto: "Exagerar las reacciones para TikTok 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 40, p.fama += 5, "🎯 Clip viral en TikTok (+40 subs, +5 Fama).") : (p.comunidad = Math.max(0, p.comunidad - 2), "💥 Sonó muy actuado y te criticaron (-2 Comunidad).") }
  },
  {
    nicho: 'Vlog', minSubs: 10000, maxSubs: 50000,
    titulo: "✈️ VIAJE ECONÓMICO A OTRA CIUDAD",
    descripcion: "Tenés la oportunidad de viajar 3 días en colectivo para grabar contenido fuera de tu zona.",
    opcionA: { texto: "Planificar un itinerario bien organizado", beneficio: "+4 Marketing", accion: (p) => { p.atributos.marketing += 4; return "Aprovechaste cada rincón del viaje (+4 Marketing)."; } },
    opcionB: { texto: "Ir sin reserva de hotel y transmitir la aventura 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 1200, p.fama += 20, "🎯 La improvisación enganchó a todos (+1200 subs, +20 Fama).") : (p.dinero = Math.max(0, p.dinero - 100), "💥 Tuviste que pagar un hotel caro a última hora (-US$ 100).") }
  },

  // =========================================================================
  // 4. TECNOLOGÍA
  // =========================================================================
  {
    nicho: 'Tecnología', minSubs: 0, maxSubs: 1000,
    titulo: "📱 RESEÑA DE UN CELULAR VIEJO",
    descripcion: "Vas a hacer un video probando si un celular de hace 5 años sirve en la actualidad.",
    opcionA: { texto: "Explicar las especificaciones técnicas bien al detalle", beneficio: "+2 Algoritmo", accion: (p) => { p.atributos.algoritmo += 2; return "El algoritmo posicionó bien la búsqueda (+2 Algoritmo)."; } },
    opcionB: { texto: "Hacer una prueba de caída destructiva 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 10, p.suscriptores += 50, "🎯 ¡Video de impacto! Ganaste vistas rápidas (+50 subs, +10 Fama).") : (p.dinero = Math.max(0, p.dinero - 20), "💥 Rompiste el teléfono antes de empezar a grabar (-US$ 20).") }
  },
  {
    nicho: 'Tecnología', minSubs: 50000, maxSubs: 100000,
    titulo: "🌐 INVITACIÓN A UN LANZAMIENTO EXCLUSIVO",
    descripcion: "Una gran marca de teléfonos te invita a la presentación de su nuevo flagship.",
    opcionA: { texto: "Publicar el video en la fecha de embargo asignada", beneficio: "+5 Marketing", accion: (p) => { p.atributos.marketing += 5; return "La marca valoró tu profesionalismo (+5 Marketing)."; } },
    opcionB: { texto: "Filtrar detalles en X/Twitter horas antes 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 40, p.suscriptores += 4000, "🎯 Primicia mundial (+4000 subs, +40 Fama).") : (p.comunidad = Math.max(0, p.comunidad - 10), "💥 La marca te vetó de sus eventos futuros (-10 Comunidad).") }
  },

  // =========================================================================
  // 5. COCINA
  // =========================================================================
  {
    nicho: 'Cocina', minSubs: 0, maxSubs: 1000,
    titulo: "🍳 RECETA ECONÓMICA DE 5 MINUTOS",
    descripcion: "Querés enseñar a cocinar algo rico con muy pocos ingredientes.",
    opcionA: { texto: "Explicar paso a paso de forma clara", beneficio: "+2 Constancia", accion: (p) => { p.atributos.constancia += 2; return "La gente guardó la receta en favoritos (+2 Constancia)."; } },
    opcionB: { texto: "Intentar una técnica vistosa con fuego 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 35, p.fama += 6, "🎯 Quedó un clip estético increíble (+35 subs, +6 Fama).") : (p.atributos.edicion = Math.max(0, p.atributos.edicion - 1), "💥 Se te quemó la preparación y tuviste que reiniciar (-1 Edición).") }
  },
  {
    nicho: 'Cocina', minSubs: 10000, maxSubs: 50000,
    titulo: "🍖 RETO DE COMIDA GIGANTE",
    descripcion: "Te proponen preparar una milanesa o hamburguesa de 5 kilos en vivo.",
    opcionA: { texto: "Invitar a un colega para compartir el plato", beneficio: "+4 Carisma", accion: (p) => { p.atributos.carisma += 4; return "Buena dinámica de equipo (+4 Carisma)."; } },
    opcionB: { texto: "Intentar comerla vos solo en menos de 20 minutos 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 1500, p.fama += 25, "🎯 Reto cumplido, video ultra compartido (+1500 subs, +25 Fama).") : (p.atributos.constancia = Math.max(0, p.atributos.constancia - 2), "💥 Indigestión total. Perdiste días de grabación (-2 Constancia).") }
  },

  // =========================================================================
  // 6. PERIODISMO
  // =========================================================================
  {
    nicho: 'Periodismo', minSubs: 0, maxSubs: 1000,
    titulo: "📰 INFORME SOBRE UNA NOTICIA BARRIAL",
    descripcion: "Hay un reclamo vecinal importante en tu zona y vas a investigarlo.",
    opcionA: { texto: "Verificar datos y entrevistar a ambas partes", beneficio: "+2 Algoritmo", accion: (p) => { p.atributos.algoritmo += 2; return "Informe serio y bien estructurado (+2 Algoritmo)."; } },
    opcionB: { texto: "Usar un título amarillista y picante 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 50, p.fama += 8, "🎯 Explotaron los clicks (+50 subs, +8 Fama).") : (p.comunidad = Math.max(0, p.comunidad - 3), "💥 Te desmintieron en los comentarios (-3 Comunidad).") }
  },
  {
    nicho: 'Periodismo', minSubs: 50000, maxSubs: 100000,
    titulo: "🕵️ DOCUMENTAL DE INVESTIGACIÓN",
    descripcion: "Conseguiste información sobre un tema delicado de alcance nacional.",
    opcionA: { texto: "Publicar con fuentes protegidas y rigurosidad", beneficio: "+5 Constancia", accion: (p) => { p.atributos.constancia += 5; return "Ganaste prestigio en el rubro (+5 Constancia)."; } },
    opcionB: { texto: "Lanzar un 'En Vivo' revelando todo sin filtro 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 5000, p.fama += 45, "🎯 Pico histórico de audiencia (+5000 subs, +45 Fama).") : (p.dinero = Math.max(0, p.dinero - 300), "💥 Tuviste que pagar asesoría legal por cartas documento (-US$ 300).") }
  }
];

export function renderPasanCosas() {
  const container = document.createElement('div');
  container.style.cssText = `max-width: 900px; margin: 20px auto; padding: 0 15px;`;

  const p = gameState.player;

  // Filtrar eventos compatibles con el nicho y nivel del jugador
  const eventosValidos = bancoEventos.filter(e => 
    e.nicho === p.niche && p.suscriptores >= e.minSubs && p.suscriptores <= e.maxSubs
  );

  const evento = eventosValidos.length > 0 
    ? eventosValidos[Math.floor(Math.random() * eventosValidos.length)]
    : bancoEventos[0];

  container.innerHTML = `
    ${renderHeaderHud()}
    <div style="background: var(--bg-card); border: var(--border-card); border-radius: 16px; padding: 25px; margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">
          ⚡ PASAN COSAS — ${p.niche.toUpperCase()}
        </span>
        <span style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px;">
          ${p.suscriptores.toLocaleString()} subs
        </span>
      </div>

      <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin: 5px 0 15px 0; color: #fff;">
        ${evento.titulo}
      </h2>
      <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px;">
        ${evento.descripcion}
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <button id="opt-a" class="interactive-card" style="background: rgba(0,0,0,0.5); border: var(--border-subtle); padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;">
          <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; display: block;">Opción Segura</span>
          <strong style="font-size: 1rem; display: block; margin: 8px 0;">${evento.opcionA.texto}</strong>
          <span style="color: var(--accent-green); font-size: 0.8rem;">Efecto: ${evento.opcionA.beneficio || 'Garantizado'}</span>
        </button>

        <button id="opt-b" class="interactive-card" style="background: rgba(255,0,0,0.08); border: 1px solid var(--accent-red); padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;">
          <span style="color: var(--accent-red); font-size: 0.75rem; text-transform: uppercase; display: block; font-weight: bold;">🎲 Opción Arriesgada</span>
          <strong style="font-size: 1rem; display: block; margin: 8px 0;">${evento.opcionB.texto}</strong>
          <span style="color: var(--accent-yellow); font-size: 0.8rem;">Efecto: Riesgo / Recompensa</span>
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
