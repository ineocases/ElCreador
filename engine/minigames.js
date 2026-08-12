// Motores reutilizables de minijuegos para El Creador.
// Se rotan en orden: Timing -> Elección rápida -> Simon -> Whack-a-mole.

const ICONOS = ["🔥", "🎮", "⚽", "🎤", "😂", "💎"];

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
    if (overlay && overlay.isConnected) overlay.remove();
    return final;
}

export function runMinigame(type) {
    const runners = [runTiming, runQuickChoice, runSimon, runWhack];
    const runner = runners[((Number(type) || 0) % runners.length + runners.length) % runners.length] || runTiming;

    // Failsafe: ningún minijuego puede dejar la publicación bloqueada para siempre.
    return Promise.race([
        Promise.resolve().then(() => runner()),
        new Promise(resolve => setTimeout(() => resolve(0), 15000))
    ]).catch(error => {
        console.error("Error en minijuego:", error);
        return 0;
    }).then(score => {
        // Mostrar resultado del minijuego por 2 segundos antes de continuar
        return new Promise(resolve => {
            mostrarResultadoMinijuego(score).then(() => {
                resolve(score);
            });
        });
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
            icono = "🔥";
            texto = "¡EXCELENTE!";
            clase = "excelente";
        } else if (score >= 65) {
            icono = "✅";
            texto = "¡BIEN HECHO!";
            clase = "bueno";
        } else if (score >= 35) {
            icono = "😐";
            texto = "REGULAR";
            clase = "regular";
        } else {
            icono = "❌";
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
        let pos = 0, dir = 1, done = false, last = performance.now();
        const zoneStart = 42, zoneEnd = 58;
        function tick(now) {
            if (done) return;
            const dt = Math.min(32, now - last); last = now;
            pos += dir * dt * 0.075;
            if (pos >= 100) { pos = 100; dir = -1; }
            if (pos <= 0) { pos = 0; dir = 1; }
            cursor.style.left = `${pos}%`;
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
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
        body.innerHTML = `<div id="simonBoard" class="simon-board">${ICONOS.map((x,i)=>`<button class="simon-key" data-i="${i}">${x}</button>`).join("")}</div><p id="simonStatus" class="minigame-hint">Preparando...</p>`;
        const keys = [...body.querySelectorAll(".simon-key")];
        let input = 0, active = false;
        let delay = 450;
        sequence.forEach((idx, n) => setTimeout(() => {
            keys[idx].classList.add("simon-lit");
            setTimeout(() => keys[idx].classList.remove("simon-lit"), delay * 0.7);
            if (n === sequence.length - 1) setTimeout(() => { active = true; body.querySelector("#simonStatus").textContent = "¡Ahora!"; }, delay);
        }, n * delay));
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
        const interval = setInterval(() => {
            if (finished) return;
            const target = document.createElement("button");
            target.className = "whack-target";
            target.textContent = ICONOS[Math.floor(Math.random()*ICONOS.length)];
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
            setTimeout(() => target.remove(), 750);
            if (spawned >= 14 && hits < 10) {
                finished = true; clearInterval(interval);
                resolve(finish(overlay, hits * 10));
            }
        }, 380);
    });
}
