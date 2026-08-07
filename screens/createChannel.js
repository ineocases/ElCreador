export default function CreateChannel() {
    return `
    <section class="screen fade">

        <div class="card">

            <h1 class="logo">
                Crear Canal
            </h1>

            <p class="subtitle">
                Comienza tu carrera como creador.
            </p>

            <div class="form">

                <label>Nombre del canal</label>
                <input id="channelName" placeholder="Ej: ErosPlay">

                <label>Edad</label>
                <input id="age" type="number" min="13" max="18" value="16">

                <label>País</label>
                <select id="country">
                    <option>Argentina</option>
                    <option>España</option>
                    <option>México</option>
                    <option>Chile</option>
                    <option>Uruguay</option>
                </select>

                <label>Nicho</label>
                <select id="niche">
                    <option>Gaming</option>
                    <option>Fútbol</option>
                    <option>Tecnología</option>
                    <option>Humor</option>
                    <option>Música</option>
                    <option>Vlogs</option>
                </select>

            </div>

            <button id="startCareer">
                Comenzar Carrera
            </button>

        </div>

    </section>
    `;
}
