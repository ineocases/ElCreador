// js/router.js

import saveManager from "../engine/saveManager.js";

import * as createChannelScreen
    from "../screens/createChannel.js";

import * as dashboardScreen
    from "../screens/dashboard.js";

import * as pretemporadaScreen
    from "../screens/pretemporada.js";

import * as publishVideoScreen
    from "../screens/publishVideo.js";

import * as videoResultScreen
    from "../screens/videoResult.js";

import * as pasanCosasScreen
    from "../screens/pasanCosas.js";

import * as storeScreen
    from "../screens/store.js";

import * as awardsScreen
    from "../screens/awards.js";

import * as collabsScreen
    from "../screens/collabs.js";

import * as sponsorsScreen
    from "../screens/sponsors.js";

import * as timelineScreen
    from "../screens/timeline.js";

import * as adminDashboardScreen
    from "../screens/admin/AdminDashboard.js";


// ==================================================
// INICIAR ROUTER
// ==================================================

export function initRouter() {

    console.log(
        "🚀 Router de 'El Creador' inicializado"
    );


    let hasSave = false;

    try {

        hasSave =
            typeof saveManager.loadLocal === "function"
                ? !!saveManager.loadLocal()
                : false;

    } catch (error) {

        console.warn(
            "No se pudo cargar la partida:",
            error
        );

    }


    /*
     * Si no existe una partida:
     *
     * Crear canal
     *
     * Si existe:
     *
     * Dashboard
     */

    if (!window.location.hash) {

        window.location.hash =
            hasSave
                ? "#dashboard"
                : "#createChannel";

    }


    window.addEventListener(
        "hashchange",
        handleRoute
    );


    handleRoute();

}


// ==================================================
// MANEJAR RUTA
// ==================================================

function handleRoute() {

    const hash =
        window.location.hash ||
        "#createChannel";


    /*
     * Ocultar pantallas existentes.
     */

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.style.display = "none";

        });


    switch (hash) {

        // ==========================================
        // CREAR CANAL
        // ==========================================

        case "#createChannel":

            renderScreen(
                "createChannelScreen",
                createChannelScreen
            );

            break;


        // ==========================================
        // PRETEMPORADA
        // ==========================================

        case "#pretemporada":

            renderScreen(
                "pretemporadaScreen",
                pretemporadaScreen
            );

            break;


        // ==========================================
        // DASHBOARD
        // ==========================================

        case "#dashboard":

            renderScreen(
                "dashboardScreen",
                dashboardScreen
            );

            break;


        // ==========================================
        // PUBLICAR VIDEO
        // ==========================================

        case "#publish":

            renderScreen(
                "publishScreen",
                publishVideoScreen
            );

            break;


        // ==========================================
        // RESULTADO VIDEO
        // ==========================================

        case "#videoResult":

            renderScreen(
                "resultScreen",
                videoResultScreen
            );

            break;


        // ==========================================
        // PASAN COSAS
        // ==========================================

        case "#pasanCosas":

            renderScreen(
                "pasanCosasScreen",
                pasanCosasScreen
            );

            break;


        // ==========================================
        // TIENDA
        // ==========================================

        case "#store":

            renderScreen(
                "storeScreen",
                storeScreen
            );

            break;


        // ==========================================
        // COLABORACIONES
        // ==========================================

        case "#collabs":

            renderScreen(
                "collabsScreen",
                collabsScreen
            );

            break;


        // ==========================================
        // SPONSORS
        // ==========================================

        case "#sponsors":

            renderScreen(
                "sponsorsScreen",
                sponsorsScreen
            );

            break;


        // ==========================================
        // PREMIOS
        // ==========================================

        case "#awards":

            renderScreen(
                "awardsScreen",
                awardsScreen
            );

            break;


        // ==========================================
        // TIMELINE
        // ==========================================

        case "#timeline":

            renderScreen(
                "timelineScreen",
                timelineScreen
            );

            break;


        // ==========================================
        // ADMIN
        // ==========================================

        case "#admin":

            renderScreen(
                "adminScreen",
                adminDashboardScreen
            );

            break;


        // ==========================================
        // DEFAULT
        // ==========================================

        default:

            window.location.hash =
                "#dashboard";

            break;

    }

}


// ==================================================
// RENDERIZAR PANTALLA
// ==================================================

function renderScreen(
    elementId,
    screenModule
) {

    const el =
        document.getElementById(elementId);


    /*
     * Si el elemento no existe en index.html,
     * no rompemos toda la aplicación.
     */

    if (!el) {

        console.warn(
            `⚠️ No existe #${elementId} en index.html`
        );

        return;

    }


    if (!screenModule) {

        console.warn(
            `⚠️ No existe módulo para ${elementId}`
        );

        return;

    }


    el.style.display = "block";


    /*
     * ==========================================
     * 1. EXPORT DEFAULT
     * ==========================================
     */

    if (screenModule.default) {

        /*
         * default = función
         */

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


        /*
         * default = objeto con render()
         */

        if (
            typeof screenModule.default.render ===
            "function"
        ) {

            screenModule.default.render(el);

            return;

        }

    }


    /*
     * ==========================================
     * 2. EXPORT DIRECTO render()
     * ==========================================
     */

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


    /*
     * ==========================================
     * 3. BUSCAR renderDashboard(),
     *    renderPretemporada(), etc.
     * ==========================================
     */

    const renderFnKey =
        Object.keys(screenModule)
            .find(key =>

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


    console.warn(
        `⚠️ No se encontró función render para ${elementId}`
    );

}