// V21 - defensas de frontend. No reemplaza un backend: todo dato del navegador es manipulable.
const MAX_SAVE_BYTES = 2_500_000;

export function validateLocalSave(raw) {
    if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_SAVE_BYTES) return false;
    try {
        const data = JSON.parse(raw);
        const p = data?.player;
        if (!p || p.partidaIniciada !== true) return false;
        if (typeof p.nombre !== "string" || p.nombre.length > 80) return false;
        if (typeof p.canal !== "string" || p.canal.length > 80) return false;
        if (!Number.isFinite(Number(p.año)) || Number(p.año) < 2020 || Number(p.año) > 2100) return false;
        if (!Number.isFinite(Number(p.trimestre)) || Number(p.trimestre) < 1 || Number(p.trimestre) > 4) return false;
        if (Array.isArray(data.inventory) && data.inventory.length > 500) return false;
        if (Array.isArray(data.creators) && data.creators.length > 5000) return false;
        return true;
    } catch {
        return false;
    }
}

export function safeText(value, max = 500) {
    return String(value ?? "").slice(0, max);
}

export function installSecurityGuards() {
    // Evita que una página embebida intente navegar la ventana superior de forma silenciosa.
    try {
        if (window.top !== window.self) {
            document.documentElement.dataset.embedded = "true";
        }
    } catch {
        document.documentElement.dataset.embedded = "true";
    }

    window.addEventListener("storage", event => {
        if (event.key === "elCreador_saveData" && event.newValue && !validateLocalSave(event.newValue)) {
            console.warn("El Creador: se ignoró un save inválido recibido por storage.");
        }
    });
}
