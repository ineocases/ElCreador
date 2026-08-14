// Grupos de creadores: eventos especiales de networking y encuentros.
// Los grupos usan únicamente creadores que ya existen en data/creators.js.
// No representan afiliaciones reales; son mecánicas de simulación del juego.

const creatorGroups = [
    {
        id: "faze",
        nombre: "FaZe",
        etiqueta: "GRUPO GLOBAL · GAMING",
        minSubs: 150000,
        minFama: 18,
        baseChance: 0.028,
        cooldownYears: 1,
        members: ["faze-rug", "faze-adapt", "faze-jev", "faze-rain", "faze-blaze", "faze-kay", "faze-apex", "faze-banks", "faze-temperrr"]
    },
    {
        id: "top_global_arg",
        nombre: "Top Global AR",
        etiqueta: "CÍRCULO ARGENTINO · TOP",
        minSubs: 120000,
        minFama: 14,
        baseChance: 0.035,
        cooldownYears: 1,
        members: ["goncho", "coker", "duendepablo", "zeko", "coscu"]
    },
    {
        id: "gaming_arg",
        nombre: "Gaming Argentina",
        etiqueta: "ESCENA ARGENTINA · GAMING",
        minSubs: 25000,
        minFama: 7,
        baseChance: 0.060,
        cooldownYears: 1,
        members: ["spreen", "momo", "brunenger", "coker", "goncho", "frankkaster", "luken", "santidead", "agusbob"]
    },
    {
        id: "futbol_arg",
        nombre: "Fútbol & Streams",
        etiqueta: "ESCENA ARGENTINA · FÚTBOL",
        minSubs: 20000,
        minFama: 6,
        baseChance: 0.055,
        cooldownYears: 1,
        members: ["davoo", "lacobra", "luquita"]
    },
    {
        id: "variedad_arg",
        nombre: "Variedad Argentina",
        etiqueta: "ESCENA ARGENTINA · VARIEDAD",
        minSubs: 50000,
        minFama: 9,
        baseChance: 0.045,
        cooldownYears: 1,
        members: ["momo", "brunenger", "tuli", "milica", "pimpeano", "gianpa", "gaspi", "grego"]
    }
];

export default creatorGroups;
export { creatorGroups };
