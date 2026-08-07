// screens/store.js
import { gameState } from '../engine/gameState.js';

export function renderStore(el) {
  const container = el || document.getElementById('storeScreen');
  if (!container) return;

  const player = gameState.player;
  if (!player.comprasRealizadas) player.comprasRealizadas = [];

  const items = [
    { id: 'mic_usb', nombre: '🎙️ Micrófono Profesional', precio: 300, desc: '+10 Carisma', aplicar: () => player.atributos.carisma += 10 },
    { id: 'camara_hd', nombre: '📷 Cámara 4K', precio: 750, desc: '+15 Edición', aplicar: () => player.atributos.edicion += 15 },
    { id: 'curso_seo', nombre: '📚 Curso de Algoritmo YouTube', precio: 500, desc: '+12 Algoritmo', aplicar: () => player.atributos.algoritmo += 12 },
    { id: 'campana_ads', nombre: '📢 Campaña en Google Ads', precio: 1200, desc: '+20 Marketing y +5 Fama', aplicar: () => { player.atributos.marketing += 20; player.fama += 5; } },
    { id: 'silla_gamer', nombre: '⚡ Silla Ergonómica Pro', precio: 800, desc: '+15 Constancia', aplicar: () => player.atributos.constancia += 15 },
    { id: 'editor_privado', nombre: '✂️ Contratar Editor Freelance', precio: 2500, desc: '+30 Edición y +10 Fama', aplicar: () => { player.atributos.edicion += 30; player.fama += 10; } }
  ];

  container.innerHTML = `
    <div style="max-width: 900px; margin: 30px auto; padding: 25px; background: var(--bg-card); border: var(--border-card); border-radius: 12px; color: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1 style="font-family: var(--font-heading); color: #fbc531; margin: 0; text-transform: uppercase;">🛒 Tienda de Creadores</h1>
        <div>
          <span style="font-size: 1.2rem; font-weight: bold; color: #4cd137; margin-right: 15px;">💰 $${player.dinero.toLocaleString()}</span>
          <a href="#dashboard" style="color: var(--text-muted); text-decoration: none;">← Volver al Dashboard</a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;" id="store-grid">
        ${items.map(item => {
          const yaComprado = player.comprasRealizadas.includes(item.id);
          const puedeComprar = player.dinero >= item.precio && !yaComprado;

          return `
            <div style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 10px; border: var(--border-subtle); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="margin: 0 0 8px; font-size: 1.1rem; color: #fff;">${item.nombre}</h3>
                <p style="color: #4cd137; font-weight: bold; margin: 0 0 10px;">${item.desc}</p>
                <div style="font-size: 1.2rem; font-weight: bold; color: #fbc531; margin-bottom: 15px;">$${item.precio.toLocaleString()}</div>
              </div>

              <button class="buy-btn" data-id="${item.id}" ${!puedeComprar ? 'disabled' : ''} style="
                padding: 10px;
                background: ${yaComprado ? '#718093' : (puedeComprar ? '#4cd137' : '#718093')};
                color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: ${puedeComprar ? 'pointer' : 'not-allowed'};
              ">
                ${yaComprado ? '✅ Comprado' : (puedeComprar ? 'Comprar' : 'Dinero Insuficiente')}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = e.target.dataset.id;
      const item = items.find(i => i.id === itemId);

      if (item && player.dinero >= item.precio && !player.comprasRealizadas.includes(itemId)) {
        player.dinero -= item.precio;
        item.aplicar();
        player.comprasRealizadas.push(itemId);
        renderStore(container); // Re-renderizar la vista
      }
    });
  });

  return container;
}

export const storeScreen = { render: renderStore };
export default storeScreen;
