import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
const nf=n=>Number(n||0).toLocaleString("es-AR");
export function renderCareerEnd(el){
 const c=el||document.getElementById('careerEndScreen'),p=gameState.player,h=p.historialAños||[]; if(!c)return;
 const totalPremios=h.reduce((n,y)=>n+Number(y.premiosGanadosCount||0),0)+(p.awardsHistory||[]).length;
 c.innerHTML=`<div class="page-shell career-end-page">${renderHeaderHud()}<section class="new-year-hero panel"><div class="eyebrow">🏁 CARRERA TERMINADA</div><h1>${p.canal}</h1><p>${p.nombre} · ${p.edad} años · ${Math.max(1,p.año-2025)} años de carrera</p></section><div class="stat-grid four"><div class="stat-tile"><span>👥 Subs totales</span><strong>${nf(p.suscriptores)}</strong></div><div class="stat-tile"><span>👁️ Vistas</span><strong>${nf(p.vistasTotales)}</strong></div><div class="stat-tile"><span>🎬 Videos</span><strong>${nf(p.videosSubidos)}</strong></div><div class="stat-tile"><span>🏆 Premios</span><strong>${totalPremios}</strong></div></div><section class="panel"><div class="eyebrow">📜 PALMARÉS</div><p>${h.length?`Jugaste ${h.length} temporadas completas.`:'Carrera breve.'}</p><p>Virales: <b>${nf(p.stats?.videosVirales)}</b> · Fama final: <b>${Math.round(p.fama)}/100</b> · Nivel final: <b>${Math.round(p.fama)>=80?'🌈 Leyenda':Math.round(p.fama)>=60?'👑 Ídolo':Math.round(p.fama)>=40?'⭐ Referente':Math.round(p.fama)>=20?'🥉 Querido':'⚪ Uno más del under'}</b></p></section><button id="shareCareer" class="btn primary big">📤 COMPARTIR MI CARRERA</button><a href="#createChannel" class="btn ghost big" style="margin-top:8px">NUEVA CARRERA</a></div>`;
 c.querySelector('#shareCareer').onclick=async()=>{const text=`Mi carrera en El Creador: ${p.canal} · ${p.suscriptores.toLocaleString()} subs · ${p.vistasTotales.toLocaleString()} vistas · fama ${Math.round(p.fama)}/100.`;try{if(navigator.share)await navigator.share({title:'Mi carrera en El Creador',text});else await navigator.clipboard.writeText(text);alert('Carrera copiada para compartir.')}catch{}};
 return c;
}
export const careerEndScreen={render:renderCareerEnd}; export default careerEndScreen;
