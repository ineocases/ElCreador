// engine/saveManager.js
import { gameState } from './gameState.js';
import { db } from '../firebase/firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const saveManager = {
    SAVE_KEY: 'elCreador_saveData',

    // 1. GUARDADO LOCAL
    saveLocal() {
        try {
            const dataToSave = {
                player: gameState.player,
                time: gameState.time,
                inventory: gameState.inventory
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(dataToSave));
            console.log("💾 Partida guardada localmente.");
        } catch (error) {
            console.error("Error al guardar la partida localmente:", error);
        }
    },

    // 2. CARGA LOCAL
    loadLocal() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                gameState.player = parsedData.player;
                gameState.time = parsedData.time;
                gameState.inventory = parsedData.inventory;
                console.log("📂 Partida cargada localmente.");
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error al cargar la partida local:", error);
            return false;
        }
    },

    // 3. GUARDADO EN FIREBASE
    async saveToFirebase(userId = "defaultUser") {
        try {
            const dataToSave = {
                player: gameState.player,
                time: gameState.time,
                inventory: gameState.inventory,
                updatedAt: new Date()
            };
            await setDoc(doc(db, "creators", userId), dataToSave, { merge: true });
            console.log("☁️ Partida guardada en Firebase exitosamente.");
        } catch (error) {
            console.error("Error al guardar en Firebase:", error);
        }
    },

    // 4. CARGA DESDE FIREBASE
    async loadFromFirebase(userId = "defaultUser") {
        try {
            const docRef = doc(db, "creators", userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                gameState.player = data.player;
                gameState.time = data.time;
                gameState.inventory = data.inventory;
                this.saveLocal(); // Actualizamos local también
                console.log("☁️ Partida cargada desde Firebase.");
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error al cargar de Firebase:", error);
            return false;
        }
    }
};

export default saveManager;
