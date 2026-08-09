// engine/eventSystem.js
import gameState from './gameState.js';
import { utils } from './utils.js';

const eventSystem = {
    
    // Esta función la llamará el gameLoop al terminar el trimestre
    triggerRandomEvent() {
        const chance = utils.randomInt(1, 100);
        console.log(`🎲 Tirando dados de evento... Salió: ${chance}`);

        if (chance <= 70) {
            // 70% de probabilidad (1 al 70)
            return this.nothingHappens();
        } else if (chance <= 90) {
            // 20% de probabilidad (71 al 90)
            return this.commonEvent();
        } else if (chance <= 98) {
            // 8% de probabilidad (91 al 98)
            return this.rareEvent();
        } else {
            // 2% de probabilidad (99 al 100)
            return this.legendaryEvent();
        }
    },

    nothingHappens() {
        return { 
            type: "none", 
            title: "Trimestre tranquilo", 
            message: "No hubo sobresaltos. Te enfocaste 100% en tu contenido.",
            effect: null
        };
    },

    commonEvent() {
        // Ejemplo: Clip viral en TikTok
        const fameBoost = utils.randomInt(1, 3);
        gameState.player.fama += fameBoost;
        
        return { 
            type: "common", 
            title: "¡Clip Viral!",
            message: "Alguien subió un clip de tu último video a TikTok y tuvo muchas vistas.",
            effect: `+${fameBoost} Fama` 
        };
    },

    rareEvent() {
        // Ejemplo: Colaboración sorpresa
        const subsBoost = Math.floor(gameState.player.subs * 0.15) + 500; // Gana 15% de sus subs actuales (mínimo 500)
        gameState.player.subs += subsBoost;

        return { 
            type: "rare", 
            title: "Colaboración Inesperada",
            message: "Un youtuber más grande que vos te recomendó en su directo.",
            effect: `+${subsBoost} Suscriptores` 
        };
    },

    legendaryEvent() {
        // Ejemplo: Marca internacional
        const moneyBoost = utils.randomInt(1000, 3000);
        gameState.player.money += moneyBoost;

        return { 
            type: "legendary", 
            title: "¡Patrocinio Internacional!",
            message: "Una marca gigante descubrió tu perfil y quiere pagarte por usar sus periféricos.",
            effect: `+US$${moneyBoost}` 
        };
    }
};

export default eventSystem;