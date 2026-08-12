// data/creators.js
// El mundo usa cifras BASE de simulación. No pretenden ser seguidores reales exactos:
// sirven para que la escala entre creadores sea coherente y el mundo pueda crecer.

const C = (id, nombre, nicho, seguidores, popularidad, crecimientoBase = 0.025, debutYear = null) => ({
    id,
    nombre,
    nicho,
    pais: "Argentina",
    seguidores,
    seguidoresIniciales: seguidores,
    popularidad,
    crecimientoBase,
    debutYear,
    esRevelacion: Number.isInteger(debutYear),
    relacion: 0,
    respeto: 0,
    rivalidad: 0,
    colaboraciones: 0,
    activo: true,
    mundo: {
        videos: 0,
        vistas: 0,
        nuevosSeguidores: 0,
        virales: 0,
        clips: 0,
        enojos: 0,
        temporadas: 0
    }
});

const creatorsIniciales = [
    C("coscu", "Coscu", "Gaming", 2500000, 95, 0.018),
    C("spreen", "Spreen", "Gaming", 5000000, 98, 0.032),
    C("coker", "Coker", "Gaming", 700000, 82, 0.045),
    C("mernosketti", "Mernosketti", "Gaming", 550000, 80, 0.050),
    C("momo", "Momo", "Gaming", 1400000, 88, 0.025),
    C("goncho", "Goncho", "Gaming", 1000000, 86, 0.028),
    C("brunenger", "Brunenger", "Variedad", 1100000, 87, 0.030),
    C("luquita", "Luquita Rodríguez", "Fútbol", 1300000, 90, 0.040),
    C("davoo", "Davoo Xeneize", "Fútbol", 2600000, 93, 0.038),
    C("lacobra", "La Cobra", "Fútbol", 1800000, 91, 0.042),
    C("carrera", "Carrera", "Gaming", 800000, 78, 0.035),
    C("ciber-renzo", "Ciber-Renzo", "Gaming", 420000, 76, 0.050),
    C("robleis", "Robleis", "Gaming", 6500000, 97, 0.025),
    C("reydelgaming", "Rey del Gaming", "Gaming", 900000, 77, 0.030),
    C("luken", "Luken", "Gaming", 600000, 74, 0.030),
    C("joaco", "Jjjoaco", "Gaming", 750000, 79, 0.042),
    C("agusbob", "AgusBob", "Gaming", 500000, 72, 0.040),
    C("tuli", "Tuli", "Variedad", 950000, 80, 0.035),
    C("milica", "Milica", "Variedad", 850000, 79, 0.033),
    C("santidead", "Santidead", "Gaming", 450000, 70, 0.032),
    C("frankkaster", "Frankkaster", "Gaming", 700000, 75, 0.020),
    C("pimpeano", "Pimpeano", "Variedad", 650000, 76, 0.025),
    C("gianpa", "Gianpa", "Variedad", 550000, 73, 0.030),
    C("manteca", "Manteca", "Gaming", 350000, 68, 0.045),
    C("tomasmazza", "Tomás Mazza", "Fitness", 4500000, 94, 0.030),
    C("mauromon", "Mauro Monzón", "Variedad", 500000, 70, 0.028),
    C("luzutv", "Luzu", "Variedad", 1200000, 88, 0.025),
    C("miguegranados", "Migue Granados", "Variedad", 1800000, 92, 0.020),
    C("martinpugliese", "Martín Pugliese", "Comedia", 650000, 78, 0.028),
    C("ibai", "Ibai", "Variedad", 15000000, 100, 0.018),
    C("elrubius", "ElRubius", "Gaming", 14000000, 99, 0.012),
    C("auron", "AuronPlay", "Gaming", 17000000, 99, 0.014),
    C("illojuan", "IlloJuan", "Gaming", 5000000, 96, 0.025),
    C("xokas", "Xokas", "Variedad", 2200000, 91, 0.020),
    C("luisito", "Luisito Comunica", "Vlog", 42000000, 100, 0.012),
    C("mkbhd", "MKBHD", "Tecnología", 20000000, 100, 0.010),

    // Más escena internacional: no participan en Coscu Army Awards.
    C("elmariana", "ElMariana", "Gaming", 12000000, 97, 0.018),
    C("rivers", "Rivers", "Variedad", 7000000, 95, 0.025),
    C("westcol", "WestCOL", "Variedad", 9000000, 94, 0.032),
    C("juan_guarnizo", "JuanSGuarnizo", "Variedad", 12000000, 96, 0.020),
    C("bratty", "Bratty", "Música", 2200000, 82, 0.025),
    C("missa", "MissaSinfonia", "Gaming", 5000000, 91, 0.022),
    C("cellbit", "Cellbit", "Gaming", 7000000, 94, 0.020),
    C("gamerz", "GamerZ", "Gaming", 850000, 70, 0.045),
    // Creadores ficticios de nueva camada: aparecen como parte del mundo y
    // pueden competir por Streamer Revelación en su temporada de debut.
    C("rookie_abril", "AbrilK", "Gaming", 4200, 58, 0.16, 2026),
    C("rookie_tomi", "TomiFPS", "Gaming", 6800, 61, 0.14, 2026),
    C("rookie_naza", "NazaLive", "Variedad", 3100, 55, 0.18, 2026),
    C("rookie_bauti", "BautiGG", "Gaming", 9500, 64, 0.13, 2026),
    C("rookie_mora", "MoraIRL", "IRL", 5200, 57, 0.15, 2027),
    C("rookie_lean", "LeanClips", "Gaming", 7400, 60, 0.17, 2027),
    C("rookie_fede", "FedeStream", "Fútbol", 3600, 54, 0.19, 2027),
    C("rookie_vale", "ValeVlogs", "Vlog", 6100, 59, 0.16, 2027),
    C("rookie_joaco", "JoacoEnVivo", "Gaming", 2800, 52, 0.21, 2028),
    C("rookie_lola", "LolaPlay", "Variedad", 4700, 56, 0.18, 2028),
    C("rookie_santi", "SantiFPS", "Gaming", 8300, 62, 0.15, 2028),
    C("rookie_cami", "CamiIRL", "IRL", 3900, 53, 0.20, 2028),
];

const paisesNoArgentina = {
    ibai: "España",
    elrubius: "España",
    auron: "España",
    illojuan: "España",
    xokas: "España",
    luisito: "México",
    mkbhd: "Estados Unidos",
    elmariana: "México",
    rivers: "México",
    westcol: "Colombia",
    juan_guarnizo: "Colombia",
    bratty: "México",
    missa: "Brasil",
    cellbit: "Brasil",
    gamerz: "Chile"
};

creatorsIniciales.forEach(c => {
    if (paisesNoArgentina[c.id]) c.pais = paisesNoArgentina[c.id];
});

export { creatorsIniciales };
