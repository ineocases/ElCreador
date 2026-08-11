export default function AdminCreatorForm(){

return `

<section class="screen fade">

<div class="card">

<h1>Nuevo Creador</h1>

<input id="creatorName" placeholder="Nombre">

<select id="creatorCountry">

<option>Argentina</option>

<option>España</option>

<option>México</option>

<option>Uruguay</option>

<option>Chile</option>

</select>

<select id="creatorNiche">

<option>Gaming</option>

<option>Fútbol</option>

<option>Streaming</option>

<option>Tecnología</option>

<option>Vlogs</option>

<option>Música</option>

</select>

<input
id="creatorFollowers"
type="number"
placeholder="Seguidores">

<input
id="creatorTeam"
placeholder="Equipo (si aplica)">

<label>

<input
type="checkbox"
id="creatorVerified">

Verificado

</label>

<button id="saveCreator">

Guardar

</button>

</div>

</section>

`;

}
