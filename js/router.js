const app = document.getElementById("app");

const routes = {};

export function register(name, screen) {

    routes[name] = screen;

}

export function go(name, ...args) {

    if (!routes[name]) {

        console.error(`Pantalla "${name}" no existe`);

        return;

    }

    app.innerHTML = routes[name](...args);

}

export function render(html) {

    app.innerHTML = html;

}
