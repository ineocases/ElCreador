import formats from "../data/generator/formats.js";
import topics from "../data/generator/topics.js";

function random(min,max){

    return Math.floor(Math.random()*(max-min+1))+min;

}

export function generarVideos(player){

    const categoria=topics[player.niche] || topics.Gaming;

    const videos=[];

    const usados=[];

    for(let i=0;i<6;i++){

        let tema;

        do{

            tema=categoria[random(0,categoria.length-1)];

        }

        while(usados.includes(tema));

        usados.push(tema);

        const formato=formats[i];

        videos.push({

            id:crypto.randomUUID(),

            titulo:`${formato.name} ${tema}`,

            formato:formato.name,

            tema,

            costo:formato.cost,

            riesgo:formato.risk,

            tipo:

            i<2

            ?"gratis"

            :

            i<4

            ?"medio"

            :

            "caro"

        });

    }

    return videos;

}
