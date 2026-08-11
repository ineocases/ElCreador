// screens/pretemporada.js
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";

const bancoCartas = [
    { titulo:"CURSO RÁPIDO DE PREMIERE", tipo:"RARA", attr:"edicion", pts:4, efecto:"edicion", efectoTexto:"+8% vistas por calidad de producción", desc:"Aprendés a cortar silencios, mejorar ritmo y hacer que cada segundo cuente.", color:"var(--accent-yellow)" },
    { titulo:"SETUP NUEVO EN CUOTAS", tipo:"COMÚN", attr:"algoritmo", pts:3, efecto:"algoritmo", efectoTexto:"+6% alcance base", desc:"Mejorás la calidad de imagen y optimizás tu forma de publicar.", color:"var(--accent-green)" },
    { titulo:"CURSO DE TEATRO E IMPRO", tipo:"RARA", attr:"carisma", pts:4, efecto:"carisma", efectoTexto:"+12% conversión a suscriptores", desc:"Aprendés a soltarte y conectar mejor con la cámara.", color:"var(--accent-yellow)" },
    { titulo:"ESTRATEGIA DE CONTENIDO", tipo:"COMÚN", attr:"marketing", pts:3, efecto:"marketing", efectoTexto:"+12% ingresos y +5% vistas", desc:"Aprendés a pensar títulos, clips y distribución para atraer audiencia.", color:"var(--accent-green)" },
    { titulo:"DISCIPLINA DE STREAMER", tipo:"ÉPICA", attr:"constancia", pts:5, efecto:"constancia", efectoTexto:"Más probabilidad de quedar cerca de 150 videos", desc:"Horarios fijos y rutina estricta para sostener tu canal durante el año.", color:"var(--accent-red)" },
    { titulo:"CURSO DE IDEAS VIRALES", tipo:"ÉPICA", attr:"creatividad", pts:5, efecto:"creatividad", efectoTexto:"+35% probabilidad de viral", desc:"Entrenás el músculo de encontrar conceptos que hagan parar el scroll.", color:"var(--accent-red)" },
    { titulo:"NETWORKING EN EVENTOS", tipo:"COMÚN", attr:"networking", pts:3, efecto:"networking", efectoTexto:"Más chances de que te descubran otros creadores", desc:"Aprendés a hacer contactos y abrir puertas con otros creadores.", color:"var(--accent-green)" }
];

const nombres = { edicion:"EDICIÓN", carisma:"CARISMA", algoritmo:"ALGORITMO", marketing:"MARKETING", constancia:"CONSTANCIA", humor:"HUMOR", creatividad:"CREATIVIDAD", networking:"NETWORKING" };

export function renderPretemporada(el) {
    const container = el || document.getElementById("pretemporadaScreen");
    if (!container) return;
    const año = gameState.time.año;
    if (gameState.player.pretemporada?.año === año) {
        window.location.hash = "#dashboard";
        return container;
    }

    const opciones = [...bancoCartas].sort(() => Math.random() - .5).slice(0, 3);
    container.innerHTML = `
        <div class="page-shell">
            ${renderHeaderHud()}
            <div class="year-cover"><div class="eyebrow">⚡ PRETEMPORADA · ${año}</div><h1>Prepará tu carrera.</h1><p>Antes de jugar el año, elegí una sola ventaja. Después vas a tener 2 trimestres y una decisión de video importante en cada uno.</p></div>
            <div class="cards-grid">
                ${opciones.map((carta,index)=>`<div class="preseason-card panel" style="border-top:3px solid ${carta.color};margin:0;min-height:330px;display:flex;flex-direction:column;justify-content:space-between;"><div><span class="card-type" style="background:${carta.color};color:#000;padding:4px 8px;border-radius:5px;font-size:.68rem;font-weight:900;display:inline-block;">${carta.tipo}</span><h2>${carta.titulo}</h2><p class="muted">${carta.desc}</p></div><div><div class="card-bonus" style="text-align:center;color:var(--accent-green);font-weight:900;margin:12px 0 6px;">+${carta.pts} ${nombres[carta.attr]}</div><div style="font-size:.78rem;color:var(--text-muted);text-align:center;min-height:34px;">${carta.efectoTexto}</div><button class="btn primary select-card-button" data-index="${index}" style="width:100%;">ELEGIR MEJORA</button></div></div>`).join("")}
            </div>
        </div>`;

    container.querySelectorAll(".select-card-button").forEach(button => button.addEventListener("click", () => {
        const carta = opciones[Number(button.dataset.index)];
        if (!carta) return;
        container.querySelectorAll(".select-card-button").forEach(btn => { btn.disabled = true; btn.style.opacity = ".5"; });
        gameState.mejorarAtributo(carta.attr, carta.pts);
        gameState.player.pretemporada = { año, entrenamiento:carta.titulo, atributo:carta.attr, puntos:carta.pts, efecto:carta.efecto };
        gameState.guardar();
        // La pretemporada no agrega una pantalla intermedia: volvemos directo al menú.
        window.location.hash = "#dashboard";
    }));
    return container;
}

export const pretemporadaScreen = { render: renderPretemporada };
export default pretemporadaScreen;
