// screens/dashboard.js
import { gameState } from '../engine/gameState.js';

export function renderDashboard(el) {
    // Si la función recibe el elemento desde el router, lo usa. Si no, busca el ID.
    const container = el || document.getElementById('dashboardScreen');
    if (!container) return;

    const player = gameState.player;

    // 🛡️ SISTEMA ANTIFALLOS: Si cargamos una partida vieja que no tiene atributos, los creamos por defecto.
    if (!player.atributos) {
        player.atributos = {
            edicion: 10,
            carisma: 15,
            algoritmo: 10,
            marketing: 5,
            constancia: 15
        };
    }

    container.innerHTML = `
      <div style="padding: 20px; max-width: 1000px; margin: 0 auto; color: #fff;">
        
        <!-- HEADER -->
        <header style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 20px 25px; border-radius: 12px; border: var(--border-card); margin-bottom: 25px;">
          <div>
            <h1 style="margin: 0; font-size: 2rem; font-family: var(--font-heading); color: var(--accent-red); text-transform: uppercase;">
              ${player.canal || 'Mi Canal'}
            </h1>
            <p style="margin: 5px 0 0; color: var(--text-muted); font-size: 0.95rem;">
              Creador: <strong>${player.nombre || 'Desconocido'}</strong> | Nicho: <strong>${player.niche || 'General'}</strong>
            </p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #4cd137;">
              $${(player.dinero || 0).toLocaleString()}
            </div>
            <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
              Año ${player.año || 2026} • Trimestre ${player.trimestre || 1}
            </div>
          </div>
        </header>

        <!-- ESTADÍSTICAS PRINCIPALES -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="background: var(--bg-card); padding: 15px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Suscriptores</div>
            <div style="font-size: 1.6rem; font-weight: bold; margin-top: 5px; color: #fff;">${(player.suscriptores || 0).toLocaleString()}</div>
          </div>
          <div style="background: var(--bg-card); padding: 15px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Vistas Totales</div>
            <div style="font-size: 1.6rem; font-weight: bold; margin-top: 5px; color: #fff;">${(player.vistasTotales || 0).toLocaleString()}</div>
          </div>
          <div style="background: var(--bg-card); padding: 15px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Videos Subidos</div>
            <div style="font-size: 1.6rem; font-weight: bold; margin-top: 5px; color: #fff;">${player.videosSubidos || 0}</div>
          </div>
          <div style="background: var(--bg-card); padding: 15px; border-radius: 10px; border: var(--border-subtle); text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Fama</div>
            <div style="font-size: 1.6rem; font-weight: bold; margin-top: 5px; color: #fff;">${player.fama || 0}</div>
          </div>
        </div>

        <!-- HABILIDADES (ATRIBUTOS) -->
        <div style="background: var(--bg-card); padding: 20px; border-radius: 10px; border: var(--border-subtle); margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: var(--text-muted); font-size: 1rem; text-transform: uppercase;">Mis Habilidades</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <span style="background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem;">✂️ Edición: <strong>${player.atributos.edicion}</strong></span>
            <span style="background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem;">😎 Carisma: <strong>${player.atributos.carisma}</strong></span>
            <span style="background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem;">🤖 Algoritmo: <strong>${player.atributos.algoritmo}</strong></span>
            <span style="background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem;">📈 Marketing: <strong>${player.atributos.marketing}</strong></span>
            <span style="background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem;">🔥 Constancia: <strong>${player.atributos.constancia}</strong></span>
          </div>
        </div>

        <!-- NAVEGACIÓN -->
        <nav style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
          <a href="#publish" style="padding: 14px 28px; background: var(--accent-red); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;">📹 Publicar Video</a>
          <a href="#store" style="padding: 14px 28px; background: #2f3640; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;">🛒 Tienda</a>
          <a href="#collabs" style="padding: 14px 28px; background: #2f3640; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;">🤝 Colab</a>
          <a href="#sponsors" style="padding: 14px 28px; background: #2f3640; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;">💼 Sponsors</a>
        </nav>
      </div>
    `;
    
    return container;
}

// Exportamos también el objeto por compatibilidad con cualquier versión del router
export const dashboardScreen = {
    render: renderDashboard
};

export default dashboardScreen;
