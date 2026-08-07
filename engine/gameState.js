// engine/gameState.js

const gameState = {
    // 1. Estadísticas del Jugador
    player: {
        name: "",
        channelName: "",
        country: "",
        niche: "",
        subs: 0,
        fama: 0,        // 0 a 100
        money: 0,       // En US$
        reputation: 50, // 0 a 100
        quality: 1      // Multiplicador base por equipo
    },

    // 2. Control del Tiempo y Acciones
    time: {
        year: 2026,
        quarter: 1,         // 1 (Ene-Mar), 2 (Abr-Jun), 3 (Jul-Sep), 4 (Oct-Dic)
        videosAvailable: 3  // Siempre empiezan en 3 por trimestre
    },

    // 3. Inventario / Mejoras
    inventory: {
        equipmentLevel: 1,
        hasEditor: false,
        hasOffice: false
    },

    // --- FUNCIONES PARA MODIFICAR EL ESTADO DE FORMA SEGURA ---

    // Iniciar partida nueva
    initGame(name, channelName, country, niche) {
        this.player.name = name;
        this.player.channelName = channelName;
        this.player.country = country;
        this.player.niche = niche;
        
        // Valores iniciales
        this.player.subs = 0;
        this.player.fama = 0;
        this.player.money = 0;
        
        this.time.year = 2026;
        this.time.quarter = 1;
        this.time.videosAvailable = 3;
    },

    // Gastar una acción de video
    useVideoAction() {
        if (this.time.videosAvailable > 0) {
            this.time.videosAvailable--;
            return true;
        }
        return false;
    },

    // Avanzar de trimestre (y resetear los videos)
    nextQuarter() {
        if (this.time.quarter === 4) {
            this.time.year++;
            this.time.quarter = 1;
        } else {
            this.time.quarter++;
        }
        this.time.videosAvailable = 3; 
    }
};

export default gameState;