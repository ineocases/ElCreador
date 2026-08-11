const SAVE_KEY = "el-creador-save";

export function saveGame(player){

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(player)
    );

}

export function loadGame(){

    const save = localStorage.getItem(SAVE_KEY);

    if(!save) return null;

    return JSON.parse(save);

}

export function deleteSave(){

    localStorage.removeItem(SAVE_KEY);

}
