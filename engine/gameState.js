// engine/gameState.js

import { creatorsIniciales } from "../data/creators.js";

// ============================================================
// ATRIBUTOS
// ============================================================

function crearAtributos() {

    return {

        edicion: 10,
        carisma: 15,
        algoritmo: 10,
        marketing: 5,
        constancia: 15,
        humor: 5,
        creatividad: 5

    };

}


// ============================================================
// STATS
// ============================================================

function crearStats() {

    return {

        mejorVideo: 0,
        videosVirales: 0,
        videosPublicados: 0,
        colaboraciones: 0,
        sponsors: 0,
        eventosGanados: 0

    };

}


// ============================================================
// PLAYER
// ============================================================

function crearPlayer() {

    return {

        nombre: "Creador",
        canal: "Mi Canal",
        niche: "Gaming",

        año: 2026,
        trimestre: 1,

        dinero: 500,

        suscriptores: 0,
        vistasTotales: 0,
        videosSubidos: 0,
        fama: 0,

        comunidad: 50,

        ingresosTrimestre: 0,

        atributos: crearAtributos(),

        equipment: {

            pc: "government_pc",
            camera: "old_phone",
            microphone: "earphones"

        },

        stats: crearStats(),

        relationships: {}

    };

}


// ============================================================
// GAME STATE
// ============================================================

export const gameState = {

    player: crearPlayer(),


    time: {

        año: 2026,
        trimestre: 1

    },


    inventory: [],

    notifications: [],


    creators: creatorsIniciales.map(
        creator => ({ ...creator })
    ),


    trends: [],

    sponsors: [],


    lastVideo: null,

    lastVideoResult: null,

    ultimoEventoResultado: null,

    lastCollab: null,


    adminMode: false,


    // ========================================================
    // INICIAR PARTIDA
    // ========================================================

    iniciarPartida(datos = {}) {

        // ----------------------------------------
        // Asegurar jugador
        // ----------------------------------------

        if (!this.player) {

            this.player = crearPlayer();

        }


        // ----------------------------------------
        // Datos del creador
        // ----------------------------------------

        if (
            typeof datos.nombre === "string" &&
            datos.nombre.trim() !== ""
        ) {

            this.player.nombre =
                datos.nombre.trim();

        }


        if (
            typeof datos.canal === "string" &&
            datos.canal.trim() !== ""
        ) {

            this.player.canal =
                datos.canal.trim();

        }


        if (
            typeof datos.niche === "string" &&
            datos.niche.trim() !== ""
        ) {

            this.player.niche =
                datos.niche;

        }


        // ----------------------------------------
        // Fecha inicial
        // ----------------------------------------

        this.time = {

            año: 2026,
            trimestre: 1

        };


        this.player.año = 2026;

        this.player.trimestre = 1;


        // ----------------------------------------
        // Economía y métricas
        // ----------------------------------------

        this.player.dinero = 500;

        this.player.suscriptores = 0;

        this.player.vistasTotales = 0;

        this.player.videosSubidos = 0;

        this.player.fama = 0;

        this.player.comunidad = 50;

        this.player.ingresosTrimestre = 0;


        // ----------------------------------------
        // Atributos
        // ----------------------------------------

        this.player.atributos =
            crearAtributos();


        // ----------------------------------------
        // Equipo inicial
        // ----------------------------------------

        this.player.equipment = {

            pc: "government_pc",
            camera: "old_phone",
            microphone: "earphones"

        };


        // ----------------------------------------
        // Estadísticas
        // ----------------------------------------

        this.player.stats =
            crearStats();


        // ----------------------------------------
        // Relaciones
        // ----------------------------------------

        this.player.relationships = {};


        // ----------------------------------------
        // Limpiar estado anterior
        // ----------------------------------------

        this.inventory = [];

        this.notifications = [];

        this.trends = [];

        this.sponsors = [];

        this.lastVideo = null;

        this.lastVideoResult = null;

        this.ultimoEventoResultado = null;

        this.lastCollab = null;


        // ----------------------------------------
        // Restaurar creadores
        // ----------------------------------------

        this.creators =
            creatorsIniciales.map(
                creator => ({ ...creator })
            );


        // ----------------------------------------
        // Notificación inicial
        // ----------------------------------------

        this.agregarNotificacion({

            tipo: "sistema",

            titulo: "🎬 ¡Comienza tu carrera!",

            descripcion:
                `Bienvenido ${this.player.nombre}. Tu canal ${this.player.canal} está listo para comenzar.`

        });


        return this.player;

    },


    // ========================================================
    // MEJORAR ATRIBUTO
    // ========================================================

    mejorarAtributo(atributo, cantidad) {

        if (!this.player.atributos) {

            this.player.atributos =
                crearAtributos();

        }


        if (
            typeof this.player.atributos[atributo]
            !== "number"
        ) {

            this.player.atributos[atributo] = 0;

        }


        this.player.atributos[atributo] +=
            Number(cantidad) || 0;

    },


    // ========================================================
    // NOTIFICACIONES
    // ========================================================

    agregarNotificacion(data) {

        const notificacion = {

            id:

                typeof crypto !== "undefined" &&
                crypto.randomUUID

                    ? crypto.randomUUID()

                    : `notification_${Date.now()}`,

            tipo:
                data.tipo || "general",

            titulo:
                data.titulo ||
                "Nueva notificación",

            descripcion:
                data.descripcion || "",

            leida: false,

            fecha: Date.now(),

            ...data

        };


        this.notifications.unshift(
            notificacion
        );


        // Máximo 50

        if (
            this.notifications.length > 50
        ) {

            this.notifications =
                this.notifications.slice(0, 50);

        }


        return notificacion;

    },


    // ========================================================
    // MARCAR NOTIFICACIÓN
    // ========================================================

    marcarNotificacionLeida(id) {

        const notificacion =
            this.notifications.find(
                n => n.id === id
            );


        if (notificacion) {

            notificacion.leida = true;

        }

    },


    // ========================================================
    // NOTIFICACIONES NO LEÍDAS
    // ========================================================

    notificacionesNoLeidas() {

        return this.notifications.filter(
            n => !n.leida
        ).length;

    },


    // ========================================================
    // RESET
    // ========================================================

    resetPlayer() {

        this.player =
            crearPlayer();


        this.time = {

            año: 2026,
            trimestre: 1

        };


        this.inventory = [];

        this.notifications = [];

        this.trends = [];

        this.sponsors = [];


        this.lastVideo = null;

        this.lastVideoResult = null;

        this.ultimoEventoResultado = null;

        this.lastCollab = null;


        this.creators =
            creatorsIniciales.map(
                creator => ({ ...creator })
            );

    }

};


// ============================================================
// NORMALIZAR GAME STATE
// ============================================================

export function normalizarGameState() {

    const p =
        gameState.player;


    // ========================================================
    // PLAYER
    // ========================================================

    if (!p) {

        gameState.player =
            crearPlayer();

        return;

    }


    // ========================================================
    // ATRIBUTOS
    // ========================================================

    if (!p.atributos) {

        p.atributos =
            crearAtributos();

    }


    const atributosDefault =
        crearAtributos();


    Object.keys(
        atributosDefault
    ).forEach(key => {

        if (
            typeof p.atributos[key]
            !== "number"
        ) {

            p.atributos[key] =
                atributosDefault[key];

        }

    });


    // ========================================================
    // STATS
    // ========================================================

    if (!p.stats) {

        p.stats =
            crearStats();

    }


    const statsDefault =
        crearStats();


    Object.keys(
        statsDefault
    ).forEach(key => {

        if (
            typeof p.stats[key]
            !== "number"
        ) {

            p.stats[key] =
                statsDefault[key];

        }

    });


    // ========================================================
    // EQUIPMENT
    // ========================================================

    if (!p.equipment) {

        p.equipment = {

            pc: "government_pc",
            camera: "old_phone",
            microphone: "earphones"

        };

    }


    // ========================================================
    // RELATIONSHIPS
    // ========================================================

    if (!p.relationships) {

        p.relationships = {};

    }


    // ========================================================
    // DATOS BÁSICOS
    // ========================================================

    if (
        typeof p.nombre !== "string"
    ) {

        p.nombre = "Creador";

    }


    if (
        typeof p.canal !== "string"
    ) {

        p.canal = "Mi Canal";

    }


    if (
        typeof p.niche !== "string"
    ) {

        p.niche = "Gaming";

    }


    if (
        typeof p.año !== "number"
    ) {

        p.año = 2026;

    }


    if (
        typeof p.trimestre !== "number"
    ) {

        p.trimestre = 1;

    }


    // ========================================================
    // ARRAYS
    // ========================================================

    if (
        !Array.isArray(gameState.inventory)
    ) {

        gameState.inventory = [];

    }


    if (
        !Array.isArray(gameState.notifications)
    ) {

        gameState.notifications = [];

    }


    if (
        !Array.isArray(gameState.creators)
    ) {

        gameState.creators =
            creatorsIniciales.map(
                creator => ({ ...creator })
            );

    }


    if (
        !Array.isArray(gameState.trends)
    ) {

        gameState.trends = [];

    }


    if (
        !Array.isArray(gameState.sponsors)
    ) {

        gameState.sponsors = [];

    }


    // ========================================================
    // TIME
    // ========================================================

    if (!gameState.time) {

        gameState.time = {

            año: p.año || 2026,
            trimestre: p.trimestre || 1

        };

    }


    if (
        typeof gameState.time.año
        !== "number"
    ) {

        gameState.time.año = 2026;

    }


    if (
        typeof gameState.time.trimestre
        !== "number"
    ) {

        gameState.time.trimestre = 1;

    }

}
