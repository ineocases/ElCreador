// screens/pretemporada.js
import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";

const bancoCartas = [
    { titulo:"CURSO RÁPIDO DE PREMIERE", tipo:"RARA", attr:"edicion", pts:4, desc:"Aprendés a cortar silencios y meter memes como un pro.", color:"var(--accent-yellow)" },
    { titulo:"SETUP NUEVO EN CUOTAS", tipo:"COMÚN", attr:"algoritmo", pts:3, desc:"Mejorás la calidad de imagen y optimizás tu forma de publicar.", color:"var(--accent-green)" },
    { titulo:"CURSO DE TEATRO E IMPRO", tipo:"RARA", attr:"carisma", pts:4, desc:"Aprendés a soltarte más frente a la cámara.", color:"var(--accent-yellow)" },
    { titulo:"ESTRATEGIA DE CONTENIDO EN TIKTOK", tipo:"COMÚN", attr:"marketing", pts:3, desc:"Subís clips resumidos para atraer tráfico nuevo.", color:"var(--accent-green)" },
    { titulo:"DISCIPLINA DE STREAMER", tipo:"ÉPICA", attr:"constancia", pts:5, desc:"Horarios fijos y rutina estricta de grabación.", color:"var(--accent-red)" },
    { titulo:"TALLER DE HUMOR", tipo:"RARA", attr:"humor", pts:4, desc:"Aprendés a meter chistes sin matar el ritmo.", color:"var(--accent-yellow)" },
    { titulo:"CURSO DE IDEAS VIRALES", tipo:"ÉPICA", attr:"creatividad", pts:5, desc:"Entrenás el músculo de las ideas originales.", color:"var(--accent-red)" },
    { titulo:"NETWORKING EN EVENTOS", tipo:"COMÚN", attr:"networking", pts:3, desc:"Aprendés a hacer contactos en la industria.", color:"var(--accent-green)" }
];

const nombres = {
    edicion:"EDICIÓN", carisma:"CARISMA", algoritmo:"ALGORITMO", marketing:"MARKETING",
    constancia:"CONSTANCIA", humor:"HUMOR", creatividad:"CREATIVIDAD", networking:"NETWORKING"
};

export function renderPretemporada(el) {
    const container = el || document.getElementById("pretemporadaScreen");
    if (!container) return;

    const año = gameState.time.año;

    if (gameState.player.pretemporada?.año === año) {
        window.location.hash = "#dashboard";
        return container;
    }

    const opciones = [...bancoCartas].sort(() => Math.random() - 0.5).slice(0, 3);

    container.innerHTML = `
        <div style="max-width:1000px;margin:0 auto;padding:20px;">
            ${renderHeaderHud()}
            <div style="margin:25px 0 20px;">
                <div style="color:var(--accent-red);font-size:.8rem;font-weight:bold;">⚡ PRETEMPORADA · AÑO ${año}</div>
                <h1 style="font-family:var(--font-heading);margin:8px 0;font-size:2.3rem;">Prepará tu carrera</h1>
                <p style="color:var(--text-muted);line-height:1.6;max-width:700px;">Elegí una mejora antes de arrancar el año. Después vas a tener 2 trimestres y 1 video por trimestre.</p>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;">
                ${opciones.map((carta,index)=>`
                    <div class="preseason-card" style="background:var(--bg-card);border:var(--border-card);border-top:4px solid ${carta.color};border-radius:16px;padding:22px;min-height:310px;display:flex;flex-direction:column;justify-content:space-between;">
                        <div>
                            <span style="display:inline-block;background:${carta.color};color:#000;padding:4px 9px;border-radius:5px;font-size:.7rem;font-weight:bold;">${carta.tipo}</span>
                            <h2 style="font-size:1.15rem;margin:18px 0 10px;">${carta.titulo}</h2>
                            <p style="color:var(--text-muted);font-size:.85rem;line-height:1.5;">${carta.desc}</p>
                        </div>
                        <div>
                            <div style="text-align:center;color:var(--accent-green);font-weight:bold;margin:20px 0;">+${carta.pts} ${nombres[carta.attr]}</div>
                            <button class="select-card-button" data-index="${index}" style="width:100%;padding:13px;border:none;border-radius:9px;background:var(--accent-red);color:#fff;font-weight:bold;">ELEGIR MEJORA</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    container.querySelectorAll(".select-card-button").forEach(button => {
        button.addEventListener("click", () => {
            const carta = opciones[Number(button.dataset.index)];
            if (!carta) return;

            container.querySelectorAll(".select-card-button").forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = ".5";
            });

            gameState.mejorarAtributo(carta.attr, carta.pts);
            gameState.player.pretemporada = {
                año,
                entrenamiento:carta.titulo,
                atributo:carta.attr,
                puntos:carta.pts
            };

            gameState.agregarNotificacion({
                tipo:"pretemporada",
                titulo:"⚡ Pretemporada completada",
                descripcion:`Elegiste "${carta.titulo}" y ganaste +${carta.pts} ${nombres[carta.attr]}.`
            });

            gameState.guardar();

            container.innerHTML = `
                <div style="min-height:80vh;display:flex;align-items:center;justify-content:center;padding:20px;">
                    <div style="max-width:500px;width:100%;background:var(--bg-card);border:var(--border-card);border-radius:18px;padding:35px;text-align:center;">
                        <div style="font-size:3rem;">⚡</div>
                        <h2>¡Pretemporada lista!</h2>
                        <p style="color:var(--text-muted);">${carta.titulo}</p>
                        <strong style="color:var(--accent-green);">+${carta.pts} ${nombres[carta.attr]}</strong>
                        <p style="color:var(--text-muted);margin-top:20px;">Preparando el Trimestre 1...</p>
                    </div>
                </div>
            `;

            setTimeout(() => { window.location.hash = "#dashboard"; }, 700);
        });
    });

    return container;
}

export const pretemporadaScreen = { render: renderPretemporada };
export default pretemporadaScreen;
