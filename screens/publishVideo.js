// screens/publishVideo.js
import { renderHeaderHud } from '../components/HeaderHud.js';
import { gameState } from '../engine/gameState.js';
import { procesarPublicacionVideo } from '../engine/videoSystem.js';

export function renderPublishVideo(el) {
  const container = el || document.createElement('div');
  if (!el) {
    container.id = 'publishScreen';
  }

  const atributos = ['edicion', 'carisma', 'algoritmo', 'marketing', 'constancia'];
  const nombresAtributos = {
    edicion: '✂️ Edición',
    carisma: '😎 Carisma',
    algoritmo: '🤖 Algoritmo',
    marketing: '📈 Marketing',
    constancia: '🔥 Constancia'
  };

  container.innerHTML = `
    ${typeof renderHeaderHud === 'function' ? renderHeaderHud() : ''}
    <div style="max-width: 650px; margin: 30px auto; padding: 25px; background: var(--bg-card); border: var(--border-card); border-radius: 12px; color: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1 style="font-family: var(--font-heading); color: var(--accent-red); margin: 0; font-size: 1.8rem; text-transform: uppercase;">📹 Publicar Nuevo Video</h1>
        <a href="#dashboard" style="color: var(--text-muted); text-decoration: none; font-size: 0.9rem;">← Cancelar</a>
      </div>

      <form id="publish-video-form" style="display: flex; flex-direction: column; gap: 18px;">
        <div>
          <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Título del Video</label>
          <input type="text" id="video-title" required placeholder="Ej: PROBANDO ESTO POR 24 HORAS!" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.5); border: var(--border-subtle); border-radius: 8px; color: #fff; font-size: 1rem; box-sizing: border-box;" />
        </div>

        <div>
          <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Enfoque Principal</label>
          <select id="primary-attr" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.8); border: var(--border-subtle); border-radius: 8px; color: #fff; font-size: 1rem; box-sizing: border-box;">
            ${atributos.map(a => `<option value="${a}">${nombresAtributos[a]}</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Enfoque Secundario</label>
          <select id="secondary-attr" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.8); border: var(--border-subtle); border-radius: 8px; color: #fff; font-size: 1rem; box-sizing: border-box;">
            <!-- Se llena dinámicamente -->
          </select>
        </div>

        <button type="submit" style="margin-top: 10px; padding: 15px; background: var(--accent-red); color: white; border: none; border-radius: 8px; font-weight: bold; font-family: var(--font-heading); font-size: 1.1rem; cursor: pointer; text-transform: uppercase;">
          🚀 Subir Video
        </button>
      </form>
    </div>
  `;

  const primarySelect = container.querySelector('#primary-attr');
  const secondarySelect = container.querySelector('#secondary-attr');

  // Función para actualizar el selector secundario evitando duplicados
  const updateSecondaryOptions = () => {
    const selectedPrimary = primarySelect.value;
    const currentSecondary = secondarySelect.value;

    const available = atributos.filter(a => a !== selectedPrimary);
    
    secondarySelect.innerHTML = available
      .map(a => `<option value="${a}">${nombresAtributos[a]}</option>`)
      .join('');

    // Mantener la selección anterior si sigue estando disponible
    if (available.includes(currentSecondary)) {
      secondarySelect.value = currentSecondary;
    }
  };

  primarySelect.addEventListener('change', updateSecondaryOptions);
  updateSecondaryOptions(); // Inicialización

  // Manejador del submit
  const form = container.querySelector('#publish-video-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const titulo = container.querySelector('#video-title').value;
      const enfoquePrincipal = primarySelect.value;
      const enfoqueSecundario = secondarySelect.value;

      if (enfoquePrincipal === enfoqueSecundario) {
        alert("No podés elegir el mismo atributo 2 veces.");
        return;
      }

      // Procesar la creación del video mediante el motor de videoSystem
      procesarPublicacionVideo(titulo, enfoquePrincipal, enfoqueSecundario);

      // Redirigir a la pantalla de resultados
      window.location.hash = '#videoResult';
    });
  }

  return container;
}

export const publishVideoScreen = { render: renderPublishVideo };
export default publishVideoScreen;
