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
  p.velada ||= { tier: 0, training: 0, rival: null, eligible: false, wins: 0, losses: 0 };
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
