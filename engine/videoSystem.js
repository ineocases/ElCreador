// engine/videoSystem.js
import gameState from './gameState.js';
import { utils } from './utils.js';

/* 
  NOTA: Por ahora dejo unas listas de ejemplo aquí mismo para que funcione de una. 
  Más adelante, cuando conectemos la carpeta /data, reemplazaremos esto 
  importando tus propios formatos y temas.
*/
const formatos = ["Hago un reto extremo:", "Reacciono a", "Juego un nuevo videojuego:", "Vlog:", "Tierlist de"];
const temas = ["Minecraft", "la polémica de la semana", "mi setup", "comida picante", "juegos retro"];

const videoSystem = {
    
    // 1. Genera 5 ideas aleatorias para mostrar en pantalla
    generateIdeas() {
        const ideas = [];
        for (let i = 0; i < 5; i++) {
            const formato = utils.pickRandom(formatos);
            const tema = utils.pickRandom(temas);
            
            ideas.push({
                id: i,
                title: `${formato} ${tema}`,
                // 'potencial' define si la idea es buena o mala (de 50% a 150%)
                basePotential: utils.randomInt(50, 150) 
            });
        }
        return ideas;
    },

    // 2. Recibe la idea que eligió el jugador y calcula la magia
    processVideo(idea) {
        console.log(`🎬 Procesando video: "${idea.title}"...`);

        // --- CÁLCULO DE VISTAS ---
        // Base: 500 vistas + 10% de tus subs actuales
        const baseViews = 500 + (gameState.player.subs * 0.1); 
        const qualityMultiplier = gameState.player.quality; // Mejoras de tienda
        const randomFactor = utils.randomInt(80, 120) / 100; // Factor suerte (0.8 a 1.2)
        
        // Fórmula final de vistas
        let views = Math.floor(baseViews * (idea.basePotential / 100) * qualityMultiplier * randomFactor);
        
        // Un youtuber pequeño siempre tiene un mínimo garantizado para no frustrarse
        if (views < 50) views = utils.randomInt(50, 150); 

        // --- CÁLCULO DE SUBS ---
        // Convierte entre el 1% y el 4% de las vistas en suscriptores
        const conversionRate = utils.randomInt(1, 4) / 100;
        const newSubs = Math.floor(views * conversionRate);

        // --- CÁLCULO DE DINERO (Dólares) ---
        // CPM (Costo por mil vistas): te pagan entre US$2 y US$5 cada 1000 vistas
        const cpm = utils.randomInt(2, 5);
        const moneyEarned = parseFloat(((views / 1000) * cpm).toFixed(2));

        // --- CÁLCULO DE FAMA ---
        // Ganas fama SOLO si el video tiene éxito (ej. más vistas que el doble de tus subs y más de 1000 vistas)
        let fameGained = 0;
        if (views > (gameState.player.subs * 2) && views > 1000) {
            fameGained = utils.randomInt(1, 3);
        }

        // --- APLICAR RESULTADOS AL ESTADO ---
        gameState.player.subs += newSubs;
        gameState.player.money += moneyEarned;
        gameState.player.fama += fameGained;
        
        // Tope máximo de fama (100)
        if (gameState.player.fama > 100) gameState.player.fama = 100;

        // Devuelve el resumen para que la pantalla (UI) lo dibuje
        return {
            title: idea.title,
            views: views,
            subs: newSubs,
            money: moneyEarned,
            fameGained: fameGained
        };
    }
};

export default videoSystem;