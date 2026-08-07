export default function CreatorCard(c){

return`

<div class="creatorCard">

<h2>

${c.name}

${c.verified ? "✔️" : ""}

</h2>

<p>

${c.country}

</p>

<p>

${c.niche}

</p>

<p>

👥 ${c.followers.toLocaleString()}

</p>

<button
class="editCreator"
data-id="${c.id}">

Editar

</button>

<button
class="deleteCreator"
data-id="${c.id}">

Eliminar

</button>

</div>

`;

}
