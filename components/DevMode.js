// DEV MODE - oculto para jugadores normales.
// PC: Ctrl + Shift + D
// Móvil: 7 toques rápidos sobre el nombre/canal del HUD.
import { gameState } from "../engine/gameState.js";

let installed = false;
let taps = 0;
let tapTimer = null;

const nf = n => Number(n || 0).toLocaleString("es-AR");
const money = n => `$${nf(n)}`;

function esc(value) {
    return String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function installOverlay() {
    if (document.getElementById("devModeOverlay")) return document.getElementById("devModeOverlay");
    const overlay = document.createElement("div");
    overlay.id = "devModeOverlay";
    overlay.className = "dev-mode-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="dev-mode-panel" role="dialog" aria-modal="true" aria-label="DEV MODE">
            <div class="dev-mode-head">
                <div>
                    <div class="dev-mode-kicker">DEV MODE</div>
                    <h2>Herramientas de desarrollo</h2>
                </div>
                <button type="button" class="dev-close" data-dev-close aria-label="Cerrar">×</button>
            </div>
            <div class="dev-mode-state" id="devModeState"></div>
            <div class="dev-mode-actions">
                <button class="btn ghost" data-dev-action="year">+1 YEAR</button>
                <button class="btn ghost" data-dev-action="subs">+1M SUBS</button>
                <button class="btn ghost" data-dev-action="money">+$100K</button>
                <button class="btn ghost" data-dev-action="event">TRIGGER EVENT</button>
                <button class="btn ghost" data-dev-action="minigame">TEST MINIGAME</button>
                <button class="btn gold" data-dev-action="award">TEST AWARD</button>
                <button class="btn ghost" data-dev-action="collab">TEST COLLAB</button>
                <button class="btn danger" data-dev-action="reset">RESET</button>
            </div>
            <p class="dev-mode-note">Cada acción modifica la partida real y guarda el estado. DEV MODE no aparece en el juego normal.</p>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", event => {
        if (event.target === overlay || event.target.closest("[data-dev-close]")) closeDevMode();
    });
    overlay.addEventListener("click", handleAction);
    document.addEventListener("keydown", event => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
            event.preventDefault();
            toggleDevMode();
        }
        if (event.key === "Escape" && !overlay.hidden) closeDevMode();
    });
    return overlay;
}

function stateHtml() {
    const p = gameState.player || {};
    const t = Number(gameState.time?.trimestre || p.trimestre || 1);
    const y = Number(gameState.time?.año || p.año || 2026);
    return `
        <div><span>YEAR</span><b>${esc(y)} T${t}</b></div>
        <div><span>SUBS</span><b>${nf(p.suscriptores)}</b></div>
        <div><span>MONEY</span><b>${money(p.dinero)}</b></div>`;
}

function renderState() {
    const el = document.getElementById("devModeState");
    if (el) el.innerHTML = stateHtml();
}

function openDevMode() {
    if (!gameState.player?.partidaIniciada) return;
    const overlay = installOverlay();
    overlay.hidden = false;
    renderState();
    document.body.classList.add("dev-mode-open");
}

function closeDevMode() {
    const overlay = document.getElementById("devModeOverlay");
    if (overlay) overlay.hidden = true;
    document.body.classList.remove("dev-mode-open");
}

function toggleDevMode() {
    const overlay = installOverlay();
    if (overlay.hidden) openDevMode(); else closeDevMode();
}

function handleHudTap(event) {
    const target = event.target.closest?.("[data-dev-hud-trigger]");
    if (!target) return;
    taps += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1300);
    if (taps >= 7) {
        taps = 0;
        openDevMode();
    }
}

async function handleAction(event) {
    const button = event.target.closest?.("[data-dev-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.devAction;
    button.disabled = true;
    try {
        switch (action) {
            case "year":
                gameState.devAdvanceYear();
                renderState();
                window.location.hash = "#dashboard";
                break;
            case "subs":
                gameState.devAddSubscribers();
                renderState();
                window.location.hash = "#dashboard";
                break;
            case "money":
                gameState.devAddMoney();
                renderState();
                window.location.hash = "#dashboard";
                break;
            case "event":
                if (gameState.devTriggerEvent()) window.location.hash = "#dashboard";
                else alert("No se pudo generar un evento en este momento.");
                break;
            case "minigame":
                gameState.player.devTestPublish = true;
                gameState.player.pretemporada ||= { atributo: "constancia", efecto: "constancia", valor: 1, label: "DEV TEST" };
                gameState.guardar();
                closeDevMode();
                window.location.hash = "#publish";
                break;
            case "award":
                gameState.devTestAward();
                closeDevMode();
                window.location.hash = "#awards";
                break;
            case "collab":
                if (gameState.devTestCollab()) {
                    closeDevMode();
                    window.location.hash = "#collabs";
                } else alert("No se encontró un creador para la propuesta de prueba.");
                break;
            case "reset":
                if (confirm("¿Seguro que querés borrar la partida completa? Esta acción no se puede deshacer.")) {
                    gameState.devReset();
                    closeDevMode();
                }
                break;
        }
    } finally {
        button.disabled = false;
    }
}

export function installDevMode() {
    if (installed) return;
    installed = true;
    installOverlay();
    document.addEventListener("click", handleHudTap, { passive: true });
}
