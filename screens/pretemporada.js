// screens/pretemporada.js

import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";

const bancoCartas = [

    {
        titulo: "CURSO RÁPIDO DE PREMIERE",
        tipo: "RARA",
        attr: "edicion",
        pts: 4,
        desc: "Aprendés a cortar silencios y meter memes como un pro.",
        color: "var(--accent-yellow)"
    },

    {
        titulo: "SETUP NUEVO EN CUOTAS",
        tipo: "COMÚN",
        attr: "algoritmo",
        pts: 3,
        desc: "Mejorás la calidad de imagen y optimizás tu forma de publicar.",
        color: "var(--accent-green)"
    },

    {
        titulo: "CURSO DE TEATRO E IMPRO",
        tipo: "RARA",
        attr: "carisma",
        pts: 4,
        desc: "Aprendés a soltarte más frente a la cámara.",
        color: "var(--accent-yellow)"
    },

    {
        titulo: "ESTRATEGIA DE CONTENIDO EN TIKTOK",
        tipo: "COMÚN",
        attr: "marketing",
        pts: 3,
        desc: "Subís clips resumidos para atraer tráfico nuevo.",
        color: "var(--accent-green)"
    },

    {
        titulo: "DISCIPLINA DE STREAMER",
        tipo: "ÉPICA",
        attr: "constancia",
        pts: 5,
        desc: "Horarios fijos y rutina estricta de grabación.",
        color: "var(--accent-red)"
    }

];


// ==================================================
// PRETEMPORADA
// ==================================================

export function renderPretemporada() {

    const container =
        document.createElement("div");

    container.style.cssText = `
        max-width: 900px;
        margin: 20px auto;
        padding: 0 15px;
    `;


    // ==============================================
    // 3 CARTAS ALEATORIAS
    // ==============================================

    const opciones =
        [...bancoCartas]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);


    container.innerHTML = `

        ${renderHeaderHud()}

        <div
            style="
                background: var(--bg-card);
                border: var(--border-card);
                border-radius: 16px;
                padding: 25px;
                margin-top: 20px;
            "
        >

            <span
                style="
                    color: var(--accent-red);
                    font-size: 0.85rem;
                    font-weight: bold;
                    text-transform: uppercase;
                "
            >
                ⚡ PRETEMPORADA
                ${gameState.player.año}
            </span>


            <h2
                style="
                    font-family: var(--font-heading);
                    font-size: 2rem;
                    margin: 5px 0 10px;
                "
            >
                Prepará tu carrera
            </h2>


            <p
                style="
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin-bottom: 25px;
                "
            >
                Antes de empezar el año podés elegir
                una mejora para tu creador.
            </p>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(210px, 1fr)
                        );
                    gap:15px;
                "
            >

                ${opciones.map((carta, index) => `

                    <div
                        class="carta-box interactive-card"
                        data-idx="${index}"

                        style="
                            background:
                                rgba(0,0,0,0.6);

                            border:
                                1px solid
                                ${carta.color};

                            padding:20px;

                            border-radius:12px;

                            cursor:pointer;

                            display:flex;

                            flex-direction:column;

                            justify-content:
                                space-between;

                            transition:
                                transform .15s ease,
                                box-shadow .15s ease;
                        "
                    >

                        <div>

                            <span
                                style="
                                    background:
                                        ${carta.color};

                                    color:#000;

                                    padding:
                                        2px 8px;

                                    border-radius:4px;

                                    font-size:.7rem;

                                    font-weight:bold;
                                "
                            >
                                ${carta.tipo}
                            </span>


                            <h3
                                style="
                                    font-size:1.1rem;
                                    margin:
                                        12px 0 8px;
                                    color:#fff;
                                "
                            >
                                ${carta.titulo}
                            </h3>


                            <p
                                style="
                                    font-size:.8rem;
                                    color:
                                        var(--text-muted);

                                    line-height:1.4;
                                "
                            >
                                ${carta.desc}
                            </p>

                        </div>


                        <strong
                            style="
                                color:
                                    var(--accent-green);

                                font-size:1.1rem;

                                margin-top:15px;

                                text-align:center;
                            "
                        >
                            +${carta.pts}
                            ${carta.attr.toUpperCase()}
                            ▲
                        </strong>

                    </div>

                `).join("")}

            </div>

        </div>

    `;


    // ==============================================
    // SELECCIÓN
    // ==============================================

    const cards =
        container.querySelectorAll(
            ".carta-box"
        );


    cards.forEach(card => {

        card.addEventListener(
            "mouseenter",
            () => {

                card.style.transform =
                    "translateY(-4px)";

                card.style.boxShadow =
                    "0 8px 30px rgba(255,0,0,.12)";

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


        card.addEventListener(
            "click",
            () => {

                const idx =
                    Number(
                        card.dataset.idx
                    );


                const elegida =
                    opciones[idx];


                if (!elegida) return;


                // ==================================
                // APLICAR MEJORA
                // ==================================

                gameState.mejorarAtributo(
                    elegida.attr,
                    elegida.pts
                );


                // ==================================
                // GUARDAR ELECCIÓN
                // ==================================

                gameState.player.pretemporada =
                    {

                        año:
                            gameState.player.año,

                        entrenamiento:
                            elegida.titulo,

                        atributo:
                            elegida.attr,

                        puntos:
                            elegida.pts

                    };


                // ==================================
                // GUARDAR PARTIDA
                // ==================================

                if (
                    typeof gameState.guardar ===
                    "function"
                ) {

                    gameState.guardar();

                }


                // ==================================
                // IR AL DASHBOARD
                // ==================================

                window.location.hash =
                    "#dashboard";

            }
        );

    });


    return container;

}


export default {

    render: renderPretemporada

};