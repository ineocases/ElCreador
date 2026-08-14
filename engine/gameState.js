// engine/gameState.js
// Estado central de El Creador.
// REGLA: 4 trimestres = 1 año.
// El jugador elige 1 video destacado por trimestre; después su canal publica
// un volumen razonable de videos EN ESE TRIMESTRE, ajustado al nicho y la constancia. Son videos del propio jugador,
// como los partidos que jugó un futbolista: el jugador ve el volumen y el resultado,
// pero no tiene que elegir manualmente cada publicación.

import { creators } from "../data/creators.js";
import { creatorGroups } from "../data/creatorGroups.js";
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

function claveTrimestre(time = {}) {
    return `${Number(time.año || 2026)}-T${Number(time.trimestre || 1)}`;
}

function colabsRealizadasEsteTrimestre(state) {
    const key = claveTrimestre(state.time);
    if (!state.player.colabsPorTrimestre || typeof state.player.colabsPorTrimestre !== "object") state.player.colabsPorTrimestre = {};
    return Number(state.player.colabsPorTrimestre[key] || 0);
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
        rivalidades: {},
        groupEventHistory: {},
        colabsPorTrimestre: {},
        pretemporada: null,
        velada: { tier: 0, training: 0, rival: null, eligible: false, wins: 0, losses: 0, offerYear: null, offerStatus: "none", offerRerolls: 0, acceptedYear: null, trainingByQuarter: {}, completedQuarter: {}, fightCompletedYear: null },
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
    return creators.map(creator => ({
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
        asegurarContrapartida(
            evento.c,
            evento.c?.desc || "Camino avanzado: ofrece una ventaja concreta, pero sacrifica otra parte de tu carrera.",
            "c"
        );
        evento.c.tradeoff = evento.c.tradeoff || "Camino avanzado: ofrece una ventaja, pero también un costo real.";
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
    [1000, 0.5],
    [5000, 1],
    [10000, 2],
    [50000, 3],
    [100000, 5],
    [500000, 10],
    [1000000, 18],
    [5000000, 30],
    [10000000, 45]
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
    // La fama de logros avanza lentamente: los eventos, virales y colabs
    // suman, pero ninguno debería disparar la fama de golpe.
    const gananciaLenta = Math.max(0, Number(cantidad) || 0) * 0.35;
    player.famaLogros = Math.max(0, Number(player.famaLogros) || 0) + gananciaLenta;
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

    // Los grupos generan encuentros especiales muy poco frecuentes.
    // La idea es que un jugador pueda "entrar" a círculos de creadores por reputación,
    // tamaño y networking, sin convertirlos en una lista permanente de tareas.
    generarEventoGrupoEspecial(subs, fama, reputacion) {
        const p = this.player;
        const grupos = Array.isArray(creatorGroups) ? creatorGroups : [];
        if (!p || !grupos.length) return null;

        const año = Number(this.time?.año || 2026);
        const trimestre = Number(this.time?.trimestre || 1);
        const networking = Number(p.atributos?.networking || 0);
        const elegibles = grupos.filter(group => {
            if (subs < Number(group.minSubs || 0)) return false;
            if (fama < Number(group.minFama || 0)) return false;
            const members = group.members
                .map(id => this.creators.find(c => c.id === id))
                .filter(Boolean);
            if (members.length < 2) return false;

            const last = p.groupEventHistory?.[group.id];
            if (last && Number(last.año) === año && Number(last.trimestre) === trimestre) return false;
            if (last && Number(last.año) > año - Number(group.cooldownYears || 1)) return false;
            return true;
        });

        if (!elegibles.length) return null;

        // El chance sube con el tamaño, fama y networking, pero sigue siendo raro.
        const scored = elegibles.map(group => {
            const ratioSubs = Math.min(1.8, Math.log10(Math.max(10, subs / Math.max(1, group.minSubs))) + 1);
            const social = Math.min(0.8, networking / 100);
            const reputation = Math.min(0.5, Math.max(0, reputacion - 50) / 100);
            const chance = Math.min(0.095, Number(group.baseChance || 0.03) * (0.72 + ratioSubs * 0.30 + social * 0.20 + reputation * 0.10));
            return { group, chance };
        });

        // Solo un grupo puede aparecer en un trimestre.
        const totalChance = Math.min(0.16, scored.reduce((sum, item) => sum + item.chance, 0));
        if (Math.random() >= totalChance) return null;

        let roll = Math.random() * scored.reduce((sum, item) => sum + item.chance, 0);
        let selected = scored[0];
        for (const item of scored) {
            roll -= item.chance;
            if (roll <= 0) { selected = item; break; }
        }

        const group = selected.group;
        const members = group.members
            .map(id => this.creators.find(c => c.id === id))
            .filter(Boolean)
            .sort((a,b) => Number(b.popularidad || 0) - Number(a.popularidad || 0));

        // Elegimos 2-3 nombres para que el evento se sienta como una juntada real,
        // sin llenar la pantalla con toda la lista del grupo.
        const amount = members.length >= 6 ? 3 : 2;
        const invitados = [...members].sort(() => Math.random() - 0.5).slice(0, amount);
        const nombres = invitados.map(c => c.nombre);
        const ids = invitados.map(c => c.id);
        const impacto = Math.max(0.65, Math.min(1.55, (Number(p.suscriptores || 0) / Number(group.minSubs || 1)) ** 0.08));
        const baseSubs = Math.min(0.22, 0.07 * impacto + (networking / 1000));
        const baseViews = Math.min(0.34, 0.15 * impacto + (fama / 1000));

        const event = {
            id: `group_${group.id}_${año}_${trimestre}`,
            minSubs: Number(group.minSubs || 0),
            negativo: false,
            category: "grupo",
            groupId: group.id,
            groupName: group.nombre,
            creatorIds: ids,
            title: `🤝 ${group.nombre}: te invitaron a un stream`,
            text: `${nombres.join(", ")} te escribieron para juntarse a hacer un stream. No es una colaboración garantizada: es una oportunidad para entrar en su círculo y quedar en el radar del grupo.`,
            a: {
                label: "Ir al stream",
                desc: `Entrás al stream con ${nombres.join(", " )}. Ganás exposición y relaciones, pero cedés tiempo de producción y quedás más expuesto.`,
                action: { networking: 5, fama: 3, reputacion: -1, constancia: -2 },
                cierre: { vistasPct: baseViews, subsPct: baseSubs, dineroPct: -0.02 }
            },
            b: {
                label: "No ir esta vez",
                desc: "Cuidás tu calendario y evitás sobreexponerte. La puerta no se cierra, pero perdés parte del impulso del encuentro.",
                action: { reputacion: 2, networking: -1, constancia: 2 },
                cierre: { vistasPct: 0.025, subsPct: 0.012 }
            }
        };

        // Un evento de grupo no debe aparecer dos veces seguidas por accidente.
        p.groupEventHistory ||= {};
        p.groupEventHistory[group.id] = { año, trimestre };
        return event;
    },

    // Banco de eventos argentinos: situaciones de carrera, cultura y calle local.
    // Se genera una tanda amplia para evitar repetir siempre los mismos eventos.
    crearEventosArgentinos() {
        const defs = [
            ["mate_chat","comunidad",500,"El chat se te llena de gente cebando mate","En pleno stream, el chat empieza a pedir una juntada de mate y charla.","Hacer una mateada con la comunidad","Convertís el momento en contenido y reforzás la comunidad.","Seguir con el stream normal","Evitás desordenar el calendario y cuidás la producción."],
            ["bondi_stream","irl",1000,"El bondi se convierte en tu próximo stream","Tenés que cruzar media ciudad y el viaje puede convertirse en contenido.","Prender IRL desde el viaje","Ganás espontaneidad y descubrimiento, pero el stream queda más impredecible.","Llegar y grabar tranquilo","Priorizás calidad y evitás problemas técnicos."],
            ["sube_sin_saldo","vida",500,"Te quedaste sin saldo en la SUBE","Salís apurado a una grabación y la SUBE no tiene saldo.","Resolverlo y llegar igual","Llegás a tiempo, pero gastás plata y energía.","Reprogramar","Ahorrás el viaje, pero perdés ritmo y una oportunidad."],
            ["lluvia_conurbano","irl",1500,"Llovió fuerte y se complicó todo","Tenías una grabación afuera y la lluvia dejó la ciudad imposible.","Salir igual","El contenido puede ser auténtico, aunque aumenta el riesgo de que salga mal.","Pasarlo para otro día","Cuidás la producción y evitás perder plata."],
            ["corte_luz","tecnico",500,"Se cortó la luz justo antes del stream","Todo estaba listo y de golpe se apagó el barrio.","Improvisar desde el celular","Mantenés la comunidad activa, pero sacrificás calidad.","Cancelar y volver mañana","Evitás un stream flojo, aunque perdés constancia."],
            ["internet_caido","tecnico",1000,"Se cayó internet en el peor momento","La conexión empieza a fallar justo cuando estabas por arrancar.","Transmitir con datos","Salvás el stream, pero consumís recursos y la calidad baja.","Esperar al proveedor","Mantenés la calidad, pero perdés una noche de contenido."],
            ["delivery_stream","irl",5000,"El delivery llega en pleno directo","El pedido que esperabas llega justo cuando el stream está explotando.","Hacerlo parte del stream","Sumás espontaneidad y cercanía, pero desviás el contenido.","Cortar para comer","Cuidás el ritmo del programa, aunque el momento se pierde."],
            ["asado_colab","comunidad",10000,"Te invitaron a un asado con otros creadores","La juntada es informal, pero hay varios creadores que todavía no conocés.","Ir al asado","Ganás networking y posibilidades de colaboración, pero perdés horas de trabajo.","Quedarte trabajando","Mantenés producción y constancia, pero te perdés la juntada."],
            ["quincho_stream","grupo",25000,"La juntada del quincho pinta para stream","Varios creadores quieren prender directo desde una casa y te ofrecieron sumarte.","Caer con el setup","Podés sacar un contenido enorme, pero la improvisación puede jugar en contra.","No sumarte","Cuidás tu marca, aunque dejás pasar una oportunidad social."],
            ["feria_gaming","evento",5000,"Una feria gamer de Argentina te ofrece un espacio","Un organizador local quiere que hagas un vivo y conozcas a otros creadores.","Participar","Ganás exposición y contactos, pero hay gastos y tiempo de viaje.","Negociar condiciones","Reducís costos, aunque la propuesta puede achicarse."],
            ["evento_caba","evento",15000,"Te invitaron a un evento en CABA","La invitación incluye prensa, otros creadores y una aparición en vivo.","Ir","Sumás networking y exposición, pero resignás horas de producción.","No ir","Mantenés tu calendario, pero perdés visibilidad presencial."],
            ["evento_rosario","evento",10000,"Un evento de creadores en Rosario te quiere","La organización busca sumar creadores de distintas provincias.","Viajar","Ampliás tu red fuera de Buenos Aires, con costo de viaje.","Participar remoto","Ahorrás plata y tiempo, pero perdés parte del impacto presencial."],
            ["evento_cordoba","evento",10000,"Córdoba te abre una fecha para creadores","Una organización cordobesa te ofrece participar en una jornada de contenido.","Viajar a Córdoba","Conocés otra escena y ganás contactos, pero el viaje cuesta.","Dejarlo para otra edición","Cuidás el bolsillo, aunque la oportunidad puede no repetirse pronto."],
            ["evento_mendoza","evento",15000,"Te ofrecen grabar en Mendoza","Una producción quiere llevarte a Mendoza para un contenido especial.","Aceptar","Sumás contenido distinto y contactos, pero el viaje te saca del calendario.","Rechazar","Mantenés la rutina y el presupuesto, pero perdés una experiencia fuerte."],
            ["evento_laplata","evento",5000,"La escena de La Plata te invita a una juntada","Varios creadores locales armaron una fecha y te dejaron un lugar.","Ir","Abrís una red nueva y podés sacar una colaboración natural.","No ir","Te quedás con tu agenda, pero perdés networking."],
            ["cafe_creadores","networking",3000,"Te cruzaste con otros creadores en un café","Una charla casual termina con gente de la escena interesada en hacer algo juntos.","Quedarte charlando","Ganás networking y una posible colaboración, pero perdés tiempo de edición.","Seguir trabajando","Mantenés el calendario, pero dejás enfriar el contacto."],
            ["mateada_creadores","networking",8000,"Te invitaron a una mateada de creadores","No es un evento formal: es una juntada chica para conocerse y compartir ideas.","Ir","Fortalecés relaciones sin la presión de una colaboración formal.","No ir","Evitás distraerte y mantenés el foco."],
            ["chat_argento","comunidad",500,"El chat arranca una discusión bien argentina","El stream se desvía entre fútbol, mate, precios y anécdotas del barrio.","Dejar que fluya","La comunidad se engancha muchísimo, aunque perdés el tema principal.","Volver al contenido","Mantenés el foco y la retención del programa."],
            ["precio_setup","dinero",5000,"Subió el precio del setup que querías comprar","El equipo que venías mirando aumentó de precio y tu presupuesto quedó corto.","Comprar igual","Mejorás la producción ahora, pero reducís mucho el colchón.","Esperar","Cuidás la plata, aunque demorás una mejora importante."],
            ["inflacion_equipo","dinero",15000,"Tu presupuesto para el canal se achicó","Los costos de producción subieron y tenés que reorganizar gastos.","Recortar gastos","Cuidás liquidez, pero algunas mejoras del canal quedan para después.","Invertir igual","Mantenés el crecimiento, pero asumís más presión financiera."],
            ["mercadopago_sponsor","sponsor",5000,"Una marca local quiere pagarte por Mercado Pago","Una empresa chica te ofrece una campaña rápida para mostrar su producto.","Aceptar","Sumás plata y experiencia comercial, pero tenés que adaptar contenido.","Negociar mejor","Podés conseguir mejores condiciones, pero existe riesgo de perder la campaña."],
            ["emprendimiento_arg","sponsor",1000,"Un emprendimiento argentino quiere aparecer en tu canal","Es una marca chica con un producto que encaja bastante con tu comunidad.","Darles una oportunidad","Construís una relación comercial y ayudás a una marca chica.","Pedir más presupuesto","Protegés el valor de tu canal, pero quizás no puedan pagarlo."],
            ["local_barrio","sponsor",500,"Un negocio del barrio te propone una colaboración","Te ofrecen canje y algo de plata a cambio de mostrar el local.","Aceptar el canje","Sumás una colaboración real y contenido cercano, pero el pago es bajo.","Rechazar","Mantenés el estándar comercial, aunque perdés una relación local."],
            ["marca_ropa_arg","sponsor",10000,"Una marca de ropa argentina te quiere vestir","La marca quiere aparecer en varios streams y fotos.","Aceptar","Mejorás imagen y conseguís una campaña, pero cedés parte de control creativo.","Negociar","Buscás mejores condiciones y exclusividad."],
            ["setup_tienda_arg","sponsor",25000,"Una tienda argentina de hardware quiere trabajar con vos","Te ofrecen equipo y un código de descuento para tu comunidad.","Aceptar","Mejorás el setup y abrís una vía comercial, pero tenés que cuidar la credibilidad.","Pedir prueba primero","Protegés tu reputación antes de recomendar el producto."],
            ["festival_musica_no","evento",30000,"Un festival te ofrece cubrir contenido detrás de escena","No vas como cantante: te quieren para hacer contenido, entrevistas y streaming.","Aceptar","Ganás exposición y contactos, aunque cambia tu rutina de contenido.","Rechazar","Mantenés tu nicho y evitás mezclar demasiado la marca."],
            ["futbol_potrero","futbol",1000,"Te invitaron a un partido en un potrero","Varios creadores van a jugar y quieren hacer un vivo informal.","Jugar y streamear","Ganás contenido espontáneo y networking, pero el formato es impredecible.","Mirarlo desde afuera","Cuidás energía y calendario, pero te perdés el momento."],
            ["futbol_cancha","futbol",10000,"Un creador te invitó a jugar un partido","La propuesta es hacer contenido alrededor del fútbol, no un partido profesional.","Aceptar","Abrís una nueva audiencia y generás una colaboración natural.","Rechazar","Mantenés tu nicho y evitás exponerte fuera de tu zona cómoda."],
            ["futbol_club","futbol",50000,"Un club argentino quiere grabar contenido con vos","La propuesta mezcla stream, desafíos y contenido con jugadores.","Aceptar","Gran exposición y networking, pero exige producción y horarios.","Negociar formato","Buscás que el contenido encaje mejor con tu canal."],
            ["ascenso_futbol","futbol",5000,"Un club del ascenso te ofrece una colaboración","La propuesta es mucho más chica, pero puede ser un buen primer contacto con el fútbol.","Ir","Construís una relación real y sumás contenido diferente.","Esperar una oportunidad más grande","Cuidás tu calendario, pero perdés una puerta de entrada."],
            ["radio_stream","medios",5000,"Una radio te quiere entrevistar en vivo","La entrevista es corta, pero puede llevarte a una audiencia nueva.","Ir","Sumás exposición y contactos, pero perdés tiempo de producción.","Hacerla por videollamada","Ahorrás viaje y tiempo, aunque el impacto puede ser menor."],
            ["radio_local","medios",1000,"Una radio local te invitó a hablar de tu canal","Es una entrevista chica y muy de barrio.","Aceptar","Construís presencia local y experiencia frente a medios.","Rechazar","Mantenés el calendario, aunque perdés una oportunidad de exposición."],
            ["podcast_arg","medios",10000,"Un podcast argentino te quiere como invitado","El episodio toca creación de contenido, plata y vida de streamer.","Aceptar","Ganás una audiencia nueva y contactos, pero lleva varias horas.","Pasar esta vez","Cuidás producción y calendario."],
            ["nota_portal","medios",25000,"Un portal argentino quiere una nota sobre tu crecimiento","La nota puede ayudarte a salir del circuito habitual de redes.","Dar la entrevista","Ganás autoridad y descubrimiento, pero perdés control sobre el enfoque final.","Pedir revisar el enfoque","Protegés tu imagen, aunque la nota podría demorarse."],
            ["tele_arg","medios",75000,"Te ofrecieron aparecer en un programa de TV","La producción busca una nota corta sobre creadores digitales.","Aceptar","Sumás exposición masiva, pero quedás muy expuesto a una audiencia distinta.","Rechazar","Protegés tu marca y evitás una exposición que no controlás."],
            ["premios_arg","premios",25000,"Quedaste nominado en unos premios de creadores","Tu comunidad empieza a pedir que votes y compartas la nominación.","Mover la campaña","Aumentás visibilidad y comunidad, pero puede parecer demasiado autopromocional.","Dejar que la comunidad decida","Cuidás naturalidad, aunque perdés impulso."],
            ["votacion_creadores","premios",5000,"Tu nombre aparece en una votación de la escena","Otros creadores y comunidades empiezan a hablar de tu nominación.","Participar activamente","Ganás descubrimiento, pero quedás más expuesto a críticas.","No hacer campaña","Mantenés perfil bajo y reputación."],
            ["trend_arg","contenido",500,"Un meme argentino explota en redes","El meme está en todos lados y tu comunidad pide que hagas algo con eso.","Subirte al meme","Ganás alcance rápido, pero el contenido puede envejecer en días.","No perseguirlo","Mantenés identidad, aunque perdés tráfico inmediato."],
            ["meme_futbol","contenido",1500,"Un meme de fútbol se vuelve viral","El chat te pide reaccionar y hacer contenido mientras sigue caliente.","Hacerlo hoy","Aprovechás el momento, pero sacrificás parte del calendario.","Esperar","Cuidás producción, aunque el meme puede morir."],
            ["tuit_viral","contenido",5000,"Un tuit tuyo se hizo viral","La publicación explota y de golpe te empieza a seguir gente que no conoce tu canal.","Llevarlos al canal","Convertís el alcance en audiencia, pero tenés que adaptar el contenido.","Dejarlo pasar","No forzás la conversión y cuidás tu identidad."],
            ["clip_ajeno","comunidad",10000,"Un momento tuyo empieza a circular por comunidades argentinas","No fue un video nuevo: un momento del stream se empieza a compartir por todos lados.","Aprovechar el pico","Podés convertir el momento en seguidores, aunque aumenta la exposición.","Seguir normal","Evitás perseguir una viralidad puntual."],
            ["funa_chat","drama",5000,"Un recorte fuera de contexto empieza a circular","La discusión se arma rápido y tu chat pide una respuesta.","Aclarar públicamente","Defendés tu postura, pero mantenés la polémica viva.","No responder","Dejás que el tema se enfríe, aunque algunos pueden interpretar silencio."],
            ["twitter_polemica","drama",10000,"Se armó una discusión alrededor de un tuit","La escena argentina empieza a debatir lo que dijiste.","Responder","Aclarás tu posición, pero la discusión puede crecer.","Bajar un cambio","Evitás alimentar la pelea, aunque no controlás lo que otros dicen."],
            ["chat_bardea","drama",500,"El chat se fue de las manos","La comunidad empieza a bardear a otro creador durante el stream.","Frenarlo","Mejorás el ambiente y reputación, pero parte del chat puede molestarse.","Dejarlo correr","Mantenés el entretenimiento, pero dañás la imagen del canal."],
            ["moderacion_arg","comunidad",1500,"Tus moderadores te piden cambiar las reglas del chat","La comunidad creció y ya no alcanza con moderar como antes.","Poner reglas más estrictas","Ordenás el chat y reducís quilombos, pero algunos usuarios se van a quejar.","Dejarlo más libre","Mantenés espontaneidad, pero aumentan los problemas."],
            ["discord_arg","comunidad",1000,"Tu Discord se llenó de gente","La comunidad creció y ahora necesitás ordenar canales, roles y moderación.","Invertir tiempo","Fortalecés la comunidad, pero sacrificás horas de contenido.","Dejarlo simple","Ahorrás tiempo, aunque la comunidad queda menos organizada."],
            ["meetup_arg","comunidad",5000,"La comunidad quiere una juntada","Tus seguidores de la zona quieren conocerte en persona.","Organizarla","Generás una conexión fuerte con la comunidad, pero implica logística y plata.","No hacerla todavía","Cuidás recursos y evitás problemas de organización."],
            ["cumple_canal","comunidad",500,"Se viene el aniversario de tu canal","Tu comunidad quiere un stream especial para festejar el aniversario.","Hacer un especial","Reforzás muchísimo la comunidad, pero requiere más producción.","Stream normal","Mantenés el calendario, aunque el aniversario pasa más desapercibido."],
            ["primer_editor_arg","equipo",5000,"Un editor de Argentina te ofrece ayudarte","Tiene buen criterio y conoce la forma de consumir contenido local.","Contratarlo","Mejorás producción y liberás tiempo, pero aumentan los gastos.","Probar por un mes","Reducís el riesgo y medís si realmente te sirve."],
            ["manager_arg","equipo",50000,"Un manager argentino quiere representarte","Te ofrece contactos y ayuda para negociar campañas.","Firmar","Delegás parte del trabajo comercial, pero cedés una comisión.","Negociar primero","Intentás conseguir mejores condiciones antes de comprometerte."],
            ["editor_caro","equipo",15000,"Tu editor te pide subir su tarifa","El canal creció y el editor dice que necesita cobrar más por el trabajo.","Aceptar","Mantenés una relación que ya funciona, pero suben los costos.","Negociar volumen","Buscás una tarifa mejor ligada a cantidad de videos."],
            ["thumbnail_arg","equipo",3000,"Un diseñador argentino te ofrece hacer miniaturas","Dice conocer muy bien el humor y los códigos visuales locales.","Probarlo","Podés mejorar CTR y liberar tiempo, con un costo mensual.","Seguir haciéndolas vos","Ahorrás dinero, pero sacrificás tiempo."],
            ["setup_habitacion","equipo",1000,"Tu pieza ya no alcanza para el setup","El escritorio, las luces y el equipo empiezan a ocupar demasiado lugar.","Reorganizar todo","Mejorás el espacio y la producción, pero gastás en muebles y tiempo.","Aguantar un poco más","Cuidás la plata, aunque el setup queda incómodo."],
            ["mudanza_caba","vida",25000,"El alquiler te complica el presupuesto del canal","Tus gastos fijos subieron y tenés que decidir cuánto reinvertir.","Bajar inversión","Cuidás tus finanzas personales, pero el canal crece más lento.","Mantener inversión","Sostenés el crecimiento, pero quedás con menos margen."],
            ["viaje_microcentro","irl",500,"Tenés una grabación en Microcentro y llegás justo","El tránsito y los horarios te obligan a reorganizar todo.","Salir antes","Llegás tranquilo, pero perdés horas de trabajo.","Ir justo","Ganás tiempo de producción, pero aumentás el riesgo de llegar tarde."],
            ["conurbano_juntada","networking",5000,"Una juntada de creadores del Conurbano te invitó","Es una reunión chica, lejos de los eventos grandes.","Ir","Construís relaciones naturales y conocés gente de tu misma escena.","No ir","Ahorrás viaje y tiempo, pero te perdés networking."],
            ["interior_creadores","networking",5000,"Un creador del interior quiere hacer una colaboración","La propuesta viene de una comunidad que no conocías demasiado.","Viajar","Abrís audiencia en otra provincia, con costo de viaje.","Hacerlo remoto","Ahorrás recursos, aunque la química puede ser menor."],
            ["mate_youtube","contenido",1500,"El video más simple del mes fue el que mejor funcionó","Una charla tomando mate terminó teniendo mejores números que una producción enorme.","Repetir el formato","Aprovechás una señal clara de tu comunidad, aunque puede volverse repetitivo.","Volver a producir grande","Mantenés variedad, pero ignorás una fórmula que funcionó."],
            ["alfajor_comunidad","sponsor",3000,"Una marca de alfajores te propone una campaña","La propuesta es integrar el producto de forma natural en un stream.","Aceptar","Sumás una campaña muy local y plata, pero tenés que cuidar la integración.","Negociar una campaña más grande","Podés ganar más, pero existe riesgo de perder al anunciante."],
            ["hamburgueseria","sponsor",1500,"Una hamburguesería te ofrece una noche de contenido","Quieren que pruebes el menú y hagas una transmisión desde el local.","Aceptar","Sumás contenido IRL y una relación comercial local.","Pedir pago","Defendés el valor de tu canal, aunque el local podría bajarse."],
            ["barberia","sponsor",500,"Una barbería del barrio quiere canjear con vos","Te ofrecen servicios gratis a cambio de aparecer en historias y stream.","Aceptar el canje","Ahorrás plata y generás una colaboración cercana.","Pedir campaña paga","Cuidás el valor comercial, aunque quizá pierdas la propuesta."],
            ["tienda_mates","sponsor",1000,"Una marca de mates quiere entrar a tu canal","El producto encaja con tu audiencia y te ofrecen código de descuento.","Probar el producto","Construís una campaña natural, pero cedés espacio de contenido.","Pedir más información","Evitás recomendar algo sin conocerlo bien."],
            ["cyber_arg","ventas",5000,"Se viene una semana fuerte de ofertas online","Las tiendas empiezan a buscar creadores para campañas y códigos.","Preparar contenido","Podés aprovechar el pico comercial, pero tenés que producir más.","No cambiar el calendario","Mantenés constancia, aunque perdés parte del negocio."],
            ["hot_sale","ventas",10000,"Una campaña de Hot Sale quiere tu canal","Una tienda te ofrece comisión por ventas generadas desde tu comunidad.","Aceptar","Podés ganar bien si convertís, pero tu contenido queda más comercial.","Negociar fijo + comisión","Buscás una estructura más segura, aunque la marca puede rechazarla."],
            ["evento_verano","evento",5000,"Una marca te quiere en un evento de verano","La activación es en Argentina y busca creadores para hacer contenido durante el día.","Ir","Sumás networking y contenido IRL, pero perdés un día de producción.","No ir","Cuidás tu calendario, aunque perdés exposición presencial."],
            ["invierno_stream","evento",1000,"Una juntada de invierno se vuelve tendencia","Creadores de la escena están haciendo streams desde casas y estudios.","Sumarte","Aprovechás la conversación y conocés gente nueva.","No seguir la moda","Mantenés tu identidad y evitás perseguir cada tendencia."],
            ["feriado_stream","contenido",500,"Es feriado y el chat está explotado","Tu audiencia está más conectada de lo normal.","Hacer stream especial","Aprovechás una ventana de audiencia enorme, pero sacrificás descanso.","Descansar","Recuperás energía, aunque dejás pasar un buen día para streamear."],
            ["domingo_futbol","futbol",1500,"El domingo de fútbol te dispara la audiencia","Tu comunidad quiere reaccionar y charlar durante toda la fecha.","Hacer stream","Ganás alcance y comunidad, pero el contenido queda atado al resultado.","Hacer contenido propio","Mantenés identidad, aunque perdés tráfico de la fecha."],
            ["seleccion_arg","futbol",50000,"La Selección domina la conversación","Tu comunidad pide un stream especial alrededor del partido y todo el país está mirando.","Cubrir el momento","Gran potencial de audiencia, pero mucha exposición y competencia.","No subirte","Cuidás tu identidad, aunque perdés uno de los picos más grandes del año."],
            ["ascenso_arg","futbol",3000,"Un club del ascenso quiere hacer un stream con vos","La propuesta es chica, cercana y muy argentina.","Aceptar","Ganás una relación real con una comunidad nueva.","Esperar","Buscás algo más grande, pero podés perder una oportunidad genuina."],
            ["ezeiza_viaje","irl",25000,"Una colaboración te obliga a cruzarte toda la ciudad","El viaje te lleva horas y tenés que decidir si vale la pena.","Ir igual","Fortalecés la relación y ganás contenido, pero perdés mucho tiempo.","Negociar hacerlo cerca","Ahorrás recursos y mantenés la oportunidad abierta."],
            ["tren_irregular","irl",1000,"El tren se demoró y llegás tarde a una grabación","La producción empieza sin vos y tenés que reaccionar rápido.","Avisar y reprogramar","Cuidás la relación y evitás llegar mal.","Ir igual","Salvás la grabación, pero llegás con menos tiempo y energía."],
            ["lluvia_stream","irl",500,"La lluvia te cambia todo el plan","El contenido que ibas a hacer afuera ya no tiene sentido.","Improvisar bajo techo","Salvás el día y mantenés la constancia.","Cancelar","Priorizás calidad, pero perdés una jornada de contenido."],
            ["bar_deporte","networking",10000,"Después de un evento todos se van a comer juntos","Es una oportunidad informal para hablar con creadores sin cámaras.","Quedarte","Fortalecés vínculos reales y descubrís futuras colaboraciones.","Volver a casa","Ganás descanso y tiempo, pero perdés parte del networking."],
            ["quilombo_vecinal","vida",5000,"El ruido del barrio te arruina una grabación","Necesitás decidir cómo resolver el problema sin cortar el ritmo del canal.","Regrabar","Protegés la calidad, pero perdés tiempo.","Publicar igual","Mantenés el calendario, aunque la calidad de audio baja."],
            ["familia_asado","vida",1000,"Tenés un asado familiar el mismo día de un stream","La familia insiste con que vayas y el calendario está apretado.","Ir al asado","Cuidás vínculos personales, pero perdés un stream.","Hacer el stream","Mantenés constancia, pero resignás tiempo familiar."],
            ["amigo_editor","equipo",500,"Un amigo te ofrece editar tus primeros videos","Todavía estás creciendo y el presupuesto es chico.","Aceptar ayuda","Ganás tiempo y mejorás producción, pero mezclás amistad y trabajo.","Hacerlo solo","Mantenés control y evitás problemas personales."],
            ["primer_manager","equipo",10000,"Un manager chico te ofrece conseguir campañas","Tiene pocos contactos, pero conoce bien la escena argentina.","Probarlo","Podés conseguir campañas sin armar todo desde cero, pagando comisión.","Buscar por tu cuenta","Ahorrás comisión, pero tenés que hacer todo el trabajo comercial."],
            ["canje_setup","sponsor",3000,"Una tienda te ofrece un periférico a cambio de contenido","El producto te sirve, pero el canje tiene condiciones.","Aceptar","Mejorás el setup sin gastar efectivo, pero debés entregar contenido.","Pedir plata además","Buscás una compensación más justa, con riesgo de perder el canje."]
        ];

        // Segunda tanda: situaciones bien argentinas para que "pasan cosas" no se sienta genérico.
        const extras = [
            ["sube_apagada","vida",300,"La SUBE no te toma justo cuando llegás tarde","Estás por subirte al bondi para una grabación y la SUBE decide no colaborar.","Pagar igual y llegar","Llegás a tiempo, pero gastás plata y arrancás el día cruzado.","Reprogramar","Ahorrás el viaje, pero podés perder la grabación."],
            ["uber_caro","vida",1000,"El viaje hasta la grabación sale una fortuna","Pedís un auto y el precio dinámico está por las nubes.","Pagar el viaje","Llegás a tiempo y cumplís, pero te pega en la caja.","Ir en transporte público","Ahorrás plata, aunque aumentás el riesgo de llegar tarde."],
            ["colectivo_lleno","irl",500,"El colectivo viene explotado","Tenés que cruzar la ciudad con el equipo encima.","Ir igual","No perdés la grabación, pero llegás cansado y con menos energía.","Cambiar el horario","Llegás más cómodo, pero movés todo el calendario."],
            ["tren_parado","irl",1000,"El tren quedó parado entre estaciones","Tenés una colaboración en otra punta y el tren no avanza.","Avisar y esperar","Cuidás la relación, aunque la colaboración empieza tarde.","Buscar otra forma de llegar","Gastás más, pero salvás el encuentro."],
            ["transito_accidente","irl",3000,"Un choque traba toda la avenida","Vas justo a una grabación y el tránsito está totalmente frenado.","Dar la vuelta","Gastás más en el viaje, pero llegás.","Avisar que llegás tarde","Evitás gastar de más, pero arrancás con mala imagen."],
            ["corte_agua","vida",500,"Se cortó el agua justo antes del stream","El corte te complica toda la preparación del día.","Esperar y mover el stream","Cuidás la experiencia, pero perdés constancia.","Salir igual","Mantenés el calendario, aunque el día queda incómodo."],
            ["ruido_obra","contenido",1000,"La obra del vecino no para","Tenés que grabar y el taladro aparece cada cinco minutos.","Grabar de madrugada","Salvás el contenido, pero destruís tu descanso.","Regrabar mañana","Protegés la calidad, pero perdés tiempo."],
            ["perro_ladra","contenido",500,"El perro del vecino se mete en todas las grabaciones","Cada vez que hablás, aparece un ladrido de fondo.","Dejarlo como parte del stream","El momento puede volverse gracioso y cercano.","Grabar de nuevo","Mejorás el audio, pero perdés tiempo."],
            ["vecino_queja","vida",1500,"Un vecino se queja por el volumen","El stream nocturno está empezando a generar problemas.","Bajar el volumen","Reducís el quilombo y cuidás la convivencia.","Seguir igual","Mantenés la energía del stream, pero aumentás el conflicto."],
            ["consorcio","vida",5000,"El consorcio te pide bajar el ruido","La administración te manda un aviso después de varias noches de stream.","Adaptar horarios","Cuidás el canal a largo plazo, aunque perdés algunos horarios fuertes.","Seguir con el mismo horario","No cambiás la rutina, pero te exponés a más problemas."],
            ["mate_roto","comunidad",500,"Se te rompe el mate en pleno stream","El chat convierte el accidente en el tema de la noche.","Tomarlo con humor","La comunidad se engancha y el momento se vuelve memorable.","Cortar el momento","Mantenés el contenido ordenado, pero perdés espontaneidad."],
            ["termo_perdido","vida",500,"Te olvidaste el termo antes de una juntada","La reunión con otros creadores es lejos y ya estás en camino.","Comprar uno en el camino","Resolvé el problema, pero gastás plata.","Ir sin termo","Ahorrás plata y seguís, aunque perdés parte del ritual de la juntada."],
            ["kiosco_charla","networking",300,"Una charla en el kiosco termina en una idea","Mientras comprás algo, alguien reconoce tu canal y te tira una propuesta.","Escuchar la idea","Podés encontrar una colaboración inesperada.","Seguir de largo","No perdés tiempo, pero quizá dejás pasar un buen contacto."],
            ["panaderia_stream","irl",1000,"La panadería del barrio te reconoce","Te proponen grabar un segmento corto mostrando el lugar.","Hacerlo","Generás contenido cercano y una relación local.","No hacerlo","Mantenés tu calendario, pero perdés una historia auténtica."],
            ["parrilla_colab","networking",5000,"Una parrilla quiere juntar creadores","La propuesta es una cena informal con varios creadores y contenido espontáneo.","Ir","Ganás networking y contenido, pero perdés una noche de trabajo.","Pasar","Mantenés producción, pero te perdés la juntada."],
            ["pizza_equipo","equipo",1000,"Tu equipo termina una jornada larguísima","Después de editar hasta tarde, todos proponen cerrar el día con pizza.","Invitar la pizza","Subís la moral del equipo, pero gastás plata.","Cada uno por su lado","Ahorrás, aunque el equipo queda menos motivado."],
            ["asado_editor","equipo",3000,"Tu editor te invita a un asado","La relación laboral ya se volvió bastante cercana.","Ir","Fortalecés confianza y entendimiento con tu equipo.","No ir","Mantenés límites profesionales, pero perdés una oportunidad de afianzar la relación."],
            ["fiesta_quincho","networking",10000,"El quincho de un creador se llena de gente de la escena","No es un evento formal y hay varios contactos nuevos.","Caer un rato","Ganás relaciones y posibles colaboraciones.","No ir","Cuidás energía y tiempo de trabajo."],
            ["juntada_plaza","comunidad",1000,"La comunidad arma una juntada en una plaza","Un grupo de seguidores propone conocerse en persona.","Ir","Fortalecés comunidad, pero perdés parte de tu jornada.","No ir","Mantenés privacidad y calendario."],
            ["meetup_cordoba","networking",5000,"Creadores de Córdoba arman una juntada","La escena local quiere conocerte y hablar de una colaboración.","Viajar","Abrís audiencia y contactos en Córdoba, pero pagás el viaje.","Hacer videollamada","Ahorrás recursos, aunque el vínculo es menos fuerte."],
            ["meetup_rosario","networking",5000,"Rosario te abre las puertas","Varios creadores quieren armar una colaboración presencial.","Ir","Ampliás tu red fuera de Buenos Aires.","Dejarlo para después","Ahorrás tiempo, pero la oportunidad puede enfriarse."],
            ["mateada_laplata","networking",1500,"Una mateada en La Plata reúne creadores chicos","Es una oportunidad de conocer gente antes de que crezca.","Ir","Construís relaciones desde temprano.","No ir","Te concentrás en tu carrera, pero perdés networking."],
            ["interior_viral","contenido",3000,"Un creador del interior te menciona y te descubre otra comunidad","Su audiencia empieza a llegar a tu canal.","Responder y colaborar","Convertís el descubrimiento en una relación.","Agradecer y seguir","Mantenés el foco, pero no aprovechás todo el potencial."],
            ["argentina_meme","contenido",500,"Un meme argentino explota durante la semana","Todo el mundo está hablando de lo mismo y tu chat lo pide.","Subirte al meme","Ganás alcance rápido, pero el contenido puede quedar viejo enseguida.","No perseguirlo","Mantenés identidad, pero perdés tráfico inmediato."],
            ["grupo_whatsapp","networking",1000,"Te agregan a un grupo de creadores","El grupo comparte oportunidades, eventos y contactos.","Participar","Ganás información y networking, pero recibís mucho ruido.","Silenciarlo","Cuidás foco, aunque podés perder alguna oportunidad."],
            ["discord_arg","networking",500,"Un Discord argentino te abre una sala privada","Varios creadores chicos organizan colaboraciones.","Entrar","Encontrás oportunidades de colaboración.","No entrar","Mantenés tu círculo actual, pero no ampliás contactos."],
            ["tuit_malinterpretado","drama",3000,"Un tuit tuyo se interpreta mal","Una frase corta empieza a circular fuera de contexto.","Aclarar","Bajás parte de la tensión, pero mantenés el tema vivo.","No alimentar","Evitás darle más alcance, aunque otros pueden seguir hablando."],
            ["quote_twitter","drama",10000,"Un creador te responde públicamente","La respuesta genera una discusión que empieza a crecer.","Responder con calma","Defendés tu postura y ganás respeto, pero el tema escala.","No responder","Evitás el ida y vuelta, aunque cedés protagonismo."],
            ["cancelacion_chica","drama",5000,"Una polémica chica toca tu comunidad","No hiciste nada grave, pero el chat se divide.","Hablarlo","Mostrás transparencia, aunque el tema gana atención.","Dejarlo pasar","Evitás amplificarlo, pero no controlás la conversación."],
            ["moderador_cansado","comunidad",1000,"Uno de tus mods está quemado","La comunidad creció y la moderación ya es demasiado trabajo.","Sumar otro mod","Mejorás el control, pero cedés más responsabilidad.","Mantener el equipo","Ahorrás tiempo de organización, pero aumentan los problemas."],
            ["raid_arg","comunidad",500,"Un creador chico te manda una raid inesperada","Llegan cientos de personas que no conocían tu canal.","Recibirlos bien","Convertís parte de la raid en comunidad nueva.","Seguir como si nada","Mantenés el ritmo, pero perdés una oportunidad de fidelizar."],
            ["host_arg","comunidad",1500,"Te hostean justo cuando estás cerrando stream","El tráfico llega en el peor momento posible.","Quedarte más tiempo","Aprovechás el público nuevo, pero sacrificás descanso.","Cerrar igual","Cuidás energía, pero perdés parte del tráfico."],
            ["chat_lag","tecnico",500,"El chat empieza a andar con delay","Las respuestas llegan tarde y la interacción se vuelve rara.","Seguir igual","No cortás el stream, aunque la experiencia empeora.","Reiniciar todo","Mejorás la experiencia, pero perdés unos minutos."],
            ["obs_falla","tecnico",1000,"OBS deja de responder antes de un stream","Tenés poco tiempo para resolverlo.","Reinstalar y probar","Podés salvar el stream, pero arrancás tarde.","Cancelar","Evitás un desastre técnico, pero perdés la transmisión."],
            ["microfono_roto","tecnico",1500,"El micrófono empieza a meter ruido","El problema aparece justo antes de una colaboración.","Comprar uno urgente","Salvás la grabación, pero gastás plata.","Usar el micrófono viejo","Ahorrás, aunque la calidad baja."],
            ["camara_calienta","tecnico",3000,"La cámara se recalienta durante una grabación","El rodaje lleva más tiempo de lo previsto.","Bajar la calidad","Terminás el contenido, pero sacrificás imagen.","Parar y enfriar","Protegés el equipo, aunque retrasás todo."],
            ["placa_captura","tecnico",5000,"La placa de captura empieza a fallar","El setup principal queda en riesgo.","Comprar reemplazo","Evitás perder streams futuros, pero golpeás la caja.","Seguir probando","Ahorrás plata, pero existe riesgo de perder una transmisión."],
            ["mercadopago_retenido","dinero",3000,"Un pago por Mercado Pago queda pendiente","La campaña ya terminó pero la plata todavía no impactó.","Esperar y reclamar","Cuidás la relación comercial, pero tenés plata inmovilizada.","Insistir fuerte","Aumentás la presión para cobrar, con riesgo de tensar el vínculo."],
            ["transferencia_erronea","dinero",1000,"Te transfirieron de más por error","Una marca se equivocó en el pago de una campaña.","Avisar","Ganás confianza y evitás problemas futuros.","Esperar a que reclamen","Tenés la plata momentáneamente, pero arriesgás reputación."],
            ["factura_arca","dinero",10000,"Una campaña te pide tener todo en regla","La marca quiere factura y documentación antes de pagarte.","Ordenar todo","Mejorás tu perfil profesional, pero perdés tiempo administrativo.","Postergar","Ganás tiempo hoy, pero podés demorar el cobro."],
            ["monotributo","dinero",15000,"Un contador te recomienda ordenar tu situación","El canal ya mueve suficiente plata como para tomarte el tema en serio.","Pagar asesoramiento","Ordenás el negocio, pero tenés un gasto.","Seguir solo","Ahorrás plata ahora, aunque aumentan los riesgos de errores."],
            ["impuesto_inesperado","dinero",25000,"Aparece un gasto impositivo que no habías previsto","Tu caja del trimestre queda más ajustada.","Pagar y reorganizar","Cuidás el negocio, pero bajás la inversión en contenido.","Patear gastos","Mantenés inversión, pero acumulás presión financiera."],
            ["precio_dolar_setup","dinero",5000,"El precio del hardware cambia de golpe","El equipo que querías comprar queda más caro.","Comprar ahora","Fijás el precio, pero reducís liquidez.","Esperar","Mantenés caja, pero el precio puede seguir subiendo."],
            ["stock_gpu","dinero",10000,"La placa que querías está sin stock","El upgrade del setup se complica.","Buscar otra opción","Conseguís una alternativa, pero quizás no sea tu primera elección.","Esperar stock","Mantenés el plan original, aunque retrasás la mejora."],
            ["cuotas_setup","dinero",3000,"Una tienda te ofrece cuotas para el setup","Podés mejorar el equipo sin pagar todo de una.","Aceptar cuotas","Mejorás producción ahora, pero asumís pagos futuros.","Esperar y ahorrar","Evitás deuda, aunque tardás más en mejorar."],
            ["sponsor_kiosco","sponsor",500,"Un kiosco de barrio quiere aparecer en tu stream","Es una campaña chica, pero muy cercana a tu comunidad.","Aceptar","Sumás experiencia comercial y una campaña local.","Pedir más plata","Defendés tu valor, aunque el kiosco puede bajarse."],
            ["sponsor_pizzeria","sponsor",1500,"Una pizzería te propone una campaña","Quieren que muestres el pedido durante un stream.","Aceptar","Generás contenido cercano y cobrás una campaña.","Negociar formato","Buscás que la integración no rompa el stream."],
            ["sponsor_barberia","sponsor",1000,"Una barbería quiere un canje","Te ofrecen cortes durante varios meses a cambio de historias.","Aceptar canje","Ahorrás plata y generás una relación local.","Pedir campaña paga","Defendés tu valor comercial, aunque podés perder el acuerdo."],
            ["sponsor_mates","sponsor",2000,"Una marca de mates quiere entrar al canal","La propuesta encaja con tu imagen y comunidad.","Probar producto","Construís una campaña natural, pero necesitás conocer el producto.","Pedir información","Evitás recomendar algo sin probarlo."],
            ["sponsor_indumentaria","sponsor",5000,"Una marca argentina de ropa te ofrece vestir el canal","Quieren que uses sus prendas en streams y fotos.","Aceptar","Mejorás imagen y ganás una campaña.","Negociar exclusividad","Podés conseguir mejores condiciones, pero la negociación puede caerse."],
            ["sponsor_hardware","sponsor",10000,"Una tienda argentina de hardware te ofrece periféricos","Te mandan equipo y quieren un código de descuento.","Probarlo","Mejorás el setup y abrís una relación comercial.","Pedir tiempo de prueba","Protegés tu credibilidad antes de recomendarlo."],
            ["sponsor_comida","sponsor",3000,"Una app de comida quiere un código para tu comunidad","La campaña paga por conversiones.","Aceptar","Podés ganar más si tu comunidad compra.","Pedir fijo","Buscás un ingreso más seguro, aunque la marca puede ofrecer menos."],
            ["hot_sale_arg","sponsor",5000,"Llega una semana fuerte de descuentos","Varias tiendas buscan creadores argentinos para campañas.","Preparar contenido","Aprovechás una ventana comercial, pero aumentás la carga de trabajo.","Mantener calendario","Cuidás la calidad, aunque perdés parte del negocio."],
            ["cybermonday_arg","sponsor",10000,"Una campaña de CyberMonday busca tu canal","Te ofrecen comisión por ventas y un fijo chico.","Aceptar","Diversificás ingresos, pero el contenido se vuelve más comercial.","Negociar mejor fijo","Buscás estabilidad, aunque la marca puede reducir la oferta."],
            ["feria_friki","evento",2000,"Una feria gamer/friki local te invita","Quieren un stream y una aparición con otros creadores.","Ir","Ganás exposición y contactos, pero pagás tiempo y viaje.","No ir","Mantenés el calendario, pero perdés presencia local."],
            ["evento_tecnologia","evento",10000,"Una expo de tecnología te ofrece un stand","Podés probar productos y hacer contenido en vivo.","Aceptar","Ganás contactos y material para el canal.","Negociar","Intentás conseguir mejores condiciones y menos horas."],
            ["evento_deportes","evento",5000,"Un evento deportivo argentino busca streamers","Quieren creadores para cubrir la jornada desde el lugar.","Participar","Sumás exposición y una audiencia distinta.","Rechazar","Mantenés el nicho, pero perdés una oportunidad de expansión."],
            ["club_barrio","futbol",1000,"Un club de barrio quiere hacer contenido con vos","La propuesta es sencilla: conocer el club y grabar con la gente.","Aceptar","Ganás comunidad y una historia auténtica.","No hacerlo","Mantenés agenda, pero perdés cercanía local."],
            ["club_ascenso","futbol",5000,"Un club del ascenso te propone una colaboración","Quieren mezclar fútbol y stream sin una producción enorme.","Aceptar","Llegás a una comunidad nueva y muy pasional.","Negociar formato","Buscás un contenido que encaje mejor con tu canal."],
            ["cancha_futbol","futbol",3000,"Te ofrecen ir a la cancha con otros creadores","La idea es hacer contenido antes y después del partido.","Ir","Generás contenido y networking, pero perdés horas de trabajo.","No ir","Mantenés el calendario, aunque perdés una oportunidad social."],
            ["superclasico_chat","futbol",10000,"El Superclásico domina el chat","Tu audiencia quiere que reacciones en vivo a todo lo que pasa.","Hacer stream","Aprovechás un pico enorme de interés, pero te exponés a la discusión.","No hacerlo","Evitás quilombos y mantenés tu identidad."],
            ["seleccion_partido","futbol",25000,"La Selección juega y tu audiencia se dispara","Todo el mundo está conectado y tu chat pide un stream especial.","Cubrir el partido","Podés crecer mucho, aunque hay competencia y exposición.","Mantener contenido propio","Cuidás tu identidad, pero perdés tráfico."],
            ["mercado_futbol","futbol",5000,"Un creador de fútbol te propone una charla","La colaboración es chica pero puede abrirte una audiencia nueva.","Aceptar","Ganás networking y descubrimiento.","Esperar","Buscás una colaboración más grande, pero podés perder el momento."],
            ["asado_familiar","vida",500,"Tenés un asado familiar el mismo día que un stream","La familia hace meses que no se junta y todos esperan que vayas.","Ir al asado","Cuidás vínculos personales, pero perdés contenido.","Hacer el stream","Mantenés constancia, pero resignás tiempo familiar."],
            ["cumple_amigo","vida",500,"El cumpleaños de un amigo coincide con una grabación","Tenés que elegir qué priorizar.","Ir al cumpleaños","Cuidás la amistad, pero perdés horas de producción.","Hacer la grabación","Mantenés el trabajo, pero dejás pasar un momento personal."],
            ["fin_de_mes","dinero",1000,"Llegó fin de mes y la caja está ajustada","Tenés que elegir entre reinvertir o guardar plata.","Reinvertir","Acelerás mejoras del canal, pero quedás con menos margen.","Guardar","Cuidás la caja, aunque crecés más lento."],
            ["alquiler_setup","vida",5000,"El espacio donde grabás ya no alcanza","La casa quedó chica para el setup y el equipo.","Buscar un lugar mejor","Mejorás producción, pero suben tus gastos.","Aguantar","Cuidás la plata, aunque trabajás más incómodo."],
            ["mudanza_interior","vida",10000,"Te ofrecen un espacio barato para crear en otra provincia","La propuesta podría mejorar tus costos, pero te aleja de parte de la escena.","Mudarte","Bajás costos y renovás el entorno, pero perdés cercanía con contactos.","Quedarte","Mantenés tus relaciones actuales, aunque gastás más."],
            ["horario_escolar","comunidad",500,"Tu audiencia más chica cambia sus horarios","Con el comienzo de clases, tus horarios fuertes se mueven.","Adaptar horarios","Aumentás conexión con tu comunidad, pero alterás tu rutina.","Mantener horario","Cuidás tu rutina, aunque perdés parte de la audiencia."],
            ["vacaciones_invierno","comunidad",1000,"Las vacaciones de invierno cambian el chat","Hay más gente conectada durante el día.","Hacer streams especiales","Aprovechás más audiencia, pero sacrificás descanso.","Mantener rutina","Cuidás energía, aunque perdés una ventana de crecimiento."],
            ["feriado_largo","comunidad",500,"El finde largo llena internet de audiencia","Tenés una oportunidad de hacer un stream especial.","Hacerlo","Aumentás alcance y comunidad, pero trabajás en un día de descanso.","Descansar","Recuperás energía, pero dejás pasar el pico."],
            ["lluvia_finde","irl",500,"Llueve todo el finde y se cae el plan IRL","La grabación exterior queda complicada.","Improvisar en casa","Mantenés constancia y podés sacar algo inesperado.","Reprogramar","Cuidás producción, pero perdés el fin de semana."],
            ["calor_stream","tecnico",500,"Hace un calor insoportable en la pieza","El setup empieza a levantar temperatura.","Bajar exigencia","Cuidás equipo y energía, pero el stream pierde calidad.","Seguir igual","Mantenés el contenido, pero aumentás el riesgo técnico."],
            ["frio_setup","tecnico",500,"El frío te complica una grabación larga","Pasás horas frente a cámara y el ambiente no acompaña.","Acortar sesión","Cuidás energía, pero producís menos.","Seguir","Sacás todo el contenido, pero terminás agotado."],
            ["delivery_equivocado","comunidad",500,"El delivery llega con el pedido equivocado","El error ocurre en vivo y el chat se prende.","Hacerlo parte del stream","Convertís el error en un momento divertido.","Resolver fuera de cámara","Mantenés el foco, pero perdés espontaneidad."],
            ["pedido_cancelado","vida",500,"Te cancelan el pedido justo antes de una grabación","El plan del día dependía de esa comida.","Resolver rápido","Salvás la jornada, pero gastás más.","Reprogramar","Ahorrás, pero movés el calendario."],
            ["taxi_conversacion","networking",300,"Una charla en el viaje termina en una propuesta","La persona reconoce tu canal y conoce a alguien que trabaja con creadores.","Seguir la conversación","Podés sacar un contacto inesperado.","Cortar la charla","Llegás más tranquilo, pero perdés una posibilidad."],
            ["ferreteria_setup","vida",500,"Necesitás una solución barata para el setup","Una ferretería del barrio puede resolver una parte del problema por poca plata.","Arreglarlo casero","Ahorrás dinero y resolvés rápido.","Comprar nuevo","Mejorás el resultado, pero gastás mucho más."],
            ["tecnico_barrio","tecnico",1000,"Un técnico del barrio te ofrece arreglar el equipo","Tiene buenas referencias pero no es un servicio grande.","Darle una oportunidad","Ahorrás plata y resolvés rápido, con algo de riesgo.","Ir a un servicio especializado","Tenés más respaldo, pero pagás más."],
            ["internet_proveedor","tecnico",1500,"Tu proveedor de internet te ofrece subir de plan","El canal ya consume bastante ancho de banda.","Subir de plan","Mejorás estabilidad, pero aumentás el gasto mensual.","Mantenerlo","Ahorrás, aunque seguís con el mismo riesgo."],
            ["internet_noche","tecnico",500,"La conexión empeora todas las noches","El horario donde más gente te mira coincide con el problema.","Cambiar horario","Evitás cortes, pero movés tu rutina.","Seguir igual","Mantenés el horario, aunque podés perder espectadores."],
            ["backup_disco","tecnico",1000,"Tu disco de backup se llena","Tenés años de clips y proyectos guardados.","Comprar almacenamiento","Protegés tu archivo, pero gastás plata.","Borrar material viejo","Ahorrás, pero podés arrepentirte después."],
            ["archivo_perdido","tecnico",3000,"Se corrompe un proyecto importante","Perdés parte de una grabación que necesitabas publicar.","Intentar recuperarlo","Podés salvarlo, pero retrasás el lanzamiento.","Publicar una versión simple","Mantenés la fecha, pero bajás calidad."],
            ["editor_feriado","equipo",3000,"Tu editor te avisa que no llega con el video","El feriado cambió sus planes y el video queda atrasado.","Editar vos","Salvás la fecha, pero sacrificás energía.","Mover publicación","Cuidás calidad, pero perdés constancia."],
            ["miniatura_tarde","contenido",1000,"La miniatura llega tarde","El video está listo pero no tenés portada.","Hacer una rápida","Publicás a tiempo, aunque el CTR puede ser menor.","Esperar la buena","Mejorás presentación, pero publicás tarde."],
            ["titulo_polemico","contenido",5000,"Tu editor propone un título bastante polémico","Podría aumentar el clic, pero también cambiar cómo te perciben.","Usarlo","Aumentás curiosidad, pero asumís riesgo de reputación.","Bajarlo","Cuidás la marca, aunque el video puede rendir menos."],
            ["comentario_famoso","comunidad",3000,"Un creador grande comenta tu video","Su comentario atrae miles de visitas al canal.","Responder rápido","Aprovechás el momento y abrís una relación.","Responder más tarde","Mantenés calma, pero perdés parte del impulso."],
            ["raid_medio","comunidad",5000,"Un streamer mediano te manda una raid enorme","La audiencia llega justo cuando estabas por terminar.","Extender stream","Convertís parte del público, pero sacrificás descanso.","Cerrar","Cuidás energía, pero perdés una oportunidad."],
            ["collab_cancelada","networking",3000,"Te cancelan una colaboración el mismo día","El otro creador tuvo un problema y te deja la tarde libre.","Improvisar contenido","Salvás el día y mostrás capacidad de adaptación.","Descansar","Recuperás energía, pero perdés producción."],
            ["collab_retrasada","networking",1000,"La colaboración empieza dos horas tarde","Tenés que decidir si esperar o reorganizar todo.","Esperar","Cuidás la relación y mantenés la colaboración.","Reprogramar","Cuidás tu tiempo, pero enfriás el momento."],
            ["creador_nuevo","networking",500,"Un creador chico te pide un consejo","Tiene una comunidad pequeña pero mucha constancia.","Ayudarlo","Fortalecés comunidad y podés ganar un futuro aliado.","No involucrarte","Cuidás tiempo, pero perdés una conexión potencial."],
            ["creador_viral","networking",15000,"Un creador que recién explotó te escribe","Está creciendo rápido y busca gente para colaborar.","Aceptar charla","Abrís una relación antes de que sea muy grande.","Esperar","Evitás comprometerte, pero podés llegar tarde."],
            ["manager_contacto","equipo",25000,"Un manager te consigue un contacto importante","La reunión puede abrir campañas grandes.","Aceptar","Aumentás networking, pero cedés tiempo.","Esperar mejor momento","Cuidás agenda, aunque el contacto puede enfriarse."],
            ["marca_chica_crece","sponsor",5000,"Una marca chica que te bancó empieza a crecer","Te ofrecen seguir trabajando juntos antes de hacerse grandes.","Mantener la relación","Construís una relación comercial de largo plazo.","Pedir más plata ahora","Maximizás ingreso inmediato, pero arriesgás la relación."],
            ["sponsor_no_paga","sponsor",5000,"Una marca se demora con el pago","La campaña ya terminó y todavía no cobraste.","Reclamar formalmente","Aumentás la presión para cobrar, pero tensás la relación.","Esperar","Mantenés buen vínculo, pero demorás el ingreso."],
            ["canje_no_llega","sponsor",1000,"El producto del canje nunca llega","La marca te había prometido enviarlo antes de publicar.","Esperar","Cuidás la relación, pero retrasás el contenido.","Cancelar","Protegés tu canal, aunque perdés el acuerdo."],
            ["codigo_descuento","sponsor",3000,"Tu código de descuento empieza a vender mucho","La marca te ofrece mejorar la comisión.","Aceptar nuevo acuerdo","Ganás más por venta, pero asumís más presión comercial.","Mantenerlo","Cuidás el equilibrio con tu comunidad."],
            ["comunidad_se_reune","comunidad",3000,"La comunidad arma un grupo para juntarse","Los seguidores empiezan a organizar encuentros por su cuenta.","Apoyarlo","Fortalecés comunidad, pero tenés que moderar mejor.","No involucrarte","Mantenés distancia, pero perdés parte del vínculo."],
            ["regalo_comunidad","comunidad",1000,"Un seguidor quiere regalarte algo caro","La intención es buena, pero el regalo puede generar una situación incómoda.","Agradecer y poner límites","Cuidás el vínculo sin generar dependencia.","Aceptar sin más","Ganás el regalo, pero complicás los límites con la comunidad."],
            ["fan_en_evento","comunidad",500,"Un seguidor te reconoce en un evento","Se acerca con buena onda y quiere una foto.","Pararte a hablar","Fortalecés comunidad, aunque perdés tiempo.","Seguir con la agenda","Cuidás horarios, pero la interacción queda fría."],
            ["foto_con_creador","networking",3000,"Te cruzás a un creador conocido en persona","La situación es casual y tenés pocos minutos para hablar.","Presentarte","Podés abrir una relación real.","No molestar","Respetás el momento, pero perdés la oportunidad."],
            ["evento_sin_pase","evento",3000,"Llegás a un evento y tu pase no aparece","La organización dice que tu nombre no figura en la lista.","Resolverlo con producción","Podés entrar, pero perdés tiempo.","Irte","Evitás el quilombo, pero perdés el evento."],
            ["hotel_viaje","evento",10000,"El alojamiento de una colaboración se complica","El viaje requiere quedarse una noche y el presupuesto cambió.","Pagar alojamiento","Salvás la colaboración, pero gastás bastante.","Volver el mismo día","Ahorrás, pero terminás agotado."],
            ["peaje_viaje","irl",3000,"El viaje termina costando mucho más de lo previsto","Entre nafta y peajes, la salida se fue de presupuesto.","Ir igual","Cumplís la colaboración, pero golpeás la caja.","Reprogramar","Ahorrás dinero, pero complicás el encuentro."],
            ["nafta_cara","dinero",5000,"El viaje para grabar se encarece","El costo de transporte te obliga a revisar el presupuesto.","Hacer el viaje","Mantenés el contenido, pero ganás menos.","Grabar cerca","Reducís costos, aunque cambiás la idea original."],
            ["caba_lluvia","irl",1000,"CABA queda imposible por la lluvia","La zona donde grababas se inunda de gente y tránsito.","Mover la locación","Salvás la grabación, pero perdés tiempo.","Grabar igual","Mantenés la idea, pero el resultado puede ser peor."],
            ["conurbano_corte","tecnico",1000,"Un corte de luz afecta la zona","La grabación nocturna queda en riesgo.","Usar batería","Mantenés contenido, pero la calidad baja.","Cancelar","Protegés la producción, aunque perdés una jornada."],
            ["mate_y_chat","comunidad",500,"El chat convierte la mateada en tradición","Cada stream termina con la misma charla y la comunidad empieza a esperarla.","Mantener la sección","Fortalecés identidad y comunidad.","Cambiarla","Buscás variedad, pero abandonás algo que funcionaba."],
            ["humor_arg","contenido",500,"Un chiste bien argentino funciona mejor de lo esperado","La comunidad conecta con una referencia muy local.","Seguir por ahí","Reforzás identidad, aunque podés encasillarte.","Volver a contenido general","Mantenés variedad, pero perdés parte de la conexión local."],
            ["barrio_apoya","comunidad",500,"El barrio empieza a compartir tu canal","Vecinos y comercios empiezan a recomendarte.","Agradecer y participar","Fortalecés raíces y comunidad local.","Mantener distancia","Protegés privacidad, pero perdés cercanía."],
            ["comercio_barrio","sponsor",1000,"Un comercio del barrio quiere apoyarte","Te ofrece una campaña chica para aparecer en el canal.","Aceptar","Construís una relación comercial local.","Rechazar","Mantenés solo marcas más grandes, pero perdés una oportunidad."],
            ["premio_local","evento",3000,"Te nominan a un premio local de creadores","La nominación te da visibilidad aunque no sea un premio grande.","Mover campaña","Aprovechás la atención del momento.","Seguir normal","No alterás tu calendario, pero perdés parte del impulso."],
            ["nota_radio","medios",5000,"Una radio argentina te quiere entrevistar","Es una nota corta sobre cómo empezaste a crear contenido.","Aceptar","Ganás exposición fuera de redes.","Rechazar","Cuidás tu tiempo, pero perdés una audiencia nueva."],
            ["stream_radio","medios",10000,"Una radio quiere hacer un segmento en vivo con vos","La propuesta mezcla entrevista y stream.","Aceptar","Llegás a una audiencia distinta y ganás networking.","Negociar formato","Intentás llevar la propuesta a tu terreno."],
            ["portal_local","medios",3000,"Un portal de tu ciudad quiere contar tu historia","La nota puede hacerte conocido fuera del circuito streamer.","Aceptar","Ganás presencia local y reputación.","No hacerlo","Cuidás privacidad, pero perdés exposición."],
            ["periodista_mala_leche","medios",15000,"Una entrevista viene con preguntas incómodas","El periodista quiere hablar de plata, polémicas y competencia.","Aceptar","Ganás exposición, pero asumís riesgo de mala interpretación.","Rechazar","Protegés tu imagen, pero perdés una aparición importante."],
            ["evento_universidad","medios",5000,"Una universidad te invita a hablar de creación de contenido","La charla es para estudiantes y no es una campaña paga.","Ir","Ganás reputación y contactos, pero perdés tiempo.","No ir","Cuidás agenda, aunque perdés una experiencia interesante."],
            ["charla_escuela","medios",1000,"Una escuela quiere que hables de internet y creación","La invitación es pequeña pero muy cercana.","Aceptar","Fortalecés reputación y comunidad.","Rechazar","Mantenés el calendario, pero perdés una buena experiencia."],
            ["regreso_casa","vida",500,"Volvés tarde de una grabación y estás destruido","Tenés otro stream temprano al día siguiente.","Dormir más","Recuperás energía, pero reducís preparación.","Mantener el plan","Llegás preparado, pero acumulás cansancio."],
            ["descanso_necesario","vida",500,"Tu equipo te dice que estás acelerando demasiado","Venís encadenando streams, videos y colaboraciones.","Tomar un día libre","Recuperás energía y prevenís desgaste.","Seguir","Mantenés ritmo, pero aumentás el riesgo de agotamiento."],
            ["burnout_arg","vida",5000,"Te levantaste sin ganas de prender cámara","No es una crisis: simplemente venís acumulando demasiadas semanas fuertes.","Descansar","Recuperás energía y cuidás la constancia a largo plazo.","Transmitir igual","Mantenés el calendario, pero el stream puede salir peor."]
        ];

        defs.push(...extras);

        return defs.map((d, i) => ({
            id: `ar_${d[0]}_${i+1}`,
            minSubs: d[2], negativo: false, category: d[1], pais: "Argentina", local: true,
            title: d[3], text: d[4],
            a: { label: d[5], desc: d[6], action: { networking: d[1] === "networking" ? 4 : 2, comunidad: d[1] === "comunidad" ? 3 : 0, fama: d[1] === "evento" || d[1] === "medios" ? 3 : 1, reputacion: -1, constancia: -1 }, cierre: { vistasPct: d[1] === "evento" || d[1] === "medios" ? 0.12 : 0.07, subsPct: 0.025 } },
            b: { label: d[7], desc: d[8], action: { reputacion: 2, constancia: 1, networking: -1 }, cierre: { vistasPct: 0.025, subsPct: 0.008 } }
        }));
    },

    // Rivalidades: competencia personal/deportiva con streamers de tamaño parecido.
    // No significa que exista una pelea real: es una mecánica ficticia de la simulación.
    generarEventoRivalidad(subs, fama) {
        const p=this.player;
        if(!p || subs < 5000) return null;
        p.rivalidades ||= {};
        const candidatos=(this.creators||[])
            .filter(c=>c.activo!==false && c.id!=="player" && String(c.pais||"Argentina")==="Argentina")
            .filter(c=>Number(c.seguidores||0)>=Math.max(5000,subs*0.35) && Number(c.seguidores||0)<=Math.max(10000,subs*2.8))
            .filter(c=>Number(c.seguidores||0)>=5000)
            .map(c=>({c, r:Number(p.rivalidades[c.id]||c.rivalidad||0)}))
            .filter(x=>x.r>0 || Math.random()<0.08);
        if(!candidatos.length || Math.random()>Math.min(0.16,0.035+fama/1200)) return null;
        const pick=candidatos[Math.floor(Math.random()*candidatos.length)].c;
        const current=Number(p.rivalidades[pick.id]||pick.rivalidad||0);
        const level=Math.max(10,current+Math.floor(Math.random()*12));
        p.rivalidades[pick.id]=Math.min(100,level);
        const n=pick.nombre;
        return {
            id:`rivalidad_${pick.id}_${this.time.año}_${this.time.trimestre}`, minSubs:5000, negativo:false, category:"rivalidad",
            creatorId:pick.id, creatorName:n,
            title:`⚡ ${n}: arrancó una rivalidad`,
            text:`Después de varias comparaciones entre sus comunidades, ${n} te nombró en un stream. No hubo una pelea real, pero ahora la gente quiere ver quién rinde mejor.`,
            a:{label:"Responder con contenido",desc:`Aceptás la competencia y armás contenido alrededor de ${n}. Podés crecer mucho, pero la rivalidad se intensifica.`,action:{fama:4,comunidad:3,reputacion:-2,networking:1,rivalidad:12},cierre:{vistasPct:0.16,subsPct:0.055}},
            b:{label:"Bajar el tono",desc:`No alimentás la pelea. Mantenés respeto y dejás que tu contenido hable por vos.`,action:{reputacion:4,comunidad:1,rivalidad:-8,networking:2},cierre:{vistasPct:0.05,subsPct:0.018}},
            c:{label:"Proponer un mano a mano",desc:`Convertís la rivalidad en un desafío directo. Si sale bien, los dos ganan exposición; si sale mal, quedás expuesto.`,requires:{atributo:"carisma",valor:35},action:{fama:7,comunidad:4,reputacion:-3,rivalidad:18},cierre:{vistasPct:0.24,subsPct:0.09,dineroPct:0.04}}
        };
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

        // Primero intentamos una rivalidad: son eventos poco frecuentes y
        // aparecen como una historia de carrera, no como un simple random.
        const rivalidad = this.generarEventoRivalidad(subs, fama);
        if (rivalidad) {
            this.pendingEvent = hacerEventoMasRealista(rivalidad, p);
            this.lastEventCategory = "rivalidad";
            this.guardar();
            return this.pendingEvent;
        }

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

        // La identidad argentina tiene prioridad: estos eventos aparecen mezclados
        // con los clásicos, pero son los que definen el tono local del simulador.
        eventos.push(...this.crearEventosArgentinos());

        // Cualquier creador del mundo puede convertirse en una interacción.
        // Los más grandes requieren más audiencia; los rookies pueden descubrirte antes.
        const dinamicos = (this.creators || [])
            .filter(c => c.activo !== false && c.id !== "player")
            .filter(c => String(c.pais || "Argentina").toLowerCase() === "argentina")
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
                    text: `${c.nombre} se cruzó con tu contenido y lo mencionó frente a su comunidad argentina. La atención puede ser enorme si aprovechás el momento.`,
                    a: { label: "Aprovechar la oportunidad", desc: `+${Math.round(baseSubs * 100)}% subs · +${Math.round(baseViews * 100)}% vistas`, action: { fama: Math.max(2, Math.round(8 * escala)), networking: 2 }, cierre: { subsPct: baseSubs, vistasPct: baseViews } },
                    b: { label: "Agradecer y seguir", desc: `+${Math.round(baseSubs * 55)}% subs · +${Math.round(baseViews * 45)}% vistas`, action: { reputacion: 2 }, cierre: { subsPct: baseSubs * 0.55, vistasPct: baseViews * 0.45 } }
                };
            });

        eventos.push(...dinamicos);

        // Los encuentros de grupos son una capa especial y poco frecuente.
        // Si ocurre uno, tiene prioridad sobre un evento genérico para que se sienta especial.
        const eventoGrupo = this.generarEventoGrupoEspecial(subs, fama, reputacion);
        if (eventoGrupo) {
            const eventoRealistaGrupo = hacerEventoMasRealista(JSON.parse(JSON.stringify(eventoGrupo)), p);
            this.pendingEvent = eventoRealistaGrupo;
            if (!p.awardsStats) p.awardsStats = { clips: 0, enojos: 0, reacciones: 0 };
            p.awardsStats.reacciones += 1;
            this.agregarNotificacion({
                tipo: "grupo",
                titulo: `🤝 ${eventoGrupo.groupName}: invitación especial`,
                descripcion: "Una invitación poco frecuente está esperando antes de cerrar el trimestre."
            });
            this.guardar();
            return this.pendingEvent;
        }

        const validos = eventos.filter(e => subs >= e.minSubs && (e.local === true || e.creatorId || e.category === "grupo"));
        if (!validos.length) return null;

        // A mayor tamaño del canal, más variedad de interacciones. Los problemas
        // son frecuentes pero no dominan la partida.
        const negativos = validos.filter(e => e.negativo);
        const positivos = validos.filter(e => !e.negativo);
        const elegirMalo = negativos.length > 0 && Math.random() < (subs >= 100000 ? 0.42 : 0.35);
        const pool = elegirMalo ? negativos : positivos.length ? positivos : negativos;
        const locales = pool.filter(e => e.local === true || e.pais === "Argentina");
        const evento = locales.length && Math.random() < 0.72
            ? locales[Math.floor(Math.random() * locales.length)]
            : pool[Math.floor(Math.random() * pool.length)];

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
        if (!p.colabsPorTrimestre || typeof p.colabsPorTrimestre !== "object") p.colabsPorTrimestre = {};
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
            } else if (key === "rivalidad") {
                p.rivalidades ||= {};
                if (evento.creatorId) {
                    const actual = Number(p.rivalidades[evento.creatorId] || 0);
                    p.rivalidades[evento.creatorId] = Math.max(0, Math.min(100, actual + amount));
                    const creator = this.creators.find(c => c.id === evento.creatorId);
                    if (creator) creator.rivalidad = p.rivalidades[evento.creatorId];
                }
            } else if (typeof p.atributos?.[key] === "number") {
                p.atributos[key] += amount;
            }
        }

        if (evento.creatorId) {
            const creator = this.creators.find(c => c.id === evento.creatorId);
            if (creator) {
                const actual = Number(this.player.relationships?.[creator.id] || 0);
                const rivalDelta = evento.category === "rivalidad" ? (opcion === "b" ? 4 : -2) : (opcion === "a" ? 12 : 5);
                this.player.relationships[creator.id] = Math.max(-100, Math.min(100, actual + rivalDelta));
                if (evento.category === "rivalidad") {
                    this.player.rivalidades ||= {};
                    this.player.rivalidades[creator.id] = Math.max(0, Math.min(100, Number(this.player.rivalidades[creator.id] || creator.rivalidad || 0)));
                    creator.rivalidad = this.player.rivalidades[creator.id];
                }
                creator.colaboraciones = (Number(creator.colaboraciones) || 0) + (opcion === "a" && evento.category !== "rivalidad" ? 1 : 0);
            }
        }

        if (evento.groupId && Array.isArray(evento.creatorIds)) {
            const delta = opcion === "a" ? 10 : 2;
            for (const id of evento.creatorIds) {
                const creator = this.creators.find(c => c.id === id);
                if (!creator) continue;
                const actual = Number(this.player.relationships?.[creator.id] || 0);
                this.player.relationships[creator.id] = Math.max(-100, Math.min(100, actual + delta));
                if (opcion === "a") creator.colaboraciones = (Number(creator.colaboraciones) || 0) + 1;
            }
            this.player.lastGroupInteraction = {
                groupId: evento.groupId,
                groupName: evento.groupName,
                creatorIds: [...evento.creatorIds],
                accepted: opcion === "a",
                año: Number(this.time?.año || 2026),
                trimestre: Number(this.time?.trimestre || 1)
            };
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
        if (colabsRealizadasEsteTrimestre(this) >= 2) return null;

        const subs = Number(p.suscriptores) || 0;
        const networking = Number(p.atributos?.networking) || 0;
        const fama = Number(p.fama) || 0;
        const niche = p.niche;

        const candidatos = (this.creators || [])
            .filter(c => c.activo !== false && c.id !== "player")
            .filter(c => String(c.pais || "Argentina").toLowerCase() === "argentina")
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

    colabsRestantesEsteTrimestre() {
        return Math.max(0, 2 - colabsRealizadasEsteTrimestre(this));
    },

    puedeColaborarEsteTrimestre() {
        return colabsRealizadasEsteTrimestre(this) < 2;
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
        if (colabsRealizadasEsteTrimestre(this) >= 2) return "limite_trimestre";
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
        if (colabsRealizadasEsteTrimestre(this) >= 2) {
            this.agregarNotificacion({ tipo: "collab", titulo: "📅 Límite de colaboraciones alcanzado", descripcion: "Ya realizaste 2 colaboraciones este trimestre. La próxima oportunidad queda para el siguiente trimestre." });
            this.guardar();
            return false;
        }
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
        const quarterKey = claveTrimestre(this.time);
        this.player.colabsPorTrimestre[quarterKey] = colabsRealizadasEsteTrimestre(this) + 1;
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
            { id:"campaign_ineo", name:"iNeo Cases", logo:"assets/sponsors/ineo_cases.svg", minSubs:3000, cpmMin:3.5, cpmMax:7, target:0.8, max:3500, duration:1, deliverables:1 },
            { id:"campaign_manaos", name:"Manaos", logo:"assets/sponsors/manaos.svg", minSubs:5000, cpmMin:4, cpmMax:8, target:0.9, max:5000, duration:1, deliverables:1 },
            { id:"campaign_kingokongo", name:"King of the Kongo", logo:"assets/sponsors/king_of_kongo.svg", minSubs:8000, cpmMin:4.5, cpmMax:9, target:0.95, max:7000, duration:1, deliverables:2 },
            { id:"campaign_mostaza", name:"Mostaza", logo:"assets/sponsors/mostaza.svg", minSubs:10000, cpmMin:4.5, cpmMax:8.5, target:1.0, max:9000, duration:1, deliverables:2 },
            { id:"campaign_grido", name:"Grido", logo:"assets/sponsors/grido.svg", minSubs:15000, cpmMin:5, cpmMax:9, target:1.0, max:11000, duration:1, deliverables:2 },
            { id:"campaign_fravega", name:"Frávega", logo:"assets/sponsors/fravega.svg", minSubs:25000, cpmMin:5.5, cpmMax:10, target:1.05, max:16000, duration:1, deliverables:2 },
            { id:"campaign_uala", name:"Ualá", logo:"assets/sponsors/uala.svg", minSubs:40000, cpmMin:6, cpmMax:11, target:1.1, max:24000, duration:2, deliverables:3 },
            { id:"campaign_personal", name:"Personal", logo:"assets/sponsors/personal.svg", minSubs:60000, cpmMin:6.5, cpmMax:12, target:1.1, max:30000, duration:2, deliverables:3 },
            { id:"campaign_mercadolibre", name:"Mercado Libre", logo:"assets/sponsors/mercadolibre.svg", minSubs:100000, cpmMin:7, cpmMax:13, target:1.15, max:45000, duration:2, deliverables:3 },
            { id:"campaign_ypf", name:"YPF", logo:"assets/sponsors/ypf.svg", minSubs:200000, cpmMin:8, cpmMax:15, target:1.2, max:65000, duration:2, deliverables:4 },
            { id:"campaign_arcor", name:"Arcor", logo:"assets/sponsors/arcor.svg", minSubs:300000, cpmMin:8, cpmMax:16, target:1.25, max:85000, duration:2, deliverables:4 },
            { id:"campaign_galicia", name:"Banco Galicia", logo:"assets/sponsors/galicia.svg", minSubs:500000, cpmMin:9, cpmMax:18, target:1.3, max:120000, duration:2, deliverables:4 }
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
            { id: "king_of_kongo", name: "King of the Kongo", minSubs: 3000, minFama: 2, payMin: 900, payMax: 2600, duration: 1, prestige: 3, tipo: "indumentaria", logo: "assets/sponsors/king_of_kongo.svg" },
            { id: "manaos", name: "Manaos", minSubs: 5000, minFama: 3, payMin: 1200, payMax: 3500, duration: 1, prestige: 3, tipo: "bebidas", logo: "assets/sponsors/manaos.svg" },
            { id: "ineo_cases", name: "iNeo Cases", minSubs: 500, minFama: 0, payMin: 250, payMax: 900, duration: 1, prestige: 2, tipo: "accesorios", logo: "assets/sponsors/ineo_cases.svg" },
            { id: "mercadolibre", name: "Mercado Libre", minSubs: 50000, minFama: 10, payMin: 3500, payMax: 10000, duration: 2, prestige: 6, tipo: "ecommerce", logo: "assets/sponsors/mercadolibre.svg" },
            { id: "uala", name: "Ualá", minSubs: 25000, minFama: 7, payMin: 2200, payMax: 6500, duration: 2, prestige: 5, tipo: "fintech", logo: "assets/sponsors/uala.svg" },
            { id: "naranja_x", name: "Naranja X", minSubs: 15000, minFama: 5, payMin: 1600, payMax: 5000, duration: 1, prestige: 4, tipo: "fintech", logo: "assets/sponsors/naranja_x.svg" },
            { id: "galicia", name: "Banco Galicia", minSubs: 75000, minFama: 14, payMin: 5000, payMax: 14000, duration: 2, prestige: 7, tipo: "finanzas", logo: "assets/sponsors/galicia.svg" },
            { id: "personal", name: "Personal", minSubs: 50000, minFama: 10, payMin: 3500, payMax: 10000, duration: 2, prestige: 6, tipo: "telecom", logo: "assets/sponsors/personal.svg" },
            { id: "flow", name: "Flow", minSubs: 40000, minFama: 9, payMin: 3000, payMax: 8500, duration: 2, prestige: 6, tipo: "entretenimiento", logo: "assets/sponsors/flow.svg" },
            { id: "ypf", name: "YPF", minSubs: 100000, minFama: 18, payMin: 7000, payMax: 18000, duration: 2, prestige: 8, tipo: "automotriz", logo: "assets/sponsors/ypf.svg" },
            { id: "quilmes", name: "Quilmes", minSubs: 75000, minFama: 15, payMin: 6000, payMax: 16000, duration: 2, prestige: 7, tipo: "bebidas", logo: "assets/sponsors/quilmes.svg" },
            { id: "topper", name: "Topper", minSubs: 20000, minFama: 6, payMin: 1800, payMax: 5500, duration: 1, prestige: 5, tipo: "indumentaria", logo: "assets/sponsors/topper.svg" },
            { id: "mostaza", name: "Mostaza", minSubs: 10000, minFama: 4, payMin: 1000, payMax: 3500, duration: 1, prestige: 4, tipo: "comida", logo: "assets/sponsors/mostaza.svg" },
            { id: "grido", name: "Grido", minSubs: 8000, minFama: 3, payMin: 800, payMax: 2800, duration: 1, prestige: 3, tipo: "comida", logo: "assets/sponsors/grido.svg" },
            { id: "havanna", name: "Havanna", minSubs: 12000, minFama: 5, payMin: 1200, payMax: 4000, duration: 1, prestige: 4, tipo: "comida", logo: "assets/sponsors/havanna.svg" },
            { id: "cachafaz", name: "Cachafaz", minSubs: 10000, minFama: 4, payMin: 1000, payMax: 3200, duration: 1, prestige: 4, tipo: "comida", logo: "assets/sponsors/cachafaz.svg" },
            { id: "arcor", name: "Arcor", minSubs: 100000, minFama: 18, payMin: 6500, payMax: 17000, duration: 2, prestige: 8, tipo: "alimentos", logo: "assets/sponsors/arcor.svg" },
            { id: "la_serenisima", name: "La Serenísima", minSubs: 60000, minFama: 12, payMin: 4500, payMax: 12000, duration: 2, prestige: 6, tipo: "alimentos", logo: "assets/sponsors/la_serenisima.svg" },
            { id: "guaymallen", name: "Guaymallén", minSubs: 8000, minFama: 3, payMin: 700, payMax: 2500, duration: 1, prestige: 3, tipo: "alimentos", logo: "assets/sponsors/guaymallen.svg" },
            { id: "fravega", name: "Frávega", minSubs: 20000, minFama: 6, payMin: 1800, payMax: 6000, duration: 1, prestige: 5, tipo: "tecnologia", logo: "assets/sponsors/fravega.svg" },
            { id: "musimundo", name: "Musimundo", minSubs: 15000, minFama: 5, payMin: 1400, payMax: 4500, duration: 1, prestige: 4, tipo: "tecnologia", logo: "assets/sponsors/musimundo.svg" },
            { id: "noblex", name: "Noblex", minSubs: 30000, minFama: 8, payMin: 2200, payMax: 6500, duration: 2, prestige: 5, tipo: "tecnologia", logo: "assets/sponsors/noblex.svg" },
            { id: "exos", name: "EXO", minSubs: 15000, minFama: 5, payMin: 1400, payMax: 4500, duration: 1, prestige: 4, tipo: "tecnologia", logo: "assets/sponsors/exos.svg" },
            { id: "bangho", name: "Banghó", minSubs: 12000, minFama: 4, payMin: 1200, payMax: 4000, duration: 1, prestige: 4, tipo: "tecnologia", logo: "assets/sponsors/bangho.svg" },
            { id: "pcbox", name: "PCBOX", minSubs: 5000, minFama: 2, payMin: 500, payMax: 1800, duration: 1, prestige: 2, tipo: "tecnologia", logo: "assets/sponsors/pcbox.svg" },
            { id: "dexter", name: "Dexter", minSubs: 20000, minFama: 6, payMin: 1800, payMax: 5500, duration: 1, prestige: 5, tipo: "deportes", logo: "assets/sponsors/dexter.svg" },
            { id: "tyc_sports", name: "TyC Sports", minSubs: 75000, minFama: 14, payMin: 4500, payMax: 12000, duration: 2, prestige: 7, tipo: "deportes", logo: "assets/sponsors/tyc_sports.svg" },
            { id: "andreani", name: "Andreani", minSubs: 30000, minFama: 7, payMin: 2000, payMax: 6000, duration: 1, prestige: 5, tipo: "logistica", logo: "assets/sponsors/andreani.svg" },
            { id: "havanna_cafe", name: "Havanna Café", minSubs: 12000, minFama: 4, payMin: 1000, payMax: 3200, duration: 1, prestige: 4, tipo: "comida", logo: "assets/sponsors/havanna_cafe.svg" },
            { id: "pindapoy", name: "Pindapoy", minSubs: 5000, minFama: 2, payMin: 500, payMax: 1800, duration: 1, prestige: 2, tipo: "bebidas", logo: "assets/sponsors/pindapoy.svg" },
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
        if (this.player.velada) {
            this.player.velada.offerYear = null;
            this.player.velada.offerStatus = "none";
            this.player.velada.offerRerolls = 0;
            this.player.velada.acceptedYear = null;
            this.player.velada.rival = null;
            this.player.velada.training = 0;
            this.player.velada.trainingByQuarter = {};
            this.player.velada.completedQuarter = {};
            this.player.velada.fightCompletedYear = null;
        }
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
    if (!p.rivalidades || typeof p.rivalidades !== "object") p.rivalidades = {};
    if (!Array.isArray(p.historialAños)) p.historialAños = [];
    if (!("pretemporada" in p)) p.pretemporada = null;
    if (!p.velada || typeof p.velada !== "object") p.velada = { tier:0, training:0, rival:null, eligible:false, wins:0, losses:0, offerYear:null, offerStatus:"none", offerRerolls:0, acceptedYear:null, trainingByQuarter:{}, completedQuarter:{}, fightCompletedYear:null };
    p.velada.trainingByQuarter ||= {};
    p.velada.completedQuarter ||= {};
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
