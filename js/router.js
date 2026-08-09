// router.js

import saveManager from "./engine/saveManager.js";

import * as createChannelScreen
    from "./screens/createChannel.js";

import * as dashboardScreen
    from "./screens/dashboard.js";

import * as pretemporadaScreen
    from "./screens/pretemporada.js";

import * as publishVideoScreen
    from "./screens/publishVideo.js";

import * as videoResultScreen
    from "./screens/videoResult.js";

import * as storeScreen
    from "./screens/store.js";

import * as awardsScreen
    from "./screens/awards.js";

import * as adminDashboardScreen
    from "./screens/admin/AdminDashboard.js";

import * as collabsScreen
    from "./screens/collabs.js";

import * as sponsorsScreen
    from "./screens/sponsors.js";

import * as pasanCosasScreen
    from "./screens/pasanCosas.js";


// ============================================================
// INICIAR ROUTER
// ============================================================

export function initRouter() {

    console.log(
        "🚀 Router de El Creador inicializado"
    );


    // Intentar cargar partida
    let hasSave = false;

    try {

        hasSave =
            !!saveManager.loadLocal();

    } catch (error) {

        console.warn(
            "⚠️ No se pudo cargar la partida:",
            error
        );

        hasSave = false;

    }


    // ========================================================
    // RUTA INICIAL
    // ========================================================

    if (!window.location.hash) {

        window.location.hash =
            hasSave
                ? "#dashboard"
                : "#createChannel";

    }


    // ========================================================
    // ESCUCHAR CAMBIOS
    // ========================================================

    window.addEventListener(
        "hashchange",
        handleRoute
    );


    // Render inicial
    handleRoute();

}


// ============================================================
// MANEJAR RUTA
// ============================================================

function handleRoute() {

    const hash =
        window.location.hash ||
        "#createChannel";


    console.log(
        "📍 Ruta:",
        hash
    );


    // ========================================================
    // OCULTAR TODAS LAS PANTALLAS
    // ========================================================

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.style.display = "none";

        });


    // ========================================================
    // ROUTER
    // ========================================================

    switch (hash) {


        // ----------------------------------------------------
        // CREAR CANAL
        // ----------------------------------------------------

        case "#createChannel":

            renderScreen(
                "createChannelScreen",
                createChannelScreen
            );

            break;


        // ----------------------------------------------------
        // PRETEMPORADA
        // ----------------------------------------------------

        case "#pretemporada":

            renderScreen(
                "pretemporadaScreen",
                pretemporadaScreen
            );

            break;


        // ----------------------------------------------------
        // DASHBOARD
        // ----------------------------------------------------

        case "#dashboard":

            renderScreen(
                "dashboardScreen",
                dashboardScreen
            );

            break;


        // ----------------------------------------------------
        // PUBLICAR VIDEO
        // ----------------------------------------------------

        case "#publish":

            renderScreen(
                "publishScreen",
                publishVideoScreen
            );

            break;


        // ----------------------------------------------------
        // RESULTADO VIDEO
        // ----------------------------------------------------

        case "#videoResult":

            renderScreen(
                "resultScreen",
                videoResultScreen
            );

            break;


        // ----------------------------------------------------
        // PASAN COSAS
        // ----------------------------------------------------

        case "#pasanCosas":

            renderScreen(
                "pasanCosasScreen",
                pasanCosasScreen
            );

            break;


        // ----------------------------------------------------
        // TIENDA
        // ----------------------------------------------------

        case "#store":

            renderScreen(
                "storeScreen",
                storeScreen
            );

            break;


        // ----------------------------------------------------
        // PREMIOS
        // ----------------------------------------------------

        case "#awards":

            renderScreen(
                "awardsScreen",
                awardsScreen
            );

            break;


        // ----------------------------------------------------
        // COLABORACIONES
        // ----------------------------------------------------

        case "#collabs":

            renderScreen(
                "collabsScreen",
                collabsScreen
            );

            break;


        // ----------------------------------------------------
        // SPONSORS
        // ----------------------------------------------------

        case "#sponsors":

            renderScreen(
                "sponsorsScreen",
                sponsorsScreen
            );

            break;


        // ----------------------------------------------------
        // ADMIN
        // ----------------------------------------------------

        case "#admin":

            renderScreen(
                "adminDashboardScreen",
                adminDashboardScreen
            );

            break;


        // ----------------------------------------------------
        // RUTA DESCONOCIDA
        // ----------------------------------------------------

        default:

            console.warn(
                "⚠️ Ruta desconocida:",
                hash
            );

            window.location.hash =
                "#dashboard";

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
            `❌ No existe el contenedor #${elementId}`
        );

        return;

    }


    if (!screenModule) {

        console.error(
            `❌ No existe el módulo para #${elementId}`
        );

        return;

    }


    // Mostrar
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


            procesarResultado(
                el,
                result
            );

            return;

        }


        // default = objeto con render
        if (
            typeof screenModule.default.render ===
            "function"
        ) {

            const result =
                screenModule.default.render(el);


            procesarResultado(
                el,
                result
            );

            return;

        }

    }


    // ========================================================
    // EXPORT render()
    // ========================================================

    if (
        typeof screenModule.render ===
        "function"
    ) {

        const result =
            screenModule.render(el);


        procesarResultado(
            el,
            result
        );

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
            screenModule[
                renderFnKey
            ](el);


        procesarResultado(
            el,
            result
        );

        return;

    }


    console.error(
        `❌ El módulo de #${elementId} no tiene una función render válida`
    );

}


// ============================================================
// PROCESAR RESULTADO
// ============================================================

function procesarResultado(
    el,
    result
) {

    if (
        result instanceof HTMLElement &&
        result !== el
    ) {

        el.innerHTML = "";

        el.appendChild(
            result
        );

    }

}
