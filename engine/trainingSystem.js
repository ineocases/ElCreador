const trainings=[

{

id:"charisma",

name:"Practicar Oratoria",

description:"+3 Carisma"

},

{

id:"editing",

name:"Curso de Edición",

description:"+3 Edición"

},

{

id:"humor",

name:"Escribir Chistes",

description:"+3 Humor"

},

{

id:"marketing",

name:"Estudiar Algoritmo",

description:"+3 Marketing"

},

{

id:"network",

name:"Ir a Eventos",

description:"+3 Relaciones"

}

];

export function getTrainings(){

    return trainings;

}

export function applyTraining(player,id){

    switch(id){

        case "charisma":

            player.skills.charisma+=3;

            break;

        case "editing":

            player.skills.editing+=3;

            break;

        case "humor":

            player.skills.humor+=3;

            break;

        case "marketing":

            player.skills.marketing+=3;

            break;

        case "network":

            player.skills.networking+=3;

            break;

    }

}
