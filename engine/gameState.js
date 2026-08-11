export class GameState {
    constructor() {
        this.creator = {
            name:'', age:18, niche:'', platform:'',
            charisma:30, editing:30, seo:30, creativity:30,
            energy:100, mentalHealth:100, inspiration:100,
            subscribers:0, hype:0, reputation:50, engagement:50,
            money:0, monthlyIncome:0, week:1, year:2026,
            videosPublished:0, viralVideos:0, totalViews:0
        };
        this.currentEvent=null; this.gameOver=false;
    }
    updateStats(changes){
        for(const stat in changes){
            if(Object.prototype.hasOwnProperty.call(this.creator,stat)){
                this.creator[stat]+=changes[stat];
                if(['charisma','editing','seo','creativity','energy','mentalHealth','inspiration','reputation','engagement'].includes(stat))
                    this.creator[stat]=Math.max(0,Math.min(100,this.creator[stat]));
            }
        }
    }
    addSubscribers(amount){this.creator.subscribers=Math.max(0,this.creator.subscribers+amount);this.creator.totalViews+=Math.max(0,amount)*10}
    addMoney(amount){this.creator.money+=amount}
    advanceWeek(){
        this.creator.week++;
        if(this.creator.week>52){this.creator.week=1;this.creator.year++;this.creator.age++}
        this.creator.energy=Math.min(100,this.creator.energy+10);
        this.creator.inspiration=Math.min(100,this.creator.inspiration+5);
        this.creator.hype=Math.max(0,this.creator.hype-5);
    }
    save(){localStorage.setItem('theCreatorGameState',JSON.stringify(this.creator))}
    load(){
        const saved=localStorage.getItem('theCreatorGameState');
        if(saved){this.creator=JSON.parse(saved);return true}
        return false;
    }
    reset(){localStorage.removeItem('theCreatorGameState');this.constructor()}
}
export const gameState=new GameState();
