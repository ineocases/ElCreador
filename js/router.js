// Router reservado para futuras pantallas.
export class Router {
    constructor(){this.routes={}}
    add(path,handler){this.routes[path]=handler;return this}
    navigate(path){if(this.routes[path])this.routes[path]()}
}
