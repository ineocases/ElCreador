// screens/sponsors.js
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";
const nf = n => Number(n || 0).toLocaleString();
function continuar(){ setTimeout(()=>{ if(gameState.time.trimestre===2){gameState.finalizarAño();window.location.hash="#yearSummary";} else window.location.hash="#videoResult"; },180); }
export function renderSponsors(el){
 const container=el||document.getElementById("sponsorsScreen"); if(!container)return;
 const offer=gameState.pendingSponsorOffer; const history=(gameState.sponsors||[]).slice().reverse().slice(0,12);
 container.innerHTML=`<div class="page-shell compact-page">${renderHeaderHud()}
 <div class="dashboard-top"><div><div class="eyebrow">💼 MARCAS</div><h1 class="page-title">Propuestas comerciales</h1><p class="page-subtitle">Las marcas te encuentran cuando tu canal alcanza el nivel que buscan.</p></div><a href="#dashboard" class="btn ghost">← Volver</a></div>
 ${offer?`<section class="panel contract-card sponsor-offer-card"><div class="eyebrow">📩 PROPUESTA RECIBIDA</div><h2>${offer.name}</h2><p>${offer.name} quiere trabajar con <b>${gameState.player.canal}</b>.</p><div class="contract-stats"><div><span>Pago</span><b>$${nf(offer.pago)}</b></div><div><span>Duración</span><b>${offer.duration} trimestre${offer.duration===1?"":"s"}</b></div><div><span>Prestigio</span><b>+${nf(offer.prestige)}</b></div></div>${offer.tipo==="casino"||offer.tipo==="cripto"?`<p class="muted">⚠️ Es una propuesta de alto riesgo reputacional.</p>`:""}<div class="contract-actions"><button id="negotiateSponsor" class="btn ghost">NEGOCIAR +20%</button><button id="acceptSponsor" class="btn primary">ACEPTAR</button><button id="rejectSponsor" class="btn ghost">RECHAZAR</button></div></section>`:`<section class="panel empty-opportunity"><div class="empty-icon">💼</div><h2>No tenés una propuesta pendiente.</h2><p>Seguí creando. Las marcas aparecen solas cuando tu canal cumple sus requisitos.</p></section>`}
 <section class="panel"><div class="eyebrow">📋 HISTORIAL</div><h2>Tus acuerdos</h2>${history.length?`<div class="mini-list">${history.map(s=>`<div class="history-row"><div><b>${s.name}</b><span>${s.estado==="aceptado"?"Aceptado":"Rechazado"}</span></div><strong>${s.estado==="aceptado"?`$${nf(s.pago)}`:"—"}</strong></div>`).join("")}</div>`:`<p class="muted">Todavía no cerraste ningún acuerdo.</p>`}</section></div>`;
 container.querySelector("#negotiateSponsor")?.addEventListener("click",()=>{if(!gameState.negociarSponsor(Math.round(Number(offer?.pago||0)*.20)))alert("La marca rechazó la negociación.");renderSponsors(container);});
 container.querySelector("#acceptSponsor")?.addEventListener("click",()=>{if(gameState.aceptarSponsor())continuar();});
 container.querySelector("#rejectSponsor")?.addEventListener("click",()=>{if(gameState.rechazarSponsor())continuar();});
 return container;
}
export const sponsorsScreen={render:renderSponsors}; export default sponsorsScreen;
