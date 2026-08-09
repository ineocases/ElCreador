export function updateShop(player){

    if(player.subscribers>=1000){

        player.shopTier=Math.max(player.shopTier,2);

    }

    if(player.subscribers>=10000){

        player.shopTier=Math.max(player.shopTier,3);

    }

    if(player.subscribers>=100000){

        player.shopTier=Math.max(player.shopTier,4);

    }

    if(player.subscribers>=1000000){

        player.shopTier=Math.max(player.shopTier,5);

    }

}
