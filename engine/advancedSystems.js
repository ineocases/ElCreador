// Sistemas avanzados: eventos, minijuegos, economía, premios, nichos y Velada.
export function ensureAdvancedState(game) {
  const p = game.player;
  p.staff ||= {};
  p.staff.editor = p.staff.editor || { level: 0, cost: 0 };
  p.staff.manager = p.staff.manager || { level: 0, cost: 0 };
  p.staff.community = p.staff.community || { level: 0, cost: 0 };
  p.staff.accountant = p.staff.accountant || { level: 0, cost: 0 };
  p.staff.lawyer = p.staff.lawyer || { level: 0, cost: 0 };
  p.staff.trainer = p.staff.trainer || { level: 0, cost: 0 };
  p.patrimonio ||= { etapa: 0, nombre: "Casa de tus viejos", activos: [] };
  p.awardsHistory ||= [];
  p.velada ||= { tier: 0, training: 0, rival: null, eligible: false, wins: 0, losses: 0, offerYear: null, offerStatus: "none", offerRerolls: 0, acceptedYear: null, trainingByQuarter: {}, completedQuarter: {}, fightCompletedYear: null };
  p.velada.trainingByQuarter ||= {};
  p.velada.completedQuarter ||= {};
  p.nicheModifiers ||= {};
  p.negocios ||= {};
  p.ingresosDesglose ||= { publicidad: 0, sponsors: 0, negocios: 0, afiliados: 0, donaciones: 0 };
  game.lastEventCategory ||= null;
}

const STAFF = {
  editor: { names: ["Editor freelance", "Editor fijo", "Editor senior"], costs: [0, 250, 900], effects: [{edicion:0},{edicion:4},{edicion:10}] },
  manager: { names: ["Sin manager", "Manager chico", "Manager profesional"], costs: [0, 450, 1500], effects: [{networking:0},{networking:5},{networking:12}] },
  community: { names: ["Vos", "Community manager", "Equipo social"], costs: [0, 300, 1000], effects: [{marketing:0},{marketing:4},{marketing:9}] },
  accountant: { names: ["Sin contador", "Contador", "Estudio contable"], costs: [0, 180, 650], effects: [{},{},{marketing:2}] },
  lawyer: { names: ["Sin abogado", "Abogado freelance", "Estudio legal"], costs: [0, 220, 800], effects: [{},{reputacion:2},{reputacion:5}] },
  trainer: { names: ["Sin entrenador", "Entrenador personal", "Preparador de élite"], costs: [0, 260, 950], effects: [{constancia:0},{constancia:3},{constancia:8}] }
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
  const recurring = Object.entries(p.staff).reduce((sum,[role,s]) => {
    const cfg=STAFF[role]; return sum + (cfg && s.level ? cfg.costs[s.level] * 3 : 0);
  },0);
  const negocios = p.negocios || {};
  const negocioCfg = BUSINESS;
  let businessIncome=0;
  for (const [id, data] of Object.entries(negocios)) {
    if (!data?.owned || !negocioCfg[id]) continue;
    businessIncome += Number(negocioCfg[id].monthly || 0) * 3;
  }
  const afiliados = Math.round(Math.max(0, Number(p.suscriptores)||0) * 0.012 * (1 + (Number(p.atributos?.marketing)||0)/100));
  p.dinero = Math.max(0, Number(p.dinero||0) - Math.round(recurring) + businessIncome + afiliados);
  p.ingresosGenerados = (Number(p.ingresosGenerados)||0) + businessIncome + afiliados;
  p.ingresosTrimestre = (Number(p.ingresosTrimestre)||0) + businessIncome + afiliados;
  p.ingresosDesglose ||= { publicidad:0,sponsors:0,negocios:0,afiliados:0,donaciones:0 };
  p.ingresosDesglose.negocios = (Number(p.ingresosDesglose.negocios)||0) + businessIncome;
  p.ingresosDesglose.afiliados = (Number(p.ingresosDesglose.afiliados)||0) + afiliados;
  const thresholds=[0,5000,25000,100000,500000];
  const names=["Casa de tus viejos","Habitación/estudio propio","Departamento con estudio","Casa con estudio profesional","Country + estudio profesional"];
  let etapa=0; thresholds.forEach((t,i)=>{if(p.suscriptores>=t) etapa=i;});
  if(etapa>p.patrimonio.etapa){p.patrimonio.etapa=etapa;p.patrimonio.nombre=names[etapa];}
  return {recurring:Math.round(recurring), businessIncome, afiliados, patrimonio:p.patrimonio};
}

export const BUSINESS = {
  merch: { name:'Tienda de merch', price:2000, monthly:300, minFama:0 },
  cafe: { name:'Cafetería gamer', price:5000, monthly:600, minFama:0 },
  energy: { name:'Bebida energética propia', price:20000, monthly:2500, minFama:30 },
  esports: { name:'Equipo de esports', price:50000, monthly:6000, minFama:55 },
  agency: { name:'Agencia de talentos', price:150000, monthly:15000, minFama:55 }
};

export function buyBusiness(game, id) {
  ensureAdvancedState(game); const p=game.player, b=BUSINESS[id];
  if(!b || p.negocios?.[id]?.owned || Number(p.dinero||0)<b.price || Number(p.fama||0)<b.minFama) return false;
  p.dinero -= b.price; p.negocios[id]={owned:true,boughtAt:Date.now()};
  p.ingresosDesglose ||= {publicidad:0,sponsors:0,negocios:0,afiliados:0,donaciones:0};
  game.guardar(); return true;
}


export function nicheProfile(game){
 const p=game.player; const n=p.niche;
 const profiles={Gaming:{viral:1.15,views:1.1,events:["lanzamiento","esports"]},"Fútbol":{viral:1.05,views:1.15,events:["superclasico","mercadopases"]},Vlog:{viral:1.0,views:1.0,events:["viaje","tendencia"]},Tecnología:{viral:1.0,views:1.05,events:["producto","lanzamiento"]},Cocina:{viral:.9,views:.95,events:["receta","chef"]},Periodismo:{viral:1.0,views:1.1,events:["noticia","debate"]}};
 return profiles[n]||profiles.Gaming;
}

export function canEnterVelada(game){
  return Number(game.player.suscriptores)>=1000000 && Number(game.player.fama)>=35;
}

function veladaRivals(game){
  const subs=Number(game.player.suscriptores)||0;
  return game.creators.filter(c=>c.pais==="Argentina"&&c.activo!==false&&c.id!=="player"&&Number(c.seguidores)>=Math.max(50000,subs*.55)&&Number(c.seguidores)<=Math.max(60000,subs*1.8));
}

export function offerVeladaPreseason(game){
  ensureAdvancedState(game);
  const p=game.player, year=Number(game.time.año);
  if(!canEnterVelada(game) || p.velada.offerYear===year || p.velada.acceptedYear===year || p.velada.offerStatus==="declined") return false;
  const rivals=veladaRivals(game);
  if(!rivals.length) return false;
  const rival=rivals[Math.floor(Math.random()*rivals.length)];
  p.velada.offerYear=year; p.velada.offerStatus="offered"; p.velada.offerRerolls=0; p.velada.rival=rival.id; p.velada.training=0; p.velada.trainingByQuarter={}; p.velada.completedQuarter={}; p.velada.fightCompletedYear=null;
  game.guardar();
  return rival;
}

export function requestAnotherVeladaRival(game){
  ensureAdvancedState(game);
  const p=game.player, year=Number(game.time.año);
  if(p.velada.offerYear!==year || p.velada.offerStatus!=="offered") return null;
  const rivals=veladaRivals(game).filter(c=>c.id!==p.velada.rival);
  if(!rivals.length) return null;
  const rival=rivals[Math.floor(Math.random()*rivals.length)];
  p.velada.rival=rival.id; p.velada.offerRerolls=(Number(p.velada.offerRerolls)||0)+1;
  game.guardar(); return rival;
}

export function decideVelada(game, decision){
  ensureAdvancedState(game);
  const p=game.player, year=Number(game.time.año);
  if(p.velada.offerYear!==year || p.velada.offerStatus!=="offered") return false;
  if(decision==="accept"){
    p.velada.offerStatus="accepted"; p.velada.acceptedYear=year; p.velada.training=0; p.velada.trainingByQuarter={}; p.velada.completedQuarter={};
  } else if(decision==="reject"){
    p.velada.offerStatus="declined"; p.velada.acceptedYear=null; p.velada.rival=null;
  } else return false;
  game.guardar(); return true;
}

export function veladaTrainingDifficulty(game, quarter){
  const p=game.player;
  const total=Number(p.velada?.training||0);
  const prep=total + Number(p.atributos?.constancia||0)*0.7 + Number(p.atributos?.carisma||0)*0.25;
  if(prep>=75) return {key:"facil",label:"FÁCIL",mult:0.8};
  if(prep>=45) return {key:"normal",label:"NORMAL",mult:1};
  if(prep>=25) return {key:"dificil",label:"DIFÍCIL",mult:1.2};
  return {key:"muy-dificil",label:"MUY DIFÍCIL",mult:1.45};
}

export function completeVeladaTraining(game, quarter, score){
  ensureAdvancedState(game);
  const p=game.player, q=Number(quarter);
  if(p.velada?.acceptedYear!==Number(game.time.año) || q<1 || q>3 || Number(game.time.trimestre)!==q) return false;
  if(p.velada.completedQuarter?.[q]) return false;
  const value=Math.max(0,Math.min(100,Number(score)||0));
  p.velada.trainingByQuarter[q]=value; p.velada.completedQuarter[q]=true;
  p.velada.training=Object.values(p.velada.trainingByQuarter).reduce((a,b)=>a+Number(b||0),0);
  game.guardar(); return true;
}

export function fightVelada(game, score){
  ensureAdvancedState(game);
  const p=game.player, year=Number(game.time.año);
  if(Number(game.time.trimestre)!==4 || p.velada?.acceptedYear!==year || p.velada?.fightCompletedYear===year) return null;
  const s=Math.max(0,Math.min(100,Number(score)||0));
  const rival=game.creators.find(c=>c.id===p.velada.rival);
  const trainingAvg=Object.values(p.velada.trainingByQuarter||{}).reduce((a,b)=>a+Number(b||0),0)/3;
  const difficulty=veladaTrainingDifficulty(game,4);
  const rivalBase=52 + difficulty.mult*10 - trainingAvg*0.16 + Math.random()*18;
  const rivalScore=Math.max(35,Math.min(92,Math.round(rivalBase)));
  const win=s>=rivalScore;
  if(win){p.velada.wins=(Number(p.velada.wins)||0)+1;p.fama=Math.min(100,p.fama+12);p.suscriptores+=Math.max(500,Math.round(p.suscriptores*.08));}
  else{p.velada.losses=(Number(p.velada.losses)||0)+1;p.fama=Math.min(100,p.fama+3);p.suscriptores+=Math.max(100,Math.round(p.suscriptores*.02));}
  p.velada.fightCompletedYear=year; p.velada.eligible=false;
  game.guardar();
  return {win,rival:rival?.nombre||"Rival",score:s,rivalScore,difficulty:difficulty.label,trainingAvg:Math.round(trainingAvg)};
}

export function buildAwardsCandidates(game){
 const p=game.player, year=Number(p.año)||2026;
 const creators=(game.creators||[]).filter(c=>c.activo!==false&&Number(c.debutYear||year)<=year);
 const metrics=c=>({name:c.nombre,subs:Number(c.seguidores)||0,views:Number(c.mundo?.vistas)||0,clips:Number(c.mundo?.clips)||0,enojos:Number(c.mundo?.enojos)||0,debut:Number(c.debutYear||year),creator:c});
 const all=creators.map(metrics);
 const rookie=all.filter(x=>Math.max(0,year-x.debut)<=1&&!x.creator.revelacionGanada);
 const top=(arr,score)=>arr.map(x=>({x,s:Number(score(x))||0})).sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.x);
 return {
   creadorDelAño:top([...all],x=>Math.log10(Math.max(1000,x.subs))*32+Math.log10(Math.max(1,(Number(x.creator.mundo?.nuevosSeguidores)||0)+1))*16),
   clipDelAño:top([...all],x=>x.clips*30+x.views/10000000),
   streamerRevelacion:top(rookie,x=>x.subs),
   enojoDelAño:top([...all],x=>x.enojos*100+x.creator.mundo?.perdidos/25000)
 };
}
