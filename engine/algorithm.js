import {gameState} from './gameState.js';

export class Algorithm {
    static calculateVideoSuccess(videoIdea,timeSpent){
        const c=gameState.creator;
        const qualityScore=(c.editing*.3)+(c.creativity*.3)+(timeSpent*.4);
        const ctr=(videoIdea.clickbait*.4)+(c.seo*.4)+(c.hype*.2);
        const retention=(videoIdea.script*.4)+(c.charisma*.4)+(qualityScore*.2);
        const baseImpressions=c.subscribers*.1+100;
        let impressions=baseImpressions*(ctr/50);
        const viralChance=(c.hype+c.reputation)/200, roll=Math.random();
        let viralMultiplier=1;
        if(roll<viralChance*.1){viralMultiplier=10+Math.random()*40;c.viralVideos++}
        else if(roll<viralChance*.3) viralMultiplier=3+Math.random()*5;
        impressions*=viralMultiplier;
        const views=Math.floor(impressions*(retention/100));
        const likes=Math.floor(views*.05*(c.engagement/50));
        const comments=Math.floor(views*.01*(c.engagement/50));
        const hate=videoIdea.controversial?Math.floor(views*.02):0;
        const rpm=2+(c.reputation/50), revenue=Math.floor((views/1000)*rpm);
        return {views,likes,comments,hate,revenue,viral:viralMultiplier>5,qualityScore,retention};
    }
    static calculateSkillGain(timeSpent){
        const baseGain=1+Math.random()*2;
        return Math.floor(baseGain*(timeSpent/100));
    }
    static triggerRandomEvent(){
        const events=[
            {type:'sponsor',probability:.2,condition:()=>gameState.creator.subscribers>1000},
            {type:'hate',probability:.15,condition:()=>gameState.creator.reputation<40},
            {type:'collab',probability:.1,condition:()=>gameState.creator.subscribers>5000},
            {type:'burnout',probability:.2,condition:()=>gameState.creator.mentalHealth<30},
            {type:'trending',probability:.15,condition:()=>gameState.creator.hype<50}
        ];
        for(const event of events) if(event.condition()&&Math.random()<event.probability) return event.type;
        return null;
    }
}
