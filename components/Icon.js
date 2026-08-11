export function icon(name, size = 20, className = "") {
    return `<svg class="svg-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><use href="./assets/icons.svg#${name}"></use></svg>`;
}
export default icon;
