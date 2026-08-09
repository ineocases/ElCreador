import items from "../data/items/items.js";

export function getShop(player){

    return items.filter(item=>{

        if(item.owned) return false;

        if(player.inventory.includes(item.id)) return false;

        return item.tier<=player.shopTier;

    });

}

export function buyItem(player,id){

    const item=items.find(i=>i.id===id);

    if(!item) return false;

    if(player.money<item.price) return false;

    player.money-=item.price;

    player.inventory.push(item.id);

    return true;

}
