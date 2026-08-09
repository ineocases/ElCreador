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
// FORMATEAR ATRIBUTO
// ============================================================

function nombreAtributo(
    atributo
) {

    const nombres = {

        edicion: "EDICIÓN",

        carisma: "CARISMA",

        algoritmo: "ALGORITMO",

        marketing: "MARKETING",

        constancia: "CONSTANCIA",

        humor: "HUMOR",

        creatividad: "CREATIVIDAD"

    };


    return (
        nombres[atributo] ||
        atributo.toUpperCase()
    );

}


// ============================================================
// PRETEMPORADA
// ============================================================

export function renderPretemporada(el) {

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
    // PREVENIR ERROR SI SE ABRE DIRECTAMENTE
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
    // CARTAS ALEATORIAS
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

        <div class="preseason-page">

            ${
                typeof renderHeaderHud ===
                "function"
                    ? renderHeaderHud()
                    : ""
            }


            <div class="preseason-header">

                <div class="preseason-kicker">

                    ⚡ PRETEMPORADA
                    · AÑO
                    ${gameState.time.año}

                </div>


                <h1>
                    Prepará tu carrera
                </h1>


                <p>

                    Antes de empezar el año
                    podés elegir una mejora
                    para tu creador.

                    <br>

                    Esta decisión va a afectar
                    tus primeros videos.

                </p>

            </div>


            <div class="cards-grid">

                ${
                    opciones
                        .map(
                            (carta, index) => `

                        <div
                            class="preseason-card"
                            data-index="${index}"
                            style="
                                border-top:
                                    3px solid
                                    ${carta.color};
                            "
                        >

                            <div>

                                <span
                                    class="card-type"
                                    style="
                                        background:
                                            ${carta.color};
                                    "
                                >
                                    ${carta.tipo}
                                </span>


                                <h2>

                                    ${carta.titulo}

                                </h2>


                                <p>

                                    ${carta.desc}

                                </p>

                            </div>


                            <div>

                                <div
                                    class="card-bonus"
                                >

                                    +${carta.pts}
                                    ${nombreAtributo(
                                        carta.attr
                                    )}
                                    ▲

                                </div>


                                <button
                                    class="
                                        select-card-button
                                    "
                                    data-index="${index}"
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

    `;


    // ========================================================
    // BOTONES
    // ========================================================

    const buttons =
        container.querySelectorAll(
            ".select-card-button"
        );


    buttons.forEach(
        button => {

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
                    // EVITAR DOBLE ELECCIÓN
                    // ========================================

                    buttons.forEach(
                        btn => {

                            btn.disabled = true;

                            btn.style.opacity =
                                "0.5";

                        }
                    );


                    // ========================================
                    // APLICAR ATRIBUTO
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
                    // PEQUEÑA PAUSA VISUAL
                    // ========================================

                    container.innerHTML = `

                        <div
                            style="
                                min-height:100vh;

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
                                        margin-bottom:15px;
                                    "
                                >
                                    ⚡
                                </div>


                                <h2
                                    style="
                                        margin:0 0 10px;
                                    "
                                >
                                    ¡Pretemporada lista!
                                </h2>


                                <p
                                    style="
                                        color:
                                            var(--text-muted);

                                        line-height:1.5;
                                    "
                                >

                                    ${elegida.titulo}

                                    <br>

                                    <strong
                                        style="
                                            color:
                                                var(--accent-green);
                                        "
                                    >

                                        +${elegida.pts}
                                        ${nombreAtributo(
                                            elegida.attr
                                        )}

                                    </strong>

                                </p>


                                <p
                                    style="
                                        color:
                                            var(--text-muted);

                                        font-size:.85rem;
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
                        700
                    );

                }
            );

        }
    );


    return container;

}


// ============================================================
// EXPORT
// ============================================================

export const pretemporadaScreen = {

    render:
        renderPretemporada

};


export default pretemporadaScreen;
