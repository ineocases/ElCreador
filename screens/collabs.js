// screens/collabs.js
import gameState from '../engine/gameState.js';
import saveManager from '../engine/saveManager.js';
import { db } from '../firebase/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const collabsScreen = {
    async render() {
        const container = document.getElementById('collabsContainer');
        if (!container) return;

        container.innerHTML = `
            <div style="max-width: 600px; margin: 30px auto; color: white; text-align: center; background: #121214; padding: 20px; border-radius: 12px;">
                <h2 style="color: #00ff88;">🤝 Colaboraciones Nacionales</h2>
                <p>Hacé streams conjuntos con otros creadores de tu mismo nicho (${gameState.player.niche || 'General'}).</p>
                
                <div id="collabsList" style="margin: 20px 0; text-align: left;">Cargando colegas...</div>
                
                <button onclick="window.location.hash = '#dashboard'" style="padding: 8px 15px; background: #323238; color: white; border: none; cursor: pointer; border-radius: 6px;">Volver al Dashboard</button>
            </div>
        `;

        const listEl = document.getElementById('collabsList');
        try {
            const querySnapshot = await getDocs(collection(db, "creators_admin"));
            listEl.innerHTML = '';
            
            if (querySnapshot.empty) {
                listEl.innerHTML = '<p>No hay creadores disponibles en la base de datos.</p>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                // Filtramos por el nicho del jugador
                if (data.niche === gameState.player.niche) {
                    const card = document.createElement('div');
                    card.style.cssText = "background: #202024; padding: 12px; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;";
                    
                    card.innerHTML = `
                        <div>
                            <strong>${data.name}</strong><br>
                            <span style="font-size: 12px; color: #a0a0a0;">Subs: ${data.followers.toLocaleString()}</span>
                        </div>
                        <button class="btnCollab" data-name="${data.name}" data-subs="${data.followers}" style="padding: 6px 12px; background: #00ff88; color: black; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">Invitar a Collab</button>
                    `;
                    listEl.appendChild(card);
                }
            });

            if (listEl.innerHTML === '') {
                listEl.innerHTML = '<p>No hay creadores en tu mismo nicho todavía. ¡Agregalos desde el Panel Admin!</p>';
            }

            // Eventos de invitación
            document.querySelectorAll('.btnCollab').forEach(btn => {
                btn.onclick = (e) => {
                    const name = e.target.getAttribute('data-name');
                    const targetSubs = parseInt(e.target.getAttribute('data-subs'));
                    
                    // Ganancia basada en el tamaño del colega
                    const gainedSubs = Math.floor(targetSubs * 0.05);
                    const gainedFame = 8;

                    gameState.player.subs += gainedSubs;
                    gameState.player.fama += gainedFame;
                    saveManager.saveLocal();
                    saveManager.saveToFirebase();

                    alert(`¡Hiciste un stream histórico con ${name}!\nGanaste +${gainedSubs.toLocaleString()} suscriptores y +${gainedFame} de fama.`);
                    window.location.hash = '#dashboard';
                };
            });

        } catch (e) {
            listEl.innerHTML = "Error al cargar creadores para colaborar.";
            console.error(e);
        }
    }
};
