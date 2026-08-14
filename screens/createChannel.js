// screens/createChannel.js
// Pantalla de inicio de carrera: visual, clara y mobile-first.
import { gameState } from '../engine/gameState.js';
import { icon } from '../components/Icon.js';

const NICHES = [
    { value:'Gaming', label:'Gaming', desc:'Juegos, streams y desafíos', ico:'gamepad' },
    { value:'Fútbol', label:'Fútbol', desc:'Análisis, actualidad y debate', ico:'soccer' },
    { value:'Vlog', label:'IRL / Vlog', desc:'Tu vida, viajes y momentos', ico:'camera' },
    { value:'Tecnología', label:'Tecnología', desc:'Reviews, gadgets y novedades', ico:'phone' },
    { value:'Cocina', label:'Cocina', desc:'Recetas, desafíos y cocina en vivo', ico:'chef' },
    { value:'Periodismo', label:'Noticias', desc:'Actualidad, entrevistas y análisis', ico:'news' }
];

export function renderCreateChannel(el) {
    const container = el || document.getElementById('createChannelScreen');
    if (!container) return;

    container.innerHTML = `
        <div class="create-page">
            <div class="create-noise"></div>
            <div class="create-orbit orbit-a"></div>
            <div class="create-orbit orbit-b"></div>

            <main class="create-shell">
                <header class="create-topbar">
                    <div class="create-brand"><span class="create-brand-mark">${icon('play',18)}</span><span>EL CREADOR</span></div>
                    <span class="create-version">NUEVA CARRERA · 01</span>
                </header>

                <section class="create-hero">
                    <div class="create-kicker">${icon('bolt',14)} TU HISTORIA EMPIEZA ACÁ</div>
                    <h1>Creá tu<br><span>carrera.</span></h1>
                    <p>No necesitás ser famoso. Empezás desde cero y cada decisión cambia lo que pasa después.</p>
                    <div class="create-steps">
                        <span class="active"><b>01</b> Identidad</span><i>→</i><span><b>02</b> Nicho</span><i>→</i><span><b>03</b> Pretemporada</span>
                    </div>
                </section>

                <form id="create-channel-form" class="create-form">
                    <section class="create-panel create-identity-panel">
                        <div class="create-panel-head">
                            <div><span class="create-section-number">01</span><div><small>IDENTIDAD</small><h2>¿Quién va a aparecer en pantalla?</h2></div></div>
                            <span class="create-live-dot">NUEVA CARRERA</span>
                        </div>
                        <div class="create-input-grid">
                            <label class="create-field">
                                <span>${icon('person',14)} TU NOMBRE O ALIAS</span>
                                <input type="text" id="player-name" required maxlength="24" autocomplete="nickname" placeholder="Ej. Mateo, Nico, Tras..." />
                                <small>El nombre que va a aparecer en tu carrera.</small>
                            </label>
                            <label class="create-field">
                                <span>${icon('videocam',14)} NOMBRE DEL CANAL</span>
                                <input type="text" id="channel-name" required maxlength="28" autocomplete="off" placeholder="Ej. Mateoplay, NicoVlogs..." />
                                <small>Tu marca. Podés cambiarla más adelante si el juego lo permite.</small>
                            </label>
                        </div>
                    </section>

                    <section class="create-panel">
                        <div class="create-panel-head">
                            <div><span class="create-section-number">02</span><div><small>NICHO</small><h2>Elegí dónde querés crecer</h2></div></div>
                            <span id="niche-counter">1 / ${NICHES.length}</span>
                        </div>
                        <div class="niche-grid">
                            ${NICHES.map((n, i) => `
                                <button type="button" class="niche-card ${i === 0 ? 'selected' : ''}" data-niche="${n.value}">
                                    <span class="niche-icon">${icon(n.ico,24)}</span>
                                    <span class="niche-copy"><b>${n.label}</b><small>${n.desc}</small></span>
                                    <span class="niche-check">${icon('check',14)}</span>
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="channel-niche" value="Gaming" />
                    </section>

                    <section class="create-preview-card">
                        <div class="preview-avatar"><span id="preview-avatar-icon">${icon('videocam',30)}</span></div>
                        <div class="preview-copy">
                            <small>ASÍ SE VA A VER TU PERFIL</small>
                            <strong id="preview-channel">Tu canal</strong>
                            <span id="preview-meta">Gaming · 18 años · 0 subs</span>
                        </div>
                        <div class="preview-stat"><b>0</b><small>FAMA</small></div>
                    </section>

                    <button type="submit" class="create-start-btn">
                        <span>${icon('play',18)}</span>
                        <span><small>TODO LISTO</small> EMPEZAR MI CARRERA</span>
                        <b>→</b>
                    </button>
                    <p class="create-footnote">Vas a empezar con 18 años, una audiencia mínima y un setup básico. La pretemporada es tu primera decisión.</p>
                </form>
            </main>
        </div>
    `;

    const form = container.querySelector('#create-channel-form');
    const nameInput = container.querySelector('#player-name');
    const channelInput = container.querySelector('#channel-name');
    const nicheInput = container.querySelector('#channel-niche');
    const previewChannel = container.querySelector('#preview-channel');
    const previewMeta = container.querySelector('#preview-meta');
    const previewAvatar = container.querySelector('#preview-avatar-icon');
    const counter = container.querySelector('#niche-counter');

    const updatePreview = () => {
        const canal = channelInput.value.trim() || 'Tu canal';
        const niche = nicheInput.value || 'Gaming';
        const selected = NICHES.find(n => n.value === niche) || NICHES[0];
        previewChannel.textContent = canal;
        previewMeta.textContent = `${niche} · 18 años · 0 subs`;
        previewAvatar.innerHTML = icon(selected.ico, 30);
    };

    container.querySelectorAll('.niche-card').forEach((button, index) => {
        button.addEventListener('click', () => {
            container.querySelectorAll('.niche-card').forEach(b => b.classList.remove('selected'));
            button.classList.add('selected');
            nicheInput.value = button.dataset.niche;
            counter.textContent = `${index + 1} / ${NICHES.length}`;
            updatePreview();
        });
    });
    channelInput.addEventListener('input', updatePreview);
    nameInput.addEventListener('input', () => {
        if (!channelInput.value.trim()) channelInput.value = nameInput.value.trim();
        updatePreview();
    });
    updatePreview();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = nameInput.value.trim();
        const canal = channelInput.value.trim() || nombre;
        const niche = nicheInput.value || 'Gaming';
        if (!nombre || !canal) return;

        const submit = form.querySelector('.create-start-btn');
        submit.disabled = true;
        submit.classList.add('loading');
        submit.querySelector('span:nth-child(2)').innerHTML = '<small>PREPARANDO</small> CREANDO TU CARRERA...';

        gameState.iniciarPartida({ nombre, canal, niche });
        gameState.guardar();
        window.location.hash = '#pretemporada';
    });

    return container;
}

export const createChannelScreen = { render: renderCreateChannel };
export default createChannelScreen;
