// js/app.js
import saveManager from '../engine/saveManager.js';
import { dashboardScreen } from '../screens/dashboard.js';
import { publishVideoScreen } from '../screens/publishVideo.js';
import { videoResultScreen } from '../screens/videoResult.js';
import { awardsScreen } from '../screens/awards.js';
import { adminDashboardScreen } from '../screens/admin/AdminDashboard.js';
import saveManager from '../engine/saveManager.js';
import { storeScreen } from '../screens/store.js'; // Lo activás después de crear el archivo de abajo

function initApp() {
    console.log("🚀 Iniciando 'El Creador'...");

    // 1. Intentamos cargar la partida desde la memoria del navegador
    const hasSave = saveManager.loadLocal();

    // 2. Si es la primera vez que entra, lo mandamos a crear su canal
    if (!hasSave && window.location.hash !== '#createChannel') {
        window.location.hash = '#createChannel';
    } else if (hasSave && !window.location.hash) {
        // Si ya tiene partida y entra a la web sin ruta, lo mandamos al panel
        window.location.hash = '#dashboard';
    }

    // 3. Escuchamos cada vez que cambia la URL (el #hash) para cambiar la pantalla
    window.addEventListener('hashchange', handleRoute);
    
    // 4. Forzamos la carga de la pantalla actual
    handleRoute();
}

// Nuestro Router Simple
function handleRoute() {
    const hash = window.location.hash;
    
    // Ocultar todas las pantallas del HTML (Asegurate de que tus divs tengan la clase 'screen')
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    
    // Mostramos la pantalla correcta y ejecutamos su lógica
    if (hash === '#createChannel') {
        document.getElementById('createChannelScreen').style.display = 'block';
    } else if (hash === '#dashboard') {
    // ... acá sigue lo que ya tenías ...
	if (hash === '#dashboard') {
        document.getElementById('dashboardScreen').style.display = 'block';
        dashboardScreen.render();
    } else if (hash === '#publish') {
        document.getElementById('publishScreen').style.display = 'block';
        publishVideoScreen.render();
    } else if (hash === '#videoResult') {
        document.getElementById('resultScreen').style.display = 'block';
        videoResultScreen.render();
    } 
	} else if (hash === '#awards') {
        document.getElementById('awardsScreen').style.display = 'block';
        awardsScreen.render();
    }
	} else if (hash === '#admin') {
        document.getElementById('adminScreen').style.display = 'block';
        adminDashboardScreen.render();
	}
    } else if (hash === '#store') {
    document.getElementById('storeScreen').style.display = 'block';
    storeScreen.render();
    }
}

// Cuando la ventana termine de cargar, disparamos la aplicación
window.onload = initApp;