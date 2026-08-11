// engine/saveManager.js - Sistema unificado de guardado
// USA LA MISMA KEY que gameState.guardar(): "elCreador_saveData"

import { gameState, normalizarGameState } from './gameState.js';

const saveManager = {

    SAVE_KEY: 'elCreador_saveData',

    // =====================================================
    // GUARDAR LOCAL
    // =====================================================

    saveLocal() {

        try {
            const dataToSave = {
                player: gameState.player,
                time: gameState.time,
                inventory: gameState.inventory,
                notifications: gameState.notifications,
                creators: gameState.creators,
                trends: gameState.trends,
                sponsors: gameState.sponsors,
                lastVideo: gameState.lastVideo,
                lastVideoResult: gameState.lastVideoResult,
                ultimoEventoResultado: gameState.ultimoEventoResultado,
                lastCollab: gameState.lastCollab,
                savedAt: Date.now()
            };

            localStorage.setItem(
                this.SAVE_KEY,
                JSON.stringify(dataToSave)
            );

            console.log("💾 Partida guardada localmente.");
            return true;

        } catch (error) {
            console.error("❌ Error al guardar local:", error);
            return false;
        }
    },

    // =====================================================
    // CARGAR LOCAL
    // =====================================================

    loadLocal() {

        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);

            if (!savedData) {
                return false;
            }

            const parsedData = JSON.parse(savedData);

            if (parsedData.player) gameState.player = parsedData.player;

            if (parsedData.time) {
                gameState.time = parsedData.time;
            } else {
                gameState.time = {
                    año: gameState.player.año,
                    trimestre: gameState.player.trimestre
                };
            }

            if (Array.isArray(parsedData.inventory)) {
                gameState.inventory = parsedData.inventory;
            } else {
                gameState.inventory = [];
            }

            if (Array.isArray(parsedData.notifications)) {
                gameState.notifications = parsedData.notifications;
            } else {
                gameState.notifications = [];
            }

            if (Array.isArray(parsedData.creators)) {
                gameState.creators = parsedData.creators;
            }

            if (Array.isArray(parsedData.trends)) {
                gameState.trends = parsedData.trends;
            } else {
                gameState.trends = [];
            }

            if (Array.isArray(parsedData.sponsors)) {
                gameState.sponsors = parsedData.sponsors;
            } else {
                gameState.sponsors = [];
            }

            gameState.lastVideo = parsedData.lastVideo || null;
            gameState.lastVideoResult = parsedData.lastVideoResult || null;
            gameState.ultimoEventoResultado = parsedData.ultimoEventoResultado || null;
            gameState.lastCollab = parsedData.lastCollab || null;

            normalizarGameState();

            console.log("📂 Partida cargada localmente.");
            return true;

        } catch (error) {
            console.error("❌ Error al cargar partida local:", error);
            return false;
        }
    },

    // =====================================================
    // EXISTE PARTIDA
    // =====================================================

    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    },

    // =====================================================
    // BORRAR PARTIDA
    // =====================================================

    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log("🗑️ Partida borrada.");
    },

    // =====================================================
    // GUARDADO COMPLETO
    // =====================================================

    saveEverything() {
        return this.saveLocal();
    }
};

export default saveManager;