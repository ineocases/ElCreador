// engine/utils.js

export const utils = {
    // Genera un número aleatorio entre un mínimo y un máximo (inclusive)
    // Ejemplo: utils.randomInt(1, 10) devuelve un número del 1 al 10.
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Elige un elemento al azar de cualquier lista (array) que le pases
    pickRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
};