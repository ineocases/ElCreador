// engine/gameLoop.js
import gameState from '.gameState.js';
import videoSystem from '.videoSystem.js'; // Lo activaremos en el próximo paso

const gameLoop = {
    // Inicia un nuevo trimestre
    startQuarter() {
        console.log(`🌱 Iniciando Q${gameState.time.quarter} del año ${gameState.time.year}`);
        // TODO: Actualizar la interfaz (UI) para mostrar los datos actuales
    },

    // El jugador elige subir un video
	publishVideo(idea) {
			if (!gameState.useVideoAction()) {
				console.warn("No te quedan videos para publicar este trimestre.");
				return;
        }
        
        // ?Ac�� ocurre la magia!
			const results = videoSystem.processVideo(idea);
			console.log("Resultados del video:", results);
        
			if (gameState.time.videosAvailable === 0) {
				this.endQuarter();
			}
	},

    // Termina el trimestre actual
    endQuarter() {
        console.log("⏱️ Trimestre terminado. Calculando eventos aleatorios...");
        
        // TODO: Llamar al sistema de eventos (70% nada, 20% común, etc.)
        
        // Revisamos si es fin de año
        if (gameState.time.quarter === 4) {
            this.triggerEndOfYearEvent();
        } else {
            this.showQuarterSummary();
        }
    },

    showQuarterSummary() {
        console.log("📊 Mostrando resumen del trimestre...");
        // TODO: Abrir pantalla de resultados y mejoras (Tienda)
    },

    triggerEndOfYearEvent() {
        console.log("🏆 ¡Bienvenidos a los Coscu Army Awards!");
        // TODO: Pantalla especial de diciembre
    },

    // Función que llamará el botón de "Siguiente Trimestre" en la interfaz
    advanceToNextQuarter() {
        gameState.nextQuarter();
        this.startQuarter();
    }
};

export default gameLoop;