import { icon } from "../components/Icon.js";

// Minijuegos elegidos para el loop principal de publicación:
// 0 Timing de publicación · 1 Miniatura · 2 Aprovechar tendencia · 3 Votación de Awards
let activeCleanup = null;

function cleanupActiveMinigame() {
    try { activeCleanup?.(); } catch (error) { console.warn("No se pudo limpiar el minijuego:", error); }
    activeCleanup = null;
    document.getElementById("minigameOverlay")?.remove();
    document.getElementById("minigameIntroOverlay")?.remove();
    document.getElementById("minigameResultOverlay")?.remove();
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function overlayBase(title, subtitle) {
    const old = document.getElementById("minigameOverlay"); old?.remove();
    const el = document.createElement("div");
    el.id = "minigameOverlay"; el.className = "minigame-overlay";
    el.innerHTML = `<div class="minigame-modal"><div class="minigame-eyebrow">MINIJUEGO</div><h2>${title}</h2><p class="minigame-subtitle">${subtitle}</p><div id="minigameBody"></div></div>`;
    document.body.appendChild(el); return el;
}

function finish(overlay, score) {
    const final = clamp(Math.round(score), 0, 100);
    try { activeCleanup?.(); } catch {}
    activeCleanup = null;
    overlay?.remove();
    return final;
}

function info(type) {
    return [
        { title: "Timing de publicación", desc: "El punto verde va rápido. Tocá cuando el cursor entre en la zona ideal.", goal: "Precisión = mejor rendimiento del video." },
        { title: "Diseñá la miniatura", desc: "Armá la miniatura por capas: fondo, cabeza, cuerpo y piernas. Encajá cada parte en el centro; podés salirte un poco.", goal: "Cuanto mejor encajes cada pieza, mejor queda la miniatura y más CTR conseguís." },
        { title: "Aprovechá la tendencia", desc: "Elegí qué tendencia aprovechar para tu próximo contenido antes de que pierda fuerza.", goal: "Importan la velocidad, el encaje con tu nicho y la saturación." },
        { title: "Votación de Awards", desc: "Analizá tres candidatos y elegí quién merece ganar según rendimiento e impacto.", goal: "No siempre gana el más grande: evaluá la temporada completa." }
    ][type % 4];
}

function intro(type) {
    const i = info(type);
    return new Promise(resolve => {
        cleanupActiveMinigame();
        const el = document.createElement("div"); el.id = "minigameIntroOverlay"; el.className = "minigame-overlay minigame-intro-overlay";
        el.innerHTML = `<div class="minigame-modal minigame-intro-modal"><div class="minigame-eyebrow">ANTES DE EMPEZAR</div><div class="minigame-intro-icon">${icon(type===0?"bolt":type===1?"image":type===2?"trend": "trophy",30)}</div><h2>${i.title}</h2><p class="minigame-subtitle">${i.desc}</p><div class="minigame-goal"><span>${icon("check",14)}</span><b>${i.goal}</b></div><button id="startMinigame" class="btn primary minigame-start-btn">${icon("play",16)} COMENZAR</button></div>`;
        document.body.appendChild(el);
        el.querySelector("#startMinigame")?.addEventListener("click", () => { el.remove(); resolve(); }, { once:true });
    });
}

export async function runMinigame(type) {
    const t = ((Number(type)||0)%4+4)%4;
    await intro(t);
    cleanupActiveMinigame();
    const runners = [runTiming, runThumbnailDesigner, runTrend, runAwardsVote];
    let timeout;
    let timedOut = false;
    const game = Promise.resolve().then(() => runners[t]()).catch(error => { console.error("Error en minijuego:", error); cleanupActiveMinigame(); return 0; });
    const guard = new Promise(resolve => { timeout=setTimeout(()=>{timedOut=true;cleanupActiveMinigame();resolve(0);},18000); });
    const score = await Promise.race([game,guard]);
    clearTimeout(timeout);
    if (!timedOut) await showResult(score);
    return score;
}

function showResult(score) {
    return new Promise(resolve => {
        const el=document.createElement("div"); el.id="minigameResultOverlay"; el.className="minigame-overlay";
        const label=score>=90?"¡EXCELENTE!":score>=65?"¡BIEN HECHO!":score>=35?"REGULAR":"MAL";
        el.innerHTML=`<div class="minigame-modal"><div class="minigame-eyebrow">RESULTADO</div><h2>${label}</h2><p class="minigame-subtitle">Puntaje: ${score}/100</p><div style="font-size:3rem;margin:20px 0">${score}%</div></div>`;
        document.body.appendChild(el); setTimeout(()=>{el.remove();resolve();},1500);
    });
}

function runTiming() {
    return new Promise(resolve => {
        const o=overlayBase("Elegí el momento","Publicá cuando el cursor esté dentro de la zona ideal.");
        const b=o.querySelector("#minigameBody"); b.innerHTML=`<div class="timing-track"><div class="timing-zone"></div><div id="timingCursor"></div></div><button id="timingHit" class="btn primary minigame-action">¡PUBLICAR!</button><p class="minigame-hint">Una sola oportunidad.</p>`;
        const c=b.querySelector("#timingCursor"), hit=b.querySelector("#timingHit"); let pos=0,dir=1,done=false,raf,last=performance.now(); const a=42,z=58;
        activeCleanup=()=>{done=true;if(raf)cancelAnimationFrame(raf);};
        function tick(now){if(done)return;const dt=Math.min(32,now-last);last=now;pos+=dir*dt*.135;if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}c.style.left=`${pos}%`;raf=requestAnimationFrame(tick)}
        raf=requestAnimationFrame(tick); hit.onclick=()=>{if(done)return;done=true;const d=pos<a?a-pos:pos>z?pos-z:0;resolve(finish(o,d===0?100:clamp(100-d*5,15,95)));};
    });
}

function runThumbnailDesigner() {
    return new Promise(resolve => {
        const o=overlayBase("Diseñá la miniatura","Encajá cada pieza en el centro. No hace falta precisión perfecta: hay margen para salirte un poco.");
        const b=o.querySelector("#minigameBody");
        const pieces=[
            {key:"fondo",label:"FONDO",icon:icon("camera",28)},
            {key:"cabeza",label:"CABEZA",icon:icon("person",28)},
            {key:"cuerpo",label:"CUERPO",icon:icon("person",28)},
            {key:"piernas",label:"PIERNAS",icon:icon("person",28)}
        ];
        let index=0,total=0,done=false,raf,last=performance.now(),pos=8,dir=1;
        const tolerance=15;
        b.innerHTML=`<div class="thumb-builder-progress"><div id="thumbStage">1/4 · FONDO</div><div class="thumb-builder-score" id="thumbScore">0</div></div><div class="thumb-builder"><div class="thumb-builder-track"><div class="thumb-builder-zone"></div><div id="thumbPiece">🖼️</div></div><button id="thumbPlace" class="btn primary minigame-action">ENCAJAR FONDO</button><p id="thumbHint" class="minigame-hint">Va de izquierda a derecha. Tocá cuando esté cerca del centro.</p></div>`;
        const piece=b.querySelector('#thumbPiece'),stage=b.querySelector('#thumbStage'),scoreEl=b.querySelector('#thumbScore'),btn=b.querySelector('#thumbPlace');
        function tick(now){if(done)return;const dt=Math.min(32,now-last);last=now;pos+=dir*dt*.11;if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}piece.style.left=`${pos}%`;raf=requestAnimationFrame(tick);}
        function renderStage(){const x=pieces[index];stage.textContent=`${index+1}/4 · ${x.label}`;piece.innerHTML=x.icon;btn.textContent=`ENCAJAR ${x.label}`;piece.classList.remove('thumb-click-pop');void piece.offsetWidth;piece.classList.add('thumb-click-pop');}
        function place(){if(done)return;const distance=Math.abs(pos-50);const quality=distance<=tolerance?Math.round(100-(distance/tolerance)*28):Math.max(25,Math.round(72-(distance- tolerance)*2.2));total+=quality;piece.classList.remove('thumb-click-pop');void piece.offsetWidth;piece.classList.add('thumb-click-pop');scoreEl.textContent=`${Math.round(total/(index+1))}`;
            if(index===pieces.length-1){done=true;resolve(finish(o,total/pieces.length));return;}
            index++;renderStage();}
        btn.onclick=place;
        activeCleanup=()=>{done=true;if(raf)cancelAnimationFrame(raf);};
        renderStage();raf=requestAnimationFrame(tick);
    });
}

function runTrend() {
    return new Promise(resolve => {
        const o=overlayBase("Elegí la tendencia","Tenés pocos segundos. Pensá en tu nicho, velocidad y saturación.");
        const b=o.querySelector("#minigameBody");
        const opts=shuffle([
            {name:`${icon("bolt",18)} Tendencia explosiva`,score:94,meta:"Mucho alcance · muy saturada"},
            {name:`${icon("target",18)} Tendencia de tu nicho`,score:88,meta:"Buen encaje · crecimiento estable"},
            {name:`${icon("target",18)} Tema emergente`,score:78,meta:"Poca competencia · resultado incierto"},
            {name:`${icon("close",18)} Tendencia agotada`,score:38,meta:"Mucho ruido · poca retención"}
        ]);
        let left=6,done=false; b.innerHTML=`<div id="trendTimer" class="quick-timer">6.0</div><div class="trend-options">${opts.map(x=>`<button class="trend-option" data-score="${x.score}"><b>${x.name}</b><small>${x.meta}</small></button>`).join('')}</div>`;
        const timer=setInterval(()=>{left-=.1;const el=b.querySelector('#trendTimer');if(el)el.textContent=Math.max(0,left).toFixed(1);if(left<=0&&!done){done=true;clearInterval(timer);resolve(finish(o,25));}},100);
        activeCleanup=()=>{done=true;clearInterval(timer)};
        b.querySelectorAll('.trend-option').forEach(btn=>btn.onclick=()=>{if(done)return;done=true;clearInterval(timer);resolve(finish(o,Number(btn.dataset.score)+Math.round(left)))});
    });
}

function runAwardsVote() {
    return new Promise(resolve => {
        const o=overlayBase("Votá en los Awards","Compará crecimiento, impacto y consistencia. No elijas automáticamente al más grande.");
        const b=o.querySelector("#minigameBody");
        const pool = (window.__elCreadorState?.creators || []).filter(c => c.activo !== false && (c.pais || "Argentina") === "Argentina");
        const real = pool.length >= 3 ? pool : [
            {nombre:"Coscu"}, {nombre:"Spreen"}, {nombre:"Momo"}, {nombre:"Agusneta"}, {nombre:"zEkO"}
        ];
        const selected = shuffle(real).slice(0, 3);
        const candidates = selected.map((c, i) => ({
            name: c.nombre || c.name || "Creador argentino",
            growth: 72 + Math.floor(Math.random()*24),
            impact: 70 + Math.floor(Math.random()*27),
            consistency: 68 + Math.floor(Math.random()*29),
            score: 75 + Math.floor(Math.random()*24)
        }));
        b.innerHTML=`<div class="awards-candidate-grid">${candidates.map(c=>`<button class="award-candidate" data-score="${c.score}"><b>${icon("trophy",16)} ${c.name}</b><span>Crecimiento <strong>${c.growth}</strong></span><span>Impacto <strong>${c.impact}</strong></span><span>Consistencia <strong>${c.consistency}</strong></span></button>`).join('')}</div>`;
        activeCleanup=()=>{};
        b.querySelectorAll('.award-candidate').forEach(btn=>btn.onclick=()=>resolve(finish(o,Number(btn.dataset.score)||50)));
    });
}

// Minijuegos específicos de La Velada. Se ejecutan como preparación en T1-T3
// y como combate en T4; no reutilizan el loop de publicación.
function veladaDifficultyConfig(difficulty="normal") {
    return {
        facil:{speed:0.72,target:34,window:34,time:9},
        normal:{speed:0.95,target:30,window:28,time:8},
        dificil:{speed:1.22,target:25,window:22,time:7},
        "muy-dificil":{speed:1.5,target:20,window:17,time:6}
    }[difficulty] || {speed:0.95,target:30,window:28,time:8};
}

export function runVeladaTrainingMinigame(quarter=1,difficulty="normal") {
    const type=((Number(quarter)||1)-1)%3;
    return introVelada(type,difficulty,`Entrenamiento T${quarter}`);
}

export function runVeladaFightMinigame(difficulty="normal") {
    return introVelada(3,difficulty,"Combate de La Velada");
}

function introVelada(type,difficulty,title) {
    return new Promise(resolve=>{
        cleanupActiveMinigame();
        const el=document.createElement("div"); el.id="minigameIntroOverlay"; el.className="minigame-overlay";
        const names=["Footwork y timing","Combinaciones","Reacción y defensa","Combate final"];
        el.innerHTML=`<div class="minigame-modal minigame-intro-modal"><div class="minigame-eyebrow">LA VELADA · MINIJUEGO</div><h2>${title}</h2><p class="minigame-subtitle">${names[type]} · Dificultad ${difficulty.toUpperCase()}</p><p class="muted">Tu resultado se acumula durante el año. Una buena preparación hace más manejable el combate de T4.</p><button id="startVeladaMini" class="btn primary minigame-start-btn">COMENZAR</button></div>`;
        document.body.appendChild(el);
        el.querySelector("#startVeladaMini")?.addEventListener("click",()=>{el.remove(); resolve();},{once:true});
    }).then(()=>runVeladaCore(type,difficulty));
}

function runVeladaCore(type,difficulty) {
    if(type===0) return runVeladaFootwork(difficulty);
    if(type===1) return runVeladaCombos(difficulty);
    if(type===2) return runVeladaReaction(difficulty);
    return runVeladaFightCore(difficulty);
}

function runVeladaFootwork(difficulty){
    return new Promise(resolve=>{
        const cfg=veladaDifficultyConfig(difficulty), o=overlayBase("Footwork y timing","Detené el cursor dentro de la zona de entrenamiento.");
        const b=o.querySelector("#minigameBody"); b.innerHTML=`<div class="timing-track"><div class="timing-zone" style="left:${cfg.target- cfg.window/2}%;width:${cfg.window}%"></div><div id="veladaCursor"></div></div><button id="veladaHit" class="btn primary minigame-action">MARCAR COMBINACIÓN</button><p class="minigame-hint">Una oportunidad · ${cfg.time}s.</p>`;
        const c=b.querySelector("#veladaCursor"), hit=b.querySelector("#veladaHit"); let pos=0,dir=1,done=false,raf,last=performance.now(),started=performance.now();
        activeCleanup=()=>{done=true;if(raf)cancelAnimationFrame(raf)};
        function tick(now){if(done)return; if(now-started>cfg.time*1000){done=true;resolve(finish(o,20));return;} const dt=Math.min(32,now-last);last=now;pos+=dir*dt*.075*cfg.speed;if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}c.style.left=`${pos}%`;raf=requestAnimationFrame(tick)}
        raf=requestAnimationFrame(tick);
        hit.onclick=()=>{if(done)return;done=true;const center=cfg.target, d=Math.abs(pos-center);resolve(finish(o,Math.max(5,100-d*4))) };
    });
}

function runVeladaCombos(difficulty){
    return new Promise(resolve=>{
        const cfg=veladaDifficultyConfig(difficulty),o=overlayBase("Combinaciones","Memorizá la secuencia. No podés tocar nada hasta que termine de mostrarse.");
        const b=o.querySelector("#minigameBody"), len=difficulty==="facil"?3:difficulty==="normal"?4:5, pool=["JAB","CROSS","HOOK","UPPER","DEFENSA"];
        const seq=shuffle(pool).slice(0,len); let input=[],stage="show",showTimer;
        b.innerHTML=`<div class="mini-sequence" id="veladaSequence">${seq.map(x=>`<span>${x}</span>`).join(" · ")}</div><div id="comboButtons" class="trend-options combo-disabled"></div><p id="comboHint" class="minigame-hint">${icon("refresh",14)} Mirá la secuencia... todavía no podés apretar.</p>`;
        const revealMs=1700 + len*280;
        showTimer=setTimeout(()=>{stage="input";const box=b.querySelector("#veladaSequence");box.textContent="AHORA";const hint=b.querySelector("#comboHint");hint.textContent="Elegí la secuencia en el mismo orden.";const buttons=b.querySelector("#comboButtons");buttons.classList.remove("combo-disabled");buttons.innerHTML=shuffle(pool).map(x=>`<button class="trend-option combo-key" data-v="${x}"><b>${x}</b></button>`).join("");buttons.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{if(stage!=="input")return;btn.classList.remove("click-pop");void btn.offsetWidth;btn.classList.add("click-pop");input.push(btn.dataset.v); if(input.length===seq.length){const correct=input.every((v,i)=>v===seq[i]);resolve(finish(o,correct?100:Math.max(15,70-input.filter((v,i)=>v!==seq[i]).length*18)));}})},revealMs);
        activeCleanup=()=>{clearTimeout(showTimer);stage="done";};
    });
}

function runVeladaReaction(difficulty){
    return new Promise(resolve=>{
        const cfg=veladaDifficultyConfig(difficulty),o=overlayBase("Reacción y defensa","Cuando aparezca ATAQUE, defendete. Si aparece AMAGO, no reacciones.");
        const b=o.querySelector("#minigameBody"); b.innerHTML=`<div id="reactionWord" style="font-size:2rem;font-weight:900;min-height:80px;display:grid;place-items:center">PREPARADO</div><button id="reactionBtn" class="btn primary minigame-action">DEFENDER</button><p id="reactionCount" class="minigame-hint">5 rondas</p>`;
        const word=b.querySelector("#reactionWord"),btn=b.querySelector("#reactionBtn"); let round=0,score=0,active=false,expected=false,timer;
        function next(){round++; if(round>5){resolve(finish(o,score));return;} expected=Math.random()>.35; active=true; word.innerHTML=expected?`${icon("sports_mma",30)} ATAQUE`:`${icon("close",30)} AMAGO`; timer=setTimeout(()=>{if(active){if(!expected)score+=20;active=false;next()}},700*cfg.mult);}
        btn.onclick=()=>{if(!active)return; if(expected)score+=20; else score=Math.max(0,score-12); active=false;clearTimeout(timer);next();};
        activeCleanup=()=>clearTimeout(timer); setTimeout(next,500);
    });
}

function runVeladaFightCore(difficulty){
    return new Promise(resolve=>{
        const cfg=veladaDifficultyConfig(difficulty),o=overlayBase("Combate de La Velada","Elegí cuándo atacar o defenderte. Tu preparación previa afecta la dificultad.");
        const b=o.querySelector("#minigameBody"); b.innerHTML=`<div id="fightPrompt" style="font-size:1.8rem;font-weight:900;min-height:70px;display:grid;place-items:center">ROUND 1</div><div style="display:flex;gap:10px;justify-content:center"><button id="fightAttack" class="btn primary">ATACAR</button><button id="fightDefend" class="btn ghost">DEFENDER</button></div><p id="fightScore" class="minigame-hint">Puntos: 0 · 5 intercambios</p>`;
        const prompt=b.querySelector("#fightPrompt"), scoreEl=b.querySelector("#fightScore"), attack=b.querySelector("#fightAttack"), defend=b.querySelector("#fightDefend"); let round=0,score=50,enemyAction="",timer;
        function next(){round++; if(round>5){resolve(finish(o,score));return;} enemyAction=Math.random()>.5?"ataque":"defensa";prompt.textContent=`INTERCAMBIO ${round}: ${enemyAction.toUpperCase()}`;}
        function act(action){if(round>5)return; if((enemyAction==="ataque"&&action==="defend")||(enemyAction==="defensa"&&action==="attack"))score+=12; else score-=7; score=Math.max(0,Math.min(100,score));scoreEl.textContent=`Puntos: ${score} · 5 intercambios`; next();}
        attack.onclick=()=>act("attack"); defend.onclick=()=>act("defend"); activeCleanup=()=>clearTimeout(timer); next();
    });
}
