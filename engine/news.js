export function addNews(game,news){

    game.news.unshift({

        id:Date.now(),

        ...news

    });

}

export function getNews(game){

    return game.news;

}
