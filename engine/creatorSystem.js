// engine/creatorSystem.js

import { gameState } from "./gameState.js";


export function obtenerCreadoresDisponibles() {

    return gameState.creators.filter(
        creator =>
            creator.activo !== false
    );

}


export function obtenerCreadorPorId(id) {

    return gameState.creators.find(
        creator =>
            creator.id === id
    );

}


export function calcularCompatibilidad(
    player,
    creator
) {

    let score = 0;


    // Mismo nicho

    if (
        player.niche ===
        creator.nicho
    ) {

        score += 30;

    } else {

        score += 10;
    }


    // Fama

    score += Math.min(
        30,
        Number(creator.popularidad) || 0
    );


    // Relación previa

    score +=
        Number(
            creator.relacion
        ) || 0;


    return Math.max(
        0,
        Math.min(100, score)
    );

}


export function crearRelacionInicial() {

    return {

        relacion: 0,

        respeto: 0,

        rivalidad: 0,

        colaboraciones: 0
    };

}


export function aumentarRelacion(
    creator,
    cantidad
) {

    creator.relacion =
        (
            Number(
                creator.relacion
            ) || 0
        ) + cantidad;

    creator.relacion =
        Math.max(
            -100,
            Math.min(
                100,
                creator.relacion
            )
        );
}


export function generarNotificacionCreador(
    creator
) {

    gameState.agregarNotificacion({

        tipo: "creator",

        titulo:
            `👀 ${creator.nombre} vio tu canal`,

        descripcion:
            `${creator.nombre} empezó a prestar atención a tu contenido.`
    });

}


export function reaccionarACreador(
    creator,
    resultadoVideo
) {

    if (!creator) return null;


    const calidad =
        Number(
            resultadoVideo.vistas
        ) || 0;


    // Chance de reacción

    let chance =
        0.01;


    chance +=
        (
            Number(
                creator.popularidad
            ) || 0
        ) / 1000;


    if (
        gameState.player.niche ===
        creator.nicho
    ) {

        chance += 0.05;
    }


    if (
        resultadoVideo.viral
    ) {

        chance += 0.15;
    }


    if (
        Math.random() >
        chance
    ) {

        return null;
    }


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


    gameState.player.vistasTotales +=
        recompensa.vistas;

    gameState.player.suscriptores +=
        recompensa.subs;

    gameState.player.fama +=
        recompensa.fama;


    aumentarRelacion(
        creator,
        5
    );


    gameState.agregarNotificacion({

        tipo: "creator",

        titulo:
            tipo === "reaccion"
                ? `🔥 ${creator.nombre} reaccionó a tu video`
                : tipo === "compartido"
                    ? `🔁 ${creator.nombre} compartió tu video`
                    : `💬 ${creator.nombre} comentó tu video`,

        descripcion:
            `Tu interacción con ${creator.nombre} generó +${recompensa.vistas.toLocaleString()} vistas y +${recompensa.subs.toLocaleString()} subs.`
    });


    return {

        tipo,

        creator,

        recompensa
    };

}