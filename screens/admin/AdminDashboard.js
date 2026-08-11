// screens/admin/AdminDashboard.js
import { db } from '../../firebase/firebase.js'; 
// Ajusta la ruta de firebase si tu archivo está en otra ubicación

export function renderAdminDashboard(el) {
  const container = el || document.getElementById('adminScreen');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 20px; max-width: 800px; margin: 0 auto; color: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1 style="font-family: var(--font-heading); color: #8c7ae6; margin: 0;">⚙️ Panel de Administración</h1>
        <a href="#dashboard" style="color: var(--text-muted); text-decoration: none;">← Volver al Juego</a>
      </div>

      <div style="background: var(--bg-card); padding: 25px; border-radius: 12px; border: var(--border-card);">
        <h2 style="margin-top: 0; font-size: 1.3rem;">➕ Agregar Nuevo Creador (Rival/NPC)</h2>
        
        <form id="add-creator-form" style="display: flex; flex-direction: column; gap: 15px;">
          <div>
            <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">Nombre del Creador</label>
            <input type="text" id="admin-creator-name" required placeholder="Ej: Spreen" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: var(--border-subtle); border-radius: 6px; color: #fff; box-sizing: border-box;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">Nicho</label>
            <select id="admin-creator-niche" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.8); border: var(--border-subtle); border-radius: 6px; color: #fff; box-sizing: border-box;">
              <option value="Gaming">Gaming</option>
              <option value="Fútbol">Fútbol</option>
              <option value="Vlog">Vlog</option>
              <option value="Tecnología">Tecnología</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">Suscriptores Iniciales</label>
              <input type="number" id="admin-creator-subs" value="1000" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: var(--border-subtle); border-radius: 6px; color: #fff; box-sizing: border-box;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">Fama Inicial</label>
              <input type="number" id="admin-creator-fame" value="5" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: var(--border-subtle); border-radius: 6px; color: #fff; box-sizing: border-box;" />
            </div>
          </div>

          <button type="submit" style="padding: 12px; background: #8c7ae6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px;">
            💾 Guardar Personaje en Firestore
          </button>
        </form>
        <div id="admin-msg" style="margin-top: 15px; font-weight: bold;"></div>
      </div>
    </div>
  `;

  // Event listener para guardar
  const form = container.querySelector('#add-creator-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgDiv = container.querySelector('#admin-msg');
      msgDiv.style.color = '#fbc531';
      msgDiv.textContent = 'Guardando en Firebase...';

      const newCreator = {
        nombre: container.querySelector('#admin-creator-name').value,
        niche: container.querySelector('#admin-creator-niche').value,
        suscriptores: Number(container.querySelector('#admin-creator-subs').value),
        fama: Number(container.querySelector('#admin-creator-fame').value),
        creadoEn: new Date()
      };

      try {
        // Guarda directamente en la colección 'creators' de Firestore
        if (db) {
          const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
          await addDoc(collection(db, 'creators'), newCreator);
          msgDiv.style.color = '#4cd137';
          msgDiv.textContent = '✅ Creador guardado con éxito en Firestore.';
          form.reset();
        } else {
          msgDiv.style.color = '#e84118';
          msgDiv.textContent = '❌ Firebase no está inicializado.';
        }
      } catch (err) {
        console.error(err);
        msgDiv.style.color = '#e84118';
        msgDiv.textContent = '❌ Error al guardar: ' + err.message;
      }
    });
  }

  return container;
}

export const adminDashboardScreen = {
  render: renderAdminDashboard
};

export default adminDashboardScreen;
