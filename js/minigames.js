// js/minigames.js
let mgInterval = null;

function startTimingMinigame(callback) {
  const modal = document.getElementById("minigame-modal");
  modal.classList.add("show");
  const bar = document.getElementById("mg-bar-fill");
  const zone = document.getElementById("mg-zone");
  let pos = 0, dir = 1;
  const zoneStart = 40 + Math.random()*10;
  const zoneWidth = 18;
  zone.style.left = zoneStart + "%";
  zone.style.width = zoneWidth + "%";

  mgInterval = setInterval(() => {
    pos += dir * 2.2;
    if (pos >= 100) { pos = 100; dir = -1; }
    if (pos <= 0)   { pos = 0;   dir = 1; }
    bar.style.width = pos + "%";
  }, 16);

  document.getElementById("mg-btn").onclick = () => {
    clearInterval(mgInterval);
    const hit = pos >= zoneStart && pos <= zoneStart + zoneWidth;
    modal.classList.remove("show");
    callback(hit);
  };
}
