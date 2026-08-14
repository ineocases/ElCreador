// app.js - Entry point principal de El Creador

import { initRouter } from './router.js';
import { installSecurityGuards } from './security.js';

window.addEventListener('error', (event) => {
    console.error('El Creador: error de ejecución', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
    console.error('El Creador: promesa rechazada', event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    installSecurityGuards();
    try {
        initRouter();
    } catch (error) {
        console.error('El Creador no pudo iniciar:', error);
        const fallback = document.getElementById('createChannelScreen');
        if (fallback) {
            fallback.style.display = 'block';
            fallback.innerHTML = `<div class="page-shell"><div class="panel center error-panel"><h2>No se pudo iniciar la partida</h2><p>Recargá la página. Si continúa, abrí la consola para ver el error.</p></div></div>`;
        }
    }
});