import admin from "../data/admin.js";

export function addCreator(creator){

    admin.creators.push(creator);

}

export function addSponsor(sponsor){

    admin.sponsors.push(sponsor);

}

export function addEvent(event){

    admin.events.push(event);

}

export function addTrend(trend){

    admin.trends.push(trend);

}
