// Renderizado consistente de emojis con Twemoji 17.0.2.
// Si la CDN no está disponible, el juego conserva los emojis nativos.
let twemojiPromise = null;

function loadTwemoji() {
    if (window.twemoji) return Promise.resolve(window.twemoji);
    if (twemojiPromise) return twemojiPromise;
    twemojiPromise = new Promise(resolve => {
        const existing = document.querySelector('script[data-twemoji-loader]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.twemoji || null), { once: true });
            existing.addEventListener('error', () => resolve(null), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@twemoji/api@17.0.2/dist/twemoji.min.js';
        script.async = true;
        script.dataset.twemojiLoader = 'true';
        script.onload = () => resolve(window.twemoji || null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
    });
    return twemojiPromise;
}

export async function renderTwemoji(root = document.body) {
    if (!root || typeof document === 'undefined') return;
    const twemoji = await loadTwemoji();
    if (!twemoji) return;
    try {
        twemoji.parse(root, {
            folder: 'svg',
            ext: '.svg',
            base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.2/assets/'
        });
    } catch (error) {
        console.warn('Twemoji no pudo procesar la pantalla:', error);
    }
}
