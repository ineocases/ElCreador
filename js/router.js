import { gameState } from '../engine/gameState.js';
import { renderCreateChannel } from '../screens/createChannel.js';
import { renderDashboard } from '../screens/dashboard.js';
import { renderPublishVideo } from '../screens/publishVideo.js';
import { renderPasanCosas } from '../screens/pasanCosas.js';
import { renderVideoResult } from '../screens/videoResult.js';
import { renderPretemporada } from '../screens/pretemporada.js';

const routes = {
  '#createChannel': renderCreateChannel,
  '#dashboard': renderDashboard,
  '#publish': renderPublishVideo,
  '#pasanCosas': renderPasanCosas,
  '#videoResult': renderVideoResult,
  '#pretemporada': renderPretemporada
};

export function initRouter() {
  const appContainer = document.getElementById('app');

  function handleRoute() {
    let hash = window.location.hash || '#createChannel';

    if (!gameState.player.nombre && hash !== '#createChannel') {
      window.location.hash = '#createChannel';
      return;
    }

    const renderScreen = routes[hash] || renderCreateChannel;

    appContainer.innerHTML = '';
    appContainer.appendChild(renderScreen());
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
