import {gameState} from './gameState.js';

export class EventSystem {
    static events={
        sponsor:{title:"💼 Oferta de Patrocinio",description:"Una marca de bebidas energéticas te contacta. Te ofrecen $500 por mencionar su producto en tu próximo video, pero tiene mala reputación.",options:[
            {text:"Aceptar el patrocinio",effects:{money:500,reputation:-15,mentalHealth:-10},message:"Ganaste dinero fácil, pero tu audiencia nota que no es auténtico."},
            {text:"Rechazar la oferta",effects:{reputation:10,engagement:5},message:"Tu audiencia valora tu integridad."},
            {text:"Negociar mejores términos",effects:{money:300,reputation:5,seo:2},message:"Lograste un acuerdo más favorable."}]},
        hate:{title:"🔥 Ola de Hate",description:"Un video antiguo resurge y la gente te está criticando masivamente en Twitter.",options:[
            {text:"Hacer video disculpa",effects:{reputation:10,mentalHealth:-20,engagement:5},message:"La disculpa fue bien recibida, pero fue emocionalmente agotador."},
            {text:"Ignorar y seguir adelante",effects:{subscribers:-100,mentalHealth:-5},message:"Perdiste algunos seguidores, pero mantuviste tu paz mental."},
            {text:"Responder con más drama",effects:{hype:30,reputation:-20,subscribers:200},message:"Generaste más atención, pero a costa de tu reputación."}]},
        collab:{title:"🤝 Oportunidad de Colaboración",description:"Un creador más grande que tú te invita a colaborar en un video.",options:[
            {text:"Aceptar la colaboración",effects:{subscribers:500,hype:20,charisma:3,energy:-30},message:"La colaboración fue un éxito y ganaste mucha exposición."},
            {text:"Pedir pago por la colaboración",effects:{money:300,reputation:-5},message:"Ganaste dinero, pero algunos te ven como interesado."},
            {text:"Rechazar (no es tu estilo)",effects:{reputation:5,creativity:2},message:"Mantuviste tu autenticidad."}]},
        burnout:{title:"😰 Crisis de Burnout",description:"Llevas semanas sin descansar. Tu cuerpo y mente están al límite.",options:[
            {text:"Tomar una semana de descanso",effects:{mentalHealth:40,energy:50,inspiration:30,subscribers:-50},message:"El descanso te renovó, aunque perdiste algunos seguidores."},
            {text:"Seguir trabajando (riesgoso)",effects:{mentalHealth:-30,energy:-20,charisma:-5},message:"Tu calidad de contenido bajó notablemente."},
            {text:"Reducir carga de trabajo",effects:{mentalHealth:20,energy:20,seo:-3},message:"Encontraste un mejor equilibrio."}]},
        trending:{title:"📈 Tema en Tendencia",description:"Hay un tema viral en tu nicho. Puedes hacer contenido sobre esto.",options:[
            {text:"Subirte a la tendencia rápido",effects:{hype:40,subscribers:300,creativity:-5},message:"El video tuvo buen rendimiento por la tendencia."},
            {text:"Hacer análisis profundo del tema",effects:{reputation:15,subscribers:150,charisma:3,energy:-40},message:"Tu análisis fue muy valorado por la comunidad."},
            {text:"Ignorar la tendencia",effects:{creativity:5,reputation:3},message:"Mantuviste tu línea editorial original."}]}
    };
    static getEvent(type){return this.events[type]}
    static applyEventEffects(option){
        const messages=[];
        for(const stat in option.effects){
            const value=option.effects[stat];
            if(stat==='money'){gameState.addMoney(value);messages.push(`Dinero: ${value>0?'+':''}$${value}`)}
            else if(stat==='subscribers'){gameState.addSubscribers(value);messages.push(`Suscriptores: ${value>0?'+':''}${value}`)}
            else {gameState.updateStats({[stat]:value});messages.push(`${stat}: ${value>0?'+':''}${value}`)}
        }
        return messages;
    }
}
