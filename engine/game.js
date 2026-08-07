let game = {

    player: null,

    currentScreen: "home",

    currentYear: 2026,

    currentQuarter: 1,

    notifications: [],

    news: [],

    videoChoices: [],

    world: {}

};

export function getGame(){

    return game;

}

export function setPlayer(player){

    game.player = player;

}

export function setVideoChoices(videos){

    game.videoChoices = videos;

}

export function getVideoChoices(){

    return game.videoChoices;

}

export function changeScreen(screen){

    game.currentScreen = screen;

}

export function resetGame(){

    game = {

        player:null,

        currentScreen:"home",

        currentYear:2026,

        currentQuarter:1,

        notifications:[],

        news:[],

        videoChoices:[],

        world:{}

    };

}
