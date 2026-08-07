import items from "../data/items/items.js";

export default function Store(player){

let html="";

items.forEach(item=>{

if(item.tier>player.shopTier) return;

if(player.inventory.includes(item.id)) return;

html+=`

<div class="shopCard">

<div class="shopIcon">

${item.icon}

</div>

<h2>

${item.name}

</h2>

<p>

$${item.price.toLocaleString()}

</p>

<button

class="buyItem"

data-id="${item.id}">

Comprar

</button>

</div>

`;

});

return`

<section class="screen fade">

<h1>

🛒 Tienda

</h1>

<div class="shopGrid">

${html}

</div>

</section>

`;

}
