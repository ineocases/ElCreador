// engine/gameState.js

import { creatorsIniciales }
    from "../data/creators.js";


// ============================================================
// UTILIDADES
// ============================================================

function crearId(prefix = "id") {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
}


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


        atributos:
            crearAtributos(),


        equipment: {

            pc: "government_pc",

            camera: "old_phone",

            microphone: "earphones"

        },


        stats:
            crearStats(),


        relationships: {},


        pretemporada: null

    };

}


// ============================================================
// CREADORES
// ============================================================

function crearCreadores() {

    return creatorsIniciales.map(
        creator => ({
            ...creator
        })
    );

}


// ============================================================
// GAME STATE
// ============================================================

export const gameState = {

    // ========================================================
    // DATOS
    // ========================================================

    player:
        crearPlayer(),


    time: {

        año: 2026,

        trimestre: 1

    },


    inventory: [],


    notifications: [],


    creators:
        crearCreadores(),


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

        console.log(
            "🎬 Iniciando nueva partida..."
        );


        // Crear jugador completamente nuevo

        this.player =
            crearPlayer();


        // Datos del formulario

        this.player.nombre =
            String(
                datos.nombre ||
                "Creador"
            ).trim();


        this.player.canal =
            String(
                datos.canal ||
                "Mi Canal"
            ).trim();


        this.player.niche =
            datos.niche ||
            "Gaming";


        // Tiempo inicial

        this.time = {

            año: 2026,

            trimestre: 1

        };


        this.player.año = 2026;

        this.player.trimestre = 1;


        // Limpiar sistemas

        this.inventory = [];

        this.notifications = [];

        this.trends = [];

        this.sponsors = [];


        this.lastVideo = null;

        this.lastVideoResult = null;

        this.ultimoEventoResultado = null;

        this.lastCollab = null;


        // Recrear creadores

        this.creators =
            crearCreadores();


        // Crear relaciones iniciales

        this.creators.forEach(
            creator => {

                if (
                    !this.player
                        .relationships[
                            creator.id
                        ]
                ) {

                    this.player
                        .relationships[
                            creator.id
                        ] = 0;

                }

            }
        );


        // Notificación

        this.agregarNotificacion({

            tipo: "sistema",

            titulo:
                "🎬 Carrera iniciada",

            descripcion:
                `Bienvenido, ${this.player.nombre}. Tu canal "${this.player.canal}" está listo para comenzar.`

        });


        console.log(
            "✅ Partida creada:",
            this.player
        );


        return this.player;

    },


    // ========================================================
    // MEJORAR ATRIBUTO
    // ========================================================

    mejorarAtributo(
        atributo,
        cantidad
    ) {

        if (!this.player.atributos) {

            this.player.atributos =
                crearAtributos();

        }


        if (
            typeof this.player
                .atributos[atributo] !==
            "number"
        ) {

            this.player
                .atributos[atributo] = 0;

        }


        this.player
            .atributos[atributo] +=
            Number(cantidad) || 0;


        // Evitamos atributos negativos

        if (
            this.player
                .atributos[atributo] < 0
        ) {

            this.player
                .atributos[atributo] = 0;

        }


        return this.player
            .atributos[atributo];

    },


    // ========================================================
    // NOTIFICACIONES
    // ========================================================

    agregarNotificacion(data = {}) {

        const notificacion = {

            id:
                crearId(
                    "notification"
                ),


            tipo:
                data.tipo ||
                "general",


            titulo:
                data.titulo ||
                "Nueva notificación",


            descripcion:
                data.descripcion ||
                "",


            leida: false,


            fecha:
                Date.now(),


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
                this.notifications.slice(
                    0,
                    50
                );

        }


        return notificacion;

    },


    // ========================================================
    // MARCAR NOTIFICACIÓN
    // ========================================================

    marcarNotificacionLeida(id) {

        const notificacion =
            this.notifications.find(
                notification =>
                    notification.id === id
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
            notification =>
                !notification.leida
        ).length;

    },


    // ========================================================
    // AVANZAR TRIMESTRE
    // ========================================================

    nextQuarter() {

        this.time.trimestre += 1;


        if (
            this.time.trimestre > 4
        ) {

            this.time.trimestre = 1;

            this.time.año += 1;

        }


        this.player.año =
            this.time.año;


        this.player.trimestre =
            this.time.trimestre;


        // Reiniciar ingresos del trimestre

        this.player.ingresosTrimestre = 0;


        return this.time;

    },


    // ========================================================
    // GUARDAR
    // ========================================================

    guardar() {

        try {

            const data = {

                player:
                    this.player,

                time:
                    this.time,

                inventory:
                    this.inventory,

                notifications:
                    this.notifications,

                creators:
                    this.creators,

                trends:
                    this.trends,

                sponsors:
                    this.sponsors,

                lastVideo:
                    this.lastVideo,

                lastVideoResult:
                    this.lastVideoResult,

                ultimoEventoResultado:
                    this.ultimoEventoResultado,

                lastCollab:
                    this.lastCollab

            };


            localStorage.setItem(
                "elCreadorGameState",
                JSON.stringify(data)
            );


            console.log(
                "💾 Partida guardada"
            );


            return true;

        } catch (error) {

            console.error(
                "❌ Error guardando partida:",
                error
            );


            return false;

        }

    },


    // ========================================================
    // CARGAR
    // ========================================================

    cargar() {

        try {

            const raw =
                localStorage.getItem(
                    "elCreadorGameState"
                );


            if (!raw) {

                return false;

            }


            const data =
                JSON.parse(raw);


            if (
                data.player
            ) {

                this.player =
                    data.player;

            }


            if (
                data.time
            ) {

                this.time =
                    data.time;

            }


            if (
                Array.isArray(
                    data.inventory
                )
            ) {

                this.inventory =
                    data.inventory;

            }


            if (
                Array.isArray(
                    data.notifications
                )
            ) {

                this.notifications =
                    data.notifications;

            }


            if (
                Array.isArray(
                    data.creators
                )
            ) {

                this.creators =
                    data.creators;

            }


            if (
                Array.isArray(
                    data.trends
                )
            ) {

                this.trends =
                    data.trends;

            }


            if (
                Array.isArray(
                    data.sponsors
                )
            ) {

                this.sponsors =
                    data.sponsors;

            }


            this.lastVideo =
                data.lastVideo ||
                null;


            this.lastVideoResult =
                data.lastVideoResult ||
                null;


            this.ultimoEventoResultado =
                data.ultimoEventoResultado ||
                null;


            this.lastCollab =
                data.lastCollab ||
                null;


            normalizarGameState();


            console.log(
                "💾 Partida cargada"
            );


            return true;

        } catch (error) {

            console.error(
                "❌ Error cargando partida:",
                error
            );


            return false;

        }

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
            crearCreadores();


        localStorage.removeItem(
            "elCreadorGameState"
        );


        console.log(
            "🔄 Partida reiniciada"
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
    ).forEach(
        key => {

            if (
                typeof p.atributos[key] !==
                "number"
            ) {

                p.atributos[key] =
                    atributosDefault[key];

            }

        }
    );


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
    ).forEach(
        key => {

            if (
                typeof p.stats[key] !==
                "number"
            ) {

                p.stats[key] =
                    statsDefault[key];

            }

        }
    );


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
    // PRETEMPORADA
    // ========================================================

    if (
        !("pretemporada" in p)
    ) {

        p.pretemporada = null;

    }


    // ========================================================
    // ARRAYS
    // ========================================================

    if (
        !Array.isArray(
            gameState.inventory
        )
    ) {

        gameState.inventory = [];

    }


    if (
        !Array.isArray(
            gameState.notifications
        )
    ) {

        gameState.notifications = [];

    }


    if (
        !Array.isArray(
            gameState.creators
        )
    ) {

        gameState.creators =
            crearCreadores();

    }


    if (
        !Array.isArray(
            gameState.trends
        )
    ) {

        gameState.trends = [];

    }


    if (
        !Array.isArray(
            gameState.sponsors
        )
    ) {

        gameState.sponsors = [];

    }


    // ========================================================
    // TIME
    // ========================================================

    if (!gameState.time) {

        gameState.time = {

            año:
                p.año || 2026,

            trimestre:
                p.trimestre || 1

        };

    }


    return gameState;

}


// ============================================================
// NORMALIZAR AL CARGAR EL MÓDULO
// ============================================================

normalizarGameState();
