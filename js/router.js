import { gameState } from '../engine/gameState.js';
import { renderCreateChannel } from '../screens/createChannel.js';
import { renderDashboard } from '../screens/dashboard.js';

// Mapeo de pantallas según la ruta hash
const routes = {
  '#createChannel': renderCreateChannel,
  '#dashboard': renderDashboard
};

export function initRouter() {
  const appContainer = document.getElementById('app');

  function handleRoute() {
    let hash = window.location.hash || '#createChannel';

    // Si la persona no creó su personaje, siempre se la fuerza a ir a #createChannel
    if (!gameState.player.nombre && hash !== '#createChannel') {
      window.location.hash = '#createChannel';
      return;
    }

    const renderScreen = routes[hash] || renderCreateChannel;

    // Limpia la pantalla previa y carga la nueva
    appContainer.innerHTML = '';
    appContainer.appendChild(renderScreen());
  }

  // Escucha cuando cambia el hash de la URL (ej: de #createChannel a #dashboard)
  window.addEventListener('hashchange', handleRoute);

  // Ejecuta la primera vez que arranca el juego
  handleRoute();
}
