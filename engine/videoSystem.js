// engine/videoSystem.js
// El jugador elige 1 video destacado por trimestre.
// Después, su canal publica entre 30 y 150 videos propios durante ese trimestre.
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
    const edad = Number(player.edad || 18);
    const staffMitiga = Number(player.staff?.editor?.level || 0) + Number(player.staff?.manager?.level || 0) + Number(player.staff?.trainer?.level || 0);
    const edadFactor = edad < 30 ? 1 : Math.max(0.82, 1 - (edad - 29) * 0.012 + staffMitiga * 0.012);
    const algoritmo = Number(a.algoritmo) || 0;
    const marketing = Number(a.marketing) || 0;
    const edicion = Number(a.edicion) || 0;
    const constancia = Number(a.constancia) || 0;
    const boost = player?.boosts || {};
    const boostViews = boost.viewBoostTurns > 0 ? Number(boost.viewMultiplier || 1) : 1;

    // NUEVA ESCALA: Mucho más generosa para que el crecimiento sea satisfactorio
    // Un canal de 10k subs debería tener entre 3k-8k vistas por video normal
    // y el destacado puede llegar a 20k-50k facilmente
    const baseEngagement =
        0.35 +  // Base más alta (era 0.20)
        clamp(fama / 100, 0, 1) * 0.12 +  // Más impacto de fama (era 0.07)
        clamp(constancia / 100, 0, 1) * 0.08 +  // Más impacto de constancia (era 0.05)
        clamp(algoritmo / 100, 0, 1) * 0.15 +  // Más impacto de algoritmo (era 0.10)
        clamp(edicion / 100, 0, 1) * 0.12 +  // Más impacto de edición (era 0.08)
        clamp(marketing / 100, 0, 1) * 0.08;  // Más impacto de marketing (era 0.04)
    
    // Boost más agresivo para canales pequeños
    const smallChannelBoost = subs < 10000 ? 2.5 : 1;  // Era 2
    
    // Rango de engagement más alto: 0.35 a 0.85 (era 0.20 a 0.60)
    const engagement = clamp(baseEngagement * smallChannelBoost, 0.35, 0.85);

    let pre = 1;
    const efecto = bonusPretemporada(player);
    if (efecto === "marketing") pre *= 1.18;  // Era 1.12
    if (efecto === "algoritmo") pre *= 1.15;  // Era 1.10
    if (efecto === "edicion") pre *= 1.18;  // Era 1.12

    // Variación más amplia y generosa: 0.85 a 1.45 (era 0.78 a 1.28)
    const variacion = randomFloat(0.85, 1.45);
    
    const audiencia = subs * engagement * variacion * calidad * calcularTendencia() * pre * boostViews * edadFactor;
    
    // Descubrimiento mucho más generoso para canales nuevos
    // Ahora un canal nuevo puede tener 500-1500 vistas base (era 180-700)
    const descubrimiento = subs < 10000
        ? random(500, 1500) + Math.floor(edicion * 15)  // Era 180-700 y *10
        : random(200, 800) + Math.floor(edicion * 8);   // Canales grandes también tienen descubrimiento
    
    return Math.max(descubrimiento, Math.floor(audiencia));
}

function calcularSubsPorVideo(vistas, player, viral = false) {
    const a = player.atributos || {};
    const carisma = Number(a.carisma) || 0;
    const comunidad = Number(player.comunidad) || 50;
    const fama = Number(player.fama) || 0;
    const subsActuales = Math.max(50, Number(player.suscriptores) || 50);

    // NUEVA ESCALA: Conversión más generosa para que el crecimiento de subs sea satisfactorio
    // Ahora los canales pequeños convierten mucho mejor
    let conversion = 0.018;  // Era 0.0115 - Base un 56% más alta
    
    if (subsActuales >= 1000000) conversion = 0.0012;   // Era 0.00085
    else if (subsActuales >= 500000) conversion = 0.0015; // Era 0.00100
    else if (subsActuales >= 250000) conversion = 0.0019; // Era 0.00125
    else if (subsActuales >= 100000) conversion = 0.0024; // Era 0.00155
    else if (subsActuales >= 50000) conversion = 0.0032;  // Era 0.00210
    else if (subsActuales >= 10000) conversion = 0.0055;  // Era 0.00360
    else if (subsActuales >= 1000) conversion = 0.010;    // Era 0.00700

    // Bonificaciones más fuertes
    conversion *= 1 + clamp(carisma / 100, 0, 1) * 0.85;  // Era 0.65 - Carisma impacta más
    conversion *= 0.88 + clamp(comunidad / 100, 0, 1) * 0.35;  // Era 0.85 y 0.30
    conversion *= 0.95 + clamp(fama / 100, 0, 1) * 0.28;  // Era 0.92 y 0.20
    
    if (player?.pretemporada?.efecto === "carisma") conversion *= 1.20;  // Era 1.14
    if (viral) conversion *= randomFloat(1.40, 2.20);  // Era 1.25-1.90

    // Variación más amplia: 0.75 a 1.45 (era 0.68-1.34)
    const variacion = randomFloat(0.75, 1.45);
    let resultado = Math.round(vistas * conversion * variacion);

    // Mínimo más alto: 25 subs incluso en videos flojos (era 15)
    resultado = Math.max(25, resultado);

    if (viral) {
        // Salto viral más agresivo: 1.8 a 8.0 (era 1.5-6.5)
        const saltoViral = randomFloat(1.8, 8.0);
        resultado = Math.max(150, Math.round(resultado * saltoViral));  // Mínimo 150 (era 100)
    }

    // Probabilidad aumentada de video excepcional: 1.2% (era 0.8%)
    if (viral && Math.random() < 0.012) {
        resultado = Math.round(resultado * randomFloat(10, 35));  // Multiplicador más alto
    }

    return resultado;
}

function calcularIngresosPorVideo(vistas, player) {
    const a = player.atributos || {};
    const marketing = Number(a.marketing) || 0;
    const fama = Number(player.fama) || 0;

    // NUEVA ESCALA: Monetización más generosa
    // Monetización tipo AdSense: se desbloquea a los 1.000 subs.
    if (Number(player?.suscriptores || 0) < 1000) return 0;
    
    // RPM base más alto: 1.50 a 12.00 (era 1.00 a 8.00)
    const rpm = clamp(
        1.50 + marketing * 0.095 + fama * 0.018 + randomFloat(-0.05, 0.40),
        1.20,
        12.00
    );

    let ingreso = (Math.max(1, vistas) / 1000) * rpm;
    if (player?.pretemporada?.efecto === "marketing") ingreso *= 1.18;  // Era 1.12
    
    // Mínimo más alto para que cada video genere algo significativo
    return Math.max(0.15, ingreso);
}

function resultadoVideoManual(titulo, enfoquePrincipal, enfoqueSecundario, contexto = {}) {
    const p = gameState.player;
    const a = p.atributos || {};

    let potencia = potenciaBase(p);
    potencia += (Number(a[enfoquePrincipal]) || 0) * 0.95;
    potencia += (Number(a[enfoqueSecundario]) || 0) * 0.35;
    potencia += random(-10, 14);

    let vistas = baseVistasPorVideo(
        p,
        0.9 + clamp(potencia / 150, 0, 0.8)
    );

    // El título importa: una idea coherente y excepcional puede multiplicar
    // el interés. "Conocí a Messi" no vale lo mismo que un gameplay genérico.
    const tituloImpacto = clamp(Number(contexto.tituloImpacto) || 1, 0.85, 1.70);
    vistas *= tituloImpacto;

    const creatividad = Number(a.creatividad) || 0;
    const algoritmo = Number(a.algoritmo) || 0;
    const carisma = Number(a.carisma) || 0;
    const edicion = Number(a.edicion) || 0;
    const fama = Number(a.fama) || 0;

    // Entre el año 1 y 2 existe un primer gran momento guionado:
    // no ocurre siempre en el mismo trimestre, pero evita carreras estancadas.
    const carreraAño = Number(p.carreraAño || 1);
    const primerViralPendiente = carreraAño <= 2 && !p.primerViralForzado;
    const puedeForzarPrimerViral = primerViralPendiente && (Number(p.stats?.videosPublicados) || 0) >= 3;

    let probViral =
        0.35 +
        creatividad * 0.035 +
        algoritmo * 0.025 +
        carisma * 0.012;

    // Un concepto excepcional y bien titulado tiene más posibilidades de
    // despegar que un video genérico.
    probViral *= 1 + Math.max(0, tituloImpacto - 1) * 0.75;
    probViral = clamp(probViral, 0.5, 12);
    if (puedeForzarPrimerViral) probViral = 100;

    const viral = Math.random() * 100 < probViral;
    let nivelViralidad = "normal";
    let multiplicadorViral = 1;

    if (viral) {
        multiplicadorViral = puedeForzarPrimerViral ? randomFloat(10, 20) : random(2, 8);
        vistas *= multiplicadorViral;
        nivelViralidad =
            multiplicadorViral >= 7 ? "fenomeno" :
            multiplicadorViral >= 5 ? "mega_viral" :
            "viral";
    }

    vistas = Math.max(1, Math.floor(vistas));

    const nuevosSuscriptores = calcularSubsPorVideo(vistas, p, viral);
    const ingresos = calcularIngresosPorVideo(vistas, p);

    if (viral && Number(p.carreraAño || 1) <= 2 && !p.primerViralForzado) p.primerViralForzado = true;

    const famaGanada =
        viral ? random(1, 3) :
        Math.random() < 0.16 ? 1 :
        0;

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
        factorDescubrimiento: Number((1 + clamp(algoritmo / 100, 0, 1) * 0.55 + clamp(edicion / 100, 0, 1) * 0.35 + clamp(fama / 100, 0, 1) * 0.20 + (Number(p.suscriptores||0)<10000 ? 0.35 : 0)).toFixed(1)),
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
    const manualResult = procesarPublicacionVideo(
        titulo,
        enfoquePrincipal || "creatividad",
        enfoqueSecundario || "carisma",
        contexto
    );

    // El minijuego ocurre después de elegir el video, por lo que su resultado
    // debe poder mejorar o empeorar el resultado ya calculado.
    const miniScore = Number(contexto.minigameScore);
    if (Number.isFinite(miniScore)) {
        if (miniScore < 35) {
            // Fallo claro: el video sale publicado, pero rinde peor.
            manualResult.vistas = Math.max(0, Math.round(manualResult.vistas * 0.55));
            manualResult.suscriptores = Math.max(0, Math.round(manualResult.suscriptores * 0.65));
            manualResult.dinero = Math.max(0, Math.round(manualResult.dinero * 0.55));
            manualResult.famaGanada = Math.max(0, Number(manualResult.famaGanada || 0) - 1);
            manualResult.miniResultado = "fallo";
            gameState.player.comunidad = Math.max(0, Number(gameState.player.comunidad || 50) - 2);
            gameState.player.reputacion = Math.max(0, Number(gameState.player.reputacion || 50) - 1);
        } else if (miniScore < 65) {
            manualResult.miniResultado = "regular";
        } else if (miniScore < 90) {
            manualResult.miniResultado = "bueno";
        } else {
            manualResult.miniResultado = "excelente";
        }
    }

    // Si el minijuego modificó el resultado, sincronizamos el estado del video
    // y el dinero acumulado para que no queden cifras distintas entre pantallas.
    if (Number.isFinite(miniScore) && miniScore < 35) {
        const p = gameState.player;
        // procesarPublicacionVideo ya había aplicado el resultado original.
        // Revertimos la parte perdida y aplicamos la penalización final.
        const original = gameState.lastVideoResult;
        if (original) {
            const vistasOriginales = Number(original.vistas) || 0;
            const subsOriginales = Number(original.suscriptores) || 0;
            const dineroOriginal = Number(original.dinero) || 0;
            const vistasFinales = manualResult.vistas;
            const subsFinales = manualResult.suscriptores;
            const dineroFinal = manualResult.dinero;
            p.vistasTotales += vistasFinales - vistasOriginales;
            p.suscriptores += subsFinales - subsOriginales;
            p.dinero += dineroFinal - dineroOriginal;
            p.ingresosTrimestre += dineroFinal - dineroOriginal;
            p.ingresosGenerados = (Number(p.ingresosGenerados) || 0) + (dineroFinal - dineroOriginal);
            p.vistasTotales = Math.max(0, p.vistasTotales);
            p.suscriptores = Math.max(0, p.suscriptores);
            p.dinero = Math.max(0, p.dinero);
            p.ingresosTrimestre = Math.max(0, p.ingresosTrimestre);
            p.ingresosGenerados = Math.max(0, p.ingresosGenerados);
            gameState.lastVideoResult = manualResult;
            p.ultimoVideoResultado = {
                ...(p.ultimoVideoResultado || {}),
                vistasGanadas: manualResult.vistas,
                subsGanados: manualResult.suscriptores,
                dineroGanado: manualResult.dinero
            };
        }
    }

    if (contexto.sponsorMention) {
        const accepted = (gameState.sponsors || []).filter(s => s.estado === "aceptado");
        const fatigue = Number(gameState.player.mencionesSponsorTrimestre || 0);
        if (accepted.length && fatigue < 2) {
            const sponsor = accepted[accepted.length - 1];
            const pago = Math.max(50, Math.round(Number(sponsor.pago || 100) * 0.12));
            manualResult.dinero += pago;
            manualResult.sponsorMention = sponsor.name;
            gameState.player.mencionesSponsorTrimestre = fatigue + 1;
            if (gameState.player.mencionesSponsorTrimestre > 2) gameState.player.comunidad = Math.max(0, Number(gameState.player.comunidad||50)-3);
        }
    }

    const constancia = Number(gameState.player.atributos?.constancia) || 0;
    const efectoConstancia = gameState.player.pretemporada?.efecto === "constancia" ? 0.18 : 0;
    const power = Math.max(0.55, 1.05 - (constancia / 100) * 0.30 - efectoConstancia);
    const totalVideos = Math.min(150, 30 + Math.floor(Math.pow(Math.random(), power) * 121));
    const videosDelResto = Math.max(0, totalVideos - 1);

    let simVistas = 0;
    let simSubs = 0;
    let simDinero = 0;
    let simFama = 0;
    let simVirales = 0;
    let mejorSimulado = 0;

    for (let i = 0; i < videosDelResto; i++) {
        const resultado = simularVideoSecundario();
        simVistas += resultado.vistas;
        simSubs += resultado.suscriptores;
        simDinero += resultado.dinero;
        simFama += resultado.viral ? 1 : 0;
        mejorSimulado = Math.max(mejorSimulado, resultado.vistas);
        if (resultado.viral) simVirales++;
    }

    // Los subs se calculan por video, pero se acumulan sin redondear a cero.
    // Esto garantiza que 78 videos nunca puedan terminar dando 0 o 24 subs.
    const simSubsEnteros = Math.max(0, Math.round(simSubs));
    const simDineroEntero = Math.max(0, Math.round(simDinero));

    // 10 de cada ~1000 carreras tienen una temporada de suerte extraordinaria.
    // No se fuerza por cantidad de videos: es una anomalía del algoritmo.
    if (Number(gameState.time.año) === 2026 && !gameState.player.suertePrimeraTemporada && Math.random() < 0.005) {
        const jackpotSubs = random(100000, 500000);
        const jackpotViews = Math.round(jackpotSubs * randomFloat(7, 16));
        const jackpotMoney = Math.round(jackpotViews / 1000 * randomFloat(1.4, 3.2));
        gameState.player.suertePrimeraTemporada = true;
        gameState.player.suertePrimeraTemporadaResultado = { subs: jackpotSubs, vistas: jackpotViews, dinero: jackpotMoney };
        simSubs += jackpotSubs;
        simVistas += jackpotViews;
        simDinero += jackpotMoney;
        simFama += random(8, 20);
    }
    // IMPORTANTE: los videos secundarios son publicaciones reales del canal.
    // Antes se normalizaban para que el video destacado representara 22%-38%
    // del trimestre. Eso hacía que 100+ videos pudieran terminar con apenas
    // 30k-40k vistas aunque el canal tuviera miles de suscriptores.
    //
    // Ahora cada publicación conserva su rendimiento independiente y el total
    // escala naturalmente con la audiencia del canal, sus atributos y el
    // descubrimiento. El video destacado sigue siendo especial por su propio
    // resultado, no porque comprima artificialmente al resto.
    const simSubsFinal = Math.max(0, Math.round(simSubs));
    const simDineroFinal = Math.max(0, Math.round(simDinero));
    const simFamaEntera = Math.min(3, simFama);

    const p = gameState.player;
    p.vistasTotales += simVistas;
    p.suscriptores += simSubsFinal;
    actualizarFamaPorSubs(p);
    p.dinero += simDineroFinal;
    p.ingresosTrimestre += simDineroFinal;
    p.ingresosGenerados = (Number(p.ingresosGenerados) || 0) + simDineroFinal;
    p.ingresosDesglose ||= { publicidad:0, sponsors:0, negocios:0, afiliados:0, donaciones:0 };
    p.ingresosDesglose.publicidad = (Number(p.ingresosDesglose.publicidad)||0) + simDineroFinal;
    // Donaciones ocasionales: más probables con comunidad alta y en videos destacados.
    const donaciones = Math.random() < (0.05 + Number(p.comunidad||0)/2000) ? Math.round((Number(p.comunidad||0)/100) * randomFloat(5,80)) : 0;
    if (donaciones > 0) { p.dinero += donaciones; p.ingresosTrimestre += donaciones; p.ingresosGenerados += donaciones; p.ingresosDesglose.donaciones += donaciones; }
    if (simFamaEntera > 0) agregarFamaLogro(p, simFamaEntera, "virales del trimestre");

    p.videosSubidos += videosDelResto;
    if (!p.stats) p.stats = {};
    p.stats.videosPublicados =
        (Number(p.stats.videosPublicados) || 0) + videosDelResto;
    p.stats.mejorVideo = Math.max(
        Number(p.stats.mejorVideo) || 0,
        mejorSimulado
    );
    p.stats.videosVirales =
        (Number(p.stats.videosVirales) || 0) + simVirales;

    const actividad = {
        año: gameState.time.año,
        trimestre: gameState.time.trimestre,
        videos: totalVideos,
        vistas: Math.floor(manualResult.vistas + simVistas),
        suscriptores: manualResult.suscriptores + simSubsFinal,
        dinero: Math.round(manualResult.dinero + simDineroFinal),
        fama: manualResult.famaGanada + simFamaEntera,
        virales: (manualResult.viral ? 1 : 0) + simVirales,
        mejorVideo: Math.max(manualResult.vistas, mejorSimulado)
    };

    p.actividadTrimestre = actividad;

    if (p.boosts?.viewBoostTurns > 0) {
        p.boosts.viewBoostTurns -= 1;
        if (p.boosts.viewBoostTurns <= 0) {
            p.boosts.viewBoostTurns = 0;
            p.boosts.viewMultiplier = 1;
        }
    }

    if (gameState.time.trimestre === 1) p.historialTrimestre1 = actividad;
    else p.historialTrimestre2 = actividad;

    const quarterResult = {
        manualVideo: manualResult,
        totalVideos,
        totalVistas: actividad.vistas,
        totalSubs: actividad.suscriptores,
        totalDinero: actividad.dinero,
        totalFama: actividad.fama,
        simulatedVideos: videosDelResto,
        simVistas: Math.floor(simVistas),
        simSubs: simSubsFinal,
        simDinero: simDineroFinal,
        simFama: simFamaEntera,
        virales: actividad.virales
    };

    gameState.lastQuarterResult = quarterResult;

    // El mundo avanza al mismo tiempo que el jugador. Los demás creadores
    // publican, ganan seguidores y generan noticias aunque el jugador no los vea.
    simulateWorld(gameState);

    // Generar oportunidades automáticamente: eventos, sponsors y colaboraciones
    // aparecen solos durante el juego cuando se dan las condiciones.
    gameState.generarEventoPendiente();
    gameState.generarOfertaSponsor();
    gameState.generarCollabOfertaAleatoria();

    gameState.guardar();
    return quarterResult;
}

export default {
    generarVideos,
    procesarPublicacionVideo,
    procesarPublicacionTrimestre
};
