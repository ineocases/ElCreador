import items from "../data/items/items.js";

export function getPlayerStats(player){

    const stats={

quality:0,

audio:0,

editing:0,

render:0

};

    Object.values(player.equipment).forEach(id=>{

        if(!id) return;

        const item=items.find(i=>i.id===id);

        if(!item) return;

        if(item.stats){

            Object.keys(item.stats).forEach(stat=>{

                stats[stat]=(stats[stat]||0)+item.stats[stat];

            });

        }

    });

    stats.charisma=player.skills.charisma;

    stats.humor=player.skills.humor;

    stats.marketing=player.skills.marketing;

    stats.networking=player.skills.networking;

    stats.creativity=player.skills.creativity;

    return stats;

}
