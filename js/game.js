// ===== CONFIG DE TIEMPO: 1 AÑO = 2 TRIMESTRES =====
const BLOCKS_PER_YEAR = 2;    // trimestres por año
const WEEKS_PER_BLOCK = 13;   // semanas simuladas por trimestre

const NICHES={
  futbol:{nombre:"Fútbol",icon:"⚽",mult:1.2},
  gaming:{nombre:"Gaming",icon:"🎮",mult:1.0},
  reacts:{nombre:"Reacts",icon:"🍿",mult:1.3},
  humor:{nombre:"Humor",icon:"😂",mult:1.1},
  cocina:{nombre:"Cocina",icon:"🍳",mult:.9},
  gym:{nombre:"Gym",icon:"🏋️",mult:1.0}
};
const LEVELS=[{min:0,n:"Desconocido"},{min:1e3,n:"Subs"},{min:1e4,n:"Referente"},{min:1e5,n:"Ídolo"},{min:1e6,n:"Leyenda"}];

const STARTER_EVENTS=[
 {titulo:"Corte de luz en pleno directo",nichos:["*"],texto:"Se fue la luz justo en el mejor momento del stream.",opciones:[{label:"Seguir con datos del celu",efectos:{heat:3,seguidores:300}},{label:"Levantar el stream",efectos:{heat:-2,seguidores:-150}}]},
 {titulo:"Canje cripto dudoso",nichos:["*"],texto:"Te ofrecen mucha plata por una marca de cripto que no parece seria.",opciones:[{label:"Aceptar la guita",efectos:{plata:5000,heat:20}},{label:"Rechazar",efectos:{heat:-4}}]},
 {titulo:"Te roban un clip",nichos:["*"],texto:"Una cuenta grande subió tu clip sin darte crédito y se hizo viral.",opciones:[{label:"Reclamar públicamente",efectos:{seguidores:1200,heat:6}},{label:"Dejarlo, igual suma",efectos:{seguidores:2000,heat:-2}}]},
 {titulo:"Un hater te dedica un video",nichos:["*"],texto:"Un canal grande hizo un video criticándote.",opciones:[{label:"Responder con un video",efectos:{seguidores:1800,heat:10}},{label:"Ignorarlo",efectos:{heat:-5}}]},
 {titulo:"Te ofrecen ir a la tele",nichos:["*"],texto:"Un programa de TV quiere que vayas de invitado.",opciones:[{label:"Ir, exposición masiva",efectos:{seguidores:4000,heat:8}},{label:"Quedarte en tu plataforma",efectos:{seguidores:500,heat:-3}}]},
 {titulo:"Tu editor renuncia",nichos:["*"],texto:"Te quedaste sin editor justo antes de una semana clave.",opciones:[{label:"Editar vos (cansa)",efectos:{seguidores:600,heat:5}},{label:"Contratar uno nuevo",efectos:{plata:-1200,seguidores:900}}]},
 {titulo:"Polémica por un tweet viejo",nichos:["*"],texto:"Resucitaron un tweet tuyo de hace 3 años.",opciones:[{label:"Disculpas en blanco y negro",efectos:{heat:-15,seguidores:-300}},{label:"Bancarla con un chiste",efectos:{heat:12,seguidores:1500}}]},
 {titulo:"El algoritmo te castiga",nichos:["*"],texto:"Tus últimos videos tuvieron menos alcance sin razón.",opciones:[{label:"Cambiar de formato",efectos:{seguidores:800,heat:3}},{label:"Seguir igual",efectos:{seguidores:-400,heat:-3}}]},
 {titulo:"¿Fue penal?",nichos:["futbol"],texto:"Todo el país discute una jugada polémica. Tenés que opinar.",opciones:[{label:"Decir que SÍ fue penal",efectos:{seguidores:1500,heat:8}},{label:"Decir que NO fue penal",efectos:{seguidores:1500,heat:8}},{label:"Esquivar el bulto",efectos:{heat:-4}}]},
 {titulo:"Se te crashea el juego en ranked",nichos:["gaming"],texto:"En plena partida competitiva se te cierra el juego.",opciones:[{label:"Reírte y clippearlo",efectos:{seguidores:1000,heat:-2}},{label:"Ragear en vivo",efectos:{seguidores:600,heat:9}}]}
];

const SHOP=[
 {id:"micro",nombre:"🎙️ Micrófono",costo:800,tipo:"setup",ef:"edicion",bonus:3},
 {id:"camara",nombre:"📷 Cámara",costo:1200,tipo:"setup",ef:"edicion",bonus:3},
 {id:"silla",nombre:"🪑 Silla Gamer",costo:600,tipo:"setup",ef:"aguante",bonus:3},
 {id:"pc",nombre:"🖥️ PC RTX",costo:3000,tipo:"setup",ef:"edicion",bonus:5},
 {id:"editor",nombre:"✂️ Editor",costo:1500,tipo:"staff",ef:"carisma",bonus:2},
 {id:"psico",nombre:"🧠 Psicólogo",costo:1000,tipo:"staff",ef:"aguante",bonus:2}
];

const VIRAL_MOMENT={titulo:"🔥 ¡UN VIDEO TUYO EXPLOTÓ!",texto:"El algoritmo te eligió. Está en todos lados.",
 opciones:[{label:"Monetizarlo con sponsor",efectos:{plata:3000,heat:5,seguidores:2000}},
           {label:"Hacer una parte 2",efectos:{seguidores:5000,heat:3}},
           {label:"Dejarlo morir",efectos:{seguidores:1000,heat:-5}}]};

let state=null, simulating=false;

// ===== CARRERA =====
function newCareer(name,niche,origin){
  state={uid:UID,name,niche,origin,year:1,block:1,followers:0,money:500,heat:0,level:0,
    attributes:{carisma:10,edicion:10,olfato:10,aguante:10,oratoria:10},
    staff:[],setup:[],stats:{videos:0,virals:0,colabs:0,awards:0},
    veladaUnlocked:false,parenDone:false,parenInvite:false,log:[]};
}
function startNewCareer(){
  const name=document.getElementById("in-name").value.trim()||"Streamer";
  const niche=document.getElementById("in-niche").value, origin=document.getElementById("in-origin").value;
  const t=()=>{ if(UID){ newCareer(name,niche,origin); showScreen("screen-game"); renderShop(); render(); saveGame(); } else setTimeout(t,300); };
  t();
}

// ===== SIMULACIÓN DEL TRIMESTRE =====
async function playBlock(){
  if(simulating||!state) return;
  simulating=true; setPlayBtn();
  const interruptions=generateInterruptions(WEEKS_PER_BLOCK);
  for(let w=1;w<=WEEKS_PER_BLOCK;w++){
    await simWeek(w);
    if(interruptions[w]) await resolveInterruption(interruptions[w]);
  }
  addLog(`✅ Cerraste el Trimestre ${state.block} del Año ${state.year}`);
  state.block++;
  if(state.block>BLOCKS_PER_YEAR){ state.block=1; state.year++; endOfYear(); }
  updateLevel(); checkFunado();
  simulating=false; render(); saveGame();
}

function simWeek(w){
  return new Promise(res=>{
    const a=state.attributes;
    const attr=a.carisma*.8+a.edicion*1.2+a.olfato+a.oratoria*.5;
    const setupB=1+state.setup.length*.15;
    let views=Math.floor(80*(1+attr/50)*setupB*NICHES[state.niche].mult*(0.6+Math.random()*.8));
    state.money+=Math.floor(views*.01);
    state.followers+=Math.floor(views*.08);
    state.stats.videos++; state.heat=Math.max(0,state.heat-0.5);
    setBar("block-progress",(w/WEEKS_PER_BLOCK)*100);
    setText("count-followers",formatNum(state.followers));
    setText("count-money","$"+formatNum(state.money));
    setTimeout(res,120);
  });
}

function generateInterruptions(total){
  const map={},types=["evento","evento","viral","sponsor","colab","evento"];
  const count=3+Math.floor(Math.random()*3), used=new Set();
  for(let i=0;i<count;i++){
    let w=2+Math.floor(Math.random()*(total-3));
    while(used.has(w)) w=2+Math.floor(Math.random()*(total-3));
    used.add(w); map[w]=types[Math.floor(Math.random()*types.length)];
  }
  return map;
}

async function resolveInterruption(type){
  if(type==="evento"){
    const evs=await getEvents();
    const v=evs.filter(e=>!e.nichos||e.nichos.includes("*")||e.nichos.includes(state.niche));
    if(v.length) await waitForChoice(v[Math.floor(Math.random()*v.length)]);
  } else if(type==="viral"){ state.stats.virals++; await waitForChoice(VIRAL_MOMENT); }
  else if(type==="sponsor") await sponsorOffer();
  else if(type==="colab") await colabInvite();
}

function waitForChoice(ev){
  return new Promise(res=>{
    setText("ev-title",ev.titulo); setText("ev-text",ev.texto);
    const box=document.getElementById("ev-options"); box.innerHTML="";
    ev.opciones.forEach(op=>{
      const b=document.createElement("button"); b.className="btn btn-ghost"; b.textContent=op.label;
      b.onclick=()=>{ applyEffects(op.efectos); addLog(`📌 ${ev.titulo}`); hideModal("event-modal"); res(op); };
      box.appendChild(b);
    });
    showModal("event-modal");
  });
}

function sponsorOffer(){
  const marcas=[["Yerba El Gauchito",800],["Energy Max",1500],["Silla GamerPro",2200],["App Delivery",3000]];
  const [m,pay]=marcas[Math.floor(Math.random()*marcas.length)];
  const negoWin=Math.random()<0.5;
  const opciones=[{label:`Aceptar $${pay}`,efectos:{plata:pay,heat:3}},{label:"Rechazar",efectos:{heat:-2}}];
  if(negoWin) opciones.push({label:`Negociar → $${pay*2}`,efectos:{plata:pay*2,heat:2}});
  return waitForChoice({titulo:`💸 Sponsor: ${m}`,texto:`Te ofrecen $${pay} por mencionarlos este trimestre.`,opciones});
}

async function colabInvite(){
  const npcs=["La Víbora","El Davito","Agus la Neta","El Jefe del Army","Momo Peludo"];
  const n=npcs[Math.floor(Math.random()*npcs.length)];
  const op=await waitForChoice({titulo:`🤝 Colab con ${n}`,texto:`${n} te invita a su stream. ¿Vas?`,
    opciones:[{label:"¡Dale, vamos!",efectos:{},colab:true},{label:"Esta vez paso",efectos:{heat:1}}]});
  if(op.colab){
    const win=await runTimingAsync();
    if(win){ state.followers+=3000; state.stats.colabs++; addLog(`🤝 ¡Colab exitoso con ${n}! +3K`); }
    else { state.followers+=800; state.heat+=2; addLog(`🤝 Colab flojo con ${n}...`); }
  }
}
function runTimingAsync(){ return new Promise(r=>startTimingMinigame(r)); }

// ===== NIVELES / TIENDA / EVENTOS ESPECIALES =====
function updateLevel(){
  let l=0; for(let i=0;i<LEVELS.length;i++) if(state.followers>=LEVELS[i].min) l=i;
  state.level=l;
  if(l>=2&&!state.parenDone&&!state.veladaUnlocked) state.parenInvite=true;
}
function checkFunado(){
  if(state.heat>=100){ state.heat=50; state.followers=Math.floor(state.followers*.7); addLog("💀 TE FUNARON. Perdiste 30% de tu comunidad."); }
}
function buyItem(id){
  const it=SHOP.find(s=>s.id===id); if(!it||state.money<it.costo) return;
  const list=it.tipo==="setup"?state.setup:state.staff; if(list.includes(id)) return;
  state.money-=it.costo; list.push(id);
  if(state.attributes[it.ef]!==undefined) state.attributes[it.ef]+=it.bonus;
  addLog(`🛒 Compraste ${it.nombre}`); render(); saveGame();
}
async function startParenLaMano(){
  const ok=await runTimingAsync();
  if(ok){ state.parenDone=true; state.veladaUnlocked=true; state.parenInvite=false; addLog("🤸 ¡Superaste Paren la Mano! Tenés tu lugar en La Velada."); }
  else { state.heat+=10; addLog("🤸 Te caíste en Paren la Mano... la gente se rió."); }
  render(); saveGame();
}
async function startVelada(){
  if(!state.veladaUnlocked) return;
  const win=await runTimingAsync();
  if(win){ state.followers+=50000; addLog("🥊 ¡GANASTE LA VELADA! Clip legendario, +50K."); }
  else { state.followers+=10000; addLog("🥊 Perdiste La Velada, pero el morbo te dio +10K."); }
  state.veladaUnlocked=false; state.parenDone=false; state.parenInvite=false; render(); saveGame();
}
function endOfYear(){
  if(state.followers>10000){ state.stats.awards++; addLog(`🏆 ¡Nominación en los Coscu Army Awards del Año ${state.year-1}!`); }
}
function getMedia(){
  const a=state.attributes, base=(a.carisma+a.edicion+a.olfato+a.aguante+a.oratoria)/5;
  const fame=Math.min(40,Math.log10(state.followers+1)*9);
  return Math.min(99,Math.floor(base+fame));
}
async function getEvents(){
  try{ const s=await db.collection("events").get(); if(s.empty) return STARTER_EVENTS; return s.docs.map(d=>({id:d.id,...d.data()})); }
  catch(e){ return STARTER_EVENTS; }
}

// ===== GUARDADO / ADMIN =====
async function saveGame(){
  if(!UID||!state) return;
  try{ const cid=state.careerId||db.collection("careers").doc().id; state.careerId=cid;
    await db.collection("careers").doc(cid).set(state,{merge:true}); }catch(e){ console.error(e); }
}
async function tryOpenAdmin(){
  auth.onAuthStateChanged(async u=>{
    if(!u) return;
    const d=await db.collection("users").doc(u.uid).get();
    if(d.exists&&d.data().admin){ showScreen("screen-admin"); loadAdminEvents(); }
    else alert("❌ No sos admin. En Firestore ponete admin:true en users/"+u.uid);
  });
}
function closeAdmin(){ showScreen(state?"screen-game":"screen-start"); }
async function addEvent(){
  await db.collection("events").add({titulo:document.getElementById("ev-titulo").value,
    texto:document.getElementById("ev-texto").value,tipo:document.getElementById("ev-tipo").value,nichos:["*"],
    opciones:[{label:document.getElementById("ev-op1").value,efectos:{heat:5}},{label:document.getElementById("ev-op2").value,efectos:{heat:-5}}]});
  alert("✅ Guardado"); loadAdminEvents();
}
async function loadAdminEvents(){
  const s=await db.collection("events").get();
  document.getElementById("ev-list").innerHTML=s.docs.map(d=>`<div>📌 ${d.data().titulo}</div>`).join("")||"Sin eventos todavía.";
}

// ===== UI =====
function showScreen(id){ ["screen-start","screen-game","screen-admin"].forEach(s=>document.getElementById(s).classList.add("hidden")); document.getElementById(id).classList.remove("hidden"); }
function showModal(id){ document.getElementById(id).classList.add("show"); }
function hideModal(id){ document.getElementById(id).classList.remove("show"); }
function setPlayBtn(){ const b=document.getElementById("btn-play"); b.disabled=simulating; b.textContent=simulating?"⏳ SIMULANDO...":"▶ JUGAR TRIMESTRE"; }
function render(){
  if(!state) return;
  const lv=LEVELS[state.level], n=NICHES[state.niche];
  setText("season-label",`AÑO ${state.year} · TRIMESTRE ${state.block}`);
  setText("count-followers",formatNum(state.followers));
  setText("count-money","$"+formatNum(state.money));
  setBar("heat-fill",state.heat);
  setText("fig-name",state.name.toUpperCase());
  setText("fig-niche",`${n.icon} ${n.nombre}`);
  setText("fig-avatar",n.icon);
  setText("fig-level",lv.n.toUpperCase());
  setText("fig-media",getMedia());
  document.getElementById("fig-card").className="figurita nivel-"+state.level;
  const a=state.attributes;
  setText("fig-stats",`CAR ${a.carisma} · EDI ${a.edicion} · OLF ${a.olfato} · AGU ${a.aguante} · ORA ${a.oratoria}`);
  document.getElementById("log").innerHTML=state.log.map(l=>`<div>${l}</div>`).join("");
  document.getElementById("btn-paren").style.display=(state.parenInvite&&!state.parenDone)?"block":"none";
  document.getElementById("btn-velada").style.display=state.veladaUnlocked?"block":"none";
  setPlayBtn();
}
function renderShop(){
  const box=document.getElementById("shop"); box.innerHTML="";
  SHOP.forEach(it=>{ const b=document.createElement("button"); b.className="btn btn-ghost";
    b.textContent=`${it.nombre} $${it.costo}`; b.onclick=()=>buyItem(it.id); box.appendChild(b); });
}
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function setBar(id,v){ const el=document.getElementById(id); if(el) el.style.width=v+"%"; }
function addLog(m){ state.log.unshift(`A${state.year}T${state.block} · ${m}`); state.log=state.log.slice(0,30); }
function formatNum(n){ if(n>=1e6)return(n/1e6).toFixed(1)+"M"; if(n>=1e3)return(n/1e3).toFixed(1)+"K"; return Math.floor(n); }

window.onload=()=>{
  const sel=document.getElementById("in-niche");
  Object.entries(NICHES).forEach(([k,v])=>{ const o=document.createElement("option"); o.value=k; o.textContent=`${v.icon} ${v.nombre}`; sel.appendChild(o); });
};
