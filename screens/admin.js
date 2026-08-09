// screens/admin.js

import { db } from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { gameState } from "../engine/gameState.js";


export function renderAdmin(el) {

    const container =
        el ||
        document.getElementById(
            "adminContainer"
        );

    if (!container) return;


    container.innerHTML = `

        <div style="
            max-width:1100px;
            margin:20px auto;
            padding:20px;
            color:white;
        ">


            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:25px;
            ">

                <div>

                    <span style="
                        color:var(--accent-red);
                        font-size:.8rem;
                        font-weight:bold;
                    ">
                        ?? EL CREADOR
                    </span>

                    <h1 style="
                        margin:5px 0;
                        font-family:var(--font-heading);
                    ">
                        PANEL ADMINISTRADOR
                    </h1>

                    <p style="
                        color:var(--text-muted);
                    ">
                        Control¨¢ el mundo del juego.
                    </p>

                </div>


                <a
                    href="#dashboard"
                    style="
                        color:var(--text-muted);
                        text-decoration:none;
                    "
                >
                    ¡û Salir
                </a>

            </div>


            <!-- TABS -->

            <div style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
                margin-bottom:20px;
            ">

                <button
                    class="admin-tab"
                    data-tab="creators"
                >
                    ?? Creadores
                </button>

                <button
                    class="admin-tab"
                    data-tab="trends"
                >
                    ?? Tendencias
                </button>

                <button
                    class="admin-tab"
                    data-tab="events"
                >
                    ?? Eventos
                </button>

            </div>


            <!-- CONTENIDO -->

            <div id="adminContent"></div>

        </div>
    `;


    container
        .querySelectorAll(
            ".admin-tab"
        )
        .forEach(button => {

            button.style.cssText = `
                padding:12px 18px;
                background:#2f3640;
                color:white;
                border:none;
                border-radius:8px;
                cursor:pointer;
                font-weight:bold;
            `;

            button.addEventListener(
                "click",
                () => {

                    renderAdminTab(
                        container,
                        button.dataset.tab
                    );

                }
            );

        });


    renderAdminTab(
        container,
        "creators"
    );


    return container;
}


// ==========================================================
// TABS
// ==========================================================

function renderAdminTab(
    container,
    tab
) {

    const content =
        container.querySelector(
            "#adminContent"
        );


    if (!content) return;


    if (tab === "creators") {

        renderCreatorsAdmin(
            content
        );

        return;
    }


    if (tab === "trends") {

        renderTrendsAdmin(
            content
        );

        return;
    }


    if (tab === "events") {

        renderEventsAdmin(
            content
        );

        return;
    }

}


// ==========================================================
// CREADORES
// ==========================================================

function renderCreatorsAdmin(
    content
) {

    content.innerHTML = `

        <div style="
            background:var(--bg-card);
            border:var(--border-card);
            border-radius:14px;
            padding:25px;
        ">

            <h2>
                ?? Agregar creador
            </h2>


            <div style="
                display:grid;
                grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(200px,1fr)
                );
                gap:12px;
            ">

                <input
                    id="creatorName"
                    placeholder="Nombre"
                >

                <select id="creatorNiche">

                    <option>
                        Gaming
                    </option>

                    <option>
                        F¨²tbol
                    </option>

                    <option>
                        Vlog
                    </option>

                    <option>
                        Tecnolog¨ªa
                    </option>

                    <option>
                        Cocina
                    </option>

                    <option>
                        Periodismo
                    </option>

                </select>


                <input
                    id="creatorFollowers"
                    type="number"
                    placeholder="Seguidores"
                >


                <input
                    id="creatorPopularity"
                    type="number"
                    placeholder="Popularidad 0-100"
                >

            </div>


            <button
                id="btnCreateCreator"
                style="
                    margin-top:15px;
                    padding:12px 20px;
                    background:var(--accent-red);
                    color:white;
                    border:none;
                    border-radius:8px;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                + CREAR CREADOR
            </button>


            <hr style="
                margin:30px 0;
                border-color:
                rgba(255,255,255,.1);
            ">


            <h2>
                Creadores cargados
            </h2>


            <div id="creatorList">
                Cargando...
            </div>

        </div>
    `;


    content
        .querySelector(
            "#btnCreateCreator"
        )
        .addEventListener(
            "click",
            async () => {

                const nombre =
                    content.querySelector(
                        "#creatorName"
                    ).value.trim();


                const nicho =
                    content.querySelector(
                        "#creatorNiche"
                    ).value;


                const seguidores =
                    Number(
                        content.querySelector(
                            "#creatorFollowers"
                        ).value
                    ) || 0;


                const popularidad =
                    Number(
                        content.querySelector(
                            "#creatorPopularity"
                        ).value
                    ) || 50;


                if (!nombre) {

                    alert(
                        "Ingres¨¢ un nombre."
                    );

                    return;
                }


                const creator = {

                    nombre,

                    nicho,

                    seguidores,

                    popularidad:

                        Math.max(
                            0,
                            Math.min(
                                100,
                                popularidad
                            )
                        ),

                    relacion: 0,

                    respeto: 0,

                    rivalidad: 0,

                    colaboraciones: 0,

                    activo: true,

                    createdAt:
                        new Date()
                };


                try {

                    const ref =
                        await addDoc(
                            collection(
                                db,
                                "gameData",
                                "global",
                                "creators"
                            ),
                            creator
                        );


                    creator.id =
                        ref.id;


                    gameState.creators.push(
                        creator
                    );


                    alert(
                        `? ${nombre} fue agregado al mundo.`
                    );


                    renderCreatorsAdmin(
                        content
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "? No se pudo crear el creador."
                    );
                }

            }
        );


    cargarCreadores(
        content
    );
}


// ==========================================================
// CARGAR CREADORES
// ==========================================================

async function cargarCreadores(
    content
) {

    const list =
        content.querySelector(
            "#creatorList"
        );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "gameData",
                    "global",
                    "creators"
                )
            );


        const creators =
            snapshot.docs.map(
                item => ({

                    id: item.id,

                    ...item.data()
                })
            );


        if (
            creators.length === 0
        ) {

            list.innerHTML = `
                <p style="
                    color:var(--text-muted);
                ">
                    No hay creadores
                    personalizados todav¨ªa.
                </p>
            `;

            return;
        }


        list.innerHTML =
            creators.map(
                creator => `

                    <div style="
                        display:flex;
                        justify-content:
                        space-between;
                        align-items:center;
                        gap:15px;
                        padding:15px;
                        margin-top:10px;
                        background:
                        rgba(255,255,255,.04);
                        border-radius:10px;
                    ">

                        <div>

                            <strong>
                                ${creator.nombre}
                            </strong>

                            <div style="
                                color:
                                var(--text-muted);
                                font-size:.85rem;
                            ">

                                ${creator.nicho}
                                ¡¤
                                ${Number(
                                    creator.seguidores || 0
                                ).toLocaleString()}
                                seguidores

                            </div>

                        </div>


                        <button
                            class="delete-creator"
                            data-id="${creator.id}"
                            style="
                                background:
                                #c23616;
                                color:white;
                                border:none;
                                padding:8px 12px;
                                border-radius:6px;
                                cursor:pointer;
                            "
                        >
                            Eliminar
                        </button>

                    </div>

                `
            ).join("");


        list
            .querySelectorAll(
                ".delete-creator"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        if (
                            !confirm(
                                "?Eliminar este creador?"
                            )
                        ) {
                            return;
                        }


                        try {

                            await deleteDoc(
                                doc(
                                    db,
                                    "gameData",
                                    "global",
                                    "creators",
                                    button.dataset.id
                                )
                            );


                            alert(
                                "Creador eliminado."
                            );


                            renderCreatorsAdmin(
                                content
                            );

                        } catch (error) {

                            console.error(
                                error
                            );

                            alert(
                                "No se pudo eliminar."
                            );
                        }

                    }
                );

            });

    } catch (error) {

        console.error(
            error
        );

        list.innerHTML = `
            <p style="color:#e84118;">
                Error cargando creadores.
            </p>
        `;
    }
}


// ==========================================================
// TENDENCIAS
// ==========================================================

function renderTrendsAdmin(
    content
) {

    content.innerHTML = `

        <div style="
            background:var(--bg-card);
            border:var(--border-card);
            border-radius:14px;
            padding:25px;
        ">

            <h2>
                ?? Crear tendencia
            </h2>


            <input
                id="trendName"
                placeholder="Nombre de la tendencia"
            >


            <select id="trendNiche">

                <option>
                    Todos
                </option>

                <option>
                    Gaming
                </option>

                <option>
                    F¨²tbol
                </option>

                <option>
                    Vlog
                </option>

                <option>
                    Tecnolog¨ªa
                </option>

                <option>
                    Cocina
                </option>

                <option>
                    Periodismo
                </option>

            </select>


            <input
                id="trendMultiplier"
                type="number"
                step="0.1"
                value="1.5"
                placeholder="Multiplicador"
            >


            <button
                id="btnCreateTrend"
                style="
                    margin-top:15px;
                    padding:12px 20px;
                    background:var(--accent-red);
                    color:white;
                    border:none;
                    border-radius:8px;
                    cursor:pointer;
                    font-weight:bold;
                "
            >
                + CREAR TENDENCIA
            </button>

        </div>
    `;


    content
        .querySelector(
            "#btnCreateTrend"
        )
        .addEventListener(
            "click",
            async () => {

                const nombre =
                    content.querySelector(
                        "#trendName"
                    ).value.trim();


                const nicho =
                    content.querySelector(
                        "#trendNiche"
                    ).value;


                const multiplicador =
                    Number(
                        content.querySelector(
                            "#trendMultiplier"
                        ).value
                    ) || 1;


                if (!nombre) {

                    alert(
                        "Ingres¨¢ un nombre."
                    );

                    return;
                }


                const tendencia = {

                    nombre,

                    nicho,

                    multiplicador,

                    activa: true,

                    createdAt:
                        new Date()
                };


                try {

                    await addDoc(
                        collection(
                            db,
                            "gameData",
                            "global",
                            "trends"
                        ),
                        tendencia
                    );


                    gameState.trends.push(
                        tendencia
                    );


                    alert(
                        "?? Tendencia creada."
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "No se pudo crear la tendencia."
                    );
                }

            }
        );
}


// ==========================================================
// EVENTOS
// ==========================================================

function renderEventsAdmin(
    content
) {

    content.innerHTML = `

        <div style="
            background:var(--bg-card);
            border:var(--border-card);
            border-radius:14px;
            padding:25px;
        ">

            <h2>
                ?? Crear evento
            </h2>


            <input
                id="eventTitle"
                placeholder="T¨ªtulo"
            >


            <textarea
                id="eventDescription"
                placeholder="Descripci¨®n"
                rows="4"
            ></textarea>


            <input
                id="eventOptionA"
                placeholder="Opci¨®n segura"
            >


            <input
                id="eventOptionB"
                placeholder="Opci¨®n arriesgada"
            >


            <button
                id="btnCreateEvent"
                style="
                    margin-top:15px;
                    padding:12px 20px;
                    background:var(--accent-red);
                    color:white;
                    border:none;
                    border-radius:8px;
                    cursor:pointer;
                    font-weight:bold;
                "
            >
                + CREAR EVENTO
            </button>

        </div>
    `;


    content
        .querySelector(
            "#btnCreateEvent"
        )
        .addEventListener(
            "click",
            async () => {

                const titulo =
                    content.querySelector(
                        "#eventTitle"
                    ).value.trim();


                const descripcion =
                    content.querySelector(
                        "#eventDescription"
                    ).value.trim();


                const opcionA =
                    content.querySelector(
                        "#eventOptionA"
                    ).value.trim();


                const opcionB =
                    content.querySelector(
                        "#eventOptionB"
                    ).value.trim();


                if (!titulo) {

                    alert(
                        "El evento necesita t¨ªtulo."
                    );

                    return;
                }


                const evento = {

                    titulo,

                    descripcion,

                    opcionA,

                    opcionB,

                    activo: true,

                    createdAt:
                        new Date()
                };


                try {

                    await addDoc(
                        collection(
                            db,
                            "gameData",
                            "global",
                            "events"
                        ),
                        evento
                    );


                    alert(
                        "?? Evento creado."
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "No se pudo crear el evento."
                    );
                }

            }
        );
}


export const adminScreen = {

    render:
        renderAdmin

};


export default adminScreen;