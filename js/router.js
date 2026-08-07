// router.js
import saveManager from './engine/saveManager.js';
import { createChannelScreen } from './screens/createChannel.js';
import { dashboardScreen } from './screens/dashboard.js';
import { publishVideoScreen } from './screens/publishVideo.js';
import { videoResultScreen } from './screens/videoResult.js';
import { storeScreen } from './screens/store.js';
import { awardsScreen } from './screens/awards.js';
import { adminDashboardScreen } from './screens/admin/AdminDashboard.js';
import { collabsScreen } from './screens/collabs.js';
import { sponsorsScreen } from './screens/sponsors.js';

export function initRouter() {
    console.log("🚀 Router de 'El Creador' inicializado");

    // Intenta cargar datos locales
    const hasSave = saveManager.loadLocal();

    // Si no hay hash en la URL, redirige según el estado de guardado
    if (!window.location.hash) {
        window.location.hash = hasSave ? '#dashboard' : '#createChannel';
    }

    // Escucha el evento de navegación por hash
    window.addEventListener('hashchange', handleRoute);
    
    // Procesa la pantalla actual al cargar
    handleRoute();
}

function handleRoute() {
    const hash = window.location.hash || '#createChannel';

    // Oculta todas las secciones con la clase .screen
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });

    // Mapeo centralizado de rutas a IDs de pantalla y módulos
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
    if (el) {
        el.style.display = 'block';
        if (screenModule && typeof screenModule.render === 'function') {
            screenModule.render();
        }
    }
}
