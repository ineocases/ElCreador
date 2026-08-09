// screens/videoResult.js

import { gameState } from '../engine/gameState.js';
import { renderHeaderHud } from '../components/HeaderHud.js';


export function renderVideoResult(el) {

    const container =
        el ||
        document.getElementById(
            'resultScreen'
        );

    if (!container) return;


    const res =
        gameState.lastVideoResult;


    const evento =
        gameState.ultimoEventoResultado;


    // --------------------------------------------------
    // Si venimos de un evento
    // --------------------------------------------------

    if (
        !res &&
        evento
    ) {

        container.innerHTML = `

            ${renderHeaderHud()}

            <div style="
                max-width:700px;
                margin:30px auto;
                padding:25px;
                color:#fff;
            ">

                <div style="
                    background:var(--bg-card);
                    border:var(--border-card);
                    border-radius:16px;
                    padding:30px;
                    text-align:center;
                ">

                    <div style="
                        font-size:3rem;
                        margin-bottom:15px;
                    ">
                        ⚡
                    </div>

                    <h1 style="
                        font-family:var(--font-heading);
                        margin:0 0 15px;
                    ">
                        PASARON COSAS
                    </h1>

                    <p style="
                        color:var(--text-muted);
                        font-size:1rem;
                        line-height:1.6;
                    ">
                        ${evento}
                    </p>

                    <a
                        href="#dashboard"
                        style="
                            display:inline-block;
                            margin-top:20px;
                            padding:14px 28px;
                            background:var(--accent-red);
                            color:white;
                            text-decoration:none;
                            border-radius:8px;
                            font-weight:bold;
                        "
                    >
                        CONTINUAR ▶
                    </a>

                </div>

            </div>
        `;

        return container;
    }


    // --------------------------------------------------
    // Si no hay resultado
    // --------------------------------------------------

    if (!res) {

        container.innerHTML = `

            ${renderHeaderHud()}

            <div style="
                max-width:700px;
                margin:40px auto;
                text-align:center;
                color:#fff;
            ">

                <h2>
                    No hay resultado disponible.
                </h2>

                <a href="#dashboard">
                    Volver al Dashboard
                </a>

            </div>
        `;

        return container;
    }


    // --------------------------------------------------
    // DATOS
    // --------------------------------------------------

    const vistas =
        Number(res.vistas) || 0;

    const subs =
        Number(res.suscriptores) || 0;

    const dinero =
        Number(res.dinero) || 0;

    const fama =
        Number(res.famaGanada) || 0;

    const viral =
        Boolean(res.viral);


    let tituloRendimiento =
        "NORMAL";


    if (
        res.nivelViralidad ===
        "fenomeno"
    ) {

        tituloRendimiento =
            "🌎 FENÓMENO";

    } else if (
        res.nivelViralidad ===
        "mega_viral"
    ) {

        tituloRendimiento =
            "🚀 MEGA VIRAL";

    } else if (viral) {

        tituloRendimiento =
            "🔥 VIRAL";

    } else if (vistas >= 10000) {

        tituloRendimiento =
            "📈 EXCELENTE";

    } else if (vistas >= 3000) {

        tituloRendimiento =
            "👍 BUENO";
    }


    container.innerHTML = `

        ${renderHeaderHud()}

        <div style="
            max-width:760px;
            margin:25px auto;
            padding:20px;
            color:#fff;
        ">


            ${
                viral
                    ? `
                    <div style="
                        background:
                        linear-gradient(
                            135deg,
                            rgba(255,69,0,.25),
                            rgba(255,215,0,.15)
                        );

                        border:
                        2px solid
                        var(--accent-yellow,#ffd700);

                        border-radius:16px;

                        padding:25px;

                        text-align:center;

                        margin-bottom:20px;
                    ">

                        <div style="
                            font-size:2.5rem;
                        ">
                            🔥🔥🔥
                        </div>

                        <h2 style="
                            margin:8px 0;
                            font-family:var(--font-heading);
                        ">
                            ¡EL VIDEO SE HIZO VIRAL!
                        </h2>

                        <p style="
                            color:#ddd;
                            margin:0;
                        ">
                            El algoritmo empezó a
                            recomendar tu contenido.
                        </p>

                    </div>
                    `
                    : ""
            }


            <div style="
                background:var(--bg-card);
                border:var(--border-card);
                border-radius:16px;
                padding:30px;
            ">


                <span style="
                    color:var(--accent-red);
                    font-size:.8rem;
                    font-weight:bold;
                    text-transform:uppercase;
                ">
                    📹 RESULTADO DEL VIDEO
                </span>


                <h1 style="
                    font-family:var(--font-heading);
                    margin:8px 0;
                ">
                    ${res.titulo}
                </h1>


                <div style="
                    color:var(--accent-green);
                    font-weight:bold;
                    margin-bottom:25px;
                ">
                    ${tituloRendimiento}
                </div>


                <div style="
                    display:grid;
                    grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(150px,1fr)
                    );
                    gap:15px;
                ">


                    <div style="
                        background:rgba(0,0,0,.5);
                        padding:18px;
                        border-radius:10px;
                    ">

                        <div style="
                            color:var(--text-muted);
                            font-size:.75rem;
                        ">
                            VISTAS
                        </div>

                        <strong style="
                            display:block;
                            margin-top:5px;
                            font-size:1.6rem;
                        ">
                            +${vistas.toLocaleString()}
                        </strong>

                    </div>


                    <div style="
                        background:rgba(0,0,0,.5);
                        padding:18px;
                        border-radius:10px;
                    ">

                        <div style="
                            color:var(--text-muted);
                            font-size:.75rem;
                        ">
                            SUSCRIPTORES
                        </div>

                        <strong style="
                            display:block;
                            margin-top:5px;
                            font-size:1.6rem;
                            color:#4cd137;
                        ">
                            +${subs.toLocaleString()}
                        </strong>

                    </div>


                    <div style="
                        background:rgba(0,0,0,.5);
                        padding:18px;
                        border-radius:10px;
                    ">

                        <div style="
                            color:var(--text-muted);
                            font-size:.75rem;
                        ">
                            INGRESOS
                        </div>

                        <strong style="
                            display:block;
                            margin-top:5px;
                            font-size:1.6rem;
                            color:#fbc531;
                        ">
                            +$${dinero.toLocaleString()}
                        </strong>

                    </div>


                    <div style="
                        background:rgba(0,0,0,.5);
                        padding:18px;
                        border-radius:10px;
                    ">

                        <div style="
                            color:var(--text-muted);
                            font-size:.75rem;
                        ">
                            FAMA
                        </div>

                        <strong style="
                            display:block;
                            margin-top:5px;
                            font-size:1.6rem;
                            color:#ffd700;
                        ">
                            +${fama}
                        </strong>

                    </div>


                </div>


                ${
                    res.multiplicadorTendencia > 1
                        ? `
                        <div style="
                            margin-top:20px;
                            padding:14px;
                            border-radius:10px;
                            background:
                            rgba(67,209,122,.1);
                            border:
                            1px solid #43d17a;
                        ">
                            📈 Tu video se benefició
                            de una tendencia activa.
                            <strong>
                                x${res.multiplicadorTendencia}
                            </strong>
                        </div>
                        `
                        : ""
                }


                <div style="
                    margin-top:25px;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                    flex-wrap:wrap;
                ">

                    <div style="
                        color:var(--text-muted);
                        font-size:.85rem;
                    ">
                        Potencia del video:
                        <strong style="color:white;">
                            ${res.potencia}
                        </strong>
                    </div>


                    <a
                        href="#pasanCosas"
                        style="
                            padding:14px 28px;
                            background:var(--accent-red);
                            color:white;
                            text-decoration:none;
                            border-radius:8px;
                            font-weight:bold;
                            font-family:var(--font-heading);
                        "
                    >
                        CONTINUAR ▶
                    </a>

                </div>

            </div>

        </div>
    `;


    return container;
}


export const videoResultScreen = {

    render: renderVideoResult

};


export default videoResultScreen;