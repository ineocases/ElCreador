// js/app.js
import saveManager from '../engine/saveManager.js';
import gameState from '../engine/gameState.js';
import { dashboardScreen } from '../screens/dashboard.js';
import { publishVideoScreen } from '../screens/publishVideo.js';
import { videoResultScreen } from '../screens/videoResult.js';
import { storeScreen } from '../screens/store.js';
import { awardsScreen } from '../screens/awards.js';
import { adminDashboardScreen } from '../screens/admin/AdminDashboard.js';

function initApp() {
    console.log("🚀 Iniciando 'El Creador'...");

    // 1. Intentamos cargar la partida local
    const hasSave = saveManager.loadLocal();

    // 2. Definimos pantalla inicial si no hay hash
    if (!window.location.hash) {
        window.location.hash = hasSave ? '#dashboard' : '#createChannel';
    }

    // 3. Escuchamos cambios de ruta
    window.addEventListener('hashchange', handleRoute);
    
    // 4. Forzamos carga de la ruta actual
    handleRoute();
}

// Router centralizado y a prueba de errores
function handleRoute() {
    const hash = window.location.hash || '#createChannel';
    
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(s => {
        s.style.display = 'none';
    });
    
    // Mostrar la pantalla correspondiente
    if (hash === '#createChannel') {
        const screen = document.getElementById('createChannelScreen');
        if (screen) screen.style.display = 'block';
    } 
    else if (hash === '#dashboard') {
        const screen = document.getElementById('dashboardScreen');
        if (screen) {
            screen.style.display = 'block';
            dashboardScreen.render();
        }
    } 
    else if (hash === '#publish') {
        const screen = document.getElementById('publishScreen');
        if (screen) {
            screen.style.display = 'block';
            publishVideoScreen.render();
        }
    } 
    else if (hash === '#videoResult') {
        const screen = document.getElementById('resultScreen');
        if (screen) {
            screen.style.display = 'block';
            videoResultScreen.render();
        }
    } 
    else if (hash === '#store') {
        const screen = document.getElementById('storeScreen');
        if (screen) {
            screen.style.display = 'block';
            storeScreen.render();
        }
    } 
    else if (hash === '#awards') {
        const screen = document.getElementById('awardsScreen');
        if (screen) {
            screen.style.display = 'block';
            awardsScreen.render();
        }
    } 
    else if (hash === '#admin') {
        const screen = document.getElementById('adminScreen');
        if (screen) {
            screen.style.display = 'block';
            adminDashboardScreen.render();
        }
    }
}

// Arrancar al cargar la página
window.onload = initApp;
