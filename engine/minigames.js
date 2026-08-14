import { icon } from "../components/Icon.js";
// Motores reutilizables de minijuegos para El Creador.
// Se rotan en orden: Timing -> Elección rápida -> Simon -> Whack-a-mole.

const ICONOS = ["bolt", "gamepad", "soccer", "videocam", "group", "trophy"];

// Limpieza centralizada para que ningún timer/overlay quede vivo si el jugador
// termina, cambia de pantalla o el failsafe entra en acción.
let activeCleanup = null;

function cleanupActiveMinigame() {
    try { activeCleanup?.(); } catch (error) { console.warn("No se pudo limpiar el minijuego:", error); }
    activeCleanup = null;
    document.getElementById("minigameOverlay")?.remove();
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function overlayBase(title, subtitle) {
    const old = document.getElementById("minigameOverlay");
    if (old) old.remove();
    const el = document.createElement("div");
    el.id = "minigameOverlay";
    el.className = "minigame-overlay";
    el.innerHTML = `
      <div class="minigame-modal">
        <div class="minigame-eyebrow">MINIJUEGO</div>
        <h2>${title}</h2>
        <p class="minigame-subtitle">${subtitle}</p>
        <div id="minigameBody"></div>
      </div>`;
    document.body.appendChild(el);
    return el;
}

function finish(overlay, score) {
    const final = clamp(Math.round(score), 0, 100);
    try { activeCleanup?.(); } catch (error) { console.warn("Cleanup del minijuego:", error); }
    activeCleanup = null;
    if (overlay && overlay.isConnected) overlay.remove();
    return final;
}

function minigameInfo(type) {
    const infos = [
        {
            title: "Timing de publicación",
            desc: "Esperá el momento justo y tocá COMENZAR. Después hacé clic cuando el marcador entre en la zona verde.",
            goal: "Cuanto más preciso seas, mejor rinden las vistas y los subs."
        },
        {
            title: "Elección rápida",
            desc: "Vas a tener 3 opciones y pocos segundos. Tocá COMENZAR cuando estés listo y elegí la que mejor encaje con tu contenido.",
            goal: "Una buena decisión mejora el rendimiento; quedarte sin tiempo te perjudica."
        },
        {
            title: "Memoria",
            desc: "Primero vas a ver una secuencia de iconos. Tocá COMENZAR, memorizala y repetila exactamente en el mismo orden.",
            goal: "Si completás toda la secuencia, conseguís el mejor resultado."
        },
        {
            title: "Whack-a-mole",
            desc: "Los objetivos van a aparecer por la pantalla. Tocá COMENZAR y atrapá tantos como puedas antes de que desaparezcan.",
            goal: "Necesitás 10 aciertos para conseguir el resultado perfecto."
        }
    ];
    return infos[((Number(type) || 0) % infos.length + infos.length) % infos.length];
}

function showMinigameIntro(type) {
    const info = minigameInfo(type);
    return new Promise(resolve => {
        cleanupActiveMinigame();
        const old = document.getElementById("minigameIntroOverlay");
        old?.remove();
        const el = document.createElement("div");
        el.id = "minigameIntroOverlay";
        el.className = "minigame-overlay minigame-intro-overlay";
        el.innerHTML = `
          <div class="minigame-modal minigame-intro-modal">
            <div class="minigame-eyebrow">ANTES DE EMPEZAR</div>
            <div class="minigame-intro-icon">${icon(type === 0 ? "bolt" : type === 1 ? "refresh" : type === 2 ? "group" : "target", 30)}</div>
            <h2>${info.title}</h2>
            <p class="minigame-subtitle">${info.desc}</p>
            <div class="minigame-goal"><span>${icon("check",14)}</span><b>${info.goal}</b></div>
            <button id="startMinigame" class="btn primary minigame-start-btn">${icon("play",16)} COMENZAR</button>
          </div>`;
        document.body.appendChild(el);
        const start = el.querySelector("#startMinigame");
        start?.addEventListener("click", () => {
            start.disabled = true;
            el.classList.add("closing");
            setTimeout(() => {
                el.remove();
                resolve();
            }, 140);
        });
    });
}

export async function runMinigame(type) {
    const normalizedType = ((Number(type) || 0) % 4 + 4) % 4;
    const runners = [runTiming, runQuickChoice, runSimon, runWhack];
    const runner = runners[normalizedType] || runTiming;

    // El jugador tiene tiempo para leer la explicación. El cronómetro del
    // minijuego recién empieza después de tocar COMENZAR.
    await showMinigameIntro(normalizedType);
    cleanupActiveMinigame();

    let timeoutId;
    let timedOut = false;

    const gamePromise = Promise.resolve()
        .then(() => runner())
        .catch(error => {
            console.error("Error en minijuego:", error);
            cleanupActiveMinigame();
            return 0;
        });

    const timeoutPromise = new Promise(resolve => {
        timeoutId = setTimeout(() => {
            timedOut = true;
            cleanupActiveMinigame();
            resolve(0);
        }, 15000);
    });

    return Promise.race([gamePromise, timeoutPromise])
        .finally(() => clearTimeout(timeoutId))
        .then(score => {
            if (timedOut) return score;
            return mostrarResultadoMinijuego(score).then(() => score);
        });
}

function mostrarResultadoMinijuego(score) {
    return new Promise(resolve => {
        const old = document.getElementById("minigameResultOverlay");
        if (old) old.remove();
        
        const el = document.createElement("div");
        el.id = "minigameResultOverlay";
        el.className = "minigame-overlay";
        
        let icono, texto, clase;
        if (score >= 90) {
            icono = icon("bolt", 28);
            texto = "¡EXCELENTE!";
            clase = "excelente";
        } else if (score >= 65) {
            icono = icon("check", 28);
            texto = "¡BIEN HECHO!";
            clase = "bueno";
        } else if (score >= 35) {
            icono = icon("refresh", 28);
            texto = "REGULAR";
            clase = "regular";
        } else {
            icono = icon("close", 28);
            texto = "MAL";
            clase = "fallo";
        }
        
        el.innerHTML = `
          <div class="minigame-modal">
            <div class="minigame-eyebrow">RESULTADO DEL MINIJUEGO</div>
            <h2>${icono} ${texto}</h2>
            <p class="minigame-subtitle">Puntaje: ${score}/100</p>
            <div style="font-size: 3rem; margin: 20px 0;">${score}%</div>
          </div>`;
        document.body.appendChild(el);
        
        setTimeout(() => {
            if (el && el.isConnected) el.remove();
            resolve();
        }, 2000);
    });
}

function runTiming() {
    return new Promise(resolve => {
        const overlay = overlayBase("Elegí el momento", "Hacé clic cuando el marcador entre en la zona verde.");
        const body = overlay.querySelector("#minigameBody");
        body.innerHTML = `
          <div class="timing-track"><div class="timing-zone"></div><div id="timingCursor"></div></div>
          <button id="timingHit" class="btn primary minigame-action">¡PUBLICAR!</button>
          <p id="timingHint" class="minigame-hint">Tenés una sola oportunidad.</p>`;
        const cursor = body.querySelector("#timingCursor");
        const hit = body.querySelector("#timingHit");
        let rafId = null;
        activeCleanup = () => { done = true; if (rafId) cancelAnimationFrame(rafId); };
        let pos = 0, dir = 1, done = false, last = performance.now();
        const zoneStart = 42, zoneEnd = 58;
        function tick(now) {
            if (done) return;
            const dt = Math.min(32, now - last); last = now;
            pos += dir * dt * 0.075;
            if (pos >= 100) { pos = 100; dir = -1; }
            if (pos <= 0) { pos = 0; dir = 1; }
            cursor.style.left = `${pos}%`;
            rafId = requestAnimationFrame(tick);
        }
        rafId = requestAnimationFrame(tick);
        hit.onclick = () => {
            if (done) return;
            done = true;
            const distance = pos < zoneStart ? zoneStart - pos : pos > zoneEnd ? pos - zoneEnd : 0;
            const score = distance === 0 ? 100 : clamp(100 - distance * 5, 15, 95);
            resolve(finish(overlay, score));
        };
    });
}

function runQuickChoice() {
    return new Promise(resolve => {
        const overlay = overlayBase("Elegí rápido", "Tu primera decisión importa. Tenés 4 segundos.");
        const body = overlay.querySelector("#minigameBody");
        const options = shuffle([
            { t: "🔥 Hook fuerte", s: 95 },
            { t: "🎯 Título equilibrado", s: 78 },
            { t: "💬 Más contexto", s: 58 }
        ]);
        body.innerHTML = `<div id="quickTimer" class="quick-timer">4.0</div><div class="quick-options">${options.map((o,i)=>`<button class="quick-option" data-score="${o.s}">${o.t}</button>`).join("")}</div>`;
        let left = 4, done = false;
        const timer = setInterval(() => {
            left -= 0.1;
            body.querySelector("#quickTimer").textContent = Math.max(0, left).toFixed(1);
            if (left <= 0) {
                clearInterval(timer);
                if (!done) { done = true; resolve(finish(overlay, 25)); }
            }
        }, 100);
        activeCleanup = () => { done = true; clearInterval(timer); };
        body.querySelectorAll(".quick-option").forEach(btn => btn.onclick = () => {
            if (done) return;
            done = true; clearInterval(timer);
            const base = Number(btn.dataset.score) || 50;
            resolve(finish(overlay, base + left * 2));
        });
    });
}

function runSimon() {
    return new Promise(resolve => {
        const overlay = overlayBase("Memorizá la secuencia", "Mirá los iconos y repetilos en el mismo orden.");
        const body = overlay.querySelector("#minigameBody");
        const length = 3 + Math.floor(Math.random() * 3);
        const sequence = Array.from({length}, () => Math.floor(Math.random() * ICONOS.length));
        body.innerHTML = `<div id="simonBoard" class="simon-board">${ICONOS.map((x,i)=>`<button class="simon-key" data-i="${i}">${icon(x,24)}</button>`).join("")}</div><p id="simonStatus" class="minigame-hint">Preparando...</p>`;
        const keys = [...body.querySelectorAll(".simon-key")];
        let input = 0, active = false;
        let delay = 450;
        const timers = [];
        activeCleanup = () => { active = false; timers.forEach(clearTimeout); };
        sequence.forEach((idx, n) => timers.push(setTimeout(() => {
            keys[idx].classList.add("simon-lit");
            setTimeout(() => keys[idx].classList.remove("simon-lit"), delay * 0.7);
            if (n === sequence.length - 1) setTimeout(() => { active = true; body.querySelector("#simonStatus").textContent = "¡Ahora!"; }, delay);
        }, n * delay)));
        keys.forEach(key => key.onclick = () => {
            if (!active) return;
            const chosen = Number(key.dataset.i);
            if (chosen !== sequence[input]) {
                active = false;
                resolve(finish(overlay, Math.max(20, Math.round(input / sequence.length * 80))));
                return;
            }
            input++;
            if (input === sequence.length) {
                active = false;
                resolve(finish(overlay, 100));
            }
        });
    });
}

function runWhack() {
    return new Promise(resolve => {
        const overlay = overlayBase("¡No lo dejes escapar!", "Hacé clic en los objetivos antes de que desaparezcan.");
        const body = overlay.querySelector("#minigameBody");
        body.innerHTML = `<div id="whackBoard" class="whack-board"></div><p id="whackScore" class="minigame-hint">0 / 10</p>`;
        const board = body.querySelector("#whackBoard");
        let hits = 0, spawned = 0, finished = false;
        const spawnedTimeouts = [];
        const interval = setInterval(() => {
            if (finished) return;
            const target = document.createElement("button");
            target.className = "whack-target";
            target.innerHTML = icon(ICONOS[Math.floor(Math.random()*ICONOS.length)], 22);
            target.style.left = `${8 + Math.random()*78}%`;
            target.style.top = `${8 + Math.random()*68}%`;
            board.appendChild(target);
            spawned++;
            target.onclick = () => {
                if (finished) return;
                hits++;
                target.remove();
                body.querySelector("#whackScore").textContent = `${hits} / 10`;
                if (hits >= 10) {
                    finished = true; clearInterval(interval);
                    resolve(finish(overlay, 100));
                }
            };
            spawnedTimeouts.push(setTimeout(() => target.remove(), 750));
            if (spawned >= 14 && hits < 10) {
                finished = true; clearInterval(interval);
                resolve(finish(overlay, hits * 10));
            }
        }, 380);
        activeCleanup = () => {
            finished = true;
            clearInterval(interval);
            spawnedTimeouts.forEach(clearTimeout);
        };
    });
}
