import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { runVeladaTrainingMinigame, runVeladaFightMinigame } from "../engine/minigames.js";
import { veladaTrainingDifficulty, completeVeladaTraining, fightVelada } from "../engine/advancedSystems.js";

const nf=n=>Number(n||0).toLocaleString("es-AR");

export async function renderVelada(el){
  const c=el||document.getElementById("veladaScreen"); if(!c)return;
  const p=gameState.player, year=Number(gameState.time.año), q=Number(gameState.time.trimestre);
  if(p.velada?.acceptedYear!==year){
    c.innerHTML=`<div class="page-shell">${renderHeaderHud()}<div class="panel center"><div class="eyebrow">🥊 LA VELADA</div><h1 class="page-title">No estás participando este año</h1><p class="muted">La invitación se ofrece únicamente durante la pretemporada y el combate solo puede hacerse en T4.</p><a class="btn ghost" href="#dashboard">VOLVER</a></div></div>`; return c;
  }
  const rival=gameState.creators.find(x=>x.id===p.velada.rival);
  if(q<4){
    const difficulty=veladaTrainingDifficulty(gameState,q);
    const done=Boolean(p.velada.completedQuarter?.[q]);
    c.innerHTML=`<div class="page-shell">${renderHeaderHud()}<div class="panel center"><div class="eyebrow">🥊 LA VELADA · PREPARACIÓN</div><h1 class="page-title">T${q} · Entrenamiento</h1><p class="muted">Rival actual: <b>${rival?.nombre||"Rival"}</b>. La dificultad de tu preparación depende de cómo llegaste al trimestre.</p><div class="feed-result-strip" style="margin:18px 0;"><span>🎯 Dificultad: <b>${difficulty.label}</b></span><span>🏋️ Preparación: <b>${Math.round(Number(p.velada.training||0))}</b></span><span>📅 T${q}/4</span></div>${done?`<div class="panel"><h2>Entrenamiento completado</h2><p>Resultado T${q}: <b>${Number(p.velada.trainingByQuarter?.[q]||0)}/100</b>.</p></div>`:`<button id="trainVelada" class="btn primary big">ENTRENAR · MINIJUEGO</button>`}<p class="muted" style="margin-top:18px;">El combate no se puede realizar todavía. Solo en T4.</p><a class="btn ghost" href="#dashboard">VOLVER</a></div></div>`;
    c.querySelector("#trainVelada")?.addEventListener("click",async()=>{ const b=c.querySelector("#trainVelada"); b.disabled=true; const score=await runVeladaTrainingMinigame(q,difficulty.key); completeVeladaTraining(gameState,q,score); renderVelada(c); });
    return c;
  }
  if(p.velada.fightCompletedYear===year){
    c.innerHTML=`<div class="page-shell">${renderHeaderHud()}<div class="panel center"><div class="eyebrow">🥊 LA VELADA · T4</div><h1>Combate terminado</h1><p class="muted">Ya completaste tu pelea contra <b>${rival?.nombre||"Rival"}</b> este año.</p><p>🏆 Victorias: ${p.velada.wins||0} · Derrotas: ${p.velada.losses||0}</p><a class="btn primary" href="#dashboard">SEGUIR CARRERA</a></div></div>`; return c;
  }
  const avg=Object.values(p.velada.trainingByQuarter||{}).reduce((a,b)=>a+Number(b||0),0)/3;
  const difficulty=veladaTrainingDifficulty(gameState,4);
  c.innerHTML=`<div class="page-shell">${renderHeaderHud()}<div class="panel center"><div class="eyebrow">🥊 LA VELADA · COMBATE</div><h1 class="page-title">${rival?.nombre||"Rival"} vs ${p.canal}</h1><p class="muted">Llegaste con un promedio de preparación de <b>${Math.round(avg)}/100</b>. Dificultad del combate: <b>${difficulty.label}</b>.</p><div class="feed-result-strip" style="margin:18px 0;"><span>🏋️ Preparación <b>${Math.round(avg)}</b></span><span>🎯 Dificultad <b>${difficulty.label}</b></span><span>🏆 T4</span></div><button id="fightVelada" class="btn primary big">PELEAR · MINIJUEGO</button><a class="btn ghost" href="#dashboard">VOLVER</a></div></div>`;
  c.querySelector("#fightVelada")?.addEventListener("click",async()=>{ const b=c.querySelector("#fightVelada"); b.disabled=true; const score=await runVeladaFightMinigame(difficulty.key); const r=fightVelada(gameState,score); gameState.guardar(); c.innerHTML=`<div class="page-shell">${renderHeaderHud()}<div class="panel center"><div class="eyebrow">🥊 RESULTADO</div><h1>${r?.win?'🏆 GANASTE':'💥 PERDISTE'}</h1><p>${r?.rival||"Rival"} hizo <b>${r?.rivalScore||0}</b>. Vos <b>${r?.score||0}</b>.</p><p class="muted">Dificultad: ${r?.difficulty||difficulty.label} · Preparación: ${r?.trainingAvg||Math.round(avg)}</p><a class="btn primary" href="#dashboard">SEGUIR CARRERA</a></div></div>`; });
  return c;
}

export const veladaScreen={render:renderVelada}; export default veladaScreen;
