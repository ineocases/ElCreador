// Creadores top que te pueden descubrir según el nicho de tu canal
export const creadoresTopPorNicho = {
  Gaming: [
    { creador: "Coscu", texto: "reaccionó a tu stream en vivo, se sorprendió con tus jugadas y dijo que tenés un potencial enorme." },
    { creador: "Spreen", texto: "usó un clip tuyo para un video de TikTok y les dijo a sus seguidores que vayan a bancarte." },
    { creador: "ElRubius", texto: "se cruzó con tu canal en un directo de raid masivo y te dejó a miles de espectadores mirando." }
  ],
  Fútbol: [
    { creador: "Davo Xeneize", texto: "vio tu video en directo, se cagó de risa con tus comentarios y pidió al chat que te sigan ya mismo." },
    { creador: "La Cobra", texto: "destacó tu análisis táctico en stream y dijo que sos de los pocos que entienden de verdad." },
    { creador: "Ezzequiel", texto: "te mencionó en una de sus entrevistas como la revelación del contenido futbolero." }
  ],
  Vlog: [
    { creador: "Ibai Llanos", texto: "mostró un fragmento de tu vlog en pleno directo y halagó tu carisma frente a la cámara." },
    { creador: "Luisito Comunica", texto: "te comentó el video diciendo que le encantó tu edición y la vibra de tus viajes." }
  ],
  Tecnología: [
    { creador: "SupraPixel (Nico Fishman)", texto: "citó tu review en X/Twitter destacando la calidad técnica de tu análisis." },
    { creador: "Marques Brownlee (MKBHD)", texto: "reposteó tu video de setups en sus historias alabando tu producción." }
  ],
  Cocina: [
    { creador: "Paulina Cocina", texto: "reaccionó a tu receta en Instagram y recomendó tu canal a toda su comunidad." },
    { creador: "Marcos Di Cesare", texto: "alabó la técnica de tu plato en vivo y dijo que da gusto ver contenido bien hecho." }
  ],
  Periodismo: [
    { creador: "Tomas Rebord", texto: "citó tu informe de investigación en su programa y dijo que sos el futuro del periodismo digital." },
    { creador: "Julio Leiva", texto: "te recomendó en sus redes como un canal imperdible de contenido documental." }
  ]
};

// Función para comprobar si se dispara el evento épico (ej: 7% de probabilidad)
export function probarEventoEpico(player) {
  // Solo puede ocurrir si el jugador ya tiene al menos 1.000 subs
  if (player.suscriptores < 1000) return null;

  const CHANCE_EVENTO_EPICO = 0.07; // 7% de probabilidad
  const tirada = Math.random();

  if (tirada < CHANCE_EVENTO_EPICO) {
    const lista = creadoresTopPorNicho[player.niche] || creadoresTopPorNicho['Gaming'];
    const seleccion = lista[Math.floor(Math.random() * lista.length)];

    return {
      titulo: `🔥 ¡MOMENTO ÉPICO: TE DESCUBRIÓ ${seleccion.creador.toUpperCase()}!`,
      creador: seleccion.creador,
      descripcion: `¡No lo podés creer! **${seleccion.creador}** ${seleccion.texto}`,
      recompensas: {
        vistas: 100000,
        suscriptores: 25000,
        fama: 20
      }
    };
  }

  return null;
}
