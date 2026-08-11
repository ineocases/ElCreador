// router.js - Router principal de El Creador
// CORREGIDO: Sintaxis válida, rutas coherentes, exports compatibles

import saveManager from "./engine/saveManager.js";

import * as createChannelScreen  from "./screens/createChannel.js";
import * as dashboardScreen       from "./screens/dashboard.js";
import * as pretemporadaScreen    from "./screens/pretemporada.js";
import * as publishVideoScreen    from "./screens/publishVideo.js";
import * as videoResultScreen       from "./screens/videoResult.js";
import * as storeScreen           from "./screens/store.js";
import * as awardsScreen          from "./screens/awards.js";
import * as collabsScreen         from "./screens/collabs.js";
import * as sponsorsScreen        from "./screens/sponsors.js";
import * as pasanCosasScreen      from "./screens/pasanCosas.js";
import * as adminDashboardScreen  from "./screens/admin/AdminDashboard.js";

// ============================================================
// INICIAR ROUTER
// ============================================================

export function initRouter() {

    console.log("?? Router de El Creador inicializado");

    // Intentar cargar partida guardada
    let hasSave = false;

    try {
        hasSave = !!saveManager.loadLocal();
    } catch (error) {
        console.warn("?? No se pudo cargar la partida:", error);
        hasSave = false;
    }

    // Ruta inicial
    if (!window.location.hash) {
        window.location.hash = hasSave ? "#dashboard" : "#createChannel";
    }

    // Escuchar cambios de hash
    window.addEventListener("hashchange", handleRoute);

    // Render inicial
    handleRoute();
}

// ============================================================
// MANEJAR RUTA
// ============================================================

function handleRoute() {

    const hash = window.location.hash || "#createChannel";
    console.log("?? Ruta:", hash);

    // Ocultar todas las pantallas
    document.querySelectorAll(".screen").forEach(screen => {
        screen.style.display = "none";
    });

    switch (hash) {

        case "#createChannel":
            renderScreen("createChannelScreen", createChannelScreen);
            break;

        case "#pretemporada":
            renderScreen("pretemporadaScreen", pretemporadaScreen);
            break;

        case "#dashboard":
            renderScreen("dashboardScreen", dashboardScreen);
            break;

        case "#publish":
            renderScreen("publishScreen", publishVideoScreen);
            break;

        case "#videoResult":
            renderScreen("resultScreen", videoResultScreen);
            break;

        case "#pasanCosas":
            renderScreen("pasanCosasScreen", pasanCosasScreen);
            break;

        case "#store":
            renderScreen("storeScreen", storeScreen);
            break;

        case "#awards":
            renderScreen("awardsScreen", awardsScreen);
            break;

        case "#collabs":
            renderScreen("collabsScreen", collabsScreen);
            break;

        case "#sponsors":
            renderScreen("sponsorsScreen", sponsorsScreen);
            break;

        case "#admin":
            renderScreen("adminContainer", adminDashboardScreen);
            break;

        default:
            console.warn("?? Ruta desconocida:", hash);
            window.location.hash = "#dashboard";
            break;
    }
}

// ============================================================
// RENDER SCREEN
// ============================================================

function renderScreen(elementId, screenModule) {

    const el = document.getElementById(elementId);

    if (!el) {
        console.error(`? No existe el contenedor #${elementId} en index.html`);
        return;
    }

    if (!screenModule) {
        console.error(`? No existe el módulo para #${elementId}`);
        return;
    }

    // Mostrar el contenedor
    el.style.display = "block";

    // ====================================================================
    // CASO 1: Export default como función
    // ====================================================================
    if (typeof screenModule.default === "function") {
        const result = screenModule.default(el);
        procesarResultado(el, result);
        return;
    }

    // ====================================================================
    // CASO 2: Export default como objeto con método render
    // ====================================================================
    if (screenModule.default && typeof screenModule.default.render === "function") {
        const result = screenModule.default.render(el);
        procesarResultado(el, result);
        return;
    }

    // ====================================================================
    // CASO 3: Export nombrado render
    // ====================================================================
    if (typeof screenModule.render === "function") {
        const result = screenModule.render(el);
        procesarResultado(el, result);
        return;
    }

    // ====================================================================
    // CASO 4: Buscar cualquier función que empiece con "render"
    // ====================================================================
    const renderFnKey = Object.keys(screenModule).find(
        key => key.startsWith("render") && typeof screenModule[key] === "function"
    );

    if (renderFnKey) {
        const result = screenModule[renderFnKey](el);
        procesarResultado(el, result);
        return;
    }

    console.error(
        `? El módulo de #${elementId} no tiene una función render válida.`,
        screenModule
    );
}

// ============================================================
// PROCESAR RESULTADO
// ============================================================

function procesarResultado(el, result) {
    if (result instanceof HTMLElement && result !== el) {
        el.innerHTML = "";
        el.appendChild(result);
    }
    // Si result es string o el resultado fue inyectado directamente al container,
    // no hacemos nada más
}