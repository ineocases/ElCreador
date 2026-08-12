// engine/gameState.js
// Estado central de El Creador.
// REGLA: 2 trimestres = 1 año.
// El jugador elige 1 video destacado por trimestre; después su canal publica
// entre 30 y 150 videos EN ESE TRIMESTRE. Son videos del propio jugador,
// como los partidos que jugó un futbolista: el jugador ve el volumen y el resultado,
// pero no tiene que elegir manualmente cada publicación.

import { creatorsIniciales } from "../data/creators.js";
import { ensureAdvancedState, advanceEconomy } from "./advancedSystems.js";

const SAVE_KEY = "elCreador_saveData";
const TRIMESTRES_POR_AÑO = 2;

function crearId(prefix = "id") {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function costoVuelo(pais) {
    const costos = {
        "Argentina": 0,
        "Uruguay": 180,
        "Chile": 350,
        "Brasil": 550,
        "Colombia": 850,
        "México": 1100,
        "España": 1800,
        "Estados Unidos": 2200
    };
    return costos[pais] ?? 900;
}

function crearAtributos() {
    return {
        edicion: 10,
        carisma: 15,
        algoritmo: 10,
        marketing: 5,
        constancia: 15,
        humor: 5,
        creatividad: 5,
        networking: 5
    };
}

function crearStats() {
    return {
        mejorVideo: 0,
        videosVirales: 0,
        videosPublicados: 0,
        colaboraciones: 0,
        sponsors: 0,
        eventosGanados: 0,
        añosJugados: 0
    };
}

function crearPlayer() {
    return {
        partidaIniciada: false,
        nombre: "Creador",
        canal: "Mi Canal",
        niche: "Gaming",

        año: 2026,
        trimestre: 1,
        edad: 18,
        carreraAño: 1,
        retirado: false,

        dinero: 500,
        suscriptores: 50,
        vistasTotales: 0,
        videosSubidos: 0,
        fama: 0,
        famaAudiencia: 0,
        famaLogros: 0,
        famaHitosAlcanzados: [],
        debutYear: 2026,
        revelacionGanada: false,
        comunidad: 50,
        reputacion: 50,
        ingresosTrimestre: 0,
        ingresosGenerados: 0,
        ingresosDesglose: { publicidad: 0, sponsors: 0, negocios: 0, afiliados: 0, donaciones: 0 },

        atributos: crearAtributos(),

        equipment: {
            pc: "government_pc",
            camera: "old_phone",
            microphone: "earphones"
        },

        stats: crearStats(),
        awardsStats: { clips: 0, enojos: 0, reacciones: 0 },
        relationships: {},
        pretemporada: null,
        shopTier: 1,
        inventory: [],

        videoSubidoEsteTrimestre: false,
        minigameIndex: 0,
        actividadTrimestre: null,
        historialTrimestre1: null,
        historialTrimestre2: null,
        historialAños: [],
        awardsHistory: [],
        yearStartSnapshot: null
    };
}

function crearCreadores() {
    return creatorsIniciales.map(creator => ({
        ...creator,
        relacion: Number(creator.relacion) || 0,
        respeto: Number(creator.respeto) || 0,
        rivalidad: Number(creator.rivalidad) || 0,
        colaboraciones: Number(creator.colaboraciones) || 0
    }));
}

function snapshotAño(player) {
    return {
        año: Number(player.año) || 2026,
        suscriptores: Number(player.suscriptores) || 0,
        vistasTotales: Number(player.vistasTotales) || 0,
        videosSubidos: Number(player.videosSubidos) || 0,
        dinero: Number(player.dinero) || 0,
        ingresosGenerados: Number(player.ingresosGenerados) || 0,
        fama: Number(player.fama) || 0,
        reputacion: Number(player.reputacion) || 50
    };
}

function eventHasPositive(option) {
    const a = option?.action || {};
    return Object.values(a).some(v => Number(v) > 0);
}


const FAMA_HITOS_SUBS = [
    [1000, 5],
    [5000, 10],
    [10000, 15],
    [50000, 25],
    [100000, 35],
    [500000, 50],
    [1000000, 65],
    [5000000, 80],
    [10000000, 90]
];

function famaAudienciaPorSubs(subs) {
    const cantidad = Math.max(0, Number(subs) || 0);
    let valor = 0;
    for (const [umbral, fama] of FAMA_HITOS_SUBS) {
        if (cantidad >= umbral) valor = fama;
        else break;
    }
    return valor;
}

function recalcularFama(player) {
    if (!player) return 0;
    player.famaAudiencia = famaAudienciaPorSubs(player.suscriptores);
    player.famaLogros = Math.max(0, Number(player.famaLogros) || 0);
    player.fama = Math.max(0, Math.min(100, Math.round(player.famaAudiencia + player.famaLogros)));
    return player.fama;
}

function agregarFamaLogro(player, cantidad, motivo = "") {
    if (!player) return 0;
    const antes = Math.round(Number(player.fama) || 0);
    player.famaLogros = Math.max(0, Number(player.famaLogros) || 0) + Math.max(0, Number(cantidad) || 0);
    recalcularFama(player);
    const despues = Math.round(Number(player.fama) || 0);
    const diferencia = despues - antes;
    if (diferencia > 0) {
        player.ultimoDesgloseFama = {
            total: diferencia,
            texto: motivo ? `+${diferencia} por ${motivo}` : `+${diferencia} por logro`,
            fecha: Date.now()
        };
    }
    return diferencia;
}

function actualizarFamaPorSubs(player) {
    if (!player) return { cambio: 0, texto: "" };
    const antes = Math.round(Number(player.fama) || 0);
    const audienciaAntes = Number(player.famaAudiencia) || 0;
    recalcularFama(player);
    const despues = Math.round(Number(player.fama) || 0);
    const cambio = despues - antes;
    if (cambio > 0 && Number(player.famaAudiencia) !== audienciaAntes) {
        const hit = FAMA_HITOS_SUBS.filter(([umbral]) => Number(player.suscriptores) >= umbral).at(-1);
        if (hit) {
            player.ultimoDesgloseFama = {
                total: cambio,
                texto: `+${cambio} por hito de ${hit[0].toLocaleString("es-AR")} subs`,
                fecha: Date.now()
            };
        }
    }
    return { cambio, texto: player.ultimoDesgloseFama?.texto || "" };
}

export const gameState = {
    player: crearPlayer(),
    time: { año: 2026, trimestre: 1 },

    inventory: [],
    notifications: [],
    creators: crearCreadores(),
    trends: [],
    sponsors: [],
    worldNews: [],
    worldYearNews: [],
    worldDramaHistory: [],

    pendingSponsorOffer: null,
    pendingEvent: null,
    pendingCollabOffer: null,
    pendingVideoSelection: null,
    boosts: {},

    lastVideo: null,
    lastVideoResult: null,
    lastQuarterResult: null,
    lastYearSummary: null,
    lastAwardsResults: null,
    ultimoEventoResultado: null,
    lastCollab: null,

    adminMode: false,

    iniciarPartida(datos = {}) {
        this.player = crearPlayer();
        this.player.partidaIniciada = true;
        ensureAdvancedState(this);
        this.player.nombre = String(datos.nombre || "Creador").trim() || "Creador";
        this.player.canal = String(datos.canal || "Mi Canal").trim() || "Mi Canal";
        this.player.niche = datos.niche || "Gaming";
        this.player.debutYear = 2026;
        this.player.edad = 18;
        this.player.carreraAño = 1;
        this.player.retirado = false;
        this.player.revelacionGanada = false;
        this.player.famaAudiencia = 0;
        this.player.famaLogros = 0;
        this.player.famaHitosAlcanzados = [];
        recalcularFama(this.player);

        this.time = { año: 2026, trimestre: 1 };
        this.player.año = 2026;
        this.player.trimestre = 1;
        this.player.yearStartSnapshot = snapshotAño(this.player);

        this.inventory = [];
        this.notifications = [];
        this.trends = [];
        this.sponsors = [];
        this.worldNews = [];
        this.worldYearNews = [];
        this.worldDramaHistory = [];
        this.pendingSponsorOffer = null;
        this.pendingEvent = null;
        this.pendingCollabOffer = null;
        this.pendingVideoSelection = null;
        this.boosts = {};
        this.lastVideo = null;
        this.lastVideoResult = null;
        this.lastQuarterResult = null;
        this.lastYearSummary = null;
        this.lastAwardsResults = null;
        this.worldNews = [];
        this.worldYearNews = [];
        this.ultimoEventoResultado = null;
        this.lastCollab = null;

        this.creators = crearCreadores();
        this.creators.forEach(creator => {
            this.player.relationships[creator.id] = 0;
        });

        this.agregarNotificacion({
            tipo: "sistema",
            titulo: "🎬 Carrera iniciada",
            descripcion: `Bienvenido, ${this.player.nombre}. ${this.player.canal} empieza con 50 suscriptores.`
        });

        ensureAdvancedState(this);
        this.guardar();
        return this.player;
    },

    mejorarAtributo(atributo, cantidad) {
        if (!this.player.atributos) this.player.atributos = crearAtributos();
        if (typeof this.player.atributos[atributo] !== "number") this.player.atributos[atributo] = 0;
        this.player.atributos[atributo] = Math.max(
            0,
            this.player.atributos[atributo] + (Number(cantidad) || 0)
        );
        return this.player.atributos[atributo];
    },

    agregarNotificacion(data = {}) {
        const notificacion = {
            id: crearId("notification"),
            tipo: data.tipo || "general",
            titulo: data.titulo || "Nueva notificación",
            descripcion: data.descripcion || "",
            leida: false,
            fecha: Date.now(),
            ...data
        };

        this.notifications.unshift(notificacion);
        this.notifications = this.notifications.slice(0, 50);
        return notificacion;
    },

    marcarNotificacionLeida(id) {
        const n = this.notifications.find(item => item.id === id);
        if (n) n.leida = true;
    },

    notificacionesNoLeidas() {
        return this.notifications.filter(n => !n.leida).length;
    },

    puedeSubirVideo() {
        return !this.player.videoSubidoEsteTrimestre;
    },

    registrarVideoPublicado() {
        this.player.videoSubidoEsteTrimestre = true;
    },

    // Los eventos aparecen automáticamente al final del trimestre.
    // La decisión NO es decorativa: modifica el resultado final del trimestre.
    generarEventoPendiente() {
        const p = this.player;
        if (!p || this.pendingEvent) return null;

        // Aumentar probabilidad de eventos: ahora 85% (era 72%)
        if (Math.random() > 0.85) return null;

        const subs = Number(p.suscriptores) || 0;
        const reputacion = Number(p.reputacion) || 50;
        const fama = Number(p.fama) || 0;

        const eventos = [
            // ==========================================================
            // CONTROVERSIAS / PROBLEMAS
            // ==========================================================
            {
                id: "clip_polemico", minSubs: 5000, negativo: true,
                title: "🎥 Un clip polémico explotó en redes",
                text: "Un recorte de tu contenido empezó a circular fuera de contexto y la gente está discutiendo sobre vos.",
                a: { label: "Salir a aclararlo", desc: "-8% vistas, +5 reputación", action: { reputacion: 5 }, cierre: { vistasPct: -0.08 } },
                b: { label: "No responder", desc: "-4% subs, pero +3 fama", action: { reputacion: -3, fama: 3 }, cierre: { subsPct: -0.04 } }
            },
            {
                id: "acusacion_bots", minSubs: 15000, negativo: true,
                title: "🤖 Te acusan de usar bots",
                text: "Una cuenta grande publicó un hilo diciendo que tu crecimiento no es orgánico. No hay pruebas claras, pero el rumor prende.",
                a: { label: "Mostrar números", desc: "+6% reputación, -5% vistas", action: { reputacion: 6 }, cierre: { vistasPct: -0.05 } },
                b: { label: "Ignorar el rumor", desc: "+5% vistas, -8 reputación", action: { reputacion: -8, fama: 2 }, cierre: { vistasPct: 0.05 } }
            },
            {
                id: "sponsor_casino", minSubs: 50000, negativo: true,
                title: "🎰 Te ofrecen un sponsor de casino",
                text: "La plata es muy buena para el tamaño de tu canal, pero aceptar puede cambiar cómo te ve tu comunidad.",
                a: { label: "Aceptar la plata", desc: "+$1.500, -12 reputación", action: { dinero: 1500, reputacion: -12, fama: 3 }, cierre: { dineroPct: 0.08 } },
                b: { label: "Rechazarlo", desc: "+8 reputación, -2% ingresos", action: { reputacion: 8 }, cierre: { dineroPct: -0.02 } }
            },
            {
                id: "hate_raid", minSubs: 10000, negativo: true,
                title: "🚨 Te cayó un hate raid",
                text: "Una discusión en otra comunidad terminó mandando gente a tu canal. El chat se llenó de mensajes y la situación puede escalar.",
                a: { label: "Moderar fuerte", desc: "-6% vistas, +6 comunidad", action: { comunidad: 6 }, cierre: { vistasPct: -0.06 } },
                b: { label: "Dejar que pase", desc: "+12% vistas, -10 reputación", action: { reputacion: -10, fama: 2 }, cierre: { vistasPct: 0.12 } }
            },
            {
                id: "exponen_en_vivo", minSubs: 25000, negativo: true,
                title: "📡 Te expusieron en vivo",
                text: "Otro creador mostró capturas sobre una discusión vieja. Ahora el tema está en todos lados.",
                a: { label: "Dar contexto", desc: "+5 reputación, -7% vistas", action: { reputacion: 5 }, cierre: { vistasPct: -0.07 } },
                b: { label: "Contraatacar", desc: "+20% vistas, -12 reputación", action: { reputacion: -12, fama: 4 }, cierre: { vistasPct: 0.20 } }
            },
            {
                id: "hack", minSubs: 5000, negativo: true,
                title: "🔓 Intentaron hackear tu cuenta",
                text: "Perdiste acceso durante unas horas y parte de tu audiencia pensó que habías desaparecido.",
                a: { label: "Pagar seguridad", desc: "-$120, +10 reputación", action: { dinero: -120, reputacion: 10 }, cierre: { vistasPct: -0.03 } },
                b: { label: "Resolverlo solo", desc: "Sin gasto, pero -12% vistas", action: { reputacion: -4 }, cierre: { vistasPct: -0.12 } }
            },
            {
                id: "vendido", minSubs: 15000, negativo: true,
                title: "💸 Te gritaron 'vendido'",
                text: "Una colaboración comercial generó rechazo. Parte de tu comunidad cree que cambiaste tu contenido por plata.",
                a: { label: "Explicar el acuerdo", desc: "+5 reputación, -4% ingresos", action: { reputacion: 5 }, cierre: { dineroPct: -0.04 } },
                b: { label: "Seguir igual", desc: "+8% ingresos, -7 reputación", action: { reputacion: -7 }, cierre: { dineroPct: 0.08 } }
            },
            {
                id: "old_video_viral", minSubs: 500, negativo: false,
                title: "🔥 Un video viejo volvió a explotar",
                text: "Un video que publicaste hace meses apareció en recomendaciones y empezó a recibir una segunda vida.",
                a: { label: "Exprimir el momento", desc: "Gran pico de vistas, subs e ingresos", action: { fama: 3 }, cierre: { vistasPct: 0.55, subsPct: 0.32, dineroPct: 0.30 } },
                b: { label: "Dejarlo correr", desc: "Menor pico, pero mejor reputación", action: { reputacion: 4 }, cierre: { vistasPct: 0.20, subsPct: 0.12, dineroPct: 0.10 } }
            },
            {
                id: "tiktok_viral", minSubs: 500, negativo: false,
                title: "📱 Un clip explotó en TikTok",
                text: "Un recorte de tu video salió de tu comunidad y empezó a juntar millones de reproducciones.",
                a: { label: "Aprovechar el momento", desc: "+28% vistas, +18% subs", action: { fama: 4, networking: 2 }, cierre: { vistasPct: 0.28, subsPct: 0.18 } },
                b: { label: "Dejar que fluya", desc: "+12% vistas, +6% reputación", action: { reputacion: 6 }, cierre: { vistasPct: 0.12, subsPct: 0.06 } }
            },

            // ==========================================================
            // REACCIONES DE CREADORES GRANDES
            // ==========================================================
            {
                id: "coscu_react", minSubs: 5000, negativo: false, creatorId: "coscu",
                title: "🎬 Coscu reaccionó a tu clip",
                text: "Tu clip apareció en un stream de Coscu. Su chat empezó a buscar tu canal.",
                a: { label: "Entrar al stream", desc: "+120% subs, +150% vistas y +15 fama", action: { fama: 15, networking: 4 }, cierre: { subsPct: 1.20, vistasPct: 1.50 } },
                b: { label: "Agradecer y seguir", desc: "+55% subs, +70% vistas y +5 reputación", action: { reputacion: 5 }, cierre: { subsPct: 0.55, vistasPct: 0.70 } }
            },
            {
                id: "davo_invite", minSubs: 10000, negativo: false, creatorId: "davoo",
                title: "🎤 Davo te invitó a un stream",
                text: "Davo quiere que aparezcas en un stream para hablar de tu contenido y del nicho que compartís.",
                a: { label: "Aceptar", desc: "+75% subs, +90% vistas y +12 reputación", action: { reputacion: 12, networking: 5 }, cierre: { subsPct: 0.75, vistasPct: 0.90 } },
                b: { label: "Rechazar por agenda", desc: "+3 constancia, oportunidad perdida", action: { constancia: 3 }, cierre: {} }
            },
            {
                id: "spreen_vs", minSubs: 25000, negativo: false, creatorId: "spreen",
                title: "🎮 Spreen te retó a un VS",
                text: "Spreen vio un clip tuyo y te tiró un desafío público. Puede ser un salto enorme o un papelón.",
                a: { label: "Aceptar el VS", desc: "+100% vistas y +45% subs", action: { fama: 8, networking: 5 }, cierre: { vistasPct: 1.00, subsPct: 0.45 } },
                b: { label: "No arriesgar", desc: "+10 reputación y +12% subs", action: { reputacion: 10 }, cierre: { subsPct: 0.12 } }
            },
            {
                id: "ibai_mention", minSubs: 100000, negativo: false, creatorId: "ibai",
                title: "👑 Ibai te mencionó",
                text: "Tu nombre apareció en un stream internacional. Gente de afuera empezó a buscar tu canal.",
                a: { label: "Aprovechar el salto", desc: "+250% subs y +220% vistas", action: { fama: 20, reputacion: 5 }, cierre: { subsPct: 2.50, vistasPct: 2.20 } },
                b: { label: "Mantener el perfil", desc: "+75% subs, +90% vistas y +8 reputación", action: { reputacion: 8 }, cierre: { subsPct: 0.75, vistasPct: 0.90 } }
            },

            // ==========================================================
            // 20 EVENTOS CULTURALES / COTIDIANOS NUEVOS
            // ==========================================================
            { id:"feriado", minSubs:50, title:"🇦🇷 Llegó un feriado largo", text:"Tu audiencia está conectada más horas de lo normal.", a:{label:"Subir contenido especial",desc:"+20% vistas",action:{constancia:1},cierre:{vistasPct:.20}}, b:{label:"Descansar",desc:"+6 reputación",action:{reputacion:6},cierre:{}} },
            { id:"superclasico", minSubs:1000, title:"⚽ Se juega el Superclásico", text:"Todo el feed está hablando del partido.", a:{label:"Hacer contenido al instante",desc:"+30% vistas",action:{algoritmo:2},cierre:{vistasPct:.30}}, b:{label:"Mantener mi temática",desc:"+5 reputación",action:{reputacion:5},cierre:{}} },
            { id:"mundial", minSubs:5000, title:"🏆 El Mundial domina internet", text:"El país está pendiente de cada partido.", a:{label:"Cubrir el Mundial",desc:"+45% vistas",action:{marketing:2},cierre:{vistasPct:.45}}, b:{label:"No subirme al tema",desc:"Sin bonus, +3 comunidad",action:{comunidad:3},cierre:{}} },
            { id:"cadena", minSubs:50, title:"📺 Cadena nacional inesperada", text:"La programación cambió y tu audiencia está dispersa.", a:{label:"Hacer un stream especial",desc:"+10% vistas",action:{carisma:1},cierre:{vistasPct:.10}}, b:{label:"Esperar",desc:"-5% vistas",action:{},cierre:{vistasPct:-.05}} },
            { id:"juego_masivo", minSubs:500, title:"🎮 Salió un juego masivo", text:"Todo el mundo quiere verlo.", a:{label:"Comprar y subir primero",desc:"-$20, +35% vistas",action:{dinero:-20,algoritmo:2},cierre:{vistasPct:.35}}, b:{label:"Esperar unos días",desc:"+10% ingresos",action:{marketing:1},cierre:{dineroPct:.10}} },
            { id:"wifi", minSubs:50, negativo:true, title:"📶 Se cayó el WiFi", text:"Justo cuando ibas a publicar.", a:{label:"Pagar una solución",desc:"-$80, -3% vistas",action:{dinero:-80},cierre:{vistasPct:-.03}}, b:{label:"Improvisar",desc:"Puede salir mal",action:{reputacion:-2},cierre:{vistasPct:-.12}} },
            { id:"equipo_roto", minSubs:1000, negativo:true, title:"🎥 Se rompió una cámara", text:"Tu equipo principal dejó de funcionar.", a:{label:"Repararla",desc:"-$150, mantiene el rendimiento",action:{dinero:-150},cierre:{vistasPct:0}}, b:{label:"Usar el celular",desc:"Gratis, -15% vistas",action:{},cierre:{vistasPct:-.15}} },
            { id:"dolar", minSubs:1000, negativo:true, title:"💵 Subió fuerte el dólar", text:"Algunos costos de producción se dispararon.", a:{label:"Recortar producción",desc:"-10% videos",action:{},cierre:{videosPct:-.10}}, b:{label:"Invertir igual",desc:"-$100, +8% vistas",action:{dinero:-100},cierre:{vistasPct:.08}} },
            { id:"robo_cuenta", minSubs:5000, negativo:true, title:"🔐 Intentaron robar tu cuenta", text:"Un phishing apunta a creadores de tu tamaño.", a:{label:"Pagar seguridad",desc:"-$250, +reputación",action:{dinero:-250,reputacion:6},cierre:{}}, b:{label:"Ignorarlo",desc:"10% de perder rendimiento",action:{reputacion:-5},cierre:{vistasPct:-.18}} },
            { id:"fan_encuentro", minSubs:500, title:"❤️ Un fan te reconoce en la calle", text:"El momento termina en una foto que circula por redes.", a:{label:"Hablar con él",desc:"+8 comunidad",action:{comunidad:8},cierre:{subsPct:.04}}, b:{label:"Seguir de largo",desc:"Sin efecto",action:{},cierre:{}} },
            { id:"podcast_clip", minSubs:2000, title:"🎙️ Una frase tuya se vuelve clip", text:"Una respuesta del podcast empezó a circular.", a:{label:"Publicarla en clips",desc:"+25% vistas",action:{humor:2},cierre:{vistasPct:.25,subsPct:.10}}, b:{label:"Dejarla orgánica",desc:"+4 reputación",action:{reputacion:4},cierre:{vistasPct:.08}} },
            { id:"raid_bueno", minSubs:1000, title:"🤝 Un streamer chico te manda audiencia", text:"Una comunidad vecina te descubre.", a:{label:"Recibirlos",desc:"+12% subs",action:{networking:2},cierre:{subsPct:.12}}, b:{label:"No interactuar",desc:"+2 reputación",action:{reputacion:2},cierre:{}} },
            { id:"festival", minSubs:10000, title:"🎤 Te invitan a un evento de creadores", text:"Puede ser una gran vidriera, pero cuesta tiempo.", a:{label:"Ir",desc:"-$100, +30% vistas",action:{dinero:-100,networking:3},cierre:{vistasPct:.30,subsPct:.12}}, b:{label:"Quedarme creando",desc:"+10% ingresos",action:{constancia:2},cierre:{dineroPct:.10}} },
            { id:"noticia_futbol", minSubs:1000, title:"⚽ Explota una noticia de fútbol", text:"Tu nicho tiene una oportunidad inmediata.", a:{label:"Hacer análisis urgente",desc:"+28% vistas",action:{algoritmo:2},cierre:{vistasPct:.28}}, b:{label:"Esperar confirmación",desc:"+3 reputación",action:{reputacion:3},cierre:{}} },
            { id:"tendencia_cocina", minSubs:500, title:"🍳 Una receta se vuelve tendencia", text:"Todo TikTok está intentando cocinar lo mismo.", a:{label:"Hacer mi versión",desc:"+24% vistas",action:{creatividad:2},cierre:{vistasPct:.24,subsPct:.08}}, b:{label:"No copiar tendencias",desc:"+5 reputación",action:{reputacion:5},cierre:{}} },
            { id:"nuevo_telefono", minSubs:10000, title:"📱 Sale un teléfono muy esperado", text:"La audiencia quiere ver pruebas reales.", a:{label:"Comprar y probarlo",desc:"-$300, +35% vistas",action:{dinero:-300,marketing:2},cierre:{vistasPct:.35}}, b:{label:"Esperar sponsor",desc:"Sin gasto, menor impacto",action:{},cierre:{vistasPct:.08}} },
            { id:"premiere", minSubs:5000, title:"🎬 Te invitan a una premiere", text:"Un evento puede acercarte a otros creadores.", a:{label:"Ir y cubrirla",desc:"+15% vistas, +networking",action:{networking:3},cierre:{vistasPct:.15,subsPct:.05}}, b:{label:"Quedarme en casa",desc:"+4 comunidad",action:{comunidad:4},cierre:{}} },
            { id:"lluvia", minSubs:50, title:"🌧️ Lluvia y ciudad vacía", text:"La gente se queda en casa y consume más contenido.", a:{label:"Aprovechar la noche",desc:"+18% vistas",action:{constancia:1},cierre:{vistasPct:.18}}, b:{label:"Descansar",desc:"+3 reputación",action:{reputacion:3},cierre:{}} },
            { id:"internet_trend", minSubs:100, title:"🌐 Un meme domina internet", text:"Tenés pocas horas para reaccionar antes de que muera.", a:{label:"Subir contenido ya",desc:"+32% vistas, riesgo",action:{algoritmo:1},cierre:{vistasPct:.32}}, b:{label:"Esperar",desc:"+5 reputación",action:{reputacion:5},cierre:{vistasPct:.03}} },

            // Eventos neutros para que no todo sea drama.
            {
                id: "trend", minSubs: 50, negativo: false,
                title: "📈 Apareció una tendencia fuerte",
                text: "El tema está explotando. Podés subirte a la ola o mantener tu identidad.",
                a: { label: "Subirme a la tendencia", desc: "+18% vistas y +10% subs", action: { algoritmo: 2, creatividad: 1 }, cierre: { vistasPct: 0.18, subsPct: 0.10 } },
                b: { label: "Mantener mi estilo", desc: "+10% ingresos y +8 reputación", action: { creatividad: 2, reputacion: 2 }, cierre: { dineroPct: 0.10 } }
            },
            {
                id: "equipment", minSubs: 500, negativo: false,
                title: "🖥️ Tu equipo empieza a quedarse corto",
                text: "La audiencia creció y la calidad del contenido empieza a ser un problema.",
                a: { label: "Invertir $120", desc: "-$120, +15% vistas", action: { dinero: -120, edicion: 4 }, cierre: { vistasPct: 0.15 } },
                b: { label: "Aguantar", desc: "+10% videos", action: { constancia: 2 }, cierre: { videosPct: 0.10 } }
            }
        ];

        // Cualquier creador del mundo puede convertirse en una interacción.
        // Los más grandes requieren más audiencia; los rookies pueden descubrirte antes.
        const dinamicos = (this.creators || [])
            .filter(c => c.activo !== false && c.id !== "player")
            .filter(c => !Number.isInteger(c.debutYear) || c.debutYear <= Number(this.time.año || 2026))
            .filter(c => Number(c.seguidores || 0) > 1000)
            .filter(c => !eventos.some(e => e.creatorId === c.id))
            .filter(c => {
                const min = Math.max(1000, Math.min(150000, Math.round(Math.sqrt(Number(c.seguidores || 1)) * 10)));
                return subs >= min;
            })
            .map(c => {
                const escala = Math.max(0.35, Math.min(1.60, Number(c.popularidad || 50) / 65));
                const baseSubs = Math.round(0.35 * escala * 100) / 100;
                const baseViews = Math.round(0.55 * escala * 100) / 100;
                return {
                    id: `creator_react_${c.id}`,
                    minSubs: Math.max(1000, Math.min(150000, Math.round(Math.sqrt(Number(c.seguidores || 1)) * 10))),
                    negativo: false,
                    creatorId: c.id,
                    title: `🎬 ${c.nombre} descubrió tu contenido`,
                    text: `${c.nombre} vio un clip tuyo y lo mencionó frente a su comunidad. La atención puede ser enorme si aprovechás el momento.`,
                    a: { label: "Aprovechar la oportunidad", desc: `+${Math.round(baseSubs * 100)}% subs · +${Math.round(baseViews * 100)}% vistas`, action: { fama: Math.max(2, Math.round(8 * escala)), networking: 2 }, cierre: { subsPct: baseSubs, vistasPct: baseViews } },
                    b: { label: "Agradecer y seguir", desc: `+${Math.round(baseSubs * 55)}% subs · +${Math.round(baseViews * 45)}% vistas`, action: { reputacion: 2 }, cierre: { subsPct: baseSubs * 0.55, vistasPct: baseViews * 0.45 } }
                };
            });

        eventos.push(...dinamicos);

        const validos = eventos.filter(e => subs >= e.minSubs);
        if (!validos.length) return null;

        // A mayor tamaño del canal, más variedad de interacciones. Los problemas
        // son frecuentes pero no dominan la partida.
        const negativos = validos.filter(e => e.negativo);
        const positivos = validos.filter(e => !e.negativo);
        const elegirMalo = negativos.length > 0 && Math.random() < (subs >= 100000 ? 0.42 : 0.35);
        const pool = elegirMalo ? negativos : positivos.length ? positivos : negativos;
        const evento = pool[Math.floor(Math.random() * pool.length)];

        // Opción C: una salida avanzada que exige un atributo. Nunca es gratis.
        if (!evento.c) {
            const posibles = ["carisma","edicion","marketing","networking","creatividad","algoritmo"];
            const attr = posibles[Math.floor(Math.random()*posibles.length)];
            const req = 20 + Math.floor(Math.random()*16);
            evento.c = { label: `Tomar el riesgo con ${attr}`, desc: `Requiere ${attr} ${req} · +10% vistas si sale bien, pero puede fallar`, requires: { atributo: attr, valor: req }, action: { fama: 2 }, cierre: { vistasPct: Math.random() < 0.62 ? 0.10 : -0.12, reputacion: 0 } };
        }

        this.pendingEvent = JSON.parse(JSON.stringify(evento));

        if (!p.awardsStats) p.awardsStats = { clips: 0, enojos: 0, reacciones: 0 };
        if (evento.negativo) p.awardsStats.enojos += 1;
        if (evento.id === "tiktok_viral") p.awardsStats.clips += 1;
        if (evento.creatorId) p.awardsStats.reacciones += 1;

        this.agregarNotificacion({
            tipo: "evento",
            titulo: `⚡ ${evento.title}`,
            descripcion: "Hay una decisión esperando antes de cerrar el trimestre."
        });

        this.guardar();
        return this.pendingEvent;
    },

    aplicarImpactoCierreTrimestre(cierre = {}) {
        const p = this.player;
        const actividad = p.actividadTrimestre;
        const resultado = this.lastQuarterResult;
        if (!actividad || !resultado) return false;

        const vistasBase = Number(actividad.vistas) || 0;
        const subsBase = Number(actividad.suscriptores) || 0;
        const dineroBase = Number(actividad.dinero) || 0;
        const videosBase = Number(actividad.videos) || 0;

        const videosPct = Number(cierre.videosPct) || 0;
        // Si la decisión fue apostar por publicar más, el volumen extra
        // arrastra también vistas, suscriptores e ingresos.
        const vistasPct = (Number(cierre.vistasPct) || 0) + videosPct * 0.70;
        const subsPct = (Number(cierre.subsPct) || 0) + videosPct * 0.55;
        const dineroPct = (Number(cierre.dineroPct) || 0) + videosPct;

        const bonusVistas = Math.max(0, Math.round(vistasBase * vistasPct));
        const bonusSubs = Math.max(0, Math.round(subsBase * subsPct));
        const bonusDinero = Math.max(0, Math.round(dineroBase * dineroPct));
        const bonusVideos = Math.max(0, Math.round(videosBase * videosPct));

        p.vistasTotales += bonusVistas;
        p.suscriptores += bonusSubs;
        p.dinero += bonusDinero;
        p.ingresosTrimestre += bonusDinero;
        p.ingresosGenerados = (Number(p.ingresosGenerados) || 0) + bonusDinero;
        p.videosSubidos += bonusVideos;

        if (!p.stats) p.stats = crearStats();
        p.stats.videosPublicados = (Number(p.stats.videosPublicados) || 0) + bonusVideos;

        actividad.vistas += bonusVistas;
        actividad.suscriptores += bonusSubs;
        actividad.dinero += bonusDinero;
        actividad.videos += bonusVideos;
        actividad.bonusCierre = {
            vistas: bonusVistas,
            suscriptores: bonusSubs,
            dinero: bonusDinero,
            videos: bonusVideos
        };

        resultado.totalVistas += bonusVistas;
        resultado.totalSubs += bonusSubs;
        resultado.totalDinero += bonusDinero;
        resultado.totalVideos += bonusVideos;
        resultado.bonusCierre = actividad.bonusCierre;
        resultado.cierreAplicado = true;

        if (this.time.trimestre === 1) p.historialTrimestre1 = actividad;
        else p.historialTrimestre2 = actividad;

        return actividad.bonusCierre;
    },

    resolverEvento(opcion) {
        const evento = this.pendingEvent;
        if (!evento || !evento[opcion]) return false;

        const choice = evento[opcion];
        if (!choice) return false;
        if (choice.requires?.atributo && Number(this.player.atributos?.[choice.requires.atributo] || 0) < Number(choice.requires.valor || 0)) return false;
        const action = choice.action || {};
        const p = this.player;

        for (const [key, value] of Object.entries(action)) {
            const amount = Number(value) || 0;

            if (key === "dinero") {
                p.dinero = Math.max(0, Number(p.dinero) + amount);
            } else if (key === "reputacion") {
                p.reputacion = Math.max(0, Math.min(100, Number(p.reputacion) + amount));
            } else if (key === "comunidad") {
                p.comunidad = Math.max(0, Math.min(100, Number(p.comunidad) + amount));
            } else if (key === "fama") {
                p.fama = Math.max(0, Math.min(100, Number(p.fama) + amount));
            } else if (typeof p.atributos?.[key] === "number") {
                p.atributos[key] += amount;
            }
        }

        if (evento.creatorId) {
            const creator = this.creators.find(c => c.id === evento.creatorId);
            if (creator) {
                const actual = Number(this.player.relationships?.[creator.id] || 0);
                this.player.relationships[creator.id] = Math.max(-100, Math.min(100, actual + (opcion === "a" ? 12 : 5)));
                creator.colaboraciones = (Number(creator.colaboraciones) || 0) + (opcion === "a" ? 1 : 0);
            }
        }

        const cierre = this.aplicarImpactoCierreTrimestre(evento[opcion].cierre || {});
        this.ultimoEventoResultado = {
            titulo: evento.title,
            opcion: evento[opcion].label,
            descripcion: evento[opcion].desc,
            cierre
        };

        this.pendingEvent = null;

        if (opcion === "a" && eventHasPositive(evento[opcion])) {
            p.stats.eventosGanados = (Number(p.stats.eventosGanados) || 0) + 1;
        }

        // Después de la decisión, el flujo continúa automáticamente.
        // Los sponsors y colaboraciones se manejan en su propio momento.
        this.guardar();
        return true;
    },

    // Las colaboraciones también nacen solas: el mundo puede descubrir al jugador
    // según su tamaño, crecimiento, nicho y networking. El menú Colabs queda como
    // bandeja/historial, no como una lista de tareas obligatorias.
    generarOfertaColaboracionAutomatica() {
        const p = this.player;
        if (!p || this.pendingCollabOffer) return null;

        const subs = Number(p.suscriptores) || 0;
        const networking = Number(p.atributos?.networking) || 0;
        const fama = Number(p.fama) || 0;
        const niche = p.niche;

        const candidatos = (this.creators || [])
            .filter(c => c.activo !== false && c.id !== "player")
            .filter(c => !Number.isInteger(c.debutYear) || c.debutYear <= Number(this.time.año || 2026))
            .filter(c => Number(c.seguidores || 0) >= 1000)
            .filter(c => Number(c.seguidores || 0) <= (subs < 1000 ? 25000 : Math.max(25000, Math.floor(subs * (subs < 50000 ? 8 : subs < 250000 ? 5 : 3)))))
            .filter(c => c.nicho === niche || Math.random() < 0.50)
            .filter(c => Number(this.player.relationships?.[c.id] || 0) > -40);

        if (!candidatos.length) return null;

        const hayRookie = candidatos.some(c => Number(c.seguidores || 0) <= 25000 && Number.isInteger(c.debutYear));
        const chance = subs < 1000
            ? (hayRookie ? 0.88 : 0.72)
            : Math.min(0.65, 0.22 + networking * 0.006 + fama * 0.0025 + Math.min(0.12, (subs / 250000) * 0.12));

        if (Math.random() > chance) return null;

        const ordenados = candidatos.slice().sort((a, b) => Number(a.seguidores || 0) - Number(b.seguidores || 0));
        const pool = subs < 5000
            ? ordenados.slice(0, Math.min(8, ordenados.length))
            : ordenados.slice(0, Math.min(14, ordenados.length));
        const creador = pool[Math.floor(Math.random() * pool.length)];

        const creadorSubs = Math.max(1000, Number(creador.seguidores) || 1000);
        const vistas = Math.max(100, Math.round(creadorSubs * randomFloat(0.015, 0.055)));
        const subsGanados = Math.max(15, Math.round(vistas * randomFloat(0.045, 0.14)));
        const vuelo = costoVuelo(creador.pais || "Argentina");

        this.pendingCollabOffer = {
            id: crearId("collab"), creatorId: creador.id, creatorName: creador.nombre,
            creatorFollowers: creadorSubs, año: this.time.año, trimestre: this.time.trimestre,
            niche: creador.nicho, pais: creador.pais || "Argentina", costoVuelo: vuelo,
            direction: "incoming", reward: { vistas, subs: subsGanados }, estado: "pendiente"
        };
        this.agregarNotificacion({ tipo: "collab", titulo: `🤝 ${creador.nombre} quiere colaborar con vos`, descripcion: "Una colaboración surgió de forma orgánica en el mundo." });
        this.guardar();
        return this.pendingCollabOffer;
    },

    // Alias para llamar desde videoSystem.js
    generarCollabOfertaAleatoria() {
        return this.generarOfertaColaboracionAutomatica();
    },

    puedeProponerCollab(creatorId) {
        const creator = (this.creators || []).find(c => c.id === creatorId);
        if (!creator) return false;
        const relacion = Number(this.player?.relationships?.[creatorId] || 0);
        const creatorSubs = Number(creator.seguidores || 0);
        const playerSubs = Number(this.player?.suscriptores || 0);
        // Podés ofrecerle a cualquiera que ya tenga relación con vos, o a
        // cualquier creador que esté por debajo de tu tamaño.
        return relacion >= 15 || creatorSubs <= playerSubs;
    },

    proponerCollab(creatorId) {
        const p = this.player;
        if (!p || this.pendingCollabOffer || !this.puedeProponerCollab(creatorId)) return false;
        const creador = (this.creators || []).find(c => c.id === creatorId);
        if (!creador || creador.activo === false) return false;

        const relacion = Number(p.relationships?.[creatorId] || 0);
        const diferencia = Number(creador.seguidores || 0) / Math.max(1, Number(p.suscriptores || 1));
        const prob = Math.max(0.45, Math.min(0.92, 0.72 + relacion / 250 - Math.max(0, diferencia - 3) * 0.04));

        if (Math.random() > prob) {
            p.relationships[creatorId] = Math.max(-100, relacion - 2);
            this.lastCollab = { creatorId, creatorName: creador.nombre, estado: "rechazada_por_creador", fecha: Date.now() };
            this.agregarNotificacion({ tipo: "collab", titulo: `↩️ ${creador.nombre} no pudo sumarse`, descripcion: "La relación sigue abierta para otra oportunidad." });
            this.guardar();
            return "rechazada";
        }

        const vistas = Math.max(100, Math.round(Number(creador.seguidores || 0) * randomFloat(0.012, 0.045)));
        const subs = Math.max(15, Math.round(vistas * randomFloat(0.045, 0.13)));
        this.pendingCollabOffer = {
            id: crearId("collab_out"), creatorId, creatorName: creador.nombre,
            creatorFollowers: Number(creador.seguidores) || 0, año: this.time.año,
            trimestre: this.time.trimestre, niche: creador.nicho, pais: creador.pais || "Argentina",
            costoVuelo: costoVuelo(creador.pais || "Argentina"), direction: "outgoing",
            reward: { vistas, subs }, estado: "pendiente"
        };
        this.agregarNotificacion({ tipo: "collab", titulo: `📨 ${creador.nombre} aceptó tu propuesta`, descripcion: "La relación que construiste habilitó una nueva colaboración." });
        this.guardar();
        return "aceptada";
    },
    aceptarCollab() {
        const oferta = this.pendingCollabOffer;
        if (!oferta) return false;
        const costo = Number(oferta.costoVuelo) || 0;
        if (costo > Number(this.player.dinero || 0)) {
            this.agregarNotificacion({ tipo: "collab", titulo: "✈️ No alcanza para el viaje", descripcion: `Necesitás $${costo.toLocaleString()} para viajar a ${oferta.pais || "el exterior"}.` });
            this.guardar();
            return false;
        }
        if (costo > 0) this.player.dinero -= costo;
        const creador = this.creators.find(c => c.id === oferta.creatorId);
        const vistas = Number(oferta.reward?.vistas) || 0;
        const subs = Number(oferta.reward?.subs) || 0;

        this.player.vistasTotales += vistas;
        this.player.suscriptores += subs;
        agregarFamaLogro(this.player, 2 + (creador ? Math.min(4, Number(creador.popularidad || 0) / 30) : 0), "colaboración");
        this.player.stats.colaboraciones = (Number(this.player.stats?.colaboraciones) || 0) + 1;
        this.player.relationships[oferta.creatorId] = Math.min(100, Number(this.player.relationships?.[oferta.creatorId] || 0) + 15);
        if (creador) creador.colaboraciones = (Number(creador.colaboraciones) || 0) + 1;

        this.lastCollab = { ...oferta, estado: "aceptada", vistas, subs, costoVuelo: costo, fecha: Date.now() };
        this.pendingCollabOffer = null;
        this.agregarNotificacion({
            tipo: "collab",
            titulo: `🤝 Colaboración con ${oferta.creatorName}`,
            descripcion: `+${vistas.toLocaleString()} vistas y +${subs.toLocaleString()} suscriptores.`
        });
        this.guardar();
        return true;
    },

    rechazarCollab() {
        const oferta = this.pendingCollabOffer;
        if (!oferta) return false;
        this.player.relationships[oferta.creatorId] = Math.max(-100, Number(this.player.relationships?.[oferta.creatorId] || 0) - 8);
        this.lastCollab = { ...oferta, estado: "rechazada", fecha: Date.now() };
        this.pendingCollabOffer = null;
        this.guardar();
        return true;
    },

    comprarBoost(tipo) {
        const p = this.player;
        const catalogo = {
            algoritmo: { nombre: "Boost de algoritmo", precio: 250, multiplicador: 1.15, turnos: 1 },
            tendencia: { nombre: "Impulso de tendencia", precio: 600, multiplicador: 1.28, turnos: 1 },
            alcance: { nombre: "Pack de difusión", precio: 1200, multiplicador: 1.40, turnos: 1 }
        };
        const item = catalogo[tipo];
        if (!item || Number(p.dinero || 0) < item.precio) return false;
        p.dinero -= item.precio;
        p.boosts ||= {};
        p.boosts.viewBoostTurns = (Number(p.boosts.viewBoostTurns) || 0) + item.turnos;
        p.boosts.viewMultiplier = Math.max(Number(p.boosts.viewMultiplier) || 1, item.multiplicador);
        this.agregarNotificacion({ tipo: "tienda", titulo: `🚀 ${item.nombre}`, descripcion: `El próximo trimestre tendrá un impulso de alcance.` });
        this.guardar();
        return true;
    },

    // Las marcas aparecen solas. El botón "Contratos" solamente sirve para
    // abrir la bandeja/historial, no para generar ofertas.
    generarOfertaSponsor() {
        const marcas = [
            { id: "local_shop", name: "Tienda Gamer Local", minSubs: 1000, minFama: 0, payMin: 150, payMax: 450, duration: 1, prestige: 1 },
            { id: "redragon", name: "Redragon", minSubs: 5000, minFama: 3, payMin: 400, payMax: 1000, duration: 2, prestige: 2 },
            { id: "logitech", name: "Logitech G", minSubs: 15000, minFama: 8, payMin: 900, payMax: 2200, duration: 2, prestige: 3 },
            { id: "redbull", name: "Red Bull", minSubs: 75000, minFama: 15, payMin: 2500, payMax: 6000, duration: 2, prestige: 5, tipo: "premium" },
            { id: "casino", name: "Casino Online", minSubs: 50000, minFama: 8, payMin: 4500, payMax: 9000, duration: 1, prestige: 2, tipo: "casino", reputacionAceptar: -10 },
            { id: "crypto", name: "Crypto Exchange", minSubs: 150000, minFama: 18, payMin: 7000, payMax: 15000, duration: 1, prestige: 3, tipo: "cripto", reputacionAceptar: -8 },
            { id: "adidas", name: "Adidas", minSubs: 300000, minFama: 30, payMin: 8000, payMax: 18000, duration: 2, prestige: 8, tipo: "premium" },
            { id: "nike", name: "Nike", minSubs: 750000, minFama: 40, payMin: 12000, payMax: 28000, duration: 2, prestige: 10, tipo: "premium" },
            { id: "cocacola", name: "Coca-Cola", minSubs: 1500000, minFama: 50, payMin: 18000, payMax: 40000, duration: 2, prestige: 12, tipo: "premium" },
            { id: "apple", name: "Apple", minSubs: 3000000, minFama: 65, payMin: 50000, payMax: 100000, duration: 2, prestige: 15, tipo: "premium" },
            { id: "samsung", name: "Samsung", minSubs: 120000, minFama: 20, payMin: 7000, payMax: 16000, duration: 2, prestige: 7, tipo: "premium" },
            { id: "spotify", name: "Spotify", minSubs: 250000, minFama: 28, payMin: 9000, payMax: 22000, duration: 2, prestige: 8, tipo: "premium" },
            { id: "logitech_pro", name: "Logitech", minSubs: 50000, minFama: 14, payMin: 2500, payMax: 6500, duration: 2, prestige: 5, tipo: "premium" },
            { id: "speed", name: "Speed Unlimited", minSubs: 75000, minFama: 16, payMin: 3000, payMax: 8000, duration: 2, prestige: 5, tipo: "premium" },
            { id: "mercadolibre", name: "Mercado Libre", minSubs: 200000, minFama: 24, payMin: 8000, payMax: 20000, duration: 2, prestige: 8, tipo: "premium" },
            { id: "adobe", name: "Adobe", minSubs: 100000, minFama: 18, payMin: 4500, payMax: 11000, duration: 2, prestige: 6, tipo: "premium" }
        ];

        const p = this.player;
        if (!p || this.pendingSponsorOffer) return null;

        const yaVistas = new Set((this.sponsors || []).map(s => s.id));

        // Elegimos la marca más alta disponible SOLO entre las que ya puede
        // considerar razonables para su tamaño. Esto evita Nike/Adidas a los 100k.
        const disponibles = marcas
            .filter(m =>
                Number(p.suscriptores) >= m.minSubs &&
                Number(p.fama) >= m.minFama &&
                !yaVistas.has(m.id)
            )
            .sort((a, b) => a.minSubs - b.minSubs);

        if (!disponibles.length) return null;

        // No siempre llega la marca más grande disponible. Las ofertas normales
        // se sienten progresivas y las polémicas (casino/cripto) aparecen como
        // oportunidades tentadoras, pero no dominan la partida.
        const polemicas = disponibles.filter(m => m.tipo === "casino" || m.tipo === "cripto");
        const normales = disponibles.filter(m => m.tipo !== "casino" && m.tipo !== "cripto");
        let marca;
        if (polemicas.length && Math.random() < 0.20) {
            marca = polemicas[Math.floor(Math.random() * polemicas.length)];
        } else {
            const cercanas = normales.slice(-Math.min(3, normales.length));
            if (cercanas.length) {
                marca = cercanas[Math.floor(Math.random() * cercanas.length)];
            } else {
                marca = polemicas[0];
            }
        }
        const probabilidad =
            marca.minSubs >= 750000 ? 0.75 :
            marca.minSubs >= 300000 ? 0.72 :
            0.85;

        if (Math.random() > probabilidad) return null;

        const oferta = {
            ...marca,
            pago: random(marca.payMin, marca.payMax),
            año: this.time.año,
            trimestre: this.time.trimestre,
            estado: "pendiente"
        };

        this.pendingSponsorOffer = oferta;

        this.agregarNotificacion({
            tipo: "sponsor",
            titulo: `📩 ${marca.name} quiere trabajar con vos`,
            descripcion: "Recibiste una propuesta comercial."
        });

        this.guardar();
        return oferta;
    },

    negociarSponsor(extra = 0) {
        const oferta=this.pendingSponsorOffer; if(!oferta) return false;
        const pedido=Math.max(0,Number(extra)||0);
        if(pedido<=0) return true;
        const chance=Math.max(0.15, 0.82 - pedido/Math.max(1,Number(oferta.pago||1))*1.4 - (oferta.minSubs>300000?0.05:0));
        if(Math.random()>chance){ this.pendingSponsorOffer=null; this.sponsors.push({...oferta,estado:'negociacion_fallida',fecha:Date.now()}); this.guardar(); return false; }
        oferta.pago=Math.round(Number(oferta.pago||0)+pedido); oferta.negociado=true; this.guardar(); return true;
    },

    aceptarSponsor() {
        const oferta = this.pendingSponsorOffer;
        if (!oferta) return false;

        const pago = Number(oferta.pago) || 0;
        this.player.dinero += pago;
        this.player.ingresosTrimestre = (Number(this.player.ingresosTrimestre) || 0) + pago;
        this.player.ingresosGenerados = (Number(this.player.ingresosGenerados) || 0) + pago;
        this.player.ingresosDesglose ||= { publicidad:0,sponsors:0,negocios:0,afiliados:0,donaciones:0 };
        this.player.ingresosDesglose.sponsors = (Number(this.player.ingresosDesglose.sponsors)||0) + pago;
        if (this.player.actividadTrimestre) {
            this.player.actividadTrimestre.dinero = (Number(this.player.actividadTrimestre.dinero) || 0) + pago;
        }
        if (this.lastQuarterResult) {
            this.lastQuarterResult.totalDinero = (Number(this.lastQuarterResult.totalDinero) || 0) + pago;
        }
        agregarFamaLogro(this.player, Number(oferta.prestige || 0), `sponsor ${oferta.name}`);

        const reputacionCambio = Number(oferta.reputacionAceptar || 0);
        if (reputacionCambio) {
            this.player.reputacion = Math.max(0, Math.min(100, Number(this.player.reputacion) + reputacionCambio));
        }

        this.player.stats.sponsors =
            (Number(this.player.stats.sponsors) || 0) + 1;

        this.sponsors.push({
            ...oferta,
            estado: "aceptado",
            aceptadoEn: Date.now()
        });

        this.pendingSponsorOffer = null;
        this.guardar();
        return true;
    },

    rechazarSponsor() {
        const oferta = this.pendingSponsorOffer;
        if (!oferta) return false;

        if (oferta.tipo === "casino" || oferta.tipo === "cripto") {
            this.player.reputacion = Math.min(100, Number(this.player.reputacion) + 4);
        } else {
            this.player.reputacion = Math.min(100, Number(this.player.reputacion) + 1);
        }

        this.sponsors.push({
            ...oferta,
            estado: "rechazado",
            rechazadoEn: Date.now()
        });

        this.pendingSponsorOffer = null;
        this.guardar();
        return true;
    },

    guardar() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                player: this.player,
                time: this.time,
                inventory: this.inventory,
                notifications: this.notifications,
                creators: this.creators,
                trends: this.trends,
                sponsors: this.sponsors,
                worldNews: this.worldNews,
                worldYearNews: this.worldYearNews,
                worldDramaHistory: this.worldDramaHistory,
                pendingSponsorOffer: this.pendingSponsorOffer,
                pendingEvent: this.pendingEvent,
                pendingCollabOffer: this.pendingCollabOffer,
                pendingVideoSelection: this.pendingVideoSelection,
                boosts: this.boosts,
                lastVideo: this.lastVideo,
                lastVideoResult: this.lastVideoResult,
                lastQuarterResult: this.lastQuarterResult,
                lastYearSummary: this.lastYearSummary,
                lastAwardsResults: this.lastAwardsResults,
                ultimoEventoResultado: this.ultimoEventoResultado,
                lastCollab: this.lastCollab,
                savedAt: Date.now()
            }));
            return true;
        } catch (error) {
            console.error("❌ Error guardando partida:", error);
            return false;
        }
    },

    cargar() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;

            const data = JSON.parse(raw);
            if (!data.player || data.player.partidaIniciada !== true) return false;

            this.player = data.player;
            this.time = data.time || {
                año: this.player.año || 2026,
                trimestre: this.player.trimestre || 1
            };

            this.inventory = Array.isArray(data.inventory) ? data.inventory : [];
            this.notifications = Array.isArray(data.notifications) ? data.notifications : [];
            this.creators = Array.isArray(data.creators) ? data.creators : crearCreadores();
            const catalogoActual = crearCreadores();
            const idsGuardados = new Set(this.creators.map(c => c.id));
            catalogoActual.forEach(c => { if (!idsGuardados.has(c.id)) this.creators.push(c); });
            this.trends = Array.isArray(data.trends) ? data.trends : [];
            this.sponsors = Array.isArray(data.sponsors) ? data.sponsors : [];
            this.worldNews = Array.isArray(data.worldNews) ? data.worldNews : [];
            this.worldYearNews = Array.isArray(data.worldYearNews) ? data.worldYearNews : [];
            this.worldDramaHistory = Array.isArray(data.worldDramaHistory) ? data.worldDramaHistory : [];

            this.pendingSponsorOffer = data.pendingSponsorOffer || null;
            this.pendingEvent = data.pendingEvent || null;
            this.pendingCollabOffer = data.pendingCollabOffer || null;
            this.lastVideo = data.lastVideo || null;
            this.lastVideoResult = data.lastVideoResult || null;
            this.lastQuarterResult = data.lastQuarterResult || null;
            this.lastYearSummary = data.lastYearSummary || null;
            this.lastAwardsResults = data.lastAwardsResults || null;
            this.ultimoEventoResultado = data.ultimoEventoResultado || null;
            this.lastCollab = data.lastCollab || null;
            this.pendingVideoSelection = data.pendingVideoSelection || null;

            normalizarGameState();
            return true;
        } catch (error) {
            console.error("❌ Error cargando partida:", error);
            return false;
        }
    },

    generarCreadoresNuevos(año) {
        const nombres = [
            ["NicoRush", "Gaming"], ["MiliEnVivo", "Variedad"], ["PatoFutbol", "Fútbol"],
            ["RamiClip", "Gaming"], ["SofiIRL", "IRL"], ["TotoStream", "Variedad"],
            ["FakuGG", "Gaming"], ["LuliReacciona", "Variedad"], ["MateFutbol", "Fútbol"],
            ["CandePlay", "Gaming"], ["FranEnKick", "Variedad"], ["BeniFPS", "Gaming"]
        ];
        const cantidad = random(2, 4);
        const existentes = new Set(this.creators.map(c => c.nombre));
        let creados = 0;
        for (let i = 0; i < nombres.length && creados < cantidad; i++) {
            const [nombre, nicho] = nombres[(i + random(0, nombres.length - 1)) % nombres.length];
            if (existentes.has(nombre)) continue;
            const id = `rookie_${año}_${creados}_${Math.random().toString(36).slice(2,7)}`;
            const seguidores = random(0, 120);
            const creator = {
                id, nombre, nicho, pais: "Argentina", seguidores, seguidoresIniciales: seguidores,
                popularidad: random(38, 58), crecimientoBase: randomFloat(0.12, 0.24), debutYear: año,
                esRevelacion: true, revelacionGanada: false, relacion: 0, respeto: 0, rivalidad: 0,
                colaboraciones: 0, activo: true, mundo: { videos: 0, vistas: 0, nuevosSeguidores: 0, virales: 0, clips: 0, enojos: 0, temporadas: 0 }
            };
            this.creators.push(creator);
            existentes.add(nombre);
            creados++;
        }
        return creados;
    },

    prepararSiguienteAño() {
        if (this.time.trimestre !== 2) return false;

        const añoTerminado = this.time.año;
        const nextYear = añoTerminado + 1;

        if (this.lastYearSummary) {
            this.player.historialAños.push(this.lastYearSummary);
        }

        this.time = { año: nextYear, trimestre: 1 };
        this.generarCreadoresNuevos(nextYear);
        this.player.año = nextYear;
        this.player.trimestre = 1;
        this.player.edad = 18 + (nextYear - 2026);
        this.player.carreraAño = Math.max(1, nextYear - 2025);
        this.aplicarDecliveEdad();
        if (this.player.edad >= 40) { this.player.retirado = true; }
        this.player.pretemporada = null;
        this.player.videoSubidoEsteTrimestre = false;
        this.player.ingresosTrimestre = 0;
        this.player.mencionesSponsorTrimestre = 0;
        this.player.actividadTrimestre = null;
        this.player.historialTrimestre1 = null;
        this.player.historialTrimestre2 = null;
        this.player.awardsStats = { clips: 0, enojos: 0, reacciones: 0 };
        this.player.yearStartSnapshot = snapshotAño(this.player);
        advanceEconomy(this);

        this.lastQuarterResult = null;
        this.lastYearSummary = null;
        this.lastAwardsResults = null;
        this.pendingSponsorOffer = null;
        this.pendingEvent = null;
        this.pendingCollabOffer = null;
        this.ultimoEventoResultado = null;

        this.guardar();
        return true;
    },

    nextQuarter() {
        if (this.time.trimestre >= TRIMESTRES_POR_AÑO) {
            return this.prepararSiguienteAño();
        }

        // Cierra el trimestre: staff, negocios y afiliados cobran/pagan antes de entrar al siguiente.
        advanceEconomy(this);
        this.time.trimestre += 1;
        this.player.año = this.time.año;
        this.player.trimestre = this.time.trimestre;
        this.player.videoSubidoEsteTrimestre = false;
        this.player.ingresosTrimestre = 0;
        this.player.mencionesSponsorTrimestre = 0;
        this.player.actividadTrimestre = null;

        this.guardar();
        return this.time;
    },

    calcularRankingNicho() {
        const p=this.player; const lista=[...(this.creators||[])].filter(c=>c.activo!==false && (c.pais||"Argentina")==="Argentina" && c.nicho===p.niche);
        lista.push({id:"player",seguidores:p.suscriptores});
        lista.sort((a,b)=>Number(b.seguidores||0)-Number(a.seguidores||0));
        const pos=Math.max(1,lista.findIndex(c=>c.id==="player")+1);
        const prev=Number(this.player.historialAños?.at(-1)?.rankingNicho?.posicion || pos);
        return {posicion:pos,total:lista.length,subio:Math.max(0,prev-pos),bajo:Math.max(0,pos-prev)};
    },

    finalizarAño() {
        if (this.time.trimestre !== 2) return null;

        const inicio = this.player.yearStartSnapshot || snapshotAño(this.player);
        const fin = snapshotAño(this.player);

        this.lastYearSummary = {
            año: this.time.año,
            suscriptoresInicio: inicio.suscriptores,
            suscriptoresFin: fin.suscriptores,
            crecimientoSubs: fin.suscriptores - inicio.suscriptores,

            vistasInicio: inicio.vistasTotales,
            vistasFin: fin.vistasTotales,
            vistasGanadas: fin.vistasTotales - inicio.vistasTotales,

            videosInicio: inicio.videosSubidos,
            videosFin: fin.videosSubidos,
            videosPublicados: fin.videosSubidos - inicio.videosSubidos,

            dineroInicio: inicio.dinero,
            dineroFin: fin.dinero,
            dineroGanado: fin.dinero - inicio.dinero,
            ingresosGenerados: (Number(fin.ingresosGenerados) || 0) - (Number(inicio.ingresosGenerados) || 0),

            famaInicio: inicio.fama,
            famaFin: fin.fama,
            reputacion: fin.reputacion,

            mejorVideo: Math.max(
                Number(this.player.historialTrimestre1?.mejorVideo) || 0,
                Number(this.player.historialTrimestre2?.mejorVideo) || 0
            ),
            videosVirales: (Number(this.player.historialTrimestre1?.virales) || 0) + (Number(this.player.historialTrimestre2?.virales) || 0),

            trimestre1: this.player.historialTrimestre1 || null,
            trimestre2: this.player.historialTrimestre2 || null,
            rankingNicho: this.calcularRankingNicho(),
            premiosGanadosCount: 0,
            premiosGanados: []
        };

        this.agregarNotificacion({
            tipo: "año",
            titulo: `📊 Terminó el año ${this.time.año}`,
            descripcion: `Tu canal publicó ${this.lastYearSummary.videosPublicados.toLocaleString()} videos durante la temporada.`
        });

        this.guardar();
        return this.lastYearSummary;
    },

    puedeRetirarse() {
        return Number(this.player.edad || 18) >= 40 || Number(this.player.carreraAño || 1) >= 8;
    },

    retirarse() {
        if (!this.puedeRetirarse()) return false;
        this.player.retirado = true;
        this.guardar();
        window.location.hash = "#careerEnd";
        return true;
    },

    aplicarDecliveEdad() {
        const p = this.player;
        const edad = Number(p.edad || 18);
        if (edad < 30) return [];
        const staff = p.staff || {};
        const protegidos = new Set();
        if (staff.editor?.level >= 2) protegidos.add("edicion");
        if (staff.manager?.level >= 2) protegidos.add("networking");
        if (staff.community?.level >= 2) protegidos.add("marketing");
        if (staff.trainer?.level >= 2) protegidos.add("constancia");
        const pool = ["edicion","carisma","constancia","creatividad","algoritmo"];
        const perdidos=[];
        const intensidad = edad >= 36 ? 2 : 1;
        for(let i=0;i<intensidad;i++){
            const disponibles=pool.filter(k=>!protegidos.has(k) && Number(p.atributos?.[k]||0)>1);
            if(!disponibles.length) break;
            const k=disponibles[Math.floor(Math.random()*disponibles.length)];
            p.atributos[k]=Math.max(1,Number(p.atributos[k])-1); perdidos.push(k);
        }
        return perdidos;
    },

    resetPlayer() {
        this.player = crearPlayer();
        this.time = { año: 2026, trimestre: 1 };
        this.inventory = [];
        this.notifications = [];
        this.trends = [];
        this.sponsors = [];
        this.worldNews = [];
        this.worldYearNews = [];
        this.worldDramaHistory = [];
        this.pendingSponsorOffer = null;
        this.pendingEvent = null;
        this.pendingCollabOffer = null;
        this.lastVideo = null;
        this.lastVideoResult = null;
        this.lastQuarterResult = null;
        this.lastYearSummary = null;
        this.lastAwardsResults = null;
        this.ultimoEventoResultado = null;
        this.lastCollab = null;
        this.pendingVideoSelection = null;

        try {
            [
                SAVE_KEY,
                "elCreador_save",
                "gameState",
                "elcreador_save",
                "ElCreadorSave"
            ].forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error("❌ Error eliminando partida:", error);
        }

        window.location.hash = "#createChannel";
    }
};

export { recalcularFama, agregarFamaLogro, actualizarFamaPorSubs, famaAudienciaPorSubs, FAMA_HITOS_SUBS };

export function normalizarGameState() {
    if (!gameState.player) gameState.player = crearPlayer();

    const p = gameState.player;

    if (typeof p.nombre !== "string") p.nombre = "Creador";
    if (typeof p.canal !== "string") p.canal = "Mi Canal";
    if (typeof p.niche !== "string") p.niche = "Gaming";
    if (typeof p.año !== "number") p.año = 2026;
    if (!Number.isInteger(p.trimestre) || p.trimestre < 1 || p.trimestre > 2) p.trimestre = 1;
    if (typeof p.dinero !== "number") p.dinero = 500;
    if (typeof p.suscriptores !== "number") p.suscriptores = 50;
    if (typeof p.vistasTotales !== "number") p.vistasTotales = 0;
    if (typeof p.videosSubidos !== "number") p.videosSubidos = 0;
    if (typeof p.edad !== "number") p.edad = 18 + (Number(p.año)||2026) - 2026;
    if (typeof p.carreraAño !== "number") p.carreraAño = Math.max(1,(Number(p.año)||2026)-2025);
    if (typeof p.retirado !== "boolean") p.retirado = false;
    if (!Array.isArray(p.awardsHistory)) p.awardsHistory=[];
    if (typeof p.fama !== "number") p.fama = 0;
    if (typeof p.famaAudiencia !== "number") p.famaAudiencia = famaAudienciaPorSubs(p.suscriptores);
    if (typeof p.famaLogros !== "number") p.famaLogros = Math.max(0, Number(p.fama) - Number(p.famaAudiencia));
    if (!Array.isArray(p.famaHitosAlcanzados)) p.famaHitosAlcanzados = [];
    recalcularFama(p);
    if (typeof p.debutYear !== "number") p.debutYear = 2026;
    if (typeof p.revelacionGanada !== "boolean") p.revelacionGanada = false;
    if (typeof p.comunidad !== "number") p.comunidad = 50;
    if (typeof p.reputacion !== "number") p.reputacion = 50;
    if (typeof p.ingresosTrimestre !== "number") p.ingresosTrimestre = 0;
    if (typeof p.mencionesSponsorTrimestre !== "number") p.mencionesSponsorTrimestre = 0;
    if (typeof p.ingresosGenerados !== "number") p.ingresosGenerados = 0;
    if (!p.ingresosDesglose) p.ingresosDesglose = { publicidad:0,sponsors:0,negocios:0,afiliados:0,donaciones:0 };
    if (typeof p.videoSubidoEsteTrimestre !== "boolean") p.videoSubidoEsteTrimestre = false;
    if (typeof p.minigameIndex !== "number" || p.minigameIndex < 0) p.minigameIndex = 0;
    if (typeof p.partidaIniciada !== "boolean") p.partidaIniciada = false;

    if (!p.atributos) p.atributos = crearAtributos();
    const atributos = crearAtributos();
    for (const key of Object.keys(atributos)) {
        if (typeof p.atributos[key] !== "number") p.atributos[key] = atributos[key];
    }

    if (!p.stats) p.stats = crearStats();
    if (!p.awardsStats) p.awardsStats = { clips: 0, enojos: 0, reacciones: 0 };
    const stats = crearStats();
    for (const key of Object.keys(stats)) {
        if (typeof p.stats[key] !== "number") p.stats[key] = stats[key];
    }

    if (!p.equipment) {
        p.equipment = {
            pc: "government_pc",
            camera: "old_phone",
            microphone: "earphones"
        };
    }

    if (!p.relationships) p.relationships = {};
    if (!Array.isArray(p.historialAños)) p.historialAños = [];
    if (!("pretemporada" in p)) p.pretemporada = null;
    if (!("actividadTrimestre" in p)) p.actividadTrimestre = null;
    if (!("historialTrimestre1" in p)) p.historialTrimestre1 = null;
    if (!("historialTrimestre2" in p)) p.historialTrimestre2 = null;
    if (!p.yearStartSnapshot) p.yearStartSnapshot = snapshotAño(p);
    if (p.pretemporada && typeof p.pretemporada.efecto !== "string") p.pretemporada.efecto = p.pretemporada.atributo || null;

    if (!gameState.time) {
        gameState.time = {
            año: p.año,
            trimestre: p.trimestre
        };
    }

    if (typeof gameState.time.año !== "number") gameState.time.año = p.año;
    if (!Number.isInteger(gameState.time.trimestre) || gameState.time.trimestre < 1 || gameState.time.trimestre > 2) {
        gameState.time.trimestre = p.trimestre;
    }

    p.año = gameState.time.año;
    p.trimestre = gameState.time.trimestre;

    if (!Array.isArray(gameState.inventory)) gameState.inventory = [];
    if (!Array.isArray(gameState.notifications)) gameState.notifications = [];
    if (!Array.isArray(gameState.creators)) gameState.creators = crearCreadores();
    if (!Array.isArray(gameState.trends)) gameState.trends = [];
    if (!Array.isArray(gameState.sponsors)) gameState.sponsors = [];
    if (!Array.isArray(gameState.worldNews)) gameState.worldNews = [];
    if (!Array.isArray(gameState.worldYearNews)) gameState.worldYearNews = [];
    if (!Array.isArray(gameState.worldDramaHistory)) gameState.worldDramaHistory = [];
    ensureAdvancedState(gameState);
    if (!("pendingSponsorOffer" in gameState)) gameState.pendingSponsorOffer = null;
    if (!("pendingEvent" in gameState)) gameState.pendingEvent = null;
    if (!("pendingCollabOffer" in gameState)) gameState.pendingCollabOffer = null;
    if (!gameState.boosts) gameState.boosts = {};
}

normalizarGameState();
