// engine/creatorSystem.js

import { gameState } from "./gameState.js";


// ============================================================
// OBTENER CREADORES
// ============================================================

export function obtenerCreadoresDisponibles() {

    if (!Array.isArray(gameState.creators)) {
        return [];
    }

    return gameState.creators.filter(
        creator => creator.activo !== false
    );
}


// ============================================================
// OBTENER CREADOR POR ID
// ============================================================

export function obtenerCreadorPorId(id) {

    return gameState.creators.find(
        creator => creator.id === id
    );
}


// ============================================================
// COMPATIBILIDAD
// ============================================================

export function calcularCompatibilidad(
    player,
    creator
) {

    if (!player || !creator) {
        return 0;
    }

    let score = 0;


    // MISMO NICHO

    if (
        player.niche === creator.nicho
    ) {
        score += 30;
    } else {
        score += 10;
    }


    // POPULARIDAD

    score += Math.min(
        30,
        Number(creator.popularidad) || 0
    );


    // RELACI車N

    score += Math.max(
        -20,
        Math.min(
            20,
            Number(creator.relacion) || 0
        )
    );


    // FAMA DEL JUGADOR

    score += Math.min(
        10,
        Number(player.fama) || 0
    );


    return Math.max(
        0,
        Math.min(100, score)
    );
}


// ============================================================
// RELACI車N INICIAL
// ============================================================

export function crearRelacionInicial() {

    return {
        relacion: 0,
        respeto: 0,
        rivalidad: 0,
        colaboraciones: 0
    };
}


// ============================================================
// AUMENTAR RELACI車N
// ============================================================

export function aumentarRelacion(
    creator,
    cantidad
) {

    if (!creator) return;

    creator.relacion =
        Number(creator.relacion) || 0;

    creator.relacion +=
        Number(cantidad) || 0;

    creator.relacion =
        Math.max(
            -100,
            Math.min(
                100,
                creator.relacion
            )
        );
}


// ============================================================
// CAMBIAR RESPETO
// ============================================================

export function aumentarRespeto(
    creator,
    cantidad
) {

    if (!creator) return;

    creator.respeto =
        Number(creator.respeto) || 0;

    creator.respeto +=
        Number(cantidad) || 0;

    creator.respeto =
        Math.max(
            -100,
            Math.min(
                100,
                creator.respeto
            )
        );
}


// ============================================================
// CAMBIAR RIVALIDAD
// ============================================================

export function aumentarRivalidad(
    creator,
    cantidad
) {

    if (!creator) return;

    creator.rivalidad =
        Number(creator.rivalidad) || 0;

    creator.rivalidad +=
        Number(cantidad) || 0;

    creator.rivalidad =
        Math.max(
            0,
            Math.min(
                100,
                creator.rivalidad
            )
        );
}


// ============================================================
// NOTIFICACI車N
// ============================================================

export function generarNotificacionCreador(
    creator
) {

    if (!creator) return;

    gameState.agregarNotificacion({

        tipo: "creator",

        titulo:
            `?? ${creator.nombre} vio tu canal`,

        descripcion:
            `${creator.nombre} empez車 a prestar atenci車n a tu contenido.`
    });
}


// ============================================================
// REACCI車N DE CREADOR
// ============================================================

export function reaccionarACreador(
    creator,
    resultadoVideo
) {

    if (!creator || !resultadoVideo) {
        return null;
    }


    // --------------------------------------------------------
    // CHANCE BASE
    // --------------------------------------------------------

    let chance = 0.01;


    // POPULARIDAD

    chance +=
        (
            Number(creator.popularidad) || 0
        ) / 1000;


    // MISMO NICHO

    if (
        gameState.player.niche ===
        creator.nicho
    ) {
        chance += 0.05;
    }


    // VIRAL

    if (
        resultadoVideo.viral
    ) {
        chance += 0.15;
    }


    // RELACI車N

    const relacion =
        Number(creator.relacion) || 0;

    if (relacion > 0) {

        chance +=
            Math.min(
                0.10,
                relacion / 1000
            );
    }


    // LIMITAR CHANCE

    chance =
        Math.min(
            0.75,
            Math.max(
                0,
                chance
            )
        );


    // NO REACCIONA

    if (
        Math.random() > chance
    ) {
        return null;
    }


    // --------------------------------------------------------
    // TIPO DE REACCI車N
    // --------------------------------------------------------

    const tipos = [
        "comentario",
        "compartido",
        "reaccion"
    ];


    const tipo =
        tipos[
            Math.floor(
                Math.random() *
                tipos.length
            )
        ];


    // --------------------------------------------------------
    // RECOMPENSA
    // --------------------------------------------------------

    let recompensa = {

        vistas: 0,
        subs: 0,
        fama: 0
    };


    if (tipo === "comentario") {

        recompensa = {
            vistas: 1000,
            subs: 50,
            fama: 1
        };

    }


    if (tipo === "compartido") {

        recompensa = {
            vistas: 10000,
            subs: 500,
            fama: 3
        };

    }


    if (tipo === "reaccion") {

        recompensa = {
            vistas: 50000,
            subs: 2500,
            fama: 8
        };

    }


    // --------------------------------------------------------
    // APLICAR RECOMPENSA
    // --------------------------------------------------------

    gameState.player.vistasTotales +=
        recompensa.vistas;

    gameState.player.suscriptores +=
        recompensa.subs;

    gameState.player.fama +=
        recompensa.fama;


    // RELACI車N

    aumentarRelacion(
        creator,
        5
    );


    // --------------------------------------------------------
    // NOTIFICACI車N
    // --------------------------------------------------------

    let titulo;


    if (tipo === "reaccion") {

        titulo =
            `?? ${creator.nombre} reaccion車 a tu video`;

    } else if (tipo === "compartido") {

        titulo =
            `?? ${creator.nombre} comparti車 tu video`;

    } else {

        titulo =
            `?? ${creator.nombre} coment車 tu video`;
    }


    gameState.agregarNotificacion({

        tipo: "creator",

        titulo,

        descripcion:
            `Tu interacci車n con ${creator.nombre} gener車 +${recompensa.vistas.toLocaleString()} vistas y +${recompensa.subs.toLocaleString()} subs.`
    });


    return {

        tipo,

        creator,

        recompensa
    };
}


// ============================================================
// CREAR CREADOR
// ============================================================

export function buildCreator(data) {

    return {

        id:
            data.id ||
            `creator_${Date.now()}`,

        nombre:
            data.nombre ||
            data.name ||
            "Creador",

        nicho:
            data.nicho ||
            data.niche ||
            "Gaming",

        seguidores:
            Number(
                data.seguidores ??
                data.followers ??
                0
            ),

        popularidad:
            Number(
                data.popularidad ??
                50
            ),

        relacion: 0,

        respeto: 0,

        rivalidad: 0,

        colaboraciones: 0,

        activo: true
    };
}


// ============================================================
// INICIALIZAR RELACIONES
// ============================================================

export function initializeRelationships(
    player
) {

    if (!player) return;

    if (!player.relationships) {
        player.relationships = {};
    }


    obtenerCreadoresDisponibles()
        .forEach(creator => {

            if (
                player.relationships[
                    creator.id
                ] === undefined
            ) {

                player.relationships[
                    creator.id
                ] = 0;
            }

        });
}


// ============================================================
// CAMBIAR RELACI車N
// ============================================================

export function changeRelationship(
    player,
    id,
    value
) {

    if (!player) return;

    if (!player.relationships) {
        player.relationships = {};
    }


    if (
        player.relationships[id] === undefined
    ) {

        player.relationships[id] = 0;
    }


    player.relationships[id] +=
        Number(value) || 0;


    player.relationships[id] =
        Math.max(
            -100,
            Math.min(
                100,
                player.relationships[id]
            )
        );
}


// ============================================================
// OBTENER RELACI車N
// ============================================================

export function getRelationship(
    player,
    id
) {

    if (
        !player ||
        !player.relationships
    ) {
        return 0;
    }


    return (
        Number(
            player.relationships[id]
        ) || 0
    );
}