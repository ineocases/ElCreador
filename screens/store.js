// screens/store.js
// REESCRITO: Sistema de tienda compatible con el router y con gameState

import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";
import items from "../data/items/items.js";

export function renderStore(el) {

    const container = el || document.getElementById("storeScreen");
    if (!container) return;

    const player = gameState.player;

    // Compatibilidad
    if (typeof player.shopTier !== "number") player.shopTier = 1;
    if (!Array.isArray(player.inventory)) player.inventory = [];

    const disponibles = items.filter(item =>
        item.tier <= player.shopTier && !player.inventory.includes(item.id)
    );

    const tierLabels = { 0: "Inicial", 1: "Básico", 2: "Pro", 3: "Élite" };

    container.innerHTML = `
        ${typeof renderHeaderHud === "function" ? renderHeaderHud() : ""}
        <div style="max-width:1000px; margin:25px auto; padding:20px; color:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <span style="color:var(--accent-red); font-size:.8rem; font-weight:bold; text-transform:uppercase;">
                        🛒 TIENDA DE EQUIPAMIENTO
                    </span>
                    <h1 style="margin:5px 0; font-family:var(--font-heading);">Mejorá tu setup</h1>
                    <p style="color:var(--text-muted);">
                        Tu nivel actual de tienda: <strong style="color:#fff;">${tierLabels[player.shopTier] || "Básico"}</strong>
                    </p>
                </div>
                <a href="#dashboard" style="color:var(--text-muted); text-decoration:none;">← Volver</a>
            </div>

            ${disponibles.length === 0 ? `
                <div style="background:var(--bg-card); padding:30px; border-radius:14px; text-align:center;">
                    <h2>🎉 ¡Ya tenés todo lo disponible!</h2>
                    <p style="color:var(--text-muted);">Subí de nivel de tienda desbloqueando más contenido.</p>
                </div>
            ` : `
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:15px;">
                    ${disponibles.map(item => `
                        <div style="
                            background:var(--bg-card);
                            border:var(--border-card);
                            border-radius:14px;
                            padding:20px;
                            display:flex;
                            flex-direction:column;
                            justify-content:space-between;
                            min-height:220px;
                        ">
                            <div>
                                <div style="font-size:2.5rem; text-align:center; margin-bottom:10px;">${item.icon}</div>
                                <h3 style="margin:0 0 5px; font-size:1.1rem;">${item.name}</h3>
                                <p style="color:var(--text-muted); font-size:.8rem; margin:0 0 10px;">
                                    Slot: <strong style="color:#fff;">${item.slot}</strong>
                                </p>
                                ${item.audio > 0 ? `<p style="margin:3px 0; font-size:.85rem;">🎙️ Audio: <strong>+${item.audio}</strong></p>` : ""}
                                ${item.editing > 0 ? `<p style="margin:3px 0; font-size:.85rem;">✂️ Edición: <strong>+${item.editing}</strong></p>` : ""}
                                ${item.quality > 0 ? `<p style="margin:3px 0; font-size:.85rem;">📺 Calidad: <strong>+${item.quality}</strong></p>` : ""}
                            </div>
                            <div>
                                <div style="text-align:center; font-size:1.3rem; font-weight:bold; color:var(--accent-green); margin:15px 0 10px;">
                                    ${item.price === 0 ? "GRATIS" : "$" + item.price.toLocaleString()}
                                </div>
                                <button class="buy-item-btn" data-item-id="${item.id}" style="
                                    width:100%;
                                    padding:12px;
                                    background:var(--accent-red);
                                    color:white;
                                    border:none;
                                    border-radius:8px;
                                    font-weight:bold;
                                    cursor:pointer;
                                ">COMPRAR</button>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `}
        </div>
    `;

    container.querySelectorAll(".buy-item-btn").forEach(button => {
        button.addEventListener("click", () => {
            const itemId = button.dataset.itemId;
            const item = items.find(i => i.id === itemId);
            if (!item) return;

            if (player.dinero < item.price) {
                alert(`No tenés suficiente dinero. Te faltan $${(item.price - player.dinero).toLocaleString()}.`);
                return;
            }

            player.dinero -= item.price;
            player.inventory.push(item.id);

            // Actualizar el equipamiento si aplica al slot
            if (item.slot && ["pc", "camera", "microphone", "light"].includes(item.slot)) {
                if (!player.equipment) player.equipment = {};
                player.equipment[item.slot] = item.id;
            }

            // Bonus a atributos
            if (item.editing) player.atributos.edicion = (player.atributos.edicion || 0) + item.editing;
            if (item.audio) player.atributos.edicion = (player.atributos.edicion || 0) + Math.floor(item.audio / 3);

            gameState.agregarNotificacion({
                tipo: "tienda",
                titulo: `🛒 Compraste ${item.name}`,
                descripcion: `Nuevo equipamiento agregado a tu setup.`
            });

            gameState.guardar();
            renderStore(container);
        });
    });

    return container;
}

export const storeScreen = { render: renderStore };
export default storeScreen;