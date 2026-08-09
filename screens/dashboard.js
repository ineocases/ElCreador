// screens/dashboard.js

import { gameState } from "../engine/gameState.js";


// ==================================================
// DASHBOARD
// ==================================================

export function renderDashboard(el) {

    const container =
        el ||
        document.getElementById(
            "dashboardScreen"
        );

    if (!container) return;


    const player =
        gameState.player;


    // ==================================================
    // COMPATIBILIDAD CON PARTIDAS VIEJAS
    // ==================================================

    if (!player.atributos) {

        player.atributos = {

            edicion: 10,
            carisma: 15,
            algoritmo: 10,
            marketing: 5,
            constancia: 15,

            humor: 10,
            creatividad: 12,
            networking: 5

        };

    }


    /*
     * Si la partida vieja tiene atributos pero
     * le faltan los nuevos, los agregamos.
     */

    if (
        player.atributos.humor === undefined
    ) {
        player.atributos.humor = 10;
    }

    if (
        player.atributos.creatividad === undefined
    ) {
        player.atributos.creatividad = 12;
    }

    if (
        player.atributos.networking === undefined
    ) {
        player.atributos.networking = 5;
    }


    // ==================================================
    // PRETEMPORADA
    // ==================================================

    /*
     * Una partida nueva todavía no tiene
     * una elección de pretemporada.
     *
     * No mandamos automáticamente al jugador desde
     * acá porque podría provocar problemas al renderizar.
     *
     * En cambio mostramos el botón correspondiente.
     */

    const hizoPretemporada =
        !!player.pretemporada;


    // ==================================================
    // DATOS
    // ==================================================

    const dinero =
        Number(player.dinero) || 0;

    const suscriptores =
        Number(player.suscriptores) || 0;

    const vistas =
        Number(player.vistasTotales) || 0;

    const videos =
        Number(player.videosSubidos) || 0;

    const fama =
        Number(player.fama) || 0;

    const comunidad =
        Number(player.comunidad) || 0;

    const reputacion =
        Number(player.reputacion) || 0;


    // ==================================================
    // HTML
    // ==================================================

    container.innerHTML = `

        <div
            style="
                padding:20px;
                max-width:1000px;
                margin:0 auto;
                color:#fff;
            "
        >


            <!-- ======================================
                 HEADER
            ======================================= -->

            <header
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;

                    gap:20px;

                    background:
                        var(--bg-card);

                    padding:20px 25px;

                    border-radius:12px;

                    border:
                        var(--border-card);

                    margin-bottom:25px;
                "
            >

                <div>

                    <h1
                        style="
                            margin:0;

                            font-size:2rem;

                            font-family:
                                var(--font-heading);

                            color:
                                var(--accent-red);

                            text-transform:
                                uppercase;
                        "
                    >
                        ${player.canal || "Mi Canal"}
                    </h1>


                    <p
                        style="
                            margin:5px 0 0;

                            color:
                                var(--text-muted);

                            font-size:.95rem;
                        "
                    >
                        Creador:

                        <strong>
                            ${player.nombre || "Desconocido"}
                        </strong>

                        |

                        Nicho:

                        <strong>
                            ${player.niche || "General"}
                        </strong>
                    </p>

                </div>


                <div
                    style="
                        text-align:right;
                    "
                >

                    <div
                        style="
                            font-size:1.5rem;
                            font-weight:bold;
                            color:#4cd137;
                        "
                    >
                        $${dinero.toLocaleString()}
                    </div>


                    <div
                        style="
                            color:
                                var(--text-muted);

                            font-size:.85rem;

                            margin-top:4px;
                        "
                    >
                        Año ${player.año || 2026}

                        •

                        Trimestre
                        ${player.trimestre || 1}
                        / 2
                    </div>

                </div>

            </header>


            <!-- ======================================
                 PRETEMPORADA
            ======================================= -->

            ${
                !hizoPretemporada
                    ? `

                    <div
                        style="
                            background:
                                linear-gradient(
                                    135deg,
                                    rgba(220,38,38,.18),
                                    rgba(0,0,0,.35)
                                );

                            border:
                                1px solid
                                var(--accent-red);

                            border-radius:12px;

                            padding:22px;

                            margin-bottom:25px;
                        "
                    >

                        <div
                            style="
                                font-size:.75rem;
                                color:
                                    var(--accent-red);

                                font-weight:bold;

                                text-transform:
                                    uppercase;

                                margin-bottom:6px;
                            "
                        >
                            ⚡ Antes de comenzar
                        </div>


                        <h2
                            style="
                                margin:
                                    0 0 8px;

                                font-family:
                                    var(--font-heading);
                            "
                        >
                            Tu carrera todavía no empezó
                        </h2>


                        <p
                            style="
                                margin:
                                    0 0 18px;

                                color:
                                    var(--text-muted);

                                line-height:1.5;
                            "
                        >
                            Antes de arrancar tu primer
                            trimestre tenés que elegir
                            cómo vas a preparar a tu creador.
                        </p>


                        <a
                            href="#pretemporada"

                            style="
                                display:inline-block;

                                padding:
                                    13px 22px;

                                background:
                                    var(--accent-red);

                                color:#fff;

                                text-decoration:none;

                                border-radius:8px;

                                font-weight:bold;

                                text-transform:
                                    uppercase;

                                font-family:
                                    var(--font-heading);
                            "
                        >
                            ⚡ Hacer pretemporada
                        </a>

                    </div>

                    `
                    : `
                    <div
                        style="
                            background:
                                rgba(76,209,55,.08);

                            border:
                                1px solid
                                rgba(76,209,55,.3);

                            border-radius:12px;

                            padding:15px 18px;

                            margin-bottom:25px;
                        "
                    >

                        <strong>
                            ✅ Pretemporada completada
                        </strong>

                        <div
                            style="
                                color:
                                    var(--text-muted);

                                font-size:.85rem;

                                margin-top:4px;
                            "
                        >
                            ${player.pretemporada.entrenamiento}
                        </div>

                    </div>
                    `
            }


            <!-- ======================================
                 ESTADÍSTICAS
            ======================================= -->

            <div
                style="
                    display:grid;

                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(180px,1fr)
                        );

                    gap:15px;

                    margin-bottom:20px;
                "
            >

                <!-- SUSCRIPTORES -->

                <div
                    style="
                        background:
                            var(--bg-card);

                        padding:15px;

                        border-radius:10px;

                        border:
                            var(--border-subtle);

                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:.8rem;
                            color:
                                var(--text-muted);

                            text-transform:
                                uppercase;
                        "
                    >
                        Suscriptores
                    </div>


                    <div
                        style="
                            font-size:1.6rem;
                            font-weight:bold;
                            margin-top:5px;
                        "
                    >
                        ${suscriptores.toLocaleString()}
                    </div>

                </div>


                <!-- VISTAS -->

                <div
                    style="
                        background:
                            var(--bg-card);

                        padding:15px;

                        border-radius:10px;

                        border:
                            var(--border-subtle);

                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:.8rem;
                            color:
                                var(--text-muted);

                            text-transform:
                                uppercase;
                        "
                    >
                        Vistas Totales
                    </div>


                    <div
                        style="
                            font-size:1.6rem;
                            font-weight:bold;
                            margin-top:5px;
                        "
                    >
                        ${vistas.toLocaleString()}
                    </div>

                </div>


                <!-- VIDEOS -->

                <div
                    style="
                        background:
                            var(--bg-card);

                        padding:15px;

                        border-radius:10px;

                        border:
                            var(--border-subtle);

                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:.8rem;
                            color:
                                var(--text-muted);

                            text-transform:
                                uppercase;
                        "
                    >
                        Videos
                    </div>


                    <div
                        style="
                            font-size:1.6rem;
                            font-weight:bold;
                            margin-top:5px;
                        "
                    >
                        ${videos}
                    </div>

                </div>


                <!-- FAMA -->

                <div
                    style="
                        background:
                            var(--bg-card);

                        padding:15px;

                        border-radius:10px;

                        border:
                            var(--border-subtle);

                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:.8rem;
                            color:
                                var(--text-muted);

                            text-transform:
                                uppercase;
                        "
                    >
                        Fama
                    </div>


                    <div
                        style="
                            font-size:1.6rem;
                            font-weight:bold;
                            margin-top:5px;
                        "
                    >
                        ${fama}
                    </div>

                </div>


                <!-- COMUNIDAD -->

                <div
                    style="
                        background:
                            var(--bg-card);

                        padding:15px;

                        border-radius:10px;

                        border:
                            var(--border-subtle);

                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:.8rem;
                            color:
                                var(--text-muted);

                            text-transform:
                                uppercase;
                        "
                    >
                        Comunidad
                    </div>


                    <div
                        style="
                            font-size:1.6rem;
                            font-weight:bold;
                            margin-top:5px;
                        "
                    >
                        ${comunidad}
                    </div>

                </div>


                <!-- REPUTACIÓN -->

                <div
                    style="
                        background:
                            var(--bg-card);

                        padding:15px;

                        border-radius:10px;

                        border:
                            var(--border-subtle);

                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:.8rem;
                            color:
                                var(--text-muted);

                            text-transform:
                                uppercase;
                        "
                    >
                        Reputación
                    </div>


                    <div
                        style="
                            font-size:1.6rem;
                            font-weight:bold;
                            margin-top:5px;
                        "
                    >
                        ${reputacion}
                    </div>

                </div>

            </div>


            <!-- ======================================
                 HABILIDADES
            ======================================= -->

            <div
                style="
                    background:
                        var(--bg-card);

                    padding:20px;

                    border-radius:10px;

                    border:
                        var(--border-subtle);

                    margin-bottom:30px;
                "
            >

                <h3
                    style="
                        margin-top:0;

                        color:
                            var(--text-muted);

                        font-size:1rem;

                        text-transform:
                            uppercase;
                    "
                >
                    Mis habilidades
                </h3>


                <div
                    style="
                        display:flex;

                        flex-wrap:wrap;

                        gap:10px;
                    "
                >

                    <span class="skill-pill">
                        ✂️ Edición:
                        <strong>
                            ${player.atributos.edicion}
                        </strong>
                    </span>


                    <span class="skill-pill">
                        😎 Carisma:
                        <strong>
                            ${player.atributos.carisma}
                        </strong>
                    </span>


                    <span class="skill-pill">
                        🤖 Algoritmo:
                        <strong>
                            ${player.atributos.algoritmo}
                        </strong>
                    </span>


                    <span class="skill-pill">
                        📈 Marketing:
                        <strong>
                            ${player.atributos.marketing}
                        </strong>
                    </span>


                    <span class="skill-pill">
                        🔥 Constancia:
                        <strong>
                            ${player.atributos.constancia}
                        </strong>
                    </span>


                    <span class="skill-pill">
                        😂 Humor:
                        <strong>
                            ${player.atributos.humor}
                        </strong>
                    </span>


                    <span class="skill-pill">
                        💡 Creatividad:
                        <strong>
                            ${player.atributos.creatividad}
                        </strong>
                    </span>


                    <span class="skill-pill">
                        🤝 Networking:
                        <strong>
                            ${player.atributos.networking}
                        </strong>
                    </span>

                </div>

            </div>


            <!-- ======================================
                 NAVEGACIÓN
            ======================================= -->

            <nav
                style="
                    display:flex;

                    gap:15px;

                    flex-wrap:wrap;

                    justify-content:center;
                "
            >

                <a
                    href="#publish"

                    style="
                        padding:14px 28px;

                        background:
                            var(--accent-red);

                        color:white;

                        text-decoration:none;

                        border-radius:8px;

                        font-weight:bold;

                        font-family:
                            var(--font-heading);

                        text-transform:
                            uppercase;

                        letter-spacing:1px;
                    "
                >
                    📹 Publicar Video
                </a>


                <a
                    href="#store"

                    style="
                        padding:14px 28px;

                        background:#2f3640;

                        color:white;

                        text-decoration:none;

                        border-radius:8px;

                        font-weight:bold;

                        font-family:
                            var(--font-heading);

                        text-transform:
                            uppercase;

                        letter-spacing:1px;
                    "
                >
                    🛒 Tienda
                </a>


                <a
                    href="#collabs"

                    style="
                        padding:14px 28px;

                        background:#2f3640;

                        color:white;

                        text-decoration:none;

                        border-radius:8px;

                        font-weight:bold;

                        font-family:
                            var(--font-heading);

                        text-transform:
                            uppercase;

                        letter-spacing:1px;
                    "
                >
                    🤝 Colabs
                </a>


                <a
                    href="#sponsors"

                    style="
                        padding:14px 28px;

                        background:#2f3640;

                        color:white;

                        text-decoration:none;

                        border-radius:8px;

                        font-weight:bold;

                        font-family:
                            var(--font-heading);

                        text-transform:
                            uppercase;

                        letter-spacing:1px;
                    "
                >
                    💼 Sponsors
                </a>


                <a
                    href="#awards"

                    style="
                        padding:14px 28px;

                        background:#2f3640;

                        color:white;

                        text-decoration:none;

                        border-radius:8px;

                        font-weight:bold;

                        font-family:
                            var(--font-heading);

                        text-transform:
                            uppercase;

                        letter-spacing:1px;
                    "
                >
                    🏆 Premios
                </a>


                <a
                    href="#timeline"

                    style="
                        padding:14px 28px;

                        background:#2f3640;

                        color:white;

                        text-decoration:none;

                        border-radius:8px;

                        font-weight:bold;

                        font-family:
                            var(--font-heading);

                        text-transform:
                            uppercase;

                        letter-spacing:1px;
                    "
                >
                    📅 Historia
                </a>
				<a
					href="#admin"
					style="
						padding:14px 28px;
						background:#111;
						color:#ffd700;
						text-decoration:none;
						border-radius:8px;
						font-weight:bold;
						font-family:var(--font-heading);
						text-transform:uppercase;
						border:1px solid #ffd700;
					"
				>
					⚙️ Admin
				</a>
            </nav>

        </div>

    `;


    return container;

}


// ==================================================
// COMPATIBILIDAD
// ==================================================

export const dashboardScreen = {

    render: renderDashboard

};


export default dashboardScreen;