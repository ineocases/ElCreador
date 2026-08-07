// screens/admin/AdminDashboard.js
import { db } from '../../firebase/firebase.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const adminDashboardScreen = {
    async render() {
        const container = document.getElementById('adminContainer');
        if (!container) return;

        container.innerHTML = `
            <h2>Panel Administrador</h2>
            <p>Agregá nuevos creadores de contenido directamente a Firestore.</p>
            
            <div class="form-group" style="margin-bottom: 10px;">
                <label>Nombre del Creador:</label><br>
                <input type="text" id="adminName" placeholder="Ej: Coscu">
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
                <label>País:</label><br>
                <input type="text" id="adminCountry" placeholder="Ej: Argentina">
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
                <label>Nicho:</label><br>
                <input type="text" id="adminNiche" placeholder="Ej: Streaming">
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
                <label>Seguidores Iniciales:</label><br>
                <input type="number" id="adminFollowers" value="1000">
            </div>
            
            <button id="btnAddCreatorFirebase" style="padding: 8px 15px; background: #007bff; color: white; border: none; cursor: pointer;">Guardar Creador en Firebase</button>
            <hr style="margin: 20px 0;">
            
            <h3>Creadores Registrados en Firestore:</h3>
            <ul id="creatorsList" style="text-align: left; max-width: 400px; margin: 0 auto;">Cargando...</ul>
            
            <button onclick="window.location.hash = '#dashboard'" style="margin-top: 30px; padding: 8px 15px;">Volver al Juego</button>
        `;

        // Evento para guardar en Firebase
        document.getElementById('btnAddCreatorFirebase').onclick = async () => {
            const name = document.getElementById('adminName').value;
            const country = document.getElementById('adminCountry').value;
            const niche = document.getElementById('adminNiche').value;
            const followers = parseInt(document.getElementById('adminFollowers').value) || 0;

            if (!name) {
                alert("Por favor ingrese un nombre.");
                return;
            }

            try {
                await addDoc(collection(db, "creators_admin"), {
                    name, country, niche, followers, createdAt: new Date()
                });
                alert("¡Creador guardado en Firebase con éxito!");
                document.getElementById('adminName').value = '';
                this.loadCreatorsList();
            } catch (e) {
                console.error("Error al guardar creador:", e);
                alert("Error al guardar en Firebase. Revisa la consola.");
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
                listEl.innerHTML = '<li>No hay creadores registrados todavía.</li>';
                return;
            }
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const li = document.createElement('li');
                li.innerText = `${data.name} (${data.country}) - ${data.niche} [Subs: ${data.followers.toLocaleString()}]`;
                listEl.appendChild(li);
            });
        } catch (e) {
            listEl.innerText = "Error al cargar la lista desde Firebase.";
            console.error(e);
        }
    }
};