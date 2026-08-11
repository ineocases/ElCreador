// ============================================================
// router.js
// ============================================================

import saveManager from "./engine/saveManager.js";

import * as createChannelScreen
    from "./screens/createChannel.js";

import * as dashboardScreen
    from "./screens/dashboard.js";

import * as publishVideoScreen
    from "./screens/publishVideo.js";

import * as videoResultScreen
    from "./screens/videoResult.js";

import * as storeScreen
    from "./screens/store.js";

import * as awardsScreen
    from "./screens/awards.js";

import * as collabsScreen
    from "./screens/collabs.js";

import * as sponsorsScreen
    from "./screens/sponsors.js";

import * as pasanCosasScreen
    from "./screens/pasanCosas.js";

import * as adminDashboardScreen
    from "./screens/admin/AdminDashboard.js";

import * as pretemporadaScreen
    from "./screens/pretemporada.js";


// ============================================================
// INICIAR ROUTER
// ============================================================

export function initRouter() {

    console.log("?? Router de El Creador inicializado");

    const hasSave =
        typeof saveManager?.loadLocal === "function"
            ? saveManager.loadLocal()
            : false;


    // Si no hay hash, decidir pantalla inicial
    if (!window.location.hash) {

        window.location.hash =
            hasSave
                ? "#dashboard"
                : "#createChannel";

        return;
    }


    // Escuchar navegación
    window.addEventListener(
        "hashchange",
        handleRoute
    );


    // Render inicial
    handleRoute();
}


// ============================================================
// ROUTER
// ============================================================

function handleRoute() {

    const hash =
        window.location.hash ||
        "#createChannel";


    console.log(
        "?? Navegando a:",
        hash
    );


    // Ocultar todas las pantallas
    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.style.display = "none";

        });


    switch (hash) {


        // ====================================================
        // CREAR CANAL
        // ====================================================

        case "#createChannel":

            renderScreen(
                "createChannelScreen",
                createChannelScreen
            );

            break;


        // ====================================================
        // PRETEMPORADA
        // ====================================================

        case "#pretemporada":

            renderScreen(
                "pretemporadaScreen",
                pretemporadaScreen
            );

            break;


        // ====================================================
        // DASHBOARD
        // ====================================================

        case "#dashboard":

            renderScreen(
                "dashboardScreen",
                dashboardScreen
            );

            break;


        // ====================================================
        // PUBLICAR VIDEO
        // ====================================================

        case "#publish":

            renderScreen(
                "publishScreen",
                publishVideoScreen
            );

            break;


        // ====================================================
        // RESULTADO VIDEO
        // ====================================================

        case "#videoResult":

            renderScreen(
                "resultScreen",
                videoResultScreen
            );

            break;


        // ====================================================
        // PASAN COSAS
        // ====================================================

        case "#pasanCosas":

            renderScreen(
                "pasanCosasScreen",
                pasanCosasScreen
            );

            break;


        // ====================================================
        // TIENDA
        // ====================================================

        case "#store":

            renderScreen(
                "storeScreen",
                storeScreen
            );

            break;


        // ====================================================
        // PREMIOS
        // ====================================================

        case "#awards":

            renderScreen(
                "awardsScreen",
                awardsScreen
            );

            break;


        // ====================================================
        // COLABORACIONES
        // ====================================================

        case "#collabs":

            renderScreen(
                "collabsScreen",
                collabsScreen
            );

            break;


        // ====================================================
        // SPONSORS
        // ====================================================

        case "#sponsors":

            renderScreen(
                "sponsorsScreen",
                sponsorsScreen
            );

            break;


        // ====================================================
        // ADMIN
        // ====================================================

        case "#admin":

            renderScreen(
                "adminContainer",
                adminDashboardScreen
            );

            break;


        // ====================================================
        // RUTA DESCONOCIDA
        // ====================================================

        default:

            console.warn(
                "?? Ruta desconocida:",
                hash
            );

            window.location.hash =
                "#createChannel";

            break;

    }

}


// ============================================================
// RENDER SCREEN
// ============================================================

function renderScreen(
    elementId,
    screenModule
) {

    const el =
        document.getElementById(
            elementId
        );


    if (!el) {

        console.error(
            `? No existe #${elementId} en index.html`
        );

        return;
    }


    if (!screenModule) {

        console.error(
            `? Módulo inexistente para #${elementId}`
        );

        return;
    }


    // Mostrar pantalla
    el.style.display = "block";


    // ========================================================
    // DEFAULT
    // ========================================================

    if (screenModule.default) {


        // default = función
        if (
            typeof screenModule.default ===
            "function"
        ) {

            const result =
                screenModule.default(el);


            if (
                result instanceof HTMLElement
            ) {

                el.innerHTML = "";

                el.appendChild(result);

            }

            return;
        }


        // default.render()
        if (
            typeof screenModule.default.render ===
            "function"
        ) {

            const result =
                screenModule.default.render(el);


            if (
                result instanceof HTMLElement
            ) {

                el.innerHTML = "";

                el.appendChild(result);

            }

            return;
        }

    }


    // ========================================================
    // render()
    // ========================================================

    if (
        typeof screenModule.render ===
        "function"
    ) {

        const result =
            screenModule.render(el);


        if (
            result instanceof HTMLElement
        ) {

            el.innerHTML = "";

            el.appendChild(result);

        }

        return;
    }


    // ========================================================
    // BUSCAR renderX()
    // ========================================================

    const renderFnKey =
        Object.keys(screenModule)
            .find(
                key =>
                    key.startsWith("render") &&
                    typeof screenModule[key] ===
                    "function"
            );


    if (renderFnKey) {

        const result =
            screenModule[renderFnKey](el);


        if (
            result instanceof HTMLElement
        ) {

            el.innerHTML = "";

            el.appendChild(result);

        }

        return;
    }


    console.error(
        `? El módulo de ${elementId} no tiene una función render válida.`,
        screenModule
    );
}