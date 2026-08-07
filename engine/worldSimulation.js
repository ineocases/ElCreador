import creators from "../data/creators/argentina.js";
import { randomInt } from "./random.js";

export function simulateWorld(game){

    const worldEvents = [];

    creators.forEach(creator=>{

        // cantidad de videos que subió esta temporada

        const videos = randomInt(10,80);

        // vistas aproximadas

        const totalViews = videos * randomInt(
            creator.minViews,
            creator.maxViews
        );

        // posibilidad de hacerse viral

        const viral = Math.random() < creator.viralChance;

        if(viral){

            worldEvents.push({

                type:"viral",

                creator:creator.name,

                text:`🔥 ${creator.name} rompió internet con un video viral.`

            });

        }

        // sponsor

        if(Math.random()<creator.sponsorChance){

            worldEvents.push({

                type:"sponsor",

                creator:creator.name,

                text:`💼 ${creator.name} consiguió un nuevo sponsor.`

            });

        }

        // polémica

        if(Math.random()<creator.dramaChance){

            worldEvents.push({

                type:"drama",

                creator:creator.name,

                text:`⚠️ ${creator.name} quedó envuelto en una polémica.`

            });

        }

        creator.totalViews += totalViews;

        creator.videos += videos;

    });

    return worldEvents;

}
