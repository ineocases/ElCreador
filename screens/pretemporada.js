// screens/pretemporada.js

import { renderHeaderHud }
    from "../components/HeaderHud.js";

import { gameState }
    from "../engine/gameState.js";


// ============================================================
// BANCO DE CARTAS
// ============================================================

const bancoCartas = [

    {
        titulo:
            "CURSO RÁPIDO DE PREMIERE",

        tipo:
            "RARA",

        attr:
            "edicion",

        pts:
            4,

        desc:
            "Aprendés a cortar silencios y meter memes como un pro.",

        color:
            "var(--accent-yellow)"
    },


    {
        titulo:
            "SETUP NUEVO EN CUOTAS",

        tipo:
            "COMÚN",

        attr:
            "algoritmo",

        pts:
            3,

        desc:
            "Mejorás la calidad de imagen y optimizás tu forma de publicar.",

        color:
            "var(--accent-green)"
    },


    {
        titulo:
            "CURSO DE TEATRO E IMPRO",

        tipo:
            "RARA",

        attr:
            "carisma",

        pts:
            4,

        desc:
            "Aprendés a soltarte más frente a la cámara.",

        color:
            "var(--accent-yellow)"
    },


    {
        titulo:
            "ESTRATEGIA DE CONTENIDO EN TIKTOK",

        tipo:
            "COMÚN",

        attr:
            "marketing",

        pts:
            3,

        desc:
            "Subís clips resumidos para atraer tráfico nuevo.",

        color:
            "var(--accent-green)"
    },


    {
        titulo:
            "DISCIPLINA DE STREAMER",

        tipo:
            "ÉPICA",

        attr:
            "constancia",

        pts:
            5,

        desc:
            "Horarios fijos y rutina estricta de grabación.",

        color:
            "var(--accent-red)"
    }

];


// ============================================================
// NOMBRE ATRIBUTO
// ============================================================

function nombreAtributo(
    atributo
) {

    const nombres = {

        edicion:
            "EDICIÓN",

        carisma:
            "CARISMA",

        algoritmo:
            "ALGORITMO",

        marketing:
            "MARKETING",

        constancia:
            "CONSTANCIA",

        humor:
            "HUMOR",

        creatividad:
            "CREATIVIDAD"

    };


    return (
        nombres[atributo] ||
        String(atributo).toUpperCase()
    );

}


// ============================================================
// RENDER
// ============================================================

export function renderPretemporada(
    el
) {

    const container =
        el ||
        document.getElementById(
            "pretemporadaScreen"
        );


    if (!container) {

        console.error(
            "❌ No existe #pretemporadaScreen"
        );

        return;

    }


    // ========================================================
    // VERIFICAR PLAYER
    // ========================================================

    if (!gameState.player) {

        console.error(
            "❌ No existe jugador"
        );

        window.location.hash =
            "#createChannel";

        return;

    }


    // ========================================================
    // EVITAR REPETIR PRETEMPORADA
    // ========================================================

    if (
        gameState.player.pretemporada &&
        gameState.player.pretemporada.año ===
            gameState.time.año
    ) {

        console.log(
            "ℹ️ La pretemporada ya fue completada."
        );

        window.location.hash =
            "#dashboard";

        return;

    }


    // ========================================================
    // ELEGIR 3 CARTAS
    // ========================================================

    const opciones =
        [...bancoCartas]
            .sort(
                () =>
                    Math.random() - 0.5
            )
            .slice(0, 3);


    // ========================================================
    // RENDER
    // ========================================================

    container.innerHTML = `

        <div
            style="
                min-height:100%;
                padding:20px;
            "
        >

            ${
                typeof renderHeaderHud ===
                "function"
                    ? renderHeaderHud()
                    : ""
            }


            <div
                style="
                    max-width:1000px;
                    margin:25px auto;
                "
            >

                <div
                    style="
                        margin-bottom:30px;
                    "
                >

                    <div
                        style="
                            color:var(--accent-red);
                            font-size:.8rem;
                            font-weight:bold;
                            letter-spacing:1px;
                        "
                    >
                        ⚡ PRETEMPORADA
                        · AÑO
                        ${gameState.time.año}
                    </div>


                    <h1
                        style="
                            font-family:var(--font-heading);
                            font-size:2.3rem;
                            margin:8px 0;
                        "
                    >
                        Prepará tu carrera
                    </h1>


                    <p
                        style="
                            color:var(--text-muted);
                            max-width:650px;
                            line-height:1.6;
                        "
                    >
                        Antes de comenzar tu carrera
                        elegí una carta de entrenamiento.
                        Esta decisión modificará tus
                        atributos iniciales.
                    </p>

                </div>


                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            repeat(
                                auto-fit,
                                minmax(230px,1fr)
                            );
                        gap:18px;
                    "
                >

                    ${opciones
                        .map(
                            (carta, index) => `

                            <div
                                class="preseason-card"
                                data-index="${index}"

                                style="
                                    background:
                                        var(--bg-card);

                                    border:
                                        var(--border-card);

                                    border-top:
                                        4px solid
                                        ${carta.color};

                                    border-radius:16px;

                                    padding:22px;

                                    min-height:300px;

                                    display:flex;

                                    flex-direction:column;

                                    justify-content:
                                        space-between;

                                    transition:
                                        transform .2s ease,
                                        box-shadow .2s ease;
                                "
                            >

                                <div>

                                    <span
                                        style="
                                            display:inline-block;

                                            background:
                                                ${carta.color};

                                            color:#000;

                                            padding:
                                                4px 9px;

                                            border-radius:5px;

                                            font-size:.7rem;

                                            font-weight:bold;
                                        "
                                    >
                                        ${carta.tipo}
                                    </span>


                                    <h2
                                        style="
                                            font-size:1.15rem;
                                            margin:
                                                18px 0 10px;
                                        "
                                    >
                                        ${carta.titulo}
                                    </h2>


                                    <p
                                        style="
                                            color:
                                                var(--text-muted);

                                            font-size:.85rem;

                                            line-height:1.5;
                                        "
                                    >
                                        ${carta.desc}
                                    </p>

                                </div>


                                <div>

                                    <div
                                        style="
                                            text-align:center;

                                            color:
                                                var(--accent-green);

                                            font-weight:bold;

                                            margin:
                                                20px 0;
                                        "
                                    >
                                        +${carta.pts}
                                        ${nombreAtributo(carta.attr)}
                                    </div>


                                    <button
                                        class="
                                            select-card-button
                                        "

                                        data-index="${index}"

                                        style="
                                            width:100%;

                                            padding:13px;

                                            border:none;

                                            border-radius:9px;

                                            background:
                                                var(--accent-red);

                                            color:#fff;

                                            font-weight:bold;

                                            cursor:pointer;
                                        "
                                    >
                                        ELEGIR MEJORA
                                    </button>

                                </div>

                            </div>

                        `
                        )
                        .join("")
                    }

                </div>

            </div>

        </div>

    `;


    // ========================================================
    // EFECTO HOVER
    // ========================================================

    container
        .querySelectorAll(
            ".preseason-card"
        )
        .forEach(card => {

            card.addEventListener(
                "mouseenter",
                () => {

                    card.style.transform =
                        "translateY(-5px)";

                    card.style.boxShadow =
                        "0 15px 40px rgba(0,0,0,.35)";

                }
            );


            card.addEventListener(
                "mouseleave",
                () => {

                    card.style.transform =
                        "translateY(0)";

                    card.style.boxShadow =
                        "none";

                }
            );

        });


    // ========================================================
    // SELECCIÓN
    // ========================================================

    container
        .querySelectorAll(
            ".select-card-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    const elegida =
                        opciones[index];


                    if (!elegida) {

                        console.error(
                            "❌ Carta inválida"
                        );

                        return;

                    }


                    // ========================================
                    // BLOQUEAR BOTONES
                    // ========================================

                    container
                        .querySelectorAll(
                            ".select-card-button"
                        )
                        .forEach(btn => {

                            btn.disabled = true;

                            btn.style.opacity =
                                "0.5";

                        });


                    // ========================================
                    // APLICAR MEJORA
                    // ========================================

                    gameState.mejorarAtributo(
                        elegida.attr,
                        elegida.pts
                    );


                    // ========================================
                    // GUARDAR ELECCIÓN
                    // ========================================

                    gameState.player.pretemporada = {

                        año:
                            gameState.time.año,

                        entrenamiento:
                            elegida.titulo,

                        atributo:
                            elegida.attr,

                        puntos:
                            elegida.pts

                    };


                    // ========================================
                    // NOTIFICACIÓN
                    // ========================================

                    gameState.agregarNotificacion({

                        tipo:
                            "pretemporada",

                        titulo:
                            "⚡ Pretemporada completada",

                        descripcion:
                            `Elegiste "${elegida.titulo}" y ganaste +${elegida.pts} ${nombreAtributo(elegida.attr)}.`

                    });


                    // ========================================
                    // GUARDAR
                    // ========================================

                    if (
                        typeof gameState.guardar ===
                        "function"
                    ) {

                        gameState.guardar();

                    }


                    // ========================================
                    // PANTALLA FINAL
                    // ========================================

                    container.innerHTML = `

                        <div
                            style="
                                min-height:80vh;

                                display:flex;

                                align-items:center;

                                justify-content:center;

                                padding:20px;
                            "
                        >

                            <div
                                style="
                                    width:100%;

                                    max-width:500px;

                                    background:
                                        var(--bg-card);

                                    border:
                                        var(--border-card);

                                    border-radius:18px;

                                    padding:35px;

                                    text-align:center;
                                "
                            >

                                <div
                                    style="
                                        font-size:3rem;
                                    "
                                >
                                    ⚡
                                </div>


                                <h2>
                                    ¡Pretemporada lista!
                                </h2>


                                <p
                                    style="
                                        color:
                                            var(--text-muted);

                                        line-height:1.6;
                                    "
                                >
                                    ${elegida.titulo}
                                </p>


                                <strong
                                    style="
                                        color:
                                            var(--accent-green);
                                    "
                                >
                                    +${elegida.pts}
                                    ${nombreAtributo(elegida.attr)}
                                </strong>


                                <p
                                    style="
                                        color:
                                            var(--text-muted);

                                        margin-top:20px;
                                    "
                                >
                                    Preparando tu primer año...
                                </p>

                            </div>

                        </div>

                    `;


                    // ========================================
                    // DASHBOARD
                    // ========================================

                    setTimeout(
                        () => {

                            window.location.hash =
                                "#dashboard";

                        },
                        900
                    );

                }
            );

        });


    return container;

}


// ============================================================
// EXPORTS
// ============================================================

export const pretemporadaScreen = {

    render:
        renderPretemporada

};


export default pretemporadaScreen;
