// js/router.js
import saveManager from '../engine/saveManager.js';
import * as createChannelScreen from '../screens/createChannel.js';
import * as dashboardScreen from '../screens/dashboard.js';
import * as publishVideoScreen from '../screens/publishVideo.js';
import * as videoResultScreen from '../screens/videoResult.js';
import * as storeScreen from '../screens/store.js';
import * as awardsScreen from '../screens/awards.js';
import * as adminDashboardScreen from '../screens/admin/AdminDashboard.js';
import * as collabsScreen from '../screens/collabs.js';
import * as sponsorsScreen from '../screens/sponsors.js';

export function initRouter() {
    console.log("🚀 Router de 'El Creador' inicializado");

    const hasSave = saveManager.loadLocal();

    if (!window.location.hash) {
        window.location.hash = hasSave ? '#dashboard' : '#createChannel';
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

function handleRoute() {
    const hash = window.location.hash || '#createChannel';

    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });

    switch (hash) {
        case '#createChannel':
            renderScreen('createChannelScreen', createChannelScreen);
            break;
        case '#dashboard':
            renderScreen('dashboardScreen', dashboardScreen);
            break;
        case '#publish':
            renderScreen('publishScreen', publishVideoScreen);
            break;
        case '#videoResult':
            renderScreen('resultScreen', videoResultScreen);
            break;
        case '#store':
            renderScreen('storeScreen', storeScreen);
            break;
        case '#awards':
            renderScreen('awardsScreen', awardsScreen);
            break;
        case '#admin':
            renderScreen('adminScreen', adminDashboardScreen);
            break;
        case '#collabs':
            renderScreen('collabsScreen', collabsScreen);
            break;
        case '#sponsors':
            renderScreen('sponsorsScreen', sponsorsScreen);
            break;
        default:
            renderScreen('dashboardScreen', dashboardScreen);
            break;
    }
}

function renderScreen(elementId, screenModule) {
    const el = document.getElementById(elementId);
    if (!el || !screenModule) return;

    el.style.display = 'block';

    // 1. Si exporta por defecto (export default)
    if (screenModule.default) {
        if (typeof screenModule.default === 'function') {
            const result = screenModule.default(el);
            if (result instanceof HTMLElement) {
                el.innerHTML = '';
                el.appendChild(result);
            }
            return;
        } else if (typeof screenModule.default.render === 'function') {
            screenModule.default.render(el);
            return;
        }
    }

    // 2. Si el módulo exporta una propiedad u objeto .render()
    if (typeof screenModule.render === 'function') {
        screenModule.render(el);
        return;
    }

    // 3. Busca cualquier función exportada que comience con "render" (ej: renderDashboard, renderCreateChannel)
    const renderFnKey = Object.keys(screenModule).find(
        key => key.startsWith('render') && typeof screenModule[key] === 'function'
    );

    if (renderFnKey) {
        const result = screenModule[renderFnKey](el);
        if (result instanceof HTMLElement) {
            el.innerHTML = '';
            el.appendChild(result);
        }
    }
}
