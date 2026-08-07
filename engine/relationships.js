import creators from "../data/creators/argentina.js";

export function initializeRelationships(player){

    creators.forEach(c=>{

        if(player.relationships[c.id]===undefined){

            player.relationships[c.id]=0;

        }

    });

}

export function changeRelationship(player,id,value){

    if(player.relationships[id]===undefined){

        player.relationships[id]=0;

    }

    player.relationships[id]+=value;

    if(player.relationships[id]>100)
        player.relationships[id]=100;

    if(player.relationships[id]<-100)
        player.relationships[id]=-100;

}

export function getRelationship(player,id){

    return player.relationships[id] || 0;

}
