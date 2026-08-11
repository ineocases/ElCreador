import sponsors from "../data/brands/sponsors.js";
import { random } from "./random.js";

export function rollSponsor(player){

    const available = sponsors.filter(s=>player.subscribers>=s.minSubs);

    if(!available.length) return null;

    return available[random(0,available.length-1)];

}
