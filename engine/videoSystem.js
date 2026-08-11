// engine/videoSystem.js
// El jugador elige 1 video destacado por trimestre.
// Una sola elección de video representa la temporada completa.
// Esto representa el volumen de publicaciones del creador, como los partidos
// jugados por un futbolista: no se elige uno por uno, pero sí cuentan en sus stats.

import formats from "../data/generator/formats.js";
import topics from "../data/generator/topics.js";
import { gameState, recalcularFama, agregarFamaLogro, actualizarFamaPorSubs } from "./gameState.js";
import { simulateWorld } from "./worldSimulation.js";

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function obtenerTemas(niche) {
    return topics[niche] || topics.Gaming || ["Gaming", "Internet", "YouTube", "Tendencias"];
}

function obtenerFormato(index) {
    if (!formats?.length) return { name: "Video", cost: 0, risk: 10 };
    return formats[index] || formats[index % formats.length];
}

function obtenerTipo(index) {
    if (index < 2) return "gratis";
    if (index < 4) return "medio";
    return "caro";
}

function analizarTema(tema, niche) {
    const t = String(tema || "").toLowerCase();
    const personasGigantes = ["messi", "cristiano ronaldo", "ibai", "coscu", "spreen", "davoo", "la cobra"];
    const personas = ["messi", "cristiano ronaldo", "coscu", "spreen", "davoo", "la cobra", "ibai"];
    const juegosMuyBuscados = ["gta vi", "fortnite", "minecraft", "roblox", "valorant", "ea sports fc"];
    const p = gameState.player || {};
    const subs = Number(p.suscriptores || 0);
    const rel = Object.values(p.relationships || {}).some(v => Number(v) >= 45);

    if (personasGigantes.some(x => t.includes(x))) {
        // Nombrar a una celebridad no significa tener acceso a ella.
        // Los encuentros reales requieren audiencia o una relación fuerte.
        const acceso = subs >= 100000 || rel || Number(p.fama || 0) >= 65;
        return acceso
            ? { impacto: 1.55, tipo: "persona", entidad: tema, hook: "PERSONA_GRANDE" }
            : { impacto: 0.98, tipo: "persona", entidad: tema, hook: "PERSONA_INALCANZABLE" };
    }
    if (personas.some(x => t.includes(x))) {
        return { impacto: 1.30, tipo: "persona", entidad: tema, hook: "PERSONA" };
    }
    if (juegosMuyBuscados.some(x => t.includes(x))) {
        return { impacto: 1.14, tipo: "juego", entidad: tema, hook: "JUEGO_TENDENCIA" };
    }
    if (["mercado de pases", "libertadores", "mundial", "balón de oro", "selección argentina"].some(x => t.includes(x))) {
        return { impacto: 1.18, tipo: "actualidad", entidad: tema, hook: "ACTUALIDAD" };
    }
    return { impacto: 1.0, tipo: "tema", entidad: tema, hook: "NORMAL" };
}

function generarTitulo(formato, tema, niche = gameState.player?.niche) {
    const analisis = analizarTema(tema);
    const tLower = String(tema || "").toLowerCase();

    // Fútbol: títulos más cercanos al contenido de stream/reacción de creadores
    // como Davoo Xeneize y La Cobra: actualidad, opinión, reacciones y debate.
    if (niche === "Fútbol") {
        if (tLower.includes("reaccionando")) return `${String(tema).toUpperCase()} 😱`;
        if (tLower.includes("mercado de pases")) return `EL MERCADO DE PASES ESTÁ COMPLETAMENTE LOCO`;
        if (tLower.includes("superclásico")) return `REACCIONANDO AL SUPERCLÁSICO: NO PUEDE SER`;
        if (tLower.includes("boca")) return `BOCA: LO QUE NADIE TE ESTÁ CONTANDO`;
        if (tLower.includes("river")) return `RIVER: MI OPINIÓN DESPUÉS DE VER ESTO`;
        if (tLower.includes("messi")) return `¿QUÉ ESTÁ PASANDO CON MESSI? MI OPINIÓN`;
        if (tLower.includes("goles")) return `REACCIONANDO A LOS MEJORES GOLES DE LA FECHA`;
        if (tLower.includes("jugador")) return `EL JUGADOR QUE ESTÁ ROMPIENDO TODO`;
        if (tLower.includes("fecha")) return `ANALIZANDO TODA LA FECHA: ¿QUIÉN FUE EL MEJOR?`;
        if (tLower.includes("predicciones")) return `MIS PREDICCIONES PARA LA PRÓXIMA FECHA`;
        return `${String(tema).toUpperCase()}: MI OPINIÓN SIN FILTRO`;
    }
    const t = String(tema || "");

    // Las personas/acontecimientos excepcionales cambian el título porque
    // representan una historia que realmente merece ser clickeada.
    if (analisis.hook === "PERSONA_INALCANZABLE") {
        return `INTENTÉ CONOCER A ${t.toUpperCase()} Y ESTO PASÓ`;
    }

    if (analisis.hook === "PERSONA_GRANDE") {
        const persona = analisis.entidad;
        if (formato.name === "Viajando a" || formato.name === "24 Horas con") return `UN DÍA CON ${persona.toUpperCase()} 😳`;
        if (formato.name === "Reaccionando a") return `REACCIONANDO A MI ENCUENTRO CON ${persona.toUpperCase()}`;
        if (formato.name === "Documental sobre") return `LA HISTORIA DETRÁS DE MI ENCUENTRO CON ${persona.toUpperCase()}`;
        return `CONOCÍ A ${persona.toUpperCase()} Y PASÓ ESTO...`;
    }

    if (analisis.hook === "PERSONA") {
        if (formato.name === "Reaccionando a") return `REACCIONANDO A ${t.toUpperCase()}`;
        return `ME ENCONTRÉ CON ${t.toUpperCase()} Y NO LO ESPERABA`;
    }

    if (analisis.hook === "JUEGO_TENDENCIA") {
        const opciones = [
            `ME PASÉ ${t.toUpperCase()} Y NO ERA COMO ESPERABA`,
            `EL MOMENTO MÁS RARO QUE TUVE EN ${t.toUpperCase()}`,
            `NO PODÍA CREER LO QUE PASÓ EN ${t.toUpperCase()}`
        ];
        return opciones[random(0, opciones.length - 1)];
    }

    if (analisis.hook === "ACTUALIDAD") {
        return `${t.toUpperCase()}: TODO LO QUE ESTÁ PASANDO`;
    }

    const plantillas = {
        Gameplay: [`Jugando ${t} por primera vez`, `NO esperaba esto en ${t}`, `La partida más rara de ${t}`],
        "Gameplay premium": [`Jugando ${t} con todo al máximo`, `Probé ${t} y pasó esto`, `¿Vale la pena ${t}?`],
        "Reaccionando a": [`Reaccionando a lo mejor de ${t}`, `NO PUEDO CREER lo que pasó con ${t}`, `Mi reacción a ${t}`],
        Challenge: [`El desafío más difícil de ${t}`, `Intenté hacer esto en ${t}`, `¿Puedo superar este desafío de ${t}?`],
        "24 Horas con": [`24 HORAS con ${t}`, `Pasé 24 horas haciendo esto: ${t}`, `24 HORAS que cambiaron todo`],
        "Viajando a": [`Viajando para conocer ${t}`, `Mi viaje para descubrir ${t}`, `NO esperaba encontrar esto en ${t}`],
        "Documental sobre": [`La historia detrás de ${t}`, `La verdad sobre ${t}`, `¿Qué pasó realmente con ${t}?`]
    };
    const opciones = plantillas[formato.name] || [`${formato.name}: ${t}`];
    return opciones[random(0, opciones.length - 1)];
}

function atributoPrincipal(formato, tema) {
    if (formato === "Gameplay" || formato === "Gameplay premium") return "algoritmo";
    if (formato === "Reaccionando a") return "carisma";
    if (formato === "Challenge") return "creatividad";
    if (formato === "24 Horas con") return "constancia";
    if (formato === "Viajando a") return "carisma";
    if (formato === "Documental sobre") return "edicion";

    return tema ? "creatividad" : "algoritmo";
}

export function generarVideos(player) {
    const temas = obtenerTemas(player.niche);
    const catalogo = [];
    const dineroDisponible = Math.max(0, Number(player.dinero) || 0);

    // Generamos opciones y después mostramos SOLO las que el jugador puede pagar.
    // Los videos baratos/gratis tienen más presencia para que una partida nueva
    // nunca quede bloqueada por falta de dinero.
    const formatosDisponibles = formats.filter(f => Number(f.cost) <= dineroDisponible);
    const formatosSeguros = formatosDisponibles.length
        ? formatosDisponibles
        : formats.filter(f => Number(f.cost) === 0);

    const usados = new Set();
    let intentos = 0;

    while (catalogo.length < 6 && intentos < 80) {
        intentos++;
        const tema = temas[random(0, temas.length - 1)];
        const formato = formatosSeguros[random(0, formatosSeguros.length - 1)];
        const clave = `${formato.name}::${tema}`;
        if (usados.has(clave)) continue;
        usados.add(clave);

        const enfoquePrincipal = atributoPrincipal(formato.name, tema);
        const enfoqueSecundario = enfoquePrincipal === "carisma" ? "humor" : "creatividad";

        const titulo = generarTitulo(formato, tema, player.niche);
        const contexto = analizarTema(tema, player.niche);

        catalogo.push({
            id: typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `video_${Date.now()}_${catalogo.length}`,
            titulo,
            tituloImpacto: contexto.impacto,
            tituloHook: contexto.hook,
            formato: formato.name,
            tema,
            costo: Number(formato.cost) || 0,
            riesgo: Number(formato.risk) || 0,
            tipo: formato.cost === 0 ? "gratis" : formato.cost <= 35 ? "barato" : "premium",
            enfoquePrincipal,
            enfoqueSecundario
        });
    }

    // Si el catálogo quedó corto por falta de combinaciones, completamos
    // con opciones gratuitas repetibles pero con título/ID distintos.
    while (catalogo.length < 6) {
        const tema = temas[random(0, temas.length - 1)];
        const formato = formatosSeguros[0];
        const enfoquePrincipal = atributoPrincipal(formato.name, tema);
        const enfoqueSecundario = enfoquePrincipal === "carisma" ? "humor" : "creatividad";
        const titulo = generarTitulo(formato, tema, player.niche);
        const contexto = analizarTema(tema, player.niche);
        catalogo.push({
            id: `video_${Date.now()}_${catalogo.length}_${Math.random().toString(36).slice(2,7)}`,
            titulo,
            tituloImpacto: contexto.impacto,
            tituloHook: contexto.hook,
            formato: formato.name,
            tema,
            costo: Number(formato.cost) || 0,
            riesgo: Number(formato.risk) || 0,
            tipo: formato.cost === 0 ? "gratis" : "barato",
            enfoquePrincipal,
            enfoqueSecundario
        });
    }

    // Orden económico: primero gratis/baratos, luego premium.
    return catalogo.sort((a,b) => a.costo - b.costo);
}

function potenciaBase(player) {
    const a = player.atributos || {};
    const valores = Object.values(a).map(v => Number(v) || 0);
    let potencia = valores.reduce((sum, value) => sum + value, 0) * 0.42;

    const eq = player.equipment || {};
    if (eq.pc && eq.pc !== "government_pc") potencia += 6;
    if (eq.camera && eq.camera !== "old_phone") potencia += 5;
    if (eq.microphone && eq.microphone !== "earphones") potencia += 4;

    return potencia;
}

function calcularTendencia() {
    const p = gameState.player;
    const tendencia = Array.isArray(gameState.trends)
        ? gameState.trends.find(
            t => t.activa && (t.nicho === p.niche || t.nicho === "Todos")
        )
        : null;

    return tendencia
        ? clamp(Number(tendencia.multiplicador) || 1, 1, 1.35)
        : 1;
}

// La audiencia importa mucho más a medida que el canal crece.
// 1.7M subs puede tener videos de decenas/cientos de miles de vistas;
// 50 subs sigue siendo un canal muy chico.
function bonusPretemporada(player) {
    const e = player?.pretemporada?.efecto;
    return e || null;
}

function baseVistasPorVideo(player, calidad = 1) {
    const subs = Math.max(50, Number(player.suscriptores) || 50);
    const fama = clamp(Number(player.fama) || 0, 0, 100);
    const a = player.atributos || {};
    const algoritmo = Number(a.algoritmo) || 0;
    const marketing = Number(a.marketing) || 0;
    const edicion = Number(a.edicion) || 0;
    const constancia = Number(a.constancia) || 0;

    // Escala pensada para una carrera corta: un solo video representa el año.
    // La audiencia existente ayuda, pero el descubrimiento externo es grande.
    const calidadCanal = 0.65
        + clamp(algoritmo / 100, 0, 1) * 0.30
        + clamp(edicion / 100, 0, 1) * 0.20
        + clamp(marketing / 100, 0, 1) * 0.12
        + clamp(constancia / 100, 0, 1) * 0.10
        + clamp(fama / 100, 0, 1) * 0.12;

    const descubrimientoBase = 600000 + Math.min(5000000, Math.pow(Math.max(1, subs), 0.72) * 700);
    const audiencia = subs * (0.45 + fama / 220) * randomFloat(0.75, 1.30);
    const pre = bonusPretemporada(player);
    const preMult = pre === "marketing" ? 1.12 : pre === "algoritmo" ? 1.10 : pre === "edicion" ? 1.12 : 1;

    return Math.max(
        1000,
        Math.floor((descubrimientoBase + audiencia) * calidadCanal * calidad * calcularTendencia() * preMult)
    );
}
function calcularSubsPorVideo(vistas, player, viral = false) {
    const a = player.atributos || {};
    const carisma = Number(a.carisma) || 0;
    const comunidad = Number(player.comunidad) || 50;
    const fama = Number(player.fama) || 0;
    const subsActuales = Math.max(50, Number(player.suscriptores) || 50);

    // Conversión alta al principio y progresivamente menor en canales enormes.
    // La escala permite que 8k en un año sea flojo, no un gran resultado.
    let conversion = 0.027;
    if (subsActuales >= 10000000) conversion = 0.00110;
    else if (subsActuales >= 5000000) conversion = 0.00135;
    else if (subsActuales >= 1000000) conversion = 0.00170;
    else if (subsActuales >= 500000) conversion = 0.00220;
    else if (subsActuales >= 250000) conversion = 0.00280;
    else if (subsActuales >= 100000) conversion = 0.00350;
    else if (subsActuales >= 50000) conversion = 0.00450;
    else if (subsActuales >= 10000) conversion = 0.00650;
    else if (subsActuales >= 1000) conversion = 0.01450;

    conversion *= 1 + clamp(carisma / 100, 0, 1) * 0.55;
    conversion *= 0.82 + clamp(comunidad / 100, 0, 1) * 0.36;
    conversion *= 0.90 + clamp(fama / 100, 0, 1) * 0.22;
    if (player?.pretemporada?.efecto === "carisma") conversion *= 1.14;
    if (viral) conversion *= randomFloat(1.25, 1.85);

    let resultado = Math.round(Math.max(0, vistas) * conversion * randomFloat(0.72, 1.30));

    if (viral) resultado = Math.round(resultado * randomFloat(1.5, 5.0));
    if (viral && Math.random() < 0.012) resultado = Math.round(resultado * randomFloat(6, 18));

    return Math.max(25, resultado);
}
function calcularIngresosPorVideo(vistas, player) {
    const a = player.atributos || {};
    const marketing = Number(a.marketing) || 0;
    const fama = Number(player.fama) || 0;

    const rpm = clamp(
        1.25 + marketing * 0.075 + fama * 0.014 + randomFloat(-0.18, 0.38),
        0.85,
        7.50
    );

    let ingreso = (Math.max(1, vistas) / 1000) * rpm;
    if (player?.pretemporada?.efecto === "marketing") ingreso *= 1.12;
    return Math.max(0.05, ingreso);
}

function resultadoVideoManual(titulo, enfoquePrincipal, enfoqueSecundario, contexto = {}) {
    const p = gameState.player;
    const a = p.atributos || {};

    let potencia = potenciaBase(p);
    potencia += (Number(a[enfoquePrincipal]) || 0) * 0.95;
    potencia += (Number(a[enfoqueSecundario]) || 0) * 0.35;
    potencia += random(-10, 14);

    let vistas = baseVistasPorVideo(p, 0.92 + clamp(potencia / 150, 0, 0.8));
    const tituloImpacto = clamp(Number(contexto.tituloImpacto) || 1, 0.85, 1.70);
    vistas *= tituloImpacto;

    const creatividad = Number(a.creatividad) || 0;
    const algoritmo = Number(a.algoritmo) || 0;
    const carisma = Number(a.carisma) || 0;

    let probViral = 12 + creatividad * 0.28 + algoritmo * 0.20 + carisma * 0.08;
    probViral *= 1 + Math.max(0, tituloImpacto - 1) * 0.90;
    probViral = clamp(probViral, 8, 42);

    // En los primeros dos años existe una posibilidad especial de despegar.
    const carreraAño = Number(p.carreraAño || 1);
    if (carreraAño <= 2) probViral += 8;

    const viral = Math.random() * 100 < probViral;
    let nivelViralidad = "normal";
    let multiplicadorViral = 1;

    if (viral) {
        multiplicadorViral = randomFloat(2.2, 7.5);
        vistas *= multiplicadorViral;
        nivelViralidad = multiplicadorViral >= 6 ? "fenomeno" : multiplicadorViral >= 4 ? "mega_viral" : "viral";
    }

    vistas = Math.max(1, Math.floor(vistas));
    const nuevosSuscriptores = calcularSubsPorVideo(vistas, p, viral);
    const ingresos = calcularIngresosPorVideo(vistas, p);

    if (viral && carreraAño <= 2 && !p.primerViralForzado) p.primerViralForzado = true;

    const famaGanada = viral ? random(2, 6) : (Math.random() < 0.28 ? 1 : 0);

    return {
        titulo: titulo || "Nuevo video",
        vistas,
        suscriptores: nuevosSuscriptores,
        dinero: Math.round(ingresos),
        famaGanada,
        viral,
        nivelViralidad,
        potencia: Math.round(potencia),
        enfoquePrincipal,
        enfoqueSecundario,
        rpm: (Math.round(ingresos) / Math.max(1, vistas) * 1000).toFixed(3),
        multiplicadorTendencia: calcularTendencia(),
        multiplicadorViral
    };
}
function aplicarResultado(resultado, contarVideo = true) {
    const p = gameState.player;

    p.vistasTotales += resultado.vistas;
    p.suscriptores += resultado.suscriptores;
    actualizarFamaPorSubs(p);
    const dinero = Math.round(Number(resultado.dinero) || 0);
    p.dinero += dinero;
    p.ingresosTrimestre += dinero;
    p.ingresosGenerados = (Number(p.ingresosGenerados) || 0) + dinero;
    if (resultado.famaGanada > 0) agregarFamaLogro(p, resultado.famaGanada, resultado.viral ? "viral" : "video destacado");

    if (contarVideo) p.videosSubidos += 1;

    if (!p.stats) p.stats = {};
    p.stats.videosPublicados =
        (Number(p.stats.videosPublicados) || 0) + 1;

    p.stats.mejorVideo = Math.max(
        Number(p.stats.mejorVideo) || 0,
        resultado.vistas
    );

    if (resultado.viral) {
        p.stats.videosVirales =
            (Number(p.stats.videosVirales) || 0) + 1;
    }
}

export function procesarPublicacionVideo(
    titulo,
    enfoquePrincipal,
    enfoqueSecundario,
    contexto = {}
) {
    const resultado = resultadoVideoManual(
        titulo,
        enfoquePrincipal || "creatividad",
        enfoqueSecundario || "carisma",
        contexto
    );

    aplicarResultado(resultado, true);

    gameState.lastVideoResult = resultado;

    gameState.player.ultimoVideoResultado = {
        titulo: resultado.titulo,
        vistasGanadas: resultado.vistas,
        subsGanados: resultado.suscriptores,
        dineroGanado: resultado.dinero,
        rpmFinal: resultado.rpm,
        esViral: resultado.viral
    };

    gameState.agregarNotificacion({
        tipo: "video",
        titulo: resultado.viral
            ? "🔥 Tu video se hizo viral"
            : "📹 Video publicado",
        descripcion:
            `${resultado.titulo} consiguió ${resultado.vistas.toLocaleString()} vistas.`
    });

    return resultado;
}

function simularVideoSecundario() {
    const p = gameState.player;
    const a = p.atributos || {};

    const calidad =
        0.82 +
        clamp(
            (potenciaBase(p) +
                (Number(a.constancia) || 0) * 1.15 +
                (Number(a.algoritmo) || 0) * 0.95 +
                (Number(a.creatividad) || 0) * 0.65) / 260,
            0,
            0.95
        );

    let vistas = baseVistasPorVideo(p, calidad);

    let probViral =
        0.06 +
        (Number(a.creatividad) || 0) * 0.011 +
        (Number(p.fama) || 0) * 0.0025;
    if (p?.pretemporada?.efecto === "creatividad") probViral *= 1.35;
    probViral = clamp(probViral, 0.06, 2.2);

    const viral = Math.random() * 100 < probViral;
    if (viral) vistas *= randomFloat(2.2, 5.5);

    vistas = Math.max(1, Math.floor(vistas));

    return {
        vistas,
        viral,
        suscriptores: calcularSubsPorVideo(vistas, p, viral),
        dinero: calcularIngresosPorVideo(vistas, p)
    };
}

export function procesarPublicacionTrimestre(
    titulo,
    enfoquePrincipal,
    enfoqueSecundario,
    contexto = {}
) {
    // En El Creador, una temporada = un año y el jugador toma UNA decisión.
    const manualResult = procesarPublicacionVideo(
        titulo,
        enfoquePrincipal || "creatividad",
        enfoqueSecundario || "carisma",
        contexto
    );

    const actividad = {
        año: gameState.time.año,
        trimestre: 1,
        videos: 1,
        vistas: manualResult.vistas,
        suscriptores: manualResult.suscriptores,
        dinero: manualResult.dinero,
        fama: manualResult.famaGanada,
        virales: manualResult.viral ? 1 : 0,
        mejorVideo: manualResult.vistas
    };

    const p = gameState.player;
    p.actividadTrimestre = actividad;
    p.historialTrimestre1 = actividad;
    p.historialTrimestre2 = null;

    // El mundo sí avanza, pero el jugador solo ve un resumen anual.
    simulateWorld(gameState);
    gameState.generarEventoPendiente();
    if (!gameState.pendingEvent) {
        gameState.generarOfertaColaboracionAutomatica();
        if (!gameState.pendingCollabOffer) gameState.generarOfertaSponsor();
    }

    const quarterResult = {
        manualVideo: manualResult,
        totalVideos: 1,
        totalVistas: manualResult.vistas,
        totalSubs: manualResult.suscriptores,
        totalDinero: manualResult.dinero,
        totalFama: manualResult.famaGanada,
        simulatedVideos: 0,
        simVistas: 0,
        simSubs: 0,
        simDinero: 0,
        simFama: 0,
        virales: manualResult.viral ? 1 : 0
    };

    gameState.lastQuarterResult = quarterResult;
    gameState.guardar();
    return quarterResult;
}
export default {
    generarVideos,
    procesarPublicacionVideo,
    procesarPublicacionTrimestre
};
