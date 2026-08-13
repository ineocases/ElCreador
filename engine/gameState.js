// engine/gameState.js
// Estado central de El Creador.
// REGLA: 4 trimestres = 1 año.
// El jugador elige 1 video destacado por trimestre; después su canal publica
// un volumen razonable de videos EN ESE TRIMESTRE, ajustado al nicho y la constancia. Son videos del propio jugador,
// como los partidos que jugó un futbolista: el jugador ve el volumen y el resultado,
// pero no tiene que elegir manualmente cada publicación.

import { creatorsIniciales } from "../data/creators.js";
import { ensureAdvancedState, advanceEconomy } from "./advancedSystems.js";

const SAVE_KEY = "elCreador_saveData";
const TRIMESTRES_POR_AÑO = 4;

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

// Alcance realista de colaboraciones. Un creador enorme no queda disponible
// solo porque exista en la base: el tamaño, la relación y el networking
// determinan hasta dónde tiene sentido intentar llegar.
function calcularAlcanceCollab(player, creator) {
    const subs = Math.max(1, Number(player?.suscriptores) || 0);
    const creatorSubs = Math.max(1, Number(creator?.seguidores) || 0);
    const relacion = Number(player?.relationships?.[creator?.id] || 0);
    const networking = Number(player?.atributos?.networking || 0);
    const fama = Number(player?.fama || 0);
    const mismoNicho = player?.niche && creator?.nicho && player.niche === creator.nicho;

    // Base: a comienzos de carrera, las colabs razonables son con cuentas
    // del mismo tamaño o algo mayores. Las relaciones pueden abrir puertas,
    // pero nunca convierten una cuenta de 3K en una candidata natural para
    // una megaestrella de 50M.
    let multiplicador = 2;
    if (relacion >= 15 || networking >= 15 || mismoNicho) multiplicador = 3;
    if (relacion >= 35 && networking >= 25) multiplicador = 5;
    if (relacion >= 60 && networking >= 45 && fama >= 20 && subs >= 25000) multiplicador = 8;
    if (relacion >= 80 && networking >= 60 && fama >= 45 && subs >= 100000) multiplicador = 12;
    if (relacion >= 90 && networking >= 75 && fama >= 65 && subs >= 500000) multiplicador = 20;

    // Una cuenta muy chica puede colaborar con otra muy chica aunque el
    // multiplicador sea conservador. El techo absoluto evita saltos absurdos.
    const techo = Math.max(subs * multiplicador, subs + 5000);
    const ratio = creatorSubs / subs;
    const diferencia = creatorSubs - subs;
    const dentroDeAlcance = creatorSubs <= techo;

    let motivo = "Dentro de tu rango natural";
    if (creatorSubs > techo) {
        motivo = subs < 10000
            ? "Todavía es demasiado grande para tu etapa"
            : "Necesitás más audiencia, relación o networking";
    } else if (ratio > 5) {
        motivo = "Colaboración ambiciosa";
    } else if (ratio > 2) {
        motivo = "Un poco por encima de tu tamaño";
    }

    return { dentroDeAlcance, techo, ratio, motivo, relacion, networking, fama, mismoNicho };
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
        monetizacion: { adsActivos: false, rpmEstimado: 0, acuerdosFirmados: 0, campañasCompletadas: 0 },

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
        historialTrimestre3: null,
        historialTrimestre4: null,
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

function etiquetaDecisionRealista(option, lado = "") {
    const action = option?.action || {};
    const cierre = option?.cierre || {};
    const pros = [];
    const contras = [];
    if (Number(cierre.subsPct) > 0.12 || Number(cierre.vistasPct) > 0.18) pros.push("más alcance");
    if (Number(cierre.dineroPct) > 0.05 || Number(action.dinero) > 0) pros.push("más ingresos");
    if (Number(action.reputacion) > 2 || Number(action.comunidad) > 2) pros.push("fortalece la comunidad");
    if (Number(action.networking) > 2) pros.push("abre contactos");
    if (Number(action.reputacion) < -1 || Number(cierre.subsPct) < -0.02 || Number(cierre.vistasPct) < -0.05) contras.push("tiene un costo reputacional o de alcance");
    if (Number(action.dinero) < -50) contras.push("requiere inversión");
    if (!pros.length) pros.push("mantiene la estabilidad");
    if (!contras.length) contras.push("renunciás a parte de la oportunidad");
    return `${pros.slice(0,2).join(" y ")}; ${contras[0]}`;
}

function hacerEventoMasRealista(evento, player) {
    if (!evento) return evento;

    // Las decisiones no muestran "A = premio grande / B = premio chico".
    // Cada camino debe tener una ganancia y un costo realista.
    const tradeoffs = {
        viral_short: [
            "Aprovechás el pico y ganás descubrimiento, pero podés saturar a la audiencia.",
            "Protegés tu identidad y calendario, aunque dejás pasar parte del pico."
        ],
        comentario_famoso: [
            "Convertís la mención en una oportunidad, con el riesgo de parecer oportunista.",
            "Construís credibilidad y una relación más natural, sacrificando parte del alcance."
        ],
        podcast_invitacion: [
            "Sumás exposición y contactos, pero resignás tiempo de producción.",
            "Priorizás tu calendario y consistencia, pero perdés una puerta de entrada a otra audiencia."
        ],
        nuevo_juego: [
            "Entrás temprano a una tendencia con potencial, pero te alejás de tu línea habitual.",
            "Mantenés tu identidad y audiencia, aunque probablemente crezcas más lento con este tema."
        ],
        challenge_comunidad: [
            "Fortalecés la comunidad, pero tenés que ceder parte del calendario al reto.",
            "Mantenés control creativo y producción, pero la comunidad participa menos."
        ],
        audiencia_internacional: [
            "Invertís trabajo en internacionalizarte, con una audiencia más amplia pero menos homogénea.",
            "Mantenés tu mercado principal y una comunidad más enfocada, perdiendo parte del crecimiento externo."
        ],
        colab_rival: [
            "Convertís competencia en exposición compartida, pero cedés protagonismo.",
            "Defendés tu posición y diferenciación, pero la rivalidad puede enfriarse la relación."
        ],
        descanso: [
            "Cuidás el ritmo y reducís el desgaste, aceptando una baja temporal de actividad.",
            "Mantenés el impulso, pero acumulás más desgaste y riesgo de perder consistencia después."
        ],
        setup_upgrade: [
            "Invertís ahora para mejorar producción, pero reducís liquidez.",
            "Cuidás el dinero y resolvés con lo que tenés, aunque el techo de calidad queda más bajo."
        ],
        tendencia_futbol: [
            "Entrás en la conversación y ganás descubrimiento, pero te exponés a una discusión polarizada.",
            "Evitás la polémica y cuidás reputación, pero dejás pasar parte del tráfico."
        ],
        trend: [
            "Buscás crecimiento rápido con una tendencia, a costa de depender más del algoritmo.",
            "Construís una identidad más estable, aunque el crecimiento inmediato sea menor."
        ],
        equipment: [
            "Subís la calidad con una inversión importante, reduciendo el colchón de dinero.",
            "Ahorrás y optimizás el setup actual, pero el techo de producción queda limitado."
        ]
    };

    // Interacciones con creadores: colaborar acelera, pero exige exposición;
    // mantener distancia conserva identidad y fortalece la relación de otra manera.
    if (evento.creatorId) {
        evento.a.action = { ...(evento.a.action || {}) };
        evento.b.action = { ...(evento.b.action || {}) };
        evento.a.action.reputacion = Number(evento.a.action.reputacion || 0) - 2;
        evento.b.action.networking = Number(evento.b.action.networking || 0) + 2;
        evento.b.action.comunidad = Number(evento.b.action.comunidad || 0) + 1;
        evento.a.desc = "Más exposición inmediata, pero más presión y exposición pública.";
        evento.b.desc = "Menos alcance inmediato, pero fortalecés la relación sin forzar el momento.";
    }

    if (tradeoffs[evento.id]) {
        evento.a.desc = tradeoffs[evento.id][0];
        evento.b.desc = tradeoffs[evento.id][1];
    }

    // Garantía de diseño: si una opción era puramente positiva, agregamos
    // una contrapartida pequeña y coherente. Así nunca existe una "opción gratis".
    const asegurarContrapartida = (option, alternativa, indice) => {
        if (!option) return;
        option.action ||= {};
        option.cierre ||= {};

        const actionVals = Object.values(option.action).map(Number);
        const cierreVals = Object.values(option.cierre).map(Number);
        const tieneNegativo = actionVals.some(v => v < 0) || cierreVals.some(v => v < 0);
        const tienePositivo = actionVals.some(v => v > 0) || cierreVals.some(v => v > 0);

        if (!tieneNegativo) {
            // Preferimos un costo no monetario para no destruir partidas pequeñas.
            if (option.cierre.vistasPct > 0 || option.cierre.subsPct > 0) {
                option.action.reputacion = Number(option.action.reputacion || 0) - 2;
            } else if (option.action.fama > 0 || option.action.networking > 0) {
                option.action.constancia = Number(option.action.constancia || 0) - 1;
            } else {
                option.action.reputacion = Number(option.action.reputacion || 0) - 1;
            }
        }

        if (!tienePositivo) {
            // Incluso una renuncia/defensa tiene un beneficio estratégico.
            option.action.reputacion = Number(option.action.reputacion || 0) + 2;
        }

        option.tradeoff ||= alternativa;
        option.desc = alternativa;
    };

    asegurarContrapartida(
        evento.a,
        evento.a?.desc || "Mayor impacto, con un costo sobre otra parte de tu carrera.",
        "a"
    );
    asegurarContrapartida(
        evento.b,
        evento.b?.desc || "Menor impacto, pero con una ventaja estratégica.",
        "b"
    );

    if (evento.c) {
        evento.c.tradeoff = "Camino de alto riesgo: requiere una habilidad y puede salir bien o mal.";
    }

    return evento;
}

function eventHasPositive(option) {
    const a = option?.action || {};
    return Object.values(a).some(v => Number(v) > 0);
}


// Fama de audiencia: la audiencia define grandes saltos, pero los logros
// (virales, premios, colabs, Velada) siguen sumando por separado.
// La escala pedida hace que 10K sea un creador conocido, 100K un referente
// y 1M una figura masiva.
const FAMA_HITOS_SUBS = [
    [1000, 1],
    [5000, 3],
    [10000, 5],
    [50000, 7],
    [100000, 10],
    [500000, 40],
    [1000000, 100],
    [5000000, 100],
    [10000000, 100]
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
    campaigns: [],
    pendingCampaignOffer: null,
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
        this.campaigns = [];
        this.pendingCampaignOffer = null;
        this.worldNews = [];
        this.worldYearNews = [];
        this.worldDramaHistory = [];
        this.pendingSponsorOffer = null;
        this.pendingCampaignOffer = null;
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

        // "Pasan cosas" es una parte central del loop: al cerrar un trimestre
        // siempre debe existir una oportunidad/evento elegible. La variedad
        // sigue viniendo de la selección aleatoria de eventos.
        const subs = Number(p.suscriptores) || 0;
        const reputacion = Number(p.reputacion) || 50;
        const fama = Number(p.fama) || 0;

        const eventos = [
            {id:"evt_001",minSubs:500,negativo:false,category:"contenido",title:"Un video recibe una retención inusualmente alta",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_002",minSubs:1500,negativo:false,category:"contenido",title:"Una miniatura empieza a rendir mejor",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_003",minSubs:5000,negativo:false,category:"contenido",title:"Tu próximo video necesita una entrega extra",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_004",minSubs:15000,negativo:false,category:"contenido",title:"Un formato nuevo empieza a funcionar",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_005",minSubs:30000,negativo:false,category:"contenido",title:"Un video recibe comentarios de otro nicho",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_006",minSubs:75000,negativo:false,category:"contenido",title:"Tu editor propone cambiar el ritmo",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_007",minSubs:150000,negativo:false,category:"contenido",title:"Un tema queda viejo antes de publicar",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_008",minSubs:50,negativo:false,category:"contenido",title:"Un video divide a la comunidad",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_009",minSubs:500,negativo:false,category:"contenido",title:"Un contenido largo supera a tus Shorts",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_010",minSubs:1500,negativo:false,category:"contenido",title:"Un Short lleva tráfico al canal principal",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_011",minSubs:5000,negativo:false,category:"contenido",title:"Un video patrocinado genera comentarios",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_012",minSubs:15000,negativo:false,category:"contenido",title:"Un invitado pide revisar el corte",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_013",minSubs:30000,negativo:false,category:"contenido",title:"Una serie empieza a tener seguidores fieles",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_014",minSubs:75000,negativo:false,category:"contenido",title:"Tu calendario quedó demasiado cargado",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_015",minSubs:150000,negativo:false,category:"contenido",title:"Una idea vieja vuelve a ser relevante",text:"La situación afecta tu calendario y la forma en que venís creando contenido.",a:{label:"Apostar por el crecimiento",desc:"Buscás aprovechar la oportunidad sin cambiar completamente tu identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 2, "algoritmo": 1},cierre:{"vistasPct": 0.12, "subsPct": 0.06}},b:{label:"Proteger el canal",desc:"Priorizás consistencia y evitás tomar una decisión apresurada.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": 0.04}},c:{label:"Probar en pequeño",desc:"Hacés una prueba limitada antes de comprometer el calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_016",minSubs:50,negativo:false,category:"redes",title:"Un comentario tuyo se vuelve viral",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_017",minSubs:500,negativo:false,category:"redes",title:"Una publicación genera debate",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_018",minSubs:1500,negativo:false,category:"redes",title:"Un clip llega a una cuenta grande",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_019",minSubs:5000,negativo:false,category:"redes",title:"Te etiquetan en una tendencia",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_020",minSubs:15000,negativo:false,category:"redes",title:"Un fan crea un meme con vos",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_021",minSubs:30000,negativo:false,category:"redes",title:"Una cuenta de noticias publica sobre vos",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_022",minSubs:75000,negativo:false,category:"redes",title:"Te comparan con otro creador",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_023",minSubs:150000,negativo:false,category:"redes",title:"Un hashtag con tu nombre aparece en tendencias",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_024",minSubs:50,negativo:false,category:"redes",title:"Una publicación antigua resurge",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_025",minSubs:500,negativo:false,category:"redes",title:"Un comentario polémico de otro creador te menciona",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_026",minSubs:1500,negativo:false,category:"redes",title:"Tu comunidad pide que hables de un tema sensible",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_027",minSubs:5000,negativo:false,category:"redes",title:"Una cuenta grande te sigue",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_028",minSubs:15000,negativo:false,category:"redes",title:"Te invitan a una conversación pública",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_029",minSubs:30000,negativo:false,category:"redes",title:"Un clip tuyo llega a otro país",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_030",minSubs:75000,negativo:false,category:"redes",title:"Un seguidor te pide que retires un clip",text:"La conversación crece rápido y cualquier respuesta puede amplificarla.",a:{label:"Responder",desc:"Entrás en la conversación y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "comunidad": -1},cierre:{"vistasPct": 0.13, "subsPct": 0.05}},b:{label:"Responder con calma",desc:"Das contexto sin convertirlo en el centro de tu contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.06}},c:{label:"No participar",desc:"Dejás que la conversación siga sin vos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_031",minSubs:150000,negativo:false,category:"colabs",title:"Un creador de tamaño parecido propone colaborar",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_032",minSubs:50,negativo:false,category:"colabs",title:"Un creador un poco más grande te descubre",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_033",minSubs:500,negativo:false,category:"colabs",title:"Un creador de otro nicho quiere probar algo distinto",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_034",minSubs:1500,negativo:false,category:"colabs",title:"Un viejo contacto vuelve a escribirte",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_035",minSubs:5000,negativo:false,category:"colabs",title:"Un creador pequeño te pide una oportunidad",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_036",minSubs:15000,negativo:false,category:"colabs",title:"Un podcast te ofrece una entrevista",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_037",minSubs:30000,negativo:false,category:"colabs",title:"Un evento necesita un invitado",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_038",minSubs:75000,negativo:false,category:"colabs",title:"Un creador internacional propone un contenido remoto",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_039",minSubs:150000,negativo:false,category:"colabs",title:"Un compañero de nicho quiere competir en un reto",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_040",minSubs:50,negativo:false,category:"colabs",title:"Un creador con mala reputación te invita",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_041",minSubs:500,negativo:false,category:"colabs",title:"Un colaborador quiere repetir una fórmula que funcionó",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_042",minSubs:1500,negativo:false,category:"colabs",title:"Un grupo de creadores organiza una noche especial",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_043",minSubs:5000,negativo:false,category:"colabs",title:"Una colaboración queda sin fecha",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_044",minSubs:15000,negativo:false,category:"colabs",title:"Un creador rival propone hacer las paces",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_045",minSubs:30000,negativo:false,category:"colabs",title:"Un creador te pide ayuda con un proyecto",text:"La oportunidad tiene potencial, pero requiere coordinar tiempos, audiencias y expectativas.",a:{label:"Aceptar",desc:"Apostás a la colaboración y a la audiencia compartida.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 2},cierre:{"vistasPct": 0.14, "subsPct": 0.06}},b:{label:"Negociar el formato",desc:"Buscás una versión que encaje mejor con tu canal.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2, "networking": 2},cierre:{"vistasPct": 0.09, "subsPct": 0.04}},c:{label:"Dejarlo para después",desc:"Priorizás tu calendario actual y mantenés la relación abierta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2, "networking": 1},cierre:{"vistasPct": 0.03}}},
            {id:"evt_046",minSubs:75000,negativo:false,category:"sponsor",title:"Una marca local te ofrece un acuerdo",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_047",minSubs:150000,negativo:false,category:"sponsor",title:"Una marca quiere un código de descuento",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_048",minSubs:50,negativo:false,category:"sponsor",title:"Te ofrecen producto a cambio de contenido",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_049",minSubs:500,negativo:false,category:"sponsor",title:"Un sponsor pide exclusividad",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_050",minSubs:1500,negativo:false,category:"sponsor",title:"Una campaña tiene un objetivo de vistas",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_051",minSubs:5000,negativo:false,category:"sponsor",title:"Una marca quiere un stream dedicado",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_052",minSubs:15000,negativo:false,category:"sponsor",title:"Una empresa pide integración corta",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_053",minSubs:30000,negativo:false,category:"sponsor",title:"Un sponsor quiere usar tu imagen",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_054",minSubs:75000,negativo:false,category:"sponsor",title:"Una marca pide exclusividad por categoría",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_055",minSubs:150000,negativo:false,category:"sponsor",title:"Una campaña tiene bonus por rendimiento",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_056",minSubs:50,negativo:false,category:"sponsor",title:"Una empresa quiere renovar",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_057",minSubs:500,negativo:false,category:"sponsor",title:"Un sponsor exige aprobación previa",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_058",minSubs:1500,negativo:false,category:"sponsor",title:"Una marca pequeña te ofrece ser embajador",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_059",minSubs:5000,negativo:false,category:"sponsor",title:"Te ofrecen una campaña fuera de tu nicho",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_060",minSubs:15000,negativo:false,category:"sponsor",title:"Un sponsor pide una mención en todos tus videos",text:"La propuesta puede mejorar tus ingresos, aunque tiene condiciones que pueden afectar tu estrategia.",a:{label:"Aceptar con condiciones",desc:"Entrás al acuerdo, pero intentás conservar control creativo.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 250, "reputacion": -1, "networking": 2},cierre:{"dineroPct": 0.04}},b:{label:"Negociar",desc:"Buscás mejores condiciones y aceptás el riesgo de perder la propuesta.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3},cierre:{"dineroPct": 0.07, "vistasPct": -0.03}},c:{label:"Rechazar",desc:"Preferís proteger la relación con tu audiencia antes que cerrar rápido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 5},cierre:{"subsPct": 0.02}}},
            {id:"evt_061",minSubs:30000,negativo:true,category:"economia",title:"Sube el costo de tu producción",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_062",minSubs:75000,negativo:true,category:"economia",title:"Tu editor pide una actualización de sueldo",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_063",minSubs:150000,negativo:true,category:"economia",title:"Un gasto inesperado aparece",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_064",minSubs:50,negativo:true,category:"economia",title:"Tenés dinero para una sola inversión grande",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_065",minSubs:500,negativo:true,category:"economia",title:"El alquiler del estudio aumenta",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_066",minSubs:1500,negativo:true,category:"economia",title:"Una marca paga tarde",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_067",minSubs:5000,negativo:true,category:"economia",title:"Un negocio tuyo empieza a crecer",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_068",minSubs:15000,negativo:true,category:"economia",title:"Una campaña supera el objetivo",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_069",minSubs:30000,negativo:true,category:"economia",title:"Tu contador detecta un gasto innecesario",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_070",minSubs:75000,negativo:true,category:"economia",title:"Un viaje puede abrir nuevas oportunidades",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_071",minSubs:150000,negativo:true,category:"economia",title:"Tu caja queda ajustada",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_072",minSubs:50,negativo:true,category:"economia",title:"Un proveedor ofrece financiación",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_073",minSubs:500,negativo:true,category:"economia",title:"Un producto que vendés se agota",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_074",minSubs:1500,negativo:true,category:"economia",title:"Un empleado recibe otra oferta",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_075",minSubs:5000,negativo:true,category:"economia",title:"Un ingreso extraordinario llega",text:"La decisión impacta tu caja y el margen con el que vas a cerrar el trimestre.",a:{label:"Invertir",desc:"Usás parte de la caja para intentar mejorar el rendimiento.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -180, "calidad": 2},cierre:{"vistasPct": 0.1}},b:{label:"Esperar",desc:"Conservás liquidez y observás cómo evoluciona la situación.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 40},cierre:{"vistasPct": 0.02}},c:{label:"Buscar una alternativa",desc:"Reducís el costo con una solución menos cómoda.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 1, "dinero": -60},cierre:{"vistasPct": 0.05}}},
            {id:"evt_076",minSubs:15000,negativo:false,category:"equipo",title:"Tu editor propone un nuevo estilo",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_077",minSubs:30000,negativo:false,category:"equipo",title:"El community manager detecta una tendencia",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_078",minSubs:75000,negativo:false,category:"equipo",title:"El manager consigue una reunión",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_079",minSubs:150000,negativo:false,category:"equipo",title:"Tu diseñador está saturado",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_080",minSubs:50,negativo:false,category:"equipo",title:"El moderador pide más herramientas",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_081",minSubs:500,negativo:false,category:"equipo",title:"Tu contador recomienda ordenar gastos",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_082",minSubs:1500,negativo:false,category:"equipo",title:"Un empleado quiere trabajar remoto",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_083",minSubs:5000,negativo:false,category:"equipo",title:"El manager quiere cambiar tu estrategia",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_084",minSubs:15000,negativo:false,category:"equipo",title:"Tu editor quiere especializarse",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_085",minSubs:30000,negativo:false,category:"equipo",title:"El equipo propone contratar a alguien",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_086",minSubs:75000,negativo:false,category:"equipo",title:"Un empleado cometió un error",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_087",minSubs:150000,negativo:false,category:"equipo",title:"Tu staff te pide un descanso",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_088",minSubs:50,negativo:false,category:"equipo",title:"Un colaborador necesita producción extra",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_089",minSubs:500,negativo:false,category:"equipo",title:"Tu analista encuentra una caída",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_090",minSubs:1500,negativo:false,category:"equipo",title:"El equipo descubre una oportunidad",text:"Tu equipo necesita una decisión que puede afectar tanto el rendimiento como los costos.",a:{label:"Seguir la propuesta",desc:"Confiás en el equipo y aceptás el cambio.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -80, "networking": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el plan",desc:"Priorizás estabilidad y no modificás el flujo actual.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 2},cierre:{"vistasPct": 0.03}},c:{label:"Probar por un trimestre",desc:"Hacés una prueba antes de decidir definitivamente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.07, "dineroPct": -0.02}}},
            {id:"evt_091",minSubs:5000,negativo:true,category:"casa",title:"Tu estudio necesita mejor acústica",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_092",minSubs:15000,negativo:true,category:"casa",title:"La iluminación quedó chica",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_093",minSubs:30000,negativo:true,category:"casa",title:"Tu PC tarda demasiado en editar",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_094",minSubs:75000,negativo:true,category:"casa",title:"El espacio se volvió incómodo",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_095",minSubs:150000,negativo:true,category:"casa",title:"Podés mudarte a un estudio mejor",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_096",minSubs:50,negativo:true,category:"casa",title:"Una marca te ofrece equipamiento",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_097",minSubs:500,negativo:true,category:"casa",title:"Tu cámara necesita mantenimiento",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_098",minSubs:1500,negativo:true,category:"casa",title:"Tu micrófono empieza a fallar",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_099",minSubs:5000,negativo:true,category:"casa",title:"El fondo del canal necesita renovación",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_100",minSubs:15000,negativo:true,category:"casa",title:"Tenés espacio para armar una segunda sala",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_101",minSubs:30000,negativo:true,category:"casa",title:"Un vecino se queja del ruido",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_102",minSubs:75000,negativo:true,category:"casa",title:"La conexión del estudio se vuelve inestable",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_103",minSubs:150000,negativo:true,category:"casa",title:"Una tormenta afecta el setup",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_104",minSubs:50,negativo:true,category:"casa",title:"Tu silla ya no aguanta jornadas largas",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_105",minSubs:500,negativo:true,category:"casa",title:"Tu almacenamiento está lleno",text:"El setup ya influye en la calidad y la comodidad con la que trabajás.",a:{label:"Comprar la mejora",desc:"La inversión resuelve el problema, pero reduce tu caja.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -220, "edicion": 2},cierre:{"vistasPct": 0.08}},b:{label:"Reparar lo actual",desc:"Gastás menos y mantenés el setup.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": -70},cierre:{"vistasPct": 0.03}},c:{label:"Postergarlo",desc:"Priorizás otras necesidades y aceptás cierta pérdida de calidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"dinero": 20},cierre:{"vistasPct": -0.04}}},
            {id:"evt_106",minSubs:1500,negativo:true,category:"rivalidad",title:"Tu rival publicó un video que te supera",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_107",minSubs:5000,negativo:true,category:"rivalidad",title:"Tu rival te menciona en una entrevista",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_108",minSubs:15000,negativo:true,category:"rivalidad",title:"Tu rival consigue un sponsor importante",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_109",minSubs:30000,negativo:true,category:"rivalidad",title:"Tu rival te supera en seguidores",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_110",minSubs:75000,negativo:true,category:"rivalidad",title:"Tu rival cambia de nicho",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_111",minSubs:150000,negativo:true,category:"rivalidad",title:"Tu rival anuncia una colaboración grande",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_112",minSubs:50,negativo:true,category:"rivalidad",title:"Tu rival critica tu formato",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_113",minSubs:500,negativo:true,category:"rivalidad",title:"Tu rival te propone un desafío",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_114",minSubs:1500,negativo:true,category:"rivalidad",title:"Tu rival pierde un sponsor",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_115",minSubs:5000,negativo:true,category:"rivalidad",title:"Tu rival tiene un viral enorme",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_116",minSubs:15000,negativo:true,category:"rivalidad",title:"Un fan compara tus setups",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_117",minSubs:30000,negativo:true,category:"rivalidad",title:"Un ranking pone a tu rival arriba",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_118",minSubs:75000,negativo:true,category:"rivalidad",title:"Tu rival copia una idea tuya",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_119",minSubs:150000,negativo:true,category:"rivalidad",title:"Tu rival te felicita",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_120",minSubs:50,negativo:true,category:"rivalidad",title:"Una audiencia compartida pide una colaboración",text:"La competencia puede darte exposición, pero también puede arrastrarte a una estrategia que no querés.",a:{label:"Responder con contenido",desc:"Competís directamente y aceptás la presión.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"fama": 4, "rivalidad": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05}},b:{label:"Ignorar",desc:"No alimentás la competencia y mantenés tu estrategia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 4},cierre:{"vistasPct": 0.02}},c:{label:"Tender un puente",desc:"Buscás convertir la tensión en una oportunidad de colaboración.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "rivalidad": -3},cierre:{"vistasPct": 0.08, "subsPct": 0.03}}},
            {id:"evt_121",minSubs:500,negativo:false,category:"comunidad",title:"Tu comunidad pide más streams",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_122",minSubs:1500,negativo:false,category:"comunidad",title:"Los miembros más fieles organizan algo",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_123",minSubs:5000,negativo:false,category:"comunidad",title:"Un fan hace una guía sobre tu contenido",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_124",minSubs:15000,negativo:false,category:"comunidad",title:"La comunidad detecta un error",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_125",minSubs:30000,negativo:false,category:"comunidad",title:"Un grupo de seguidores quiere conocerte",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_126",minSubs:75000,negativo:false,category:"comunidad",title:"Tu chat está creciendo demasiado",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_127",minSubs:150000,negativo:false,category:"comunidad",title:"Los comentarios están más negativos",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_128",minSubs:50,negativo:false,category:"comunidad",title:"Tu comunidad propone un reto",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_129",minSubs:500,negativo:false,category:"comunidad",title:"Un fan te envía una idea excelente",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_130",minSubs:1500,negativo:false,category:"comunidad",title:"La comunidad empieza a dividirse",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_131",minSubs:5000,negativo:false,category:"comunidad",title:"Tus seguidores piden merchandising",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_132",minSubs:15000,negativo:false,category:"comunidad",title:"Un fan crea una comunidad paralela",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_133",minSubs:30000,negativo:false,category:"comunidad",title:"Tu audiencia organiza una campaña solidaria",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_134",minSubs:75000,negativo:false,category:"comunidad",title:"Un seguidor se vuelve viral por mencionarte",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_135",minSubs:150000,negativo:false,category:"comunidad",title:"La comunidad quiere que vuelvas a un juego",text:"Tu audiencia está reaccionando y no todos quieren lo mismo para el canal.",a:{label:"Escuchar a la comunidad",desc:"Tomás en cuenta la demanda y ajustás parte del contenido.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"comunidad": 5},cierre:{"vistasPct": 0.09}},b:{label:"Mantener tu visión",desc:"No cambiás el rumbo aunque algunos se decepcionen.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "constancia": 2},cierre:{"vistasPct": 0.04}},c:{label:"Hacer una prueba",desc:"Probás la idea sin convertirla todavía en tu nueva identidad.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"marketing": 2},cierre:{"vistasPct": 0.07, "subsPct": 0.03}}},
            {id:"evt_136",minSubs:50,negativo:false,category:"plataforma",title:"La plataforma cambia el algoritmo",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_137",minSubs:500,negativo:false,category:"plataforma",title:"La plataforma recomienda contenido corto",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_138",minSubs:1500,negativo:false,category:"plataforma",title:"Tu categoría pierde visibilidad",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_139",minSubs:5000,negativo:false,category:"plataforma",title:"La plataforma destaca directos largos",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_140",minSubs:15000,negativo:false,category:"plataforma",title:"Aparece una nueva función",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_141",minSubs:30000,negativo:false,category:"plataforma",title:"La plataforma cambia sus políticas",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_142",minSubs:75000,negativo:false,category:"plataforma",title:"Una falla afecta a varios canales",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_143",minSubs:150000,negativo:false,category:"plataforma",title:"La monetización cambia",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_144",minSubs:50,negativo:false,category:"plataforma",title:"Una nueva plataforma gana usuarios",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_145",minSubs:500,negativo:false,category:"plataforma",title:"La competencia ofrece mejores condiciones",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_146",minSubs:1500,negativo:false,category:"plataforma",title:"La plataforma lanza una herramienta de edición",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_147",minSubs:5000,negativo:false,category:"plataforma",title:"Un formato queda destacado",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_148",minSubs:15000,negativo:false,category:"plataforma",title:"Tu canal recibe una recomendación inesperada",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_149",minSubs:30000,negativo:false,category:"plataforma",title:"La plataforma anuncia un evento",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_150",minSubs:75000,negativo:false,category:"plataforma",title:"Una actualización rompe parte del flujo",text:"El cambio puede modificar cómo descubrimos y monetizamos contenido.",a:{label:"Apostar por el cambio",desc:"Adaptás parte del contenido a la nueva tendencia.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"algoritmo": 2, "marketing": 1},cierre:{"vistasPct": 0.12}},b:{label:"Mantener tu estrategia",desc:"No cambiás todo por una modificación que todavía no conocés.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.04}},c:{label:"Experimentar",desc:"Probás el formato con una parte del calendario.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"edicion": 2},cierre:{"vistasPct": 0.08, "dineroPct": -0.02}}},
            {id:"evt_151",minSubs:150000,negativo:false,category:"vida",title:"Necesitás tomarte unos días",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_152",minSubs:50,negativo:false,category:"vida",title:"Un compromiso personal ocupa tu agenda",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_153",minSubs:500,negativo:false,category:"vida",title:"Te reconocen en un lugar público",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_154",minSubs:1500,negativo:false,category:"vida",title:"Un viaje coincide con una oportunidad",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_155",minSubs:5000,negativo:false,category:"vida",title:"Una entrevista aparece de sorpresa",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_156",minSubs:15000,negativo:false,category:"vida",title:"Te ofrecen aparecer en televisión",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_157",minSubs:30000,negativo:false,category:"vida",title:"Una productora quiere conocerte",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_158",minSubs:75000,negativo:false,category:"vida",title:"Un evento familiar coincide con un stream",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_159",minSubs:150000,negativo:false,category:"vida",title:"Una oportunidad internacional llega con poco aviso",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_160",minSubs:50,negativo:false,category:"vida",title:"Tu privacidad se vuelve tema de conversación",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_161",minSubs:500,negativo:false,category:"vida",title:"Un medio publica datos sobre tu carrera",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_162",minSubs:1500,negativo:false,category:"vida",title:"Un conocido te ofrece un proyecto",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_163",minSubs:5000,negativo:false,category:"vida",title:"Un descanso mejora tu energía",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_164",minSubs:15000,negativo:false,category:"vida",title:"Una salida con amigos termina en un clip",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_165",minSubs:30000,negativo:false,category:"vida",title:"Una invitación importante llega en mal momento",text:"La oportunidad o problema compite directamente con tu tiempo y energía.",a:{label:"Aprovechar la oportunidad",desc:"Reorganizás el trimestre para estar presente.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 3, "fama": 2},cierre:{"vistasPct": 0.09}},b:{label:"Mantener el calendario",desc:"Protegés la constancia y evitás improvisar.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"constancia": 3},cierre:{"vistasPct": 0.04}},c:{label:"Tomarte un descanso",desc:"Aceptás perder algo de ritmo para recuperar energía.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 3, "comunidad": 2},cierre:{"vistasPct": -0.03}}},
            {id:"evt_166",minSubs:75000,negativo:false,category:"evento",title:"Te invitan a un evento presencial",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_167",minSubs:150000,negativo:false,category:"evento",title:"Un torneo busca participantes",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_168",minSubs:50,negativo:false,category:"evento",title:"Un festival de creadores abre inscripciones",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_169",minSubs:500,negativo:false,category:"evento",title:"Un evento deportivo busca streamers",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_170",minSubs:1500,negativo:false,category:"evento",title:"Una feria gaming quiere un stand con vos",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_171",minSubs:5000,negativo:false,category:"evento",title:"Un organizador te ofrece una charla",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_172",minSubs:15000,negativo:false,category:"evento",title:"Un torneo de tu juego favorito anuncia premios",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_173",minSubs:30000,negativo:false,category:"evento",title:"Un evento internacional abre cupos",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_174",minSubs:75000,negativo:false,category:"evento",title:"Un programa de streaming busca invitados",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_175",minSubs:150000,negativo:false,category:"evento",title:"Una convención quiere usar tu imagen",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_176",minSubs:50,negativo:false,category:"evento",title:"Un evento cancela a último momento",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_177",minSubs:500,negativo:false,category:"evento",title:"Un torneo cambia las reglas",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_178",minSubs:1500,negativo:false,category:"evento",title:"Una organización te pide participar en una causa",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_179",minSubs:5000,negativo:false,category:"evento",title:"Un evento quiere una transmisión conjunta",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}},
            {id:"evt_180",minSubs:15000,negativo:false,category:"evento",title:"Un productor te ofrece ser anfitrión",text:"El evento puede darte exposición y contactos, pero tiene costos y exige tiempo.",a:{label:"Participar",desc:"Entrás al evento y aceptás la exposición.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 4, "fama": 3},cierre:{"vistasPct": 0.15, "subsPct": 0.05, "dineroPct": -0.02}},b:{label:"Negociar condiciones",desc:"Intentás conseguir mejor espacio y menos costos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"networking": 2, "dinero": -50},cierre:{"vistasPct": 0.1, "subsPct": 0.03}},c:{label:"No participar",desc:"Mantenés tu calendario y evitás gastos.",tradeoff:"La decisión tiene una ventaja, pero también un costo para tu carrera.",action:{"reputacion": 2},cierre:{"vistasPct": 0.02}}}
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

        const eventoRealista = hacerEventoMasRealista(JSON.parse(JSON.stringify(evento)), p);
        this.pendingEvent = eventoRealista;

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

        p[`historialTrimestre${this.time.trimestre}`] = actividad;

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
            .filter(c => Number(c.seguidores || 0) >= 100)
            .filter(c => {
                const info = calcularAlcanceCollab(this.player, c);
                return Number(c.seguidores || 0) <= subs || (info.ratio <= 2.5 && (info.mismoNicho || Number(this.player.relationships?.[c.id] || 0) >= 20));
            })
            .filter(c => c.nicho === niche || Math.random() < 0.45)
            .filter(c => Number(this.player.relationships?.[c.id] || 0) > -40);

        if (!candidatos.length) return null;

        const hayRookie = candidatos.some(c => Number(c.seguidores || 0) <= 25000 && Number.isInteger(c.debutYear));
        // Las invitaciones deben sentirse como parte del mundo, no como
        // contenido que el jugador tiene que perseguir desde un menú.
        const colaboracionesPrevias = Number(p.stats?.colaboraciones || 0);
        const chance = Math.min(0.55,
            0.16
            + (hayRookie ? 0.12 : 0)
            + Math.min(0.10, networking * 0.002)
            + Math.min(0.08, fama * 0.001)
            + Math.min(0.08, colaboracionesPrevias * 0.01)
        );

        if (Math.random() > chance) return null;

        const ordenados = candidatos.slice().sort((a, b) => Number(a.seguidores || 0) - Number(b.seguidores || 0));
        const pool = subs < 5000
            ? ordenados.slice(0, Math.min(8, ordenados.length))
            : ordenados.slice(0, Math.min(14, ordenados.length));
        const creador = pool[Math.floor(Math.random() * pool.length)];

        const creadorSubs = Math.max(1000, Number(creador.seguidores) || 1000);
        // Una colab tiene que sentirse como una exposición real a otra audiencia,
        // no como un premio fijo de +15 subs. El resultado varía mucho según
        // el tamaño del creador y la suerte del contenido.
        const baseCompartida = Math.max(1, Number(p.suscriptores) || 1);
        const vistas = Math.max(300, Math.round(
            creadorSubs * randomFloat(0.12, 0.55) +
            baseCompartida * randomFloat(0.04, 0.18)
        ));
        const conversion = randomFloat(0.025, 0.095) + Math.min(0.035, Number(p.atributos?.carisma || 0) * 0.00035);
        const pico = Math.random() < 0.08 ? randomFloat(1.5, 3.2) : 1;
        const subsGanados = Math.max(30, Math.round(vistas * conversion * pico));
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

    obtenerInfoCollab(creatorId) {
        const creator = (this.creators || []).find(c => c.id === creatorId);
        if (!creator) return null;
        return calcularAlcanceCollab(this.player, creator);
    },

    puedeProponerCollab(creatorId) {
        const creator = (this.creators || []).find(c => c.id === creatorId);
        if (!creator || creator.activo === false || creator.id === "player") return false;
        const debut = Number(creator.debutYear);
        if (Number.isFinite(debut) && debut > Number(this.time?.año || 2026)) return false;
        return calcularAlcanceCollab(this.player, creator).dentroDeAlcance;
    },

    proponerCollab(creatorId) {
        const p = this.player;
        if (!p || this.pendingCollabOffer || !this.puedeProponerCollab(creatorId)) return false;
        if (this.lastCollab?.año === this.time.año && this.lastCollab?.trimestre === this.time.trimestre && this.lastCollab?.creatorId === creatorId) {
            return false;
        }
        const creador = (this.creators || []).find(c => c.id === creatorId);
        if (!creador || creador.activo === false) return false;

        const info = calcularAlcanceCollab(p, creador);
        if (!info.dentroDeAlcance) return "fuera_de_alcance";

        const relacion = info.relacion;
        const diferencia = info.ratio;
        const fama = info.fama;
        const networking = info.networking;
        const mismoNicho = info.mismoNicho;

        // Probabilidad de aceptación basada en una situación plausible:
        // cuentas pequeñas aceptan más fácilmente a pares; una cuenta grande
        // tiene menos incentivos para aceptar a alguien muy chico.
        let prob;
        if (diferencia <= 0.75) prob = 0.78;
        else if (diferencia <= 1.5) prob = 0.64;
        else if (diferencia <= 2.5) prob = 0.48;
        else if (diferencia <= 5) prob = 0.27;
        else if (diferencia <= 8) prob = 0.12;
        else if (diferencia <= 12) prob = 0.055;
        else prob = 0.02;

        prob += Math.max(-0.12, Math.min(0.16, relacion / 450));
        prob += Math.min(0.12, networking / 500);
        prob += Math.min(0.08, fama / 1000);
        if (mismoNicho) prob += 0.10;
        prob = Math.max(0.02, Math.min(0.88, prob));

        if (Math.random() > prob) {
            p.relationships[creatorId] = Math.max(-100, relacion - 1);
            this.lastCollab = { creatorId, creatorName: creador.nombre, estado: "rechazada_por_creador", fecha: Date.now() };
            this.agregarNotificacion({ tipo: "collab", titulo: `↩️ ${creador.nombre} no aceptó`, descripcion: "Por ahora la diferencia de tamaño o la falta de relación hizo difícil cerrar la colaboración." });
            this.guardar();
            return "rechazada";
        }

        // Las colabs pueden mover cientos o miles de seguidores.
        // No usamos un mínimo artificial de +15: el tamaño de ambas audiencias,
        // carisma, relación y un pequeño factor de suerte determinan el resultado.
        const creadorSubs = Math.max(1000, Number(creador.seguidores || 0));
        const audienciaJugador = Math.max(1, Number(p.suscriptores || 1));
        const vistas = Math.max(300, Math.round(
            creadorSubs * randomFloat(0.12, 0.55) +
            audienciaJugador * randomFloat(0.04, 0.18)
        ));
        const conversion = randomFloat(0.025, 0.095) + Math.min(0.035, Number(p.atributos?.carisma || 0) * 0.00035);
        const pico = Math.random() < 0.08 ? randomFloat(1.5, 3.2) : 1;
        const subs = Math.max(30, Math.round(vistas * conversion * pico));
        this.pendingCollabOffer = {
            id: crearId("collab_out"), creatorId, creatorName: creador.nombre,
            creatorFollowers: Number(creador.seguidores) || 0, año: this.time.año,
            trimestre: this.time.trimestre, niche: creador.nicho, pais: creador.pais || "Argentina",
            costoVuelo: costoVuelo(creador.pais || "Argentina"), direction: "outgoing",
            reward: { vistas, subs }, estado: "pendiente", ratio: diferencia
        };
        this.agregarNotificacion({ tipo: "collab", titulo: `📨 ${creador.nombre} aceptó tu propuesta`, descripcion: `La colaboración tiene sentido para ambos canales (${Number(creador.seguidores || 0).toLocaleString("es-AR")} vs. ${Number(p.suscriptores || 0).toLocaleString("es-AR")} seguidores).` });
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

    // ---------------------------------------------------------------------
    // MONETIZACIÓN COMERCIAL: acuerdos por vistas / entregables
    // ---------------------------------------------------------------------
    calcularRPMEstimado() {
        const p = this.player;
        const niche = p?.niche || "Gaming";
        const base = {
            Gaming: 2.8, "Streaming": 3.2, "Tecnología": 5.5, "Educación": 6.0,
            Cocina: 4.2, "Fútbol": 3.0, "Comedia": 2.5, IRL: 3.0, Vlog: 3.1,
            Podcast: 4.8, Documental: 6.5, "Periodismo": 5.8, Fitness: 4.0
        }[niche] || 3.0;
        const audiencia = Math.min(1.45, 0.85 + Math.log10(Math.max(100, Number(p.suscriptores)||100)) * 0.10);
        const reputacion = 0.75 + Math.max(0, Math.min(0.35, Number(p.reputacion||50)/140));
        return Math.round(base * audiencia * reputacion * 100) / 100;
    },

    generarOfertaCampaign() {
        const p = this.player;
        if (!p || this.pendingCampaignOffer) return null;
        const subs = Number(p.suscriptores)||0;
        if (subs < 3000) return null;
        const avgViews = Number(p.actividadTrimestre?.vistas || 0) || Math.max(500, Math.round(subs * 0.45));
        const brands = [
            { id:"campaign_local", name:"Marca Local", minSubs:3000, cpmMin:3.5, cpmMax:7, target:0.8, max:3500, duration:1, deliverables:1 },
            { id:"campaign_hardware", name:"Hardware Partner", minSubs:10000, cpmMin:5, cpmMax:9, target:1.0, max:9000, duration:1, deliverables:2 },
            { id:"campaign_food", name:"Food & Lifestyle", minSubs:25000, cpmMin:4.5, cpmMax:8, target:1.0, max:12000, duration:1, deliverables:2 },
            { id:"campaign_app", name:"App de Entretenimiento", minSubs:50000, cpmMin:5.5, cpmMax:10, target:1.15, max:22000, duration:1, deliverables:3 },
            { id:"campaign_tech", name:"Tech Partner", minSubs:150000, cpmMin:7, cpmMax:13, target:1.2, max:50000, duration:2, deliverables:3 },
            { id:"campaign_global", name:"Marca Internacional", minSubs:500000, cpmMin:9, cpmMax:18, target:1.35, max:120000, duration:2, deliverables:4 }
        ];
        const eligible = brands.filter(b => subs >= b.minSubs && !this.campaigns.some(c => c.id===b.id && c.estado==="activo"));
        if (!eligible.length || Math.random() > 0.48) return null;
        const brand = eligible[Math.floor(Math.random()*Math.min(3, eligible.length))];
        const cpm = Math.round(randomFloat(brand.cpmMin, brand.cpmMax)*100)/100;
        const targetViews = Math.max(1000, Math.round(avgViews * brand.target));
        this.pendingCampaignOffer = {
            id: `${brand.id}_${this.time.año}_${this.time.trimestre}_${Date.now()}`,
            brandId: brand.id, name: brand.name, type:"cpm", cpm,
            targetViews, maxPayout: brand.max, duration: brand.duration,
            deliverables: brand.deliverables, minSubs: brand.minSubs,
            añoOferta:this.time.año, trimestreOferta:this.time.trimestre,
            estado:"pendiente"
        };
        this.agregarNotificacion({tipo:"campaign", titulo:`📊 ${brand.name} propone una campaña por visitas`, descripcion:`Te ofrecen $${cpm.toFixed(2)} cada 1.000 vistas verificadas.`});
        this.guardar();
        return this.pendingCampaignOffer;
    },

    aceptarCampaign() {
        const offer = this.pendingCampaignOffer;
        if (!offer) return false;
        const campaign = {
            ...offer,
            estado:"activo",
            firmadoEn:Date.now(),
            inicioAño:this.time.año,
            inicioTrimestre:this.time.trimestre,
            trimestresRestantes:Number(offer.duration)||1,
            vistasAcumuladas:0,
            pagoAcumulado:0
        };
        this.campaigns.push(campaign);
        this.player.monetizacion ||= {adsActivos:false,rpmEstimado:0,acuerdosFirmados:0,campañasCompletadas:0};
        this.player.monetizacion.acuerdosFirmados = Number(this.player.monetizacion.acuerdosFirmados||0)+1;
        this.pendingCampaignOffer = null;
        this.guardar();
        return true;
    },

    rechazarCampaign() {
        if (!this.pendingCampaignOffer) return false;
        this.campaigns.push({...this.pendingCampaignOffer, estado:"rechazado", rechazadoEn:Date.now()});
        this.pendingCampaignOffer = null;
        this.guardar();
        return true;
    },

    liquidarCampañasTrimestre() {
        const p=this.player;
        const vistas=Number(p.actividadTrimestre?.vistas)||0;
        const año=this.time.año, trimestre=this.time.trimestre;
        let total=0;
        for (const campaign of this.campaigns.filter(c=>c.estado==="activo")) {
            const inicioVal = Number(campaign.inicioAño)*4 + Number(campaign.inicioTrimestre);
            const actualVal = año*4 + trimestre;
            if (actualVal <= inicioVal) continue; // firmada al cierre del trimestre: empieza en el siguiente
            const videos = Math.max(1, Number(p.actividadTrimestre?.videos || 0));
            const entregables = Math.max(1, Number(campaign.deliverables || 1));
            // Solo una parte de las vistas del trimestre corresponde a los
            // contenidos patrocinados. La estimamos según los entregables
            // acordados, en vez de pagar el CPM sobre todo el canal.
            const cuotaPatrocinada = Math.min(0.75, Math.max(0.10, entregables / videos));
            const vistasElegibles = Math.round(vistas * cuotaPatrocinada);
            const payout = Math.min(Number(campaign.maxPayout)||0, Math.round((vistasElegibles/1000)*Number(campaign.cpm||0)));
            campaign.vistasAcumuladas = Number(campaign.vistasAcumuladas||0)+vistasElegibles;
            campaign.pagoAcumulado = Number(campaign.pagoAcumulado||0)+payout;
            campaign.ultimoTrimestre={año,trimestre,vistasTotales:vistas,vistasElegibles,pago:payout};
            if (payout>0) {
                p.dinero += payout;
                p.ingresosTrimestre += payout;
                p.ingresosGenerados += payout;
                p.ingresosDesglose ||= {publicidad:0,sponsors:0,negocios:0,afiliados:0,donaciones:0};
                p.ingresosDesglose.sponsors += payout;
                total += payout;
            }
            campaign.trimestresRestantes = Number(campaign.trimestresRestantes||1)-1;
            if (campaign.trimestresRestantes<=0 || campaign.pagoAcumulado>=Number(campaign.maxPayout||0)) {
                campaign.estado="completado";
                campaign.completadoEn=Date.now();
                p.monetizacion ||= {adsActivos:false,rpmEstimado:0,acuerdosFirmados:0,campañasCompletadas:0};
                p.monetizacion.campañasCompletadas = Number(p.monetizacion.campañasCompletadas||0)+1;
            }
        }
        if (total>0) this.agregarNotificacion({tipo:"campaign",titulo:`💰 Liquidación de campañas: +$${total.toLocaleString("es-AR")}`,descripcion:`Tus acuerdos por visitas se liquidaron según las vistas verificadas del trimestre.`});
        return total;
    },

    // Las marcas aparecen solas. El botón "Contratos" solamente sirve para
    // abrir la bandeja/historial, no para generar ofertas.
    generarOfertaSponsor() {
        const marcas = [
            { id: "dehuka", name: "Dehuka", minSubs: 800, minFama: 0, payMin: 120, payMax: 350, duration: 1, prestige: 1, tipo: "local" },
            { id: "xfx_arg", name: "XFX Argentina", minSubs: 1500, minFama: 1, payMin: 180, payMax: 500, duration: 1, prestige: 1, tipo: "local" },
            { id: "pcfix", name: "PCFIX", minSubs: 1200, minFama: 0, payMin: 150, payMax: 450, duration: 1, prestige: 1, tipo: "local" },
            { id: "xtpc", name: "XT-PC", minSubs: 1500, minFama: 1, payMin: 180, payMax: 550, duration: 1, prestige: 1, tipo: "local" },
            { id: "norte_gaming", name: "Norte Gaming", minSubs: 800, minFama: 0, payMin: 120, payMax: 380, duration: 1, prestige: 1, tipo: "local" },
            { id: "gz_tienda", name: "GZ Tienda", minSubs: 1000, minFama: 0, payMin: 130, payMax: 420, duration: 1, prestige: 1, tipo: "local" },
            { id: "fullh4rd", name: "FullH4rd", minSubs: 2000, minFama: 1, payMin: 200, payMax: 650, duration: 1, prestige: 2, tipo: "local" },
            { id: "nova_gaming", name: "Nova Gaming", minSubs: 1200, minFama: 0, payMin: 140, payMax: 450, duration: 1, prestige: 1, tipo: "local" },
            { id: "compragamer", name: "CompraGamer", minSubs: 5000, minFama: 3, payMin: 400, payMax: 1100, duration: 1, prestige: 2, tipo: "local" },
            { id: "mexx", name: "Mexx", minSubs: 4000, minFama: 2, payMin: 350, payMax: 1000, duration: 1, prestige: 2, tipo: "local" },
            { id: "venex", name: "Venex", minSubs: 4000, minFama: 2, payMin: 350, payMax: 1000, duration: 1, prestige: 2, tipo: "local" },
            { id: "gezatek", name: "Gezatek", minSubs: 3500, minFama: 2, payMin: 300, payMax: 950, duration: 1, prestige: 2, tipo: "local" },
            { id: "maximus", name: "Maximus Gaming", minSubs: 5000, minFama: 3, payMin: 450, payMax: 1200, duration: 1, prestige: 2, tipo: "local" },
            { id: "noxie", name: "Noxie Store", minSubs: 2500, minFama: 1, payMin: 250, payMax: 750, duration: 1, prestige: 2, tipo: "local" },
            { id: "gold_gaming", name: "Gold Gaming", minSubs: 1200, minFama: 0, payMin: 160, payMax: 500, duration: 1, prestige: 1, tipo: "local" },
            { id: "inputhouse", name: "InputHouse", minSubs: 900, minFama: 0, payMin: 120, payMax: 400, duration: 1, prestige: 1, tipo: "local" },
            { id: "aula", name: "Aula", minSubs: 1800, minFama: 1, payMin: 200, payMax: 600, duration: 1, prestige: 2, tipo: "local" },
            { id: "variic", name: "Variic", minSubs: 1200, minFama: 1, payMin: 150, payMax: 500, duration: 1, prestige: 2, tipo: "local" },
            { id: "noganet", name: "Noganet", minSubs: 1800, minFama: 1, payMin: 200, payMax: 650, duration: 1, prestige: 2, tipo: "local" },
            { id: "aureox", name: "Aureox", minSubs: 2500, minFama: 2, payMin: 250, payMax: 800, duration: 1, prestige: 2, tipo: "local" },
            { id: "primoffice", name: "PrimOffice", minSubs: 1000, minFama: 0, payMin: 130, payMax: 420, duration: 1, prestige: 1, tipo: "local" },
            { id: "crown_mustang", name: "Crown Mustang", minSubs: 1800, minFama: 1, payMin: 200, payMax: 650, duration: 1, prestige: 2, tipo: "local" },
            { id: "tdagger", name: "T-Dagger", minSubs: 3000, minFama: 2, payMin: 300, payMax: 900, duration: 1, prestige: 2, tipo: "local" },
            { id: "hypergaming", name: "HyperGaming", minSubs: 900, minFama: 0, payMin: 120, payMax: 380, duration: 1, prestige: 1, tipo: "local" },
            { id: "gamingpoint", name: "Gaming Point", minSubs: 800, minFama: 0, payMin: 110, payMax: 350, duration: 1, prestige: 1, tipo: "local" },
            { id: "xtremegames", name: "Xtreme Games", minSubs: 800, minFama: 0, payMin: 110, payMax: 360, duration: 1, prestige: 1, tipo: "local" },
            { id: "uranostream", name: "Urano Stream", minSubs: 700, minFama: 0, payMin: 100, payMax: 330, duration: 1, prestige: 1, tipo: "local" },
            { id: "lfcomputacion", name: "LF Computación", minSubs: 700, minFama: 0, payMin: 100, payMax: 320, duration: 1, prestige: 1, tipo: "local" },
            { id: "newcomputers", name: "New Computers", minSubs: 900, minFama: 0, payMin: 110, payMax: 360, duration: 1, prestige: 1, tipo: "local" },
            { id: "computodo", name: "Computodo", minSubs: 700, minFama: 0, payMin: 100, payMax: 320, duration: 1, prestige: 1, tipo: "local" },
            { id: "maycam", name: "Maycam", minSubs: 900, minFama: 0, payMin: 120, payMax: 380, duration: 1, prestige: 1, tipo: "local" },
            { id: "virtualhouse", name: "Virtual House", minSubs: 800, minFama: 0, payMin: 110, payMax: 360, duration: 1, prestige: 1, tipo: "local" },
            { id: "spacegamers", name: "Space Gamers", minSubs: 1000, minFama: 0, payMin: 130, payMax: 420, duration: 1, prestige: 1, tipo: "local" },
            { id: "libreopcion", name: "LibreOpción", minSubs: 2500, minFama: 2, payMin: 250, payMax: 800, duration: 1, prestige: 2, tipo: "local" },
            { id: "mym", name: "Mym Computación", minSubs: 1200, minFama: 1, payMin: 150, payMax: 500, duration: 1, prestige: 1, tipo: "local" },
            { id: "logg", name: "Logg", minSubs: 1500, minFama: 1, payMin: 180, payMax: 600, duration: 1, prestige: 2, tipo: "local" },
            { id: "armytech", name: "ArmyTech", minSubs: 1200, minFama: 1, payMin: 150, payMax: 500, duration: 1, prestige: 1, tipo: "local" },
            { id: "solutionbox", name: "Solution Box", minSubs: 3000, minFama: 2, payMin: 300, payMax: 900, duration: 1, prestige: 2, tipo: "local" },
            { id: "bangho", name: "Banghó", minSubs: 5000, minFama: 4, payMin: 500, payMax: 1400, duration: 1, prestige: 3, tipo: "local" },
            { id: "enova", name: "eNOVA", minSubs: 1800, minFama: 1, payMin: 180, payMax: 600, duration: 1, prestige: 2, tipo: "local" },
            { id: "kelyx", name: "Kelyx", minSubs: 1000, minFama: 0, payMin: 120, payMax: 400, duration: 1, prestige: 1, tipo: "local" },
            { id: "sentey", name: "Sentey", minSubs: 2500, minFama: 2, payMin: 250, payMax: 750, duration: 1, prestige: 2, tipo: "local" },
            { id: "gaming_city", name: "Gaming City", minSubs: 1200, minFama: 1, payMin: 150, payMax: 500, duration: 1, prestige: 1, tipo: "local" },
            { id: "gears_store", name: "Gears Store", minSubs: 900, minFama: 0, payMin: 120, payMax: 400, duration: 1, prestige: 1, tipo: "local" },
            { id: "scp_hardstore", name: "SCP Hardstore", minSubs: 1200, minFama: 1, payMin: 150, payMax: 500, duration: 1, prestige: 1, tipo: "local" },
            { id: "slot_one", name: "Slot One", minSubs: 1000, minFama: 0, payMin: 120, payMax: 380, duration: 1, prestige: 1, tipo: "local" },
            { id: "goldentech", name: "Goldentech", minSubs: 1200, minFama: 1, payMin: 150, payMax: 500, duration: 1, prestige: 1, tipo: "local" },
            { id: "air_computer", name: "Air Computer", minSubs: 1500, minFama: 1, payMin: 180, payMax: 600, duration: 1, prestige: 2, tipo: "local" },
            { id: "ceven", name: "CEVEN", minSubs: 2000, minFama: 1, payMin: 220, payMax: 700, duration: 1, prestige: 2, tipo: "local" },
            { id: "new_bytes", name: "New Bytes", minSubs: 2000, minFama: 1, payMin: 220, payMax: 700, duration: 1, prestige: 2, tipo: "local" },
            { id: "pc_arts", name: "PC ARTS", minSubs: 3000, minFama: 2, payMin: 300, payMax: 900, duration: 1, prestige: 2, tipo: "local" },
            { id: "maycam2", name: "Maycam", minSubs: 900, minFama: 0, payMin: 120, payMax: 380, duration: 1, prestige: 1, tipo: "local" },
            { id: "redragon", name: "Redragon", minSubs: 5000, minFama: 3, payMin: 400, payMax: 1000, duration: 2, prestige: 2, tipo: "hardware" },
            { id: "logitech", name: "Logitech G", minSubs: 15000, minFama: 8, payMin: 900, payMax: 2200, duration: 2, prestige: 3, tipo: "premium" },
            { id: "redbull", name: "Red Bull", minSubs: 75000, minFama: 15, payMin: 2500, payMax: 6000, duration: 2, prestige: 5, tipo: "premium" },
            { id: "adidas", name: "Adidas", minSubs: 300000, minFama: 30, payMin: 8000, payMax: 18000, duration: 2, prestige: 8, tipo: "premium" },
            { id: "nike", name: "Nike", minSubs: 750000, minFama: 40, payMin: 12000, payMax: 28000, duration: 2, prestige: 10, tipo: "premium" },
            { id: "cocacola", name: "Coca-Cola", minSubs: 1500000, minFama: 50, payMin: 18000, payMax: 40000, duration: 2, prestige: 12, tipo: "premium" },
            { id: "apple", name: "Apple", minSubs: 3000000, minFama: 65, payMin: 50000, payMax: 100000, duration: 2, prestige: 15, tipo: "premium" },
            { id: "samsung", name: "Samsung", minSubs: 120000, minFama: 20, payMin: 7000, payMax: 16000, duration: 2, prestige: 7, tipo: "premium" },
            { id: "spotify", name: "Spotify", minSubs: 250000, minFama: 28, payMin: 9000, payMax: 22000, duration: 2, prestige: 8, tipo: "premium" },
            { id: "logitech_pro", name: "Logitech", minSubs: 50000, minFama: 14, payMin: 2500, payMax: 6500, duration: 2, prestige: 5, tipo: "premium" },
            { id: "speed", name: "Speed Unlimited", minSubs: 75000, minFama: 16, payMin: 3000, payMax: 8000, duration: 2, prestige: 5, tipo: "premium" },
            { id: "mercadolibre", name: "Mercado Libre", minSubs: 200000, minFama: 24, payMin: 8000, payMax: 20000, duration: 2, prestige: 8, tipo: "premium" },
            { id: "adobe", name: "Adobe", minSubs: 100000, minFama: 18, payMin: 4500, payMax: 11000, duration: 2, prestige: 6, tipo: "premium" },
            { id: "casino", name: "Casino Online", minSubs: 50000, minFama: 8, payMin: 4500, payMax: 9000, duration: 1, prestige: 2, tipo: "casino", reputacionAceptar: -10 },
            { id: "crypto", name: "Crypto Exchange", minSubs: 150000, minFama: 18, payMin: 7000, payMax: 15000, duration: 1, prestige: 3, tipo: "cripto", reputacionAceptar: -8 }
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
            marca.minSubs >= 750000 ? 0.90 :
            marca.minSubs >= 300000 ? 0.92 :
            0.96;

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
                campaigns: this.campaigns,
                pendingCampaignOffer: this.pendingCampaignOffer,
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
            this.campaigns = Array.isArray(data.campaigns) ? data.campaigns : [];
            this.pendingCampaignOffer = data.pendingCampaignOffer || null;
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
        if (this.time.trimestre !== TRIMESTRES_POR_AÑO) return false;

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
        this.player.historialTrimestre3 = null;
        this.player.historialTrimestre4 = null;
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

        // Cierra el trimestre: primero se liquidan campañas por vistas y luego
        // staff, negocios y afiliados cobran/pagan antes de entrar al siguiente.
        this.liquidarCampañasTrimestre();
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
        if (this.time.trimestre !== TRIMESTRES_POR_AÑO) return null;

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
                Number(this.player.historialTrimestre2?.mejorVideo) || 0,
                Number(this.player.historialTrimestre3?.mejorVideo) || 0,
                Number(this.player.historialTrimestre4?.mejorVideo) || 0
            ),
            videosVirales: [1,2,3,4].reduce((sum, q) => sum + (Number(this.player[`historialTrimestre${q}`]?.virales) || 0), 0),

            trimestre1: this.player.historialTrimestre1 || null,
            trimestre2: this.player.historialTrimestre2 || null,
            trimestre3: this.player.historialTrimestre3 || null,
            trimestre4: this.player.historialTrimestre4 || null,
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
    if (!Number.isInteger(p.trimestre) || p.trimestre < 1 || p.trimestre > 4) p.trimestre = 1;
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
    if (!p.monetizacion) p.monetizacion = { adsActivos:false, rpmEstimado:0, acuerdosFirmados:0, campañasCompletadas:0 };
    p.monetizacion.rpmEstimado = gameState.calcularRPMEstimado ? gameState.calcularRPMEstimado() : Number(p.monetizacion.rpmEstimado||0);
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
    if (!("historialTrimestre3" in p)) p.historialTrimestre3 = null;
    if (!("historialTrimestre4" in p)) p.historialTrimestre4 = null;
    if (!p.yearStartSnapshot) p.yearStartSnapshot = snapshotAño(p);
    if (p.pretemporada && typeof p.pretemporada.efecto !== "string") p.pretemporada.efecto = p.pretemporada.atributo || null;

    if (!gameState.time) {
        gameState.time = {
            año: p.año,
            trimestre: p.trimestre
        };
    }

    if (typeof gameState.time.año !== "number") gameState.time.año = p.año;
    if (!Number.isInteger(gameState.time.trimestre) || gameState.time.trimestre < 1 || gameState.time.trimestre > 4) {
        gameState.time.trimestre = p.trimestre;
    }

    p.año = gameState.time.año;
    p.trimestre = gameState.time.trimestre;

    if (!Array.isArray(gameState.inventory)) gameState.inventory = [];
    if (!Array.isArray(gameState.notifications)) gameState.notifications = [];
    if (!Array.isArray(gameState.creators)) gameState.creators = crearCreadores();
    if (!Array.isArray(gameState.trends)) gameState.trends = [];
    if (!Array.isArray(gameState.sponsors)) gameState.sponsors = [];
    if (!Array.isArray(gameState.campaigns)) gameState.campaigns = [];
    if (!("pendingCampaignOffer" in gameState)) gameState.pendingCampaignOffer = null;
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
