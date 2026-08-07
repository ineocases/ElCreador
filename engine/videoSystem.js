// engine/videoSystem.js

import gameState from "./gameState.js";

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(percent) {
    return Math.random() * 100 <= percent;
}

export function publicarVideo(video) {

    const player = gameState.player;

    const skill =
        player.atributos.edicion +
        player.atributos.carisma +
        player.atributos.algoritmo +
        player.atributos.marketing +
        player.atributos.constancia +
        player.atributos.humor +
        player.atributos.creatividad;

    let score = skill;

    score += random(-10,15);

    // Tendencia

    if(gameState.world.trend){

        if(video.tema===gameState.world.trend){

            score+=18;

        }

    }

    // Calidad del equipo

    if(player.equipment.camera!=="old_phone"){

        score+=8;

    }

    if(player.equipment.microphone!=="earphones"){

        score+=6;

    }

    if(player.equipment.pc!=="government_pc"){

        score+=10;

    }

    // Formato

    switch(video.formato){

        case "Short":

            score+=4;
            break;

        case "Gameplay":

            score+=2;
            break;

        case "Reacción":

            score+=6;
            break;

        case "Challenge":

            score+=8;
            break;

        case "IRL":

            score+=10;
            break;

    }

    let views = random(80,220);

    if(score>70){

        views=random(300,900);

    }

    if(score>95){

        views=random(800,2500);

    }

    if(score>120){

        views=random(2500,9000);

    }

    if(score>150){

        views=random(9000,30000);

    }

    // Viralidad

    let viral=false;

    let viralChance=0.25;

    viralChance+=player.atributos.creatividad*0.02;

    viralChance+=player.atributos.algoritmo*0.015;

    if(chance(viralChance)){

        viral=true;

        views*=random(30,120);

    }

    const subs=Math.floor(

        views/random(18,35)

    );

    const money=Math.floor(

        views*0.018

    );

    player.suscriptores+=subs;

    player.vistasTotales+=views;

    player.dinero+=money;

    player.videosSubidos++;

    player.ingresosTrimestre+=money;

    if(views>player.stats.mejorVideo){

        player.stats.mejorVideo=views;

    }

    if(viral){

        player.stats.videosVirales++;

    }

    return{

        views,

        subs,

        money,

        viral

    };

}
