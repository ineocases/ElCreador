// engine/worldSimulation.js
// Mundo vivo de El Creador.
// Cada trimestre todos los NPC avanzan: publican, crecen, pierden seguidores,
// colaboran, tienen virales, sponsors y polémicas. El jugador no pausa el mundo.

function random(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max) { return Math.random() * (max - min) + min; }

const NOMBRES = ["NicoWave", "LautaroGG", "MiliLive", "FranFPS", "SofiIRL", "TomiClip", "AgusPlay", "ValenStream", "MateoTV", "LolaGaming", "BautiLive", "CamiGG"];
const NICHOS = ["Gaming", "Variedad", "Fútbol", "IRL", "Vlog", "Tecnología"];

function ensureWorld(creator) {
    if (!creator.mundo) creator.mundo = {};
    Object.assign(creator.mundo, {
        año: creator.mundo.año ?? null,
        videos: Number(creator.mundo.videos) || 0,
        vistas: Number(creator.mundo.vistas) || 0,
        nuevosSeguidores: Number(creator.mundo.nuevosSeguidores) || 0,
        virales: Number(creator.mundo.virales) || 0,
        clips: Number(creator.mundo.clips) || 0,
        enojos: Number(creator.mundo.enojos) || 0,
        perdidos: Number(creator.mundo.perdidos) || 0,
        colaboraciones: Number(creator.mundo.colaboraciones) || 0,
        temporadas: Number(creator.mundo.temporadas) || 0
    });
    return creator.mundo;
}

function crearRookie(año, index) {
    const nombre = NOMBRES[index % NOMBRES.length] + (año % 100);
    const seguidores = random(1200, 9000);
    const nicho = NICHOS[random(0, NICHOS.length - 1)];
    return {
        id: `rookie_${año}_${index}_${Date.now()}`,
        nombre,
        nicho,
        pais: "Argentina",
        seguidores,
        seguidoresIniciales: seguidores,
        popularidad: random(45, 65),
        crecimientoBase: randomFloat(0.06, 0.18),
        debutYear: año,
        esRevelacion: true,
        relacion: 0,
        respeto: 0,
        rivalidad: 0,
        colaboraciones: 0,
        activo: true,
        mundo: {}
    };
}

function agregarNuevosCreadores(game) {
    const año = Number(game.time?.año) || 2026;
    const existentes = (game.creators || []).filter(c => Number(c.debutYear) === año).length;
    const faltan = Math.max(0, 3 - existentes);
    for (let i = 0; i < faltan; i++) game.creators.push(crearRookie(año, i + existentes));
}

function simularColaboracionNPC(game, news) {
    const disponibles = (game.creators || []).filter(c => c.activo !== false && Number(c.seguidores || 0) > 1500);
    if (disponibles.length < 2 || Math.random() > 0.08) return;
    const a = disponibles[random(0, disponibles.length - 1)];
    let b = disponibles[random(0, disponibles.length - 1)];
    let tries = 0;
    while (b.id === a.id && tries++ < 10) b = disponibles[random(0, disponibles.length - 1)];
    if (!b || b.id === a.id) return;

    const impactoA = Math.max(1, Math.round(Number(a.seguidores) * randomFloat(0.003, 0.018)));
    const impactoB = Math.max(1, Math.round(Number(b.seguidores) * randomFloat(0.003, 0.018)));
    a.seguidores += impactoA;
    b.seguidores += impactoB;
    ensureWorld(a).colaboraciones += 1;
    ensureWorld(b).colaboraciones += 1;
    a.colaboraciones = (Number(a.colaboraciones) || 0) + 1;
    b.colaboraciones = (Number(b.colaboraciones) || 0) + 1;
    news.push({ type: "collab", creatorId: a.id, creator: a.nombre, text: `🤝 ${a.nombre} y ${b.nombre} hicieron una colaboración que movió a sus comunidades.` });
}

export function simulateWorld(game) {
    const creators = Array.isArray(game?.creators) ? game.creators : [];
    const news = [];
    const añoActual = Number(game.time?.año) || 2026;
    agregarNuevosCreadores(game);

    creators.forEach(creator => {
        if (creator.activo === false) return;
        if (Number.isInteger(creator.debutYear) && creator.debutYear > añoActual) return;

        const mundo = ensureWorld(creator);
        if (mundo.año !== añoActual) {
            mundo.año = añoActual;
            mundo.videos = 0;
            mundo.vistas = 0;
            mundo.nuevosSeguidores = 0;
            mundo.virales = 0;
            mundo.clips = 0;
            mundo.enojos = 0;
            mundo.perdidos = 0;
            mundo.colaboraciones = 0;
            mundo.temporadas = 0;
        }
        const seguidoresAntes = Math.max(1, Number(creator.seguidores) || 1);
        const base = Number(creator.crecimientoBase) || 0.025;
        const popularidad = Math.max(0, Math.min(100, Number(creator.popularidad) || 50));

        const videos = random(30, 150);
        const ratioVistas = seguidoresAntes < 10000 ? randomFloat(0.10, 0.42) : seguidoresAntes < 100000 ? randomFloat(0.06, 0.28) : randomFloat(0.045, 0.22);
        const promedioVistas = Math.max(250, seguidoresAntes * ratioVistas * (0.65 + popularidad / 170));
        const vistas = Math.max(0, Math.round(videos * promedioVistas * randomFloat(0.72, 1.28)));

        const viralChance = Math.min(0.20, 0.025 + popularidad / 1300);
        const virales = Math.random() < viralChance ? random(1, 3) : 0;
        const clips = Math.max(0, Math.round(vistas / Math.max(12000, seguidoresAntes * 0.18)) + (virales ? random(1, 3) : 0));

        let crecimientoPct = Math.max(0.003, base * randomFloat(0.55, 1.35));
        crecimientoPct += Math.min(0.025, popularidad / 5000);
        let nuevos = Math.round(seguidoresAntes * crecimientoPct + vistas * randomFloat(0.00025, 0.0010));
        if (virales) nuevos += Math.round(seguidoresAntes * randomFloat(0.004, 0.025) * virales);

        // El mundo también puede tener malas rachas. Las pérdidas son visibles
        // y afectan realmente al ranking, en lugar de ser solo texto.
        let perdidos = 0;
        const recentFuna = Number(creator.mundo?.lastFunaYear) === añoActual;
        const funaChance = recentFuna ? 0 : Math.min(0.09, 0.012 + (100 - popularidad) / 4200);
        if (Math.random() < funaChance) {
            const gravedad = randomFloat(0.025, 0.12);
            perdidos = Math.max(1, Math.round(seguidoresAntes * gravedad));
            nuevos -= perdidos;
            mundo.enojos += 1;
            mundo.perdidos += perdidos;
            mundo.lastFunaYear = añoActual;
            game.worldDramaHistory = Array.isArray(game.worldDramaHistory) ? game.worldDramaHistory : [];
            game.worldDramaHistory.push({creatorId: creator.id, año: añoActual});
            game.worldDramaHistory = game.worldDramaHistory.slice(-24);
            creator.popularidad = Math.max(0, popularidad - randomFloat(1.2, 4.5));
            news.push({ type: "drama", creatorId: creator.id, creator: creator.nombre, text: `⚠️ ${creator.nombre} fue funado tras una polémica y perdió ${perdidos.toLocaleString()} seguidores.` });
        }

        if (virales > 0) news.push({ type: "viral", creatorId: creator.id, creator: creator.nombre, text: `🔥 ${creator.nombre} tuvo ${virales} momento${virales > 1 ? "s" : ""} viral${virales > 1 ? "es" : ""}.` });
        if (Math.random() < Math.min(0.12, 0.01 + seguidoresAntes / 50000000)) news.push({ type: "sponsor", creatorId: creator.id, creator: creator.nombre, text: `💼 ${creator.nombre} cerró un nuevo acuerdo comercial.` });

        creator.seguidores = Math.max(100, seguidoresAntes + nuevos);
        creator.popularidad = Math.max(0, Math.min(100, Number(creator.popularidad || popularidad) + randomFloat(-0.6, 1.0) + (virales ? 0.7 : 0)));

        mundo.videos += videos;
        mundo.vistas += vistas;
        mundo.nuevosSeguidores += nuevos;
        mundo.virales += virales;
        mundo.clips += clips;
        mundo.temporadas += 1;
    });

    simularColaboracionNPC(game, news);
    game.worldNews = news.slice(-12);
    game.worldYearNews = Array.isArray(game.worldYearNews) ? game.worldYearNews : [];
    game.worldYearNews.push(...news);
    game.worldYearNews = game.worldYearNews.slice(-40);
    return news;
}

export default { simulateWorld };
