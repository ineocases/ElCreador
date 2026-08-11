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
    if (h === "#publish" || h === "#videoResult" || h === "#pasanCosas") return gameState.time.trimestre === 1 ? "t1" : "t2";
    if (h === "#yearSummary" || h === "#awards") return "awards";
    if (h === "#careerEnd") return "fin";
    return gameState.time.trimestre === 1 ? "t1" : "t2";
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
    const awardAccess = fama >= 20 || subs >= 25000;

    return `
        <header class="game-hud-compact">
            <div class="hud-channel">
                <strong>${p.canal || "Mi Canal"}</strong>
                <span>${p.niche || "Gaming"} · ${edad} años</span>
            </div>
            <div class="hud-season">
                <small>CARRERA · AÑO ${Math.max(1, año - 2025)}</small>
                <b>${año} · Año ${Math.max(1, año - 2025)} · T${trimestre}/2 · Edad ${edad}</b>
            </div>
            <nav class="hud-menu" aria-label="Menú de carrera">
                <a href="#store" class="hud-menu-btn">${icon("store",16)} <span>Tienda</span></a>
                <a href="#collabs" class="hud-menu-btn">${icon("group",16)} <span>Colabs</span></a>
                <a href="#sponsors" class="hud-menu-btn">${icon("briefcase",16)} <span>Sponsors</span></a>
                <a href="#awards" class="hud-menu-btn ${awardAccess ? "" : "locked"}">${icon("trophy",16)} <span>Awards</span>${awardAccess ? "" : " 🔒"}</a>
                <a href="#velada" class="hud-menu-btn ${canVelada ? "" : "locked"}">${icon("sports_mma",16)} <span>Velada</span>${canVelada ? "" : " 🔒"}</a>
                <button type="button" class="hud-menu-btn hud-career-btn" id="retireCareerBtn">☰</button>
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
                ${[["pre","Pretemporada"],["t1","T1"],["t2","T2"],["awards","Awards"],["fin","Fin"]].map(([id,label])=>`<span class="timeline-step ${step===id?"active":""}">${label}</span>`).join('<b>→</b>')}
            </div>
        </header>
        <div class="saved-indicator" aria-live="polite">✓ Partida guardada</div>
    `;
}

export default renderHeaderHud;
