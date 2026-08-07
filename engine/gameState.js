// engine/gameState.js

export const gameState = {
  player: {
    nombre: "",
    canal: "",
    niche: "",
    edad: 18,
    año: 2026,
    trimestre: 1, // 1 a 3 trimestres por año
    
    suscriptores: 15,
    // Getters/Setters de compatibilidad (para screens que leen .subs)
    get subs() { return this.suscriptores; },
    set subs(val) { this.suscriptores = val; },

    vistasTotales: 0,
    videosSubidos: 0,
    fama: 0,
    comunidad: 0,
    
    atributos: {
      edicion: 10,
      carisma: 15,
      algoritmo: 10,
      marketing: 5,
      constancia: 15
    },
    
    dinero: 200,
    // Getters/Setters de compatibilidad (para screens que leen .money)
    get money() { return this.dinero; },
    set money(val) { this.dinero = val; },

    ingresosTrimestre: 0
  },

  // Inventario para guardar patrocinadores y mejoras compradas
  inventory: {
    sponsors: [],
    upgrades: []
  },

  rival: {
    nombre: "Nico TV",
    suscriptores: 15,
    fama: 1,
    videosSubidos: 0
  },

  iniciarPartida({ nombre, canal, niche }) {
    this.player.nombre = nombre || "Creador";
    this.player.canal = canal || "MiCanal";
    this.player.niche = niche || "Gaming & Fútbol";
  },

  mejorarAtributo(key, cantidad) {
    if (this.player.atributos[key] !== undefined) {
      this.player.atributos[key] += cantidad;
    }
  },

  sumarSuscriptores(cantidad) {
    this.player.suscriptores += cantidad;
  },

  sumarDinero(cantidad) {
    this.player.dinero += cantidad;
  },

  // Pasa de trimestre y avanza el año al llegar a 4
  // Dentro de engine/gameState.js

avanzarTrimestre() {
    this.player.trimestre++;

    // Configurado a 2 trimestres por año
    if (this.player.trimestre > 2) {
        this.player.trimestre = 1;
        this.player.año++;
    }

    if (typeof saveManager !== 'undefined' && saveManager.saveLocal) {
        saveManager.saveLocal();
    }
};

// Exportación por defecto para solucionar SyntaxError en importaciones
export default gameState;
