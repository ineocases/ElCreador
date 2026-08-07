export const gameState = {
  player: {
    nombre: "",
    canal: "",
    niche: "",
    edad: 18,
    año: 2026,
    trimestre: 1, // 1 a 3 trimestres por año
    
    suscriptores: 15,
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
    ingresosTrimestre: 0
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
  avanzarTrimestre() {
    this.player.trimestre += 1;
    if (this.player.trimestre > 3) {
      this.player.trimestre = 1;
      this.player.año += 1;
    }
  }
};
