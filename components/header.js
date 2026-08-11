export function renderHeader(creator,formatNumber){
    return `<h1>${creator.name}</h1><p style="opacity:.9">${creator.niche.toUpperCase()} • ${creator.platform}</p>
    <div class="stats-bar">
      <div class="stat-item">📊 Suscriptores<strong>${formatNumber(creator.subscribers)}</strong></div>
      <div class="stat-item">💰 Dinero<strong>$${formatNumber(creator.money)}</strong></div>
      <div class="stat-item">📅 Semana<strong>${creator.week}/52</strong></div>
    </div>`;
}
