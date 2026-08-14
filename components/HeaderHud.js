import { gameState } from "../engine/gameState.js";
import { icon } from "./Icon.js";

const nf = n => Number(n || 0).toLocaleString("es-AR");
const fameInt = n => Math.round(Number(n) || 0);

export function fameLevel(fame) {
    const f = fameInt(fame);
    if (f >= 80) return { name: "Leyenda", emoji: "🌈", min: 80, next: 100, color: "holographic" };
    if (f >= 55) return { name: "Ídolo", emoji: "👑", min: 55, next: 80, color: "gold" };
    if (f >= 30) return { name: "Referente", emoji: "⭐", min: 30, next: 55, color: "silver" };
    if (f >= 10) return { name: "Querido", emoji: "🥉", min: 10, next: 30, color: "bronze" };
    return { name: "Uno más del under", emoji: "⚪", min: 0, next: 10, color: "gray" };
}

function currentStep() {
    const h = window.location.hash;
    if (h === "#pretemporada" || h === "#newYear") return "pre";
    if (h === "#publish" || h === "#videoResult" || h === "#pasanCosas") return gameState.time.trimestre === 1 ? `t${gameState.time.trimestre}` : `t${gameState.time.trimestre}`;
    if (h === "#yearSummary" || h === "#awards") return "awards";
    if (h === "#careerEnd") return "fin";
    return gameState.time.trimestre === 1 ? `t${gameState.time.trimestre}` : `t${gameState.time.trimestre}`;
}

export function renderHeaderHud() {
    const p = gameState.player;
    if (!p) return "";
    const año = Number(p.año) || 2026;
    const trimestre = Number(p.trimestre) || 1;
    const edad = Number(p.edad) || (18 + año - 2026);
    const subs = Number(p.suscriptores) || 0;
    const fama = fameInt(p.fama);
    const dinero = Number(p.dinero) || 0;
    const level = fameLevel(fama);
    const step = currentStep();
    const progress = level.next === 100 ? fama : Math.round(((fama - level.min) / Math.max(1, level.next - level.min)) * 100);
    const canVelada = subs >= 1000000 && fama >= 40;
    const awardAccess = true;

    return `
        <header class="game-hud-compact">
            <div class="hud-channel">
                <strong>${p.canal || "Mi Canal"}</strong>
                <span>${p.niche || "Gaming"} · ${edad} años</span>
            </div>
            <div class="hud-season">
                <small>CARRERA · AÑO ${Math.max(1, año - 2025)}</small>
                <b>${año} · Año ${Math.max(1, año - 2025)} · T${trimestre}/4 · Edad ${edad}</b>
            </div>
            <nav class="hud-menu" aria-label="Menú de carrera">
                <a href="#store" class="hud-menu-btn">${icon("store",16)} <span>Tienda</span></a>
                <a href="#collabs" class="hud-menu-btn">${icon("group",16)} <span>Colabs</span></a>
                <a href="#sponsors" class="hud-menu-btn">${icon("briefcase",16)} <span>Sponsors</span></a>
                <a href="#awards" class="hud-menu-btn ${awardAccess ? "" : "locked"}">${icon("trophy",16)} <span>Premios</span>${awardAccess ? "" : " 🔒"}</a>
                <a href="#velada" class="hud-menu-btn ${canVelada ? "" : "locked"}">${icon("sports_mma",16)} <span>Velada</span>${canVelada ? "" : " 🔒"}</a>
                <button type="button" class="hud-menu-btn hud-career-btn" id="retireCareerBtn" aria-label="Menú de carrera">${icon("settings",16)} <span>MENÚ</span></button>
            </nav>
            <div class="hud-fame-level">
                <div class="player-figurita figurita-${level.color}"><span>${level.emoji}</span></div>
                <div class="fame-copy" title="Fama = reconocimiento público. Comunidad = qué tan conectada está tu audiencia. Reputación = cuánto confía la gente en vos."><small>FAMA · ${level.name}</small><b>${fama}/100</b><i><em style="width:${Math.max(0, Math.min(100, progress))}%"></em></i></div>
            </div>
            <div class="hud-numbers">
                <div><small>SUBS</small><b>${nf(subs)}</b></div>
                <div><small>$</small><b>$${nf(dinero)}</b></div>
            </div>
            <div class="career-timeline" aria-label="Timeline del año">
                ${[["pre","Pretemporada"],["t1","T1"],["t2","T2"],["t3","T3"],["t4","T4"],["awards","Premios"],["fin","Fin"]].map(([id,label])=>`<span class="timeline-step ${step===id?"active":""}">${label}</span>`).join('<b>→</b>')}
            </div>
        </header>
        <div class="saved-indicator" aria-live="polite">✓ Partida guardada</div>
    `;
}

export default renderHeaderHud;


// Menú global de carrera: queda disponible desde cualquier pantalla sin
// agregar otra ruta ni esconder "Borrar carrera" en un lugar difícil de hallar.
if (typeof document !== "undefined" && !window.__elCreadorCareerMenuInstalled) {
    window.__elCreadorCareerMenuInstalled = true;
    document.addEventListener("click", (event) => {
        const trigger = event.target.closest?.("#retireCareerBtn");
        if (!trigger) return;
        event.preventDefault();

        document.getElementById("careerMenuOverlay")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "careerMenuOverlay";
        overlay.className = "career-menu-overlay";
        overlay.innerHTML = `
            <div class="career-menu-modal">
                <div class="career-menu-icon">${icon("settings",26)}</div>
                <div class="eyebrow">MENÚ DE CARRERA</div>
                <h2>Tu partida</h2>
                <p>Acá podés volver al inicio o reiniciar la carrera actual.</p>
                <div class="career-menu-actions career-menu-actions-stack">
                    <button class="btn ghost" data-career-close>VOLVER</button>
                    <button class="btn secondary" data-career-retire>${icon("sports_mma",15)} RETIRARSE</button>
                    <button class="btn danger" data-career-reset-start>${icon("trash",15)} BORRAR CARRERA</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.addEventListener("click", e => { if (e.target === overlay || e.target.closest("[data-career-close]")) close(); });

        overlay.querySelector("[data-career-retire]")?.addEventListener("click", () => {
            if (!gameState.puedeRetirarse()) {
                alert("El retiro voluntario se desbloquea desde el año 8. A los 40 años es obligatorio.");
                return;
            }
            if (!confirm("¿Querés retirarte de tu carrera? Vas a cerrar esta partida y conservarás tu resumen final.")) return;
            gameState.retirarse();
            close();
        });

        overlay.querySelector("[data-career-reset-start]")?.addEventListener("click", () => {
            overlay.querySelector(".career-menu-modal").innerHTML = `
                <div class="career-menu-icon danger-icon">${icon("trash",26)}</div>
                <div class="eyebrow">SEGUNDA CONFIRMACIÓN</div>
                <h2>¿Borrar toda la carrera?</h2>
                <p>Se van a eliminar suscriptores, premios, dinero, relaciones, inventario y progreso. Esta acción no se puede deshacer.</p>
                <div class="career-menu-actions">
                    <button class="btn ghost" data-career-cancel>NO, VOLVER</button>
                    <button class="btn danger" data-career-reset-final>${icon("trash",15)} SÍ, BORRAR TODO</button>
                </div>`;
            overlay.querySelector("[data-career-cancel]")?.addEventListener("click", close);
            overlay.querySelector("[data-career-reset-final]")?.addEventListener("click", () => {
                gameState.resetPlayer();
                close();
            });
        });
    });
}
