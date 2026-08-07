// screens/admin/AdminDashboard.js
import { db } from '../../firebase/firebase.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const adminDashboardScreen = {
    async render() {
        const container = document.getElementById('adminContainer');
        if (!container) return;

        container.innerHTML = `
            <div style="max-width: 600px; margin: 30px auto; color: white; text-align: left; background: #121214; padding: 20px; border-radius: 12px;">
                <h2 style="color: #00ff88;">🎛️ Panel Admin - Creadores Argentinos</h2>
                <p style="color: #a0a0a0;">Agregá colegas del streaming para habilitar colaboraciones.</p>
                
                <div style="margin-bottom: 10px;">
                    <label>Nombre del Creador:</label><br>
                    <input type="text" id="adminName" placeholder="Ej: Davo Xeneize" style="width: 100%; padding: 8px; background: #202024; border: 1px solid #323238; color: white;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Nicho:</label><br>
                    <select id="adminNiche" style="width: 100%; padding: 8px; background: #202024; border: 1px solid #323238; color: white;">
                        <option value="gaming_futbol">Gaming & Fútbol</option>
                        <option value="tech">Tecnología</option>
                        <option value="irl_vlog">Vlogs, IRL & Charla</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>Suscriptores del Creador:</label><br>
                    <input type="number" id="adminFollowers" value="500000" style="width: 100%; padding: 8px; background: #202024; border: 1px solid #323238; color: white;">
                </div>
                
                <button id="btnAddCreatorFirebase" style="padding: 10px 20px; background: #00ff88; color: black; font-weight: bold; border: none; cursor: pointer; border-radius: 6px;">Guardar Creador</button>
                <button id="btnSeedDefaults" style="padding: 10px 20px; background: #3b82f6; color: white; font-weight: bold; border: none; cursor: pointer; border-radius: 6px; margin-left: 10px;">Cargar Famosos por Defecto</button>
                
                <hr style="margin: 20px 0; border-color: #323238;">
                
                <h3>Lista en Firestore:</h3>
                <ul id="creatorsList" style="padding-left: 20px; color: #d0d0d0;">Cargando...</ul>
                
                <button onclick="window.location.hash = '#dashboard'" style="margin-top: 20px; padding: 8px 15px; background: #323238; color: white; border: none; cursor: pointer; border-radius: 6px;">Volver al Juego</button>
            </div>
        `;

        // Botón para cargar famosos predeterminados de Argentina
        document.getElementById('btnSeedDefaults').onclick = async () => {
            const defaults = [
                { name: "Davo Xeneize", niche: "gaming_futbol", followers: 1500000, country: "Argentina" },
                { name: "Momo", niche: "gaming_futbol", followers: 2000000, country: "Argentina" },
                { name: "SupraPixel", niche: "tech", followers: 1200000, country: "Argentina" },
                { name: "Mernuel", niche: "irl_vlog", followers: 800000, country: "Argentina" }
            ];
            try {
                for (let creator of defaults) {
                    await addDoc(collection(db, "creators_admin"), { ...creator, createdAt: new Date() });
                }
                alert("¡Creadores argentinos cargados con éxito!");
                this.loadCreatorsList();
            } catch (e) {
                console.error(e);
                alert("Error al precargar creadores.");
            }
        };

        // Evento guardar individual
        document.getElementById('btnAddCreatorFirebase').onclick = async () => {
            const name = document.getElementById('adminName').value;
            const niche = document.getElementById('adminNiche').value;
            const followers = parseInt(document.getElementById('adminFollowers').value) || 0;

            if (!name) return alert("Ingrese un nombre.");

            try {
                await addDoc(collection(db, "creators_admin"), { name, niche, followers, country: "Argentina", createdAt: new Date() });
                alert("¡Creador guardado!");
                document.getElementById('adminName').value = '';
                this.loadCreatorsList();
            } catch (e) {
                console.error(e);
            }
        };

        this.loadCreatorsList();
    },

    async loadCreatorsList() {
        const listEl = document.getElementById('creatorsList');
        if (!listEl) return;
        try {
            const querySnapshot = await getDocs(collection(db, "creators_admin"));
            listEl.innerHTML = '';
            if (querySnapshot.empty) {
                listEl.innerHTML = '<li>No hay creadores registrados.</li>';
                return;
            }
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const li = document.createElement('li');
                li.innerText = `${data.name} (${data.niche}) - Subs: ${data.followers.toLocaleString()}`;
                listEl.appendChild(li);
            });
        } catch (e) {
            listEl.innerText = "Error al cargar la lista.";
        }
    }
};
