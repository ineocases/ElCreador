import {save,load} from "./database.js";

const KEY="ytcareer";

export function saveGame(game){

    save(KEY,game);

}

export function loadGame(){

    return load(KEY);

}
