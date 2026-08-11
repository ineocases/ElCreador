// router.js - Router único de El Creador
import saveManager from "./engine/saveManager.js";
import * as createChannelScreen from "./screens/createChannel.js";
import * as dashboardScreen from "./screens/dashboard.js";
import * as pretemporadaScreen from "./screens/pretemporada.js";
import * as publishVideoScreen from "./screens/publishVideo.js";
import * as videoResultScreen from "./screens/videoResult.js";
import * as yearSummaryScreen from "./screens/yearSummary.js";
import * as minigameScreen from "./screens/minigame.js";
import * as veladaScreen from "./screens/velada.js";
import * as storeScreen from "./screens/store.js";
import * as awardsScreen from "./screens/awards.js";
import * as collabsScreen from "./screens/collabs.js";
import * as sponsorsScreen from "./screens/sponsors.js";
import * as pasanCosasScreen from "./screens/pasanCosas.js";
import * as adminDashboardScreen from "./screens/admin/AdminDashboard.js";

let initialized = false;

export function initRouter() {
    if (initialized) return;
    initialized = true;

    window.addEventListener("hashchange", handleRoute);

    const hasSave = saveManager.hasSave();
    if (hasSave) saveManager.loadLocal();

    if (!window.location.hash) {
        window.location.hash = hasSave ? "#dashboard" : "#createChannel";
        return;
    }

    handleRoute();
}

function hasSave() {
    try { return Boolean(saveManager.hasSave()); }
    catch { return false; }
}

function handleRoute() {
    const hash = window.location.hash || "#createChannel";
    const protectedRoutes = [
        "#dashboard", "#pretemporada", "#publish", "#videoResult",
        "#yearSummary", "#minigame", "#velada", "#pasanCosas", "#store", "#awards",
        "#collabs", "#sponsors", "#admin"
    ];

    if (protectedRoutes.includes(hash) && !hasSave()) {
        if (hash !== "#createChannel") window.location.hash = "#createChannel";
        return;
    }

    document.querySelectorAll(".screen").forEach(screen => {
        screen.style.display = "none";
    });

    const routes = {
        "#createChannel": ["createChannelScreen", createChannelScreen],
        "#dashboard": ["dashboardScreen", dashboardScreen],
        "#pretemporada": ["pretemporadaScreen", pretemporadaScreen],
        "#publish": ["publishScreen", publishVideoScreen],
        "#videoResult": ["resultScreen", videoResultScreen],
        "#yearSummary": ["yearSummaryScreen", yearSummaryScreen],
        "#minigame": ["minigameScreen", minigameScreen],
        "#velada": ["veladaScreen", veladaScreen],
        "#pasanCosas": ["pasanCosasScreen", pasanCosasScreen],
        "#store": ["storeScreen", storeScreen],
        "#awards": ["awardsScreen", awardsScreen],
        "#collabs": ["collabsScreen", collabsScreen],
        "#sponsors": ["sponsorsScreen", sponsorsScreen],
        "#admin": ["adminContainer", adminDashboardScreen]
    };

    const route = routes[hash];
    if (!route) {
        window.location.hash = hasSave() ? "#dashboard" : "#createChannel";
        return;
    }

    renderScreen(route[0], route[1]);
}

function renderScreen(elementId, screenModule) {
    const el = document.getElementById(elementId);
    if (!el) {
        console.error(`❌ No existe #${elementId} en index.html`);
        return;
    }
    el.style.display = "block";
    el.innerHTML = "";

    try {
        let result;
        if (typeof screenModule.default === "function") result = screenModule.default(el);
        else if (screenModule.default && typeof screenModule.default.render === "function") result = screenModule.default.render(el);
        else if (typeof screenModule.render === "function") result = screenModule.render(el);
        else {
            const key = Object.keys(screenModule).find(k => k.startsWith("render") && typeof screenModule[k] === "function");
            if (key) result = screenModule[key](el);
        }
        if (result instanceof HTMLElement && result !== el && !el.contains(result)) {
            el.innerHTML = "";
            el.appendChild(result);
        }
    } catch (error) {
        console.error(`❌ Error renderizando ${hashSafe(elementId)}:`, error);
        el.innerHTML = `<div class="error-panel"><h2>Ocurrió un error en esta pantalla</h2><p>${error.message}</p><a href="#dashboard">Volver</a></div>`;
    }
}

function hashSafe(id) { return `#${id}`; }
