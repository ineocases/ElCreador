// engine/gameState.js

export const gameState = {

  player: {

    nombre: "",
    canal: "",
    niche: "",

    edad: 18,

    año: 2026,
    trimestre: 1,

    // PROGRESIÓN

    suscriptores: 15,

    get subs() {
      return this.suscriptores;
    },

    set subs(valor) {
      this.suscriptores = valor;
    },

    vistasTotales: 0,

    videosSubidos: 0,

    fama: 0,

    comunidad: 0,

    reputacion: 0,

    dinero: 200,

    get money() {
      return this.dinero;
    },

    set money(valor) {
      this.dinero = valor;
    },

    ingresosTrimestre: 0,

    // HABILIDADES

    atributos: {

      edicion: 10,

      carisma: 15,

      algoritmo: 10,

      marketing: 5,

      constancia: 15,

      humor: 10,

      creatividad: 12,

      networking: 5

    },

    // EQUIPO

    equipment: {

      pc: "government_pc",

      camera: "old_phone",

      microphone: "earphones",

      light: null,

      keyboard: null,

      chair: null,

      internet: "3mb"

    },

    // INVENTARIO

    inventory: [

      "government_pc",

      "old_phone",

      "earphones"

    ],

    // DESBLOQUEOS

    unlocks: [

      "video"

    ],

    // PROGRESIÓN DE TIENDA

    shopTier: 1,

    // RELACIONES

    relationships: {},

    // SPONSORS

    sponsors: [],

    activeSponsor: null,

    // ESTADÍSTICAS

    stats: {

      mejorVideo: 0,

      videosVirales: 0,

      colaboraciones: 0,

      sponsorsCompletados: 0,

      premios: 0,

      temporadasJugadas: 0

    }

  },

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

  world: {

    trend: null,

    news: [],

    events: [],

    creators: []

  },

  iniciarPartida({ nombre, canal, niche }) {

    this.player.nombre = nombre || "Creador";

    this.player.canal = canal || "Mi Canal";

    this.player.niche = niche || "Gaming";

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

  avanzarTrimestre() {

    this.player.stats.temporadasJugadas++;

    this.player.trimestre++;

    if (this.player.trimestre > 2) {

      this.player.trimestre = 1;

      this.player.año++;

    }

    if (
      typeof saveManager !== "undefined" &&
      saveManager &&
      saveManager.saveLocal
    ) {

      saveManager.saveLocal();

    }

  }

};

export default gameState;
