// engine/gameState.js
// Estado central de "El Creador".
// Regla de tiempo: 2 trimestres = 1 año.

import { creatorsIniciales } from "../data/creators.js";

const SAVE_KEY = "elCreador_saveData";
const TRIMESTRES_POR_AÑO = 2;

function crearId(prefix = "id") {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
        videosSimulados: 0,
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

        dinero: 500,
        suscriptores: 50,
        vistasTotales: 0,
        videosSubidos: 0,
        fama: 0,
        comunidad: 50,
        reputacion: 50,
        ingresosTrimestre: 0,

        atributos: crearAtributos(),

        equipment: {
            pc: "government_pc",
            camera: "old_phone",
            microphone: "earphones"
        },

        stats: crearStats(),
        relationships: {},
        pretemporada: null,
        shopTier: 1,
        inventory: [],

        // Control de acciones del trimestre.
        videoSubidoEsteTrimestre: false,

        // Datos de simulación del año.
        simulacionAnual: {
            videosPlataforma: 0,
            año: 2026
        }
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

export const gameState = {
    player: crearPlayer(),

    time: {
        año: 2026,
        trimestre: 1
    },

    inventory: [],
    notifications: [],
    creators: crearCreadores(),
    trends: [],
    sponsors: [],

    lastVideo: null,
    lastVideoResult: null,
    ultimoEventoResultado: null,
    lastCollab: null,

    // Resultado de la simulación del año que acaba de terminar.
    ultimaSimulacionAnual: null,

    adminMode: false,

	iniciarPartida(datos = {}) {

		this.player = crearPlayer();

		this.player.partidaIniciada = true;

		this.player.nombre =
			String(datos.nombre || "Creador").trim() || "Creador";

		this.player.canal =
			String(datos.canal || "Mi Canal").trim() || "Mi Canal";

		this.player.niche =
			datos.niche || "Gaming";

		this.time = {
			año: 2026,
			trimestre: 1
		};

		this.player.año = 2026;
		this.player.trimestre = 1;

		this.inventory = [];
		this.notifications = [];
		this.trends = [];
		this.sponsors = [];

		this.lastVideo = null;
		this.lastVideoResult = null;
		this.ultimoEventoResultado = null;
		this.lastCollab = null;
		this.ultimaSimulacionAnual = null;

		this.creators = crearCreadores();

		this.creators.forEach(creator => {
			this.player.relationships[creator.id] = 0;
		});

		this.agregarNotificacion({
			tipo: "sistema",
			titulo: "🎬 Carrera iniciada",
			descripcion:
				`Bienvenido, ${this.player.nombre}. Tu canal "${this.player.canal}" empieza con 50 suscriptores.`
		});

		this.guardar();

		return this.player;
	},

    mejorarAtributo(atributo, cantidad) {
        if (!this.player.atributos) {
            this.player.atributos = crearAtributos();
        }

        if (typeof this.player.atributos[atributo] !== "number") {
            this.player.atributos[atributo] = 0;
        }

        this.player.atributos[atributo] += Number(cantidad) || 0;
        this.player.atributos[atributo] = Math.max(0, this.player.atributos[atributo]);

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
        const notificacion = this.notifications.find(n => n.id === id);
        if (notificacion) notificacion.leida = true;
    },

    notificacionesNoLeidas() {
        return this.notifications.filter(n => !n.leida).length;
    },

    // El jugador puede publicar exactamente 1 video por trimestre.
    puedeSubirVideo() {
        return !this.player.videoSubidoEsteTrimestre;
    },

    registrarVideoPublicado() {
        // videoSystem.js ya actualiza videosSubidos y videosPublicados.
        // Acá solamente bloqueamos una segunda publicación en el mismo trimestre.
        this.player.videoSubidoEsteTrimestre = true;
    },

    // Simula el resto de la actividad de la plataforma al cerrar el año.
    // El jugador NO recibe esos videos como propios: son actividad del mundo.
    simularActividadAnual() {
        const añoTerminado = this.time.año;
        const cantidad = random(30, 150);

        this.ultimaSimulacionAnual = {
            año: añoTerminado,
            videosPlataforma: cantidad,
            fecha: Date.now()
        };

        if (!this.player.stats) this.player.stats = crearStats();
        this.player.stats.videosSimulados =
            (Number(this.player.stats.videosSimulados) || 0) + cantidad;
        this.player.stats.añosJugados =
            (Number(this.player.stats.añosJugados) || 0) + 1;

        this.player.simulacionAnual = {
            año: añoTerminado,
            videosPlataforma: cantidad
        };

        this.agregarNotificacion({
            tipo: "simulacion",
            titulo: `📊 Año ${añoTerminado} simulado`,
            descripcion: `Durante el año se publicaron ${cantidad} videos en la plataforma.`
        });

        return this.ultimaSimulacionAnual;
    },

    // Q1 -> Q2. Q2 -> nuevo año Q1.
    nextQuarter() {
        if (this.time.trimestre >= TRIMESTRES_POR_AÑO) {
            this.time.trimestre = 1;
            this.time.año += 1;

            this.player.pretemporada = null;
            this.player.videoSubidoEsteTrimestre = false;
            this.player.ingresosTrimestre = 0;
        } else {
            this.time.trimestre += 1;
            this.player.videoSubidoEsteTrimestre = false;
            this.player.ingresosTrimestre = 0;
        }

        this.player.año = this.time.año;
        this.player.trimestre = this.time.trimestre;

        return this.time;
    },

    // Se llama al terminar el segundo trimestre, antes de avanzar al nuevo año.
    finalizarAño() {
        if (this.time.trimestre !== TRIMESTRES_POR_AÑO) {
            return null;
        }

        if (!this.ultimaSimulacionAnual || this.ultimaSimulacionAnual.año !== this.time.año) {
            this.simularActividadAnual();
        }

        this.agregarNotificacion({
            tipo: "sistema",
            titulo: `🏆 Terminó el año ${this.time.año}`,
            descripcion: `La temporada terminó después de ${TRIMESTRES_POR_AÑO} trimestres. Es hora de los Awards.`
        });

        this.guardar();
        return this.ultimaSimulacionAnual;
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
                lastVideo: this.lastVideo,
                lastVideoResult: this.lastVideoResult,
                ultimoEventoResultado: this.ultimoEventoResultado,
                lastCollab: this.lastCollab,
                ultimaSimulacionAnual: this.ultimaSimulacionAnual,
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
            if (data.player) this.player = data.player;
            if (data.time) this.time = data.time;
            if (Array.isArray(data.inventory)) this.inventory = data.inventory;
            if (Array.isArray(data.notifications)) this.notifications = data.notifications;
            if (Array.isArray(data.creators)) this.creators = data.creators;
            if (Array.isArray(data.trends)) this.trends = data.trends;
            if (Array.isArray(data.sponsors)) this.sponsors = data.sponsors;

            this.lastVideo = data.lastVideo || null;
            this.lastVideoResult = data.lastVideoResult || null;
            this.ultimoEventoResultado = data.ultimoEventoResultado || null;
            this.lastCollab = data.lastCollab || null;
            this.ultimaSimulacionAnual = data.ultimaSimulacionAnual || null;

            normalizarGameState();
            return true;
        } catch (error) {
            console.error("❌ Error cargando partida:", error);
            return false;
        }
    },

resetPlayer() {

    this.player = crearPlayer();

    this.time = {
        año: 2026,
        trimestre: 1
    };

    this.inventory = [];
    this.notifications = [];
    this.trends = [];
    this.sponsors = [];

    this.creators = crearCreadores();

    this.lastVideo = null;
    this.lastVideoResult = null;
    this.ultimoEventoResultado = null;
    this.lastCollab = null;
    this.ultimaSimulacionAnual = null;

    try {
        localStorage.removeItem(SAVE_KEY);

        // Por compatibilidad con versiones anteriores
        localStorage.removeItem("elCreador_save");
        localStorage.removeItem("gameState");
        localStorage.removeItem("elcreador_save");
        localStorage.removeItem("ElCreadorSave");

    } catch (error) {
        console.error(
            "❌ Error eliminando partida:",
            error
        );
    }

    window.location.hash = "#createChannel";
},

export function normalizarGameState() {
    if (!gameState.player) gameState.player = crearPlayer();

    const p = gameState.player;

    if (typeof p.nombre !== "string") p.nombre = "Creador";
    if (typeof p.canal !== "string") p.canal = "Mi Canal";
    if (typeof p.niche !== "string") p.niche = "Gaming";
    if (typeof p.año !== "number") p.año = 2026;
    if (typeof p.trimestre !== "number" || p.trimestre < 1 || p.trimestre > 2) p.trimestre = 1;
    if (typeof p.dinero !== "number") p.dinero = 500;
    if (typeof p.suscriptores !== "number") p.suscriptores = 50;
    if (typeof p.vistasTotales !== "number") p.vistasTotales = 0;
    if (typeof p.videosSubidos !== "number") p.videosSubidos = 0;
    if (typeof p.fama !== "number") p.fama = 0;
    if (typeof p.comunidad !== "number") p.comunidad = 50;
    if (typeof p.reputacion !== "number") p.reputacion = 50;
    if (typeof p.ingresosTrimestre !== "number") p.ingresosTrimestre = 0;
    if (typeof p.videoSubidoEsteTrimestre !== "boolean") p.videoSubidoEsteTrimestre = false;

    if (!p.atributos) p.atributos = crearAtributos();
    const atributosDefault = crearAtributos();
    for (const key of Object.keys(atributosDefault)) {
        if (typeof p.atributos[key] !== "number") p.atributos[key] = atributosDefault[key];
    }

    if (!p.stats) p.stats = crearStats();
    const statsDefault = crearStats();
    for (const key of Object.keys(statsDefault)) {
        if (typeof p.stats[key] !== "number") p.stats[key] = statsDefault[key];
    }

    if (!p.equipment) {
        p.equipment = { pc: "government_pc", camera: "old_phone", microphone: "earphones" };
    }
    if (!p.relationships) p.relationships = {};
    if (!("pretemporada" in p)) p.pretemporada = null;
    if (!p.simulacionAnual) p.simulacionAnual = { año: p.año, videosPlataforma: 0 };

    if (!gameState.time) gameState.time = { año: p.año, trimestre: p.trimestre };
    if (typeof gameState.time.año !== "number") gameState.time.año = p.año;
    if (typeof gameState.time.trimestre !== "number" || gameState.time.trimestre < 1 || gameState.time.trimestre > 2) {
        gameState.time.trimestre = p.trimestre;
    }

    p.año = gameState.time.año;
    p.trimestre = gameState.time.trimestre;

    if (!Array.isArray(gameState.inventory)) gameState.inventory = [];
    if (!Array.isArray(gameState.notifications)) gameState.notifications = [];
    if (!Array.isArray(gameState.creators)) gameState.creators = crearCreadores();
    if (!Array.isArray(gameState.trends)) gameState.trends = [];
    if (!Array.isArray(gameState.sponsors)) gameState.sponsors = [];

    return gameState;
}

normalizarGameState();
