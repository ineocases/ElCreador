import { createCreator } from "../firebase/creators.js";

import { buildCreator } from "./creatorFactory.js";

export async function saveCreator(){

    const creator = buildCreator({

        name:document.getElementById("creatorName").value,

        country:document.getElementById("creatorCountry").value,

        niche:document.getElementById("creatorNiche").value,

        followers:document.getElementById("creatorFollowers").value,

        team:document.getElementById("creatorTeam").value

    });

    creator.verified=document.getElementById("creatorVerified").checked;

    await createCreator(creator);

    alert("Creador guardado.");

}
