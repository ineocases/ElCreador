export function buildCreator(data){

    return{

        name:data.name,

        country:data.country,

        niche:data.niche,

        followers:Number(data.followers),

        team:data.team || "",

        verified:false,

        personality:{

            humor:50,

            competitiveness:50,

            controversy:50,

            collaboration:50

        },

        unlock:{

            subscribers:0,

            reputation:0

        },

        events:{

            react:20,

            collab:15,

            stream:15

        },

        createdAt:Date.now()

    };

}
