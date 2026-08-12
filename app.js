// app.js - Entry point principal de El Creador

import { initRouter } from './router.js';

window.addEventListener('error', (event) => {
    console.error('El Creador: error de ejecución', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
    console.error('El Creador: promesa rechazada', event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
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
    document.addEventListener("click", e => {
        const btn=e.target.closest("#retireCareerBtn");
        if(!btn) return;
        const p=window.__elCreadorState?.player;
        import("./engine/gameState.js").then(({gameState})=>{
            if(!gameState.puedeRetirarse()){ alert("El retiro voluntario se desbloquea desde el año 8. A los 40 años es obligatorio."); return; }
            if(confirm("¿Querés retirarte de tu carrera?" ) && confirm("Última confirmación: esta carrera terminará y no podrás continuarla. ¿Retirarte?")) gameState.retirarse();
        });
    });
});