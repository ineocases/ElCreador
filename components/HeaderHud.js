// components/HeaderHud.js
import { gameState } from "../engine/gameState.js";

export function renderHeaderHud() {
    const p = gameState.player;
    if (!p) return "";

    const año = Number(p.año) || 2026;
    const trimestre = Number(p.trimestre) || 1;
    const subs = Number(p.suscriptores) || 0;
    const fama = Number(p.fama) || 0;
    const dinero = Number(p.dinero) || 0;

    return `
        <header style="
            background:var(--bg-header-hud,#101010);
            border:var(--border-subtle);
            border-radius:12px;
            padding:15px 20px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
            margin-bottom:20px;
        ">
            <div>
                <h3 style="margin:0;font-family:var(--font-heading);">${p.canal || "Mi Canal"}</h3>
                <span style="font-size:.8rem;color:var(--text-muted);">${p.nombre || "Creador"} · ${p.niche || "Gaming"}</span>
            </div>

            <div style="background:rgba(229,9,20,.12);border:1px solid var(--accent-red);padding:7px 13px;border-radius:20px;text-align:center;">
                <span style="font-size:.7rem;color:var(--accent-red);font-weight:bold;display:block;text-transform:uppercase;">Temporada</span>
                <strong>Año ${año} · Trimestre ${trimestre}/2</strong>
            </div>

            <div style="display:flex;gap:16px;flex-wrap:wrap;">
                <div style="text-align:right;"><span style="font-size:.7rem;color:var(--text-muted);display:block;">SUSCRIPTORES</span><strong style="color:var(--accent-red);">${subs.toLocaleString()}</strong></div>
                <div style="text-align:right;"><span style="font-size:.7rem;color:var(--text-muted);display:block;">FAMA</span><strong style="color:var(--accent-yellow);">${fama}</strong></div>
                <div style="text-align:right;"><span style="font-size:.7rem;color:var(--text-muted);display:block;">DINERO</span><strong style="color:var(--accent-green);">$${dinero.toLocaleString()}</strong></div>
            </div>
        </header>
    `;
}

export default renderHeaderHud;
