export default [

{
    id:1,

    title:"📈 Minecraft está explotando",

    description:"Los videos de Minecraft están funcionando muy bien este trimestre.",

    effect(player){

        player.creativity += 2;

    }

},

{

    id:2,

    title:"😴 Estás algo cansado",

    description:"Necesitás descansar un poco.",

    effect(player){

        player.burnout += 5;

    }

},

{

    id:3,

    title:"🎤 Un creador pequeño quiere colaborar",

    description:"Puede salir bien... o no.",

    effect(player){

        player.reputation += 1;

    }

}

];
