/**
 * rivals.js - Sistema de Rivales Dinámicos para "El Ídolo"
 * Gestiona rivales con personalidades únicas, evolución y eventos.
 */

// Tipos de personalidad de los rivales
const PERSONALIDAD = {
    PRODIGIO: 'prodigio',      // Sube rápido, cae rápido, alto riesgo/alta recompensa
    CONSISTENTE: 'consistente',// Crecimiento lento pero seguro, difícil de superar
    POLÉMICO: 'polemico',      // Genera muchas vistas por controversia, reputación variable
    ESTRATEGA: 'estratega'     // Optimiza sponsors y economía, crecimiento equilibrado
};

// Arquetipos de rivales predefinidos
const RIVAL_ARCHETYPES = [
    {
        nombre: "Max 'El Prodigio'",
        personalidad: PERSONALIDAD.PRODIGIO,
        descripcion: "Un creador joven que viraliza todo, pero se quema rápido.",
        bonusInicial: { viralidad: 1.5, consistencia: 0.8 },
        color: "#FF5733"
    },
    {
        nombre: "Laura 'La Constante'",
        personalidad: PERSONALIDAD.CONSISTENTE,
        descripcion: "Nunca falla. Sube poco a poco pero es imparable.",
        bonusInicial: { viralidad: 0.9, consistencia: 1.4 },
        color: "#33FF57"
    },
    {
        nombre: "Diego 'El Polémico'",
        personalidad: PERSONALIDAD.POLÉMICO,
        descripcion: "Odio o amor. Sus videos siempre generan debate.",
        bonusInicial: { viralidad: 1.3, reputacion: 0.7 },
        color: "#A833FF"
    },
    {
        nombre: "Sofía 'La CEO'",
        personalidad: PERSONALIDAD.ESTRATEGA,
        descripcion: "Trata su canal como una empresa. Sponsorizaciones millonarias.",
        bonusInicial: { economia: 1.5, creatividad: 0.9 },
        color: "#33C1FF"
    }
];

class Rival {
    constructor(archetype, id) {
        this.id = id;
        this.nombre = archetype.nombre;
        this.personalidad = archetype.personalidad;
        this.descripcion = archetype.descripcion;
        this.color = archetype.color;
        
        // Estadísticas base
        this.fama = 100; // Empiezan con poca fama
        this.suscriptores = 500;
        this.reputacion = 50; // 0-100
        this.dinero = 1000;
        
        // Modificadores según personalidad
        this.bonus = archetype.bonusInicial;
        
        // Estado emocional/relacional con el jugador
        this.relacionJugador = 0; // -100 (Enemigo mortal) a 100 (Mejor amigo)
        this.estado = 'activo'; // activo, retirado, escandalizado
        
        // Historial de logros
        this.logros = [];
        this.victoriasTrimestrales = 0;
    }

    /**
     * Simula el desempeño del rival en un trimestre
     * @param {number} trimestre - Número actual del trimestre
     * @param {object} jugadorStats - Estadísticas actuales del jugador para comparación
     * @returns {object} Resultados del trimestre
     */
    jugarTrimestre(trimestre, jugadorStats) {
        if (this.estado !== 'activo') return null;

        let factorCrecimiento = 1.0;
        let factorVistas = 1.0;
        let cambioReputacion = 0;
        let eventoGenerado = null;

        // Lógica basada en personalidad
        switch (this.personalidad) {
            case PERSONALIDAD.PRODIGIO:
                // Alto riesgo: puede tener picos enormes o caídas
                const suerteProdigio = Math.random();
                if (suerteProdigio > 0.7) {
                    factorCrecimiento = 2.5 + (Math.random() * 2); // Viral explosivo
                    eventoGenerado = { tipo: 'viral', texto: `${this.nombre} ha creado un video que rompe internet!` };
                } else if (suerteProdigio < 0.2) {
                    factorCrecimiento = 0.5; // Burnout
                    cambioReputacion = -5;
                    eventoGenerado = { tipo: 'burnout', texto: `${this.nombre} parece agotado y sus views caen.` };
                } else {
                    factorCrecimiento = 1.2;
                }
                break;

            case PERSONALIDAD.CONSISTENTE:
                // Crecimiento predecible y seguro
                factorCrecimiento = 1.15 + (Math.random() * 0.2);
                if (trimestre % 4 === 0) {
                    factorCrecimiento *= 1.5; // "Siempre mejora al final del año"
                    eventoGenerado = { tipo: 'mejora', texto: `${this.nombre} lanza una temporada exitosa.` };
                }
                break;

            case PERSONALIDAD.POLÉMICO:
                // La polémica genera vistas pero daña reputación a veces
                const esPolemico = Math.random() > 0.5;
                if (esPolemico) {
                    factorVistas = 2.0;
                    cambioReputacion = -10;
                    eventoGenerado = { tipo: 'polemica', texto: `${this.nombre} está en el centro de una controversia masiva.` };
                } else {
                    factorVistas = 0.8;
                    cambioReputacion = 5; // Se comporta y gana respeto
                }
                factorCrecimiento = factorVistas;
                break;

            case PERSONALIDAD.ESTRATEGA:
                // Crece con sponsors y negocios
                factorCrecimiento = 1.1;
                this.dinero += 500 * (trimestre / 10); // Gana más dinero con el tiempo
                eventoGenerado = { tipo: 'sponsor', texto: `${this.nombre} consigue un patrocinio millonario.` };
                break;
        }

        // Aplicar crecimiento
        const crecimientoBase = 100 + (trimestre * 10); // El mercado crece con el tiempo
        const nuevosSuscriptores = Math.floor((crecimientoBase * factorCrecimiento) * (this.bonus.consistencia || 1));
        
        this.suscriptores += nuevosSuscriptores;
        this.fama += Math.floor(nuevosSuscriptores * 0.8);
        this.reputacion = Math.max(0, Math.min(100, this.reputacion + cambioReputacion));
        
        // Actualizar relación con el jugador basada en competencia
        this.actualizarRelacion(jugadorStats);

        return {
            suscriptoresGanados: nuevosSuscriptores,
            evento: eventoGenerado,
            famaTotal: this.fama
        };
    }

    /**
     * Actualiza la relación con el jugador según quién va ganando
     */
    actualizarRelacion(jugadorStats) {
        if (!jugadorStats || !jugadorStats.suscriptores) return;

        const diferencia = this.suscriptores - jugadorStats.suscriptores;
        
        if (diferencia > 50000) {
            // El rival te está ganando por mucho -> Arrogancia
            this.relacionJugador = Math.min(50, this.relacionJugador - 5);
        } else if (diferencia < -50000) {
            // Tú le estás ganando por mucho -> Envidia o Respeto
            if (this.personalidad === PERSONALIDAD.CONSISTENTE) {
                this.relacionJugador = Math.max(-20, this.relacionJugador + 2); // Respeto silencioso
            } else {
                this.relacionJugador = Math.min(-50, this.relacionJugador - 5); // Envidia
            }
        } else {
            // Competencia reñida -> Tensión o Amistad
            this.relacionJugador += (Math.random() * 4) - 2; 
        }
    }

    /**
     * Genera una interacción posible con el jugador
     * @returns {object|null} Propuesta de interacción
     */
    generarInteraccion() {
        if (this.estado !== 'activo') return null;

        const rand = Math.random();
        
        // Si la relación es muy mala, chance de "Beef" (Pelea)
        if (this.relacionJugador < -40 && rand > 0.6) {
            return {
                tipo: 'beef',
                titulo: `¡${this.nombre} te ha lanzado un indirectazo!`,
                descripcion: "Ha subido un video criticando tu último contenido. Tus fans están furiosos.",
                opciones: [
                    { texto: "Responder con otro video (Guerra de Views)", efecto: { vistas: 50000, reputacion: -10, relacion: -20 } },
                    { texto: "Ignorar y seguir trabajando", efecto: { vistas: -5000, reputacion: 5, relacion: -5 } },
                    { texto: "Pedir disculpas públicas (aunque no tengas culpa)", efecto: { vistas: 10000, reputacion: 10, relacion: 10 } }
                ]
            };
        }

        // Si la relación es buena, chance de Colaboración
        if (this.relacionJugador > 30 && rand > 0.7) {
            return {
                tipo: 'colaboracion',
                titulo: `Propuesta de Collab con ${this.nombre}`,
                descripcion: "Quiere hacer un video juntos para crecer mutuamente.",
                opciones: [
                    { texto: "Aceptar collab", efecto: { vistas: 30000, suscriptores: 2000, relacion: 15 } },
                    { texto: "Rechazar amablemente", efecto: { vistas: 0, relacion: -10 } }
                ]
            };
        }

        // Evento aleatorio neutral
        if (rand > 0.9) {
            return {
                tipo: 'encuentro',
                titulo: `Te cruzas con ${this.nombre} en un evento`,
                descripcion: "Están en la misma fiesta de creadores.",
                opciones: [
                    { texto: "Saludar y networking", efecto: { relacion: 5, oportunidades: 1 } },
                    { texto: "Evitarlo", efecto: { relacion: -2 } }
                ]
            };
        }

        return null;
    }
}

class SistemaRivales {
    constructor() {
        this.rivales = [];
        this.eventosPendientes = [];
        this.inicializarRivales();
    }

    inicializarRivales() {
        // Seleccionar 3 rivales aleatorios para esta partida
        const seleccionados = [];
        const indicesDisponibles = [...Array(RIVAL_ARCHETYPES.length).keys()];
        
        for (let i = 0; i < 3; i++) {
            if (indicesDisponibles.length === 0) break;
            const randomIndex = Math.floor(Math.random() * indicesDisponibles.length);
            const index = indicesDisponibles.splice(randomIndex, 1)[0];
            seleccionados.push(new Rival(RIVAL_ARCHETYPES[index], i));
        }
        
        this.rivales = seleccionados;
        console.log("Rivales inicializados:", this.rivales.map(r => r.nombre));
    }

    /**
     * Procesa el turno de todos los rivales
     */
    procesarTrimestre(trimestre, jugadorStats) {
        const resultados = [];
        
        this.rivales.forEach(rival => {
            const resultado = rival.jugarTrimestre(trimestre, jugadorStats);
            if (resultado) {
                resultados.push({ rival: rival.nombre, ...resultado });
                
                // Verificar si hay eventos de interacción
                const interaccion = rival.generarInteraccion();
                if (interaccion) {
                    this.eventosPendientes.push(interaccion);
                }
            }
        });

        return resultados;
    }

    getEventosPendientes() {
        const eventos = this.eventosPendientes;
        this.eventosPendientes = []; // Consumir eventos
        return eventos;
    }

    getRanking(jugadorNombre, jugadorFama) {
        const lista = this.rivales.map(r => ({ nombre: r.nombre, fama: r.fama, esJugador: false }));
        lista.push({ nombre: jugadorNombre, fama: jugadorFama, esJugador: true });
        
        return lista.sort((a, b) => b.fama - a.fama);
    }

    getRivalPorNombre(nombre) {
        return this.rivales.find(r => r.nombre === nombre);
    }
}

// Exportar para uso en otros módulos (si usamos módulos ES6) o global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SistemaRivales, Rival, PERSONALIDAD };
}
