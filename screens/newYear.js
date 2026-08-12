import { gameState } from "../engine/gameState.js";
import { renderHeaderHud, fameLevel } from "../components/HeaderHud.js";
const nf=n=>Number(n||0).toLocaleString("es-AR");
export function renderNewYear(el){
 const c=el||document.getElementById("newYearScreen"),p=gameState.player,s=gameState.lastYearSummary;
 if(!c)return;
 const level=fameLevel(p.fama);
 const premios=Array.isArray(s?.premiosGanados)?s.premiosGanados:[];
 const meta=p.suscriptores<1000?"Llegar a 1.000 suscriptores":p.suscriptores<10000?"Llegar a 10.000 suscriptores":p.suscriptores<100000?"Superar 100.000 suscriptores":"Mantener el crecimiento sin perder comunidad";
 c.innerHTML=`<div class="page-shell new-year-page">${renderHeaderHud()}<section class="new-year-hero panel"><div class="eyebrow">NUEVO AÑO</div><div class="new-year-number">${p.año}</div><h1>Año ${Math.max(1,p.año-2025)} de tu carrera</h1><p>Edad ${p.edad} · Nivel ${level.emoji} ${level.name}</p></section><div class="stat-grid four"><div class="stat-tile"><span>🏆 Premios</span><strong>${premios.length}</strong></div><div class="stat-tile"><span>👥 Subs</span><strong>${nf(p.suscriptores)}</strong></div><div class="stat-tile"><span>🔥 Fama</span><strong>${Math.round(p.fama)}/100</strong></div><div class="stat-tile"><span>🎯 Meta</span><strong style="font-size:.9rem">${meta}</strong></div></div><section class="panel"><div class="eyebrow">🎯 META SUGERIDA</div><h2>${meta}</h2><p class="muted">Tu carrera no tiene un camino único. La meta es una orientación, no una obligación.</p></section><button id="startPre" class="btn primary big next-button">🚀 ARRANCAR PRETEMPORADA</button></div>`;
 c.querySelector('#startPre').onclick=()=>{gameState.player.pretemporada=null;gameState.guardar();window.location.hash='#pretemporada'};
 return c;
}
export const newYearScreen={render:renderNewYear}; export default newYearScreen;
