// js/game.js
// ============ ESTADO DEL JUEGO ============
const NICHES = {
  futbol:  { nombre:"⚽ Fútbol", mult:1.2, volatilidad:"alta" },
  gaming:  { nombre:"🎮 Gaming", mult:1.0, volatilidad:"media" },
  reacts:  { nombre:"🍿 Reacts", mult:1.3, volatilidad:"muy alta" },
  humor:   { nombre:"😂 Humor", mult:1.1, volatilidad:"alta" },
  cocina:  { nombre:"🍳 Cocina", mult:0.9, volatilidad:"baja" },
  gym:     { nombre:"🏋️ Gym", mult:1.0, volatilidad:"media" }
};

const COMMUNITY_LEVELS = [
  { min:0,      nombre:"Desconocido", emoji:"▫️" },
  { min:1000,   nombre:"Subs",        emoji:"👥" },
  { min:10000,  nombre:"Referente",   emoji:"💙" },
  { min:100000, nombre:"Ídolo",       emoji:"⭐" },
  { min:1000000,nombre:"Leyenda",     emoji:"🗿" }
];

// Starter content (para que sea jugable YA, sin depender del panel)
const STARTER_EVENTS = [
  {
    titulo:"Corte de luz en pleno directo", tipo:"golpe", nichos:["*"],
    texto:"Se fue la luz de Edenor justo cuando estabas en el mejor momento del stream.",
    opciones:[
      { label:"Seguir desde el celu con datos", efectos:{heat:+5, aguante:-1, seguidores:+200} },
      { label:"Levantar y pedir disculpas", efectos:{heat:-2, seguidores:-100} }
    ]
  },
  {
    titulo:"Oferta de canje dudosa", tipo:"decision", nichos:["*"],
    texto:"Una marca de cripto te ofrece mucha plata por promocionarlos, pero no parecen muy serios...",
    opciones:[
      { label:"Aceptar la guita 💸", efectos:{plata:+5000, heat:+25} },
      { label:"Rechazar por tu imagen", efectos:{heat:-5} }
    ]
  },
  {
    titulo:"Te invita un streamer grande", tipo:"colab", nichos:["*"],
    texto:"¡Te llegó un MD! Un streamer grande quiere que vayas a su stream.",
    opciones:[
      { label:"Aceptar el colab", efectos:{seguidores:+1500} },
      { label:"Rechazar, estás enfocado", efectos:{seguidores:+100, heat:+2} }
    ]
  },
  {
    titulo:"Polémica en Twitter", tipo:"decision", nichos:["reacts","futbol"],
    texto:"Un tweet tuyo de hace 3 años se hizo viral y te están criticando.",
    opciones:[
      { label:"Video de disculpas en blanco y negro", efectos:{heat:-15, seguidores:-200} },
      { label:"Hacer un chiste y bancarla", efectos:{heat:+10, seguidores:+800} }
    ]
  }
];

// Estado del jugador
let state = null;

function newCareer(name, niche, origin) {
  state = {
    uid: UID,
    name, niche, origin,
    week: 1, year: 1,
    followers: 0, money: 500, heat: 0, form: 0,
    attributes: { carisma:10, edicion:10, olfato:10, aguante:10, oratoria:10 },
    points: 10,
    staff: [], setup: [],
    stats: { videos:0, virals:0, colabs:0, awards:0 },
    veladaUnlocked:false, parenDone:false,
    rival:null, gameOver:false, log:[]
  };
}

// ============ LOOP PRINCIPAL ============
function doWeek() {
  if (!state || state.gameOver) return;
  state.week++;
  if (state.week % 52 === 0) { state.year++; endOfYear(); }

  // Calcular performance del contenido
  const a = state.attributes;
  const attrScore = a.carisma*0.8 + a.edicion*1.2 + a.olfato*1.0 + a.oratoria*0.5;
  const setupBonus = 1 + state.setup.length * 0.15;
  const nicheMult = NICHES[state.niche].mult;
  let views = Math.floor(
    80 * (1 + attrScore/50) * setupBonus * nicheMult * (0.6 + Math.random()*0.8)
  );

  // Ganancia por ads
  const earn = Math.floor(views * 0.01);
  state.money += earn;
  state.stats.videos++;

  // Probabilidad de viral
  const viralChance = (a.olfato + a.edicion) / 300;
  let isViral = Math.random() < viralChance;
  if (isViral) {
    views *= 8;
    state.stats.virals++;
    addLog(`🔥 ¡SE VIRALIZÓ! ${formatNum(views)} reproducciones`);
  }

  state.followers += Math.floor(views * 0.08);

  // Calor se disipa un poco cada semana
  state.heat = Math.max(0, state.heat - 1);

  // Chance de evento
  if (Math.random() < 0.35) triggerRandomEvent();

  updateLevel();
  checkFunado();
  render();
  saveGame();
}

// ============ EVENTOS ============
async function getEvents() {
  try {
    const snap = await db.collection("events").get();
    if (snap.empty) return STARTER_EVENTS;
    return snap.docs.map(d => ({ id:d.id, ...d.data() }));
  } catch(e) { return STARTER_EVENTS; }
}

async function triggerRandomEvent() {
  const events = await getEvents();
  const valid = events.filter(ev =>
    ev.nichos.includes("*") || ev.nichos.includes(state.niche)
  );
  if (valid.length === 0) return;
  const ev = valid[Math.floor(Math.random()*valid.length)];
  showEvent(ev);
}

function showEvent(ev) {
  currentEvent = ev;
  const modal = document.getElementById("event-modal");
  document.getElementById("ev-title").textContent = ev.titulo;
  document.getElementById("ev-text").textContent = ev.texto;
  const box = document.getElementById("ev-options");
  box.innerHTML = "";
  ev.opciones.forEach((op,i) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = op.label;
    b.onclick = () => chooseOption(i);
    box.appendChild(b);
  });
  modal.classList.add("show");
}

function chooseOption(i) {
  const op = currentEvent.opciones[i];
  applyEffects(op.efectos);
  document.getElementById("event-modal").classList.remove("show");
  addLog(`📌 ${currentEvent.titulo}: ${op.label}`);
  render();
  saveGame();
}

function applyEffects(ef) {
  if (!ef) return;
  if (ef.plata) state.money = Math.max(0, state.money + ef.plata);
  if (ef.seguidores) state.followers = Math.max(0, state.followers + ef.seguidores);
  if (ef.heat) state.heat = clamp(state.heat + ef.heat, 0, 100);
  if (ef.form) state.form = clamp(state.form + ef.form, 0, 100);
}

// ============ COMUNIDAD / NIVELES ============
function updateLevel() {
  let lvl = 0;
  for (let i=0;i<COMMUNITY_LEVELS.length;i++)
    if (state.followers >= COMMUNITY_LEVELS[i].min) lvl = i;
  state.level = lvl;
  // Desbloquear Paren la Mano al ser grande
  if (lvl >= 2 && !state.parenDone && !state.veladaUnlocked) {
    state.parenInvite = true;
  }
}

function checkFunado() {
  if (state.heat >= 100) {
    state.heat = 50;
    state.followers = Math.floor(state.followers * 0.7);
    addLog("💀 TE FUNARON. Perdiste un 30% de tu comunidad.");
  }
}

// ============ TIENDA ============
const SHOP = [
  { id:"micro", nombre:"🎙️ Micrófono Shure", costo:800, tipo:"setup", efecto:"edicion", bonus:3 },
  { id:"camara", nombre:"📷 Cámara HD", costo:1200, tipo:"setup", efecto:"edicion", bonus:3 },
  { id:"silla", nombre:"🪑 Silla Gamer", costo:600, tipo:"setup", efecto:"aguante", bonus:3 },
  { id:"pc", nombre:"🖥️ PC con RTX", costo:3000, tipo:"setup", efecto:"edicion", bonus:5 },
  { id:"editor", nombre:"✂️ Editor", costo:1500, tipo:"staff", efecto:"videos", bonus:1 },
  { id:"manager", nombre:"🤝 Manager", costo:2000, tipo:"staff", efecto:"plata", bonus:1 },
  { id:"psico", nombre:"🧠 Psicólogo", costo:1000, tipo:"staff", efecto:"heat", bonus:1 }
];

function buyItem(id) {
  const item = SHOP.find(s => s.id === id);
  if (!item || state.money < item.costo) return;
  const list = item.tipo === "setup" ? state.setup : state.staff;
  if (list.includes(id)) return;
  state.money -= item.costo;
  list.push(id);
  if (item.efecto in state.attributes) state.attributes[item.efecto] += item.bonus;
  addLog(`🛒 Compraste ${item.nombre}`);
  render(); saveGame();
}

// ============ PAREN LA MANO / LA VELADA ============
function startParenLaMano() {
  // Usa el minijuego de equilibrio (timing bar)
  startTimingMinigame(success => {
    if (success) {
      state.form += 30;
      state.parenDone = true;
      state.veladaUnlocked = true;
      addLog("🤸 ¡Superaste Paren la Mano! Tenés tu lugar en La Velada.");
    } else {
      state.heat += 10;
      addLog("🤸 Te caíste en Paren la Mano... la gente se rió.");
    }
    render(); saveGame();
  });
}

function startVelada() {
  if (!state.veladaUnlocked) return;
  startTimingMinigame(win => {
    if (win) {
      state.stats.awards++;
      state.followers += 50000;
      addLog("🥊 ¡GANASTE LA VELADA! Clip legendario, +50K seguidores.");
    } else {
      state.followers += 10000;
      addLog("🥊 Perdiste La Velada, pero el morbo te dio +10K.");
    }
    state.veladaUnlocked = false; state.parenDone = false;
    render(); saveGame();
  });
}

function endOfYear() {
  // Lógica simplificada de los Coscu Army Awards
  if (state.followers > 10000) {
    state.stats.awards++;
    addLog("🏆 ¡Estuviste nominado en los Coscu Army Awards!");
  }
}

// ============ GUARDADO FIREBASE ============
async function saveGame() {
  if (!UID || !state) return;
  try {
    const cid = state.careerId || db.collection("careers").doc().id;
    state.careerId = cid;
    await db.collection("careers").doc(cid).set(state, { merge:true });
  } catch(e){ console.error("save", e); }
}

async function loadGames() {
  if (!UID) return [];
  const snap = await db.collection("careers").where("uid","==",UID).get();
  return snap.docs.map(d => ({ id:d.id, ...d.data() }));
}

// ============ UTILIDADES / UI ============
let currentEvent = null;
function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }
function formatNum(n){
  if (n>=1e6) return (n/1e6).toFixed(1)+"M";
  if (n>=1e3) return (n/1e3).toFixed(1)+"K";
  return Math.floor(n);
}
function addLog(msg){
  state.log.unshift(`S${state.week} ${msg}`);
  state.log = state.log.slice(0,30);
}

function render() {
  if (!state) return;
  const lvl = COMMUNITY_LEVELS[state.level];
  setText("ui-name", state.name);
  setText("ui-niche", NICHES[state.niche].nombre);
  setText("ui-followers", formatNum(state.followers));
  setText("ui-money", "$" + formatNum(state.money));
  setText("ui-week", `Semana ${state.week} · Año ${state.year}`);
  setText("ui-level", `${lvl.emoji} ${lvl.nombre}`);
  setBar("ui-heat", state.heat);
  const a = state.attributes;
  setText("ui-attr", `Carisma ${a.carisma} · Edición ${a.edicion} · Olfato ${a.olfato} · Aguante ${a.aguante} · Oratoria ${a.oratoria}`);
  const log = document.getElementById("ui-log");
  log.innerHTML = state.log.map(l=>`<div>${l}</div>`).join("");
  // Botones condicionales
  toggle("btn-paren", state.parenInvite && !state.parenDone);
  toggle("btn-velada", state.veladaUnlocked);
}
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function setBar(id,v){ const el=document.getElementById(id); if(el) el.style.width=v+"%"; }
function toggle(id,show){ const el=document.getElementById(id); if(el) el.style.display=show?"block":"none"; }
