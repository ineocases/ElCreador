// screens/sponsors.js
import { gameState } from "../engine/gameState.js";
import { renderHeaderHud } from "../components/HeaderHud.js";

const bancoSponsors = [
    // TIER 1: 0 - 1,000 subs (Micro)
    { nicho: 'Gaming', minSubs: 0, maxSubs: 1000, minFama: 0, nombre: "Ciber Local 'El Galpón'", pagoAnual: 100, años: 1, desc: "Banner chico en tus streams." },
    { nicho: 'Fútbol', minSubs: 0, maxSubs: 1000, minFama: 0, nombre: "Canchitas 'La Gambeta'", pagoAnual: 80, años: 1, desc: "Mención rápida en tus vlogs de potrero." },
    { nicho: 'Vlog', minSubs: 0, maxSubs: 1000, minFama: 0, nombre: "Mochilas 'UrbanTrip'", pagoAnual: 90, años: 1, desc: "Canje por mención en videos." },
    { nicho: 'Tecnología', minSubs: 0, maxSubs: 1000, minFama: 0, nombre: "Tienda 'FixCell'", pagoAnual: 120, años: 1, desc: "Reparaciones gratis y comisión." },
    { nicho: 'Cocina', minSubs: 0, maxSubs: 1000, minFama: 0, nombre: "Bazar 'La Cacerola'", pagoAnual: 100, años: 1, desc: "Utensilios gratis y dinero por mención." },
    { nicho: 'Periodismo', minSubs: 0, maxSubs: 1000, minFama: 0, nombre: "Librería 'El Ateneo'", pagoAnual: 80, años: 1, desc: "Mención en el bloque de recomendados." },

    // TIER 2: 1,000 - 5,000 subs
    { nicho: 'Gaming', minSubs: 1000, maxSubs: 5000, minFama: 2, nombre: "Redragon Arg", pagoAnual: 400, años: 1, desc: "Sponsor de periféricos básico." },
    { nicho: 'Fútbol', minSubs: 1000, maxSubs: 5000, minFama: 2, nombre: "RetroGoal Camisetas", pagoAnual: 350, años: 1, desc: "Indumentaria y presupuesto por video." },
    { nicho: 'Vlog', minSubs: 1000, maxSubs: 5000, minFama: 2, nombre: "Agencia 'FlyCheap'", pagoAnual: 500, años: 2, desc: "Descuentos en pasajes y presupuesto." },
    { nicho: 'Tecnología', minSubs: 1000, maxSubs: 5000, minFama: 2, nombre: "Anker / Ugreen", pagoAnual: 600, años: 2, desc: "Envío de gadgets para reviews y pago fijo." },
    { nicho: 'Cocina', minSubs: 1000, maxSubs: 5000, minFama: 2, nombre: "Essen / Sartenes Pro", pagoAnual: 450, años: 2, desc: "Equipamiento de cocina y pago fijo." },
    { nicho: 'Periodismo', minSubs: 1000, maxSubs: 5000, minFama: 2, nombre: "Plataforma 'Edutin'", pagoAnual: 500, años: 2, desc: "Publicidad en la mitad del video informe." },

    // TIER 3: 5,000 - 25,000 subs
    { nicho: 'Gaming', minSubs: 5000, maxSubs: 25000, minFama: 5, nombre: "Logitech G", pagoAnual: 1500, años: 2, desc: "Patrocinio de equipamiento gaming." },
    { nicho: 'Fútbol', minSubs: 5000, maxSubs: 25000, minFama: 5, nombre: "Puma / Umbro", pagoAnual: 1200, años: 2, desc: "Sponsor oficial de indumentaria." },
    { nicho: 'Vlog', minSubs: 5000, maxSubs: 25000, minFama: 5, nombre: "GoPro", pagoAnual: 1800, años: 2, desc: "Cámaras de acción y presupuesto por viaje." },
    { nicho: 'Tecnología', minSubs: 5000, maxSubs: 25000, minFama: 5, nombre: "Motorola / Realme", pagoAnual: 2000, años: 2, desc: "Sponsorship para reviews de gama media." },
    { nicho: 'Cocina', minSubs: 5000, maxSubs: 25000, minFama: 5, nombre: "Supermercados Diarco", pagoAnual: 1500, años: 2, desc: "Patrocinio de ingredientes semanales." },
    { nicho: 'Periodismo', minSubs: 5000, maxSubs: 25000, minFama: 5, nombre: "NordVPN", pagoAnual: 1800, años: 2, desc: "Patrocinador oficial de ciberseguridad." },

    // TIER 4: 25,000 - 100,000 subs
    { nicho: 'Gaming', minSubs: 25000, maxSubs: 100000, minFama: 15, nombre: "Monster Energy", pagoAnual: 5000, años: 2, desc: "Sponsor oficial de bebidas energéticas." },
    { nicho: 'Fútbol', minSubs: 25000, maxSubs: 100000, minFama: 15, nombre: "Adidas / Nike", pagoAnual: 6000, años: 3, desc: "Contrato profesional de indumentaria." },
    { nicho: 'Vlog', minSubs: 25000, maxSubs: 100000, minFama: 15, nombre: "AirBnB / Booking", pagoAnual: 5500, años: 3, desc: "Alojamiento y patrocinio en viajes." },
    { nicho: 'Tecnología', minSubs: 25000, maxSubs: 100000, minFama: 15, nombre: "Samsung / Xiaomi", pagoAnual: 7000, años: 3, desc: "Sponsorship global para presentaciones." },
    { nicho: 'Cocina', minSubs: 25000, maxSubs: 100000, minFama: 15, nombre: "Carrefour / Jumbo", pagoAnual: 6000, años: 3, desc: "Patrocinio de imagen y productos." },
    { nicho: 'Periodismo', minSubs: 25000, maxSubs: 100000, minFama: 15, nombre: "MasterClass", pagoAnual: 6500, años: 3, desc: "Afiliación premium y patrocinio directo." },

    // TIER 5: 100,000+ subs
    { nicho: 'Gaming', minSubs: 100000, maxSubs: 9999999, minFama: 30, nombre: "Razer / Asus ROG", pagoAnual: 15000, años: 3, desc: "Contrato global de embajador de marca." },
    { nicho: 'Fútbol', minSubs: 100000, maxSubs: 9999999, minFama: 30, nombre: "EA Sports / Konami", pagoAnual: 20000, años: 3, desc: "Embajador oficial de videojuegos de fútbol." },
    { nicho: 'Vlog', minSubs: 100000, maxSubs: 9999999, minFama: 30, nombre: "Red Bull", pagoAnual: 25000, años: 3, desc: "Patrocinio integral de estilo de vida." },
    { nicho: 'Tecnología', minSubs: 100000, maxSubs: 9999999, minFama: 30, nombre: "Apple / Sony", pagoAnual: 30000, años: 3, desc: "Partner tecnológico exclusivo." }
];

export function renderSponsors(el) {
    const container = el || document.getElementById("sponsorsScreen");
    if (!container) return;

    const player = gameState.player;
    const niche = player.niche || "Gaming";
    const subs = Number(player.suscriptores) || 0;
    const fama = Number(player.fama) || 0;

    if (!Array.isArray(gameState.sponsors)) gameState.sponsors = [];
    const activos = gameState.sponsors;

    const disponibles = bancoSponsors.filter(s =>
        s.nicho === niche &&
        subs >= s.minSubs &&
        subs <= s.maxSubs &&
        fama >= (s.minFama || 0)
    );

    container.innerHTML = `
        ${typeof renderHeaderHud === "function" ? renderHeaderHud() : ""}
        <div style="max-width:900px; margin:25px auto; padding:20px; color:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <div>
                    <span style="color:var(--accent-red); font-size:.8rem; font-weight:bold; text-transform:uppercase;">💼 PATROCINADORES</span>
                    <h1 style="margin:5px 0; font-family:var(--font-heading);">Sponsors</h1>
                    <p style="color:var(--text-muted);">Firmá contratos con marcas de tu nicho. Mejorá tu fama y suscriptores para desbloquear ofertas.</p>
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
                    <p style="color:var(--text-muted);">Necesitás más suscriptores o más fama para acceder a mejores contratos en tu nicho.</p>
                </div>
            ` : `
                <h3 style="color:#fbc531;">📋 Ofertas disponibles</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:15px;">
                    ${disponibles.map((sponsor, idx) => `
                        <div style="background:var(--bg-card); border:var(--border-card); border-radius:14px; padding:20px; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <h3 style="margin:0 0 10px; color:#fff;">${sponsor.nombre}</h3>
                                <p style="color:var(--text-muted); font-size:.9rem; line-height:1.5;">${sponsor.desc}</p>
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
                                        <strong style="color:var(--accent-yellow);">$${(sponsor.pagoAnual * sponsor.años).toLocaleString()}</strong>
                                    </div>
                                </div>
                            </div>
                            <button class="accept-sponsor-btn" data-index="${idx}" style="width:100%; padding:12px; background:var(--accent-red); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">💼 Firmar Contrato</button>
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
