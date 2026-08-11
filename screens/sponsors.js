// screens/sponsors.js
// REESCRITO: Pantalla de sponsors completa y compatible con el router

import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const bancoSponsors = [
    // GAMING
    { nicho: 'Gaming', minSubs: 0, maxSubs: 5000, nombre: "Ciber Local 'El Galpón'", pagoAnual: 150, años: 1, desc: "Banner chico en las transmisiones." },
    { nicho: 'Gaming', minSubs: 5000, maxSubs: 25000, nombre: "Redragon Arg", pagoAnual: 600, años: 2, desc: "Sponsor de periféricos por 2 años." },
    { nicho: 'Gaming', minSubs: 25000, maxSubs: 1000000, nombre: "Logitech G", pagoAnual: 3000, años: 3, desc: "Patrocinio de equipamiento gaming profesional." },
    // FÚTBOL
    { nicho: 'Fútbol', minSubs: 0, maxSubs: 5000, nombre: "Canchitas 'La Gambeta'", pagoAnual: 120, años: 1, desc: "Mención rápida en tus vlogs de potrero." },
    { nicho: 'Fútbol', minSubs: 5000, maxSubs: 25000, nombre: "RetroGoal Camisetas", pagoAnual: 500, años: 2, desc: "Indumentaria y dinero anual por sponsoreo." },
    { nicho: 'Fútbol', minSubs: 25000, maxSubs: 1000000, nombre: "Adidas / Nike", pagoAnual: 4000, años: 3, desc: "Sponsor oficial de indumentaria por 3 años." },
    // VLOG
    { nicho: 'Vlog', minSubs: 0, maxSubs: 5000, nombre: "Mochilas 'UrbanTrip'", pagoAnual: 100, años: 1, desc: "Canje y dinero para tus salidas a grabar." },
    { nicho: 'Vlog', minSubs: 5000, maxSubs: 25000, nombre: "Agencia 'FlyCheap'", pagoAnual: 800, años: 2, desc: "Descuentos en pasajes y presupuesto por video." },
    { nicho: 'Vlog', minSubs: 25000, maxSubs: 1000000, nombre: "AirBnB / Booking", pagoAnual: 3500, años: 3, desc: "Alojamiento y patrocinio en tus viajes internacionales." },
    // TECNOLOGÍA
    { nicho: 'Tecnología', minSubs: 0, maxSubs: 5000, nombre: "Tienda 'FixCell'", pagoAnual: 180, años: 1, desc: "Reparaciones gratis y comisión por accesorios." },
    { nicho: 'Tecnología', minSubs: 5000, maxSubs: 25000, nombre: "Anker / Ugreen", pagoAnual: 900, años: 2, desc: "Envío de gadgets para reviews y pago fijo." },
    { nicho: 'Tecnología', minSubs: 25000, maxSubs: 1000000, nombre: "Samsung / Xiaomi", pagoAnual: 5000, años: 3, desc: "Sponsorship global para presentaciones de productos." },
    // COCINA
    { nicho: 'Cocina', minSubs: 0, maxSubs: 5000, nombre: "Bazar 'La Cacerola'", pagoAnual: 130, años: 1, desc: "Utensilios gratis y dinero por mención." },
    { nicho: 'Cocina', minSubs: 5000, maxSubs: 25000, nombre: "Essen / Sartenes Pro", pagoAnual: 750, años: 2, desc: "Equipamiento de cocina y pago fijo por video." },
    { nicho: 'Cocina', minSubs: 25000, maxSubs: 1000000, nombre: "Supermercados Jumbo / Carrefour", pagoAnual: 3800, años: 3, desc: "Patrocinio de ingredientes e imagen por 3 años." },
    // PERIODISMO
    { nicho: 'Periodismo', minSubs: 0, maxSubs: 5000, nombre: "Librería 'El Ateneo'", pagoAnual: 110, años: 1, desc: "Mención en el bloque de recomendados." },
    { nicho: 'Periodismo', minSubs: 5000, maxSubs: 25000, nombre: "Plataforma de Cursos 'Edutin'", pagoAnual: 700, años: 2, desc: "Publicidad en la mitad del video informe." },
    { nicho: 'Periodismo', minSubs: 25000, maxSubs: 1000000, nombre: "NordVPN / ExpressVPN", pagoAnual: 3200, años: 3, desc: "Patrocinador oficial de ciberseguridad para tus investigaciones." }
];

export function renderSponsors(el) {

    const container = el || document.getElementById("sponsorsScreen");
    if (!container) return;

    const player = gameState.player;
    const niche = player.niche || "Gaming";
    const subs = Number(player.suscriptores) || 0;

    // Sponsors disponibles para el nicho y nivel de subs
    const disponibles = bancoSponsors.filter(s =>
        s.nicho === niche && subs >= s.minSubs && subs <= s.maxSubs
    );

    // Sponsors activos del jugador
    if (!Array.isArray(gameState.sponsors)) gameState.sponsors = [];
    const activos = gameState.sponsors;

    container.innerHTML = `
        ${typeof renderHeaderHud === "function" ? renderHeaderHud() : ""}
        <div style="max-width:900px; margin:25px auto; padding:20px; color:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <span style="color:var(--accent-red); font-size:.8rem; font-weight:bold; text-transform:uppercase;">
                        💼 PATROCINADORES
                    </span>
                    <h1 style="margin:5px 0; font-family:var(--font-heading);">Sponsors</h1>
                    <p style="color:var(--text-muted);">Firmá contratos con marcas de tu nicho.</p>
                </div>
                <a href="#dashboard" style="color:var(--text-muted); text-decoration:none;">← Volver</a>
            </div>

            ${activos.length > 0 ? `
                <div style="background:var(--bg-card); border:var(--border-card); border-radius:14px; padding:20px; margin-bottom:25px;">
                    <h3 style="margin-top:0; color:var(--accent-green);">✅ Sponsors activos</h3>
                    ${activos.map(s => `
                        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-subtle);">
                            <strong>${s.nombre}</strong>
                            <span style="color:var(--accent-green);">$${s.pagoAnual.toLocaleString()}/año</span>
                        </div>
                    `).join("")}
                </div>
            ` : ""}

            ${disponibles.length === 0 ? `
                <div style="background:var(--bg-card); padding:30px; border-radius:14px; text-align:center;">
                    <h2>🤔 No hay sponsors disponibles ahora</h2>
                    <p style="color:var(--text-muted);">
                        Necesitás más suscriptores o cambiar de nicho para acceder a mejores contratos.
                    </p>
                </div>
            ` : `
                <h3 style="color:#fbc531;">📋 Ofertas disponibles</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:15px;">
                    ${disponibles.map((sponsor, idx) => `
                        <div style="background:var(--bg-card); border:var(--border-card); border-radius:14px; padding:20px; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <h3 style="margin:0 0 10px; color:#fff;">${sponsor.nombre}</h3>
                                <p style="color:var(--text-muted); font-size:.9rem; line-height:1.5;">
                                    ${sponsor.desc}
                                </p>
                                <div style="background:rgba(0,0,0,.4); padding:12px; border-radius:8px; margin:10px 0;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                        <span style="color:var(--text-muted); font-size:.85rem;">Duración:</span>
                                        <strong>${sponsor.años} año${sponsor.años > 1 ? "s" : ""}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span style="color:var(--text-muted); font-size:.85rem;">Pago anual:</span>
                                        <strong style="color:var(--accent-green);">$${sponsor.pagoAnual.toLocaleString()}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                                        <span style="color:var(--text-muted); font-size:.85rem;">Total:</span>
                                        <strong style="color:var(--accent-yellow);">
                                            $${(sponsor.pagoAnual * sponsor.años).toLocaleString()}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                            <button class="accept-sponsor-btn" data-index="${idx}" style="
                                width:100%;
                                padding:12px;
                                background:var(--accent-red);
                                color:white;
                                border:none;
                                border-radius:8px;
                                font-weight:bold;
                                cursor:pointer;
                            ">💼 Firmar Contrato</button>
                        </div>
                    `).join("")}
                </div>
            `}
        </div>
    `;

    container.querySelectorAll(".accept-sponsor-btn").forEach(button => {
        button.addEventListener("click", () => {
            const idx = Number(button.dataset.index);
            const sponsor = disponibles[idx];
            if (!sponsor) return;

            // Verificar si ya tiene este sponsor
            if (activos.some(s => s.nombre === sponsor.nombre)) {
                alert("Ya tenés un contrato con este sponsor.");
                return;
            }

            const pagoTotal = sponsor.pagoAnual * sponsor.años;
            player.dinero += pagoTotal;

            if (!player.stats) player.stats = {};
            player.stats.sponsors = (player.stats.sponsors || 0) + 1;

            activos.push({
                nombre: sponsor.nombre,
                pagoAnual: sponsor.pagoAnual,
                años: sponsor.años,
                firmadoEn: gameState.time.año
            });

            gameState.agregarNotificacion({
                tipo: "sponsor",
                titulo: `💼 Nuevo sponsor: ${sponsor.nombre}`,
                descripcion: `Firmaste un contrato por $${pagoTotal.toLocaleString()}.`
            });

            alert(`✅ ¡Contrato firmado con ${sponsor.nombre}!\n\nRecibiste $${pagoTotal.toLocaleString()} por ${sponsor.años} año${sponsor.años > 1 ? "s" : ""}.`);

            gameState.guardar();
            renderSponsors(container);
        });
    });

    return container;
}

export const sponsorsScreen = { render: renderSponsors };
export default sponsorsScreen;