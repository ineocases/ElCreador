// screens/admin/AdminDashboard.js
import { db } from '../../firebase/firebase.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const adminDashboardScreen = {
    activeTab: 'streamers',

    async render() {
        const container = document.getElementById('adminContainer');
        if (!container) return;

        container.innerHTML = `
            <div style="max-width: 650px; margin: 20px auto; color: white; text-align: left; background: #121214; padding: 25px; border-radius: 12px; border: 1px solid #27272a;">
                <h2 style="color: #00ff88; margin-top:0;">🎛️ Panel de Control General</h2>
                <p style="color: #a1a1aa; font-size: 14px;">Administrá los elementos globales del juego guardados en Firestore.</p>
                
                <!-- Pestañas de Navegación Admin -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #27272a; padding-bottom: 10px;">
                    <button id="tabBtnStreamers" style="padding: 8px 16px; background: #00ff88; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Streamers</button>
                    <button id="tabBtnSponsors" style="padding: 8px 16px; background: #27272a; color: white; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Sponsors / Marcas</button>
                </div>

                <!-- FORMULARIO STREAMERS -->
                <div id="sectionStreamers">
                    <h3 style="color: #38bdf8;">Agregar Creador / Streamer</h3>
                    <div style="margin-bottom: 10px;">
                        <label>Nombre:</label><br>
                        <input type="text" id="streamerName" placeholder="Ej: Coscu" style="width: 100%; padding: 8px; background: #18181b; border: 1px solid #3f3f46; color: white; border-radius: 4px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label>Nicho:</label><br>
                        <select id="streamerNiche" style="width: 100%; padding: 8px; background: #18181b; border: 1px solid #3f3f46; color: white; border-radius: 4px; margin-top: 4px;">
                            <option value="gaming_futbol">Gaming & Fútbol</option>
                            <option value="tech">Tecnología</option>
                            <option value="irl_vlog">Vlogs, IRL & Charla</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>Suscriptores:</label><br>
                        <input type="number" id="streamerSubs" value="100000" style="width: 100%; padding: 8px; background: #18181b; border: 1px solid #3f3f46; color: white; border-radius: 4px; margin-top: 4px;">
                    </div>
                    <button id="btnAddStreamer" style="padding: 8px 16px; background: #38bdf8; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Guardar Streamer</button>
                    <button id="btnSeedStreamers" style="padding: 8px 16px; background: #27272a; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">Precargar Famosos</button>
                </div>

                <!-- FORMULARIO SPONSORS -->
                <div id="sectionSponsors" style="display: none;">
                    <h3 style="color: #facc15;">Agregar Sponsor / Marca</h3>
                    <div style="margin-bottom: 10px;">
                        <label>Nombre de la Marca:</label><br>
                        <input type="text" id="sponsorName" placeholder="Ej: Mercado Pago" style="width: 100%; padding: 8px; background: #18181b; border: 1px solid #3f3f46; color: white; border-radius: 4px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label>Pago Trimestral (USD):</label><br>
                        <input type="number" id="sponsorPay" value="1500" style="width: 100%; padding: 8px; background: #18181b; border: 1px solid #3f3f46; color: white; border-radius: 4px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>Suscriptores Mínimos Requeridos:</label><br>
                        <input type="number" id="sponsorMinSubs" value="50000" style="width: 100%; padding: 8px; background: #18181b; border: 1px solid #3f3f46; color: white; border-radius: 4px; margin-top: 4px;">
                    </div>
                    <button id="btnAddSponsor" style="padding: 8px 16px; background: #facc15; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Guardar Sponsor</button>
                    <button id="btnSeedSponsors" style="padding: 8px 16px; background: #27272a; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">Precargar Marcas Arg</button>
                </div>

                <hr style="margin: 20px 0; border-color: #27272a;">

                <!-- LISTADO REGISTRADO -->
                <h4 id="listTitle" style="color: #a1a1aa;">Elementos Guardados:</h4>
                <ul id="adminItemsList" style="padding-left: 20px; color: #e4e4e7; font-size: 14px;">Cargando...</ul>

                <button onclick="window.location.hash = '#dashboard'" style="margin-top: 15px; padding: 8px 16px; background: #27272a; color: white; border: none; border-radius: 6px; cursor: pointer;">Volver al Juego</button>
            </div>
        `;

        this.bindEvents();
        this.loadList();
    },

    bindEvents() {
        const tabStreamers = document.getElementById('tabBtnStreamers');
        const tabSponsors = document.getElementById('tabBtnSponsors');
        const secStreamers = document.getElementById('sectionStreamers');
        const secSponsors = document.getElementById('sectionSponsors');

        tabStreamers.onclick = () => {
            this.activeTab = 'streamers';
            tabStreamers.style.background = '#00ff88';
            tabStreamers.style.color = 'black';
            tabSponsors.style.background = '#27272a';
            tabSponsors.style.color = 'white';
            secStreamers.style.display = 'block';
            secSponsors.style.display = 'none';
            this.loadList();
        };

        tabSponsors.onclick = () => {
            this.activeTab = 'sponsors';
            tabSponsors.style.background = '#facc15';
            tabSponsors.style.color = 'black';
            tabStreamers.style.background = '#27272a';
            tabStreamers.style.color = 'white';
            secSponsors.style.display = 'block';
            secStreamers.style.display = 'none';
            this.loadList();
        };

        // Guardar Streamer
        document.getElementById('btnAddStreamer').onclick = async () => {
            const name = document.getElementById('streamerName').value;
            const niche = document.getElementById('streamerNiche').value;
            const followers = parseInt(document.getElementById('streamerSubs').value) || 0;
            if (!name) return alert("Ingresá un nombre.");

            try {
                await addDoc(collection(db, "creators_admin"), { name, niche, followers, country: "Argentina", createdAt: new Date() });
                alert("Streamer guardado.");
                document.getElementById('streamerName').value = '';
                this.loadList();
            } catch (e) { console.error(e); }
        };

        // Guardar Sponsor
        document.getElementById('btnAddSponsor').onclick = async () => {
            const name = document.getElementById('sponsorName').value;
            const pay = parseInt(document.getElementById('sponsorPay').value) || 0;
            const minSubs = parseInt(document.getElementById('sponsorMinSubs').value) || 0;
            if (!name) return alert("Ingresá el nombre de la marca.");

            try {
                await addDoc(collection(db, "sponsors_admin"), { name, pay, minSubs, createdAt: new Date() });
                alert("Sponsor guardado.");
                document.getElementById('sponsorName').value = '';
                this.loadList();
            } catch (e) { console.error(e); }
        };

        // Precarga de Streamers
        document.getElementById('btnSeedStreamers').onclick = async () => {
            const defaults = [
                { name: "Davo Xeneize", niche: "gaming_futbol", followers: 1500000, country: "Argentina" },
                { name: "Momo", niche: "gaming_futbol", followers: 2000000, country: "Argentina" },
                { name: "SupraPixel", niche: "tech", followers: 1200000, country: "Argentina" },
                { name: "Mernuel", niche: "irl_vlog", followers: 800000, country: "Argentina" }
            ];
            for (let item of defaults) await addDoc(collection(db, "creators_admin"), { ...item, createdAt: new Date() });
            alert("Streamers cargados.");
            this.loadList();
        };

        // Precarga de Sponsors
        document.getElementById('btnSeedSponsors').onclick = async () => {
            const defaults = [
                { name: "Speed Unlimited", pay: 800, minSubs: 5000 },
                { name: "Mercado Pago", pay: 2500, minSubs: 50000 },
                { name: "Globant", pay: 5000, minSubs: 150000 },
                { name: "Manaos", pay: 400, minSubs: 1000 }
            ];
            for (let item of defaults) await addDoc(collection(db, "sponsors_admin"), { ...item, createdAt: new Date() });
            alert("Sponsors cargados.");
            this.loadList();
        };
    },

    async loadList() {
        const listEl = document.getElementById('adminItemsList');
        const titleEl = document.getElementById('listTitle');
        if (!listEl) return;

        listEl.innerHTML = 'Cargando...';
        const colName = this.activeTab === 'streamers' ? "creators_admin" : "sponsors_admin";
        titleEl.innerText = this.activeTab === 'streamers' ? "Streamers en Firestore:" : "Sponsors en Firestore:";

        try {
            const querySnapshot = await getDocs(collection(db, colName));
            listEl.innerHTML = '';
            if (querySnapshot.empty) {
                listEl.innerHTML = '<li>No hay registros.</li>';
                return;
            }
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const li = document.createElement('li');
                if (this.activeTab === 'streamers') {
                    li.innerText = `${data.name} (${data.niche}) - Subs: ${data.followers.toLocaleString()}`;
                } else {
                    li.innerText = `${data.name} - Pago: US$${data.pay}/trimestre (Req: ${data.minSubs.toLocaleString()} subs)`;
                }
                listEl.appendChild(li);
            });
        } catch (e) {
            listEl.innerText = "Error al cargar datos de Firestore.";
            console.error(e);
        }
    }
};
