// app.js - Entry point principal de El Creador

import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
    initRouter();
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