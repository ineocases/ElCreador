export default function Timeline(player){

    let html="";

    player.timeline.forEach(event=>{

        html+=`

        <div class="timelineCard">

            <div class="timelineIcon">

                ${event.icon}

            </div>

            <div>

                <h3>${event.title}</h3>

                <small>

                    ${event.year} · T${event.quarter}

                </small>

                <p>

                    ${event.description}

                </p>

            </div>

        </div>

        `;

    });

    return`

    <section class="screen fade">

        <div class="card">

            <h1 class="logo">

                Mi Carrera

            </h1>

            ${html}

        </div>

    </section>

    `;

}
