// Minijuego contextual: Timing de crisis.
// No aparece porque sí: solo se activa después de ciertos eventos narrativos.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { applyCrisisTimingResult } from "../engine/advancedSystems.js";

export function renderMinigame(el) {
    const container = el || document.getElementById("minigameScreen");
    if (!container) return;

    const mg = gameState.pendingMinigame;
    if (!mg) {
        window.location.hash = "#dashboard";
        return container;
    }

    container.innerHTML = `
      <div class="page-shell compact-page">
        ${renderHeaderHud()}
        <section class="panel crisis-game">
          <div class="eyebrow">⚡ MINIJUEGO · MOMENTO CLAVE</div>
          <h1 class="page-title">${mg.title}</h1>
          <p class="page-subtitle">${mg.text}</p>
          <div class="crisis-story">
            <div class="crisis-bubble">👤 <b>Fan:</b> “Esto se está haciendo viral...”</div>
            <div class="crisis-bubble muted-bubble">📱 El clip sigue sumando reproducciones.</div>
          </div>
          <div class="timing-wrap">
            <div class="timing-label"><span>RESPUESTA</span><b id="timingScore">0%</b></div>
            <div class="timing-track" id="timingTrack">
              <div class="timing-green"></div>
              <div class="timing-cursor" id="timingCursor"></div>
            </div>
            <button id="timingHit" class="btn primary big">PUBLICAR RESPUESTA</button>
          </div>
          <p id="timingStatus" class="muted center">Esperá el momento exacto y apretá el botón.</p>
        </section>
      </div>`;

    const cursor = container.querySelector("#timingCursor");
    const scoreEl = container.querySelector("#timingScore");
    const status = container.querySelector("#timingStatus");
    const hit = container.querySelector("#timingHit");
    let pos = 0.08;
    let dir = 1;
    let running = true;
    let raf = 0;

    const tick = () => {
        if (!running) return;
        pos += dir * 0.012;
        if (pos >= 0.94) { pos = 0.94; dir = -1; }
        if (pos <= 0.06) { pos = 0.06; dir = 1; }
        cursor.style.left = `${pos * 100}%`;
        const center = 0.50;
        const distance = Math.abs(pos - center);
        const score = Math.max(0, Math.round(100 - distance * 190));
        scoreEl.textContent = `${score}%`;
        raf = requestAnimationFrame(tick);
    };

    const finish = () => {
        if (!running) return;
        running = false;
        cancelAnimationFrame(raf);
        const center = 0.50;
        const distance = Math.abs(pos - center);
        const score = Math.max(0, Math.min(100, Math.round(100 - distance * 190)));
        const quality = score >= 90 ? "perfecto" : score >= 65 ? "bueno" : score >= 40 ? "regular" : "malo";
        status.textContent = quality === "perfecto"
            ? "🔥 Timing perfecto. Convertiste el problema en contenido."
            : quality === "bueno"
                ? "📈 Buena respuesta. La conversación te favoreció."
                : quality === "regular"
                    ? "😐 Llegaste tarde, pero no empeoraste demasiado la situación."
                    : "💀 Respondiste en el peor momento. El clip sigue circulando.";
        hit.disabled = true;
        applyCrisisTimingResult(gameState, score);
        gameState.guardar();
        setTimeout(() => {
            if (gameState.pendingCollabOffer) window.location.hash = "#collabs";
            else if (gameState.pendingSponsorOffer) window.location.hash = "#sponsors";
            else if (gameState.time.trimestre === 2) { gameState.finalizarAño(); window.location.hash = "#yearSummary"; }
            else window.location.hash = "#videoResult";
        }, 900);
    };

    hit.addEventListener("click", finish);
    raf = requestAnimationFrame(tick);
    return container;
}

export const minigameScreen = { render: renderMinigame };
export default minigameScreen;
