// Estado global de la partida
export const gameState = {
  player: {
    nombre: "",
    canal: "",
    niche: "",
    edad: 17,
    año: 2026,
    trimestre: 1, // 1 al 4
    
    // Métricas Principales iniciales
    suscriptores: 0,
    vistasTotales: 0,
    videosSubidos: 0,
    fama: 0, // 0 a 100
    comunidad: 0, // Idolatría (0 a 100)
    
    // Atributos bajos para empezar desde cero
    atributos: {
      edicion: 10,
      carisma: 15,
      algoritmo: 10,
      marketing: 5,
      constancia: 15
    },
    
    // Capital inicial mínimo
    dinero: 200, // US$
    ingresosTrimestre: 0
  },

  // Rival asignado: Un streamer nuevo compitiendo al mismo nivel
  rival: {
    nombre: "Nico TV",
    suscriptores: 15,
    fama: 1,
    dueloGanado: false
  },

  // Guarda los datos ingresados en la pantalla de inicio
  iniciarPartida({ nombre, canal, niche }) {
    this.player.nombre = nombre || "Creador";
    this.player.canal = canal || "MiCanal";
    this.player.niche = niche || "Gaming & Fútbol";
  },

  // Función para subir atributos en minijuegos o pretemporadas
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
  }
};
