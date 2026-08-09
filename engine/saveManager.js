// engine/saveManager.js

import { gameState, normalizarGameState } from './gameState.js';

import { db } from '../firebase/firebase.js';

import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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

                notifications:
                    gameState.notifications,

                creators:
                    gameState.creators,

                trends:
                    gameState.trends,

                sponsors:
                    gameState.sponsors
            };

            localStorage.setItem(
                this.SAVE_KEY,
                JSON.stringify(dataToSave)
            );

            console.log(
                "💾 Partida guardada localmente."
            );

            return true;

        } catch (error) {

            console.error(
                "❌ Error al guardar local:",
                error
            );

            return false;
        }
    },


    // =====================================================
    // CARGAR LOCAL
    // =====================================================

    loadLocal() {

        try {

            const savedData =
                localStorage.getItem(
                    this.SAVE_KEY
                );

            if (!savedData) {
                return false;
            }

            const parsedData =
                JSON.parse(savedData);

            gameState.player =
                parsedData.player;

            gameState.time =
                parsedData.time || {
                    año: gameState.player.año,
                    trimestre:
                        gameState.player.trimestre
                };

            gameState.inventory =
                parsedData.inventory || [];

            gameState.notifications =
                parsedData.notifications || [];

            gameState.creators =
                parsedData.creators || [];

            gameState.trends =
                parsedData.trends || [];

            gameState.sponsors =
                parsedData.sponsors || [];

            normalizarGameState();

            console.log(
                "📂 Partida cargada localmente."
            );

            return true;

        } catch (error) {

            console.error(
                "❌ Error al cargar partida local:",
                error
            );

            return false;
        }
    },


    // =====================================================
    // FIREBASE
    // =====================================================

    async saveToFirebase(userId) {

        if (!userId) {
            console.warn(
                "⚠️ No se proporcionó userId."
            );

            return false;
        }

        try {

            const dataToSave = {

                player: gameState.player,

                time: gameState.time,

                inventory: gameState.inventory,

                notifications:
                    gameState.notifications,

                updatedAt: new Date()
            };

            await setDoc(
                doc(
                    db,
                    "creators",
                    userId
                ),
                dataToSave,
                {
                    merge: true
                }
            );

            console.log(
                "☁️ Partida guardada en Firebase."
            );

            return true;

        } catch (error) {

            console.error(
                "❌ Error Firebase:",
                error
            );

            return false;
        }
    },


    // =====================================================
    // CARGAR FIREBASE
    // =====================================================

    async loadFromFirebase(userId) {

        if (!userId) {
            return false;
        }

        try {

            const docRef =
                doc(
                    db,
                    "creators",
                    userId
                );

            const docSnap =
                await getDoc(docRef);

            if (!docSnap.exists()) {

                console.log(
                    "ℹ️ No existe partida en Firebase."
                );

                return false;
            }

            const data =
                docSnap.data();

            gameState.player =
                data.player;

            gameState.time =
                data.time || {
                    año: gameState.player.año,
                    trimestre:
                        gameState.player.trimestre
                };

            gameState.inventory =
                data.inventory || [];

            gameState.notifications =
                data.notifications || [];

            normalizarGameState();

            this.saveLocal();

            console.log(
                "☁️ Partida cargada desde Firebase."
            );

            return true;

        } catch (error) {

            console.error(
                "❌ Error cargando Firebase:",
                error
            );

            return false;
        }
    },


    // =====================================================
    // GUARDADO COMPLETO
    // =====================================================

    async saveEverything(userId = null) {

        this.saveLocal();

        if (userId) {
            await this.saveToFirebase(userId);
        }
    }
};


export default saveManager;