// Minijuegos contextuales: preparación del video + timing de crisis.
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { applyCrisisTimingResult } from "../engine/advancedSystems.js";
import { procesarPublicacionTrimestre } from "../engine/videoSystem.js";

export function renderMinigame(el) {
    const container = el || document.getElementById("minigameScreen");
    if (!container) return;
    const mg = gameState.pendingMinigame;
    if (!mg) { window.location.hash = "#dashboard"; return container; }

    if (mg.type === "videoSetup") return renderVideoSetup(container, mg);
    return renderCrisis(container, mg);
}

function renderVideoSetup(container, mg) {
    const video = gameState.pendingVideoSelection;
    if (!video) { gameState.pendingMinigame=null; window.location.hash="#publish"; return container; }
    container.innerHTML=`<div class="page-shell compact-page">${renderHeaderHud()}<section class="panel"><div class="eyebrow">🎬 MINIJUEGO · VIDEO DESTACADO</div><h1 class="page-title">Prepará: ${video.titulo}</h1><p class="page-subtitle">Elegí miniatura y horario. No existe una opción siempre correcta.</p><div class="setup-choice-block"><h3>1. Miniatura</h3><div class="mini-choice-grid">${[
        ["limpia","🧼 Limpia","+retención"],["impactante","🔥 Impactante","+click"],["personaje","😱 Expresión","+curiosidad"]
    ].map(x=>`<button class="setup-choice" data-thumb="${x[0]}"><b>${x[1]}</b><small>${x[2]}</small></button>`).join("")}</div></div><div class="setup-choice-block"><h3>2. Horario</h3><div class="mini-choice-grid">${[["mañana","☀️ Mañana"],["tarde","🌇 Tarde"],["noche","🌙 Noche"]].map(x=>`<button class="setup-choice" data-time="${x[0]}"><b>${x[1]}</b></button>`).join("")}</div></div><button id="publishPrepared" class="btn primary big" disabled>PUBLICAR VIDEO</button><p id="setupScore" class="muted center">Elegí ambas opciones.</p></section></div>`;
    let thumb=null,time=null;
    const update=()=>{container.querySelector('#publishPrepared').disabled=!(thumb&&time);if(thumb&&time)container.querySelector('#setupScore').textContent='Listo. Ahora publicá.'};
    container.querySelectorAll('[data-thumb]').forEach(b=>b.onclick=()=>{thumb=b.dataset.thumb;container.querySelectorAll('[data-thumb]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');update()});
    container.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{time=b.dataset.time;container.querySelectorAll('[data-time]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');update()});
    container.querySelector('#publishPrepared').onclick=()=>{
        const thumbBonus={limpia:1.02,impactante:1.12,personaje:1.08}[thumb];
        const timeBonus={mañana:.98,tarde:1.04,noche:1.10}[time];
        const impacto=(Number(video.tituloImpacto)||1)*thumbBonus*timeBonus;
        const costo=Number(video.costo)||0;
        if(gameState.player.dinero<costo){alert('No tenés suficiente dinero.');return;}
        gameState.player.dinero-=costo;
        procesarPublicacionTrimestre(video.titulo,video.enfoquePrincipal,video.enfoqueSecundario,{tituloImpacto:impacto,tituloHook:video.tituloHook,thumbnail:thumb,horario:time});
        gameState.registrarVideoPublicado(); gameState.lastVideo=video; gameState.pendingVideoSelection=null; gameState.pendingMinigame=null; gameState.guardar(); window.location.hash='#pasanCosas';
    };
    return container;
}

function renderCrisis(container, mg) {
    container.innerHTML=`<div class="page-shell compact-page">${renderHeaderHud()}<section class="panel crisis-game"><div class="eyebrow">⚡ MINIJUEGO · MOMENTO CLAVE</div><h1 class="page-title">${mg.title}</h1><p class="page-subtitle">${mg.text}</p><div class="crisis-story"><div class="crisis-bubble">👤 <b>Fan:</b> “Esto se está haciendo viral...”</div><div class="crisis-bubble muted-bubble">📱 El clip sigue sumando reproducciones.</div></div><div class="timing-wrap"><div class="timing-label"><span>RESPUESTA</span><b id="timingScore">0%</b></div><div class="timing-track"><div class="timing-green"></div><div class="timing-cursor" id="timingCursor"></div></div><button id="timingHit" class="btn primary big">PUBLICAR RESPUESTA</button></div><p id="timingStatus" class="muted center">Esperá el momento exacto.</p></section></div>`;
    const cursor=container.querySelector('#timingCursor'),scoreEl=container.querySelector('#timingScore'),status=container.querySelector('#timingStatus'),hit=container.querySelector('#timingHit');let pos=.08,dir=1,running=true,raf=0;
    const tick=()=>{if(!running)return;pos+=dir*.012;if(pos>=.94){pos=.94;dir=-1}if(pos<=.06){pos=.06;dir=1}cursor.style.left=`${pos*100}%`;const score=Math.max(0,Math.round(100-Math.abs(pos-.5)*190));scoreEl.textContent=`${score}%`;raf=requestAnimationFrame(tick)};
    hit.onclick=()=>{if(!running)return;running=false;cancelAnimationFrame(raf);const score=Math.max(0,Math.min(100,Math.round(100-Math.abs(pos-.5)*190)));status.textContent=score>=90?'🔥 Timing perfecto.':score>=65?'📈 Buena respuesta.':score>=40?'😐 Llegaste tarde.':'💀 Peor momento.';hit.disabled=true;applyCrisisTimingResult(gameState,score);gameState.guardar();setTimeout(()=>{if(gameState.pendingCollabOffer)location.hash='#collabs';else if(gameState.pendingSponsorOffer)location.hash='#sponsors';else if(gameState.time.trimestre===1){gameState.finalizarAño();location.hash='#yearSummary'}else location.hash='#videoResult'},900)};raf=requestAnimationFrame(tick);return container;
}
export const minigameScreen={render:renderMinigame}; export default minigameScreen;
