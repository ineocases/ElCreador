// engine/videoSystem.js
import { gameState } from './gameState.js';

export function procesarPublicacionVideo(titulo, enfoquePrincipal, enfoqueSecundario) {
  const player = gameState.player;
  const atri = player.atributos || { edicion: 10, carisma: 10, algoritmo: 10, marketing: 10, constancia: 10 };

  // 1. Calidad del Video calculada según el enfoque elegido
  const valPrincipal = atri[enfoquePrincipal] || 10;
  const valSecundario = atri[enfoqueSecundario] || 10;
  const calidadTotal = (valPrincipal * 1.5) + valSecundario + (atri.edicion * 0.5);

  // 2. Factor de Algoritmo / Viralidad Aleatorio (Entre 0.6x y 1.8x)
  const factorAlgoritmo = 0.6 + (Math.random() * 1.2);

  // 3. Vistas Ganadas (Vistas base según subs + fama + calidad)
  const vistasBase = (player.suscriptores * 0.25) + (player.fama * 150) + (calidadTotal * 20) + (Math.random() * 100);
  const vistasGanadas = Math.floor(vistasBase * factorAlgoritmo);

  // 4. Suscriptores Ganados (Tasa de conversión entre 0.8% y 4% de las vistas)
  const tasaConversion = 0.008 + ((atri.carisma + atri.marketing) / 1500);
  let subsGanados = Math.floor(vistasGanadas * tasaConversion);

  // REGLA OBLIGATORIA: Nunca puede ganar más subs que vistas
  if (subsGanados > vistasGanadas) {
    subsGanados = Math.floor(vistasGanadas * 0.5);
  }

  // 5. RPM Realista por Nicho ($ Ganados por cada 1,000 vistas)
  const rpmsNicho = {
    'Tecnología': 3.50,
    'Cocina': 2.80,
    'Periodismo': 2.20,
    'Fútbol': 1.80,
    'Vlog': 1.50,
    'Gaming': 1.20
  };

  const rpmBase = rpmsNicho[player.niche] || 1.50;
  // El atributo algoritmo aumenta ligeramente el RPM (mejor monetización)
  const rpmFinal = rpmBase + (atri.algoritmo * 0.03);
  const dineroGanado = Number(((vistasGanadas / 1000) * rpmFinal).toFixed(2));

  // Actualizar el Estado del Jugador
  player.vistasTotales += vistasGanadas;
  player.suscriptores += subsGanados;
  player.dinero += dineroGanado;
  player.videosSubidos += 1;

  // Retornar objeto para la pantalla de resultados
  const resultado = {
    titulo,
    vistasGanadas,
    subsGanados,
    dineroGanado,
    rpmFinal: rpmFinal.toFixed(2),
    esViral: factorAlgoritmo > 1.4
  };

  player.ultimoVideoResultado = resultado;
  return resultado;
}
