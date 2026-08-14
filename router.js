// router.js - Router único de El Creador
// V21: carga diferida de pantallas para reducir el JS inicial y evitar renders innecesarios.
import saveManager from "./engine/saveManager.js";
import { renderOpportunityOverlay } from "./components/OpportunityOverlay.js";

let initialized = false;
let navigationToken = 0;
const moduleCache = new Map();

const routeLoaders = {
    "#createChannel": () => import("./screens/createChannel.js"),
    "#dashboard": () => import("./screens/dashboard.js"),
    "#pretemporada": () => import("./screens/pretemporada.js"),
    "#publish": () => import("./screens/publishVideo.js"),
    "#videoResult": () => import("./screens/videoResult.js"),
    "#yearSummary": () => import("./screens/yearSummary.js"),
    "#newYear": () => import("./screens/newYear.js"),
    "#careerEnd": () => import("./screens/careerEnd.js"),
    "#velada": () => import("./screens/velada.js"),
    "#pasanCosas": () => import("./screens/pasanCosas.js"),
    "#store": () => import("./screens/store.js"),
    "#awards": () => import("./screens/awards.js"),
    "#collabs": () => import("./screens/collabs.js"),
    "#sponsors": () => import("./screens/sponsors.js"),
    "#admin": () => import("./screens/admin/AdminDashboard.js")
};

const routeElements = {
    "#createChannel": "createChannelScreen",
    "#dashboard": "dashboardScreen",
    "#pretemporada": "pretemporadaScreen",
    "#publish": "publishScreen",
    "#videoResult": "resultScreen",
    "#yearSummary": "yearSummaryScreen",
    "#newYear": "newYearScreen",
    "#careerEnd": "careerEndScreen",
    "#velada": "veladaScreen",
    "#pasanCosas": "pasanCosasScreen",
    "#store": "storeScreen",
    "#awards": "awardsScreen",
    "#collabs": "collabsScreen",
    "#sponsors": "sponsorsScreen",
    "#admin": "adminContainer"
};

export function initRouter() {
    if (initialized) return;
    initialized = true;

    window.addEventListener("hashchange", handleRoute, { passive: true });
    window.addEventListener("mouseover", prefetchRoute, { passive: true });

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

function prefetchRoute(event) {
    const anchor = event.target?.closest?.("a[href^='#']");
    if (!anchor) return;
    const hash = anchor.getAttribute("href");
    const loader = routeLoaders[hash];
    if (!loader || moduleCache.has(hash)) return;
    // Prefetch solo después de una interacción real con el enlace.
    moduleCache.set(hash, loader().catch(error => {
        moduleCache.delete(hash);
        throw error;
    }));
}

async function getScreenModule(hash) {
    if (!moduleCache.has(hash)) moduleCache.set(hash, routeLoaders[hash]());
    return moduleCache.get(hash);
}

async function handleRoute() {
    const token = ++navigationToken;
    const hash = window.location.hash || "#createChannel";
    const protectedRoutes = Object.keys(routeLoaders).filter(route => route !== "#createChannel");

    if (protectedRoutes.includes(hash) && !hasSave()) {
        if (hash !== "#createChannel") window.location.hash = "#createChannel";
        return;
    }

    if (!routeLoaders[hash]) {
        window.location.hash = hasSave() ? "#dashboard" : "#createChannel";
        return;
    }

    const elementId = routeElements[hash];
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
        const screenModule = await getScreenModule(hash);
        if (token !== navigationToken || window.location.hash !== hash) return;
        await renderScreen(el, screenModule, hash, token);
    } catch (error) {
        if (token !== navigationToken) return;
        console.error(`❌ Error cargando ${hashSafe(elementId)}:`, error);
        showRouteError(el, error);
    }
}

async function renderScreen(el, screenModule, hash, token) {
    let result;
    if (typeof screenModule.default === "function") result = screenModule.default(el);
    else if (screenModule.default && typeof screenModule.default.render === "function") result = screenModule.default.render(el);
    else if (typeof screenModule.render === "function") result = screenModule.render(el);
    else {
        const key = Object.keys(screenModule).find(k => k.startsWith("render") && typeof screenModule[k] === "function");
        if (key) result = screenModule[key](el);
    }

    if (result instanceof HTMLElement && result !== el && !el.contains(result)) {
        el.replaceChildren(result);
    }

    if (token !== navigationToken || window.location.hash !== hash) return;

    document.querySelectorAll(".screen").forEach(screen => {
        const active = screen === el;
        screen.hidden = !active;
        screen.classList.toggle("is-active", active);
        screen.setAttribute("aria-hidden", active ? "false" : "true");
    });
    renderOpportunityOverlay(hash);
}

function showRouteError(el, error) {
    const panel = document.createElement("div");
    panel.className = "error-panel page-shell";
    panel.innerHTML = "<div class=\"panel center\"><h2>Ocurrió un error en esta pantalla</h2><p>La pantalla no pudo cargarse. Probá volver al dashboard.</p><a class=\"btn primary\" href=\"#dashboard\">VOLVER</a></div>";
    el.replaceChildren(panel);
    document.querySelectorAll(".screen").forEach(screen => {
        const active = screen === el;
        screen.hidden = !active;
        screen.classList.toggle("is-active", active);
        screen.setAttribute("aria-hidden", active ? "false" : "true");
    });
    console.error(error);
}

function hashSafe(id) { return `#${id}`; }
