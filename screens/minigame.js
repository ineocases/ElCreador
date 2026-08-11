import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import { applyBottleFlipResult } from "../engine/advancedSystems.js";
import { icon } from "../components/Icon.js";

export function renderMinigame(el) {
    const container = el || document.getElementById("minigameScreen");
    if (!container) return;

    const canvasWidth = 640;
    const canvasHeight = 360;

    container.innerHTML = `
        <div class="page-shell">
            ${renderHeaderHud()}
            <div class="panel center">
                <div class="eyebrow">MINIJUEGO · BOTTLE FLIP</div>
                <h1 class="page-title">${icon("bolt", 25)} Clavá el bottle flip</h1>
                <p class="page-subtitle" style="margin-inline:auto">
                    Tocá <b>LANZAR</b> para hacer volar la botella. Tiene que caer de pie dentro de la zona verde.
                    Tenés 3 intentos.
                </p>

                <div class="bottle-wrap">
                    <canvas id="bottleCanvas" class="bottle-canvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
                    <div class="bottle-hud">
                        <span>Intentos: <b id="attempts">0/3</b></span>
                        <span>Mejor: <b id="best">0</b></span>
                    </div>
                    <div class="bottle-meter"><i id="meter"></i></div>
                    <p id="bottleStatus" class="bottle-status">Preparado. Buscá un buen ángulo.</p>
                </div>

                <div class="bottle-controls">
                    <button id="launchBottle" class="btn primary big icon-btn">${icon("play", 19)} LANZAR</button>
                    <button id="resetBottle" class="btn ghost icon-btn">${icon("refresh", 18)} REINICIAR</button>
                </div>
            </div>
        </div>
    `;

    const canvas = container.querySelector("#bottleCanvas");
    const ctx = canvas.getContext("2d");
    const launchBtn = container.querySelector("#launchBottle");
    const resetBtn = container.querySelector("#resetBottle");
    const attemptsEl = container.querySelector("#attempts");
    const bestEl = container.querySelector("#best");
    const meter = container.querySelector("#meter");
    const status = container.querySelector("#bottleStatus");

    let attempt = 0;
    let best = 0;
    let running = false;
    let resultLocked = false;
    let raf = 0;
    let bottle = null;

    const floorY = 306;
    const greenLeft = 252;
    const greenRight = 388;

    function resetRound() {
        bottle = { x: 320, y: floorY - 52, vx: 0, vy: 0, angle: 0, omega: 0, landed: false };
        draw();
    }

    function drawBottle() {
        ctx.save();
        ctx.translate(bottle.x, bottle.y);
        ctx.rotate(bottle.angle);

        // sombra
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.fillRect(-18, 28, 36, 7);

        // cuerpo
        ctx.fillStyle = "#d9f3ff";
        ctx.strokeStyle = "rgba(255,255,255,.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-16, -28, 32, 56, 8);
        ctx.fill();
        ctx.stroke();

        // agua
        ctx.fillStyle = "#48a7d8";
        ctx.beginPath();
        ctx.roundRect(-14, 2, 28, 24, 6);
        ctx.fill();

        // tapa
        ctx.fillStyle = "#e50914";
        ctx.fillRect(-8, -35, 16, 8);
        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, "#121923");
        bg.addColorStop(1, "#0b0f14");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // zona verde de aterrizaje
        ctx.fillStyle = "rgba(57,211,83,.18)";
        ctx.fillRect(greenLeft, floorY - 4, greenRight - greenLeft, 4);
        ctx.strokeStyle = "rgba(57,211,83,.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(greenLeft, floorY - 5, greenRight - greenLeft, 7);
        ctx.fillStyle = "rgba(255,255,255,.42)";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("ZONA PERFECTA", 320, floorY + 24);

        // piso
        ctx.fillStyle = "#1b222c";
        ctx.fillRect(30, floorY + 8, canvas.width - 60, 5);

        drawBottle();
    }

    function endAttempt(success, score) {
        running = false;
        attempt += 1;
        best = Math.max(best, score);
        attemptsEl.textContent = `${attempt}/3`;
        bestEl.textContent = best;
        meter.style.width = `${best}%`;

        if (success) {
            status.innerHTML = `${icon("check", 18)} <b>¡PERFECTO!</b> La botella cayó de pie.`;
        } else {
            status.textContent = score >= 55 ? "Casi. La botella quedó torcida." : "Fallaste el flip. Probá otra vez.";
        }

        if (attempt >= 3) {
            resultLocked = true;
            launchBtn.disabled = true;
            status.textContent = `Resultado final: ${best}/100. Continuando...`;
            setTimeout(() => {
                applyBottleFlipResult(gameState, best, attempt);
                gameState.guardar();
                window.location.hash = "#pasanCosas";
            }, 900);
        } else {
            resetRound();
        }
    }

    function launch() {
        if (running || resultLocked || attempt >= 3) return;
        running = true;
        status.textContent = "¡Ahora! Esperá el aterrizaje...";

        const targetX = greenLeft + Math.random() * (greenRight - greenLeft);
        bottle.x = 320;
        bottle.y = floorY - 52;
        bottle.vx = (targetX - bottle.x) / 34;
        bottle.vy = -(8.8 + Math.random() * 1.5);
        bottle.angle = 0;
        bottle.omega = (Math.random() > .5 ? 1 : -1) * (0.17 + Math.random() * 0.05);

        const start = performance.now();
        function frame(now) {
            if (!running) return;
            const dt = Math.min(1.8, (now - start) / 16.666);
            bottle.x += bottle.vx * dt;
            bottle.y += bottle.vy * dt;
            bottle.vy += 0.34 * dt;
            bottle.angle += bottle.omega * dt;

            const ground = floorY - 28;
            if (bottle.y >= ground) {
                bottle.y = ground;
                const normalizedAngle = Math.abs(((bottle.angle + Math.PI) % (Math.PI * 2)) - Math.PI);
                const upright = Math.min(normalizedAngle, Math.abs(normalizedAngle - Math.PI * 2)) < 0.28;
                const inside = bottle.x >= greenLeft + 10 && bottle.x <= greenRight - 10;
                const centerBonus = Math.max(0, 1 - Math.abs(bottle.x - 320) / 70);
                const angleScore = Math.max(0, 1 - normalizedAngle / 0.7);
                const score = Math.round(Math.max(0, Math.min(100, (upright ? 55 : 15) + (inside ? 25 : 0) + centerBonus * 10 + angleScore * 10)));
                endAttempt(upright && inside, score);
                draw();
                return;
            }

            draw();
            raf = requestAnimationFrame(frame);
        }
        raf = requestAnimationFrame(frame);
    }

    launchBtn.addEventListener("click", launch);
    resetBtn.addEventListener("click", () => {
        cancelAnimationFrame(raf);
        attempt = 0;
        best = 0;
        running = false;
        resultLocked = false;
        launchBtn.disabled = false;
        attemptsEl.textContent = "0/3";
        bestEl.textContent = "0";
        meter.style.width = "0%";
        status.textContent = "Preparado. Buscá un buen ángulo.";
        resetRound();
    });

    resetRound();
    return container;
}

export const minigameScreen = { render: renderMinigame };
export default minigameScreen;
