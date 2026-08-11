// Sistemas avanzados: eventos, minijuegos, economía, premios, nichos y Velada.
export function ensureAdvancedState(game) {
  const p = game.player;
  p.staff ||= {};
  p.staff.editor = p.staff.editor || { level: 0, cost: 0 };
  p.staff.manager = p.staff.manager || { level: 0, cost: 0 };
  p.staff.community = p.staff.community || { level: 0, cost: 0 };
  p.staff.accountant = p.staff.accountant || { level: 0, cost: 0 };
  p.staff.lawyer = p.staff.lawyer || { level: 0, cost: 0 };
  p.patrimonio ||= { etapa: 0, nombre: "Casa de tus viejos", activos: [] };
  p.awardsHistory ||= [];
  p.velada ||= { tier: 0, training: 0, rival: null, eligible: false, wins: 0, losses: 0 };
  p.minigame ||= null;
  p.nicheModifiers ||= {};
  game.lastMinigame ||= null;
  game.lastEventCategory ||= null;
}

const STAFF = {
  editor: { names: ["Editor freelance", "Editor fijo", "Editor senior"], costs: [0, 250, 900], effects: [{edicion:0},{edicion:4},{edicion:10}] },
  manager: { names: ["Sin manager", "Manager chico", "Manager profesional"], costs: [0, 450, 1500], effects: [{networking:0},{networking:5},{networking:12}] },
  community: { names: ["Vos", "Community manager", "Equipo social"], costs: [0, 300, 1000], effects: [{marketing:0},{marketing:4},{marketing:9}] },
  accountant: { names: ["Sin contador", "Contador", "Estudio contable"], costs: [0, 180, 650], effects: [{},{},{marketing:2}] },
  lawyer: { names: ["Sin abogado", "Abogado freelance", "Estudio legal"], costs: [0, 220, 800], effects: [{},{reputacion:2},{reputacion:5}] }
};

export function buyStaff(game, role) {
  ensureAdvancedState(game); const p=game.player, s=p.staff[role], cfg=STAFF[role];
  if(!cfg || s.level>=2) return false;
  const next=s.level+1, cost=cfg.costs[next]; if(p.dinero<cost) return false;
  p.dinero-=cost; s.level=next; s.cost=cost;
  return true;
}

export function advanceEconomy(game) {
  ensureAdvancedState(game); const p=game.player;
  const monthly = Object.values(STAFF).reduce((sum,cfg)=>sum,0);
  const recurring = Object.entries(p.staff).reduce((sum,[role,s])=>sum + (s.level ? STAFF[role].costs[s.level] / 4 : 0),0);
  p.dinero = Math.max(0, p.dinero - Math.round(recurring));
  const thresholds=[0,5000,25000,100000,500000];
  const names=["Casa de tus viejos","Habitación/estudio propio","Departamento con estudio","Casa con estudio profesional","Country + estudio profesional"];
  let etapa=0; thresholds.forEach((t,i)=>{if(p.suscriptores>=t) etapa=i;});
  if(etapa>p.patrimonio.etapa){p.patrimonio.etapa=etapa;p.patrimonio.nombre=names[etapa];}
  return {recurring:Math.round(recurring), patrimonio:p.patrimonio};
}

export function applyBottleFlipResult(game, score, attempts = 3) {
  ensureAdvancedState(game);
  const p = game.player;
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const q = p.actividadTrimestre;
  const mult = 0.85 + (s / 100) * 0.45;

  p.minigame = { type: "bottleFlip", score: s, attempts, label: "Bottle Flip Challenge" };
  game.lastMinigame = p.minigame;

  if (!q) return p.minigame;

  const oldViews = Number(q.vistas) || 0;
  const oldSubs = Number(q.suscriptores) || 0;
  const oldMoney = Number(q.dinero) || 0;
  const bonusViews = Math.round(oldViews * Math.max(0, mult - 1));
  const bonusSubs = Math.max(0, Math.round(oldSubs * Math.max(0, mult - 1) * 0.9));
  const bonusMoney = Math.max(0, Math.round(oldMoney * Math.max(0, mult - 1) * 0.8));

  q.vistas += bonusViews;
  q.suscriptores += bonusSubs;
  q.dinero += bonusMoney;
  q.minigameBonus = { views: bonusViews, subs: bonusSubs, money: bonusMoney, score: s };

  p.vistasTotales += bonusViews;
  p.suscriptores += bonusSubs;
  p.dinero += bonusMoney;
  p.ingresosTrimestre += bonusMoney;
  p.ingresosGenerados = (Number(p.ingresosGenerados) || 0) + bonusMoney;
  if (s >= 85) p.fama = Math.min(100, (Number(p.fama) || 0) + 1);

  if (game.lastQuarterResult) {
    game.lastQuarterResult.totalVistas += bonusViews;
    game.lastQuarterResult.totalSubs += bonusSubs;
    game.lastQuarterResult.totalDinero += bonusMoney;
    game.lastQuarterResult.minigameBonus = { views: bonusViews, subs: bonusSubs, money: bonusMoney };
  }

  return p.minigame;
}

export function nicheProfile(game){
 const p=game.player; const n=p.niche;
 const profiles={Gaming:{viral:1.15,views:1.1,events:["lanzamiento","esports"]},"Fútbol":{viral:1.05,views:1.15,events:["superclasico","mercadopases"]},Vlog:{viral:1.0,views:1.0,events:["viaje","tendencia"]},Tecnología:{viral:1.0,views:1.05,events:["producto","lanzamiento"]},Cocina:{viral:.9,views:.95,events:["receta","chef"]},Periodismo:{viral:1.0,views:1.1,events:["noticia","debate"]}};
 return profiles[n]||profiles.Gaming;
}

export function canEnterVelada(game){return Number(game.player.suscriptores)>=1000000 && Number(game.player.fama)>=35;}
export function prepareVelada(game){ensureAdvancedState(game); if(!canEnterVelada(game)) return false; const rivals=game.creators.filter(c=>c.pais==="Argentina"&&c.activo!==false&&Number(c.seguidores)>game.player.suscriptores*.5&&Number(c.seguidores)<game.player.suscriptores*2); if(!rivals.length)return false; const rival=rivals[Math.floor(Math.random()*rivals.length)]; game.player.velada={tier:3,training:0,rival:rival.id,eligible:true,wins:game.player.velada.wins||0,losses:game.player.velada.losses||0}; return true;}
export function fightVelada(game, score){ensureAdvancedState(game); const p=game.player; if(!p.velada?.eligible)return null; const s=Number(score)||0; const rival=game.creators.find(c=>c.id===p.velada.rival); const rivalScore=45+Math.random()*45; const win=s>=rivalScore; if(win){p.velada.wins++;p.fama=Math.min(100,p.fama+12);p.suscriptores+=Math.max(500,Math.round(p.suscriptores*.08));}else{p.velada.losses++;p.fama=Math.min(100,p.fama+3);p.suscriptores+=Math.max(100,Math.round(p.suscriptores*.02));} p.velada.eligible=false; return {win,rival:rival?.nombre||"Rival",score:s,rivalScore:Math.round(rivalScore)};}

export function buildAwardsCandidates(game){
 const p=game.player, year=p.año; const creators=game.creators.filter(c=>c.pais==="Argentina"&&c.activo!==false&&Number(c.debutYear||2020)<=year);
 const metrics=c=>({name:c.nombre,subs:Number(c.seguidores)||0,views:Number(c.mundo?.vistas)||0,debut:Number(c.debutYear||2020),creator:c});
 const all=creators.map(metrics); const rookie=all.filter(x=>x.debut>=year-4 && !x.creator.revelacionGanada);
 const top=(arr,key)=>arr.sort((a,b)=>b[key]-a[key]).slice(0,4);
 return {streamerDelAño:top([...all],"subs"),revelacion:top(rookie,"subs"),trayectoria:top([...all],"views"),mejorClip:top([...all],"views")};
}
