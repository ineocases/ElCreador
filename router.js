// router.js - Router único de El Creador
import saveManager from "./engine/saveManager.js";
import * as createChannelScreen from "./screens/createChannel.js";
import * as dashboardScreen from "./screens/dashboard.js";
import * as pretemporadaScreen from "./screens/pretemporada.js";
import * as publishVideoScreen from "./screens/publishVideo.js";
import * as videoResultScreen from "./screens/videoResult.js";
import * as yearSummaryScreen from "./screens/yearSummary.js";
import * as newYearScreen from "./screens/newYear.js";
import * as careerEndScreen from "./screens/careerEnd.js";
import * as veladaScreen from "./screens/velada.js";
import * as storeScreen from "./screens/store.js";
import * as awardsScreen from "./screens/awards.js";
import * as collabsScreen from "./screens/collabs.js";
import * as sponsorsScreen from "./screens/sponsors.js";
import * as pasanCosasScreen from "./screens/pasanCosas.js";
import * as adminDashboardScreen from "./screens/admin/AdminDashboard.js";
import { renderOpportunityOverlay } from "./components/OpportunityOverlay.js";

let initialized = false;
let loaderTimer = null;
let loaderToken = 0;

function getScreenLoader() {
    let loader = document.getElementById("screenTransitionLoader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "screenTransitionLoader";
        loader.className = "screen-transition-loader";
        loader.setAttribute("aria-live", "polite");
        loader.setAttribute("aria-label", "Cargando pantalla");
        loader.innerHTML = `
            <div class="screen-transition-loader__box">
                <span class="screen-transition-loader__spinner" aria-hidden="true"></span>
                <span class="screen-transition-loader__text">Cargando...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    return loader;
}

function showScreenLoader() {
    const loader = getScreenLoader();
    loader.classList.remove("is-hidden");
    document.body.classList.add("screen-is-loading");
    void loader.offsetWidth;
    loader.classList.add("is-visible");
}

function hideScreenLoader() {
    const loader = document.getElementById("screenTransitionLoader");
    if (!loader) return;
    loader.classList.remove("is-visible");
    loader.classList.add("is-hidden");
    document.body.classList.remove("screen-is-loading");
}

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
        "#yearSummary", "#newYear", "#careerEnd", "#velada", "#pasanCosas", "#store", "#awards",
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
        "#newYear": ["newYearScreen", newYearScreen],
        "#careerEnd": ["careerEndScreen", careerEndScreen],
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
    const token = ++loaderToken;
    if (loaderTimer) clearTimeout(loaderTimer);

    showScreenLoader();

    // Dejamos un pequeño tiempo visible al indicador para que cada cambio de pantalla
    // se perciba como una transición intencional y no como un salto o pantalla vacía.
    loaderTimer = setTimeout(() => {
        if (token !== loaderToken) return;

        const el = document.getElementById(elementId);
        if (!el) {
            hideScreenLoader();
            console.error(`❌ No existe #${elementId} en index.html`);
            return;
        }

        document.querySelectorAll(".screen").forEach(screen => {
            screen.style.display = "none";
        });

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
            renderOpportunityOverlay(window.location.hash);

            // Dejamos que el navegador pinte la pantalla antes de retirar el loader.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (token === loaderToken) hideScreenLoader();
                });
            });
        } catch (error) {
            console.error(`❌ Error renderizando ${hashSafe(elementId)}:`, error);
            el.innerHTML = `<div class="error-panel"><h2>Ocurrió un error en esta pantalla</h2><p>${error.message}</p><a href="#dashboard">Volver</a></div>`;
            requestAnimationFrame(hideScreenLoader);
        }
    }, 320);
}

function hashSafe(id) { return `#${id}`; }
