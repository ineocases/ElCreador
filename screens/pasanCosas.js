// screens/pasanCosas.js
import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';

// =========================================================================
// BANCO DE CREADORES LEYENDA (EVENTO RARO - 5% CHANCE)
// =========================================================================
const creadoresTopPorNicho = {
  Gaming: [
    { creador: "Coscu", desc: "reaccionó a tu video en directo, se sorprendió con tus jugadas y dijo que tenés un potencial enorme." },
    { creador: "Spreen", desc: "usó un clip tuyo para un video corto y les dijo a sus seguidores que vayan a bancarte." },
    { creador: "ElRubius", desc: "se cruzó con tu canal en directo y te dejó una horda de espectadores con un raid masivo." }
  ],
  Fútbol: [
    { creador: "Davo Xeneize", desc: "vio tu video en directo, se cagó de risa con tus comentarios y pidió al chat que te sigan ya mismo." },
    { creador: "La Cobra", desc: "destacó tu análisis táctico en stream y dijo que sos de los pocos que entienden de verdad." },
    { creador: "Ezzequiel", desc: "te mencionó en una de sus entrevistas como la revelación del contenido futbolero." }
  ],
  Vlog: [
    { creador: "Ibai Llanos", desc: "mostró un fragmento de tu vlog en pleno directo y halagó tu carisma frente a la cámara." },
    { creador: "Luisito Comunica", desc: "te comentó el video diciendo que le encantó tu edición y la vibra de tus viajes." }
  ],
  Tecnología: [
    { creador: "SupraPixel", desc: "citó tu review en redes destacando la calidad técnica de tu análisis." },
    { creador: "MKBHD", desc: "reposteó tu video de setups en sus historias alabando tu nivel de producción." }
  ],
  Cocina: [
    { creador: "Paulina Cocina", desc: "reaccionó a tu receta en Instagram y recommended tu canal a toda su comunidad." },
    { creador: "Marcos Di Cesare", desc: "alabó la técnica de tu plato en vivo y dijo que da gusto ver contenido bien hecho." }
  ],
  Periodismo: [
    { creador: "Tomas Rebord", desc: "citó tu informe de investigación en su programa y dijo que sos el futuro del periodismo digital." },
    { creador: "Julio Leiva", desc: "te recommended en sus redes como un canal imperdible de contenido documental." }
  ]
};

// =========================================================================
// BANCO DE EVENTOS ESTÁNDAR
// =========================================================================
const bancoEventos = [
  // 1. GAMING
  {
    nicho: 'Gaming', minSubs: 0, maxSubs: 5000,
    titulo: "🎮 TORNEITO COMUNITARIO DE DISCORD",
    descripcion: "Un streamer chico organiza una copa rápida y falta un integrante.",
    opcionA: { texto: "Jugar tranquilo sin llamar la atención", beneficio: "+2 Constancia", accion: (p) => { p.atributos.constancia += 2; return "Sumaste horas de stream (+2 Constancia)."; } },
    opcionB: { texto: "Hacer 'Trash Talk' en el chat 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 5, p.suscriptores += 50, "🎯 Risas en el servidor (+5 Fama, +50 subs).") : (p.comunidad = Math.max(0, p.comunidad - 2), "💥 Te banearon por tóxico (-2 Comunidad).") }
  },
  {
    nicho: 'Gaming', minSubs: 5000, maxSubs: 1000000,
    titulo: "🎧 SPONSOR DE HARDWARE MEDIANO",
    descripcion: "Una marca te ofrece un combo de teclado y mouse a cambio de 3 videos.",
    opcionA: { texto: "Aceptar la review formal", beneficio: "+3 Edición", accion: (p) => { p.atributos.edicion += 3; return "Mejoró la calidad del setup (+3 Edición)."; } },
    opcionB: { texto: "Pedir dinero en efectivo además del canje 🎲", accion: (p) => Math.random() > 0.5 ? (p.dinero += 200, "🎯 ¡Aceptaron! Te pagaron US$ 200 extra.") : "💥 Rechazaron la propuesta por pedir de más." }
  },

  // 2. FÚTBOL
  {
    nicho: 'Fútbol', minSubs: 0, maxSubs: 5000,
    titulo: "⚽ PICADITO EN EL POTRERO",
    descripcion: "Tus amigos van a jugar y pensás en grabar con el celular.",
    opcionA: { texto: "Grabar desde afuera y analizar con humor", beneficio: "+2 Edición", accion: (p) => { p.atributos.edicion += 2; return "Hiciste una edición divertida (+2 Edición)."; } },
    opcionB: { texto: "Entrar a jugar e intentar un lujo 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 8, p.suscriptores += 60, "🎯 ¡Tiraste un caño viral! (+8 Fama, +60 subs).") : (p.atributos.constancia = Math.max(0, p.atributos.constancia - 1), "💥 Te pisaste la pelota y te caíste (-1 Constancia).") }
  },
  {
    nicho: 'Fútbol', minSubs: 5000, maxSubs: 1000000,
    titulo: "🏟️ INVITACIÓN A LA STREAMER CUP PRESENCIAL",
    descripcion: "Te convocan a jugar en una canchita con tribuna llena transmitida en vivo.",
    opcionA: { texto: "Entrenar para dar un rendimiento sólido", beneficio: "+5 Carisma", accion: (p) => { p.atributos.carisma += 5; return "Rendiste bien y sumaste respeto (+5 Carisma)."; } },
    opcionB: { texto: "Prometer picarla si hay un penal 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 35, p.suscriptores += 3000, "🎯 ¡La picaste y fue golazo! (+3000 subs, +35 Fama).") : (p.fama = Math.max(0, p.fama - 10), "💥 La atajó el arquero sin moverse (-10 Fama).") }
  },

  // 3. VLOG
  {
    nicho: 'Vlog', minSubs: 0, maxSubs: 5000,
    titulo: "📹 PROBANDO COMIDA DE CALLE",
    descripcion: "Salís a probar la hamburguesa más barata de la zona.",
    opcionA: { texto: "Hacer una reseña sincera y tranquila", beneficio: "+2 Carisma", accion: (p) => { p.atributos.carisma += 2; return "Tu honestidad agradó a los espectadores (+2 Carisma)."; } },
    opcionB: { texto: "Exagerar las reacciones para redes 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 80, p.fama += 5, "🎯 Clip viral (+80 subs, +5 Fama).") : (p.comunidad = Math.max(0, p.comunidad - 2), "💥 Sonó muy actuado y te criticaron (-2 Comunidad).") }
  },
  {
    nicho: 'Vlog', minSubs: 5000, maxSubs: 1000000,
    titulo: "✈️ VIAJE ECONÓMICO A OTRA CIUDAD",
    descripcion: "Tenés la oportunidad de viajar 3 días en colectivo para grabar contenido fuera de tu zona.",
    opcionA: { texto: "Planificar un itinerario bien organizado", beneficio: "+4 Marketing", accion: (p) => { p.atributos.marketing += 4; return "Aprovechaste cada rincón del viaje (+4 Marketing)."; } },
    opcionB: { texto: "Ir sin reserva de hotel y transmitir la aventura 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 1200, p.fama += 20, "🎯 La improvisación enganchó a todos (+1200 subs, +20 Fama).") : (p.dinero = Math.max(0, p.dinero - 100), "💥 Tuviste que pagar un hotel caro a última hora (-US$ 100).") }
  },

  // 4. TECNOLOGÍA
  {
    nicho: 'Tecnología', minSubs: 0, maxSubs: 5000,
    titulo: "📱 RESEÑA DE UN CELULAR VIEJO",
    descripcion: "Vas a hacer un video probando si un celular de hace 5 años sirve en la actualidad.",
    opcionA: { texto: "Explicar las especificaciones técnicas al detalle", beneficio: "+2 Algoritmo", accion: (p) => { p.atributos.algoritmo += 2; return "El algoritmo posicionó bien la búsqueda (+2 Algoritmo)."; } },
    opcionB: { texto: "Hacer una prueba de caída destructiva 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 10, p.suscriptores += 100, "🎯 ¡Video de impacto! (+100 subs, +10 Fama).") : (p.dinero = Math.max(0, p.dinero - 20), "💥 Rompiste el teléfono antes de empezar a grabar (-US$ 20).") }
  },
  {
    nicho: 'Tecnología', minSubs: 5000, maxSubs: 1000000,
    titulo: "🌐 INVITACIÓN A UN LANZAMIENTO EXCLUSIVO",
    descripcion: "Una gran marca te invita a la presentación de su nuevo dispositivo.",
    opcionA: { texto: "Publicar el video en la fecha de embargo asignada", beneficio: "+5 Marketing", accion: (p) => { p.atributos.marketing += 5; return "La marca valoró tu profesionalismo (+5 Marketing)."; } },
    opcionB: { texto: "Filtrar detalles en redes horas antes 🎲", accion: (p) => Math.random() > 0.5 ? (p.fama += 40, p.suscriptores += 4000, "🎯 Primicia mundial (+4000 subs, +40 Fama).") : (p.comunidad = Math.max(0, p.comunidad - 10), "💥 La marca te vetó de sus eventos futuros (-10 Comunidad).") }
  },

  // 5. COCINA
  {
    nicho: 'Cocina', minSubs: 0, maxSubs: 5000,
    titulo: "🍳 RECETA ECONÓMICA DE 5 MINUTOS",
    descripcion: "Querés enseñar a cocinar algo rico con muy pocos ingredientes.",
    opcionA: { texto: "Explicar paso a paso de forma clara", beneficio: "+2 Constancia", accion: (p) => { p.atributos.constancia += 2; return "La gente guardó la receta en favoritos (+2 Constancia)."; } },
    opcionB: { texto: "Intentar una técnica vistosa con fuego 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 70, p.fama += 6, "🎯 Quedó un clip estético increíble (+70 subs, +6 Fama).") : (p.atributos.edicion = Math.max(0, p.atributos.edicion - 1), "💥 Se te quemó la preparación (-1 Edición).") }
  },
  {
    nicho: 'Cocina', minSubs: 5000, maxSubs: 1000000,
    titulo: "🍖 RETO DE COMIDA GIGANTE",
    descripcion: "Te proponen preparar un plato de 5 kilos en vivo.",
    opcionA: { texto: "Invitar a un colega para compartir el plato", beneficio: "+4 Carisma", accion: (p) => { p.atributos.carisma += 4; return "Buena dinámica de equipo (+4 Carisma)."; } },
    opcionB: { texto: "Intentar comerlo vos solo en menos de 20 minutos 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 1500, p.fama += 25, "🎯 Reto cumplido, video viral (+1500 subs, +25 Fama).") : (p.atributos.constancia = Math.max(0, p.atributos.constancia - 2), "💥 Indigestión total. Perdiste días de trabajo (-2 Constancia).") }
  },

  // 6. PERIODISMO
  {
    nicho: 'Periodismo', minSubs: 0, maxSubs: 5000,
    titulo: "📰 INFORME SOBRE UNA NOTICIA BARRIAL",
    descripcion: "Hay un reclamo vecinal importante en tu zona y vas a investigarlo.",
    opcionA: { texto: "Verificar datos y entrevistar a ambas partes", beneficio: "+2 Algoritmo", accion: (p) => { p.atributos.algoritmo += 2; return "Informe serio y bien estructurado (+2 Algoritmo)."; } },
    opcionB: { texto: "Usar un título amarillista y picante 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 90, p.fama += 8, "🎯 Explotaron los clicks (+90 subs, +8 Fama).") : (p.comunidad = Math.max(0, p.comunidad - 3), "💥 Te desmintieron en los comentarios (-3 Comunidad).") }
  },
  {
    nicho: 'Periodismo', minSubs: 5000, maxSubs: 1000000,
    titulo: "🕵️ DOCUMENTAL DE INVESTIGACIÓN",
    descripcion: "Conseguiste información sobre un tema delicado de alcance nacional.",
    opcionA: { texto: "Publicar con fuentes protegidas y rigurosidad", beneficio: "+5 Constancia", accion: (p) => { p.atributos.constancia += 5; return "Ganaste prestigio en el rubro (+5 Constancia)."; } },
    opcionB: { texto: "Lanzar un 'En Vivo' revelando todo sin filtro 🎲", accion: (p) => Math.random() > 0.5 ? (p.suscriptores += 5000, p.fama += 45, "🎯 Pico histórico de audiencia (+5000 subs, +45 Fama).") : (p.dinero = Math.max(0, p.dinero - 300), "💥 Cartas documento y costos legales (-US$ 300).") }
  }
];

export function renderPasanCosas(el) {
  const container = el || document.createElement('div');
  if (!el) {
    container.id = 'pasanCosasScreen';
  }
  container.style.cssText = `max-width: 900px; margin: 20px auto; padding: 0 15px;`;

  const p = gameState.player;

  // -----------------------------------------------------------------------
  // 1. EVENTO LEYENDA (Raro: 5% probabilidad + >1.000 subs)
  // -----------------------------------------------------------------------
  const esEventoRaro = p.suscriptores >= 1000 && Math.random() < 0.05;

  if (esEventoRaro) {
    const listaTop = creadoresTopPorNicho[p.niche] || creadoresTopPorNicho['Gaming'];
    const creadorElegido = listaTop[Math.floor(Math.random() * listaTop.length)];

    container.innerHTML = `
      ${typeof renderHeaderHud === 'function' ? renderHeaderHud() : ''}
      <div style="
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 69, 0, 0.25) 100%);
        border: 2px solid var(--accent-yellow, #ffd700);
        border-radius: 16px;
        padding: 30px;
        margin-top: 20px;
        text-align: center;
        box-shadow: 0 0 25px rgba(255, 215, 0, 0.25);
      ">
        <span style="background: #ffd700; color: #000; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; text-transform: uppercase;">
          🔥 MOMENTO ÉPICO EN REDES
        </span>

        <h2 style="font-family: var(--font-heading); font-size: 2.2rem; color: #fff; margin: 15px 0 10px 0;">
          ¡${creadorElegido.creador.toUpperCase()} ENCONTRÓ TU CANAL!
        </h2>

        <p style="color: #e0e0e0; font-size: 1.05rem; line-height: 1.6; max-width: 650px; margin: 0 auto 25px auto;">
          ¡Increíble! <strong>${creadorElegido.creador}</strong> ${creadorElegido.desc}
        </p>

        <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
          <div style="background: rgba(0,0,0,0.6); border: 1px solid #ffd700; padding: 12px 20px; border-radius: 10px;">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; display: block;">Vistas Explosivas</span>
            <strong style="font-size: 1.2rem; color: #fff;">+100.000</strong>
          </div>
          <div style="background: rgba(0,0,0,0.6); border: 1px solid #4cd137; padding: 12px 20px; border-radius: 10px;">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; display: block;">Nuevos Subs</span>
            <strong style="font-size: 1.2rem; color: #4cd137;">+25.000</strong>
          </div>
          <div style="background: rgba(0,0,0,0.6); border: 1px solid #ffd700; padding: 12px 20px; border-radius: 10px;">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; display: block;">Fama Global</span>
            <strong style="font-size: 1.2rem; color: #ffd700;">+20 Fama</strong>
          </div>
        </div>

        <button id="btn-reclamar-epico" style="
          padding: 16px 32px;
          background: linear-gradient(90deg, #ffd700, #ff8c00);
          color: #000;
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-transform: uppercase;
        ">
          🚀 ¡APROVECHAR EL IMPULSO!
        </button>
      </div>
    `;

    setTimeout(() => {
      container.querySelector('#btn-reclamar-epico').addEventListener('click', () => {
        p.suscriptores += 25000;
        p.fama += 20;
        p.vistasTotales += 100000;
        gameState.ultimoEventoResultado = `🔥 ¡El impulso de ${creadorElegido.creador} hizo explotar tus métricas! Sumaste +100.000 vistas, +25.000 subs y +20 Fama.`;
        window.location.hash = '#videoResult';
      });
    }, 0);

    return container;
  }

  // -----------------------------------------------------------------------
  // 2. EVENTO CASINO ONLINE (20% probabilidad)
  // -----------------------------------------------------------------------
  const esEventoCasino = Math.random() < 0.20;

  if (esEventoCasino) {
    const ofertaDinero = Math.floor((p.suscriptores * 0.25) + (p.fama * 300) + 1000);
    const subsPerdidos = Math.floor((p.suscriptores * 0.12) + 50);

    container.innerHTML = `
      ${typeof renderHeaderHud === 'function' ? renderHeaderHud() : ''}
      <div style="
        background: linear-gradient(135deg, rgba(140, 122, 230, 0.25) 0%, rgba(30, 27, 46, 0.95) 100%);
        border: 2px solid #8c7ae6;
        border-radius: 16px;
        padding: 30px;
        margin-top: 20px;
        text-align: center;
        box-shadow: 0 0 25px rgba(140, 122, 230, 0.3);
      ">
        <span style="background: #8c7ae6; color: #fff; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; text-transform: uppercase;">
          🎰 OFERTA DE SPONSOR DUDOSO
        </span>

        <h2 style="font-family: var(--font-heading); font-size: 2.2rem; color: #fbc531; margin: 15px 0 10px 0;">
          ¿PROMOVER UN CASINO ONLINE?
        </h2>

        <p style="color: #dcdde1; font-size: 1.05rem; line-height: 1.6; max-width: 650px; margin: 0 auto 25px auto;">
          Un casino de sospechosa procedencia quiere sponsorear tu canal. Te ofrecen efectivo inmediato, pero a tu comunidad no le va a gustar nada y vas a perder seguidores indignados.
        </p>

        <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 25px; flex-wrap: wrap;">
          <div style="background: rgba(0,0,0,0.6); border: 1px solid #4cd137; padding: 12px 25px; border-radius: 10px;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; display: block;">Pago En Efectivo</span>
            <strong style="font-size: 1.4rem; color: #4cd137;">+$${ofertaDinero.toLocaleString()}</strong>
          </div>
          <div style="background: rgba(0,0,0,0.6); border: 1px solid #e84118; padding: 12px 25px; border-radius: 10px;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; display: block;">Consecuencia</span>
            <strong style="font-size: 1.4rem; color: #e84118;">-${subsPerdidos.toLocaleString()} Subs</strong>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <button id="opt-casino-accept" class="interactive-card" style="background: rgba(76, 209, 55, 0.15); border: 1px solid #4cd137; padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;">
            <span style="color: #4cd137; font-size: 0.75rem; text-transform: uppercase; display: block; font-weight: bold;">💰 Agarrar la Plata</span>
            <strong style="font-size: 1rem; display: block; margin: 8px 0;">Aceptar el contrato del Casino</strong>
            <span style="color: #4cd137; font-size: 0.8rem;">Ganas efectivo, pero pierdes suscriptores</span>
          </button>

          <button id="opt-casino-reject" class="interactive-card" style="background: rgba(232, 65, 24, 0.15); border: 1px solid #e84118; padding: 20px; border-radius: 12px; color: #fff; text-align: left; cursor: pointer;">
            <span style="color: #e84118; font-size: 0.75rem; text-transform: uppercase; display: block; font-weight: bold;">🛡️ Mantener la Ética</span>
            <strong style="font-size: 1rem; display: block; margin: 8px 0;">Rechazar la propuesta</strong>
            <span style="color: #fbc531; font-size: 0.8rem;">Ganas respeto en la comunidad (+2 Carisma)</span>
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      container.querySelector('#opt-casino-accept').addEventListener('click', () => {
        p.dinero += ofertaDinero;
        p.suscriptores = Math.max(0, p.suscriptores - subsPerdidos);
        gameState.ultimoEventoResultado = `🎰 Aceptaste el sponsoreo del casino. Ganaste +$${ofertaDinero.toLocaleString()}, pero perdiste ${subsPerdidos.toLocaleString()} suscriptores enojados.`;
        window.location.hash = '#videoResult';
      });

      container.querySelector('#opt-casino-reject').addEventListener('click', () => {
        if (!p.atributos) p.atributos = {};
        p.atributos.carisma = (p.atributos.carisma || 10) + 2;
        gameState.ultimoEventoResultado = `🛡️ Rechazaste la oferta del casino. Tu comunidad respeta tu integridad (+2 Carisma).`;
        window.location.hash = '#videoResult';
      });
    }, 0);

    return container;
  }

  // -----------------------------------------------------------------------
  // 3. SELECCIÓN DE EVENTO ESTÁNDAR
  // -----------------------------------------------------------------------
  let eventosValidos = bancoEventos.filter(e => 
    e.nicho === p.niche && p.suscriptores >= e.minSubs && p.suscriptores <= e.maxSubs
  );

  // Fallback inteligente: Si por los subs no encuentra evento exacto, toma cualquiera de su nicho
  if (eventosValidos.length === 0) {
    eventosValidos = bancoEventos.filter(e => e.nicho === p.niche);
  }

  const evento = eventosValidos.length > 0 
    ? eventosValidos[Math.floor(Math.random() * eventosValidos.length)]
    : bancoEventos[0];

  container.innerHTML = `
    ${typeof renderHeaderHud === 'function' ? renderHeaderHud() : ''}
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

export const pasanCosasScreen = { render: renderPasanCosas };
export default pasanCosasScreen;
