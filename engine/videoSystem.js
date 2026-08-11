// engine/videoSystem.js

import formats from "../data/generator/formats.js";
import topics from "../data/generator/topics.js";
import { gameState } from "./gameState.js";


function random(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;

}


function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function obtenerTemas(niche) {

    return (
        topics[niche] ||
        topics.Gaming ||
        [
            "Gaming",
            "Internet",
            "YouTube",
            "Tendencias"
        ]
    );

}


function obtenerFormato(index) {

    if (!formats || formats.length === 0) {

        return {
            name: "Video",
            cost: 0,
            risk: 10
        };

    }

    return (
        formats[index] ||
        formats[index % formats.length]
    );

}


function obtenerTipo(index) {

    if (index < 2) return "gratis";

    if (index < 4) return "medio";

    return "caro";

}


function generarTitulo(formato, tema) {

    const plantillas = {

        Gameplay: [
            `Jugando ${tema} por primera vez`,
            `NO esperaba esto en ${tema}`,
            `La partida más rara de ${tema}`
        ],

        "Reaccionando a": [
            `Reaccionando a lo mejor de ${tema}`,
            `NO PUEDO CREER lo que pasó con ${tema}`,
            `Mi reacción a ${tema}`
        ],

        Challenge: [
            `El desafío más difícil de ${tema}`,
            `Intenté hacer esto en ${tema}`,
            `¿Puedo superar este desafío de ${tema}?`
        ],

        "24 Horas con": [
            `24 HORAS con ${tema}`,
            `Pasé 24 horas haciendo esto: ${tema}`,
            `24 HORAS que cambiaron todo`
        ],

        "Viajando a": [
            `Viajando para conocer ${tema}`,
            `Mi viaje para descubrir ${tema}`,
            `NO esperaba encontrar esto en ${tema}`
        ],

        "Documental sobre": [
            `La historia detrás de ${tema}`,
            `La verdad sobre ${tema}`,
            `¿Qué pasó realmente con ${tema}?`
        ]
    };

    const opciones =
        plantillas[formato.name];

    if (!opciones || opciones.length === 0) {

        return `${formato.name} ${tema}`;

    }

    return opciones[
        random(0, opciones.length - 1)
    ];
}


export function generarVideos(player) {

    const categoria =
        obtenerTemas(player.niche);

    const videos = [];

    const usados = [];

    for (let i = 0; i < 6; i++) {

        let tema;

        let intentos = 0;

        do {

            tema =
                categoria[
                    random(
                        0,
                        categoria.length - 1
                    )
                ];

            intentos++;

        } while (
            usados.includes(tema) &&
            intentos < 20
        );

        usados.push(tema);

        const formato =
            obtenerFormato(i);

        const tipo =
            obtenerTipo(i);

        videos.push({

            id:
                typeof crypto !== "undefined" &&
                crypto.randomUUID
                    ? crypto.randomUUID()
                    : `video_${Date.now()}_${i}`,

            titulo:
                generarTitulo(
                    formato,
                    tema
                ),

            formato:
                formato.name,

            tema,

            costo:
                Number(formato.cost) || 0,

            riesgo:
                Number(formato.risk) || 0,

            tipo
        });
    }

    return videos;
}


// ============================================================
// PUBLICAR VIDEO
// ============================================================

export function procesarPublicacionVideo(
    titulo,
    enfoquePrincipal,
    enfoqueSecundario
) {

    const player =
        gameState.player;

    const atributos =
        player.atributos || {};

    let potencia = 0;


    // --------------------------------------------------------
    // ATRIBUTOS
    // --------------------------------------------------------

    potencia +=
        Number(atributos.edicion) || 0;

    potencia +=
        Number(atributos.carisma) || 0;

    potencia +=
        Number(atributos.algoritmo) || 0;

    potencia +=
        Number(atributos.marketing) || 0;

    potencia +=
        Number(atributos.constancia) || 0;

    potencia +=
        Number(atributos.humor) || 0;

    potencia +=
        Number(atributos.creatividad) || 0;


    // --------------------------------------------------------
    // EQUIPO
    // --------------------------------------------------------

    const equipment =
        player.equipment || {};


    if (
        equipment.pc &&
        equipment.pc !== "government_pc"
    ) {
        potencia += 10;
    }


    if (
        equipment.camera &&
        equipment.camera !== "old_phone"
    ) {
        potencia += 8;
    }


    if (
        equipment.microphone &&
        equipment.microphone !== "earphones"
    ) {
        potencia += 6;
    }


    // --------------------------------------------------------
    // ENFOQUE PRINCIPAL
    // --------------------------------------------------------

    potencia +=
        Number(
            atributos[enfoquePrincipal]
        ) || 0;


    // --------------------------------------------------------
    // ENFOQUE SECUNDARIO
    // --------------------------------------------------------

    potencia +=
        (
            Number(
                atributos[enfoqueSecundario]
            ) || 0
        ) * 0.5;


    // --------------------------------------------------------
    // TENDENCIAS
    // --------------------------------------------------------

    let multiplicadorTendencia = 1;

    if (
        Array.isArray(gameState.trends)
    ) {

        const tendencia =
            gameState.trends.find(
                trend =>
                    trend.activa &&
                    (
                        trend.nicho === player.niche ||
                        trend.nicho === "Todos"
                    )
            );

        if (tendencia) {

            multiplicadorTendencia =
                Number(
                    tendencia.multiplicador
                ) || 1;
        }
    }


    // --------------------------------------------------------
    // RANDOM
    // --------------------------------------------------------

    potencia += random(-20, 25);


    // --------------------------------------------------------
    // VISTAS
    // --------------------------------------------------------

    let vistas;


    if (potencia < 30) {

        vistas = random(50, 350);

    } else if (potencia < 50) {

        vistas = random(200, 900);

    } else if (potencia < 70) {

        vistas = random(500, 1800);

    } else if (potencia < 90) {

        vistas = random(1000, 5000);

    } else if (potencia < 120) {

        vistas = random(3000, 12000);

    } else {

        vistas = random(8000, 25000);
    }


    // Tendencia

    vistas =
        Math.floor(
            vistas *
            multiplicadorTendencia
        );


    // --------------------------------------------------------
    // VIRALIDAD
    // --------------------------------------------------------

    const creatividad =
        Number(
            atributos.creatividad
        ) || 0;

    const algoritmo =
        Number(
            atributos.algoritmo
        ) || 0;

    const carisma =
        Number(
            atributos.carisma
        ) || 0;


    let probabilidadViral =
        0.15;


    probabilidadViral +=
        creatividad * 0.04;


    probabilidadViral +=
        algoritmo * 0.03;


    probabilidadViral +=
        carisma * 0.01;


    // Tendencia también ayuda

    if (multiplicadorTendencia > 1) {

        probabilidadViral +=
            (
                multiplicadorTendencia - 1
            ) * 3;
    }


    probabilidadViral =
        clamp(
            probabilidadViral,
            0.15,
            20
        );


    const viral =
        Math.random() * 100 <
        probabilidadViral;


    let nivelViralidad =
        "normal";


    if (viral) {

        const multiplicador =
            random(15, 100);

        vistas *= multiplicador;

        nivelViralidad =
            multiplicador >= 80
                ? "fenomeno"
                : multiplicador >= 50
                    ? "mega_viral"
                    : "viral";
    }


    vistas =
        Math.floor(vistas);


    // --------------------------------------------------------
    // SUSCRIPTORES
    // --------------------------------------------------------

    let conversion =
        random(20, 45);


    if (viral) {

        conversion =
            random(15, 30);
    }


    const nuevosSuscriptores =
        Math.max(
            1,
            Math.floor(
                vistas / conversion
            )
        );


    // --------------------------------------------------------
    // INGRESOS
    // --------------------------------------------------------

    const rpm =
        0.01 +
        (
            Number(
                atributos.marketing
            ) || 0
        ) * 0.002;


    const ingresos =
        Math.max(
            0,
            Math.floor(
                vistas * rpm
            )
        );


    // --------------------------------------------------------
    // FAMA
    // --------------------------------------------------------

    const famaGanada =
        viral
            ? random(3, 8)
            : random(0, 1);


    // --------------------------------------------------------
    // ACTUALIZAR JUGADOR
    // --------------------------------------------------------

    player.vistasTotales =
        Number(
            player.vistasTotales
        ) + vistas;


    player.suscriptores =
        Number(
            player.suscriptores
        ) + nuevosSuscriptores;


    player.dinero =
        Number(
            player.dinero
        ) + ingresos;


    player.videosSubidos =
        Number(
            player.videosSubidos
        ) + 1;


    player.ingresosTrimestre =
        Number(
            player.ingresosTrimestre
        ) + ingresos;


    player.fama =
        Number(
            player.fama
        ) + famaGanada;


    // --------------------------------------------------------
    // STATS
    // --------------------------------------------------------

    if (!player.stats) {
        player.stats = {};
    }


    player.stats.videosPublicados =
        (
            Number(
                player.stats.videosPublicados
            ) || 0
        ) + 1;


    if (
        vistas >
        (
            Number(
                player.stats.mejorVideo
            ) || 0
        )
    ) {

        player.stats.mejorVideo =
            vistas;
    }


    if (viral) {

        player.stats.videosVirales =
            (
                Number(
                    player.stats.videosVirales
                ) || 0
            ) + 1;
    }


    // --------------------------------------------------------
    // RESULTADO
    // --------------------------------------------------------

    const resultado = {

        titulo:
            titulo || "Nuevo video",

        vistas,

        suscriptores:
            nuevosSuscriptores,

        dinero:
            ingresos,

        famaGanada,

        viral,

        nivelViralidad,

        potencia:

            Math.round(
                potencia
            ),

        enfoquePrincipal,

        enfoqueSecundario,

        rpm:

            Number(
                rpm
            ).toFixed(2),

        multiplicadorTendencia
    };


    gameState.lastVideoResult =
        resultado;


    // Compatibilidad con sistemas viejos

    gameState.player.ultimoVideoResultado = {

        titulo:
            resultado.titulo,

        vistasGanadas:
            resultado.vistas,

        subsGanados:
            resultado.suscriptores,

        dineroGanado:
            resultado.dinero,

        rpmFinal:
            resultado.rpm,

        esViral:
            resultado.viral
    };


    // --------------------------------------------------------
    // NOTIFICACIÓN
    // --------------------------------------------------------

    gameState.agregarNotificacion({

        tipo: "video",

        titulo:
            viral
                ? "🔥 Tu video se hizo viral"
                : "📹 Video publicado",

        descripcion:
            `${resultado.titulo} consiguió ${vistas.toLocaleString()} vistas.`
    });


    return resultado;
}


export default {

    generarVideos,

    procesarPublicacionVideo
};